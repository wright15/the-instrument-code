#!/usr/bin/env python3
"""MVP8.1-DIR-1 Task 0: fixed point, MVP8 evidence pins, ear gate, and the
B4-prime predeclaration lock. Scratch-only; read-only against the repository."""
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, "/home/erick/workspace/scratch-governed-loop-run/mvp8_pentatonic_q")
sys.path.insert(0, "/home/erick/workspace/scratch-governed-loop-run/mvp8_pentatonic_q/task-0")
import mvp8_common as common
import mvp8_task_0 as m8t0

TASK0 = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_1_stem/task-0")
PREDECL = TASK0 / "mvp8_1_predeclared_bets.json"
RECEIPT = TASK0 / "mvp8_1_task_0_receipt.json"
MVP8 = common.SCRATCH

DIRECTIVE_PATHS = {
    "scrum/plan/mvp8-dir-1-rev2.md",
    "scrum/plan/mvp8-1-dir-1-rev1.md",
}


def git(*args):
    return subprocess.run(["git", "-C", str(common.REPO), *args],
                          capture_output=True, text=True, check=True).stdout


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
        "reason": "the MVP8 and MVP8.1 directive documents were written before execution at the Planning Seat's request; no pinned byte, HEAD, ledger, manifest, checksum, or validation artifact changed",
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

    mvp7_task0 = common.load_module("mvp81_mvp7_task0", common.REPO_INPUTS["mvp7_task_0"])
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
    lines_mvp2 = (common.REPO / "tools/governed-loop/mvp2.py").read_text(encoding="utf-8").splitlines()
    anchor_results = {}
    for line_no, text in mvp7_task0.ANCHORS.items():
        actual = lines_mvp2[line_no - 1]
        anchor_results[str(line_no)] = {"expected": text, "actual": actual,
                                        "match": actual == text}
        if actual != text:
            common.stop("S-3", f"anchor {line_no}")

    planner = common.build_planner()
    core = common.strong_core(planner)
    if (core["reachableNodes"], core["strongCoreNodes"], core["oneWayNodes"],
            core["governedStrongCoreNodes"], core["boundaryStrongCoreNodes"]) != (3204, 2928, 276, 2388, 540):
        common.stop("S-4", f"strong core {core}")

    # ---- MVP8 evidence pins ---------------------------------------------
    mvp8_pins = {}
    for rel in [
        "task-0/mvp8_task_0_receipt.json",
        "task-0/mvp8_predeclared_bets.json",
        "task-a/mvp8_task_a_receipt.json",
        "task-a/mvp8_pentatonic_lookup_v1.json",
        "task-b/mvp8_task_b_receipt.json",
        "task-b/mvp8_pentatonic_q_engine.py",
        "task-c/mvp8_task_c_receipt.json",
        "task-d/mvp8_task_d_receipt.json",
        "task-d/mvp8_ear_manifest.json",
        "task-e/mvp8_task_e_receipt.json",
        "task-e/MVP8-PENTATONIC-Q-CLOSING-REPORT.md",
    ]:
        path = MVP8 / rel
        if not path.exists():
            common.stop("S-2", f"missing MVP8 evidence {rel}")
        mvp8_pins[rel] = {"sha256": common.sha256_file(path),
                          "bytes": path.stat().st_size}
    traces = sorted(str(path.relative_to(MVP8)) for path in MVP8.glob("task-*/traces/*.jsonl"))
    if len(traces) != 12:
        common.stop("S-2", f"expected 12 traces, found {len(traces)}")
    for rel in traces:
        path = MVP8 / rel
        mvp8_pins[rel] = {"sha256": common.sha256_file(path),
                          "bytes": path.stat().st_size}
    tb = json.loads((MVP8 / "task-b/mvp8_task_b_receipt.json").read_text(encoding="utf-8"))
    tc = json.loads((MVP8 / "task-c/mvp8_task_c_receipt.json").read_text(encoding="utf-8"))
    td = json.loads((MVP8 / "task-d/mvp8_task_d_receipt.json").read_text(encoding="utf-8"))
    ta = json.loads((MVP8 / "task-a/mvp8_task_a_receipt.json").read_text(encoding="utf-8"))
    t0m8 = json.loads((MVP8 / "task-0/mvp8_task_0_receipt.json").read_text(encoding="utf-8"))
    trace_expectations = {
        "task-b/traces/far-shore-pentatonic.jsonl": tb["acoustic"]["farShoreGoverned"]["traceSha256"],
        "task-b/traces/far-shore-ungoverned-control.jsonl": tb["acoustic"]["farShoreUngoverned"]["traceSha256"],
        "task-b/traces/b1-andalusian-pentatonic.jsonl": tb["acoustic"]["cadences"]["B1_andalusian"]["traceSha256"],
        "task-b/traces/b2-borrowed-minor-pentatonic.jsonl": tb["acoustic"]["cadences"]["B2_borrowed_minor"]["traceSha256"],
        "task-c/traces/c1-aeolian-harmonic-minor.jsonl": tc["C1"]["render"]["traceSha256"],
        "task-c/traces/c3b-major-mode-triangle.jsonl": tc["C3b"]["render"]["traceSha256"],
    }
    for arm, probes in td["arms"].items():
        for suffix, row in probes.items():
            trace_expectations[f"task-d/traces/{row['renderRef']['label']}.jsonl"] = row["renderRef"]["traceSha256"]
    for rel, expected in trace_expectations.items():
        actual = mvp8_pins[rel]["sha256"]
        if actual != expected:
            common.stop("S-2", f"trace pin {rel}")
    if mvp8_pins["task-a/mvp8_pentatonic_lookup_v1.json"]["sha256"] != ta["lookup"]["sha256"]:
        common.stop("S-2", "lookup pin")
    if mvp8_pins["task-0/mvp8_predeclared_bets.json"]["sha256"] != t0m8["predeclaration"]["sha256"]:
        common.stop("S-2", "MVP8 predeclaration pin")

    # ---- ear gate --------------------------------------------------------
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
        "note": "The signed verdict is human-authored; the q9Question field retains the framework placeholder.",
    }

    predecl = {
        "schemaVersion": "governed-loop.mvp8_1-predeclared-bets.v1",
        "directive": "MVP8.1-DIR-1",
        "revision": 1,
        "status": "locked-before-evaluation",
        "openingHead": m8t0.EXPECTED_HEAD,
        "layer": common.GUARD["layer"],
        "guards": common.GUARD,
        "carriedFromMVP8": {
            "directive": "MVP8-DIR-1",
            "revision": 2,
            "outcome": "DEFER",
            "failingBet": "B4",
            "passing": ["A", "B1", "B2", "B3", "C1", "C2", "C3a", "C3b", "D"],
            "mvp8TaskEReceiptSha256": mvp8_pins["task-e/mvp8_task_e_receipt.json"]["sha256"],
        },
        "earGate": ear_gate,
        "traces": traces,
        "bets": {
            "B4a_stemSelfTracking": {
                "threshold": 0.90,
                "appliesTo": "all 12 lead stems",
                "passRule": "office-deconfounded r(lead-stem log-centroid, lead pcSum) >= 0.90 on every stem",
            },
            "B4b_stemLaw3": {
                "source": "task-b/traces/far-shore-pentatonic.jsonl",
                "control": "task-b/traces/far-shore-ungoverned-control.jsonl",
                "passRule": "governed (r_lead - r_container) > 0 AND governed margin >= ungoverned margin",
                "diagnostic": "ungoverned margin is reported; it is expected positive for a stem",
            },
            "B4c_directionalDiagnostic": {
                "appliesTo": "full-mix Far Shore governed and ungoverned",
                "measure": "sign(Δ log-centroid) vs sign(Δ office registerOffset) across adjacent sections",
                "passRule": "report-only; cannot force DEFER",
            },
            "B4d_stemIntegrity": {
                "passRule": "all stems mono 16-bit 44.1 kHz, two-pass deterministic, 0 clipped, 0 non-finite",
            },
            "carried": {
                "A": True, "B1": True, "B2": True, "B3": True,
                "C1": True, "C2": True, "C3a": True, "C3b": True, "D": True,
            },
        },
        "outcomes": {
            "ADOPT_RUNTIME_READING": "carried PASS and B4a/B4b/B4d PASS and ear signed",
            "CONDITIONAL_ADOPT_RUNTIME_READING_PENDING_EAR": "carried PASS and B4a/B4b/B4d PASS and ear unsigned",
            "DEFER": "B4a, B4b, or B4d fails",
            "KEEP_EVIDENCE_ONLY": "B1 or B3 re-verification fails",
        },
        "fences": {
            "repoReadOnly": True,
            "llmCalls": 0,
            "noEngineByteChange": True,
            "noLookupByteChange": True,
            "noRendererByteChange": True,
            "noNewTraces": True,
            "earVerdictHumanAuthored": True,
            "bipartitePlanningEvidenceOnly": True,
        },
    }
    PREDECL.write_text(json.dumps(predecl, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    receipt = {
        "schemaVersion": "governed-loop.mvp8_1-task-0.v1",
        "directive": "MVP8.1-DIR-1",
        "task": "MVP8.1-T0",
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
        "mvp8EvidencePins": mvp8_pins,
        "mvp8EvidencePinCount": len(mvp8_pins),
        "earGate": ear_gate,
        "predeclaration": {
            "path": "task-0/mvp8_1_predeclared_bets.json",
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
        "mvp8EvidencePins": len(mvp8_pins),
        "earGate": ear_gate["status"],
        "predeclarationSha256": receipt["predeclaration"]["sha256"],
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
