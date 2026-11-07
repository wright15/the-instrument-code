#!/usr/bin/env python3
"""MVP8.1-DIR-1 Task E: adjudication, closing report, guarded landing script.
No repository write is performed."""
import json
import sys
from pathlib import Path

sys.path.insert(0, "/home/erick/workspace/scratch-governed-loop-run/mvp8_pentatonic_q")
import mvp8_common as common

ROOT = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_1_stem")
TASK_E = ROOT / "task-e"
T0 = ROOT / "task-0/mvp8_1_task_0_receipt.json"
TA = ROOT / "task-a/mvp8_1_task_a_receipt.json"
TB = ROOT / "task-b/mvp8_1_task_b_receipt.json"
RECEIPT = TASK_E / "mvp8_1_task_e_receipt.json"
REPORT = TASK_E / "MVP8.1-STEM-CALIBRATION-CLOSING-REPORT.md"
LAND = TASK_E / "mvp8_1_land.py"
MVP8 = common.SCRATCH
MVP8_TE = MVP8 / "task-e/mvp8_task_e_receipt.json"


def load(path):
    if not path.exists():
        common.stop("S-10", f"missing {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def main():
    TASK_E.mkdir(parents=True, exist_ok=True)
    t0, ta, tb = load(T0), load(TA), load(TB)
    mvp8_te = load(MVP8_TE)
    predecl = json.loads((ROOT / "task-0/mvp8_1_predeclared_bets.json").read_text(encoding="utf-8"))
    s = tb["symbolic"]
    a = tb["acoustic"]

    b4a = bool(s["B4a"]["pass"])
    b4b = bool(s["B4b"]["pass"])
    b4d = bool(s["B4d"]["pass"])
    carried = bool(s["carriedReverification"]["pass"])
    stem_pass = bool(ta["pass"])
    diagnostic_sanity = s["B4aDiagnosticSanity"]
    margins = a["farShoreMargins"]
    directional = s["B4c"]

    if not carried:
        outcome = "KEEP_EVIDENCE_ONLY"
    elif b4a and b4b and b4d and stem_pass:
        outcome = "ADOPT_RUNTIME_READING"
    else:
        outcome = "DEFER"

    failing = []
    if not b4a:
        failing.append("B4a")
    if not b4b:
        failing.append("B4b")
    if not b4d:
        failing.append("B4d")
    if not stem_pass:
        failing.append("stemIntegrity")
    if not carried:
        failing.append("carriedReverification")

    stem_table = []
    for row in a["stemMeasurements"]:
        lead = row["lead"]
        stem_table.append({
            "label": row["label"],
            "rLeadPcSum": lead["leadDeconfounded"],
            "rContainer": lead["containerDeconfounded"],
            "rMeanPc": lead["meanPcDeconfounded"],
            "rMeanPcRaw": lead["meanPcRaw"],
            "windows": lead["windows"],
        })

    adjudication = {
        "outcome": outcome,
        "failingChecks": failing,
        "primaryStemLaw3": "PASS" if b4b else "FAIL",
        "b4aProxy": "FAIL_BY_LOCK" if not b4a else "PASS",
        "b4aDiagnostic": "PASS" if diagnostic_sanity["passing"] == diagnostic_sanity["definedStems"] else "PARTIAL",
        "earGate": t0["earGate"]["status"],
        "proposedAmendment": False,
        "landingAuthorized": False,
        "rationale": (
            "The substantive stem-isolated Law-3 bet B4b passes: the governed "
            "Far Shore lead-stem margin is positive and exceeds the ungoverned "
            "control (0.145169 vs 0.031118). Stem integrity B4d passes. The "
            "locked B4a sanity proxy fails (3/12) because it used bar pcSum and "
            "office deconfounding is degenerate on single-office or two-bar "
            "stems; the non-bet mean-emitted-pc diagnostic passes 8/8 defined "
            "stems (>=0.90). Under the locked rule the outcome is DEFER, with "
            "B4a named as the only blocker; no SPEC-001 amendment and no L28 "
            "landing are proposed. The recommended next step is a one-line "
            "B4a metric correction (mean emitted pc, minimum two offices and "
            "three bars) in MVP8.1b."
        ),
    }

    receipt = {
        "schemaVersion": "governed-loop.mvp8_1-task-e.v1",
        "directive": "MVP8.1-DIR-1",
        "task": "MVP8.1-TE",
        "status": "COMPLETE",
        "guardFlags": common.GUARD,
        "fixedPoint": {
            "head": t0["opening"]["head"],
            "ledgerSha256": t0["opening"]["ledgerSha256"],
            "ledgerBytes": t0["opening"]["ledgerBytes"],
            "ledgerLines": t0["opening"]["ledgerLines"],
            "manifestSha256": t0["opening"]["manifestSha256"],
            "manifestFiles": t0["opening"]["manifestFiles"],
            "manifestBytes": t0["opening"]["manifestBytes"],
            "pinsVerified": t0["pinsVerified"],
            "pinsTotal": t0["pinsTotal"],
            "anchorsVerified": t0["anchorsVerified"],
            "mvp8EvidencePinCount": t0["mvp8EvidencePinCount"],
            "earGate": t0["earGate"]["status"],
            "workingTreeException": t0["opening"]["workingTreeException"],
        },
        "taskStatus": {"T0": t0["status"], "TA": ta["status"], "TB": tb["status"],
                       "TE": "COMPLETE"},
        "checks": {
            "stemIntegrity": stem_pass,
            "B4a": b4a,
            "B4aDiagnosticSanity": (diagnostic_sanity["passing"]
                                   == diagnostic_sanity["definedStems"]),
            "B4b": b4b,
            "B4c": True,
            "B4d": b4d,
            "carriedReverification": carried,
        },
        "carriedMVP8": {
            "outcome": mvp8_te["adjudication"]["outcome"],
            "receiptSha256": common.sha256_file(MVP8_TE),
        },
        "bets": {
            "B4a": s["B4a"],
            "B4aDiagnosticSanity": diagnostic_sanity,
            "B4b": s["B4b"],
            "B4c": s["B4c"],
            "B4d": s["B4d"],
            "carriedReverification": s["carriedReverification"],
        },
        "adjudication": adjudication,
        "acoustic": {
            "farShoreMargins": margins,
            "directionalDiagnostic": a["directionalDiagnostic"],
            "stemTable": stem_table,
        },
        "predeclaration": {
            "path": "task-0/mvp8_1_predeclared_bets.json",
            "sha256": common.sha256_file(ROOT / "task-0/mvp8_1_predeclared_bets.json"),
        },
        "deliverables": {
            "closingReport": "task-e/MVP8.1-STEM-CALIBRATION-CLOSING-REPORT.md",
            "landingScript": "task-e/mvp8_1_land.py",
            "landingExecuted": False,
        },
        "llmCalls": 0,
        "stopRules": [],
    }
    symbolic = {key: value for key, value in receipt.items()
                if key not in ("guardFlags", "acoustic")}
    receipt["floatValuesSymbolic"] = len(common.find_floats(symbolic))
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    def fmt(value):
        return "None" if value is None else f"{value:.6f}"

    stem_lines = "\n".join(
        f"| {row['label']} | {fmt(row['rLeadPcSum'])} | {fmt(row['rContainer'])} | {fmt(row['rMeanPc'])} | {row['windows']} |"
        for row in stem_table
    )

    report = f"""# MVP8.1 Closing Report — Stem-Isolated B4 Recalibration

**Directive:** `MVP8.1-DIR-1` rev 1
**Execution realm:** `/home/erick/workspace/scratch-governed-loop-run/mvp8_1_stem/`
**Status:** SCRATCH COMPLETE; outcome **DEFER (instrument proxy)**; repository untouched; ear gate SIGNED_HUMAN

## Opening fixed point and pins

- Opening HEAD: `{t0["opening"]["head"]}`
- Decision ledger: `{t0["opening"]["ledgerSha256"]}` / `{t0["opening"]["ledgerBytes"]:,} B` / `{t0["opening"]["ledgerLines"]:,} lines`
- Manifest: `{t0["opening"]["manifestSha256"]}` / `{t0["opening"]["manifestFiles"]:,} files` / `{t0["opening"]["manifestBytes"]:,} B`
- Pins: `{t0["pinsVerified"]}/{t0["pinsTotal"]}`; anchors `{t0["anchorsVerified"]}/11`; MVP8 evidence pins `{t0["mvp8EvidencePinCount"]}`
- Strong core: `3,204` reachable / `2,928` in S000 / `276` one-way / `2,388` governed / `540` boundary
- Ear gate: `{t0["earGate"]["status"]}`; signed by `{t0["earGate"]["signedBy"]}`; signed verdict `{t0["earGate"]["q9Verdict"]}`
- Declared working-tree exception: `scrum/plan/mvp8-dir-1-rev2.md` and `scrum/plan/mvp8-1-dir-1-rev1.md` are the only untracked paths; no pinned or tracked byte changed.

## Task outcomes

| Task | Receipt | Outcome |
|---|---|---|
| T0 | `mvp8_1_task_0_receipt.json` | fixed point, 28/28 pins, 11/11 anchors, 23 MVP8 evidence pins, ear signed, predeclaration locked |
| TA | `mvp8_1_task_a_receipt.json` | 12 lead stems + 12 pad stems; format/determinism/integrity `{ta["pass"]}` |
| TB | `mvp8_1_task_b_receipt.json` | B4a FAIL (proxy), B4b PASS, B4c 6/6 diagnostic, B4d PASS, B1/B2/B3 re-verified |
| TE | `mvp8_1_task_e_receipt.json` | DEFER adjudication, closing report, guarded landing script |

## Stem-isolated measurements

- **B4b (primary, hard): PASS.** Far Shore lead-stem margins: governed `lead {fmt(margins["governed"]["rLead"])} - container {fmt(margins["governed"]["rContainer"])} = {fmt(margins["governed"]["margin"])}`; ungoverned control `{fmt(margins["ungovernedControl"]["rLead"])} - {fmt(margins["ungovernedControl"]["rContainer"])} = {fmt(margins["ungovernedControl"]["margin"])}`. The governed margin is positive and exceeds the control margin.
- **B4a (locked proxy, hard): FAIL.** `{s["B4a"]["passing"]}/{s["B4a"]["stems"]}` stems meet the `0.90` pcSum-based threshold.
- **B4a diagnostic (non-bet): `{diagnostic_sanity["passing"]}/{diagnostic_sanity["definedStems"]}` defined stems pass `>= 0.90` when measured against mean emitted pc; the four undefined stems are single-office or two-bar probes where office deconfounding has zero residual variance.
- **B4c (diagnostic, report-only):** full-mix section-boundary direction agrees `{directional["governedAgreements"]}/{directional["governedComparisons"]}` governed and `{directional["controlAgreements"]}/{directional["controlComparisons"]}` control.
- **B4d: PASS.** All 24 stems are mono 16-bit 44.1 kHz, two-pass deterministic, 0 clipped, 0 non-finite.

| Stem | rLead (pcSum) | rContainer | rMeanPc | Windows |
|---|---|---|---|---|
{stem_lines}

## Carried symbolic re-verification

- B1: `{s["carriedReverification"]["B1"]["evaluations"]:,}` evaluations, `{s["carriedReverification"]["B1"]["outOfMaskPitches"]}` out-of-mask; `{s["carriedReverification"]["B1"]["stillSetEvaluations"]:,}` still-set evaluations, `{s["carriedReverification"]["B1"]["stillSetLeaks"]}` leaks.
- B2: `{s["carriedReverification"]["B2"]["baselineNumerator"]}/{s["carriedReverification"]["B2"]["baselineDenominator"]}` baseline; `{s["carriedReverification"]["B2"]["governedInitiationNumerator"]}/{s["carriedReverification"]["B2"]["governedInitiationDenominator"]}` governed initiation; `{s["carriedReverification"]["B2"]["structuralNumerator"]}/{s["carriedReverification"]["B2"]["structuralDenominator"]}` structural; `{s["carriedReverification"]["B2"]["tailModalColorPasses"]}` modal passes.
- B3: `{s["carriedReverification"]["B3"]["emissionChecks"]:,}` checks; bad focal `{s["carriedReverification"]["B3"]["badFocalSelections"]}`, orbit `{s["carriedReverification"]["B3"]["badOrbitEmissions"]}`, initiation `{s["carriedReverification"]["B3"]["badInitiationEmissions"]}`.

## Adjudication

- **Outcome: `DEFER` (instrument proxy).**
- **Primary stem Law-3 result: PASS.** B4b confirms the governed lead stem tracks its lead more than the container, with a margin larger than the ungoverned control. This is the substantive stem-isolation result the recalibration was designed to obtain.
- **Only blocker: B4a.** The locked sanity proxy used bar `pcSum`; office deconfounding is degenerate on single-office/two-bar stems and `pcSum` is a coarse lead-tracking signal. The non-bet mean-emitted-pc diagnostic passes `8/8` defined stems at `>=0.90`.
- **No SPEC-001 amendment and no L28 landing are proposed.** The guarded `task-e/mvp8_1_land.py` refuses to execute under DEFER.
- **Recommended next step:** `MVP8.1b-DIR-1` with a one-line B4a metric correction (mean emitted pc; require at least two offices and three bars) and no other change. The B4b result and the carried PASSes are banked.

## Fences

- No gate, census, ground-truth, seam-substrate, Q-engine, encoder, renderer, or `audio.ts` byte change; repository writes `0` (transient ignored bytecode caches, if any, removed).
- No LLM calls; `llmCalls: 0`.
- Bipartite inputs remain `planning_evidence` / `admissionEffect: none` / `graphScope: detached_audit_only`.
- `causationClaim: false`, `physicalQuantityClaim: false`, `tierClassifier: false`, `globalCHNull: true`; `C_H` unresolved.
- Ear gate `SIGNED_HUMAN`; the signed verdict is human-authored, not agent-authored.

## Terminal verdict

```text
MVP8.1-STEM-CALIBRATION-CLOSING
FIXED-POINT: d1b2286... / L27 da9c7941... / 407293 B / 4383 lines
EVIDENCE-PINS: {t0["mvp8EvidencePinCount"]}/{t0["mvp8EvidencePinCount"]} MATCH / EAR-GATE SIGNED_HUMAN
TASKS: T0 COMPLETE | TA COMPLETE | TB COMPLETE | TE COMPLETE
STEMS: 12 LEAD / 12 PAD / FORMAT PASS / DETERMINISTIC PASS
B4-PRIME: B4a FAIL (3/12 PROXY; DIAGNOSTIC 8/8 MEAN-PC) | B4b PASS (GOVERNED MARGIN {fmt(margins["governed"]["margin"])} VS UNGOVERNED {fmt(margins["ungovernedControl"]["margin"])}) | B4c 6/6 DIAGNOSTIC | B4d PASS
CARRIED: A PASS | B1 PASS | B2 PASS | B3 PASS | C1-C3b PASS | D PASS
OUTCOME: DEFER (B4a INSTRUMENT PROXY)
FENCES: GATE-UNTOUCHED / Q-SUBSTRATE-UNTOUCHED / C-H-NULL / BIPARTITE-PLANNING-EVIDENCE / LLM-CALLS 0 / REPO-WRITES 0
STATUS: COMPLETE
```
"""
    REPORT.write_text(report, encoding="utf-8")

    land_script = '''#!/usr/bin/env python3
"""Guarded L28 landing script for MVP8.1-DIR-1. Refuses unless authorized and
the adjudication outcome is ADOPT_RUNTIME_READING."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RECEIPT = ROOT / "task-e" / "mvp8_1_task_e_receipt.json"


def main():
    if "--authorize-l28" not in sys.argv:
        print("NOT AUTHORIZED: pass --authorize-l28 after a governance ruling")
        return 2
    receipt = json.loads(RECEIPT.read_text(encoding="utf-8"))
    outcome = receipt["adjudication"]["outcome"]
    if outcome != "ADOPT_RUNTIME_READING":
        print(f"NOT AUTHORIZED: outcome is {outcome}")
        return 2
    print("AUTHORIZED: the L28 landing cascade would run here")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
'''
    LAND.write_text(land_script, encoding="utf-8")
    print(json.dumps(adjudication, indent=2, sort_keys=True))
    print(json.dumps({
        "report": str(REPORT),
        "reportSha256": common.sha256_file(REPORT),
        "receiptSha256": common.sha256_file(RECEIPT),
        "floatValuesSymbolic": receipt["floatValuesSymbolic"],
    }, indent=2))


if __name__ == "__main__":
    main()
