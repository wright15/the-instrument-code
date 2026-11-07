#!/usr/bin/env python3
"""MVP8.1-DIR-1 Task A: render lead-only and pad-only stems for the 12 frozen
MVP8 traces using the pinned fade/legato renderer. Read-only against the repo."""
import importlib.util
import json
import sys
import wave
from pathlib import Path

sys.path.insert(0, "/home/erick/workspace/scratch-governed-loop-run/mvp8_pentatonic_q")
import mvp8_common as common

TASK_A = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_1_stem/task-a")
STEMS = TASK_A / "stems"
RECEIPT = TASK_A / "mvp8_1_task_a_receipt.json"
PREDECL = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_1_stem/task-0/mvp8_1_predeclared_bets.json")
MVP8 = common.SCRATCH


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, str(path))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


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
    STEMS.mkdir(parents=True, exist_ok=True)
    predecl = json.loads(PREDECL.read_text(encoding="utf-8"))
    if predecl.get("status") != "locked-before-evaluation":
        common.stop("S-9", "predeclaration not locked")
    renderer = load_module("mvp81_renderer", common.REPO_INPUTS["fade_renderer"])
    palettes = renderer.base.extract_audio_parameters(
        common.REPO / "orrery/src/audio.ts")["offices"]
    planner = common.build_planner()
    office_lookup = {mask: office for mask, office in planner.office.items() if office}

    rows = []
    integrity = []
    for rel in predecl["traces"]:
        trace_path = MVP8 / rel
        trace = renderer.base.load_trace(trace_path)
        exempt = {len(trace["bars"])}
        stems = renderer.render_stems(trace_path, palettes, office_lookup, exempt)
        label = Path(rel).stem
        lead_path = STEMS / f"{label}-lead.wav"
        pad_path = STEMS / f"{label}-pad.wav"
        lead_path.write_bytes(stems["lead"]["wavBytes"])
        pad_path.write_bytes(stems["pad"]["wavBytes"])
        lead_format = wav_format(lead_path)
        pad_format = wav_format(pad_path)
        format_ok = (
            lead_format["channels"] == 1 and lead_format["sampleWidth"] == 2
            and lead_format["sampleRate"] == 44100
            and pad_format["channels"] == 1 and pad_format["sampleWidth"] == 2
            and pad_format["sampleRate"] == 44100
            and lead_format["frames"] == pad_format["frames"]
        )
        row = {
            "label": label,
            "tracePath": rel,
            "traceSha256": common.sha256_file(trace_path),
            "barCount": len(trace["bars"]),
            "samples": stems["samples"],
            "reRenderMatch": stems["reRenderMatch"],
            "lead": {
                "path": f"task-a/stems/{label}-lead.wav",
                "sha256": common.sha256_file(lead_path),
                "rmsMilli": stems["lead"]["rmsMilli"],
                "clippedSamples": stems["lead"]["clippedSamples"],
                "nonFiniteSamples": stems["lead"]["nonFiniteSamples"],
                "format": lead_format,
                "formatOk": format_ok,
            },
            "pad": {
                "path": f"task-a/stems/{label}-pad.wav",
                "sha256": common.sha256_file(pad_path),
                "rmsMilli": stems["pad"]["rmsMilli"],
                "clippedSamples": stems["pad"]["clippedSamples"],
                "nonFiniteSamples": stems["pad"]["nonFiniteSamples"],
                "format": pad_format,
                "formatOk": format_ok,
            },
        }
        rows.append(row)
        integrity.append({
            "label": label,
            "reRenderMatch": stems["reRenderMatch"],
            "formatOk": format_ok,
            "leadClipped": stems["lead"]["clippedSamples"],
            "padClipped": stems["pad"]["clippedSamples"],
            "leadNonFinite": stems["lead"]["nonFiniteSamples"],
            "padNonFinite": stems["pad"]["nonFiniteSamples"],
            "pass": (stems["reRenderMatch"] and format_ok
                     and stems["lead"]["clippedSamples"] == 0
                     and stems["pad"]["clippedSamples"] == 0
                     and stems["lead"]["nonFiniteSamples"] == 0
                     and stems["pad"]["nonFiniteSamples"] == 0),
        })

    receipt = {
        "schemaVersion": "governed-loop.mvp8_1-task-a.v1",
        "directive": "MVP8.1-DIR-1",
        "task": "MVP8.1-TA",
        "status": "COMPLETE",
        "guardFlags": common.GUARD,
        "predeclarationSha256": common.sha256_file(
            Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_1_stem/task-0/mvp8_1_predeclared_bets.json")),
        "stems": rows,
        "stemCount": len(rows),
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
        "integrity": {row["label"]: row["pass"] for row in integrity},
        "floatValuesSymbolic": receipt["floatValuesSymbolic"],
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
