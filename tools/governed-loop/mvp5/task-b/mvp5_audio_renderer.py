#!/usr/bin/env python3
"""MVP5 deterministic offline audio renderer: 16-bit PCM WAV and SMF-1 MIDI.

Stdlib only. Float sample arithmetic is confined to this module's PCM
generation; all symbolic timing and pitch selection is integer.
"""
import array
import hashlib
import io
import json
import math
import re
import struct
import sys
import wave
from decimal import Decimal
from pathlib import Path

SAMPLE_RATE = 44100
SAMPLE_WIDTH_BYTES = 2
CHANNELS = 1
MASTER_GAIN = 0.8
TICKS_PER_QUARTER = 480
BPM = 100
MICRO_STEP_MS = 300
MACRO_DWELL_MS = 1500
TRANSIT_REST_MS = 300
VETO_REST_MS = 1500
MS_PER_QUARTER = 600
TICKS_PER_MS_NUM = TICKS_PER_QUARTER
TICKS_PER_MS_DEN = MS_PER_QUARTER
PAD_GAIN_SCALE = 0.35

EXPECTED_CONSTANTS = {
    "AUDIO_ROOT_MIDI_NOTE": 60,
    "AUDIO_A4_HZ": 440,
    "AUDIO_SCHEMA_VERSION": "harmonic-orrery.audio.v1",
}

EXPECTED_PALETTES = {
    "Sun": {"waveform": "sawtooth", "registerOffset": 12, "attackSeconds": "0.025",
            "releaseSeconds": "0.42", "detuneCents": 3, "gain": "0.12",
            "canonicalStateId": 2773, "mode": "Lydian",
            "pitchClasses": [0, 2, 4, 6, 7, 9, 11]},
    "Moon": {"waveform": "sine", "registerOffset": 0, "attackSeconds": "0.10",
             "releaseSeconds": "0.54", "detuneCents": -5, "gain": "0.11",
             "canonicalStateId": 2741, "mode": "Ionian",
             "pitchClasses": [0, 2, 4, 5, 7, 9, 11]},
    "Mars": {"waveform": "square", "registerOffset": 12, "attackSeconds": "0.012",
             "releaseSeconds": "0.28", "detuneCents": 7, "gain": "0.095",
             "canonicalStateId": 1717, "mode": "Mixolydian",
             "pitchClasses": [0, 2, 4, 5, 7, 9, 10]},
    "Mercury": {"waveform": "triangle", "registerOffset": 0, "attackSeconds": "0.045",
                "releaseSeconds": "0.38", "detuneCents": -2, "gain": "0.10",
                "canonicalStateId": 1709, "mode": "Dorian",
                "pitchClasses": [0, 2, 3, 5, 7, 9, 10]},
    "Jupiter": {"waveform": "triangle", "registerOffset": 0, "attackSeconds": "0.07",
                "releaseSeconds": "0.50", "detuneCents": 4, "gain": "0.105",
                "canonicalStateId": 1453, "mode": "Aeolian",
                "pitchClasses": [0, 2, 3, 5, 7, 8, 10]},
    "Venus": {"waveform": "sine", "registerOffset": 12, "attackSeconds": "0.065",
              "releaseSeconds": "0.48", "detuneCents": -8, "gain": "0.09",
              "canonicalStateId": 1451, "mode": "Phrygian",
              "pitchClasses": [0, 1, 3, 5, 7, 8, 10]},
    "Saturn": {"waveform": "square", "registerOffset": -12, "attackSeconds": "0.018",
               "releaseSeconds": "0.34", "detuneCents": 1, "gain": "0.08",
               "canonicalStateId": 1387, "mode": "Locrian",
               "pitchClasses": [0, 1, 3, 5, 6, 8, 10]},
}


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def extract_office_block(text, office):
    marker = f"\n  {office}: {{"
    start = text.index(marker)
    brace = text.index("{", start)
    depth = 0
    for index in range(brace, len(text)):
        if text[index] == "{":
            depth += 1
        elif text[index] == "}":
            depth -= 1
            if depth == 0:
                return text[brace:index + 1]
    raise ValueError(f"unterminated office block {office}")


def field_value(block, field):
    match = re.search(rf"{field}:\s*\"?([^\",\n}}]+)\"?", block)
    if not match:
        raise ValueError(f"missing field {field}")
    return match.group(1).strip()


def field_list(block, field):
    match = re.search(rf"{field}:\s*\[([^\]]*)\]", block)
    if not match:
        raise ValueError(f"missing list field {field}")
    return [int(piece.strip()) for piece in match.group(1).split(",") if piece.strip()]


def extract_audio_parameters(audio_ts_path):
    text = Path(audio_ts_path).read_text(encoding="utf-8")
    constants = {}
    for name in EXPECTED_CONSTANTS:
        if name == "AUDIO_SCHEMA_VERSION":
            match = re.search(rf'export const {name} = "([^"]+)"', text)
            constants[name] = match.group(1) if match else None
        else:
            match = re.search(rf"export const {name} = (\d+)", text)
            constants[name] = int(match.group(1)) if match else None
    palettes = {}
    matches = {}
    for office, expected in EXPECTED_PALETTES.items():
        block = extract_office_block(text, office)
        parsed = {
            "waveform": field_value(block, "waveform"),
            "registerOffset": int(field_value(block, "registerOffset")),
            "attackSeconds": field_value(block, "attackSeconds"),
            "releaseSeconds": field_value(block, "releaseSeconds"),
            "detuneCents": int(field_value(block, "detuneCents")),
            "gain": field_value(block, "gain"),
            "canonicalStateId": int(field_value(block, "canonicalStateId")),
            "mode": field_value(block, "mode"),
            "pitchClasses": field_list(block, "pitchClasses"),
        }
        checks = {
            "waveform": parsed["waveform"] == expected["waveform"],
            "registerOffset": parsed["registerOffset"] == expected["registerOffset"],
            "attackSeconds": Decimal(parsed["attackSeconds"]) == Decimal(expected["attackSeconds"]),
            "releaseSeconds": Decimal(parsed["releaseSeconds"]) == Decimal(expected["releaseSeconds"]),
            "detuneCents": parsed["detuneCents"] == expected["detuneCents"],
            "gain": Decimal(parsed["gain"]) == Decimal(expected["gain"]),
            "canonicalStateId": parsed["canonicalStateId"] == expected["canonicalStateId"],
            "mode": parsed["mode"] == expected["mode"],
            "pitchClasses": parsed["pitchClasses"] == expected["pitchClasses"],
        }
        palettes[office] = {
            "waveform": parsed["waveform"],
            "registerOffset": parsed["registerOffset"],
            "attackSeconds": parsed["attackSeconds"],
            "releaseSeconds": parsed["releaseSeconds"],
            "detuneCents": parsed["detuneCents"],
            "gain": parsed["gain"],
            "canonicalStateId": parsed["canonicalStateId"],
            "mode": parsed["mode"],
            "pitchClasses": parsed["pitchClasses"],
            "checks": checks,
            "match": all(checks.values()),
        }
        matches[office] = palettes[office]["match"]
    constant_checks = {name: constants[name] == value for name, value in EXPECTED_CONSTANTS.items()}
    return {
        "path": str(audio_ts_path),
        "sha256": sha256_file(audio_ts_path),
        "constants": constants,
        "constantChecks": constant_checks,
        "constantsMatch": all(constant_checks.values()),
        "offices": palettes,
        "allPalettesMatch": all(matches.values()),
        "sampleRate": SAMPLE_RATE,
        "sampleRateSource": "MVP5-DIR-1 offline renderer constant; audio.ts defers rate to the browser AudioContext",
        "ticksPerQuarter": TICKS_PER_QUARTER,
        "bpm": BPM,
        "microStepMs": MICRO_STEP_MS,
        "macroDwellMs": MACRO_DWELL_MS,
    }


def midi_to_frequency(midi_note):
    return 440.0 * (2.0 ** ((midi_note - 69) / 12.0))


def pitch_class_to_midi(pitch_class, register_offset=0):
    if not (0 <= pitch_class <= 11) or register_offset % 12 != 0:
        raise ValueError(f"bad pitch class {pitch_class} / offset {register_offset}")
    return 60 + pitch_class + register_offset


def waveform_value(kind, phase):
    frac = phase - math.floor(phase)
    if kind == "sine":
        return math.sin(2.0 * math.pi * frac)
    if kind == "square":
        return 1.0 if frac < 0.5 else -1.0
    if kind == "sawtooth":
        return 2.0 * frac - 1.0
    if kind == "triangle":
        return 2.0 * abs(2.0 * frac - 1.0) - 1.0
    raise ValueError(f"unknown waveform {kind}")


def add_pad_voice(buffer, start_sample, bar_samples, midi_note, preset, peak_gain):
    frequency = midi_to_frequency(midi_note) * (2.0 ** (preset["detuneCents"] / 1200.0))
    attack = float(preset["attackSeconds"])
    release = float(preset["releaseSeconds"])
    duration_s = bar_samples / SAMPLE_RATE
    release_start = max(attack, duration_s - release)
    phase_step = frequency / SAMPLE_RATE
    for offset in range(bar_samples):
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
        buffer[index] += MASTER_GAIN * peak_gain * envelope * waveform_value(preset["waveform"], frequency * t)


def add_lead_voice(buffer, start_sample, midi_note, preset, peak_gain):
    frequency = midi_to_frequency(midi_note) * (2.0 ** (preset["detuneCents"] / 1200.0))
    attack = float(preset["attackSeconds"])
    release = float(preset["releaseSeconds"])
    duration_samples = int(round(release * SAMPLE_RATE))
    phase_step = frequency / SAMPLE_RATE
    for offset in range(duration_samples):
        index = start_sample + offset
        if index >= len(buffer):
            break
        t = offset / SAMPLE_RATE
        if t < attack:
            envelope = t / attack if attack > 0 else 1.0
        else:
            span = release - attack
            envelope = max(0.0, 1.0 - (t - attack) / span) if span > 0 else 0.0
        buffer[index] += MASTER_GAIN * peak_gain * envelope * waveform_value(preset["waveform"], frequency * t)


def ms_to_ticks(milliseconds):
    return milliseconds * TICKS_PER_MS_NUM // TICKS_PER_MS_DEN


def load_trace(trace_path):
    records = [json.loads(line) for line in Path(trace_path).read_text(encoding="utf-8").splitlines()]
    bars = {}
    for record in records:
        if record.get("recordType") != "micro":
            continue
        bar = int(record["bar"])
        entry = bars.setdefault(bar, {
            "bar": bar,
            "node": record["node"],
            "startMs": int(record["barStartMs"]),
            "durationMs": int(record["barDurationMs"]),
            "pitchClasses": record["pitchClasses"],
            "micro": [],
        })
        entry["micro"].append({
            "sub": int(record["sub"]),
            "qStateIn": int(record["qStateIn"]),
            "nextQ": int(record["nextQ"]),
            "emittedPc": int(record["emittedPc"]),
            "projectionMode": record["projectionMode"],
        })
    rests = [record for record in records if record.get("recordType") == "rest"]
    macro_events = [record for record in records if record.get("recordType") == "macro"]
    ordered = [bars[key] for key in sorted(bars)]
    for entry in ordered:
        entry["micro"].sort(key=lambda step: step["sub"])
    end_ms = 0
    for entry in ordered:
        end_ms = max(end_ms, entry["startMs"] + entry["durationMs"])
    for rest in rests:
        end_ms = max(end_ms, int(rest.get("startMs", 0)) + int(rest.get("durationMs", 0)))
    return {
        "bars": ordered,
        "rests": rests,
        "macroEvents": macro_events,
        "endMs": end_ms,
        "traceSha256": sha256_file(trace_path),
    }


def synthesize_wav(trace, palettes, office_lookup):
    total_samples = trace["endMs"] * SAMPLE_RATE // 1000
    buffer = [0.0] * total_samples
    bar_spans = []
    for bar in trace["bars"]:
        start_sample = bar["startMs"] * SAMPLE_RATE // 1000
        bar_samples = total_samples - start_sample
        bar_samples = min(bar_samples, bar["durationMs"] * SAMPLE_RATE // 1000)
        mask = int(bar["node"].split("@")[0])
        office = office_lookup[mask]
        preset = palettes[office]
        offset = preset["registerOffset"]
        for pc in sorted(bar["pitchClasses"]):
            midi_note = pitch_class_to_midi(pc, offset)
            add_pad_voice(buffer, start_sample, bar_samples, midi_note, preset, float(preset["gain"]) * PAD_GAIN_SCALE)
        phase = int(bar["node"].split("@")[1])
        midi_note = pitch_class_to_midi(phase, offset) - 12
        add_pad_voice(buffer, start_sample, bar_samples, midi_note, preset, float(preset["gain"]) * PAD_GAIN_SCALE)
        for step in bar["micro"]:
            lead_midi = 60 + step["emittedPc"] + max(0, offset) + 12
            emphasis = 1.0 if step["projectionMode"] == "direct_orbit_pc" else 0.8
            add_lead_voice(buffer, start_sample + step["sub"] * MICRO_STEP_MS * SAMPLE_RATE // 1000,
                           lead_midi, preset, float(preset["gain"]) * emphasis)
        bar_spans.append({
            "bar": bar["bar"],
            "node": bar["node"],
            "office": office,
            "startMs": bar["startMs"],
            "durationMs": bar["durationMs"],
            "pitchClasses": sorted(bar["pitchClasses"]),
            "startTick": ms_to_ticks(bar["startMs"]),
            "endTick": ms_to_ticks(bar["startMs"] + bar["durationMs"]),
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
    pcm = array.array("h", samples)
    if sys.byteorder != "little":
        pcm.byteswap()
    with wave.open(output, "wb") as handle:
        handle.setnchannels(CHANNELS)
        handle.setsampwidth(SAMPLE_WIDTH_BYTES)
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


def vlq(value):
    chunks = [value & 0x7F]
    value >>= 7
    while value:
        chunks.append((value & 0x7F) | 0x80)
        value >>= 7
    return bytes(reversed(chunks))


def meta_event(kind, payload):
    return bytes([0xFF, kind]) + vlq(len(payload)) + payload


def text_event(text):
    return meta_event(0x01, text.encode("utf-8"))


def marker_event(text):
    return meta_event(0x06, text.encode("utf-8"))


def encode_track(events):
    events = sorted(events, key=lambda item: (item[0], item[1], item[2]))
    output = bytearray()
    previous_tick = 0
    for tick, priority, payload in events:
        output.extend(vlq(tick - previous_tick))
        output.extend(payload)
        previous_tick = tick
    output.extend(vlq(0))
    output.extend(b"\xff\x2f\x00")
    return bytes(output)


def synthesize_midi(trace, palettes, track_name, office_lookup):
    end_tick = ms_to_ticks(trace["endMs"])
    conductor = [
        (0, 0, meta_event(0x51, struct.pack(">I", 600000)[1:])),
        (0, 0, meta_event(0x58, bytes([5, 3, 24, 8]))),
        (0, 0, text_event(f"MVP5 {track_name}"[:127])),
    ]
    pad_events = []
    lead_events = []
    for bar in trace["bars"]:
        start_tick = ms_to_ticks(bar["startMs"])
        end = start_tick + ms_to_ticks(bar["durationMs"])
        mask = int(bar["node"].split("@")[0])
        office = office_lookup[mask]
        preset = palettes[office]
        offset = preset["registerOffset"]
        conductor.append((start_tick, 0, marker_event(
            f"bar {bar['bar']} {bar['node']} {office} phase {int(bar['node'].split('@')[1])}"[:127])))
        for event in trace["macroEvents"]:
            if event.get("source") == bar["node"]:
                label = f"gate {event.get('gateVerdict')} {event.get('kind')} {event.get('citation') or ''}".strip()
                conductor.append((start_tick, 0, text_event(label[:127])))
                break
        pad_notes = sorted(set(bar["pitchClasses"]))
        phase = int(bar["node"].split("@")[1])
        midi_notes = [pitch_class_to_midi(pc, offset) for pc in pad_notes]
        midi_notes.append(pitch_class_to_midi(phase, offset) - 12)
        for note in midi_notes:
            pad_events.append((start_tick, 2, bytes([0x90, note, 100])))
            pad_events.append((end, 1, bytes([0x80, note, 0])))
        for step in bar["micro"]:
            step_tick = start_tick + step["sub"] * ms_to_ticks(MICRO_STEP_MS)
            lead_midi = 60 + step["emittedPc"] + max(0, offset) + 12
            velocity = 100 if step["projectionMode"] == "direct_orbit_pc" else 80
            lead_events.append((step_tick, 2, bytes([0x91, lead_midi, velocity])))
            lead_events.append((step_tick + ms_to_ticks(MICRO_STEP_MS), 1, bytes([0x81, lead_midi, 0])))
    for rest in trace["rests"]:
        start_tick = ms_to_ticks(int(rest.get("startMs", 0)))
        conductor.append((start_tick, 0, marker_event(
            f"transit rest {rest.get('source')} -> {rest.get('target')}"[:127])))
    tracks = [encode_track(conductor), encode_track(pad_events), encode_track(lead_events)]
    header = b"MThd" + struct.pack(">IHHH", 6, 1, len(tracks), TICKS_PER_QUARTER)
    payload = bytearray(header)
    for track in tracks:
        payload.extend(b"MTrk")
        payload.extend(struct.pack(">I", len(track)))
        payload.extend(track)
    return bytes(payload), end_tick


def parse_midi(data):
    if data[:4] != b"MThd":
        raise ValueError("missing MThd")
    length, fmt, tracks, division = struct.unpack(">IHHH", data[4:14])
    if length != 6:
        raise ValueError("bad header length")
    position = 14
    parsed = {"format": fmt, "tracks": tracks, "division": division, "chunks": []}
    for _ in range(tracks):
        if data[position:position + 4] != b"MTrk":
            raise ValueError("missing MTrk")
        chunk_length = struct.unpack(">I", data[position + 4:position + 8])[0]
        position += 8
        end = position + chunk_length
        tick = 0
        events = []
        running = None
        while position < end:
            delta = 0
            while True:
                byte = data[position]
                position += 1
                delta = (delta << 7) | (byte & 0x7F)
                if not byte & 0x80:
                    break
            tick += delta
            status = data[position]
            if status == 0xFF:
                position += 1
                meta_type = data[position]
                position += 1
                meta_length = 0
                while True:
                    byte = data[position]
                    position += 1
                    meta_length = (meta_length << 7) | (byte & 0x7F)
                    if not byte & 0x80:
                        break
                payload = data[position:position + meta_length]
                position += meta_length
                events.append({"tick": tick, "type": "meta", "metaType": meta_type, "data": payload})
                if meta_type == 0x2F:
                    break
                continue
            if status & 0x80:
                running = status
                position += 1
            else:
                status = running
            kind = status & 0xF0
            if kind in (0x80, 0x90):
                note = data[position]
                velocity = data[position + 1]
                position += 2
                events.append({"tick": tick, "type": "note-on" if kind == 0x90 and velocity > 0 else "note-off",
                               "note": note, "velocity": velocity, "channel": status & 0x0F})
            elif kind in (0xB0, 0xE0):
                position += 2
            elif kind in (0xC0, 0xD0):
                position += 1
            else:
                raise ValueError(f"unsupported status {status:#x}")
        parsed["chunks"].append(events)
        position = end
    return parsed


def audit_midi(midi_data, trace):
    parsed = parse_midi(midi_data)
    spans = []
    for bar in trace["bars"]:
        start = ms_to_ticks(bar["startMs"])
        spans.append({
            "start": start,
            "end": start + ms_to_ticks(bar["durationMs"]),
            "bar": bar["bar"],
            "node": bar["node"],
            "pitchClasses": sorted(bar["pitchClasses"]),
        })

    def container_at(tick):
        for span in spans:
            if span["start"] <= tick < span["end"]:
                return span
        return None

    pad_notes = []
    lead_notes = []
    out_of_mask = []
    for chunk_index, events in enumerate(parsed["chunks"][1:], start=1):
        for event in events:
            if event.get("type") != "note-on":
                continue
            span = container_at(event["tick"])
            if span is None:
                out_of_mask.append({"track": chunk_index, "tick": event["tick"], "note": event["note"],
                                    "reason": "outside scheduled bar"})
                continue
            pc = event["note"] % 12
            target = pad_notes if chunk_index == 1 else lead_notes
            target.append({"tick": event["tick"], "note": event["note"], "pc": pc,
                           "bar": span["bar"], "node": span["node"], "velocity": event["velocity"]})
            if pc not in span["pitchClasses"]:
                out_of_mask.append({"track": chunk_index, "tick": event["tick"], "note": event["note"],
                                    "pc": pc, "node": span["node"]})
    pad_container_match = True
    for span in spans:
        observed = sorted({note["pc"] for note in pad_notes if note["bar"] == span["bar"]})
        if observed != span["pitchClasses"]:
            pad_container_match = False
            break
    lead_expected = []
    for bar in trace["bars"]:
        for step in bar["micro"]:
            lead_expected.append((bar["bar"], step["sub"], step["emittedPc"]))
    lead_observed = [(note["bar"], (note["tick"] - ms_to_ticks(
        next(bar["startMs"] for bar in trace["bars"] if bar["bar"] == note["bar"]))) // ms_to_ticks(MICRO_STEP_MS),
        note["pc"]) for note in lead_notes]
    return {
        "format": parsed["format"],
        "trackChunks": parsed["tracks"],
        "division": parsed["division"],
        "padNoteOns": len(pad_notes),
        "leadNoteOns": len(lead_notes),
        "outOfMaskNotes": len(out_of_mask),
        "outOfMaskWitnesses": out_of_mask[:5],
        "padContainerMatch": pad_container_match,
        "leadSequenceMatch": lead_observed == lead_expected,
        "expectedLeadNotes": len(lead_expected),
        "expectedPadNoteOns": len(trace["bars"]) * 8,
        "metaEvents": sum(1 for event in parsed["chunks"][0] if event.get("type") == "meta"),
    }


def render_track(track_name, trace_path, palettes, office_lookup):
    trace = load_trace(trace_path)
    wav_first = synthesize_wav(trace, palettes, office_lookup)
    midi_first, end_tick = synthesize_midi(trace, palettes, track_name, office_lookup)
    wav_second = synthesize_wav(trace, palettes, office_lookup)
    midi_second, _ = synthesize_midi(trace, palettes, track_name, office_lookup)
    midi_audit = audit_midi(midi_first, trace)
    return {
        "track": track_name,
        "tracePath": str(trace_path),
        "traceSha256": trace["traceSha256"],
        "wavBytes": wav_first["wav"],
        "midiBytes": midi_first,
        "wavSha256": sha256_bytes(wav_first["wav"]),
        "midiSha256": sha256_bytes(midi_first),
        "wavSha256Second": sha256_bytes(wav_second["wav"]),
        "midiSha256Second": sha256_bytes(midi_second),
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
