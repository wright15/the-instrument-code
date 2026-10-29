#!/usr/bin/env python3
import datetime
import hashlib
import json
import os
import subprocess
import sys

sys.dont_write_bytecode = True

SCRATCH = os.environ.get("GOVERNED_LOOP_SCRATCH", "/home/erick/workspace/scratch-governed-loop-run/mvp4")
REPO = os.environ.get("GOVERNED_LOOP_REPO", "/home/erick/projects/integrated-release")
TASK_DIR = os.path.join(SCRATCH, "task-c")
TASK_B_DIR = os.path.join(SCRATCH, "task-b")
REPO_HEAD = "148a96f8c5ce5bcd83fad832170bc76c7075a943"
EMPTY_SHA = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
LEDGER_SHA = "037424774910287b29a9101569127d4a7850d4f86376540e350bbe14f0c6663b"
MANIFEST_SHA = "93fb9c836f1fa108a607b74d50d3bc3adcc3dcd9311e0edb994685241f4b8a05"
CHECKSUMS_SHA = "fd918c280c9f0789102bc09b0fd041c5875a73cb9ae7f1754d5740b2ecd0daeb"
VALIDATION_SHA = "cff3c3157d520a4bedceb5f62a4c04cb482d5e4843de41cda812292c881a8fa5"
Q_SHA = "eefd7e1e060189261c8063652d2ed73a09b16d3ffdcb9f259502a107ef9ceaa0"
Q_FIXTURE_SHA = "bd361793d7c1295872fc95c230f3f9ce234f2cd4ea6899e9a3df08700aa8d604"
TASK0_CENSUS_SHA = "38c271898ecfcbb8731239dbde38d58bf8e686aa1d31b648f22418c78eb40faf"
TASK_A_RECEIPT_SHA = "d4e63cb51f6339edf7dcdb721d9753ea6c6cac580f35cf9397201803cd8fdbc1"
TASK_B_RECEIPT_SHA = "ffab52b696aeda84204c463abd700e7be86d2e430d6dc8d43d72587381aa7d12"
TASK_A_CARD_SHA = "6486599187687edb1e28481b2bbc79d9a11a06001e4a237505c5e44c1c1a1469"
MACRO_PATH = [
    "1387@0", "859@0", "1717@11", "3433@10", "1721@10",
    "861@11", "1245@11", "623@0", "1143@0",
]
PINNED_VOCAB = {("ACCEPT", ()), ("REJECT", ("not-census-state",)),
                ("REJECT", ("ungoverned-transition",)), ("REJECT", ("unlicensed-transition",))}

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
    "src/fivefold/quintessence.py": Q_SHA,
    "tests/fixtures/fivefold_q_table.v1.json": Q_FIXTURE_SHA,
    "qa/mvp3_task_a_receipt.json": "cb9083f435a41b17a009d5fb249661c1998d107556bf6a6ee97fa5293f1461a0",
    "qa/mvp3_task_b0_receipt.json": "ae50fd2b9b7c6b68157ae2a745d85be213e2d2afcf1db66d42766c5a61f7801e",
    "qa/mvp3_task_b1_receipt.json": "c658a5885c5fb989eec6eab1a3a3964ae3e2228606cb806f0867c6c1d829e5d4",
    "qa/mvp3_task_c_receipt.json": "022856bb9a2bb88162f77e04ca4dd60b0b93f68c62d2bb1404f14334d0729bfc",
}


def sha_bytes(data):
    return hashlib.sha256(data).hexdigest()


def sha_file(path):
    with open(path, "rb") as handle:
        return sha_bytes(handle.read())


def sha_text(text):
    return sha_bytes(text.encode("utf-8"))


def write_json(path, payload):
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, sort_keys=True)
        handle.write("\n")
    return sha_file(path)


def find_floats(value, path="root"):
    found = []
    if isinstance(value, float):
        found.append({"path": path, "value": value})
    elif isinstance(value, dict):
        for key, child in value.items():
            found.extend(find_floats(child, f"{path}.{key}"))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            found.extend(find_floats(child, f"{path}[{index}]"))
    return found


def repo_snapshot():
    head = subprocess.run(["git", "-C", REPO, "rev-parse", "HEAD"],
                          capture_output=True, text=True, check=True).stdout.strip()
    porcelain = subprocess.run(["git", "-C", REPO, "status", "--porcelain"],
                               capture_output=True, text=True, check=True).stdout
    return {"head": head, "treeClean": porcelain.strip() == "",
            "statusPorcelainSha256": sha_text(porcelain)}


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
    out = os.path.join(TASK_DIR, f"bridge_check_{mode}.out")
    with open(out, "w", encoding="utf-8") as handle:
        handle.write(proc.stdout)
        handle.write(proc.stderr)
    return {"mode": mode, "ledgerPrefix": ledger_prefix, "exitCode": proc.returncode,
            "stdout": proc.stdout, "stderr": proc.stderr,
            "logPath": out, "logSha256": sha_file(out)}


def parse_node(node_id):
    mask_text, phase_text = str(node_id).split("@", 1)
    return int(mask_text), int(phase_text)


def category_of(menu_row):
    kind = menu_row["kind"]
    if kind == "tier-1":
        return "tier-1"
    if kind in ("seamA:R1", "seamA:L1"):
        return kind
    if kind == "seamB:bridge":
        return "seamB:bridge"
    return "boundary-auto-transit"


def card_rank(category):
    return {"tier-1": 0, "seamA:R1": 1, "seamA:L1": 2,
            "seamB:bridge": 3, "boundary-auto-transit": 3}.get(category, 4)


def dynamic_audit(planner, card, node, history, chosen):
    params = card["parameters"]
    weights = {int(k): int(v) for k, v in params["weights_numerator"].items()}
    window = int(params["W"])
    alpha = int(params["alpha"])
    threshold = int(params["N_threshold"])
    beta = int(params["beta"])
    seam_base = int(params["W_seam_base"])
    degrees = {"Saturn": 1, "Jupiter": 2, "Mars": 3, "Sun": 4,
               "Venus": 5, "Mercury": 6, "Moon": 7}
    node_mask, node_phase = parse_node(node)
    last_root = planner.gov_root.get(node_mask)
    dwell = 0
    for state in reversed(history[:-1]):
        state_mask, state_phase = parse_node(state)
        if planner.gov_root.get(state_mask) == last_root and state_phase == node_phase:
            dwell += 1
        else:
            break
    rows = []
    for row in planner.neighborhood(node)["legalOutboundMenu"]:
        candidate = row["candidateId"]
        if candidate == node:
            continue
        category = category_of(row)
        is_seam = category != "tier-1"
        if is_seam:
            base = seam_base
        else:
            target_mask = parse_node(candidate)[0]
            degree = degrees.get(planner.office.get(target_mask))
            base = weights.get(degree, seam_base)
        visits = sum(1 for state in history[-window:] if state == candidate)
        boost = beta * max(0, dwell - threshold + 1) if is_seam else 0
        score = base - alpha * visits + boost
        rows.append({"candidateId": candidate, "category": category, "kind": row["kind"],
                     "operator": row.get("operator"), "citation": row.get("citation"),
                     "W_base": base, "visits": visits, "n_in_family": dwell,
                     "seam_boost": boost, "score": score})
    rows.sort(key=lambda row: (-row["score"], card_rank(row["category"]),
                               parse_node(row["candidateId"])[0],
                               parse_node(row["candidateId"])[1],
                               row.get("operator") or ""))
    index = next((i for i, row in enumerate(rows) if row["candidateId"] == chosen), None)
    return {"node": node, "chosen": chosen, "outboundCount": len(rows),
            "presentedIndex": index, "presentedFirst": index == 0,
            "chosenRow": rows[index] if index is not None else None,
            "ranking": rows}


def main():
    os.makedirs(TASK_DIR, exist_ok=True)
    stops = []
    opened = datetime.datetime.now(datetime.timezone.utc).isoformat()
    open_snapshot = repo_snapshot()
    if open_snapshot["head"] != REPO_HEAD or not open_snapshot["treeClean"]:
        stops.append("S-1" if open_snapshot["head"] != REPO_HEAD else "S-3")

    ledger = os.path.join(REPO, "provenance/DECISION_LEDGER.md")
    manifest_path = os.path.join(REPO, "MANIFEST.json")
    manifest = json.load(open(manifest_path, encoding="utf-8"))
    validation_path = os.path.join(REPO, "qa/integrated-release-validation.json")
    validation = json.load(open(validation_path, encoding="utf-8"))
    if sha_file(ledger) != LEDGER_SHA or sha_file(manifest_path) != MANIFEST_SHA:
        stops.append("S-1")
    if sha_file(os.path.join(REPO, "CHECKSUMS.sha256")) != CHECKSUMS_SHA or sha_file(validation_path) != VALIDATION_SHA:
        stops.append("S-1")

    repo_pins = []
    for rel, expected in REPO_PINS.items():
        actual = sha_file(os.path.join(REPO, rel))
        repo_pins.append({"path": rel, "expectedSha256": expected, "actualSha256": actual,
                          "match": actual == expected})
        if actual != expected:
            stops.append("S-1")

    handoff = {
        "task0CensusSha256": sha_file(os.path.join(SCRATCH, "task-0", "boundary_topology_census.json")),
        "taskAReceiptSha256": sha_file(os.path.join(SCRATCH, "task-a", "mvp4_task_a_receipt.json")),
        "taskBReceiptSha256": sha_file(os.path.join(TASK_B_DIR, "mvp4_task_b_receipt.json")),
        "taskACardSha256": sha_file(os.path.join(SCRATCH, "task-a", "mvp4_dynamic_chaldean_card.json")),
    }
    if handoff["task0CensusSha256"] != TASK0_CENSUS_SHA:
        stops.append("S-1")
    if handoff["taskAReceiptSha256"] != TASK_A_RECEIPT_SHA:
        stops.append("S-1")
    if handoff["taskBReceiptSha256"] != TASK_B_RECEIPT_SHA:
        stops.append("S-1")
    if handoff["taskACardSha256"] != TASK_A_CARD_SHA:
        stops.append("S-10")

    positive = run_bridge("positive", "03742477")
    negative = run_bridge("negative", "00000000")
    if positive["exitCode"] != 0:
        stops.append("S-2")
    if negative["exitCode"] == 0 or "FAIL-CLOSED" not in (negative["stdout"] + negative["stderr"]):
        stops.append("S-2")

    sys.path.insert(0, TASK_DIR)
    sys.path.insert(0, TASK_B_DIR)
    import mvp4_q_intra_node as qintra
    from mvp4_symbolic_planner import Planner
    from mvp4_symbolic_tools import SymbolicTools

    quintessence = qintra.load_quintessence()
    fixture_path = os.path.join(REPO, "tests", "fixtures", "fivefold_q_table.v1.json")
    fixture = json.load(open(fixture_path, encoding="utf-8"))
    generated_rows = [list(row) for row in quintessence.q_table()]
    table_match = generated_rows == fixture["entries"]
    if not table_match or len(generated_rows) != 192:
        stops.append("S-1")
    q1_4_not_id = quintessence.q_power(4, 0) != 0
    q1_12_id = all(quintessence.q_power(12, state) == state for state in range(16))
    if not q1_4_not_id or not q1_12_id:
        stops.append("S-8")

    module_path = os.path.join(TASK_DIR, "mvp4_q_intra_node.py")
    module_text = open(module_path, encoding="utf-8").read()
    if "kernel" in module_text:
        stops.append("S-8")

    planner = Planner()
    card = json.load(open(os.path.join(SCRATCH, "task-a", "mvp4_dynamic_chaldean_card.json"),
                          encoding="utf-8"))
    card_floats = find_floats(card)
    if card_floats:
        stops.append("S-6")

    macro_hops = []
    micro_steps = []
    mode_counts = {}
    out_of_mask = 0
    for index, (source, target) in enumerate(zip(MACRO_PATH, MACRO_PATH[1:])):
        verdict, reasons, checks, citation = planner.world.gate(parse_node(source), parse_node(target))
        if verdict != "ACCEPT":
            stops.append("S-7")
        meta = planner.edge_meta(source, target)
        history = MACRO_PATH[:index + 1]
        audit = dynamic_audit(planner, card, source, history, target)
        hop = {
            "step": index + 1, "source": source, "target": target,
            "kind": meta["kind"], "operator": meta.get("operator"),
            "citation": citation, "gate": {"verdict": verdict,
                                           "reasons": list(reasons), "citation": citation},
            "cardAudit": audit,
        }
        node_micro = []
        for z_index in range(5):
            result = qintra.step_intra_node(source, 0, z_index)
            result["macroStep"] = index + 1
            result["zIndex"] = z_index
            node_micro.append(result)
            micro_steps.append(result)
            mode_counts[result["projection_mode"]] = mode_counts.get(result["projection_mode"], 0) + 1
            if not result["in_mask"]:
                out_of_mask += 1
        hop["microSteps"] = node_micro
        macro_hops.append(hop)
    if out_of_mask:
        stops.append("S-8")

    still = qintra.still_set_check()
    if still["leaks"]:
        stops.append("S-8")

    trace_path = os.path.join(TASK_DIR, "coupled_trace.jsonl")
    with open(trace_path, "w", encoding="utf-8") as handle:
        for hop in macro_hops:
            handle.write(json.dumps({"recordType": "macro-hop", "hop": hop}, sort_keys=True) + "\n")
            for micro in hop["microSteps"]:
                handle.write(json.dumps({"recordType": "micro-step", "step": micro}, sort_keys=True) + "\n")
    trace_sha = sha_file(trace_path)

    b_tools = SymbolicTools(planner)
    task_b_sample = b_tools.step_intra_node_q("1387@0", 0, 1)
    task_b_integrated = (isinstance(task_b_sample, dict)
                         and task_b_sample.get("status") != "OVERLAY_NOT_STAGED"
                         and task_b_sample.get("next_q") == 7)

    observed_pairs = {(hop["gate"]["verdict"], tuple(hop["gate"]["reasons"])) for hop in macro_hops}
    vocab_ok = all(pair in PINNED_VOCAB for pair in observed_pairs)
    if not vocab_ok:
        stops.append("S-9")

    runner_path = os.path.abspath(__file__)
    runner_sha = sha_file(runner_path)
    module_sha = sha_file(module_path)
    aggregate_path = os.path.join(SCRATCH, "l20_runner_staging_manifest.json")
    aggregate = json.load(open(aggregate_path, encoding="utf-8"))
    entries = [row for row in aggregate["entries"]
               if row.get("role") not in ("mvp4_q_intra_node", "mvp4_task_c_runner",
                                          "mvp4_task_c_trace")]
    entries.extend([
        {"path": module_path, "sha256": module_sha, "role": "mvp4_q_intra_node",
         "kind": "mvp4_runner", "verified": True},
        {"path": runner_path, "sha256": runner_sha, "role": "mvp4_task_c_runner",
         "kind": "mvp4_runner", "verified": True},
        {"path": trace_path, "sha256": trace_sha, "role": "mvp4_task_c_trace",
         "kind": "mvp4_data", "verified": True},
    ])
    aggregate["entries"] = entries
    aggregate["verified"] = sum(1 for row in entries if row.get("verified"))
    aggregate["total"] = len(entries)
    aggregate_sha = write_json(aggregate_path, aggregate)

    close_snapshot = repo_snapshot()
    if close_snapshot["head"] != REPO_HEAD or not close_snapshot["treeClean"]:
        stops.append("S-3")

    receipt = {
        "schemaVersion": "mvp4.task-c-receipt.v1",
        "directive": "MVP4-DIR-1",
        "task": "Task C",
        "status": "COMPLETE" if not stops else "STOP",
        "stopRulesTriggered": sorted(set(stops)),
        "opening": {
            "timestampUtc": opened,
            "repoHead": open_snapshot["head"],
            "statusPorcelainSha256": open_snapshot["statusPorcelainSha256"],
            "treeClean": open_snapshot["treeClean"],
            "ledger": {"sha256": sha_file(ledger), "bytes": os.path.getsize(ledger),
                       "lines": sum(1 for _ in open(ledger, "rb"))},
            "manifest": {"sha256": sha_file(manifest_path), "fileCount": manifest["fileCount"],
                         "totalBytes": manifest["totalBytes"]},
            "checksumsSha256": sha_file(os.path.join(REPO, "CHECKSUMS.sha256")),
            "validation": {"sha256": sha_file(validation_path),
                           "releaseId": validation.get("releaseId"),
                           "checksPassed": validation.get("checksPassed"),
                           "checksFailed": validation.get("checksFailed")},
            "handoff": handoff,
        },
        "repoPins": repo_pins,
        "bridge": {"positive": positive, "negative": negative,
                   "lockedPins": {"GOVERNED_LOOP_REQUIRE_CLEAN": "1",
                                  "GOVERNED_LOOP_REPO_HEAD": REPO_HEAD,
                                  "GOVERNED_LOOP_MANIFEST_COUNT": "1488",
                                  "GOVERNED_LOOP_LEDGER_PREFIX": "03742477"}},
        "layerGuard": {
            "layer": qintra.LAYER,
            "gov517_correspondence_claimed": qintra.GOV517_CORRESPONDENCE_CLAIMED,
            "still_set_label": qintra.STILL_SET_LABEL,
            "still_set_members": list(qintra.STILL_SET),
            "gate_bytes_touched": False,
            "q_engine_path": os.path.join(REPO, "src", "fivefold", "quintessence.py"),
            "q_engine_sha256": sha_file(os.path.join(REPO, "src", "fivefold", "quintessence.py")),
        },
        "qTableVerification": {
            "fixturePath": fixture_path, "fixtureSha256": sha_file(fixture_path),
            "generatedRows": len(generated_rows), "fixtureRows": len(fixture["entries"]),
            "tableMatch": table_match,
            "traversalCycle": list(qintra.TRAVERSAL_CYCLE),
            "stillSet": list(qintra.STILL_SET),
            "generativeWindow": list(qintra.GENERATIVE_WINDOW),
            "q1_4_not_id": q1_4_not_id,
            "q1_12_id": q1_12_id,
        },
        "macroWalk": {
            "mode": "deterministic-query-path-walk",
            "path": MACRO_PATH,
            "hops": macro_hops,
            "gateAcceptCount": sum(1 for hop in macro_hops if hop["gate"]["verdict"] == "ACCEPT"),
            "gateHopCount": len(macro_hops),
            "allHopsAccepted": all(hop["gate"]["verdict"] == "ACCEPT" for hop in macro_hops),
            "cardAudits": [hop["cardAudit"] for hop in macro_hops],
            "presentedIndex0Count": sum(1 for hop in macro_hops if hop["cardAudit"]["presentedFirst"]),
            "seamsTaken": sum(1 for hop in macro_hops if hop["kind"] != "tier-1"),
        },
        "microWalk": {
            "policy": "fresh q_state=0 per macro node; z_index 0..4",
            "microStepCount": len(micro_steps),
            "plannedMicroSteps": 40,
            "outOfMaskPitches": out_of_mask,
            "modeCounts": mode_counts,
            "steps": micro_steps,
            "q1_4_not_id": q1_4_not_id,
            "q1_12_id": q1_12_id,
        },
        "stillCheck": still,
        "taskBIntegration": {
            "toolCall": {"node_id": "1387@0", "q_state": 0, "z_step": 1},
            "result": task_b_sample,
            "integrated": task_b_integrated,
            "overlayNotStaged": task_b_sample.get("status") == "OVERLAY_NOT_STAGED"
            if isinstance(task_b_sample, dict) else None,
        },
        "gateInteraction": {
            "observedPairs": [[verdict, list(reasons)] for verdict, reasons in sorted(observed_pairs)],
            "observedSubsetOfPinned": vocab_ok,
            "pinnedVocabulary": [[verdict, list(reasons)] for verdict, reasons in sorted(PINNED_VOCAB)],
        },
        "constraints": {"REPO_WRITES": 0, "gateBytesModified": False,
                        "encoderBytesModified": False, "qEngineBytesModified": False,
                        "cardGateInputs": 0, "cardOutputAffectsGate": False},
        "staging": {"aggregateManifest": aggregate_path,
                    "aggregateManifestSha256": aggregate_sha,
                    "aggregateVerified": aggregate["verified"],
                    "aggregateTotal": aggregate["total"]},
        "artifacts": {"runnerPath": runner_path, "runnerSha256": runner_sha,
                      "modulePath": module_path, "moduleSha256": module_sha,
                      "tracePath": trace_path, "traceSha256": trace_sha},
        "close": close_snapshot,
    }
    receipt["floatsDetected"] = find_floats(receipt)
    if receipt["floatsDetected"]:
        receipt["status"] = "STOP"
        receipt["stopRulesTriggered"] = sorted(set(receipt["stopRulesTriggered"] + ["S-6"]))
    receipt_path = os.path.join(TASK_DIR, "mvp4_task_c_receipt.json")
    receipt_sha = write_json(receipt_path, receipt)
    print(json.dumps({
        "status": receipt["status"], "stopRulesTriggered": receipt["stopRulesTriggered"],
        "macroHops": len(macro_hops), "macroAccepted": receipt["macroWalk"]["gateAcceptCount"],
        "microSteps": len(micro_steps), "outOfMask": out_of_mask,
        "modeCounts": mode_counts,
        "still": {"evaluations": still["evaluations"], "leaks": still["leaks"],
                  "status": still["status"]},
        "q1_4_not_id": q1_4_not_id, "q1_12_id": q1_12_id,
        "taskBIntegrated": task_b_integrated,
        "receipt": receipt_path, "receiptSha256": receipt_sha,
        "moduleSha256": module_sha, "runnerSha256": runner_sha,
        "traceSha256": trace_sha,
        "staging": {"verified": aggregate["verified"], "total": aggregate["total"]},
    }, indent=2, sort_keys=True))
    return 0 if receipt["status"] == "COMPLETE" and not receipt["stopRulesTriggered"] else 1


if __name__ == "__main__":
    sys.exit(main())
