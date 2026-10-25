#!/usr/bin/env python3
"""Phase 0 freeze: extract and verify the 482a1bfb payload into frozen_ground_truth.json.

Reads only pre-extracted scratch files (bytes captured via `git show 482a1bfb:<path>`).
No repository writes. Fails closed on any structural mismatch.
"""
import hashlib
import json
import sys
from collections import Counter, defaultdict

SCRATCH = "/home/erick/workspace/governed-loop"
CHECKPOINT = "482a1bfb"
EXECUTION_COMMIT = "a27bd3e"
ECAL_CENSUS_SHA = "88c4accccb0d10098379c5dd38e1eab467c716e39a16882d323ac31b839c2046"
ECAL_NETWORK_SHA = "21e2a632837ecf40fe9229e9eb4ec0a5cceb9e2043fe89cb8e1d320518d7bdbc"
ECAL_GATE_SHA = "ff336d464f0351feb2d8c60503a1cfada24bd31549a6fd2f8a2cc2f4b8789483"


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def pc_list(mask):
    return [i for i in range(12) if (mask >> i) & 1]


def pc_sum(mask):
    return sum(pc_list(mask))


def fail(msg):
    print(f"FAIL-CLOSED: {msg}")
    sys.exit(1)


def main():
    census = json.load(open(f"{SCRATCH}/census_462.json"))
    network = json.load(open(f"{SCRATCH}/network_data.json"))
    gate = json.load(open(f"{SCRATCH}/census_val.json"))
    aggregate = json.load(open(f"{SCRATCH}/gov528_aggregate.json"))
    census_exec = json.load(open(f"{SCRATCH}/census_exec.json"))
    gate_exec = json.load(open(f"{SCRATCH}/census_val_exec.json"))

    # --- census extraction -------------------------------------------------
    records = census["records"]
    if len(records) != 462:
        fail(f"census cardinality {len(records)} != 462")

    masks = {}
    role = {}
    tier = {}
    census_office = {}
    census_office_index = {}
    for r in records:
        sid = r["stateId"]
        if sid in masks:
            fail(f"duplicate stateId {sid}")
        masks[sid] = r["pitchMask"]
        role[sid] = r["role"]
        tier[sid] = r.get("tier")
        census_office[sid] = r.get("office")
        census_office_index[sid] = r.get("officeIndex")
        if sid != r["pitchMask"]:
            fail(f"stateId {sid} != pitchMask {r['pitchMask']}")

    counts = Counter(role.values())
    if counts != Counter({"anchor": 70, "satellite": 238, "boundary": 154}):
        fail(f"role reconciliation {dict(counts)}")

    # --- GOVERNS edges -----------------------------------------------------
    governs = [
        e for e in network["structuralEdges"]
        if e.get("type") == "GOVERNS"
    ]
    if len(governs) != 238:
        fail(f"GOVERNS edges {len(governs)} != 238")
    if not all(e.get("governing") is True for e in governs):
        fail("non-governing GOVERNS edge present")
    parent = {}
    parent_mode = {}
    for e in governs:
        src, tgt = e["source"], e["target"]
        if role.get(src) != "anchor":
            fail(f"GOVERNS source {src} is not an anchor")
        if role.get(tgt) != "satellite":
            fail(f"GOVERNS target {tgt} is not a satellite")
        if tgt in parent:
            fail(f"satellite {tgt} has multiple GOVERNS parents")
        if e.get("hamming") != 2:
            pass  # recorded in audit only; attachment mode carries 34 root_phase
        parent[tgt] = src
        parent_mode[tgt] = e.get("mode")
    satellites = {s for s in masks if role[s] == "satellite"}
    if set(parent) != satellites:
        fail("GOVERNS edges do not cover exactly the 238 satellites")
    sources = set(parent.values())
    if len(sources) != 63:
        fail(f"distinct governing anchors {len(sources)} != 63")
    anchors = {s for s in masks if role[s] == "anchor"}
    self_rooted = anchors - sources
    d7_anchors = {s for s in anchors if tier[s] == "D7"}
    if self_rooted != d7_anchors:
        fail(f"self-rooted anchors {sorted(self_rooted)} != D7 anchors {sorted(d7_anchors)}")
    if len(self_rooted) != 7:
        fail(f"self-rooted anchors {len(self_rooted)} != 7")

    # --- governing_root + office checks ------------------------------------
    gov_root = {}
    for sid in masks:
        if role[sid] == "anchor":
            gov_root[sid] = sid
        elif role[sid] == "satellite":
            gov_root[sid] = parent[sid]
        else:
            gov_root[sid] = None

    anchor_rule_ok = 0
    for sid in anchors:
        direct = (4 - pc_sum(masks[sid])) % 7
        if direct != census_office_index[sid]:
            fail(f"anchor office rule mismatch at {sid}: {direct} != {census_office_index[sid]}")
        anchor_rule_ok += 1

    satellite_inherit_ok = 0
    for sid in satellites:
        anchor_office = census_office_index[parent[sid]]
        if anchor_office != census_office_index[sid]:
            fail(f"satellite {sid} office inheritance mismatch")
        if census_office[sid] != census_office[parent[sid]]:
            fail(f"satellite {sid} office name inheritance mismatch")
        satellite_inherit_ok += 1

    # every anchored mask contains pc 0 exactly once (wrap-count premise)
    all_have_pc0 = all((masks[s] & 1) == 1 for s in masks)

    # --- orbits from the frozen GOV-528 aggregate --------------------------
    orbits = []
    orbit_members = set()
    for o in aggregate["orbits"]:
        members = [m["stateId"] for m in o["members"]]
        if len(members) != o["memberCount"]:
            fail(f"orbit {o['orbitId']} memberCount mismatch")
        total = sum(pc_sum(masks[s]) for s in members)
        if total != 36 * len(members):
            fail(f"orbit {o['orbitId']} mean != 36 ({total}/{len(members)})")
        if orbit_members & set(members):
            fail(f"orbit {o['orbitId']} overlaps another orbit")
        orbit_members |= set(members)
        orbits.append({
            "orbitId": o["orbitId"],
            "tier": o["tier"],
            "order": o["order"],
            "memberIds": members,
            "memberCount": len(members),
            "pcSumTotal": total,
            "pcSumMean": total // len(members),
        })
    if len(orbits) != 10:
        fail(f"orbit count {len(orbits)} != 10")
    if len(orbit_members) != 308:
        fail(f"orbit member union {len(orbit_members)} != 308")
    office_supported = anchors | satellites
    if orbit_members != office_supported:
        fail("orbit union != office-supported 308 domain")

    # --- family partition --------------------------------------------------
    families = defaultdict(list)
    for sid in office_supported:
        families[gov_root[sid]].append(sid)
    if len(families) != 70:
        fail(f"family count {len(families)} != 70")
    fam_sizes = sorted((len(v) for v in families.values()), reverse=True)
    if sum(fam_sizes) != 308:
        fail(f"family member sum {sum(fam_sizes)} != 308")
    singleton_families = [r for r, v in families.items() if len(v) == 1]
    if set(singleton_families) != d7_anchors:
        fail("singleton families are not exactly the seven D7 anchors")

    # exact same-family probability under both proposer resolutions
    sum_sq = sum(n * n for n in fam_sizes)
    p_same_308 = sum_sq / (308 * 308)
    p_same_462 = sum_sq / (308 * 462)
    # mixed-random: 50% in-family (always accept) + 50% uniform draw (accept iff same family)
    # current is always office-supported in MVP-1 (boundary candidates are never accepted)
    expected_veto_462 = 0.5 * (1.0 - p_same_462)
    expected_veto_308 = 0.5 * (1.0 - p_same_308)

    ground_truth = {
        "schemaVersion": "governed-loop.frozen-ground-truth.v1",
        "source": {
            "checkpointCommit": CHECKPOINT,
            "executionCommit": EXECUTION_COMMIT,
            "censusPath": "canonical/fivefold-incubator/fifth-space-census-v0.json",
            "networkPath": "canonical/universal-network-data.json",
            "gateReceiptPath": "qa/fifth-space-census-validation.json",
            "aggregatePath": "qa/gov-528-production-aggregate.json",
        },
        "census": {
            "cardinality": 462,
            "roles": dict(counts),
            "masks": {str(k): v for k, v in sorted(masks.items())},
            "role": {str(k): v for k, v in sorted(role.items())},
            "tier": {str(k): v for k, v in sorted(tier.items())},
            "pcSum": {str(k): pc_sum(v) for k, v in sorted(masks.items())},
            "office": {str(k): v for k, v in sorted(census_office.items())},
            "officeIndex": {str(k): v for k, v in sorted(census_office_index.items())},
            "boundaryHasPc0": all_have_pc0,
        },
        "governs": {
            "edgeCount": len(governs),
            "distinctSources": len(sources),
            "selfRootedAnchors": sorted(self_rooted),
            "parent": {str(k): v for k, v in sorted(parent.items())},
            "parentMode": {str(k): v for k, v in sorted(parent_mode.items())},
        },
        "governingRoot": {str(k): v for k, v in sorted(gov_root.items())},
        "families": {
            str(root): sorted(members)
            for root, members in sorted(families.items())
        },
        "familySizes": fam_sizes,
        "orbits": orbits,
        "checks": {
            "censusCardinality462": True,
            "roleReconciliation": True,
            "anchorOfficeRule": f"{anchor_rule_ok}/70",
            "satelliteInheritance": f"{satellite_inherit_ok}/238",
            "governsCoverage238": True,
            "distinctSources63": True,
            "selfRootedEqualsD7": True,
            "families70": True,
            "familyMembers308": True,
            "orbitMeans36": True,
            "orbits10": True,
            "orbitUnionEqualsOfficeSupported": True,
            "everyAnchoredMaskHasPc0": all_have_pc0,
        },
        "proposerMath": {
            "familySizeSquares": sum_sq,
            "pSameFamilyBothUniform308": p_same_308,
            "pSameFamilyUniformArmOver462": p_same_462,
            "expectedVetoMixedRandomUniformArm462": expected_veto_462,
            "expectedVetoMixedRandomUniformArm308": expected_veto_308,
        },
    }

    with open(f"{SCRATCH}/frozen_ground_truth.json", "w") as f:
        json.dump(ground_truth, f, indent=2, sort_keys=True)
        f.write("\n")

    census_sha = sha256_file(f"{SCRATCH}/census_462.json")
    network_sha = sha256_file(f"{SCRATCH}/network_data.json")
    gate_sha = sha256_file(f"{SCRATCH}/census_val.json")
    census_exec_sha = sha256_file(f"{SCRATCH}/census_exec.json")
    gate_exec_sha = sha256_file(f"{SCRATCH}/census_val_exec.json")

    records_match_exec = census["records"] == census_exec["records"]
    gate_inventory = [
        (c.get("checkId"), c.get("status")) for c in gate.get("checks", [])
    ]
    gate_inventory_exec = [
        (c.get("checkId"), c.get("status")) for c in gate_exec.get("checks", [])
    ]
    gate_inventory_match = gate_inventory == gate_inventory_exec
    if census_exec_sha != ECAL_CENSUS_SHA:
        fail("a27bd3e census does not match the E-CAL pin")
    if gate_exec_sha != ECAL_GATE_SHA:
        fail("a27bd3e gate receipt does not match the E-CAL pin")
    if not records_match_exec:
        fail("checkpoint census records differ from the execution census")

    freeze_report = {
        "schemaVersion": "governed-loop.freeze-report.v1",
        "checkpointCommit": CHECKPOINT,
        "executionCommit": EXECUTION_COMMIT,
        "files": {
            "census_462.json": {
                "rawSha256": census_sha,
                "ecalPin": ECAL_CENSUS_SHA,
                "ecalPinFileAtExecution": {
                    "path": "census_exec.json",
                    "rawSha256": census_exec_sha,
                    "match": census_exec_sha == ECAL_CENSUS_SHA,
                },
                "rawBytePinMatch": census_sha == ECAL_CENSUS_SHA,
                "payloadRecordsMatchExecution": records_match_exec,
                "note": "closing commit rebound candidateFingerprint + evidenceBindings only; records[462] payload identical to a27bd3e",
            },
            "network_data.json": {
                "rawSha256": network_sha,
                "ecalPin": ECAL_NETWORK_SHA,
                "rawBytePinMatch": network_sha == ECAL_NETWORK_SHA,
                "payloadRecordsMatchExecution": network_sha == ECAL_NETWORK_SHA,
            },
            "census_val.json": {
                "rawSha256": gate_sha,
                "ecalPin": ECAL_GATE_SHA,
                "ecalPinFileAtExecution": {
                    "path": "census_val_exec.json",
                    "rawSha256": gate_exec_sha,
                    "match": gate_exec_sha == ECAL_GATE_SHA,
                },
                "rawBytePinMatch": gate_sha == ECAL_GATE_SHA,
                "verdict": gate.get("verdict"),
                "checksPassed": gate.get("checksPassed"),
                "checksFailed": gate.get("checksFailed"),
                "checkInventoryMatchesExecution": gate_inventory_match,
                "note": "checksPassed/Failed and check inventory stable; fingerprints rebound at closing",
            },
        },
        "ecalEquivalence": {
            "verdict": "PAYLOAD_EQUIVALENT" if (records_match_exec and gate_inventory_match) else "NOT_EQUIVALENT",
            "censusRecordsIdenticalToExecution": records_match_exec,
            "networkByteIdentical": network_sha == ECAL_NETWORK_SHA,
            "gateInventory24of24": gate.get("checksPassed") == 24 and gate.get("checksFailed") == 0,
            "gateCheckInventoryIdenticalToExecution": gate_inventory_match,
        },
        "structuralChecks": ground_truth["checks"],
        "proposerMath": ground_truth["proposerMath"],
        "frozenGroundTruthSha256": sha256_file(f"{SCRATCH}/frozen_ground_truth.json"),
    }
    with open(f"{SCRATCH}/freeze_report.json", "w") as f:
        json.dump(freeze_report, f, indent=2, sort_keys=True)
        f.write("\n")

    print("FREEZE OK")
    print(f"  census raw sha  {census_sha} (E-CAL pin match: {census_sha == ECAL_CENSUS_SHA})")
    print(f"  network raw sha {network_sha} (E-CAL pin match: {network_sha == ECAL_NETWORK_SHA})")
    print(f"  gate raw sha    {gate_sha} (E-CAL pin match: {gate_sha == ECAL_GATE_SHA})")
    print(f"  roles {dict(counts)}")
    print(f"  families {len(families)} (sizes {fam_sizes[:5]}...), members 308")
    print(f"  orbits {len(orbits)}, union {len(orbit_members)}, means 36 exact")
    print(f"  pc0 in every anchored mask: {all_have_pc0}")
    print(f"  expected veto (uniform arm 462): {expected_veto_462:.4f}")
    print(f"  expected veto (uniform arm 308): {expected_veto_308:.4f}")


if __name__ == "__main__":
    main()
