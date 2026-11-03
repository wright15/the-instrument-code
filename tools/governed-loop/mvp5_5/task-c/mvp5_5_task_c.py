#!/usr/bin/env python3
"""MVP5.5-DIR-1 Task C: acoustic spectral centroid FFT bridge on the six
landed L21 WAV renders. Stdlib only: wave, struct, math, cmath.

Modality 2 (boundary_conditioned_contact). Continuous quantities are external
measurements with the four registered guard flags carried verbatim.
"""
import cmath
import hashlib
import json
import math
import re
import struct
import sys
import wave
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp5_5")
TASKC = SCRATCH / "task-c"
PREDECL = SCRATCH / "task-0" / "mvp5_5_predeclared_bets.json"
RECEIPT = TASKC / "mvp5_5_task_c_receipt.json"

SAMPLE_RATE = 44100
FFT_SIZE = 4096
HOP = 2048
BAR_SAMPLES = 66150
BAR_MS = 1500
TRANSIT_REST_MS = 300
N_HARMONICS = 2000
AUDIO_TS = REPO / "orrery/src/audio.ts"
AUDIO_TS_SHA = "e863b845c8f2709a0fe0e6fe706dce603e795b760c6561d110d240ddb1dfca88"
WAV_PINS = {
    "track1_arm1_unranked_2cycle": (
        "dcca3792aaa8b211cff95daa851de0e6dae6a9c2a7e100494acfff3e4c8462c4", 1323000, 20),
    "track2_arm2_static_4state": (
        "04dd46fadb5793b938555e27c8909884db071af6ba8fe03576ec33c0f74723ab", 1323000, 20),
    "track3_arm3a_dynamic_q_reset": (
        "b4e9b1674fd4ae3b94fc9e0921e3c461c642403fa34a91869fe851e069398307", 1336230, 20),
    "track4_arm3b_dynamic_q_carried": (
        "d0fe3d2727593d22ee49ed50d64b0253ed36f52e64d9f202d43596106e735738", 1336230, 20),
    "track5_equiv_base_p0": (
        "82a69919cd4d5bc7a8f0d14d40dfe653193bd6047c1088d3030e6c48098994a1", 198450, 3),
    "track6_equiv_lifted_p7": (
        "2fa02243432104eb6a1a48a3b287c7a4a8ef79064dc37bab0737fa3be44ce917", 198450, 3),
}
TRACES = {
    "track1_arm1_unranked_2cycle": "arm1_unranked_q_carried",
    "track2_arm2_static_4state": "arm2_static_q_carried",
    "track3_arm3a_dynamic_q_reset": "arm3a_dynamic_q_reset",
    "track4_arm3b_dynamic_q_carried": "arm3b_dynamic_q_carried",
    "track5_equiv_base_p0": "arm_tb_equiv_p0",
    "track6_equiv_lifted_p7": "arm_tb_equiv_p7",
}
TRACK_ORDER = [
    "track1_arm1_unranked_2cycle",
    "track2_arm2_static_4state",
    "track3_arm3a_dynamic_q_reset",
    "track4_arm3b_dynamic_q_carried",
    "track5_equiv_base_p0",
    "track6_equiv_lifted_p7",
]

GUARD = {
    "causationClaim": False,
    "physicalQuantityClaim": False,
    "tierClassifier": False,
    "globalCHNull": True,
}

_twiddle = {}


def stop(rule, detail):
    print(f"STOP: {rule} {detail}")
    sys.exit(2)


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))


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


def self_test():
    sine = [math.sin(2.0 * math.pi * 440.0 * i / SAMPLE_RATE) for i in range(FFT_SIZE)]
    spectrum = fft(sine)
    time_energy = sum(value * value for value in sine)
    freq_energy = sum(abs(spectrum[k]) ** 2 for k in range(FFT_SIZE)) / FFT_SIZE
    parseval_ratio = time_energy / freq_energy
    peak_bin = max(range(1, FFT_SIZE // 2), key=lambda k: abs(spectrum[k]))
    peak_freq = peak_bin * SAMPLE_RATE / FFT_SIZE
    bin_centered = 40 * SAMPLE_RATE / FFT_SIZE
    exact_sine = [math.sin(2.0 * math.pi * bin_centered * i / SAMPLE_RATE) for i in range(FFT_SIZE)]
    exact_spectrum = fft(exact_sine)
    exact_peak = max(range(1, FFT_SIZE // 2), key=lambda k: abs(exact_spectrum[k]))
    if abs(parseval_ratio - 1.0) > 1e-9:
        stop("S-6", f"Parseval self-test ratio {parseval_ratio}")
    if peak_bin != round(440.0 * FFT_SIZE / SAMPLE_RATE):
        stop("S-6", f"440 Hz peak bin {peak_bin}")
    if abs(peak_freq - 440.0) > SAMPLE_RATE / FFT_SIZE:
        stop("S-6", f"440 Hz recovery {peak_freq}")
    if exact_peak != 40:
        stop("S-6", f"bin-centered recovery {exact_peak}")
    return {
        "parsevalRatio": parseval_ratio,
        "peakBin440Hz": peak_bin,
        "peakFrequency440Hz": peak_freq,
        "binCenteredFrequencyHz": bin_centered,
        "binCenteredPeakBin": exact_peak,
        "frequencyResolutionHz": SAMPLE_RATE / FFT_SIZE,
        "fftSize": FFT_SIZE,
        "hop": HOP,
        "window": "hann",
    }


def parse_palettes():
    text = AUDIO_TS.read_text(encoding="utf-8")
    palettes = {}
    for office in ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]:
        match = re.search(rf"\n  {office}: \{{(.*?)\n  \}}", text, re.S)
        if not match:
            stop("S-6", f"missing audio.ts office block {office}")
        block = match.group(1)

        def field(name):
            found = re.search(rf"{name}:\s*\"?([^\",\n}}]+)\"?", block)
            if not found:
                stop("S-6", f"missing audio.ts field {office}.{name}")
            return found.group(1).strip()

        palettes[office] = {
            "waveform": field("waveform"),
            "registerOffset": int(field("registerOffset")),
            "attackSeconds": float(field("attackSeconds")),
            "releaseSeconds": float(field("releaseSeconds")),
            "detuneCents": int(field("detuneCents")),
            "gain": float(field("gain")),
        }
    return palettes


def read_wav(path):
    with wave.open(str(path), "rb") as handle:
        if handle.getframerate() != SAMPLE_RATE:
            stop("S-6", f"{path.name} sample rate {handle.getframerate()}")
        if handle.getnchannels() != 1 or handle.getsampwidth() != 2:
            stop("S-6", f"{path.name} format drift")
        frames = handle.readframes(handle.getnframes())
    return struct.unpack("<%dh" % (len(frames) // 2), frames)


def load_bars(trace_name):
    path = REPO / f"tools/governed-loop/mvp5/task-a/traces/{trace_name}.jsonl"
    records = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines()]
    bars = {}
    for record in records:
        if record.get("recordType") != "micro":
            continue
        entry = bars.setdefault(record["bar"], {
            "bar": record["bar"],
            "startMs": record["barStartMs"],
            "durationMs": record["barDurationMs"],
            "node": record["node"],
            "pitchClasses": record["pitchClasses"],
            "micro": [],
        })
        entry["micro"].append({
            "sub": record["sub"],
            "emittedPc": record["emittedPc"],
            "projectionMode": record["projectionMode"],
        })
    for entry in bars.values():
        entry["micro"].sort(key=lambda step: step["sub"])
    return [bars[key] for key in sorted(bars)], sha256_file(path)


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


def bar_voices(bar, office_lookup, palettes):
    mask = int(bar["node"].split("@")[0])
    phase = int(bar["node"].split("@")[1])
    office = office_lookup[mask]
    preset = palettes[office]
    offset = preset["registerOffset"]
    detune = 2.0 ** (preset["detuneCents"] / 1200.0)
    pad_energy = pad_envelope_energy(
        preset["attackSeconds"], preset["releaseSeconds"], BAR_MS / 1000.0
    )
    voices = [
        (60 + pc + offset, preset["gain"] * 0.35, pad_energy)
        for pc in bar["pitchClasses"]
    ]
    voices.append((60 + phase + offset - 12, preset["gain"] * 0.35, pad_energy))
    leads = []
    for step in bar["micro"]:
        lead_midi = 60 + step["emittedPc"] + max(0, offset) + 12
        emphasis = 1.0 if step["projectionMode"] == "direct_orbit_pc" else 0.8
        lead_start = step["sub"] * 0.3
        leads.append((lead_midi, preset["gain"] * emphasis, lead_start))
        remain = max(0.0, min(BAR_MS / 1000.0 - lead_start, preset["releaseSeconds"]))
        energy = (
            envelope_energy(
                preset["attackSeconds"], preset["releaseSeconds"], 0.0, remain
            )
            / (BAR_MS / 1000.0)
            if remain > 0
            else 0.0
        )
        voices.append((lead_midi, preset["gain"] * emphasis, energy))
    return voices, leads, preset, detune


def model_centroid(bar, previous_bar, office_lookup, palettes):
    voices, leads, preset, detune = bar_voices(bar, office_lookup, palettes)
    detailed = [
        (midi, gain, energy, preset["waveform"], detune)
        for midi, gain, energy in voices
    ]
    if previous_bar is not None:
        _, previous_leads, previous_preset, previous_detune = bar_voices(
            previous_bar, office_lookup, palettes
        )
        gap = (bar["startMs"] - previous_bar["startMs"]) / 1000.0
        for midi, gain, lead_start in previous_leads:
            elapsed = gap - lead_start
            release = previous_preset["releaseSeconds"]
            if 0.0 <= elapsed < release:
                span = min(BAR_MS / 1000.0, release - elapsed)
                energy = envelope_energy(
                    previous_preset["attackSeconds"], release, elapsed, span
                ) / (BAR_MS / 1000.0)
                detailed.append(
                    (midi, gain, energy, previous_preset["waveform"], previous_detune)
                )
    numerator = 0.0
    denominator = 0.0
    for midi, gain, energy, waveform, det in detailed:
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
    return numerator / denominator


def measured_centroid(samples, bar):
    start = bar["startMs"] * SAMPLE_RATE // 1000
    end = start + BAR_SAMPLES
    hann = [
        0.5 * (1.0 - math.cos(2.0 * math.pi * index / (FFT_SIZE - 1)))
        for index in range(FFT_SIZE)
    ]
    numerator = 0.0
    denominator = 0.0
    position = start
    frames = 0
    while position + FFT_SIZE <= end:
        spectrum = fft(
            [
                samples[position + index] / 32768.0 * hann[index]
                for index in range(FFT_SIZE)
            ]
        )
        for k in range(1, FFT_SIZE // 2 + 1):
            power = abs(spectrum[k]) ** 2
            numerator += k * (SAMPLE_RATE / FFT_SIZE) * power
            denominator += power
        position += HOP
        frames += 1
    if frames == 0 or denominator == 0.0:
        stop("S-6", f"empty bar span {bar['bar']}")
    return numerator / denominator, frames


def pearson(xs, ys):
    count = len(xs)
    if count < 2:
        return None
    mean_x = sum(xs) / count
    mean_y = sum(ys) / count
    covariance = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    variance_x = sum((x - mean_x) ** 2 for x in xs)
    variance_y = sum((y - mean_y) ** 2 for y in ys)
    if variance_x == 0.0 or variance_y == 0.0:
        return None
    return covariance / math.sqrt(variance_x * variance_y)


def main():
    TASKC.mkdir(parents=True, exist_ok=True)
    locked = json.loads(PREDECL.read_text(encoding="utf-8"))
    body = {k: v for k, v in locked.items() if k != "predeclarationHash"}
    if hashlib.sha256(canonical(body).encode("utf-8")).hexdigest() != locked["predeclarationHash"]:
        stop("S-2", "predeclaration hash mismatch at Task C")
    predeclaration = {
        "path": "task-0/mvp5_5_predeclared_bets.json",
        "sha256": sha256_file(PREDECL),
        "predeclarationHash": locked["predeclarationHash"],
        "status": "verified-before-evaluation",
    }
    if sha256_file(AUDIO_TS) != AUDIO_TS_SHA:
        stop("S-1", "audio.ts hash drift")

    calibration = self_test()
    palettes = parse_palettes()

    census = json.loads((REPO / "tools/governed-loop/census_462.json").read_text(encoding="utf-8"))
    office_lookup = {record["stateId"]: record["office"] for record in census["records"]}
    task_b_receipt = json.loads(
        (REPO / "qa/mvp5_task_b_receipt.json").read_text(encoding="utf-8")
    )
    receipt_tracks = {track["track"]: track for track in task_b_receipt["tracks"]}

    tracks = {}
    total_bars = 0
    all_measured = []
    all_model = []
    all_errors = []
    for track_name in TRACK_ORDER:
        wav_path = REPO / f"tools/governed-loop/mvp5/task-b/renders/{track_name}.wav"
        expected_sha, expected_samples, expected_bars = WAV_PINS[track_name]
        actual_sha = sha256_file(wav_path)
        if actual_sha != expected_sha:
            stop("S-1", f"{track_name} WAV hash drift")
        samples = read_wav(wav_path)
        if len(samples) != expected_samples:
            stop("S-6", f"{track_name} sample count {len(samples)}")
        receipt_track = receipt_tracks.get(track_name)
        if receipt_track is None:
            stop("S-6", f"{track_name} missing from mvp5_task_b_receipt")
        if receipt_track["samples"] != len(samples) or receipt_track["diskFrames"] != len(samples):
            stop("S-6", f"{track_name} receipt sample mismatch")
        bars, trace_sha = load_bars(TRACES[track_name])
        if len(bars) != expected_bars or len(bars) != receipt_track["barCount"]:
            stop("S-6", f"{track_name} bar count {len(bars)}")

        rows = []
        for index, bar in enumerate(bars):
            measured, frames = measured_centroid(samples, bar)
            model = model_centroid(
                bar, bars[index - 1] if index > 0 else None, office_lookup, palettes
            )
            if not (math.isfinite(measured) and math.isfinite(model)):
                stop("S-6", f"{track_name} non-finite centroid bar {bar['bar']}")
            mask = int(bar["node"].split("@")[0])
            phase = int(bar["node"].split("@")[1])
            office = office_lookup[mask]
            preset = palettes[office]
            offset = preset["registerOffset"]
            container_pc_sum = sum(bar["pitchClasses"])
            lead_pc_sum = sum(step["emittedPc"] for step in bar["micro"])
            total_midi = (
                sum(60 + pc + offset for pc in bar["pitchClasses"])
                + (60 + phase + offset - 12)
                + sum(
                    60 + step["emittedPc"] + max(0, offset) + 12
                    for step in bar["micro"]
                )
            )
            error = abs(measured - model) / model
            all_measured.append(measured)
            all_model.append(model)
            all_errors.append(error)
            rows.append({
                "bar": bar["bar"],
                "node": bar["node"],
                "office": office,
                "registerOffset": offset,
                "phase": phase,
                "containerPcSum": container_pc_sum,
                "leadPcSum": lead_pc_sum,
                "totalMidiSum": total_midi,
                "fftFrames": frames,
                "cFftHz": measured,
                "cModelHz": model,
                "relativeError": error,
            })
        total_bars += len(rows)
        tracks[track_name] = {
            "trace": TRACES[track_name],
            "traceSha256": trace_sha,
            "wavSha256": actual_sha,
            "sampleCount": len(samples),
            "barCount": len(rows),
            "bars": rows,
        }
    if total_bars != 86:
        stop("S-6", f"voiced bar count {total_bars} != 86")

    correlation = pearson(all_model, all_measured)
    sorted_errors = sorted(all_errors)
    median_error = sorted_errors[len(sorted_errors) // 2]
    mean_error = sum(all_errors) / len(all_errors)
    max_error = max(all_errors)
    c1_disposition = (
        "BOUNDARY_CONFIRMED"
        if median_error < 1e-2 and correlation is not None and correlation > 0.999
        else "BOUNDARY_REFUTED"
    )

    def center_by_office(values, offices):
        means = {}
        for office in set(offices):
            group = [value for value, item in zip(values, offices) if item == office]
            means[office] = sum(group) / len(group)
        return [value - means[office] for value, office in zip(values, offices)]

    c2_tracks = {}
    for track_name in TRACK_ORDER[:4]:
        rows = tracks[track_name]["bars"]
        offices = [row["office"] for row in rows]
        centroids = [row["cFftHz"] for row in rows]
        predictors = {
            "containerPcSum": [row["containerPcSum"] for row in rows],
            "leadPcSum": [row["leadPcSum"] for row in rows],
            "totalMidiSum": [row["totalMidiSum"] for row in rows],
        }
        centered_centroids = center_by_office(centroids, offices)
        entry = {
            "offices": sorted(set(offices)),
            "officeCount": len(set(offices)),
            "walkClass": "single_office" if len(set(offices)) == 1 else "multi_office",
            "predictors": {},
        }
        for name, values in predictors.items():
            raw = pearson(centroids, values)
            centered_only = pearson(centered_centroids, values)
            both = pearson(centered_centroids, center_by_office(values, offices))
            entry["predictors"][name] = {
                "raw": raw,
                "centroidOnlyDeconfounded": centered_only,
                "bothDeconfounded": both,
            }
        c2_tracks[track_name] = entry

    multi_office = [
        name for name, entry in c2_tracks.items() if entry["walkClass"] == "multi_office"
    ]
    pc_sum_raises = []
    for name in multi_office:
        predictor = c2_tracks[name]["predictors"]["containerPcSum"]
        pc_sum_raises.append(
            predictor["centroidOnlyDeconfounded"] is not None
            and predictor["raw"] is not None
            and predictor["centroidOnlyDeconfounded"] > predictor["raw"]
        )
    c2_disposition = (
        "BOUNDARY_CONFIRMED"
        if multi_office and all(pc_sum_raises)
        else "BOUNDARY_REFUTED"
    )

    track5 = tracks["track5_equiv_base_p0"]["bars"]
    track6 = tracks["track6_equiv_lifted_p7"]["bars"]
    c3_rows = []
    for first, second in zip(track5, track6):
        first_mask = int(first["node"].split("@")[0])
        second_mask = int(second["node"].split("@")[0])
        if first_mask != second_mask:
            stop("S-6", "equiv pair mask mismatch")
        first_phase = first["phase"]
        second_phase = second["phase"]
        first_base = [
            pc for pc in range(12)
            if (first_mask >> pc) & 1
        ]
        first_wraps = sum(1 for pc in first_base if pc + first_phase >= 12)
        second_wraps = sum(1 for pc in first_base if pc + second_phase >= 12)
        delta_phase = second_phase - first_phase
        delta_wraps = second_wraps - first_wraps
        symbolic_shift = 7 * delta_phase - 12 * delta_wraps
        observed_shift = second["containerPcSum"] - first["containerPcSum"]
        delta_centroid = second["cFftHz"] - first["cFftHz"]
        c3_rows.append({
            "bar": first["bar"],
            "nodeBase": first_mask,
            "phaseP0": first_phase,
            "phaseP7": second_phase,
            "deltaPhase": delta_phase,
            "deltaWraps": delta_wraps,
            "symbolicPcSumShift": symbolic_shift,
            "observedPcSumShift": observed_shift,
            "symbolicLawHolds": symbolic_shift == observed_shift,
            "deltaCfftHz": delta_centroid,
            "signAgreement": (symbolic_shift > 0 and delta_centroid > 0)
            or (symbolic_shift < 0 and delta_centroid < 0)
            or (symbolic_shift == 0 and delta_centroid == 0),
        })
    c3_verified = all(row["symbolicLawHolds"] and row["signAgreement"] for row in c3_rows)
    if not c3_verified:
        stop("S-4", "equivariant shift verification failed")

    office_bands = {}
    for track_name in TRACK_ORDER:
        for row in tracks[track_name]["bars"]:
            office_bands.setdefault(row["office"], []).append(row["cFftHz"])
    band_summary = {
        office: {
            "registerOffset": palettes[office]["registerOffset"],
            "waveform": palettes[office]["waveform"],
            "barCount": len(values),
            "meanCentroidHz": sum(values) / len(values),
            "minCentroidHz": min(values),
            "maxCentroidHz": max(values),
        }
        for office, values in sorted(office_bands.items())
    }

    receipt = {
        "schemaVersion": "governed-loop.mvp5-5-task-c.v1",
        "directive": "MVP5.5-DIR-1",
        "task": "TC",
        "status": "COMPLETE",
        "modality": "boundary_conditioned_contact",
        "interpretationPolicy": dict(GUARD),
        "layer": "SPEC-001 §1.3 overlay dynamics",
        "gov517_correspondence_claimed": False,
        "still_set_label": "still_set",
        "predeclaration": predeclaration,
        "calibration": calibration,
        "audioSource": {
            "path": "orrery/src/audio.ts",
            "sha256": AUDIO_TS_SHA,
            "palettes": palettes,
        },
        "barSpans": {
            "sampleRate": SAMPLE_RATE,
            "barSamples": BAR_SAMPLES,
            "barMilliseconds": BAR_MS,
            "transitRestMilliseconds": TRANSIT_REST_MS,
            "voicedBars": total_bars,
        },
        "checkC1": {
            "name": "renderer-to-air FFT fidelity",
            "barCount": total_bars,
            "correlationCfftVsModel": correlation,
            "medianAbsoluteRelativeError": median_error,
            "meanAbsoluteRelativeError": mean_error,
            "maxAbsoluteRelativeError": max_error,
            "criterion": "median absolute relative error < 1e-2 and correlation > 0.999",
            "disposition": c1_disposition,
        },
        "checkC2": {
            "name": "symbolic pcSum and fundamental centroid tracking",
            "tracks": c2_tracks,
            "multiOfficeTracks": multi_office,
            "containerPcSumDeconfoundingRaisesCorrelation": pc_sum_raises,
            "disposition": c2_disposition,
            "secondaryObservation": (
                "micro-lead pitch sums carry the intra-office contour more strongly "
                "than container pcSum; see predictors.leadPcSum.bothDeconfounded"
            ),
        },
        "checkC3": {
            "name": "equivariant acoustic shift track5 vs track6",
            "rows": c3_rows,
            "allSymbolicLawsHold": all(row["symbolicLawHolds"] for row in c3_rows),
            "allSignsAgree": all(row["signAgreement"] for row in c3_rows),
            "verified": c3_verified,
        },
        "officeBands": band_summary,
        "tracks": tracks,
        "stopRulesTriggered": [],
    }
    RECEIPT.write_text(
        json.dumps(receipt, indent=2, sort_keys=True, allow_nan=False) + "\n",
        encoding="utf-8",
    )

    print("MVP5.5 TASK C COMPLETE")
    print(f"  calibration Parseval {calibration['parsevalRatio']:.12f} | "
          f"440 Hz peak bin {calibration['peakBin440Hz']} "
          f"({calibration['peakFrequency440Hz']:.3f} Hz)")
    print(f"  bars {total_bars}/86 | C1 corr {correlation:.9f} | "
          f"median err {median_error:.6f} | {c1_disposition}")
    print(f"  C2 {c2_disposition} | multi-office {multi_office} | "
          f"pcSum raises {pc_sum_raises}")
    print(f"  C3 verified {c3_verified} | shifts "
          f"{[round(row['deltaCfftHz'], 3) for row in c3_rows]}")
    print(f"  receipt sha256 {sha256_file(RECEIPT)}")


if __name__ == "__main__":
    main()
