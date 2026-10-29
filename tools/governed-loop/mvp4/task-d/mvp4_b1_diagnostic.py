#!/usr/bin/env python3
import collections
import csv
import datetime
import glob
import hashlib
import importlib.util
import json
import os
import re
import sqlite3
import subprocess
import sys

sys.dont_write_bytecode = True

SCRATCH = os.environ.get("GOVERNED_LOOP_SCRATCH", "/home/erick/workspace/scratch-governed-loop-run/mvp4")
REPO = os.environ.get("GOVERNED_LOOP_REPO", "/home/erick/projects/integrated-release")
BASE = "/home/erick/workspace/scratch-governed-loop-run"
TASK_B1 = os.path.join(BASE, "task-b1")
TASK_D = os.path.join(SCRATCH, "task-d")
REPO_HEAD = "148a96f8c5ce5bcd83fad832170bc76c7075a943"
EMPTY_SHA = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
LEDGER_SHA = "037424774910287b29a9101569127d4a7850d4f86376540e350bbe14f0c6663b"
MANIFEST_SHA = "93fb9c836f1fa108a607b74d50d3bc3adcc3dcd9311e0edb994685241f4b8a05"
CHECKSUMS_SHA = "fd918c280c9f0789102bc09b0fd041c5875a73cb9ae7f1754d5740b2ecd0daeb"
VALIDATION_SHA = "cff3c3157d520a4bedceb5f62a4c04cb482d5e4843de41cda812292c881a8fa5"
ENCODER_SHA = "dc2379277afb1a9bf92a26cd3a83ea3f16a33a12ca331a9742f7d5861422f745"
SPEC_SHA = "918228d497fc57e7c63b79ebd33c554ac4e52cb58760a9b68d86c52f6daae17c"
B1_RECEIPT_SHA = "c658a5885c5fb989eec6eab1a3a3964ae3e2228606cb806f0867c6c1d829e5d4"
TASK0_CENSUS_SHA = "38c271898ecfcbb8731239dbde38d58bf8e686aa1d31b648f22418c78eb40faf"
TASK_A_RECEIPT_SHA = "d4e63cb51f6339edf7dcdb721d9753ea6c6cac580f35cf9397201803cd8fdbc1"
TASK_B_RECEIPT_SHA = "ffab52b696aeda84204c463abd700e7be86d2e430d6dc8d43d72587381aa7d12"
TASK_C_RECEIPT_SHA = "834e3a64c22fba07fa0179b95d8ee26d152c038f67a0a387ae3a2b1796cf4295"
PINNED_VOCAB = {("ACCEPT", ()), ("REJECT", ("not-census-state",)),
                ("REJECT", ("ungoverned-transition",)), ("REJECT", ("unlicensed-transition",))}
VENV_SITE = os.path.join(TASK_B1, "venv", "lib", "python3.12", "site-packages")
if os.path.isdir(VENV_SITE):
    sys.path.insert(0, VENV_SITE)

REPO_PINS = {
    "tools/governed-loop/mvp2.py": "79c0cf706fffc23745cab6e87ffbc46d34d70ad94a93291135725e388dc17328",
    "tools/governed-loop/orrery_nav_bridge.py": "9f2b3da60f0aa3695608d60640b0303a7d5ec0500d27fbe49284c7f399ae4824",
    "tools/governed-loop/mvp2_orrery_nav_smoke.py": "851c9bf2a29c2c5a0a74f88875fc5420ee81c27c246dcdb8ef6f0e079e277c9c",
    "tools/governed-loop/mvp3_encoder.py": ENCODER_SHA,
    "tools/governed-loop/mvp3_encoder_spec.json": SPEC_SHA,
    "tools/governed-loop/census_462.json": "242bce7423bc2eb0ae61ee431c27901d6a87401b8b3ffd6725a04d0e1ed0685a",
    "tools/governed-loop/frozen_ground_truth.json": "007b0ffe65015bd2c5f1a6fe0df8969961ce8cfb3d499677b143d971e1fc5744",
    "tools/governed-loop/frozen_seam_substrate_v3.json": "9f9818effa5d11e4ef2634122c9f484faf6790323cabae130561c1c75e8a295f",
    "tools/governed-loop/seam_legal_moves_v3.json": "e6cf62a8eefa0924da9286f2e664c1914d9d620ed2d299929f684fd48225c274",
    "src/fivefold/quintessence.py": "eefd7e1e060189261c8063652d2ed73a09b16d3ffdcb9f259502a107ef9ceaa0",
    "tests/fixtures/fivefold_q_table.v1.json": "bd361793d7c1295872fc95c230f3f9ce234f2cd4ea6899e9a3df08700aa8d604",
    "qa/mvp3_task_a_receipt.json": "cb9083f435a41b17a009d5fb249661c1998d107556bf6a6ee97fa5293f1461a0",
    "qa/mvp3_task_b0_receipt.json": "ae50fd2b9b7c6b68157ae2a745d85be213e2d2afcf1db66d42766c5a61f7801e",
    "qa/mvp3_task_b1_receipt.json": B1_RECEIPT_SHA,
    "qa/mvp3_task_c_receipt.json": "022856bb9a2bb88162f77e04ca4dd60b0b93f68c62d2bb1404f14334d0729bfc",
}


def sha_bytes(data):
    return hashlib.sha256(data).hexdigest()


def sha_file(path):
    with open(path, "rb") as handle:
        return sha_bytes(handle.read())


def sha_text(text):
    return sha_bytes(text.encode("utf-8"))


def write_json(path, payload):
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, sort_keys=True)
        handle.write("\n")
    return sha_file(path)


def find_floats(value, path="root"):
    found = []
    if isinstance(value, float):
        found.append({"path": path, "value": value})
    elif isinstance(value, dict):
        for key, child in value.items():
            found.extend(find_floats(child, f"{path}.{key}"))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            found.extend(find_floats(child, f"{path}[{index}]"))
    return found


def repo_snapshot():
    head = subprocess.run(["git", "-C", REPO, "rev-parse", "HEAD"],
                          capture_output=True, text=True, check=True).stdout.strip()
    porcelain = subprocess.run(["git", "-C", REPO, "status", "--porcelain"],
                               capture_output=True, text=True, check=True).stdout
    return {"head": head, "treeClean": porcelain.strip() == "",
            "statusPorcelainSha256": sha_text(porcelain)}


def run_bridge(mode, ledger_prefix):
    env = dict(os.environ)
    env.update({
        "GOVERNED_LOOP_SCRATCH": SCRATCH,
        "GOVERNED_LOOP_REPO": REPO,
        "GOVERNED_LOOP_REQUIRE_CLEAN": "1",
        "GOVERNED_LOOP_REPO_HEAD": REPO_HEAD,
        "GOVERNED_LOOP_MANIFEST_COUNT": "1488",
        "GOVERNED_LOOP_LEDGER_PREFIX": ledger_prefix,
    })
    proc = subprocess.run(
        [sys.executable, os.path.join(SCRATCH, "orrery_nav_bridge.py"), "--check"],
        capture_output=True, text=True, env=env, cwd=REPO,
    )
    out = os.path.join(TASK_D, f"bridge_check_{mode}.out")
    with open(out, "w", encoding="utf-8") as handle:
        handle.write(proc.stdout)
        handle.write(proc.stderr)
    return {"mode": mode, "ledgerPrefix": ledger_prefix, "exitCode": proc.returncode,
            "stdout": proc.stdout, "stderr": proc.stderr,
            "logPath": out, "logSha256": sha_file(out)}


def load_b1():
    spec = importlib.util.spec_from_file_location("mvp3_b1_run_task_d", os.path.join(TASK_B1, "mvp3_b1_run.py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def segment_diag(events):
    events = [event for event in events if event]
    deduped = []
    collapsed = 0
    collapsed_both_key_used = 0
    for event in events:
        if deduped and deduped[-1]["mask"] == event["mask"] and deduped[-1]["phase"] == event["phase"]:
            collapsed += 1
            if deduped[-1].get("key_used") and event.get("key_used"):
                collapsed_both_key_used += 1
            continue
        deduped.append(event)
    transitions = list(zip(deduped, deduped[1:]))
    return deduped, collapsed, collapsed_both_key_used, transitions


def build_streams(events_by_segment, p2_by_segment=None, restrict=False):
    transitions = []
    deduped_total = 0
    collapsed_total = 0
    collapsed_both = 0
    events_total = 0
    for index, events in enumerate(events_by_segment):
        if p2_by_segment is not None and restrict:
            mask = [row is not None for row in p2_by_segment[index]]
            events = [event for event, keep in zip(events, mask) if keep]
        p2_events = None
        if p2_by_segment is not None and not restrict:
            p2_events = [row for row in p2_by_segment[index] if row is not None]
            events = p2_events
        events_total += len(events)
        deduped, collapsed, collapsed_both_segment, trans = segment_diag(events)
        deduped_total += len(deduped)
        collapsed_total += collapsed
        collapsed_both += collapsed_both_segment
        transitions.extend(trans)
    return {"transitions": transitions, "dedupedEvents": deduped_total,
            "duplicatesCollapsed": collapsed_total,
            "collapsedBothKeyUsed": collapsed_both,
            "events": events_total}


def corpus_dcmlab(enc, census_masks, counters):
    files = sorted(glob.glob(os.path.join(BASE, "task-b0", "ABC", "harmonies", "*.tsv")))
    events_by_file = []
    p2_by_file = []
    raw_events = 0
    p2_skipped = 0
    counters_p2 = collections.Counter()
    for path in files:
        events = []
        p2_rows = []
        with open(path, encoding="utf-8") as handle:
            reader = csv.DictReader(handle, delimiter="\t")
            for row in reader:
                counters["rows_total"] += 1
                event = enc.encode_dcmlab_row(row, census_masks, counters)
                if event is None:
                    continue
                event["key_used"] = set(event["chord_pcs"]) <= set(event["key_pcs"])
                events.append(event)
                root_field = row.get("root", "").strip()
                if not root_field:
                    p2_rows.append(None)
                    p2_skipped += 1
                    continue
                try:
                    root_fifth = int(root_field)
                except ValueError:
                    p2_rows.append(None)
                    p2_skipped += 1
                    continue
                root_pc = (event["phase"] + 7 * root_fifth) % 12
                chord_pcs = set(event["chord_pcs"])
                key_pcs = set(event["key_pcs"])
                mask, absolute = enc.complete_anchored_mask(chord_pcs, key_pcs, root_pc,
                                                            census_masks, counters_p2)
                p2_rows.append({
                    "mask": mask, "phase": root_pc,
                    "chord_pcs": sorted(chord_pcs), "key_pcs": sorted(key_pcs),
                    "absolute_pcs": sorted(absolute), "mask_in_census": mask in census_masks,
                    "key_used": chord_pcs <= key_pcs, "label": event.get("label"),
                })
        raw_events += len(events)
        events_by_file.append(events)
        p2_by_file.append(p2_rows)
    stream = build_streams(events_by_file)
    p1_restricted = build_streams(events_by_file, p2_by_file, restrict=True)
    p2_stream = build_streams(events_by_file, p2_by_file, restrict=False)
    canonical = load_b1().canonical_counters(
        counters, "phase_local_key", "phase_global_key_default",
        "phase_global_key_unparsed", "phase_local_key_unparsed")
    return {
        "corpus_id": "DCMLab/ABC (beethoven_quartets)", "segments": len(files),
        "raw_events": raw_events, **stream,
        "p2_skipped": p2_skipped,
        "p1_restricted": p1_restricted, "p2_stream": p2_stream,
        "fallback_counts": canonical, "raw_counters": dict(counters),
        "rows_total": counters["rows_total"],
        "non_harmonic_rows": counters["non_harmonic_rows"],
    }


def corpus_bach(enc, census_masks, counters, b1):
    from music21 import corpus as m21corpus
    names = list(m21corpus.chorales.Iterator(returnType="filename"))
    events_by_score = []
    p2_by_score = []
    raw_events = 0
    p2_skipped = 0
    key_failures = 0
    counters_p2 = collections.Counter()
    for name in names:
        counters["phase_primary_used"] += 1
        score = m21corpus.parse(name)
        try:
            key = score.analyze("key")
            tonic = key.tonic.pitchClass
            is_minor = key.mode == "minor"
            counters["key_analysis_used"] += 1
        except Exception:
            key_failures += 1
            ks = score.flatten().getElementsByClass("KeySignature")
            if ks:
                tonic = ks[0].asKey().tonic.pitchClass
                is_minor = ks[0].asKey().mode == "minor"
            else:
                tonic, is_minor = 0, False
            counters["phase_fallback_1"] += 1
        key_pcs = {(tonic + step) % 12 for step in enc.scale_for(is_minor)}
        events = []
        p2_rows = []
        chords = list(score.chordify().recurse().getElementsByClass("Chord"))
        for chord in chords:
            pcs = sorted({p.pitchClass for p in chord.pitches})
            if not pcs:
                counters["non_harmonic_rows"] += 1
                continue
            counters["rows_total"] += 1
            event = b1.encode_absolute(enc, pcs, key_pcs, tonic, census_masks, counters)
            event["label"] = "+".join(str(pc) for pc in pcs)
            events.append(event)
            root = chord.root()
            if root is None:
                p2_rows.append(None)
                p2_skipped += 1
                continue
            root_pc = root.pitchClass
            p2 = b1.encode_absolute(enc, pcs, key_pcs, root_pc, census_masks, counters_p2)
            p2["label"] = event["label"]
            p2_rows.append(p2)
        raw_events += len(events)
        events_by_score.append(events)
        p2_by_score.append(p2_rows)
    stream = build_streams(events_by_score)
    p1_restricted = build_streams(events_by_score, p2_by_score, restrict=True)
    p2_stream = build_streams(events_by_score, p2_by_score, restrict=False)
    canonical = b1.canonical_counters(
        counters, "phase_primary_used", "phase_fallback_1", "phase_fallback_2",
        "unparsed_labels")
    return {
        "corpus_id": "bach_chorales", "segments": len(names),
        "raw_events": raw_events, **stream,
        "p2_skipped": p2_skipped,
        "p1_restricted": p1_restricted, "p2_stream": p2_stream,
        "fallback_counts": canonical, "raw_counters": dict(counters),
        "rows_total": counters["rows_total"],
        "non_harmonic_rows": counters["non_harmonic_rows"],
        "key_analysis_failures": key_failures,
    }


def corpus_billboard(enc, census_masks, counters, b1):
    files = sorted(glob.glob(os.path.join(TASK_B1, "billboard", "McGill-Billboard", "*", "full.lab")))
    events_by_file = []
    raw_events = 0
    for path in files:
        previous = None
        events = []
        with open(path, encoding="utf-8", errors="replace") as handle:
            for line in handle:
                parts = line.rstrip("\n").split("\t")
                if len(parts) < 3:
                    continue
                counters["rows_total"] += 1
                label = parts[2].strip()
                if label in ("N", "X"):
                    counters["non_harmonic_rows"] += 1
                    previous = None
                    continue
                pcs = b1.harte_to_pcs(label)
                if pcs is None:
                    counters["unparsed_labels"] += 1
                    previous = None
                    continue
                root_pc = b1.note_pc(re.match(r"^([A-G][#b]*)", label).group(1))
                key_pcs = {(root_pc + step) % 12 for step in enc.scale_for(False)}
                counters["mask_key_source_chord_root"] += 1
                event = b1.encode_absolute(enc, pcs, key_pcs, root_pc, census_masks, counters)
                event["label"] = label
                if previous and previous["mask"] == event["mask"] and previous["phase"] == event["phase"]:
                    counters["duplicates_source"] += 1
                events.append(event)
                previous = event
        raw_events += len(events)
        events_by_file.append(events)
    stream = build_streams(events_by_file)
    canonical = b1.canonical_counters(
        counters, "mask_key_source_chord_root", "phase_fallback_1", "phase_fallback_2",
        "unparsed_labels")
    return {
        "corpus_id": "billboard_pop", "segments": len(files), "raw_events": raw_events,
        **stream, "fallback_counts": canonical, "raw_counters": dict(counters),
        "rows_total": counters["rows_total"], "non_harmonic_rows": counters["non_harmonic_rows"],
    }


def corpus_isophonics(enc, census_masks, counters, b1):
    files = sorted(glob.glob(os.path.join(TASK_B1, "isophonics", "all", "The Beatles", "**", "*.ttl"),
                            recursive=True))
    events_by_file = []
    raw_events = 0
    for path in files:
        text = open(path, encoding="utf-8", errors="replace").read()
        chords = []
        for block in re.split(r"\n(?=:chord_\d+)", text):
            if "af:ChordSegment" not in block:
                continue
            start = re.search(r'tl:beginsAt "([^"]+)"', block)
            label = re.search(r'rdfs:label "([^"]+)"', block)
            if start and label:
                chords.append((b1.parse_pt(start.group(1)), label.group(1)))
        keys = []
        for block in re.split(r"\n(?=:key_\d+)", text):
            if "af:KeySegment" not in block:
                continue
            start = re.search(r'tl:beginsAt "([^"]+)"', block)
            label = re.search(r'rdfs:label "([^"]+)"', block)
            if start and label:
                parsed = b1.key_label(label.group(1))
                keys.append((b1.parse_pt(start.group(1)), parsed))
        chords.sort(key=lambda item: item[0])
        keys.sort(key=lambda item: item[0])
        events = []
        previous = None
        for start, label in chords:
            counters["rows_total"] += 1
            if label in ("N", "X"):
                counters["non_harmonic_rows"] += 1
                previous = None
                continue
            pcs = b1.harte_to_pcs(label)
            if pcs is None:
                counters["unparsed_labels"] += 1
                previous = None
                continue
            root_pc = b1.note_pc(re.match(r"^([A-G][#b]*)", label).group(1))
            active_key = None
            for key_start, parsed in keys:
                if key_start <= start:
                    active_key = parsed
                else:
                    break
            if active_key:
                key_pcs = active_key[2]
                counters["phase_primary_used"] += 1
            else:
                key_pcs = {(root_pc + step) % 12 for step in enc.scale_for(False)}
                counters["mask_key_source_chord_root"] += 1
            event = b1.encode_absolute(enc, pcs, key_pcs, root_pc, census_masks, counters)
            event["label"] = label
            if previous and previous["mask"] == event["mask"] and previous["phase"] == event["phase"]:
                counters["duplicates_source"] += 1
            events.append(event)
            previous = event
        raw_events += len(events)
        events_by_file.append(events)
    stream = build_streams(events_by_file)
    canonical = b1.canonical_counters(
        counters, "phase_primary_used", "phase_fallback_1", "phase_fallback_2",
        "unparsed_labels")
    return {
        "corpus_id": "isophonics", "segments": len(files), "raw_events": raw_events,
        **stream, "fallback_counts": canonical, "raw_counters": dict(counters),
        "rows_total": counters["rows_total"], "non_harmonic_rows": counters["non_harmonic_rows"],
    }


def corpus_weimar(enc, census_masks, counters, b1):
    con = sqlite3.connect(os.path.join(TASK_B1, "weimar", "wjazzd.db"))
    cur = con.cursor()
    solo_keys = {row[0]: row[1] for row in cur.execute("select melid, key from solo_info")}
    melids = [row[0] for row in cur.execute("select distinct melid from beats order by melid")]
    events_by_solo = []
    raw_events = 0
    for melid in melids:
        last_label = None
        events = []
        for onset, chord in cur.execute("select onset, chord from beats where melid=? order by onset",
                                        (melid,)):
            counters["rows_total"] += 1
            label = (chord or "").strip()
            if label in ("NC", "N", "?"):
                counters["non_harmonic_rows"] += 1
                last_label = None
                continue
            if not label:
                continue
            if label == last_label:
                counters["duplicates_source"] += 1
                continue
            pcs = b1.wjazzd_to_pcs(label)
            if pcs is None:
                counters["unparsed_labels"] += 1
                last_label = None
                continue
            root_pc = b1.note_pc(re.match(r"^([A-G][#b]?)", label).group(1))
            key_name = solo_keys.get(melid, "")
            parsed_key = None
            if key_name:
                parts = key_name.split("-")
                tonic = b1.note_pc(parts[0])
                mode = parts[1] if len(parts) > 1 else "maj"
                if tonic is not None and mode in ("maj", "min"):
                    parsed_key = (tonic, mode, {(tonic + step) % 12
                                                for step in enc.scale_for(mode == "min")})
            if parsed_key:
                key_pcs = parsed_key[2]
                counters["phase_primary_used"] += 1
            else:
                key_pcs = {(root_pc + step) % 12 for step in enc.scale_for(False)}
                counters["mask_key_source_chord_root"] += 1
            event = b1.encode_absolute(enc, pcs, key_pcs, root_pc, census_masks, counters)
            event["label"] = label
            events.append(event)
            last_label = label
        if events:
            raw_events += len(events)
            events_by_solo.append(events)
    con.close()
    stream = build_streams(events_by_solo)
    canonical = b1.canonical_counters(
        counters, "phase_primary_used", "phase_fallback_1", "phase_fallback_2",
        "unparsed_labels")
    return {
        "corpus_id": "weimar_jazz", "segments": len(events_by_solo), "raw_events": raw_events,
        **stream, "fallback_counts": canonical, "raw_counters": dict(counters),
        "rows_total": counters["rows_total"], "non_harmonic_rows": counters["non_harmonic_rows"],
    }


def rate_string(accepted, total):
    return f"{accepted}/{total}"


def bp(accepted, total):
    return (accepted * 10000 // total) if total else 0


def verdict_metrics(transitions, world):
    counts = collections.Counter()
    tier1_accepted = 0
    seam_accepted = 0
    ungoverned = 0
    unlicensed = 0
    not_census = 0
    source_not_census = 0
    target_not_census = 0
    accepted = 0
    for left, right in transitions:
        source = (left["mask"], left["phase"])
        target = (right["mask"], right["phase"])
        if source[0] not in world.masks:
            verdict, reasons, checks, citation = ("REJECT", ["not-census-state"],
                                                  {"candidate_membership": target[0] in world.masks,
                                                   "source_membership": False}, None)
            source_not_census += 1
        else:
            verdict, reasons, checks, citation = world.gate(source, target)
            if verdict == "REJECT" and reasons == ["not-census-state"]:
                target_not_census += 1
        counts[(verdict, tuple(reasons))] += 1
        if verdict == "ACCEPT":
            accepted += 1
            if citation is None:
                tier1_accepted += 1
            else:
                seam_accepted += 1
        elif reasons and reasons[0] == "ungoverned-transition":
            ungoverned += 1
        elif reasons and reasons[0] == "unlicensed-transition":
            unlicensed += 1
        elif reasons and reasons[0] == "not-census-state":
            not_census += 1
    total = len(transitions)
    return {
        "transitions": total, "accepted": accepted, "rejected": total - accepted,
        "acceptanceRate": rate_string(accepted, total),
        "acceptanceRateBp": bp(accepted, total),
        "tier1Accepted": tier1_accepted,
        "seamAccepted": seam_accepted,
        "ungoverned": ungoverned,
        "unlicensed": unlicensed,
        "notCensus": not_census,
        "sourceNotCensus": source_not_census,
        "targetNotCensus": target_not_census,
        "verdictCounts": [{"verdict": verdict, "reasons": list(reasons), "count": count}
                          for (verdict, reasons), count in sorted(counts.items())],
    }


def label_of(event):
    label = event.get("label")
    if label:
        return label
    return "+".join(str(pc) for pc in event.get("chord_pcs", []))


def main():
    os.makedirs(TASK_D, exist_ok=True)
    stops = []
    opened = datetime.datetime.now(datetime.timezone.utc).isoformat()
    open_snapshot = repo_snapshot()
    if open_snapshot["head"] != REPO_HEAD or not open_snapshot["treeClean"]:
        stops.append("S-1" if open_snapshot["head"] != REPO_HEAD else "S-3")

    ledger = os.path.join(REPO, "provenance/DECISION_LEDGER.md")
    manifest_path = os.path.join(REPO, "MANIFEST.json")
    manifest = json.load(open(manifest_path, encoding="utf-8"))
    validation_path = os.path.join(REPO, "qa/integrated-release-validation.json")
    validation = json.load(open(validation_path, encoding="utf-8"))
    if sha_file(ledger) != LEDGER_SHA or sha_file(manifest_path) != MANIFEST_SHA:
        stops.append("S-1")
    if sha_file(os.path.join(REPO, "CHECKSUMS.sha256")) != CHECKSUMS_SHA or sha_file(validation_path) != VALIDATION_SHA:
        stops.append("S-1")

    repo_pins = []
    for rel, expected in REPO_PINS.items():
        actual = sha_file(os.path.join(REPO, rel))
        repo_pins.append({"path": rel, "expectedSha256": expected, "actualSha256": actual,
                          "match": actual == expected})
        if actual != expected:
            stops.append("S-1")

    handoff = {
        "task0CensusSha256": sha_file(os.path.join(SCRATCH, "task-0", "boundary_topology_census.json")),
        "taskAReceiptSha256": sha_file(os.path.join(SCRATCH, "task-a", "mvp4_task_a_receipt.json")),
        "taskBReceiptSha256": sha_file(os.path.join(SCRATCH, "task-b", "mvp4_task_b_receipt.json")),
        "taskCReceiptSha256": sha_file(os.path.join(SCRATCH, "task-c", "mvp4_task_c_receipt.json")),
        "b1ReceiptSha256": sha_file(os.path.join(REPO, "qa/mvp3_task_b1_receipt.json")),
        "encoderSha256": sha_file(os.path.join(TASK_B1, "mvp3_encoder.py")),
        "specSha256": sha_file(os.path.join(TASK_B1, "mvp3_encoder_spec.json")),
    }
    if handoff["task0CensusSha256"] != TASK0_CENSUS_SHA or handoff["taskAReceiptSha256"] != TASK_A_RECEIPT_SHA:
        stops.append("S-1")
    if handoff["taskBReceiptSha256"] != TASK_B_RECEIPT_SHA or handoff["taskCReceiptSha256"] != TASK_C_RECEIPT_SHA:
        stops.append("S-1")
    if handoff["b1ReceiptSha256"] != B1_RECEIPT_SHA:
        stops.append("S-1")
    if handoff["encoderSha256"] != ENCODER_SHA or handoff["specSha256"] != SPEC_SHA:
        stops.append("S-1")

    positive = run_bridge("positive", "03742477")
    negative = run_bridge("negative", "00000000")
    if positive["exitCode"] != 0:
        stops.append("S-2")
    if negative["exitCode"] == 0 or "FAIL-CLOSED" not in (negative["stdout"] + negative["stderr"]):
        stops.append("S-2")

    b1 = load_b1()
    enc = b1.load_encoder()
    bridge = b1.load_bridge()
    model = bridge.Model()
    world = model.world
    census_masks = sorted(model.masks)
    if sha_file(os.path.join(TASK_B1, "mvp3_encoder.py")) != ENCODER_SHA:
        stops.append("S-1")

    counters = collections.Counter()
    dcmlab = corpus_dcmlab(enc, census_masks, counters)
    counters = collections.Counter()
    bach = corpus_bach(enc, census_masks, counters, b1)
    counters = collections.Counter()
    billboard = corpus_billboard(enc, census_masks, counters, b1)
    counters = collections.Counter()
    isophonics = corpus_isophonics(enc, census_masks, counters, b1)
    counters = collections.Counter()
    weimar = corpus_weimar(enc, census_masks, counters, b1)
    corpora = [dcmlab, bach, billboard, isophonics, weimar]

    b1_receipt = json.load(open(os.path.join(REPO, "qa/mvp3_task_b1_receipt.json"), encoding="utf-8"))
    expected_models = {row["corpus_id"]: row for row in b1_receipt["calibration"]["per_corpus"]}
    reproduction_rows = []
    total_transitions = 0
    for corpus in corpora:
        expected = expected_models[corpus["corpus_id"]]
        expected_split = expected["key_used_vs_override_split"]
        total_transitions += len(corpus["transitions"])
        row = {
            "corpusId": corpus["corpus_id"],
            "eventsEncoded": corpus["raw_events"],
            "dedupedEvents": corpus["dedupedEvents"],
            "duplicatesCollapsed": corpus["duplicatesCollapsed"],
            "transitions": len(corpus["transitions"]),
            "expectedEventsEncoded": expected["events_encoded"],
            "expectedDedupedEvents": expected["deduped_events"],
            "expectedDuplicatesCollapsed": expected["duplicates_collapsed"],
            "expectedTransitions": expected["transitions"],
            "transitionCountMatch": len(corpus["transitions"]) == expected["transitions"],
            "eventsMatch": corpus["raw_events"] == expected["events_encoded"],
            "dedupedMatch": corpus["dedupedEvents"] == expected["deduped_events"],
            "collapsedMatch": corpus["duplicatesCollapsed"] == expected["duplicates_collapsed"],
            "expectedBothKeyUsed": expected_split["both_key_used"]["transitions"],
            "expectedBothKeyUsedAccepted": expected_split["both_key_used"]["accepted"],
            "expectedOverride": expected_split["any_key_override"]["transitions"],
            "expectedOverrideAccepted": expected_split["any_key_override"]["accepted"],
        }
        row["allMatch"] = all(row[key] for key in ("transitionCountMatch", "eventsMatch",
                                                   "dedupedMatch", "collapsedMatch"))
        if not row["allMatch"]:
            stops.append("S-1")
        reproduction_rows.append(row)

    if total_transitions != 146712:
        stops.append("S-1")

    d1_corpora = []
    accepted_overrides = []
    both_key_used_total = 0
    both_key_used_accepted_total = 0
    override_total = 0
    override_accepted_total = 0
    observed_pairs = set()
    for corpus in corpora:
        verdicts = collections.Counter()
        both = {"transitions": 0, "samePhase": 0, "phaseChange": 0,
                "samePhaseReasons": collections.Counter(),
                "phaseChangeReasons": collections.Counter(),
                "accepted": 0, "keyCollectionEndpoint": 0}
        override = {"transitions": 0, "accepted": 0}
        for left, right in corpus["transitions"]:
            source = (left["mask"], left["phase"])
            target = (right["mask"], right["phase"])
            verdict, reasons, checks, citation = world.gate(source, target)
            observed_pairs.add((verdict, tuple(reasons)))
            verdicts[(verdict, tuple(reasons))] += 1
            population = "both" if left.get("key_used") and right.get("key_used") else "override"
            if population == "both":
                both["transitions"] += 1
                both_key_used_total += 1
                if left["phase"] == right["phase"]:
                    both["samePhase"] += 1
                    both["samePhaseReasons"][(verdict, tuple(reasons))] += 1
                else:
                    both["phaseChange"] += 1
                    both["phaseChangeReasons"][(verdict, tuple(reasons))] += 1
                if left["mask"] in (2741, 1453) or right["mask"] in (2741, 1453):
                    both["keyCollectionEndpoint"] += 1
                if verdict == "ACCEPT":
                    both["accepted"] += 1
                    both_key_used_accepted_total += 1
            else:
                override["transitions"] += 1
                override_total += 1
                if verdict == "ACCEPT":
                    override["accepted"] += 1
                    override_accepted_total += 1
                    target_role = model.role.get(target[0])
                    if target_role == "boundary":
                        transition_class = "boundary_entry"
                    elif citation is None:
                        transition_class = "tier-1"
                    elif citation == "FamilyA:R1":
                        transition_class = "FamilyA:R1"
                    elif citation == "FamilyA:L1":
                        transition_class = "FamilyA:L1"
                    elif citation == "FamilyB:bridge":
                        transition_class = "FamilyB:bridge"
                    else:
                        transition_class = citation or "unknown"
                    accepted_overrides.append({
                        "corpusId": corpus["corpus_id"], "source": f"{source[0]}@{source[1]}",
                        "target": f"{target[0]}@{target[1]}",
                        "transitionClass": transition_class, "citation": citation,
                        "sourceOffice": model.office.get(source[0]),
                        "targetOffice": model.office.get(target[0]),
                        "sourceTier": model.tier.get(source[0]),
                        "targetTier": model.tier.get(target[0]),
                        "sourceRole": model.role.get(source[0]),
                        "targetRole": model.role.get(target[0]),
                        "sourceLabel": label_of(left), "targetLabel": label_of(right),
                    })
        d1_corpora.append({
            "corpusId": corpus["corpus_id"],
            "bothKeyUsed": {
                "transitions": both["transitions"],
                "samePhase": both["samePhase"],
                "phaseChange": both["phaseChange"],
                "accepted": both["accepted"],
                "keyCollectionEndpoint": both["keyCollectionEndpoint"],
                "samePhaseReasons": [{"verdict": v, "reasons": list(r), "count": n}
                                     for (v, r), n in sorted(both["samePhaseReasons"].items())],
                "phaseChangeReasons": [{"verdict": v, "reasons": list(r), "count": n}
                                       for (v, r), n in sorted(both["phaseChangeReasons"].items())],
            },
            "override": override,
            "collapsedBothKeyUsed": corpus["collapsedBothKeyUsed"],
            "duplicatesCollapsed": corpus["duplicatesCollapsed"],
            "verdictCounts": [{"verdict": v, "reasons": list(r), "count": n}
                              for (v, r), n in sorted(verdicts.items())],
        })

    if both_key_used_accepted_total != 0:
        stops.append("S-1")
    if override_accepted_total != 8172:
        stops.append("S-1")

    key_collection_table = []
    for mask in (2741, 1453):
        phase_accepts = 0
        phase_rejects = 0
        for source_phase in range(12):
            for target_phase in range(12):
                if source_phase == target_phase:
                    continue
                verdict, reasons, checks, citation = world.gate((mask, source_phase), (mask, target_phase))
                if verdict == "ACCEPT":
                    phase_accepts += 1
                else:
                    phase_rejects += 1
        cross_verdict, cross_reasons, cross_checks, cross_citation = world.gate((2741, 0), (1453, 0))
        key_collection_table.append({
            "mask": mask, "role": model.role.get(mask), "governingRoot": model.gov_root.get(mask),
            "rlImages": model.sub3["rlImages"].get(str(mask)),
            "phaseChangeAccept": phase_accepts, "phaseChangeReject": phase_rejects,
            "crossCollectionGate": {"source": "2741@0" if mask == 2741 else "1453@0",
                                    "target": "1453@0" if mask == 2741 else "2741@0",
                                    "verdict": cross_verdict, "reasons": list(cross_reasons),
                                    "citation": cross_citation},
        })

    class_counts = collections.Counter(row["transitionClass"] for row in accepted_overrides)
    office_counts = collections.Counter()
    tier_counts = collections.Counter()
    role_counts = collections.Counter()
    pair_counts = collections.Counter()
    pair_labels = {}
    for row in accepted_overrides:
        office_counts[(row["sourceOffice"], row["targetOffice"])] += 1
        tier_counts[(row["sourceTier"], row["targetTier"])] += 1
        role_counts[(row["sourceRole"], row["targetRole"])] += 1
        pair = (row["source"], row["target"])
        pair_counts[pair] += 1
        if pair not in pair_labels:
            pair_labels[pair] = {"sourceLabel": row["sourceLabel"], "targetLabel": row["targetLabel"],
                                 "corpusId": row["corpusId"]}
    top_pairs = []
    for (source, target), count in sorted(pair_counts.items(), key=lambda item: (-item[1], item[0]))[:20]:
        top_pairs.append({"source": source, "target": target, "count": count, **pair_labels[(source, target)]})

    d3 = {}
    for corpus, label in ((dcmlab, "DCMLab"), (bach, "Bach")):
        p1_full = verdict_metrics(corpus["transitions"], world)
        p1_restricted = verdict_metrics(corpus["p1_restricted"]["transitions"], world)
        p2_restricted = verdict_metrics(corpus["p2_stream"]["transitions"], world)
        d3[label] = {
            "corpusId": corpus["corpus_id"],
            "eventsP1": corpus["raw_events"],
            "eventsP2": corpus["p2_stream"]["events"],
            "p2Skipped": corpus["p2_skipped"],
            "p1Full": p1_full,
            "p1Restricted": p1_restricted,
            "p2Restricted": p2_restricted,
            "phaseRuleEffect": {
                "acceptanceRateDeltaBp": p2_restricted["acceptanceRateBp"] - p1_restricted["acceptanceRateBp"],
                "tier1AcceptedDelta": p2_restricted["tier1Accepted"] - p1_restricted["tier1Accepted"],
                "seamAcceptedDelta": p2_restricted["seamAccepted"] - p1_restricted["seamAccepted"],
                "ungovernedDelta": p2_restricted["ungoverned"] - p1_restricted["ungoverned"],
                "unlicensedDelta": p2_restricted["unlicensed"] - p1_restricted["unlicensed"],
                "notCensusDelta": p2_restricted["notCensus"] - p1_restricted["notCensus"],
            },
        }

    expected_splits = {
        "DCMLab/ABC (beethoven_quartets)": (231, 0, 12901, 2998),
        "bach_chorales": (0, 0, 9429, 4285),
        "billboard_pop": (37184, 0, 46797, 546),
        "isophonics": (6662, 0, 5726, 127),
        "weimar_jazz": (5022, 0, 22760, 216),
    }
    split_matches = []
    for corpus in corpora:
        both = next(row for row in d1_corpora if row["corpusId"] == corpus["corpus_id"])
        expected = expected_splits[corpus["corpus_id"]]
        actual = (both["bothKeyUsed"]["transitions"], both["bothKeyUsed"]["accepted"],
                  both["override"]["transitions"], both["override"]["accepted"])
        split_matches.append({"corpusId": corpus["corpus_id"], "expected": list(expected),
                              "actual": list(actual), "match": actual == expected})
        if actual != expected:
            stops.append("S-1")
    if sum(row["actual"][0] for row in split_matches) != 49099:
        stops.append("S-1")

    vocab_ok = all(pair in PINNED_VOCAB for pair in observed_pairs)
    if not vocab_ok:
        stops.append("S-9")

    runner_path = os.path.abspath(__file__)
    runner_sha = sha_file(runner_path)
    aggregate_path = os.path.join(SCRATCH, "l20_runner_staging_manifest.json")
    aggregate = json.load(open(aggregate_path, encoding="utf-8"))
    entries = [row for row in aggregate["entries"] if row.get("role") != "mvp4_b1_diagnostic"]
    entries.append({"path": runner_path, "sha256": runner_sha, "role": "mvp4_b1_diagnostic",
                    "kind": "mvp4_runner", "verified": True})
    aggregate["entries"] = entries
    aggregate["verified"] = sum(1 for row in entries if row.get("verified"))
    aggregate["total"] = len(entries)
    aggregate_sha = write_json(aggregate_path, aggregate)

    close_snapshot = repo_snapshot()
    if close_snapshot["head"] != REPO_HEAD or not close_snapshot["treeClean"]:
        stops.append("S-3")

    receipt = {
        "schemaVersion": "mvp4.task-d-receipt.v1",
        "directive": "MVP4-DIR-1",
        "task": "Task D",
        "status": "COMPLETE" if not stops else "STOP",
        "stopRulesTriggered": sorted(set(stops)),
        "opening": {
            "timestampUtc": opened,
            "repoHead": open_snapshot["head"],
            "statusPorcelainSha256": open_snapshot["statusPorcelainSha256"],
            "treeClean": open_snapshot["treeClean"],
            "ledger": {"sha256": sha_file(ledger), "bytes": os.path.getsize(ledger),
                       "lines": sum(1 for _ in open(ledger, "rb"))},
            "manifest": {"sha256": sha_file(manifest_path), "fileCount": manifest["fileCount"],
                         "totalBytes": manifest["totalBytes"]},
            "checksumsSha256": sha_file(os.path.join(REPO, "CHECKSUMS.sha256")),
            "validation": {"sha256": sha_file(validation_path),
                           "releaseId": validation.get("releaseId"),
                           "checksPassed": validation.get("checksPassed"),
                           "checksFailed": validation.get("checksFailed")},
            "handoff": handoff,
        },
        "repoPins": repo_pins,
        "bridge": {"positive": positive, "negative": negative,
                   "lockedPins": {"GOVERNED_LOOP_REQUIRE_CLEAN": "1",
                                  "GOVERNED_LOOP_REPO_HEAD": REPO_HEAD,
                                  "GOVERNED_LOOP_MANIFEST_COUNT": "1488",
                                  "GOVERNED_LOOP_LEDGER_PREFIX": "03742477"}},
        "freezeGuard": {
            "encoderPath": os.path.join(TASK_B1, "mvp3_encoder.py"),
            "encoderSha256": handoff["encoderSha256"],
            "specPath": os.path.join(TASK_B1, "mvp3_encoder_spec.json"),
            "specSha256": handoff["specSha256"],
            "b1ReceiptPath": os.path.join(REPO, "qa/mvp3_task_b1_receipt.json"),
            "b1ReceiptSha256": handoff["b1ReceiptSha256"],
            "encoderBytesModified": False,
            "specBytesModified": False,
            "b1ReceiptModified": False,
        },
        "reproduction": {
            "totalTransitions": total_transitions,
            "expectedTotalTransitions": 146712,
            "totalMatch": total_transitions == 146712,
            "perCorpus": reproduction_rows,
            "splitMatches": split_matches,
            "allSplitsMatch": all(row["match"] for row in split_matches),
            "bothKeyUsedTotal": both_key_used_total,
            "bothKeyUsedAcceptedTotal": both_key_used_accepted_total,
            "overrideTotal": override_total,
            "overrideAcceptedTotal": override_accepted_total,
        },
        "diagnostic1": {
            "bothKeyUsedZeroAcceptanceProof": {
                "perCorpus": d1_corpora,
                "totalBothKeyUsed": both_key_used_total,
                "totalAccepted": both_key_used_accepted_total,
                "proof": "both_key_used endpoints use the same key collection; consecutive same-key completions reduce to identical mask@phase and are collapsed by deduplication. Surviving both_key_used transitions are key/phase changes, which are rejected unless a licensed Family A seam connects the two phases.",
            },
            "keyCollectionMasks": key_collection_table,
        },
        "diagnostic2": {
            "acceptedOverrides": override_accepted_total,
            "expected": 8172,
            "match": override_accepted_total == 8172,
            "classCounts": {key: class_counts.get(key, 0) for key in
                            ("tier-1", "FamilyA:R1", "FamilyA:L1", "FamilyB:bridge", "boundary_entry")},
            "officeCounts": [{"sourceOffice": source, "targetOffice": target, "count": count}
                             for (source, target), count in sorted(office_counts.items(),
                                                                   key=lambda item: (-item[1], str(item[0])))],
            "tierCounts": [{"sourceTier": source, "targetTier": target, "count": count}
                           for (source, target), count in sorted(tier_counts.items(),
                                                                 key=lambda item: (-item[1], str(item[0])))],
            "roleCounts": [{"sourceRole": source, "targetRole": target, "count": count}
                           for (source, target), count in sorted(role_counts.items(),
                                                                 key=lambda item: (-item[1], str(item[0])))],
            "topPairs": top_pairs,
        },
        "diagnostic3": {
            "rules": {"P1": "phase = local/score key tonic pc",
                      "P2": "phase = sounding chord root pc"},
            "corpora": d3,
        },
        "gateInteraction": {
            "observedPairs": [[verdict, list(reasons)] for verdict, reasons in sorted(observed_pairs)],
            "observedSubsetOfPinned": vocab_ok,
            "pinnedVocabulary": [[verdict, list(reasons)] for verdict, reasons in sorted(PINNED_VOCAB)],
        },
        "constraints": {"REPO_WRITES": 0, "encoderBytesModified": False,
                        "specBytesModified": False, "b1ReceiptModified": False,
                        "gateBytesModified": False},
        "staging": {"aggregateManifest": aggregate_path,
                    "aggregateManifestSha256": aggregate_sha,
                    "aggregateVerified": aggregate["verified"],
                    "aggregateTotal": aggregate["total"]},
        "artifacts": {"runnerPath": runner_path, "runnerSha256": runner_sha},
        "close": close_snapshot,
    }
    receipt["floatsDetected"] = find_floats(receipt)
    if receipt["floatsDetected"]:
        receipt["status"] = "STOP"
        receipt["stopRulesTriggered"] = sorted(set(receipt["stopRulesTriggered"] + ["S-6"]))
    receipt_path = os.path.join(TASK_D, "mvp4_task_d_receipt.json")
    receipt_sha = write_json(receipt_path, receipt)
    print(json.dumps({
        "status": receipt["status"], "stopRulesTriggered": receipt["stopRulesTriggered"],
        "totalTransitions": total_transitions,
        "bothKeyUsed": both_key_used_total, "bothAccepted": both_key_used_accepted_total,
        "overrideAccepted": override_accepted_total,
        "classCounts": {key: class_counts.get(key, 0) for key in
                        ("tier-1", "FamilyA:R1", "FamilyA:L1", "FamilyB:bridge", "boundary_entry")},
        "d3": {key: {"p1": val["p1Restricted"]["acceptanceRate"],
                     "p2": val["p2Restricted"]["acceptanceRate"],
                     "deltaBp": val["phaseRuleEffect"]["acceptanceRateDeltaBp"]}
               for key, val in d3.items()},
        "receipt": receipt_path, "receiptSha256": receipt_sha,
        "runnerSha256": runner_sha,
        "staging": {"verified": aggregate["verified"], "total": aggregate["total"]},
    }, indent=2, sort_keys=True))
    return 0 if receipt["status"] == "COMPLETE" and not receipt["stopRulesTriggered"] else 1


if __name__ == "__main__":
    sys.exit(main())
