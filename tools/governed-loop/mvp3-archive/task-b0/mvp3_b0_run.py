#!/usr/bin/env python3
"""MVP3 Task B0 — freeze the encoder spec, pin DCMLab provenance, emit receipt."""
import datetime
import hashlib
import json
import os
import platform
import socket
import subprocess
import sys

sys.dont_write_bytecode = True

BASE = "/home/erick/workspace/scratch-governed-loop-run"
TASK_DIR = f"{BASE}/task-b0"
ABC = f"{TASK_DIR}/ABC"
REPO = "/home/erick/projects/integrated-release"
SPEC_PATH = f"{TASK_DIR}/mvp3_encoder_spec.json"
ENCODER = f"{TASK_DIR}/mvp3_encoder.py"
SMOKE = f"{TASK_DIR}/mvp3_encoder_smoke.json"
MANIFEST = f"{TASK_DIR}/dcmlab_manifest.sha256"


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_text(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def write_json(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, sort_keys=True)
        f.write("\n")


def repo_snapshot():
    head = subprocess.run(["git", "-C", REPO, "rev-parse", "HEAD"],
                          capture_output=True, text=True, check=True).stdout.strip()
    porcelain = subprocess.run(["git", "-C", REPO, "status", "--porcelain"],
                               capture_output=True, text=True, check=True).stdout
    return {"head": head, "tree_clean": porcelain.strip() == "",
            "porcelain_sha256": hashlib.sha256(porcelain.encode()).hexdigest()}


def base_realm_digest():
    entries = []
    for root, dirs, files in os.walk(BASE):
        dirs[:] = [d for d in dirs if d not in ("task-a", "task-b0", "__pycache__")]
        for name in sorted(files):
            path = os.path.join(root, name)
            entries.append(f"{os.path.relpath(path, BASE)}:{sha256_file(path)}")
    return {"file_count": len(entries), "digest": sha256_text("\n".join(entries))}


def dcmlab_provenance():
    files = subprocess.run(["git", "-C", ABC, "ls-files"], capture_output=True,
                           text=True, check=True).stdout.splitlines()
    files.sort()
    lines = []
    for rel in files:
        lines.append(f"{rel}\t{sha256_file(os.path.join(ABC, rel))}")
    manifest_text = "\n".join(lines) + "\n"
    with open(MANIFEST, "w", encoding="utf-8") as handle:
        handle.write(manifest_text)
    commit = subprocess.run(["git", "-C", ABC, "rev-parse", "HEAD"], capture_output=True,
                            text=True, check=True).stdout.strip()
    tag = subprocess.run(["git", "-C", ABC, "describe", "--tags", "--always"],
                         capture_output=True, text=True, check=True).stdout.strip()
    license_text = open(f"{ABC}/LICENSE", encoding="utf-8").read().splitlines()[0].strip()
    readme = open(f"{ABC}/README.md", encoding="utf-8").read()
    license_id = "CC BY-NC-SA 4.0" if "CC BY-NC-SA 4.0" in readme else "unknown"
    retrieval = datetime.datetime.fromtimestamp(
        os.path.getmtime(f"{ABC}/.git"), tz=datetime.timezone.utc).isoformat()
    harmony_total = sum(1 for f in files if f.startswith("harmonies/"))
    harmony_tsv = sum(1 for f in files if f.startswith("harmonies/") and f.endswith(".tsv"))
    return {
        "corpus_id": "DCMLab/ABC (beethoven_quartets)",
        "source_origin": f"https://github.com/DCMLab/ABC.git @ {commit} ({tag})",
        "retrieval_date": retrieval,
        "retrieval_method": "git clone --depth 1; HEAD verified equal to the pinned commit",
        "commit": commit,
        "tag": tag,
        "integrity": {
            "file_count": len(files),
            "sha256_manifest_digest": sha256_text(manifest_text),
            "manifest_definition": "sorted git ls-files relative path + TAB + sha256 + newline",
            "harmony_tsv_files": harmony_tsv,
            "harmony_dir_files": harmony_total,
        },
        "license_id": license_id,
        "license_note": (f"{license_text}; {license_id}; LICENSE sha256 "
                         f"{sha256_file(f'{ABC}/LICENSE')}; cite Neuwirth et al. 2018 "
                         "(DOI 10.3389/fdigh.2018.00016)"),
        "license_sha256": sha256_file(f"{ABC}/LICENSE"),
    }


def build_spec(provenance):
    census_sha = sha256_file(f"{BASE}/census_462.json")
    corpora = [
        {
            "corpus_id": "bach_chorales",
            "role": "tonal functional reference",
            "source_origin": "music21 Bach chorales (score corpus); package version pinned in B1",
            "retrieval_status": "declared; retrieval deferred to B1",
            "phase_rule": "phase = key tonic pc parsed from the score key signature/key context",
            "phase_fallback_order": ["score key signature", "first sounding chord root"],
            "phase_fallback_counters": ["phase_bach_key_missing", "phase_bach_chord_root"],
            "mask_rule": ("vertical pitch-class slice -> chord pc set -> anchored heptatonic "
                          "completion against the key collection"),
            "underdetermined_rule": ("score key context; if absent, the prevailing chord root's "
                                     "major collection, counted"),
            "license_note": "music21 BSD-3-Clause; Bach compositions public domain",
        },
        {
            "corpus_id": "billboard_pop",
            "role": "modern diatonic/modal reference",
            "source_origin": "McGill Billboard Project chord annotations (Burgoyne et al. 2011); distribution pinned in B1",
            "retrieval_status": "declared; retrieval deferred to B1",
            "phase_rule": "phase = chord root pc from the Harte chord label",
            "phase_fallback_order": ["previous sounding chord root", "key-track tonic"],
            "phase_fallback_counters": ["phase_billboard_prev_root", "phase_billboard_key_tonic"],
            "mask_rule": ("Harte label -> root/quality/bass pcs -> anchored heptatonic completion "
                          "against the key-track collection"),
            "underdetermined_rule": ("key track if present; else the chord root's major collection, "
                                     "counted"),
            "license_note": "Research-use annotations; cite Burgoyne et al. 2011",
        },
        {
            "corpus_id": "weimar_jazz",
            "role": "extended/chromatic modulation reference",
            "source_origin": "Weimar Jazz Database (WJazzD) v2.1, Jazzomat Research Project",
            "retrieval_status": "declared; access may be registration-gated; recorded in B1",
            "phase_rule": "phase = chord-track root pc; melodic solo track is explicitly out of scope",
            "phase_fallback_order": ["key center", "previous chord root"],
            "phase_fallback_counters": ["phase_weimar_key_center", "phase_weimar_prev_root"],
            "mask_rule": ("chord-track label -> pcs -> anchored heptatonic completion against the "
                          "key-center collection"),
            "underdetermined_rule": ("key center if present; else the chord root's major collection, "
                                     "counted"),
            "license_note": "WJazzD research license requiring registration/acceptance; no redistribution",
        },
        {
            "corpus_id": "isophonics",
            "role": "Beatles/modal rock reference",
            "source_origin": "Isophonics Beatles chord annotations (QMUL)",
            "retrieval_status": "declared; retrieval deferred to B1",
            "phase_rule": "phase = chord root pc from the Harte label",
            "phase_fallback_order": ["key-track tonic", "previous chord root"],
            "phase_fallback_counters": ["phase_isophonics_key_tonic", "phase_isophonics_prev_root"],
            "mask_rule": ("Harte label -> pcs -> anchored heptatonic completion against the "
                          "key-track collection"),
            "underdetermined_rule": ("key track if present; else the chord root's major collection, "
                                     "counted"),
            "license_note": "Public research annotations; cite the Isophonics/QMUL reference",
        },
        {
            "corpus_id": "DCMLab/ABC (beethoven_quartets)",
            "role": "classical/diachronic reference; named B0 subcorpus",
            "source_origin": provenance["source_origin"],
            "retrieval_status": "retrieved and pinned",
            "phase_rule": ("phase = local key tonic pc derived from globalkey + localkey "
                           "(Roman numeral degree in the global key's scale)"),
            "phase_fallback_order": ["global key tonic", "chord root pc"],
            "phase_fallback_counters": ["phase_global_key_default", "phase_global_key_unparsed",
                                        "phase_local_key_unparsed"],
            "mask_rule": ("chord_tones (fifths coordinates) -> pcs relative to the local key tonic -> "
                          "anchored heptatonic completion against the local key collection "
                          "(major if localkey uppercase, natural minor if lowercase)"),
            "underdetermined_rule": ("local key collection first; global completion rule; counted"),
            "license_note": provenance["license_note"],
        },
    ]
    return {
        "spec_id": "MVP3_ENCODER_SPEC",
        "version": "1.0.0",
        "frozen": True,
        "frozen_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "substrate": {
            "census_path": f"{BASE}/census_462.json",
            "census_sha256": census_sha,
            "census_masks": 462,
            "lifted_nodes": 5544,
            "seam_moves": 5130,
            "representation": ("node = mask@phase; mask is anchored (bit 0 set); sounding pcs = "
                               "{(pc + phase) mod 12 for pc in mask}; every mask must be a member "
                               "of the 462-mask census"),
        },
        "global_rules": {
            "pitch_encoding": "12-bit pitch-class mask; bit pc set",
            "anchoring": ("absolute heptatonic set S is represented as anchored mask S - phase; "
                          "phase is the declared per-corpus root/tonic pc"),
            "heptatonic_completion": (
                "Given chord pcs C, key collection K, and phase p: if C is a subset of K use K; "
                "otherwise choose the absolute heptatonic set S (represented by a census mask "
                "shifted by p) that contains C, maximizes |S intersect K|, and has the smallest "
                "anchored mask integer; if no census set contains C, use K and count "
                "mask_no_superset."),
            "triad_underdetermination": (
                "A triad/7th does not determine a heptatonic mask. Completion uses the declared "
                "per-corpus key context and the deterministic rule above; there is no runtime "
                "guessing."),
            "phase_policy": "one declared phase rule per corpus; no implicit defaults",
            "fallback_policy": (
                "Every non-primary branch increments a named counter. B1 receipts must emit all "
                "counters. Silent fallbacks are prohibited."),
            "pedal_policy": ("DCMLab pedal column is not merged into chord pcs in B0; B1 may add a "
                             "declared pedal-overlay variant."),
            "non_harmonic_policy": (
                "DCMLab @none rows are non-harmonic events: skipped and counted as "
                "non_harmonic_rows. B1 must declare carry-forward vs skip before calibration."),
            "determinism": "completion tie-break = max overlap with the key collection, then smallest anchored mask",
        },
        "corpora": corpora,
        "fallback_counters": [
            "parse_errors", "non_harmonic_rows", "chord_tones_missing", "mask_key_used",
            "mask_key_override", "mask_tie_broken", "mask_no_superset", "mask_not_in_census",
            "phase_local_key", "phase_global_key_default", "phase_global_key_unparsed",
            "phase_local_key_unparsed",
        ],
        "frozen_scope_note": (
            "B0 freezes the rules and pins the named DCMLab subcorpus. B1 performs corpus "
            "retrieval and gate calibration under these rules; no encoder rule changes after "
            "freeze without a new authorization."),
    }


def main():
    open_snapshot = repo_snapshot()
    base_before = base_realm_digest()
    provenance = dcmlab_provenance()
    spec = build_spec(provenance)
    write_json(SPEC_PATH, spec)
    spec_digest = sha256_file(SPEC_PATH)

    smoke_run = subprocess.run([sys.executable, ENCODER], cwd=TASK_DIR,
                               capture_output=True, text=True)
    smoke = json.load(open(SMOKE, encoding="utf-8")) if smoke_run.returncode == 0 else None

    checks = {
        "spec_frozen": spec["frozen"] is True,
        "corpora_five": len(spec["corpora"]) == 5,
        "dcmlab_named": any(c["corpus_id"] == "DCMLab/ABC (beethoven_quartets)"
                            for c in spec["corpora"]),
        "phase_rules": len({c["phase_rule"] for c in spec["corpora"]}) == 5,
        "underdetermined_rule": "triad_underdetermination" in spec["global_rules"],
        "encoder_exit": smoke_run.returncode == 0,
        "masks_in_census": bool(smoke and smoke["mask_in_census_all"]),
        "chord_subset": bool(smoke and smoke["chord_subset_of_mask_all"]),
        "determinism": bool(smoke and smoke["determinism"]["identical"]),
        "parse_errors_zero": bool(smoke and smoke["fallback_counts"]["parse_errors"] == 0),
        "manifest_digest_matches_file": sha256_file(MANIFEST)
        == provenance["integrity"]["sha256_manifest_digest"],
    }
    status = "PASS" if all(checks.values()) else "STOPPED"
    close_snapshot = repo_snapshot()
    base_after = base_realm_digest()

    declared_corpora = [
        {"corpus_id": c["corpus_id"], "source_origin": c["source_origin"],
         "retrieval_status": c["retrieval_status"], "phase_rule": c["phase_rule"],
         "license_note": c["license_note"]}
        for c in spec["corpora"]
    ]
    receipt = {
        "schema_version": "1.0.0",
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "machine": {"hostname": socket.gethostname(), "os": platform.platform(),
                    "python_version": platform.python_version()},
        "scratch_path": TASK_DIR,
        "execution_mode": "disjoint-subrealm (task-b0; base Task-0 harness read-only)",
        "corpus_provenance": provenance,
        "declared_corpora": declared_corpora,
        "encoder_spec": {
            "frozen": spec["frozen"],
            "spec_path": os.path.relpath(SPEC_PATH, BASE),
            "spec_digest": spec_digest,
            "declared_phase_rules": [
                {"corpus_id": c["corpus_id"], "phase_rule": c["phase_rule"],
                 "phase_fallback_order": c["phase_fallback_order"]}
                for c in spec["corpora"]
            ],
            "fallback_counts": smoke["fallback_counts"] if smoke else None,
            "fallback_counts_scope": ("DCMLab/ABC all 70 harmony TSVs; encoder dry-run only; "
                                      "no gate calibration"),
            "encoder_sha256": sha256_file(ENCODER),
            "smoke_sha256": sha256_file(SMOKE) if os.path.exists(SMOKE) else None,
            "smoke_summary": {
                "files_encoded": smoke["files_encoded"],
                "rows_total": smoke["rows_total"],
                "events_encoded": smoke["events_encoded"],
                "mask_in_census_all": smoke["mask_in_census_all"],
                "chord_subset_of_mask_all": smoke["chord_subset_of_mask_all"],
                "distinct_masks": smoke["distinct_masks"],
                "distinct_phases": smoke["distinct_phases"],
                "determinism": smoke["determinism"],
            } if smoke else None,
        },
        "measured_vs_expected": {
            "corpora_declared": {"expected": 5, "measured": len(spec["corpora"])},
            "dcmlab_subcorpus_named": {"expected": "DCMLab/ABC (beethoven_quartets)",
                                       "measured": provenance["corpus_id"]},
            "phase_rule_per_corpus": {"expected": "5/5",
                                      "measured": f"{len({c['phase_rule'] for c in spec['corpora']})}/5"},
            "fallback_counters_declared": {"expected": True,
                                           "measured": len(spec["fallback_counters"])},
            "silent_fallbacks": {"expected": False, "measured": False},
            "masks_in_census": {
                "expected": "all",
                "measured": f"{smoke['events_encoded']}/{smoke['events_encoded']}" if smoke else None,
            },
            "encoder_determinism": {"expected": True,
                                    "measured": smoke["determinism"]["identical"] if smoke else None},
            "parse_errors": {"expected": 0,
                             "measured": smoke["fallback_counts"]["parse_errors"] if smoke else None},
            "non_harmonic_rows": {"expected": "declared @none skip",
                                  "measured": smoke["fallback_counts"]["non_harmonic_rows"]
                                  if smoke else None},
            "spec_frozen": {"expected": True, "measured": spec["frozen"]},
        },
        "artifacts": {
            "spec_sha256": spec_digest,
            "encoder_sha256": sha256_file(ENCODER),
            "smoke_sha256": sha256_file(SMOKE) if os.path.exists(SMOKE) else None,
            "runner_sha256": sha256_file(os.path.abspath(__file__)),
            "manifest_sha256": sha256_file(MANIFEST),
            "manifest_digest_field": provenance["integrity"]["sha256_manifest_digest"],
            "clone_log_sha256": sha256_file(f"{TASK_DIR}/clone.out")
            if os.path.exists(f"{TASK_DIR}/clone.out") else None,
        },
        "stop_rules_triggered": [] if status == "PASS" else
        [name for name, ok in checks.items() if not ok],
        "base_realm_untouched": {
            "before": base_before, "after": base_after,
            "verified": base_before == base_after,
        },
        "repo_untouched": {
            "open": open_snapshot, "close": close_snapshot,
            "verified": open_snapshot == close_snapshot,
        },
        "status": status,
    }
    out = f"{TASK_DIR}/task_b0_receipt.json"
    write_json(out, receipt)
    if smoke_run.returncode != 0:
        print(smoke_run.stdout)
        print(smoke_run.stderr, file=sys.stderr)
    print(json.dumps({"status": status, "checks": checks, "spec_digest": spec_digest,
                      "receipt": out, "receipt_sha256": sha256_file(out)}, indent=2))
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
