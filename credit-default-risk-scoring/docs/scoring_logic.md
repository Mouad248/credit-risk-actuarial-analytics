# Scoring logic

The implemented display score is `round(100 * predicted_default_probability)`, using NumPy rounding. Inputs must be finite and within [0,1]. This is a linear presentation scale, not a traditional credit scorecard.

| Rounded score | Display band |
|---|---|
| 0-30 | Low |
| 31-60 | Medium |
| 61-100 | High |

For example, probability 0.42 becomes score 42 and band Medium. Values near a boundary follow the rounded score, not a separate probability cutoff. These fixed bands are not learned quantiles and do not imply any particular fraction of customers belongs to a band.

A trained classifier estimates probabilities; calibration adjusts those estimates using separate validation data. The synthetic demo records both pre/post-calibration results. Better Brier error can coexist with much lower recall at threshold 0.5. Any decision threshold would need its own validation, error-cost assumptions and population checks. This archive provides no validated approval/decline policy.

The implementation is in `src/models/calibrate.py`. Full real-data calibration, fairness, production thresholding and cross-population reliability remain unverified.
