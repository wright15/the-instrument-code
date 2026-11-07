#!/usr/bin/env python3
"""L28 landing for MVP8-DIR-1 / MVP8.1-DIR-1 / MVP8.1b-DIR-1 (lean scope).

Copies the non-audio payload byte-identically, appends one combined L28 ledger
entry, runs the ledger-binding cascade, regenerates the manifest, validates the
release, writes the landing receipt, and makes one dedicated git commit.
No tag, no push. Audio (.wav/.mid) is excluded as reproducible evidence already
hashed in the landed receipts.
"""
import hashlib
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
MVP8 = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_pentatonic_q")
MVP81 = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_1_stem")
MVP8B = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_1b_metric_fix")
LEDGER = REPO / "provenance/DECISION_LEDGER.md"
RECEIPT = REPO / "qa/mvp8_1b_landing_receipt.json"

EXPECTED_HEAD = "d1b2286a5b6f3783af24094eb78e40ab511bb8e5"
EXPECTED_LEDGER = "da9c79410cf2f3429509ca07f4a82effe49932d061ca96a4d36d28a401668149"
EXPECTED_LEDGER_BYTES = 407293
EXPECTED_LEDGER_LINES = 4383
EXPECTED_MANIFEST_SHA = "6632ab6a3141e58519fe5846794eb9befd76d1cd3479f9d65934a2a30ce0bc27"
EXPECTED_MANIFEST_FILES = 1834
EXPECTED_MANIFEST_BYTES = 263181122
EXPECTED_VALIDATION_PASSED = 418

DIRECTIVE_DOCS = [
    "scrum/plan/mvp8-dir-1-rev2.md",
    "scrum/plan/mvp8-1-dir-1-rev1.md",
    "scrum/plan/mvp8-1b-dir-1-rev1.md",
]
REALMS = [("mvp8", MVP8), ("mvp8_1", MVP81), ("mvp8_1b", MVP8B)]
REPORT_MAP = {
    ("mvp8", "task-e/MVP8-PENTATONIC-Q-CLOSING-REPORT.md"):
        "scrum/plan/mvp8-pentatonic-q-sprint-closing-report.md",
    ("mvp8_1", "task-e/MVP8.1-STEM-CALIBRATION-CLOSING-REPORT.md"):
        "scrum/plan/mvp8-1-stem-calibration-closing-report.md",
    ("mvp8_1b", "task-e/MVP8.1b-METRIC-FIX-CLOSING-REPORT.md"):
        "scrum/plan/mvp8-1b-metric-fix-closing-report.md",
    ("mvp8_1b", "task-e/PROPOSED_AMENDMENT_SPEC_001_S1_3_PENTATONIC_CONTEXT.md"):
        "scrum/plan/mvp8-1b-proposed-amendment-spec-001-s1-3.md",
}
PRINCIPAL = [
    ("mvp8_common", "mvp8", "mvp8_common.py"),
    ("mvp8_task_0", "mvp8", "task-0/mvp8_task_0.py"),
    ("mvp8_predeclared_bets", "mvp8", "task-0/mvp8_predeclared_bets.json"),
    ("mvp8_ear_scorecard", "mvp8", "task-0/mvp8_ear_scorecard.json"),
    ("mvp8_table_generator", "mvp8", "task-a/mvp8_table_generator.py"),
    ("mvp8_pentatonic_lookup", "mvp8", "task-a/mvp8_pentatonic_lookup_v1.json"),
    ("mvp8_pentatonic_q_engine", "mvp8", "task-b/mvp8_pentatonic_q_engine.py"),
    ("mvp8_task_b", "mvp8", "task-b/mvp8_task_b.py"),
    ("mvp8_task_c_connector", "mvp8", "task-c/mvp8_task_c.py"),
    ("mvp8_task_d_study", "mvp8", "task-d/mvp8_zero_pentatonic_study.py"),
    ("mvp8_ear_manifest_signed", "mvp8", "task-d/mvp8_ear_manifest.json"),
    ("mvp8_task_e", "mvp8", "task-e/mvp8_task_e.py"),
    ("mvp8_1_task_0", "mvp8_1", "task-0/mvp8_1_task_0.py"),
    ("mvp8_1_predeclared_bets", "mvp8_1", "task-0/mvp8_1_predeclared_bets.json"),
    ("mvp8_1_stems", "mvp8_1", "task-a/mvp8_1_stems.py"),
    ("mvp8_1_bets", "mvp8_1", "task-b/mvp8_1_bets.py"),
    ("mvp8_1_task_e", "mvp8_1", "task-e/mvp8_1_task_e.py"),
    ("mvp8_1b_task_0", "mvp8_1b", "task-0/mvp8_1b_task_0.py"),
    ("mvp8_1b_predeclared_bets", "mvp8_1b", "task-0/mvp8_1b_predeclared_bets.json"),
    ("mvp8_1b_verify_stems", "mvp8_1b", "task-a/mvp8_1b_verify_stems.py"),
    ("mvp8_1b_bets", "mvp8_1b", "task-b/mvp8_1b_bets.py"),
    ("mvp8_1b_task_e", "mvp8_1b", "task-e/mvp8_1b_task_e.py"),
    ("mvp8_1b_land", "mvp8_1b", "task-e/mvp8_1b_land.py"),
]
RECEIPTS = [
    ("mvp8_task_0_receipt", "mvp8", "task-0/mvp8_task_0_receipt.json"),
    ("mvp8_task_a_receipt", "mvp8", "task-a/mvp8_task_a_receipt.json"),
    ("mvp8_task_b_receipt", "mvp8", "task-b/mvp8_task_b_receipt.json"),
    ("mvp8_task_c_receipt", "mvp8", "task-c/mvp8_task_c_receipt.json"),
    ("mvp8_task_d_receipt", "mvp8", "task-d/mvp8_task_d_receipt.json"),
    ("mvp8_task_e_receipt", "mvp8", "task-e/mvp8_task_e_receipt.json"),
    ("mvp8_1_task_0_receipt", "mvp8_1", "task-0/mvp8_1_task_0_receipt.json"),
    ("mvp8_1_task_a_receipt", "mvp8_1", "task-a/mvp8_1_task_a_receipt.json"),
    ("mvp8_1_task_b_receipt", "mvp8_1", "task-b/mvp8_1_task_b_receipt.json"),
    ("mvp8_1_task_e_receipt", "mvp8_1", "task-e/mvp8_1_task_e_receipt.json"),
    ("mvp8_1b_task_0_receipt", "mvp8_1b", "task-0/mvp8_1b_task_0_receipt.json"),
    ("mvp8_1b_task_a_receipt", "mvp8_1b", "task-a/mvp8_1b_task_a_receipt.json"),
    ("mvp8_1b_task_b_receipt", "mvp8_1b", "task-b/mvp8_1b_task_b_receipt.json"),
    ("mvp8_1b_task_e_receipt", "mvp8_1b", "task-e/mvp8_1b_task_e_receipt.json"),
]
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


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def stop(rule, detail):
    print(f"STOP: {rule} {detail}")
    sys.exit(2)


def git(*args):
    return subprocess.run(["git", "-C", str(REPO), *args],
                          capture_output=True, text=True, check=True).stdout


def run(command):
    env = os.environ.copy()
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    started = subprocess.run([str(part) for part in command], cwd=REPO,
                             capture_output=True, text=True, env=env)
    return {
        "command": " ".join(str(part) for part in command),
        "exitCode": started.returncode,
        "stdoutTail": started.stdout[-1600:],
        "stderrTail": started.stderr[-1600:],
    }


def destination_for(realm, relative):
    key = (realm, relative.as_posix())
    if key in REPORT_MAP:
        return REPORT_MAP[key]
    if relative.name.endswith("_receipt.json"):
        return f"qa/{relative.name}"
    return f"tools/governed-loop/{realm}/{relative.as_posix()}"


def copy_payload():
    copies = []
    audio = []
    for realm, root in REALMS:
        for path in sorted(root.rglob("*")):
            if not path.is_file():
                continue
            relative = path.relative_to(root)
            if "__pycache__" in relative.parts or path.suffix == ".pyc":
                continue
            if path.suffix in (".wav", ".mid"):
                audio.append({
                    "realm": realm,
                    "source": relative.as_posix(),
                    "bytes": path.stat().st_size,
                })
                continue
            destination = REPO / destination_for(realm, relative)
            if destination.exists():
                stop("S-2", f"destination collision {destination}")
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(path, destination)
            source_hash = sha256_file(path)
            destination_hash = sha256_file(destination)
            if source_hash != destination_hash:
                stop("S-2", f"copy hash mismatch {path}")
            copies.append({
                "realm": realm,
                "source": relative.as_posix(),
                "destination": destination.relative_to(REPO).as_posix(),
                "bytes": destination.stat().st_size,
                "sha256": destination_hash,
            })
    return copies, audio


def staging_digest(copies):
    payload = "\n".join(f"{row['destination']}:{row['sha256']}"
                        for row in sorted(copies, key=lambda row: row["destination"]))
    return hashlib.sha256(payload.encode()).hexdigest()


def lookup_copy(copies, realm, relative):
    for row in copies:
        if row["realm"] == realm and row["source"] == relative:
            return row
    stop("S-2", f"principal missing from copies: {realm}:{relative}")


def ledger_entry(copies, staging_sha, validation_before, manifest_before):
    principal_rows = "\n".join(
        f"| `{role}` | `{row['destination']}` | `{row['sha256']}` |"
        for role, realm, relative in PRINCIPAL
        for row in [lookup_copy(copies, realm, relative)]
    )
    receipt_rows = "\n".join(
        f"| `{role}` | `{row['destination']}` | `{row['sha256']}` |"
        for role, realm, relative in RECEIPTS
        for row in [lookup_copy(copies, realm, relative)]
    )
    directive_rows = "\n".join(
        f"| `directive` | `{path}` | `{sha256_file(REPO / path)}` |"
        for path in DIRECTIVE_DOCS
    )
    return f"""
**Governed-loop L28 landing — MVP-8 pentatonic-aware Q initiation, MVP-8.1 stem recalibration, and MVP-8.1b metric correction — 2026-11-07.** This is the L28 landing authorized by the Planning Seat (MVP8.1b-DIR-1 rev 1, lean scope). It lands the non-audio payload byte-identically, appends this one combined L28 entry, and records the ear gate as human-signed. L28 is a working-tree landing followed by one dedicated commit; no tag and no push. The L28 digest, byte count, and line count are recorded in `qa/mvp8_1b_landing_receipt.json`; this entry cannot carry its own digest.

**(i) Opening state and append-position proof.** The opening ledger was L27 `{EXPECTED_LEDGER}` ({EXPECTED_LEDGER_BYTES:,} B / {EXPECTED_LEDGER_LINES:,} lines); HEAD `{EXPECTED_HEAD}`; MANIFEST {manifest_before['fileCount']:,} files / {manifest_before['totalBytes']:,} B; release closure {validation_before['passed']}/{validation_before['failed']} PASS; staging manifest `{staging_sha}` (all payloads hash-verified). The complete L27 bytes are preserved byte-identically as the prefix of the post-append ledger; the new L28 entry occurs exactly once at the tail; no prior entry is amended.

**(ii) MVP-8 / MVP-8.1 / MVP-8.1b closure.** MVP-8 (DIR-1 rev 2) completed with `DEFER`: B1 0/1,064,448 out-of-mask and 0/243,936 still-set leaks; B2 144/192 baseline -> 192/192 governed initiation, 80/80 structural, 4 modal passes; B3 55,296 checks with 0 bad focal/orbit/initiation; C1 1-hop `1453@0 -> 2477@0` with 5 shared bridges and 0 switches; C2 10/10 with max overhead 0; C3a 0 dwell switches; C3b core `{{0,2,4,7}}` on 7/7 bars; Task D integrity 6/6. B4 failed under the full-mix log-spectral lens (governed lead 0.200836 < container 0.673879; ungoverned 0.330663 < 0.719081). MVP-8.1 stem recalibration confirmed B4-prime-b (governed stem margin 0.145169 vs ungoverned 0.031118) and B4-prime-d, but its locked B4-prime-a pcSum proxy failed 3/12; the DEFER remains banked. MVP-8.1b corrected B4-prime-a before measurement to mean emitted pc on stems with >=2 offices and >=3 bars (threshold unchanged at 0.90): 5/5 scored stems passed (0.985864, 0.990836, 0.991192, 0.995975, 0.994500), yielding `ADOPT_RUNTIME_READING`. The ear manifest is `SIGNED_HUMAN` (signed by Erick). Audio (.wav/.mid) is excluded from this landing as reproducible evidence already hashed in the landed receipts; the lookup table and all traces are included.

**(iii) L28 landing artifact table.** The following principal payloads and receipts land byte-identically; the full inventory is enumerated in `qa/mvp8_1b_landing_receipt.json`.

| Role | In-tree path | SHA-256 |
|---|---|---|
{principal_rows}
{receipt_rows}
{directive_rows}

**(iv) Decisions, verification, and fences.** D-1: the pentatonic lookup is derived from `derived/hypergraph/bipartite-inclusion-v1.json` (`planning_evidence`, `admissionEffect: none`, `detached_audit_only`); no runtime reading is admitted by this landing. D-2: the MVP-8.1b ADOPT selects the draft `SPEC-001` §1.3 proposal (`scrum/plan/mvp8-1b-proposed-amendment-spec-001-s1-3.md`); admission remains a separate governance act, and `src/fivefold/quintessence.py` is untouched. D-3: the MVP-8 `DEFER` and MVP-8.1 `DEFER` remain historical evidence and are not retroactively amended. D-4: the B4-prime-a metric correction was locked before the MVP-8.1b measurement; the threshold is unchanged. D-5: audio exclusion is a lean-scope decision; the 12 mix WAVs and 24 stems remain scratch evidence with hashes in the landed receipts. D-6: the three MVP-8/MVP-8.1/MVP-8.1b closing reports are sanctioned as frozen historical prose records in `scripts/validate-validation-prose-consistency.mjs` by ADJ-PLANNING-SEAT-20261107-L28; any byte change voids the sanction. After the append, the five direct ledger-bound artifacts (`canonical/fivefold-incubator/fifth-space-census-v0.json`, `canonical/fivefold-incubator/shadow-ladder-v0.json`, `canonical/fivefold-incubator/twin-hub-convergence-v0.json`, `qa/pentatonic-binding-audit-closure.json`, `qa/fivefold-engine-promotion-evidence.json`) are re-bound to the post-append ledger via their generators, and the three downstream projections (`orrery/src/generated/field-derivation-bundle.v1.json`, `orrery/src/generated/taxonomy-read-model.v1.json`, `orrery/src/generated/d-tier-taxonomy-dataset.v1.json`) are regenerated. MANIFEST.json and CHECKSUMS.sha256 are regenerated after the cascade and the release closure is re-run. Fences: no gate, census-content, encoder, Q-engine, pinned-renderer, or `audio.ts` byte change; no LLM calls; no tag; no push. No entropy, no C_H formulation, no perception/biology claim; `causationClaim: false`, `physicalQuantityClaim: false`, `tierClassifier: false`, `globalCHNull: true`; bipartite binding remains planning evidence.
"""


def main():
    if "--authorize-l28" not in sys.argv:
        stop("S-0", "pass --authorize-l28 after a governance ruling")
    head = git("rev-parse", "HEAD").strip()
    porcelain = git("status", "--porcelain")
    allowed = {f"?? {path}" for path in DIRECTIVE_DOCS}
    allowed_modified = {" M scripts/validate-validation-prose-consistency.mjs"}
    unexpected = [line for line in porcelain.splitlines()
                  if line.strip() and line not in allowed and line not in allowed_modified]
    if head != EXPECTED_HEAD:
        stop("S-1", f"HEAD {head}")
    if unexpected:
        stop("S-1", f"tree not clean: {unexpected}")
    if sha256_file(LEDGER) != EXPECTED_LEDGER:
        stop("S-1", "ledger before")
    if LEDGER.stat().st_size != EXPECTED_LEDGER_BYTES:
        stop("S-1", "ledger bytes")
    if len(LEDGER.read_text(encoding="utf-8").splitlines()) != EXPECTED_LEDGER_LINES:
        stop("S-1", "ledger lines")
    manifest_before = json.loads((REPO / "MANIFEST.json").read_text(encoding="utf-8"))
    if (sha256_file(REPO / "MANIFEST.json") != EXPECTED_MANIFEST_SHA
            or manifest_before["fileCount"] != EXPECTED_MANIFEST_FILES
            or manifest_before["totalBytes"] != EXPECTED_MANIFEST_BYTES):
        stop("S-1", "manifest before")
    validation_before = json.loads((REPO / "qa/integrated-release-validation.json").read_text(encoding="utf-8"))
    before_checks = validation_before.get("checks", [])
    passed_before = sum(1 for check in before_checks if check.get("status") == "PASS")
    failed_before = len(before_checks) - passed_before
    if passed_before != EXPECTED_VALIDATION_PASSED or failed_before != 0:
        stop("S-1", f"validation before {passed_before}/{failed_before}")

    copies, audio = copy_payload()
    staging_sha = staging_digest(copies)

    before_bytes = LEDGER.read_bytes()
    entry = ledger_entry(copies, staging_sha,
                         {"passed": passed_before, "failed": failed_before},
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
    if validation["exitCode"] != 0:
        stop("S-4", "validation failed")
    validation_report = json.loads((REPO / "qa/integrated-release-validation.json").read_text(encoding="utf-8"))
    checks = validation_report.get("checks", [])
    passed = sum(1 for check in checks if check.get("status") == "PASS")
    failed = len(checks) - passed
    prose = run(["node", "scripts/validate-validation-prose-consistency.mjs"])
    if prose["exitCode"] != 0:
        stop("S-4", "prose consistency failed")
    prose_report = json.loads(prose["stdoutTail"] or "{}")
    prose_script = "scripts/validate-validation-prose-consistency.mjs"
    prose_before = subprocess.run(
        ["git", "-C", str(REPO), "show", f"HEAD:{prose_script}"],
        capture_output=True, check=True).stdout
    validator_amendments = [{
        "path": prose_script,
        "beforeSha256": hashlib.sha256(prose_before).hexdigest(),
        "afterSha256": sha256_file(REPO / prose_script),
        "reason": "ADJ-PLANNING-SEAT-20261107-L28: sanction the three MVP8/MVP8.1/MVP8.1b closing reports as frozen historical prose records",
    }]

    receipt = {
        "schemaVersion": "governed-loop.mvp8_1b-landing.v1",
        "directive": "MVP8.1b-DIR-1",
        "task": "MVP8.1b-L28-LANDING",
        "status": "COMPLETE",
        "scope": "lean: audio excluded",
        "opening": {
            "baseHead": EXPECTED_HEAD,
            "treeClean": False,
            "workingTreeException": {
                "untracked": DIRECTIVE_DOCS,
                "modified": ["scripts/validate-validation-prose-consistency.mjs"],
                "reason": "directive documents were written before execution at the Planning Seat's request; the prose validator carries the ADJ-PLANNING-SEAT-20261107-L28 closing-report sanctions; no pinned byte changed",
            },
            "ledgerBefore": {
                "sha256": EXPECTED_LEDGER,
                "bytes": EXPECTED_LEDGER_BYTES,
                "lines": EXPECTED_LEDGER_LINES,
                "path": "provenance/DECISION_LEDGER.md",
            },
            "manifestBefore": {
                "sha256": EXPECTED_MANIFEST_SHA,
                "fileCount": manifest_before["fileCount"],
                "totalBytes": manifest_before["totalBytes"],
            },
            "validationBefore": {"passed": passed_before, "failed": failed_before},
            "stagingManifestSha256": staging_sha,
        },
        "artifacts": {
            "payloads": copies,
            "payloadCount": len(copies),
            "directiveDocuments": [
                {"path": path, "sha256": sha256_file(REPO / path)}
                for path in DIRECTIVE_DOCS
            ],
            "excludedAudio": {
                "count": len(audio),
                "bytes": sum(row["bytes"] for row in audio),
                "note": "audio is reproducible from the landed code and traces; hashes remain in the landed receipts",
            },
        },
        "ledger": {
            "beforeSha256": EXPECTED_LEDGER,
            "afterSha256": ledger_after["sha256"],
            "afterBytes": ledger_after["bytes"],
            "afterLines": ledger_after["lines"],
            "entry": "single combined L28 entry appended at tail; no prior entry amended",
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
        "validatorAmendments": validator_amendments,
        "decisions": {
            "mvp8Outcome": "DEFER",
            "mvp81Outcome": "DEFER",
            "mvp81bOutcome": "ADOPT_RUNTIME_READING",
            "earGate": "SIGNED_HUMAN",
            "b4bGovernedMargin": "0.145169",
            "b4bUngovernedMargin": "0.031118",
            "b4aPrime": "PASS 5/5",
            "spec001Proposal": "scrum/plan/mvp8-1b-proposed-amendment-spec-001-s1-3.md",
        },
        "constraints": {
            "claimEvent": False,
            "encoderBytesModified": False,
            "gateBytesModified": False,
            "landingMode": "working-tree + one dedicated commit",
            "orreryApplicationSourceModified": False,
            "qEngineBytesModified": False,
            "rendererBytesModified": False,
            "substrateBytesModified": False,
            "tagOrPush": False,
            "audioLanded": False,
        },
        "warnings": [],
    }
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    final_manifest = run(["node", "scripts/build-manifest.mjs"])
    final_validation = run(["node", "scripts/validate-release.mjs"])

    status = git("status", "--porcelain")
    print("--- STATUS BEFORE COMMIT ---")
    print(status)
    subprocess.run(["git", "-C", str(REPO), "add", "-A"], check=True)
    staged = subprocess.run(["git", "-C", str(REPO), "diff", "--cached", "--name-only"],
                            capture_output=True, text=True, check=True).stdout
    print("--- STAGED ---")
    print(staged)
    commit_message = "build(mvp8): land L28 pentatonic-aware Q initiation and stem-calibrated B4"
    subprocess.run(["git", "-C", str(REPO), "commit", "-m", commit_message], check=True)
    commit_hash = git("rev-parse", "HEAD").strip()
    post_status = git("status", "--porcelain")
    print(json.dumps({
        "status": "COMPLETE",
        "payloads": len(copies),
        "excludedAudio": len(audio),
        "stagingManifestSha256": staging_sha,
        "ledgerAfter": ledger_after,
        "validation": {"passed": passed, "failed": failed},
        "prose": prose_report,
        "preReceiptManifest": {"files": pre_receipt_manifest["fileCount"],
                               "sha256": pre_receipt_sha},
        "finalManifestExit": final_manifest["exitCode"],
        "finalValidationExit": final_validation["exitCode"],
        "landingReceiptSha256": sha256_file(RECEIPT),
        "commit": commit_hash,
        "commitMessage": commit_message,
        "treeCleanAfterCommit": not post_status.strip(),
        "tagOrPush": False,
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
