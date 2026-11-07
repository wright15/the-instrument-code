#!/usr/bin/env python3
"""MVP8-DIR-1 Task 0: fixed point, pins, anchors, S000 reachability, and the
predeclaration lock. Scratch-only; read-only against the repository."""
import json
import subprocess
import sys
from collections import deque
from pathlib import Path

sys.path.insert(0, "/home/erick/workspace/scratch-governed-loop-run/mvp8_pentatonic_q")
import mvp8_common as common

TASK0 = common.SCRATCH / "task-0"
PREDECL = TASK0 / "mvp8_predeclared_bets.json"
EAR_SCORECARD = TASK0 / "mvp8_ear_scorecard.json"
RECEIPT = TASK0 / "mvp8_task_0_receipt.json"

EXPECTED_HEAD = "d1b2286a5b6f3783af24094eb78e40ab511bb8e5"
DIRECTIVE_PATH = "scrum/plan/mvp8-dir-1-rev2.md"
EXPECTED_LEDGER = "da9c79410cf2f3429509ca07f4a82effe49932d061ca96a4d36d28a401668149"
EXPECTED_LEDGER_BYTES = 407293
EXPECTED_LEDGER_LINES = 4383
EXPECTED_MANIFEST = "6632ab6a3141e58519fe5846794eb9befd76d1cd3479f9d65934a2a30ce0bc27"
EXPECTED_MANIFEST_FILES = 1834
EXPECTED_MANIFEST_BYTES = 263181122
EXPECTED_CHECKSUMS = "8ee97d4ea46a3034ff4a34818f6df22d7438b5357d2aca66f6cdc54a918b4451"
EXPECTED_COMPLETION = "6b8cbf29d67f8d728f69bccdf84c4ead2689ff2c11a45bbe8f1b16a4a5dff20d"
EXPECTED_LANDING = "d0d7aaec2c5cee05f71074df36d3606b7194a99390f916f266809ad99feba0a6"
EXPECTED_ARCH = "865ab785164f85c0426d849cb3314c8c41efe81155ce14bd7fe6392ca5d0c381"
EXPECTED_ARCH_BYTES = 34880
EXPECTED_PENTATONIC = "903eebf0e1122d8ba81971abcd7efc8ac934d3bfd7885b98b49e58ab0bbe3e41"
EXPECTED_PENTATONIC_BYTES = 320972
EXPECTED_CLOSURE = "ea61c0f055d1cfb0caca657ebb05eb0638c0efc2be4336e3755bb07ed690457b"
EXPECTED_CLOSURE_BYTES = 4552

REACHABILITY_TARGETS = ["1387@0", "1453@0", "2477@0", "2741@0", "1717@0", "2773@0"]
B3_SAMPLE_MASKS = [1387, 1453, 2477, 2741, 1717, 2773, 2869, 2485, 1715, 2765, 1749, 671]


def git(*args):
    return subprocess.run(["git", "-C", str(common.REPO), *args],
                          capture_output=True, text=True, check=True).stdout


def path_in_governed(planner, allowed, source, target):
    if source == target:
        return [source]
    if source not in allowed or target not in allowed:
        return None
    previous = {source: None}
    queue = deque([source])
    while queue:
        node = queue.popleft()
        if node == target:
            path = [target]
            while path[-1] != source:
                path.append(previous[path[-1]])
            return list(reversed(path))
        for neighbor in planner.adj.get(node, ()):
            if neighbor in allowed and neighbor not in previous:
                previous[neighbor] = node
                queue.append(neighbor)
    return None


def select_c2_pairs(planner, governed):
    """Predeclared C2 benchmark selection.

    Prefer direct (1-hop) and 2-hop governed crossings whose endpoints, and
    whose intermediate node on a 2-hop path, share an anchored pentatonic
    subnode (strict focal continuity is then possible). Require distinct
    governing roots across the set and at most one pair per governing root.
    """
    bipartite = json.loads(common.REPO_INPUTS["bipartite"].read_text(encoding="utf-8"))
    mask_to_subnodes = {
        record["pitchMask"]: set(record["subnodes"])
        for record in bipartite["heptatonicNodes"].values()
    }
    allowed = set(governed)
    roots = {node: planner.gov_root.get(int(node.split("@")[0])) for node in governed}
    reverse = planner.reverse_adjacency()

    direct = []
    seen = set()
    for left in governed:
        left_mask = int(left.split("@")[0])
        left_subs = mask_to_subnodes[left_mask]
        for right in planner.adj.get(left, ()):
            if right not in allowed or right == left or (left, right) in seen:
                continue
            if roots[left] == roots[right]:
                continue
            right_mask = int(right.split("@")[0])
            shared = left_subs & mask_to_subnodes[right_mask]
            if not shared:
                continue
            seen.add((left, right))
            direct.append({
                "source": left, "target": right,
                "sourceGovRoot": roots[left], "targetGovRoot": roots[right],
                "shortestGovernedHops": 1,
                "shortestGovernedPath": [left, right],
                "strictFocalSubnodes": sorted(shared),
            })

    two_hop = []
    for middle in governed:
        middle_mask = int(middle.split("@")[0])
        middle_subs = mask_to_subnodes[middle_mask]
        incoming = [node for node in reverse.get(middle, ()) if node in allowed]
        outgoing = [node for node in planner.adj.get(middle, ()) if node in allowed]
        for left in incoming:
            left_mask = int(left.split("@")[0])
            left_subs = mask_to_subnodes[left_mask]
            for right in outgoing:
                if left == right or (left, right) in seen:
                    continue
                if roots[left] == roots[right]:
                    continue
                if right in planner.adj.get(left, ()):
                    continue
                right_mask = int(right.split("@")[0])
                common_subs = left_subs & middle_subs & mask_to_subnodes[right_mask]
                if not common_subs:
                    continue
                seen.add((left, right))
                two_hop.append({
                    "source": left, "target": right,
                    "sourceGovRoot": roots[left], "targetGovRoot": roots[right],
                    "shortestGovernedHops": 2,
                    "shortestGovernedPath": [left, middle, right],
                    "strictFocalSubnodes": sorted(common_subs),
                })
    direct.sort(key=lambda row: (row["source"], row["target"]))
    two_hop.sort(key=lambda row: (row["source"], row["target"], row["shortestGovernedPath"][1]))

    selected = []
    used_roots = set()
    for pool in (direct, two_hop):
        for row in pool:
            if row["sourceGovRoot"] in used_roots or row["targetGovRoot"] in used_roots:
                continue
            selected.append(row)
            used_roots.add(row["sourceGovRoot"])
            used_roots.add(row["targetGovRoot"])
            if len(selected) == 10:
                return selected
    for row in direct + two_hop:
        if row in selected:
            continue
        selected.append(row)
        if len(selected) == 10:
            return selected
    return selected


def build_predeclaration(pairs):
    return {
        "schemaVersion": "governed-loop.mvp8-predeclared-bets.v1",
        "directive": "MVP8-DIR-1",
        "revision": 2,
        "status": "locked-before-evaluation",
        "openingHead": EXPECTED_HEAD,
        "layer": common.GUARD["layer"],
        "guards": common.GUARD,
        "q1": {
            "numbering": "MVP8-DIR-1",
            "meterLaw": "deferred to MVP-9; untouched",
        },
        "q2": {
            "transitDefault": "borrowed_connector",
            "dwellZero535": "native_class",
            "contrastArm": "naked_fifth_stack",
            "borrowedRule": "keep the preceding focal set when it is a subset of the current container; else choose a shared bridge subnode between the preceding and current containers",
        },
        "q3": {
            "tiers": ["phase_root_alignment", "traversal_head_containment", "canonical_index"],
            "phaseRootRule": "prefer a 5-35 anchored subnode (or a native-class subnode on a zero-5-35 dwell) whose base canonical root is 0, equivalently whose transposed root equals the active phase",
            "nativeClassPriority": ["5-27", "5-23", "5-25", "5-29", "5-20", "5-Z12", "5-24", "5-34"],
            "canonicalIndex": "lexicographically smallest base subnode id",
        },
        "q4": {
            "primaryLaw": "structural_window_snap",
            "governedPositions": [0, 1, 2, 3, 4],
            "tailPositions": [5, 6, 7, 8, 9, 10, 11],
            "initiationGoverned": True,
            "tailModalColorAllowed": True,
            "diagnosticArms": ["snap_all", "hold_on_unsafe"],
        },
        "connectorWeights": {
            "w_hop": 10,
            "w_focal": 15,
            "w_bridge": 30,
            "tieBreak": "(total_cost, hop_count, lex(path))",
        },
        "b3SampleMasks": B3_SAMPLE_MASKS,
        "bets": {
            "A1_anchoredRows": {"expected": 6930, "formula": "462*15"},
            "A1_totalSubsetRows": {"expected": 9702, "formula": "462*21"},
            "A2_bridgeCensus": {
                "expectedTotal": 70,
                "expectedByClass": {"5-Z12": 5, "5-20": 10, "5-23": 10, "5-24": 10,
                                    "5-25": 10, "5-27": 10, "5-29": 10, "5-34": 5},
            },
            "A3_5_35Unrooted": {"distribution": {"0": 357, "1": 70, "2": 28, "3": 7}},
            "A3_5_35Rooted": {"distribution": {"0": 381, "1": 60, "2": 18, "3": 3}},
            "B1_maskFidelity": {
                "liftedNodes": 5544,
                "qStates": 16,
                "zSteps": 12,
                "evaluations": 1064448,
                "outOfMaskThreshold": 0,
                "stillSetEvaluations": 243936,
                "stillSetLeakThreshold": 0,
            },
            "B2_focalUplift": {
                "node": "2741@0",
                "focalSubnode": "5-35:0",
                "focalPitchClasses": [0, 2, 4, 7, 9],
                "baselineFullTable": {"numerator": 144, "denominator": 192, "rate": 0.75},
                "governedInitiationTable": {"thresholdNumerator": 160, "denominator": 192,
                                            "thresholdRate": 0.833333},
                "structuralWindow": {"thresholdNumerator": 80, "denominator": 80},
                "tailModalColorMinPerCycle": 2,
                "protocol": "baseline = ungoverned 16 q states x 12 z steps; governed initiation table = phrase-initiation rule applied to every (q,z) cell; structural window = 16 starting states x 5 sub positions; tail modal color counted on a 12-step traversal micro-bar",
            },
            "B3_equivariance": {
                "sampleMasks": B3_SAMPLE_MASKS,
                "phases": 12,
                "liftedNodes": 144,
                "passRule": "focal(M,p) == T_p(focal(M,0)) and emitted(q,z,M,p) == (emitted(q,z,M,0)+p) mod 12 for all q,z",
            },
            "B4_law3": {
                "farShoreRule": "r_lead_deconfounded > r_container_deconfounded",
                "cadenceRule": "report r_lead and r_container against the L27 baseline; diagnostic only",
                "lens": "mvp7_log_spectral_lens",
            },
            "C1_crossing": {
                "source": "1453@0",
                "target": "2477@0",
                "expectedHops": 1,
                "sharedSubnodes": ["5-20:0B", "5-23:0", "5-25:0", "5-27:0", "5-29:0B"],
                "passRule": "gate ACCEPT, all 5 shared subnodes valid in both containers, 0 focal switches, 0 out-of-mask emissions",
            },
            "C2_overhead": {
                "pairs": pairs,
                "distinctGovRoots": len({row["sourceGovRoot"] for row in pairs}
                                       | {row["targetGovRoot"] for row in pairs}),
                "maxHopOverhead": 2,
                "passRule": "overhead <= 2 on all predeclared pairs",
            },
            "C3a_dwellPillars": {
                "waypoints": ["2741@0", "1717@0", "2773@0"],
                "focalSubnode": "5-35:0",
                "focalPitchClasses": [0, 2, 4, 7, 9],
                "passRule": "0 dwell focal switches across the three dwell pillars",
            },
            "C3b_satelliteTransit": {
                "legs": [
                    {"path": ["2741@0", "2485@0", "1717@0"], "bridgeSubnode": "5-23:0B"},
                    {"path": ["1717@0", "2485@0", "2773@0"],
                     "incomingBridge": "5-23:0B", "outgoingBridge": "5-27:11B",
                     "allowedSwitches": 1},
                    {"path": ["2773@0", "2485@0", "2741@0"], "bridgeSubnode": "5-27:11B"},
                ],
                "corePitchClasses": [0, 2, 4, 7],
                "passRule": "core subset of every bar container; <=1 bridge switch per 2-hop leg; hop overhead 0 against the unconstrained shortest path",
            },
        },
        "taskD": {
            "arms": ["borrowed_connector", "native_class_dwell", "naked_fifth_stack"],
            "probe": "1453@0 x2, 2477@0 x4, 1453@0 x2 dwell-and-return, plus a pure 2477@0 multi-bar probe",
            "metrics": ["focalHitRate", "structuralFocalHitRate", "snaps", "holds",
                        "modalColorPasses", "pc8Count", "pc11Count", "rubCensus",
                        "logSpectralCentroid", "logSpectralSpread", "seamMetric",
                        "endCheck", "determinism"],
            "earGate": "PENDING_HUMAN",
        },
        "outcomes": {
            "ADOPT_RUNTIME_READING": "A1-A3 and B1-B4 and C1-C2 and C3a-C3b pass; ear remains PENDING_HUMAN",
            "KEEP_EVIDENCE_ONLY": "B1 or B3 fails",
            "DEFER": "B1 and B3 pass, but any of B2, B4, C1, C2, C3a, C3b fails",
        },
        "fences": {
            "repoReadOnly": True,
            "llmCalls": 0,
            "noGateByteChange": True,
            "noQSubstrateByteChange": True,
            "noRendererByteChange": True,
            "noEntropy": True,
            "noCHFormulation": True,
            "bipartitePlanningEvidenceOnly": True,
        },
        "preExecutionCorrections": [
            {
                "at": "before any Task A-D execution",
                "field": "bets.C2_overhead.pairs selection rule",
                "from": "lexicographically first 10 governed-S000 pairs with distinct governing roots",
                "to": "direct (1-hop) and 2-hop governed crossings with a strict focal-continuity subnode; prefer 20 distinct governing roots; deterministic lexicographic fallback when fewer diverse shared-subnode crossings exist",
                "reason": "the first rule selected ten phase-variants of a single family pair, which is not a cross-family benchmark; the revised rule records the available diversity explicitly; thresholds unchanged",
                "thresholdsChanged": False,
            }
        ],
    }


def main():
    TASK0.mkdir(parents=True, exist_ok=True)
    head = git("rev-parse", "HEAD").strip()
    porcelain = git("status", "--porcelain")
    porcelain_lines = [line for line in porcelain.splitlines() if line.strip()]
    allowed_untracked = {f"?? {DIRECTIVE_PATH}"}
    unexpected = [line for line in porcelain_lines if line not in allowed_untracked]
    if head != EXPECTED_HEAD:
        common.stop("S-1", f"HEAD {head}")
    if unexpected:
        common.stop("S-1", f"tree not clean: {unexpected}")
    working_tree_exception = {
        "declared": True,
        "untracked": sorted(line[3:] for line in porcelain_lines),
        "reason": "the directive document was written before execution at the Planning Seat's request; no pinned byte, HEAD, ledger, manifest, checksum, or validation artifact changed",
        "pinnedBytesUnchanged": True,
    }
    ledger = common.REPO / "provenance/DECISION_LEDGER.md"
    if common.sha256_file(ledger) != EXPECTED_LEDGER:
        common.stop("S-1", "ledger hash")
    if ledger.stat().st_size != EXPECTED_LEDGER_BYTES:
        common.stop("S-1", "ledger bytes")
    ledger_lines = len(ledger.read_text(encoding="utf-8").splitlines())
    if ledger_lines != EXPECTED_LEDGER_LINES:
        common.stop("S-1", "ledger lines")
    manifest = json.loads((common.REPO / "MANIFEST.json").read_text(encoding="utf-8"))
    if (common.sha256_file(common.REPO / "MANIFEST.json") != EXPECTED_MANIFEST
            or manifest["fileCount"] != EXPECTED_MANIFEST_FILES
            or manifest["totalBytes"] != EXPECTED_MANIFEST_BYTES):
        common.stop("S-1", "manifest")
    if common.sha256_file(common.REPO / "CHECKSUMS.sha256") != EXPECTED_CHECKSUMS:
        common.stop("S-1", "checksums")
    completion = json.loads((common.REPO / "qa/completion-validation-report.json").read_text(encoding="utf-8"))
    if (common.sha256_file(common.REPO / "qa/completion-validation-report.json") != EXPECTED_COMPLETION
            or not completion.get("passed")):
        common.stop("S-1", "completion report")
    if common.sha256_file(common.REPO / "qa/mvp7_intention_landing_receipt.json") != EXPECTED_LANDING:
        common.stop("S-1", "landing receipt")
    arch = common.REPO / "docs/ARCHITECTURE_MAP.md"
    if common.sha256_file(arch) != EXPECTED_ARCH or arch.stat().st_size != EXPECTED_ARCH_BYTES:
        common.stop("S-1", "architecture map")
    if (common.sha256_file(common.REPO_INPUTS["bipartite"]) != EXPECTED_PENTATONIC
            or common.REPO_INPUTS["bipartite"].stat().st_size != EXPECTED_PENTATONIC_BYTES):
        common.stop("S-1", "bipartite pin")
    if (common.sha256_file(common.REPO / "qa/pentatonic-binding-audit-closure.json") != EXPECTED_CLOSURE
            or (common.REPO / "qa/pentatonic-binding-audit-closure.json").stat().st_size != EXPECTED_CLOSURE_BYTES):
        common.stop("S-1", "closure pin")

    mvp7_task0 = common.load_module("mvp8_mvp7_task0", common.REPO_INPUTS["mvp7_task_0"])
    pins = dict(mvp7_task0.PINS)
    pins["derived/hypergraph/bipartite-inclusion-v1.json"] = (EXPECTED_PENTATONIC, EXPECTED_PENTATONIC_BYTES)
    pins["qa/pentatonic-binding-audit-closure.json"] = (EXPECTED_CLOSURE, EXPECTED_CLOSURE_BYTES)
    pin_results = {}
    for rel, (expected_hash, expected_bytes) in pins.items():
        path = common.REPO / rel
        actual_hash = common.sha256_file(path)
        actual_bytes = path.stat().st_size
        match = actual_hash == expected_hash and actual_bytes == expected_bytes
        pin_results[rel] = {
            "expectedSha256": expected_hash, "actualSha256": actual_hash,
            "expectedBytes": expected_bytes, "actualBytes": actual_bytes,
            "match": match,
        }
        if not match:
            common.stop("S-2", f"pin {rel}")

    lines = (common.REPO / "tools/governed-loop/mvp2.py").read_text(encoding="utf-8").splitlines()
    anchor_results = {}
    for line_no, text in mvp7_task0.ANCHORS.items():
        actual = lines[line_no - 1]
        anchor_results[str(line_no)] = {"expected": text, "actual": actual, "match": actual == text}
        if actual != text:
            common.stop("S-3", f"anchor {line_no}")

    planner = common.build_planner()
    core = common.strong_core(planner)
    if (core["reachableNodes"], core["strongCoreNodes"], core["oneWayNodes"],
            core["governedStrongCoreNodes"], core["boundaryStrongCoreNodes"]) != (3204, 2928, 276, 2388, 540):
        common.stop("S-4", f"strong core {core}")
    reachability = {}
    for node in REACHABILITY_TARGETS:
        mask, phase = common.parse_node(node)
        reachability[node] = {
            "inStrongCore": node in core["strongCore"],
            "inGovernedS000": node in set(core["governed"]),
            "role": planner.role.get(mask),
            "office": planner.office.get(mask),
            "govRoot": planner.gov_root.get(mask),
            "outDistance": core["outDist"].get(node),
            "inDistance": core["inDist"].get(node),
            "pitchClasses": common.pitch_classes(mask, phase),
        }
        if not reachability[node]["inGovernedS000"]:
            common.stop("S-4", f"target outside governed S000: {node}")
    substitutions = sum(1 for row in reachability.values() if not row["inGovernedS000"])

    pairs = select_c2_pairs(planner, core["governed"])
    if len(pairs) != 10:
        common.stop("S-4", f"C2 pair selection produced {len(pairs)} pairs")

    predecl = build_predeclaration(pairs)
    PREDECL.write_text(json.dumps(predecl, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    predecl_hash = common.sha256_file(PREDECL)

    ear = {
        "schemaVersion": "governed-loop.mvp8-ear-scorecard.v1",
        "status": "PENDING_HUMAN",
        "signedBy": None,
        "signedAt": None,
        "listener": "Erick (primary)",
        "listener2": None,
        "questions": {f"Q{i}": {"heard": None, "rating": None, "notes": None} for i in range(1, 10)},
        "q9Question": "Which zero-5-35 arm (borrowed / native / naked) best realizes the node's harmonic space?",
        "overallVerdict": None,
        "rule": "The agent must not author or infer listener verdicts. This file stays unsigned until Erick fills it.",
    }
    EAR_SCORECARD.write_text(json.dumps(ear, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    receipt = {
        "schemaVersion": "governed-loop.mvp8-task-0.v1",
        "directive": "MVP8-DIR-1",
        "task": "MVP8-T0",
        "status": "COMPLETE",
        "guardFlags": common.GUARD,
        "opening": {
            "head": head,
            "treeClean": not porcelain_lines,
            "workingTreeException": working_tree_exception,
            "ledgerSha256": EXPECTED_LEDGER,
            "ledgerBytes": ledger.stat().st_size,
            "ledgerLines": ledger_lines,
            "manifestSha256": EXPECTED_MANIFEST,
            "manifestFiles": manifest["fileCount"],
            "manifestBytes": manifest["totalBytes"],
            "checksumsSha256": EXPECTED_CHECKSUMS,
            "completionReportSha256": EXPECTED_COMPLETION,
            "completionPassed": True,
            "landingReceiptSha256": EXPECTED_LANDING,
        },
        "pins": pin_results,
        "pinsVerified": sum(1 for row in pin_results.values() if row["match"]),
        "pinsTotal": len(pin_results),
        "anchors": anchor_results,
        "anchorsVerified": sum(1 for row in anchor_results.values() if row["match"]),
        "strongCore": {
            "reachableNodes": core["reachableNodes"],
            "strongCoreNodes": core["strongCoreNodes"],
            "oneWayNodes": core["oneWayNodes"],
            "governedStrongCoreNodes": core["governedStrongCoreNodes"],
            "boundaryStrongCoreNodes": core["boundaryStrongCoreNodes"],
        },
        "reachability": reachability,
        "substitutionsRequired": substitutions,
        "c2Pairs": pairs,
        "predeclaration": {
            "path": "task-0/mvp8_predeclared_bets.json",
            "sha256": predecl_hash,
            "status": "locked-before-evaluation",
        },
        "earGate": {
            "status": "PENDING_HUMAN",
            "scorecard": "task-0/mvp8_ear_scorecard.json",
            "scorecardSha256": common.sha256_file(EAR_SCORECARD),
            "signed": False,
        },
        "llmCalls": 0,
        "stopRules": [],
    }
    receipt["floatValues"] = len(common.find_floats(receipt))
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "COMPLETE",
        "pinsVerified": receipt["pinsVerified"],
        "pinsTotal": receipt["pinsTotal"],
        "anchorsVerified": receipt["anchorsVerified"],
        "strongCore": receipt["strongCore"],
        "substitutionsRequired": substitutions,
        "predeclarationSha256": predecl_hash,
        "c2Pairs": len(pairs),
        "earGate": "PENDING_HUMAN",
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
