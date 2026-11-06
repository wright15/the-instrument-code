#!/usr/bin/env python3
"""MVP6.2-DIR-1 Task D: legato WAV render, seam metric, rest breath, and the
pad-tail-aware FFT centroid bridge, with an A/B against the L24 control.

The MIDI surface is the pinned synthesis and must be byte-identical to L24.
"""
import hashlib
import json
import math
import sys
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp6_2")
OUT = SCRATCH / "task-d"
RENDERS = OUT / "renders"
TRACE_PATH = REPO / "tools/governed-loop/mvp6_1/task-c/traces/piece_a_far_shore_delooped.jsonl"
CONTROL_WAV = REPO / "tools/governed-loop/mvp6_1/task-d/renders/piece_a_far_shore_delooped.wav"
CONTROL_MIDI = REPO / "tools/governed-loop/mvp6_1/task-d/renders/piece_a_far_shore_delooped.mid"
PREDECL = SCRATCH / "task-0" / "mvp6_2_predeclared_legato.json"
CONTROL_WAV_SHA = "b2ce0b3f5ac39d0ac226083e5c2646a1d116222acc5473b746173a0d3125d7f1"
CONTROL_MIDI_SHA = "8a8c545ffbff1740921355b8538c599a66ccd93a98daa9d67e76e845734225f6"
EXEMPT = {33, 55}
SR = 44100

sys.path.insert(0, str(SCRATCH / "task-b"))
sys.path.insert(0, str(REPO / "tools/governed-loop/mvp5/task-b"))
sys.path.insert(0, str(REPO / "tools/governed-loop/mvp4/task-b"))
sys.path.insert(0, str(REPO / "tools/governed-loop/mvp6_1/task-d"))

import mvp5_audio_renderer as renderer  # noqa: E402
import mvp6_1_task_d as l24  # noqa: E402
from mvp6_2_legato_renderer import render_track_legato, SeamMeter  # noqa: E402
from mvp6_1_coupled_form_engine import DeloopFormEngine  # noqa: E402

GUARD = {
    "causationClaim": False, "physicalQuantityClaim": False,
    "tierClassifier": False, "globalCHNull": True,
    "gov517_correspondence_claimed": False, "still_set_label": "still_set",
    "layer": "SPEC-001 \u00a71.3 overlay dynamics",
}


def stop(rule, detail):
    print(f"STOP: {rule} {detail}")
    sys.exit(2)


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def pad_sustain_energy(attack, duration):
    steps = max(0, int(duration * 1000))
    total = 0.0
    for index in range(steps):
        t = index / 1000.0
        envelope = t / attack if t < attack else 1.0
        total += envelope * envelope / 1000.0
    return total / duration


def pad_tail_energy(release, duration):
    span = min(release, duration)
    steps = max(0, int(span * 1000))
    total = 0.0
    for index in range(steps):
        t = index / 1000.0
        envelope = max(0.0, 1.0 - t / release) if release > 0 else 0.0
        total += envelope * envelope / 1000.0
    return total / duration


def model_centroid_legato(bar, steps, palettes, office_lookup, previous_bar=None,
                          previous_steps=None):
    duration = bar["durationMs"] / 1000.0
    mask = int(bar["node"].split("@")[0])
    phase = int(bar["node"].split("@")[1])
    preset = palettes[office_lookup[mask]]
    offset = preset["registerOffset"]
    detune = 2.0 ** (preset["detuneCents"] / 1200.0)
    attack = preset["attackSeconds"]
    release = preset["releaseSeconds"]
    if bar["bar"] in EXEMPT:
        pad_energy = l24.pad_envelope_energy(attack, release, duration)
    else:
        pad_energy = pad_sustain_energy(attack, duration)
    pad_gain = preset["gain"] * 0.35
    voices = [(60 + pc + offset, pad_gain, pad_energy, preset["waveform"], detune)
              for pc in bar["pitchClasses"]]
    voices.append((60 + phase + offset - 12, pad_gain, pad_energy, preset["waveform"], detune))
    if previous_bar is not None and previous_bar["bar"] not in EXEMPT:
        pmask = int(previous_bar["node"].split("@")[0])
        pphase = int(previous_bar["node"].split("@")[1])
        ppreset = palettes[office_lookup[pmask]]
        poffset = ppreset["registerOffset"]
        pdetune = 2.0 ** (ppreset["detuneCents"] / 1200.0)
        tail_energy = pad_tail_energy(ppreset["releaseSeconds"], duration)
        p_gain = ppreset["gain"] * 0.35
        for pc in previous_bar["pitchClasses"]:
            voices.append((60 + pc + poffset, p_gain, tail_energy,
                           ppreset["waveform"], pdetune))
        voices.append((60 + pphase + poffset - 12, p_gain, tail_energy,
                       ppreset["waveform"], pdetune))
    for step in steps:
        lead_midi = 60 + step["emittedPc"] + max(0, offset) + 12
        emphasis = 1.0 if step["projectionMode"] == "direct_orbit_pc" else 0.8
        lead_start = step["sub"] * 0.3
        remain = max(0.0, min(duration - lead_start, release))
        energy = (l24.lead_envelope_energy(attack, release, 0.0, remain) / duration
                  if remain > 0 else 0.0)
        voices.append((lead_midi, preset["gain"] * emphasis, energy,
                       preset["waveform"], detune))
    if previous_bar is not None and previous_steps:
        pmask = int(previous_bar["node"].split("@")[0])
        ppreset = palettes[office_lookup[pmask]]
        poffset = ppreset["registerOffset"]
        pdetune = 2.0 ** (ppreset["detuneCents"] / 1200.0)
        gap = (bar["startMs"] - previous_bar["startMs"]) / 1000.0
        for step in previous_steps:
            midi = 60 + step["emittedPc"] + max(0, poffset) + 12
            emphasis = 1.0 if step["projectionMode"] == "direct_orbit_pc" else 0.8
            lead_start = step["sub"] * 0.3
            previous_release = ppreset["releaseSeconds"]
            elapsed = gap - lead_start
            if 0.0 <= elapsed < previous_release:
                remaining = previous_release - elapsed
                energy = l24.lead_envelope_energy(
                    ppreset["attackSeconds"], previous_release, elapsed, remaining) / duration
                voices.append((midi, ppreset["gain"] * emphasis, energy,
                               ppreset["waveform"], pdetune))
    numerator = 0.0
    denominator = 0.0
    for midi, gain, energy, waveform, det in voices:
        fundamental = l24.midi_frequency(midi) * det
        for index in range(1, l24.N_HARMONICS + 1):
            weight = l24.harmonic_power(waveform, index)
            if weight == 0.0:
                continue
            frequency = index * fundamental
            frequency = abs(((frequency + l24.SAMPLE_RATE / 2) % l24.SAMPLE_RATE)
                            - l24.SAMPLE_RATE / 2)
            if frequency <= 0.0 or frequency >= l24.SAMPLE_RATE / 2:
                continue
            power = weight * gain * gain * energy
            numerator += frequency * power
            denominator += power
    return numerator / denominator if denominator > 0.0 else 0.0


def direct_boundaries(trace):
    bars = trace["bars"]
    rows = []
    for index in range(1, len(bars)):
        bar_number = index + 1
        if bar_number == 34:
            continue
        rows.append({"bar": bar_number, "timeMs": bars[index]["startMs"],
                     "node": bars[index]["node"]})
    return rows


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    RENDERS.mkdir(parents=True, exist_ok=True)
    predecl = json.loads(PREDECL.read_text(encoding="utf-8"))
    if sha256_file(CONTROL_WAV) != CONTROL_WAV_SHA:
        stop("S-1", "control WAV drift")
    if sha256_file(CONTROL_MIDI) != CONTROL_MIDI_SHA:
        stop("S-1", "control MIDI drift")
    if sha256_file(TRACE_PATH) != predecl["control"]["traceSha256"]:
        stop("S-1", "control trace drift")

    engine = DeloopFormEngine()
    office_lookup = {mask: office for mask, office in engine.planner.office.items() if office}
    params = renderer.extract_audio_parameters(REPO / "orrery/src/audio.ts")
    if not params["constantsMatch"] or not params["allPalettesMatch"]:
        stop("S-2", "audio parameter mismatch")
    palettes = params["offices"]
    model_palettes = {
        office: {**preset,
                 "attackSeconds": float(preset["attackSeconds"]),
                 "releaseSeconds": float(preset["releaseSeconds"]),
                 "gain": float(preset["gain"])}
        for office, preset in palettes.items()
    }

    rendered = render_track_legato("piece_a_far_shore_delooped", TRACE_PATH, palettes,
                                   office_lookup, EXEMPT)
    if not rendered["reRenderMatch"]:
        stop("S-6", "two-pass render mismatch")
    if rendered["clippedSamples"] != 0 or rendered["nonFiniteSamples"] != 0:
        stop("S-6", "clipping/non-finite")
    if rendered["samples"] != rendered["expectedSamples"] or rendered["samples"] != 5411070:
        stop("S-6", f"sample count {rendered['samples']}")
    if rendered["durationMs"] != 122700:
        stop("S-6", "duration drift")
    if rendered["midiSha256"] != CONTROL_MIDI_SHA:
        stop("S-4", f"MIDI drift {rendered['midiSha256']}")
    audit = rendered["midiAudit"]
    if (audit["outOfMaskNotes"] != 0 or not audit["padContainerMatch"]
            or not audit["leadSequenceMatch"] or audit["expectedLeadNotes"] != 408
            or audit["expectedPadNoteOns"] != 440):
        stop("S-6", "MIDI audit")

    wav_path = RENDERS / "piece_a_far_shore_legato.wav"
    midi_path = RENDERS / "piece_a_far_shore_legato.mid"
    wav_path.write_bytes(rendered["wavBytes"])
    midi_path.write_bytes(rendered["midiBytes"])
    if sha256_file(wav_path) != rendered["wavSha256"]:
        stop("S-6", "wav write hash")
    if sha256_file(midi_path) != rendered["midiSha256"]:
        stop("S-6", "midi write hash")

    trace = renderer.load_trace(TRACE_PATH)
    boundaries = direct_boundaries(trace)
    legato_samples = l24.read_wav(wav_path)
    control_samples = l24.read_wav(CONTROL_WAV)
    legato_seams = SeamMeter(legato_samples).measure([row["timeMs"] for row in boundaries])
    control_seams = SeamMeter(control_samples).measure([row["timeMs"] for row in boundaries])
    if legato_seams["boundaries"] != predecl["expected"]["directBoundaries"]:
        stop("S-4", f"boundary count {legato_seams['boundaries']}")
    if legato_seams["medianDepthDb"] >= float(predecl["expected"]["medianDipMaxDb"]):
        stop("S-4", f"median dip {legato_seams['medianDepthDb']}")
    if legato_seams["maxDepthDb"] >= float(predecl["expected"]["maxDipMaxDb"]):
        stop("S-4", f"max dip {legato_seams['maxDepthDb']}")

    rest = trace["rests"][0]
    rest_start = rest["startMs"] * SR // 1000
    rest_end = rest_start + rest["durationMs"] * SR // 1000
    rest_window = legato_samples[rest_start:rest_end]
    control_rest_window = control_samples[rest_start:rest_end]
    rest_rms = math.sqrt(sum(v * v for v in rest_window) / len(rest_window)) if rest_window else 0.0
    control_rest_rms = (math.sqrt(sum(v * v for v in control_rest_window) / len(control_rest_window))
                        if control_rest_window else 0.0)
    voiced_rms = []
    for bar in trace["bars"]:
        start = bar["startMs"] * SR // 1000
        end = start + bar["durationMs"] * SR // 1000
        window = legato_samples[start:end]
        voiced_rms.append(math.sqrt(sum(v * v for v in window) / len(window)))
    mean_voiced_rms = sum(voiced_rms) / len(voiced_rms)
    rest_ratio = rest_rms / mean_voiced_rms if mean_voiced_rms else 0.0
    tail_window = legato_samples[max(rest_start, rest_end - 2205):rest_end]
    tail_rms = math.sqrt(sum(v * v for v in tail_window) / len(tail_window)) if tail_window else 0.0
    tail_ratio = tail_rms / mean_voiced_rms if mean_voiced_rms else 0.0
    if rest_ratio >= float(predecl["expected"]["restRmsRatioMax"]):
        stop("S-4", f"rest ratio {rest_ratio}")
    if tail_ratio >= float(predecl["expected"]["restTailRatioMax"]):
        stop("S-4", f"rest tail ratio {tail_ratio}")
    if rest_rms > control_rest_rms * 1.05:
        stop("S-4", f"pad tail crossed the rest {rest_rms} > {control_rest_rms}")

    hann = [0.5 - 0.5 * math.cos(2.0 * math.pi * i / (l24.FFT_SIZE - 1))
            for i in range(l24.FFT_SIZE)]
    measured = []
    model = []
    bar_rows = []
    bars = trace["bars"]
    for index, bar in enumerate(bars):
        start_sample = bar["startMs"] * SR // 1000
        duration_samples = bar["durationMs"] * SR // 1000
        mean_c, min_c, max_c = l24.bar_centroid(legato_samples, start_sample, duration_samples, hann)
        steps = [step for step in bar["micro"] if step["sub"] < 4096]
        previous_bar = bars[index - 1] if index > 0 else None
        previous_steps = ([step for step in previous_bar["micro"] if step["sub"] < 4096]
                          if previous_bar is not None else None)
        model_c = model_centroid_legato(bar, steps, model_palettes, office_lookup,
                                        previous_bar, previous_steps)
        measured.append(mean_c)
        model.append(model_c)
        bar_rows.append({
            "bar": bar["bar"], "node": bar["node"],
            "office": office_lookup[int(bar["node"].split("@")[0])],
            "phase": int(bar["node"].split("@")[1]),
            "startMs": bar["startMs"], "durationMs": bar["durationMs"],
            "containerPcSum": sum(bar["pitchClasses"]),
            "leadPcSum": sum(step["emittedPc"] for step in bar["micro"]),
            "centroidMeasuredHz": round(mean_c, 6),
            "centroidModelHz": round(model_c, 6),
            "centroidMinHz": round(min_c, 6),
            "centroidMaxHz": round(max_c, 6),
            "relativeError": round(abs(mean_c - model_c) / model_c, 9) if model_c else None,
        })

    corr_model = l24.pearson(measured, model)
    med_rel = sorted(row["relativeError"] for row in bar_rows)[len(bar_rows) // 2]
    max_rel = max(row["relativeError"] for row in bar_rows)
    if corr_model < float(predecl["expected"]["fftCorrelationMin"]):
        stop("S-6", f"model correlation {corr_model}")
    if med_rel >= float(predecl["expected"]["fftMedianRelErrMax"]):
        stop("S-6", f"median relative error {med_rel}")

    container = [row["containerPcSum"] for row in bar_rows]
    lead = [row["leadPcSum"] for row in bar_rows]
    corr_container = l24.pearson(measured, container)
    corr_lead = l24.pearson(measured, lead)
    office_means = {}
    for row in bar_rows:
        office_means.setdefault(row["office"], []).append(row["centroidMeasuredHz"])
    office_means = {office: sum(values) / len(values)
                    for office, values in office_means.items()}
    residual = [row["centroidMeasuredHz"] - office_means[row["office"]] for row in bar_rows]
    corr_container_resid = l24.pearson(residual, container)
    corr_lead_resid = l24.pearson(residual, lead)
    if corr_lead_resid <= corr_container_resid:
        stop("S-6", "deconfounded lead does not outperform container")

    section_of = {}
    for bar in engine.itinerary["bars"]:
        section_of.setdefault(bar["sectionKey"], []).append(bar["bar"])
    section_means = {}
    for key, indices in section_of.items():
        values = [bar_rows[index - 1]["centroidMeasuredHz"] for index in indices]
        section_means[key] = round(sum(values) / len(values), 6)
    if section_means["climax"] <= section_means["first_dwell"]:
        stop("S-6", "climax centroid not above quiet")

    different_windows = []
    for bar in bars:
        start = bar["startMs"] * SR // 1000
        end = start + bar["durationMs"] * SR // 1000
        if legato_samples[start:end] != control_samples[start:end]:
            different_windows.append(bar["bar"])

    receipt = {
        "schemaVersion": "governed-loop.mvp6_2-task-d.v1",
        "directive": "MVP6.2-DIR-1",
        "task": "MVP6_2-TD",
        "status": "COMPLETE",
        "predeclaration": {"path": str(PREDECL), "sha256": sha256_file(PREDECL)},
        "trace": {"path": str(TRACE_PATH), "sha256": sha256_file(TRACE_PATH)},
        "render": {
            "wav": {"path": str(wav_path), "sha256": rendered["wavSha256"],
                    "bytes": wav_path.stat().st_size, "samples": rendered["samples"]},
            "midi": {"path": str(midi_path), "sha256": rendered["midiSha256"],
                     "bytes": midi_path.stat().st_size,
                     "format": audit["format"], "chunks": audit["trackChunks"],
                     "division": audit["division"]},
            "reRenderMatch": rendered["reRenderMatch"],
            "clippedSamples": rendered["clippedSamples"],
            "nonFiniteSamples": rendered["nonFiniteSamples"],
            "rmsMilli": rendered["rmsMilli"],
            "peakQ15": rendered["peakQ15"],
            "durationMs": rendered["durationMs"],
            "midiIdenticalToControl": rendered["midiSha256"] == CONTROL_MIDI_SHA,
            "midiAudit": {
                "padNoteOns": audit["padNoteOns"], "leadNoteOns": audit["leadNoteOns"],
                "outOfMaskNotes": audit["outOfMaskNotes"],
                "padContainerMatch": audit["padContainerMatch"],
                "leadSequenceMatch": audit["leadSequenceMatch"],
            },
        },
        "seams": {
            "method": predecl["seamBaseline"]["method"],
            "boundaries": legato_seams["boundaries"],
            "controlMedianDb": control_seams["medianDepthDb"],
            "controlMaxDb": control_seams["maxDepthDb"],
            "legatoMedianDb": legato_seams["medianDepthDb"],
            "legatoMaxDb": legato_seams["maxDepthDb"],
            "medianGateDb": float(predecl["expected"]["medianDipMaxDb"]),
            "maxGateDb": float(predecl["expected"]["maxDipMaxDb"]),
            "passed": True,
            "rows": legato_seams["rows"],
        },
        "restBreath": {
            "restRms": round(rest_rms, 6),
            "controlRestRms": round(control_rest_rms, 6),
            "restRmsRatio": round(rest_ratio, 9),
            "tailRmsRatio": round(tail_ratio, 9),
            "padTailCrossedRest": rest_rms > control_rest_rms * 1.05,
            "scheduledOscillators": rest.get("oscillators", 0),
        },
        "fft": {
            "barsMeasured": len(bar_rows),
            "correlationMeasuredVsModel": round(corr_model, 9),
            "medianRelativeError": round(med_rel, 9),
            "maxRelativeError": round(max_rel, 9),
            "correlationMeasuredVsContainerPcSum": round(corr_container, 9),
            "correlationMeasuredVsLeadPcSum": round(corr_lead, 9),
            "officeDeconfoundedCorrelationContainer": round(corr_container_resid, 9),
            "officeDeconfoundedCorrelationLead": round(corr_lead_resid, 9),
            "leadCarriesTheContour": corr_lead_resid > corr_container_resid,
            "sectionCentroidMeansHz": section_means,
        },
        "ab": {
            "controlWavSha256": CONTROL_WAV_SHA,
            "controlMidiSha256": CONTROL_MIDI_SHA,
            "differentWindows": different_windows,
            "sameWindows": len(bars) - len(different_windows),
            "midiIdentical": True,
        },
        "bars": bar_rows,
        "guardFlags": GUARD,
        "llmCalls": 0,
        "stopRules": [],
    }
    (OUT / "mvp6_2_task_d_receipt.json").write_text(
        json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "COMPLETE",
        "wavSha256": rendered["wavSha256"],
        "midiSha256": rendered["midiSha256"],
        "samples": rendered["samples"],
        "seamControlMedian": control_seams["medianDepthDb"],
        "seamControlMax": control_seams["maxDepthDb"],
        "seamLegatoMedian": legato_seams["medianDepthDb"],
        "seamLegatoMax": legato_seams["maxDepthDb"],
        "restRatio": round(rest_ratio, 6),
        "fftCorr": round(corr_model, 6),
        "fftMedianErr": round(med_rel, 6),
        "changedWindows": len(different_windows),
    }, indent=2))


if __name__ == "__main__":
    main()
