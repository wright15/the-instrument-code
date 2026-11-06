#!/usr/bin/env python3
"""MVP6.3-DIR-1 Task B: end-cut stem isolation.

Renders full-piece pad-only and lead-only stems under the L25 legato pad law
and proves the file-end cut comes from lead truncation, not the pad.
"""
import hashlib
import json
import math
import sys
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp6_3")
OUT = SCRATCH / "task-b"
TRACE = REPO / "tools/governed-loop/mvp6_1/task-c/traces/piece_a_far_shore_delooped.jsonl"
CONTROL_WAV = REPO / "tools/governed-loop/mvp6_2/task-d/renders/piece_a_far_shore_legato.wav"
PREDECL = SCRATCH / "task-0" / "mvp6_3_predeclared_fade.json"
sys.path.insert(0, str(OUT))
sys.path.insert(0, str(REPO / "tools/governed-loop/mvp5/task-b"))
sys.path.insert(0, str(REPO / "tools/governed-loop/mvp4/task-b"))
sys.path.insert(0, str(REPO / "tools/governed-loop/mvp6/task-b"))

import mvp5_audio_renderer as renderer
from mvp6_3_fade_renderer import render_stems, decode_wav
from mvp6_coupled_form_engine import FormEngine

GUARD = {
    "causationClaim": False, "physicalQuantityClaim": False,
    "tierClassifier": False, "globalCHNull": True,
    "gov517_correspondence_claimed": False, "still_set_label": "still_set",
    "layer": "SPEC-001 \u00a71.3 overlay dynamics",
}


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def max_abs_last(samples, count=32):
    return max(abs(value) for value in samples[-count:])


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "renders").mkdir(parents=True, exist_ok=True)
    predecl = json.loads(PREDECL.read_text(encoding="utf-8"))
    if sha256_file(CONTROL_WAV) != predecl["control"]["wavSha256"]:
        raise SystemExit("STOP: S-1 control WAV drift")
    if sha256_file(TRACE) != predecl["control"]["traceSha256"]:
        raise SystemExit("STOP: S-1 control trace drift")

    engine = FormEngine()
    office_lookup = {mask: office for mask, office in engine.planner.office.items() if office}
    params = renderer.extract_audio_parameters(REPO / "orrery/src/audio.ts")
    if not params["allPalettesMatch"] or not params["constantsMatch"]:
        raise SystemExit("STOP: S-2 audio parameter mismatch")
    palettes = params["offices"]

    stems = render_stems(TRACE, palettes, office_lookup, {33, 55})
    if not stems["reRenderMatch"]:
        raise SystemExit("STOP: S-6 stem determinism")
    pad_path = OUT / "renders" / "stem_pad_only.wav"
    lead_path = OUT / "renders" / "stem_lead_only.wav"
    pad_path.write_bytes(stems["pad"]["wavBytes"])
    lead_path.write_bytes(stems["lead"]["wavBytes"])

    _, pad_samples = decode_wav(stems["pad"]["wavBytes"])
    _, lead_samples = decode_wav(stems["lead"]["wavBytes"])
    _, control_samples = decode_wav(CONTROL_WAV.read_bytes())
    if not (len(pad_samples) == len(lead_samples) == len(control_samples)):
        raise SystemExit("STOP: S-4 stem length mismatch")

    pad_end = max_abs_last(pad_samples)
    lead_end = max_abs_last(lead_samples)
    control_end = max_abs_last(control_samples)
    if pad_end >= predecl["stemPrediction"]["padMaxAbsLast32Max"]:
        raise SystemExit(f"STOP: S-4 pad stem does not end at zero ({pad_end})")
    if lead_end <= predecl["stemPrediction"]["leadMinAbsLast32"]:
        raise SystemExit(f"STOP: S-4 lead stem unexpectedly silent at the end ({lead_end})")

    tolerance = predecl["stemPrediction"]["sumToleranceLsb"]
    max_difference = 0
    difference_locations = []
    for index, (pad, lead, control) in enumerate(zip(pad_samples, lead_samples, control_samples)):
        difference = abs(pad + lead - control)
        if difference > max_difference:
            max_difference = difference
        if difference > tolerance and len(difference_locations) < 8:
            difference_locations.append({"sample": index, "difference": difference})
    if max_difference > tolerance:
        raise SystemExit(f"STOP: S-4 stem sum drift {max_difference}")
    if control_end < 100:
        raise SystemExit("STOP: S-4 control end cut not reproduced")

    receipt = {
        "schemaVersion": "governed-loop.mvp6_3-task-b.v1",
        "directive": "MVP6.3-DIR-1",
        "task": "MVP6_3-TB",
        "status": "COMPLETE",
        "predeclaration": {"path": str(PREDECL), "sha256": sha256_file(PREDECL)},
        "stems": {
            "pad": {"path": str(pad_path), "sha256": sha256_file(pad_path),
                    "bytes": pad_path.stat().st_size, "samples": len(pad_samples),
                    "maxAbsLast32": pad_end, "endsAtZero": pad_end < 10},
            "lead": {"path": str(lead_path), "sha256": sha256_file(lead_path),
                     "bytes": lead_path.stat().st_size, "samples": len(lead_samples),
                     "maxAbsLast32": lead_end, "endsAtZero": lead_end < 10},
        },
        "control": {"path": str(CONTROL_WAV), "sha256": sha256_file(CONTROL_WAV),
                    "maxAbsLast32": control_end},
        "isolation": {
            "padEndsClean": True,
            "leadCarriesTheCut": True,
            "sumToleranceLsb": tolerance,
            "sumMaxDifferenceLsb": max_difference,
            "sumMatchesControl": max_difference <= tolerance,
            "differenceLocations": difference_locations,
        },
        "reRenderMatch": stems["reRenderMatch"],
        "guardFlags": GUARD,
        "llmCalls": 0,
        "floatValues": 0,
        "stopRules": [],
    }
    (OUT / "mvp6_3_task_b_receipt.json").write_text(
        json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "COMPLETE",
        "padMaxAbsLast32": pad_end,
        "leadMaxAbsLast32": lead_end,
        "controlMaxAbsLast32": control_end,
        "sumMaxDifferenceLsb": max_difference,
        "padSha256": receipt["stems"]["pad"]["sha256"],
        "leadSha256": receipt["stems"]["lead"]["sha256"],
    }, indent=2))


if __name__ == "__main__":
    main()
