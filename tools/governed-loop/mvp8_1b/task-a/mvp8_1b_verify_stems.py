#!/usr/bin/env python3
"""MVP8.1b-DIR-1 Task A: verify the 24 pinned stems by hash and format. No
rendering, no new audio."""
import json
import sys
import wave
from pathlib import Path

MVP8 = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_pentatonic_q")
MVP81 = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_1_stem")
ROOT = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_1b_metric_fix")
sys.path.insert(0, str(MVP8))
import mvp8_common as common

TASK_A = ROOT / "task-a"
RECEIPT = TASK_A / "mvp8_1b_task_a_receipt.json"
T0_RECEIPT = ROOT / "task-0/mvp8_1b_task_0_receipt.json"
PREDECL = ROOT / "task-0/mvp8_1b_predeclared_bets.json"
STEMS = MVP81 / "task-a/stems"


def wav_format(path):
    with wave.open(str(path), "rb") as handle:
        return {
            "channels": handle.getnchannels(),
            "sampleWidth": handle.getsampwidth(),
            "sampleRate": handle.getframerate(),
            "frames": handle.getnframes(),
        }


def main():
    TASK_A.mkdir(parents=True, exist_ok=True)
    predecl = json.loads(PREDECL.read_text(encoding="utf-8"))
    t0 = json.loads(T0_RECEIPT.read_text(encoding="utf-8"))
    rows = []
    integrity = []
    for row in t0["stems"]:
        label = row["label"]
        lead_path = STEMS / f"{label}-lead.wav"
        pad_path = STEMS / f"{label}-pad.wav"
        lead_format = wav_format(lead_path)
        pad_format = wav_format(pad_path)
        lead_hash = common.sha256_file(lead_path)
        pad_hash = common.sha256_file(pad_path)
        format_ok = (
            lead_format["channels"] == 1 and lead_format["sampleWidth"] == 2
            and lead_format["sampleRate"] == 44100
            and pad_format["channels"] == 1 and pad_format["sampleWidth"] == 2
            and pad_format["sampleRate"] == 44100
            and lead_format["frames"] == pad_format["frames"]
        )
        hash_ok = lead_hash == row["leadSha256"] and pad_hash == row["padSha256"]
        rows.append({
            "label": label,
            "tracePath": row["tracePath"],
            "bars": row["bars"],
            "officeCount": row["officeCount"],
            "scored": row["scored"],
            "reason": row["reason"],
            "lead": {
                "path": f"task-a/stems/{label}-lead.wav",
                "sha256": lead_hash,
                "expectedSha256": row["leadSha256"],
                "format": lead_format,
            },
            "pad": {
                "path": f"task-a/stems/{label}-pad.wav",
                "sha256": pad_hash,
                "expectedSha256": row["padSha256"],
                "format": pad_format,
            },
            "hashOk": hash_ok,
            "formatOk": format_ok,
        })
        integrity.append({
            "label": label,
            "hashOk": hash_ok,
            "formatOk": format_ok,
            "pass": hash_ok and format_ok,
        })
    scored = [row for row in rows if row["scored"]]
    excluded = [row for row in rows if not row["scored"]]
    if len(scored) != len(predecl["scoredStems"]) or len(excluded) != len(predecl["excludedStems"]):
        common.stop("S-5", "scored/excluded set drift")
    receipt = {
        "schemaVersion": "governed-loop.mvp8_1b-task-a.v1",
        "directive": "MVP8.1b-DIR-1",
        "task": "MVP8.1b-TA",
        "status": "COMPLETE",
        "guardFlags": common.GUARD,
        "predeclarationSha256": common.sha256_file(PREDECL),
        "t0ReceiptSha256": common.sha256_file(T0_RECEIPT),
        "stems": rows,
        "stemCount": len(rows),
        "scoredStems": [row["label"] for row in scored],
        "excludedStems": [{"label": row["label"], "reason": row["reason"]}
                          for row in excluded],
        "integrity": integrity,
        "pass": all(row["pass"] for row in integrity),
        "llmCalls": 0,
        "stopRules": [],
    }
    symbolic = {key: value for key, value in receipt.items() if key != "guardFlags"}
    receipt["floatValuesSymbolic"] = len(common.find_floats(symbolic))
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "COMPLETE",
        "stems": len(rows),
        "pass": receipt["pass"],
        "scored": receipt["scoredStems"],
        "excluded": [row["label"] for row in receipt["excludedStems"]],
        "floatValuesSymbolic": receipt["floatValuesSymbolic"],
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
