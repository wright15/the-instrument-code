#!/usr/bin/env python3
"""MVP6-DIR-1 Task D: deterministic WAV/MIDI render and the acoustic centroid
bridge across all 55 voiced bars plus the boundary rest.

Modality 2: continuous quantities are external boundary-conditioned
measurements carrying the four registered guard flags. Symbolic quantities are
read from the Task C trace, never recomputed in floating point.
"""
import cmath
import hashlib
import json
import math
import struct
import sys
import wave
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp6_1")
OUT = SCRATCH / "task-d"
RENDERS = OUT / "renders"
TRACE_PATH = SCRATCH / "task-c" / "traces" / "piece_a_far_shore_delooped.jsonl"
CONTROL_WAV = REPO / "tools/governed-loop/mvp6/task-d/renders/piece_a_far_shore.wav"
CONTROL_MIDI = REPO / "tools/governed-loop/mvp6/task-d/renders/piece_a_far_shore.mid"
CONTROL_WAV_SHA = "e5c8bf2b0e31f32d36a8816e6011f09e10b26cce5b94c4782aefd28406567a77"
CONTROL_MIDI_SHA = "d44f543b64deb0e6703b9c5906f8c78400015379a8aa166cbc07856be09ec0bb"
sys.path.insert(0, str(REPO / "tools/governed-loop/mvp5/task-b"))
sys.path.insert(0, str(REPO / "tools/governed-loop/mvp4/task-b"))
sys.path.insert(0, str(SCRATCH / "task-b"))

import mvp5_audio_renderer as renderer  # noqa: E402
from mvp6_1_coupled_form_engine import DeloopFormEngine as FormEngine, GUARD  # noqa: E402

SAMPLE_RATE = 44100
FFT_SIZE = 2048
FRAMES_PER_BAR = 16
N_HARMONICS = 2000
AUDIO_TS = REPO / "orrery/src/audio.ts"
AUDIO_TS_SHA = "e863b845c8f2709a0fe0e6fe706dce603e795b760c6561d110d240ddb1dfca88"

_twiddle = {}


def stop(rule, detail):
    print(f"STOP: {rule} {detail}")
    sys.exit(2)


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def fft(values):
    n = len(values)
    data = list(values)
    j = 0
    for i in range(1, n):
        bit = n >> 1
        while j & bit:
            j ^= bit
            bit >>= 1
        j ^= bit
        if i < j:
            data[i], data[j] = data[j], data[i]
    length = 2
    while length <= n:
        if length not in _twiddle:
            angle = -2.0 * math.pi / length
            _twiddle[length] = (complex(math.cos(angle), math.sin(angle)), length // 2)
        wlen, half = _twiddle[length]
        for start in range(0, n, length):
            w = 1.0 + 0.0j
            for k in range(start, start + half):
                u = data[k]
                v = data[k + half] * w
                data[k] = u + v
                data[k + half] = u - v
                w *= wlen
        length <<= 1
    return data


def fft_self_test():
    sine = [math.sin(2.0 * math.pi * 440.0 * i / SAMPLE_RATE) for i in range(FFT_SIZE)]
    spectrum = fft(sine)
    peak = max(range(1, FFT_SIZE // 2), key=lambda k: abs(spectrum[k]))
    if peak != round(440.0 * FFT_SIZE / SAMPLE_RATE):
        stop("S-6", f"440 Hz peak bin {peak}")
    return {"fftSize": FFT_SIZE, "peakBin440Hz": peak,
            "frequencyResolutionHz": SAMPLE_RATE / FFT_SIZE,
            "framesPerBar": FRAMES_PER_BAR}


def read_wav(path):
    with wave.open(str(path), "rb") as handle:
        if handle.getframerate() != SAMPLE_RATE:
            stop("S-6", f"sample rate {handle.getframerate()}")
        if handle.getnchannels() != 1 or handle.getsampwidth() != 2:
            stop("S-6", "format drift")
        frames = handle.readframes(handle.getnframes())
    return struct.unpack("<%dh" % (len(frames) // 2), frames)


def frame_centroid_power(samples, start, hann):
    window = samples[start:start + FFT_SIZE]
    if len(window) < FFT_SIZE:
        window = list(window) + [0] * (FFT_SIZE - len(window))
    spectrum = fft([window[i] * hann[i] for i in range(FFT_SIZE)])
    numerator = 0.0
    denominator = 0.0
    for k in range(1, FFT_SIZE // 2):
        power = abs(spectrum[k]) ** 2
        if power == 0.0:
            continue
        frequency = k * SAMPLE_RATE / FFT_SIZE
        numerator += frequency * power
        denominator += power
    return (numerator / denominator if denominator > 0.0 else 0.0), denominator


def bar_centroid(samples, start_sample, duration_samples, hann):
    span = max(1, duration_samples - FFT_SIZE)
    starts = [start_sample + (i * span) // max(1, FRAMES_PER_BAR - 1)
              for i in range(FRAMES_PER_BAR)]
    frames = [frame_centroid_power(samples, s, hann) for s in starts]
    total_power = sum(power for _, power in frames)
    values = [value for value, _ in frames if value > 0.0]
    if total_power == 0.0 or not values:
        return 0.0, 0.0, 0.0
    mean = sum(value * power for value, power in frames) / total_power
    return mean, min(values), max(values)


def midi_frequency(midi_note):
    return 440.0 * 2.0 ** ((midi_note - 69) / 12.0)


def harmonic_power(kind, index):
    if kind == "sine":
        return 1.0 if index == 1 else 0.0
    if kind == "triangle":
        return (1.0 / (index * index)) ** 2 if index % 2 == 1 else 0.0
    if kind == "square":
        return (1.0 / index) ** 2 if index % 2 == 1 else 0.0
    if kind == "sawtooth":
        return (1.0 / index) ** 2
    stop("S-6", f"unknown waveform {kind}")


def envelope_energy(attack, release, start_offset, span):
    steps = max(0, int(span * 1000))
    total = 0.0
    for index in range(steps):
        t = start_offset + index / 1000.0
        if t < attack:
            envelope = t / attack if attack > 0 else 1.0
        elif t < release:
            envelope = max(0.0, 1.0 - (t - attack) / (release - attack)) if release > attack else 0.0
        else:
            envelope = 0.0
        total += envelope * envelope / 1000.0
    return total


def pad_envelope_energy(attack, release, duration):
    release_start = max(attack, duration - release)
    total = 0.0
    for index in range(int(duration * 1000)):
        t = index / 1000.0
        if t < attack:
            envelope = t / attack if attack > 0 else 1.0
        elif t < release_start:
            envelope = 1.0
        else:
            span = duration - release_start
            envelope = max(0.0, 1.0 - (t - release_start) / span) if span > 0 else 0.0
        total += envelope * envelope / 1000.0
    return total / duration


def lead_envelope_energy(attack, release, start_offset, span):
    steps = max(0, int(span * 1000))
    total = 0.0
    for index in range(steps):
        t = start_offset + index / 1000.0
        if t < attack:
            envelope = t / attack if attack > 0 else 1.0
        else:
            envelope = max(0.0, 1.0 - (t - attack) / (release - attack)) if release > attack else 0.0
        total += envelope * envelope / 1000.0
    return total


def model_centroid(bar, steps, palettes, office_lookup,
                   previous_bar=None, previous_steps=None):
    duration = bar["durationMs"] / 1000.0
    mask = int(bar["node"].split("@")[0])
    phase = int(bar["node"].split("@")[1])
    preset = palettes[office_lookup[mask]]
    offset = preset["registerOffset"]
    detune = 2.0 ** (preset["detuneCents"] / 1200.0)
    pad_energy = pad_envelope_energy(preset["attackSeconds"],
                                     preset["releaseSeconds"], duration)
    voices = [(60 + pc + offset, preset["gain"] * 0.35, pad_energy)
              for pc in bar["pitchClasses"]]
    voices.append((60 + phase + offset - 12, preset["gain"] * 0.35, pad_energy))
    for step in steps:
        lead_midi = 60 + step["emittedPc"] + max(0, offset) + 12
        emphasis = 1.0 if step["projectionMode"] == "direct_orbit_pc" else 0.8
        lead_start = step["sub"] * 0.3
        remain = max(0.0, min(duration - lead_start, preset["releaseSeconds"]))
        energy = (lead_envelope_energy(preset["attackSeconds"], preset["releaseSeconds"],
                                       0.0, remain) / duration) if remain > 0 else 0.0
        voices.append((lead_midi, preset["gain"] * emphasis, energy))
    if previous_bar is not None and previous_steps:
        previous_office = office_lookup[int(previous_bar["node"].split("@")[0])]
        previous_preset = palettes[previous_office]
        previous_offset = previous_preset["registerOffset"]
        previous_detune = 2.0 ** (previous_preset["detuneCents"] / 1200.0)
        gap = (bar["startMs"] - previous_bar["startMs"]) / 1000.0
        for step in previous_steps:
            midi = 60 + step["emittedPc"] + max(0, previous_offset) + 12
            emphasis = 1.0 if step["projectionMode"] == "direct_orbit_pc" else 0.8
            lead_start = step["sub"] * 0.3
            release = previous_preset["releaseSeconds"]
            elapsed = gap - lead_start
            if 0.0 <= elapsed < release:
                remaining = release - elapsed
                energy = lead_envelope_energy(
                    previous_preset["attackSeconds"], release, elapsed,
                    remaining) / duration
                voices.append((midi, previous_preset["gain"] * emphasis, energy,
                               previous_preset["waveform"], previous_detune))
    normalised = []
    for voice in voices:
        if len(voice) == 3:
            normalised.append((voice[0], voice[1], voice[2], preset["waveform"], detune))
        else:
            normalised.append(tuple(voice))
    voices = normalised
    numerator = 0.0
    denominator = 0.0
    for midi, gain, energy, waveform, det in voices:
        fundamental = midi_frequency(midi) * det
        for index in range(1, N_HARMONICS + 1):
            weight = harmonic_power(waveform, index)
            if weight == 0.0:
                continue
            frequency = index * fundamental
            frequency = abs(((frequency + SAMPLE_RATE / 2) % SAMPLE_RATE) - SAMPLE_RATE / 2)
            if frequency <= 0.0 or frequency >= SAMPLE_RATE / 2:
                continue
            power = weight * gain * gain * energy
            numerator += frequency * power
            denominator += power
    return numerator / denominator if denominator > 0.0 else 0.0


def pearson(xs, ys):
    n = len(xs)
    mx = sum(xs) / n
    my = sum(ys) / n
    cov = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    vx = sum((x - mx) ** 2 for x in xs)
    vy = sum((y - my) ** 2 for y in ys)
    if vx == 0.0 or vy == 0.0:
        return 0.0
    return cov / math.sqrt(vx * vy)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    RENDERS.mkdir(parents=True, exist_ok=True)
    if sha256_file(AUDIO_TS) != AUDIO_TS_SHA:
        stop("S-2", "audio.ts drift")

    fft_info = fft_self_test()
    engine = FormEngine()
    office_lookup = {mask: office for mask, office in engine.planner.office.items()
                     if office}
    params = renderer.extract_audio_parameters(AUDIO_TS)
    if not params["constantsMatch"] or not params["allPalettesMatch"]:
        stop("S-6", "audio parameter extraction mismatch")
    palettes = params["offices"]
    model_palettes = {
        office: {**preset, "attackSeconds": float(preset["attackSeconds"]),
                 "releaseSeconds": float(preset["releaseSeconds"]),
                 "gain": float(preset["gain"])}
        for office, preset in palettes.items()
    }

    rendered = renderer.render_track("piece_a_far_shore_delooped", TRACE_PATH, palettes, office_lookup)
    if not rendered["reRenderMatch"]:
        stop("S-6", "two-pass render mismatch")
    if not rendered["nonSilent"]:
        stop("S-6", "silent render")
    if rendered["clippedSamples"] != 0 or rendered["nonFiniteSamples"] != 0:
        stop("S-6", "clipping/non-finite")
    if rendered["samples"] != rendered["expectedSamples"]:
        stop("S-6", "sample count mismatch")
    if rendered["expectedSamples"] != 5411070:
        stop("S-6", f"expected samples {rendered['expectedSamples']}")
    if rendered["durationMs"] != 122700:
        stop("S-6", f"render duration {rendered['durationMs']}")
    audit = rendered["midiAudit"]
    if audit["outOfMaskNotes"] != 0:
        stop("S-6", "MIDI container leak")
    if not audit["padContainerMatch"] or not audit["leadSequenceMatch"]:
        stop("S-6", "MIDI audit mismatch")
    if audit["expectedLeadNotes"] != 408 or audit["leadNoteOns"] != 408:
        stop("S-6", "lead note census")
    if audit["expectedPadNoteOns"] != 440 or audit["padNoteOns"] != 440:
        stop("S-6", "pad note census")

    wav_path = RENDERS / "piece_a_far_shore_delooped.wav"
    midi_path = RENDERS / "piece_a_far_shore_delooped.mid"
    wav_path.write_bytes(rendered["wavBytes"])
    midi_path.write_bytes(rendered["midiBytes"])
    if sha256_file(wav_path) != rendered["wavSha256"]:
        stop("S-6", "wav write hash mismatch")
    if sha256_file(midi_path) != rendered["midiSha256"]:
        stop("S-6", "midi write hash mismatch")

    trace = json.loads(json.dumps(renderer.load_trace(TRACE_PATH)))
    bars = trace["bars"]
    if len(bars) != 55:
        stop("S-6", f"trace bars {len(bars)}")
    samples = read_wav(wav_path)
    hann = [0.5 - 0.5 * math.cos(2.0 * math.pi * i / (FFT_SIZE - 1))
            for i in range(FFT_SIZE)]

    measured = []
    model = []
    bar_rows = []
    for bar in bars:
        start_sample = bar["startMs"] * SAMPLE_RATE // 1000
        duration_samples = bar["durationMs"] * SAMPLE_RATE // 1000
        mean_c, min_c, max_c = bar_centroid(samples, start_sample, duration_samples, hann)
        steps = [step for step in bar["micro"] if step["sub"] < 4096]
        previous_bar = bars[bar["bar"] - 2] if bar["bar"] > 1 else None
        previous_steps = ([step for step in previous_bar["micro"] if step["sub"] < 4096]
                          if previous_bar is not None else None)
        model_c = model_centroid(bar, steps, model_palettes, office_lookup,
                                 previous_bar, previous_steps)
        measured.append(mean_c)
        model.append(model_c)
        bar_rows.append({
            "bar": bar["bar"],
            "node": bar["node"],
            "office": office_lookup[int(bar["node"].split("@")[0])],
            "phase": int(bar["node"].split("@")[1]),
            "startMs": bar["startMs"],
            "durationMs": bar["durationMs"],
            "containerPcSum": sum(bar["pitchClasses"]),
            "leadPcSum": sum(step["emittedPc"] for step in bar["micro"]),
            "centroidMeasuredHz": round(mean_c, 6),
            "centroidModelHz": round(model_c, 6),
            "centroidMinHz": round(min_c, 6),
            "centroidMaxHz": round(max_c, 6),
            "relativeError": round(abs(mean_c - model_c) / model_c, 9) if model_c else None,
        })

    # ---- A/B against the frozen L23 control -------------------------------
    if sha256_file(CONTROL_WAV) != CONTROL_WAV_SHA:
        stop("S-6", "control WAV drift")
    if sha256_file(CONTROL_MIDI) != CONTROL_MIDI_SHA:
        stop("S-6", "control MIDI drift")
    control_samples = read_wav(CONTROL_WAV)
    if len(control_samples) != len(samples):
        stop("S-6", "control sample count mismatch")
    expected_changed = [16, 17, 23, 24, 25, 33, 34, 53, 54, 55]
    different_windows = []
    for bar in bars:
        start = bar["startMs"] * SAMPLE_RATE // 1000
        end = start + bar["durationMs"] * SAMPLE_RATE // 1000
        if samples[start:end] != control_samples[start:end]:
            different_windows.append(bar["bar"])
    successors = {bar + 1 for bar in expected_changed if bar + 1 <= 55}
    if not set(expected_changed).issubset(set(different_windows)):
        stop("S-6", f"changed bars not audible: {different_windows}")
    if not set(different_windows).issubset(set(expected_changed) | successors):
        stop("S-6", f"unexpected audio change: {different_windows}")
    tail_only = []
    for bar_number in sorted(set(different_windows) & successors - set(expected_changed)):
        bar = bars[bar_number - 1]
        start = bar["startMs"] * SAMPLE_RATE // 1000
        end = start + bar["durationMs"] * SAMPLE_RATE // 1000
        split = start + SAMPLE_RATE // 2
        tail_only.append({
            "bar": bar_number,
            "headDiffers": samples[start:split] != control_samples[start:split],
            "after500msIdentical": samples[split:end] == control_samples[split:end],
        })
    ab = {
        "controlWavSha256": CONTROL_WAV_SHA,
        "controlMidiSha256": CONTROL_MIDI_SHA,
        "controlFrozen": True,
        "differentWindows": different_windows,
        "changedBars": expected_changed,
        "sameWindows": 55 - len(different_windows),
        "successorTailOnly": tail_only,
    }

    rest = trace["rests"][0]
    rest_start = rest["startMs"] * SAMPLE_RATE // 1000
    rest_end = rest_start + rest["durationMs"] * SAMPLE_RATE // 1000
    rest_window = samples[rest_start:rest_end]
    rest_rms = math.sqrt(sum(v * v for v in rest_window) / len(rest_window)) if rest_window else 0.0
    voiced_rms = []
    for bar in bars:
        s = bar["startMs"] * SAMPLE_RATE // 1000
        e = s + bar["durationMs"] * SAMPLE_RATE // 1000
        window = samples[s:e]
        voiced_rms.append(math.sqrt(sum(v * v for v in window) / len(window)))
    mean_voiced_rms = sum(voiced_rms) / len(voiced_rms)
    rest_ratio = rest_rms / mean_voiced_rms if mean_voiced_rms else 0.0
    # The 300 ms rest schedules zero oscillators; the measured window still
    # contains the physical release tail of the last pre-shore lead note. The
    # last 50 ms of the window is the test for true silence.
    tail_window = samples[max(rest_start, rest_end - 2205):rest_end]
    tail_rms = math.sqrt(sum(v * v for v in tail_window) / len(tail_window)) if tail_window else 0.0
    tail_ratio = tail_rms / mean_voiced_rms if mean_voiced_rms else 0.0
    if rest_ratio >= 0.25:
        stop("S-6", f"boundary rest not a breath: rms ratio {rest_ratio}")
    if tail_ratio >= 0.05:
        stop("S-6", f"boundary rest tail not silent: rms ratio {tail_ratio}")

    corr_model = pearson(measured, model)
    med_rel = sorted(row["relativeError"] for row in bar_rows)[len(bar_rows) // 2]
    max_rel = max(row["relativeError"] for row in bar_rows)
    if corr_model < 0.95:
        stop("S-6", f"model correlation {corr_model}")
    if med_rel >= 0.05:
        stop("S-6", f"median relative error {med_rel}")

    container = [row["containerPcSum"] for row in bar_rows]
    lead = [row["leadPcSum"] for row in bar_rows]
    corr_container = pearson(measured, container)
    corr_lead = pearson(measured, lead)
    office_means = {}
    for row in bar_rows:
        office_means.setdefault(row["office"], []).append(row["centroidMeasuredHz"])
    office_means = {office: sum(values) / len(values)
                    for office, values in office_means.items()}
    residual = [row["centroidMeasuredHz"] - office_means[row["office"]]
                for row in bar_rows]
    corr_container_resid = pearson(residual, container)
    corr_lead_resid = pearson(residual, lead)
    if corr_lead_resid <= corr_container_resid:
        stop("S-6", "deconfounded lead pcSum does not outperform container pcSum")

    band_by_office = {}
    for row in bar_rows:
        band_by_office.setdefault(row["office"], []).append(row["centroidMeasuredHz"])
    section_of = {}
    for section in engine.itinerary["bars"]:
        section_of.setdefault(section["sectionKey"], []).append(section["bar"])
    section_means = {}
    for key, indices in section_of.items():
        values = [bar_rows[index - 1]["centroidMeasuredHz"] for index in indices]
        section_means[key] = round(sum(values) / len(values), 6)
    if section_means["climax"] <= section_means["first_dwell"]:
        stop("S-6", "climax centroid not above quiet dwell centroid")

    receipt = {
        "schemaVersion": "governed-loop.mvp6-task-d.v1",
        "directive": "MVP6-DIR-1",
        "task": "MVP6-TD",
        "status": "COMPLETE",
        "trace": {"path": str(TRACE_PATH), "sha256": sha256_file(TRACE_PATH)},
        "audioParameters": {
            "path": str(AUDIO_TS),
            "sha256": params["sha256"],
            "constantsMatch": params["constantsMatch"],
            "palettesMatch": params["allPalettesMatch"],
            "sampleRate": params["sampleRate"],
        },
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
            "midiAudit": {
                "padNoteOns": audit["padNoteOns"],
                "leadNoteOns": audit["leadNoteOns"],
                "outOfMaskNotes": audit["outOfMaskNotes"],
                "padContainerMatch": audit["padContainerMatch"],
                "leadSequenceMatch": audit["leadSequenceMatch"],
            },
        },
        "fft": fft_info,
        "bridge": {
            "barsMeasured": len(bar_rows),
            "correlationMeasuredVsModel": round(corr_model, 9),
            "medianRelativeError": round(med_rel, 9),
            "maxRelativeError": round(max_rel, 9),
            "correlationMeasuredVsContainerPcSum": round(corr_container, 9),
            "correlationMeasuredVsLeadPcSum": round(corr_lead, 9),
            "officeDeconfoundedCorrelationContainer": round(corr_container_resid, 9),
            "officeDeconfoundedCorrelationLead": round(corr_lead_resid, 9),
            "leadCarriesTheContour": corr_lead_resid > corr_container_resid,
            "interpretation": "acoustic centroid is dominated by office register band; "
                              "within-band contour is carried by the lead pitch sums",
            "boundaryRestRms": round(rest_rms, 6),
            "meanVoicedRms": round(mean_voiced_rms, 6),
            "boundaryRestRmsRatio": round(rest_ratio, 9),
            "boundaryRestDropDb": round(20.0 * math.log10(1.0 / rest_ratio), 6) if rest_ratio else None,
            "boundaryRestTailRmsRatio": round(tail_ratio, 9),
            "boundaryRestScheduledOscillators": rest.get("oscillators", 0),
            "boundaryRestReleaseTailDisclosed": True,
            "sectionCentroidMeansHz": section_means,
            "officeCentroidMeansHz": {office: round(sum(values) / len(values), 6)
                                      for office, values in sorted(band_by_office.items())},
        },
        "bars": bar_rows,
        "ab": ab,
        "guardFlags": GUARD,
        "llmCalls": 0,
        "stopRules": [],
    }
    (OUT / "mvp6_1_task_d_receipt.json").write_text(
        json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "COMPLETE",
        "wavSha256": rendered["wavSha256"],
        "midiSha256": rendered["midiSha256"],
        "samples": rendered["samples"],
        "durationMs": rendered["durationMs"],
        "corrModel": round(corr_model, 6),
        "medianRelErr": round(med_rel, 6),
        "corrContainer": round(corr_container, 6),
        "corrLead": round(corr_lead, 6),
        "corrContainerResid": round(corr_container_resid, 6),
        "corrLeadResid": round(corr_lead_resid, 6),
        "restRatio": round(rest_ratio, 6),
        "sectionCentroids": section_means,
    }, indent=2))


if __name__ == "__main__":
    main()
