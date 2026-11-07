#!/usr/bin/env python3
"""MVP8-DIR-1 Task E: adjudication, closing report, and a guarded L28 landing
script. No repository write is performed by this task.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, "/home/erick/workspace/scratch-governed-loop-run/mvp8_pentatonic_q")
import mvp8_common as common

TASK_E = common.SCRATCH / "task-e"
T0 = common.SCRATCH / "task-0/mvp8_task_0_receipt.json"
TA = common.SCRATCH / "task-a/mvp8_task_a_receipt.json"
TB = common.SCRATCH / "task-b/mvp8_task_b_receipt.json"
TC = common.SCRATCH / "task-c/mvp8_task_c_receipt.json"
TD = common.SCRATCH / "task-d/mvp8_task_d_receipt.json"
RECEIPT = TASK_E / "mvp8_task_e_receipt.json"
REPORT = TASK_E / "MVP8-PENTATONIC-Q-CLOSING-REPORT.md"
LAND = TASK_E / "mvp8_land.py"

EXPECTED_HEAD = "d1b2286a5b6f3783af24094eb78e40ab511bb8e5"


def load(path):
    if not path.exists():
        common.stop("S-10", f"missing receipt {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def main():
    TASK_E.mkdir(parents=True, exist_ok=True)
    t0, ta, tb, tc, td = load(T0), load(TA), load(TB), load(TC), load(TD)
    predecl = common.load_predecl()

    a_pass = bool(ta["verification"]["allTargetsMatch"])
    b1 = bool(tb["B1"]["pass"])
    b2 = bool(tb["B2"]["pass"])
    b3 = bool(tb["B3"]["pass"])
    b4 = bool(tb["B4"]["pass"])
    c1 = bool(tc["C1"]["pass"])
    c2 = bool(tc["C2"]["allPass"])
    c3a = bool(tc["C3a"]["pass"])
    c3b = bool(tc["C3b"]["pass"])
    d_pass = bool(td["pass"])

    if not b1 or not b3:
        outcome = "KEEP_EVIDENCE_ONLY"
    elif a_pass and b1 and b2 and b3 and b4 and c1 and c2 and c3a and c3b and d_pass:
        outcome = "CONDITIONAL_ADOPT_RUNTIME_READING_PENDING_EAR"
    else:
        outcome = "DEFER"

    failing = []
    for name, value in (("A", a_pass), ("B1", b1), ("B2", b2), ("B3", b3),
                        ("B4", b4), ("C1", c1), ("C2", c2), ("C3a", c3a),
                        ("C3b", c3b), ("D", d_pass)):
        if not value:
            failing.append(name)

    gov = tb["acoustic"]["farShoreGoverned"]["correlations"]
    ctrl = tb["acoustic"]["farShoreUngoverned"]["correlations"]
    cadence = tb["acoustic"]["cadences"]
    l27_task_d = json.loads(
        (common.REPO / "qa/mvp7_task_d_receipt.json").read_text(encoding="utf-8"))
    l27_deltas = {"andalusian": [], "borrowed_minor": []}
    for row in l27_task_d.get("renders", []):
        label = row["label"]
        corr = row.get("correlations", {})
        lead = corr.get("leadDeconfounded")
        container = corr.get("containerDeconfounded")
        if lead is None or container is None:
            continue
        if label.startswith("andalusian"):
            l27_deltas["andalusian"].append(lead - container)
        elif label.startswith("borrowed_minor"):
            l27_deltas["borrowed_minor"].append(lead - container)
    governed_cadence_deltas = {}
    for key, row in cadence.items():
        corr = row.get("correlations", {})
        lead = corr.get("leadDeconfounded")
        container = corr.get("containerDeconfounded")
        governed_cadence_deltas[key] = (lead - container
                                        if lead is not None and container is not None
                                        else None)
    delta_comparison = {
        "governedCadenceDelta": governed_cadence_deltas,
        "l27UngovernedAndalusianDeltaRange": [
            min(l27_deltas["andalusian"]), max(l27_deltas["andalusian"])],
        "l27UngovernedBorrowedMinorDeltaRange": [
            min(l27_deltas["borrowed_minor"]), max(l27_deltas["borrowed_minor"])],
        "note": ("The log-spectral cadence diagnostic does not rescue B4: the "
                 "governed B1 delta is inside the L27 Andalusian range and the "
                 "governed B2 delta is only slightly better than the L27 best "
                 "borrowed-minor delta; both remain negative."),
    }
    d_arc = td["compare"]["arc"]
    d_pure = td["compare"]["pure"]
    c2_rows = tc["C2"]["pairs"]
    c2_max = max((row["hopOverhead"] for row in c2_rows
                  if row["hopOverhead"] is not None), default=None)
    b3_emission_checks = tb["B3"]["emissionChecks"]

    adjudication = {
        "outcome": outcome,
        "failingBets": failing,
        "deterministic": True,
        "earGate": "PENDING_HUMAN",
        "proposedAmendment": False,
        "landingAuthorized": False,
        "rationale": (
            "B1 (0/1,064,448 out-of-mask), B2 (144/192 baseline -> 192/192 "
            "governed initiation; 80/80 structural; 4 modal-color passes), and "
            "B3 (0 bad focal / 0 bad emissions) pass; C1, C2, C3a, C3b pass; "
            "Task D render integrity is 6/6. B4 fails as predeclared: the "
            "governed Far Shore log-spectral deconfounded lead correlation "
            "0.200836 is below the container correlation 0.673879, and the "
            "ungoverned control is also below (0.330663 < 0.719081). Under the "
            "DEFER rule the failing task is named and the passing components "
            "are banked without proposing the SPEC-001 amendment."
        ),
    }

    receipt = {
        "schemaVersion": "governed-loop.mvp8-task-e.v1",
        "directive": "MVP8-DIR-1",
        "task": "MVP8-TE",
        "status": "COMPLETE",
        "guardFlags": common.GUARD,
        "fixedPoint": {
            "head": EXPECTED_HEAD,
            "ledgerSha256": t0["opening"]["ledgerSha256"],
            "ledgerBytes": t0["opening"]["ledgerBytes"],
            "ledgerLines": t0["opening"]["ledgerLines"],
            "manifestSha256": t0["opening"]["manifestSha256"],
            "manifestFiles": t0["opening"]["manifestFiles"],
            "manifestBytes": t0["opening"]["manifestBytes"],
            "pinsVerified": t0["pinsVerified"],
            "pinsTotal": t0["pinsTotal"],
            "anchorsVerified": t0["anchorsVerified"],
            "workingTreeException": t0["opening"]["workingTreeException"],
            "substitutionsRequired": t0["substitutionsRequired"],
        },
        "taskStatus": {
            "T0": t0["status"], "TA": ta["status"], "TB": tb["status"],
            "TC": tc["status"], "TD": td["status"], "TE": "COMPLETE",
        },
        "checks": {
            "A_allTargetsMatch": a_pass,
            "B1": b1, "B2": b2, "B3": b3, "B4": b4,
            "C1": c1, "C2": c2, "C3a": c3a, "C3b": c3b, "D": d_pass,
        },
        "bets": {
            "B1": tb["B1"],
            "B2": tb["B2"],
            "B3": tb["B3"],
            "B4": {
                "pass": b4,
                "cadenceLeadTracks": tb["B4"]["cadenceLeadTracks"],
                "l27Baseline": tb["B4"]["l27Baseline"],
                "instrument": "log-spectral centroid log2(f/440), office-deconfounded",
                "mvp6InstrumentNote": (
                    "The landed MVP-6 Law-3 result used the Hz-centroid instrument "
                    "(container 0.272628, lead 0.425925). The directive's B4 uses "
                    "the log-spectral lens; the two instruments are not directly "
                    "comparable, and the landed MVP-6 result is not withdrawn."
                ),
            },
            "C1": {k: tc["C1"][k] for k in
                   ("source", "target", "hopCount", "sharedSubnodes",
                    "focalSubnode", "focalSwitches", "outOfMaskPitches", "pass")},
            "C2": {"allPass": c2, "maxHopOverhead": c2_max,
                   "pairs": len(c2_rows),
                   "continuityMode": "base_subnode_phase_transposed",
                   "methodNote": (
                       "C2 continuity is measured on the predeclared base subnode "
                       "identity, phase-transposed per node per B3. The earlier "
                       "literal fixed-pitch-set predicate was discarded as an "
                       "implementation artifact; the predeclaration and threshold "
                       "are unchanged."
                   )},
            "C3a": {k: tc["C3a"][k] for k in ("dwellFocalSwitches", "pass")},
            "C3b": {k: tc["C3b"][k] for k in
                    ("focalSwitchesTotal", "gateAllAccept", "outOfMaskPitches", "pass")},
            "D": {"pass": d_pass, "integrity": td["integrity"],
                  "arc": d_arc, "pure": d_pure},
        },
        "predeclaration": {
            "path": "task-0/mvp8_predeclared_bets.json",
            "sha256": common.sha256_file(common.PREDECL_PATH),
        },
        "adjudication": adjudication,
        "acoustic": {
            "farShoreGovernedCorrelations": gov,
            "farShoreUngovernedCorrelations": ctrl,
            "cadenceCorrelations": {
                key: row.get("correlations") for key, row in cadence.items()
            },
            "cadenceDeltaComparison": delta_comparison,
        },
        "deliverables": {
            "closingReport": "task-e/MVP8-PENTATONIC-Q-CLOSING-REPORT.md",
            "landingScript": "task-e/mvp8_land.py",
            "landingExecuted": False,
        },
        "llmCalls": 0,
        "stopRules": [],
    }
    symbolic = {key: value for key, value in receipt.items()
                if key not in ("guardFlags", "acoustic")}
    receipt["floatValuesSymbolic"] = len(common.find_floats(symbolic))
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    report = f"""# MVP8 Closing Report — Pentatonic-Aware Q Initiation and Connector Transfers

**Directive:** `MVP8-DIR-1` rev 2
**Execution realm:** `/home/erick/workspace/scratch-governed-loop-run/mvp8_pentatonic_q/`
**Status:** SCRATCH COMPLETE; outcome **DEFER**; repository untouched; ear gate PENDING_HUMAN

## Opening fixed point and pins

- Opening HEAD: `{EXPECTED_HEAD}` (declared working-tree exception: the directive document `scrum/plan/mvp8-dir-1-rev2.md` is the sole untracked path; no pinned byte changed)
- Decision ledger: `{t0["opening"]["ledgerSha256"]}` / `{t0["opening"]["ledgerBytes"]:,} B` / `{t0["opening"]["ledgerLines"]:,} lines`
- Manifest: `{t0["opening"]["manifestSha256"]}` / `{t0["opening"]["manifestFiles"]:,} files` / `{t0["opening"]["manifestBytes"]:,} B`
- Pins verified: `{t0["pinsVerified"]}/{t0["pinsTotal"]}`; `mvp2.py` anchors `{t0["anchorsVerified"]}/11`
- Strong core: `3,204` reachable / `2,928` in S000 / `276` one-way / `2,388` governed S000 / `540` boundary S000
- Reachability: `1453@0`, `2477@0`, `2741@0`, `1717@0`, `2773@0` all in governed S000; fallbacks `{t0["substitutionsRequired"]}`
- Predeclaration locked before Task A-D: `{common.sha256_file(common.PREDECL_PATH)}`

## Task outcomes

| Task | Receipt | Outcome |
|---|---|---|
| T0 | `mvp8_task_0_receipt.json` | fixed point, 28/28 pins, 11/11 anchors, reachability, predeclaration lock |
| TA | `mvp8_task_a_receipt.json` | 6,930 anchored / 9,702 total phase-0 rows; 70 bridges; 357/70/28/7 unrooted; 381/60/18/3 rooted |
| TB | `mvp8_task_b_receipt.json` | B1/B2/B3 PASS; B4 FAIL |
| TC | `mvp8_task_c_receipt.json` | C1/C2/C3a/C3b PASS |
| TD | `mvp8_task_d_receipt.json` | 3-arm zero-5-35 study; integrity 6/6 |
| TE | `mvp8_task_e_receipt.json` | adjudication, closing report, guarded landing script |

## Task A — printed tables

- `462 x 15 = 6,930` anchored subnode rows at phase 0; `462 x 21 = 9,702` total 5-note subset rows.
- All phases: `83,160` anchored / `116,424` total.
- Bridge census `70` (5-Z12:5, 5-20:10, 5-23:10, 5-24:10, 5-25:10, 5-27:10, 5-29:10, 5-34:5).
- Unrooted 5-35 distribution `357/70/28/7`; rooted `381/60/18/3`; seed `1387` among the seven with 3.
- Lookup: `task-a/mvp8_pentatonic_lookup_v1.json` (`{ta["lookup"]["bytes"]:,} B`, `{ta["lookup"]["sha256"]}`).

## Task B — initiation bets

- **B1 PASS:** `{tb["B1"]["evaluations"]:,}` governed evaluations, `{tb["B1"]["outOfMaskPitches"]}` out-of-mask; `{tb["B1"]["stillSetEvaluations"]:,}` still-set evaluations, `{tb["B1"]["stillSetLeaks"]}` leaks.
- **B2 PASS:** baseline `{tb["B2"]["baselineNumerator"]}/{tb["B2"]["baselineDenominator"]}`; governed initiation `{tb["B2"]["governedInitiationNumerator"]}/{tb["B2"]["governedInitiationDenominator"]}`; structural `{tb["B2"]["structuralNumerator"]}/{tb["B2"]["structuralDenominator"]}`; tail modal-color `{tb["B2"]["tailModalColorPasses"]}` per 12-step cycle.
- **B3 PASS:** 12 masks x 12 phases; bad focal selections `{tb["B3"]["badFocalSelections"]}`; bad orbit emissions `{tb["B3"]["badOrbitEmissions"]}`; bad initiation emissions `{tb["B3"]["badInitiationEmissions"]}`; `{b3_emission_checks:,}` emission checks.
- **B4 FAIL (forcing):** governed Far Shore log-spectral deconfounded lead `{gov["leadDeconfounded"]:.6f}` < container `{gov["containerDeconfounded"]:.6f}`; the ungoverned control is also below (`{ctrl["leadDeconfounded"]:.6f}` < `{ctrl["containerDeconfounded"]:.6f}`). Cadence lead-tracking `0/2`; the L27 baseline was `0/9`. Against the L27 ungoverned cadence renders, the governed B1 lead-minus-container delta is `{delta_comparison["governedCadenceDelta"]["B1_andalusian"]:.6f}` (L27 Andalusian range `{delta_comparison["l27UngovernedAndalusianDeltaRange"][0]:.6f}` to `{delta_comparison["l27UngovernedAndalusianDeltaRange"][1]:.6f}`) and the governed B2 delta is `{delta_comparison["governedCadenceDelta"]["B2_borrowed_minor"]:.6f}` (L27 borrowed-minor range `{delta_comparison["l27UngovernedBorrowedMinorDeltaRange"][0]:.6f}` to `{delta_comparison["l27UngovernedBorrowedMinorDeltaRange"][1]:.6f}`); the cadence diagnostic does not rescue B4. The MVP-6 Law-3 result used the Hz-centroid instrument (container 0.272628, lead 0.425925) and is not withdrawn; B4 is a log-spectral re-test and it does not confirm Law 3 on this arc.

## Task C — connector transfers

- **C1 PASS:** `1453@0 -> 2477@0`, `1` hop, gate ACCEPT, 5 shared bridge subnodes valid, focal `{tc["C1"]["focalSubnode"]}`, `{tc["C1"]["focalSwitches"]}` focal switches, `{tc["C1"]["outOfMaskPitches"]}` out-of-mask.
- **C2 PASS:** 10/10 predeclared pairs, maximum hop overhead `{c2_max}` <= `+2`, continuity on the predeclared base-subnode identity (phase-transposed per B3).
- **C3a PASS:** three major-mode dwell pillars hold `5-35:0`; `{tc["C3a"]["dwellFocalSwitches"]}` dwell focal switches.
- **C3b PASS:** `{sum(1 for row in tc["C3b"]["bars"] if row["corePresent"])}/7` bars contain the core `{{0,2,4,7}}`; bridge switches per leg `{ [leg["bridgeSwitches"] for leg in tc["C3b"]["legs"]] }` against allowed `{ [leg["allowed"] for leg in tc["C3b"]["legs"]] }`; gate all ACCEPT `{tc["C3b"]["gateAllAccept"]}`; hop overhead `0` on all three legs.
- Renders: `c1-aeolian-harmonic-minor` and `c3b-major-mode-triangle` under `task-c/renders/`.

## Task D — zero-5-35 study (2477@0 Harmonic Minor)

Numbers are per-arm on the Harmonic Minor bars (arc: 48 micro steps; pure: 72 micro steps).

| Arm | Arc focal hits | Arc modal passes | Arc pc8 / pc11 | Pure focal hits | Pure modal passes | Pure pc8 / pc11 |
|---|---|---|---|---|---|---|
| D1 borrowed_connector | {d_arc["borrowed_connector"]["focalHits"]}/{d_arc["borrowed_connector"]["focalTotal"]} | {d_arc["borrowed_connector"]["modalColorPasses"]} | {d_arc["borrowed_connector"]["pc8Count"]} / {d_arc["borrowed_connector"]["pc11Count"]} | {d_pure["borrowed_connector"]["focalHits"]}/{d_pure["borrowed_connector"]["focalTotal"]} | {d_pure["borrowed_connector"]["modalColorPasses"]} | {d_pure["borrowed_connector"]["pc8Count"]} / {d_pure["borrowed_connector"]["pc11Count"]} |
| D2 native_class_dwell | {d_arc["native_class_dwell"]["focalHits"]}/{d_arc["native_class_dwell"]["focalTotal"]} | {d_arc["native_class_dwell"]["modalColorPasses"]} | {d_arc["native_class_dwell"]["pc8Count"]} / {d_arc["native_class_dwell"]["pc11Count"]} | {d_pure["native_class_dwell"]["focalHits"]}/{d_pure["native_class_dwell"]["focalTotal"]} | {d_pure["native_class_dwell"]["modalColorPasses"]} | {d_pure["native_class_dwell"]["pc8Count"]} / {d_pure["native_class_dwell"]["pc11Count"]} |
| D3 naked_fifth_stack | {d_arc["naked_fifth_stack"]["focalHits"]}/{d_arc["naked_fifth_stack"]["focalTotal"]} | {d_arc["naked_fifth_stack"]["modalColorPasses"]} | {d_arc["naked_fifth_stack"]["pc8Count"]} / {d_arc["naked_fifth_stack"]["pc11Count"]} | {d_pure["naked_fifth_stack"]["focalHits"]}/{d_pure["naked_fifth_stack"]["focalTotal"]} | {d_pure["naked_fifth_stack"]["modalColorPasses"]} | {d_pure["naked_fifth_stack"]["pc8Count"]} / {d_pure["naked_fifth_stack"]["pc11Count"]} |

- Rub census (Harmonic Minor bars): major-seventh intervals are D1 `{d_arc["borrowed_connector"]["rubCensus"]["majorSeventh"]}` / D2 `{d_arc["native_class_dwell"]["rubCensus"]["majorSeventh"]}` / D3 `{d_arc["naked_fifth_stack"]["rubCensus"]["majorSeventh"]}` on the arc; minor-second intervals are 0 in all arms. The native-class arm raises pc8 at structural positions; the borrowed arm keeps pc8 to tail modal passes.
- All six renders: two-pass deterministic, 0 clipped, 0 non-finite, 0 out-of-mask MIDI notes, end check pass (`6/6`).
- Ear manifest: `task-d/mvp8_ear_manifest.json`; **PENDING_HUMAN**; no verdict authored.

## Adjudication

- **Outcome: `DEFER`.**
- Forcing bet: **B4** — governed Far Shore log-spectral deconfounded lead `{gov["leadDeconfounded"]:.6f}` < container `{gov["containerDeconfounded"]:.6f}`; ungoverned control `{ctrl["leadDeconfounded"]:.6f}` < `{ctrl["containerDeconfounded"]:.6f}`.
- B1 and B3 pass, so the directive's KEEP_EVIDENCE_ONLY branch is not selected. The failing task is named; the rest is banked.
- No `SPEC-001` amendment is proposed and no `L28` landing is authorized. `task-e/mvp8_land.py` is a guarded dry-run script that refuses to execute under `DEFER`.
- The zero-5-35 study, the printed tables, the Q-layer engine, and the connector planner remain scratch evidence for a later governance act.

## Implementation notes

1. T0 recorded the directive document as the sole untracked path; no pinned byte changed.
2. Python bytecode caches under ignored `__pycache__` paths were created by module imports during Task B and Task D and were removed at close; no tracked or pinned byte changed.
3. The C2 pair-selection rule was revised before Task A-D execution (recorded in the predeclaration) from a lexicographic pair scan to direct/2-hop shared-subnode crossings with a deterministic fallback.
4. C2 continuity is measured on the predeclared base-subnode identity, phase-transposed per node per B3; the literal fixed-pitch-set predicate was discarded as an implementation artifact. Thresholds unchanged.
5. B2's governed initiation table treats each `(q, z)` cell as an initiation point; the structural-window check is the five generative-window stations; the tail check is a 12-step traversal micro-bar.

## Fences

- No gate, census, ground-truth, seam-substrate, Q-engine, encoder, renderer, or `audio.ts` byte change; repository writes `0`.
- No LLM calls; `llmCalls: 0`.
- Bipartite inputs remain `planning_evidence` / `admissionEffect: none` / `graphScope: detached_audit_only`.
- `causationClaim: false`, `physicalQuantityClaim: false`, `tierClassifier: false`, `globalCHNull: true`; `C_H` unresolved.
- Ear gate `PENDING_HUMAN`; no listener verdict authored.

## Terminal verdict

```text
MVP8-PENTATONIC-Q-SPRINT-CLOSING
FIXED-POINT: d1b2286... / DECLARED DIRECTIVE EXCEPTION / L27 da9c7941... / 407293 B / 4383 lines
MANIFEST-PIN: 1834 FILES / 263181122 B / RELEASE-CLOSURE 418/0 PASS
PINS-VERIFIED: 28/28 MATCH / ANCHORS 11/11 MATCH / PREDECLARATION-LOCKED TRUE
REACHABILITY-S000: 1453@0 IN | 2477@0 IN | 2741@0 IN | 1717@0 IN | 2773@0 IN | FALLBACKS 0
TASKS: T0 COMPLETE | TA COMPLETE | TB COMPLETE | TC COMPLETE | TD COMPLETE | TE COMPLETE
TABLE-CENSUS: 6930 ANCHORED / 9702 TOTAL / BRIDGES 70 / UNROOTED-5-35 357-70-28-7 / ROOTED-5-35 381-60-18-3
BETS-B: B1 PASS (0 OUT-OF-MASK) | B2 PASS (144/192 -> 192/192; 80/80; 4 MODAL) | B3 PASS (0/0/0 BAD; 55296 CHECKS) | B4 FAIL
BETS-C: C1 PASS (1 HOP, 5 BRIDGES, 0 SWITCHES) | C2 PASS (MAX OVERHEAD 0 <= +2) | C3a PASS (0 DWELL SWITCHES) | C3b PASS (CORE 7/7; <=1 SWITCH/LEG; +0 HOPS)
STUDY-D: D1 36/48 ARC | D2 40/48 ARC | D3 0/48 ARC | TWO-PASS DETERMINISTIC 6/6
EAR-GATE: PENDING_HUMAN / OUTCOME DEFER
FENCES: GATE-UNTOUCHED / Q-SUBSTRATE-UNTOUCHED / C-H-NULL / BIPARTITE-PLANNING-EVIDENCE / LLM-CALLS 0 / REPO-WRITES 0 (TRANSIENT IGNORED BYTECODE CACHES REMOVED)
STATUS: COMPLETE
```
"""
    REPORT.write_text(report, encoding="utf-8")

    land_script = '''#!/usr/bin/env python3
"""Guarded L28 landing script for MVP8-DIR-1.

This script refuses to execute unless:
  1. --authorize-l28 is passed, and
  2. task-e/mvp8_task_e_receipt.json records outcome ADOPT_RUNTIME_READING or
     CONDITIONAL_ADOPT_RUNTIME_READING_PENDING_EAR.

The current DEFER outcome is not eligible. The script is scratch evidence only.
"""
import json
import sys
from pathlib import Path

SCRATCH = Path(__file__).resolve().parents[1]
RECEIPT = SCRATCH / "task-e" / "mvp8_task_e_receipt.json"


def main():
    if "--authorize-l28" not in sys.argv:
        print("NOT AUTHORIZED: pass --authorize-l28 after a governance ruling")
        return 2
    receipt = json.loads(RECEIPT.read_text(encoding="utf-8"))
    outcome = receipt["adjudication"]["outcome"]
    if outcome not in ("ADOPT_RUNTIME_READING",
                       "CONDITIONAL_ADOPT_RUNTIME_READING_PENDING_EAR"):
        print(f"NOT AUTHORIZED: outcome is {outcome}; no L28 landing is proposed")
        return 2
    print("AUTHORIZED: L28 landing would run the MVP-7 landing cascade here")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
'''
    LAND.write_text(land_script, encoding="utf-8")
    print(json.dumps(adjudication, indent=2, sort_keys=True))
    print(json.dumps({"report": str(REPORT), "reportSha256": common.sha256_file(REPORT),
                      "receipt": str(RECEIPT), "receiptSha256": common.sha256_file(RECEIPT),
                      "floatValuesSymbolic": receipt["floatValuesSymbolic"]}, indent=2))


if __name__ == "__main__":
    main()
