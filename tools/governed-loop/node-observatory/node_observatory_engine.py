#!/usr/bin/env python3
"""MVP8.2-OBS-LEDGER-DIR-1 Task B: chord voicing catalog, dyad/single-note lead
layer, score-true renderer, affordance census, and the B1 legality sweep.

Read-only against the repository. All writes live under the MVP-8.2 scratch
realm. Symbolic outputs are int/str/bool only; acoustic blocks carry floats.
"""
import array
import io
import json
import math
import struct
import sys
import wave
from pathlib import Path

sys.path.insert(0, "/home/erick/workspace/scratch-governed-loop-run/mvp8_2_observatory_ledger")
import mvp8_2_common as common

TASK_B = common.SCRATCH / "task-b"
RECEIPT = TASK_B / "mvp8_2_task_b_receipt.json"
CENSUS_PATH = TASK_B / "mvp8_2_affordance_census.json"

JAZZ_CYCLE = ["triad_9", "seventh", "ninth_drop5", "rootless_13th"]
TREATMENTS = ["full", "bare", "shell", "triad", "triad_9", "seventh",
              "ninth_drop5", "rootless_13th"]
LEAD_MODES = ["off", "naked_q", "governed", "governed_dyads_downbeat",
              "governed_dyads_structural", "governed_dyads_alternating"]
FALLBACK_CHAIN = ["seventh", "shell", "triad", "dyad_root_3rd"]
FADE_SAMPLES = 2205
DYAD_MODES = {"governed_dyads_downbeat", "governed_dyads_structural",
              "governed_dyads_alternating"}

MODE_NAMES = {
    2741: "Ionian", 1717: "Mixolydian", 2773: "Lydian", 1453: "Aeolian",
    1451: "Phrygian", 1387: "Locrian", 1709: "Dorian", 2477: "Harmonic Minor",
    2677: "Ionian b5",
}
FAMILIES = {
    "A0 Moon": [2485, 2677, 2739, 2741, 2745, 2869, 3253],
    "Major Triangle": [2741, 1717, 2773],
}


# ---- pitch-set helpers ----------------------------------------------------

def delta_set(row):
    phase = row["phase"]
    return {(int(pc) - phase) % 12 for pc in row["pitchClasses"]}


def degrees(row):
    pcs = sorted(int(pc) for pc in row["pitchClasses"])
    phase = row["phase"]
    start = pcs.index(phase)
    return [pcs[(start + k) % 7] for k in range(7)]


def third_interval(delta):
    if 4 in delta:
        return 4
    if 3 in delta:
        return 3
    return None


def seventh_interval(delta):
    if 11 in delta:
        return 11
    if 10 in delta:
        return 10
    return None


def resolve_voicing(row, treatment, mode):
    """Return {active, voicingPcs, status, missingPc} for one bar."""
    d = delta_set(row)
    deg = degrees(row)
    phase = row["phase"]
    third = third_interval(d)
    seventh = seventh_interval(d)
    third_pc = None if third is None else (phase + third) % 12
    seventh_pc = None if seventh is None else (phase + seventh) % 12

    def fail(missing, active=None):
        return {"active": active or treatment, "voicingPcs": None,
                "status": "skip" if mode == "study" else "fallback",
                "missingPc": sorted(missing), "requested": treatment}

    if treatment == "full":
        return {"active": "full", "voicingPcs": deg, "status": "ok",
                "missingPc": [], "requested": treatment}
    if treatment == "bare":
        if 7 not in d:
            return fail([7])
        return {"active": "bare", "voicingPcs": [phase, (phase + 7) % 12],
                "status": "ok", "missingPc": [], "requested": treatment}
    if treatment == "shell":
        missing = []
        if third is None:
            missing.extend([3, 4])
        if seventh is None:
            missing.extend([10, 11])
        if missing:
            return fail(missing)
        return {"active": "shell", "voicingPcs": [phase, third_pc, seventh_pc],
                "status": "ok", "missingPc": [], "requested": treatment}
    if treatment == "triad":
        missing = []
        if third is None:
            missing.extend([3, 4])
        if 7 not in d:
            missing.append(7)
        if missing:
            return fail(missing)
        return {"active": "triad",
                "voicingPcs": [phase, third_pc, (phase + 7) % 12],
                "status": "ok", "missingPc": [], "requested": treatment}
    if treatment == "triad_9":
        if mode == "study":
            missing = []
            if 2 not in d:
                missing.append(2)
            if third is None:
                missing.extend([3, 4])
            if 7 not in d:
                missing.append(7)
            if missing:
                return fail(missing)
        return {"active": "triad_9",
                "voicingPcs": [deg[0], deg[2], deg[4], (deg[1] + 12) % 12],
                "status": "ok", "missingPc": [], "requested": treatment}
    if treatment == "seventh":
        if mode == "study" and 7 not in d:
            return fail([7])
        return {"active": "seventh",
                "voicingPcs": [deg[0], deg[2], deg[4], deg[6]],
                "status": "ok", "missingPc": [], "requested": treatment}
    if treatment == "ninth_drop5":
        return {"active": "ninth_drop5",
                "voicingPcs": [deg[0], deg[2], deg[6], (deg[1] + 12) % 12],
                "status": "ok", "missingPc": [], "requested": treatment}
    if treatment == "rootless_13th":
        return {"active": "rootless_13th",
                "voicingPcs": [deg[2], deg[5], deg[6], (deg[1] + 12) % 12],
                "status": "ok", "missingPc": [], "requested": treatment}
    raise ValueError(f"unknown treatment {treatment}")


def resolve_with_fallback(row, treatment, mode):
    first = resolve_voicing(row, treatment, mode)
    if first["status"] == "ok" or mode == "study":
        return first
    d = delta_set(row)
    third = third_interval(d)
    for candidate in FALLBACK_CHAIN:
        if candidate == "dyad_root_3rd":
            if third is None:
                continue
            return {"active": "dyad_root_3rd",
                    "voicingPcs": [row["phase"], (row["phase"] + third) % 12],
                    "status": "fallback", "missingPc": first["missingPc"],
                    "requested": treatment}
        result = resolve_voicing(row, candidate, "walk")
        if result["status"] == "ok":
            result["status"] = "fallback"
            result["missingPc"] = first["missingPc"]
            result["requested"] = treatment
            return result
    return first


# ---- inversion ------------------------------------------------------------

def rotate_and_raise(notes, inversion):
    m = len(notes)
    r = int(inversion) % m
    return notes[r:] + [note + 12 for note in notes[:r]]


def voice_motion_cost(previous, candidate):
    if previous is None:
        return 0
    shared = min(len(previous), len(candidate))
    cost = 12 * abs(len(previous) - len(candidate))
    cost += sum(abs(previous[i] - candidate[i]) for i in range(shared))
    return cost


def choose_voice_led(notes, previous):
    if previous is None:
        return 0, rotate_and_raise(notes, 0)
    options = []
    for r in range(min(4, len(notes))):
        rotated = rotate_and_raise(notes, r)
        options.append((voice_motion_cost(previous, rotated), r, rotated))
    cost, r, rotated = min(options, key=lambda row: (row[0], row[1]))
    return r, rotated


# ---- dyads ----------------------------------------------------------------

def is_dyad_step(step, lead_mode):
    if lead_mode == "governed_dyads_downbeat":
        return step["sub"] == 0
    if lead_mode == "governed_dyads_alternating":
        return step["sub"] % 2 == 0
    if lead_mode == "governed_dyads_structural":
        orbit = step.get("orbitIndex")
        return step["sub"] == 0 or orbit in (0, 2, 4)
    return False


def dyad_partner(emitted, focal_pcs, container):
    if not focal_pcs:
        return None
    focal = sorted(int(pc) for pc in focal_pcs)
    if emitted in focal:
        index = focal.index(emitted)
        partner = focal[(index + 2) % 5]
    else:
        partner = None
        for interval in (3, 4, 8, 9, 7, 5):
            candidates = [pc for pc in focal if (pc - emitted) % 12 == interval]
            if candidates:
                partner = min(candidates)
                break
    if partner is None or partner == emitted or partner not in container:
        return None
    return partner


# ---- bar planning ---------------------------------------------------------

def resolve_specs(specs):
    if isinstance(specs, int):
        return [{"k": 12}] * specs
    if isinstance(specs, list) and specs and isinstance(specs[0], int):
        return [{"k": int(k)} for k in specs]
    return [dict(spec) for spec in specs]


def build_bar_plans(engine, bar_specs, treatment, inversion, mode, palettes):
    plans = []
    previous_notes = None
    for index, spec in enumerate(bar_specs):
        node = spec["node"]
        row = engine.nodes[node]
        mask = int(node.split("@")[0])
        office = engine.planner.office.get(mask)
        offset = palettes[office]["registerOffset"]
        requested = treatment
        if treatment == "cycle":
            requested = JAZZ_CYCLE[index % len(JAZZ_CYCLE)]
        resolved = resolve_with_fallback(row, requested, mode)
        base = {
            "bar": index + 1,
            "node": node,
            "office": office,
            "registerOffset": offset,
            "requestedTreatment": requested,
            "activeTreatment": resolved["active"],
            "fallbackUsed": resolved["status"] == "fallback",
            "status": resolved["status"],
            "missingPc": resolved["missingPc"],
        }
        if resolved["status"] == "skip":
            base.update({"chordPcs": [], "chordMidi": [], "bassPc": None,
                         "bassMidi": None, "inversion": None})
            plans.append(base)
            continue
        voicing = sorted(set(resolved["voicingPcs"]))
        notes = sorted(base_pitch_class_to_midi(pc, offset) for pc in voicing)
        if inversion == "voice_led":
            used, chord_midi = choose_voice_led(notes, previous_notes)
        else:
            used = int(inversion) % len(notes)
            chord_midi = rotate_and_raise(notes, used)
        bass_pc = chord_midi[0] % 12
        bass_midi = base_pitch_class_to_midi(bass_pc, offset) - 12
        base.update({
            "chordPcs": voicing,
            "chordMidi": chord_midi,
            "inversion": used,
            "bassPc": bass_pc,
            "bassMidi": bass_midi,
        })
        previous_notes = sorted(chord_midi)
        plans.append(base)
    return plans


def base_pitch_class_to_midi(pc, offset):
    return 60 + int(pc) + int(offset)


# ---- rendering ------------------------------------------------------------

def encode_pcm(buffer, sample_rate):
    finite = all(math.isfinite(value) for value in buffer)
    peak = max((abs(value) for value in buffer), default=0.0)
    total = len(buffer) if buffer else 1
    rms = math.sqrt(sum(value * value for value in buffer) / total) if buffer else 0.0
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
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(sample_rate)
        handle.writeframes(pcm.tobytes())
    return output.getvalue(), {
        "samples": len(samples),
        "expectedSamples": int(len(buffer)),
        "rmsMilli": int(round(rms * 1000)),
        "peakQ15": int(round(peak * 32767.0)),
        "clippedSamples": clipped,
        "nonFiniteSamples": 0 if finite else 1,
    }


def lead_events(trace, lead_mode):
    """Yield per-step lead event dicts: primary pc, optional partner pc."""
    events = []
    for step in trace["microSteps"]:
        bar_row = next(bar for bar in trace["bars"] if bar["bar"] == step["bar"])
        container = set(bar_row["pitchClasses"])
        focal = bar_row["focalContext"]["pitchClasses"]
        primary = int(step["emittedPc"])
        partner = None
        if lead_mode in DYAD_MODES and is_dyad_step(step, lead_mode):
            partner = dyad_partner(primary, focal, container)
        events.append({
            "bar": step["bar"],
            "sub": step["sub"],
            "primaryPc": primary,
            "partnerPc": partner,
            "projectionMode": step["projectionMode"],
            "orbitIndex": step.get("orbitIndex"),
        })
    return events


def trace_end_ms(trace):
    if "endMs" in trace:
        return int(trace["endMs"])
    return int(trace["summary"]["durationMs"])


def synthesize_wav(fade, trace, plans, palettes, lead_mode):
    base = fade.base
    legato = fade.legato
    sample_rate = base.SAMPLE_RATE
    total = trace_end_ms(trace) * sample_rate // 1000
    buffer = [0.0] * total
    lead_by_bar = {}
    for event in lead_events(trace, lead_mode):
        lead_by_bar.setdefault(event["bar"], []).append(event)
    for bar, plan in zip(trace["bars"], plans):
        start = bar["startMs"] * sample_rate // 1000
        base_samples = min(total - start, bar["durationMs"] * sample_rate // 1000)
        preset = palettes[plan["office"]]
        offset = preset["registerOffset"]
        release = int(round(float(preset["releaseSeconds"]) * sample_rate))
        final = bar["bar"] == len(trace["bars"])
        pad_samples = base_samples if final else min(base_samples + release, total - start)
        pad_gain = float(preset["gain"]) * fade.PAD_GAIN_SCALE
        for midi in plan["chordMidi"]:
            legato.add_legato_pad_voice(buffer, start, pad_samples, midi, preset, pad_gain)
        legato.add_legato_pad_voice(buffer, start, pad_samples, plan["bassMidi"], preset, pad_gain)
        if lead_mode == "off":
            continue
        for event in lead_by_bar.get(bar["bar"], []):
            step_start = start + event["sub"] * base.MICRO_STEP_MS * sample_rate // 1000
            emphasis = 1.0 if event["projectionMode"] == "direct_orbit_pc" else 0.8
            lead_midi = 60 + event["primaryPc"] + max(0, offset) + 12
            base.add_lead_voice(buffer, step_start, lead_midi, preset,
                                float(preset["gain"]) * emphasis)
            if event["partnerPc"] is not None:
                partner_midi = lead_midi + ((event["partnerPc"] - event["primaryPc"]) % 12)
                base.add_lead_voice(buffer, step_start, partner_midi, preset,
                                    float(preset["gain"]) * emphasis * 0.75)
    wav, stats = encode_pcm(buffer, sample_rate)
    faded = fade.apply_master_fade(wav, FADE_SAMPLES)
    return faded, stats


def synthesize_midi(fade, trace, plans, palettes, label, lead_mode):
    base = fade.base
    end_tick = base.ms_to_ticks(trace_end_ms(trace))
    conductor = [
        (0, 0, base.meta_event(0x51, struct.pack(">I", 600000)[1:])),
        (0, 0, base.meta_event(0x58, bytes([5, 3, 24, 8]))),
        (0, 0, base.text_event(f"MVP8.2 {label}"[:127])),
    ]
    pad_events = []
    lead_events_midi = []
    lead_by_bar = {}
    for event in lead_events(trace, lead_mode):
        lead_by_bar.setdefault(event["bar"], []).append(event)
    for bar, plan in zip(trace["bars"], plans):
        start = base.ms_to_ticks(bar["startMs"])
        end = start + base.ms_to_ticks(bar["durationMs"])
        focal = bar["focalContext"]["subnodeId"]
        inversion = plan["inversion"]
        marker = (f"bar {bar['bar']} {bar['node']} {plan['office']} "
                  f"focal {focal} {plan['activeTreatment']} inv {inversion}")
        conductor.append((start, 0, base.marker_event(marker[:127])))
        for note in list(plan["chordMidi"]) + [plan["bassMidi"]]:
            pad_events.append((start, 2, bytes([0x90, note, 100])))
            pad_events.append((end, 1, bytes([0x80, note, 0])))
        if lead_mode == "off":
            continue
        preset = palettes[plan["office"]]
        offset = preset["registerOffset"]
        for event in lead_by_bar.get(bar["bar"], []):
            tick = start + event["sub"] * base.ms_to_ticks(base.MICRO_STEP_MS)
            primary_midi = 60 + event["primaryPc"] + max(0, offset) + 12
            emphasis = 100 if event["projectionMode"] == "direct_orbit_pc" else 80
            lead_events_midi.append((tick, 2, bytes([0x91, primary_midi, emphasis])))
            lead_events_midi.append((tick + base.ms_to_ticks(base.MICRO_STEP_MS), 1,
                                     bytes([0x81, primary_midi, 0])))
            if event["partnerPc"] is not None:
                partner_midi = primary_midi + ((event["partnerPc"] - event["primaryPc"]) % 12)
                lead_events_midi.append((tick, 2, bytes([0x91, partner_midi, max(1, emphasis - 20)])))
                lead_events_midi.append((tick + base.ms_to_ticks(base.MICRO_STEP_MS), 1,
                                         bytes([0x81, partner_midi, 0])))
    tracks = [base.encode_track(conductor), base.encode_track(pad_events),
              base.encode_track(lead_events_midi)]
    header = b"MThd" + struct.pack(">IHHH", 6, 1, len(tracks), base.TICKS_PER_QUARTER)
    payload = bytearray(header)
    for track in tracks:
        payload.extend(b"MTrk")
        payload.extend(struct.pack(">I", len(track)))
        payload.extend(track)
    return bytes(payload), end_tick


def audit_midi(fade, midi_bytes, trace, plans, lead_mode):
    base = fade.base
    parsed = base.parse_midi(midi_bytes)
    spans = []
    for bar in trace["bars"]:
        start = base.ms_to_ticks(bar["startMs"])
        spans.append({"start": start, "end": start + base.ms_to_ticks(bar["durationMs"]),
                      "bar": bar["bar"], "container": set(bar["pitchClasses"])})

    def span_at(tick):
        for span in spans:
            if span["start"] <= tick < span["end"]:
                return span
        return None

    pad_by_bar = {}
    lead_by_bar = {}
    out_of_mask_pad = 0
    out_of_mask_lead = 0
    for event in parsed["chunks"][1]:
        if event.get("type") != "note-on":
            continue
        span = span_at(event["tick"])
        if span is None:
            out_of_mask_pad += 1
            continue
        pad_by_bar.setdefault(span["bar"], []).append(event["note"])
        if event["note"] % 12 not in span["container"]:
            out_of_mask_pad += 1
    for event in parsed["chunks"][2]:
        if event.get("type") != "note-on":
            continue
        span = span_at(event["tick"])
        if span is None:
            out_of_mask_lead += 1
            continue
        lead_by_bar.setdefault(span["bar"], []).append(event)
        if event["note"] % 12 not in span["container"]:
            out_of_mask_lead += 1

    pad_voiced_match = True
    pad_rows = []
    for bar, plan in zip(trace["bars"], plans):
        expected = sorted(list(plan["chordMidi"]) + [plan["bassMidi"]])
        observed = sorted(pad_by_bar.get(bar["bar"], []))
        match = expected == observed
        pad_voiced_match = pad_voiced_match and match
        pad_rows.append({"bar": bar["bar"], "expected": expected, "observed": observed,
                         "match": match})

    lead_expected = lead_events(trace, lead_mode)
    lead_primary_match = True
    dyad_presence_match = True
    lead_rows = []
    for bar, plan in zip(trace["bars"], plans):
        bar_events = [event for event in lead_expected if event["bar"] == bar["bar"]]
        observed = lead_by_bar.get(bar["bar"], [])
        start = base.ms_to_ticks(bar["startMs"])
        for event in bar_events:
            tick = start + event["sub"] * base.ms_to_ticks(base.MICRO_STEP_MS)
            notes = sorted(note["note"] for note in observed if note["tick"] == tick)
            expected_primary = 60 + event["primaryPc"] + max(0, plan["registerOffset"]) + 12
            primary_ok = expected_primary in notes
            partner_expected = None
            if event["partnerPc"] is not None:
                partner_expected = expected_primary + ((event["partnerPc"] - event["primaryPc"]) % 12)
            partner_ok = (partner_expected is None) or (partner_expected in notes)
            lead_primary_match = lead_primary_match and primary_ok
            dyad_presence_match = dyad_presence_match and partner_ok
            lead_rows.append({"bar": bar["bar"], "sub": event["sub"],
                              "expectedPrimary": expected_primary,
                              "expectedPartner": partner_expected,
                              "observed": notes, "primaryOk": primary_ok,
                              "partnerOk": partner_ok})
    return {
        "format": parsed["format"],
        "trackChunks": parsed["tracks"],
        "division": parsed["division"],
        "padNoteOns": sum(len(row) for row in pad_by_bar.values()),
        "leadNoteOns": sum(len(row) for row in lead_by_bar.values()),
        "outOfMaskPadNotes": out_of_mask_pad,
        "outOfMaskLeadNotes": out_of_mask_lead,
        "padVoicedMatch": pad_voiced_match,
        "padRows": pad_rows,
        "leadPrimaryMatch": lead_primary_match,
        "dyadPresenceMatch": dyad_presence_match,
        "leadRows": lead_rows,
    }


def render_session(engine, trace, plans, fade, palettes, label, lead_mode, out_dir):
    """Render WAV + MIDI twice, audit, and return artifact rows."""
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    wav_first, stats = synthesize_wav(fade, trace, plans, palettes, lead_mode)
    midi_first, _ = synthesize_midi(fade, trace, plans, palettes, label, lead_mode)
    wav_second, _ = synthesize_wav(fade, trace, plans, palettes, lead_mode)
    midi_second, _ = synthesize_midi(fade, trace, plans, palettes, label, lead_mode)
    wav_path = out_dir / f"{label}.wav"
    midi_path = out_dir / f"{label}.mid"
    wav_path.write_bytes(wav_first)
    midi_path.write_bytes(midi_first)
    audit = audit_midi(fade, midi_first, trace, plans, lead_mode)
    return {
        "label": label,
        "wavPath": str(wav_path),
        "midiPath": str(midi_path),
        "wavSha256": common.sha256_bytes(wav_first),
        "midiSha256": common.sha256_bytes(midi_first),
        "reRenderMatch": wav_first == wav_second and midi_first == midi_second,
        "samples": stats["samples"],
        "expectedSamples": stats["expectedSamples"],
        "durationMs": trace_end_ms(trace),
        "rmsMilli": stats["rmsMilli"],
        "peakQ15": stats["peakQ15"],
        "clippedSamples": stats["clippedSamples"],
        "nonFiniteSamples": stats["nonFiniteSamples"],
        "midiAudit": audit,
    }


def build_trace(engine, label, bar_specs, description, lead_mode):
    focal_mode = "none" if lead_mode == "naked_q" else "governed"
    specs = []
    for spec in bar_specs:
        row = dict(spec)
        if "focalOverride" in row:
            override = row["focalOverride"]
            if isinstance(override, str):
                row["focalOverride"] = engine.planned_focal(row["node"], override)
        specs.append(row)
    return engine.build_trace(label, specs, description, focal_mode=focal_mode)


# ---- affordance census ----------------------------------------------------

def affordance_census(engine):
    rows = {}
    for mask in common.A0_MOON_MASKS:
        row = engine.nodes[f"{mask}@0"]
        d = delta_set(row)
        third = third_interval(d)
        seventh = seventh_interval(d)
        missing = [] if 7 in d else [7]
        rows[str(mask)] = {
            "pitchClasses": [int(pc) for pc in row["pitchClasses"]],
            "delta": sorted(int(x) for x in d),
            "thirdInterval": third,
            "seventhInterval": seventh,
            "shell": third is not None and seventh is not None,
            "triad": third is not None and 7 in d,
            "bare": 7 in d,
            "missingPc": missing,
        }
    shell_pass = sum(1 for row in rows.values() if row["shell"])
    triad_pass = sum(1 for row in rows.values() if row["triad"])
    bare_pass = sum(1 for row in rows.values() if row["bare"])
    triad_fail = sorted(int(m) for m, row in rows.items() if not row["triad"])
    bare_fail = sorted(int(m) for m, row in rows.items() if not row["bare"])
    return {
        "masks": rows,
        "shellPass": shell_pass,
        "triadPass": triad_pass,
        "barePass": bare_pass,
        "triadFailMasks": triad_fail,
        "bareFailMasks": bare_fail,
        "reproduced": (shell_pass == 7 and triad_pass == 5 and bare_pass == 5
                       and triad_fail == [2677, 2869] and bare_fail == [2677, 2869]
                       and all(rows[str(m)]["missingPc"] == [7] for m in (2677, 2869))),
    }


# ---- B1 legality sweep ----------------------------------------------------

def legality_sweep(engine, palettes):
    violations = {"outOfMaskPadNotes": 0, "outOfMaskLeadNotes": 0,
                  "dyadUnisonLeaks": 0}
    evaluations = 0
    traces = {}
    for mask in common.B1_SWEEP_MASKS:
        node = f"{mask}@0"
        specs = [{"node": node, "k": 12}, {"node": node, "k": 12}]
        traces[node] = build_trace(engine, f"sweep-{mask}", specs, "legality sweep", "governed")
    for mask in common.B1_SWEEP_MASKS:
        node = f"{mask}@0"
        trace = traces[node]
        container = set(engine.nodes[node]["pitchClasses"])
        for treatment in TREATMENTS:
            for inversion in (0, 1, 2, 3):
                specs = [{"node": node, "k": 12}, {"node": node, "k": 12}]
                plans = build_bar_plans(engine, specs, treatment, inversion, "walk", palettes)
                for plan in plans:
                    for pc in plan["chordPcs"]:
                        if pc not in container:
                            violations["outOfMaskPadNotes"] += 1
                    if plan["bassPc"] not in container:
                        violations["outOfMaskPadNotes"] += 1
                for lead_mode in LEAD_MODES:
                    for step in trace["microSteps"]:
                        evaluations += 1
                        if step["emittedPc"] not in container:
                            violations["outOfMaskLeadNotes"] += 1
                        if lead_mode in DYAD_MODES and is_dyad_step(step, lead_mode):
                            focal = next(bar for bar in trace["bars"]
                                         if bar["bar"] == step["bar"])["focalContext"]["pitchClasses"]
                            partner = dyad_partner(step["emittedPc"], focal, container)
                            if partner is not None:
                                if partner not in container:
                                    violations["outOfMaskLeadNotes"] += 1
                                if partner == step["emittedPc"]:
                                    violations["dyadUnisonLeaks"] += 1
    return {
        "masks": common.B1_SWEEP_MASKS,
        "treatmentCount": len(TREATMENTS),
        "inversionCount": 4,
        "leadModeCount": len(LEAD_MODES),
        "evaluations": evaluations,
        "violations": violations,
        "pass": all(value == 0 for value in violations.values()),
    }


# ---- task entry -----------------------------------------------------------

def main():
    TASK_B.mkdir(parents=True, exist_ok=True)
    predecl = common.load_predecl()
    engine = common.load_engine()
    fade, palettes, office_lookup = common.palettes_and_offices(engine)
    census = affordance_census(engine)
    if not census["reproduced"]:
        common.stop("S-4", f"B3 census {census}")
    sweep = legality_sweep(engine, palettes)
    if not sweep["pass"]:
        common.stop("S-4", f"B1 legality {sweep['violations']}")
    common.write_json(CENSUS_PATH, {
        "schemaVersion": "governed-loop.mvp8_2-affordance-census.v1",
        "guards": common.GUARD,
        "census": census,
        "predeclared": predecl["b3Census"],
    })
    receipt = {
        "schemaVersion": "governed-loop.mvp8_2-task-b.v1",
        "directive": "MVP8.2-OBS-LEDGER-DIR-1",
        "task": "MVP8.2-TB",
        "status": "COMPLETE",
        "guardFlags": common.GUARD,
        "catalog": {
            "treatments": TREATMENTS,
            "cycle": JAZZ_CYCLE,
            "leadModes": LEAD_MODES,
            "dyadPredicates": {
                "governed_dyads_downbeat": "sub == 0",
                "governed_dyads_structural": "sub == 0 or orbitIndex in {0,2,4}",
                "governed_dyads_alternating": "sub % 2 == 0",
            },
            "dyadPartner": "skip-one in ordered focal pentatonic; modal-color "
                           "fallback minimal consonant in F; both pcs in container",
            "voiceLed": "bar 1 inversion 0; later bars minimize summed absolute "
                        "voice motion, tie smallest inversion",
        },
        "B1": sweep,
        "B3": census,
        "B2": {"status": "measured on rendered sessions in Task D",
               "rule": predecl["bets"]["B2_scoreTrueMidi"]["rule"]},
        "censusPath": "task-b/mvp8_2_affordance_census.json",
        "censusSha256": common.sha256_file(CENSUS_PATH),
        "llmCalls": 0,
        "repoWrites": 0,
    }
    common.write_json(RECEIPT, receipt)
    print(json.dumps({
        "status": "COMPLETE",
        "B1pass": sweep["pass"],
        "B1evaluations": sweep["evaluations"],
        "B1violations": sweep["violations"],
        "B3shell": census["shellPass"],
        "B3triad": census["triadPass"],
        "B3bare": census["barePass"],
        "B3failMasks": census["triadFailMasks"],
        "receiptSha256": common.sha256_file(RECEIPT),
    }, indent=2))


if __name__ == "__main__":
    main()
