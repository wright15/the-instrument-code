#!/usr/bin/env python3
"""MVP5.5-DIR-1 Task 0: fixed-point verification, predeclaration lock,
exact matrix recompute, and Candidate A checksum audit.

Scratch-first. Repository tree is strictly read-only. Fail-closed.
All discrete/rational output is int / fractions.Fraction / str only.
"""
import hashlib
import itertools
import json
import subprocess
import sys
from fractions import Fraction
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp5_5")
TASK0 = SCRATCH / "task-0"
PREDECL = TASK0 / "mvp5_5_predeclared_bets.json"
RECEIPT = TASK0 / "mvp5_5_task_0_receipt.json"
MANIFEST = SCRATCH / "l22_staging_manifest.json"

EXPECTED_HEAD = "52202ed9c4aad7d4baead2859972853aad28e7bb"
EXPECTED_LEDGER = "e74cf6a2d79e9170c6686f2fb5287043ab1dd2c41d4f9a56d62b97f766c8f1c4"
EXPECTED_MANIFEST = "076077b192364ab84d3258304a999f38ba993e8412db9f1b52a957c34fca9541"
EXPECTED_CHECKSUMS = "44f3d07cd6a076f2c452a65be0643d6cf1998df06fb6b62018b884995678c8ca"
EXPECTED_VALIDATION = "207b9aca105bc6d97310e1849a1ecb916507395ed87dabf433957a6891b2134a"
EXPECTED_LANDING = "c45214dae93a6da0c73fdfd7c96a0611f9ca9218793a9105bf198a0530606f0c"
EXPECTED_MANIFEST_FILES = 1585
EXPECTED_MANIFEST_BYTES = 110505727
EXPECTED_LEDGER_BYTES = 356466
EXPECTED_LEDGER_LINES = 4189
EMPTY_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

PINS = {
    "tools/governed-loop/mvp2.py": ("79c0cf706fffc23745cab6e87ffbc46d34d70ad94a93291135725e388dc17328", 38997),
    "tools/governed-loop/census_462.json": ("242bce7423bc2eb0ae61ee431c27901d6a87401b8b3ffd6725a04d0e1ed0685a", 194194),
    "tools/governed-loop/frozen_ground_truth.json": ("007b0ffe65015bd2c5f1a6fe0df8969961ce8cfb3d499677b143d971e1fc5744", 91360),
    "tools/governed-loop/frozen_seam_substrate_v3.json": ("9f9818effa5d11e4ef2634122c9f484faf6790323cabae130561c1c75e8a295f", 47207),
    "tools/governed-loop/seam_legal_moves_v3.json": ("e6cf62a8eefa0924da9286f2e664c1914d9d620ed2d299929f684fd48225c274", 551287),
    "tools/governed-loop/plv3_sweep_predeclared.json": ("14117c9460a6b611f849747f4881f296a8f3ce2108bb23524fe8beecd354e87b", 1712),
    "tools/governed-loop/plv3_sweep.json": ("6a943e44c9ed2dc0dc39810c9656872ee55d5ea86bcd4a1e80eb7de505ad8243", 10181),
    "tools/governed-loop/plv3_sweep.py": ("22e6b1e5998c92f445fe3a631b2842231b2d5fdbea56ca760436f3a022ac5c15", 9318),
    "docs/THREE_PART_CONTINUOUS_TYPOLOGY.md": ("11a7f70f71ccc061c115e1b0e2f38a9265d9872588b6b9e83be05e79e5568d6c", 6664),
    "docs/TIERED_PHOTONIC_THEOREM.md": ("c1d6fcb53ff947b9aa32991d8d3dfc999f127bba0cb48ddf807ecc37386867c3", 6857),
    "canonical/tiered-photonic-candidates/tiered-photonic-v1.json": ("00ce6e315a66346fa9673ab5a64460a788702cc097fac4069444901af6930f4e", 26338),
    "orrery/src/generated/photonic-overlay.v1.json": ("35e8958d6e6d2455ceb6442ef7dc50d07de80416bbed7bf78260c670cc10901e", 19586),
    "orrery/src/audio.ts": ("e863b845c8f2709a0fe0e6fe706dce603e795b760c6561d110d240ddb1dfca88", 37063),
    "tools/governed-loop/mvp5/task-b/mvp5_audio_renderer.py": ("0c917aab7a95851e90ce1c3244ea6b3af1ea35e362262cb0d7a0095ec40b9984", 24696),
    "tools/governed-loop/mvp5/task-a/traces/arm1_unranked_q_carried.jsonl": ("bf20119cb50c18317c93bef4e2bf0aeff1e0d937b84102d58e42d830479476df", 63047),
    "tools/governed-loop/mvp5/task-a/traces/arm2_static_q_carried.jsonl": ("52f3b5137d5ae537c200dd1ac588dea21057c3c2c17daaf67bcc5b3616cf45e8", 62729),
    "tools/governed-loop/mvp5/task-a/traces/arm3a_dynamic_q_reset.jsonl": ("dc941c1c30a32d8ab2a5813ba7e04c1a1605b3a5f681dfc9e6725ba10f7371c3", 65011),
    "tools/governed-loop/mvp5/task-a/traces/arm3b_dynamic_q_carried.jsonl": ("4ea86bb188b08438498adbfc80dca164b4bb73f5ae31a8305ca7577abf14778d", 65530),
    "tools/governed-loop/mvp5/task-a/traces/arm_tb_equiv_p0.jsonl": ("58c4ad8af84ad96a0241b204dae22538517cc189af8288b636ee0cdd06bc79dc", 9115),
    "tools/governed-loop/mvp5/task-a/traces/arm_tb_equiv_p7.jsonl": ("786f99cc4f05c492fbdd74fabf6380a3eab8f703a5bedb8718b09e8a694b93fa", 9080),
    "tools/governed-loop/mvp5/task-b/renders/track1_arm1_unranked_2cycle.wav": ("dcca3792aaa8b211cff95daa851de0e6dae6a9c2a7e100494acfff3e4c8462c4", 2646044),
    "tools/governed-loop/mvp5/task-b/renders/track2_arm2_static_4state.wav": ("04dd46fadb5793b938555e27c8909884db071af6ba8fe03576ec33c0f74723ab", 2646044),
    "tools/governed-loop/mvp5/task-b/renders/track3_arm3a_dynamic_q_reset.wav": ("b4e9b1674fd4ae3b94fc9e0921e3c461c642403fa34a91869fe851e069398307", 2672504),
    "tools/governed-loop/mvp5/task-b/renders/track4_arm3b_dynamic_q_carried.wav": ("d0fe3d2727593d22ee49ed50d64b0253ed36f52e64d9f202d43596106e735738", 2672504),
    "tools/governed-loop/mvp5/task-b/renders/track5_equiv_base_p0.wav": ("82a69919cd4d5bc7a8f0d14d40dfe653193bd6047c1088d3030e6c48098994a1", 396944),
    "tools/governed-loop/mvp5/task-b/renders/track6_equiv_lifted_p7.wav": ("2fa02243432104eb6a1a48a3b287c7a4a8ef79064dc37bab0737fa3be44ce917", 396944),
}

ANCHORS = {
    150: "        if cm == nm and cp == np_:",
    151: "            if self.gov_root[cm] is None:",
    152: '                checks["boundary_endpoint"] = True',
    153: '                checks["same_family"] = False',
    154: '                return "REJECT", ["ungoverned-transition"], checks, None',
    169: "        same_root = cr is not None and nr is not None and cr == nr",
    171: "        if same_root and cp == np_:",
    172: '            return "ACCEPT", [], checks, None',
    183: '        if checks["boundary_endpoint"]:',
    184: '            return "REJECT", ["ungoverned-transition"], checks, None',
    733: '        plan["dwellMs"] = int(__import__("os").environ.get("ORRERY_BRIDGE_DWELL_MS", "1500"))',
}

ALL_ORBIT_IDS = [
    "ORBIT-A0", "ORBIT-A1", "ORBIT-A2", "ORBIT-D1", "ORBIT-D2",
    "ORBIT-D3", "ORBIT-D4", "ORBIT-D5", "ORBIT-D6", "ORBIT-D7",
]


def stop(rule, detail):
    print(f"STOP: {rule} {detail}")
    sys.exit(2)


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))


def pc_list(mask):
    return [i for i in range(12) if (mask >> i) & 1]


def pc_sum(mask):
    return sum(pc_list(mask))


def transpose(mask, c):
    result = 0
    for pc in pc_list(mask):
        result |= 1 << ((pc + c) % 12)
    return result


def find_floats(obj, path="$"):
    found = []
    if isinstance(obj, float):
        found.append(path)
    elif isinstance(obj, dict):
        for key, value in obj.items():
            found.extend(find_floats(value, f"{path}.{key}"))
    elif isinstance(obj, (list, tuple)):
        for index, value in enumerate(obj):
            found.extend(find_floats(value, f"{path}[{index}]"))
    return found


def verify_fixed_point():
    head = subprocess.run(
        ["git", "rev-parse", "HEAD"], cwd=REPO, capture_output=True, text=True, check=True
    ).stdout.strip()
    status = subprocess.run(
        ["git", "status", "--porcelain"], cwd=REPO, capture_output=True, text=True, check=True
    ).stdout
    tree_digest = hashlib.sha256(status.encode("utf-8")).hexdigest()
    if head != EXPECTED_HEAD:
        stop("S-1", f"HEAD {head} != {EXPECTED_HEAD}")
    if status != "" or tree_digest != EMPTY_SHA256:
        stop("S-1", f"tree not clean: digest {tree_digest}")

    ledger = REPO / "provenance/DECISION_LEDGER.md"
    ledger_bytes = ledger.read_bytes()
    ledger_sha = hashlib.sha256(ledger_bytes).hexdigest()
    ledger_lines = ledger_bytes.count(b"\n")
    if ledger_sha != EXPECTED_LEDGER:
        stop("S-1", f"ledger hash {ledger_sha}")
    if len(ledger_bytes) != EXPECTED_LEDGER_BYTES or ledger_lines != EXPECTED_LEDGER_LINES:
        stop("S-1", "ledger size/line drift")

    manifest_path = REPO / "MANIFEST.json"
    manifest_sha = sha256_file(manifest_path)
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest_sha != EXPECTED_MANIFEST:
        stop("S-1", f"MANIFEST hash {manifest_sha}")
    if manifest["fileCount"] != EXPECTED_MANIFEST_FILES or manifest["totalBytes"] != EXPECTED_MANIFEST_BYTES:
        stop("S-1", "MANIFEST count/bytes drift")
    if len(manifest["files"]) != EXPECTED_MANIFEST_FILES:
        stop("S-1", "MANIFEST files length drift")

    checksums_sha = sha256_file(REPO / "CHECKSUMS.sha256")
    if checksums_sha != EXPECTED_CHECKSUMS:
        stop("S-1", f"CHECKSUMS hash {checksums_sha}")

    validation_path = REPO / "qa/integrated-release-validation.json"
    validation_sha = sha256_file(validation_path)
    validation = json.loads(validation_path.read_text(encoding="utf-8"))
    if validation_sha != EXPECTED_VALIDATION:
        stop("S-1", f"validation hash {validation_sha}")

    landing_sha = sha256_file(REPO / "qa/mvp5_landing_receipt.json")
    if landing_sha != EXPECTED_LANDING:
        stop("S-1", f"landing receipt hash {landing_sha}")

    return {
        "head": head,
        "treeClean": True,
        "treeDigest": tree_digest,
        "ledger": {
            "sha256": ledger_sha,
            "bytes": len(ledger_bytes),
            "lines": ledger_lines,
        },
        "manifest": {
            "sha256": manifest_sha,
            "fileCount": manifest["fileCount"],
            "totalBytes": manifest["totalBytes"],
        },
        "checksums": {"sha256": checksums_sha},
        "validation": {
            "sha256": validation_sha,
            "version": validation.get("version"),
            "pass": validation.get("pass"),
            "fail": validation.get("fail"),
        },
        "landingReceipt": {"sha256": landing_sha},
    }


def verify_pins():
    entries = []
    matches = 0
    byte_notes = []
    for relative, (expected_sha, expected_bytes) in PINS.items():
        path = REPO / relative
        if not path.is_file():
            stop("S-1", f"missing pin {relative}")
        actual_sha = sha256_file(path)
        actual_bytes = path.stat().st_size
        hash_match = actual_sha == expected_sha
        byte_match = actual_bytes == expected_bytes
        matches += 1 if hash_match else 0
        entries.append({
            "path": relative,
            "expectedSha256": expected_sha,
            "actualSha256": actual_sha,
            "expectedBytes": expected_bytes,
            "actualBytes": actual_bytes,
            "hashMatch": hash_match,
            "byteMatch": byte_match,
            "match": hash_match,
        })
        if not hash_match:
            stop("S-1", f"pin mismatch {relative}")
        if not byte_match:
            byte_notes.append({
                "path": relative,
                "directiveBytes": expected_bytes,
                "actualBytes": actual_bytes,
                "sha256Match": True,
                "disposition": (
                    "directive byte-column metadata discrepancy; the SHA-256 pin "
                    "(the cryptographic identity) matches at the L21 fixed point"
                ),
            })
    return {
        "count": len(PINS),
        "matches": matches,
        "entries": entries,
        "shaPinsEnforced": True,
        "byteMetadataDiscrepancies": byte_notes,
    }


def verify_anchors():
    lines = (REPO / "tools/governed-loop/mvp2.py").read_text(encoding="utf-8").splitlines()
    entries = []
    matches = 0
    for number, expected in sorted(ANCHORS.items()):
        actual = lines[number - 1] if 0 < number <= len(lines) else ""
        match = actual == expected
        matches += 1 if match else 0
        entries.append({
            "file": "tools/governed-loop/mvp2.py",
            "line": number,
            "expected": expected,
            "actual": actual,
            "match": match,
        })
        if not match:
            stop("S-1", f"anchor mismatch at mvp2.py:{number}")
    return {"count": len(ANCHORS), "matches": matches, "entries": entries}


def predeclare_bets():
    body = {
        "schemaVersion": "governed-loop.mvp5-5-predeclared-bets.v1",
        "directive": "MVP5.5-DIR-1",
        "status": "locked-before-evaluation",
        "discipline": (
            "Every candidate carries a triviality test and falsification criterion; "
            "classification is decided by generator case logic, never prose discretion."
        ),
        "sourceArtifacts": {
            "plv3_sweep.json": PINS["tools/governed-loop/plv3_sweep.json"][0],
            "census_462.json": PINS["tools/governed-loop/census_462.json"][0],
            "frozen_ground_truth.json": PINS["tools/governed-loop/frozen_ground_truth.json"][0],
            "tiered_photonic-v1.json": PINS["canonical/tiered-photonic-candidates/tiered-photonic-v1.json"][0],
            "mvp5_audio_renderer.py": PINS["tools/governed-loop/mvp5/task-b/mvp5_audio_renderer.py"][0],
        },
        "classificationTaxonomy": [
            "TRIVIAL_IDENTITY",
            "ORBIT_INVOLUTION_INVARIANT",
            "REPRESENTATION_ISOMORPHISM",
            "BOUNDARY_REFUTED",
            "BOUNDARY_CONFIRMED",
        ],
        "candidates": {
            "A": {
                "name": "Phase-Sum Identity",
                "statement": "sum over p in 0..11 of pcSum(T_p(M)) = 7 * 66 = 462 for every 7-note mask M",
                "trivialityTest": (
                    "holds for arbitrary 7-subsets of Z_12 independent of census membership "
                    "or orbit partition; checksum utility only"
                ),
                "expectedClassification": "TRIVIAL_IDENTITY",
                "falsification": "any 7-note mask or census mask deviating from 462",
                "checks": {
                    "censusMasks": 462,
                    "allSevenNoteMasks": 792,
                    "orbits": 10,
                },
            },
            "B": {
                "name": "Reflection Pairing Involution",
                "statement": (
                    "mean_p(O) + mean_(11-p)(O) = 77 within every governed orbit, while "
                    "pcSum(T_p(M)) + pcSum(T_(11-p)(M)) != 77 in general on chiral masks"
                ),
                "trivialityTest": (
                    "per-mask reflection fails on individual chiral masks (I0(M) != M); "
                    "the orbit-level law is carried by the explicit involution "
                    "I0: x -> (-x) mod 12"
                ),
                "expectedClassification": "ORBIT_INVOLUTION_INVARIANT",
                "falsification": (
                    "any orbit/phase pair violating 77*|O|, any violation of "
                    "pcSum(T_p(M)) + pcSum(T_(11-p)(I0(M))) = 77, or I0 escaping an orbit"
                ),
                "checks": {
                    "pairwiseIdentity": 5544,
                    "perOrbitPhasePairs": 60,
                    "orbits": 10,
                    "phasePairs": 6,
                },
            },
            "C": {
                "name": "Orbit Phase Curves as Pitch-Class Tomography",
                "statement": (
                    "the cyclic step delta total_(p+1)-total_p = 7n - 12*w_p recovers the orbit "
                    "pitch-class multiplicity histogram w_p = h_O((11-p) mod 12)"
                ),
                "trivialityTest": (
                    "the wrap ladder is orbit-specific; it must separate ORBIT-D2 from ORBIT-D5 "
                    "despite their equal spread 213/35, and all 10 phase curves must be distinct"
                ),
                "expectedClassification": "REPRESENTATION_ISOMORPHISM",
                "falsification": (
                    "any non-integer w_p, any histogram mismatch, any duplicate orbit spectrum, "
                    "or failure to separate D2 from D5"
                ),
                "checks": {
                    "stepWraps": 120,
                    "histogramMatches": 120,
                    "orbitPairs": 45,
                    "distinctSpectra": 10,
                },
            },
            "D": {
                "name": "Achromatic Coincidence Set and Cross-Orbit Spread Profile",
                "statement": (
                    "cross-orbit spread is exactly zero only at p in {0, 11}; interior minimum "
                    "96/35 at p in {5, 6}; global maximum 60/7 at p in {3, 8}"
                ),
                "trivialityTest": (
                    "the zero set must be exactly {0, 11}, not a vacuous all-zero or "
                    "all-nonzero profile"
                ),
                "expectedClassification": "ORBIT_INVOLUTION_INVARIANT",
                "falsification": (
                    "any additional or missing zero phase, asymmetry under p -> 11-p, "
                    "or mismatch of the declared extrema"
                ),
                "checks": {
                    "phases": 12,
                    "expectedZeroSet": [0, 11],
                    "expectedMax": "60/7",
                    "expectedInteriorMin": "96/35",
                },
            },
        },
        "continuousBets": {
            "B1": {
                "name": "Container Frequency Sum Convergence",
                "formulation": (
                    "S_f(M,p) = sum over pc in T_p(M) of 440*2^((60+pc-69)/12) Hz; test whether "
                    "cross-orbit spread of the orbit mean falls below 1e-9 Hz at any phase"
                ),
                "toleranceHz": "1e-9",
                "expectedDisposition": "BOUNDARY_REFUTED",
                "rationale": (
                    "2^(x/12) is strictly convex, so orbit means at p in {0,11} split in "
                    "proportion to differing second and higher pitch-class moments"
                ),
                "falsification": (
                    "BOUNDARY_CONFIRMED if any phase shows cross-orbit spread below the "
                    "predeclared tolerance; BOUNDARY_REFUTED otherwise"
                ),
            },
            "B2": {
                "name": "Multiplicative Frequency-Transport Step Law and Log Dual",
                "formulation": (
                    "S_f(M,(p+1) mod 12) = 2^(1/12)*S_f(M,p) - f_C4*1_(11 in T_p(M)), with "
                    "f_C4 = 440*2^(-9/12); log dual (12/ln2)*sum ln(f(pc)/f_C4) = pcSum"
                ),
                "toleranceHz": "1e-9",
                "expectedDisposition": "BOUNDARY_CONFIRMED",
                "rationale": (
                    "each wrapped pitch class loses exactly one octave; the logarithmic "
                    "coordinate is linear in pitch class"
                ),
                "falsification": (
                    "any step-law residual above tolerance, or log-dual deviation from pcSum"
                ),
            },
            "C1": {
                "name": "Renderer-to-Air FFT Fidelity",
                "formulation": (
                    "compare physical FFT spectral centroid C_FFT(b) against analytical "
                    "overtone-weighted C_model(b) across all 86 voiced bars"
                ),
                "expectedDisposition": "BOUNDARY_CONFIRMED",
                "falsification": (
                    "systematic mismatch beyond the predeclared relative tolerance of 1e-2 "
                    "between measured and modelled centroids, or any non-finite centroid"
                ),
            },
            "C2": {
                "name": "Symbolic pcSum and Fundamental Centroid Tracking",
                "formulation": (
                    "raw correlation r(C_FFT, pcSum) versus office-deconfounded correlation "
                    "r(C_FFT - mean_office, pcSum) on single- and multi-office walks"
                ),
                "expectedDisposition": "BOUNDARY_CONFIRMED",
                "falsification": (
                    "office deconfounding failing to raise correlation on multi-office walks, "
                    "or a non-finite correlation"
                ),
            },
            "C3": {
                "name": "Equivariant Acoustic Shift track5 vs track6",
                "formulation": (
                    "bar-by-bar physical centroid shift vs exact symbolic shift "
                    "delta pcSum = 7*delta p - 12*delta w"
                ),
                "expectedDisposition": "BOUNDARY_CONFIRMED",
                "falsification": (
                    "any bar pair whose symbolic shift is not reproduced in sign or whose "
                    "physical centroid is non-finite"
                ),
            },
        },
        "guardFlags": {
            "causationClaim": False,
            "physicalQuantityClaim": False,
            "tierClassifier": False,
            "globalCHNull": True,
        },
    }
    body["predeclarationHash"] = hashlib.sha256(canonical(body).encode("utf-8")).hexdigest()
    PREDECL.write_text(json.dumps(body, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    locked = json.loads(PREDECL.read_text(encoding="utf-8"))
    check_body = {k: v for k, v in locked.items() if k != "predeclarationHash"}
    actual = hashlib.sha256(canonical(check_body).encode("utf-8")).hexdigest()
    if actual != locked["predeclarationHash"]:
        stop("S-2", "predeclaration self-hash mismatch")
    return {
        "path": "task-0/mvp5_5_predeclared_bets.json",
        "sha256": sha256_file(PREDECL),
        "predeclarationHash": locked["predeclarationHash"],
        "status": "locked-before-evaluation",
        "candidateCount": len(locked["candidates"]),
        "continuousBetCount": len(locked["continuousBets"]),
    }


def recompute_matrix(census, ground_truth, sweep):
    masks = {record["stateId"]: record["pitchMask"] for record in census["records"]}
    if len(masks) != 462:
        stop("S-4", f"census cardinality {len(masks)} != 462")
    orbit_map = {orbit["orbitId"]: orbit for orbit in ground_truth["orbits"]}
    sweep_map = {orbit["orbitId"]: orbit for orbit in sweep["orbits"]}
    if sorted(orbit_map) != sorted(sweep_map) or sorted(orbit_map) != sorted(ALL_ORBIT_IDS):
        stop("S-4", "orbit id sets disagree")

    cells = 0
    matches = 0
    mismatches = []
    for orbit_id in ALL_ORBIT_IDS:
        members = orbit_map[orbit_id]["memberIds"]
        n = len(members)
        recorded = sweep_map[orbit_id]
        if recorded["memberCount"] != n:
            stop("S-4", f"{orbit_id} memberCount {recorded['memberCount']} != {n}")
        totals = []
        means = []
        for p in range(12):
            total = sum(pc_sum(transpose(masks[m], p)) for m in members)
            mean = Fraction(total, n)
            totals.append(total)
            means.append(mean)
            cells += 1
            if str(total) == str(recorded["totals"][p]) and str(mean) == str(recorded["meansExact"][p]):
                matches += 1
            else:
                mismatches.append({
                    "orbitId": orbit_id,
                    "phase": p,
                    "recomputedTotal": total,
                    "recordedTotal": recorded["totals"][p],
                    "recomputedMean": str(mean),
                    "recordedMean": recorded["meansExact"][p],
                })
    if mismatches:
        stop("S-4", f"{len(mismatches)} matrix mismatches")
    if cells != 120 or matches != 120:
        stop("S-4", f"cell coverage {cells}/{matches}")
    return {
        "cells": cells,
        "matches": matches,
        "mismatches": mismatches,
        "totalsMatch": True,
        "meansMatch": True,
        "matrix": {
            orbit_id: {
                "memberCount": orbit_map[orbit_id]["memberCount"],
                "totals": sweep_map[orbit_id]["totals"],
                "meansExact": sweep_map[orbit_id]["meansExact"],
            }
            for orbit_id in ALL_ORBIT_IDS
        },
    }


def audit_candidate_a(census, ground_truth, sweep):
    masks = {record["stateId"]: record["pitchMask"] for record in census["records"]}
    census_checks = 0
    census_failures = []
    for state_id, mask in masks.items():
        phase_sum = sum(pc_sum(transpose(mask, p)) for p in range(12))
        census_checks += 1
        if phase_sum != 462:
            census_failures.append({"stateId": state_id, "mask": mask, "phaseSum": phase_sum})
    if census_failures:
        stop("S-4", f"Candidate A census failures: {len(census_failures)}")

    all_masks_checks = 0
    all_masks_failures = []
    for combo in itertools.combinations(range(12), 7):
        mask = 0
        for pc in combo:
            mask |= 1 << pc
        phase_sum = sum(pc_sum(transpose(mask, p)) for p in range(12))
        all_masks_checks += 1
        if phase_sum != 462:
            all_masks_failures.append({"mask": mask, "phaseSum": phase_sum})
    if all_masks_failures:
        stop("S-4", f"Candidate A 7-note failures: {len(all_masks_failures)}")
    if all_masks_checks != 792:
        stop("S-4", f"7-note mask coverage {all_masks_checks} != 792")

    orbit_map = {orbit["orbitId"]: orbit for orbit in ground_truth["orbits"]}
    sweep_map = {orbit["orbitId"]: orbit for orbit in sweep["orbits"]}
    total_checks = 0
    mean_checks = 0
    orbit_failures = []
    for orbit_id in ALL_ORBIT_IDS:
        n = orbit_map[orbit_id]["memberCount"]
        recorded = sweep_map[orbit_id]
        total_sum = sum(recorded["totals"])
        mean_sum = sum(Fraction(value) for value in recorded["meansExact"])
        total_checks += 1
        mean_checks += 1
        if total_sum != 462 * n:
            orbit_failures.append({"orbitId": orbit_id, "kind": "total", "value": total_sum})
        if mean_sum != 462:
            orbit_failures.append({"orbitId": orbit_id, "kind": "mean", "value": str(mean_sum)})
    if orbit_failures:
        stop("S-4", f"Candidate A orbit failures: {orbit_failures}")

    return {
        "classification": "TRIVIAL_IDENTITY",
        "identityValue": 462,
        "perMaskCensus": {"checks": census_checks, "failures": len(census_failures)},
        "allSevenNoteMasks": {"checks": all_masks_checks, "failures": len(all_masks_failures)},
        "perOrbit": {
            "totalChecks": total_checks,
            "meanChecks": mean_checks,
            "failures": len(orbit_failures),
            "phaseAverage": "77/2",
        },
        "orbitConstrainingPower": "none (checksum guardrail only)",
    }


def init_staging_manifest():
    body = {
        "schemaVersion": "governed-loop.mvp5-5-l22-staging-manifest.v1",
        "directive": "MVP5.5-DIR-1",
        "status": "open",
        "executionRealm": str(SCRATCH),
        "repositoryWrites": 0,
        "orreryChanges": 0,
        "gateBytesTouched": False,
        "entries": [],
    }
    MANIFEST.write_text(json.dumps(body, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return {
        "path": "l22_staging_manifest.json",
        "initialized": True,
        "entries": 0,
        "sha256": sha256_file(MANIFEST),
    }


def main():
    TASK0.mkdir(parents=True, exist_ok=True)
    opening = verify_fixed_point()
    pins = verify_pins()
    anchors = verify_anchors()
    predeclaration = predeclare_bets()

    sweep = json.loads((REPO / "tools/governed-loop/plv3_sweep.json").read_text(encoding="utf-8"))
    census = json.loads((REPO / "tools/governed-loop/census_462.json").read_text(encoding="utf-8"))
    ground_truth = json.loads(
        (REPO / "tools/governed-loop/frozen_ground_truth.json").read_text(encoding="utf-8")
    )

    matrix = recompute_matrix(census, ground_truth, sweep)
    candidate_a = audit_candidate_a(census, ground_truth, sweep)
    staging = init_staging_manifest()

    receipt = {
        "schemaVersion": "governed-loop.mvp5-5-task-0.v1",
        "directive": "MVP5.5-DIR-1",
        "task": "T0",
        "status": "COMPLETE",
        "opening": opening,
        "pins": pins,
        "anchors": anchors,
        "predeclaration": predeclaration,
        "matrixRecompute": {
            "cells": matrix["cells"],
            "matches": matrix["matches"],
            "mismatches": matrix["mismatches"],
            "totalsMatch": matrix["totalsMatch"],
            "meansMatch": matrix["meansMatch"],
        },
        "matrix": matrix["matrix"],
        "candidateA": candidate_a,
        "modality": {
            "modality1ZeroFloats": True,
            "modality2Touched": False,
            "modality3DiscreteOnly": True,
        },
        "stagingManifest": staging,
        "gov517_correspondence_claimed": False,
        "still_set_label": "still_set",
        "stopRulesTriggered": [],
    }
    floats = find_floats(receipt)
    if floats:
        stop("S-5", f"float values in Task 0 receipt: {floats[:5]}")
    receipt["floatScan"] = {"values": 0, "witnesses": []}

    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    print("MVP5.5 TASK 0 COMPLETE")
    print(f"  HEAD {opening['head']}")
    print(f"  pins {pins['matches']}/{pins['count']} | anchors {anchors['matches']}/{anchors['count']}")
    print(f"  predeclaration {predeclaration['predeclarationHash'][:16]}... locked")
    print(f"  matrix {matrix['matches']}/{matrix['cells']} exact")
    print(f"  Candidate A {candidate_a['classification']} "
          f"census {candidate_a['perMaskCensus']['checks']}/"
          f"{candidate_a['perMaskCensus']['checks']} "
          f"7-note {candidate_a['allSevenNoteMasks']['checks']}/"
          f"{candidate_a['allSevenNoteMasks']['checks']}")
    print(f"  receipt sha256 {sha256_file(RECEIPT)}")


if __name__ == "__main__":
    main()
