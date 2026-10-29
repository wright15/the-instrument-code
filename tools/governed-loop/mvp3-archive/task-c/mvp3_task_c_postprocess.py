#!/usr/bin/env python3
import datetime, hashlib, json, os
TASK = "/home/erick/workspace/scratch-governed-loop-run/task-c"
RECEIPT = f"{TASK}/task_c_receipt.json"

def sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()

r = json.load(open(RECEIPT, encoding="utf-8"))
probe = r["probe_mode_avoidance"]
probe.pop("energy_coefficient_joules_per_token", None)
probe.pop("estimated_joules_saved", None)
r["energy"]["fields_omitted"] = [
    "probe_mode_avoidance.energy_coefficient_joules_per_token",
    "probe_mode_avoidance.estimated_joules_saved",
]
# Exact integer projection from the B1 aggregate (accepted + rejected = transitions).
b1 = json.load(open("/home/erick/workspace/scratch-governed-loop-run/task-b1/task_b1_receipt.json",
                    encoding="utf-8"))["calibration"]["aggregate"]
proj = r["performer_mode_avoidance"]["corpus_scale_projection"]
proj["baseline_decodes"] = b1["transitions"]
proj["decodes_saved"] = b1["rejected"]
r["artifacts"]["postprocess_script_sha256"] = sha(os.path.abspath(__file__))
r["generated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
with open(RECEIPT, "w", encoding="utf-8") as f:
    json.dump(r, f, indent=2, sort_keys=True)
    f.write("\n")
print(json.dumps({"status": r["status"], "receipt_sha256": sha(RECEIPT),
                  "projection": proj, "energy": r["energy"]}, indent=2))
