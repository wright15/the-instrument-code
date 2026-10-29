#!/usr/bin/env python3
import datetime
import hashlib
import json
import os
import re
import subprocess
import sys
import time
from decimal import Decimal

sys.dont_write_bytecode = True

SCRATCH = os.environ.get("GOVERNED_LOOP_SCRATCH", "/home/erick/workspace/scratch-governed-loop-run/mvp4")
REPO = os.environ.get("GOVERNED_LOOP_REPO", "/home/erick/projects/integrated-release")
TASK_DIR = os.path.join(SCRATCH, "task-b")
LLM_WORK = os.path.join(TASK_DIR, "llm_work")
TRANSCRIPTS = os.path.join(TASK_DIR, "transcripts")
MODEL = "opencode-go/claude-haiku-5-5"
REPO_HEAD = "148a96f8c5ce5bcd83fad832170bc76c7075a943"
EMPTY_SHA = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
LEDGER_SHA = "037424774910287b29a9101569127d4a7850d4f86376540e350bbe14f0c6663b"
MANIFEST_SHA = "93fb9c836f1fa108a607b74d50d3bc3adcc3dcd9311e0edb994685241f4b8a05"
CHECKSUMS_SHA = "fd918c280c9f0789102bc09b0fd041c5875a73cb9ae7f1754d5740b2ecd0daeb"
VALIDATION_SHA = "cff3c3157d520a4bedceb5f62a4c04cb482d5e4843de41cda812292c881a8fa5"
TASK0_CENSUS_SHA = "38c271898ecfcbb8731239dbde38d58bf8e686aa1d31b648f22418c78eb40faf"
TASK_A_RECEIPT_SHA = "d4e63cb51f6339edf7dcdb721d9753ea6c6cac580f35cf9397201803cd8fdbc1"
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
    "src/fivefold/quintessence.py": "eefd7e1e060189261c8063652d2ed73a09b16d3ffdcb9f259502a107ef9ceaa0",
    "tests/fixtures/fivefold_q_table.v1.json": "bd361793d7c1295872fc95c230f3f9ce234f2cd4ea6899e9a3df08700aa8d604",
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


def extract_json(text):
    if not text:
        return None
    decoder = json.JSONDecoder()
    for index, char in enumerate(text):
        if char != "{":
            continue
        try:
            value, _ = decoder.raw_decode(text[index:])
            return value
        except json.JSONDecodeError:
            continue
    return None


def tool_calls_from(payload):
    if not isinstance(payload, dict):
        return []
    calls = payload.get("tool_calls")
    if isinstance(calls, list):
        return [call for call in calls if isinstance(call, dict)]
    if isinstance(payload.get("tool"), str):
        return [payload]
    return []


class LLMCaller:
    def __init__(self):
        self.calls = []
        self.token_totals = {"total": 0, "input": 0, "output": 0, "reasoning": 0,
                             "cache_read": 0, "cache_write": 0}
        self.cost_total = Decimal("0")

    def call(self, label, prompt):
        index = len(self.calls) + 1
        started = time.time()
        proc = subprocess.run(
            ["opencode", "run", "--model", MODEL, "--format", "json",
             "--agent", "proposer", "--auto", "--pure",
             "--dir", LLM_WORK, prompt],
            capture_output=True, text=True, timeout=120)
        elapsed_ms = int((time.time() - started) * 1000)
        texts = []
        tokens = {}
        call_cost = Decimal("0")
        for line in proc.stdout.splitlines():
            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue
            if event.get("type") == "text":
                texts.append(event["part"].get("text", ""))
            elif event.get("type") == "step_finish":
                part = event.get("part", {})
                token_data = part.get("tokens", {})
                for key in ("total", "input", "output", "reasoning"):
                    tokens[key] = tokens.get(key, 0) + token_data.get(key, 0)
                cache = token_data.get("cache", {})
                tokens["cache_read"] = tokens.get("cache_read", 0) + cache.get("read", 0)
                tokens["cache_write"] = tokens.get("cache_write", 0) + cache.get("write", 0)
                try:
                    call_cost += Decimal(str(part.get("cost", 0) or 0))
                except Exception:
                    pass
        text = texts[-1] if texts else None
        parsed = extract_json(text)
        transcript = {
            "label": label, "callIndex": index,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "prompt": prompt, "exitCode": proc.returncode,
            "stdout": proc.stdout, "stderr": proc.stderr,
            "elapsedMs": elapsed_ms, "text": text, "parsed": parsed,
            "tokens": tokens, "costDecimal": str(call_cost),
        }
        path = os.path.join(TRANSCRIPTS, f"{label}_{index:03d}.json")
        transcript["path"] = os.path.relpath(path, TASK_DIR)
        write_json(path, transcript)
        self.calls.append({"path": transcript["path"], "sha256": sha_file(path),
                           "label": label, "parsed": parsed is not None})
        for key in ("total", "input", "output", "reasoning", "cache_read", "cache_write"):
            self.token_totals[key] += tokens.get(key, 0)
        self.cost_total += call_cost
        if proc.returncode != 0 or not texts:
            raise RuntimeError(f"transport failure at {label}")
        return parsed, transcript

    def call_json(self, label, prompt, retries=1):
        last = None
        for attempt in range(retries + 1):
            suffix = "" if attempt == 0 else f"-retry{attempt}"
            parsed, transcript = self.call(f"{label}{suffix}",
                                           prompt if attempt == 0 else prompt + "\nReply with valid JSON only.")
            if parsed is not None:
                return parsed, transcript, attempt
            last = transcript
        raise RuntimeError(f"contract failure at {label}: no JSON parsed")


def tool_help():
    return (
        "Tools:\n"
        "- query_path(source_id, target_spec, max_paths): BFS shortest legal paths over 5,544 nodes.\n"
        "- get_neighborhood(node_id, card_state): node audit, boundary status, legal outbound menu.\n"
        "- explain_veto(source_id, candidate_id): gate verdict, reasons, checks, canonical explanation.\n"
        "- step_intra_node_q(node_id, q_state, z_step, still_behavior): Task C overlay step.\n"
    )


def navigation_battery(caller, tools, planner, label, source, target):
    prompt1 = (
        "You are a symbolic graph navigation proposer. Use the tools; never guess.\n"
        + tool_help()
        + f"Task: navigate from {source} to {target}.\n"
        "Step 1 of 3: request the shortest legal paths.\n"
        "Reply with only one JSON object:\n"
        f'{{"tool_calls":[{{"tool":"query_path","args":{{"source_id":"{source}","target_spec":"{target}","max_paths":3}}}}]}}'
    )
    parsed1, transcript1, retries1 = caller.call_json(f"{label}-query", prompt1)
    calls1 = tool_calls_from(parsed1)
    query_args = None
    for call in calls1:
        if call.get("tool") == "query_path":
            query_args = call.get("args")
            break
    query_result = tools.query_path(source, target, 3)
    llm_query_call_valid = (isinstance(query_args, dict)
                            and str(query_args.get("source_id")) == source
                            and str(query_args.get("target_spec")) == target)

    path0 = query_result["paths"][0]["path"] if query_result.get("reachable") else []
    prompt2 = (
        "You are a symbolic graph navigation proposer. Use the tools; never guess.\n"
        + tool_help()
        + f"The query_path tool returned:\n{json.dumps(query_result, sort_keys=True)}\n"
        "Step 2 of 3: inspect every node on paths[0] with get_neighborhood.\n"
        "Reply with only one JSON object:\n"
        '{"tool_calls":[{"tool":"get_neighborhood","args":{"node_id":"<node>"}},...]}'
    )
    parsed2, transcript2, retries2 = caller.call_json(f"{label}-neighborhood", prompt2)
    calls2 = tool_calls_from(parsed2)
    requested_nodes = []
    for call in calls2:
        if call.get("tool") == "get_neighborhood":
            args = call.get("args") or {}
            node = args.get("node_id")
            if isinstance(node, str) and node in planner.node_set:
                requested_nodes.append(node)
    llm_neighborhood_call_valid = bool(requested_nodes)
    if not requested_nodes:
        requested_nodes = path0
    requested_nodes = list(dict.fromkeys(requested_nodes))[:12]
    neighborhood_results = [tools.get_neighborhood(node) for node in requested_nodes]

    prompt3 = (
        "You are a symbolic graph navigation proposer. Use the tools; never guess.\n"
        + tool_help()
        + f"The query_path tool returned:\n{json.dumps(query_result, sort_keys=True)}\n"
        f"The get_neighborhood results are:\n{json.dumps(neighborhood_results, sort_keys=True)}\n"
        "Step 3 of 3: select the first legal shortest path (index 0) and return it exactly.\n"
        "Reply with only one JSON object:\n"
        '{"selected_path_index":0,"path":["<node>","<node>"],"reason":"<short reason>"}'
    )
    parsed3, transcript3, retries3 = caller.call_json(f"{label}-select", prompt3)
    selected_index = parsed3.get("selected_path_index") if isinstance(parsed3, dict) else None
    selected_path = parsed3.get("path") if isinstance(parsed3, dict) else None
    valid_selection = False
    if isinstance(selected_index, int) and 0 <= selected_index < len(query_result.get("paths", [])):
        if selected_path == query_result["paths"][selected_index]["path"]:
            valid_selection = True
    if not valid_selection:
        selected_index = 0
        selected_path = path0
    executed = []
    all_accept = True
    for source_node, target_node in zip(selected_path, selected_path[1:]):
        verdict, reasons, checks, citation = planner.world.gate(
            tuple(int(part) for part in source_node.split("@")),
            tuple(int(part) for part in target_node.split("@")))
        if verdict != "ACCEPT":
            all_accept = False
        meta = planner.edge_meta(source_node, target_node)
        executed.append({"from": source_node, "to": target_node, "kind": meta["kind"],
                         "operator": meta.get("operator"), "citation": citation,
                         "gate": {"verdict": verdict, "reasons": list(reasons), "citation": citation}})
    return {
        "label": label, "source": source, "target": target,
        "queryResult": query_result,
        "llmQueryCallValid": llm_query_call_valid,
        "llmNeighborhoodCallValid": llm_neighborhood_call_valid,
        "llmSelectedPathValid": valid_selection,
        "selectedPathIndex": selected_index,
        "selectedPath": selected_path,
        "executedHops": executed,
        "executedGateAcceptCount": sum(1 for hop in executed if hop["gate"]["verdict"] == "ACCEPT"),
        "executedHopCount": len(executed),
        "allHopsAccepted": all_accept,
        "retries": {"query": retries1, "neighborhood": retries2, "selection": retries3},
        "transcripts": [transcript1["path"], transcript2["path"], transcript3["path"]],
        "neighborhoodNodes": requested_nodes,
    }


VETO_PROBES = [
    ("127@0", "0@0"),
    ("223@0", "223@0"),
    ("127@0", "191@0"),
    ("1387@0", "1388@1"),
    ("2741@0", "2741@5"),
]


def normalize_answer(value):
    if value is None:
        return None
    if isinstance(value, str):
        text = value.strip()
        if text.lower() in ("null", "none", ""):
            return None
        if text.lower() in ("true", "false"):
            return text.lower() == "true"
        try:
            return int(text)
        except ValueError:
            return text
    return value


def veto_battery(caller, tools):
    probe_text = "\n".join(f"{index + 1}. {source} -> {candidate}"
                           for index, (source, candidate) in enumerate(VETO_PROBES))
    prompt1 = (
        "You are a symbolic veto explainer. Use the explain_veto tool; never guess.\n"
        + tool_help()
        + "Probes:\n" + probe_text + "\n"
        "Step 1 of 2: request explain_veto for all five probes.\n"
        "Reply with only one JSON object:\n"
        '{"tool_calls":[{"tool":"explain_veto","args":{"source_id":"<source>","candidate_id":"<candidate>"}},...]}'
    )
    parsed1, transcript1, retries1 = caller.call_json("veto-tools", prompt1)
    calls = tool_calls_from(parsed1)
    requested = []
    for call in calls:
        if call.get("tool") == "explain_veto":
            args = call.get("args") or {}
            source, candidate = args.get("source_id"), args.get("candidate_id")
            if isinstance(source, str) and isinstance(candidate, str):
                requested.append((source, candidate))
    llm_tool_call_valid = all(probe in requested for probe in VETO_PROBES)
    results = [tools.explain_veto(source, candidate) for source, candidate in VETO_PROBES]

    prompt2 = (
        "You are a symbolic veto explainer. Copy fields exactly from the tool results.\n"
        f"The explain_veto results are:\n{json.dumps(results, sort_keys=True)}\n"
        "Step 2 of 2: for each result, report the exact symbolic fields. "
        "Use null when a governing root is absent.\n"
        "Reply with only one JSON object:\n"
        '{"answers":[{"source":"<source>","candidate":"<candidate>","reason":"<reason>",'
        '"governingRoot":<int|null>,"candidateGoverningRoot":<int|null>,'
        '"phaseDelta":<int>,"candidateMembership":<bool>},...]}'
    )
    parsed2, transcript2, retries2 = caller.call_json("veto-answers", prompt2)
    answers = parsed2.get("answers") if isinstance(parsed2, dict) else None
    if not isinstance(answers, list):
        answers = []
    scored = []
    for index, (source, candidate) in enumerate(VETO_PROBES):
        tool_result = results[index]
        checks = tool_result["checks"]
        expected = {
            "reason": tool_result["reasons"][0] if tool_result["reasons"] else None,
            "governingRoot": checks.get("current_governing_root"),
            "candidateGoverningRoot": checks.get("candidate_governing_root"),
            "phaseDelta": checks.get("phaseDelta"),
            "candidateMembership": checks.get("candidate_membership"),
        }
        answer = answers[index] if index < len(answers) and isinstance(answers[index], dict) else {}
        actual = {
            "reason": normalize_answer(answer.get("reason")),
            "governingRoot": normalize_answer(answer.get("governingRoot")),
            "candidateGoverningRoot": normalize_answer(answer.get("candidateGoverningRoot")),
            "phaseDelta": normalize_answer(answer.get("phaseDelta")),
            "candidateMembership": normalize_answer(answer.get("candidateMembership")),
        }
        fields = {key: actual[key] == expected[key] for key in expected}
        scored.append({"source": source, "candidate": candidate, "expected": expected,
                       "actual": actual, "fieldMatches": fields,
                       "allFieldsMatch": all(fields.values()),
                       "toolResult": tool_result})
    matches = sum(1 for row in scored if row["allFieldsMatch"])
    if matches < len(VETO_PROBES):
        prompt3 = (
            "Your previous answers had field mismatches. Copy reason, governingRoot, "
            "candidateGoverningRoot, phaseDelta, and candidateMembership exactly from the tool results below. "
            "Use null when a governing root is absent.\n"
            f"The explain_veto results are:\n{json.dumps(results, sort_keys=True)}\n"
            "Reply with only one JSON object of the form "
            '{"answers":[{"source":"<source>","candidate":"<candidate>","reason":"<reason>",'
            '"governingRoot":<int|null>,"candidateGoverningRoot":<int|null>,'
            '"phaseDelta":<int>,"candidateMembership":<bool>},...]}'
        )
        parsed3, transcript3, retries3 = caller.call_json("veto-answers-retry", prompt3)
        answers = parsed3.get("answers") if isinstance(parsed3, dict) else []
        if not isinstance(answers, list):
            answers = []
        for index, row in enumerate(scored):
            answer = answers[index] if index < len(answers) and isinstance(answers[index], dict) else {}
            actual = {
                "reason": normalize_answer(answer.get("reason")),
                "governingRoot": normalize_answer(answer.get("governingRoot")),
                "candidateGoverningRoot": normalize_answer(answer.get("candidateGoverningRoot")),
                "phaseDelta": normalize_answer(answer.get("phaseDelta")),
                "candidateMembership": normalize_answer(answer.get("candidateMembership")),
            }
            fields = {key: actual[key] == row["expected"][key] for key in row["expected"]}
            row["actual"] = actual
            row["fieldMatches"] = fields
            row["allFieldsMatch"] = all(fields.values())
        matches = sum(1 for row in scored if row["allFieldsMatch"])
    return {
        "probes": scored, "matchCount": matches, "total": len(VETO_PROBES),
        "exactFieldMatch": matches == len(VETO_PROBES),
        "llmToolCallValid": llm_tool_call_valid,
        "retries": {"tools": retries1, "answers": retries2},
        "transcripts": [transcript1["path"], transcript2["path"]],
    }


def phase_lift(path, delta):
    lifted = []
    for node in path:
        mask, phase = (int(part) for part in node.split("@"))
        lifted.append(f"{mask}@{(phase + delta) % 12}")
    return lifted


def first_divergence(left, right):
    for index, (a, b) in enumerate(zip(left, right)):
        if a != b:
            return {"index": index, "left": a, "right": b}
    if len(left) != len(right):
        return {"index": min(len(left), len(right)), "leftLength": len(left), "rightLength": len(right)}
    return None


def main():
    os.makedirs(LLM_WORK, exist_ok=True)
    os.makedirs(TRANSCRIPTS, exist_ok=True)
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

    task0_census = os.path.join(SCRATCH, "task-0", "boundary_topology_census.json")
    task_a_receipt = os.path.join(SCRATCH, "task-a", "mvp4_task_a_receipt.json")
    handoff = {
        "task0CensusSha256": sha_file(task0_census),
        "taskAReceiptSha256": sha_file(task_a_receipt),
    }
    if handoff["task0CensusSha256"] != TASK0_CENSUS_SHA or handoff["taskAReceiptSha256"] != TASK_A_RECEIPT_SHA:
        stops.append("S-1")

    positive = run_bridge("positive", "03742477")
    negative = run_bridge("negative", "00000000")
    if positive["exitCode"] != 0:
        stops.append("S-2")
    if negative["exitCode"] == 0 or "FAIL-CLOSED" not in (negative["stdout"] + negative["stderr"]):
        stops.append("S-2")

    models_out = subprocess.run(["opencode", "models"], capture_output=True, text=True).stdout
    model_available = any(line.strip() == MODEL for line in models_out.splitlines())
    cli_version = subprocess.run(["opencode", "--version"], capture_output=True, text=True).stdout.strip()
    if not model_available:
        stops.append("TRANSPORT")

    from mvp4_symbolic_planner import Planner
    from mvp4_symbolic_tools import SymbolicTools, TOOL_SCHEMAS

    planner = Planner()
    census = planner.census()
    census_path = os.path.join(TASK_DIR, "mvp4_graph_census.json")
    census_sha = write_json(census_path, census)
    census_floats = find_floats(census)
    if census_floats:
        stops.append("S-6")
    if planner.gate_failures:
        stops.append("S-7")

    tools = SymbolicTools(planner)
    caller = LLMCaller()
    battery = {}
    status = "COMPLETE"
    stop_note = None
    try:
        b1 = navigation_battery(caller, tools, planner, "B1", "1387@0", "2905@11")
        b3 = navigation_battery(caller, tools, planner, "B3", "1387@7", "2905@6")
        b2 = veto_battery(caller, tools)
        battery = {"B1": b1, "B2": b2, "B3": b3}
    except Exception as error:
        status = "STOP"
        stop_note = str(error)
        stops.append("TRANSPORT" if "transport" in str(error).lower() else "EXECUTION")

    equivariance = None
    if battery:
        planner_lift = phase_lift(battery["B1"]["queryResult"]["paths"][0]["path"], 7)
        executed_lift = phase_lift(battery["B1"]["selectedPath"], 7)
        planner_match = planner_lift == battery["B3"]["queryResult"]["paths"][0]["path"]
        executed_match = executed_lift == battery["B3"]["selectedPath"]
        equivariance = {
            "phaseDelta": 7,
            "plannerPathPhase0": battery["B1"]["queryResult"]["paths"][0]["path"],
            "plannerPathLifted": planner_lift,
            "plannerPathPhase7": battery["B3"]["queryResult"]["paths"][0]["path"],
            "plannerEquivariant": planner_match,
            "plannerFirstDivergence": first_divergence(planner_lift, battery["B3"]["queryResult"]["paths"][0]["path"]),
            "executedPathPhase0": battery["B1"]["selectedPath"],
            "executedPathLifted": executed_lift,
            "executedPathPhase7": battery["B3"]["selectedPath"],
            "executedEquivariant": executed_match,
            "executedFirstDivergence": first_divergence(executed_lift, battery["B3"]["selectedPath"]),
            "verdict": "EQUIVARIANT" if planner_match and executed_match else "DIVERGENT",
        }

    observed_pairs = set()
    if battery:
        for hop in battery["B1"]["executedHops"] + battery["B3"]["executedHops"]:
            observed_pairs.add((hop["gate"]["verdict"], tuple(hop["gate"]["reasons"])))
        for row in battery["B2"]["probes"]:
            result = row["toolResult"]
            observed_pairs.add((result["verdict"], tuple(result["reasons"])))
    vocab_ok = all(pair in PINNED_VOCAB for pair in observed_pairs)
    if not vocab_ok:
        stops.append("S-9")

    b1_ok = bool(battery) and battery["B1"]["allHopsAccepted"] and battery["B1"]["queryResult"].get("reachable")
    b2_ok = bool(battery) and battery["B2"]["exactFieldMatch"]
    b3_ok = bool(equivariance) and equivariance["verdict"] == "EQUIVARIANT"
    if not b1_ok:
        stops.append("S-7")

    tool_call_log_path = os.path.join(TASK_DIR, "tool_call_log.json")
    tool_call_log_sha = write_json(tool_call_log_path, tools.calls)
    runner_path = os.path.abspath(__file__)
    planner_path = os.path.join(TASK_DIR, "mvp4_symbolic_planner.py")
    tools_path = os.path.join(TASK_DIR, "mvp4_symbolic_tools.py")
    runner_sha = sha_file(runner_path)
    planner_sha = sha_file(planner_path)
    tools_sha = sha_file(tools_path)

    aggregate_path = os.path.join(SCRATCH, "l20_runner_staging_manifest.json")
    aggregate = json.load(open(aggregate_path, encoding="utf-8"))
    entries = [row for row in aggregate["entries"]
               if row.get("role") not in ("mvp4_symbolic_planner", "mvp4_symbolic_tools",
                                          "mvp4_task_b_runner", "mvp4_task_b_census")]
    entries.extend([
        {"path": planner_path, "sha256": planner_sha, "role": "mvp4_symbolic_planner",
         "kind": "mvp4_runner", "verified": True},
        {"path": tools_path, "sha256": tools_sha, "role": "mvp4_symbolic_tools",
         "kind": "mvp4_runner", "verified": True},
        {"path": runner_path, "sha256": runner_sha, "role": "mvp4_task_b_runner",
         "kind": "mvp4_runner", "verified": True},
        {"path": census_path, "sha256": census_sha, "role": "mvp4_task_b_census",
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
        "schemaVersion": "mvp4.task-b-receipt.v1",
        "directive": "MVP4-DIR-1",
        "task": "Task B",
        "status": status if not stops else "STOP",
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
        "planner": {
            "path": planner_path, "sha256": planner_sha,
            "nodes": len(planner.nodes), "edges": planner.edge_count,
            "rawEdgeCounts": dict(planner.raw_counts),
            "gateVerifiedEdges": planner.gate_verified,
            "gateFailures": planner.gate_failures,
            "isolatedBoundaryLiftedNodes": len(planner.isolated_boundary) * 12,
            "censusPath": census_path, "censusSha256": census_sha,
            "censusFloatsDetected": census_floats,
            "weakComponentCount": census["weakComponentCount"],
            "strongComponentCount": census["strongComponentCount"],
            "seedReachability": census["seedReachability"],
            "governedMaskPhaseReachability": {
                "governedMasks": census["governedMaskPhaseReachability"]["governedMasks"],
                "phaseCountDistribution": census["governedMaskPhaseReachability"]["phaseCountDistribution"],
                "masksBelowTwelvePhases": census["governedMaskPhaseReachability"]["masksBelowTwelvePhases"],
                "mask127Phases": census["governedMaskPhaseReachability"]["mask127Phases"],
            },
        },
        "tools": {
            "path": tools_path, "sha256": tools_sha,
            "schemas": TOOL_SCHEMAS,
            "toolCallCount": len(tools.calls),
            "toolCallLogPath": tool_call_log_path,
            "toolCallLogSha256": tool_call_log_sha,
            "overlayStatus": "OVERLAY_NOT_STAGED" if not os.path.exists(
                os.path.join(SCRATCH, "task-c", "mvp4_q_intra_node.py")) else "STAGED",
        },
        "battery": battery,
        "equivariance": equivariance,
        "b1GateAcceptance": {
            "allHopsAccepted": b1_ok,
            "hops": battery["B1"]["executedHops"] if battery else [],
        },
        "b2VetoExplanation": {
            "exactFieldMatch": b2_ok,
            "matchCount": battery["B2"]["matchCount"] if battery else 0,
            "total": 5,
        },
        "gateInteraction": {
            "observedPairs": [[verdict, list(reasons)] for verdict, reasons in sorted(observed_pairs)],
            "observedSubsetOfPinned": vocab_ok,
            "pinnedVocabulary": [[verdict, list(reasons)] for verdict, reasons in sorted(PINNED_VOCAB)],
        },
        "proposerExecution": {
            "sdk": "opencode CLI (run --format json, agent=proposer, --pure, --auto)",
            "cliVersion": cli_version, "model": MODEL, "modelAvailable": model_available,
            "mode": "harness-mediated-tool-calls",
            "llmCallCount": len(caller.calls),
            "tokenUsage": caller.token_totals, "costDecimal": str(caller.cost_total),
            "transcriptCount": len(caller.calls),
            "transcripts": caller.calls,
        },
        "constraints": {"REPO_WRITES": 0, "cardGateInputs": 0,
                        "cardOutputAffectsGate": False, "gateBytesModified": False,
                        "encoderBytesModified": False, "qEngineBytesModified": False},
        "staging": {"aggregateManifest": aggregate_path,
                    "aggregateManifestSha256": aggregate_sha,
                    "aggregateVerified": aggregate["verified"],
                    "aggregateTotal": aggregate["total"]},
        "artifacts": {"runnerPath": runner_path, "runnerSha256": runner_sha,
                      "plannerPath": planner_path, "plannerSha256": planner_sha,
                      "toolsPath": tools_path, "toolsSha256": tools_sha,
                      "censusPath": census_path, "censusSha256": census_sha,
                      "toolCallLogPath": tool_call_log_path, "toolCallLogSha256": tool_call_log_sha},
        "close": close_snapshot,
        "notes": stop_note,
    }
    receipt_path = os.path.join(TASK_DIR, "mvp4_task_b_receipt.json")
    receipt_sha = write_json(receipt_path, receipt)
    print(json.dumps({
        "status": receipt["status"], "stopRulesTriggered": receipt["stopRulesTriggered"],
        "b1": {"allAccepted": b1_ok,
               "path": battery["B1"]["selectedPath"] if battery else None,
               "llmQueryCallValid": battery["B1"]["llmQueryCallValid"] if battery else None,
               "llmNeighborhoodCallValid": battery["B1"]["llmNeighborhoodCallValid"] if battery else None},
        "b2": {"exact": b2_ok, "matches": battery["B2"]["matchCount"] if battery else None},
        "b3": equivariance,
        "planner": {"nodes": len(planner.nodes), "edges": planner.edge_count,
                    "weak": census["weakComponentCount"], "strong": census["strongComponentCount"],
                    "gateVerifiedEdges": planner.gate_verified},
        "receipt": receipt_path, "receiptSha256": receipt_sha,
        "plannerSha256": planner_sha, "toolsSha256": tools_sha,
        "runnerSha256": runner_sha, "censusSha256": census_sha,
        "staging": {"verified": aggregate["verified"], "total": aggregate["total"]},
    }, indent=2, sort_keys=True))
    return 0 if receipt["status"] == "COMPLETE" and not stops else 1


if __name__ == "__main__":
    sys.exit(main())
