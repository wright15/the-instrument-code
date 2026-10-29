#!/usr/bin/env python3
"""MVP3 Task C — compute-avoidance benchmark (L13).

Deterministic latency benchmark plus a Probe-mode LLM stream. Two mode-scoped
avoidance metrics; no single compute-avoidance ratio. Operations-primary.
"""
import datetime
import hashlib
import importlib.util
import json
import os
import platform
import random
import re
import shutil
import socket
import statistics
import subprocess
import sys
import time

sys.dont_write_bytecode = True

BASE = "/home/erick/workspace/scratch-governed-loop-run"
TASK = f"{BASE}/task-c"
TASK0 = BASE
TASK_A = f"{BASE}/task-a"
TASK_B1 = f"{BASE}/task-b1"
B0 = f"{BASE}/task-b0"
REPO = "/home/erick/projects/integrated-release"

TASK_A_RECEIPT_PIN = "cb9083f435a41b17a009d5fb249661c1998d107556bf6a6ee97fa5293f1461a0"
TASK_A_PROPOSER_PIN = "69deb1e6d55ea37eafd97ad2ea868faef3e55e0520bbca05afda9a3a44898936"
TASK_A_CARD_PIN = "bff1cc4cb270e4883125c6ca431dd8440d8f73be3e33be51fc54c580ad7dc289"
TASK_B1_RECEIPT_PIN = "c658a5885c5fb989eec6eab1a3a3964ae3e2228606cb806f0867c6c1d829e5d4"
SPEC_PIN = "918228d497fc57e7c63b79ebd33c554ac4e52cb58760a9b68d86c52f6daae17c"
ENCODER_PIN = "dc2379277afb1a9bf92a26cd3a83ea3f16a33a12ca331a9742f7d5861422f745"
GATE_PIN = "5957a290d3d23e458fb4ddf641868719ac940514eb3aee5aa0df417112ca04e2"

MODEL = "opencode-go/claude-haiku-5-5"
SDK = "opencode CLI 1.19.4 (non-interactive run --format json, agent=proposer, --pure, --auto)"
K_ROLLOUT = 64
PROBE_N = int(os.environ.get("MVP3_C_PROBE_N", "20"))
LATENCY_N = int(os.environ.get("MVP3_C_LATENCY_N", "20000"))
RNG_SEED = 20261027
SEED_STATE = (1387, 0)
REVIEW_BASELINE = {"median_microseconds": 3.95, "p99_microseconds": 8.52,
                   "mean_microseconds": 4.08, "source": "review machine, 20,000 random pairs; comparison only"}


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_text(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def write_json(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, sort_keys=True)
        f.write("\n")


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def load_bridge():
    spec = importlib.util.spec_from_file_location(
        "orrery_nav_bridge_task_c", f"{TASK0}/orrery_nav_bridge.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def repo_snapshot():
    head = subprocess.run(["git", "-C", REPO, "rev-parse", "HEAD"],
                          capture_output=True, text=True, check=True).stdout.strip()
    porcelain = subprocess.run(["git", "-C", REPO, "status", "--porcelain"],
                               capture_output=True, text=True, check=True).stdout
    return {"head": head, "tree_clean": porcelain.strip() == "",
            "porcelain_sha256": hashlib.sha256(porcelain.encode()).hexdigest()}


def base_realm_digest():
    entries = []
    for root, dirs, files in os.walk(BASE):
        dirs[:] = [d for d in dirs if d not in
                   ("task-a", "task-b0", "task-b1", "task-c", "__pycache__")]
        for name in sorted(files):
            path = os.path.join(root, name)
            entries.append(f"{os.path.relpath(path, BASE)}:{sha256_file(path)}")
    return {"file_count": len(entries), "digest": sha256_text("\n".join(entries))}


def p99(values):
    ordered = sorted(values)
    if not ordered:
        return None
    index = min(len(ordered) - 1, int(round(0.99 * (len(ordered) - 1))))
    return ordered[index]


def call_llm(prompt, call_index, transcripts):
    started = time.time()
    proc = subprocess.run(
        ["opencode", "run", "--model", MODEL, "--format", "json",
         "--agent", "proposer", "--auto", "--pure", "--dir", f"{TASK}/llm_work", prompt],
        capture_output=True, text=True, timeout=90)
    elapsed = round(time.time() - started, 3)
    texts = []
    tokens = {}
    cost = 0.0
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
            cost += part.get("cost", 0.0) or 0.0
    parsed = None
    if texts:
        raw = texts[-1]
        match = re.search(r"\{.*?\}", raw, re.DOTALL)
        if match:
            try:
                parsed = json.loads(match.group(0))
            except json.JSONDecodeError:
                parsed = None
    valid = False
    mask = phase = None
    if isinstance(parsed, dict):
        try:
            mask = int(parsed.get("mask"))
            phase = int(parsed.get("phase"))
            valid = 0 <= mask <= 4095 and 0 <= phase <= 11
        except (TypeError, ValueError):
            valid = False
    transcript = {
        "call_index": call_index,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "prompt": prompt, "exit_code": proc.returncode,
        "stdout": proc.stdout, "stderr": proc.stderr,
        "elapsed_seconds": elapsed, "text": texts[-1] if texts else None,
        "parsed": parsed, "mask": mask, "phase": phase, "valid": valid,
        "tokens": tokens, "cost": cost,
    }
    path = f"{TASK}/transcripts/probe_call_{call_index:03d}.json"
    write_json(path, transcript)
    transcripts.append({"path": os.path.relpath(path, TASK), "sha256": sha256_file(path)})
    return transcript, valid


def main():
    os.makedirs(f"{TASK}/transcripts", exist_ok=True)
    os.makedirs(f"{TASK}/llm_work", exist_ok=True)
    shutil.copyfile(f"{TASK_A}/llm_work/opencode.json", f"{TASK}/llm_work/opencode.json")

    pins = {
        "task_a_receipt": (f"{TASK_A}/task_a_receipt.json", TASK_A_RECEIPT_PIN),
        "task_a_proposer": (f"{TASK_A}/mvp3_llm_proposer.py", TASK_A_PROPOSER_PIN),
        "task_a_card": (f"{TASK_A}/mvp3_chaldean_card.json", TASK_A_CARD_PIN),
        "task_b1_receipt": (f"{TASK_B1}/task_b1_receipt.json", TASK_B1_RECEIPT_PIN),
        "spec": (f"{TASK_B1}/mvp3_encoder_spec.json", SPEC_PIN),
        "encoder": (f"{TASK_B1}/mvp3_encoder.py", ENCODER_PIN),
        "gate": (f"{TASK0}/mvp2.py", GATE_PIN),
        "llm_work_config": (f"{TASK}/llm_work/opencode.json",
                            "9cb555deeef3db0bdbf9f30b1daddd8cc95bdbd029202a0008aa5ee3043c642f"),
    }
    pin_results = {name: {"path": os.path.relpath(path, BASE),
                          "expected": expected, "actual": sha256_file(path),
                          "match": sha256_file(path) == expected}
                   for name, (path, expected) in pins.items()}
    if not all(row["match"] for row in pin_results.values()):
        write_json(f"{TASK}/task_c_receipt.json", {
            "schema_version": "1.0.0",
            "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "scratch_path": TASK, "status": "STOPPED",
            "stop_rules_triggered": ["input-pin-mismatch"],
            "input_pins": pin_results,
        })
        print(json.dumps({"status": "STOPPED", "pins": pin_results}, indent=2))
        return 1

    open_snapshot = repo_snapshot()
    base_before = base_realm_digest()
    task_a = load_json(f"{TASK_A}/task_a_receipt.json")
    task_b1 = load_json(f"{TASK_B1}/task_b1_receipt.json")
    gate_digest_before = sha256_file(f"{TASK0}/mvp2.py")

    bridge = load_bridge()
    model = bridge.Model()
    world = model.world
    masks = sorted(model.masks)
    family_a = {}
    for edge in model.catalog["familyA"]["edges"]:
        operator, src, sp, tgt, tp, intra, boundary = edge
        family_a.setdefault((int(src), int(sp)), []).append((int(tgt), int(tp), operator))
    family_b = {}
    for edge in model.catalog["familyB"]["edges"]:
        left, right = int(edge["leftMask"]), int(edge["rightMask"])
        for phase in range(12):
            family_b.setdefault((left, phase), set()).add((right, phase))
            family_b.setdefault((right, phase), set()).add((left, phase))

    def is_boundary(node):
        return model.role.get(node[0]) == "boundary"

    def auto_transit(node):
        options = [(t, p, op) for t, p, op in family_a.get(node, [])]
        options.extend((t, p, "familyB") for t, p in family_b.get(node, set()))
        if not options:
            raise RuntimeError(f"boundary {node} has no seam exit")
        target = sorted(options)[0][:2]
        gate = world.gate(node, target)
        if gate[0] != "ACCEPT":
            raise RuntimeError(f"auto-transit rejected {node}->{target}: {gate}")
        return target, gate

    # ---------- Latency benchmark ----------
    rng = random.Random(RNG_SEED)
    latency_path = f"{TASK}/latency_samples.jsonl"
    latencies_ns = []
    latency_verdicts = {}
    latency_counts = {}
    with open(latency_path, "w", encoding="utf-8") as handle:
        for index in range(LATENCY_N):
            source = (rng.choice(masks), rng.randrange(12))
            target = (rng.choice(masks), rng.randrange(12))
            started = time.perf_counter_ns()
            verdict, reasons, checks, citation = world.gate(source, target)
            elapsed = time.perf_counter_ns() - started
            latencies_ns.append(elapsed)
            key = (verdict, tuple(reasons))
            latency_counts[key] = latency_counts.get(key, 0) + 1
            handle.write(json.dumps({
                "i": index, "source": f"{source[0]}@{source[1]}",
                "target": f"{target[0]}@{target[1]}",
                "verdict": verdict, "reasons": reasons, "ns": elapsed,
            }, sort_keys=True) + "\n")
    # Determinism check on the first 1,000 pairs
    det_repeats = min(1000, LATENCY_N)
    det_mismatches = 0
    for index in range(det_repeats):
        row = json.loads(open(latency_path, encoding="utf-8").read().splitlines()[index])
        source = tuple(int(x) for x in row["source"].split("@"))
        target = tuple(int(x) for x in row["target"].split("@"))
        repeat = world.gate(source, target)
        if (row["verdict"], tuple(row["reasons"])) != (repeat[0], tuple(repeat[1])):
            det_mismatches += 1
    mean_ns = statistics.mean(latencies_ns)
    median_ns = statistics.median(latencies_ns)
    p99_ns = p99(latencies_ns)
    stdev_ns = statistics.pstdev(latencies_ns)
    gate_seconds_benchmark = sum(latencies_ns) / 1e9

    # ---------- Probe-mode LLM stream ----------
    transcripts = []
    probe_rows = []
    probe_calls = 0
    probe_transport_failure = None
    probe_contract_failure = None
    boundary_transits = 0
    boundary_llm_calls = 0
    probe_gate_calls = 0
    gate_seconds_probe = 0.0
    current = SEED_STATE
    token_totals = {"total": 0, "input": 0, "output": 0, "reasoning": 0,
                    "cache_read": 0, "cache_write": 0, "cost": 0.0}
    auto_events = []
    proposals = 0
    while proposals < PROBE_N:
        if is_boundary(current):
            target, gate = auto_transit(current)
            boundary_transits += 1
            probe_gate_calls += 1
            auto_events.append({"source": f"{current[0]}@{current[1]}",
                                "target": f"{target[0]}@{target[1]}",
                                "verdict": gate[0], "reasons": gate[1]})
            current = target
            continue
        proposals += 1
        prompt = (f"Current state: mask={current[0]} phase={current[1]}.\n"
                  "Propose exactly one target state as JSON "
                  '{"mask": <integer 0..4095>, "phase": <integer 0..11>}. No prose.')
        transcript, valid = call_llm(prompt, proposals, transcripts)
        probe_calls += 1
        for key in ("total", "input", "output", "reasoning", "cache_read", "cache_write"):
            token_totals[key] += transcript["tokens"].get(key, 0)
        token_totals["cost"] += transcript["cost"]
        if transcript["exit_code"] != 0 or not transcript["text"]:
            probe_transport_failure = transcript["stderr"] or "no text event"
            break
        if not valid:
            repair_prompt = prompt + '\nInvalid. Reply with only JSON {"mask": <integer>, "phase": <integer>}.'
            transcript, valid = call_llm(repair_prompt, proposals, transcripts)
            probe_calls += 1
            for key in ("total", "input", "output", "reasoning", "cache_read", "cache_write"):
                token_totals[key] += transcript["tokens"].get(key, 0)
            token_totals["cost"] += transcript["cost"]
            if not valid:
                probe_contract_failure = "invalid proposal after one repair"
                break
        target = (transcript["mask"], transcript["phase"])
        started = time.perf_counter_ns()
        verdict, reasons, checks, citation = world.gate(current, target)
        elapsed = time.perf_counter_ns() - started
        probe_gate_calls += 1
        gate_seconds_probe += elapsed / 1e9
        probe_rows.append({
            "proposal": proposals, "source": f"{current[0]}@{current[1]}",
            "target": f"{target[0]}@{target[1]}", "verdict": verdict,
            "reasons": reasons, "citation": citation,
            "ns": elapsed, "transcript": transcript.get("path"),
        })
        if verdict == "ACCEPT":
            current = target
    if is_boundary(current):
        boundary_llm_calls += 0  # boundary handled by auto-transit above

    # ---------- Metrics ----------
    b1_aggregate = task_b1["calibration"]["aggregate"]
    v_b = b1_aggregate["rejected"] / b1_aggregate["transitions"]
    accepted_task_a = task_a["proposer_execution"]["gate_call_count"]
    baseline_decodes = accepted_task_a / (1 - v_b) if v_b < 1 else None
    saved_decodes = baseline_decodes - accepted_task_a if baseline_decodes is not None else None
    saved_per = (1 / (1 - v_b) - 1) if v_b < 1 else None
    mean_gate_seconds = mean_ns / 1e9
    performer_gate_seconds_est = accepted_task_a * mean_gate_seconds
    performer_ratio = (saved_decodes / performer_gate_seconds_est
                       if saved_decodes is not None and performer_gate_seconds_est else None)
    corpus_projection = {
        "accepted_transitions": b1_aggregate["accepted"],
        "baseline_veto_rate": v_b,
        "baseline_decodes": (b1_aggregate["accepted"] / (1 - v_b)
                             if v_b < 1 else None),
        "decodes_saved": b1_aggregate["rejected"],
        "note": "Projection using the B1 corpus transition population; not a measured proposer stream.",
    }

    vetoes = sum(1 for row in probe_rows if row["verdict"] != "ACCEPT")
    probe_veto_rate = vetoes / len(probe_rows) if probe_rows else None
    rollout_tokens_avoided = vetoes * K_ROLLOUT
    probe_ratio = (rollout_tokens_avoided / gate_seconds_probe
                   if gate_seconds_probe else None)
    probe_verdict_counts = {}
    for row in probe_rows:
        key = (row["verdict"], tuple(row["reasons"]))
        probe_verdict_counts[key] = probe_verdict_counts.get(key, 0) + 1

    # Negative probes (same three)
    governed = sorted(m for m in model.masks if model.gov_root[m] is not None)
    withheld = sorted(m for m in model.masks if model.gov_root[m] is None)
    non_census = next(m for m in range(4096) if m not in model.masks)
    probes = [
        ("not-census-state", (governed[0], 0), (non_census, 0)),
        ("ungoverned-transition", (withheld[0], 0), (withheld[0], 0)),
    ]
    found = None
    search_verdicts = {}
    search_calls = 0
    for mask in governed:
        for cand in sorted(model.masks):
            if cand == mask:
                continue
            result = world.gate((mask, 0), (cand, 0))
            search_calls += 1
            key = (result[0], tuple(result[1]))
            search_verdicts[key] = search_verdicts.get(key, 0) + 1
            if result[0] == "REJECT" and result[1] == ["unlicensed-transition"]:
                found = ((mask, 0), (cand, 0))
                break
        if found:
            break
    probes.append(("unlicensed-transition", found[0], found[1]))
    probe_results = []
    for label, src, dst in probes:
        result = world.gate(src, dst)
        probe_results.append({"expected_reason": label,
                              "source": f"{src[0]}@{src[1]}",
                              "target": f"{dst[0]}@{dst[1]}",
                              "verdict": result[0], "reasons": result[1]})

    aggregate_verdicts = {}
    for (verdict, reasons), count in latency_counts.items():
        aggregate_verdicts[(verdict, tuple(reasons))] = (
            aggregate_verdicts.get((verdict, tuple(reasons)), 0) + count)
    for (verdict, reasons), count in probe_verdict_counts.items():
        aggregate_verdicts[(verdict, tuple(reasons))] = (
            aggregate_verdicts.get((verdict, tuple(reasons)), 0) + count)
    for row in probe_results:
        key = (row["verdict"], tuple(row["reasons"]))
        aggregate_verdicts[key] = aggregate_verdicts.get(key, 0) + 1
    for key, count in search_verdicts.items():
        aggregate_verdicts[key] = aggregate_verdicts.get(key, 0) + count
    observed_pairs = sorted([[v, (list(r)[0] if r else None)]
                             for v, r in aggregate_verdicts])
    pinned_pairs = sorted([["ACCEPT", None], ["REJECT", "not-census-state"],
                           ["REJECT", "ungoverned-transition"],
                           ["REJECT", "unlicensed-transition"]])
    subset = all(pair in pinned_pairs for pair in observed_pairs)

    gate_digest_after = sha256_file(f"{TASK0}/mvp2.py")
    close_snapshot = repo_snapshot()
    base_after = base_realm_digest()

    problems = []
    if probe_transport_failure:
        problems.append("S-7-environment")
    if probe_contract_failure:
        problems.append("PROPOSER-CONTRACT")
    if det_mismatches:
        problems.append("GATE-DETERMINISM")
    if LATENCY_N < 20000 and not os.environ.get("MVP3_C_QUICK"):
        problems.append("LATENCY-N<20000")
    if boundary_llm_calls:
        problems.append("BOUNDARY-LLM-CALL")
    if gate_digest_before != gate_digest_after:
        problems.append("GATE-BYTES-MUTATED")
    if base_before != base_after:
        problems.append("BASE-REALM-MUTATED")
    if open_snapshot != close_snapshot:
        problems.append("REPO-MUTATED")
    total_gate_calls = LATENCY_N + probe_gate_calls + len(probe_results) + search_calls
    status = "PASS" if not problems else "STOPPED"

    receipt = {
        "schema_version": "1.0.0",
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "machine": {"hostname": socket.gethostname(), "os": platform.platform(),
                    "python_version": platform.python_version()},
        "scratch_path": TASK,
        "execution_mode": "disjoint-subrealm (task-c; Task-A/B1 read-only seeds; gate read-only from task-0)",
        "input_pins": pin_results,
        "proposer_execution": {
            "sdk": SDK, "model": MODEL,
            "temperature": None, "top_p": None,
            "sampling_controls_note": "opencode CLI transport does not expose sampling controls; provider defaults apply",
            "max_tokens_or_equivalent": None,
            "mode": "probe-unconstrained",
            "invocation_locus": "in-harness subprocess",
            "llm_call_count": probe_calls,
            "llm_planned_calls": PROBE_N,
            "gate_call_count": probe_gate_calls,
            "boundary_auto_transit_count": boundary_transits,
            "boundary_llm_calls": boundary_llm_calls,
            "token_usage": token_totals,
            "seed_state": f"{SEED_STATE[0]}@{SEED_STATE[1]}",
        },
        "gate_latency_profile": {
            "sample_size": LATENCY_N,
            "median_microseconds": median_ns / 1000,
            "p99_microseconds": p99_ns / 1000,
            "mean_microseconds": mean_ns / 1000,
            "stddev_microseconds": stdev_ns / 1000,
            "min_microseconds": min(latencies_ns) / 1000,
            "max_microseconds": max(latencies_ns) / 1000,
            "gate_seconds_total": gate_seconds_benchmark,
            "verdict_counts": [
                {"verdict": v, "reasons": list(r), "count": n}
                for (v, r), n in sorted(latency_counts.items())
            ],
            "determinism": {"repeats": det_repeats, "mismatches": det_mismatches,
                            "result": "PASS" if det_mismatches == 0 else "FAIL"},
            "rng_seed": RNG_SEED,
            "samples_path": os.path.relpath(latency_path, BASE),
            "samples_sha256": sha256_file(latency_path),
            "comparison_baseline": REVIEW_BASELINE,
        },
        "performer_mode_avoidance": {
            "source": "task-a/task_a_receipt.json (read-only seed, digest-pinned)",
            "accepted_transitions": accepted_task_a,
            "counterfactual_baseline_veto_rate": v_b,
            "baseline_decodes_total": baseline_decodes,
            "decodes_saved_per_step": saved_per,
            "total_steps_evaluated": accepted_task_a,
            "total_decodes_saved": saved_decodes,
            "gate_seconds_estimate": performer_gate_seconds_est,
            "gate_seconds_basis": "accepted_transitions x measured mean latency",
            "ratio_decodes_saved_per_gate_second": performer_ratio,
            "corpus_scale_projection": corpus_projection,
        },
        "probe_mode_avoidance": {
            "total_evaluations": len(probe_rows),
            "accepted": sum(1 for row in probe_rows if row["verdict"] == "ACCEPT"),
            "intercepted_vetoes": vetoes,
            "veto_rate": probe_veto_rate,
            "k_rollout_tokens": K_ROLLOUT,
            "downstream_rollout_tokens_avoided": rollout_tokens_avoided,
            "proposal_decode_ops_sunk": len(probe_rows),
            "corpus_scale_projection": {
                "vetoes": b1_aggregate["rejected"],
                "k_rollout_tokens": K_ROLLOUT,
                "tokens_avoided": b1_aggregate["rejected"] * K_ROLLOUT,
                "note": "Projection using the B1 corpus veto count; not the measured probe stream.",
            },
            "gate_seconds": gate_seconds_probe,
            "ratio_tokens_avoided_per_gate_second": probe_ratio,
            "verdict_breakdown": [
                {"verdict": v, "reasons": list(r), "count": n}
                for (v, r), n in sorted(probe_verdict_counts.items())
            ],
            "energy_coefficient_joules_per_token": None,
            "estimated_joules_saved": None,
        },
        "energy": {
            "operations_primary": True,
            "joules_reported": False,
            "coefficient_source": None,
            "note": "A-5: energy fields optional; no Joule figure is asserted without a pinned, cited coefficient.",
        },
        "single_compute_avoidance_ratio": None,
        "gate_interaction": {
            "gate_calls": total_gate_calls,
            "latency_benchmark_calls": LATENCY_N,
            "probe_gate_calls": probe_gate_calls,
            "witness_search_calls": search_calls,
            "search_verdicts": [
                {"verdict": v, "reasons": list(r), "count": n}
                for (v, r), n in sorted(search_verdicts.items())
            ],
            "probe_transition_calls": len(probe_rows),
            "boundary_transit_calls": boundary_transits,
            "negative_probe_calls": len(probe_results) + 1,
            "determinism": {"repeats": det_repeats, "mismatches": det_mismatches,
                            "result": "PASS" if det_mismatches == 0 else "FAIL"},
            "verdict_counts": [
                {"verdict": v, "reasons": list(r), "count": n}
                for (v, r), n in sorted(aggregate_verdicts.items())
            ],
            "observed_pairs": observed_pairs,
            "observed_subset_of_pinned": subset,
            "negative_probes": probe_results,
        },
        "measured_vs_expected": {
            "latency_sample_size": {"expected": ">=20000", "measured": LATENCY_N},
            "gate_determinism": {"expected": "100%",
                                 "measured": "100%" if det_mismatches == 0 else "FAIL"},
            "two_mode_scoped_ratios": {"expected": True,
                                       "measured": performer_ratio is not None and probe_ratio is not None},
            "single_compute_avoidance_ratio": {"expected": None,
                                               "measured": None},
            "counterfactual_baselines": {"expected": "declared",
                                         "measured": True},
            "k_rollout_tokens": {"expected": "declared", "measured": K_ROLLOUT},
            "joules_reported": {"expected": False, "measured": False},
            "boundary_llm_calls": {"expected": 0, "measured": boundary_llm_calls},
            "repo_untouched": {"expected": True, "measured": open_snapshot == close_snapshot},
            "base_realm_untouched": {"expected": True, "measured": base_before == base_after},
            "gate_bytes_untouched": {"expected": True,
                                     "measured": gate_digest_before == gate_digest_after},
        },
        "artifacts": {
            "probe_script_sha256": sha256_file(os.path.abspath(__file__)),
            "llm_work_config_sha256": sha256_file(f"{TASK}/llm_work/opencode.json"),
            "transcripts_count": len(transcripts),
            "transcripts_manifest_sha256": sha256_text(
                "\n".join(f"{t['path']}:{t['sha256']}" for t in transcripts)),
            "latency_samples_sha256": sha256_file(latency_path),
            "task_a_receipt_sha256": TASK_A_RECEIPT_PIN,
            "task_b1_receipt_sha256": TASK_B1_RECEIPT_PIN,
        },
        "stop_rules_triggered": problems,
        "base_realm_untouched": {"before": base_before, "after": base_after,
                                 "verified": base_before == base_after},
        "repo_untouched": {"open": open_snapshot, "close": close_snapshot,
                           "verified": open_snapshot == close_snapshot},
        "notes": {
            "probe_transport_failure": probe_transport_failure,
            "probe_contract_failure": probe_contract_failure,
            "boundary_auto_transits": auto_events,
            "probe_transitions": [
                {k: row[k] for k in ("proposal", "source", "target", "verdict", "reasons")}
                for row in probe_rows
            ],
        },
        "status": status,
    }
    out = f"{TASK}/task_c_receipt.json"
    write_json(out, receipt)
    print(json.dumps({
        "status": status,
        "latency": {k: receipt["gate_latency_profile"][k] for k in
                    ("sample_size", "median_microseconds", "p99_microseconds",
                     "mean_microseconds", "stddev_microseconds")},
        "probe": {k: receipt["probe_mode_avoidance"][k] for k in
                  ("total_evaluations", "intercepted_vetoes", "veto_rate",
                   "downstream_rollout_tokens_avoided", "gate_seconds",
                   "ratio_tokens_avoided_per_gate_second")},
        "performer": {k: receipt["performer_mode_avoidance"][k] for k in
                      ("accepted_transitions", "counterfactual_baseline_veto_rate",
                       "decodes_saved_per_step", "total_decodes_saved",
                       "ratio_decodes_saved_per_gate_second")},
        "stop_rules": problems,
        "receipt": out,
        "receipt_sha256": sha256_file(out),
    }, indent=2))
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
