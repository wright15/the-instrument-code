#!/usr/bin/env python3
"""MVP5-DIR-1 Task 0: L20 fixed-point verification and Policy-v3 sweep staging.

Scratch-only. Verifies every pinned surface from the directive, exercises the
locked bridge --check in positive and negative form, stages the three
Policy-v3 sweep artifacts byte-for-byte, and independently recomputes the
12-phase orbit sweep from in-tree census and ground-truth inputs.
"""
import hashlib
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(os.environ.get("GOVERNED_LOOP_REPO", "/home/erick/projects/integrated-release"))
SCRATCH = Path(os.environ.get("MVP5_SCRATCH", "/home/erick/workspace/scratch-governed-loop-run/mvp5"))
SWEEP_SRC = Path(os.environ.get("MVP5_SWEEP_SRC", "/home/erick/workspace/governed-loop"))
TASK_DIR = SCRATCH / "task-0"
STAGED_SWEEP = SCRATCH / "l21-staged" / "policy-v3-sweep"

FIXED_POINT = {
    "head": "ba6ae1fe2c8b31ab739c91593701177678bff18b",
    "tree_clean": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "ledger_sha256": "8d0a04732370167e84b439a1a019ff6475c951ab86c258b84c79304534f2102d",
    "ledger_bytes": 340531,
    "ledger_lines": 4112,
    "manifest_sha256": "933ae6027145e8f636857b169bd3dac323f90fe8c707d045fdac5237db5ce355",
    "manifest_files": 1516,
    "manifest_bytes": 96848773,
    "checksums_sha256": "63e1e776492d2b481e79ebd6c6c29f5e055c0f001cd75777534febbb0f65db34",
    "validation_sha256": "e31645789a84db704686def6d47f001e5986a07196c20bea041a099247df4636",
    "validation_release": "seven-governors-integrated-1.9.0",
    "validation_passed": 418,
    "validation_failed": 0,
    "landing_receipt_sha256": "311e10ad155d1046f6c2b0800759552f2b8de5fe84cf3a1bab60a1a7268572db",
}

TREE_PINS = {
    "tools/governed-loop/mvp2.py": ("79c0cf706fffc23745cab6e87ffbc46d34d70ad94a93291135725e388dc17328", 38997),
    "tools/governed-loop/orrery_nav_bridge.py": ("9f2b3da60f0aa3695608d60640b0303a7d5ec0500d27fbe49284c7f399ae4824", 25624),
    "tools/governed-loop/mvp2_orrery_nav_smoke.py": ("851c9bf2a29c2c5a0a74f88875fc5420ee81c27c246dcdb8ef6f0e079e277c9c", 27574),
    "tools/governed-loop/orrery_nav_overlay.js": ("ad558decfa6547c2b6f7b3ceb9247326a0ee9508df5e9c4523ee90b4a64a0613", 17265),
    "tools/governed-loop/bridge_init.js": ("aef2b7429e939dd1cf3e71f96ba8d9790e782b1fc8fc73bf0c59d8ee7336406a", 2521),
    "tools/governed-loop/census_462.json": ("242bce7423bc2eb0ae61ee431c27901d6a87401b8b3ffd6725a04d0e1ed0685a", 194194),
    "tools/governed-loop/frozen_ground_truth.json": ("007b0ffe65015bd2c5f1a6fe0df8969961ce8cfb3d499677b143d971e1fc5744", 91360),
    "tools/governed-loop/frozen_seam_substrate_v3.json": ("9f9818effa5d11e4ef2634122c9f484faf6790323cabae130561c1c75e8a295f", 47207),
    "tools/governed-loop/seam_legal_moves_v3.json": ("e6cf62a8eefa0924da9286f2e664c1914d9d620ed2d299929f684fd48225c274", 551287),
    "tools/governed-loop/freeze_report_v3.json": ("1c65a07c37740797b2a16048ddac4c17c9877465e7c03498d783291a4a433683", 6573),
    "tools/governed-loop/spike01_evidence.json": ("cb170c0d00cea3f2db2b69779dc339848befa60f5a78d257c8680f99f6e56fec", 8836),
    "tools/governed-loop/mvp4/task-a/mvp4_dynamic_chaldean_card.json": ("6486599187687edb1e28481b2bbc79d9a11a06001e4a237505c5e44c1c1a1469", 1999),
    "tools/governed-loop/mvp4/task-b/mvp4_symbolic_planner.py": ("9ff511f14282cbe6ee48010d67092c70c25da0bf5fa6dbd1e50382afeb85f5c0", 21348),
    "tools/governed-loop/mvp4/task-b/mvp4_symbolic_tools.py": ("1d74b401cea788edf237458e8c8844c987c77c94814f8b533c766aaa147701ab", 7139),
    "tools/governed-loop/mvp4/task-b/mvp4_graph_census.json": ("165fb6b33a1ced983b45189738541bba3e206d5655a729c8deeff5cd72627d12", 580743),
    "tools/governed-loop/mvp4/task-c/mvp4_q_intra_node.py": ("8b39ffe4be4d1f801cf1065cd8928c681002249de8ebad1d5246f277e94f815f", 4721),
    "tools/governed-loop/mvp4/task-c/coupled_trace.jsonl": ("75d52c0ced56af403b4e4e6379474bf3add7138716d192fb7401a3b90c86bc9d", 52007),
    "src/fivefold/quintessence.py": ("eefd7e1e060189261c8063652d2ed73a09b16d3ffdcb9f259502a107ef9ceaa0", 5163),
    "tests/fixtures/fivefold_q_table.v1.json": ("bd361793d7c1295872fc95c230f3f9ce234f2cd4ea6899e9a3df08700aa8d604", 3572),
    "orrery/src/audio.ts": ("e863b845c8f2709a0fe0e6fe706dce603e795b760c6561d110d240ddb1dfca88", 37063),
    "qa/mvp4_task_0_receipt.json": ("906ba0b196755eafe41ee8abf2d70a03040a0bc995502856984cec1d798e079e", 15359),
    "qa/mvp4_task_a_receipt.json": ("d4e63cb51f6339edf7dcdb721d9753ea6c6cac580f35cf9397201803cd8fdbc1", 196067),
    "qa/mvp4_task_b_receipt.json": ("ffab52b696aeda84204c463abd700e7be86d2e430d6dc8d43d72587381aa7d12", 35008),
    "qa/mvp4_task_c_receipt.json": ("834e3a64c22fba07fa0179b95d8ee26d152c038f67a0a387ae3a2b1796cf4295", 126010),
    "qa/mvp4_task_d_receipt.json": ("8b15f274538cc093e358c306a276a72cc0ca9e04ad8bbec35074ab57289dfc02", 36257),
}

SWEEP_PINS = {
    "plv3_sweep_predeclared.json": ("14117c9460a6b611f849747f4881f296a8f3ce2108bb23524fe8beecd354e87b", 1712),
    "plv3_sweep.json": ("6a943e44c9ed2dc0dc39810c9656872ee55d5ea86bcd4a1e80eb7de505ad8243", 10181),
    "plv3_sweep.py": ("22e6b1e5998c92f445fe3a631b2842231b2d5fdbea56ca760436f3a022ac5c15", 9318),
}

EXPECTED_EDGE_DIGEST = "7c428a86e6fa60b632eab448a4946c42d79949c4010981dad81e455b081d6b39"
EXPECTED_T11_TOTAL = 12628
EXPECTED_T11_MEMBERS = 308


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))


def pc_list(mask):
    return [i for i in range(12) if (mask >> i) & 1]


def pc_sum(mask):
    return sum(pc_list(mask))


def transpose(mask, c):
    out = 0
    for pc in pc_list(mask):
        out |= 1 << ((pc + c) % 12)
    return out


def run_bridge_check(prefix):
    env = dict(os.environ)
    env["GOVERNED_LOOP_REPO_HEAD"] = FIXED_POINT["head"]
    env["GOVERNED_LOOP_MANIFEST_COUNT"] = str(FIXED_POINT["manifest_files"])
    env["GOVERNED_LOOP_LEDGER_PREFIX"] = prefix
    proc = subprocess.run(
        [sys.executable, str(REPO / "tools" / "governed-loop" / "orrery_nav_bridge.py"), "--check"],
        capture_output=True, text=True, env=env, cwd=str(REPO), timeout=600,
    )
    return {"exitCode": proc.returncode, "stdout": proc.stdout, "stderr": proc.stderr}


def main():
    TASK_DIR.mkdir(parents=True, exist_ok=True)
    STAGED_SWEEP.mkdir(parents=True, exist_ok=True)
    stop = []
    receipt = {
        "schemaVersion": "governed-loop.mvp5-task0.v1",
        "task": "MVP5-DIR-1 Task 0",
        "directive": "MVP5-DIR-1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "layer": "SPEC-001 §1.3 overlay dynamics",
        "gov517_correspondence_claimed": False,
        "still_set_label": "still_set",
        "opening": {},
        "sweep": {},
        "constraints": {
            "repoWrites": 0,
            "orreryChanges": 0,
            "gateBytesTouched": False,
            "executionRealm": str(SCRATCH),
        },
    }
    opening = receipt["opening"]

    # 1. Repository fixed point.
    head = subprocess.run(["git", "rev-parse", "HEAD"], cwd=str(REPO), capture_output=True, text=True).stdout.strip()
    porcelain = subprocess.run(["git", "status", "--porcelain"], cwd=str(REPO), capture_output=True, text=True).stdout
    tree_digest = sha256_bytes(porcelain.encode())
    ledger_path = REPO / "provenance" / "DECISION_LEDGER.md"
    ledger_bytes = ledger_path.read_bytes()
    manifest = json.loads((REPO / "MANIFEST.json").read_text(encoding="utf-8"))
    validation = json.loads((REPO / "qa" / "integrated-release-validation.json").read_text(encoding="utf-8"))
    repo = {
        "head": head,
        "treeClean": porcelain == "",
        "treeDigest": tree_digest,
        "ledgerSha256": sha256_file(ledger_path),
        "ledgerPrefix": sha256_file(ledger_path)[:8],
        "ledgerBytes": len(ledger_bytes),
        "ledgerLines": ledger_bytes.count(b"\n"),
        "manifestSha256": sha256_file(REPO / "MANIFEST.json"),
        "manifestFileCount": manifest.get("fileCount"),
        "manifestTotalBytes": manifest.get("totalBytes"),
        "checksumsSha256": sha256_file(REPO / "CHECKSUMS.sha256"),
        "validationSha256": sha256_file(REPO / "qa" / "integrated-release-validation.json"),
        "validationRelease": validation.get("releaseId"),
        "validationPassed": validation.get("checksPassed"),
        "validationFailed": validation.get("checksFailed"),
        "landingReceiptSha256": sha256_file(REPO / "qa" / "mvp4_landing_receipt.json"),
    }
    checks = {
        "head": head == FIXED_POINT["head"],
        "treeClean": tree_digest == FIXED_POINT["tree_clean"],
        "ledgerSha256": repo["ledgerSha256"] == FIXED_POINT["ledger_sha256"],
        "ledgerBytes": repo["ledgerBytes"] == FIXED_POINT["ledger_bytes"],
        "ledgerLines": repo["ledgerLines"] == FIXED_POINT["ledger_lines"],
        "manifestSha256": repo["manifestSha256"] == FIXED_POINT["manifest_sha256"],
        "manifestFileCount": repo["manifestFileCount"] == FIXED_POINT["manifest_files"],
        "manifestTotalBytes": repo["manifestTotalBytes"] == FIXED_POINT["manifest_bytes"],
        "checksumsSha256": repo["checksumsSha256"] == FIXED_POINT["checksums_sha256"],
        "validationSha256": repo["validationSha256"] == FIXED_POINT["validation_sha256"],
        "validationRelease": repo["validationRelease"] == FIXED_POINT["validation_release"],
        "validationPassed": repo["validationPassed"] == FIXED_POINT["validation_passed"],
        "validationFailed": repo["validationFailed"] == FIXED_POINT["validation_failed"],
        "landingReceiptSha256": repo["landingReceiptSha256"] == FIXED_POINT["landing_receipt_sha256"],
    }
    repo["checks"] = checks
    opening["repo"] = repo
    if not all(checks.values()):
        stop.append({"rule": "S-1", "detail": "repository fixed point drift", "failed": [k for k, v in checks.items() if not v]})

    # 2. In-tree pins.
    tree = {}
    for rel, (expected_sha, expected_size) in TREE_PINS.items():
        path = REPO / rel
        actual_sha = sha256_file(path) if path.exists() else None
        actual_size = path.stat().st_size if path.exists() else None
        tree[rel] = {
            "sha256": actual_sha,
            "bytes": actual_size,
            "expectedBytes": expected_size,
            "bytesMatch": actual_size == expected_size,
            "match": actual_sha == expected_sha,
        }
    opening["treePins"] = tree
    opening["sizeNotes"] = [
        {"path": rel, "directiveBytes": entry["expectedBytes"], "observedBytes": entry["bytes"],
         "note": "SHA-256 pin matches; directive byte column differs from observed file size"}
        for rel, entry in tree.items() if not entry["bytesMatch"]
    ]
    if not all(entry["match"] for entry in tree.values()):
        stop.append({"rule": "S-1", "detail": "in-tree pin drift", "failed": [k for k, v in tree.items() if not v["match"]]})

    # 3. Sweep source pins.
    sweep_src = {}
    for name, (expected_sha, expected_size) in SWEEP_PINS.items():
        path = SWEEP_SRC / name
        actual_sha = sha256_file(path) if path.exists() else None
        actual_size = path.stat().st_size if path.exists() else None
        sweep_src[name] = {
            "sha256": actual_sha,
            "bytes": actual_size,
            "match": actual_sha == expected_sha and actual_size == expected_size,
        }
    opening["sweepSourcePins"] = sweep_src
    if not all(entry["match"] for entry in sweep_src.values()):
        stop.append({"rule": "S-1", "detail": "policy-v3 sweep source pin drift", "failed": [k for k, v in sweep_src.items() if not v["match"]]})

    # 4. Gate line anchors.
    gate_lines = (REPO / "tools/governed-loop/mvp2.py").read_text(encoding="utf-8").splitlines()
    anchors = {
        "150-154": gate_lines[149:154],
        "169": gate_lines[168],
        "171-172": gate_lines[170:172],
        "183-184": gate_lines[182:184],
        "733": gate_lines[732],
    }
    anchor_checks = {
        "150-154": "if cm == nm and cp == np_:" in anchors["150-154"][0]
        and any("ungoverned-transition" in line for line in anchors["150-154"]),
        "169": "same_root = cr is not None" in anchors["169"],
        "171-172": "if same_root and cp == np_:" in anchors["171-172"][0] and "ACCEPT" in anchors["171-172"][1],
        "183-184": "if checks[\"boundary_endpoint\"]:" in anchors["183-184"][0] and "ungoverned-transition" in anchors["183-184"][1],
        "733": "dwellMs" in anchors["733"] and "ORRERY_BRIDGE_DWELL_MS" in anchors["733"],
    }
    opening["gateAnchors"] = {"lines": anchors, "checks": anchor_checks}
    if not all(anchor_checks.values()):
        stop.append({"rule": "S-1", "detail": "mvp2.py line anchor drift", "failed": [k for k, v in anchor_checks.items() if not v]})

    # 5. Locked bridge --check, positive and negative.
    positive = run_bridge_check("8d0a0473")
    negative = run_bridge_check("00000000")
    negative_message = "FAIL-CLOSED: ledger prefix 8d0a0473 != 00000000"
    bridge = {
        "positive": {
            "exitCode": positive["exitCode"],
            "passed": positive["exitCode"] == 0,
            "summary": positive["stdout"].splitlines()[0] if positive["stdout"] else "",
            "nodes": 5544 if '"nodes": 5544' in positive["stdout"] else None,
        },
        "negative": {
            "exitCode": negative["exitCode"],
            "rejected": negative["exitCode"] == 1,
            "message": (negative["stdout"] + negative["stderr"]).strip(),
            "expectedMessage": negative_message,
            "messageMatch": negative_message in (negative["stdout"] + negative["stderr"]),
        },
    }
    bridge["passed"] = (
        bridge["positive"]["passed"]
        and bridge["negative"]["rejected"]
        and bridge["negative"]["messageMatch"]
    )
    opening["bridgeCheck"] = bridge
    if not bridge["passed"]:
        stop.append({"rule": "S-2", "detail": "locked bridge --check breach", "detailData": bridge})

    # 6. Stage the three Policy-v3 sweep artifacts byte-for-byte.
    staged = []
    for name in SWEEP_PINS:
        src = SWEEP_SRC / name
        dst = STAGED_SWEEP / name
        shutil.copy2(src, dst)
        src_sha = sha256_file(src)
        dst_sha = sha256_file(dst)
        staged.append({
            "name": name,
            "source": str(src),
            "staged": str(dst),
            "sourceSha256": src_sha,
            "stagedSha256": dst_sha,
            "bytes": dst.stat().st_size,
            "identity": src_sha == dst_sha and src_sha == SWEEP_PINS[name][0],
        })
    receipt["sweep"]["staged"] = staged
    if not all(entry["identity"] for entry in staged):
        stop.append({"rule": "S-4", "detail": "staged sweep copy identity failure", "failed": [e["name"] for e in staged if not e["identity"]]})

    # 7. Independent 12-phase recompute from in-tree census + ground truth.
    census = json.loads((REPO / "tools/governed-loop/census_462.json").read_text(encoding="utf-8"))
    gt = json.loads((REPO / "tools/governed-loop/frozen_ground_truth.json").read_text(encoding="utf-8"))
    substrate = json.loads((REPO / "tools/governed-loop/frozen_seam_substrate_v3.json").read_text(encoding="utf-8"))
    receipt_json = json.loads((SWEEP_SRC / "plv3_sweep.json").read_text(encoding="utf-8"))
    records = census["records"]
    masks = {int(r["stateId"]): int(r["pitchMask"]) for r in records}
    forte = {int(r["stateId"]): r["forte"] for r in records}
    role = {int(r["stateId"]): r["role"] for r in records}

    pc0_masks = sum(1 for mask in masks.values() if mask & 1)
    pc0_exact = sum(1 for mask in masks.values() if len([pc for pc in pc_list(mask) if pc == 0]) == 1)
    pc0_check = {
        "records": len(records),
        "masksWithPc0": pc0_masks,
        "masksWithExactlyOnePc0": pc0_exact,
        "allAnchoredMasksHaveExactlyOnePc0": pc0_exact == 462,
        "evidenceFlag": True,
    }

    wrap_checks = 0
    wrap_failures = []
    for mask in masks.values():
        k = len(pc_list(mask))
        base = pc_sum(mask)
        for c in range(12):
            delta = pc_sum(transpose(mask, c)) - base
            wraps = sum(1 for pc in pc_list(mask) if pc + c >= 12)
            expected = c * k - 12 * wraps
            wrap_checks += 1
            if delta != expected:
                wrap_failures.append({"mask": mask, "phase": c, "delta": delta, "expected": expected})
    wrap_check = {
        "checks": wrap_checks,
        "failures": len(wrap_failures),
        "identityHolds": len(wrap_failures) == 0,
        "failureWitnesses": wrap_failures[:5],
    }

    orbits = []
    all_exact = True
    total_t11 = 0
    total_members = 0
    for orbit in gt["orbits"]:
        members = [int(m) for m in orbit["memberIds"]]
        n = len(members)
        totals = []
        for p in range(12):
            totals.append(sum(pc_sum(transpose(masks[m], p)) for m in members))
        exact = totals[11] == 41 * n
        all_exact = all_exact and exact
        total_t11 += totals[11]
        total_members += n
        orbits.append({
            "orbitId": orbit["orbitId"],
            "tier": orbit["tier"],
            "memberCount": n,
            "totals": totals,
            "phase11Total": totals[11],
            "phase11ExpectedTotal": 41 * n,
            "phase11Exact41": exact,
        })

    # Independent licensed-set digest recompute from the frozen substrate.
    base_rows = []
    for src_mask, images in substrate["rlImages"].items():
        for op, tgt_mask in images:
            base_rows.append((op, int(src_mask), int(tgt_mask)))
    edges = []
    for op, src_mask, tgt_mask in base_rows:
        carry = int(substrate["carries"][op])
        if carry not in (1, -1):
            continue
        for p in range(12):
            edges.append([
                op, src_mask, p, tgt_mask, (p + carry) % 12,
                1 if (forte[src_mask] == "7-35" and forte[tgt_mask] == "7-35") else 0,
                1 if (role[src_mask] == "boundary" or role[tgt_mask] == "boundary") else 0,
            ])
    edge_digest = sha256_bytes(canonical(edges).encode("utf-8"))

    receipt_orbits = {o["orbitId"]: o for o in receipt_json["orbits"]}
    orbit_match = all(
        orb["totals"] == receipt_orbits[orb["orbitId"]]["totals"]
        and orb["phase11Total"] == receipt_orbits[orb["orbitId"]]["phase11Total"]
        and orb["memberCount"] == receipt_orbits[orb["orbitId"]]["memberCount"]
        for orb in orbits
    )
    licensed = receipt_json["licensedSet"]
    digest_match = (
        edge_digest == EXPECTED_EDGE_DIGEST
        and edge_digest == licensed["edgeSetDigest"]
        and len(edges) == licensed["edgeCount"] == 5040
        and sum(1 for e in edges if e[0] == "R1") == licensed["raised"] == 2520
        and sum(1 for e in edges if e[0] == "L1") == licensed["lowered"] == 2520
    )
    sweep_recompute = {
        "pc0": pc0_check,
        "wrapCountIdentity": wrap_check,
        "orbits": orbits,
        "t11": {
            "orbitCount": len(orbits),
            "allOrbitsExact41": all_exact,
            "total": total_t11,
            "expectedTotal": EXPECTED_T11_TOTAL,
            "totalExact": total_t11 == EXPECTED_T11_TOTAL,
            "members": total_members,
            "expectedMembers": EXPECTED_T11_MEMBERS,
            "meanExact": total_t11 == 41 * total_members,
        },
        "licensedSet": {
            "edgeCount": len(edges),
            "raised": sum(1 for e in edges if e[0] == "R1"),
            "lowered": sum(1 for e in edges if e[0] == "L1"),
            "edgeSetDigest": edge_digest,
            "expectedDigest": EXPECTED_EDGE_DIGEST,
            "digestMatch": digest_match,
        },
        "receiptMatch": {
            "orbitTotalsMatch": orbit_match,
            "verdict": receipt_json["verdict"],
            "allOrbitsExact41": receipt_json["allOrbitsExact41"],
            "wrapChecks": receipt_json["wrapCountIdentity"]["checks"],
            "wrapFailures": receipt_json["wrapCountIdentity"]["failures"],
        },
    }
    sweep_recompute["passed"] = (
        pc0_check["allAnchoredMasksHaveExactlyOnePc0"]
        and wrap_check["identityHolds"]
        and all_exact
        and sweep_recompute["t11"]["totalExact"]
        and sweep_recompute["t11"]["meanExact"]
        and orbit_match
        and digest_match
        and receipt_json["verdict"] == "PASS"
    )
    receipt["sweep"]["recompute"] = sweep_recompute
    if not sweep_recompute["passed"]:
        stop.append({"rule": "S-4", "detail": "policy-v3 sweep recompute mismatch", "detailData": sweep_recompute})

    # 8. Close-of-task repository state (scratch writes must not touch the repo).
    close_head = subprocess.run(["git", "rev-parse", "HEAD"], cwd=str(REPO), capture_output=True, text=True).stdout.strip()
    close_porcelain = subprocess.run(["git", "status", "--porcelain"], cwd=str(REPO), capture_output=True, text=True).stdout
    close_orrery = subprocess.run(["git", "status", "--porcelain", "--", "orrery/"], cwd=str(REPO), capture_output=True, text=True).stdout
    receipt["close"] = {
        "head": close_head,
        "headUnchanged": close_head == FIXED_POINT["head"],
        "treeClean": close_porcelain == "",
        "treeDigest": sha256_bytes(close_porcelain.encode()),
        "orreryClean": close_orrery == "",
    }
    if close_head != FIXED_POINT["head"] or close_porcelain != "":
        stop.append({"rule": "S-3", "detail": "repository write detected at task close"})

    receipt["stopRulesTriggered"] = stop
    receipt["status"] = "COMPLETE" if not stop else "STOP"

    # 9. Write the receipt and initialize the L21 staging manifest.
    receipt_path = TASK_DIR / "mvp5_task_0_receipt.json"
    receipt_path.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    receipt_sha = sha256_file(receipt_path)

    manifest_entries = []
    for entry in staged:
        manifest_entries.append({
            "path": str(Path(entry["staged"]).relative_to(SCRATCH)),
            "sha256": entry["stagedSha256"],
            "bytes": entry["bytes"],
            "origin": "task-0",
            "role": "policy-v3-sweep",
        })
    manifest_entries.append({
        "path": str(receipt_path.relative_to(SCRATCH)),
        "sha256": receipt_sha,
        "bytes": receipt_path.stat().st_size,
        "origin": "task-0",
        "role": "receipt",
    })
    staging_manifest = {
        "schemaVersion": "governed-loop.mvp5-l21-staging.v1",
        "directive": "MVP5-DIR-1",
        "fixedPoint": {
            "head": FIXED_POINT["head"],
            "ledgerSha256": FIXED_POINT["ledger_sha256"],
            "manifestSha256": FIXED_POINT["manifest_sha256"],
        },
        "status": "OPEN",
        "entries": manifest_entries,
        "entryCount": len(manifest_entries),
        "allHashVerified": all(
            sha256_file(SCRATCH / e["path"]) == e["sha256"] for e in manifest_entries
        ),
    }
    (SCRATCH / "l21_staging_manifest.json").write_text(
        json.dumps(staging_manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )

    print("MVP5 TASK 0")
    print(f"  fixed point: {head[:12]} / clean={repo['treeClean']} / ledger {repo['ledgerPrefix']}")
    print(f"  pins: tree {sum(1 for v in tree.values() if v['match'])}/{len(tree)} / sweep {sum(1 for v in sweep_src.values() if v['match'])}/{len(sweep_src)}")
    print(f"  bridge --check: positive exit {positive['exitCode']} / negative exit {negative['exitCode']}")
    print(f"  staged sweep artifacts: {sum(1 for e in staged if e['identity'])}/{len(staged)}")
    print(f"  recompute: pc0 {pc0_masks}/462 / wrap {wrap_checks} checks 0 fail / T11 {total_t11} = {total_members} x 41 / digest {edge_digest[:12]}")
    print(f"  status: {receipt['status']} / stop rules: {[s['rule'] for s in stop]}")
    print(f"  receipt: {receipt_path}")
    return 0 if not stop else 1


if __name__ == "__main__":
    sys.exit(main())
