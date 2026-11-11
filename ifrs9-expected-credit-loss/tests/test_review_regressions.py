"""Independent checks for recovered-project correctness defects."""
import math
from statistics import NormalDist

import pytest

from ecl_engine_phase1 import Loan, twelve_month_ecl
from ecl_engine_phase2 import LoanPhase2, build_pd_term_structure, lifetime_ecl
from ecl_engine_phase3 import Stage, StagedLoan, classify_stage, compute_portfolio_ecl
from ecl_engine_phase4 import MacroScenario, compute_weighted_ecl
from macro_pd import vasicek_conditional_pd


def test_long_curve_preserves_hazard_and_probability_mass():
    curve = build_pd_term_structure("B", 25, "europe")
    assert len(curve) == 25
    assert curve[-1]["extrapolated"]
    assert curve[-1]["marginal_pd"] == pytest.approx(curve[9]["marginal_pd"])
    assert sum(r["forward_pd"] for r in curve) + curve[-1]["survival"] == pytest.approx(1)
    result = lifetime_ecl(LoanPhase2("Exposure 001", 1e6, "B", .45, .04, 25))
    assert math.isfinite(result["ecl_lifetime"])


@pytest.mark.parametrize("changes", [{"lgd": -0.1}, {"ead": float("nan")}, {"eir": -1}])
def test_invalid_inputs_are_rejected(changes):
    values = dict(name="Exposure 001", ead=1e6, rating="BBB", lgd=.45, eir=.04)
    values.update(changes)
    with pytest.raises(ValueError):
        twelve_month_ecl(Loan(**values))


def test_defaulted_exposure_does_not_reuse_a_performing_rating_pd():
    loan = StagedLoan("Exposure 001", 1e6, "BB", "D", .6, .05, 5)
    result = compute_portfolio_ecl([loan])["loans"][0]
    assert result["ecl_applied"] == pytest.approx(round(1e6 * .6 / 1.05, 2))
    assert result["measurement"] == "defaulted_one_year_loss_proxy"


def test_negative_scenario_weight_rejected_even_if_sum_is_one():
    scenarios = [MacroScenario("Baseline", 1.2, "", 0), MacroScenario("Adverse", -.2, "", 2)]
    with pytest.raises(ValueError):
        compute_weighted_ecl([], scenarios)


def test_standard_vasicek_matches_independent_normal_distribution():
    normal = NormalDist()
    pd, rho, factor = .013, .2, -1.5
    expected = normal.cdf((normal.inv_cdf(pd) - math.sqrt(rho) * factor) / math.sqrt(1-rho))
    assert vasicek_conditional_pd(pd, factor, rho) == pytest.approx(expected, abs=1e-9)
    assert vasicek_conditional_pd(pd, 0, rho) != pytest.approx(pd)


def test_teaching_exemption_does_not_override_past_due_or_watchlist():
    overdue = StagedLoan("Exposure 001", 1e6, "A", "A", .45, .04, 5, days_past_due=35)
    watchlist = StagedLoan("Exposure 002", 1e6, "A", "A", .45, .04, 5, qualitative_flags=["watchlist"])
    assert classify_stage(overdue).stage == Stage.STAGE_2
    assert classify_stage(watchlist).stage == Stage.STAGE_2


def test_portfolio_total_reconciles_to_visible_loan_amounts():
    loans = [StagedLoan("Exposure 001", 800000, "BB", "D", .65, .06, 3),
             StagedLoan("Exposure 002", 2500000, "BB", "D", .65, .055, 5)]
    result = compute_portfolio_ecl(loans)
    assert result["totals"]["total_ecl"] == round(sum(r["ecl_applied"] for r in result["loans"]), 2)
