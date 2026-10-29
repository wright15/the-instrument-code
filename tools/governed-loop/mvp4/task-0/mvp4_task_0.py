#!/usr/bin/env python3
import hashlib
import importlib.util
import json
import os
import shutil
import subprocess
import sys

SCRATCH = os.environ.get("GOVERNED_LOOP_SCRATCH", os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REPO = os.environ.get("GOVERNED_LOOP_REPO", "/home/erick/projects/integrated-release")
TASK0 = os.path.dirname(os.path.abspath(__file__))
REPO_HEAD = "148a96f8c5ce5bcd83fad832170bc76c7075a943"
EMPTY_SHA = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
LEDGER_SHA = "037424774910287b29a9101569127d4a7850d4f86376540e350bbe14f0c6663b"
MANIFEST_SHA = "93fb9c836f1fa108a607b74d50d3bc3adcc3dcd9311e0edb994685241f4b8a05"
CHECKSUMS_SHA = "fd918c280c9f0789102bc09b0fd041c5875a73cb9ae7f1754d5740b2ecd0daeb"
VALIDATION_SHA = "cff3c3157d520a4bedceb5f62a4c04cb482d5e4843de41cda812292c881a8fa5"

REPO_PINS = {
    "tools/governed-loop/mvp2.py": "79c0cf706fffc23745cab6e87ffbc46d34d70ad94a93291135725e388dc17328",
    "tools/governed-loop/orrery_nav_bridge.py": "9f2b3da60f0aa3695608d60640b0303a7d5ec0500d27fbe49284c7f399ae4824",
    "tools/governed-loop/mvp2_orrery_nav_smoke.py": "851c9bf2a29c2c5a0a74f88875fc5420ee81c27c246dcdb8ef6f0e079e277c9c",
    "tools/governed-loop/mvp3_encoder.py": "dc2379277afb1a9bf92a26cd3a83ea3f16a33a12ca331a9742f7d5861422f745",
    "tools/governed-loop/mvp3_encoder_spec.json": "918228d497fc57e7c63b79ebd33c554ac4e52cb58760a9b68d86c52f6daae17c",
    "tools/governed-loop/census_462.json": "242bce7423bc2eb0ae61ee431c27901d6a87401b8b3ffd6725a04d0e1ed0685a",
    "tools/governed-loop/frozen_ground_truth.json": "007b0ffe65015bd2c5f1a6fe0df8969961ce8cfb3d499677b143d971e1fc5744",
    "tools/governed-loop/frozen_seam_substrate_v3.json": "9f9818effa5d11e4ef2634122c9f484faf6790323cabae130561c1c75e8a295f",
    "tools/governed-loop/seam_legal_moves_v3.json": "e6cf62a8eefa0924da9286f2e664c1914d9d620ed2d299929f684fd48225c274",
    "src/fivefold/quintessence.py": "eefd7e1e060189261c8063652d2ed73a09b16d3ffdcb9f259502a107ef9ceaa0",
    "tests/fixtures/fivefold_q_table.v1.json": "bd361793d7c1295872fc95c230f3f9ce234f2cd4ea6899e9a3df08700aa8d604",
    "qa/mvp3_task_a_receipt.json": "cb9083f435a41b17a009d5fb249661c1998d107556bf6a6ee97fa5293f1461a0",
    "qa/mvp3_task_b0_receipt.json": "ae50fd2b9b7c6b68157ae2a745d85be213e2d2afcf1db66d42766c5a61f7801e",
    "qa/mvp3_task_b1_receipt.json": "c658a5885c5fb989eec6eab1a3a3964ae3e2228606cb806f0867c6c1d829e5d4",
    "qa/mvp3_task_c_receipt.json": "022856bb9a2bb88162f77e04ca4dd60b0b93f68c62d2bb1404f14334d0729bfc",
}

STAGED = [
    ("task-a/mvp3_chaldean_card.json", "bff1cc4cb270e4883125c6ca431dd8440d8f73be3e33be51fc54c580ad7dc289", "mvp3_static_card"),
    ("task-a/mvp3_llm_proposer.py", "69deb1e6d55ea37eafd97ad2ea868faef3e55e0520bbca05afda9a3a44898936", "mvp3_llm_proposer"),
    ("task-a/mvp3_task_a_postprocess.py", "adb884b0c6190efe10f612f190bcd2821b1d724e119540961696c1b1251a0f25", "mvp3_task_a_postprocess"),
    ("task-b0/mvp3_b0_run.py", "eea1e4a8e877cc60dc6228fada95560150e8724b659fc5c28b95f3c5fe182c85", "mvp3_task_b0_runner"),
    ("task-b1/mvp3_b1_run.py", "796bac0a1be2d29f5af318577595f1a0925a3ba0006fd4cda13c7bab144ab2d8", "mvp3_task_b1_runner"),
    ("task-c/mvp3_task_c.py", "aff45d9199aeb4c3eeec59d757c4d16c64a6fa3a328fa5bfedfe1bba775398ac", "mvp3_task_c_probe"),
    ("task-c/mvp3_task_c_postprocess.py", "5a769d9d0ac3f4dd600a1e05a1c519512727bc8f627f85d29983482f5d28bd37", "mvp3_task_c_postprocess"),
    ("mvp3_task0_census.py", "b7c265ffb20ac5d914953bf9aed218f07727ddb6cd352c31ccc3bb378ae82fb7", "mvp3_task0_census"),
]


def sha_bytes(data):
    return hashlib.sha256(data).hexdigest()


def sha_file(path):
    with open(path, "rb") as handle:
        return sha_bytes(handle.read())


def write_json(name, payload):
    path = os.path.join(TASK0, name)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, sort_keys=True)
        handle.write("\n")
    return path, sha_file(path)


def run_bridge(mode, ledger_prefix):
    env = dict(os.environ)
    env.update({
        "GOVERNED_LOOP_SCRATCH": SCRATCH,
        "GOVERNED_LOOP_REPO": REPO,
        "GOVERNED_LOOP_REQUIRE_CLEAN": "1",
        "GOVERNED_LOOP_REPO_HEAD": REPO_HEAD,
        "GOVERNED_LOOP_MANIFEST_COUNT": "1488",
        "GOVERNED_LOOP_LEDGER_PREFIX": ledger_prefix,
    })
    proc = subprocess.run(
        [sys.executable, os.path.join(SCRATCH, "orrery_nav_bridge.py"), "--check"],
        capture_output=True, text=True, env=env, cwd=REPO,
    )
    out = os.path.join(TASK0, f"bridge_check_{mode}.out")
    with open(out, "w", encoding="utf-8") as handle:
        handle.write(proc.stdout)
        handle.write(proc.stderr)
    return {
        "mode": mode,
        "ledgerPrefix": ledger_prefix,
        "exitCode": proc.returncode,
        "stdout": proc.stdout,
        "stderr": proc.stderr,
        "logPath": out,
        "logSha256": sha_file(out),
    }


def load_world():
    spec = importlib.util.spec_from_file_location("frozen_mvp2_task0", os.path.join(SCRATCH, "mvp2.py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.World()


def repo_state():
    status = subprocess.run(["git", "-C", REPO, "status", "--porcelain"], capture_output=True, text=True, check=True).stdout
    head = subprocess.run(["git", "-C", REPO, "rev-parse", "HEAD"], capture_output=True, text=True, check=True).stdout.strip()
    return head, sha_bytes(status.encode("utf-8")), status


def main():
    stops = []
    opened = subprocess.run(["date", "-u", "+%Y-%m-%dT%H:%M:%SZ"], capture_output=True, text=True, check=True).stdout.strip()
    head, status_sha, status_raw = repo_state()
    if head != REPO_HEAD:
        stops.append("S-1")
    if status_sha != EMPTY_SHA:
        stops.append("S-3")

    ledger = os.path.join(REPO, "provenance/DECISION_LEDGER.md")
    ledger_sha = sha_file(ledger)
    manifest_path = os.path.join(REPO, "MANIFEST.json")
    manifest = json.load(open(manifest_path, encoding="utf-8"))
    validation_path = os.path.join(REPO, "qa/integrated-release-validation.json")
    validation = json.load(open(validation_path, encoding="utf-8"))
    if ledger_sha != LEDGER_SHA or sha_file(manifest_path) != MANIFEST_SHA:
        stops.append("S-1")
    if sha_file(os.path.join(REPO, "CHECKSUMS.sha256")) != CHECKSUMS_SHA or sha_file(validation_path) != VALIDATION_SHA:
        stops.append("S-1")

    repo_pin_rows = []
    for rel, expected in REPO_PINS.items():
        actual = sha_file(os.path.join(REPO, rel))
        repo_pin_rows.append({"path": rel, "expectedSha256": expected, "actualSha256": actual, "match": actual == expected})
        if actual != expected:
            stops.append("S-1")

    scratch_runner_rows = []
    for rel, expected, role in STAGED:
        path = os.path.join(os.path.dirname(SCRATCH), rel)
        actual = sha_file(path) if os.path.exists(path) else None
        scratch_runner_rows.append({"path": path, "role": role, "expectedSha256": expected, "actualSha256": actual,
                                    "match": actual == expected})
        if actual != expected:
            stops.append("S-1")

    anchors = {
        "150": "        if cm == nm and cp == np_:",
        "151": "            if self.gov_root[cm] is None:",
        "152": '                checks["boundary_endpoint"] = True',
        "153": '                checks["same_family"] = False',
        "154": '                return "REJECT", ["ungoverned-transition"], checks, None',
        "169": "        same_root = cr is not None and nr is not None and cr == nr",
        "171": "        if same_root and cp == np_:",
        "172": '            return "ACCEPT", [], checks, None',
        "183": '        if checks["boundary_endpoint"]:',
        "184": '            return "REJECT", ["ungoverned-transition"], checks, None',
    }
    lines = open(os.path.join(SCRATCH, "mvp2.py"), encoding="utf-8").read().splitlines()
    anchor_rows = [{"line": int(k), "expected": v, "actual": lines[int(k) - 1], "match": lines[int(k) - 1] == v}
                   for k, v in anchors.items()]
    dwell_ok = "ORRERY_BRIDGE_DWELL_MS" in lines[732]
    anchor_rows.append({"line": 733, "expected": "ORRERY_BRIDGE_DWELL_MS marker", "actual": lines[732], "match": dwell_ok})
    if not all(row["match"] for row in anchor_rows):
        stops.append("S-1")

    positive = run_bridge("positive", "03742477")
    negative = run_bridge("negative", "00000000")
    if positive["exitCode"] != 0:
        stops.append("S-2")
    if negative["exitCode"] == 0 or "FAIL-CLOSED" not in (negative["stdout"] + negative["stderr"]):
        stops.append("S-2")

    world = load_world()
    gt = json.load(open(os.path.join(SCRATCH, "frozen_ground_truth.json"), encoding="utf-8"))
    sub3 = json.load(open(os.path.join(SCRATCH, "frozen_seam_substrate_v3.json"), encoding="utf-8"))
    gov_root = {int(k): v for k, v in gt["governingRoot"].items()}
    role = {int(k): v for k, v in gt["census"]["role"].items()}
    boundary_masks = sorted(m for m, root in gov_root.items() if root is None)
    rl = {int(k): [(op, int(tgt)) for op, tgt in v] for k, v in sub3["rlImages"].items()}
    carries = {op: int(c) for op, c in sub3["carries"].items()}

    exits_by_src = {src: sorted(images) for src, images in rl.items() if role.get(src) == "boundary"}
    entries_by_tgt = {}
    for src, images in rl.items():
        for op, tgt in images:
            if role.get(tgt) == "boundary":
                entries_by_tgt.setdefault(tgt, []).append((op, src))
    for tgt in entries_by_tgt:
        entries_by_tgt[tgt] = sorted(entries_by_tgt[tgt])

    escapable = sorted(exits_by_src)
    isolated = sorted(set(boundary_masks) - set(escapable))
    single = [m for m in escapable if len(exits_by_src[m]) == 1]
    dual = [m for m in escapable if len(exits_by_src[m]) == 2]
    exit_rows = sum(len(v) for v in exits_by_src.values())
    entry_rows = sum(len(v) for v in entries_by_tgt.values())
    partition = {
        "totalBoundaryMasks": len(boundary_masks),
        "totalBoundaryLiftedStates": len(boundary_masks) * 12,
        "escapableBoundaryMasks": len(escapable),
        "escapableLiftedStates": len(escapable) * 12,
        "withEntries": len(entries_by_tgt),
        "withExits": len(exits_by_src),
        "singleExitMasks": len(single),
        "dualExitMasks": len(dual),
        "isolatedBoundaryMasks": len(isolated),
        "isolatedLiftedStates": len(isolated) * 12,
        "exitRows": exit_rows,
        "entryRows": entry_rows,
        "sideRows": exit_rows + entry_rows,
        "identityChecks": {
            "totalEqualsEscapablePlusIsolated": len(boundary_masks) == len(escapable) + len(isolated),
            "entriesEqualExits": len(entries_by_tgt) == len(exits_by_src) == len(escapable),
            "singlePlusDualEqualsEscapable": len(single) + len(dual) == len(escapable),
            "sideRowsIdentity": exit_rows == entry_rows == 128,
        },
    }
    expected_partition = (154, 1848, 104, 1248, 104, 104, 80, 24, 50, 600, 128, 128, 256)
    actual_partition = (len(boundary_masks), len(boundary_masks) * 12, len(escapable), len(escapable) * 12,
                        len(entries_by_tgt), len(exits_by_src), len(single), len(dual), len(isolated),
                        len(isolated) * 12, exit_rows, entry_rows, exit_rows + entry_rows)
    if actual_partition != expected_partition or not all(partition["identityChecks"].values()):
        stops.append("S-5")

    dual_rows = []
    for mask in dual:
        for phase in range(12):
            candidates = []
            for op, tgt in exits_by_src[mask]:
                candidates.append({
                    "targetMask": tgt,
                    "targetPhase": (phase + carries[op]) % 12,
                    "operator": op,
                })
            ordered = sorted(candidates, key=lambda row: (row["targetMask"], row["targetPhase"], row["operator"]))
            winner = ordered[0]
            verdict, reasons, checks, citation = world.gate((mask, phase), (winner["targetMask"], winner["targetPhase"]))
            gate_ok = verdict == "ACCEPT" and citation == f"FamilyA:{winner['operator']}"
            if not gate_ok:
                stops.append("S-5")
            dual_rows.append({
                "source": f"{mask}@{phase}",
                "sourceMask": mask,
                "phase": phase,
                "candidates": candidates,
                "winner": winner,
                "winningTarget": f"{winner['targetMask']}@{winner['targetPhase']}",
                "gate": {"verdict": verdict, "reasons": reasons, "citation": citation, "match": gate_ok},
                "checks": checks,
            })

    partition_rows = []
    for mask in boundary_masks:
        if mask in exits_by_src:
            kind = "escapable-single" if len(exits_by_src[mask]) == 1 else "escapable-dual"
            partition_rows.append({
                "mask": mask, "classification": kind, "role": role[mask],
                "governingRoot": gov_root[mask],
                "exitApplications": [{"operator": op, "targetMask": tgt} for op, tgt in exits_by_src[mask]],
                "entryApplications": [{"operator": op, "sourceMask": src} for op, src in entries_by_tgt.get(mask, [])],
            })
        else:
            partition_rows.append({
                "mask": mask, "classification": "isolated", "role": role[mask],
                "governingRoot": gov_root[mask], "exitApplications": [], "entryApplications": [],
            })

    census_payload = {
        "schemaVersion": "mvp4.boundary-topology-census.v1",
        "task": "MVP4-DIR-1 Task 0.3",
        "partition": partition,
        "partitionTable": partition_rows,
        "dualExitMasks": dual,
        "singleExitMasks": single,
        "isolatedMasks": isolated,
        "dualExitTieBreak": {
            "rule": "smallest (target mask, target phase, operator)",
            "liftedStates": len(dual_rows),
            "expectedLiftedStates": len(dual) * 12,
            "rows": dual_rows,
        },
    }
    census_path, census_sha = write_json("boundary_topology_census.json", census_payload)

    runner_path = os.path.abspath(__file__)
    runner_sha = sha_file(runner_path)
    harness_rows = []
    for name in ("mvp2.py", "orrery_nav_bridge.py", "mvp2_orrery_nav_smoke.py"):
        path = os.path.join(SCRATCH, name)
        source = os.path.join(REPO, "tools/governed-loop", name)
        harness_rows.append({"path": path, "role": f"l19_harness_{name}", "sha256": sha_file(path),
                             "expectedSha256": sha_file(source), "match": sha_file(path) == sha_file(source)})
    pre_sync_rows = []
    for name in ("mvp2.py", "orrery_nav_bridge.py", "mvp2_orrery_nav_smoke.py"):
        path = os.path.join(TASK0, "pre_sync_harness", name)
        pre_sync_rows.append({"path": path, "sha256": sha_file(path)})

    manifest_entries = []
    for row in scratch_runner_rows:
        rel = os.path.relpath(row["path"], os.path.dirname(SCRATCH))
        staged_path = os.path.normpath(os.path.join(TASK0, "..", "l20-staged", rel))
        os.makedirs(os.path.dirname(staged_path), exist_ok=True)
        shutil.copy2(row["path"], staged_path)
        staged_sha = sha_file(staged_path)
        if staged_sha != row["expectedSha256"]:
            stops.append("S-10")
        manifest_entries.append({"path": row["path"], "stagedPath": staged_path,
                                 "sha256": row["actualSha256"], "stagedSha256": staged_sha,
                                 "role": row["role"], "kind": "mvp3_runner_or_card", "verified": row["match"] and staged_sha == row["expectedSha256"]})
    for row in harness_rows:
        manifest_entries.append({"path": row["path"], "sha256": row["sha256"], "role": row["role"],
                                 "kind": "l19_harness", "verified": row["match"]})
    manifest_entries.append({"path": runner_path, "sha256": runner_sha, "role": "mvp4_task0_census_and_staging",
                             "kind": "mvp4_runner", "verified": True})
    staging_payload = {
        "schemaVersion": "mvp4.l20-runner-staging-manifest.v1",
        "task": "MVP4-DIR-1 Task 0.4",
        "sourceFixedPoint": REPO_HEAD,
        "entries": manifest_entries,
        "verified": sum(1 for row in manifest_entries if row["verified"]),
        "total": len(manifest_entries),
    }
    if staging_payload["verified"] != staging_payload["total"]:
        stops.append("S-10")
    staging_path, staging_sha = write_json("l20_runner_staging_manifest.json", staging_payload)

    close_head, close_status_sha, _ = repo_state()
    if close_head != REPO_HEAD or close_status_sha != EMPTY_SHA:
        stops.append("S-3")

    receipt = {
        "schemaVersion": "mvp4.task-0-receipt.v1",
        "directive": "MVP4-DIR-1",
        "task": "Task 0",
        "status": "COMPLETE" if not stops else "STOP",
        "stopRulesTriggered": sorted(set(stops)),
        "opening": {
            "timestampUtc": opened,
            "repoHead": head,
            "statusPorcelainSha256": status_sha,
            "statusPorcelainEmpty": status_raw == "",
            "ledger": {"sha256": ledger_sha, "bytes": os.path.getsize(ledger), "lines": sum(1 for _ in open(ledger, "rb"))},
            "manifest": {"sha256": sha_file(manifest_path), "fileCount": manifest["fileCount"], "totalBytes": manifest["totalBytes"]},
            "checksumsSha256": sha_file(os.path.join(REPO, "CHECKSUMS.sha256")),
            "validation": {"sha256": sha_file(validation_path), "releaseId": validation.get("releaseId"),
                           "checksPassed": validation.get("checksPassed"), "checksFailed": validation.get("checksFailed")},
        },
        "repoPins": repo_pin_rows,
        "scratchRunnerPins": scratch_runner_rows,
        "gateAnchors": anchor_rows,
        "harnessSync": {"newPins": harness_rows, "preSyncArchived": pre_sync_rows},
        "bridge": {"positive": positive, "negative": negative,
                   "lockedPins": {"GOVERNED_LOOP_REQUIRE_CLEAN": "1", "GOVERNED_LOOP_REPO_HEAD": REPO_HEAD,
                                  "GOVERNED_LOOP_MANIFEST_COUNT": "1488", "GOVERNED_LOOP_LEDGER_PREFIX": "03742477"}},
        "boundaryCensus": {"path": census_path, "sha256": census_sha, "partition": partition,
                           "dualExitTieBreakRows": len(dual_rows)},
        "stagingManifest": {"path": staging_path, "sha256": staging_sha,
                            "verified": staging_payload["verified"], "total": staging_payload["total"]},
        "constraints": {"REPO_WRITES": 0, "gateBytesModified": False, "encoderBytesModified": False,
                        "qEngineBytesModified": False, "cardGateInputs": 0, "cardOutputAffectsGate": False},
        "close": {"repoHead": close_head, "statusPorcelainSha256": close_status_sha},
        "runner": {"path": runner_path, "sha256": runner_sha},
    }
    receipt_path, receipt_sha = write_json("mvp4_task_0_receipt.json", receipt)
    print(json.dumps({"status": receipt["status"], "stopRulesTriggered": receipt["stopRulesTriggered"],
                      "receipt": receipt_path, "receiptSha256": receipt_sha,
                      "censusSha256": census_sha, "stagingSha256": staging_sha,
                      "partition": partition, "staging": {"verified": staging_payload["verified"], "total": staging_payload["total"]}},
                     indent=2, sort_keys=True))
    return 0 if not stops else 1


if __name__ == "__main__":
    sys.exit(main())
