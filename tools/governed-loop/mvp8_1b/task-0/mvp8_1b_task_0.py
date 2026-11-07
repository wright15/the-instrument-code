#!/usr/bin/env python3
"""MVP8.1b-DIR-1 Task 0: fixed point, MVP8.1 evidence pins, ear gate, and the
corrected B4-prime predeclaration lock. Scratch-only; read-only against the repo."""
import json
import subprocess
import sys
from pathlib import Path

MVP8 = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_pentatonic_q")
MVP81 = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_1_stem")
ROOT = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_1b_metric_fix")
sys.path.insert(0, str(MVP8))
sys.path.insert(0, str(MVP8 / "task-0"))
import mvp8_common as common
import mvp8_task_0 as m8t0

TASK0 = ROOT / "task-0"
PREDECL = TASK0 / "mvp8_1b_predeclared_bets.json"
RECEIPT = TASK0 / "mvp8_1b_task_0_receipt.json"

DIRECTIVE_PATHS = {
    "scrum/plan/mvp8-dir-1-rev2.md",
    "scrum/plan/mvp8-1-dir-1-rev1.md",
    "scrum/plan/mvp8-1b-dir-1-rev1.md",
}
SCORED_MIN_OFFICES = 2
SCORED_MIN_BARS = 3
B4A_THRESHOLD = 0.90


def git(*args):
    return subprocess.run(["git", "-C", str(common.REPO), *args],
                          capture_output=True, text=True, check=True).stdout


def trace_stats(trace_path, planner):
    records = [json.loads(line) for line in Path(trace_path).read_text(encoding="utf-8").splitlines()]
    micro = [r for r in records if r.get("recordType") == "micro"]
    bars = {}
    for record in micro:
        bar = int(record["bar"])
        bars.setdefault(bar, record["node"])
    offices = sorted({planner.office.get(int(node.split("@")[0])) for node in bars.values()})
    return {
        "bars": len(bars),
        "offices": [office for office in offices if office],
        "officeCount": len([office for office in offices if office]),
    }


def main():
    TASK0.mkdir(parents=True, exist_ok=True)
    head = git("rev-parse", "HEAD").strip()
    porcelain = git("status", "--porcelain")
    lines = [line for line in porcelain.splitlines() if line.strip()]
    allowed = {f"?? {path}" for path in DIRECTIVE_PATHS}
    unexpected = [line for line in lines if line not in allowed]
    if head != m8t0.EXPECTED_HEAD:
        common.stop("S-1", f"HEAD {head}")
    if unexpected:
        common.stop("S-1", f"tree not clean: {unexpected}")
    exception = {
        "declared": True,
        "untracked": sorted(line[3:] for line in lines),
        "reason": "the MVP8, MVP8.1, and MVP8.1b directive documents were written before execution at the Planning Seat's request; no pinned byte, HEAD, ledger, manifest, checksum, or validation artifact changed",
        "pinnedBytesUnchanged": True,
    }

    ledger = common.REPO / "provenance/DECISION_LEDGER.md"
    if common.sha256_file(ledger) != m8t0.EXPECTED_LEDGER:
        common.stop("S-1", "ledger hash")
    if ledger.stat().st_size != m8t0.EXPECTED_LEDGER_BYTES:
        common.stop("S-1", "ledger bytes")
    ledger_lines = len(ledger.read_text(encoding="utf-8").splitlines())
    if ledger_lines != m8t0.EXPECTED_LEDGER_LINES:
        common.stop("S-1", "ledger lines")
    manifest = json.loads((common.REPO / "MANIFEST.json").read_text(encoding="utf-8"))
    if (common.sha256_file(common.REPO / "MANIFEST.json") != m8t0.EXPECTED_MANIFEST
            or manifest["fileCount"] != m8t0.EXPECTED_MANIFEST_FILES
            or manifest["totalBytes"] != m8t0.EXPECTED_MANIFEST_BYTES):
        common.stop("S-1", "manifest")
    if common.sha256_file(common.REPO / "CHECKSUMS.sha256") != m8t0.EXPECTED_CHECKSUMS:
        common.stop("S-1", "checksums")
    completion = json.loads((common.REPO / "qa/completion-validation-report.json").read_text(encoding="utf-8"))
    if (common.sha256_file(common.REPO / "qa/completion-validation-report.json") != m8t0.EXPECTED_COMPLETION
            or not completion.get("passed")):
        common.stop("S-1", "completion report")
    if common.sha256_file(common.REPO / "qa/mvp7_intention_landing_receipt.json") != m8t0.EXPECTED_LANDING:
        common.stop("S-1", "landing receipt")
    arch = common.REPO / "docs/ARCHITECTURE_MAP.md"
    if common.sha256_file(arch) != m8t0.EXPECTED_ARCH or arch.stat().st_size != m8t0.EXPECTED_ARCH_BYTES:
        common.stop("S-1", "architecture map")

    mvp7_task0 = common.load_module("mvp81b_mvp7_task0", common.REPO_INPUTS["mvp7_task_0"])
    pins = dict(mvp7_task0.PINS)
    pins["derived/hypergraph/bipartite-inclusion-v1.json"] = (
        m8t0.EXPECTED_PENTATONIC, m8t0.EXPECTED_PENTATONIC_BYTES)
    pins["qa/pentatonic-binding-audit-closure.json"] = (
        m8t0.EXPECTED_CLOSURE, m8t0.EXPECTED_CLOSURE_BYTES)
    pin_results = {}
    for rel, (expected_hash, expected_bytes) in pins.items():
        path = common.REPO / rel
        actual_hash = common.sha256_file(path)
        actual_bytes = path.stat().st_size
        match = actual_hash == expected_hash and actual_bytes == expected_bytes
        pin_results[rel] = {
            "expectedSha256": expected_hash, "actualSha256": actual_hash,
            "expectedBytes": expected_bytes, "actualBytes": actual_bytes,
            "match": match,
        }
        if not match:
            common.stop("S-1", f"pin {rel}")
    mvp2_lines = (common.REPO / "tools/governed-loop/mvp2.py").read_text(encoding="utf-8").splitlines()
    anchor_results = {}
    for line_no, text in mvp7_task0.ANCHORS.items():
        actual = mvp2_lines[line_no - 1]
        anchor_results[str(line_no)] = {"expected": text, "actual": actual,
                                        "match": actual == text}
        if actual != text:
            common.stop("S-3", f"anchor {line_no}")

    planner = common.build_planner()
    core = common.strong_core(planner)
    if (core["reachableNodes"], core["strongCoreNodes"], core["oneWayNodes"],
            core["governedStrongCoreNodes"], core["boundaryStrongCoreNodes"]) != (3204, 2928, 276, 2388, 540):
        common.stop("S-4", f"strong core {core}")

    # ---- MVP8.1 evidence pins -------------------------------------------
    t0_path = MVP81 / "task-0/mvp8_1_task_0_receipt.json"
    ta_path = MVP81 / "task-a/mvp8_1_task_a_receipt.json"
    tb_path = MVP81 / "task-b/mvp8_1_task_b_receipt.json"
    te_path = MVP81 / "task-e/mvp8_1_task_e_receipt.json"
    for path in (t0_path, ta_path, tb_path, te_path):
        if not path.exists():
            common.stop("S-2", f"missing MVP8.1 receipt {path}")
    t0 = json.loads(t0_path.read_text(encoding="utf-8"))
    ta = json.loads(ta_path.read_text(encoding="utf-8"))
    tb = json.loads(tb_path.read_text(encoding="utf-8"))
    te = json.loads(te_path.read_text(encoding="utf-8"))
    if te["adjudication"]["outcome"] != "DEFER":
        common.stop("S-2", f"MVP8.1 outcome is not DEFER: {te['adjudication']['outcome']}")

    evidence_pins = {}
    for rel, row in t0["mvp8EvidencePins"].items():
        path = MVP8 / rel
        actual = common.sha256_file(path)
        if actual != row["sha256"] or path.stat().st_size != row["bytes"]:
            common.stop("S-2", f"MVP8 evidence drift {rel}")
        evidence_pins[rel] = {"sha256": actual, "bytes": path.stat().st_size}
    if tb["predeclarationSha256"] != common.sha256_file(MVP81 / "task-0/mvp8_1_predeclared_bets.json"):
        common.stop("S-2", "MVP8.1 predeclaration drift")
    if tb["taskAReceiptSha256"] != common.sha256_file(ta_path):
        common.stop("S-2", "MVP8.1 Task A receipt drift")

    stem_rows = []
    for row in ta["stems"]:
        label = row["label"]
        lead_path = MVP81 / row["lead"]["path"]
        pad_path = MVP81 / row["pad"]["path"]
        for path, expected, kind in (
                (lead_path, row["lead"]["sha256"], "lead"),
                (pad_path, row["pad"]["sha256"], "pad")):
            if not path.exists():
                common.stop("S-5", f"missing stem {path}")
            if common.sha256_file(path) != expected:
                common.stop("S-5", f"stem hash drift {path}")
        stats = trace_stats(MVP8 / row["tracePath"], planner)
        scored = (stats["officeCount"] >= SCORED_MIN_OFFICES
                  and stats["bars"] >= SCORED_MIN_BARS)
        reason = ("scored" if scored
                  else f"excluded: officeCount {stats['officeCount']} < {SCORED_MIN_OFFICES} or bars {stats['bars']} < {SCORED_MIN_BARS}")
        stem_rows.append({
            "label": label,
            "tracePath": row["tracePath"],
            "bars": stats["bars"],
            "officeCount": stats["officeCount"],
            "offices": stats["offices"],
            "scored": scored,
            "reason": reason,
            "leadSha256": row["lead"]["sha256"],
            "padSha256": row["pad"]["sha256"],
        })
    scored_rows = [row for row in stem_rows if row["scored"]]
    excluded_rows = [row for row in stem_rows if not row["scored"]]
    if len(stem_rows) != 12 or len(scored_rows) != 5:
        common.stop("S-5", f"stem scoring {len(stem_rows)}/{len(scored_rows)}")

    ear = json.loads((MVP8 / "task-d/mvp8_ear_manifest.json").read_text(encoding="utf-8"))
    if ear.get("status") != "SIGNED_HUMAN" or not ear.get("signedBy"):
        common.stop("S-7", "ear manifest unsigned")
    ear_gate = {
        "status": ear["status"],
        "signedBy": ear["signedBy"],
        "signedAt": ear.get("signedAt"),
        "q9Question": ear.get("q9Question"),
        "q9Verdict": ear.get("questions", {}).get("Q9"),
        "sha256": common.sha256_file(MVP8 / "task-d/mvp8_ear_manifest.json"),
    }

    predecl = {
        "schemaVersion": "governed-loop.mvp8_1b-predeclared-bets.v1",
        "directive": "MVP8.1b-DIR-1",
        "revision": 1,
        "status": "locked-before-evaluation",
        "openingHead": m8t0.EXPECTED_HEAD,
        "layer": common.GUARD["layer"],
        "guards": common.GUARD,
        "preExecutionCorrection": {
            "from": "B4a: office-deconfounded r(lead-stem log-centroid, bar pcSum) >= 0.90 on all 12 stems",
            "to": "B4a': office-deconfounded r(lead-stem log-centroid, mean emitted pc) >= 0.90 on scored stems with >=2 offices and >=3 bars",
            "reason": "the MVP8.1 pcSum proxy is degenerate when office deconfounding has zero residual variance (single-office or two-bar stems) and pcSum is a coarse lead-tracking signal; the MVP8.1 result is not amended retroactively",
            "thresholdsChanged": False,
            "at": "before any MVP8.1b measurement",
        },
        "scoredStemRule": {
            "minOffices": SCORED_MIN_OFFICES,
            "minBars": SCORED_MIN_BARS,
            "metric": "mean emitted pc",
            "threshold": B4A_THRESHOLD,
        },
        "scoredStems": [row["label"] for row in scored_rows],
        "excludedStems": [{"label": row["label"], "reason": row["reason"]}
                          for row in excluded_rows],
        "earGate": ear_gate,
        "carriedFromMVP81": {
            "directive": "MVP8.1-DIR-1",
            "outcome": te["adjudication"]["outcome"],
            "primaryStemLaw3": te["adjudication"]["primaryStemLaw3"],
            "taskBReceiptSha256": common.sha256_file(tb_path),
            "taskEReceiptSha256": common.sha256_file(te_path),
        },
        "bets": {
            "B4aPrime": {
                "metric": "mean emitted pc",
                "threshold": B4A_THRESHOLD,
                "scoredStems": [row["label"] for row in scored_rows],
                "passRule": "every scored stem has office-deconfounded r(lead-stem log-centroid, mean emitted pc) >= 0.90",
            },
            "B4bCarried": {"pass": bool(tb["symbolic"]["B4b"]["pass"])},
            "B4cCarried": {
                "governedAgreements": tb["symbolic"]["B4c"]["governedAgreements"],
                "governedComparisons": tb["symbolic"]["B4c"]["governedComparisons"],
                "controlAgreements": tb["symbolic"]["B4c"]["controlAgreements"],
                "controlComparisons": tb["symbolic"]["B4c"]["controlComparisons"],
                "diagnosticOnly": True,
            },
            "B4dCarried": {"pass": bool(tb["symbolic"]["B4d"]["pass"])},
            "carried": {
                "A": True, "B1": True, "B2": True, "B3": True,
                "C1": True, "C2": True, "C3a": True, "C3b": True, "D": True,
            },
        },
        "outcomes": {
            "ADOPT_RUNTIME_READING": "B4a' PASS and B4b/B4d carried PASS and ear signed",
            "DEFER": "B4a' fails",
            "KEEP_EVIDENCE_ONLY": "a carried hard check fails",
        },
        "fences": {
            "repoReadOnly": True,
            "llmCalls": 0,
            "noNewRenders": True,
            "noEngineByteChange": True,
            "noLookupByteChange": True,
            "noNewListening": True,
            "landingSeparateAuthorization": True,
            "bipartitePlanningEvidenceOnly": True,
        },
    }
    PREDECL.write_text(json.dumps(predecl, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    receipt = {
        "schemaVersion": "governed-loop.mvp8_1b-task-0.v1",
        "directive": "MVP8.1b-DIR-1",
        "task": "MVP8.1b-T0",
        "status": "COMPLETE",
        "guardFlags": common.GUARD,
        "opening": {
            "head": head,
            "treeClean": not lines,
            "workingTreeException": exception,
            "ledgerSha256": m8t0.EXPECTED_LEDGER,
            "ledgerBytes": ledger.stat().st_size,
            "ledgerLines": ledger_lines,
            "manifestSha256": m8t0.EXPECTED_MANIFEST,
            "manifestFiles": manifest["fileCount"],
            "manifestBytes": manifest["totalBytes"],
            "checksumsSha256": m8t0.EXPECTED_CHECKSUMS,
            "completionReportSha256": m8t0.EXPECTED_COMPLETION,
            "completionPassed": True,
            "landingReceiptSha256": m8t0.EXPECTED_LANDING,
        },
        "pins": pin_results,
        "pinsVerified": sum(1 for row in pin_results.values() if row["match"]),
        "pinsTotal": len(pin_results),
        "anchors": anchor_results,
        "anchorsVerified": sum(1 for row in anchor_results.values() if row["match"]),
        "strongCore": {
            "reachableNodes": core["reachableNodes"],
            "strongCoreNodes": core["strongCoreNodes"],
            "oneWayNodes": core["oneWayNodes"],
            "governedStrongCoreNodes": core["governedStrongCoreNodes"],
            "boundaryStrongCoreNodes": core["boundaryStrongCoreNodes"],
        },
        "mvp81EvidencePins": evidence_pins,
        "mvp81EvidencePinCount": len(evidence_pins),
        "stems": stem_rows,
        "scoredStemCount": len(scored_rows),
        "excludedStemCount": len(excluded_rows),
        "earGate": ear_gate,
        "predeclaration": {
            "path": "task-0/mvp8_1b_predeclared_bets.json",
            "sha256": common.sha256_file(PREDECL),
            "status": "locked-before-evaluation",
        },
        "llmCalls": 0,
        "stopRules": [],
    }
    symbolic = {key: value for key, value in receipt.items() if key != "guardFlags"}
    receipt["floatValuesSymbolic"] = len(common.find_floats(symbolic))
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "COMPLETE",
        "pinsVerified": receipt["pinsVerified"],
        "pinsTotal": receipt["pinsTotal"],
        "anchorsVerified": receipt["anchorsVerified"],
        "strongCore": receipt["strongCore"],
        "mvp81EvidencePins": len(evidence_pins),
        "scoredStems": [row["label"] for row in scored_rows],
        "excludedStems": [row["label"] for row in excluded_rows],
        "earGate": ear_gate["status"],
        "predeclarationSha256": receipt["predeclaration"]["sha256"],
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
