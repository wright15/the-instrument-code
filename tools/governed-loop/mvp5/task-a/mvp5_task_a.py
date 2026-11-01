#!/usr/bin/env python3
"""MVP5-DIR-1 Task A: coupled macro x micro trajectories, steering audit,
and the nine-seed archipelago battery."""
import hashlib
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.dont_write_bytecode = True

SCRATCH = Path(os.environ.get("MVP5_SCRATCH", "/home/erick/workspace/scratch-governed-loop-run/mvp5"))
REPO = Path(os.environ.get("GOVERNED_LOOP_REPO", "/home/erick/projects/integrated-release"))
TASK_DIR = SCRATCH / "task-a"
TRACES = TASK_DIR / "traces"
BATTERY = TRACES / "battery"
STEERING = TRACES / "steering"

SEEDS = [
    {"node": "1387@0", "office": "Saturn", "regime": "W000", "note": "Task A seed"},
    {"node": "2773@0", "office": "Sun", "regime": "W000", "note": "A0 anchor"},
    {"node": "2741@0", "office": "Moon", "regime": "W000", "note": "A0 anchor"},
    {"node": "1717@0", "office": "Mars", "regime": "W000", "note": "A0 anchor"},
    {"node": "1709@0", "office": "Mercury", "regime": "W000", "note": "A0 anchor"},
    {"node": "1453@0", "office": "Jupiter", "regime": "W000", "note": "A0 anchor"},
    {"node": "1451@0", "office": "Venus", "regime": "W000", "note": "A0 anchor"},
    {"node": "127@0", "office": "Jupiter", "regime": "W001", "note": "secondary 12-phase island"},
    {"node": "2667@0", "office": "Mercury", "regime": "W007", "note": "single-phase seam-free island"},
]

EQ_NODES = ["1387@0", "2773@11", "2905@11"]
EQ_LIFTED = ["1387@7", "2773@6", "2905@6"]


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def find_floats(value, path="root"):
    found = []
    if isinstance(value, float):
        found.append({"path": path, "value": repr(value)})
    elif isinstance(value, dict):
        for key, child in value.items():
            found.extend(find_floats(child, f"{path}.{key}"))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            found.extend(find_floats(child, f"{path}[{index}]"))
    return found


def repo_snapshot():
    head = subprocess.run(["git", "rev-parse", "HEAD"], cwd=str(REPO), capture_output=True, text=True).stdout.strip()
    porcelain = subprocess.run(["git", "status", "--porcelain"], cwd=str(REPO), capture_output=True, text=True).stdout
    orrery = subprocess.run(["git", "status", "--porcelain", "--", "orrery/"], cwd=str(REPO),
                            capture_output=True, text=True).stdout
    return {
        "head": head,
        "treeClean": porcelain == "",
        "treeDigest": hashlib.sha256(porcelain.encode()).hexdigest(),
        "orreryClean": orrery == "",
    }


def rel(path):
    return str(Path(path).relative_to(SCRATCH))


def update_staging(entries):
    manifest_path = SCRATCH / "l21_staging_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    existing = {entry["path"] for entry in manifest["entries"]}
    for entry in entries:
        if entry["path"] not in existing:
            manifest["entries"].append(entry)
    manifest["entries"].sort(key=lambda entry: entry["path"])
    manifest["entryCount"] = len(manifest["entries"])
    manifest["allHashVerified"] = all(
        (SCRATCH / entry["path"]).exists() and sha256_file(SCRATCH / entry["path"]) == entry["sha256"]
        for entry in manifest["entries"]
    )
    manifest_path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return sha256_file(manifest_path), manifest["entryCount"], manifest["allHashVerified"]


def main():
    TRACES.mkdir(parents=True, exist_ok=True)
    BATTERY.mkdir(parents=True, exist_ok=True)
    STEERING.mkdir(parents=True, exist_ok=True)

    from mvp5_coupled_engine import (CoupledEngine, Q_CARRIED, Q_RESET, K_MICRO,
                                     MICRO_STEP_MS, MACRO_DWELL_MS, TRANSIT_REST_MS,
                                     LAYER, GOV517_CORRESPONDENCE_CLAIMED,
                                     STILL_SET_LABEL, events_from_receipt_steps,
                                     write_trace, load_arm_trajectories, find_floats)

    stop = []
    opened = repo_snapshot()
    if opened["head"] != "ba6ae1fe2c8b31ab739c91593701177678bff18b" or not opened["treeClean"]:
        stop.append({"rule": "S-1" if opened["head"] != "ba6ae1fe2c8b31ab739c91593701177678bff18b" else "S-3",
                     "detail": "opening repository state drift"})

    engine = CoupledEngine()
    receipt = {
        "schemaVersion": "governed-loop.mvp5-task-a.v1",
        "task": "MVP5-DIR-1 Task A",
        "directive": "MVP5-DIR-1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "layer": LAYER,
        "gov517_correspondence_claimed": GOV517_CORRESPONDENCE_CLAIMED,
        "still_set_label": STILL_SET_LABEL,
        "opening": opened,
        "config": {
            "kMicro": K_MICRO,
            "kBoundary": 0,
            "microStepMs": MICRO_STEP_MS,
            "macroDwellMs": MACRO_DWELL_MS,
            "transitRestMs": TRANSIT_REST_MS,
            "qReset": Q_RESET,
            "qCarried": Q_CARRIED,
            "microBarLaw": "one K-micro bar at the source node of each macro decision",
            "emissionLaw": "direct fifth-stack; phase-equivariant canonical-container snap fallback",
            "llmCalls": 0,
        },
        "arms": {},
        "referenceTraces": {},
        "equivariance": {},
        "steering": {},
        "archipelago": {},
        "staging": {},
    }

    arm_receipt = load_arm_trajectories(REPO / "qa" / "mvp4_task_a_receipt.json")
    arm_specs = [
        ("arm1_unranked_q_carried", "unranked-baseline", Q_CARRIED,
         "451-B: unranked 2-state Saturn cycle with continuous carried Q"),
        ("arm2_static_q_carried", "chaldean-static", Q_CARRIED,
         "451-A: static Chaldean 4-state Saturn walk with continuous carried Q"),
        ("arm3a_dynamic_q_reset", "dynamic-context", Q_RESET,
         "MVP-4 Task A dynamic 21-state trajectory with reset Q still-life"),
        ("arm3b_dynamic_q_carried", "dynamic-context", Q_CARRIED,
         "MVP-4 Task A dynamic 21-state trajectory with continuous carried Q"),
    ]
    arm_traces = {}
    for trace_name, receipt_arm, mode, description in arm_specs:
        arm = arm_receipt[receipt_arm]
        steps = arm["steps"]
        events = events_from_receipt_steps(steps)
        bar_nodes = [step["source"] for step in steps if step["kind"] == "llm-choice"]
        trace = engine.build_trace(trace_name, bar_nodes, events, mode, description,
                                   source_trajectory=arm["trajectory"])
        trace_path = TRACES / f"{trace_name}.jsonl"
        trace_sha = write_trace(trace_path, trace)
        arm_traces[trace_name] = trace
        receipt["arms"][trace_name] = {
            "trace": rel(trace_path),
            "traceSha256": trace_sha,
            "receiptArm": receipt_arm,
            "mode": mode,
            "trajectory": arm["trajectory"],
            "autoTransits": arm.get("auto_transits", []),
            "summary": trace["summary"],
            "bars": trace["bars"],
            "rests": trace["rests"],
        }

    # MVP-4 Task C 8-hop reference path, reset and carried.
    hop_records = []
    for line in (REPO / "tools" / "governed-loop" / "mvp4" / "task-c" / "coupled_trace.jsonl").read_text(encoding="utf-8").splitlines():
        record = json.loads(line)
        if record.get("recordType") == "macro-hop":
            hop_records.append(record["hop"])
    tc_nodes = [hop_records[0]["source"]] + [hop["target"] for hop in hop_records]
    tc_events = []
    for hop in hop_records:
        tc_events.append({
            "source": hop["source"],
            "target": hop["target"],
            "kind": hop["kind"],
            "citation": hop["citation"],
            "gateVerdict": hop["gate"]["verdict"],
            "gateReasons": hop["gate"]["reasons"],
            "presentedIndex": hop.get("presentedIndex"),
        })
    for suffix, mode in (("reset", Q_RESET), ("carried", Q_CARRIED)):
        name = f"arm_tc_8hop_{suffix}"
        trace = engine.build_trace(name, [hop["source"] for hop in hop_records], tc_events, mode,
                                   f"MVP-4 Task C 8-hop path with {mode}", source_trajectory=tc_nodes)
        trace_path = TRACES / f"{name}.jsonl"
        trace_sha = write_trace(trace_path, trace)
        receipt["referenceTraces"][name] = {
            "trace": rel(trace_path),
            "traceSha256": trace_sha,
            "mode": mode,
            "trajectory": tc_nodes,
            "summary": trace["summary"],
        }

    # Task B equivariant pair: base and exact +7 lift.
    def hops_for(nodes):
        hops = []
        for source, target in zip(nodes, nodes[1:]):
            meta = engine.planner.edge_meta(source, target)
            verdict, reasons, checks, citation = engine.world.gate(
                engine.parse_node(source), engine.parse_node(target))
            hops.append({
                "source": source, "target": target, "kind": meta["kind"],
                "operator": meta.get("operator"), "citation": citation,
                "gateVerdict": verdict, "gateReasons": reasons,
            })
        return hops

    eq_traces = {}
    for name, nodes in (("arm_tb_equiv_p0", EQ_NODES), ("arm_tb_equiv_p7", EQ_LIFTED)):
        trace = engine.build_trace(name, nodes, hops_for(nodes), Q_CARRIED,
                                   f"Task B equivariant 2-hop pair ({'base' if name.endswith('p0') else '+7 lift'})",
                                   source_trajectory=nodes)
        trace_path = TRACES / f"{name}.jsonl"
        trace_sha = write_trace(trace_path, trace)
        eq_traces[name] = trace
        receipt["referenceTraces"][name] = {
            "trace": rel(trace_path),
            "traceSha256": trace_sha,
            "mode": Q_CARRIED,
            "trajectory": nodes,
            "summary": trace["summary"],
        }
    base_steps = eq_traces["arm_tb_equiv_p0"]["microSteps"]
    lift_steps = eq_traces["arm_tb_equiv_p7"]["microSteps"]
    per_step = []
    matches = 0
    for index, (base_step, lift_step) in enumerate(zip(base_steps, lift_steps), start=1):
        expected = (base_step["emittedPc"] + 7) % 12
        ok = expected == lift_step["emittedPc"]
        matches += 1 if ok else 0
        per_step.append({
            "step": index,
            "baseNode": base_step["node"],
            "liftedNode": lift_step["node"],
            "baseEmittedPc": base_step["emittedPc"],
            "expectedLiftedPc": expected,
            "liftedEmittedPc": lift_step["emittedPc"],
            "match": ok,
        })
    receipt["equivariance"] = {
        "microSteps": len(base_steps),
        "matches": matches,
        "allTransposed": matches == len(base_steps) == 15,
        "perStep": per_step,
        "qSequencesIdentical": eq_traces["arm_tb_equiv_p0"]["qSequence"] == eq_traces["arm_tb_equiv_p7"]["qSequence"],
    }
    if not receipt["equivariance"]["allTransposed"]:
        stop.append({"rule": "S-7", "detail": "equivariant +7 transposition failure",
                     "detailData": {"matches": matches, "steps": len(base_steps)}})

    # A.2 steering audit: LLM Arm 3 vs deterministic index-0 greedy under U and D.
    dynamic_steps = [step for step in arm_receipt["dynamic-context"]["steps"] if step["kind"] == "llm-choice"]
    llm_indices = [step["presented_index"] for step in dynamic_steps]
    llm_zero = sum(1 for index in llm_indices if index == 0)
    greedy_u = engine.greedy_walk("1387@0", "U")
    greedy_d = engine.greedy_walk("1387@0", "D")
    greedy_traces = {}
    for name, walk in (("greedy_u_1387", greedy_u), ("greedy_d_1387", greedy_d)):
        mode = Q_CARRIED
        bar_nodes = [event["source"] for event in walk["events"] if event.get("kind") != "boundary-auto-transit"]
        trace = engine.build_trace(name, bar_nodes, walk["events"], mode,
                                   f"deterministic index-0 greedy walk variant {walk['variant']}",
                                   source_trajectory=walk["trajectory"])
        trace_path = STEERING / f"{name}.jsonl"
        trace_sha = write_trace(trace_path, trace)
        greedy_traces[name] = {
            "trace": rel(trace_path),
            "traceSha256": trace_sha,
            "variant": walk["variant"],
            "trajectory": walk["trajectory"],
            "summary": trace["summary"],
            "llmCalls": 0,
            "presentedIndexZero": len([e for e in walk["events"] if e.get("kind") != "boundary-auto-transit"]),
        }
    comparison = []
    llm_decisions = [step for step in dynamic_steps]
    u_decisions = [e for e in greedy_u["events"] if e.get("kind") != "boundary-auto-transit"]
    d_decisions = [e for e in greedy_d["events"] if e.get("kind") != "boundary-auto-transit"]
    for index in range(20):
        llm = llm_decisions[index]
        u = u_decisions[index]
        d = d_decisions[index]
        comparison.append({
            "decision": index + 1,
            "llm": {"source": llm["source"], "target": llm["target"], "presentedIndex": llm["presented_index"]},
            "greedyU": {"source": u["source"], "target": u["target"], "presentedIndex": 0},
            "greedyD": {"source": d["source"], "target": d["target"], "presentedIndex": 0},
            "llmMatchesU": llm["target"] == u["target"] and llm["source"] == u["source"],
            "llmMatchesD": llm["target"] == d["target"] and llm["source"] == d["source"],
        })
    receipt["steering"] = {
        "llmArm3": {
            "presentedIndices": llm_indices,
            "presentedIndexZeroCount": llm_zero,
            "presentedIndexZeroTotal": len(llm_indices),
            "divergence": {
                "step": 1,
                "presentedIndex": llm_indices[0],
                "chosen": dynamic_steps[0]["target"],
                "indexZeroCandidate": dynamic_steps[0]["presented_order"][0],
            },
            "distinctStates": len(set(arm_receipt["dynamic-context"]["trajectory"])),
            "llmCalls": 20,
        },
        "greedyU": {
            "trajectory": greedy_u["trajectory"],
            "distinctStates": len(set(greedy_u["trajectory"])),
            "families": len({engine.planner.gov_root.get(engine.parse_node(node)[0])
                             for node in greedy_u["trajectory"]
                             if not engine.is_boundary(node)}),
            "seams": sum(1 for e in greedy_u["events"] if e.get("kind") not in (None, "tier-1", "boundary-auto-transit")),
            "autoTransits": sum(1 for e in greedy_u["events"] if e.get("kind") == "boundary-auto-transit"),
            "llmCalls": 0,
        },
        "greedyD": {
            "trajectory": greedy_d["trajectory"],
            "distinctStates": len(set(greedy_d["trajectory"])),
            "families": len({engine.planner.gov_root.get(engine.parse_node(node)[0])
                             for node in greedy_d["trajectory"]
                             if not engine.is_boundary(node)}),
            "seams": sum(1 for e in greedy_d["events"] if e.get("kind") not in (None, "tier-1", "boundary-auto-transit")),
            "autoTransits": sum(1 for e in greedy_d["events"] if e.get("kind") == "boundary-auto-transit"),
            "llmCalls": 0,
        },
        "comparison": comparison,
        "greedyTraces": greedy_traces,
        "variantDefinitions": {
            "U": "task_a_as_run uniform Tier-1 W_base=50 (mvp4_task_a.py:166,217)",
            "D": "card_spec_degree_mapped W_base=weights_numerator[degree] (mvp4_task_c.py:169-170)",
        },
        "bothVariantsAddress21States": (len(set(greedy_u["trajectory"])) == 21 and len(set(greedy_d["trajectory"])) == 21),
    }
    if not receipt["steering"]["bothVariantsAddress21States"]:
        receipt["steering"]["disclosure"] = "deterministic variants did not both reach 21 distinct states"

    # A.3 nine-seed archipelago battery.
    battery_rows = []
    gate_totals = {"accepted": 0, "total": 0}
    out_of_mask_total = 0
    for seed in SEEDS:
        for variant in ("U", "D"):
            walk = engine.greedy_walk(seed["node"], variant)
            bar_nodes = [event["source"] for event in walk["events"]
                         if event.get("kind") != "boundary-auto-transit"]
            trace_name = f"{seed['node'].replace('@', '_')}_{variant}"
            trace = engine.build_trace(trace_name, bar_nodes, walk["events"], Q_CARRIED,
                                       f"battery seed {seed['node']} variant {variant}",
                                       source_trajectory=walk["trajectory"])
            trace_path = BATTERY / f"{trace_name}.jsonl"
            trace_sha = write_trace(trace_path, trace)
            accepted = sum(1 for event in walk["events"] if event.get("gateVerdict") == "ACCEPT")
            gate_totals["accepted"] += accepted
            gate_totals["total"] += len(walk["events"])
            out_of_mask_total += trace["summary"]["outOfMaskPitches"]
            families = {engine.planner.gov_root.get(engine.parse_node(node)[0])
                        for node in walk["trajectory"] if not engine.is_boundary(node)}
            battery_rows.append({
                "seed": seed["node"],
                "office": seed["office"],
                "regime": seed["regime"],
                "note": seed["note"],
                "variant": variant,
                "trace": rel(trace_path),
                "traceSha256": trace_sha,
                "trajectoryLength": len(walk["trajectory"]),
                "distinctStates": len(set(walk["trajectory"])),
                "distinctFamilies": len(families),
                "decisions": walk["decisions"],
                "seams": trace["summary"]["seamModulations"],
                "autoTransits": trace["summary"]["autoTransits"],
                "gateAccepted": accepted,
                "gateTotal": len(walk["events"]),
                "gateAcceptAll": accepted == len(walk["events"]),
                "outOfMaskPitches": trace["summary"]["outOfMaskPitches"],
                "distinctQStates": trace["summary"]["distinctQStates"],
                "ngram5Repeats": trace["summary"]["ngram5Repeats"],
                "finalState": walk["finalState"],
                "llmCalls": 0,
            })
    w007 = [row for row in battery_rows if row["regime"] == "W007"]
    receipt["archipelago"] = {
        "seeds": SEEDS,
        "results": battery_rows,
        "gateAcceptRate": {
            "accepted": gate_totals["accepted"],
            "total": gate_totals["total"],
            "allAccepted": gate_totals["accepted"] == gate_totals["total"],
        },
        "outOfMaskPitches": out_of_mask_total,
        "w007": {
            "rows": w007,
            "seamEdges": 0,
            "seamBoostNeverFires": all(row["seams"] == 0 for row in w007),
            "recencyPreventsTwoStateOscillation": all(row["distinctStates"] == 7 for row in w007),
            "nodeCount": 7,
        },
        "seedCount": len(SEEDS),
        "acceptingSeeds": len({row["seed"] for row in battery_rows if row["gateAcceptAll"]}),
    }
    if not receipt["archipelago"]["gateAcceptRate"]["allAccepted"]:
        stop.append({"rule": "S-5", "detail": "gate veto inside a coupled walk"})
    if out_of_mask_total != 0:
        stop.append({"rule": "S-7", "detail": "pitch-class container leak", "detailData": {"count": out_of_mask_total}})

    # Layer and Q checks.
    carried = receipt["arms"]["arm3b_dynamic_q_carried"]["summary"]
    reset = receipt["arms"]["arm3a_dynamic_q_reset"]["summary"]
    boundary_dwell = sum(entry["summary"]["boundaryDwell"] for entry in receipt["arms"].values())
    boundary_dwell += sum(entry["summary"]["boundaryDwell"] for entry in receipt["referenceTraces"].values())
    checks = {
        "arm1MicroSteps100": receipt["arms"]["arm1_unranked_q_carried"]["summary"]["microSteps"] == 100,
        "arm2MicroSteps100": receipt["arms"]["arm2_static_q_carried"]["summary"]["microSteps"] == 100,
        "arm3aMicroSteps100": reset["microSteps"] == 100,
        "arm3bMicroSteps100": carried["microSteps"] == 100,
        "arm3aQResetStates5": reset["distinctQStates"] == 5 and reset["qStatesVisited"] == [0, 2, 4, 7, 9],
        "arm3bQCarriedStates12": carried["distinctQStates"] == 12 and carried["stillSetEntries"] == 0,
        "boundaryDwellZero": boundary_dwell == 0,
        "boundaryAutoTransitPresent": receipt["arms"]["arm3b_dynamic_q_carried"]["summary"]["autoTransits"] == 1,
        "equivariance15of15": receipt["equivariance"]["allTransposed"],
        "greedyBoth21States": receipt["steering"]["bothVariantsAddress21States"],
        "archipelago9SeedsAccept": receipt["archipelago"]["gateAcceptRate"]["allAccepted"] and
                                   receipt["archipelago"]["acceptingSeeds"] == 9,
        "outOfMaskZero": out_of_mask_total == 0,
        "allArmsGateAccept": all(arm["summary"]["gateAcceptAll"] for arm in receipt["arms"].values()),
        "allTracesGateAccept": all(trace["summary"]["gateAcceptAll"] for trace in receipt["referenceTraces"].values()),
    }
    receipt["checks"] = checks
    receipt["checksPassed"] = sum(1 for value in checks.values() if value)
    receipt["checksTotal"] = len(checks)
    for name, passed in checks.items():
        if not passed:
            stop.append({"rule": "S-5" if "Gate" in name else "S-9" if "boundary" in name.lower() else "S-7",
                         "detail": f"task A check failed: {name}"})

    floats = find_floats(receipt)
    receipt["floatScan"] = {"values": len(floats), "witnesses": floats[:5]}
    if floats:
        stop.append({"rule": "S-6", "detail": "float contamination in Task A receipt", "detailData": floats[:5]})
    for trace_file in sorted(TRACES.rglob("*.jsonl")):
        for line in trace_file.read_text(encoding="utf-8").splitlines():
            if find_floats(json.loads(line)):
                stop.append({"rule": "S-6", "detail": f"float contamination in {rel(trace_file)}"})
                break

    close = repo_snapshot()
    receipt["close"] = close
    if close["head"] != opened["head"] or not close["treeClean"] or not close["orreryClean"]:
        stop.append({"rule": "S-3", "detail": "repository write or orrery change at Task A close"})

    receipt["constraints"] = {"repoWrites": 0, "orreryChanges": 0, "gateBytesTouched": False}
    receipt["stopRulesTriggered"] = stop
    receipt["status"] = "COMPLETE" if not stop else "STOP"
    receipt_path = TASK_DIR / "mvp5_task_a_receipt.json"
    receipt_path.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    receipt_sha = sha256_file(receipt_path)

    entries = [{
        "path": rel(receipt_path), "sha256": receipt_sha, "bytes": receipt_path.stat().st_size,
        "origin": "task-a", "role": "receipt",
    }, {
        "path": rel(Path(__file__)), "sha256": sha256_file(Path(__file__)),
        "bytes": Path(__file__).stat().st_size, "origin": "task-a", "role": "runner",
    }, {
        "path": rel(TASK_DIR / "mvp5_coupled_engine.py"),
        "sha256": sha256_file(TASK_DIR / "mvp5_coupled_engine.py"),
        "bytes": (TASK_DIR / "mvp5_coupled_engine.py").stat().st_size,
        "origin": "task-a", "role": "module",
    }]
    for trace_file in sorted(TRACES.rglob("*.jsonl")):
        entries.append({
            "path": rel(trace_file), "sha256": sha256_file(trace_file), "bytes": trace_file.stat().st_size,
            "origin": "task-a", "role": "trace",
        })
    manifest_sha, manifest_count, manifest_ok = update_staging(entries)
    receipt["staging"] = {"manifest": rel(SCRATCH / "l21_staging_manifest.json"),
                          "manifestSha256": manifest_sha, "manifestEntries": manifest_count,
                          "allHashVerified": manifest_ok}
    receipt_path.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    print("MVP5 TASK A")
    for name, arm in receipt["arms"].items():
        summary = arm["summary"]
        print(f"  {name}: states {summary['distinctMacroStates']} / micro {summary['microSteps']} / "
              f"q {summary['distinctQStates']} / seams {summary['seamModulations']} / "
              f"autos {summary['autoTransits']} / ngram repeats {summary['ngram5Repeats']}")
    print(f"  equivariance: {receipt['equivariance']['matches']}/{receipt['equivariance']['microSteps']}")
    print(f"  greedy U/D distinct: {receipt['steering']['greedyU']['distinctStates']}/"
          f"{receipt['steering']['greedyD']['distinctStates']} / LLM idx0 "
          f"{receipt['steering']['llmArm3']['presentedIndexZeroCount']}/20")
    print(f"  battery: {receipt['archipelago']['acceptingSeeds']}/9 seeds accept / "
          f"gate {gate_totals['accepted']}/{gate_totals['total']} / out-of-mask {out_of_mask_total}")
    print(f"  checks: {receipt['checksPassed']}/{receipt['checksTotal']} / status {receipt['status']} / "
          f"stop {[s['rule'] for s in stop]}")
    print(f"  receipt: {receipt_path}")
    return 0 if not stop else 1


if __name__ == "__main__":
    sys.exit(main())
