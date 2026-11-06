#!/usr/bin/env python3
"""MVP6.1-DIR-1 Task 0: L23 control fixed-point verification, loop evidence,
strong-core audit, and the de-loop predeclaration lock.

The opening is the L23 working-tree landing (uncommitted) on HEAD 154db01.
All symbolic output is int / str / bool only.
"""
import hashlib
import json
import os
import subprocess
import sys
from collections import deque
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp6_1")
TASK0 = SCRATCH / "task-0"
RECEIPT = TASK0 / "mvp6_1_task_0_receipt.json"
PREDECL = TASK0 / "mvp6_1_predeclared_deloop.json"
CONTROL_TRACE = REPO / "tools/governed-loop/mvp6/task-c/traces/piece_a_far_shore.jsonl"

INPUT_REALM = REPO / "tools" / "governed-loop"
os.environ["GOVERNED_LOOP_SCRATCH"] = str(INPUT_REALM)
os.environ["GOVERNED_LOOP_REPO"] = str(REPO)

EXPECTED_HEAD = "154db019711570ade5558a78eb5abb0b63b3c884"
EXPECTED_LEDGER = "f174d9474db01e7ace6a49d9c3eb10ef63155f9d364c59275713e5e94aa7e7e5"
EXPECTED_LEDGER_BYTES = 372516
EXPECTED_LEDGER_LINES = 4249
EXPECTED_MANIFEST = "438a4cdfd084f01dc01676762a73d67a58aa187feb33819e7086bb0b75b4765d"
EXPECTED_MANIFEST_FILES = 1621
EXPECTED_MANIFEST_BYTES = 122194085
EXPECTED_CHECKSUMS = "9d76a4096fe89540b8480abc84f4dc63d147e0dd1b57a26b4905cd07fc21b02e"
EXPECTED_VALIDATION = "8d0dddd8a586bdb6678b0dc79485d30d9b2c36adeecd1e7b318d727ec98cc1f0"
EXPECTED_LANDING_RECEIPT = "4692c3f8497da98a64faa1e4f97faaf0174e91c645ab6ff50626fb479f536420"

PINS = {
    "tools/governed-loop/mvp2.py": ("79c0cf706fffc23745cab6e87ffbc46d34d70ad94a93291135725e388dc17328", 38997),
    "tools/governed-loop/census_462.json": ("242bce7423bc2eb0ae61ee431c27901d6a87401b8b3ffd6725a04d0e1ed0685a", 194194),
    "tools/governed-loop/frozen_ground_truth.json": ("007b0ffe65015bd2c5f1a6fe0df8969961ce8cfb3d499677b143d971e1fc5744", 91360),
    "tools/governed-loop/frozen_seam_substrate.json": ("8a5e82ac5f3b596720db2b62f2ba82484bab5250d168035e4c84cf9870c90bac", 42668),
    "tools/governed-loop/frozen_seam_substrate_v3.json": ("9f9818effa5d11e4ef2634122c9f484faf6790323cabae130561c1c75e8a295f", 47207),
    "tools/governed-loop/seam_legal_moves_v3.json": ("e6cf62a8eefa0924da9286f2e664c1914d9d620ed2d299929f684fd48225c274", 551287),
    "tools/governed-loop/plv3_sweep_predeclared.json": ("14117c9460a6b611f849747f4881f296a8f3ce2108bb23524fe8beecd354e87b", 1712),
    "tools/governed-loop/plv3_sweep.json": ("6a943e44c9ed2dc0dc39810c9656872ee55d5ea86bcd4a1e80eb7de505ad8243", 10181),
    "tools/governed-loop/plv3_sweep.py": ("22e6b1e5998c92f445fe3a631b2842231b2d5fdbea56ca760436f3a022ac5c15", 9318),
    "tools/governed-loop/mvp4/task-a/mvp4_dynamic_chaldean_card.json": ("6486599187687edb1e28481b2bbc79d9a11a06001e4a237505c5e44c1c1a1469", 1999),
    "tools/governed-loop/mvp4/task-b/mvp4_symbolic_planner.py": ("9ff511f14282cbe6ee48010d67092c70c25da0bf5fa6dbd1e50382afeb85f5c0", 21348),
    "tools/governed-loop/mvp4/task-b/mvp4_graph_census.json": ("165fb6b33a1ced983b45189738541bba3e206d5655a729c8deeff5cd72627d12", 580743),
    "tools/governed-loop/mvp4/task-c/mvp4_q_intra_node.py": ("8b39ffe4be4d1f801cf1065cd8928c681002249de8ebad1d5246f277e94f815f", 4721),
    "tools/governed-loop/mvp5/task-a/mvp5_coupled_engine.py": ("c07940ccc90a73e220102000905d5af8da13ee03604224e49c71ff4c4718dd0c", 20663),
    "tools/governed-loop/mvp5/task-b/mvp5_audio_renderer.py": ("0c917aab7a95851e90ce1c3244ea6b3af1ea35e362262cb0d7a0095ec40b9984", 24696),
    "tools/governed-loop/mvp5/task-d/EAR_VALIDATION_PROTOCOL.md": ("f4cd7055f64bfbf9160c0a855d355cea09efee1d06b0f40175edb172fbc9d4db", 8246),
    "docs/analysis/orbit_spectral_catalog.json": ("6f782a5f9d89057273d4c13432d3cd6ef07e3f2dff338034c5319fc479151774", 21189),
    "docs/analysis/ORBIT_SPECTRAL_CATALOG.md": ("1e14fb78bdb3914a0188d79dcee288377941bba04c6f79e5721f0e803d22da29", 18762),
    "docs/ARCHITECTURE_MAP.md": ("865ab785164f85c0426d849cb3314c8c41efe81155ce14bd7fe6392ca5d0c381", 34880),
    "docs/THREE_PART_CONTINUOUS_TYPOLOGY.md": ("11a7f70f71ccc061c115e1b0e2f38a9265d9872588b6b9e83be05e79e5568d6c", 6664),
    "docs/TIERED_PHOTONIC_THEOREM.md": ("c1d6fcb53ff947b9aa32991d8d3dfc999f127bba0cb48ddf807ecc37386867c3", 8597),
    "canonical/tiered-photonic-candidates/tiered-photonic-v1.json": ("00ce6e315a66346fa9673ab5a64460a788702cc097fac4069444901af6930f4e", 43639),
    "orrery/src/generated/photonic-overlay.v1.json": ("35e8958d6e6d2455ceb6442ef7dc50d07de80416bbed7bf78260c670cc10901e", 17403),
    "orrery/src/audio.ts": ("e863b845c8f2709a0fe0e6fe706dce603e795b760c6561d110d240ddb1dfca88", 37063),
    "src/fivefold/quintessence.py": ("eefd7e1e060189261c8063652d2ed73a09b16d3ffdcb9f259502a107ef9ceaa0", 5163),
    "tools/governed-loop/mvp6/task-a/compiled_itinerary.json": ("4a66d12a139be61dfb14b0b185d16a345d5cbe395595b4398999168be9654232", 27186),
    "tools/governed-loop/mvp6/task-0/mvp6_form_spec.json": ("135fb1d1b7bca1a3ba9814e3c62bc2b531511326badb219d65aa93cd61cb1823", 10286),
    "tools/governed-loop/mvp6/task-c/traces/piece_a_far_shore.jsonl": ("fc0c7a099ba117b3f2291f551df1ef28e4236e6668314861e58acfbbb16ad18a", 281494),
    "tools/governed-loop/mvp6/task-d/renders/piece_a_far_shore.wav": ("e5c8bf2b0e31f32d36a8816e6011f09e10b26cce5b94c4782aefd28406567a77", 10822184),
    "tools/governed-loop/mvp6/task-d/renders/piece_a_far_shore.mid": ("d44f543b64deb0e6703b9c5906f8c78400015379a8aa166cbc07856be09ec0bb", 10969),
    "qa/mvp6_landing_receipt.json": ("4692c3f8497da98a64faa1e4f97faaf0174e91c645ab6ff50626fb479f536420", 18512),
    "qa/mvp6_task_0_receipt.json": ("9cd2dd9408ca6aeb5daddfda2a261178d0c9cb62d3701b095a7593f6cc985256", 9868),
    "qa/mvp6_task_a_receipt.json": ("76344a181e3eb2403227ebefb65dc6c537e4f5af9bb03679585b701688a042ca", 2775),
    "qa/mvp6_task_b_receipt.json": ("e91112e5169a48a8fa509d07b7789365ae7539b6d1d2aad1d95923c3f5a565cd", 1525),
    "qa/mvp6_task_c_receipt.json": ("38da7f69f9c1e30fe532ae675cacf0ee1e0e3d9112d0dccd5e42dceba7390c67", 5805),
    "qa/mvp6_task_d_receipt.json": ("72bde27cc781d8b8ab414c1069fd50bb3a7359f84c0fa0ba69e0f5a63fc679a1", 24198),
    "qa/mvp6_task_e_receipt.json": ("d4671106b290bff2fe4f6656f689d78e249b93fd0dba911954a9b82f33278c83", 1091),
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

GUARD = {
    "causationClaim": False,
    "physicalQuantityClaim": False,
    "tierClassifier": False,
    "globalCHNull": True,
    "gov517_correspondence_claimed": False,
    "still_set_label": "still_set",
    "layer": "SPEC-001 \u00a71.3 overlay dynamics",
}


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


def verify_opening():
    head = subprocess.run(["git", "rev-parse", "HEAD"], cwd=REPO,
                          capture_output=True, text=True, check=True).stdout.strip()
    if head != EXPECTED_HEAD:
        stop("S-1", f"HEAD {head}")
    status = subprocess.run(["git", "status", "--porcelain"], cwd=REPO,
                            capture_output=True, text=True, check=True).stdout
    ledger = (REPO / "provenance/DECISION_LEDGER.md").read_bytes()
    if hashlib.sha256(ledger).hexdigest() != EXPECTED_LEDGER:
        stop("S-1", "ledger hash")
    if len(ledger) != EXPECTED_LEDGER_BYTES or ledger.count(b"\n") != EXPECTED_LEDGER_LINES:
        stop("S-1", "ledger size/lines")
    manifest_data = json.loads((REPO / "MANIFEST.json").read_text(encoding="utf-8"))
    files = manifest_data.get("files", [])
    if sha256_file(REPO / "MANIFEST.json") != EXPECTED_MANIFEST:
        stop("S-1", "manifest hash")
    if len(files) != EXPECTED_MANIFEST_FILES or sum(f.get("bytes", 0) for f in files) != EXPECTED_MANIFEST_BYTES:
        stop("S-1", "manifest count/bytes")
    if sha256_file(REPO / "CHECKSUMS.sha256") != EXPECTED_CHECKSUMS:
        stop("S-1", "checksums hash")
    if sha256_file(REPO / "qa/integrated-release-validation.json") != EXPECTED_VALIDATION:
        stop("S-1", "validation hash")
    if sha256_file(REPO / "qa/mvp6_landing_receipt.json") != EXPECTED_LANDING_RECEIPT:
        stop("S-1", "L23 landing receipt hash")
    validation = json.loads((REPO / "qa/integrated-release-validation.json").read_text(encoding="utf-8"))
    if validation.get("checksPassed") != 418 or validation.get("checksFailed") != 0:
        stop("S-1", "release closure")
    return {
        "baseHead": head,
        "treeClean": status == "",
        "workingTreeState": "L23 working-tree landing (uncommitted) on HEAD 154db01",
        "statusEntryCount": len([line for line in status.splitlines() if line.strip()]),
        "ledger": {"sha256": hashlib.sha256(ledger).hexdigest(),
                   "bytes": len(ledger), "lines": ledger.count(b"\n")},
        "manifest": {"sha256": sha256_file(REPO / "MANIFEST.json"),
                     "fileCount": len(files), "totalBytes": sum(f.get("bytes", 0) for f in files)},
        "checksums": {"sha256": sha256_file(REPO / "CHECKSUMS.sha256")},
        "validation": {"sha256": sha256_file(REPO / "qa/integrated-release-validation.json"),
                       "checksPassed": validation.get("checksPassed"),
                       "checksFailed": validation.get("checksFailed"),
                       "verdict": validation.get("verdict")},
        "l23LandingReceipt": {"sha256": EXPECTED_LANDING_RECEIPT},
    }


def verify_pins():
    rows = []
    for relative, (expected_sha, expected_bytes) in sorted(PINS.items()):
        path = REPO / relative
        if not path.exists():
            stop("S-1", f"missing pin {relative}")
        data = path.read_bytes()
        sha = hashlib.sha256(data).hexdigest()
        if sha != expected_sha or len(data) != expected_bytes:
            stop("S-1", f"pin drift {relative}: {sha} / {len(data)}")
        rows.append({"path": relative, "sha256": sha, "bytes": len(data), "verified": True})
    return rows


def verify_anchors():
    source = (REPO / "tools/governed-loop/mvp2.py").read_text(encoding="utf-8").splitlines()
    rows = []
    for line_number, expected in sorted(ANCHORS.items()):
        if source[line_number - 1] != expected:
            stop("S-1", f"anchor drift line {line_number}")
        rows.append({"line": line_number, "verified": True})
    return rows


def audit_strong_core():
    sys.path.insert(0, str(REPO / "tools/governed-loop/mvp4/task-b"))
    import mvp4_symbolic_planner as planner_module
    planner = planner_module.Planner()
    out_dist = planner.distances("1387@0")
    reverse = planner.reverse_adjacency()
    in_dist = {"1387@0": 0}
    queue = deque(["1387@0"])
    while queue:
        node = queue.popleft()
        for predecessor in reverse[node]:
            if predecessor not in in_dist:
                in_dist[predecessor] = in_dist[node] + 1
                queue.append(predecessor)
    strong = set(out_dist) & set(in_dist)
    one_way = set(out_dist) - strong
    if len(out_dist) != 3204 or len(strong) != 2928 or len(one_way) != 276:
        stop("S-3", "SCC census drift")
    return {"seed": "1387@0", "reachableNodes": len(out_dist),
            "strongCoreNodes": len(strong), "oneWayNodes": len(one_way),
            "shoreInStrongCore": "757@6" in strong}


def loop_evidence():
    records = [json.loads(line) for line in CONTROL_TRACE.read_text(encoding="utf-8").splitlines()]
    by_bar = {}
    for record in records:
        if record.get("recordType") != "micro":
            continue
        by_bar.setdefault(record["bar"], []).append(record)
    for bar in by_bar:
        by_bar[bar].sort(key=lambda r: r["sub"])
    sequence = {bar: tuple((r["emittedPc"], r["qStateIn"], r["nextQ"]) for r in rows)
                for bar, rows in by_bar.items()}
    runs = []
    changed = []
    index = 1
    max_bar = max(sequence)
    while index <= max_bar:
        node = by_bar[index][0]["node"]
        end = index
        while end + 1 <= max_bar and by_bar[end + 1][0]["node"] == node:
            end += 1
        if end > index:
            identical = all(sequence[b] == sequence[index] for b in range(index + 1, end + 1))
            runs.append({"node": node, "bars": [index, end],
                         "length": end - index + 1, "identical": identical})
            if not identical:
                stop("S-4", f"L23 control run not looped at {node} {index}-{end}")
            changed.extend(range(index + 1, end + 1))
        index = end + 1
    return {"runs": runs, "repeatBars": changed, "repeatBarCount": len(changed)}


def build_predeclaration(opening, scc, loops):
    return {
        "schemaVersion": "governed-loop.mvp6_1-predeclared-deloop.v1",
        "directive": "MVP6.1-DIR-1",
        "revision": 1,
        "pieceId": "piece_a_far_shore_delooped",
        "controlPieceId": "piece_a_far_shore",
        "opening": opening,
        "strongCore": scc,
        "control": {
            "traceSha256": PINS["tools/governed-loop/mvp6/task-c/traces/piece_a_far_shore.jsonl"][0],
            "wavSha256": PINS["tools/governed-loop/mvp6/task-d/renders/piece_a_far_shore.wav"][0],
            "midiSha256": PINS["tools/governed-loop/mvp6/task-d/renders/piece_a_far_shore.mid"][0],
            "itinerarySha256": PINS["tools/governed-loop/mvp6/task-a/compiled_itinerary.json"][0],
        },
        "loopEvidence": loops,
        "rule": {
            "name": "run_local_q1_rotation",
            "extraAdvancePerRepeat": 1,
            "runScope": "maximal consecutive same-node bars, including across the boundary rest",
            "canonicalCarry": "advanced normally so every non-repeat bar remains identical to the control",
            "definition": "Within each same-node bar run the voice carry starts at the canonical carry "
                          "and gains one extra Q1 advance between consecutive repeat bars; the "
                          "canonical carry advances normally across the whole piece.",
        },
        "expected": {
            "changedBars": sorted(loops["repeatBars"]),
            "unchangedBars": 55 - loops["repeatBarCount"],
            "runDistinct": {run["node"]: run["length"] for run in loops["runs"]},
            "minStepDelta": 2,
            "bars": 55,
            "microSteps": 408,
            "durationMs": 122700,
            "distinctQPerDwellBar": 12,
            "containerPerDwellBar": 7,
            "outOfMask": 0,
            "stillSet": 0,
            "boundaryDwell": 0,
        },
        "fences": {
            "guardFlags": GUARD,
            "noGateByteChange": True,
            "noSubstrateByteChange": True,
            "noQEngineByteChange": True,
            "noRendererByteChange": True,
            "noOrrerySourceChange": True,
            "controlFrozen": True,
            "photonicOverlayOnly": True,
        },
        "status": "locked-before-rebuild",
    }


def main():
    TASK0.mkdir(parents=True, exist_ok=True)
    opening = verify_opening()
    pins = verify_pins()
    anchors = verify_anchors()
    scc = audit_strong_core()
    loops = loop_evidence()
    if len(loops["repeatBars"]) != 10:
        stop("S-4", f"repeat bar count {len(loops['repeatBars'])}")

    predeclaration = build_predeclaration(opening, scc, loops)
    floats = find_floats(predeclaration)
    if floats:
        stop("S-5", f"floats in predeclaration {floats[:5]}")
    PREDECL.write_text(json.dumps(predeclaration, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    receipt = {
        "schemaVersion": "governed-loop.mvp6_1-task-0.v1",
        "directive": "MVP6.1-DIR-1",
        "task": "MVP6_1-T0",
        "status": "COMPLETE",
        "opening": opening,
        "pinsVerified": len(pins),
        "anchorsVerified": len(anchors),
        "strongCore": scc,
        "loopEvidence": loops,
        "predeclaration": {
            "path": str(PREDECL),
            "sha256": sha256_file(PREDECL),
            "bytes": PREDECL.stat().st_size,
        },
        "guardFlags": GUARD,
        "llmCalls": 0,
        "floatValues": 0,
        "stopRules": [],
    }
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "COMPLETE",
        "head": opening["baseHead"],
        "treeClean": opening["treeClean"],
        "pins": f"{len(pins)}/{len(pins)}",
        "anchors": f"{len(anchors)}/{len(anchors)}",
        "strongCore": scc["strongCoreNodes"],
        "loopRuns": [(r["node"], r["length"]) for r in loops["runs"]],
        "repeatBars": loops["repeatBars"],
        "predeclarationSha256": receipt["predeclaration"]["sha256"],
    }, indent=2))


if __name__ == "__main__":
    main()
