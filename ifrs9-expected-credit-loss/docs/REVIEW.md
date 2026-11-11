# Recovery review — 2026-11-09

The project contains a calculation core, dashboard, historical workbooks and presentation. Its current scope is an educational simulation.

## Implemented recovery

- Neutral borrower IDs in source and Office XML; cleared personal Office properties.
- Corrected long-maturity hazard extrapolation/survival and added extrapolation flags.
- Rejected invalid exposure/LGD/rate inputs and negative/non-finite scenario weights.
- Replaced performing-rating PD on Stage 3 with an explicit PD=1, discounted-one-year-loss proxy. The old numerical headline is superseded.
- Separated standard Vasicek probability/inverse from the original anchored-probit bridge.
- Strengthened an original staging test that reused identical names without comparing applied ECL.
- Prevented the illustrative low-risk exemption from overriding past-due/watchlist triggers; reconciled monetary totals to displayed loan amounts.
- Added regression checks, regenerated figures, and exported current Python results as JSON/Excel.

## Evidence categories

**Verified in source:** modules, rules, embedded anchors, interface, historical Office files.

**Verified by execution:** only checks in `verification.json`; regenerated outputs use the current engine.

**Documented, unverified:** original source transcriptions, historical spreadsheet arithmetic, presentation methodology and archive authorship.

**Proposed:** estimated borrower PD/LGD, recovery cash flows, directly integrated PIT curves.

**Unknown:** institutional use and real-world impact; neither is claimed.

Staging thresholds, low-credit-risk exemption and scenario-specific restaging remain teaching policies. Historical workbooks/deck are not reconciled to current Python. MIT notices and public research attribution remain; they are distinct from private borrower identities. Do not publish the project's ignored `.private/backups/` folder.
