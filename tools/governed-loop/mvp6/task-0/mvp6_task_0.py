#!/usr/bin/env python3
"""MVP6-DIR-1 Task 0: fixed-point verification, strong-core audit, and the
predeclaration lock for the form piece.

Scratch-first. Repository tree is strictly read-only. Fail-closed.
All symbolic output is int / str / bool only (zero floats).
"""
import hashlib
import json
import os
import subprocess
import sys
from collections import deque
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp6")
TASK0 = SCRATCH / "task-0"
RECEIPT = TASK0 / "mvp6_task_0_receipt.json"
FORM_SPEC = TASK0 / "mvp6_form_spec.json"

INPUT_REALM = REPO / "tools" / "governed-loop"
os.environ["GOVERNED_LOOP_SCRATCH"] = str(INPUT_REALM)
os.environ["GOVERNED_LOOP_REPO"] = str(REPO)

EXPECTED_HEAD = "154db019711570ade5558a78eb5abb0b63b3c884"
EXPECTED_LEDGER = "ab1416156b261d02afecebfaabf5d10d59e89e6faea7136c8f9cda2a2d0d2c28"
EXPECTED_LEDGER_BYTES = 364225
EXPECTED_LEDGER_LINES = 4216
EXPECTED_MANIFEST = "1a07456c3e42784010cf5ec1066eedd0a6db52b57b9d3bd408fc0a81156a5f93"
EXPECTED_MANIFEST_FILES = 1600
EXPECTED_MANIFEST_BYTES = 110846414
EXPECTED_CHECKSUMS = "559c07b1ba36e55eda09e9f7bb034334ced5656d76149071e7de09b28e3c6d99"
EXPECTED_VALIDATION = "917b65ab719a108cd1a32e0605cb699bedff2bb6f76c1e742eb73d6da59321c2"
EMPTY_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

PINS = {
    "qa/mvp5_5_landing_receipt.json": ("8409572788a841a48180aee76de4a3c11048a59771dd82263ea45ceb2295c78a", 20059),
    "qa/mvp5_landing_receipt.json": ("c45214dae93a6da0c73fdfd7c96a0611f9ca9218793a9105bf198a0530606f0c", 92861),
    "qa/mvp4_landing_receipt.json": ("311e10ad155d1046f6c2b0800759552f2b8de5fe84cf3a1bab60a1a7268572db", 17840),
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
    "docs/ARCHITECTURE_MAP.md": ("62f552576abc982108f0df2a79d03f1a2e552628acf704faed4820befd61f1dc", 34624),
    "docs/THREE_PART_CONTINUOUS_TYPOLOGY.md": ("11a7f70f71ccc061c115e1b0e2f38a9265d9872588b6b9e83be05e79e5568d6c", 6664),
    "docs/TIERED_PHOTONIC_THEOREM.md": ("c1d6fcb53ff947b9aa32991d8d3dfc999f127bba0cb48ddf807ecc37386867c3", 8597),
    "canonical/tiered-photonic-candidates/tiered-photonic-v1.json": ("00ce6e315a66346fa9673ab5a64460a788702cc097fac4069444901af6930f4e", 43639),
    "orrery/src/generated/photonic-overlay.v1.json": ("35e8958d6e6d2455ceb6442ef7dc50d07de80416bbed7bf78260c670cc10901e", 17403),
    "orrery/src/audio.ts": ("e863b845c8f2709a0fe0e6fe706dce603e795b760c6561d110d240ddb1dfca88", 37063),
    "src/fivefold/quintessence.py": ("eefd7e1e060189261c8063652d2ed73a09b16d3ffdcb9f259502a107ef9ceaa0", 5163),
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


# --------------------------------------------------------------------------
# The locked form: sections -> steps (bars at K=5 transit or K=12 dwell, and
# exactly one boundary-transit rest). This is the predeclaration payload.
# --------------------------------------------------------------------------
def build_sections():
    sections = []

    sections.append({
        "id": 1,
        "key": "home_mirror",
        "name": "Home and Mirror",
        "steps": [
            {"type": "bar", "node": "1387@0", "k": 12, "role": "dwell"},
            {"type": "bar", "node": "1643@0", "k": 5, "role": "transit"},
            {"type": "bar", "node": "1709@0", "k": 12, "role": "dwell"},
            {"type": "bar", "node": "1645@0", "k": 5, "role": "transit"},
            {"type": "bar", "node": "1387@0", "k": 12, "role": "dwell"},
        ],
    })
    sections.append({
        "id": 2,
        "key": "departure",
        "name": "Departure",
        "steps": [
            {"type": "bar", "node": n, "k": 5, "role": "transit"} for n in [
                "2773@11", "2905@11", "727@11", "1453@10", "2905@9",
                "727@9", "1453@8", "2905@7", "727@7",
            ]
        ],
    })
    sections.append({
        "id": 3,
        "key": "first_dwell",
        "name": "First Dwell (Quiet Zone)",
        "steps": [
            {"type": "bar", "node": "1453@6", "k": 12, "role": "dwell"}
            for _ in range(3)
        ],
    })
    sections.append({
        "id": 4,
        "key": "climax",
        "name": "Climax Transit and Dwell",
        "steps": [
            {"type": "bar", "node": n, "k": 5, "role": "transit"} for n in [
                "2485@6", "2745@6", "1373@7", "1245@7",
            ]
        ] + [
            {"type": "bar", "node": "623@8", "k": 12, "role": "dwell"}
            for _ in range(4)
        ],
    })
    sections.append({
        "id": 5,
        "key": "shore",
        "name": "The Shore",
        "steps": [
            {"type": "bar", "node": n, "k": 5, "role": "transit"} for n in [
                "635@8", "1269@7", "699@7", "1397@6", "885@6", "443@7",
            ]
        ] + [
            {"type": "bar", "node": "379@7", "k": 12, "role": "dwell"},
            {"type": "bar", "node": "379@7", "k": 12, "role": "dwell"},
            {"type": "rest", "source": "379@7", "boundary": "757@6",
             "target": "379@7", "durationMs": 300},
            {"type": "bar", "node": "379@7", "k": 12, "role": "dwell"},
        ],
    })
    sections.append({
        "id": 6,
        "key": "return",
        "name": "Return",
        "steps": [
            {"type": "bar", "node": n, "k": 5, "role": "transit"} for n in [
                "443@7", "885@6", "699@6",
            ]
        ] + [
            {"type": "bar", "node": "1397@5", "k": 12, "role": "dwell"},
        ] + [
            {"type": "bar", "node": n, "k": 5, "role": "transit"} for n in [
                "699@5", "1397@4", "2793@3", "699@3", "1397@2", "2793@1",
                "1269@1", "635@2",
            ]
        ] + [
            {"type": "bar", "node": "623@2", "k": 12, "role": "dwell"},
        ] + [
            {"type": "bar", "node": n, "k": 5, "role": "transit"} for n in [
                "1245@1", "861@1", "1721@0", "859@0",
            ]
        ],
    })
    sections.append({
        "id": 7,
        "key": "homecoming",
        "name": "Homecoming",
        "steps": [
            {"type": "bar", "node": "1387@0", "k": 12, "role": "dwell"}
            for _ in range(4)
        ],
    })
    return sections


def summarize_sections(sections):
    bars = [s for sec in sections for s in sec["steps"] if s["type"] == "bar"]
    rests = [s for sec in sections for s in sec["steps"] if s["type"] == "rest"]
    transit_bars = sum(1 for b in bars if b["k"] == 5)
    dwell_bars = sum(1 for b in bars if b["k"] == 12)
    micro_steps = sum(b["k"] for b in bars)
    rest_ms = sum(r["durationMs"] for r in rests)
    duration_ms = micro_steps * 300 + rest_ms
    return {
        "bars": len(bars),
        "transitBars": transit_bars,
        "dwellBars": dwell_bars,
        "rests": len(rests),
        "microSteps": micro_steps,
        "restMs": rest_ms,
        "durationMs": duration_ms,
        "barNodes": [b["node"] for b in bars],
    }


def build_predeclaration(sections, summary):
    return {
        "schemaVersion": "governed-loop.mvp6-predeclared-form.v1",
        "directive": "MVP6-DIR-1",
        "revision": 1,
        "pieceId": "piece_a_far_shore",
        "destinationPhilosophy": "far_shore_return",
        "seed": "1387@0",
        "shore": "757@6",
        "mirrorApex": "1709@0",
        "quietDwell": "1453@6",
        "climaxDwell": "623@8",
        "sections": sections,
        "summary": summary,
        "successCriteria": {
            "macroTransitionsAllAccept": True,
            "expectedMacroTransitions": 55,
            "expectedSelfLoopExtensions": 9,
            "expectedOutOfMaskPitches": 0,
            "expectedBoundaryDwell": 0,
            "expectedStillSetEntries": 0,
            "expectedLlmCalls": 0,
            "expectedDistinctStates": 42,
            "expectedOffices": 7,
            "expectedPhases": 12,
            "expectedWavDeterminism": True,
            "expectedClippedSamples": 0,
            "expectedNonFiniteSamples": 0,
            "expectedDurationMinMs": 120000,
            "expectedDurationMaxMs": 180000,
            "expectedReturnNewInteriorNodes": 15,
            "negativeNeverReturnTarget": "1831@6",
            "negativeNeverReturnCode": "OUTSIDE_STRONG_CORE",
        },
        "fences": {
            "guardFlags": GUARD,
            "noGateByteChange": True,
            "noSubstrateByteChange": True,
            "noQEngineByteChange": True,
            "noOrrerySourceChange": True,
            "photonicOverlayOnly": True,
            "globalCHNull": True,
            "noClaimEvent": True,
        },
        "modality": "discrete-only for Modality 1/3; Modality 2 guarded boundary measurements",
        "status": "locked-before-evaluation",
    }


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
        stop("S-1", f"ledger size/lines {len(ledger_bytes)}/{ledger_lines}")

    manifest = json.loads((REPO / "MANIFEST.json").read_text(encoding="utf-8"))
    manifest_sha = sha256_file(REPO / "MANIFEST.json")
    manifest_files = len(manifest.get("files", []))
    manifest_bytes = sum(f.get("bytes", 0) for f in manifest.get("files", []))
    if manifest_sha != EXPECTED_MANIFEST:
        stop("S-1", f"manifest hash {manifest_sha}")
    if manifest_files != EXPECTED_MANIFEST_FILES or manifest_bytes != EXPECTED_MANIFEST_BYTES:
        stop("S-1", f"manifest count/bytes {manifest_files}/{manifest_bytes}")

    checksums_sha = sha256_file(REPO / "CHECKSUMS.sha256")
    if checksums_sha != EXPECTED_CHECKSUMS:
        stop("S-1", f"checksums hash {checksums_sha}")

    validation = json.loads((REPO / "qa/integrated-release-validation.json").read_text(encoding="utf-8"))
    validation_sha = sha256_file(REPO / "qa/integrated-release-validation.json")
    if validation_sha != EXPECTED_VALIDATION:
        stop("S-1", f"validation hash {validation_sha}")
    checks = validation.get("checks", [])
    passed = sum(1 for c in checks if c.get("status") == "PASS")
    failed = sum(1 for c in checks if c.get("status") == "FAIL")
    if passed != 418 or failed != 0:
        stop("S-1", f"release closure {passed}/{failed}")

    return {
        "head": head,
        "treeClean": True,
        "treeDigest": tree_digest,
        "ledger": {"sha256": ledger_sha, "bytes": len(ledger_bytes), "lines": ledger_lines},
        "manifest": {"sha256": manifest_sha, "files": manifest_files, "bytes": manifest_bytes},
        "checksums": {"sha256": checksums_sha},
        "validation": {"sha256": validation_sha, "checksPassed": passed, "checksFailed": failed,
                       "verdict": validation.get("verdict")},
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
        actual = source[line_number - 1]
        if actual != expected:
            stop("S-1", f"anchor drift line {line_number}: {actual!r}")
        rows.append({"line": line_number, "text": expected, "verified": True})
    return rows


def audit_strong_core():
    sys.path.insert(0, str(REPO / "tools/governed-loop/mvp4/task-b"))
    import mvp4_symbolic_planner as planner_module

    planner = planner_module.Planner()
    seed = "1387@0"
    out_dist = planner.distances(seed)
    reverse = planner.reverse_adjacency()
    in_dist = {seed: 0}
    queue = deque([seed])
    while queue:
        node = queue.popleft()
        for predecessor in reverse[node]:
            if predecessor not in in_dist:
                in_dist[predecessor] = in_dist[node] + 1
                queue.append(predecessor)

    reachable = set(out_dist)
    strong_core = reachable & set(in_dist)
    one_way = reachable - strong_core
    if len(reachable) != 3204 or len(strong_core) != 2928 or len(one_way) != 276:
        stop("S-3", f"SCC census drift {len(reachable)}/{len(strong_core)}/{len(one_way)}")
    if "757@6" not in strong_core:
        stop("S-3", "shore 757@6 not in strong core")

    round_trips = []
    for node in ["1709@0", "1461@0", "953@0"]:
        out_hops = out_dist.get(node)
        back_hops = in_dist.get(node)
        if out_hops is None or back_hops is None:
            stop("S-3", f"I0 mirror round trip missing {node}")
        round_trips.append({"node": node, "out": out_hops, "back": back_hops,
                            "inStrongCore": node in strong_core})

    governed_one_way = sum(1 for node in one_way if planner.node_audit(node)["role"] != "boundary")
    boundary_one_way = len(one_way) - governed_one_way
    return {
        "seed": seed,
        "reachableNodes": len(reachable),
        "strongCoreNodes": len(strong_core),
        "oneWayNodes": len(one_way),
        "oneWayGoverned": governed_one_way,
        "oneWayBoundary": boundary_one_way,
        "shoreInStrongCore": "757@6" in strong_core,
        "shoreOutboundHops": out_dist.get("757@6"),
        "shoreReturnHops": in_dist.get("757@6"),
        "i0MirrorRoundTrips": round_trips,
    }


def main():
    TASK0.mkdir(parents=True, exist_ok=True)
    fixed_point = verify_fixed_point()
    pin_rows = verify_pins()
    anchor_rows = verify_anchors()
    scc = audit_strong_core()

    sections = build_sections()
    summary = summarize_sections(sections)
    if summary["bars"] != 55:
        stop("S-4", f"bar count {summary['bars']}")
    if summary["transitBars"] != 36 or summary["dwellBars"] != 19:
        stop("S-4", f"bar split {summary['transitBars']}/{summary['dwellBars']}")
    if summary["microSteps"] != 408:
        stop("S-4", f"micro steps {summary['microSteps']}")
    if summary["durationMs"] != 122700:
        stop("S-4", f"duration {summary['durationMs']}")
    if not (120000 <= summary["durationMs"] <= 180000):
        stop("S-4", "duration outside target window")

    predeclaration = build_predeclaration(sections, summary)
    floats = find_floats(predeclaration)
    if floats:
        stop("S-5", f"floats in predeclaration {floats[:5]}")
    body = {k: v for k, v in predeclaration.items()}
    predeclaration_hash = hashlib.sha256(canonical(body).encode("utf-8")).hexdigest()
    predeclaration["predeclarationHash"] = predeclaration_hash

    FORM_SPEC.write_text(json.dumps(predeclaration, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    form_sha = sha256_file(FORM_SPEC)
    form_bytes = FORM_SPEC.stat().st_size

    bar_nodes = summary["barNodes"]
    distinct_bar_states = sorted(set(bar_nodes))
    # 42 distinct lifted states: 41 bar states plus the boundary transit node.
    distinct_all = sorted(set(bar_nodes) | {"757@6"})
    if len(distinct_bar_states) != 41 or len(distinct_all) != 42:
        stop("S-4", f"distinct state census {len(distinct_bar_states)}/{len(distinct_all)}")

    sys.path.insert(0, str(REPO / "tools/governed-loop/mvp4/task-b"))
    import mvp4_symbolic_planner as planner_module
    planner = planner_module.Planner()
    offices = sorted({planner.node_audit(n)["office"] for n in distinct_all
                      if planner.node_audit(n)["office"]})
    phases = sorted({planner.node_audit(n)["phase"] for n in distinct_all})
    orbits = sorted({planner.node_audit(n)["orbit"] for n in distinct_all
                     if planner.node_audit(n)["orbit"]})
    if len(offices) != 7:
        stop("S-4", f"office coverage {offices}")
    if len(phases) != 12:
        stop("S-4", f"phase coverage {phases}")

    receipt = {
        "schemaVersion": "governed-loop.mvp6-task-0.v1",
        "directive": "MVP6-DIR-1",
        "task": "MVP6-T0",
        "status": "COMPLETE",
        "fixedPoint": fixed_point,
        "pinsVerified": len(pin_rows),
        "pins": pin_rows,
        "anchorsVerified": len(anchor_rows),
        "anchors": anchor_rows,
        "strongCore": scc,
        "formSpec": {
            "path": str(FORM_SPEC),
            "sha256": form_sha,
            "bytes": form_bytes,
            "predeclarationHash": predeclaration_hash,
            "bars": summary["bars"],
            "transitBars": summary["transitBars"],
            "dwellBars": summary["dwellBars"],
            "rests": summary["rests"],
            "microSteps": summary["microSteps"],
            "durationMs": summary["durationMs"],
            "distinctBarStates": len(distinct_bar_states),
            "distinctStatesWithBoundary": len(distinct_all),
            "offices": offices,
            "phases": phases,
            "orbits": orbits,
            "floatValues": 0,
        },
        "guardFlags": GUARD,
        "llmCalls": 0,
        "stopRules": [],
    }
    floats = find_floats(receipt)
    if floats:
        stop("S-5", f"floats in receipt {floats[:5]}")
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    print(json.dumps({
        "status": "COMPLETE",
        "head": fixed_point["head"],
        "pins": f"{len(pin_rows)}/{len(pin_rows)}",
        "anchors": f"{len(anchor_rows)}/{len(anchor_rows)}",
        "strongCore": scc["strongCoreNodes"],
        "oneWay": scc["oneWayNodes"],
        "bars": summary["bars"],
        "cells": summary["microSteps"],
        "durationMs": summary["durationMs"],
        "offices": len(offices),
        "phases": len(phases),
        "distinct": len(distinct_all),
        "formSpecSha256": form_sha,
    }, indent=2))


if __name__ == "__main__":
    main()
