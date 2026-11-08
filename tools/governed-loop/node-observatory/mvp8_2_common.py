#!/usr/bin/env python3
"""MVP8.2-OBS-LEDGER-DIR-1 shared scratch helpers.

Read-only against the repository. Everything written lives under the MVP-8.2
scratch realm. Symbolic outputs are int/str/bool only; acoustic lens blocks are
the only float-bearing regions and carry the guard flags.
"""
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

sys.dont_write_bytecode = True

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp8_2_observatory_ledger")

GUARD = {
    "layer": "SPEC-001 \u00a71.3 overlay dynamics + governance ledger specification",
    "causationClaim": False,
    "physicalQuantityClaim": False,
    "tierClassifier": False,
    "globalCHNull": True,
    "gov517_correspondence_claimed": False,
    "still_set_label": "still_set",
    "bipartiteEvidenceStatus": "planning_evidence",
    "bipartiteAdmissionEffect": "none",
    "bipartiteGraphScope": "detached_audit_only",
    "ledgerDefinitionStatus": "proposed",
    "observatoryArtifactClass": "observation_only",
    "llmCalls": 0,
}

EXPECTED = {
    "head": "6bde6a267fe3256d6f5ca52938b00b1d4b38a623",
    "decisionLedger": {
        "path": "provenance/DECISION_LEDGER.md",
        "sha256": "f1446e8181140d6b695280bf2d34fc44832cba9e4ca0b4b27a2105bf49648ed7",
        "bytes": 417658,
        "lines": 4436,
    },
    "observationLedger": {
        "path": "provenance/OBSERVATION_LEDGER.md",
        "sha256": "8e0be9f5bcee0af1aeb87b8ee71fa18121376c1e2b8e23416439c8834e17787f",
        "bytes": 33153,
        "lines": 561,
    },
    "manifest": {
        "path": "MANIFEST.json",
        "sha256": "6e56d32710c9d8bf69ef5b91656074f1ccc3083b0d96cea27e5f082ce72bde88",
        "files": 1894,
        "bytes": 355191,
        "totalBytes": 299622436,
    },
    "checksums": {
        "path": "CHECKSUMS.sha256",
        "sha256": "a116900c357aa2c34a3b921849000115f406ac713e98613e999ac69a6da43962",
        "bytes": 225338,
    },
    "completion": {
        "path": "qa/completion-validation-report.json",
        "sha256": "6b8cbf29d67f8d728f69bccdf84c4ead2689ff2c11a45bbe8f1b16a4a5dff20d",
        "bytes": 4998,
    },
    "landingReceipt": {
        "path": "qa/mvp8_1b_landing_receipt.json",
        "sha256": "ebea2cf3dc67fdcde66f640e26d8d760303f37dcc1a307ada8635bd78d78c8a8",
        "bytes": 29772,
    },
    "architectureMap": {
        "path": "docs/ARCHITECTURE_MAP.md",
        "sha256": "865ab785164f85c0426d849cb3314c8c41efe81155ce14bd7fe6392ca5d0c381",
        "bytes": 34880,
    },
}

PINS = {
    "tools/governed-loop/mvp8/mvp8_common.py": (
        "6027380c377903eb4c5e49481a460bd13fd8216173e4bb9f269cd24f6b60eeb4", 6006),
    "tools/governed-loop/mvp8/task-a/mvp8_pentatonic_lookup_v1.json": (
        "7d4b0548247fac47904860b252951db3810cdacde8fb38f277e2da39b726851f", 34099980),
    "tools/governed-loop/mvp8/task-b/mvp8_pentatonic_q_engine.py": (
        "e9ec9804661a10257d94a1af25fd1c03182bcd6bd4d4f516430ceb6833a54c8f", 20443),
    "tools/governed-loop/mvp8/task-c/mvp8_task_c.py": (
        "8ff0630abae1c4d2fff6e508eae267050a1e7b9833e965ae296d946382e6fd96", 18347),
    "tools/governed-loop/mvp5/task-b/mvp5_audio_renderer.py": (
        "0c917aab7a95851e90ce1c3244ea6b3af1ea35e362262cb0d7a0095ec40b9984", 24696),
    "tools/governed-loop/mvp6_2/task-b/mvp6_2_legato_renderer.py": (
        "e91c6e749b1003da3ad4461b745ad0d35caf23cb394f369d92534d857f6e769c", None),
    "tools/governed-loop/mvp6_3/task-b/mvp6_3_fade_renderer.py": (
        "673ac7083b59ee96f4a0d1f429778ad69ef4dd382f72e2f67bc1e3e7989769de", None),
    "tools/governed-loop/mvp7_intention/task-a/mvp7_log_spectral_lens.py": (
        "6d3b971ab3750871e2f923d62814bc34a0e0563d3ecdf0ffd1d44f700bb0cdd6", None),
}

CASCADE_ARTIFACTS = [
    "canonical/fivefold-incubator/fifth-space-census-v0.json",
    "canonical/fivefold-incubator/shadow-ladder-v0.json",
    "canonical/fivefold-incubator/twin-hub-convergence-v0.json",
    "qa/pentatonic-binding-audit-closure.json",
    "qa/fivefold-engine-promotion-evidence.json",
]

B3_SAMPLE_MASKS = [1387, 1453, 2477, 2741, 1717, 2773, 2869, 2485, 1715, 2765, 1749, 671]
A0_MOON_MASKS = [2485, 2677, 2739, 2741, 2745, 2869, 3253]
B1_SWEEP_MASKS = sorted(set(B3_SAMPLE_MASKS) | set(A0_MOON_MASKS))

PRESET_NODES = [
    "2741@0", "1717@0", "2773@0", "2485@0",
    "2677@0", "2739@0", "2745@0", "2869@0", "3253@0",
    "2363@0", "2365@0",
]

PREDECL = SCRATCH / "task-0" / "mvp8_2_predeclared_bets.json"
EAR_SCORECARD = SCRATCH / "task-0" / "mvp8_2_ear_scorecard.json"


def stop(rule, detail):
    print(f"STOP: {rule} {detail}")
    sys.exit(2)


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def sha256_text(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))


def find_floats(value, path="root"):
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


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, str(path))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_m8():
    """The landed MVP-8 shared helpers (repo copy)."""
    m8_dir = REPO / "tools/governed-loop/mvp8"
    if str(m8_dir) not in sys.path:
        sys.path.insert(0, str(m8_dir))
    import mvp8_common as m8
    return m8


def load_engine():
    """The landed L28 pentatonic-aware Q engine, read-only."""
    tb = REPO / "tools/governed-loop/mvp8/task-b"
    if str(tb) not in sys.path:
        sys.path.insert(0, str(tb))
    from mvp8_pentatonic_q_engine import PentatonicEngine
    return PentatonicEngine()


def load_fade():
    fade_dir = REPO / "tools/governed-loop/mvp6_3/task-b"
    if str(fade_dir) not in sys.path:
        sys.path.insert(0, str(fade_dir))
    return load_module("mvp8_2_fade_renderer", REPO / "tools/governed-loop/mvp6_3/task-b/mvp6_3_fade_renderer.py")


def palettes_and_offices(engine):
    fade = load_fade()
    palettes = fade.base.extract_audio_parameters(REPO / "orrery/src/audio.ts")["offices"]
    office_lookup = {mask: office for mask, office in engine.planner.office.items() if office}
    return fade, palettes, office_lookup


def load_lens():
    return load_module("mvp8_2_lens", REPO / "tools/governed-loop/mvp7_intention/task-a/mvp7_log_spectral_lens.py")


def load_predecl():
    if not PREDECL.exists():
        stop("S-9", f"predeclaration missing: {PREDECL}")
    predecl = json.loads(PREDECL.read_text(encoding="utf-8"))
    if predecl.get("status") != "locked-before-evaluation":
        stop("S-9", "predeclaration not locked")
    return predecl


def write_json(path, obj, floats_allowed=False):
    if not floats_allowed:
        floats = find_floats(obj)
        if floats:
            stop("S-5", f"floats in symbolic receipt: {floats[:5]}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return sha256_file(path)
