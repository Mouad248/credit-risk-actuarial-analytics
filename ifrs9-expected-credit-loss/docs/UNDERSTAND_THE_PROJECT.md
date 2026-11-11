# Credit-loss methodology

## Purpose and walkthrough

The question is how assumed changes in credit risk change loss allowances on a synthetic loan book. This is a transparent simulation, not a model trained on bank customers.

1. `ecl_engine_phase1.py`: rating lookup supplies one-year PD; discount an assumed one-year expected loss.
2. `ecl_engine_phase2.py`: derive annual default increments from cumulative PDs, build the balance schedule, and sum discounted expected losses.
3. `ecl_engine_phase3.py`: apply the illustrative staging policy. Stage 1 selects one-year ECL; Stage 2 selects lifetime ECL. Stage 3 has a separate defaulted-loss proxy.
4. `ecl_engine_phase4.py`: stress ratings/LGD, rerun calculations and weight scenario results.
5. `macro_pd.py`: compare standard one-factor conditional PD with an illustrative anchored-probit sensitivity. The latter maps a representative stressed PD to a nearest rating notch.

## Equations

Let C(t) be cumulative default probability and S(t)=1-C(t).

- Unconditional increment q(t)=C(t)-C(t-1).
- Conditional hazard h(t)=q(t)/S(t-1).
- Hence q(t)=h(t)×S(t-1). Do not apply survival twice.
- Lifetime ECL = sum of q(t)×LGD×EAD(t)/(1+EIR)^t.
- Weighted ECL = sum of scenario probability × scenario ECL.
- Stage 3 teaching proxy = exposure×LGD/(1+EIR), assuming default has occurred and loss is realised in one year.

The code calls q `forward_pd` and h `marginal_pd`. Terminology varies; define quantities explicitly. Beyond the observed curve, the corrected engine holds the last conditional hazard constant and continues updating survival.

For Stage 3, use `ecl_applied` and its `measurement` label. The retained `ecl_12m`/`ecl_lifetime` fields are performing-rating curve comparison values, not the defaulted exposure's applied allowance.

## Two different macro models

Standard asset model:

`PD(z)=Phi((Phi^-1(PD_ttc)-sqrt(rho)*z)/sqrt(1-rho))`.

At z=0 this generally differs from TTC PD. Averaging over a standard-normal factor recovers unconditional PD. See the [Basel explanatory note](https://www.bis.org/bcbs/irbriskweight.pdf).

Illustrative anchored sensitivity:

`PD_anchor(z)=Phi(Phi^-1(PD_anchor)-sqrt(rho/(1-rho))*z)`.

This preserves its chosen baseline at z=0. It is a separate modelling choice with hand-set macro coefficients, not an equivalent rearrangement or an institutionally estimated model. Probit and logistic links are not interchangeable. The bridge supplies rating shifts, not continuous PIT curves to ECL.
