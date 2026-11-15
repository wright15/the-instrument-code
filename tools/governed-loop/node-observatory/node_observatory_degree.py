#!/usr/bin/env python3
"""MVP8.4-CADENCE-ALGEBRA-DIR-1 degree driver (scratch successor).

Reuses the pinned landed renderer chain without editing the landed Node
Observatory bytes. Adds composer-declared progressions, explicit stack
rotations m in {0..k-1}, the exact voice-leading rotation solver, the
phase-agnostic Chaldean degree index, and repo-relative path resolution.

Read-only against the repository; every session is written to the session
directory passed by the caller.
"""
import argparse
import json
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

import mvp8_3_common as common
import degree_ladder as ladder
import node_observatory_engine as obs

LEAD_MODE = "governed_dyads_structural"
TEMPLATE_TOKENS = ["full", "bare", "shell", "triad", "triad_9", "seventh",
                   "ninth_drop5", "rootless_13th", "cycle"]
import re
TEMPLATE_RE = re.compile(r"\b(" + "|".join(re.escape(t) for t in TEMPLATE_TOKENS) + r")\b")


def assert_no_template_names(text):
    hits = sorted(set(TEMPLATE_RE.findall(text)))
    if hits:
        raise ValueError(f"template names leaked into degree sheet: {hits}")


def degree_plans(engine, bar_specs, palettes):
    """Plans for degree-path bars with the locked stack-root bass (L2)."""
    plans = []
    for index, spec in enumerate(bar_specs):
        node = spec["node"]
        row = engine.nodes[node]
        mask = int(node.split("@")[0])
        office = engine.planner.office.get(mask)
        offset = palettes[office]["registerOffset"]
        container = ladder.container_from_row(row)
        stack = ladder.degree_stack(container, spec["degree"], spec["stride"],
                                    spec["depth"], spec.get("rotation", 0))
        voicing = sorted(set(stack["pitchClasses"]))
        notes = sorted(obs.base_pitch_class_to_midi(pc, offset) for pc in voicing)
        root_pc = stack["rootPc"]
        root_index = [note % 12 for note in notes].index(root_pc)
        chord_midi = notes[root_index:] + [note + 12 for note in notes[:root_index]]
        bass_pc = root_pc
        bass_midi = obs.base_pitch_class_to_midi(root_pc, offset) - 12
        plans.append({
            "bar": index + 1,
            "node": node,
            "office": office,
            "registerOffset": offset,
            "requestedTreatment": spec.get("treatment", "degree_stack"),
            "activeTreatment": spec.get("treatment", "degree_stack"),
            "fallbackUsed": False,
            "status": "ok",
            "missingPc": [],
            "chordPcs": voicing,
            "chordMidi": chord_midi,
            "inversion": root_index,
            "bassPc": bass_pc,
            "bassMidi": bass_midi,
            "degree": stack["degree"],
            "chaldeanDegree": ladder.chaldean_degree(stack["degree"]),
            "stride": stack["stride"],
            "depth": stack["depth"],
            "rotation": stack["rotation"],
            "rootDegree": stack["rootDegree"],
            "rootPc": root_pc,
            "shape": stack["shape"],
            "orbitCode": stack.get("orbitCode"),
            "orderedPcs": stack["orderedPcs"],
        })
    return plans


def template_plans(engine, bar_specs, palettes):
    return obs.build_bar_plans(engine, bar_specs, "cycle", 0, "walk", palettes)


def _bar_candidates(engine, spec, palettes, forced_rotation=None):
    node = spec["node"]
    row = engine.nodes[node]
    mask = int(node.split("@")[0])
    office = engine.planner.office.get(mask)
    offset = palettes[office]["registerOffset"]
    container = ladder.container_from_row(row)
    depth = int(spec["depth"])
    stride = int(spec["stride"])
    degree = int(spec["degree"])
    explicit = spec.get("rotation")
    if explicit is None:
        explicit = forced_rotation
    rotations = [int(explicit) % depth] if explicit is not None else list(range(depth))
    candidates = []
    for rotation in rotations:
        stack = ladder.stack_voicing(container, degree, stride, depth,
                                     rotation, offset)
        candidates.append({
            "rotation": rotation,
            "chordMidi": stack["chordMidi"],
            "pitchClasses": list(stack["pitchClasses"]),
            "stack": stack,
            "office": office,
            "registerOffset": offset,
            "node": node,
        })
    return candidates


def build_progression_plans(engine, bar_specs, palettes, voice_lead=False,
                            forced_rotations=None):
    """Composer-declared progression plans with explicit or solved rotations."""
    candidates = []
    for index, spec in enumerate(bar_specs):
        forced = None
        if forced_rotations is not None:
            forced = forced_rotations[index]
        candidates.append(_bar_candidates(engine, spec, palettes, forced))
    if voice_lead:
        rotation_path, total_cost = ladder.solve_rotation_path(candidates)
        solver = {"mode": "voice_lead", "rotationPath": rotation_path,
                  "totalDisplacement": total_cost}
    else:
        rotation_path = [rows[0]["rotation"] for rows in candidates]
        total_cost = 0
        previous = None
        for rows in candidates:
            total_cost += ladder.voice_lead_cost(previous, rows[0]["chordMidi"])
            previous = rows[0]["chordMidi"]
        solver = {"mode": "explicit", "rotationPath": rotation_path,
                  "totalDisplacement": total_cost}
    plans = []
    for index, (spec, rows) in enumerate(zip(bar_specs, candidates)):
        chosen = rows[0]
        for row in rows:
            if row["rotation"] == rotation_path[index]:
                chosen = row
                break
        stack = chosen["stack"]
        voicing = sorted(set(stack["pitchClasses"]))
        plans.append({
            "bar": index + 1,
            "node": chosen["node"],
            "office": chosen["office"],
            "registerOffset": chosen["registerOffset"],
            "requestedTreatment": spec.get("treatment", "degree_stack"),
            "activeTreatment": spec.get("treatment", "degree_stack"),
            "fallbackUsed": False,
            "status": "ok",
            "missingPc": [],
            "chordPcs": voicing,
            "chordMidi": chosen["chordMidi"],
            "inversion": stack["chordMidi"].index(min(stack["chordMidi"])),
            "bassPc": stack["bassPc"],
            "bassMidi": stack["bassMidi"],
            "degree": stack["degree"],
            "chaldeanDegree": stack["chaldeanDegree"],
            "stride": stack["stride"],
            "depth": stack["depth"],
            "rotation": stack["rotation"],
            "rootDegree": stack["rootDegree"],
            "rootPc": stack["rootPc"],
            "shape": stack["shape"],
            "orbitCode": stack.get("orbitCode"),
            "orderedPcs": stack["orderedPcs"],
            "candidateRotations": [row["rotation"] for row in rows],
        })
    return plans, solver


def seam_variables(engine, plans):
    planner = engine.planner
    rows = []
    for previous, current in zip(plans, plans[1:]):
        a_mask = int(previous["node"].split("@")[0])
        b_mask = int(current["node"].split("@")[0])
        a_set = set(int(pc) for pc in engine.nodes[previous["node"]]["pitchClasses"])
        b_set = set(int(pc) for pc in engine.nodes[current["node"]]["pitchClasses"])
        symmetric = len(a_set ^ b_set)
        rows.append({
            "fromBar": previous["bar"],
            "toBar": current["bar"],
            "fromNode": previous["node"],
            "toNode": current["node"],
            "substitution_size": symmetric // 2 if symmetric % 2 == 0 else symmetric,
            "office_relation": ("same_office"
                                if planner.office.get(a_mask) == planner.office.get(b_mask)
                                else "cross_office"),
            "role_pair": f"{planner.role.get(a_mask)}->{planner.role.get(b_mask)}",
            "governed_connectivity": (
                "governs" if current["node"] in planner.adj.get(previous["node"], ())
                else "none"),
            "tier_relation": (f"{planner.tier.get(a_mask)}->{planner.tier.get(b_mask)}"),
        })
    return rows


def lead_events_by_bar(trace, plans=None, lead_mode=LEAD_MODE):
    grouped = {}
    for event in obs.lead_events(trace, lead_mode, plans):
        grouped.setdefault(event["bar"], []).append(event)
    return grouped


def degree_sheet_text(engine, label, bar_specs, plans, trace, rendered):
    lead = lead_events_by_bar(trace)
    lines = [
        f"# Session {label}",
        "",
        f"- **Directive:** MVP8.4-CADENCE-ALGEBRA-DIR-1 (scratch observation)",
        f"- **Path:** degree-native (`S^(m)(C,d,s,k)`)",
        f"- **Lead layer:** `{LEAD_MODE}`",
        f"- **Nodes:** {', '.join(spec['node'] for spec in bar_specs)}",
        f"- **Bars / duration:** {len(bar_specs)} / {rendered['durationMs']} ms",
        f"- **Guard:** `{json.dumps(common.GUARD, sort_keys=True)}`",
        "",
        f"- **Trace:** `{rendered['traceSha256']}`",
        f"- **WAV:** `{rendered['wavSha256']}`",
        f"- **MIDI:** `{rendered['midiSha256']}`",
        f"- **Deterministic two-pass:** `{rendered['reRenderMatch']}`",
        "",
        "## Degree bar table",
        "",
        "| Bar | Node | Office | Degree | Chaldean | Stride | Depth | Rotation | "
        "Root degree | Root pc | Shape | Chord pcs | Bass pc | Bass MIDI | Lead pcs | Dyads |",
        "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    for bar, plan in zip(trace["bars"], plans):
        events = lead.get(bar["bar"], [])
        lead_pcs = sorted({event["primaryPc"] for event in events})
        dyads = sum(1 for event in events if event["partnerPc"] is not None)
        lines.append(
            f"| {bar['bar']} | {plan['node']} | {plan['office']} | {plan['degree']} | "
            f"{plan['chaldeanDegree']} | {plan['stride']} | {plan['depth']} | "
            f"{plan['rotation']} | {plan['rootDegree']} | {plan['rootPc']} | "
            f"{plan['shape']} | {plan['chordPcs']} | {plan['bassPc']} | "
            f"{plan['bassMidi']} | {lead_pcs} | {dyads} |")
    lines.extend([
        "",
        "## Machine checks",
        "",
        f"- Out-of-mask pad / lead notes: {rendered['midiAudit']['outOfMaskPadNotes']} / "
        f"{rendered['midiAudit']['outOfMaskLeadNotes']}",
        f"- MIDI pad-voicing identity: {rendered['midiAudit']['padVoicedMatch']}",
        f"- MIDI lead primary / dyad presence: {rendered['midiAudit']['leadPrimaryMatch']} / "
        f"{rendered['midiAudit']['dyadPresenceMatch']}",
        "",
    ])
    text = "\n".join(lines)
    assert_no_template_names(text)
    return text


def progression_sheet_text(engine, label, bar_specs, plans, trace, rendered,
                           solver, seams):
    lead = lead_events_by_bar(trace)
    lines = [
        f"# Session {label}",
        "",
        f"- **Directive:** MVP8.4-CADENCE-ALGEBRA-DIR-1 (scratch observation)",
        f"- **Path:** composer-declared degree progression (`S^(m)(C,d,s,k)`)",
        f"- **Rotation mode:** `{solver['mode']}` / path `{solver['rotationPath']}` / "
        f"displacement `{solver['totalDisplacement']}`",
        f"- **Lead layer:** `{LEAD_MODE}`",
        f"- **Nodes:** {', '.join(spec['node'] for spec in bar_specs)}",
        f"- **Bars / duration:** {len(bar_specs)} / {rendered['durationMs']} ms",
        f"- **Guard:** `{json.dumps(common.GUARD, sort_keys=True)}`",
        "",
        f"- **Trace:** `{rendered['traceSha256']}`",
        f"- **WAV:** `{rendered['wavSha256']}`",
        f"- **MIDI:** `{rendered['midiSha256']}`",
        f"- **Deterministic two-pass:** `{rendered['reRenderMatch']}`",
        "",
        "## Progression bar table",
        "",
        "| Bar | Node | Office | Degree | Chaldean | Stride | Depth | Rotation | "
        "Root pc | Shape | Chord pcs | Bass pc | Bass MIDI | Lead pcs | Dyads |",
        "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    for bar, plan in zip(trace["bars"], plans):
        events = lead.get(bar["bar"], [])
        lead_pcs = sorted({event["primaryPc"] for event in events})
        dyads = sum(1 for event in events if event["partnerPc"] is not None)
        lines.append(
            f"| {bar['bar']} | {plan['node']} | {plan['office']} | {plan['degree']} | "
            f"{plan['chaldeanDegree']} | {plan['stride']} | {plan['depth']} | "
            f"{plan['rotation']} | {plan['rootPc']} | {plan['shape']} | "
            f"{plan['chordPcs']} | {plan['bassPc']} | {plan['bassMidi']} | "
            f"{lead_pcs} | {dyads} |")
    lines.extend(["", "## Seam variables", ""])
    for row in seams:
        lines.append(
            f"- {row['fromBar']}->{row['toBar']} `{row['fromNode']}` -> "
            f"`{row['toNode']}`: substitution_size {row['substitution_size']}, "
            f"{row['office_relation']}, {row['role_pair']}, "
            f"{row['governed_connectivity']}, {row['tier_relation']}")
    lines.extend([
        "",
        "## Machine checks",
        "",
        f"- Out-of-mask pad / lead notes: {rendered['midiAudit']['outOfMaskPadNotes']} / "
        f"{rendered['midiAudit']['outOfMaskLeadNotes']}",
        f"- MIDI pad-voicing identity: {rendered['midiAudit']['padVoicedMatch']}",
        f"- MIDI lead primary / dyad presence: {rendered['midiAudit']['leadPrimaryMatch']} / "
        f"{rendered['midiAudit']['dyadPresenceMatch']}",
        "",
    ])
    text = "\n".join(lines)
    assert_no_template_names(text)
    return text


def template_sheet_text(engine, label, bar_specs, plans, trace, rendered):
    lead = lead_events_by_bar(trace)
    lines = [
        f"# Session {label}",
        "",
        f"- **Directive:** MVP8.4-CADENCE-ALGEBRA-DIR-1 (scratch paired control)",
        f"- **Path:** landed template cycle (paired control)",
        f"- **Lead layer:** `{LEAD_MODE}`",
        f"- **Nodes:** {', '.join(spec['node'] for spec in bar_specs)}",
        f"- **Bars / duration:** {len(bar_specs)} / {rendered['durationMs']} ms",
        f"- **Guard:** `{json.dumps(common.GUARD, sort_keys=True)}`",
        "",
        f"- **Trace:** `{rendered['traceSha256']}`",
        f"- **WAV:** `{rendered['wavSha256']}`",
        f"- **MIDI:** `{rendered['midiSha256']}`",
        f"- **Deterministic two-pass:** `{rendered['reRenderMatch']}`",
        "",
        "## Control bar table",
        "",
        "| Bar | Node | Office | Requested | Active | Inversion | Chord pcs | "
        "Bass pc | Bass MIDI | Lead pcs | Dyads |",
        "|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    for bar, plan in zip(trace["bars"], plans):
        events = lead.get(bar["bar"], [])
        lead_pcs = sorted({event["primaryPc"] for event in events})
        dyads = sum(1 for event in events if event["partnerPc"] is not None)
        lines.append(
            f"| {bar['bar']} | {plan['node']} | {plan['office']} | "
            f"{plan['requestedTreatment']} | {plan['activeTreatment']} | "
            f"{plan['inversion']} | {plan['chordPcs']} | {plan['bassPc']} | "
            f"{plan['bassMidi']} | {lead_pcs} | {dyads} |")
    lines.extend([
        "",
        "## Machine checks",
        "",
        f"- Out-of-mask pad / lead notes: {rendered['midiAudit']['outOfMaskPadNotes']} / "
        f"{rendered['midiAudit']['outOfMaskLeadNotes']}",
        f"- MIDI pad-voicing identity: {rendered['midiAudit']['padVoicedMatch']}",
        f"- MIDI lead primary / dyad presence: {rendered['midiAudit']['leadPrimaryMatch']} / "
        f"{rendered['midiAudit']['dyadPresenceMatch']}",
        "",
    ])
    return "\n".join(lines)


def render_session(engine, label, bar_specs, plans, fade, palettes, out_dir,
                   path_kind, description):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    trace = obs.build_trace(engine, label, bar_specs, description, LEAD_MODE)
    rendered = obs.render_session(engine, trace, plans, fade, palettes, label,
                                  LEAD_MODE, out_dir)
    trace_path = out_dir / f"{label}.jsonl"
    trace_sha = engine.write_trace(trace_path, trace)
    rendered["tracePath"] = str(trace_path)
    rendered["traceSha256"] = trace_sha
    if path_kind == "degree":
        sheet = degree_sheet_text(engine, label, bar_specs, plans, trace, rendered)
    elif path_kind == "progression":
        sheet = progression_sheet_text(engine, label, bar_specs, plans, trace,
                                       rendered, {"mode": "explicit",
                                                  "rotationPath": [p["rotation"] for p in plans],
                                                  "totalDisplacement": 0},
                                       seam_variables(engine, plans))
    else:
        sheet = template_sheet_text(engine, label, bar_specs, plans, trace, rendered)
    sheet_path = out_dir / f"{label}_session_sheet.md"
    sheet_path.write_text(sheet, encoding="utf-8")
    rendered["sessionSheetPath"] = str(sheet_path)
    rendered["sessionSheetSha256"] = common.sha256_text(sheet)
    return trace, rendered


def render_progression_session(engine, label, bar_specs, palettes, out_dir,
                               description, voice_lead=False,
                               forced_rotations=None, path_kind="progression"):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    plans, solver = build_progression_plans(
        engine, bar_specs, palettes, voice_lead=voice_lead,
        forced_rotations=forced_rotations)
    trace = obs.build_trace(engine, label, bar_specs, description, LEAD_MODE)
    fade = common.load_fade()
    rendered = obs.render_session(engine, trace, plans, fade, palettes, label,
                                  LEAD_MODE, out_dir)
    trace_path = out_dir / f"{label}.jsonl"
    trace_sha = engine.write_trace(trace_path, trace)
    rendered["tracePath"] = str(trace_path)
    rendered["traceSha256"] = trace_sha
    seams = seam_variables(engine, plans)
    if path_kind == "progression":
        sheet = progression_sheet_text(engine, label, bar_specs, plans, trace,
                                       rendered, solver, seams)
    else:
        sheet = degree_sheet_text(engine, label, bar_specs, plans, trace, rendered)
    sheet_path = out_dir / f"{label}_session_sheet.md"
    sheet_path.write_text(sheet, encoding="utf-8")
    rendered["sessionSheetPath"] = str(sheet_path)
    rendered["sessionSheetSha256"] = common.sha256_text(sheet)
    rendered["solver"] = solver
    rendered["seams"] = seams
    return trace, rendered, plans, solver


def dyad_census(trace, lead_mode=LEAD_MODE, plans=None):
    primary = 0
    dyads = 0
    partners = 0
    unison = 0
    out_of_mask = 0
    for event in obs.lead_events(trace, lead_mode, plans):
        bar = next(row for row in trace["bars"] if row["bar"] == event["bar"])
        container = set(bar["pitchClasses"])
        primary += 1
        if event["primaryPc"] not in container:
            out_of_mask += 1
        if event["partnerPc"] is not None:
            dyads += 1
            partners += 1
            if event["partnerPc"] == event["primaryPc"]:
                unison += 1
            if event["partnerPc"] not in container:
                out_of_mask += 1
    return {"primarySteps": primary, "dyadSteps": dyads, "partnerNotes": partners,
            "dyadUnisonLeaks": unison, "outOfMaskLeadNotes": out_of_mask}


def legality_sweep(engine, palettes, masks):
    violations = {"outOfMaskPadNotes": 0, "outOfMaskLeadNotes": 0,
                  "dyadUnisonLeaks": 0, "bassMismatch": 0}
    stack_evaluations = 0
    lead_evaluations = 0
    for mask in masks:
        for phase in range(12):
            node = f"{mask}@{phase}"
            row = engine.nodes[node]
            container = set(int(pc) for pc in row["pitchClasses"])
            degrees = ladder.container_from_row(row)
            for d in range(1, 8):
                for s in (1, 2, 3):
                    for k in (3, 4):
                        for m in range(k):
                            stack_evaluations += 1
                            stack = ladder.degree_stack(degrees, d, s, k, m)
                            for pc in stack["pitchClasses"]:
                                if pc not in container:
                                    violations["outOfMaskPadNotes"] += 1
                            if stack["rootPc"] not in container:
                                violations["outOfMaskPadNotes"] += 1
                            if stack["rootPc"] != degrees[stack["rootDegree"] - 1]:
                                violations["bassMismatch"] += 1
    for mask in masks:
        node = f"{mask}@0"
        specs = [{"node": node, "k": 12, "role": "dwell"},
                 {"node": node, "k": 12, "role": "dwell"}]
        trace = obs.build_trace(engine, f"legality-{mask}", specs,
                                "degree-ladder legality sweep", LEAD_MODE)
        census = dyad_census(trace)
        lead_evaluations += census["primarySteps"]
        violations["outOfMaskLeadNotes"] += census["outOfMaskLeadNotes"]
        violations["dyadUnisonLeaks"] += census["dyadUnisonLeaks"]
    return {
        "masks": list(masks),
        "phases": 12,
        "stackEvaluations": stack_evaluations,
        "leadEvaluations": lead_evaluations,
        "violations": violations,
        "pass": all(value == 0 for value in violations.values()),
    }


def parse_progression(text):
    """node:degree/stride/depth[/rotation] entries separated by ';'."""
    specs = []
    for piece in text.split(";"):
        piece = piece.strip()
        if not piece:
            continue
        node, numbers = piece.split(":")
        values = [int(value) for value in numbers.split("/")]
        spec = {"node": node, "degree": values[0], "stride": values[1],
                "depth": values[2], "k": 12, "role": "dwell"}
        if len(values) > 3:
            spec["rotation"] = values[3]
        specs.append(spec)
    return specs


def main():
    parser = argparse.ArgumentParser(description="MVP8.4 degree/progression driver")
    parser.add_argument("--progression", required=True,
                        help="node:degree/stride/depth[/rotation]; ...")
    parser.add_argument("--voice-lead", action="store_true")
    parser.add_argument("--label", default="progression")
    parser.add_argument("--out-dir", default=None)
    args = parser.parse_args()
    engine = common.load_engine()
    _, palettes, _ = common.palettes_and_offices(engine)
    specs = parse_progression(args.progression)
    out_dir = Path(args.out_dir) if args.out_dir else common.SCRATCH / "sessions"
    trace, rendered, plans, solver = render_progression_session(
        engine, args.label, specs, palettes, out_dir,
        f"MVP8.4 progression {args.label}", voice_lead=args.voice_lead)
    print(json.dumps({
        "label": args.label,
        "bars": len(plans),
        "solver": solver,
        "wavPath": rendered["wavPath"],
        "midiPath": rendered["midiPath"],
        "midiAudit": rendered["midiAudit"],
        "sessionSheetPath": rendered["sessionSheetPath"],
    }, indent=2))


if __name__ == "__main__":
    main()
