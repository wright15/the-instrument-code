#!/usr/bin/env python3
"""MVP8.3-DEGREE-LADDER-DIR-1 Task C successor driver.

Reuses the pinned landed renderer chain (legato/fade + score-true SMF-1 writer)
without editing the landed Node Observatory. Adds the degree-native plan
builder (stack-root bass per L2) and degree-native session sheets (no template
names). Read-only against the repository.
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, "/home/erick/workspace/scratch-governed-loop-run/mvp8_3_degree_ladder")
sys.path.insert(0, "/home/erick/workspace/scratch-governed-loop-run/mvp8_3_degree_ladder/task-a")
sys.path.insert(0, str(Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_2_observatory_ledger")))
sys.path.insert(0, "/home/erick/projects/integrated-release/tools/governed-loop/node-observatory")

import mvp8_3_common as common
import degree_ladder as ladder
import node_observatory_engine as obs

LEAD_MODE = "governed_dyads_structural"
TEMPLATE_TOKENS = ["full", "bare", "shell", "triad", "triad_9", "seventh",
                   "ninth_drop5", "rootless_13th", "cycle"]
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


def lead_events_by_bar(trace):
    grouped = {}
    for event in obs.lead_events(trace, LEAD_MODE):
        grouped.setdefault(event["bar"], []).append(event)
    return grouped


def degree_sheet_text(engine, label, bar_specs, plans, trace, rendered):
    lead = lead_events_by_bar(trace)
    lines = [
        f"# Session {label}",
        "",
        f"- **Directive:** MVP8.3-DEGREE-LADDER-DIR-1 (scratch observation)",
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
        "| Bar | Node | Office | Degree | Stride | Depth | Rotation | Root degree | "
        "Root pc | Shape | Chord pcs | Bass pc | Bass MIDI | Lead pcs | Dyads |",
        "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    for bar, plan in zip(trace["bars"], plans):
        events = lead.get(bar["bar"], [])
        lead_pcs = sorted({event["primaryPc"] for event in events})
        dyads = sum(1 for event in events if event["partnerPc"] is not None)
        lines.append(
            f"| {bar['bar']} | {plan['node']} | {plan['office']} | {plan['degree']} | "
            f"{plan['stride']} | {plan['depth']} | {plan['rotation']} | "
            f"{plan['rootDegree']} | {plan['rootPc']} | {plan['shape']} | "
            f"{plan['chordPcs']} | {plan['bassPc']} | {plan['bassMidi']} | "
            f"{lead_pcs} | {dyads} |")
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
        f"- **Directive:** MVP8.3-DEGREE-LADDER-DIR-1 (scratch paired control)",
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
        sheet_name = f"{label}_session_sheet.md"
    else:
        sheet = template_sheet_text(engine, label, bar_specs, plans, trace, rendered)
        sheet_name = f"{label}_session_sheet.md"
    sheet_path = out_dir / sheet_name
    sheet_path.write_text(sheet, encoding="utf-8")
    rendered["sessionSheetPath"] = str(sheet_path)
    rendered["sessionSheetSha256"] = common.sha256_text(sheet)
    return trace, rendered


def dyad_census(trace, lead_mode=LEAD_MODE):
    primary = 0
    dyads = 0
    partners = 0
    unison = 0
    out_of_mask = 0
    for event in obs.lead_events(trace, lead_mode):
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
                        stack_evaluations += 1
                        stack = ladder.degree_stack(degrees, d, s, k, 0)
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
