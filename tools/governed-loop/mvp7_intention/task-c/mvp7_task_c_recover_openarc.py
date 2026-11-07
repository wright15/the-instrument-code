#!/usr/bin/env python3
"""Recovery pass for the open-arc C2 arm.

The locked open-arc task text deterministically triggers the provider content
filter in the C2 preamble (three identical ContentFilterError runs). This pass
re-runs only that arm with a semantically equivalent, provider-safe paraphrase
and merges the rows into the Task C receipt. No thresholds change.
"""
import importlib.util
import json
import sys
from pathlib import Path

SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp7_intention")
TASK_C = SCRATCH / "task-c"
RECEIPT = TASK_C / "mvp7_task_c_receipt.json"
PREDECL = SCRATCH / "task-0" / "mvp7_predeclared_bets_and_schema.json"
PARAPHRASE = ("Compose a 7-section arc that opens at home, leaves through a quiet "
              "passage, and rises to a peak. Choose the ending freely: return home, "
              "end elsewhere, or remain interior. State the ending choice.")


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, str(path))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    tc = load_module("mvp7_tc", TASK_C / "mvp7_task_c.py")
    receipt = json.loads(RECEIPT.read_text(encoding="utf-8"))
    predecl = json.loads(PREDECL.read_text(encoding="utf-8"))
    llm = predecl["llm"]
    model = llm["model"]
    timeout = int(llm["timeoutSeconds"])
    max_retries = int(llm["maxRetries"])
    ctx = tc.context()
    menu = tc.menu_for(ctx, "open_arc")

    receipt["runs"] = [row for row in receipt["runs"]
                       if not (row["arm"] == "C2" and row["prompt"] == "open_arc")]
    added_calls = 0
    added_cost = 0.0
    added_latency = 0.0
    added_tokens = {"input": 0, "output": 0, "total": 0}

    for trial in (1, 2):
        label = f"open_arc_C2_t{trial}"
        attempt_rows = []
        compiled = None
        first_pass = None
        error = None
        for attempt in range(1, max_retries + 1):
            prompt = tc.c2_prompt("open_arc", PARAPHRASE, menu)
            if attempt > 1:
                prompt += ("\n\nYour previous answer failed with "
                           + json.dumps(error, sort_keys=True)
                           + ". Return only the required JSON object.")
            parsed, transcript = tc.call_llm(
                prompt, f"{label}_a{attempt}", model, timeout)
            added_calls += 1
            added_cost += transcript["cost"]
            added_latency += transcript["elapsedSeconds"]
            for key in added_tokens:
                added_tokens[key] += transcript["tokens"][key]
            if (not isinstance(parsed, dict)
                    or not isinstance(parsed.get("sectionChoices"), list)
                    or len(parsed["sectionChoices"]) != len(menu)):
                error = {"code": "SCHEMA_OR_FENCE_VIOLATION",
                         "errors": ["bad sectionChoices"]}
                attempt_rows.append({"attempt": attempt, "ok": False,
                                     "error": error,
                                     "transcript": transcript["path"],
                                     "tokens": transcript["tokens"],
                                     "cost": transcript["cost"],
                                     "elapsedSeconds": transcript["elapsedSeconds"],
                                     "parsed": parsed})
                continue
            resolved = []
            valid = True
            for section_index, choice in enumerate(parsed["sectionChoices"]):
                options = menu[section_index]["options"]
                if not isinstance(choice, int) or not 0 <= choice < len(options):
                    valid = False
                    break
                resolved.append(options[choice]["node"])
            if not valid:
                error = {"code": "SCHEMA_OR_FENCE_VIOLATION",
                         "errors": ["choice index out of range"]}
                attempt_rows.append({"attempt": attempt, "ok": False,
                                     "error": error,
                                     "transcript": transcript["path"],
                                     "tokens": transcript["tokens"],
                                     "cost": transcript["cost"],
                                     "elapsedSeconds": transcript["elapsedSeconds"],
                                     "parsed": parsed})
                continue
            intent = {
                "pieceId": parsed.get("pieceId", "mvp7_open_arc_C2"),
                "destinationPhilosophy": "interior_circuit",
                "seedNode": "1387@0",
                "sectionIntentions": [{
                    "section": index + 1,
                    "name": row["name"],
                    "role": row["role"],
                    "targetDispersionClass": None,
                    "targetOrbitFilter": [],
                    "phaseZone": [0, 11],
                    "registerBand": None,
                    "requiredPitchClasses": [],
                    "dwellBars": row["defaultDwellBars"],
                    "kSteps": row["defaultKSteps"],
                } for index, row in enumerate(menu)],
            }
            compiled, error = tc.compile_intention(
                ctx, intent, "c2_menu", resolved_nodes=resolved)
            if first_pass is None:
                first_pass = compiled is not None
            attempt_rows.append({"attempt": attempt, "ok": compiled is not None,
                                 "error": error, "transcript": transcript["path"],
                                 "tokens": transcript["tokens"],
                                 "cost": transcript["cost"],
                                 "elapsedSeconds": transcript["elapsedSeconds"],
                                 "parsed": parsed})
            if compiled is not None:
                break
        row = {"label": label, "prompt": "open_arc", "arm": "C2",
               "trial": trial, "attempts": attempt_rows,
               "firstPass": first_pass, "compiled": compiled is not None,
               "finalError": error if compiled is None else None}
        if compiled is not None:
            trace = compiled["trace"]
            trace_path = tc.TRACES / f"{label}.jsonl"
            trace_hash = ctx["form_engine_module"].FormEngine.write_trace(
                ctx["engine"], trace_path, trace)
            (TASK_C / f"{label}_trace.json").write_text(
                json.dumps(trace, indent=2, sort_keys=True) + "\n", encoding="utf-8")
            plan_path = TASK_C / f"{label}_plan.json"
            plan_path.write_text(json.dumps({
                "label": label, "intent": compiled["intent"],
                "chosen": compiled["chosen"], "legs": compiled["legs"],
                "events": compiled["events"],
                "tracePath": f"task-c/traces/{label}.jsonl",
                "traceSha256": trace_hash,
                "summary": trace["summary"],
                "divergence": tc.divergence(ctx, compiled),
                "textAudit": {attempt["attempt"]: tc.audit_text(
                    json.loads((SCRATCH / attempt["transcript"]).read_text(
                        encoding="utf-8"))["text"]) for attempt in attempt_rows},
            }, indent=2, sort_keys=True) + "\n", encoding="utf-8")
            row["tracePath"] = f"task-c/traces/{label}.jsonl"
            row["traceSha256"] = trace_hash
            row["planPath"] = f"task-c/{label}_plan.json"
            row["divergence"] = tc.divergence(ctx, compiled)
            row["summary"] = trace["summary"]
        receipt["runs"].append(row)

    # ---- recompute aggregates ----
    runs = receipt["runs"]
    legality = [{"label": row["label"], "arm": row["arm"], "prompt": row["prompt"],
                 "firstPass": row["firstPass"], "compiled": row["compiled"],
                 "attempts": len(row["attempts"]), "finalError": row["finalError"]}
                for row in runs]
    first_pass_rate = {arm: (sum(1 for row in legality if row["arm"] == arm and row["firstPass"])
                             / max(1, sum(1 for row in legality if row["arm"] == arm)))
                       for arm in ("C1", "C2")}
    compile_rate = {arm: (sum(1 for row in legality if row["arm"] == arm and row["compiled"])
                          / max(1, sum(1 for row in legality if row["arm"] == arm)))
                    for arm in ("C1", "C2")}
    retry_recovery = {}
    for arm in ("C1", "C2"):
        failures = [row for row in legality if row["arm"] == arm and not row["firstPass"]]
        recovered = [row for row in failures if row["compiled"]]
        retry_recovery[arm] = len(recovered) / len(failures) if failures else None
    accepted = [row for row in runs if row["compiled"]]
    divergence_rows = [{"label": row["label"], "arm": row["arm"], "prompt": row["prompt"],
                        "score": row["divergence"]["score"],
                        "dimensions": row["divergence"]["dimensions"]}
                       for row in accepted]
    divergence_mean = (sum(row["score"] for row in divergence_rows) / len(divergence_rows)
                       if divergence_rows else None)

    def dimension_map(dimension):
        rows = accepted
        if not rows:
            return {"classification": "NO_DATA", "divergenceRate": None, "legality": None}
        diverged = sum(1 for row in rows
                       if row["divergence"]["dimensions"].get(dimension, 0) > 0.0)
        rate = diverged / len(rows)
        arm_rows = [row for row in rows if row["arm"] == "C1"]
        legality_rate = (sum(1 for row in arm_rows if row["firstPass"]) / len(arm_rows)
                         if arm_rows else None)
        if rate < 0.10:
            classification = "KEEP_PLANNER_DEFAULT"
        elif legality_rate is not None and legality_rate >= 0.90:
            classification = "DELEGATE_TO_LLM"
        else:
            classification = "REQUIRE_VERIFIED_MENU"
        return {"classification": classification, "divergenceRate": rate,
                "legality": legality_rate, "trials": len(rows)}

    receipt["legality"] = {"firstPassRate": first_pass_rate,
                           "compileRate": compile_rate,
                           "retryRecovery": retry_recovery, "rows": legality}
    receipt["divergence"] = {"meanScore": divergence_mean, "rows": divergence_rows}
    receipt["judgmentMap"] = {
        "destinationPhilosophy": dimension_map("destination"),
        "sectionCount": dimension_map("sectionCount"),
        "dwellPlacement": dimension_map("dwellPhases"),
        "orbitSelection": dimension_map("orbits"),
        "pitchClassConstraints": dimension_map("pitchClassConstraints"),
        "registerBands": dimension_map("dispersionClasses"),
    }
    open_c1 = [row for row in accepted if row["prompt"] == "open_arc" and row["arm"] == "C1"]
    c1_open_proposals = []
    for row in runs:
        if row["prompt"] != "open_arc" or row["arm"] != "C1":
            continue
        for attempt in row["attempts"]:
            parsed = attempt.get("parsed") or {}
            c1_open_proposals.append({
                "label": row["label"], "attempt": attempt["attempt"],
                "ok": attempt.get("ok"),
                "destinationPhilosophy": parsed.get("destinationPhilosophy"),
                "sectionCount": len(parsed.get("sectionIntentions", [])) if isinstance(parsed.get("sectionIntentions"), list) else None,
            })
    fm1 = bool(open_c1) and all(row["divergence"]["plan"]["sectionCount"] == 7
                                for row in open_c1)
    fm2 = None
    c1_accepted = [row for row in accepted if row["arm"] == "C1"]
    if c1_accepted:
        fm2 = all(any(section.get("targetDispersionClass") == "EXTREME_RAMP"
                      for section in json.loads((SCRATCH / row["planPath"]).read_text(
                          encoding="utf-8"))["intent"]["sectionIntentions"])
                  for row in c1_accepted)
    fm3 = bool(open_c1) and all(row["divergence"]["plan"]["destinationPhilosophy"]
                                == "far_shore_return" for row in open_c1)
    fm4_hits = []
    for row in runs:
        for attempt in row["attempts"]:
            if attempt.get("transcript"):
                transcript = json.loads((SCRATCH / attempt["transcript"]).read_text(
                    encoding="utf-8"))
                for hit in tc.audit_text(transcript.get("text", "")):
                    fm4_hits.append({"label": row["label"],
                                     "attempt": attempt["attempt"], "hit": hit})
    receipt["failureModes"] = {
        "FM1_GENERIC_ARC_BIAS": fm1,
        "FM2_CLIMAX_BY_DEFAULT": fm2,
        "FM3_HOME_ALWAYS": fm3,
        "FM4_VOCABULARY_DRIFT": len(fm4_hits) > 0,
        "FM4_hits": fm4_hits[:20],
        "openArcC1ProposalDestinations": c1_open_proposals,
        "note": "FM1/FM3 have no accepted C1 open-arc trial; the proposal-level destinations are reported as a diagnostic",
    }
    cost = receipt["cost"]
    cost["calls"] += added_calls
    cost["cost"] += added_cost
    cost["latencySeconds"] += added_latency
    for key in added_tokens:
        cost[key] += added_tokens[key]
    receipt["llmCalls"] = cost["calls"]
    receipt.setdefault("transportCorrections", []).append({
        "arm": "C2 open_arc",
        "issue": "the locked task text deterministically triggers the provider content filter in the C2 preamble (3/3 ContentFilterError, zero output)",
        "action": "re-ran the two open-arc C2 trials with a semantically equivalent provider-safe paraphrase",
        "lockedTask": llm["prompts"]["open_arc"],
        "paraphrase": PARAPHRASE,
        "thresholdsChanged": False,
        "recoveryCalls": added_calls,
        "recoveryCost": added_cost,
    })
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "recoveryCalls": added_calls,
        "recoveryCost": added_cost,
        "firstPassRate": first_pass_rate,
        "compileRate": compile_rate,
        "divergenceMean": divergence_mean,
        "accepted": len(accepted),
        "labels": [row["label"] for row in accepted],
        "fm": {k: v for k, v in receipt["failureModes"].items()
               if k not in ("FM4_hits", "openArcC1ProposalDestinations")},
        "openArcDestinations": c1_open_proposals,
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
