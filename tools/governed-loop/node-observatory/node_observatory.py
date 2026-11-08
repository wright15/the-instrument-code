#!/usr/bin/env python3
"""MVP8.2-OBS-LEDGER-DIR-1 Task C: declarative observe() driver and the
one-page session sheet.

Read-only against the repository. All renders and receipts live under the
MVP-8.2 scratch realm.
"""
import argparse
import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, "/home/erick/workspace/scratch-governed-loop-run/mvp8_2_observatory_ledger")
sys.path.insert(0, "/home/erick/workspace/scratch-governed-loop-run/mvp8_2_observatory_ledger/task-b")
import mvp8_2_common as common
import node_observatory_engine as obs

TASK_C = common.SCRATCH / "task-c"
DEFAULT_OUT = common.SCRATCH / "task-d" / "sessions"
MODE_TO_MASK = {name: mask for mask, name in obs.MODE_NAMES.items()}


def resolve_node(engine, text):
    text = text.strip()
    if text in obs.FAMILIES:
        return [f"{mask}@0" for mask in obs.FAMILIES[text]]
    if "@" in text:
        mask_text, phase_text = text.split("@", 1)
        node = f"{int(mask_text)}@{int(phase_text)}"
        if node not in engine.nodes:
            common.stop("S-4", f"unknown node {node}")
        return [node]
    if text in MODE_TO_MASK:
        return [f"{MODE_TO_MASK[text]}@0"]
    common.stop("S-4", f"unresolved node/family/mode {text!r}")
    raise AssertionError


def resolve_nodes(engine, nodes):
    if isinstance(nodes, str):
        cleaned = nodes.replace(",", " ")
        return [node for piece in cleaned.split() for node in resolve_node(engine, piece)]
    resolved = []
    for item in nodes:
        resolved.extend(resolve_node(engine, item))
    return resolved


def governed_path(engine, core, source, target):
    allowed = set(core["governed"])
    if source == target:
        return [source]
    previous = {source: None}
    queue = [source]
    head = 0
    while head < len(queue):
        node = queue[head]
        head += 1
        for neighbor in engine.planner.adj.get(node, ()):
            if neighbor not in allowed or neighbor in previous:
                continue
            previous[neighbor] = node
            if neighbor == target:
                path = [target]
                while path[-1] != source:
                    path.append(previous[path[-1]])
                return list(reversed(path))
            queue.append(neighbor)
    common.stop("S-4", f"no governed path {source} -> {target}")


def build_bar_specs(engine, core, nodes, bars, focal_set):
    specs = []
    if len(nodes) == 1:
        if isinstance(bars, int):
            counts = [12] * bars
        else:
            counts = [int(k) for k in bars]
        for k in counts:
            specs.append({"node": nodes[0], "k": k})
    else:
        dwell = int(bars) if isinstance(bars, int) else 3
        for index, node in enumerate(nodes):
            for _ in range(dwell):
                specs.append({"node": node, "k": 12})
            if index < len(nodes) - 1:
                path = governed_path(engine, core, node, nodes[index + 1])
                for transit in path[1:-1]:
                    specs.append({"node": transit, "k": 5})
    if focal_set not in (None, "lookup_default", "lookupDefault"):
        for spec in specs:
            row = engine.nodes[spec["node"]]
            available = {sub["baseSubnodeId"] for sub in row["anchoredSubnodes"]}
            available |= {sub["baseSubnodeId"] for sub in row["allSubsets"]}
            if focal_set in available:
                spec["focalOverride"] = focal_set
    return specs


def acoustic_summary(lens, fade, wav_path, trace):
    samples = lens.load_wav(wav_path)
    windows = lens.window_descriptors(samples, np.hanning(lens.FFT_SIZE))
    global_row = lens.aggregate(windows, 0, trace["summary"]["durationMs"])
    bar_rows = []
    for bar in trace["bars"]:
        row = lens.aggregate(windows, bar["startMs"], bar["startMs"] + bar["durationMs"])
        bar_rows.append({
            "bar": bar["bar"],
            "centroidOct": row["centroidOct"],
            "spreadOct": row["spreadOct"],
            "windows": row["windows"],
        })
    seam_meter = fade.legato.SeamMeter(samples.astype(np.float64))
    boundaries = [bar["startMs"] for bar in trace["bars"][1:]]
    seams = seam_meter.measure(boundaries)
    return {
        "global": {"centroidOct": global_row["centroidOct"],
                   "spreadOct": global_row["spreadOct"],
                   "windows": global_row["windows"]},
        "bars": bar_rows,
        "seam": {"boundaries": seams["boundaries"],
                 "medianDepthDb": seams["medianDepthDb"],
                 "maxDepthDb": seams["maxDepthDb"]},
        "maxAbsLast32": int(np.max(np.abs(samples[-32:]))),
        "sampleCount": int(len(samples)),
    }


def rub_census(trace, plans, lead_events):
    rubs = 0
    per_bar = {}
    phase_delta = {"minorSecond": 0, "majorSeventh": 0}
    pairs = []
    for event in lead_events:
        bar = next(row for row in trace["bars"] if row["bar"] == event["bar"])
        plan = next(row for row in plans if row["bar"] == event["bar"])
        pad = sorted(set(plan["chordPcs"]))
        notes = [event["primaryPc"]]
        if event["partnerPc"] is not None:
            notes.append(event["partnerPc"])
        for note in notes:
            hits = [pc for pc in pad if (note - pc) % 12 in (1, 11)]
            rubs += len(hits)
            per_bar[event["bar"]] = per_bar.get(event["bar"], 0) + len(hits)
            for pc in hits:
                pairs.append({"bar": event["bar"], "leadPc": note, "padPc": pc})
        delta = (event["primaryPc"] - bar["phase"]) % 12
        if delta == 1:
            phase_delta["minorSecond"] += 1
        elif delta == 11:
            phase_delta["majorSeventh"] += 1
    return {
        "rubs": rubs,
        "perBar": {str(key): value for key, value in sorted(per_bar.items())},
        "pairs": pairs[:64],
        "phaseDelta": phase_delta,
    }


def bar_action_counts(trace):
    counts = {}
    for step in trace["microSteps"]:
        row = counts.setdefault(step["bar"], {})
        action = step["governanceAction"]
        row[action] = row.get(action, 0) + 1
    return counts


def write_sheet(path, receipt):
    lines = []
    lines.append(f"# Session {receipt['label']}")
    lines.append("")
    lines.append(f"- **Directive:** {receipt['directive']} (scratch observation)")
    lines.append(f"- **Mode / voicing / inversion / lead:** "
                 f"`{receipt['mode']}` / `{receipt['voicing']}` / "
                 f"`{receipt['inversion']}` / `{receipt['lead']}`")
    lines.append(f"- **Nodes:** {', '.join(receipt['nodes'])}")
    lines.append(f"- **Bars / duration:** {receipt['barCount']} / {receipt['durationMs']} ms")
    lines.append(f"- **Guard:** `{json.dumps(common.GUARD, sort_keys=True)}`")
    lines.append("")
    if receipt["rendered"]:
        lines.append(f"- **Trace:** `{receipt['traceSha256']}`")
        lines.append(f"- **WAV:** `{receipt['wavSha256']}`")
        lines.append(f"- **MIDI:** `{receipt['midiSha256']}`")
        lines.append(f"- **Deterministic two-pass:** `{receipt['reRenderMatch']}`")
    else:
        lines.append("- **Not rendered:** the requested treatment is unavailable "
                     "on at least one node under strict study mode.")
    lines.append("")
    lines.append("## Bar table")
    lines.append("")
    lines.append("| Bar | Node | Office | Role | Focal | Treatment (inv) | Chord pcs | "
                 "Bass pc | Lead notes | Dyads | Actions |")
    lines.append("|---|---|---|---|---|---|---|---|---|---|---|")
    actions = bar_action_counts(receipt["_trace"])
    lead_by_bar = {}
    for event in receipt["_leadEvents"]:
        lead_by_bar.setdefault(event["bar"], []).append(event)
    for bar, plan in zip(receipt["_trace"]["bars"], receipt["_plans"]):
        focal = bar["focalContext"]["subnodeId"]
        treatment = f"{plan['activeTreatment']} ({plan['inversion']})"
        if plan["fallbackUsed"]:
            treatment += " FB"
        events = lead_by_bar.get(bar["bar"], [])
        dyads = sum(1 for event in events if event["partnerPc"] is not None)
        line = (f"| {bar['bar']} | {bar['node']} | {plan['office']} | {bar['role']} | "
                f"{focal} | {treatment} | {plan['chordPcs']} | {plan['bassPc']} | "
                f"{len(events)} | {dyads} | {json.dumps(actions.get(bar['bar'], {}), sort_keys=True)} |")
        lines.append(line)
    lines.append("")
    lines.append("## Affordance report")
    lines.append("")
    failures = receipt["failures"]
    if failures:
        for failure in failures:
            lines.append(f"- bar {failure['bar']} `{failure['node']}`: requested "
                         f"`{failure['requested']}` unavailable; missing pc "
                         f"{failure['missingPc']}; action `{failure['status']}`.")
    else:
        lines.append("- All requested treatments afford on every bar.")
    fallbacks = [plan for plan in receipt["_plans"] if plan["fallbackUsed"]]
    if fallbacks:
        lines.append("")
        lines.append("Fallbacks used:")
        for plan in fallbacks:
            lines.append(f"- bar {plan['bar']} `{plan['node']}`: "
                         f"`{plan['requestedTreatment']}` -> `{plan['activeTreatment']}` "
                         f"(missing {plan['missingPc']}).")
    lines.append("")
    lines.append("## Lead and dyad census")
    lines.append("")
    lines.append(f"- Primary steps: {receipt['leadCensus']['primarySteps']}")
    lines.append(f"- Dyad steps: {receipt['leadCensus']['dyadSteps']}")
    lines.append(f"- Partner notes: {receipt['leadCensus']['partnerNotes']}")
    lines.append(f"- Dyad unison leaks: {receipt['leadCensus']['dyadUnisonLeaks']}")
    lines.append(f"- Out-of-mask pad / lead notes: "
                 f"{receipt['leadCensus']['outOfMaskPadNotes']} / "
                 f"{receipt['leadCensus']['outOfMaskLeadNotes']}")
    lines.append(f"- MIDI pad-voicing identity: {receipt['leadCensus']['padVoicedMatch']}")
    lines.append(f"- MIDI lead primary / dyad presence: "
                 f"{receipt['leadCensus']['leadPrimaryMatch']} / "
                 f"{receipt['leadCensus']['dyadPresenceMatch']}")
    if receipt["rendered"]:
        lines.append("")
        lines.append("## Acoustic summary (measured, Modality 2)")
        lines.append("")
        acoustic = receipt["acoustic"]
        lines.append(f"- Global log-centroid: {acoustic['global']['centroidOct']:.6f} oct; "
                     f"spread {acoustic['global']['spreadOct']:.6f} oct "
                     f"({acoustic['global']['windows']} windows)")
        for row in acoustic["bars"]:
            lines.append(f"- Bar {row['bar']}: centroid {row['centroidOct']:.6f} oct, "
                         f"spread {row['spreadOct']:.6f} oct")
        lines.append(f"- Seam depth: median {acoustic['seam']['medianDepthDb']:.6f} dB, "
                     f"max {acoustic['seam']['maxDepthDb']:.6f} dB")
        lines.append(f"- Terminal max |last 32 samples|: {acoustic['maxAbsLast32']}")
        lines.append("")
        lines.append("## Rub census against the sounding pad")
        lines.append("")
        lines.append(f"- Rub incidences (lead vs pad, interval 1 or 11): {receipt['rubs']['rubs']}")
        lines.append(f"- Per bar: {json.dumps(receipt['rubs']['perBar'], sort_keys=True)}")
        lines.append(f"- Phase-delta census (task-D style): "
                     f"minorSecond {receipt['rubs']['phaseDelta']['minorSecond']}, "
                     f"majorSeventh {receipt['rubs']['phaseDelta']['majorSeventh']}")
    lines.append("")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return common.sha256_file(path)


def run_session(engine, core, label, bar_specs, treatment, inversion, lead_mode,
                mode, focal_set, out_dir, description=None, preset=None):
    out_dir = Path(out_dir)
    fade, palettes, office_lookup = common.palettes_and_offices(engine)
    lens = common.load_lens()
    specs = [dict(spec) for spec in bar_specs]
    if focal_set not in (None, "lookup_default", "lookupDefault"):
        for spec in specs:
            row = engine.nodes[spec["node"]]
            available = {sub["baseSubnodeId"] for sub in row["anchoredSubnodes"]}
            available |= {sub["baseSubnodeId"] for sub in row["allSubsets"]}
            if focal_set in available:
                spec["focalOverride"] = focal_set
    trace = obs.build_trace(engine, label, specs,
                            description or f"MVP8.2 session {label}", lead_mode)
    trace_path = out_dir / f"{label}.jsonl"
    out_dir.mkdir(parents=True, exist_ok=True)
    trace_sha = engine.write_trace(trace_path, trace)
    plans = obs.build_bar_plans(engine, specs, treatment, inversion, mode, palettes)
    failures = [{"bar": plan["bar"], "node": plan["node"],
                 "requested": plan["requestedTreatment"], "status": plan["status"],
                 "missingPc": plan["missingPc"]}
                for plan in plans if plan["status"] == "skip"]
    rendered = not failures
    events = obs.lead_events(trace, lead_mode)
    if lead_mode == "off" or not rendered:
        events = []
    primary_steps = len(events)
    dyad_steps = sum(1 for event in events if event["partnerPc"] is not None)
    partner_notes = dyad_steps
    lead_census = {
        "primarySteps": primary_steps,
        "dyadSteps": dyad_steps,
        "partnerNotes": partner_notes,
        "dyadUnisonLeaks": sum(1 for event in events
                               if event["partnerPc"] is not None
                               and event["partnerPc"] == event["primaryPc"]),
        "outOfMaskPadNotes": 0,
        "outOfMaskLeadNotes": 0,
        "padVoicedMatch": None,
        "leadPrimaryMatch": None,
        "dyadPresenceMatch": None,
    }
    receipt = {
        "schemaVersion": "governed-loop.mvp8_2-session.v1",
        "directive": "MVP8.2-OBS-LEDGER-DIR-1",
        "task": "MVP8.2-TC",
        "label": label,
        "preset": preset,
        "nodes": sorted({spec["node"] for spec in specs}),
        "mode": mode,
        "voicing": treatment,
        "inversion": inversion,
        "lead": lead_mode,
        "focalSet": focal_set,
        "barCount": len(trace["bars"]),
        "durationMs": trace["summary"]["durationMs"],
        "tracePath": str(trace_path),
        "traceSha256": trace_sha,
        "rendered": rendered,
        "failures": failures,
        "barPlan": plans,
        "barFocalSequence": [{"bar": bar["bar"], "node": bar["node"],
                              "role": bar["role"],
                              "focal": bar["focalContext"]["subnodeId"]}
                             for bar in trace["bars"]],
        "barContainers": [{"bar": bar["bar"], "node": bar["node"],
                           "pitchClasses": list(bar["pitchClasses"])}
                          for bar in trace["bars"]],
        "emittedSteps": [{"bar": step["bar"], "sub": step["sub"],
                          "emittedPc": step["emittedPc"]}
                         for step in trace["microSteps"]],
        "summary": {"focalSwitches": trace["summary"]["focalSwitches"],
                    "outOfMaskPitches": trace["summary"]["outOfMaskPitches"]},
        "leadCensus": lead_census,
        "rubs": None,
        "acoustic": None,
        "guardFlags": common.GUARD,
        "llmCalls": 0,
        "repoWrites": 0,
        "_trace": trace,
        "_plans": plans,
        "_leadEvents": events,
    }
    if rendered:
        render = obs.render_session(engine, trace, plans, fade, palettes,
                                    label, lead_mode, out_dir)
        receipt.update({
            "wavPath": render["wavPath"],
            "midiPath": render["midiPath"],
            "wavSha256": render["wavSha256"],
            "midiSha256": render["midiSha256"],
            "reRenderMatch": render["reRenderMatch"],
            "samples": render["samples"],
            "expectedSamples": render["expectedSamples"],
            "rmsMilli": render["rmsMilli"],
            "peakQ15": render["peakQ15"],
            "clippedSamples": render["clippedSamples"],
            "nonFiniteSamples": render["nonFiniteSamples"],
        })
        audit = render["midiAudit"]
        lead_census.update({
            "outOfMaskPadNotes": audit["outOfMaskPadNotes"],
            "outOfMaskLeadNotes": audit["outOfMaskLeadNotes"],
            "padVoicedMatch": audit["padVoicedMatch"],
            "leadPrimaryMatch": audit["leadPrimaryMatch"],
            "dyadPresenceMatch": audit["dyadPresenceMatch"],
        })
        receipt["rubs"] = rub_census(trace, plans, events)
        receipt["acoustic"] = acoustic_summary(lens, fade, Path(render["wavPath"]), trace)
    sheet_path = out_dir / f"{label}_session_sheet.md"
    sheet_sha = write_sheet(sheet_path, receipt)
    receipt["sessionSheetPath"] = str(sheet_path)
    receipt["sessionSheetSha256"] = sheet_sha
    clean = {key: value for key, value in receipt.items() if not key.startswith("_")}
    receipt_path = out_dir / f"{label}_receipt.json"
    common.write_json(receipt_path, clean, floats_allowed=True)
    clean["receiptPath"] = str(receipt_path)
    return clean


def observe(nodes, voicing="cycle", inversion=0, lead="governed_dyads_structural",
            bars=3, focal_set="lookup_default", mode="walk", out_dir=None,
            label=None, description=None, preset=None):
    engine = common.load_engine()
    m8 = common.load_m8()
    core = m8.strong_core(engine.planner)
    resolved = resolve_nodes(engine, nodes)
    specs = build_bar_specs(engine, core, resolved, bars, focal_set)
    label = label or f"observe-{resolved[0].replace('@', '-')}"
    out_dir = out_dir or DEFAULT_OUT
    return run_session(engine, core, label, specs, voicing, inversion, lead,
                       mode, focal_set, out_dir, description=description, preset=preset)


def main():
    parser = argparse.ArgumentParser(description="MVP8.2 node observatory")
    parser.add_argument("--nodes", required=True,
                        help="mask@phase, mode name, or family (comma/space separated)")
    parser.add_argument("--voicing", default="cycle", choices=obs.TREATMENTS + ["cycle"])
    parser.add_argument("--inversion", default="0")
    parser.add_argument("--lead", default="governed_dyads_structural", choices=obs.LEAD_MODES)
    parser.add_argument("--bars", default="3")
    parser.add_argument("--focal-set", default="lookup_default")
    parser.add_argument("--mode", default="walk", choices=["study", "walk"])
    parser.add_argument("--out-dir", default=None)
    parser.add_argument("--label", default=None)
    args = parser.parse_args()
    inversion = args.inversion if args.inversion == "voice_led" else int(args.inversion)
    bars = int(args.bars)
    result = observe(args.nodes, args.voicing, inversion, args.lead, bars,
                     args.focal_set, args.mode, args.out_dir, args.label)
    print(json.dumps({
        "label": result["label"],
        "rendered": result["rendered"],
        "wavSha256": result.get("wavSha256"),
        "midiSha256": result.get("midiSha256"),
        "sessionSheetPath": result["sessionSheetPath"],
        "receiptPath": result["receiptPath"],
    }, indent=2))


if __name__ == "__main__":
    main()
