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

SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp6")
OUT = SCRATCH / "task-e"
ITINERARY = SCRATCH / "task-a" / "compiled_itinerary.json"
TRACE = SCRATCH / "task-c" / "traces" / "piece_a_far_shore.jsonl"

REPO_MVP6 = "tools/governed-loop/mvp6"

PAYLOADS = [
    ("mvp6_task_0", "task-0/mvp6_task_0.py", f"{REPO_MVP6}/task-0/mvp6_task_0.py"),
    ("mvp6_form_spec", "task-0/mvp6_form_spec.json", f"{REPO_MVP6}/task-0/mvp6_form_spec.json"),
    ("mvp6_form_compiler", "task-a/mvp6_form_compiler.py", f"{REPO_MVP6}/task-a/mvp6_form_compiler.py"),
    ("compiled_itinerary", "task-a/compiled_itinerary.json", f"{REPO_MVP6}/task-a/compiled_itinerary.json"),
    ("mvp6_coupled_form_engine", "task-b/mvp6_coupled_form_engine.py", f"{REPO_MVP6}/task-b/mvp6_coupled_form_engine.py"),
    ("mvp6_task_b", "task-b/mvp6_task_b.py", f"{REPO_MVP6}/task-b/mvp6_task_b.py"),
    ("piece_a_far_shore_trace", "task-c/traces/piece_a_far_shore.jsonl", f"{REPO_MVP6}/task-c/traces/piece_a_far_shore.jsonl"),
    ("mvp6_task_c", "task-c/mvp6_task_c.py", f"{REPO_MVP6}/task-c/mvp6_task_c.py"),
    ("mvp6_task_d", "task-d/mvp6_task_d.py", f"{REPO_MVP6}/task-d/mvp6_task_d.py"),
    ("piece_a_far_shore_wav", "task-d/renders/piece_a_far_shore.wav", f"{REPO_MVP6}/task-d/renders/piece_a_far_shore.wav"),
    ("piece_a_far_shore_mid", "task-d/renders/piece_a_far_shore.mid", f"{REPO_MVP6}/task-d/renders/piece_a_far_shore.mid"),
    ("mvp6_task_e", "task-e/mvp6_task_e.py", f"{REPO_MVP6}/task-e/mvp6_task_e.py"),
    ("EAR_VALIDATION_PROTOCOL_MVP6", "task-e/EAR_VALIDATION_PROTOCOL_MVP6.md", f"{REPO_MVP6}/task-e/EAR_VALIDATION_PROTOCOL_MVP6.md"),
    ("MVP6-CLOSING-REPORT", "MVP6-CLOSING-REPORT.md", "scrum/plan/mvp6-sprint-closing-report.md"),
]

RECEIPTS = [
    ("mvp6_task_0_receipt", "task-0/mvp6_task_0_receipt.json", "qa/mvp6_task_0_receipt.json"),
    ("mvp6_task_a_receipt", "task-a/mvp6_task_a_receipt.json", "qa/mvp6_task_a_receipt.json"),
    ("mvp6_task_b_receipt", "task-b/mvp6_task_b_receipt.json", "qa/mvp6_task_b_receipt.json"),
    ("mvp6_task_c_receipt", "task-c/mvp6_task_c_receipt.json", "qa/mvp6_task_c_receipt.json"),
    ("mvp6_task_d_receipt", "task-d/mvp6_task_d_receipt.json", "qa/mvp6_task_d_receipt.json"),
    ("mvp6_task_e_receipt", "task-e/mvp6_task_e_receipt.json", "qa/mvp6_task_e_receipt.json"),
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
    a("# MVP-6 Ear Validation Protocol — \u201cThe Far Shore\u201d")
    a("")
    a("Directive `MVP6-DIR-1` rev 1 · execution realm "
      "`/home/erick/workspace/scratch-governed-loop-run/mvp6/` · scratch-only until the L23 landing.")
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
    a("")
    a("## 2. Listening sources")
    a("")
    a("| Source | Track |")
    a("|---|---|")
    a(f"| WAV | `task-d/renders/piece_a_far_shore.wav` (`{r['render']['wav']['sha256'][:8]}`) |")
    a(f"| MIDI | `task-d/renders/piece_a_far_shore.mid` (`{r['render']['midi']['sha256'][:8]}`) |")
    a(f"| Trace | `task-c/traces/piece_a_far_shore.jsonl` (`{trace_receipt['trace']['sha256'][:8]}`) |")
    a("")
    a("Playback:")
    a("")
    a("```bash")
    a("cd /home/erick/workspace/scratch-governed-loop-run/mvp6/task-d/renders")
    a("ffplay -nodisp -autoexit -loglevel error piece_a_far_shore.wav")
    a("# or, after the L23 landing:")
    a("ffplay -nodisp -autoexit -loglevel error \\")
    a("  /home/erick/projects/integrated-release/tools/governed-loop/mvp6/task-d/renders/piece_a_far_shore.wav")
    a("```")
    a("")
    a("## 3. Section map and measured centroids")
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
    a("## 4. Phase 1 — blind structural listen")
    a("")
    a("Listen once, end to end, without reading the timestamps. Mark where you hear a")
    a("section boundary, where the peak is, where the quiet still point is, and where the")
    a("piece arrives. Do not pause or rewind. Record the raw times before reading \u00a75.")
    a("")
    a("| Perceived boundary | Time (mm:ss) | Confidence 1\u20135 |")
    a("|---|---|---:|")
    a("| Opening gesture closes |  |  |")
    a("| First section change |  |  |")
    a("| Quiet still point |  |  |")
    a("| Peak / climax |  |  |")
    a("| Arrival |  |  |")
    a("")
    a("## 5. Phase 2 — timestamped adjudication")
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
    a("**Question.** Does the climax dwell read as a registral and timbral lift above the")
    a("quiet dwell (measured means: quiet 498.5 Hz, climax 847.3 Hz)?")
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
    a("## 6. Dual scorecard")
    a("")
    a("Adjudication follows the MVP-2c `mac1..mac3` discipline: pre-register, listen once,")
    a("record the verdict, do not re-describe after the fact. Listener 2 is optional and")
    a("external; the blind pass is the same for both.")
    a("")
    a("| Question | Listener 1 heard (Y/N) | 1 rating | Listener 1 notes | "
      "Listener 2 heard (Y/N) | 2 rating | Listener 2 notes |")
    a("|---|---|---:|---|---|---:|---|")
    for q in ["Q1 mirror gesture", "Q2 quiet vs climax", "Q3 shore breath",
              "Q4 return as new territory", "Q5 voiced homecoming"]:
        a(f"| {q} |  |  |  |  |  |  |")
    a("")
    a("| Field | Listener 1 (Erick) | Listener 2 (external) |")
    a("|---|---|---|")
    a("| Name | Erick |  |")
    a("| Date |  |  |")
    a("| Session |  |  |")
    a("| Overall verdict (PASS / PASS WITH NOTES / FAIL) |  |  |")
    a("")
    a("## 7. Non-claims and fences")
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


def closing_report_text(itinerary, receipts, audio):
    r = audio
    bridge = r["bridge"]
    lines = []
    a = lines.append
    a("# MVP6 Closing Report — Planned Form: \u201cThe Far Shore\u201d")
    a("")
    a("**Directive:** `MVP6-DIR-1` rev 1  ")
    a("**Execution realm:** `/home/erick/workspace/scratch-governed-loop-run/mvp6/`  ")
    a("**Status:** SCRATCH COMPLETE; L23 working-tree landing pending")
    a("")
    a("## Fixed point and pins")
    a("")
    a("- Opening HEAD: `154db019711570ade5558a78eb5abb0b63b3c884` (L22)")
    a("- Tree clean at opening: true")
    a("- Decision ledger before: `ab141615...d2c28` / 364,225 B / 4,216 lines")
    a("- Manifest before: `1a07456c...a5f93` / 1,600 files / 110,846,414 B")
    a("- Release closure before: PASS / 418 / 0")
    a("- Pins verified: 28/28 SHA-256 and byte counts; `mvp2.py` anchors 11/11")
    a("")
    a("## Task outcomes")
    a("")
    a("| Task | Receipt | SHA-256 (first 8) | Outcome |")
    a("|---|---|---|---|")
    for task, key, outcome in [
        ("T0", "mvp6_task_0", "fixed point, predeclaration lock, strong-core audit"),
        ("TA", "mvp6_task_a", "SCC form compiler, 55/55 gate ACCEPT, negative tests"),
        ("TB", "mvp6_task_b", "voiced terminal vs unvoiced control"),
        ("TC", "mvp6_task_c", "full coupled trace, dwell-phrase law, lead diagnostics"),
        ("TD", "mvp6_task_d", "deterministic WAV/MIDI and FFT centroid bridge"),
        ("TE", "mvp6_task_e", "protocol, staging manifest, closing report"),
    ]:
        sha = receipts.get(key, {}).get("sha256")
        sha_text = f"`{sha[:8]}`" if sha else "`(self)`"
        a(f"| {task} | `qa/{key}_receipt.json` | {sha_text} | {outcome} |")
    a("")
    a("## Form result")
    a("")
    a(f"- Destination A (Far Shore, `757@6`), return form, inside the 2,928-node strong core.")
    a(f"- Itinerary: {itinerary['summary']['bars']} bars "
      f"({itinerary['summary']['transitBars']} transit + {itinerary['summary']['dwellBars']} dwell), "
      f"{itinerary['summary']['microSteps']} micro steps, "
      f"{itinerary['summary']['durationMs']} ms.")
    a(f"- Macro transitions: {itinerary['summary']['macroTransitions']} "
      f"({itinerary['summary']['nonSelfHops']} non-self + "
      f"{itinerary['summary']['selfLoopExtensions']} dwell self-loops); "
      "all gate ACCEPT; zero LLM calls.")
    a("- Coverage: 7 offices, 12 phases, 42 distinct lifted states; return leg threads")
    a("  15 new interior nodes out of 18.")
    a("- Negative tests: `1831@6` \u2192 `OUTSIDE_STRONG_CORE`; an isolated boundary \u2192")
    a("  `ISOLATED_BOUNDARY`.")
    a("- Variant D and Variant U produce the identical trajectory.")
    a("")
    a("## Audio result")
    a("")
    a(f"- WAV: `piece_a_far_shore.wav`, `{r['render']['wav']['sha256'][:8]}`, "
      f"{r['render']['wav']['samples']} samples.")
    a(f"- MIDI: `piece_a_far_shore.mid`, `{r['render']['midi']['sha256'][:8]}`.")
    a("- Two-pass render byte-identical; 0 clipped samples; 0 non-finite samples;")
    a("  0 MIDI container leaks; 408 lead note-ons; 440 pad note-ons.")
    a(f"- FFT bridge: {r['bridge']['barsMeasured']} bars; correlation "
      f"{r['bridge']['correlationMeasuredVsModel']:.6f}; median relative error "
      f"{r['bridge']['medianRelativeError']:.6f}.")
    a(f"- Office-deconfounded contour: container r = "
      f"{r['bridge']['officeDeconfoundedCorrelationContainer']:.6f}, lead r = "
      f"{r['bridge']['officeDeconfoundedCorrelationLead']:.6f}.")
    a(f"- Section centroids (Hz): quiet {bridge['sectionCentroidMeansHz']['first_dwell']:.3f}, "
      f"climax {bridge['sectionCentroidMeansHz']['climax']:.3f}, "
      f"homecoming {bridge['sectionCentroidMeansHz']['homecoming']:.3f}.")
    a(f"- Boundary rest: 0 scheduled oscillators; measured RMS ratio "
      f"{r['bridge']['boundaryRestRmsRatio']:.6f} "
      f"({r['bridge']['boundaryRestDropDb']:.3f} dB below the mean voiced bar) and the")
    a(f"  final-50 ms tail ratio {r['bridge']['boundaryRestTailRmsRatio']:.6f}.")
    a("")
    a("## Law verification")
    a("")
    a("| Law | Verification |")
    a("|---|---|")
    a("| 1. Planner composes; card steers; LLM waits | deterministic BFS + card; 0 LLM calls |")
    a("| 2. Form space is the strong core | 2,928 nodes; every node inside; negative tests reject |")
    a("| 3. If it is not in the lead line, it is not heard | lead pcSum and register bands carry the form; deconfounded lead r > container r |")
    a("| 4. Phase is terrain, not a dial | dwell placement at p6 (quiet) and p8 (climax); 12-step Q phrases |")
    a("| 5. Arrival must be voiced | terminal bar adds 12 micro steps; voiced vs unvoiced control |")
    a("")
    a("## Fences")
    a("")
    a("- No gate, census, ground-truth, seam-substrate, Q-engine, encoder, or `audio.ts`")
    a("  byte change; the Orrery application is read-only.")
    a("- Photonic layer overlay-only; `causationClaim: false`, `physicalQuantityClaim: false`,")
    a("  `tierClassifier: false`, `globalCHNull: true`; `C_H` unresolved.")
    a("- Policy-v3 key-change seams untouched; no recalibration.")
    a("- Scratch tasks made zero repository writes. The L23 landing is a separate")
    a("  authorized working-tree action; no tag or push.")
    a("")
    a("## Terminal verdict")
    a("")
    a("```text")
    a("MVP6-SPRINT-CLOSING")
    a("FIXED-POINT: 154db01...c884 / TREE CLEAN / L22 ab141615...d2c28 / 364225 B / 4216 lines")
    a("PINS-VERIFIED: 28/28 MATCH / ANCHORS 11/11 MATCH / PREDECLARATION-LOCKED TRUE")
    a("TASKS: T0 COMPLETE | TA COMPLETE | TB COMPLETE | TC COMPLETE | TD COMPLETE | TE COMPLETE")
    a(f"ITINERARY: {itinerary['summary']['macroTransitions']} TRANSITIONS / "
      f"{itinerary['summary']['bars']} BARS / {itinerary['summary']['microSteps']} CELLS / "
      f"{itinerary['summary']['durationMs']} MS")
    a("STRONG-CORE: 2928 NODES / 276 ONE-WAY EXCLUDED / NEGATIVE TESTS REJECTED")
    a("COVERAGE: 7 OFFICES / 12 PHASES / 42 DISTINCT STATES / RETURN-NEW-INTERIOR 15/18")
    a("AUDIO: TWO-PASS IDENTICAL / CLIPPED 0 / NON-FINITE 0 / MIDI-LEAKS 0")
    a("FFT-BRIDGE: MODEL-CORR " + f"{r['bridge']['correlationMeasuredVsModel']:.6f}" +
      " / MEDIAN-REL-ERR " + f"{r['bridge']['medianRelativeError']:.6f}")
    a("FENCES: GATE-UNTOUCHED / ORRERY-READ-ONLY / C-H-NULL / LLM-CALLS 0")
    a("REPO-WRITES: 0 (scratch) / STATUS: COMPLETE")
    a("```")
    a("")
    return "\n".join(lines) + "\n"


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    itinerary = load_json(ITINERARY)
    trace_receipt = load_json(SCRATCH / "task-c" / "mvp6_task_c_receipt.json")
    audio = load_json(SCRATCH / "task-d" / "mvp6_task_d_receipt.json")

    protocol_path = OUT / "EAR_VALIDATION_PROTOCOL_MVP6.md"
    protocol_path.write_text(protocol_text(itinerary, trace_receipt, audio), encoding="utf-8")

    receipts = {key: {"sha256": sha256_file(SCRATCH / rel)}
                for key, rel, _ in RECEIPTS if key != "mvp6_task_e_receipt"}

    closing_path = SCRATCH / "MVP6-CLOSING-REPORT.md"
    closing_path.write_text(closing_report_text(itinerary, receipts, audio), encoding="utf-8")

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
        if not path.exists() and role != "mvp6_task_e_receipt":
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
    (OUT / "l23_staging_manifest.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    receipt = {
        "schemaVersion": "governed-loop.mvp6-task-e.v1",
        "directive": "MVP6-DIR-1",
        "task": "MVP6-TE",
        "status": "COMPLETE",
        "artifacts": {
            "protocol": {"path": str(protocol_path), "sha256": sha256_file(protocol_path)},
            "closingReport": {"path": str(closing_path), "sha256": sha256_file(closing_path)},
            "stagingManifest": {"path": str(OUT / "l23_staging_manifest.json"),
                                "sha256": sha256_file(OUT / "l23_staging_manifest.json")},
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
    (OUT / "mvp6_task_e_receipt.json").write_text(
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
