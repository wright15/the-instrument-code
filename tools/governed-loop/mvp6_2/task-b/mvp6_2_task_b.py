#!/usr/bin/env python3
"""MVP6.2-DIR-1 Task B: legato terminal-arrival check.

Renders the 2-bar voiced terminal control with the pinned renderer and with the
legato renderer, and measures the arrival-boundary dip in both. The legato WAV
is a landing payload.
"""
import hashlib
import json
import struct
import sys
import wave
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp6_2")
OUT = SCRATCH / "task-b"
CONTROL_TRACE = Path("/home/erick/workspace/scratch-governed-loop-run/mvp6_1/task-b/traces/control_voiced_terminal.jsonl")
sys.path.insert(0, str(OUT))
sys.path.insert(0, str(REPO / "tools/governed-loop/mvp5/task-b"))
sys.path.insert(0, str(REPO / "tools/governed-loop/mvp4/task-b"))

import mvp5_audio_renderer as base
from mvp6_2_legato_renderer import (SeamMeter, render_track_legato, SAMPLE_RATE)

GUARD = {
    "causationClaim": False, "physicalQuantityClaim": False,
    "tierClassifier": False, "globalCHNull": True,
    "gov517_correspondence_claimed": False, "still_set_label": "still_set",
    "layer": "SPEC-001 \u00a71.3 overlay dynamics",
}

L24_VOICED_TRACE = "2a6343ece3395bc6e8b52b06b1bbfba7578cb68ba70ac87788a7f59ebd056eed"


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def load_samples(path):
    with wave.open(str(path), "rb") as handle:
        frames = handle.readframes(handle.getnframes())
    return struct.unpack("<%dh" % (len(frames) // 2), frames)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "renders").mkdir(parents=True, exist_ok=True)
    if not CONTROL_TRACE.exists():
        raise SystemExit(f"STOP: S-1 missing control trace {CONTROL_TRACE}")
    if sha256_file(CONTROL_TRACE) != L24_VOICED_TRACE:
        raise SystemExit("STOP: S-1 control trace drift")

    sys.path.insert(0, str(REPO / "tools/governed-loop/mvp6/task-b"))
    from mvp6_coupled_form_engine import FormEngine
    engine = FormEngine()
    office_lookup = {mask: office for mask, office in engine.planner.office.items() if office}
    params = base.extract_audio_parameters(REPO / "orrery/src/audio.ts")
    if not params["allPalettesMatch"] or not params["constantsMatch"]:
        raise SystemExit("STOP: S-2 audio parameter mismatch")
    palettes = params["offices"]

    pinned = base.render_track("control_voiced_terminal", CONTROL_TRACE, palettes, office_lookup)
    legato = render_track_legato("control_voiced_terminal", CONTROL_TRACE, palettes,
                                 office_lookup, exempt_bars={2})

    pinned_wav = OUT / "renders" / "control_voiced_terminal_pinned.wav"
    legato_wav = OUT / "renders" / "control_voiced_terminal_legato.wav"
    pinned_wav.write_bytes(pinned["wavBytes"])
    legato_wav.write_bytes(legato["wavBytes"])

    if not legato["reRenderMatch"] or legato["clippedSamples"] != 0 or legato["nonFiniteSamples"] != 0:
        raise SystemExit("STOP: S-6 legato control render integrity")
    if legato["midiSha256"] != pinned["midiSha256"]:
        raise SystemExit("STOP: S-4 control MIDI drift")

    boundary_ms = 1500
    pinned_depth = SeamMeter(load_samples(pinned_wav)).depth_db(boundary_ms)
    legato_depth = SeamMeter(load_samples(legato_wav)).depth_db(boundary_ms)
    if legato_depth >= pinned_depth:
        raise SystemExit(f"STOP: S-4 arrival dip not reduced {legato_depth} >= {pinned_depth}")

    receipt = {
        "schemaVersion": "governed-loop.mvp6_2-task-b.v1",
        "directive": "MVP6.2-DIR-1",
        "task": "MVP6_2-TB",
        "status": "COMPLETE",
        "controlTrace": {"path": str(CONTROL_TRACE), "sha256": sha256_file(CONTROL_TRACE)},
        "renders": {
            "pinned": {"path": str(pinned_wav), "sha256": pinned["wavSha256"],
                       "midiSha256": pinned["midiSha256"], "samples": pinned["samples"]},
            "legato": {"path": str(legato_wav), "sha256": legato["wavSha256"],
                       "midiSha256": legato["midiSha256"], "samples": legato["samples"],
                       "bytes": legato_wav.stat().st_size},
        },
        "arrivalBoundary": {
            "timeMs": boundary_ms,
            "pinnedDepthDb": round(pinned_depth, 6),
            "legatoDepthDb": round(legato_depth, 6),
            "reducedDb": round(pinned_depth - legato_depth, 6),
            "reduced": True,
        },
        "midiIdentical": True,
        "renderIntegrity": {"reRenderMatch": legato["reRenderMatch"],
                            "clippedSamples": legato["clippedSamples"],
                            "nonFiniteSamples": legato["nonFiniteSamples"]},
        "guardFlags": GUARD,
        "llmCalls": 0,
        "floatValues": 0,
        "stopRules": [],
    }
    (OUT / "mvp6_2_task_b_receipt.json").write_text(
        json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "COMPLETE",
        "pinnedDepthDb": round(pinned_depth, 6),
        "legatoDepthDb": round(legato_depth, 6),
        "reducedDb": round(pinned_depth - legato_depth, 6),
        "legatoWavSha256": legato["wavSha256"],
        "midiIdentical": True,
    }, indent=2))


if __name__ == "__main__":
    main()
