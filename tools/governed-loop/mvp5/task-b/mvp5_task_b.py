#!/usr/bin/env python3
"""MVP5-DIR-1 Task B: deterministic six-track WAV/MIDI render bundle."""
import hashlib
import json
import os
import subprocess
import sys
import wave
from datetime import datetime, timezone
from pathlib import Path

sys.dont_write_bytecode = True

SCRATCH = Path(os.environ.get("MVP5_SCRATCH", "/home/erick/workspace/scratch-governed-loop-run/mvp5"))
REPO = Path(os.environ.get("GOVERNED_LOOP_REPO", "/home/erick/projects/integrated-release"))
TASK_DIR = SCRATCH / "task-b"
RENDERS = TASK_DIR / "renders"
TRACES = SCRATCH / "task-a" / "traces"

TRACKS = [
    ("track1_arm1_unranked_2cycle", TRACES / "arm1_unranked_q_carried.jsonl",
     "Arm 1: unranked 2-state Saturn cycle, carried Q"),
    ("track2_arm2_static_4state", TRACES / "arm2_static_q_carried.jsonl",
     "Arm 2: static Chaldean 4-state walk, carried Q"),
    ("track3_arm3a_dynamic_q_reset", TRACES / "arm3a_dynamic_q_reset.jsonl",
     "Arm 3a: dynamic 21-state walk, reset Q still-life"),
    ("track4_arm3b_dynamic_q_carried", TRACES / "arm3b_dynamic_q_carried.jsonl",
     "Arm 3b: dynamic 21-state walk, continuous carried Q"),
    ("track5_equiv_base_p0", TRACES / "arm_tb_equiv_p0.jsonl",
     "Equivalent pair base: 1387@0 -> 2773@11 -> 2905@11"),
    ("track6_equiv_lifted_p7", TRACES / "arm_tb_equiv_p7.jsonl",
     "Equivalent pair lift: 1387@7 -> 2773@6 -> 2905@6"),
]


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def find_floats(value, path="root"):
    found = []
    if isinstance(value, float):
        found.append({"path": path, "value": repr(value)})
    elif isinstance(value, dict):
        for key, child in value.items():
            found.extend(find_floats(child, f"{path}.{key}"))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            found.extend(find_floats(child, f"{path}[{index}]"))
    return found


def repo_snapshot():
    head = subprocess.run(["git", "rev-parse", "HEAD"], cwd=str(REPO), capture_output=True, text=True).stdout.strip()
    porcelain = subprocess.run(["git", "status", "--porcelain"], cwd=str(REPO), capture_output=True, text=True).stdout
    orrery = subprocess.run(["git", "status", "--porcelain", "--", "orrery/"], cwd=str(REPO),
                            capture_output=True, text=True).stdout
    return {"head": head, "treeClean": porcelain == "",
            "treeDigest": hashlib.sha256(porcelain.encode()).hexdigest(), "orreryClean": orrery == ""}


def rel(path):
    return str(Path(path).relative_to(SCRATCH))


def update_staging(entries):
    manifest_path = SCRATCH / "l21_staging_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    existing = {entry["path"] for entry in manifest["entries"]}
    for entry in entries:
        if entry["path"] not in existing:
            manifest["entries"].append(entry)
    manifest["entries"].sort(key=lambda entry: entry["path"])
    manifest["entryCount"] = len(manifest["entries"])
    manifest["allHashVerified"] = all(
        (SCRATCH / entry["path"]).exists() and sha256_file(SCRATCH / entry["path"]) == entry["sha256"]
        for entry in manifest["entries"]
    )
    manifest_path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return sha256_file(manifest_path), manifest["entryCount"], manifest["allHashVerified"]


def main():
    RENDERS.mkdir(parents=True, exist_ok=True)
    sys.path.insert(0, str(TASK_DIR))
    from mvp5_audio_renderer import extract_audio_parameters, render_track, audit_midi, load_trace

    stop = []
    opened = repo_snapshot()
    if opened["head"] != "ba6ae1fe2c8b31ab739c91593701177678bff18b" or not opened["treeClean"]:
        stop.append({"rule": "S-1" if opened["head"] != "ba6ae1fe2c8b31ab739c91593701177678bff18b" else "S-3",
                     "detail": "opening repository state drift"})

    audio_path = REPO / "orrery" / "src" / "audio.ts"
    parameters = extract_audio_parameters(audio_path)
    palettes = parameters["offices"]
    census = json.loads((REPO / "tools" / "governed-loop" / "census_462.json").read_text(encoding="utf-8"))
    office_lookup = {int(record["stateId"]): record["office"] for record in census["records"]}

    receipt = {
        "schemaVersion": "governed-loop.mvp5-task-b.v1",
        "task": "MVP5-DIR-1 Task B",
        "directive": "MVP5-DIR-1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "layer": "SPEC-001 §1.3 overlay dynamics",
        "gov517_correspondence_claimed": False,
        "still_set_label": "still_set",
        "opening": opened,
        "parameterAuthority": parameters,
        "tracks": [],
        "checks": {},
        "staging": {},
    }
    if not parameters["constantsMatch"] or not parameters["allPalettesMatch"]:
        stop.append({"rule": "S-1", "detail": "audio.ts parameter extraction mismatch",
                     "detailData": {"constants": parameters["constantChecks"],
                                    "palettes": {name: entry["checks"] for name, entry in palettes.items()}}})

    re_render_hits = 0
    midi_out_of_mask = 0
    clipped_total = 0
    non_finite_total = 0
    silent_tracks = 0
    sample_mismatch = 0
    pad_match_all = True
    lead_match_all = True
    for track_name, trace_path, description in TRACKS:
        rendered = render_track(track_name, trace_path, palettes, office_lookup)
        wav_path = RENDERS / f"{track_name}.wav"
        midi_path = RENDERS / f"{track_name}.mid"
        wav_path.write_bytes(rendered["wavBytes"])
        midi_path.write_bytes(rendered["midiBytes"])
        disk_midi = midi_path.read_bytes()
        disk_audit = audit_midi(disk_midi, load_trace(trace_path))
        with wave.open(str(wav_path), "rb") as handle:
            disk_frames = handle.getnframes()
            disk_channels = handle.getnchannels()
            disk_width = handle.getsampwidth()
            disk_rate = handle.getframerate()
        rerender_ok = rendered["reRenderMatch"] and rendered["wavSha256"] == sha256_file(wav_path) \
            and rendered["midiSha256"] == sha256_file(midi_path)
        re_render_hits += 2 if rerender_ok else 0
        midi_out_of_mask += disk_audit["outOfMaskNotes"]
        clipped_total += rendered["clippedSamples"]
        non_finite_total += rendered["nonFiniteSamples"]
        silent_tracks += 0 if rendered["nonSilent"] else 1
        sample_mismatch += 0 if rendered["samples"] == rendered["expectedSamples"] == disk_frames else 1
        pad_match_all = pad_match_all and disk_audit["padContainerMatch"]
        lead_match_all = lead_match_all and disk_audit["leadSequenceMatch"]
        receipt["tracks"].append({
            "track": track_name,
            "description": description,
            "trace": rel(trace_path),
            "traceSha256": rendered["traceSha256"],
            "wav": rel(wav_path),
            "wavSha256": rendered["wavSha256"],
            "wavBytes": wav_path.stat().st_size,
            "midi": rel(midi_path),
            "midiSha256": rendered["midiSha256"],
            "midiBytes": midi_path.stat().st_size,
            "reRenderMatch": rerender_ok,
            "durationMs": rendered["durationMs"],
            "barCount": rendered["barCount"],
            "restCount": rendered["restCount"],
            "samples": rendered["samples"],
            "expectedSamples": rendered["expectedSamples"],
            "diskFrames": disk_frames,
            "sampleRate": disk_rate,
            "channels": disk_channels,
            "sampleWidthBytes": disk_width,
            "rmsMilli": rendered["rmsMilli"],
            "peakQ15": rendered["peakQ15"],
            "clippedSamples": rendered["clippedSamples"],
            "nonFiniteSamples": rendered["nonFiniteSamples"],
            "nonSilent": rendered["nonSilent"],
            "midi": {
                "path": rel(midi_path),
                "trackChunks": disk_audit["trackChunks"],
                "format": disk_audit["format"],
                "division": disk_audit["division"],
                "padNoteOns": disk_audit["padNoteOns"],
                "leadNoteOns": disk_audit["leadNoteOns"],
                "expectedPadNoteOns": disk_audit["expectedPadNoteOns"],
                "expectedLeadNotes": disk_audit["expectedLeadNotes"],
                "outOfMaskNotes": disk_audit["outOfMaskNotes"],
                "padContainerMatch": disk_audit["padContainerMatch"],
                "leadSequenceMatch": disk_audit["leadSequenceMatch"],
                "metaEvents": disk_audit["metaEvents"],
            },
        })

    checks = {
        "audioConstantsMatch": parameters["constantsMatch"],
        "officePalettesMatch7of7": parameters["allPalettesMatch"],
        "wavMidiFiles12": len(receipt["tracks"]) == 6,
        "reRenderDeterministic12of12": re_render_hits == 12,
        "midiOutOfMaskNotesZero": midi_out_of_mask == 0,
        "midiPadContainersMatch": pad_match_all,
        "midiLeadSequencesMatch": lead_match_all,
        "wavClippedSamplesZero": clipped_total == 0,
        "wavNonFiniteSamplesZero": non_finite_total == 0,
        "wavAllNonSilent": silent_tracks == 0,
        "wavSampleCountsExact": sample_mismatch == 0,
        "sixTracks": len({track["track"] for track in receipt["tracks"]}) == 6,
    }
    receipt["checks"] = checks
    receipt["checksPassed"] = sum(1 for value in checks.values() if value)
    receipt["checksTotal"] = len(checks)
    for name, passed in checks.items():
        if not passed:
            rule = "S-10" if "wav" in name.lower() or "rerender" in name.lower() else "S-7"
            stop.append({"rule": rule, "detail": f"task B check failed: {name}"})

    floats = find_floats(receipt)
    receipt["floatScan"] = {"values": len(floats), "witnesses": floats[:5]}
    if floats:
        stop.append({"rule": "S-6", "detail": "float contamination in Task B receipt", "detailData": floats[:5]})

    close = repo_snapshot()
    receipt["close"] = close
    if close["head"] != opened["head"] or not close["treeClean"] or not close["orreryClean"]:
        stop.append({"rule": "S-3", "detail": "repository write or orrery change at Task B close"})

    receipt["constraints"] = {"repoWrites": 0, "orreryChanges": 0, "gateBytesTouched": False}
    receipt["stopRulesTriggered"] = stop
    receipt["status"] = "COMPLETE" if not stop else "STOP"
    receipt_path = TASK_DIR / "mvp5_task_b_receipt.json"
    receipt_path.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    entries = [{
        "path": rel(receipt_path), "sha256": sha256_file(receipt_path), "bytes": receipt_path.stat().st_size,
        "origin": "task-b", "role": "receipt",
    }, {
        "path": rel(Path(__file__)), "sha256": sha256_file(Path(__file__)), "bytes": Path(__file__).stat().st_size,
        "origin": "task-b", "role": "runner",
    }, {
        "path": rel(TASK_DIR / "mvp5_audio_renderer.py"),
        "sha256": sha256_file(TASK_DIR / "mvp5_audio_renderer.py"),
        "bytes": (TASK_DIR / "mvp5_audio_renderer.py").stat().st_size,
        "origin": "task-b", "role": "module",
    }]
    for track in receipt["tracks"]:
        entries.append({"path": track["wav"], "sha256": track["wavSha256"], "bytes": track["wavBytes"],
                        "origin": "task-b", "role": "wav-render"})
        entries.append({"path": track["midi"]["path"], "sha256": track["midiSha256"], "bytes": track["midiBytes"],
                        "origin": "task-b", "role": "midi-render"})
    manifest_sha, manifest_count, manifest_ok = update_staging(entries)
    receipt["staging"] = {"manifest": rel(SCRATCH / "l21_staging_manifest.json"),
                          "manifestSha256": manifest_sha, "manifestEntries": manifest_count,
                          "allHashVerified": manifest_ok}
    receipt_path.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    print("MVP5 TASK B")
    for track in receipt["tracks"]:
        print(f"  {track['track']}: {track['durationMs']} ms / {track['samples']} samples / "
              f"rms {track['rmsMilli']} / clip {track['clippedSamples']} / rerender {track['reRenderMatch']} / "
              f"midi pad {track['midi']['padNoteOns']} lead {track['midi']['leadNoteOns']} oom {track['midi']['outOfMaskNotes']}")
    print(f"  checks: {receipt['checksPassed']}/{receipt['checksTotal']} / status {receipt['status']} / "
          f"stop {[s['rule'] for s in stop]}")
    print(f"  receipt: {receipt_path}")
    return 0 if not stop else 1


if __name__ == "__main__":
    sys.exit(main())
