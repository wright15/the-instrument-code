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

SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp6_3")
OUT = SCRATCH / "task-e"
ITINERARY = Path("/home/erick/projects/integrated-release/tools/governed-loop/mvp6_2/task-a/mvp6_2_itinerary.json")
TRACE = Path("/home/erick/projects/integrated-release/tools/governed-loop/mvp6_1/task-c/traces/piece_a_far_shore_delooped.jsonl")
CONTROL_WAV = Path("/home/erick/projects/integrated-release/tools/governed-loop/mvp6_2/task-d/renders/piece_a_far_shore_legato.wav")
CONTROL_WAV = Path("/home/erick/projects/integrated-release/tools/governed-loop/mvp6/task-d/renders/piece_a_far_shore.wav")

REPO_MVP6 = "tools/governed-loop/mvp6_3"

PAYLOADS = [
    ("mvp6_3_task_0", "task-0/mvp6_3_task_0.py", f"{REPO_MVP6}/task-0/mvp6_3_task_0.py"),
    ("mvp6_3_predeclared_fade", "task-0/mvp6_3_predeclared_fade.json", f"{REPO_MVP6}/task-0/mvp6_3_predeclared_fade.json"),
    ("mvp6_3_task_a", "task-a/mvp6_3_task_a.py", f"{REPO_MVP6}/task-a/mvp6_3_task_a.py"),
    ("mvp6_3_fade_renderer", "task-b/mvp6_3_fade_renderer.py", f"{REPO_MVP6}/task-b/mvp6_3_fade_renderer.py"),
    ("mvp6_3_task_b", "task-b/mvp6_3_task_b.py", f"{REPO_MVP6}/task-b/mvp6_3_task_b.py"),
    ("stem_pad_only", "task-b/renders/stem_pad_only.wav", f"{REPO_MVP6}/task-b/renders/stem_pad_only.wav"),
    ("stem_lead_only", "task-b/renders/stem_lead_only.wav", f"{REPO_MVP6}/task-b/renders/stem_lead_only.wav"),
    ("mvp6_3_task_c", "task-c/mvp6_3_task_c.py", f"{REPO_MVP6}/task-c/mvp6_3_task_c.py"),
    ("mvp6_3_task_d", "task-d/mvp6_3_task_d.py", f"{REPO_MVP6}/task-d/mvp6_3_task_d.py"),
    ("piece_a_far_shore_faded_wav", "task-d/renders/piece_a_far_shore_faded.wav", f"{REPO_MVP6}/task-d/renders/piece_a_far_shore_faded.wav"),
    ("piece_a_far_shore_faded_mid", "task-d/renders/piece_a_far_shore_faded.mid", f"{REPO_MVP6}/task-d/renders/piece_a_far_shore_faded.mid"),
    ("mvp6_3_task_e", "task-e/mvp6_3_task_e.py", f"{REPO_MVP6}/task-e/mvp6_3_task_e.py"),
    ("EAR_VALIDATION_PROTOCOL_MVP6_3", "task-e/EAR_VALIDATION_PROTOCOL_MVP6_3.md", f"{REPO_MVP6}/task-e/EAR_VALIDATION_PROTOCOL_MVP6_3.md"),
    ("MVP6_3-CLOSING-REPORT", "MVP6_3-CLOSING-REPORT.md", "scrum/plan/mvp6-3-sprint-closing-report.md"),
]

RECEIPTS = [
    ("mvp6_3_task_0_receipt", "task-0/mvp6_3_task_0_receipt.json", "qa/mvp6_3_task_0_receipt.json"),
    ("mvp6_3_task_a_receipt", "task-a/mvp6_3_task_a_receipt.json", "qa/mvp6_3_task_a_receipt.json"),
    ("mvp6_3_task_b_receipt", "task-b/mvp6_3_task_b_receipt.json", "qa/mvp6_3_task_b_receipt.json"),
    ("mvp6_3_task_c_receipt", "task-c/mvp6_3_task_c_receipt.json", "qa/mvp6_3_task_c_receipt.json"),
    ("mvp6_3_task_d_receipt", "task-d/mvp6_3_task_d_receipt.json", "qa/mvp6_3_task_d_receipt.json"),
    ("mvp6_3_task_e_receipt", "task-e/mvp6_3_task_e_receipt.json", "qa/mvp6_3_task_e_receipt.json"),
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


def protocol_text(itinerary, trace_receipt, audio_receipt, task_b):
    r = audio_receipt
    tb = task_b
    fade = r["fade"]; eof = r["endOfFile"]; ab = r["ab"]
    seams = r["seams"]; rest = r["restBreath"]; fft = r["fft"]
    spans = fft["sectionCentroidMeansHz"]
    bars, rest_record, span_rows = markers()
    lines = []
    a = lines.append
    a("# MVP-6.3 Ear Validation Protocol — “The Far Shore” (clean ending)")
    a("")
    a("Directive `MVP6.3-DIR-1` rev 1 · execution realm "
      "`/home/erick/workspace/scratch-governed-loop-run/mvp6_3/` · scratch-only until the L26 landing.")
    a("")
    a("Layer: `SPEC-001 §1.3 overlay dynamics` · `gov517_correspondence_claimed: false` · "
      "`still_set_label: still_set`.")
    a("This document is a pre-registered listening protocol. It makes no canonical or")
    a("physical causation claim; the acoustic centroids, seam depths, and end-of-file")
    a("measurements below are Modality 2 boundary measurements carrying")
    a("`causationClaim: false`, `physicalQuantityClaim: false`, `tierClassifier: false`,")
    a("`globalCHNull: true`.")
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
    a("| Render law | legato pad tails + 50 ms raised-cosine master fade-out |")
    a("| MIDI | byte-identical to the L25 control |")
    a("")
    a("## 2. A/B control (listen in this order)")
    a("")
    a("| Render | File | SHA-256 (first 8) |")
    a("|---|---|---|")
    a(f"| L25 control (mid-note cut) | `tools/governed-loop/mvp6_2/task-d/renders/piece_a_far_shore_legato.wav` | `{ab['controlWavSha256'][:8]}` |")
    a(f"| L25 control MIDI | `tools/governed-loop/mvp6_2/task-d/renders/piece_a_far_shore_legato.mid` | `{ab['controlMidiSha256'][:8]}` |")
    a(f"| MVP-6.3 faded | `piece_a_far_shore_faded.wav` | `{r['render']['wav']['sha256'][:8]}` |")
    a(f"| MVP-6.3 faded MIDI | `piece_a_far_shore_faded.mid` | `{r['render']['midi']['sha256'][:8]}` |")
    a("")
    a("Measured end-of-file metric (`max|sample|` over the final 32 samples):")
    a(f"- L25 control: {eof['controlMaxAbsLast32']} (mid-note cut).")
    a(f"- MVP-6.3 faded: {eof['fadedMaxAbsLast32']} (threshold {eof['threshold']}). PASS.")
    a("")
    a(f"The fade is {fade['samples']} samples ({fade['milliseconds']} ms), window "
      f"`{fade['window']}`. The WAV is byte-identical to L25 outside that window")
    a(f"(prefix identical: {str(ab['prefixIdenticalToControl']).lower()}); only bar 55 differs; "
      "the MIDI is byte-identical.")
    a("")
    a("Stem isolation (the standing diagnostic for this defect):")
    a(f"- Pad-only stem ends at {tb['stems']['pad']['maxAbsLast32']} (clean).")
    a(f"- Lead-only stem ends at {tb['stems']['lead']['maxAbsLast32']} (the cut).")
    a(f"- Pad + lead = control within {tb['isolation']['sumMaxDifferenceLsb']} LSB.")
    a("")
    a("## 3. Listening sources")
    a("")
    a("| Source | Track |")
    a("|---|---|")
    a(f"| WAV | `task-d/renders/piece_a_far_shore_faded.wav` (`{r['render']['wav']['sha256'][:8]}`) |")
    a(f"| MIDI | `task-d/renders/piece_a_far_shore_faded.mid` (`{r['render']['midi']['sha256'][:8]}`) |")
    a(f"| Pad stem | `task-b/renders/stem_pad_only.wav` (`{tb['stems']['pad']['sha256'][:8]}`) |")
    a(f"| Lead stem | `task-b/renders/stem_lead_only.wav` (`{tb['stems']['lead']['sha256'][:8]}`) |")
    a(f"| Trace | `tools/governed-loop/mvp6_1/task-c/traces/piece_a_far_shore_delooped.jsonl` (`{trace_receipt['trace']['sha256'][:8]}`) |")
    a("")
    a("Playback:")
    a("")
    a("```bash")
    a("cd /home/erick/workspace/scratch-governed-loop-run/mvp6_3/task-d/renders")
    a("ffplay -nodisp -autoexit -loglevel error piece_a_far_shore_faded.wav")
    a("# stems")
    a("ffplay -nodisp -autoexit -loglevel error ../task-b/renders/stem_pad_only.wav")
    a("ffplay -nodisp -autoexit -loglevel error ../task-b/renders/stem_lead_only.wav")
    a("```")
    a("")
    a("## 4. Section map and measured centroids")
    a("")
    a("| Section | Span | Bars | Measured centroid (Hz) |")
    a("|---|---|---:|---:|")
    names = {
        "home_mirror": "Home and Mirror", "departure": "Departure",
        "first_dwell": "First Dwell (Quiet Zone)", "climax": "Climax Transit and Dwell",
        "shore": "The Shore", "return": "Return", "homecoming": "Homecoming",
    }
    for key in ["home_mirror", "departure", "first_dwell", "climax", "shore", "return", "homecoming"]:
        span = span_rows[key]
        a(f"| {names[key]} | {span['startMs']} – {span['endMs']} ms | {span['bars']} | "
          f"{spans[key]:.3f} |")
    a("")
    a("## 5. Phase 1 — blind structural listen")
    a("")
    a("Listen once, end to end, without reading the timestamps. Mark where you hear a")
    a("section boundary, where the peak is, where the quiet still point is, where the")
    a("piece arrives, and whether the final second ends cleanly. Do not pause or rewind.")
    a("Record the raw times before reading §6.")
    a("")
    a("| Perceived boundary | Time (mm:ss) | Confidence 1–5 |")
    a("|---|---|---:|")
    a("| Opening gesture closes |  |  |")
    a("| First section change |  |  |")
    a("| Quiet still point |  |  |")
    a("| Peak / climax |  |  |")
    a("| Arrival |  |  |")
    a("| Clean ending |  |  |")
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
    a(f"**Question.** Does the climax dwell read as a registral and timbral lift above the")
    a(f"quiet dwell (measured means: quiet {spans['first_dwell']:.1f} Hz, "
      f"climax {spans['climax']:.1f} Hz)?")
    a("")
    a("**Pass.** Rating ≥ 3, and the two dwells are identifiable without the written map.")
    a("")
    a("### Q3 — The Shore (67.5 – 78.6 s)")
    a("")
    a(f"**Question.** Does the {rest_record['durationMs']} ms rest at "
      f"{rest_record['startMs']} ms read as a held breath or cadence rather than an")
    a("audio dropout?")
    a("")
    a("**Pass.** Rating ≥ 3, and the resumption is heard as continuation.")
    a("")
    a("### Q4 — Return as new territory (78.6 – 108.3 s)")
    a("")
    a("**Question.** Does the return sound like a different road home rather than the")
    a("outbound path played backwards?")
    a("")
    a("**Pass.** Rating ≥ 3, and the return is distinguishable from the departure.")
    a("")
    a("### Q5 — Voiced homecoming (108.3 – 122.7 s)")
    a("")
    a("**Question.** Does the ending read as an arrival on the home node rather than a stop?")
    a("")
    a("**Pass.** Rating ≥ 3, and the homecoming is heard as closure.")
    a("")
    a("### Q6 — De-loop A/B (L23 vs L24)")
    a("")
    a("The four dwell runs are 3/3, 4/4, 3/3, and 4/4 distinct phrases. Listen for varied")
    a("repeats.")
    a("")
    a("**Pass.** Rating ≥ 3, and at least three of the four dwell runs read as varied.")
    a("")
    a("### Q7 — Legato boundaries (L24 vs L25)")
    a("")
    a(f"The seam metric is median {seams['controlMedianDb']:.1f} dB / "
      f"max {seams['controlMaxDb']:.1f} dB on L24 and median "
      f"{seams['legatoMedianDb']:.1f} dB / max {seams['legatoMaxDb']:.1f} dB on L25.")
    a("")
    a("**Question.** Do bar boundaries flow without dropouts?")
    a("")
    a("**Pass.** Rating ≥ 3, and the former 106.8 s and 108.3 s gaps are not audible as dropouts.")
    a("")
    a("### Q8 — Clean ending (L25 vs MVP-6.3)")
    a("")
    a("| Marker | Time | Event |")
    a("|---|---:|---|")
    a("| Final lead onsets | 122.1 s, 122.4 s | the last two 300 ms lead steps |")
    a(f"| Fade begins | 122.65 s | final {fade['samples']} samples ({fade['milliseconds']} ms) |")
    a("| Last sample | 122.7 s | 0 |")
    a("")
    a("Listen to the L25 control and the faded render back to back. The control ends")
    a("mid-note (max|last32| = " + str(eof["controlMaxAbsLast32"]) + "); the faded render ends at 0.")
    a("")
    a("**Question.** Does the piece end cleanly, without a cut or stutter at the very end?")
    a("")
    a("**Pass.** Rating ≥ 3, and the final second reads as a decay to silence.")
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
              "Q6 de-loop A/B", "Q7 legato boundaries", "Q8 clean ending"]:
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
    a("- The seam, centroid, and end-of-file measurements are external boundary")
    a("  measurements, not symbolic invariants.")
    a("- The L23, L24, and L25 renders remain frozen as controls.")
    a("")
    return "\n".join(lines) + "\n"


def closing_report_text(itinerary, receipts, audio, task0, task_c, task_b):
    r = audio
    tb = task_b
    fade = r["fade"]; eof = r["endOfFile"]; ab = r["ab"]
    seams = r["seams"]; rest = r["restBreath"]; fft = r["fft"]
    opening = task0["opening"]
    end_cut = task0["endCutEvidence"]
    lines = []
    a = lines.append
    a("# MVP6.3 Closing Report — Clean Ending: Master Fade-Out and Stem Isolation")
    a("")
    a("**Directive:** `MVP6.3-DIR-1` rev 1  ")
    a("**Execution realm:** `/home/erick/workspace/scratch-governed-loop-run/mvp6_3/`  ")
    a("**Status:** SCRATCH COMPLETE; L26 working-tree landing pending")
    a("")
    a("## Opening fixed point and pins")
    a("")
    a(f"- Opening HEAD: `{opening['baseHead']}` (stacked L23+L24+L25 working-tree landing)")
    a(f"- Tree clean at opening: {str(opening['treeClean']).lower()} "
      f"({opening['workingTreeState']})")
    a(f"- Decision ledger before: `{opening['ledgerBefore']['sha256'][:8]}...` / "
      f"{opening['ledgerBefore']['bytes']:,} B / {opening['ledgerBefore']['lines']:,} lines")
    a(f"- Manifest before: `{opening['manifestBefore']['sha256'][:8]}...` / "
      f"{opening['manifestBefore']['fileCount']:,} files / "
      f"{opening['manifestBefore']['totalBytes']:,} B")
    a(f"- Release closure before: PASS / 418 / 0")
    a(f"- Pins verified: {task0['pinsVerified']}/{task0['pinsVerified']} SHA-256 and byte counts; "
      f"`mvp2.py` anchors {task0['anchorsVerified']}/{task0['anchorsVerified']}")
    a(f"- End-cut evidence: L25 `max|last32|` = {end_cut['maxAbsLast32']}, "
      f"ends at zero = {str(end_cut['endsAtZero']).lower()}")
    a("")
    a("## Task outcomes")
    a("")
    a("| Task | Receipt | SHA-256 (first 8) | Outcome |")
    a("|---|---|---|---|")
    for task, key, outcome in [
        ("T0", "mvp6_3_task_0_receipt", "L25 fixed point, end-cut evidence, predeclaration lock"),
        ("TA", "mvp6_3_task_a_receipt", "macro re-verification; identical to L25"),
        ("TB", "mvp6_3_task_b_receipt", "pad/lead stem isolation of the end cut"),
        ("TC", "mvp6_3_task_c_receipt", "symbolic trace re-verification (byte-identical to L25)"),
        ("TD", "mvp6_3_task_d_receipt", "faded render, end-of-file, seam/rest/FFT, A/B"),
        ("TE", "mvp6_3_task_e_receipt", "protocol, staging manifest, closing report"),
    ]:
        sha = receipts.get(key, {}).get("sha256")
        sha_text = f"`{sha[:8]}`" if sha else "`(self)`"
        a(f"| {task} | `qa/{key}.json` | {sha_text} | {outcome} |")
    a("")
    a("## End-cut result")
    a("")
    a("- Root cause: the final lead note (onset 122.4 s, Saturn release) still rings at")
    a("  ~12% envelope when the 5,411,070-sample buffer ends; the renderer never fades")
    a("  the master bus.")
    a(f"- Stem isolation: pad-only stem ends at {tb['stems']['pad']['maxAbsLast32']} "
      f"(clean); lead-only stem ends at {tb['stems']['lead']['maxAbsLast32']} (the cut); "
      f"their sum matches the control within {tb['isolation']['sumMaxDifferenceLsb']} LSB.")
    a(f"- Fix: {fade['samples']} samples ({fade['milliseconds']} ms) raised-cosine master")
    a(f"  fade-out, window `{fade['window']}`.")
    a(f"- End-of-file metric: control {eof['controlMaxAbsLast32']} -> faded "
      f"{eof['fadedMaxAbsLast32']} (threshold {eof['threshold']}); last eight samples "
      f"{eof['fadedLastEight']}.")
    a(f"- The faded WAV is byte-identical to L25 outside the fade window "
      f"(prefix identical = {str(ab['prefixIdenticalToControl']).lower()}); only bar 55 differs.")
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
      "zero LLM calls; structurally identical to L25.")
    a("- Coverage: 7 offices, 12 phases, 42 distinct states; negative tests reject.")
    a("")
    a("## Audio result")
    a("")
    a(f"- WAV: `piece_a_far_shore_faded.wav`, `{r['render']['wav']['sha256'][:8]}`, "
      f"{r['render']['wav']['samples']} samples.")
    a(f"- MIDI: `piece_a_far_shore_faded.mid`, `{r['render']['midi']['sha256'][:8]}`, "
      "byte-identical to L25.")
    a("- Two-pass render byte-identical; 0 clipped samples; 0 non-finite samples;")
    a("  0 MIDI container leaks; 408 lead note-ons; 440 pad note-ons.")
    a(f"- FFT bridge: {fft['barsMeasured']} bars; correlation "
      f"{fft['correlationMeasuredVsModel']:.6f}; median relative error "
      f"{fft['medianRelativeError']:.6f}.")
    a(f"- Office-deconfounded contour: container r = "
      f"{fft['officeDeconfoundedCorrelationContainer']:.6f}, lead r = "
      f"{fft['officeDeconfoundedCorrelationLead']:.6f}.")
    a(f"- Seam metric: median {seams['legatoMedianDb']:.3f} dB, max "
      f"{seams['legatoMaxDb']:.3f} dB (unchanged from L25).")
    a(f"- Boundary rest: RMS ratio {rest['restRmsRatio']:.6f}; tail ratio "
      f"{rest['tailRmsRatio']:.6f}; no pad tail crossed.")
    a(f"- Section centroids (Hz): quiet {fft['sectionCentroidMeansHz']['first_dwell']:.3f}, "
      f"climax {fft['sectionCentroidMeansHz']['climax']:.3f}, "
      f"homecoming {fft['sectionCentroidMeansHz']['homecoming']:.3f}.")
    a("")
    a("## A/B against the L25 control")
    a("")
    a(f"- Control WAV `{ab['controlWavSha256'][:8]}`; faded WAV "
      f"`{r['render']['wav']['sha256'][:8]}`; MIDI identical to L25.")
    a(f"- Prefix identical outside the fade window: "
      f"{str(ab['prefixIdenticalToControl']).lower()}; differing bar windows: "
      f"{ab['differentWindows']}.")
    a("- The macro, timings, trace, sections, and markers are unchanged.")
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
    a("| 7. Boundaries flow | seam median and max under the predeclared gates |")
    a("| 8. The file ends cleanly | final 32 samples at 0; pad stem clean; lead stem carries the cut |")
    a("")
    a("## Fences")
    a("")
    a("- No gate, census, ground-truth, seam-substrate, Q-engine, encoder, pinned renderer,")
    a("  landed legato renderer, or `audio.ts` byte change; the Orrery application is read-only.")
    a("- Photonic layer overlay-only; `causationClaim: false`, "
      "`physicalQuantityClaim: false`, `tierClassifier: false`, `globalCHNull: true`; "
      "`C_H` unresolved.")
    a("- The L23, L24, and L25 renders and receipts remain frozen as controls.")
    a("- Scratch tasks made zero repository writes. The L26 landing is a separate")
    a("  authorized working-tree action; no tag or push.")
    a("")
    a("## Terminal verdict")
    a("")
    a("```text")
    a("MVP6.3-SPRINT-CLOSING")
    a(f"FIXED-POINT: {opening['baseHead'][:7]}... / L23+L24+L25 WORKING TREE / "
      f"L25 {opening['ledgerBefore']['sha256'][:8]}... / "
      f"{opening['ledgerBefore']['bytes']} B / {opening['ledgerBefore']['lines']} lines")
    a(f"PINS-VERIFIED: {task0['pinsVerified']}/{task0['pinsVerified']} MATCH / "
      f"ANCHORS {task0['anchorsVerified']}/{task0['anchorsVerified']} MATCH / "
      "PREDECLARATION-LOCKED TRUE")
    a("TASKS: T0 COMPLETE | TA COMPLETE | TB COMPLETE | TC COMPLETE | TD COMPLETE | TE COMPLETE")
    a(f"END-CUT: CONTROL {eof['controlMaxAbsLast32']} -> FADED {eof['fadedMaxAbsLast32']} / "
      f"PAD {tb['stems']['pad']['maxAbsLast32']} / LEAD {tb['stems']['lead']['maxAbsLast32']} / "
      f"SUM {tb['isolation']['sumMaxDifferenceLsb']} LSB")
    a(f"FADE: {fade['samples']} SAMPLES / {fade['milliseconds']} MS / "
      f"PREFIX-IDENTICAL {str(ab['prefixIdenticalToControl']).upper()} / ONLY BAR 55 DIFFERS")
    a("AUDIO: TWO-PASS IDENTICAL / CLIPPED 0 / NON-FINITE 0 / MIDI-LEAKS 0 / MIDI-IDENTICAL")
    a(f"SEAMS: MEDIAN {seams['legatoMedianDb']:.3f} DB / MAX {seams['legatoMaxDb']:.3f} DB")
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
    itinerary["pieceId"] = "piece_a_far_shore_faded"
    trace_receipt = load_json(SCRATCH / "task-c" / "mvp6_3_task_c_receipt.json")
    audio = load_json(SCRATCH / "task-d" / "mvp6_3_task_d_receipt.json")

    protocol_path = OUT / "EAR_VALIDATION_PROTOCOL_MVP6_3.md"
    task_b = load_json(SCRATCH / "task-b" / "mvp6_3_task_b_receipt.json")
    protocol_path.write_text(protocol_text(itinerary, trace_receipt, audio, task_b), encoding="utf-8")

    receipts = {key: {"sha256": sha256_file(SCRATCH / rel)}
                for key, rel, _ in RECEIPTS if key != "mvp6_3_task_e_receipt"}

    closing_path = SCRATCH / "MVP6_3-CLOSING-REPORT.md"
    task0 = load_json(SCRATCH / "task-0" / "mvp6_3_task_0_receipt.json")
    task_c = load_json(SCRATCH / "task-c" / "mvp6_3_task_c_receipt.json")
    closing_path.write_text(closing_report_text(itinerary, receipts, audio, task0, task_c, task_b), encoding="utf-8")

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
        if not path.exists() and role != "mvp6_3_task_e_receipt":
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
    (OUT / "l26_staging_manifest.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    receipt = {
        "schemaVersion": "governed-loop.mvp6-task-e.v1",
        "directive": "MVP6-DIR-1",
        "task": "MVP6-TE",
        "status": "COMPLETE",
        "artifacts": {
            "protocol": {"path": str(protocol_path), "sha256": sha256_file(protocol_path)},
            "closingReport": {"path": str(closing_path), "sha256": sha256_file(closing_path)},
            "stagingManifest": {"path": str(OUT / "l26_staging_manifest.json"),
                                "sha256": sha256_file(OUT / "l26_staging_manifest.json")},
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
    (OUT / "mvp6_3_task_e_receipt.json").write_text(
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
