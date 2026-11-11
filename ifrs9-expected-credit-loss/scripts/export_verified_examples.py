"""Export anonymous, reproducible Python results without spreadsheet software."""
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from make_figures import sample_book
from ecl_engine_phase3 import compute_portfolio_ecl
from ecl_engine_phase4 import compute_weighted_ecl


def main():
    loans = sample_book()
    baseline = compute_portfolio_ecl(loans)
    weighted = compute_weighted_ecl(loans)
    data = {"data_kind": "synthetic demonstration exposures", "baseline": baseline,
            "scenario_weighted": weighted,
            "stage3_assumption": "PD=1; LGD loss discounted one year; no recovery cash-flow estimation"}
    out = ROOT / "reports"
    out.mkdir(exist_ok=True)
    (out / "verified_examples.json").write_text(json.dumps(data, indent=2, default=lambda value: value.value), encoding="utf-8")
    from openpyxl import Workbook
    book = Workbook()
    sheet = book.active
    sheet.title = "Python verified results"
    sheet.append(["Synthetic borrower", "Exposure", "Stage", "LGD", "Applied ECL", "Measurement"])
    for row in baseline["loans"]:
        sheet.append([row["loan_name"], row["principal"], row["stage"].value,
                      row["lgd_used"], row["ecl_applied"], row["measurement"]])
    sheet.append(["TOTAL", baseline["totals"]["total_ead"], None, None, baseline["totals"]["total_ecl"]])
    scenarios = book.create_sheet("Scenario results")
    scenarios.append(["Scenario", "Probability", "ECL", "Weighted contribution"])
    for row in weighted["scenarios"]:
        scenarios.append([row["scenario"], row["probability"], row["totals"]["total_ecl"], row["probability"] * row["totals"]["total_ecl"]])
    scenarios.append(["WEIGHTED TOTAL", 1, weighted["weighted_ecl"]])
    notes = book.create_sheet("Read me")
    notes.append(["These are Python-computed values, not an independently implemented Excel model."])
    notes.append(["The original Phase1-4 workbooks are historical teaching material and are not reconciled to the corrected engine."])
    notes.append(["Synthetic exposures; published rating anchors; illustrative scenario weights and LGDs."])
    for worksheet in book:
        worksheet.freeze_panes = "A2"
        for column in worksheet.columns:
            worksheet.column_dimensions[column[0].column_letter].width = min(65, max(18, max(len(str(c.value or "")) for c in column) + 2))
    book.properties.creator = "Anonymous portfolio"
    book.properties.lastModifiedBy = "Anonymous portfolio"
    book.save(out / "IFRS9_Verified_Examples.xlsx")
    print(json.dumps({"baseline_ecl": baseline["totals"]["total_ecl"], "weighted_ecl": weighted["weighted_ecl"], "overlay_pct": weighted["overlay_pct"]}))


if __name__ == "__main__":
    main()
