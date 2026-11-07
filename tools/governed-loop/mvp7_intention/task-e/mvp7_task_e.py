#!/usr/bin/env python3
"""MVP7-INTENTION-DIR-1 Task E: protocol and closing-report registration, plus
the task receipt. The ear gate is recorded as unsigned by construction.
"""
import hashlib
import json
from pathlib import Path

SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp7_intention")
TASK_E = SCRATCH / "task-e"
PROTOCOL = TASK_E / "EAR_VALIDATION_PROTOCOL_MVP7.md"
REPORT = SCRATCH / "MVP7-INTENTION-CLOSING-REPORT.md"
RECEIPT = TASK_E / "mvp7_task_e_receipt.json"
RECEIPTS = {
    "T0": SCRATCH / "task-0/mvp7_task_0_receipt.json",
    "TA": SCRATCH / "task-a/mvp7_task_a_receipt.json",
    "TB": SCRATCH / "task-b/mvp7_task_b_receipt.json",
    "TC": SCRATCH / "task-c/mvp7_task_c_receipt.json",
    "TD": SCRATCH / "task-d/mvp7_task_d_receipt.json",
}
GUARD = {
    "causationClaim": False, "physicalQuantityClaim": False,
    "tierClassifier": False, "globalCHNull": True,
    "gov517_correspondence_claimed": False, "still_set_label": "still_set",
    "layer": "SPEC-001 \u00a71.3 overlay dynamics",
}


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    rows = {}
    for key, path in RECEIPTS.items():
        receipt = json.loads(path.read_text(encoding="utf-8"))
        rows[key] = {
            "path": path.name,
            "sha256": sha256_file(path),
            "status": receipt.get("status"),
            "task": receipt.get("task"),
        }
    receipt = {
        "schemaVersion": "governed-loop.mvp7-task-e.v1",
        "directive": "MVP7-INTENTION-DIR-1",
        "task": "MVP7-TE",
        "status": "COMPLETE",
        "guardFlags": GUARD,
        "taskReceipts": rows,
        "protocol": {"path": PROTOCOL.name, "sha256": sha256_file(PROTOCOL)},
        "closingReport": {"path": REPORT.name, "sha256": sha256_file(REPORT)},
        "earGate": {"status": "PENDING_HUMAN", "signed": False,
                    "scorecard": "task-0/ear_baseline_scorecard.json",
                    "blindManifest": "task-d/blind_manifest.json"},
        "llmCalls": 0,
        "stopRules": [],
    }
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"status": "COMPLETE", "receipts": rows,
                      "protocolSha256": receipt["protocol"]["sha256"],
                      "reportSha256": receipt["closingReport"]["sha256"],
                      "earGate": "PENDING_HUMAN"}, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
