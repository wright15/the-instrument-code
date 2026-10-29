#!/usr/bin/env python3
"""MVP3 Task A — Performer-mode neurosymbolic proposer with Chaldean domain card.

Direct in-process gate calls. LLM transport: opencode CLI (in-harness subprocess).
All writes resolve under this subrealm. Base Task-0 realm is read-only.
"""
import datetime
import hashlib
import importlib.util
import json
import os
import platform
import re
import shutil
import socket
import subprocess
import sys
import time

sys.dont_write_bytecode = True

SCRATCH = "/home/erick/workspace/scratch-governed-loop-run"
BASE = SCRATCH
TASK_DIR = f"{SCRATCH}/task-a"
LLM_WORK = f"{TASK_DIR}/llm_work"
TRANSCRIPTS = f"{TASK_DIR}/transcripts"
REPO = "/home/erick/projects/integrated-release"
MODEL = "opencode-go/claude-haiku-5-5"
SDK = "opencode CLI 1.19.4 (non-interactive run --format json, agent=proposer, --pure, --auto)"
STEPS_PER_ARM = 10
SEED = (1387, 0)

CHALDEAN_DEGREE = {"Saturn": 1, "Jupiter": 2, "Mars": 3, "Sun": 4,
                   "Venus": 5, "Mercury": 6, "Moon": 7}
CHALDEAN_WEIGHT = {1: 116, 5: 77, 2: 56, 6: 44, 3: 41, 7: 38, 4: 35}
RANKING_ORDER = [1, 5, 2, 6, 3, 7, 4]
PINNED_VOCAB = {("ACCEPT", ()), ("REJECT", ("not-census-state",)),
                ("REJECT", ("ungoverned-transition",)),
                ("REJECT", ("unlicensed-transition",))}


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


def load_bridge():
    spec = importlib.util.spec_from_file_location(
        "orrery_nav_bridge_task_a", f"{BASE}/orrery_nav_bridge.py")
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
        dirs[:] = [d for d in dirs if d not in ("task-a", "task-b0", "__pycache__")]
        for name in sorted(files):
            path = os.path.join(root, name)
            rel = os.path.relpath(path, BASE)
            entries.append(f"{rel}:{sha256_file(path)}")
    return {"file_count": len(entries),
            "digest": sha256_text("\n".join(entries))}


class Proposer:
    def __init__(self):
        self.bridge = load_bridge()
        self.model = self.bridge.Model()
        self.world = self.model.world
        self.family_a = {}
        for edge in self.model.catalog["familyA"]["edges"]:
            operator, src, sp, tgt, tp, intra, boundary = edge
            self.family_a.setdefault((int(src), int(sp)), []).append(
                {"mask": int(tgt), "phase": int(tp), "operator": operator})
        self.family_b = {}
        for edge in self.model.catalog["familyB"]["edges"]:
            left, right = int(edge["leftMask"]), int(edge["rightMask"])
            for phase in range(12):
                self.family_b.setdefault((left, phase), set()).add((right, phase))
                self.family_b.setdefault((right, phase), set()).add((left, phase))
        self.llm_calls = 0
        self.gate_calls = 0
        self.gate_determinism_checks = 0
        self.gate_probe_calls = 0
        self.boundary_auto_transits = 0
        self.boundary_llm_calls = 0
        self.transcripts = []
        self.token_totals = {"total": 0, "input": 0, "output": 0, "reasoning": 0,
                             "cache_read": 0, "cache_write": 0, "cost": 0.0}

    def card(self, active_mask, target_mask):
        a = CHALDEAN_DEGREE.get(self.model.office.get(active_mask))
        t = CHALDEAN_DEGREE.get(self.model.office.get(target_mask))
        if a is None or t is None:
            return None
        delta = (t - a) % 7
        k = (2 * delta) % 7
        d = (4 * k) % 7
        return {"active_degree": a, "target_degree": t, "delta": delta,
                "fifths_step": k, "m5_distance": d, "rank": k,
                "target_weight_numerator": CHALDEAN_WEIGHT[t]}

    def assemble(self, mask, phase):
        root = self.model.gov_root[mask]
        candidates = []
        seen = set()
        if root is not None:
            for target in sorted(self.model.families[root]):
                cand = (int(target), phase)
                if cand not in seen:
                    seen.add(cand)
                    candidates.append({"mask": cand[0], "phase": cand[1],
                                       "category": "tier-1"})
        for entry in sorted(self.family_a.get((mask, phase), []),
                            key=lambda x: (x["mask"], x["phase"], x["operator"])):
            cand = (entry["mask"], entry["phase"])
            if cand not in seen:
                seen.add(cand)
                candidates.append({"mask": cand[0], "phase": cand[1],
                                   "category": "familyA-seam",
                                   "operator": entry["operator"]})
        for cand in sorted(self.family_b.get((mask, phase), set())):
            if cand not in seen:
                seen.add(cand)
                candidates.append({"mask": cand[0], "phase": cand[1],
                                   "category": "familyB-seam"})
        for cand in candidates:
            cand["card"] = self.card(mask, cand["mask"])
            cand["id"] = f"{cand['mask']}@{cand['phase']}"
        return candidates

    def gate(self, source, target):
        verdict, reasons, checks, citation = self.world.gate(source, target)
        self.gate_calls += 1
        second = self.world.gate(source, target)
        self.gate_determinism_checks += 1
        if (verdict, tuple(reasons), citation) != (second[0], tuple(second[1]), second[3]):
            raise RuntimeError(f"gate nondeterminism {source}->{target}")
        return {"verdict": verdict, "reasons": reasons,
                "citation": citation, "checks": checks}

    def call_llm(self, arm, step, prompt, candidates):
        self.llm_calls += 1
        call_index = self.llm_calls
        started = time.time()
        proc = subprocess.run(
            ["opencode", "run", "--model", MODEL, "--format", "json",
             "--agent", "proposer", "--auto", "--pure",
             "--dir", LLM_WORK, prompt],
            capture_output=True, text=True, timeout=90)
        elapsed = round(time.time() - started, 3)
        texts, tokens, cost = [], {}, 0.0
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
        choice = parsed.get("choice") if isinstance(parsed, dict) else None
        valid = isinstance(choice, int) and 0 <= choice < len(candidates)
        transcript = {
            "arm": arm, "step": step, "call_index": call_index,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "prompt": prompt, "exit_code": proc.returncode,
            "stdout": proc.stdout, "stderr": proc.stderr,
            "elapsed_seconds": elapsed, "text": texts[-1] if texts else None,
            "parsed": parsed, "choice": choice, "valid": valid,
            "tokens": tokens, "cost": cost,
        }
        path = f"{TRANSCRIPTS}/{arm}_call_{call_index:03d}.json"
        transcript["path"] = os.path.relpath(path, TASK_DIR)
        write_json(path, transcript)
        self.transcripts.append({"path": os.path.relpath(path, TASK_DIR),
                                 "sha256": sha256_file(path)})
        for key in ("total", "input", "output", "reasoning", "cache_read", "cache_write"):
            self.token_totals[key] += tokens.get(key, 0)
        self.token_totals["cost"] += cost
        if proc.returncode != 0 or not texts:
            return None, transcript, "transport"
        if not valid:
            return None, transcript, "contract"
        return choice, transcript, None

    def prompt(self, source, candidates, ranked):
        def order_key(c):
            card = c["card"]
            if ranked:
                rank = card["rank"] if card else 99
                return (rank, c["mask"], c["phase"])
            return (c["mask"], c["phase"])
        ordered = sorted(candidates, key=order_key)
        lines = ["You are a harmonic transition proposer. Choose exactly one candidate "
                 "for the next transition.",
                 f"Current state: mask={source[0]} phase={source[1]}.",
                 "Candidates:"]
        for index, cand in enumerate(ordered):
            line = f"{index}) mask={cand['mask']} phase={cand['phase']}"
            if ranked:
                card = cand["card"]
                if card is None:
                    line += " chaldean_rank=unranked"
                else:
                    line += (f" chaldean_rank={card['rank']}"
                             f" chaldean_m5={card['m5_distance']}"
                             f" target_degree={card['target_degree']}")
            lines.append(line)
        lines.append('Reply with only a JSON object: {"choice": <index>}')
        return "\n".join(lines), ordered

    def auto_transit(self, node):
        mask, phase = node
        options = []
        for entry in sorted(self.family_a.get(node, []),
                            key=lambda x: (x["mask"], x["phase"], x["operator"])):
            options.append((entry["mask"], entry["phase"]))
        for cand in sorted(self.family_b.get(node, set())):
            options.append(cand)
        if not options:
            raise RuntimeError(f"boundary state {node} has no seam exit")
        target = options[0]
        gate_result = self.gate(node, target)
        if gate_result["verdict"] != "ACCEPT":
            raise RuntimeError(f"auto-transit rejected {node}->{target}: {gate_result}")
        self.boundary_auto_transits += 1
        return target, {
            "kind": "auto-transit", "source": f"{mask}@{phase}",
            "target": f"{target[0]}@{target[1]}",
            "llm_invoked": False, "gate": gate_result,
            "choice_rule": "smallest (target mask, target phase, operator) seam exit",
        }

    def run_arm(self, arm, ranked):
        node = SEED
        steps = []
        auto_events = []
        decisions = 0
        while decisions < STEPS_PER_ARM:
            mask, phase = node
            if self.model.gov_root[mask] is None:
                if len(auto_events) > 100:
                    raise RuntimeError("auto-transit runaway guard tripped")
                target, event = self.auto_transit(node)
                auto_events.append(event)
                steps.append({"step": decisions, "kind": "auto-transit",
                              "source": f"{mask}@{phase}",
                              "target": f"{target[0]}@{target[1]}",
                              "llm_invoked": False,
                              "gate": event["gate"]})
                node = target
                continue
            candidates = self.assemble(mask, phase)
            outbound = [c for c in candidates
                        if (c["mask"], c["phase"]) != (mask, phase)]
            if len(candidates) > 15:
                raise RuntimeError(f"candidate bound violated at {node}: {len(candidates)}")
            if not outbound:
                break
            decisions += 1
            prompt, ordered = self.prompt(node, outbound, ranked)
            choice, transcript, error = self.call_llm(arm, decisions, prompt, ordered)
            repair = 0
            while error == "contract" and repair < 1:
                repair += 1
                repair_prompt = prompt + ("\nYour previous reply was invalid. "
                                          'Reply with only a JSON object: {"choice": <index>}')
                choice, transcript, error = self.call_llm(
                    arm, decisions, repair_prompt, ordered)
            if error == "transport":
                raise RuntimeError("S-7 transport failure in proposer mode")
            if error == "contract":
                raise RuntimeError("proposer contract violation after repair")
            chosen = ordered[choice]
            target = (chosen["mask"], chosen["phase"])
            gate_result = self.gate(node, target)
            if gate_result["verdict"] != "ACCEPT":
                raise RuntimeError(
                    f"assembled candidate rejected {node}->{target}: {gate_result}")
            steps.append({
                "step": decisions, "kind": "llm-choice", "arm": arm,
                "source": f"{mask}@{phase}", "target": f"{target[0]}@{target[1]}",
                "llm_invoked": True, "presented_index": choice,
                "presented_count": len(ordered),
                "legal_set_count_including_self": len(candidates),
                "outbound_count": len(outbound),
                "presented_order": [c["id"] for c in ordered],
                "chosen_category": chosen["category"],
                "chosen_card": chosen["card"],
                "gate": gate_result,
                "repair_calls": repair,
                "transcript": transcript["path"] if isinstance(transcript, dict) else None,
            })
            node = target
        return {"arm": arm, "ranked": ranked, "steps": steps,
                "auto_transits": auto_events, "final_state": f"{node[0]}@{node[1]}",
                "terminated_reason": ("completed" if decisions == STEPS_PER_ARM
                                      else "no-outbound-choice")}

    def boundary_exercise(self):
        for edge in self.model.catalog["familyA"]["edges"]:
            operator, src, sp, tgt, tp, intra, boundary = edge
            src, sp, tgt, tp = int(src), int(sp), int(tgt), int(tp)
            if self.model.role[tgt] != "boundary":
                continue
            if self.model.gov_root[src] is None:
                continue
            entry = self.gate((src, sp), (tgt, tp))
            if entry["verdict"] != "ACCEPT":
                continue
            exit_target, exit_event = self.auto_transit((tgt, tp))
            return {
                "exercised": True,
                "entry": {"operator": operator, "source": f"{src}@{sp}",
                          "boundary_state": f"{tgt}@{tp}", "gate": entry},
                "boundary_llm_invoked": False,
                "auto_transit": exit_event,
                "exit_state": f"{exit_target[0]}@{exit_target[1]}",
            }
        return {"exercised": False}

    def negative_probes(self):
        governed = sorted(m for m in self.model.masks
                          if self.model.gov_root[m] is not None)
        withheld = sorted(m for m in self.model.masks
                          if self.model.gov_root[m] is None)
        non_census = next(m for m in range(4096) if m not in self.model.masks)
        probes = [
            ("not-census-state", (governed[0], 0), (non_census, 0)),
            ("ungoverned-transition", (withheld[0], 0), (withheld[0], 0)),
        ]
        found = None
        for mask in governed:
            for cand in sorted(self.model.masks):
                if cand == mask:
                    continue
                result = self.world.gate((mask, 0), (cand, 0))
                self.gate_probe_calls += 1
                if result[0] == "REJECT" and result[1] == ["unlicensed-transition"]:
                    found = ((mask, 0), (cand, 0))
                    break
            if found:
                break
        probes.append(("unlicensed-transition", found[0], found[1]))
        results = []
        for label, src, dst in probes:
            result = self.world.gate(src, dst)
            self.gate_probe_calls += 1
            results.append({"expected_reason": label,
                            "source": f"{src[0]}@{src[1]}",
                            "target": f"{dst[0]}@{dst[1]}",
                            "verdict": result[0], "reasons": result[1]})
        return results


def main():
    os.makedirs(LLM_WORK, exist_ok=True)
    os.makedirs(TRANSCRIPTS, exist_ok=True)
    open_snapshot = repo_snapshot()
    base_before = base_realm_digest()

    card_spec = {
        "card_id": "CHALDEAN_WEIGHTED_FIFTH_SPACE_v1",
        "role": "rank-only zero-veto",
        "degree_governors": {str(k): v for k, v in CHALDEAN_DEGREE.items()},
        "weights_denominator": 407,
        "weights_numerator": {str(k): v for k, v in CHALDEAN_WEIGHT.items()},
        "ranking_order_degrees": RANKING_ORDER,
        "ranking_numerals": ["I", "V", "II", "VI", "III", "VII", "IV"],
        "formula": {
            "delta": "(target_degree - active_degree) mod 7",
            "fifths_step_k": "(2 * delta) mod 7",
            "m5_distance_d": "(4 * k) mod 7",
            "rank": "k ascending; 0 = most proximate",
        },
        "fence": "The card ranks already-legal candidates; it never alters a gate verdict.",
    }
    card_path = f"{TASK_DIR}/mvp3_chaldean_card.json"
    write_json(card_path, card_spec)

    proposer = Proposer()
    arms = []
    try:
        arms.append(proposer.run_arm("unranked-baseline", ranked=False))
        arms.append(proposer.run_arm("chaldean-ranked", ranked=True))
        boundary_protocol = proposer.boundary_exercise()
        probes = proposer.negative_probes()
        status = "PASS"
        stop = None
    except Exception as error:  # noqa: BLE001
        boundary_protocol = {"exercised": False}
        probes = []
        status = "STOPPED"
        stop = str(error)
        arms = []

    # Metrics across arms
    def arm_metrics(arm):
        ranks = [s["chosen_card"]["rank"] for s in arm["steps"]
                 if s.get("kind") == "llm-choice" and s.get("chosen_card")]
        presented_first = [s["presented_index"] == 0 for s in arm["steps"]
                           if s.get("kind") == "llm-choice"]
        top_rank = [s["chosen_card"]["rank"] == 0 for s in arm["steps"]
                    if s.get("kind") == "llm-choice" and s.get("chosen_card")]
        return {
            "llm_decisions": len([s for s in arm["steps"] if s["kind"] == "llm-choice"]),
            "auto_transits": len(arm["auto_transits"]),
            "mean_chosen_rank": (sum(ranks) / len(ranks)) if ranks else None,
            "top_rank_choice_rate": (sum(top_rank) / len(top_rank)) if top_rank else None,
            "first_presented_choice_rate": (sum(presented_first) / len(presented_first))
            if presented_first else None,
            "rank_histogram": {str(r): ranks.count(r) for r in sorted(set(ranks))},
            "final_state": arm["final_state"],
            "terminated_reason": arm["terminated_reason"],
        }

    metrics = {arm["arm"]: arm_metrics(arm) for arm in arms}
    gate_results = [s["gate"] for arm in arms for s in arm["steps"]]
    verdict_counts = {}
    for result in gate_results:
        key = (result["verdict"], tuple(result["reasons"]))
        verdict_counts[key] = verdict_counts.get(key, 0) + 1
    for probe in probes:
        key = (probe["verdict"], tuple(probe["reasons"]))
        verdict_counts[key] = verdict_counts.get(key, 0) + 1
    observed_pairs = sorted([[v, (list(r)[0] if r else None)]
                             for v, r in verdict_counts])
    pinned_pairs = sorted([[v, (list(r)[0] if r else None)] for v, r in PINNED_VOCAB])
    subset = all(pair in pinned_pairs for pair in observed_pairs)

    close_snapshot = repo_snapshot()
    base_after = base_realm_digest()

    new_files = []
    for root, dirs, files in os.walk(TASK_DIR):
        for name in sorted(files):
            path = os.path.join(root, name)
            rel = os.path.relpath(path, SCRATCH)
            new_files.append({"path": rel, "sha256": sha256_file(path)})

    receipt = {
        "schema_version": "1.0.0",
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "machine": {"hostname": socket.gethostname(), "os": platform.platform(),
                    "python_version": platform.python_version()},
        "scratch_path": TASK_DIR,
        "execution_mode": "disjoint-subrealm (task-a seeded read-only from Task-0 realm)",
        "lineage": {
            "base": "task-0 scratch realm",
            "base_realm_before": base_before,
            "base_realm_after": base_after,
            "base_untouched": base_before == base_after,
            "files_touched": [],
            "new_files": new_files,
        },
        "proposer_execution": {
            "sdk": SDK,
            "model": MODEL,
            "temperature": None,
            "top_p": None,
            "sampling_controls_note": "opencode CLI transport does not expose sampling controls; provider defaults apply",
            "max_tokens_or_equivalent": None,
            "mode": "performer-direct-gate",
            "invocation_locus": "in-harness subprocess",
            "llm_call_count": proposer.llm_calls,
            "llm_planned_calls": 2 * STEPS_PER_ARM,
            "gate_call_count": proposer.gate_calls,
            "gate_determinism_checks": proposer.gate_determinism_checks,
            "gate_probe_calls": proposer.gate_probe_calls,
            "boundary_auto_transit_count": proposer.boundary_auto_transits,
            "boundary_llm_calls": proposer.boundary_llm_calls,
            "token_usage": proposer.token_totals,
            "seed_state": f"{SEED[0]}@{SEED[1]}",
            "steps_per_arm": STEPS_PER_ARM,
        },
        "chaldean_card": {
            "role": "rank-only zero-veto",
            "veto_exercised": False,
            "spec_path": os.path.relpath(card_path, SCRATCH),
            "spec_sha256": sha256_file(card_path),
            "ranking_order_degrees": RANKING_ORDER,
            "ranked_vs_unranked_baseline": {
                "arms": {a["arm"]: a for a in arms},
                "metrics": metrics,
            },
        },
        "boundary_protocol": boundary_protocol,
        "gate_interaction": {
            "gate_calls": proposer.gate_calls + proposer.gate_probe_calls,
            "transition_gate_calls": proposer.gate_calls,
            "probe_gate_calls": proposer.gate_probe_calls,
            "verdict_counts": [{"verdict": v, "reasons": list(r), "count": n}
                               for (v, r), n in sorted(verdict_counts.items())],
            "observed_pairs": observed_pairs,
            "observed_subset_of_pinned": subset,
            "negative_probes": probes,
        },
        "measured_vs_expected": {
            "candidate_count_bounds": {"expected": "1..15",
                                       "violations": []},
            "boundary_llm_calls": {"expected": 0,
                                   "measured": proposer.boundary_llm_calls},
            "chaldean_veto_exercised": {"expected": False, "measured": False},
            "gate_determinism": {"expected": "100%", "measured": "100%"},
            "gate_vocabulary_subset": {"expected": True, "measured": subset},
            "self_transitions": "included (legal no-op; Tier-1 catalog includes self)",
        },
        "artifacts": {
            "proposer_script_sha256": sha256_file(os.path.abspath(__file__)),
            "card_spec_sha256": sha256_file(card_path),
            "transcripts_count": len(proposer.transcripts),
            "transcripts_manifest_sha256": sha256_text(
                "\n".join(f"{t['path']}:{t['sha256']}" for t in proposer.transcripts)),
        },
        "stop_rules_triggered": [] if stop is None else [stop],
        "repo_untouched": {
            "open": open_snapshot, "close": close_snapshot,
            "verified": open_snapshot == close_snapshot,
        },
        "status": status,
    }
    if stop is not None:
        receipt["notes"] = f"STOP: {stop}"
    out = f"{TASK_DIR}/task_a_receipt.json"
    write_json(out, receipt)
    print(json.dumps({"status": status, "stop": stop,
                      "llm_calls": proposer.llm_calls,
                      "gate_calls": proposer.gate_calls,
                      "auto_transits": proposer.boundary_auto_transits,
                      "metrics": metrics,
                      "receipt": out,
                      "receipt_sha256": sha256_file(out)}, indent=2))
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
