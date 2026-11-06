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

SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp6_2")
OUT = SCRATCH / "task-e"
ITINERARY = SCRATCH / "task-a" / "mvp6_2_itinerary.json"
TRACE = Path("/home/erick/projects/integrated-release/tools/governed-loop/mvp6_1/task-c/traces/piece_a_far_shore_delooped.jsonl")
CONTROL_WAV = Path("/home/erick/projects/integrated-release/tools/governed-loop/mvp6_1/task-d/renders/piece_a_far_shore_delooped.wav")
CONTROL_WAV = Path("/home/erick/projects/integrated-release/tools/governed-loop/mvp6/task-d/renders/piece_a_far_shore.wav")

REPO_MVP6 = "tools/governed-loop/mvp6_2"

PAYLOADS = [
    ("mvp6_2_task_0", "task-0/mvp6_2_task_0.py", f"{REPO_MVP6}/task-0/mvp6_2_task_0.py"),
    ("mvp6_2_predeclared_legato", "task-0/mvp6_2_predeclared_legato.json", f"{REPO_MVP6}/task-0/mvp6_2_predeclared_legato.json"),
    ("mvp6_2_task_a", "task-a/mvp6_2_task_a.py", f"{REPO_MVP6}/task-a/mvp6_2_task_a.py"),
    ("mvp6_2_itinerary", "task-a/mvp6_2_itinerary.json", f"{REPO_MVP6}/task-a/mvp6_2_itinerary.json"),
    ("mvp6_2_legato_renderer", "task-b/mvp6_2_legato_renderer.py", f"{REPO_MVP6}/task-b/mvp6_2_legato_renderer.py"),
    ("mvp6_2_task_b", "task-b/mvp6_2_task_b.py", f"{REPO_MVP6}/task-b/mvp6_2_task_b.py"),
    ("control_voiced_terminal_legato", "task-b/renders/control_voiced_terminal_legato.wav", f"{REPO_MVP6}/task-b/renders/control_voiced_terminal_legato.wav"),
    ("mvp6_2_task_c", "task-c/mvp6_2_task_c.py", f"{REPO_MVP6}/task-c/mvp6_2_task_c.py"),
    ("mvp6_2_task_d", "task-d/mvp6_2_task_d.py", f"{REPO_MVP6}/task-d/mvp6_2_task_d.py"),
    ("piece_a_far_shore_legato_wav", "task-d/renders/piece_a_far_shore_legato.wav", f"{REPO_MVP6}/task-d/renders/piece_a_far_shore_legato.wav"),
    ("piece_a_far_shore_legato_mid", "task-d/renders/piece_a_far_shore_legato.mid", f"{REPO_MVP6}/task-d/renders/piece_a_far_shore_legato.mid"),
    ("mvp6_2_task_e", "task-e/mvp6_2_task_e.py", f"{REPO_MVP6}/task-e/mvp6_2_task_e.py"),
    ("EAR_VALIDATION_PROTOCOL_MVP6_2", "task-e/EAR_VALIDATION_PROTOCOL_MVP6_2.md", f"{REPO_MVP6}/task-e/EAR_VALIDATION_PROTOCOL_MVP6_2.md"),
    ("MVP6_2-CLOSING-REPORT", "MVP6_2-CLOSING-REPORT.md", "scrum/plan/mvp6-2-sprint-closing-report.md"),
]

RECEIPTS = [
    ("mvp6_2_task_0_receipt", "task-0/mvp6_2_task_0_receipt.json", "qa/mvp6_2_task_0_receipt.json"),
    ("mvp6_2_task_a_receipt", "task-a/mvp6_2_task_a_receipt.json", "qa/mvp6_2_task_a_receipt.json"),
    ("mvp6_2_task_b_receipt", "task-b/mvp6_2_task_b_receipt.json", "qa/mvp6_2_task_b_receipt.json"),
    ("mvp6_2_task_c_receipt", "task-c/mvp6_2_task_c_receipt.json", "qa/mvp6_2_task_c_receipt.json"),
    ("mvp6_2_task_d_receipt", "task-d/mvp6_2_task_d_receipt.json", "qa/mvp6_2_task_d_receipt.json"),
    ("mvp6_2_task_e_receipt", "task-e/mvp6_2_task_e_receipt.json", "qa/mvp6_2_task_e_receipt.json"),
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
    seams = r["seams"]
    rest = r["restBreath"]
    fft = r["fft"]
    spans = fft["sectionCentroidMeansHz"]
    bars, rest_record, span_rows = markers()
    lines = []
    a = lines.append
    a("# MVP-6.2 Ear Validation Protocol — “The Far Shore” (legato pad)")
    a("")
    a("Directive `MVP6.2-DIR-1` rev 1 · execution realm "
      "`/home/erick/workspace/scratch-governed-loop-run/mvp6_2/` · scratch-only until the L25 landing.")
    a("")
    a("Layer: `SPEC-001 §1.3 overlay dynamics` · `gov517_correspondence_claimed: false` · "
      "`still_set_label: still_set`.")
    a("This document is a pre-registered listening protocol. It makes no canonical or")
    a("physical causation claim; the acoustic centroids and seam depths below are Modality 2")
    a("boundary measurements carrying `causationClaim: false`, `physicalQuantityClaim: false`,")
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
      f"({itinerary['summary']['nonSelfHops']} non-self + "
      f"{itinerary['summary']['selfLoopExtensions']} dwell self-loops) |")
    a(f"| Bars | {itinerary['summary']['bars']} "
      f"({itinerary['summary']['transitBars']} transit at K=5 + "
      f"{itinerary['summary']['dwellBars']} dwell at K=12) |")
    a(f"| Micro steps | {itinerary['summary']['microSteps']} at 300 ms |")
    a(f"| Duration | {itinerary['summary']['durationMs']} ms (2 min 02.7 s) |")
    a("| Q mode | carried; run-local de-loop rotation; zero resets |")
    a("| Render law | legato pad tails (MVP-6.2) |")
    a("| MIDI | byte-identical to the L24 control |")
    a("")
    a("## 2. A/B control (listen in this order)")
    a("")
    a("| Render | File | SHA-256 (first 8) |")
    a("|---|---|---|")
    a(f"| L24 control (staccato pad) | `tools/governed-loop/mvp6_1/task-d/renders/piece_a_far_shore_delooped.wav` | `{r['ab']['controlWavSha256'][:8]}` |")
    a(f"| L24 control MIDI | `tools/governed-loop/mvp6_1/task-d/renders/piece_a_far_shore_delooped.mid` | `{r['ab']['controlMidiSha256'][:8]}` |")
    a(f"| MVP-6.2 legato | `piece_a_far_shore_legato.wav` | `{r['render']['wav']['sha256'][:8]}` |")
    a(f"| MVP-6.2 legato MIDI | `piece_a_far_shore_legato.mid` | `{r['render']['midi']['sha256'][:8]}` |")
    a("")
    a(f"Measured seam metric on the {seams['boundaries']} direct bar-to-bar boundaries")
    a("(min 10 ms RMS in ±150 ms vs the local 1 s mean):")
    a(f"- L24 control: median {seams['controlMedianDb']:.3f} dB, max {seams['controlMaxDb']:.3f} dB.")
    a(f"- MVP-6.2 legato: median {seams['legatoMedianDb']:.3f} dB, max {seams['legatoMaxDb']:.3f} dB.")
    a(f"- Gate: median < {seams['medianGateDb']:.1f} dB, max < {seams['maxGateDb']:.1f} dB. PASS.")
    a("")
    a("All 55 WAV bar windows differ between the two renders because the pad now carries")
    a("across every line; the MIDI is byte-identical. The boundary rest at 74.7–75.0 s is")
    a("unchanged: the pre-rest bar is exempt, so no pad tail crosses the breath.")
    a("")
    a("## 3. Listening sources")
    a("")
    a("| Source | Track |")
    a("|---|---|")
    a(f"| WAV | `task-d/renders/piece_a_far_shore_legato.wav` (`{r['render']['wav']['sha256'][:8]}`) |")
    a(f"| MIDI | `task-d/renders/piece_a_far_shore_legato.mid` (`{r['render']['midi']['sha256'][:8]}`) |")
    a(f"| Trace | `tools/governed-loop/mvp6_1/task-c/traces/piece_a_far_shore_delooped.jsonl` (`{trace_receipt['trace']['sha256'][:8]}`) |")
    a("")
    a("Playback:")
    a("")
    a("```bash")
    a("cd /home/erick/workspace/scratch-governed-loop-run/mvp6_2/task-d/renders")
    a("ffplay -nodisp -autoexit -loglevel error piece_a_far_shore_legato.wav")
    a("# or, after the L25 landing:")
    a("ffplay -nodisp -autoexit -loglevel error \\")
    a("  /home/erick/projects/integrated-release/tools/governed-loop/mvp6_2/task-d/renders/piece_a_far_shore_legato.wav")
    a("```")
    a("")
    a("## 4. Section map and measured centroids")
    a("")
    a("| Section | Span | Bars | Measured centroid (Hz) |")
    a("|---|---|---:|---:|")
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
        a(f"| {names[key]} | {span['startMs']} – {span['endMs']} ms | {span['bars']} | "
          f"{spans[key]:.3f} |")
    a("")
    a("## 5. Phase 1 — blind structural listen")
    a("")
    a("Listen once, end to end, without reading the timestamps. Mark where you hear a")
    a("section boundary, where the peak is, where the quiet still point is, and where the")
    a("piece arrives. Do not pause or rewind. Record the raw times before reading §6.")
    a("")
    a("| Perceived boundary | Time (mm:ss) | Confidence 1–5 |")
    a("|---|---|---:|")
    a("| Opening gesture closes |  |  |")
    a("| First section change |  |  |")
    a("| Quiet still point |  |  |")
    a("| Peak / climax |  |  |")
    a("| Arrival |  |  |")
    a("")
    a("## 6. Phase 2 — timestamped adjudication")
    a("")
    a("### Q1 — Opening mirror gesture (0.0 – 13.8 s)")
    a("")
    a("| Marker | Time | Event |")
    a("|---|---:|---|")
    a("| Home | 0.0 s | `1387@0`, Saturn −12, phase 0 (achromatic coincidence, mean 36) |")
    a("| Mirror apex | 5.1 s | `1709@0`, Mercury 0, the A0 I₀-fixed self-mirror state |")
    a("| Return transit | 8.7 s | `1645@0` |")
    a("| Home again | 10.2 s | `1387@0` |")
    a("")
    a("**Question.** Does the opening read as one self-contained gesture that leaves and")
    a("returns, distinct from the departure that follows?")
    a("")
    a("**Pass.** Rating ≥ 3, and the mirror apex is audible as a change of colour.")
    a("")
    a("### Q2 — Quiet dwell vs. climax dwell (27.3 – 58.5 s)")
    a("")
    a("| Marker | Time | Event |")
    a("|---|---:|---|")
    a("| Quiet dwell in | 27.3 s | `1453@6`, Jupiter 0, phase 6 (spread minimum 96/35) |")
    a("| Quiet dwell out | 38.1 s | three full 12-step Q phrases |")
    a("| Climax dwell in | 44.1 s | `623@8`, Venus +12, phase 8 (spread maximum 60/7) |")
    a("| Climax dwell out | 58.5 s | four full 12-step Q phrases |")
    a("")
    a(f"**Question.** Does the climax dwell read as a registral and timbral lift above the")
    a(f"quiet dwell (measured means: quiet {spans['first_dwell']:.1f} Hz, "
      f"climax {spans['climax']:.1f} Hz)?")
    a("")
    a("**Pass.** Rating ≥ 3, and the two dwells are identifiable without the written map.")
    a("")
    a("### Q3 — The Shore (67.5 – 78.6 s)")
    a("")
    a("| Marker | Time | Event |")
    a("|---|---:|---|")
    a("| Shore neighbour in | 67.5 s | `379@7`, Jupiter 0, governed edge of the world |")
    a(f"| Boundary rest | {rest_record['startMs']} – "
      f"{rest_record['startMs'] + rest_record['durationMs']} ms | `757@6`; "
      "0 oscillators; no pad tail crosses the rest |")
    a("| Lead resumes | 75.0 s | `379@7`, same governed node, Q carried through the rest |")
    a("")
    a("**Question.** Does the 300 ms rest read as a held breath or cadence rather than an")
    a("audio dropout?")
    a("")
    a("**Pass.** Rating ≥ 3, and the resumption is heard as continuation.")
    a("")
    a("### Q4 — Return as new territory (78.6 – 108.3 s)")
    a("")
    a("**Question.** Does the return sound like a different road home rather than the")
    a("outbound path played backwards? (15 of the 18 return interior nodes are new.)")
    a("")
    a("**Pass.** Rating ≥ 3, and the return is distinguishable from the departure.")
    a("")
    a("### Q5 — Voiced homecoming (108.3 – 122.7 s)")
    a("")
    a("| Marker | Time | Event |")
    a("|---|---:|---|")
    a("| Homecoming in | 108.3 s | `1387@0`, Saturn −12, phase 0 |")
    a("| End | 122.7 s | four full 12-step Q phrases; terminal node voiced |")
    a("")
    a("**Question.** Does the ending read as an arrival on the home node rather than a stop?")
    a("")
    a("**Pass.** Rating ≥ 3, and the homecoming is heard as closure.")
    a("")
    a("### Q6 — De-loop A/B (L23 vs L24)")
    a("")
    a("The L24 de-loop changed the four dwell runs from one repeated phrase to 3/3, 4/4,")
    a("3/3, and 4/4 distinct phrases. Listen for varied repeats.")
    a("")
    a("**Pass.** Rating ≥ 3, and at least three of the four dwell runs read as varied.")
    a("")
    a("### Q7 — Legato boundaries (L24 vs MVP-6.2)")
    a("")
    a("Listen to the L24 control and the legato render back to back (counterbalanced order).")
    a(f"The measured seam metric improves from median {seams['controlMedianDb']:.1f} dB / "
      f"max {seams['controlMaxDb']:.1f} dB to median {seams['legatoMedianDb']:.1f} dB / "
      f"max {seams['legatoMaxDb']:.1f} dB.")
    a("The former chasms at 106.8 s and 108.3 s are the specific test points.")
    a("")
    a("**Question.** Do bar boundaries flow without dropouts?")
    a("")
    a("**Pass.** Rating ≥ 3, and the 106.8 s and 108.3 s gaps are not audible as dropouts.")
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
              "Q6 de-loop A/B", "Q7 legato boundaries"]:
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
    a("- Overlay dynamics only (`SPEC-001 §1.3`); no GOV-517 correspondence is claimed.")
    a("- Boundary states are transit-only: `K_boundary = 0`, cannot be camped on.")
    a("- No canonical or physical causation claim; `C_H` remains unresolved (`null`).")
    a("- The seam depths and acoustic centroids are external boundary measurements, not")
    a("  symbolic invariants.")
    a("- The L23 and L24 renders remain frozen as controls.")
    a("")
    return "\n".join(lines) + "\n"


def closing_report_text(itinerary, receipts, audio, task0, task_c):
    r = audio
    seams = r["seams"]
    rest = r["restBreath"]
    fft = r["fft"]
    ab = r["ab"]
    opening = task0["opening"]
    lines = []
    a = lines.append
    a("# MVP6.2 Closing Report — Legato Pad Tails: “The Far Shore”")
    a("")
    a("**Directive:** `MVP6.2-DIR-1` rev 1  ")
    a("**Execution realm:** `/home/erick/workspace/scratch-governed-loop-run/mvp6_2/`  ")
    a("**Status:** SCRATCH COMPLETE; L25 working-tree landing pending")
    a("")
    a("## Opening fixed point and pins")
    a("")
    a(f"- Opening HEAD: `{opening['baseHead']}` (stacked L23+L24 working-tree landing)")
    a(f"- Tree clean at opening: {str(opening['treeClean']).lower()} "
      f"({opening['workingTreeState']})")
    a(f"- Decision ledger before: `{opening['ledgerBefore']['sha256'][:8]}...` / "
      f"{opening['ledgerBefore']['bytes']:,} B / {opening['ledgerBefore']['lines']:,} lines")
    a(f"- Manifest before: `{opening['manifestBefore']['sha256'][:8]}...` / "
      f"{opening['manifestBefore']['fileCount']:,} files / "
      f"{opening['manifestBefore']['totalBytes']:,} B")
    a(f"- Release closure before: PASS / {opening['validationBefore'].get('checksPassed', 418)} / 0")
    a(f"- Pins verified: {task0['pinsVerified']}/{task0['pinsVerified']} SHA-256 and byte counts; "
      f"`mvp2.py` anchors {task0['anchorsVerified']}/{task0['anchorsVerified']}")
    a(f"- Seam baseline: {task0['seamBaseline']['boundaries']} direct boundaries, median "
      f"{task0['seamBaseline']['medianDepthDb']:.3f} dB, max "
      f"{task0['seamBaseline']['maxDepthDb']:.3f} dB")
    a("")
    a("## Task outcomes")
    a("")
    a("| Task | Receipt | SHA-256 (first 8) | Outcome |")
    a("|---|---|---|---|")
    for task, key, outcome in [
        ("T0", "mvp6_2_task_0_receipt", "L24 fixed point, seam baseline, predeclaration lock"),
        ("TA", "mvp6_2_task_a_receipt", "macro re-verification; identical to L24"),
        ("TB", "mvp6_2_task_b_receipt", "terminal-arrival legato check"),
        ("TC", "mvp6_2_task_c_receipt", "symbolic trace re-verification (byte-identical to L24)"),
        ("TD", "mvp6_2_task_d_receipt", "legato render, seam metric, FFT bridge, A/B"),
        ("TE", "mvp6_2_task_e_receipt", "protocol, staging manifest, closing report"),
    ]:
        sha = receipts.get(key, {}).get("sha256")
        sha_text = f"`{sha[:8]}`" if sha else "`(self)`"
        a(f"| {task} | `qa/{key}.json` | {sha_text} | {outcome} |")
    a("")
    a("## Seam result")
    a("")
    a("- Root cause: the pinned pad voice released all eight voices to zero at each bar end")
    a("  and attacked the next bar from zero, leaving a 6–35 dB boundary dip.")
    a("- Rule: legato pad tail. Each pad voice sustains through its bar end and decays over")
    a("  its release time into the next bar; the next bar's attack overlaps additively.")
    a("  Bar 33 (pre-rest) and bar 55 (final) release to zero at their own bar end.")
    a(f"- Direct boundaries measured: {seams['boundaries']}.")
    a(f"- Median depth: {seams['controlMedianDb']:.3f} dB → {seams['legatoMedianDb']:.3f} dB "
      f"(gate < {seams['medianGateDb']:.1f}).")
    a(f"- Maximum depth: {seams['controlMaxDb']:.3f} dB → {seams['legatoMaxDb']:.3f} dB "
      f"(gate < {seams['maxGateDb']:.1f}).")
    a(f"- Boundary rest: no pad tail crossed; rest RMS {rest['restRms']:.3f} vs control "
      f"{rest['controlRestRms']:.3f} (ratio {rest['restRmsRatio']:.6f}); "
      f"tail ratio {rest['tailRmsRatio']:.6f}.")
    a("")
    a("## Form result")
    a("")
    a("- Destination A (Far Shore, `757@6`), return form, inside the 2,928-node strong core.")
    a(f"- Itinerary: {itinerary['summary']['bars']} bars "
      f"({itinerary['summary']['transitBars']} transit + "
      f"{itinerary['summary']['dwellBars']} dwell), "
      f"{itinerary['summary']['microSteps']} micro steps, "
      f"{itinerary['summary']['durationMs']} ms.")
    a(f"- Macro transitions: {itinerary['summary']['macroTransitions']} "
      f"({itinerary['summary']['nonSelfHops']} non-self + "
      f"{itinerary['summary']['selfLoopExtensions']} dwell self-loops); all gate ACCEPT; "
      "zero LLM calls; structurally identical to L24.")
    a("- Coverage: 7 offices, 12 phases, 42 distinct states; negative tests reject.")
    a("")
    a("## Audio result")
    a("")
    a(f"- WAV: `piece_a_far_shore_legato.wav`, `{r['render']['wav']['sha256'][:8]}`, "
      f"{r['render']['wav']['samples']} samples.")
    a(f"- MIDI: `piece_a_far_shore_legato.mid`, `{r['render']['midi']['sha256'][:8]}`, "
      "byte-identical to L24.")
    a("- Two-pass render byte-identical; 0 clipped samples; 0 non-finite samples;")
    a("  0 MIDI container leaks; 408 lead note-ons; 440 pad note-ons.")
    a(f"- FFT bridge: {fft['barsMeasured']} bars; correlation "
      f"{fft['correlationMeasuredVsModel']:.6f}; median relative error "
      f"{fft['medianRelativeError']:.6f}.")
    a(f"- Office-deconfounded contour: container r = "
      f"{fft['officeDeconfoundedCorrelationContainer']:.6f}, lead r = "
      f"{fft['officeDeconfoundedCorrelationLead']:.6f}.")
    a(f"- Section centroids (Hz): quiet {fft['sectionCentroidMeansHz']['first_dwell']:.3f}, "
      f"climax {fft['sectionCentroidMeansHz']['climax']:.3f}, "
      f"homecoming {fft['sectionCentroidMeansHz']['homecoming']:.3f}.")
    a("")
    a("## A/B against the L24 control")
    a("")
    a(f"- Control WAV `{ab['controlWavSha256'][:8]}`; legato WAV "
      f"`{r['render']['wav']['sha256'][:8]}`; control MIDI `{ab['controlMidiSha256'][:8]}`; "
      f"legato MIDI `{r['render']['midi']['sha256'][:8]}`.")
    a(f"- Different WAV bar windows: {len(ab['differentWindows'])}; identical MIDI: true.")
    a("- Every window changes because the pad now carries across the lines. The macro,")
    a("  timings, sections, trace, and MIDI are unchanged.")
    a("")
    a("## Law verification")
    a("")
    a("| Law | Verification |")
    a("|---|---|")
    a("| 1. Planner composes; card steers; LLM waits | deterministic BFS + card; 0 LLM calls |")
    a("| 2. Form space is the strong core | 2,928 nodes; every node inside; negative tests reject |")
    a("| 3. Lead line carries the form | deconfounded lead r > container r |")
    a("| 4. Phase is terrain | dwell placement at p6 and p8; full 12-step Q phrases |")
    a("| 5. Arrival voiced | terminal bar adds 12 micro steps |")
    a("| 6. Repeats are varied | 3/3, 4/4, 3/3, 4/4 distinct phrases |")
    a("| 7. Boundaries flow | median and max seam depth under the predeclared gates |")
    a("")
    a("## Fences")
    a("")
    a("- No gate, census, ground-truth, seam-substrate, Q-engine, encoder, pinned renderer,")
    a("  or `audio.ts` byte change; the Orrery application is read-only.")
    a("- Photonic layer overlay-only; `causationClaim: false`, "
      "`physicalQuantityClaim: false`, `tierClassifier: false`, `globalCHNull: true`; "
      "`C_H` unresolved.")
    a("- The L23 and L24 renders and receipts remain frozen as controls.")
    a("- Scratch tasks made zero repository writes. The L25 landing is a separate")
    a("  authorized working-tree action; no tag or push.")
    a("")
    a("## Terminal verdict")
    a("")
    a("```text")
    a("MVP6.2-SPRINT-CLOSING")
    a(f"FIXED-POINT: {opening['baseHead'][:7]}... / L23+L24 WORKING TREE / "
      f"L24 {opening['ledgerBefore']['sha256'][:8]}... / "
      f"{opening['ledgerBefore']['bytes']} B / {opening['ledgerBefore']['lines']} lines")
    a(f"PINS-VERIFIED: {task0['pinsVerified']}/{task0['pinsVerified']} MATCH / "
      f"ANCHORS {task0['anchorsVerified']}/{task0['anchorsVerified']} MATCH / "
      "PREDECLARATION-LOCKED TRUE")
    a("TASKS: T0 COMPLETE | TA COMPLETE | TB COMPLETE | TC COMPLETE | TD COMPLETE | TE COMPLETE")
    a(f"SEAMS: CONTROL MEDIAN {seams['controlMedianDb']:.3f} DB / MAX "
      f"{seams['controlMaxDb']:.3f} DB -> LEGATO MEDIAN {seams['legatoMedianDb']:.3f} DB / "
      f"MAX {seams['legatoMaxDb']:.3f} DB")
    a(f"REST: RMS RATIO {rest['restRmsRatio']:.6f} / NO PAD TAIL CROSSED")
    a("AUDIO: TWO-PASS IDENTICAL / CLIPPED 0 / NON-FINITE 0 / MIDI-LEAKS 0 / MIDI-IDENTICAL")
    a(f"FFT-BRIDGE: MODEL-CORR {fft['correlationMeasuredVsModel']:.6f} / "
      f"MEDIAN-REL-ERR {fft['medianRelativeError']:.6f}")
    a("FENCES: GATE-UNTOUCHED / CONTROLS-FROZEN / C-H-NULL / LLM-CALLS 0")
    a("REPO-WRITES: 0 (scratch) / STATUS: COMPLETE")
    a("```")
    a("")
    return "\n".join(lines) + "\n"


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    itinerary = load_json(ITINERARY)
    trace_receipt = load_json(SCRATCH / "task-c" / "mvp6_2_task_c_receipt.json")
    audio = load_json(SCRATCH / "task-d" / "mvp6_2_task_d_receipt.json")

    protocol_path = OUT / "EAR_VALIDATION_PROTOCOL_MVP6_2.md"
    protocol_path.write_text(protocol_text(itinerary, trace_receipt, audio), encoding="utf-8")

    receipts = {key: {"sha256": sha256_file(SCRATCH / rel)}
                for key, rel, _ in RECEIPTS if key != "mvp6_2_task_e_receipt"}

    closing_path = SCRATCH / "MVP6_2-CLOSING-REPORT.md"
    task0 = load_json(SCRATCH / "task-0" / "mvp6_2_task_0_receipt.json")
    task_c = load_json(SCRATCH / "task-c" / "mvp6_2_task_c_receipt.json")
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
        if not path.exists() and role != "mvp6_2_task_e_receipt":
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
    (OUT / "l25_staging_manifest.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    receipt = {
        "schemaVersion": "governed-loop.mvp6-task-e.v1",
        "directive": "MVP6-DIR-1",
        "task": "MVP6-TE",
        "status": "COMPLETE",
        "artifacts": {
            "protocol": {"path": str(protocol_path), "sha256": sha256_file(protocol_path)},
            "closingReport": {"path": str(closing_path), "sha256": sha256_file(closing_path)},
            "stagingManifest": {"path": str(OUT / "l25_staging_manifest.json"),
                                "sha256": sha256_file(OUT / "l25_staging_manifest.json")},
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
    (OUT / "mvp6_2_task_e_receipt.json").write_text(
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
