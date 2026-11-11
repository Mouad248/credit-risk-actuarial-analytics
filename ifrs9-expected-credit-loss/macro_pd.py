"""Two distinct macro-PD teaching models.

The standard one-factor asset model is implemented by vasicek_conditional_pd
and inverted by implied_systematic_factor. Its conditional PD at factor zero
is generally different from the unconditional TTC PD.

The archived scenario-to-rating bridge uses anchored_probit_pd instead. This
illustrative sensitivity preserves PD at factor zero; its macro coefficients
are hand-set, not estimated from default histories. It is not an equivalent
rearrangement of the standard Vasicek/ASRF conditional probability formula.

The bridge converts a representative rating's stressed PD to a nearest rating
notch and applies it through Phase 4. It does not directly integrate a PIT PD
term structure into the ECL engine. Neither model establishes IFRS compliance.
Reference: https://www.bis.org/bcbs/irbriskweight.pdf
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Optional

from ecl_engine_phase1 import SP_1Y_PD, SP_1Y_PD_EUROPE


# ---------------------------------------------------------------------------
# Normal CDF and inverse CDF (no scipy)
# ---------------------------------------------------------------------------
def norm_cdf(x: float) -> float:
    """Standard normal CDF Phi(x) via the error function (exact to ~1e-16)."""
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


# Acklam's algorithm coefficients for the inverse standard normal CDF.
_A = (-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
      1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00)
_B = (-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
      6.680131188771972e+01, -1.328068155288572e+01)
_C = (-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
      -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00)
_D = (7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
      3.754408661907416e+00)


def norm_ppf(p: float) -> float:
    """Inverse standard normal CDF Phi^{-1}(p), Acklam approximation.

    Valid on the open interval (0, 1); abs error < 1.2e-9.
    """
    if not 0.0 < p < 1.0:
        if p == 0.0:
            return -math.inf
        if p == 1.0:
            return math.inf
        raise ValueError(f"p must be in (0, 1), got {p}")

    p_low, p_high = 0.02425, 1 - 0.02425
    if p < p_low:
        q = math.sqrt(-2.0 * math.log(p))
        return (((((_C[0] * q + _C[1]) * q + _C[2]) * q + _C[3]) * q + _C[4]) * q + _C[5]) / \
               ((((_D[0] * q + _D[1]) * q + _D[2]) * q + _D[3]) * q + 1.0)
    if p <= p_high:
        q = p - 0.5
        r = q * q
        return (((((_A[0] * r + _A[1]) * r + _A[2]) * r + _A[3]) * r + _A[4]) * r + _A[5]) * q / \
               (((((_B[0] * r + _B[1]) * r + _B[2]) * r + _B[3]) * r + _B[4]) * r + 1.0)
    q = math.sqrt(-2.0 * math.log(1.0 - p))
    return -(((((_C[0] * q + _C[1]) * q + _C[2]) * q + _C[3]) * q + _C[4]) * q + _C[5]) / \
            ((((_D[0] * q + _D[1]) * q + _D[2]) * q + _D[3]) * q + 1.0)


# ---------------------------------------------------------------------------
# Asset correlation (Basel IRB corporate formula)
# ---------------------------------------------------------------------------
def basel_corporate_correlation(pd: float) -> float:
    """Basel IRB asset correlation for a corporate exposure (CRR Art. 153).

        rho = 0.12 * w + 0.24 * (1 - w),   w = (1 - e^{-50 PD}) / (1 - e^{-50})

    Ranges from 0.24 for the highest-quality names (PD -> 0) down to 0.12 for
    the weakest (PD -> 1): low-PD obligors are more sensitive to the systematic
    factor. SME / large-financial adjustments are omitted.
    """
    pd = min(max(pd, 1e-8), 0.9999)
    w = (1.0 - math.exp(-50.0 * pd)) / (1.0 - math.exp(-50.0))
    return 0.12 * w + 0.24 * (1.0 - w)


# ---------------------------------------------------------------------------
# Vasicek conditional PD and its inverse
# ---------------------------------------------------------------------------
def anchored_probit_pd(pd_ttc: float, z: float, rho: Optional[float] = None) -> float:
    """Illustrative baseline-anchored probit sensitivity, separate from Vasicek.

    Phi(Phi^-1(anchor_PD) - sqrt(rho/(1-rho))*z). A hand-set baseline
    anchor is preserved at z=0; this is a modelling choice, not a universal
    IFRS 9 or Basel formula. No macro/default calibration is claimed.
    """
    if not 0 <= pd_ttc <= 1 or not math.isfinite(z):
        raise ValueError("Require PD in [0, 1] and a finite systematic factor")
    if rho is not None and not 0 < rho < 1:
        raise ValueError("rho must be strictly between zero and one")
    if pd_ttc <= 0.0:
        return 0.0
    if pd_ttc >= 1.0:
        return 1.0
    if rho is None:
        rho = basel_corporate_correlation(pd_ttc)
    c = norm_ppf(pd_ttc)
    loading = math.sqrt(rho / (1.0 - rho))
    return norm_cdf(c - loading * z)


def implied_anchored_factor(observed_dr: float, pd_ttc: float,
                              rho: Optional[float] = None) -> float:
    """Back out the systematic factor z from an observed annual default rate.

    The inverse of `vasicek_conditional_pd`:

        z = (Phi^{-1}(PD_ttc) - Phi^{-1}(DR)) / sqrt(rho / (1 - rho))

    Apply this to each historical year's realised default rate to obtain a
    time series of z, then regress on macro variables to estimate the bridge
    coefficients used in `systematic_factor_from_macro`.
    """
    if rho is None:
        rho = basel_corporate_correlation(pd_ttc)
    loading = math.sqrt(rho / (1.0 - rho))
    return (norm_ppf(pd_ttc) - norm_ppf(observed_dr)) / loading


def vasicek_conditional_pd(pd_ttc: float, z: float, rho: Optional[float] = None) -> float:
    """Conditional default probability from the standard one-factor asset model.

    PD(z) = Phi((Phi^-1(PD_ttc) - sqrt(rho)*z) / sqrt(1-rho)).
    Integrating over a standard-normal factor recovers the unconditional PD;
    setting z to zero generally does not. This is separate from the anchored
    probit sensitivity used by the illustrative rating-shift bridge.
    """
    if not 0 <= pd_ttc <= 1 or not math.isfinite(z):
        raise ValueError("Require PD in [0, 1] and a finite systematic factor")
    if rho is None:
        rho = basel_corporate_correlation(pd_ttc)
    if not 0 < rho < 1:
        raise ValueError("rho must be strictly between zero and one")
    if pd_ttc in (0.0, 1.0):
        return pd_ttc
    return norm_cdf((norm_ppf(pd_ttc) - math.sqrt(rho) * z) / math.sqrt(1 - rho))


def implied_systematic_factor(observed_dr: float, pd_ttc: float,
                              rho: Optional[float] = None) -> float:
    """Invert the standard one-factor conditional PD; both PDs must be interior."""
    if not 0 < observed_dr < 1 or not 0 < pd_ttc < 1:
        raise ValueError("Default rates must be strictly between zero and one")
    if rho is None:
        rho = basel_corporate_correlation(pd_ttc)
    if not 0 < rho < 1:
        raise ValueError("rho must be strictly between zero and one")
    return (norm_ppf(pd_ttc) - math.sqrt(1 - rho) * norm_ppf(observed_dr)) / math.sqrt(rho)


# ---------------------------------------------------------------------------
# Macro -> systematic factor bridge
# ---------------------------------------------------------------------------
@dataclass
class MacroSensitivities:
    """Linear macro-to-z coefficients.

    z = gdp_beta * gdp_dev_pct + unemp_beta * unemp_dev_pp

    where the inputs are *deviations from the baseline scenario* (the baseline
    is the z = 0 anchor). Defaults are calibrated so the EBA 2025 adverse
    deviation (cumulative GDP -10.4% vs baseline, unemployment +6.1pp) maps to
    z ≈ -2.0, a ~1-in-44 systematic shock. Replace with regression estimates
    (see module docstring) for production use.
    """
    gdp_beta: float = 0.115     # per +1% GDP deviation -> +0.115 z
    unemp_beta: float = -0.131  # per +1pp unemployment -> -0.131 z


def systematic_factor_from_macro(gdp_dev_pct: float, unemp_dev_pp: float,
                                 sens: Optional[MacroSensitivities] = None) -> float:
    """Map macro *deviations from baseline* to a systematic-factor realisation z.

    ``gdp_dev_pct`` is the cumulative real-GDP deviation from baseline in %
    (negative in a recession); ``unemp_dev_pp`` is the unemployment deviation
    from baseline in percentage points (positive in a recession). A baseline
    scenario (both zero) maps to z = 0 and leaves PD at its TTC anchor.
    """
    sens = sens or MacroSensitivities()
    return sens.gdp_beta * gdp_dev_pct + sens.unemp_beta * unemp_dev_pp


# ---------------------------------------------------------------------------
# Bridge to the rating-driven engine: derive the implied notch shift
# ---------------------------------------------------------------------------
def _pd_table(region: str) -> dict:
    return SP_1Y_PD_EUROPE if region == "europe" else SP_1Y_PD


def stressed_1y_pd(rating: str, z: float, region: str = "global") -> float:
    """1-year conditional PD for a rating under systematic factor z."""
    table = _pd_table(region)
    if rating not in table:
        raise ValueError(f"rating {rating!r} not in {region} PD table")
    return anchored_probit_pd(table[rating], z)


def implied_notch_shift(rating: str, z: float, region: str = "global") -> int:
    """Notch shift that reproduces the anchored-probit-stressed PD on the rating scale.

    Stresses the rating's 1Y PD to its conditional value under z, then finds
    the rating grade whose unconditional PD is closest (in log space, since PDs
    span several orders of magnitude). Returns the signed notch distance
    (positive = downgrade). This converts the macro factor into the
    notch_shift the Phase 4 engine already consumes — so the shift is now a
    model output, not an assertion.
    """
    table = _pd_table(region)
    grades = list(table.keys())
    if rating not in table:
        raise ValueError(f"rating {rating!r} not in {region} PD table")

    target = stressed_1y_pd(rating, z, region)
    if target <= 0:
        return 0

    def logpd(g: str) -> float:
        return math.log(max(table[g], 1e-8))

    target_log = math.log(max(target, 1e-8))
    nearest = min(grades, key=lambda g: abs(logpd(g) - target_log))
    return grades.index(nearest) - grades.index(rating)


def calibrate_scenarios(scenarios, baseline_name: str = "Baseline",
                        representative_rating: str = "BBB",
                        region: str = "global",
                        sens: Optional[MacroSensitivities] = None) -> list:
    """Derive anchored-probit notch shifts for a list of Phase 4 MacroScenarios.

    Macro deviations are measured *relative to the baseline scenario*:
      gdp_dev   = sum(scenario GDP growth) - sum(baseline GDP growth)
      unemp_dev = scenario terminal unemployment - baseline terminal unemployment

    Each scenario's ``notch_shift`` is overwritten with the model-derived value
    and a diagnostic row is returned, so you can show the asserted-vs-derived
    comparison. The baseline maps to z = 0 (no shift) by construction.
    """
    baseline = next((s for s in scenarios if s.name == baseline_name), scenarios[0])
    base_gdp = sum(baseline.gdp_growth) if baseline.gdp_growth else 0.0
    base_unemp = baseline.unemployment[-1] if baseline.unemployment else 0.0

    diagnostics = []
    for s in scenarios:
        gdp_dev = (sum(s.gdp_growth) if s.gdp_growth else 0.0) - base_gdp
        unemp_dev = (s.unemployment[-1] if s.unemployment else 0.0) - base_unemp
        z = systematic_factor_from_macro(gdp_dev, unemp_dev, sens)
        derived = implied_notch_shift(representative_rating, z, region)
        asserted = s.notch_shift
        s.notch_shift = derived
        diagnostics.append({
            "scenario": s.name,
            "gdp_dev_pct": round(gdp_dev, 2),
            "unemp_dev_pp": round(unemp_dev, 2),
            "systematic_factor_z": round(z, 4),
            "asserted_notch_shift": asserted,
            "anchored_notch_shift": derived,
        })
    return diagnostics


# ---------------------------------------------------------------------------
# CLI demonstration
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("=" * 70)
    print("  Vasicek / ASRF forward-looking PD — demonstration")
    print("=" * 70)

    print("\n1) Conditional PD vs systematic factor z (BBB, global TTC PD 0.13%)")
    pd_ttc = SP_1Y_PD["BBB"]
    rho = basel_corporate_correlation(pd_ttc)
    print(f"   asset correlation rho(BBB) = {rho:.4f}")
    print(f"   {'z':>6} {'interpretation':<24} {'PD(z)':>9}")
    for z, label in [(2.0, "strong expansion"), (1.0, "mild upside"),
                     (0.0, "through-the-cycle"), (-1.0, "mild stress"),
                     (-2.0, "EBA-adverse-like"), (-3.0, "severe (1-in-740)")]:
        print(f"   {z:>6.1f} {label:<24} {vasicek_conditional_pd(pd_ttc, z):>8.3%}")

    print("\n2) Inverse Vasicek — back out z from a realised default rate")
    print("   2009 global speculative-grade DR ≈ 9.9%; TTC spec-grade PD ≈ 3.8%")
    z09 = implied_systematic_factor(0.099, 0.038)
    print(f"   implied systematic factor z(2009) = {z09:.2f}  (a severe bad year)")

    print("\n3) Macro -> z -> implied notch shift (EBA 2025 adverse)")
    print("   Deviations from baseline: GDP -10.4%, unemployment +6.1pp")
    z_adv = systematic_factor_from_macro(gdp_dev_pct=-10.4, unemp_dev_pp=6.1)
    print(f"   => systematic factor z = {z_adv:.2f}")
    for r in ["A", "BBB", "BB", "B"]:
        ns = implied_notch_shift(r, z_adv, region="global")
        pit = stressed_1y_pd(r, z_adv, region="global")
        ttc = SP_1Y_PD[r]
        print(f"   {r:<5} TTC PD {ttc:>7.3%} -> PIT PD {pit:>7.3%}  "
              f"=> implied shift {ns:+d} notches")

    print("\n4) Asserted vs anchored-probit notch shift on the Phase 4 scenarios")
    try:
        from ecl_engine_phase4 import build_scenarios
        scenarios = build_scenarios()
        diags = calibrate_scenarios(scenarios, representative_rating="BBB",
                                    region="global")
        print(f"   {'scenario':<10} {'GDP dev':>9} {'unemp dev':>10} "
              f"{'z':>7} {'asserted':>9} {'Anchored':>8}")
        for d in diags:
            print(f"   {d['scenario']:<10} {d['gdp_dev_pct']:>8.1f}% "
                  f"{d['unemp_dev_pp']:>9.1f}pp {d['systematic_factor_z']:>7.2f} "
                  f"{d['asserted_notch_shift']:>+9d} {d['anchored_notch_shift']:>+8d}")
        print("\n   The anchored-probit bridge produces illustrative shifts as a")
        print("   model output driven by the macro paths — the soft spot is closed.")
    except Exception as e:  # noqa: BLE001
        print(f"   (skipped scenario comparison: {e})")
