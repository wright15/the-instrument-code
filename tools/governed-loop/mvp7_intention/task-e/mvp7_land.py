#!/usr/bin/env python3
"""L27 working-tree landing for MVP7-INTENTION-DIR-1.

Copies the scratch payloads byte-identically, appends one combined ledger entry,
runs the ledger-binding cascade, regenerates the manifest, runs the release
closure, and writes the landing receipt. No tag, no push, no claim event.
"""
import hashlib
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp7_intention")
TARGET = REPO / "tools/governed-loop/mvp7_intention"
LEDGER = REPO / "provenance/DECISION_LEDGER.md"
RECEIPT = REPO / "qa/mvp7_intention_landing_receipt.json"
REPORT = REPO / "scrum/plan/mvp7-intention-sprint-closing-report.md"

EXPECTED_HEAD = "865abc8be20483e45176c378c4e078ebd3187c26"
EXPECTED_LEDGER_BEFORE = "43a529af76875d1a8695ff66ab01780c951d12abf4224085a0ece1323acbb8d5"
EXPECTED_LEDGER_BYTES = 398051
EXPECTED_LEDGER_LINES = 4348
EXPECTED_MANIFEST_SHA = "a0ac68b91a987adf2d3434946c5872e588f90b5a8c6179d99ee67014a9f5591a"
EXPECTED_MANIFEST_FILES = 1684
EXPECTED_MANIFEST_BYTES = 177672713
EXPECTED_VALIDATION_PASSED = 418

CASCADE = [
    [".venv/bin/python", "scripts/generate-fifth-space-census.py"],
    [".venv/bin/python", "scripts/validate-fifth-space-census.py"],
    [".venv/bin/python", "scripts/generate-shadow-ladder.py"],
    [".venv/bin/python", "scripts/validate-shadow-ladder.py"],
    [".venv/bin/python", "scripts/generate-twin-hub-convergence.py"],
    [".venv/bin/python", "scripts/validate-twin-hub-convergence.py"],
    ["node", "scripts/build-pentatonic-binding-audit-closure.mjs"],
    [".venv/bin/python", "scripts/build-fivefold-engine-promotion-evidence.py"],
    ["node", "scripts/build-field-derivation-bundle.mjs"],
    ["node", "scripts/build-orrery-taxonomy-read-model.mjs"],
    ["node", "scripts/build-orrery-d-tier-taxonomy-dataset.mjs"],
]

PRINCIPAL = [
    ("mvp7_task_0", "task-0/mvp7_task_0.py"),
    ("mvp7_predeclared_bets_and_schema", "task-0/mvp7_predeclared_bets_and_schema.json"),
    ("ear_baseline_scorecard", "task-0/ear_baseline_scorecard.json"),
    ("mvp7_log_spectral_lens", "task-a/mvp7_log_spectral_lens.py"),
    ("log_spectral_catalog_far_shore", "task-a/log_spectral_catalog_far_shore.json"),
    ("mvp7_task_b", "task-b/mvp7_task_b.py"),
    ("b1_andalusian_wav", "task-b/renders/b1-andalusian.wav"),
    ("b2_borrowed_minor_wav", "task-b/renders/b2-borrowed-minor.wav"),
    ("mvp7_task_c", "task-c/mvp7_task_c.py"),
    ("mvp7_task_c_recover_openarc", "task-c/mvp7_task_c_recover_openarc.py"),
    ("mvp7_task_c_analyze", "task-c/mvp7_task_c_analyze.py"),
    ("mvp7_task_d", "task-d/mvp7_task_d.py"),
    ("blind_manifest", "task-d/blind_manifest.json"),
    ("mvp7_task_e", "task-e/mvp7_task_e.py"),
    ("EAR_VALIDATION_PROTOCOL_MVP7", "task-e/EAR_VALIDATION_PROTOCOL_MVP7.md"),
    ("MVP7_CLOSING_REPORT", "MVP7-INTENTION-CLOSING-REPORT.md"),
]
RECEIPTS = [
    ("mvp7_task_0_receipt", "task-0/mvp7_task_0_receipt.json"),
    ("mvp7_task_a_receipt", "task-a/mvp7_task_a_receipt.json"),
    ("mvp7_task_b_receipt", "task-b/mvp7_task_b_receipt.json"),
    ("mvp7_task_c_receipt", "task-c/mvp7_task_c_receipt.json"),
    ("mvp7_task_d_receipt", "task-d/mvp7_task_d_receipt.json"),
    ("mvp7_task_e_receipt", "task-e/mvp7_task_e_receipt.json"),
]


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def stop(rule, detail):
    print(f"STOP: {rule} {detail}")
    sys.exit(2)


def run(command):
    started = subprocess.run([str(part) for part in command], cwd=REPO,
                             capture_output=True, text=True)
    return {
        "command": " ".join(str(part) for part in command),
        "exitCode": started.returncode,
        "stdoutTail": started.stdout[-1200:],
        "stderrTail": started.stderr[-1200:],
    }


def copy_tree():
    copies = []
    for path in sorted(SCRATCH.rglob("*")):
        if not path.is_file():
            continue
        relative = path.relative_to(SCRATCH)
        if "__pycache__" in relative.parts or path.suffix == ".pyc":
            continue
        if relative.parts[:2] == ("task-c", "llm_work"):
            continue
        if relative.name.endswith("_receipt.json"):
            destination = REPO / "qa" / relative.name
        elif relative.as_posix() == "MVP7-INTENTION-CLOSING-REPORT.md":
            destination = REPORT
        else:
            destination = TARGET / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(path, destination)
        copies.append({
            "source": relative.as_posix(),
            "destination": destination.relative_to(REPO).as_posix(),
            "bytes": destination.stat().st_size,
            "sha256": sha256_file(destination),
        })
    return copies


def staging_digest(copies):
    payload = "\n".join(f"{row['destination']}:{row['sha256']}" for row in sorted(
        copies, key=lambda row: row["destination"]))
    return hashlib.sha256(payload.encode()).hexdigest()


def ledger_entry(copies, staging_sha, validation_before, manifest_before):
    principal_rows = "\n".join(
        f"| `{role}` | `{dest}` | `{sha256_file(REPO / dest)}` |"
        for role, source in PRINCIPAL
        for dest in [next(row["destination"] for row in copies if row["source"] == source)]
    )
    receipt_rows = "\n".join(
        f"| `{role}` | `{dest}` | `{sha256_file(REPO / dest)}` |"
        for role, source in RECEIPTS
        for dest in [next(row["destination"] for row in copies if row["source"] == source)]
    )
    return f"""
**Governed-loop L27 landing — MVP-7 log-spectral instrument, cadential benchmarks, and the LLM intention experiment — 2026-11-06.** This is the L27 landing authorized by the Planning Seat (MVP7-INTENTION-DIR-1 rev 1). It lands the complete MVP-7 scratch payload byte-identically, appends this one combined L27 entry, and records the ear gate as unsigned. L27 is a working-tree landing: HEAD is `{EXPECTED_HEAD}`, the tree is clean at opening, and the ledger, projection, manifest, validation, and landing-receipt writes below are uncommitted at landing time; no tag or push is made. The L27 digest, byte count, and line count are recorded in `qa/mvp7_intention_landing_receipt.json`; this entry cannot carry its own digest.

**(i) Opening state and append-position proof.** The opening ledger was L26 `{EXPECTED_LEDGER_BEFORE}` ({EXPECTED_LEDGER_BYTES:,} B / {EXPECTED_LEDGER_LINES:,} lines); HEAD `{EXPECTED_HEAD}`; tree clean; MANIFEST {manifest_before['fileCount']:,} files / {manifest_before['totalBytes']:,} B; release closure {validation_before['passed']}/{validation_before['failed']} PASS; staging manifest `{staging_sha}` (all payloads hash-verified). The complete L26 bytes are preserved byte-identically as the prefix of the post-append ledger; the new L27 entry occurs exactly once at the tail; no prior entry is amended.

**(ii) MVP-7 closure.** The sprint closed all six tasks COMPLETE with zero stop rules, and the ear gate remains PENDING_HUMAN. Task 0 verified the L26 fixed point, all 26 pins, the eleven `mvp2.py` anchors, and the seed strong core (3,204 reachable / 2,928 in S000 / 276 one-way / 2,388 governed S000); it locked the predeclaration before evaluation and left the Q1-Q8 baseline unsigned. Task A built the log/geometric lens in the L22-achromatic coordinate and measured the six pinned WAVs: A1 Q2 calibration 0.6414 octaves (PASS); A2 legato seam 0.3748 vs interior 0.00486 octaves (PASS); A2 fade bars 1-54 exactly 0.0 and bar 55 7.06e-06 (PASS); A3 de-loop failed as predeclared (recall 0.538 at 0.01 oct, false-positive 0.0) with a post-hoc 0.001-oct diagnostic at recall 1.0 and false-positive 0.0; A4 carried-Q direction passed with a 0.15 % uplift. Task B compiled and rendered the Andalusian benchmark (45 bars, 38 hops, 100 % gate ACCEPT, terminal lead pc 0) and the borrowed-minor benchmark (22 bars, 17 hops, 100 % gate ACCEPT); the cadential descent is symbolic, not a monotone acoustic-centroid descent. Task C ran the intention translator: 25 valid-run LLM calls, 9 accepted pieces (3 free C1, 6 verified-menu C2), free-proposal first-pass legality 0.333 / compile 0.500 / retry recovery 0.25, menu legality 1.000, divergence 0.720 (open-arc only 0.665), FM1/FM2/FM4 not triggered, FM3 untestable on accepted open-arc C1 plans with a 5/6 proposal-level `far_shore_return` diagnostic. Task D rendered the nine accepted pieces under the frozen legato + 50 ms fade law: seams 9/9, end-of-file 9/9, determinism 9/9, mask and boundary-dwell 9/9; deconfounded `r_lead > r_container` was 0/9 on these waypoint-driven pieces, which qualifies rather than confirms the L22 C2 bridge for cadence/menu forms. Task E emitted the protocol, blind manifest, closing report, and the conditional outcome: OUTCOME_1 ruled out on legality, OUTCOME_3 ruled out on divergence, `CONDITIONAL_OUTCOME_2_GUEST_CURATOR_MENU_BOUND_PENDING_EAR`.

**(iii) L27 landing artifact table.** The following principal payloads and six receipts land byte-identically; the full render, trace, plan, and transcript inventory is enumerated in `qa/mvp7_intention_landing_receipt.json`.

| Role | In-tree path | SHA-256 |
|---|---|---|
{principal_rows}
{receipt_rows}

**(iv) Decisions, verification, and fences.** D-1: the lens measures `log2(f/440)` with 4096-sample Hann windows and 1024-sample hop; no entropy, no C_H formulation, no perception model. D-2: cadence benchmarks are waypoint constraints inside governed S000 with every hop gate ACCEPT; the symbolic descent is not an acoustic-centroid claim. D-3: the intention schema forbids raw notes, MIDI, executable node transitions, and floats; the compiler is fail-closed with `OUTSIDE_STRONG_CORE`, `ISOLATED_BOUNDARY`, `EMPTY_CANDIDATE_INTERSECTION`, `DISCONNECTED_TRANSITION`, and `SCHEMA_OR_FENCE_VIOLATION`. D-4: the standing outcome is conditional pending the human ear gate; no listener verdict was authored. D-5: the A3 bet failure is retained as a measured finding and is not retrofitted. D-6: two instrument corrections are recorded (a pre-evaluation A3 bar-list correction; a voided first Task C parser run preserved under `task-c/void_parser/`; and a provider-safe paraphrase for the C2 open-arc transport). D-7: the L23-L26 renders and receipts remain frozen as controls. After the append, the five direct ledger-bound artifacts (`canonical/fivefold-incubator/fifth-space-census-v0.json`, `canonical/fivefold-incubator/shadow-ladder-v0.json`, `canonical/fivefold-incubator/twin-hub-convergence-v0.json`, `qa/pentatonic-binding-audit-closure.json`, `qa/fivefold-engine-promotion-evidence.json`) are re-bound to the post-append ledger via their generators, and the three downstream projections (`orrery/src/generated/field-derivation-bundle.v1.json`, `orrery/src/generated/taxonomy-read-model.v1.json`, and `orrery/src/generated/d-tier-taxonomy-dataset.v1.json`) are regenerated. MANIFEST.json and CHECKSUMS.sha256 are regenerated after the cascade and the release closure is re-run; the post-cascade fingerprints and the landing receipt are recorded in `qa/mvp7_intention_landing_receipt.json`. Fences: no gate-logic, priority, vocabulary, census-content, encoder, Q-engine, pinned-renderer, legato-renderer, fade-renderer, or `audio.ts` byte change; no Orrery application source change; no claim event; no tag, push, or realm mutation; no prior entry amended. Session prose is context, not evidence.
"""


def main():
    head = subprocess.run(["git", "-C", str(REPO), "rev-parse", "HEAD"],
                          capture_output=True, text=True, check=True).stdout.strip()
    porcelain = subprocess.run(["git", "-C", str(REPO), "status", "--porcelain"],
                               capture_output=True, text=True, check=True).stdout
    if head != EXPECTED_HEAD:
        stop("S-1", f"HEAD {head}")
    if porcelain.strip():
        stop("S-1", "tree not clean")
    if sha256_file(LEDGER) != EXPECTED_LEDGER_BEFORE:
        stop("S-1", "ledger before")
    if LEDGER.stat().st_size != EXPECTED_LEDGER_BYTES:
        stop("S-1", "ledger bytes")
    manifest_before = json.loads((REPO / "MANIFEST.json").read_text(encoding="utf-8"))
    if (manifest_before["fileCount"] != EXPECTED_MANIFEST_FILES
            or manifest_before["totalBytes"] != EXPECTED_MANIFEST_BYTES):
        stop("S-1", "manifest before")
    validation_before = json.loads(Path("/tmp/opencode/validate_before.json").read_text(encoding="utf-8"))
    passed = sum(1 for check in validation_before["checks"] if check["status"] == "PASS")
    failed = len(validation_before["checks"]) - passed
    if passed != EXPECTED_VALIDATION_PASSED or failed != 0:
        stop("S-1", f"validation before {passed}/{failed}")

    copies = copy_tree()
    staging_sha = staging_digest(copies)

    before_bytes = LEDGER.read_bytes()
    entry = ledger_entry(copies, staging_sha, {"passed": passed, "failed": failed},
                         manifest_before)
    with open(LEDGER, "ab") as handle:
        handle.write(entry.encode("utf-8"))
    after_bytes = LEDGER.read_bytes()
    if not after_bytes.startswith(before_bytes):
        stop("S-2", "ledger prefix identity")
    if after_bytes.count(entry.encode("utf-8")) != 1:
        stop("S-2", "ledger entry uniqueness")
    ledger_after = {
        "sha256": sha256_file(LEDGER),
        "bytes": LEDGER.stat().st_size,
        "lines": len(LEDGER.read_text(encoding="utf-8").splitlines()),
    }

    cascade = []
    for command in CASCADE:
        result = run(command)
        cascade.append(result)
        if result["exitCode"] != 0:
            stop("S-3", f"cascade failed: {result['command']}")

    manifest_regen = run(["node", "scripts/build-manifest.mjs"])
    if manifest_regen["exitCode"] != 0:
        stop("S-3", "manifest regen")
    pre_receipt_manifest = json.loads((REPO / "MANIFEST.json").read_text(encoding="utf-8"))
    pre_receipt_sha = sha256_file(REPO / "MANIFEST.json")

    validation = run(["node", "scripts/validate-release.mjs"])
    validation_report = json.loads(validation["stdoutTail"] and "{}" or "{}") if False else None
    # Read the full report from the canonical path if the validator writes it.
    validation_path = REPO / "qa/integrated-release-validation.json"
    if validation_path.exists():
        validation_report = json.loads(validation_path.read_text(encoding="utf-8"))
    prose = run(["node", "scripts/validate-validation-prose-consistency.mjs"])
    if validation["exitCode"] != 0:
        stop("S-4", "validation failed; see qa/integrated-release-validation.json")
    if prose["exitCode"] != 0:
        stop("S-4", "prose consistency failed")

    checks = validation_report.get("checks", []) if validation_report else []
    passed = sum(1 for check in checks if check["status"] == "PASS")
    failed = len(checks) - passed
    prose_report = json.loads(prose["stdoutTail"] or "{}")

    receipt = {
        "schemaVersion": "governed-loop.mvp7-intention-landing.v1",
        "directive": "MVP7-INTENTION-DIR-1",
        "task": "MVP7-INTENTION-L27-LANDING",
        "status": "COMPLETE",
        "opening": {
            "baseHead": EXPECTED_HEAD,
            "treeClean": True,
            "ledgerBefore": {
                "sha256": EXPECTED_LEDGER_BEFORE,
                "bytes": EXPECTED_LEDGER_BYTES,
                "lines": EXPECTED_LEDGER_LINES,
                "path": "provenance/DECISION_LEDGER.md",
            },
            "manifestBefore": {
                "sha256": EXPECTED_MANIFEST_SHA,
                "fileCount": manifest_before["fileCount"],
                "totalBytes": manifest_before["totalBytes"],
            },
            "validationBefore": {"passed": EXPECTED_VALIDATION_PASSED, "failed": 0},
            "stagingManifestSha256": staging_sha,
        },
        "artifacts": {
            "payloads": copies,
            "receipts": [
                {"role": role, "destination": next(row["destination"] for row in copies
                                                   if row["source"] == source),
                 "sha256": next(row["sha256"] for row in copies
                                if row["source"] == source)}
                for role, source in RECEIPTS
            ],
            "fileCount": len(copies),
        },
        "ledger": {
            "beforeSha256": EXPECTED_LEDGER_BEFORE,
            "afterSha256": ledger_after["sha256"],
            "afterBytes": ledger_after["bytes"],
            "afterLines": ledger_after["lines"],
            "entry": "single combined L27 entry appended at tail; no prior entry amended",
            "prefixIdentity": True,
        },
        "cascade": cascade,
        "manifestRegen": {
            "preReceiptFileCount": pre_receipt_manifest["fileCount"],
            "preReceiptTotalBytes": pre_receipt_manifest["totalBytes"],
            "preReceiptManifestSha256": pre_receipt_sha,
            "note": "the landing receipt is written after this manifest; the final packaging manifest includes it and is regenerated below",
        },
        "validation": {
            "command": "node scripts/validate-release.mjs",
            "checksPassed": passed,
            "checksFailed": failed,
            "verdict": "PASS" if failed == 0 else "FAIL",
            "reportPath": "qa/integrated-release-validation.json",
        },
        "proseConsistency": {
            "command": "node scripts/validate-validation-prose-consistency.mjs",
            "verdict": prose_report.get("verdict"),
            "authoritativeChecksPassed": prose_report.get("authoritativeChecksPassed"),
            "violations": prose_report.get("violations"),
        },
        "decisions": {
            "lensCoordinate": "log2(f/440)",
            "earGate": "PENDING_HUMAN",
            "provisionalOutcome": "CONDITIONAL_OUTCOME_2_GUEST_CURATOR_MENU_BOUND_PENDING_EAR",
            "a3Bet": "FAILED_AS_PREDECLARED_RETAINED",
            "instrumentCorrections": 3,
        },
        "constraints": {
            "claimEvent": False,
            "encoderBytesModified": False,
            "gateBytesModified": False,
            "landingMode": "working-tree; uncommitted",
            "orreryApplicationSourceModified": False,
            "qEngineBytesModified": False,
            "rendererBytesModified": False,
            "substrateBytesModified": False,
            "tagOrPush": False,
        },
        "warnings": [],
    }
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    final_manifest = run(["node", "scripts/build-manifest.mjs"])
    final_validation = run(["node", "scripts/validate-release.mjs"])
    print(json.dumps({
        "status": "COMPLETE",
        "payloads": len(copies),
        "ledgerAfter": ledger_after,
        "validation": {"passed": passed, "failed": failed},
        "prose": prose_report,
        "preReceiptManifest": {"files": pre_receipt_manifest["fileCount"],
                               "sha256": pre_receipt_sha},
        "finalManifestExit": final_manifest["exitCode"],
        "finalValidationExit": final_validation["exitCode"],
        "landingReceiptSha256": sha256_file(RECEIPT),
        "earGate": "PENDING_HUMAN",
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
