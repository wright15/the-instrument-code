#!/usr/bin/env python3
"""MVP7-INTENTION-DIR-1 Task 0: fixed-point verification, pin audit, strong-core
audit, ear-gate status, and the predeclaration lock.

Scratch-only. Read-only against the repository. Symbolic output is int/str/bool
only; the predeclaration contains declared thresholds and is not a measurement.
"""
import hashlib
import json
import os
import subprocess
import sys
from collections import deque
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp7_intention")
TASK0 = SCRATCH / "task-0"
RECEIPT = TASK0 / "mvp7_task_0_receipt.json"
PREDECL = TASK0 / "mvp7_predeclared_bets_and_schema.json"
EAR_SCORECARD = TASK0 / "ear_baseline_scorecard.json"

EXPECTED_HEAD = "865abc8be20483e45176c378c4e078ebd3187c26"
EXPECTED_LEDGER = "43a529af76875d1a8695ff66ab01780c951d12abf4224085a0ece1323acbb8d5"
EXPECTED_LEDGER_BYTES = 398051
EXPECTED_LEDGER_LINES = 4348
EXPECTED_MANIFEST = "a0ac68b91a987adf2d3434946c5872e588f90b5a8c6179d99ee67014a9f5591a"
EXPECTED_MANIFEST_FILES = 1684
EXPECTED_MANIFEST_BYTES = 177672713
EXPECTED_CHECKSUMS = "a48874cc156969bdb6cb2217961979ad17282c74ecc5337a0eb8e2205cdb5f6f"
EXPECTED_COMPLETION = "6b8cbf29d67f8d728f69bccdf84c4ead2689ff2c11a45bbe8f1b16a4a5dff20d"
EXPECTED_LANDING = "f57a6874facec561f93b1c2bbb36317e39ab0f3a7b7c023328e30d86275bba89"
EXPECTED_ARCH = "865ab785164f85c0426d849cb3314c8c41efe81155ce14bd7fe6392ca5d0c381"
EXPECTED_ARCH_BYTES = 34880

PINS = {
    "docs/analysis/orbit_spectral_catalog.json": ("6f782a5f9d89057273d4c13432d3cd6ef07e3f2dff338034c5319fc479151774", 21189),
    "docs/analysis/ORBIT_SPECTRAL_CATALOG.md": ("1e14fb78bdb3914a0188d79dcee288377941bba04c6f79e5721f0e803d22da29", 18762),
    "tools/governed-loop/mvp5/task-b/renders/track3_arm3a_dynamic_q_reset.wav": ("b4e9b1674fd4ae3b94fc9e0921e3c461c642403fa34a91869fe851e069398307", 2672504),
    "tools/governed-loop/mvp5/task-b/renders/track4_arm3b_dynamic_q_carried.wav": ("d0fe3d2727593d22ee49ed50d64b0253ed36f52e64d9f202d43596106e735738", 2672504),
    "tools/governed-loop/mvp6/task-d/renders/piece_a_far_shore.wav": ("e5c8bf2b0e31f32d36a8816e6011f09e10b26cce5b94c4782aefd28406567a77", 10822184),
    "tools/governed-loop/mvp6_1/task-d/renders/piece_a_far_shore_delooped.wav": ("b2ce0b3f5ac39d0ac226083e5c2646a1d116222acc5473b746173a0d3125d7f1", 10822184),
    "tools/governed-loop/mvp6_2/task-d/renders/piece_a_far_shore_legato.wav": ("defd27219fb292fb9e1071b4fa13020d4adc62e2f981bce88d9b936d6a3e9f50", 10822184),
    "tools/governed-loop/mvp6_3/task-d/renders/piece_a_far_shore_faded.wav": ("330abb9c9224f8526f52f25763c6902d581da3a0fe3ac3127161ae22056ae1a9", 10822184),
    "tools/governed-loop/mvp6_3/task-d/renders/piece_a_far_shore_faded.mid": ("8a8c545ffbff1740921355b8538c599a66ccd93a98daa9d67e76e845734225f6", 10978),
    "tools/governed-loop/mvp6_3/task-e/EAR_VALIDATION_PROTOCOL_MVP6_3.md": ("39a6407c6f3d966ef2cef169919f936ca0266a0ef4ec663c05d2930fbf238428", 7946),
    "tools/governed-loop/mvp2.py": ("79c0cf706fffc23745cab6e87ffbc46d34d70ad94a93291135725e388dc17328", 38997),
    "tools/governed-loop/census_462.json": ("242bce7423bc2eb0ae61ee431c27901d6a87401b8b3ffd6725a04d0e1ed0685a", 194194),
    "tools/governed-loop/frozen_ground_truth.json": ("007b0ffe65015bd2c5f1a6fe0df8969961ce8cfb3d499677b143d971e1fc5744", 91360),
    "tools/governed-loop/frozen_seam_substrate_v3.json": ("9f9818effa5d11e4ef2634122c9f484faf6790323cabae130561c1c75e8a295f", 47207),
    "tools/governed-loop/seam_legal_moves_v3.json": ("e6cf62a8eefa0924da9286f2e664c1914d9d620ed2d299929f684fd48225c274", 551287),
    "tools/governed-loop/mvp4/task-a/mvp4_dynamic_chaldean_card.json": ("6486599187687edb1e28481b2bbc79d9a11a06001e4a237505c5e44c1c1a1469", 1999),
    "tools/governed-loop/mvp4/task-b/mvp4_symbolic_planner.py": ("9ff511f14282cbe6ee48010d67092c70c25da0bf5fa6dbd1e50382afeb85f5c0", 21348),
    "tools/governed-loop/mvp4/task-c/mvp4_q_intra_node.py": ("8b39ffe4be4d1f801cf1065cd8928c681002249de8ebad1d5246f277e94f815f", 4721),
    "tools/governed-loop/mvp5/task-a/mvp5_coupled_engine.py": ("c07940ccc90a73e220102000905d5af8da13ee03604224e49c71ff4c4718dd0c", 20663),
    "tools/governed-loop/mvp5/task-b/mvp5_audio_renderer.py": ("0c917aab7a95851e90ce1c3244ea6b3af1ea35e362262cb0d7a0095ec40b9984", 24696),
    "tools/governed-loop/mvp6_2/task-b/mvp6_2_legato_renderer.py": ("e91c6e749b1003da3ad4461b745ad0d35caf23cb394f369d92534d857f6e769c", 8624),
    "tools/governed-loop/mvp6_3/task-b/mvp6_3_fade_renderer.py": ("673ac7083b59ee96f4a0d1f429778ad69ef4dd382f72e2f67bc1e3e7989769de", 8145),
    "tools/governed-loop/mvp6_1/task-b/mvp6_1_coupled_form_engine.py": ("41cb80127d95f4dc7b2af4862c8871ae4d2574ea10ca46f9e06d282f5974f9de", 7039),
    "tools/governed-loop/mvp6/task-a/mvp6_form_compiler.py": ("523dd3fbd31047f4f03205a832519ba2d911c74bedfc8a2f7424a69e1a783677", 20540),
    "orrery/src/audio.ts": ("e863b845c8f2709a0fe0e6fe706dce603e795b760c6561d110d240ddb1dfca88", 37063),
    "src/fivefold/quintessence.py": ("eefd7e1e060189261c8063652d2ed73a09b16d3ffdcb9f259502a107ef9ceaa0", 5163),
}

ANCHORS = {
    150: "        if cm == nm and cp == np_:",
    151: "            if self.gov_root[cm] is None:",
    152: "                checks[\"boundary_endpoint\"] = True",
    153: "                checks[\"same_family\"] = False",
    154: "                return \"REJECT\", [\"ungoverned-transition\"], checks, None",
    169: "        same_root = cr is not None and nr is not None and cr == nr",
    171: "        if same_root and cp == np_:",
    172: "            return \"ACCEPT\", [], checks, None",
    183: "        if checks[\"boundary_endpoint\"]:",
    184: "            return \"REJECT\", [\"ungoverned-transition\"], checks, None",
    733: "        plan[\"dwellMs\"] = int(__import__(\"os\").environ.get(\"ORRERY_BRIDGE_DWELL_MS\", \"1500\"))",
}

GUARD = {
    "causationClaim": False, "physicalQuantityClaim": False,
    "tierClassifier": False, "globalCHNull": True,
    "gov517_correspondence_claimed": False, "still_set_label": "still_set",
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


def sha256_text(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))


def find_floats(value, path="$"):
    found = []
    if isinstance(value, float):
        found.append(path)
    elif isinstance(value, dict):
        for key, child in value.items():
            found.extend(find_floats(child, f"{path}.{key}"))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            found.extend(find_floats(child, f"{path}[{index}]"))
    return found


def git(*args):
    return subprocess.run(["git", "-C", str(REPO), *args],
                          capture_output=True, text=True, check=True).stdout


def build_predeclaration():
    return {
        "directive": "MVP7-INTENTION-DIR-1",
        "revision": 1,
        "status": "locked-before-evaluation",
        "schemaVersion": "governed-loop.mvp7-predeclared-bets.v1",
        "openingHead": EXPECTED_HEAD,
        "layer": GUARD["layer"],
        "guards": GUARD,
        "earGate": {
            "status": "PENDING_HUMAN",
            "baselineWav": "tools/governed-loop/mvp6_3/task-d/renders/piece_a_far_shore_faded.wav",
            "baselineWavSha256": "330abb9c9224f8526f52f25763c6902d581da3a0fe3ac3127161ae22056ae1a9",
            "protocol": "tools/governed-loop/mvp6_3/task-e/EAR_VALIDATION_PROTOCOL_MVP6_3.md",
            "rule": "No listener verdict may be authored by the agent; Q1-Q8 stay unsigned until Erick listens.",
            "scorecard": "task-0/ear_baseline_scorecard.json",
        },
        "lens": {
            "sampleRate": 44100,
            "fftSize": 4096,
            "hopSamples": 1024,
            "window": "hann",
            "referenceHz": 440,
            "bandLowHz": 27.5,
            "bandHighHz": 4186.01,
            "minBinPower": 1e-12,
            "descriptorCentroid": "power_weighted_mean(log2(f/440))",
            "descriptorSpread": "power_weighted_std(log2(f/440))",
            "aggregation": "mean over all analysis windows whose center lies in the unit",
            "units": "octaves",
            "interiorFraction": 0.5,
            "seamHalfWindowMs": 300,
        },
        "bets": {
            "A1_Q2_calibration": {
                "claim": "per-window log-centroid difference between quiet dwell and climax dwell lands in [0.60,0.80] octaves",
                "expectedOctaves": 0.696,
                "label": "calibration, not discovery",
                "passRule": "0.60 <= observed <= 0.80",
            },
            "A2_negative_controls": {
                "legato": {
                    "control": "L24 delooped WAV",
                    "test": "L25 legato WAV",
                    "claim": "descriptor delta concentrated at bar seams; interior median |delta| < 0.01 octaves",
                    "passRule": "seam mean |delta| > 10 * interior mean |delta| AND interior mean |delta| < 0.01",
                },
                "fade": {
                    "control": "L25 legato WAV",
                    "test": "L26 faded WAV",
                    "claim": "descriptor delta exactly zero on bars 1-54 and confined to bar 55",
                    "passRule": "max |delta| on bars 1-54 == 0.0 AND max |delta| in bar 55 > 0.0",
                },
            },
            "A3_deloop_localisation": {
                "control": "L23 WAV",
                "test": "L24 delooped WAV",
                "claim": "descriptor delta on the 10 predeclared repeat bars (plus 500 ms release tails of their 3 successors) and zero elsewhere",
                "source": "tools/governed-loop/mvp6_1/task-0/mvp6_1_predeclared_deloop.json expected.changedBars",
                "repeatBars": [16, 17, 23, 24, 25, 33, 34, 53, 54, 55],
                "successorBars": [18, 26, 35],
                "tailMs": 500,
                "unit": "bar",
                "passRule": "changed-bar recall == 1.0 AND unchanged-bar false-positive rate <= 0.05 at |delta| > 0.01 octaves",
            },
            "A4_carried_vs_reset": {
                "reset": "track3_arm3a_dynamic_q_reset.wav",
                "carried": "track4_arm3b_dynamic_q_carried.wav",
                "claim": "carried track has strictly greater inter-bar log-centroid variance than reset track",
                "passRule": "var(carried) > var(reset)",
            },
        },
        "cadences": {
            "B1_andalusian": {
                "tonicPc": 0,
                "waypoints": [
                    {"id": "i", "requiredPcs": [0, 3, 7], "band": None},
                    {"id": "VII", "requiredPcs": [10, 2, 5], "band": None},
                    {"id": "VI", "requiredPcs": [8, 0, 3], "band": None},
                    {"id": "V", "requiredPcs": [7, 8, 11], "band": 12},
                    {"id": "i_resolution", "requiredPcs": [0, 3, 7], "band": None, "requiresLeadPc": 0},
                ],
                "dwellBarsPerWaypoint": 2,
                "terminalDwellBars": 3,
                "transitK": 5,
                "dwellK": 12,
                "renderLaw": "mvp6_3_fade_renderer legato + 50 ms fade",
            },
            "B2_borrowed_minor": {
                "tonicPc": 0,
                "waypoints": [
                    {"id": "I6", "requiredPcs": [0, 4, 7, 9], "band": None},
                    {"id": "iv", "requiredPcs": [0, 5, 8], "band": None},
                    {"id": "I", "requiredPcs": [0, 4, 7], "band": None},
                ],
                "dwellBarsPerWaypoint": 2,
                "terminalDwellBars": 3,
                "transitK": 5,
                "dwellK": 12,
                "renderLaw": "mvp6_3_fade_renderer legato + 50 ms fade",
            },
            "candidateRule": "governed node inside S000 whose phase-transposed container contains all required pcs; band filter on registerOffset when set; deterministic order prefers phase in {0,11}, then (mask, phase)",
            "routeRule": "shortest path inside governed S000 between consecutive waypoints; every hop gate ACCEPT",
        },
        "intentionSchema": {
            "schemaVersion": "governed-loop.mvp7-intention-spec.v1",
            "requiredFields": ["pieceId", "destinationPhilosophy", "seedNode", "sectionIntentions"],
            "sectionFields": ["section", "name", "role", "targetDispersionClass", "targetOrbitFilter", "phaseZone", "registerBand", "requiredPitchClasses", "dwellBars", "kSteps"],
            "allowedDestinationPhilosophy": ["far_shore_return", "interior_circuit", "modal_pivot_return"],
            "allowedDispersionClasses": ["ANCHOR_FLAT", "MODERATE_BEND", "DEEP_DISPERSION", "EXTREME_RAMP"],
            "forbidden": ["raw MIDI notes", "raw pitch classes as output notes", "node ids as executable transitions", "floats in symbolic fields"],
        },
        "llm": {
            "transport": "opencode CLI 1.19.5 non-interactive run --format json --pure",
            "model": "opencode-go/claude-haiku-5-5",
            "modelRationale": "same model as the MVP-3 move-level proposer, so intention-level divergence is comparable to the recorded move-level convergence",
            "maxRetries": 3,
            "timeoutSeconds": 120,
            "trialCount": 2,
            "arms": {
                "C1_free_proposal": "LLM proposes section intentions from catalog + laws + prompt",
                "C2_verified_menu": "compiler enumerates legal waypoint menus per section; LLM selects/ranks",
            },
            "prompts": {
                "open_arc": "Compose a 7-section arc that opens at home, departs through a quiet dwell, and reaches a high-dispersion climax. Decide for yourself whether the piece returns home, ends elsewhere, or stays interior; state the destination philosophy explicitly.",
                "andalusian": "Plan a 5-section arc that executes an Andalusian cadential descent i-VII-VI-V in the lead line, reaching a Phrygian-dominant climax, then resolving to the tonic.",
                "borrowed_minor": "Plan a 3-section arc that states the major tonic with natural sixth, pivots to the borrowed minor subdominant, and resolves to the major tonic.",
            },
        },
        "takeawayMethods": {
            "divergenceFormula": "per trial, mean of six dimensions: (1) destinationPhilosophy differs from far_shore_return; (2) |sections-7|/7; (3) Jaccard distance of dwell-phase sets vs {0,2,5,6,7,8}; (4) Jaccard distance of orbit sets vs the default piece orbit set; (5) 1 if any requiredPitchClasses non-empty else 0; (6) Jaccard distance of dispersion-class sets",
            "defaultSignature": {
                "destinationPhilosophy": "far_shore_return",
                "sectionCount": 7,
                "dwellPhases": [0, 2, 5, 6, 7, 8],
                "requiredPitchClasses": [],
                "source": "tools/governed-loop/mvp6/task-0/mvp6_form_spec.json",
            },
            "legalityFormula": "first-pass compile acceptance rate; retry recovery is compile acceptance by retry 2 over first-pass failures",
            "menuRule": "C2 presents 12 pre-verified governed-S000 node entries per section (index, node, orbit, dispersion class, phase, register band, pitch classes, k, dwellBars); LLM returns one index per section",
            "failureModes": {
                "FM1_GENERIC_ARC_BIAS": "all accepted C1 open-arc trials reproduce the 7-section default role sequence",
                "FM2_CLIMAX_BY_DEFAULT": "all accepted C1 trials request EXTREME_RAMP at phase 8",
                "FM3_HOME_ALWAYS": "all accepted open-arc trials choose far_shore_return when the prompt leaves the destination open",
                "FM4_VOCABULARY_DRIFT": "transcript text asserts linear ANCHOR_FLAT, a B2 proof, acoustic octave motion from D7, entropy/C_H, or perception/biology; schema or fence violations are counted separately",
            },
            "blindAB": "pair each accepted LLM render with the L26 planner control; the Q9 preference field stays unsigned until the human ear gate",
        },
        "takeaways": {
            "divergence": "structural edit distance from planner default choices; <0.10 = converges",
            "earAB": "blind planner vs LLM; Q1-Q8 + Q9 preference; single listener labelled composer taste calibration",
            "legality": "first-pass acceptance, rejection codes, retry-2/3 recovery, C1 vs C2",
            "delegationMap": "per dimension: DELEGATE_TO_LLM / REQUIRE_VERIFIED_MENU / KEEP_PLANNER_DEFAULT",
            "failures": ["FM1_GENERIC_ARC_BIAS", "FM2_CLIMAX_BY_DEFAULT", "FM3_HOME_ALWAYS", "FM4_VOCABULARY_DRIFT"],
            "cost": "llmCalls, input/output tokens, latency ms, USD, plus safety isolation counters",
        },
        "outcomes": {
            "OUTCOME_1_INTENTION_PROPOSER": "divergence >= 0.25 AND (first-pass + retry-2 legality) >= 0.90 AND FM4 == 0 AND ear Q9 win-or-distinct-tie",
            "OUTCOME_2_GUEST_CURATOR_MENU_BOUND": "free legality < 0.90 OR FM1-FM3 present, but C2 menu yields ear-preferred divergences on arc/proportion classes",
            "OUTCOME_3_EXPLAINER_ANNOTATOR_ONLY": "divergence < 0.10 OR blind A/B loss to planner control",
            "conditionalRule": "If the ear gate is unsigned, no OUTCOME_1 selection is final; emit CONDITIONAL_PENDING_EAR with the deterministic criterion result.",
        },
        "fences": {
            "noEntropy": True,
            "noCHFormulation": True,
            "noPerceptionModel": True,
            "noSubsystemByteChange": True,
            "noStructuredClaim": True,
            "noTagNoPush": True,
        },
        "preExecutionCorrections": [
            {
                "at": "before any measurement or LLM call",
                "field": "bets.A3_deloop_localisation.repeatBars/successorBars",
                "from": [15, 16, 17, 22, 23, 24, 25, 31, 32, 34],
                "to": [16, 17, 23, 24, 25, 33, 34, 53, 54, 55],
                "reason": "initial transcription error; corrected to the landed MVP-6.1 predeclaration expected.changedBars before evaluation",
                "thresholdsChanged": False,
            },
            {
                "at": "before any measurement or LLM call",
                "field": "bets.A3_deloop_localisation.unit/passRule",
                "from": "changed-window recall at analysis-window granularity",
                "to": "changed-bar recall at bar granularity",
                "reason": "the predeclared claim is about bars changed by the de-loop; bar aggregation is the matching unit",
                "thresholdsChanged": False,
            },
            {
                "at": "before any LLM call",
                "field": "llm.model",
                "from": "opencode-go/deepseek-v4.1-flash",
                "to": "opencode-go/claude-haiku-5-5",
                "reason": "match the MVP-3 move-level proposer model so the intention-level result is comparable to the recorded passenger result",
                "thresholdsChanged": False,
            },
            {
                "at": "before any LLM call",
                "field": "llm.prompts.open_arc",
                "from": "returns as new territory (destination fixed)",
                "to": "destination left open so FM3_HOME_ALWAYS is testable",
                "reason": "the home-always failure mode cannot be measured if the prompt requires a return",
                "thresholdsChanged": False,
            },
        ],
    }


def main():
    TASK0.mkdir(parents=True, exist_ok=True)

    head = git("rev-parse", "HEAD").strip()
    porcelain = git("status", "--porcelain")
    if head != EXPECTED_HEAD:
        stop("S-1", f"HEAD {head}")
    if porcelain.strip():
        stop("S-1", "tree not clean")
    if sha256_file(REPO / "provenance/DECISION_LEDGER.md") != EXPECTED_LEDGER:
        stop("S-1", "ledger hash")
    ledger_stat = (REPO / "provenance/DECISION_LEDGER.md").stat()
    if ledger_stat.st_size != EXPECTED_LEDGER_BYTES:
        stop("S-1", "ledger bytes")
    line_count = len((REPO / "provenance/DECISION_LEDGER.md").read_text(encoding="utf-8").splitlines())
    if line_count != EXPECTED_LEDGER_LINES:
        stop("S-1", "ledger lines")
    manifest = json.loads((REPO / "MANIFEST.json").read_text(encoding="utf-8"))
    if (sha256_file(REPO / "MANIFEST.json") != EXPECTED_MANIFEST
            or manifest["fileCount"] != EXPECTED_MANIFEST_FILES
            or manifest["totalBytes"] != EXPECTED_MANIFEST_BYTES):
        stop("S-1", "manifest")
    if sha256_file(REPO / "CHECKSUMS.sha256") != EXPECTED_CHECKSUMS:
        stop("S-1", "checksums")
    completion = json.loads((REPO / "qa/completion-validation-report.json").read_text(encoding="utf-8"))
    if sha256_file(REPO / "qa/completion-validation-report.json") != EXPECTED_COMPLETION or not completion.get("passed"):
        stop("S-1", "completion report")
    if sha256_file(REPO / "qa/mvp6_3_landing_receipt.json") != EXPECTED_LANDING:
        stop("S-1", "landing receipt")
    if (sha256_file(REPO / "docs/ARCHITECTURE_MAP.md") != EXPECTED_ARCH
            or (REPO / "docs/ARCHITECTURE_MAP.md").stat().st_size != EXPECTED_ARCH_BYTES):
        stop("S-1", "architecture map")

    pin_results = {}
    for rel, (expected_hash, expected_bytes) in PINS.items():
        path = REPO / rel
        actual_hash = sha256_file(path)
        actual_bytes = path.stat().st_size
        pin_results[rel] = {
            "expectedSha256": expected_hash,
            "actualSha256": actual_hash,
            "expectedBytes": expected_bytes,
            "actualBytes": actual_bytes,
            "match": actual_hash == expected_hash and actual_bytes == expected_bytes,
        }
        if not pin_results[rel]["match"]:
            stop("S-2", f"pin {rel}")

    lines = (REPO / "tools/governed-loop/mvp2.py").read_text(encoding="utf-8").splitlines()
    anchor_results = {}
    for line_no, text in ANCHORS.items():
        actual = lines[line_no - 1]
        anchor_results[str(line_no)] = {"expected": text, "actual": actual, "match": actual == text}
        if actual != text:
            stop("S-3", f"anchor {line_no}")

    sys.path.insert(0, str(REPO / "tools/governed-loop/mvp4/task-b"))
    sys.path.insert(0, str(REPO / "tools/governed-loop/mvp5/task-a"))
    os.environ["GOVERNED_LOOP_SCRATCH"] = str(REPO / "tools/governed-loop")
    os.environ["GOVERNED_LOOP_REPO"] = str(REPO)

    import importlib.util

    def load_module(name, path):
        spec = importlib.util.spec_from_file_location(name, str(path))
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module

    planner_module = load_module(
        "mvp7_task0_planner",
        REPO / "tools/governed-loop/mvp4/task-b/mvp4_symbolic_planner.py")
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
    strong_core = set(out_dist) & set(in_dist)
    strong_core_summary = {
        "reachableNodes": len(out_dist),
        "strongCoreNodes": len(strong_core),
        "oneWayNodes": len(out_dist) - len(strong_core),
        "governedStrongCoreNodes": sum(1 for node in strong_core
                                       if not planner.role.get(int(node.split("@")[0])) == "boundary"),
        "boundaryStrongCoreNodes": sum(1 for node in strong_core
                                       if planner.role.get(int(node.split("@")[0])) == "boundary"),
    }
    if (strong_core_summary["reachableNodes"], strong_core_summary["strongCoreNodes"],
            strong_core_summary["oneWayNodes"]) != (3204, 2928, 276):
        stop("S-4", f"strong core {strong_core_summary}")

    predecl = build_predeclaration()
    PREDECL.write_text(json.dumps(predecl, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    predecl_hash = sha256_file(PREDECL)

    ear = {
        "schemaVersion": "governed-loop.mvp7-ear-baseline.v1",
        "status": "PENDING_HUMAN",
        "signedBy": None,
        "signedAt": None,
        "listener": "Erick (primary)",
        "listener2": None,
        "protocol": predecl["earGate"]["protocol"],
        "wavSha256": predecl["earGate"]["baselineWavSha256"],
        "questions": {f"Q{i}": {"heard": None, "rating": None, "notes": None} for i in range(1, 9)},
        "overallVerdict": None,
        "rule": "The agent must not author or infer listener verdicts. This file stays unsigned until Erick fills it.",
    }
    EAR_SCORECARD.write_text(json.dumps(ear, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    receipt = {
        "schemaVersion": "governed-loop.mvp7-task-0.v1",
        "directive": "MVP7-INTENTION-DIR-1",
        "task": "MVP7-T0",
        "status": "COMPLETE",
        "guardFlags": GUARD,
        "opening": {
            "head": head,
            "treeClean": True,
            "ledgerSha256": EXPECTED_LEDGER,
            "ledgerBytes": ledger_stat.st_size,
            "ledgerLines": line_count,
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
        "anchors": anchor_results,
        "anchorsVerified": sum(1 for row in anchor_results.values() if row["match"]),
        "strongCore": strong_core_summary,
        "predeclaration": {
            "path": "task-0/mvp7_predeclared_bets_and_schema.json",
            "sha256": predecl_hash,
            "status": "locked-before-evaluation",
        },
        "earGate": {
            "status": "PENDING_HUMAN",
            "scorecard": "task-0/ear_baseline_scorecard.json",
            "scorecardSha256": sha256_file(EAR_SCORECARD),
            "signed": False,
        },
        "llmCalls": 0,
        "stopRules": [],
    }
    receipt["floatValues"] = len(find_floats(receipt))
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "COMPLETE",
        "pinsVerified": receipt["pinsVerified"],
        "anchorsVerified": receipt["anchorsVerified"],
        "strongCore": strong_core_summary,
        "predeclarationSha256": predecl_hash,
        "earGate": "PENDING_HUMAN",
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
