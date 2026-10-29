#!/usr/bin/env python3
import datetime
import hashlib
import json
import os

TASK_DIR = "/home/erick/workspace/scratch-governed-loop-run/mvp4/task-a"
SCRATCH = "/home/erick/workspace/scratch-governed-loop-run/mvp4"
RECEIPT = f"{TASK_DIR}/mvp4_task_a_receipt.json"
AGGREGATE = f"{SCRATCH}/l20_runner_staging_manifest.json"


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def trajectory(arm):
    steps = arm["steps"]
    out = [steps[0]["source"]] if steps else []
    out.extend(step["target"] for step in steps)
    return out


def llm_counts(arm):
    choices = [step for step in arm["steps"] if step["kind"] == "llm-choice"]
    accepted = [step for step in choices if step["gate"]["verdict"] == "ACCEPT"]
    return len(choices), len(accepted)


receipt = json.load(open(RECEIPT, encoding="utf-8"))
arms = receipt["arms"]

arm1_traj = trajectory(arms["unranked-baseline"])
arm2_traj = trajectory(arms["chaldean-static"])
arm3_traj = trajectory(arms["dynamic-context"])

arm1_expected = ["1387@0", "1383@0"]
arm2_expected = ["1387@0", "875@0", "1259@0", "1383@0", "1387@0"]
arm2_states = sorted({state for state in arm2_traj})
arm2_expected_states = sorted(set(arm2_expected))
arm1_prefix = arm1_traj[:4]
arm2_prefix = arm2_traj[:5]

baseline = {
    "arm1": {
        "expectedCycle": arm1_expected,
        "observedPrefix": arm1_prefix,
        "observedTrajectory": arm1_traj,
        "exactCycleReproduced": all(arm1_traj[i] == arm1_expected[i % 2] for i in range(len(arm1_traj))),
        "distinctStates": len(set(arm1_traj)),
    },
    "arm2": {
        "expectedCycle": arm2_expected,
        "observedPrefix": arm2_prefix,
        "observedTrajectory": arm2_traj,
        "observedStateSet": arm2_states,
        "expectedStateSet": arm2_expected_states,
        "stateSetReproduced": arm2_states == arm2_expected_states,
        "exactCycleReproduced": arm2_prefix == arm2_expected[:len(arm2_prefix)],
        "distinctStates": len(set(arm2_traj)),
        "note": "The static arm visited exactly the four MVP-3 baseline states but model choices produced a different visitation order (two-state sub-cycle 875@0 <-> 1259@0 after a 1387@0 -> 1383@0 opening) instead of the exact 1387@0 -> 875@0 -> 1259@0 -> 1383@0 -> 1387@0 cycle.",
    },
    "arm3": {
        "observedTrajectory": arm3_traj,
        "distinctStates": len(set(arm3_traj)),
        "distinctFamilies": receipt["metrics"]["dynamic-context"]["distinct_families_visited"],
        "seamsTaken": receipt["metrics"]["dynamic-context"]["seam_transitions_accepted"],
    },
}
receipt["baselineReproduction"] = baseline

for name, arm in arms.items():
    decisions, accepted = llm_counts(arm)
    metrics = receipt["metrics"][name]
    metrics["llm_decisions"] = decisions
    metrics["llm_gate_accept_count"] = accepted
    metrics["llm_gate_accept_rate"] = f"{accepted}/{decisions}"
    metrics["llm_gate_accept_bp"] = (accepted * 10000 // decisions) if decisions else 0
    metrics["gate_accept_count_including_auto"] = metrics["gate_accept_count"]
    metrics["gate_accept_rate_including_auto"] = metrics["gate_accept_rate"]

dynamic_decisions, dynamic_accepted = llm_counts(arms["dynamic-context"])
receipt["successCriterion"]["llmGateAccept20of20"] = (
    dynamic_decisions == 20 and dynamic_accepted == 20)
receipt["successCriterion"]["successRuleEvaluation"] = {
    "arm3StrictlyMoreStatesThanArm1": receipt["metrics"]["dynamic-context"]["distinct_states_visited"]
    > receipt["metrics"]["unranked-baseline"]["distinct_states_visited"],
    "arm3StrictlyMoreStatesThanArm2": receipt["metrics"]["dynamic-context"]["distinct_states_visited"]
    > receipt["metrics"]["chaldean-static"]["distinct_states_visited"],
    "arm3StrictlyMoreFamiliesThanArm1": receipt["metrics"]["dynamic-context"]["distinct_families_visited"]
    > receipt["metrics"]["unranked-baseline"]["distinct_families_visited"],
    "arm3StrictlyMoreFamiliesThanArm2": receipt["metrics"]["dynamic-context"]["distinct_families_visited"]
    > receipt["metrics"]["chaldean-static"]["distinct_families_visited"],
    "arm3FamiliesAtLeast2": receipt["metrics"]["dynamic-context"]["distinct_families_visited"] >= 2,
    "arm3SeamsAtLeast1": receipt["metrics"]["dynamic-context"]["seam_transitions_accepted"] >= 1,
    "arm3LlmGateAccept20of20": dynamic_decisions == 20 and dynamic_accepted == 20,
    "arm3ZeroRepairs": receipt["metrics"]["dynamic-context"]["repair_calls"] == 0,
    "arm3CardGateInputsZero": receipt["metrics"]["dynamic-context"]["card_gate_inputs"] == 0,
    "arm3CardOutputAffectsGateFalse": receipt["metrics"]["dynamic-context"]["card_output_affects_gate"] is False,
}

run1_receipt = f"{TASK_DIR}/mvp4_task_a_receipt_run1_promptdev.json"
run1_dir = f"{TASK_DIR}/transcripts_run1_promptdev"
run1_files = []
if os.path.isdir(run1_dir):
    for name in sorted(os.listdir(run1_dir)):
        path = os.path.join(run1_dir, name)
        if os.path.isfile(path):
            run1_files.append({"path": path, "sha256": sha256_file(path)})
receipt["runHistory"] = {
    "formalRun": "run2_corrected_static_prompt",
    "archivedRun1": {
        "reason": "Static-arm prompt initially omitted chaldean_m5 and target_degree fields used by MVP-3 Task A; run archived as prompt-development evidence, not the formal result.",
        "receipt": {"path": run1_receipt, "sha256": sha256_file(run1_receipt)},
        "transcriptCount": len(run1_files),
        "transcriptsManifestSha256": hashlib.sha256(
            "\n".join(f"{row['path']}:{row['sha256']}" for row in run1_files).encode("utf-8")
        ).hexdigest(),
    },
}

postprocess_path = os.path.abspath(__file__)
postprocess_sha = sha256_file(postprocess_path)
receipt["artifacts"]["postprocessPath"] = postprocess_path
receipt["artifacts"]["postprocessSha256"] = postprocess_sha
receipt["generatedAt"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

aggregate = json.load(open(AGGREGATE, encoding="utf-8"))
entries = [row for row in aggregate["entries"] if row.get("role") != "mvp4_task_a_postprocess"]
entries.append({"path": postprocess_path, "sha256": postprocess_sha,
                "role": "mvp4_task_a_postprocess", "kind": "mvp4_runner", "verified": True})
aggregate["entries"] = entries
aggregate["verified"] = sum(1 for row in entries if row.get("verified"))
aggregate["total"] = len(entries)
with open(AGGREGATE, "w", encoding="utf-8") as handle:
    json.dump(aggregate, handle, indent=2, sort_keys=True)
    handle.write("\n")
receipt["staging"]["aggregateManifestSha256"] = sha256_file(AGGREGATE)
receipt["staging"]["aggregateVerified"] = aggregate["verified"]
receipt["staging"]["aggregateTotal"] = aggregate["total"]

with open(RECEIPT, "w", encoding="utf-8") as handle:
    json.dump(receipt, handle, indent=2, sort_keys=True)
    handle.write("\n")

print(json.dumps({
    "status": receipt["status"],
    "stopRulesTriggered": receipt["stopRulesTriggered"],
    "success": receipt["successCriterion"]["met"],
    "baseline": baseline,
    "llmGate": {name: [receipt["metrics"][name]["llm_gate_accept_count"],
                       receipt["metrics"][name]["llm_decisions"]] for name in arms},
    "receiptSha256": sha256_file(RECEIPT),
    "aggregateSha256": receipt["staging"]["aggregateManifestSha256"],
    "run1Transcripts": len(run1_files),
}, indent=2, sort_keys=True))
