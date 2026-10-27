#!/usr/bin/env python3
"""MVP3 Task B0 — frozen heptatonic transposition / phase-carry encoder core.

B0 scope: freeze the encoder rules and validate them on the named DCMLab
subcorpus (Annotated Beethoven Corpus). No gate calibration is performed here.
"""
import csv
import glob
import hashlib
import json
import sys
from collections import Counter

BASE = "/home/erick/workspace/scratch-governed-loop-run"
TASK_DIR = f"{BASE}/task-b0"
CENSUS = f"{BASE}/census_462.json"
ABC = f"{TASK_DIR}/ABC"

NOTE_PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
MAJOR = [0, 2, 4, 5, 7, 9, 11]
NATURAL_MINOR = [0, 2, 3, 5, 7, 8, 10]
ROMAN = {"I": 0, "II": 1, "III": 2, "IV": 3, "V": 4, "VI": 5, "VII": 6}


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_text(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def load_census_masks():
    records = json.load(open(CENSUS, encoding="utf-8"))["records"]
    masks = sorted({int(r["pitchMask"]) for r in records})
    if len(masks) != 462:
        raise RuntimeError(f"census mask count {len(masks)} != 462")
    return masks


def key_name_to_pc(name):
    if not name:
        return None
    letter = name[0].upper()
    if letter not in NOTE_PC:
        return None
    pc = NOTE_PC[letter]
    for ch in name[1:]:
        if ch == "#":
            pc += 1
        elif ch == "b":
            pc -= 1
        else:
            return None
    return pc % 12


def roman_parts(roman):
    """Return (degree_index 0..6, accidental semitones) or None."""
    if not roman:
        return None
    accidental = 0
    text = roman
    while text and text[0] in "b#":
        if text[0] == "b":
            accidental -= 1
        else:
            accidental += 1
        text = text[1:]
    upper = text.upper()
    if upper not in ROMAN:
        return None
    return ROMAN[upper], accidental


def scale_for(is_minor):
    return NATURAL_MINOR if is_minor else MAJOR


def local_tonic_pc(globalkey, globalkey_is_minor, localkey):
    tonic = key_name_to_pc(globalkey)
    if tonic is None:
        return None, "global_key_unparsed"
    if not localkey:
        return tonic, "global_key_default"
    parts = roman_parts(localkey)
    if parts is None:
        return tonic, "local_key_unparsed"
    degree, accidental = parts
    scale = scale_for(globalkey_is_minor)
    return (tonic + scale[degree] + accidental) % 12, "local_key"


def fifth_to_pc(tonic, fifth):
    return (tonic + 7 * fifth) % 12


def pc_set_to_mask(pcs):
    mask = 0
    for pc in pcs:
        mask |= 1 << (pc % 12)
    return mask


def key_mask_for(tonic, is_minor):
    return pc_set_to_mask({(tonic + step) % 12 for step in scale_for(is_minor)})


def complete_anchored_mask(chord_pcs, key_pcs, phase, census_masks, counters):
    """Choose an absolute heptatonic set S (chord subset, key-context tie-break),
    then return the anchored mask S - phase and the absolute set S."""
    key_abs = pc_set_to_mask(key_pcs)
    chord_abs = pc_set_to_mask(chord_pcs)
    if chord_pcs and (chord_abs & ~key_abs) == 0:
        counters["mask_key_used"] += 1
        chosen = set(key_pcs)
    else:
        candidates = []
        for mask in census_masks:
            absolute = {(pc + phase) % 12 for pc in range(12) if (mask >> pc) & 1}
            if (chord_abs & ~pc_set_to_mask(absolute)) == 0:
                candidates.append((mask, absolute))
        if not candidates:
            counters["mask_no_superset"] += 1
            counters["mask_key_override"] += 1
            chosen = set(key_pcs)
        else:
            overlaps = [bin(pc_set_to_mask(absolute) & key_abs).count("1")
                        for _, absolute in candidates]
            best = max(overlaps)
            top = [candidate for candidate, overlap in zip(candidates, overlaps)
                   if overlap == best]
            if len(top) > 1:
                counters["mask_tie_broken"] += 1
            _, chosen = min(top, key=lambda item: item[0])
            counters["mask_key_override"] += 1
    anchored = pc_set_to_mask({(pc - phase) % 12 for pc in chosen})
    if anchored not in census_masks:
        counters["mask_not_in_census"] += 1
    return anchored, chosen


def encode_dcmlab_row(row, census_masks, counters):
    globalkey = row.get("globalkey", "").strip()
    localkey = row.get("localkey", "").strip()
    is_minor = str(row.get("globalkey_is_minor", "0")).strip() == "1"
    tonic, phase_source = local_tonic_pc(globalkey, is_minor, localkey)
    counters[f"phase_{phase_source}"] += 1
    if tonic is None:
        counters["parse_errors"] += 1
        return None
    chord_tones = [t.strip() for t in row.get("chord_tones", "").split(",") if t.strip()]
    root_field = row.get("root", "").strip()
    if not chord_tones and not root_field:
        if row.get("label", "").strip() == "@none" or row.get("chord", "").strip() == "@none":
            counters["non_harmonic_rows"] += 1
        else:
            counters["parse_errors"] += 1
        return None
    if chord_tones:
        try:
            chord_pcs = {fifth_to_pc(tonic, int(t)) for t in chord_tones}
        except ValueError:
            counters["parse_errors"] += 1
            return None
    else:
        try:
            chord_pcs = {fifth_to_pc(tonic, int(root_field))}
        except ValueError:
            counters["parse_errors"] += 1
            return None
        counters["chord_tones_missing"] += 1
    key_pcs = {(tonic + step) % 12 for step in scale_for(is_minor)}
    anchored_mask, absolute = complete_anchored_mask(
        chord_pcs, key_pcs, tonic, census_masks, counters)
    return {
        "mc": row.get("mc"), "mn": row.get("mn"),
        "label": row.get("label"), "globalkey": globalkey,
        "localkey": localkey, "is_minor": is_minor,
        "phase": tonic, "phase_source": phase_source,
        "chord_pcs": sorted(chord_pcs), "key_pcs": sorted(key_pcs),
        "key_mask_anchored": pc_set_to_mask({(pc - tonic) % 12 for pc in key_pcs}),
        "mask": anchored_mask, "mask_in_census": anchored_mask in census_masks,
        "absolute_pcs": sorted(absolute),
        "chord_subset_of_mask": (pc_set_to_mask(chord_pcs) & ~pc_set_to_mask(absolute)) == 0,
    }


def encode_dcmlab_file(path, census_masks, counters):
    events = []
    with open(path, encoding="utf-8") as handle:
        reader = csv.DictReader(handle, delimiter="\t")
        for row in reader:
            counters["rows_total"] += 1
            event = encode_dcmlab_row(row, census_masks, counters)
            if event is not None:
                events.append(event)
    return events


def smoke():
    census_masks = load_census_masks()
    files = sorted(glob.glob(f"{ABC}/harmonies/*.tsv"))
    if len(files) != 70:
        raise RuntimeError(f"expected 70 DCMLab harmony files, found {len(files)}")
    counters = Counter({key: 0 for key in (
        "rows_total", "parse_errors", "non_harmonic_rows", "chord_tones_missing",
        "mask_key_used", "mask_key_override", "mask_tie_broken",
        "mask_no_superset", "mask_not_in_census", "phase_local_key",
        "phase_global_key_default", "phase_global_key_unparsed",
        "phase_local_key_unparsed")})
    all_events = []
    per_file = []
    for path in files:
        events = encode_dcmlab_file(path, census_masks, counters)
        all_events.extend(events)
        per_file.append({"file": path.rsplit("/", 1)[-1], "rows": len(events)})
    digest = sha256_text(json.dumps(all_events, sort_keys=True, separators=(",", ":")))
    # Determinism re-run
    counters2 = Counter({key: 0 for key in counters})
    all_events2 = []
    for path in files:
        all_events2.extend(encode_dcmlab_file(path, census_masks, counters2))
    digest2 = sha256_text(json.dumps(all_events2, sort_keys=True, separators=(",", ":")))
    masks = sorted({e["mask"] for e in all_events})
    phases = sorted({e["phase"] for e in all_events})
    result = {
        "corpus_id": "DCMLab/ABC (beethoven_quartets)",
        "files_encoded": len(files),
        "rows_total": counters["rows_total"],
        "events_encoded": len(all_events),
        "mask_in_census_all": all(e["mask_in_census"] for e in all_events),
        "chord_subset_of_mask_all": all(e["chord_subset_of_mask"] for e in all_events),
        "distinct_masks": len(masks),
        "distinct_phases": len(phases),
        "phases": phases,
        "fallback_counts": dict(counters),
        "determinism": {"digest": digest, "digest_rerun": digest2,
                        "identical": digest == digest2},
        "sample_events": all_events[:12],
        "per_file": per_file,
    }
    out = f"{TASK_DIR}/mvp3_encoder_smoke.json"
    with open(out, "w", encoding="utf-8") as handle:
        json.dump(result, handle, indent=2, sort_keys=True)
        handle.write("\n")
    print(json.dumps({k: result[k] for k in (
        "files_encoded", "rows_total", "events_encoded", "mask_in_census_all",
        "distinct_masks", "distinct_phases", "fallback_counts", "determinism")},
        indent=2))
    return result


if __name__ == "__main__":
    smoke()
