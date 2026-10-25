#!/usr/bin/env python3
"""MVP-2a Phase 0-extension freeze: seam substrate from sitting-HEAD 3fb6857.

Reads pre-extracted scratch files (seam_*) and the MVP-1 frozen ground truth.
Writes frozen_seam_substrate.json + freeze_report_v2.json. Fail-closed.
No repository writes.
"""
import csv
import json
import hashlib
import sys
from collections import Counter, defaultdict

SCRATCH = "/home/erick/workspace/governed-loop"
SITTING_HEAD = "3fb68575c49d2a649728ec79ebdb2f541a55d2fb"
ADMITTED_BRIDGE_CLASSES = ["5-23", "5-27"]

EXPECTED_HASHES = {
    "seam_operator_registry.csv": "e5a9e6929fca048078e0db6ff044facc7137a6ef61e994d74f1d526e27b6482e",
    "seam_operator_applications.csv": "1f7b2abb047132fa957f761a73e7c76038766f617bed9c916f971a8c0072f53e",
    "seam_rl_operator_math.md": "ab5746357090e8e314b019f41107664e9c701f08f266b00a34784623e00c4f4b",
    "seam_phase_a_probe.json": "48f513679d505087277d5670952fb860b755832775f5fb5980aa3f71c73330bb",
    "seam_build_phase_a_probe.mjs": "59deb0e42a9806c8136ec70349f4707c025cd5d2ab97fb7e723b490a14c3c0c8",
    "seam_validate_phase_a_probe.mjs": "8177b23d20446e377318af36d5303b1c7dbc38d6a80ba5f1cab15a50a8c7d9ee",
    "seam_legal_moves_v2.json": "c017c3c66e10b803eccb82342d030575c8069434063657fb89b5d56169db4d4b",
    "seam_census_head.json": "f7e56b2b180c456fd4abc96069796d6737f77d13ba66c751604fe95cd19e6d5a",
    "seam_bipartite_inclusion.json": "903eebf0e1122d8ba81971abcd7efc8ac934d3bfd7885b98b49e58ab0bbe3e41",
}
MVP1_PROBE_SHA = "48f513679d505087277d5670952fb860b755832775f5fb5980aa3f71c73330bb"


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def pc_list(mask):
    return [i for i in range(12) if (mask >> i) & 1]


def fail(msg):
    print(f"FAIL-CLOSED: {msg}")
    sys.exit(1)


def main():
    # 1. source hash verification
    for name, expected in EXPECTED_HASHES.items():
        actual = sha256_file(f"{SCRATCH}/{name}")
        if actual != expected:
            fail(f"{name} hash {actual} != {expected}")

    gt = json.load(open(f"{SCRATCH}/frozen_ground_truth.json"))
    masks = {int(k): v for k, v in gt["census"]["masks"].items()}
    role = {int(k): v for k, v in gt["census"]["role"].items()}
    tier = {int(k): v for k, v in gt["census"]["tier"].items()}
    gov_root = {int(k): v for k, v in gt["governingRoot"].items()}
    families = {int(k): v for k, v in gt["families"].items()}

    applications = list(csv.DictReader(open(f"{SCRATCH}/seam_operator_applications.csv")))
    if len(applications) != 3402:
        fail(f"applications {len(applications)} != 3402")
    if not all(r["application_status"] == "formal_substrate_observed" for r in applications):
        fail("non-observed application status present")

    op_counts = Counter(r["operator_id"] for r in applications)
    if op_counts.get("M") != 462:
        fail("M count != 462")
    for op in ["R1", "L1"] + [f"{d}{i}" for d in "RL" for i in range(2, 8)]:
        if op_counts.get(op) != 210:
            fail(f"{op} count {op_counts.get(op)} != 210")
    if op_counts.get("R1", 0) + op_counts.get("L1", 0) != 420:
        fail("R1+L1 != 420")

    # 2. carries from the frozen probe
    probe = json.load(open(f"{SCRATCH}/seam_phase_a_probe.json"))
    carries = {op["operatorId"]: op["phaseCarry"] for op in probe["p2Equivariance"]["perOperator"]}
    if carries.get("R1") != 1 or carries.get("L1") != -1:
        fail("R1/L1 carries wrong")
    if any(v != 0 for k, v in carries.items() if k not in ("R1", "L1")):
        fail("non-zero carry outside R1/L1")
    total_checks = sum(op["checks"] for op in probe["p2Equivariance"]["perOperator"])
    if total_checks != 40824:
        fail(f"equivariance checks {total_checks} != 40824")

    # 3. R1/L1 image table + boundary census
    rl_images = defaultdict(list)
    boundary_sources = set()
    boundary_targets = set()
    for r in applications:
        op = r["operator_id"]
        if op not in ("R1", "L1"):
            continue
        src, tgt = int(r["source_id"]), int(r["target_id"])
        if src not in masks or tgt not in masks:
            fail(f"RL row {r['application_id']} outside census")
        rl_images[src].append([op, tgt])
        if role[src] == "boundary":
            boundary_sources.add(src)
        if role[tgt] == "boundary":
            boundary_targets.add(tgt)
    rl_image_map = {str(k): sorted(v) for k, v in sorted(rl_images.items())}
    rl_rows = sum(len(v) for v in rl_images.values())
    if rl_rows != 420 or len(rl_image_map) != 336:
        fail(f"RL rows {rl_rows} != 420 or distinct sources {len(rl_image_map)} != 336")

    # 4. Family B derivation (pentatonic bridges between 7-35 and 7-32)
    bipartite = json.load(open(f"{SCRATCH}/seam_bipartite_inclusion.json"))
    hn = bipartite["heptatonicNodes"]
    n735 = [v for v in hn.values() if v["setClassId"] == "7-35"]
    n732 = [v for v in hn.values() if v["setClassId"] == "7-32"]
    if len(n735) != 7 or len(n732) != 14:
        fail(f"7-35 nodes {len(n735)} / 7-32 nodes {len(n732)} unexpected")
    pairs = []
    crossings = 0
    hist = Counter()
    for left in n735:
        lset = set(left["subnodes"])
        for right in n732:
            shared = sorted(lset & set(right["subnodes"]))
            if not shared:
                continue
            admitted = [s for s in shared if bipartite["pentatonicSubnodes"][s]["setClassId"] in ADMITTED_BRIDGE_CLASSES]
            pairs.append({
                "leftId": left["id"], "rightId": right["id"],
                "leftMask": left["pitchMask"], "rightMask": right["pitchMask"],
                "leftRole": role[left["pitchMask"]], "rightRole": role[right["pitchMask"]],
                "sharedCount": len(shared), "admittedCount": len(admitted),
                "sharedSubnodes": shared, "admittedSubnodes": admitted,
            })
            crossings += len(shared)
            hist[len(shared)] += 1
    if len(pairs) != 42 or crossings != 90 or dict(hist) != {1: 30, 5: 12}:
        fail(f"Family B census mismatch: pairs {len(pairs)}, crossings {crossings}, hist {dict(hist)}")
    and_shared = [p for p in pairs if p["leftId"] == "7-35:3" and p["rightId"] == "7-32:0"][0]
    if and_shared["sharedCount"] != 5 or and_shared["admittedCount"] != 2:
        fail("Andalusian ground truth mismatch")

    # 5. lineage: census payload identity (482a1bfb MVP-1 freeze vs sitting-HEAD)
    head_census = json.load(open(f"{SCRATCH}/seam_census_head.json"))
    head_records = {r["stateId"]: r for r in head_census["records"]}
    mvp1_census = json.load(open(f"{SCRATCH}/census_462.json"))
    mvp1_records = {r["stateId"]: r for r in mvp1_census["records"]}
    payload_identical = all(head_records[s] == mvp1_records[s] for s in mvp1_records) and set(head_records) == set(mvp1_records)
    if not payload_identical:
        fail("census payload drifted between MVP-1 freeze and sitting-HEAD")
    if sha256_file(f"{SCRATCH}/seam_phase_a_probe.json") != MVP1_PROBE_SHA:
        fail("probe not byte-stable vs MVP-1 freeze")

    # 6. license widths from initial state 1387@0
    node1387 = next(v for v in hn.values() if v["pitchMask"] == 1387)
    fam1387 = set(families[gov_root[1387]])
    fam_b_partners = [p for p in pairs if p["leftId"] == node1387["id"]]
    fam_b_masks = sorted({(p["rightMask"] if p["leftId"] == node1387["id"] else p["leftMask"]) for p in fam_b_partners})
    fam_b_new = [m for m in fam_b_masks if m not in fam1387]
    family_a_phase0 = []  # all R1/L1 images land at phase 11/1, unreachable at phase 0
    prereg = {
        "hardBound": "veto rate <= 49.24% (Tier 2 widens acceptance only)",
        "familyAPhase0Width": len(family_a_phase0),
        "familyBFrom1387All": len(fam_b_masks),
        "familyBFrom1387New": len(fam_b_new),
        "familyBFrom1387Masks": fam_b_masks,
        "familyBNewMasks": fam_b_new,
        "familyOf1387": sorted(fam1387),
    }

    substrate = {
        "schemaVersion": "governed-loop.frozen-seam-substrate.v1",
        "source": {
            "sittingHead": SITTING_HEAD,
            "mvp1Lineage": {
                "checkpointCommit": "482a1bfbc6ac5cb55a670c988b21d0f6bdb52d92",
                "censusPayloadIdentical": payload_identical,
                "probeByteStable": True,
                "statement": "MVP-1 inputs came from 482a1bfb; MVP-2 inputs come from sitting-HEAD; census payload-identity asserted; fingerprints drift, payloads hold (A2 lesson).",
            },
            "files": {name: EXPECTED_HASHES[name] for name in EXPECTED_HASHES},
        },
        "carries": carries,
        "rlImages": rl_image_map,
        "familyBPairs": pairs,
        "counts": {
            "applications": len(applications),
            "rlApplications": 420,
            "mApplications": op_counts["M"],
            "familyBPairs": len(pairs),
            "familyBCrossings": crossings,
            "boundarySourcesAmongRL": len(boundary_sources),
            "boundaryTargetsAmongRL": len(boundary_targets),
        },
        "policyDetails": {
            "v2-P1": "Family B licensed bidirectionally from the recorded 42-pair census (the recorded object is the pair set; the Andalusian ground truth is one directional musical instance).",
            "v2-P2": "Tier 2 precedes the boundary rule per the adjudicated gate order; consequence: the 128 boundary-landing R1/L1 rows are licensed transitions. Recorded, maintainer-reviewable.",
            "v2-P3": "No free phase steps: phase change only as an operator carry (R1 +1, L1 -1) or 0 (Family B).",
        },
        "preregistration": prereg,
    }
    with open(f"{SCRATCH}/frozen_seam_substrate.json", "w") as f:
        json.dump(substrate, f, indent=2, sort_keys=True)
        f.write("\n")

    report = {
        "schemaVersion": "governed-loop.freeze-report-v2.v1",
        "sittingHead": SITTING_HEAD,
        "checks": {
            "applicationCount3402": True,
            "perOperatorCounts210x14plusM462": True,
            "rlTotal420": True,
            "carriesR1Plus1L1Minus1OthersZero": True,
            "equivarianceChecks40824": True,
            "familyBCensus42Pairs90CrossingsHistogram30x1_12x5": True,
            "andalusianShared5Admitted2": True,
            "censusPayloadIdentityMvp1ToHead": payload_identical,
            "probeByteStableSinceMvp1": True,
            "rlRows420DistinctSources336": True,
        },
        "boundaryNote": {
            "rlBoundarySources": len(boundary_sources),
            "rlBoundaryTargets": len(boundary_targets),
            "note": "R1/L1 algebra includes boundary records; Tier 2A licenses them per adjudicated ordering (v2-P2).",
        },
        "preregistration": prereg,
        "substrateSha256": sha256_file(f"{SCRATCH}/frozen_seam_substrate.json"),
    }
    with open(f"{SCRATCH}/freeze_report_v2.json", "w") as f:
        json.dump(report, f, indent=2, sort_keys=True)
        f.write("\n")

    print("FREEZE-V2 OK")
    print(f"  applications 3402 | R1+L1 rows {rl_rows} | distinct RL sources {len(rl_image_map)}")
    print(f"  family B: {len(pairs)} pairs / {crossings} crossings / hist {dict(hist)}")
    print(f"  boundary among RL: sources {len(boundary_sources)}, targets {len(boundary_targets)}")
    print(f"  lineage: census payload identical {payload_identical}; probe byte-stable True")
    print(f"  prereg: FamilyA phase0 width {prereg['familyAPhase0Width']}; FamilyB from 1387: {prereg['familyBFrom1387All']} total, {prereg['familyBFrom1387New']} new")
    print(f"  substrate sha {report['substrateSha256'][:16]}…")


if __name__ == "__main__":
    main()
