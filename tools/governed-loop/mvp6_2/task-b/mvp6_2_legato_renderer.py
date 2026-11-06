#!/usr/bin/env python3
"""MVP6.2 legato pad renderer.

Imports the pinned MVP-5 renderer read-only and changes exactly one law: each
pad voice sustains through its bar end and decays over its release time into
the next bar. The next bar's attack overlaps additively (crossfade). The
pre-rest bar and the final bar release to zero at their own bar end.

MIDI synthesis is the pinned function, so the MIDI surface is byte-identical
to the L24 control.
"""
import hashlib
import io
import math
import sys
import wave
from array import array
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
sys.path.insert(0, str(REPO / "tools/governed-loop/mvp5/task-b"))

import mvp5_audio_renderer as base  # noqa: E402

SAMPLE_RATE = base.SAMPLE_RATE
MASTER_GAIN = base.MASTER_GAIN
PAD_GAIN_SCALE = base.PAD_GAIN_SCALE
MICRO_STEP_MS = base.MICRO_STEP_MS


def add_legato_pad_voice(buffer, start_sample, duration_samples, midi_note, preset, peak_gain):
    frequency = base.midi_to_frequency(midi_note) * (2.0 ** (preset["detuneCents"] / 1200.0))
    attack = float(preset["attackSeconds"])
    release = float(preset["releaseSeconds"])
    duration_s = duration_samples / SAMPLE_RATE
    release_start = max(attack, duration_s - release)
    waveform = preset["waveform"]
    for offset in range(duration_samples):
        index = start_sample + offset
        if index >= len(buffer):
            break
        t = offset / SAMPLE_RATE
        if t < attack:
            envelope = t / attack if attack > 0 else 1.0
        elif t < release_start:
            envelope = 1.0
        else:
            span = duration_s - release_start
            envelope = max(0.0, 1.0 - (t - release_start) / span) if span > 0 else 0.0
        buffer[index] += MASTER_GAIN * peak_gain * envelope * base.waveform_value(waveform, frequency * t)


def synthesize_wav_legato(trace, palettes, office_lookup, exempt_bars):
    total_samples = trace["endMs"] * SAMPLE_RATE // 1000
    buffer = [0.0] * total_samples
    bar_spans = []
    for bar in trace["bars"]:
        start_sample = bar["startMs"] * SAMPLE_RATE // 1000
        base_samples = min(total_samples - start_sample, bar["durationMs"] * SAMPLE_RATE // 1000)
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
        pad_gain = float(preset["gain"]) * PAD_GAIN_SCALE
        for pc in sorted(bar["pitchClasses"]):
            add_legato_pad_voice(buffer, start_sample, pad_samples,
                                 base.pitch_class_to_midi(pc, offset), preset, pad_gain)
        add_legato_pad_voice(buffer, start_sample, pad_samples,
                             base.pitch_class_to_midi(phase, offset) - 12, preset, pad_gain)
        for step in bar["micro"]:
            lead_midi = 60 + step["emittedPc"] + max(0, offset) + 12
            emphasis = 1.0 if step["projectionMode"] == "direct_orbit_pc" else 0.8
            base.add_lead_voice(
                buffer,
                start_sample + step["sub"] * MICRO_STEP_MS * SAMPLE_RATE // 1000,
                lead_midi, preset, float(preset["gain"]) * emphasis)
        bar_spans.append({
            "bar": bar["bar"],
            "node": bar["node"],
            "office": office,
            "startMs": bar["startMs"],
            "durationMs": bar["durationMs"],
            "pitchClasses": sorted(bar["pitchClasses"]),
            "startTick": base.ms_to_ticks(bar["startMs"]),
            "endTick": base.ms_to_ticks(bar["startMs"] + bar["durationMs"]),
            "padSamples": pad_samples,
        })
    finite = all(math.isfinite(value) for value in buffer)
    peak_float = max((abs(value) for value in buffer), default=0.0)
    mean_square = sum(value * value for value in buffer) / len(buffer) if buffer else 0.0
    rms = math.sqrt(mean_square)
    clipped = 0
    samples = []
    for value in buffer:
        scaled = int(round(value * 32767.0))
        if scaled > 32767:
            scaled = 32767
            clipped += 1
        elif scaled < -32768:
            scaled = -32768
            clipped += 1
        samples.append(scaled)
    output = io.BytesIO()
    pcm = array("h", samples)
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
        "expectedSamples": total_samples,
        "rmsMilli": int(round(rms * 1000)),
        "peakQ15": int(round(peak_float * 32767.0)),
        "clippedSamples": clipped,
        "nonFiniteSamples": 0 if finite else 1,
        "barSpans": bar_spans,
    }


def render_track_legato(track_name, trace_path, palettes, office_lookup, exempt_bars):
    trace = base.load_trace(trace_path)
    wav_first = synthesize_wav_legato(trace, palettes, office_lookup, exempt_bars)
    midi_first, end_tick = base.synthesize_midi(trace, palettes, track_name, office_lookup)
    wav_second = synthesize_wav_legato(trace, palettes, office_lookup, exempt_bars)
    midi_second, _ = base.synthesize_midi(trace, palettes, track_name, office_lookup)
    midi_audit = base.audit_midi(midi_first, trace)
    return {
        "track": track_name,
        "tracePath": str(trace_path),
        "traceSha256": trace["traceSha256"],
        "wavBytes": wav_first["wav"],
        "midiBytes": midi_first,
        "wavSha256": base.sha256_bytes(wav_first["wav"]),
        "midiSha256": base.sha256_bytes(midi_first),
        "wavSha256Second": base.sha256_bytes(wav_second["wav"]),
        "midiSha256Second": base.sha256_bytes(midi_second),
        "reRenderMatch": wav_first["wav"] == wav_second["wav"] and midi_first == midi_second,
        "samples": wav_first["samples"],
        "expectedSamples": wav_first["expectedSamples"],
        "durationMs": trace["endMs"],
        "rmsMilli": wav_first["rmsMilli"],
        "peakQ15": wav_first["peakQ15"],
        "clippedSamples": wav_first["clippedSamples"],
        "nonFiniteSamples": wav_first["nonFiniteSamples"],
        "nonSilent": wav_first["rmsMilli"] > 0,
        "barCount": len(trace["bars"]),
        "restCount": len(trace["rests"]),
        "midiEndTick": end_tick,
        "midiAudit": midi_audit,
        "barSpans": wav_first["barSpans"],
    }


class SeamMeter:
    """The frozen seam metric: min 10 ms RMS in +/-150 ms vs the local 1 s mean."""

    def __init__(self, samples):
        self.samples = samples
        self.prefix = [0.0] * (len(samples) + 1)
        total = 0.0
        for index, value in enumerate(samples):
            total += value * value
            self.prefix[index + 1] = total

    def _rms(self, start, end):
        start = max(0, int(start))
        end = min(len(self.prefix) - 1, int(end))
        if end <= start:
            return 0.0
        return math.sqrt((self.prefix[end] - self.prefix[start]) / (end - start))

    def depth_db(self, boundary_ms):
        boundary = int(boundary_ms * SAMPLE_RATE / 1000)
        window = int(0.15 * SAMPLE_RATE)
        step = int(0.01 * SAMPLE_RATE)
        dips = []
        position = boundary - window
        while position + step <= boundary + window:
            dips.append(self._rms(position, position + step))
            position += step
        dip = min(dips) if dips else 0.0
        local = (self._rms(boundary - window - SAMPLE_RATE, boundary - window)
                 + self._rms(boundary + window, boundary + window + SAMPLE_RATE)) / 2.0
        if dip <= 0.0 or local <= 0.0:
            return 0.0
        return 20.0 * math.log10(local / dip)

    def measure(self, boundaries_ms):
        rows = [{"timeMs": int(t), "depthDb": round(self.depth_db(t), 6)}
                for t in boundaries_ms]
        depths = sorted(row["depthDb"] for row in rows)
        return {
            "boundaries": len(rows),
            "medianDepthDb": round(depths[len(depths) // 2], 6) if depths else 0.0,
            "maxDepthDb": round(max(depths), 6) if depths else 0.0,
            "minDepthDb": round(min(depths), 6) if depths else 0.0,
            "rows": rows,
        }
