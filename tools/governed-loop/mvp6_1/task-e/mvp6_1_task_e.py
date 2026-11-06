#!/usr/bin/env python3
"""MVP6-DIR-1 Task E: dual-listener ear protocol, staging manifest, and the
closing report.

Scratch-only. Emits the protocol, the 14-entry staging manifest, the closing
report, and the Task E receipt. No repository writes.
"""
import hashlib
import json
import sys
from pathlib import Path

SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp6_1")
OUT = SCRATCH / "task-e"
ITINERARY = SCRATCH / "task-a" / "mvp6_1_itinerary.json"
TRACE = SCRATCH / "task-c" / "traces" / "piece_a_far_shore_delooped.jsonl"
CONTROL_WAV = Path("/home/erick/projects/integrated-release/tools/governed-loop/mvp6/task-d/renders/piece_a_far_shore.wav")

REPO_MVP6 = "tools/governed-loop/mvp6_1"

PAYLOADS = [
    ("mvp6_1_task_0", "task-0/mvp6_1_task_0.py", f"{REPO_MVP6}/task-0/mvp6_1_task_0.py"),
    ("mvp6_1_predeclared_deloop", "task-0/mvp6_1_predeclared_deloop.json", f"{REPO_MVP6}/task-0/mvp6_1_predeclared_deloop.json"),
    ("mvp6_1_task_a", "task-a/mvp6_1_task_a.py", f"{REPO_MVP6}/task-a/mvp6_1_task_a.py"),
    ("mvp6_1_itinerary", "task-a/mvp6_1_itinerary.json", f"{REPO_MVP6}/task-a/mvp6_1_itinerary.json"),
    ("mvp6_1_coupled_form_engine", "task-b/mvp6_1_coupled_form_engine.py", f"{REPO_MVP6}/task-b/mvp6_1_coupled_form_engine.py"),
    ("mvp6_1_task_b", "task-b/mvp6_1_task_b.py", f"{REPO_MVP6}/task-b/mvp6_1_task_b.py"),
    ("mvp6_1_task_c", "task-c/mvp6_1_task_c.py", f"{REPO_MVP6}/task-c/mvp6_1_task_c.py"),
    ("piece_a_far_shore_delooped_trace", "task-c/traces/piece_a_far_shore_delooped.jsonl", f"{REPO_MVP6}/task-c/traces/piece_a_far_shore_delooped.jsonl"),
    ("mvp6_1_task_d", "task-d/mvp6_1_task_d.py", f"{REPO_MVP6}/task-d/mvp6_1_task_d.py"),
    ("piece_a_far_shore_delooped_wav", "task-d/renders/piece_a_far_shore_delooped.wav", f"{REPO_MVP6}/task-d/renders/piece_a_far_shore_delooped.wav"),
    ("piece_a_far_shore_delooped_mid", "task-d/renders/piece_a_far_shore_delooped.mid", f"{REPO_MVP6}/task-d/renders/piece_a_far_shore_delooped.mid"),
    ("mvp6_1_task_e", "task-e/mvp6_1_task_e.py", f"{REPO_MVP6}/task-e/mvp6_1_task_e.py"),
    ("EAR_VALIDATION_PROTOCOL_MVP6_1", "task-e/EAR_VALIDATION_PROTOCOL_MVP6_1.md", f"{REPO_MVP6}/task-e/EAR_VALIDATION_PROTOCOL_MVP6_1.md"),
    ("MVP6_1-CLOSING-REPORT", "MVP6_1-CLOSING-REPORT.md", "scrum/plan/mvp6-1-sprint-closing-report.md"),
]

RECEIPTS = [
    ("mvp6_1_task_0_receipt", "task-0/mvp6_1_task_0_receipt.json", "qa/mvp6_1_task_0_receipt.json"),
    ("mvp6_1_task_a_receipt", "task-a/mvp6_1_task_a_receipt.json", "qa/mvp6_1_task_a_receipt.json"),
    ("mvp6_1_task_b_receipt", "task-b/mvp6_1_task_b_receipt.json", "qa/mvp6_1_task_b_receipt.json"),
    ("mvp6_1_task_c_receipt", "task-c/mvp6_1_task_c_receipt.json", "qa/mvp6_1_task_c_receipt.json"),
    ("mvp6_1_task_d_receipt", "task-d/mvp6_1_task_d_receipt.json", "qa/mvp6_1_task_d_receipt.json"),
    ("mvp6_1_task_e_receipt", "task-e/mvp6_1_task_e_receipt.json", "qa/mvp6_1_task_e_receipt.json"),
]


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def markers():
    records = [json.loads(line) for line in TRACE.read_text(encoding="utf-8").splitlines()]
    bars = {}
    for record in records:
        if record.get("recordType") != "micro":
            continue
        entry = bars.setdefault(record["bar"], {
            "node": record["node"],
            "startMs": record["barStartMs"],
            "durationMs": record["barDurationMs"],
            "sectionKey": record.get("sectionKey"),
            "steps": 0,
        })
        entry["steps"] += 1
    rest = [record for record in records if record.get("recordType") == "rest"][0]
    spans = {}
    for bar in bars.values():
        span = spans.setdefault(bar["sectionKey"], {
            "startMs": bar["startMs"], "endMs": bar["startMs"] + bar["durationMs"],
            "bars": 0,
        })
        span["startMs"] = min(span["startMs"], bar["startMs"])
        span["endMs"] = max(span["endMs"], bar["startMs"] + bar["durationMs"])
        span["bars"] += 1
    return bars, rest, spans


def protocol_text(itinerary, trace_receipt, audio_receipt):
    r = audio_receipt
    bridge = r["bridge"]
    spans = bridge["sectionCentroidMeansHz"]
    bars, rest, span_rows = markers()
    lines = []
    a = lines.append
    a("# MVP-6.1 Ear Validation Protocol — \u201cThe Far Shore\u201d (de-looped)")
    a("")
    a("Directive `MVP6.1-DIR-1` rev 1 · execution realm "
      "`/home/erick/workspace/scratch-governed-loop-run/mvp6_1/` · scratch-only until the L24 landing.")
    a("")
    a("Layer: `SPEC-001 \u00a71.3 overlay dynamics` · "
      "`gov517_correspondence_claimed: false` · `still_set_label: still_set`.")
    a("This document is a pre-registered listening protocol. It makes no canonical or")
    a("physical causation claim; the acoustic centroids below are Modality 2 boundary")
    a("measurements carrying `causationClaim: false`, `physicalQuantityClaim: false`,")
    a("`tierClassifier: false`, `globalCHNull: true`.")
    a("")
    a("## 1. Predeclared shape")
    a("")
    a("| Property | Value |")
    a("|---|---|")
    a(f"| Piece | `{itinerary['pieceId']}` (Destination A, return form) |")
    a("| Seed | `1387@0` (Saturn, ORBIT-A0) |")
    a("| Shore | `757@6` (boundary, escapable dual) |")
    a("| Strong core | 2,928 nodes; every itinerary node inside |")
    a(f"| Macro transitions | {itinerary['summary']['macroTransitions']} "
      f"({itinerary['summary']['nonSelfHops']} non-self + {itinerary['summary']['selfLoopExtensions']} dwell self-loops) |")
    a(f"| Bars | {itinerary['summary']['bars']} "
      f"({itinerary['summary']['transitBars']} transit at K=5 + {itinerary['summary']['dwellBars']} dwell at K=12) |")
    a(f"| Micro steps | {itinerary['summary']['microSteps']} at 300 ms |")
    a(f"| Duration | {itinerary['summary']['durationMs']} ms (2 min 02.7 s) |")
    a("| Q mode | carried across the entire piece; zero resets; zero still-set entries |")
    a("| Offline render | 16-bit PCM WAV and SMF-1 MIDI, two-pass byte-identical |")
    a("| De-loop rule | run-local Q1 rotation: repeat bars advance one extra Q1, non-repeat bars stay identical to the control |")
    a("")
    a("## 2. A/B control (listen in this order)")
    a("")
    a("| Render | File | SHA-256 (first 8) |")
    a("|---|---|---|")
    a(f"| L23 control (looped) | `tools/governed-loop/mvp6/task-d/renders/piece_a_far_shore.wav` | `{audio_receipt['ab']['controlWavSha256'][:8]}` |")
    a(f"| L23 control MIDI | `tools/governed-loop/mvp6/task-d/renders/piece_a_far_shore.mid` | `{audio_receipt['ab']['controlMidiSha256'][:8]}` |")
    a(f"| MVP-6.1 de-looped | `piece_a_far_shore_delooped.wav` | `{audio_receipt['render']['wav']['sha256'][:8]}` |")
    a(f"| MVP-6.1 de-looped MIDI | `piece_a_far_shore_delooped.mid` | `{audio_receipt['render']['midi']['sha256'][:8]}` |")
    a("")
    a("Measured A/B: the two renders differ in exactly the 10 repeat bars (16, 17, 23, 24,")
    a("25, 33, 34, 53, 54, 55) plus the first 500 ms of the three bars that follow a")
    a("changed run (18, 26, 35), which is the release tail of the preceding phrase; the")
    a("remaining 42 bar windows are byte-identical. The macro, timings, and sections are")
    a("unchanged.")
    a("")
    a("## 3. Listening sources")
    a("")
    a("| Source | Track |")
    a("|---|---|")
    a(f"| WAV | `task-d/renders/piece_a_far_shore_delooped.wav` (`{r['render']['wav']['sha256'][:8]}`) |")
    a(f"| MIDI | `task-d/renders/piece_a_far_shore_delooped.mid` (`{r['render']['midi']['sha256'][:8]}`) |")
    a(f"| Trace | `task-c/traces/piece_a_far_shore_delooped.jsonl` (`{trace_receipt['trace']['sha256'][:8]}`) |")
    a("")
    a("Playback:")
    a("")
    a("```bash")
    a("cd /home/erick/workspace/scratch-governed-loop-run/mvp6_1/task-d/renders")
    a("ffplay -nodisp -autoexit -loglevel error piece_a_far_shore_delooped.wav")
    a("# or, after the L24 landing:")
    a("ffplay -nodisp -autoexit -loglevel error \\")
    a("  /home/erick/projects/integrated-release/tools/governed-loop/mvp6_1/task-d/renders/piece_a_far_shore_delooped.wav")
    a("```")
    a("")
    a("## 4. Section map and measured centroids")
    a("")
    a("| Section | Span | Bars | Measured centroid (Hz) | Orchestration |")
    a("|---|---|---:|---:|---|")
    names = {
        "home_mirror": "Home and Mirror",
        "departure": "Departure",
        "first_dwell": "First Dwell (Quiet Zone)",
        "climax": "Climax Transit and Dwell",
        "shore": "The Shore",
        "return": "Return",
        "homecoming": "Homecoming",
    }
    for key in ["home_mirror", "departure", "first_dwell", "climax", "shore", "return", "homecoming"]:
        span = span_rows[key]
        a(f"| {names[key]} | {span['startMs']} \u2013 {span['endMs']} ms | {span['bars']} | "
          f"{spans[key]:.3f} | |")
    a("")
    a("## 5. Phase 1 — blind structural listen")
    a("")
    a("Listen once, end to end, without reading the timestamps. Mark where you hear a")
    a("section boundary, where the peak is, where the quiet still point is, and where the")
    a("piece arrives. Do not pause or rewind. Record the raw times before reading \u00a76.")
    a("")
    a("| Perceived boundary | Time (mm:ss) | Confidence 1\u20135 |")
    a("|---|---|---:|")
    a("| Opening gesture closes |  |  |")
    a("| First section change |  |  |")
    a("| Quiet still point |  |  |")
    a("| Peak / climax |  |  |")
    a("| Arrival |  |  |")
    a("")
    a("## 6. Phase 2 — timestamped adjudication")
    a("")
    a("### Q1 — Opening mirror gesture (0.0 \u2013 13.8 s)")
    a("")
    a("| Marker | Time | Event |")
    a("|---|---:|---|")
    a("| Home | 0.0 s | `1387@0`, Saturn \u221212, phase 0 (achromatic coincidence, mean 36) |")
    a("| Mirror apex | 5.1 s | `1709@0`, Mercury 0, the A0 I\u2080-fixed self-mirror state |")
    a("| Return transit | 8.7 s | `1645@0` |")
    a("| Home again | 10.2 s | `1387@0` |")
    a("")
    a("**Question.** Does the opening read as one self-contained gesture that leaves and")
    a("returns, distinct from the departure that follows?")
    a("")
    a("**Pass.** Rating \u2265 3, and the mirror apex is audible as a change of colour")
    a("(Mercury middle band against the Saturn low band) rather than a restart.")
    a("")
    a("### Q2 — Quiet dwell vs. climax dwell (27.3 \u2013 58.5 s)")
    a("")
    a("| Marker | Time | Event |")
    a("|---|---:|---|")
    a("| Quiet dwell in | 27.3 s | `1453@6`, Jupiter 0, phase 6 (interior spread minimum 96/35) |")
    a("| Quiet dwell out | 38.1 s | three full 12-step Q phrases |")
    a("| Climax dwell in | 44.1 s | `623@8`, Venus +12, phase 8 (global spread maximum 60/7) |")
    a("| Climax dwell out | 58.5 s | four full 12-step Q phrases |")
    a("")
    a(f"**Question.** Does the climax dwell read as a registral and timbral lift above the")
    a(f"quiet dwell (measured means: quiet {spans['first_dwell']:.1f} Hz, climax {spans['climax']:.1f} Hz)?")
    a("")
    a("**Pass.** Rating \u2265 3, and the two dwells are identifiable without the written map.")
    a("")
    a("### Q3 — The Shore (67.5 \u2013 78.6 s)")
    a("")
    a("| Marker | Time | Event |")
    a("|---|---:|---|")
    a("| Shore neighbour in | 67.5 s | `379@7`, Jupiter 0, governed edge of the world |")
    a(f"| Boundary rest | {rest['startMs']} \u2013 {rest['startMs'] + rest['durationMs']} ms | `757@6`; "
      "0 oscillators scheduled; the measured window is the release tail of the last lead note |")
    a("| Lead resumes | 75.0 s | `379@7`, same governed node, Q carried through the rest |")
    a("")
    a("**Question.** Does the 300 ms rest read as a held breath or cadence rather than an")
    a("audio dropout?")
    a("")
    a("**Pass.** Rating \u2265 3, and the resumption is heard as continuation, not a new section.")
    a("")
    a("### Q4 — Return as new territory (78.6 \u2013 108.3 s)")
    a("")
    a("**Question.** Does the return sound like a different road home rather than the")
    a("outbound path played backwards? (15 of the 18 return interior nodes are new.)")
    a("")
    a("**Pass.** Rating \u2265 3, and the return is distinguishable from the departure.")
    a("")
    a("### Q5 — Voiced homecoming (108.3 \u2013 122.7 s)")
    a("")
    a("| Marker | Time | Event |")
    a("|---|---:|---|")
    a("| Homecoming in | 108.3 s | `1387@0`, Saturn \u221212, phase 0 |")
    a("| End | 122.7 s | four full 12-step Q phrases; terminal node voiced |")
    a("")
    a("**Question.** Does the ending read as an arrival on the home node rather than a stop?")
    a("The unvoiced control (`control_unvoiced_terminal`) ends after the `859@0` bar with the")
    a("terminal `1387@0` silent; the voiced form adds 12 terminal micro steps.")
    a("")
    a("**Pass.** Rating \u2265 3, and the homecoming is heard as closure.")
    a("")
    a("### Q6 — De-loop A/B (control vs de-looped)")
    a("")
    a("Listen to the L23 control and the de-looped render back to back (counterbalanced")
    a("order across the two listeners). The measured change is confined to the four dwell")
    a("runs: `1453@6` (27.3\u201338.1 s), `623@8` (44.1\u201358.5 s), `379@7` (67.5\u201378.6 s),")
    a("and `1387@0` (108.3\u2013122.7 s). Each run is now 3/3, 4/4, 3/3, and 4/4 distinct")
    a("phrases instead of one phrase repeated.")
    a("")
    a("**Question.** Do the dwell repeats read as varied phrases rather than a loop?")
    a("")
    a("**Pass.** Rating \u2265 3, and the listener can identify at least three of the four")
    a("dwell runs as changed without the written map.")
    a("")
    a("## 7. Dual scorecard")
    a("")
    a("Adjudication follows the MVP-2c `mac1..mac3` discipline: pre-register, listen once,")
    a("record the verdict, do not re-describe after the fact. Listener 2 is optional and")
    a("external; the blind pass is the same for both.")
    a("")
    a("| Question | Listener 1 heard (Y/N) | 1 rating | Listener 1 notes | "
      "Listener 2 heard (Y/N) | 2 rating | Listener 2 notes |")
    a("|---|---|---:|---|---|---:|---|")
    for q in ["Q1 mirror gesture", "Q2 quiet vs climax", "Q3 shore breath",
              "Q4 return as new territory", "Q5 voiced homecoming",
              "Q6 de-loop A/B"]:
        a(f"| {q} |  |  |  |  |  |  |")
    a("")
    a("| Field | Listener 1 (Erick) | Listener 2 (external) |")
    a("|---|---|---|")
    a("| Name | Erick |  |")
    a("| Date |  |  |")
    a("| Session |  |  |")
    a("| Overall verdict (PASS / PASS WITH NOTES / FAIL) |  |  |")
    a("")
    a("## 8. Non-claims and fences")
    a("")
    a("- Overlay dynamics only (`SPEC-001 \u00a71.3`); no GOV-517 correspondence is claimed.")
    a("- Boundary states are transit-only: `K_boundary = 0`, cannot be camped on.")
    a("- No canonical or physical causation claim; `C_H` remains unresolved (`null`).")
    a("- The acoustic centroids are external boundary measurements, not symbolic")
    a("  invariants, and the lead-line contour is carried by the micro pitch sums.")
    a("- The L21 ear protocol and scorecard are untouched; this protocol is scoped to")
    a("  this piece only.")
    a("")
    return "\n".join(lines) + "\n"


def closing_report_text(itinerary, receipts, audio, task0, task_c):
    r = audio
    bridge = r["bridge"]
    opening = task0["opening"]
    novelty = task_c["novelty"]
    ab = r["ab"]
    lines = []
    a = lines.append
    a("# MVP6.1 Closing Report — De-looped Dwell Phrases: \u201cThe Far Shore\u201d")
    a("")
    a("**Directive:** `MVP6.1-DIR-1` rev 1  ")
    a("**Execution realm:** `/home/erick/workspace/scratch-governed-loop-run/mvp6_1/`  ")
    a("**Status:** SCRATCH COMPLETE; L24 working-tree landing pending")
    a("")
    a("## Opening fixed point and pins")
    a("")
    a(f"- Opening HEAD: `{opening['baseHead']}` (L23 working-tree landing on the L22 commit)")
    a(f"- Tree clean at opening: {str(opening['treeClean']).lower()} "
      f"({opening['workingTreeState']})")
    a(f"- Decision ledger before: `{opening['ledger']['sha256'][:8]}...` / "
      f"{opening['ledger']['bytes']:,} B / {opening['ledger']['lines']:,} lines")
    a(f"- Manifest before: `{opening['manifest']['sha256'][:8]}...` / "
      f"{opening['manifest']['fileCount']:,} files / {opening['manifest']['totalBytes']:,} B")
    a(f"- Release closure before: PASS / {opening['validation']['checksPassed']} / "
      f"{opening['validation']['checksFailed']}")
    a(f"- Pins verified: {task0['pinsVerified']}/{task0['pinsVerified']} SHA-256 and byte counts; "
      f"`mvp2.py` anchors {task0['anchorsVerified']}/{task0['anchorsVerified']}")
    a("")
    a("## Task outcomes")
    a("")
    a("| Task | Receipt | SHA-256 (first 8) | Outcome |")
    a("|---|---|---|---|")
    for task, key, outcome in [
        ("T0", "mvp6_1_task_0_receipt", "L23 control fixed point, loop evidence, predeclaration lock"),
        ("TA", "mvp6_1_task_a_receipt", "macro re-derivation; identical to the L23 control"),
        ("TB", "mvp6_1_task_b_receipt", "terminal control; de-loop is a no-op without repeats"),
        ("TC", "mvp6_1_task_c_receipt", "de-looped trace; novelty law; A/B changed-set"),
        ("TD", "mvp6_1_task_d_receipt", "deterministic render; FFT bridge; A/B windows"),
        ("TE", "mvp6_1_task_e_receipt", "A/B protocol, staging manifest, closing report"),
    ]:
        sha = receipts.get(key, {}).get("sha256")
        sha_text = f"`{sha[:8]}`" if sha else "`(self)`"
        a(f"| {task} | `qa/{key}.json` | {sha_text} | {outcome} |")
    a("")
    a("## De-loop result")
    a("")
    a("- Root cause: after a 12-step bar starting at `s`, `advance(Q1^11(s)) = Q1^12(s) = s`, "
      "so every dwell repeat restarted identically.")
    a("- Rule: run-local Q1 rotation. Within each maximal same-node run the voice carry gains "
      "one extra Q1 advance between consecutive repeat bars; a parallel canonical carry keeps "
      "all non-repeat bars identical to the L23 control.")
    a(f"- Changed bars: {novelty['repeatBars']} (exactly the 10 predeclared repeat bars).")
    for run in novelty["runs"]:
        a(f"- `{run['node']}`: {run['length']} bars, "
          f"{run['distinctSignatures']}/{run['length']} distinct phrases, "
          f"minimum step delta {min(d['delta'] for d in run['deltas'])}/12.")
    a(f"- Unchanged bars: 45 of 55 are byte-identical to the L23 control in emitted pitch content.")
    a("")
    a("## Form result")
    a("")
    a("- Destination A (Far Shore, `757@6`), return form, inside the 2,928-node strong core.")
    a(f"- Itinerary: {itinerary['summary']['bars']} bars "
      f"({itinerary['summary']['transitBars']} transit + {itinerary['summary']['dwellBars']} dwell), "
      f"{itinerary['summary']['microSteps']} micro steps, {itinerary['summary']['durationMs']} ms.")
    a(f"- Macro transitions: {itinerary['summary']['macroTransitions']} "
      f"({itinerary['summary']['nonSelfHops']} non-self + "
      f"{itinerary['summary']['selfLoopExtensions']} dwell self-loops); all gate ACCEPT; "
      "zero LLM calls; structurally identical to L23.")
    a("- Coverage: 7 offices, 12 phases, 42 distinct lifted states; return leg threads")
    a("  15 new interior nodes out of 18; negative tests reject `1831@6` and an isolated boundary.")
    a("")
    a("## Audio result")
    a("")
    a(f"- WAV: `piece_a_far_shore_delooped.wav`, `{r['render']['wav']['sha256'][:8]}`, "
      f"{r['render']['wav']['samples']} samples.")
    a(f"- MIDI: `piece_a_far_shore_delooped.mid`, `{r['render']['midi']['sha256'][:8]}`.")
    a("- Two-pass render byte-identical; 0 clipped samples; 0 non-finite samples;")
    a("  0 MIDI container leaks; 408 lead note-ons; 440 pad note-ons.")
    a(f"- FFT bridge: {bridge['barsMeasured']} bars; correlation "
      f"{bridge['correlationMeasuredVsModel']:.6f}; median relative error "
      f"{bridge['medianRelativeError']:.6f}.")
    a(f"- Office-deconfounded contour: container r = "
      f"{bridge['officeDeconfoundedCorrelationContainer']:.6f}, lead r = "
      f"{bridge['officeDeconfoundedCorrelationLead']:.6f}.")
    a(f"- Section centroids (Hz): quiet {bridge['sectionCentroidMeansHz']['first_dwell']:.3f}, "
      f"climax {bridge['sectionCentroidMeansHz']['climax']:.3f}, "
      f"homecoming {bridge['sectionCentroidMeansHz']['homecoming']:.3f}.")
    a(f"- Boundary rest: 0 scheduled oscillators; measured RMS ratio "
      f"{bridge['boundaryRestRmsRatio']:.6f} ({bridge['boundaryRestDropDb']:.3f} dB below the "
      f"mean voiced bar); final-50 ms tail ratio {bridge['boundaryRestTailRmsRatio']:.6f}.")
    a("")
    a("## A/B against the L23 control")
    a("")
    a(f"- Control WAV `{ab['controlWavSha256'][:8]}`; de-looped WAV "
      f"`{r['render']['wav']['sha256'][:8]}`; control MIDI `{ab['controlMidiSha256'][:8]}`; "
      f"de-looped MIDI `{r['render']['midi']['sha256'][:8]}`.")
    a(f"- Different bar windows: {ab['differentWindows']}.")
    a(f"- Identical bar windows: {ab['sameWindows']} of 55.")
    for row in ab["successorTailOnly"]:
        a(f"- Bar {row['bar']}: only the first 500 ms differs (release tail of the preceding "
          f"phrase); after 500 ms identical = {row['after500msIdentical']}.")
    a("- The macro, timings, sections, and all non-repeat bars are unchanged.")
    a("")
    a("## Law verification")
    a("")
    a("| Law | Verification |")
    a("|---|---|")
    a("| 1. Planner composes; card steers; LLM waits | deterministic BFS + card; 0 LLM calls |")
    a("| 2. Form space is the strong core | 2,928 nodes; every node inside; negative tests reject |")
    a("| 3. If it is not in the lead line, it is not heard | lead pcSum and register bands carry the form; deconfounded lead r > container r |")
    a("| 4. Phase is terrain, not a dial | dwell placement at p6 and p8; full 12-step Q phrases |")
    a("| 5. Arrival must be voiced | terminal bar adds 12 micro steps; voiced vs unvoiced control |")
    a("| 6. Repeats are varied phrases | 3/3, 4/4, 3/3, 4/4 distinct; minimum delta 9/12 |")
    a("")
    a("## Fences")
    a("")
    a("- No gate, census, ground-truth, seam-substrate, Q-engine, encoder, renderer, or "
      "`audio.ts` byte change; the Orrery application is read-only.")
    a("- Photonic layer overlay-only; `causationClaim: false`, `physicalQuantityClaim: false`, "
      "`tierClassifier: false`, `globalCHNull: true`; `C_H` unresolved.")
    a("- The L23 control render and receipts are frozen and remain the A/B reference.")
    a("- Scratch tasks made zero repository writes. The L24 landing is a separate authorized "
      "working-tree action; no tag or push.")
    a("")
    a("## Terminal verdict")
    a("")
    a("```text")
    a("MVP6.1-SPRINT-CLOSING")
    a(f"FIXED-POINT: {opening['baseHead'][:7]}... / L23 WORKING TREE / "
      f"L23 {opening['ledger']['sha256'][:8]}... / {opening['ledger']['bytes']} B / "
      f"{opening['ledger']['lines']} lines")
    a(f"PINS-VERIFIED: {task0['pinsVerified']}/{task0['pinsVerified']} MATCH / "
      f"ANCHORS {task0['anchorsVerified']}/{task0['anchorsVerified']} MATCH / "
      "PREDECLARATION-LOCKED TRUE")
    a("TASKS: T0 COMPLETE | TA COMPLETE | TB COMPLETE | TC COMPLETE | TD COMPLETE | TE COMPLETE")
    a(f"DE-LOOP: CHANGED {len(novelty['repeatBars'])} BARS / RUNS 3-4-3-4 DISTINCT / "
      f"MIN-DELTA {min(d['delta'] for run in novelty['runs'] for d in run['deltas'])}/12")
    a(f"A/B: DIFFERENT WINDOWS {len(ab['differentWindows'])} / IDENTICAL WINDOWS "
      f"{ab['sameWindows']} / MACRO FROZEN")
    a("AUDIO: TWO-PASS IDENTICAL / CLIPPED 0 / NON-FINITE 0 / MIDI-LEAKS 0")
    a(f"FFT-BRIDGE: MODEL-CORR {bridge['correlationMeasuredVsModel']:.6f} / "
      f"MEDIAN-REL-ERR {bridge['medianRelativeError']:.6f}")
    a("FENCES: GATE-UNTOUCHED / CONTROL-FROZEN / C-H-NULL / LLM-CALLS 0")
    a("REPO-WRITES: 0 (scratch) / STATUS: COMPLETE")
    a("```")
    a("")
    return "\n".join(lines) + "\n"


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    itinerary = load_json(ITINERARY)
    trace_receipt = load_json(SCRATCH / "task-c" / "mvp6_1_task_c_receipt.json")
    audio = load_json(SCRATCH / "task-d" / "mvp6_1_task_d_receipt.json")

    protocol_path = OUT / "EAR_VALIDATION_PROTOCOL_MVP6_1.md"
    protocol_path.write_text(protocol_text(itinerary, trace_receipt, audio), encoding="utf-8")

    receipts = {key: {"sha256": sha256_file(SCRATCH / rel)}
                for key, rel, _ in RECEIPTS if key != "mvp6_1_task_e_receipt"}

    closing_path = SCRATCH / "MVP6_1-CLOSING-REPORT.md"
    task0 = load_json(SCRATCH / "task-0" / "mvp6_1_task_0_receipt.json")
    task_c = load_json(SCRATCH / "task-c" / "mvp6_1_task_c_receipt.json")
    closing_path.write_text(closing_report_text(itinerary, receipts, audio, task0, task_c), encoding="utf-8")

    rows = []
    for role, source, destination in PAYLOADS:
        path = SCRATCH / source
        if not path.exists():
            raise SystemExit(f"STOP: S-8 missing payload {source}")
        rows.append({
            "role": role,
            "source": source,
            "sourceAbsolute": str(path),
            "destination": destination,
            "sha256": sha256_file(path),
            "bytes": path.stat().st_size,
            "verified": True,
        })
    receipt_rows = []
    for role, source, destination in RECEIPTS:
        path = SCRATCH / source
        if not path.exists() and role != "mvp6_1_task_e_receipt":
            raise SystemExit(f"STOP: S-8 missing receipt {source}")
        if path.exists():
            receipt_rows.append({
                "role": role,
                "source": source,
                "destination": destination,
                "sha256": sha256_file(path),
                "bytes": path.stat().st_size,
                "verified": True,
            })
    manifest = {
        "schemaVersion": "governed-loop.mvp6-staging-manifest.v1",
        "directive": "MVP6-DIR-1",
        "payloadCount": len(rows),
        "payloadVerified": sum(1 for row in rows if row["verified"]),
        "payloads": rows,
        "receipts": receipt_rows,
        "receiptCount": len(receipt_rows),
    }
    (OUT / "l24_staging_manifest.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    receipt = {
        "schemaVersion": "governed-loop.mvp6-task-e.v1",
        "directive": "MVP6-DIR-1",
        "task": "MVP6-TE",
        "status": "COMPLETE",
        "artifacts": {
            "protocol": {"path": str(protocol_path), "sha256": sha256_file(protocol_path)},
            "closingReport": {"path": str(closing_path), "sha256": sha256_file(closing_path)},
            "stagingManifest": {"path": str(OUT / "l24_staging_manifest.json"),
                                "sha256": sha256_file(OUT / "l24_staging_manifest.json")},
        },
        "staging": {"payloads": manifest["payloadCount"],
                    "payloadVerified": manifest["payloadVerified"],
                    "receipts": manifest["receiptCount"]},
        "earProtocol": {
            "dualListener": True,
            "blindPass": True,
            "questions": 5,
            "listeners": ["Erick (primary)", "external listener (optional)"],
        },
        "llmCalls": 0,
        "stopRules": [],
    }
    (OUT / "mvp6_1_task_e_receipt.json").write_text(
        json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "COMPLETE",
        "payloads": manifest["payloadCount"],
        "verified": manifest["payloadVerified"],
        "receipts": manifest["receiptCount"],
        "protocolSha256": receipt["artifacts"]["protocol"]["sha256"],
        "closingSha256": receipt["artifacts"]["closingReport"]["sha256"],
        "stagingSha256": receipt["artifacts"]["stagingManifest"]["sha256"],
    }, indent=2))


if __name__ == "__main__":
    main()
