#!/usr/bin/env python3
"""MVP6.3 master fade renderer and stem isolator.

Imports the pinned renderer and the landed MVP-6.2 legato renderer read-only.
The only WAV change is a 50 ms raised-cosine master fade at the file end. Stems
render the pad and lead buses separately for the end-cut isolation test.
"""
import array
import hashlib
import io
import math
import struct
import sys
import wave
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
sys.path.insert(0, str(REPO / "tools/governed-loop/mvp6_2/task-b"))
sys.path.insert(0, str(REPO / "tools/governed-loop/mvp5/task-b"))

import mvp6_2_legato_renderer as legato  # noqa: E402

base = legato.base
SAMPLE_RATE = legato.SAMPLE_RATE
PAD_GAIN_SCALE = legato.PAD_GAIN_SCALE
MICRO_STEP_MS = legato.MICRO_STEP_MS


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def decode_wav(wav_bytes):
    with wave.open(io.BytesIO(wav_bytes), "rb") as handle:
        params = handle.getparams()
        frames = handle.readframes(handle.getnframes())
    return params, struct.unpack("<%dh" % (len(frames) // 2), frames)


def encode_wav(params, samples):
    output = io.BytesIO()
    pcm = array.array("h", samples)
    if sys.byteorder != "little":
        pcm.byteswap()
    with wave.open(output, "wb") as handle:
        handle.setnchannels(params.nchannels)
        handle.setsampwidth(params.sampwidth)
        handle.setframerate(params.framerate)
        handle.writeframes(pcm.tobytes())
    return output.getvalue()


def apply_master_fade(wav_bytes, fade_samples):
    params, samples = decode_wav(wav_bytes)
    total = len(samples)
    output = list(samples)
    for index in range(fade_samples):
        weight = 0.5 * (1.0 + math.cos(math.pi * index / (fade_samples - 1)))
        position = total - fade_samples + index
        output[position] = int(round(output[position] * weight))
    return encode_wav(params, output)


def finalize(buffer):
    finite = all(math.isfinite(value) for value in buffer)
    peak_float = max((abs(value) for value in buffer), default=0.0)
    mean_square = sum(value * value for value in buffer) / len(buffer) if buffer else 0.0
    rms = math.sqrt(mean_square)
    clipped = 0
    samples = []
    for value in buffer:
        scaled = int(round(value * 32767.0))
        if scaled > 32767:
            scaled = 32767; clipped += 1
        elif scaled < -32768:
            scaled = -32768; clipped += 1
        samples.append(scaled)
    output = io.BytesIO()
    pcm = array.array("h", samples)
    if sys.byteorder != "little":
        pcm.byteswap()
    with wave.open(output, "wb") as handle:
        handle.setnchannels(base.CHANNELS)
        handle.setsampwidth(base.SAMPLE_WIDTH_BYTES)
        handle.setframerate(SAMPLE_RATE)
        handle.writeframes(pcm.tobytes())
    return {
        "wav": output.getvalue(),
        "samples": len(samples),
        "rmsMilli": int(round(rms * 1000)),
        "peakQ15": int(round(peak_float * 32767.0)),
        "clippedSamples": clipped,
        "nonFiniteSamples": 0 if finite else 1,
    }


def synthesize_stem(trace, palettes, office_lookup, exempt_bars, mode):
    total_samples = trace["endMs"] * SAMPLE_RATE // 1000
    buffer = [0.0] * total_samples
    for bar in trace["bars"]:
        start_sample = bar["startMs"] * SAMPLE_RATE // 1000
        base_samples = min(total_samples - start_sample,
                           bar["durationMs"] * SAMPLE_RATE // 1000)
        mask = int(bar["node"].split("@")[0])
        phase = int(bar["node"].split("@")[1])
        office = office_lookup[mask]
        preset = palettes[office]
        offset = preset["registerOffset"]
        release_samples = int(round(float(preset["releaseSeconds"]) * SAMPLE_RATE))
        if bar["bar"] in exempt_bars:
            pad_samples = base_samples
        else:
            pad_samples = min(base_samples + release_samples, total_samples - start_sample)
        if mode == "pad":
            pad_gain = float(preset["gain"]) * PAD_GAIN_SCALE
            for pc in sorted(bar["pitchClasses"]):
                legato.add_legato_pad_voice(buffer, start_sample, pad_samples,
                                            base.pitch_class_to_midi(pc, offset),
                                            preset, pad_gain)
            legato.add_legato_pad_voice(buffer, start_sample, pad_samples,
                                        base.pitch_class_to_midi(phase, offset) - 12,
                                        preset, pad_gain)
        else:
            for step in bar["micro"]:
                lead_midi = 60 + step["emittedPc"] + max(0, offset) + 12
                emphasis = 1.0 if step["projectionMode"] == "direct_orbit_pc" else 0.8
                base.add_lead_voice(
                    buffer,
                    start_sample + step["sub"] * MICRO_STEP_MS * SAMPLE_RATE // 1000,
                    lead_midi, preset, float(preset["gain"]) * emphasis)
    return finalize(buffer)


def render_stems(trace_path, palettes, office_lookup, exempt_bars):
    trace = base.load_trace(trace_path)
    pad = synthesize_stem(trace, palettes, office_lookup, exempt_bars, "pad")
    lead = synthesize_stem(trace, palettes, office_lookup, exempt_bars, "lead")
    pad_second = synthesize_stem(trace, palettes, office_lookup, exempt_bars, "pad")
    lead_second = synthesize_stem(trace, palettes, office_lookup, exempt_bars, "lead")
    return {
        "traceSha256": trace["traceSha256"],
        "samples": pad["samples"],
        "pad": {"wavBytes": pad["wav"], "wavSha256": sha256_bytes(pad["wav"]),
                "rmsMilli": pad["rmsMilli"], "clippedSamples": pad["clippedSamples"],
                "nonFiniteSamples": pad["nonFiniteSamples"]},
        "lead": {"wavBytes": lead["wav"], "wavSha256": sha256_bytes(lead["wav"]),
                 "rmsMilli": lead["rmsMilli"], "clippedSamples": lead["clippedSamples"],
                 "nonFiniteSamples": lead["nonFiniteSamples"]},
        "reRenderMatch": (pad["wav"] == pad_second["wav"]
                          and lead["wav"] == lead_second["wav"]),
    }


def render_track_faded(track_name, trace_path, palettes, office_lookup,
                       exempt_bars, fade_samples):
    first = legato.render_track_legato(track_name, trace_path, palettes,
                                       office_lookup, exempt_bars)
    faded_first = apply_master_fade(first["wavBytes"], fade_samples)
    second = legato.render_track_legato(track_name, trace_path, palettes,
                                        office_lookup, exempt_bars)
    faded_second = apply_master_fade(second["wavBytes"], fade_samples)
    params, samples = decode_wav(faded_first)
    peak = max((abs(value) for value in samples), default=0)
    mean_square = sum(value * value for value in samples) / len(samples) if samples else 0.0
    rms = math.sqrt(mean_square)
    clipped = sum(1 for value in samples if abs(value) >= 32767)
    return {
        "track": track_name,
        "tracePath": str(trace_path),
        "traceSha256": first["traceSha256"],
        "wavBytes": faded_first,
        "midiBytes": first["midiBytes"],
        "wavSha256": sha256_bytes(faded_first),
        "midiSha256": sha256_bytes(first["midiBytes"]),
        "preFadeWavSha256": first["wavSha256"],
        "wavSha256Second": sha256_bytes(faded_second),
        "midiSha256Second": sha256_bytes(second["midiBytes"]),
        "reRenderMatch": (faded_first == faded_second
                          and first["midiBytes"] == second["midiBytes"]),
        "fadeSamples": fade_samples,
        "samples": len(samples),
        "expectedSamples": first["expectedSamples"],
        "durationMs": first["durationMs"],
        "rmsMilli": int(round(rms * 1000)),
        "peakQ15": int(round(peak * 32767.0)),
        "clippedSamples": clipped,
        "nonFiniteSamples": first["nonFiniteSamples"],
        "nonSilent": rms > 0,
        "barCount": first["barCount"],
        "restCount": first["restCount"],
        "midiEndTick": first["midiEndTick"],
        "midiAudit": first["midiAudit"],
        "barSpans": first["barSpans"],
    }
