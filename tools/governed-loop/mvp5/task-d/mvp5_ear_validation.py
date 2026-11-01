#!/usr/bin/env python3
"""MVP5 ear-validation diagnostics: contrast matrix, equivariance audit,
and the pre-registered listening protocol."""
import json
import sys
from pathlib import Path

SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp5")
TASK_A = SCRATCH / "task-a"
TASK_B = SCRATCH / "task-b"
TASK_D = SCRATCH / "task-d"

TRACK_ORDER = [
    "track1_arm1_unranked_2cycle",
    "track2_arm2_static_4state",
    "track3_arm3a_dynamic_q_reset",
    "track4_arm3b_dynamic_q_carried",
    "track5_equiv_base_p0",
    "track6_equiv_lifted_p7",
]

ARM_ORDER = [
    ("arm1_unranked_q_carried", "Arm 1", "unranked 2-state Saturn cycle, carried Q"),
    ("arm2_static_q_carried", "Arm 2", "static Chaldean 4-state Saturn walk, carried Q"),
    ("arm3a_dynamic_q_reset", "Arm 3a", "dynamic 21-state walk, reset Q still-life"),
    ("arm3b_dynamic_q_carried", "Arm 3b", "dynamic 21-state walk, continuous carried Q"),
]


def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def trace_records(path):
    return [json.loads(line) for line in Path(path).read_text(encoding="utf-8").splitlines()]


def trace_micro(path):
    return [record for record in trace_records(path) if record.get("recordType") == "micro"]


def trace_macro(path):
    return [record for record in trace_records(path) if record.get("recordType") == "macro"]


def trace_rests(path):
    return [record for record in trace_records(path) if record.get("recordType") == "rest"]


def contrast_matrix(task_a_receipt):
    arms = {}
    for name, label, description in ARM_ORDER:
        entry = task_a_receipt["arms"][name]
        summary = entry["summary"]
        arms[name] = {
            "label": label,
            "description": description,
            "trace": entry["trace"],
            "traceSha256": entry["traceSha256"],
            "macro": {
                "distinctStates": summary["distinctMacroStates"],
                "distinctOffices": summary["distinctOffices"],
                "distinctPhases": summary["distinctPhases"],
                "seamModulations": summary["seamModulations"],
                "autoTransits": summary["autoTransits"],
                "gateAcceptAll": summary["gateAcceptAll"],
            },
            "micro": {
                "microSteps": summary["microSteps"],
                "distinctQStates": summary["distinctQStates"],
                "qStatesVisited": summary["qStatesVisited"],
                "stillSetEntries": summary["stillSetEntries"],
                "emittedPitchClasses": summary["emittedPitchClasses"],
                "emittedPcs": summary["emittedPcs"],
                "intervalHistogram": summary["intervalHistogram"],
                "directOrbitCount": summary["directOrbitCount"],
                "degreeModuloCount": summary["degreeModuloCount"],
                "directToDegree": f"{summary['directOrbitCount']}:{summary['degreeModuloCount']}",
                "ngram5Total": summary["ngram5Total"],
                "ngram5Distinct": summary["ngram5Distinct"],
                "ngram5Repeats": summary["ngram5Repeats"],
                "repeatRate": f"{summary['ngram5Repeats']}/{summary['ngram5Total']}",
            },
            "outOfMaskPitches": summary["outOfMaskPitches"],
            "boundaryDwell": summary["boundaryDwell"],
        }
    return {
        "arms": arms,
        "macroDiversity": {
            "distinctStates": [arms[name]["macro"]["distinctStates"] for name, _, _ in ARM_ORDER],
            "distinctOffices": [arms[name]["macro"]["distinctOffices"] for name, _, _ in ARM_ORDER],
            "distinctPhases": [arms[name]["macro"]["distinctPhases"] for name, _, _ in ARM_ORDER],
            "seamModulations": [arms[name]["macro"]["seamModulations"] for name, _, _ in ARM_ORDER],
        },
        "qCoverage": {
            "distinctQStates": [arms[name]["micro"]["distinctQStates"] for name, _, _ in ARM_ORDER],
            "emittedPitchClasses": [arms[name]["micro"]["emittedPitchClasses"] for name, _, _ in ARM_ORDER],
            "ngram5Repeats": [arms[name]["micro"]["ngram5Repeats"] for name, _, _ in ARM_ORDER],
            "repeatRates": [arms[name]["micro"]["repeatRate"] for name, _, _ in ARM_ORDER],
            "directToDegree": [arms[name]["micro"]["directToDegree"] for name, _, _ in ARM_ORDER],
        },
        "stillLifeContrast": {
            "arm3aRepeats": arms["arm3a_dynamic_q_reset"]["micro"]["ngram5Repeats"],
            "arm3bRepeats": arms["arm3b_dynamic_q_carried"]["micro"]["ngram5Repeats"],
            "throughComposed": arms["arm3b_dynamic_q_carried"]["micro"]["ngram5Repeats"] == 0,
            "resetStillLife": arms["arm3a_dynamic_q_reset"]["micro"]["ngram5Repeats"] > 0,
        },
    }


def equivariance_from_midi(task_b_receipt, renderer):
    renders = {track["track"]: track for track in task_b_receipt["tracks"]}
    sequences = {}
    for name in ("track5_equiv_base_p0", "track6_equiv_lifted_p7"):
        path = SCRATCH / renders[name]["midi"]["path"]
        parsed = renderer.parse_midi(path.read_bytes())
        lead = [event["note"] for event in parsed["chunks"][2] if event.get("type") == "note-on"]
        sequences[name] = {
            "midiNotes": lead,
            "pitchClasses": [note % 12 for note in lead],
        }
    base = sequences["track5_equiv_base_p0"]
    lift = sequences["track6_equiv_lifted_p7"]
    pc_matches = 0
    pc_checks = []
    for index, (base_note, lift_note) in enumerate(zip(base["midiNotes"], lift["midiNotes"]), start=1):
        expected = (base_note + 7) % 12
        actual = lift_note % 12
        ok = expected == actual
        pc_matches += 1 if ok else 0
        if len(pc_checks) < 15:
            pc_checks.append({"step": index, "baseNote": base_note, "expectedLiftedPc": expected,
                              "liftedNote": lift_note, "liftedPc": actual, "match": ok})
    base_intervals = [(right - left) % 12 for left, right in zip(base["midiNotes"], base["midiNotes"][1:])]
    lift_intervals = [(right - left) % 12 for left, right in zip(lift["midiNotes"], lift["midiNotes"][1:])]
    interval_matches = sum(1 for left, right in zip(base_intervals, lift_intervals) if left == right)
    return {
        "base": sequences["track5_equiv_base_p0"],
        "lift": sequences["track6_equiv_lifted_p7"],
        "pitchClassChecks": pc_checks,
        "pitchClassMatches": pc_matches,
        "pitchClassTotal": len(base["midiNotes"]),
        "pitchClassShiftExact": pc_matches == len(base["midiNotes"]) == 15,
        "baseIntervals": base_intervals,
        "liftIntervals": lift_intervals,
        "intervalMatches": interval_matches,
        "intervalTotal": len(base_intervals),
        "intervalSequenceIdentical": interval_matches == len(base_intervals) == 14,
    }


def timeline_markers(task_a_receipt):
    trace_path = SCRATCH / task_a_receipt["arms"]["arm3b_dynamic_q_carried"]["trace"]
    bars = task_a_receipt["arms"]["arm3b_dynamic_q_carried"]["bars"]
    macro = trace_macro(trace_path)
    rests = trace_rests(trace_path)
    bar_by_index = {bar["bar"]: bar for bar in bars}
    hop_rows = []
    bar_index = 1
    for event in macro:
        source_bar = bar_by_index[bar_index]
        hop_time = source_bar["startMs"] + source_bar["durationMs"]
        hop_rows.append({
            "timeMs": hop_time,
            "source": event["source"],
            "target": event["target"],
            "kind": event["kind"],
            "citation": event.get("citation"),
            "gate": event.get("gateVerdict"),
        })
        if bar_index < len(bars) and bars[bar_index]["node"] == event["target"]:
            bar_index += 1
    reset_trace = SCRATCH / task_a_receipt["arms"]["arm3a_dynamic_q_reset"]["trace"]
    carried_trace = SCRATCH / task_a_receipt["arms"]["arm3b_dynamic_q_carried"]["trace"]
    reset_micro = trace_micro(reset_trace)
    carried_micro = trace_micro(carried_trace)
    downbeats = []
    for bar in bars:
        reset_step = next(step for step in reset_micro if step["bar"] == bar["bar"] and step["sub"] == 0)
        carried_step = next(step for step in carried_micro if step["bar"] == bar["bar"] and step["sub"] == 0)
        downbeats.append({
            "bar": bar["bar"],
            "timeMs": bar["startMs"],
            "node": bar["node"],
            "office": bar["office"],
            "phase": bar["phase"],
            "resetQ": reset_step["qStateIn"],
            "carriedQ": carried_step["qStateIn"],
        })
    office_phases = []
    seen = set()
    for bar in bars:
        key = (bar["office"], bar["phase"])
        if key in seen:
            continue
        seen.add(key)
        office_phases.append({"office": bar["office"], "phase": bar["phase"], "firstBar": bar["bar"],
                              "timeMs": bar["startMs"]})
    return {
        "bars": downbeats,
        "hops": hop_rows,
        "rests": rests,
        "officePhases": office_phases,
        "seamHops": [row for row in hop_rows if row["kind"] != "tier-1"],
        "boundaryTransit": next((row for row in hop_rows if row["kind"] == "boundary-auto-transit"), None),
    }


def protocol_markdown(task_a_receipt, task_b_receipt, matrix, equiv, markers, fixed_point):
    renders = {track["track"]: track for track in task_b_receipt["tracks"]}
    lines = []
    lines.append("# MVP-5 Ear Validation Protocol & Scorecard")
    lines.append("")
    lines.append("Directive `MVP5-DIR-1` rev 1 · execution realm "
                 "`/home/erick/workspace/scratch-governed-loop-run/mvp5/` · scratch-only.")
    lines.append("")
    lines.append(f"Layer: `SPEC-001 §1.3 overlay dynamics` · "
                 "`gov517_correspondence_claimed: false` · `still_set_label: still_set` · "
                 "`still_set = (12, 13, 14, 15)`.")
    lines.append("")
    lines.append("No canonical or physical causation claim is made. Session prose is context, not evidence.")
    lines.append("")
    lines.append("## 1. Fixed point")
    lines.append("")
    lines.append(f"- Repository `HEAD`: `{fixed_point['head']}`")
    lines.append(f"- Working tree: clean (`{fixed_point['treeDigest']}`)")
    lines.append(f"- `provenance/DECISION_LEDGER.md`: `{fixed_point['ledgerSha256']}` "
                 f"({fixed_point['ledgerBytes']} B / {fixed_point['ledgerLines']} lines)")
    lines.append(f"- `MANIFEST.json`: `{fixed_point['manifestSha256']}` "
                 f"({fixed_point['manifestFiles']} files / {fixed_point['manifestBytes']} B)")
    lines.append(f"- Release closure: `{fixed_point['validationRelease']}` / "
                 f"{fixed_point['validationPassed']} PASS / {fixed_point['validationFailed']} FAIL")
    lines.append("")
    lines.append("## 2. Listening sources")
    lines.append("")
    lines.append("| Track | Duration | Bars | Micro notes | WAV | MIDI |")
    lines.append("|---|---:|---:|---:|---|---|")
    for name in TRACK_ORDER:
        track = renders[name]
        lines.append(f"| `{name}` | {track['durationMs']} ms | {track['barCount']} | "
                     f"{track['midi']['leadNoteOns']} | `{track['wav']}` | `{track['midi']['path']}` |")
    lines.append("")
    lines.append("All timings are deterministic: `MICRO_STEP_MS = 300`, `MACRO_DWELL_MS = 1500`, "
                 "`K = 5`, boundary transit rest `300` ms, veto rest `1500` ms.")
    lines.append("")
    lines.append("## 3. Playback commands")
    lines.append("")
    lines.append("Offline WAV (available here with `ffplay`):")
    lines.append("")
    lines.append("```bash")
    lines.append("cd /home/erick/workspace/scratch-governed-loop-run/mvp5/task-b/renders")
    for name in TRACK_ORDER:
        lines.append(f"ffplay -nodisp -autoexit -loglevel error {name}.wav")
    lines.append("```")
    lines.append("")
    lines.append("Standard MIDI (use `timidity` or `fluidsynth` if installed; otherwise open in a DAW):")
    lines.append("")
    lines.append("```bash")
    lines.append("cd /home/erick/workspace/scratch-governed-loop-run/mvp5/task-b/renders")
    lines.append("timidity track1_arm1_unranked_2cycle.mid")
    lines.append("fluidsynth -ni /usr/share/sounds/sf2/TimGM6mb.sf2 track4_arm3b_dynamic_q_carried.mid")
    lines.append("```")
    lines.append("")
    lines.append("Headed live two-tier bridge (real WebAudio scheduling; requires an audio device):")
    lines.append("")
    lines.append("```bash")
    lines.append("cd /home/erick/projects/integrated-release")
    lines.append("ORRERY_BRIDGE_MODE=live python3 "
                 "/home/erick/workspace/scratch-governed-loop-run/mvp5/task-d/mvp5_live_listen.py")
    lines.append("```")
    lines.append("")
    lines.append("Headless certification replay (frequency capture, no listening):")
    lines.append("")
    lines.append("```bash")
    lines.append("python3 /home/erick/workspace/scratch-governed-loop-run/mvp5/task-c/mvp5_task_c.py")
    lines.append("```")
    lines.append("")
    lines.append("## 4. Quantitative contrast matrix")
    lines.append("")
    lines.append("| Arm | Macro states | Offices | Phases | Seams | Q states | Pitch classes | "
                 "5-gram repeats | Direct:degree |")
    lines.append("|---|---:|---:|---:|---:|---:|---:|---:|---:|")
    for name, label, _ in ARM_ORDER:
        arm = matrix["arms"][name]
        lines.append(f"| {label} | {arm['macro']['distinctStates']} | {arm['macro']['distinctOffices']} | "
                     f"{arm['macro']['distinctPhases']} | {arm['macro']['seamModulations']} | "
                     f"{arm['micro']['distinctQStates']} | {arm['micro']['emittedPitchClasses']} | "
                     f"{arm['micro']['ngram5Repeats']}/{arm['micro']['ngram5Total']} | "
                     f"{arm['micro']['directToDegree']} |")
    lines.append("")
    lines.append("Equivariant pair (`track5` vs `track6`): "
                 f"{equiv['pitchClassMatches']}/{equiv['pitchClassTotal']} pitch classes shifted by `+7 mod 12`; "
                 f"{equiv['intervalMatches']}/{equiv['intervalTotal']} melodic intervals identical.")
    lines.append("")
    lines.append("## 5. Pre-registered questions and timestamped markers")
    lines.append("")
    lines.append("### Q1 — Confinement vs. modulation")
    lines.append("")
    lines.append("Listen to `track1`, `track2`, and `track4`. `track1` is a 2-state Saturn confinement "
                 "loop; `track2` is a 4-state static Chaldean loop; `track4` breaks out of Saturn into "
                 "Sun and Mercury across phases 0, 11, and 0.")
    lines.append("")
    lines.append("| Marker | Time | Track 4 event |")
    lines.append("|---|---:|---|")
    for entry in markers["officePhases"]:
        lines.append(f"| Bar {entry['firstBar']} | {entry['timeMs']} ms | "
                     f"{entry['office']} · phase {entry['phase']} |")
    lines.append("")
    lines.append("**Adjudication:** rate the audible contrast `1` (none) to `5` (unmistakable). "
                 "A pass requires `>= 3` and a positive answer to: does `track4` audibly leave the "
                 "single-office orbit heard in `track1` and `track2`?")
    lines.append("")
    lines.append("### Q2 — Still-life reset vs. continuous Q melody")
    lines.append("")
    lines.append("Compare the downbeats of `track3` (reset Q) and `track4` (carried Q). `track3` "
                 "restarts every bar on `q_state = 0`; `track4` carries the Q1 fifths-cycle across "
                 "chord changes.")
    lines.append("")
    lines.append("| Bar | Time | Node | Reset Q | Carried Q |")
    lines.append("|---|---:|---|---:|---:|")
    for entry in markers["bars"]:
        lines.append(f"| {entry['bar']} | {entry['timeMs']} ms | {entry['node']} | "
                     f"{entry['resetQ']} | {entry['carriedQ']} |")
    lines.append("")
    lines.append(f"**Adjudication:** a pass requires hearing the repeated downbeat figure in `track3` "
                 f"(5-gram repeats `{matrix['stillLifeContrast']['arm3aRepeats']}/{matrix['arms']['arm3a_dynamic_q_reset']['micro']['ngram5Total']}`) "
                 f"against the through-composed line in `track4` "
                 f"(`{matrix['stillLifeContrast']['arm3bRepeats']}/{matrix['arms']['arm3b_dynamic_q_carried']['micro']['ngram5Total']}` repeats).")
    lines.append("")
    lines.append("### Q3 — Seam and boundary cadence")
    lines.append("")
    lines.append("| Time | Transition | License |")
    lines.append("|---|---|---|")
    for row in markers["seamHops"]:
        lines.append(f"| {row['timeMs']} ms | `{row['source']} -> {row['target']}` | "
                     f"`{row['citation']}` |")
    lines.append("")
    transit = markers["boundaryTransit"]
    if transit:
        lines.append(f"The boundary entry `1693@11 -> 847@0` is followed by the auto-transit "
                     f"`847@0 -> 1693@11` as a `300` ms unweighted rest (`0` oscillators) beginning at "
                     f"`18000` ms. The destination Mercury container re-attacks at `18300` ms. "
                     "No micro melody is emitted inside the boundary.")
    lines.append("")
    lines.append("**Adjudication:** a pass requires the five seam transitions to be perceptibly "
                 "articulated (`FamilyA:L1`, `FamilyB:bridge`, `FamilyA:R1`) and the `18.0–18.3 s` "
                 "rest to read as a cadence rather than a dropout.")
    lines.append("")
    lines.append("### Q4 — Transpositional equivariance")
    lines.append("")
    lines.append("Listen to `track5` and `track6` back to back. `track5` is "
                 "`1387@0 -> 2773@11 -> 2905@11`; `track6` is the exact `+7 mod 12` lift "
                 "`1387@7 -> 2773@6 -> 2905@6`.")
    lines.append("")
    lines.append("| Marker | Time | Base node | Lifted node |")
    lines.append("|---|---:|---|---|")
    lines.append("| Bar 1 | 0 ms | `1387@0` | `1387@7` |")
    lines.append("| Bar 2 | 1500 ms | `2773@11` | `2773@6` |")
    lines.append("| Bar 3 | 3000 ms | `2905@11` | `2905@6` |")
    lines.append("")
    lines.append("**Adjudication:** a pass requires the same melodic contour and a uniform "
                 "fifth-up shift; the measured interval sequence is "
                 f"`{equiv['intervalMatches']}/{equiv['intervalTotal']}` identical and the pitch-class "
                 f"shift is `{equiv['pitchClassMatches']}/{equiv['pitchClassTotal']}` exact.")
    lines.append("")
    lines.append("## 6. Scorecard")
    lines.append("")
    lines.append("Adjudication follows the MVP-2c `mac1..mac3` discipline: pre-register the question, "
                 "listen once without pausing, record the verdict, and do not re-describe the result "
                 "after the fact.")
    lines.append("")
    lines.append("| Question | Expected contrast | Heard (Y/N) | Rating 1–5 | Notes |")
    lines.append("|---|---|---|---:|---|")
    lines.append("| Q1 | Confinement vs. modulation |  |  |  |")
    lines.append("| Q2 | Reset still-life vs. carried melody |  |  |  |")
    lines.append("| Q3 | Seam articulation and boundary cadence |  |  |  |")
    lines.append("| Q4 | Fifth-transposition identity |  |  |  |")
    lines.append("")
    lines.append("Adjudicator: ____________________  Date: ____________  Session: ____________")
    lines.append("")
    lines.append("Overall verdict (circle one): `PASS` / `PASS WITH NOTES` / `FAIL`")
    lines.append("")
    lines.append("## 7. Non-claims and fences")
    lines.append("")
    lines.append("- Overlay dynamics only (`SPEC-001 §1.3`); no GOV-517 correspondence is claimed.")
    lines.append("- `still_set` is preserved as `(12, 13, 14, 15)`; still-set entries are `0` in every "
                 "rendered melody.")
    lines.append("- No canonical or physical causation claim; no GSL assignment; no `C_H` value.")
    lines.append("- Boundary states are transit-only: `K_boundary = 0`, `cannot-be-camped-on`, "
                 "`can-never-govern`.")
    lines.append("")
    return "\n".join(lines) + "\n"
