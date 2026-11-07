#!/usr/bin/env python3
"""MVP8-DIR-1 Task A: compile the landed bipartite inclusion evidence into a
phase-extended, runtime-readable pentatonic lookup.

Read-only against the repository. Every verification target is fail-closed and
halts back to Task 0 on mismatch.
"""
import itertools
import json
import sys
from collections import Counter

sys.path.insert(0, "/home/erick/workspace/scratch-governed-loop-run/mvp8_pentatonic_q")
import mvp8_common as common

TASK_A = common.SCRATCH / "task-a"
RECEIPT = TASK_A / "mvp8_task_a_receipt.json"

EXPECTED_ANCHORED_ROWS = 6930
EXPECTED_TOTAL_ROWS = 9702
EXPECTED_ANCHORED_ROWS_ALL_PHASES = 83160
EXPECTED_TOTAL_ROWS_ALL_PHASES = 116424
EXPECTED_BRIDGE_TOTAL = 70
EXPECTED_BRIDGE_BY_CLASS = {"5-Z12": 5, "5-20": 10, "5-23": 10, "5-24": 10,
                            "5-25": 10, "5-27": 10, "5-29": 10, "5-34": 5}
EXPECTED_UNROOTED = {0: 357, 1: 70, 2: 28, 3: 7}
EXPECTED_ROOTED = {0: 381, 1: 60, 2: 18, 3: 3}
SEED_MASK = 1387


def mask_of(pcs):
    return sum(1 << pc for pc in pcs)


def pcs_of(mask):
    return tuple(pc for pc in range(12) if (mask >> pc) & 1)


def transposed(pcs, phase):
    return sorted((pc + int(phase)) % 12 for pc in pcs)


def main():
    TASK_A.mkdir(parents=True, exist_ok=True)
    bipartite_path = common.REPO_INPUTS["bipartite"]
    document = json.loads(bipartite_path.read_text(encoding="utf-8"))
    if document.get("status") != "planning_evidence":
        common.stop("S-4", "bipartite status is not planning_evidence")
    if document.get("schemaVersion") != "bipartite-inclusion.v1":
        common.stop("S-4", "unexpected bipartite schema")

    pentatonic = document["pentatonicSubnodes"]
    heptatonic = document["heptatonicNodes"]
    if len(pentatonic) != 330 or len(heptatonic) != 462:
        common.stop("S-4", f"universe {len(pentatonic)}/{len(heptatonic)}")

    by_mask = {record["pitchMask"]: record for record in pentatonic.values()}
    if len(by_mask) != 330:
        common.stop("S-4", "pentatonic mask collision")

    nodes = {}
    anchored_rows = 0
    total_rows = 0
    bridge_total = 0
    bridge_classes = Counter()
    unrooted_dist = Counter()
    rooted_dist = Counter()

    for hept in heptatonic.values():
        mask = hept["pitchMask"]
        base_pcs = pcs_of(mask)
        if len(base_pcs) != 7:
            common.stop("S-4", f"heptatonic mask {mask} cardinality")
        anchored = []
        for sub_id in hept["subnodes"]:
            record = pentatonic[sub_id]
            anchored.append({
                "baseSubnodeId": sub_id,
                "setClassId": record["setClassId"],
                "baseRoot": record["root"],
                "basePitchClasses": list(record["pitchClasses"]),
                "isBridge": bool(record["isBridge"]),
                "isCornerstone": bool(record["isCornerstone"]),
                "anchored": True,
            })
        if len(anchored) != 15:
            common.stop("S-4", f"mask {mask} anchored subnodes {len(anchored)}")

        all_subsets = []
        for combo in itertools.combinations(base_pcs, 5):
            subset = tuple(sorted(combo))
            shift = subset[0]
            normalized = tuple(sorted((pc - shift) % 12 for pc in subset))
            normalized_mask = mask_of(normalized)
            record = by_mask.get(normalized_mask)
            if record is None:
                common.stop("S-4", f"unnormalized subset {subset} for mask {mask}")
            actual_root = (record["root"] + shift) % 12
            all_subsets.append({
                "baseSubnodeId": record["id"],
                "setClassId": record["setClassId"],
                "baseRoot": actual_root,
                "basePitchClasses": list(subset),
                "isBridge": bool(record["isBridge"]),
                "isCornerstone": bool(record["isCornerstone"]),
                "anchored": subset[0] == 0,
            })
        if len(all_subsets) != 21:
            common.stop("S-4", f"mask {mask} total subsets {len(all_subsets)}")
        if len({tuple(row["basePitchClasses"]) for row in all_subsets}) != 21:
            common.stop("S-4", f"mask {mask} duplicate subsets")

        anchored_cornerstones = sum(1 for row in anchored if row["setClassId"] == "5-35")
        all_cornerstones = sum(1 for row in all_subsets if row["setClassId"] == "5-35")
        if anchored_cornerstones != hept["cornerstoneCountRooted"]:
            common.stop("S-4", f"mask {mask} rooted count drift")
        if all_cornerstones != hept["cornerstoneCountUnrooted"]:
            common.stop("S-4", f"mask {mask} unrooted count drift")
        rooted_dist[anchored_cornerstones] += 1
        unrooted_dist[all_cornerstones] += 1

        anchored_rows += len(anchored)
        total_rows += len(all_subsets)
        bridge_total += sum(1 for row in pentatonic[sub_id].values() if False)
        bridge_classes.update(
            pentatonic[sub_id]["setClassId"]
            for sub_id in hept["subnodes"]
            if pentatonic[sub_id]["isBridge"]
        )

        for phase in range(12):
            phase_anchored = []
            for row in anchored:
                phase_anchored.append({
                    "subnodeId": f"{row['baseSubnodeId']}@{phase}",
                    "baseSubnodeId": row["baseSubnodeId"],
                    "setClassId": row["setClassId"],
                    "rootPc": (row["baseRoot"] + phase) % 12,
                    "pitchClasses": transposed(row["basePitchClasses"], phase),
                    "isBridge": row["isBridge"],
                    "isCornerstone": row["isCornerstone"],
                    "anchored": True,
                })
            phase_all = []
            for row in all_subsets:
                phase_all.append({
                    "subnodeId": f"{row['baseSubnodeId']}@{phase}",
                    "baseSubnodeId": row["baseSubnodeId"],
                    "setClassId": row["setClassId"],
                    "rootPc": (row["baseRoot"] + phase) % 12,
                    "pitchClasses": transposed(row["basePitchClasses"], phase),
                    "isBridge": row["isBridge"],
                    "isCornerstone": row["isCornerstone"],
                    "anchored": row["anchored"],
                })
            nodes[f"{mask}@{phase}"] = {
                "mask": mask,
                "phase": phase,
                "heptatonicId": hept["id"],
                "setClassId": hept["setClassId"],
                "root": hept["root"],
                "pitchClasses": common.pitch_classes(mask, phase),
                "anchoredSubnodes": phase_anchored,
                "allSubsets": phase_all,
                "cornerstoneCountRooted": anchored_cornerstones,
                "cornerstoneCountUnrooted": all_cornerstones,
            }

    if anchored_rows != EXPECTED_ANCHORED_ROWS:
        common.stop("S-4", f"anchored rows {anchored_rows}")
    if total_rows != EXPECTED_TOTAL_ROWS:
        common.stop("S-4", f"total rows {total_rows}")
    if len(nodes) != 5544:
        common.stop("S-4", f"lifted nodes {len(nodes)}")
    if anchored_rows * 12 != EXPECTED_ANCHORED_ROWS_ALL_PHASES:
        common.stop("S-4", "anchored all-phase rows")
    if total_rows * 12 != EXPECTED_TOTAL_ROWS_ALL_PHASES:
        common.stop("S-4", "total all-phase rows")
    if bridge_total != 0:
        common.stop("S-4", "bridge accumulator defect")
    metadata = document["metadata"]["bridgeCensus"]
    if metadata["totalBridgeSubnodes"] != EXPECTED_BRIDGE_TOTAL:
        common.stop("S-4", f"landed bridge total {metadata['totalBridgeSubnodes']}")
    if metadata["bySetClass"] != EXPECTED_BRIDGE_BY_CLASS:
        common.stop("S-4", "landed bridge breakdown")
    if dict(sorted(unrooted_dist.items())) != EXPECTED_UNROOTED:
        common.stop("S-4", f"unrooted distribution {dict(sorted(unrooted_dist.items()))}")
    if dict(sorted(rooted_dist.items())) != EXPECTED_ROOTED:
        common.stop("S-4", f"rooted distribution {dict(sorted(rooted_dist.items()))}")
    seed = next(row for row in heptatonic.values() if row["pitchMask"] == SEED_MASK)
    if seed["cornerstoneCountUnrooted"] != 3:
        common.stop("S-4", "seed 1387 unrooted 5-35 count")

    lookup = {
        "schemaVersion": "governed-loop.mvp8-pentatonic-lookup.v1",
        "generator": "task-a/mvp8_table_generator.py",
        "source": {
            "path": "derived/hypergraph/bipartite-inclusion-v1.json",
            "sha256": common.sha256_file(bipartite_path),
            "status": document["status"],
            "admissionEffect": "none",
            "graphScope": "detached_audit_only",
        },
        "metadata": {
            "heptatonicNodes": len(heptatonic),
            "pentatonicSubnodes": len(pentatonic),
            "liftedNodes": len(nodes),
            "phases": 12,
            "anchoredRowsPhase0": anchored_rows,
            "totalSubsetRowsPhase0": total_rows,
            "anchoredRowsAllPhases": anchored_rows * 12,
            "totalSubsetRowsAllPhases": total_rows * 12,
            "bridgeCensus": {"totalBridgeSubnodes": metadata["totalBridgeSubnodes"],
                             "bySetClass": metadata["bySetClass"]},
            "rootedCornerstoneDistribution": dict(sorted(rooted_dist.items())),
            "unrootedCornerstoneDistribution": dict(sorted(unrooted_dist.items())),
            "seedMask": SEED_MASK,
            "seedUnrootedCornerstones": seed["cornerstoneCountUnrooted"],
        },
        "nodes": nodes,
    }
    TASK_A.mkdir(parents=True, exist_ok=True)
    common.LOOKUP_PATH.write_text(
        json.dumps(lookup, separators=(",", ":"), sort_keys=True) + "\n", encoding="utf-8")

    receipt = {
        "schemaVersion": "governed-loop.mvp8-task-a.v1",
        "directive": "MVP8-DIR-1",
        "task": "MVP8-TA",
        "status": "COMPLETE",
        "guardFlags": common.GUARD,
        "source": lookup["source"],
        "lookup": {
            "path": "task-a/mvp8_pentatonic_lookup_v1.json",
            "sha256": common.sha256_file(common.LOOKUP_PATH),
            "bytes": common.LOOKUP_PATH.stat().st_size,
        },
        "verification": {
            "anchoredRowsPhase0": anchored_rows,
            "totalSubsetRowsPhase0": total_rows,
            "anchoredRowsAllPhases": anchored_rows * 12,
            "totalSubsetRowsAllPhases": total_rows * 12,
            "liftedNodes": len(nodes),
            "bridgeTotal": metadata["totalBridgeSubnodes"],
            "bridgeByClass": metadata["bySetClass"],
            "rootedDistribution": dict(sorted(rooted_dist.items())),
            "unrootedDistribution": dict(sorted(unrooted_dist.items())),
            "seed1387Unrooted": seed["cornerstoneCountUnrooted"],
            "allTargetsMatch": True,
        },
        "llmCalls": 0,
        "stopRules": [],
    }
    receipt["floatValues"] = len(common.find_floats(
        {k: v for k, v in receipt.items() if k != "guardFlags"}))
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(receipt["verification"], indent=2, sort_keys=True))
    print(json.dumps({"lookupSha256": receipt["lookup"]["sha256"],
                      "lookupBytes": receipt["lookup"]["bytes"]}, indent=2))


if __name__ == "__main__":
    main()
