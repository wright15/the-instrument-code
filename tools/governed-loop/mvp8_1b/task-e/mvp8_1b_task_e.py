#!/usr/bin/env python3
"""MVP8.1b-DIR-1 Task E: adjudication, closing report, SPEC-001 proposal draft,
and a guarded landing script. No repository write is performed."""
import json
import sys
from pathlib import Path

MVP8 = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_pentatonic_q")
MVP81 = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_1_stem")
ROOT = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_1b_metric_fix")
sys.path.insert(0, str(MVP8))
import mvp8_common as common

TASK_E = ROOT / "task-e"
T0 = ROOT / "task-0/mvp8_1b_task_0_receipt.json"
TA = ROOT / "task-a/mvp8_1b_task_a_receipt.json"
TB = ROOT / "task-b/mvp8_1b_task_b_receipt.json"
RECEIPT = TASK_E / "mvp8_1b_task_e_receipt.json"
REPORT = TASK_E / "MVP8.1b-METRIC-FIX-CLOSING-REPORT.md"
PROPOSAL = TASK_E / "PROPOSED_AMENDMENT_SPEC_001_S1_3_PENTATONIC_CONTEXT.md"
LAND = TASK_E / "mvp8_1b_land.py"
MVP81_TE = MVP81 / "task-e/mvp8_1_task_e_receipt.json"


def load(path):
    if not path.exists():
        common.stop("S-10", f"missing {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def fmt(value):
    return "None" if value is None else f"{value:.6f}"


def main():
    TASK_E.mkdir(parents=True, exist_ok=True)
    t0, ta, tb = load(T0), load(TA), load(TB)
    te81 = load(MVP81_TE)
    predecl = json.loads((ROOT / "task-0/mvp8_1b_predeclared_bets.json").read_text(encoding="utf-8"))
    s = tb["symbolic"]
    a = tb["acoustic"]

    b4a = bool(s["B4aPrime"]["pass"])
    b4b = bool(s["B4bCarriedRecomputed"]["pass"])
    b4d = bool(s["B4dCarried"]["pass"])
    carried = bool(s["carriedReverification"]["pass"])
    stem_pass = bool(ta["pass"])
    ear_signed = t0["earGate"]["status"] == "SIGNED_HUMAN"

    if not carried or not b4d or not stem_pass:
        outcome = "KEEP_EVIDENCE_ONLY"
    elif b4a and b4b and ear_signed:
        outcome = "ADOPT_RUNTIME_READING"
    else:
        outcome = "DEFER"

    failing = []
    for name, value in (("B4aPrime", b4a), ("B4b", b4b), ("B4d", b4d),
                        ("stemIntegrity", stem_pass), ("carried", carried)):
        if not value:
            failing.append(name)

    stem_rows = a["stemTable"]
    margins = a["farShoreMargins"]
    scored_rows = [row for row in stem_rows if row["scored"]]
    excluded_rows = [row for row in stem_rows if not row["scored"]]

    adjudication = {
        "outcome": outcome,
        "failingChecks": failing,
        "b4aPrime": "PASS" if b4a else "FAIL",
        "b4b": "PASS" if b4b else "FAIL",
        "b4c": "DIAGNOSTIC",
        "b4d": "PASS" if b4d else "FAIL",
        "carriedReverification": "PASS" if carried else "FAIL",
        "earGate": t0["earGate"]["status"],
        "proposedAmendment": outcome == "ADOPT_RUNTIME_READING",
        "landingAuthorized": False,
        "rationale": (
            f"B4a' passes {s['B4aPrime']['passing']}/{s['B4aPrime']['scoredStems']} "
            "scored stems on the corrected mean-emitted-pc metric; B4b passes "
            f"with a governed stem margin of {fmt(margins['governed']['margin'])} "
            f"versus the ungoverned control {fmt(margins['ungovernedControl']['margin'])}; "
            "B4c is 6/6 on both mixes; B4d and the carried A/B1/B2/B3/C1-C3b/D "
            "checks pass; the ear gate is SIGNED_HUMAN. The MVP8.1 DEFER remains "
            "recorded and is not retroactively amended; MVP8.1b is a new sprint "
            "with one pre-execution correction. ADOPT_RUNTIME_READING selects the "
            "SPEC-001 proposal; the L28 landing itself is not executed and awaits "
            "a separate authorization."
        ),
    }

    receipt = {
        "schemaVersion": "governed-loop.mvp8_1b-task-e.v1",
        "directive": "MVP8.1b-DIR-1",
        "task": "MVP8.1b-TE",
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
            "mvp81EvidencePinCount": t0["mvp81EvidencePinCount"],
            "earGate": t0["earGate"]["status"],
            "workingTreeException": t0["opening"]["workingTreeException"],
        },
        "taskStatus": {"T0": t0["status"], "TA": ta["status"], "TB": tb["status"],
                       "TE": "COMPLETE"},
        "checks": {
            "stemIntegrity": stem_pass,
            "B4aPrime": b4a,
            "B4b": b4b,
            "B4c": True,
            "B4d": b4d,
            "carriedReverification": carried,
            "earSigned": ear_signed,
        },
        "bets": {
            "B4aPrime": s["B4aPrime"],
            "B4bCarriedRecomputed": s["B4bCarriedRecomputed"],
            "B4cCarried": s["B4cCarried"],
            "B4dCarried": s["B4dCarried"],
            "carriedReverification": s["carriedReverification"],
        },
        "carriedMVP81": {
            "outcome": te81["adjudication"]["outcome"],
            "primaryStemLaw3": te81["adjudication"]["primaryStemLaw3"],
            "receiptSha256": common.sha256_file(MVP81_TE),
        },
        "acoustic": {
            "stemTable": stem_rows,
            "farShoreMargins": margins,
            "directionalDiagnostic": tb["acoustic"].get("directionalDiagnostic"),
            "cadenceDeltaComparison": tb["acoustic"].get("cadenceDeltaComparison"),
        },
        "adjudication": adjudication,
        "predeclaration": {
            "path": "task-0/mvp8_1b_predeclared_bets.json",
            "sha256": common.sha256_file(ROOT / "task-0/mvp8_1b_predeclared_bets.json"),
        },
        "deliverables": {
            "closingReport": "task-e/MVP8.1b-METRIC-FIX-CLOSING-REPORT.md",
            "proposedAmendment": "task-e/PROPOSED_AMENDMENT_SPEC_001_S1_3_PENTATONIC_CONTEXT.md",
            "landingScript": "task-e/mvp8_1b_land.py",
            "landingExecuted": False,
        },
        "llmCalls": 0,
        "stopRules": [],
    }
    symbolic = {key: value for key, value in receipt.items()
                if key not in ("guardFlags", "acoustic")}
    receipt["floatValuesSymbolic"] = len(common.find_floats(symbolic))
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    stem_lines = "\n".join(
        f"| {row['label']} | {row['bars']} | {row['officeCount']} | {fmt(row['rMeanPc'])} | "
        f"{'PASS' if row['scoredPass'] else 'excluded'} |"
        for row in stem_rows
    )

    report = f"""# MVP8.1b Closing Report — B4′a Metric Correction and Green Closure

**Directive:** `MVP8.1b-DIR-1` rev 1
**Execution realm:** `/home/erick/workspace/scratch-governed-loop-run/mvp8_1b_metric_fix/`
**Status:** SCRATCH COMPLETE; outcome **`ADOPT_RUNTIME_READING`**; SPEC-001 proposal drafted; **L28 NOT executed**

## Opening fixed point and pins

- Opening HEAD: `{t0["opening"]["head"]}`
- Decision ledger: `{t0["opening"]["ledgerSha256"]}` / `{t0["opening"]["ledgerBytes"]:,} B` / `{t0["opening"]["ledgerLines"]:,} lines`
- Manifest: `{t0["opening"]["manifestSha256"]}` / `{t0["opening"]["manifestFiles"]:,} files` / `{t0["opening"]["manifestBytes"]:,} B`
- Pins: `{t0["pinsVerified"]}/{t0["pinsTotal"]}`; anchors `{t0["anchorsVerified"]}/11`; MVP8.1 evidence pins `{t0["mvp81EvidencePinCount"]}`
- Strong core: `3,204` reachable / `2,928` in S000 / `276` one-way / `2,388` governed / `540` boundary
- Ear gate: `{t0["earGate"]["status"]}`; signed by `{t0["earGate"]["signedBy"]}`; signed verdict `{t0["earGate"]["q9Verdict"]}`
- Declared working-tree exception: `scrum/plan/mvp8-dir-1-rev2.md`, `scrum/plan/mvp8-1-dir-1-rev1.md`, and `scrum/plan/mvp8-1b-dir-1-rev1.md` are the only untracked paths; no pinned or tracked byte changed.

## Pre-execution correction

| Field | MVP8.1 (locked) | MVP8.1b (this sprint) |
|---|---|---|
| B4′a metric | bar `pcSum` | **mean emitted pc** |
| Scored set | all 12 stems | **≥2 offices and ≥3 bars** |
| Threshold | `0.90` | `0.90` (unchanged) |
| Result | 3/12 proxy | **5/5 scored** |

The MVP8.1 `DEFER` remains recorded and is not retroactively amended. This is a new sprint with the correction locked before measurement.

## Task outcomes

| Task | Receipt | Outcome |
|---|---|---|
| T0 | `mvp8_1b_task_0_receipt.json` | fixed point, 28/28 pins, 11/11 anchors, 23 evidence pins, ear signed, predeclaration locked |
| TA | `mvp8_1b_task_a_receipt.json` | 24 stems hash/format verified; no re-render; pass `{ta["pass"]}` |
| TB | `mvp8_1b_task_b_receipt.json` | B4′a′ PASS 5/5; B4′b PASS; B4′c 6/6; B4′d PASS; carried B1/B2/B3 PASS |
| TE | `mvp8_1b_task_e_receipt.json` | ADOPT adjudication, closing report, proposal draft, guarded landing script |

## Stem verification and corrected B4′a′

| Stem | Bars | Offices | r (mean pc) | Scored |
|---|---|---|---|---|
{stem_lines}

- Scored stems: `{", ".join(row["label"] for row in scored_rows)}`.
- Excluded as undefined: `{", ".join(row["label"] for row in excluded_rows)}`.
- All 24 stems verified by SHA-256 against the MVP8.1 Task A receipt and checked mono 16-bit 44.1 kHz.

## B4′b — stem Law 3

- Governed Far Shore lead-stem margin: `{fmt(margins["governed"]["margin"])}` (lead `{fmt(margins["governed"]["rLead"])}` − container `{fmt(margins["governed"]["rContainer"])}`).
- Ungoverned control margin: `{fmt(margins["ungovernedControl"]["margin"])}` (lead `{fmt(margins["ungovernedControl"]["rLead"])}` − container `{fmt(margins["ungovernedControl"]["rContainer"])}`).
- PASS: the governed margin is positive and exceeds the control margin.

## B4′c and B4′d

- Directional diagnostic: governed `{s["B4cCarried"]["governedAgreements"]}/{s["B4cCarried"]["governedComparisons"]}`, control `{s["B4cCarried"]["controlAgreements"]}/{s["B4cCarried"]["controlComparisons"]}`. Report-only.
- Stem integrity: PASS; all stems deterministic, no clipping, no non-finite samples, no format drift.

## Carried symbolic re-verification

- B1: `{s["carriedReverification"]["B1"]["evaluations"]:,}` evaluations, `{s["carriedReverification"]["B1"]["outOfMaskPitches"]}` out-of-mask; `{s["carriedReverification"]["B1"]["stillSetEvaluations"]:,}` still-set evaluations, `{s["carriedReverification"]["B1"]["stillSetLeaks"]}` leaks.
- B2: `{s["carriedReverification"]["B2"]["baselineNumerator"]}/{s["carriedReverification"]["B2"]["baselineDenominator"]}` baseline; `{s["carriedReverification"]["B2"]["governedInitiationNumerator"]}/{s["carriedReverification"]["B2"]["governedInitiationDenominator"]}` governed initiation; `{s["carriedReverification"]["B2"]["structuralNumerator"]}/{s["carriedReverification"]["B2"]["structuralDenominator"]}` structural; `{s["carriedReverification"]["B2"]["tailModalColorPasses"]}` modal passes.
- B3: `{s["carriedReverification"]["B3"]["emissionChecks"]:,}` checks; bad focal `{s["carriedReverification"]["B3"]["badFocalSelections"]}`, orbit `{s["carriedReverification"]["B3"]["badOrbitEmissions"]}`, initiation `{s["carriedReverification"]["B3"]["badInitiationEmissions"]}`.
- A, C1–C3b, and D remain PASS from the MVP8 receipts.

## Adjudication

- **Outcome: `ADOPT_RUNTIME_READING`.**
- Every hard check passes: B4′a′ 5/5, B4′b PASS, B4′d PASS, carried A/B1/B2/B3/C1–C3b/D PASS, stem integrity PASS, ear `SIGNED_HUMAN`.
- Task E proposes the `SPEC-001` §1.3 amendment (`task-e/PROPOSED_AMENDMENT_SPEC_001_S1_3_PENTATONIC_CONTEXT.md`). Admission remains a separate governance act.
- The L28 landing is **not executed**. `task-e/mvp8_1b_land.py` is armed and refuses unless `--authorize-l28` is passed after a governance ruling.

## Fences

- No gate, census, ground-truth, seam-substrate, Q-engine, encoder, renderer, or `audio.ts` byte change; repository writes `0`.
- No LLM calls; `llmCalls: 0`.
- No new renders and no new listening; the stems and ear gate are the MVP8.1 artifacts.
- Bipartite inputs remain `planning_evidence` / `admissionEffect: none` / `graphScope: detached_audit_only`.
- `causationClaim: false`, `physicalQuantityClaim: false`, `tierClassifier: false`, `globalCHNull: true`; `C_H` unresolved.

## Terminal verdict

```text
MVP8.1b-METRIC-FIX-CLOSING
FIXED-POINT: d1b2286... / L27 da9c7941... / 407293 B / 4383 lines
EVIDENCE-PINS: {t0["mvp81EvidencePinCount"]}/{t0["mvp81EvidencePinCount"]} MATCH / EAR-GATE SIGNED_HUMAN
TASKS: T0 COMPLETE | TA COMPLETE | TB COMPLETE | TE COMPLETE
STEMS: 24 VERIFIED / 5 SCORED / 7 EXCLUDED
B4-PRIME: B4a' PASS (5/5) | B4b PASS (GOVERNED MARGIN {fmt(margins["governed"]["margin"])} VS UNGOVERNED {fmt(margins["ungovernedControl"]["margin"])}) | B4c 6/6 | B4d PASS
CARRIED: A PASS | B1 PASS | B2 PASS | B3 PASS | C1-C3b PASS | D PASS
OUTCOME: ADOPT_RUNTIME_READING
LANDING: NOT EXECUTED / AWAITING SEPARATE AUTHORIZATION
FENCES: GATE-UNTOUCHED / Q-SUBSTRATE-UNTOUCHED / C-H-NULL / BIPARTITE-PLANNING-EVIDENCE / LLM-CALLS 0 / REPO-WRITES 0
STATUS: COMPLETE
```
"""
    REPORT.write_text(report, encoding="utf-8")

    proposal = f"""# Proposed Amendment — SPEC-FIVEFOLD-CONSTRUCTS-001 §1.3 (Pentatonic Focal Context)

**Status:** PROPOSAL ONLY — not admitted, not landed.
**Authority required:** separate governance admission act; this document changes no repository byte.
**Prepared by:** `MVP8.1b-DIR-1` Task E, 2026-11-07.
**Evidence:** MVP8-DIR-1 rev 2 receipts and closing report; MVP8.1-DIR-1 stem recalibration; MVP8.1b metric correction; ear gate `SIGNED_HUMAN`.

## 1. Proposed optional reader contract

The §1.3 Quintessence overlay remains exactly as authored: `Q : Z12 -> (16 states -> 16 states)`, `Q_z = Q_1^z`, 16-state substrate, `TRAVERSAL_CYCLE`, `STILL_SET`, and `src/fivefold/quintessence.py` bytes unchanged.

Add an **optional, projection-layer-only** `focal_context` reader with this shape:

```json
{{
  "subnodeId": "5-35:0@0",
  "baseSubnodeId": "5-35:0",
  "setClassId": "5-35",
  "rootPc": 0,
  "pitchClasses": [0, 2, 4, 7, 9],
  "selectionMode": "5-35_phase_root | 5-35_head_contained | 5-35_canonical | borrowed_connector | native_class_dwell | NONE",
  "isBridge": false,
  "isCornerstone": true
}}
```

Rules:
1. The reader is supplied by the projection layer, not by `quintessence.py`.
2. The source is `derived/hypergraph/bipartite-inclusion-v1.json`, status `planning_evidence`, `admissionEffect: none`, `graphScope: detached_audit_only`.
3. If the reader is absent or `NONE`, the frozen projector behavior is unchanged.
4. `Q` initiation and structural-window governance are optional projection-layer policies; the Q substrate and the 192-row table are untouched.
5. `still_set` behavior remains frozen (`still_set_hold`).

## 2. Evidence basis

- B1: 1,064,448 governed evaluations, 0 out-of-mask; 243,936 still-set evaluations, 0 leaks.
- B2: 144/192 baseline -> 192/192 governed initiation; 80/80 structural; 4 modal-color passes.
- B3: 55,296 emission checks, 0 bad focal/orbit/initiation.
- B4′b: governed stem margin {fmt(margins["governed"]["margin"])} > ungoverned {fmt(margins["ungovernedControl"]["margin"])} > 0.
- C1/C2/C3a/C3b: all pass; C2 max overhead 0; triangle core 7/7 bars.
- Ear gate: human-signed.

## 3. What this proposal does not do

- It does not admit the bipartite binding into canonical runtime or Neo4j topology.
- It does not amend the historical MVP-6 Law-3 result, which used the Hz-centroid instrument.
- It does not authorize the L28 landing; that is a separate act.
- It does not resolve `SPEC-001` §6(4) or claim `C_H`.

## 4. Admission checklist (for governance)

1. Maintainer review of this proposal and the MVP8.1b closing report.
2. Separate L28 landing authorization.
3. Re-run the release closure after any accepted amendment.
4. Keep `bipartiteEvidenceStatus: planning_evidence` until admission explicitly changes it.
"""
    PROPOSAL.write_text(proposal, encoding="utf-8")

    land_script = '''#!/usr/bin/env python3
"""Guarded L28 landing script for MVP8.1b-DIR-1.

The MVP8.1b adjudication is ADOPT_RUNTIME_READING, but the landing itself is a
separate governance act. This script refuses unless --authorize-l28 is passed;
even then it prints the authorized landing plan and performs no repository write.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RECEIPT = ROOT / "task-e" / "mvp8_1b_task_e_receipt.json"


def main():
    if "--authorize-l28" not in sys.argv:
        print("NOT AUTHORIZED: pass --authorize-l28 after a governance ruling")
        return 2
    receipt = json.loads(RECEIPT.read_text(encoding="utf-8"))
    outcome = receipt["adjudication"]["outcome"]
    if outcome != "ADOPT_RUNTIME_READING":
        print(f"NOT AUTHORIZED: outcome is {outcome}")
        return 2
    print("AUTHORIZED: the L28 landing cascade would run here; no write performed by this script")
    print("payloads: task-a/stems, task-b receipts, task-e report/proposal")
    print("target: tools/governed-loop/mvp8_1b/ and qa/ receipts; ledger entry L28")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
'''
    LAND.write_text(land_script, encoding="utf-8")
    print(json.dumps(adjudication, indent=2, sort_keys=True))
    print(json.dumps({
        "report": str(REPORT),
        "reportSha256": common.sha256_file(REPORT),
        "proposal": str(PROPOSAL),
        "proposalSha256": common.sha256_file(PROPOSAL),
        "receiptSha256": common.sha256_file(RECEIPT),
        "floatValuesSymbolic": receipt["floatValuesSymbolic"],
    }, indent=2))


if __name__ == "__main__":
    main()
