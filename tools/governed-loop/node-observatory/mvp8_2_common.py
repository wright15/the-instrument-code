#!/usr/bin/env python3
"""Node Observatory shared helpers (MVP8.4 standalone revision).

Read-only against the repository. Scratch writes resolve to
`GOVERNED_LOOP_SCRATCH` when set, else a system temp directory; the repository
tree is never written. Paths are repository-relative by construction.
"""
import hashlib
import importlib.util
import json
import os
import sys
import tempfile
from pathlib import Path

sys.dont_write_bytecode = True


def _discover_repo():
    env = os.environ.get("SEVEN_GOVERNORS_REPO")
    if env:
        candidate = Path(env).resolve()
        if (candidate / "provenance/DECISION_LEDGER.md").is_file():
            return candidate
        raise RuntimeError(f"SEVEN_GOVERNORS_REPO does not resolve: {candidate}")
    here = Path(__file__).resolve()
    anchors = [here, *here.parents, Path.cwd().resolve(), *Path.cwd().resolve().parents]
    for parent in anchors:
        if (parent / "provenance/DECISION_LEDGER.md").is_file():
            return parent
    raise RuntimeError("repository root not found")


REPO = _discover_repo()
SCRATCH = Path(os.environ.get(
    "GOVERNED_LOOP_SCRATCH",
    Path(tempfile.gettempdir()) / "seven-governors-observatory"))

GUARD = {
    "layer": "SPEC-001 \u00a71.3 overlay dynamics + cadence stride algebra & voice-led rotations",
    "causationClaim": False,
    "physicalQuantityClaim": False,
    "tierClassifier": False,
    "globalCHNull": True,
    "gov517_correspondence_claimed": False,
    "still_set_label": "still_set",
    "bipartiteEvidenceStatus": "planning_evidence",
    "bipartiteAdmissionEffect": "none",
    "bipartiteGraphScope": "detached_audit_only",
    "ledgerDefinitionStatus": "admitted",
    "degreeLadderSpecStatus": "admitted",
    "chaldeanAddressMode": "phase_agnostic_positional_1_to_7",
    "observatoryArtifactClass": "observation_only",
    "llmCalls": 0,
}

EXPECTED = {
    "head": "508f1f510602f97e0cc74b15ee99ed6b683f7fd9",
    "decisionLedger": {
        "path": "provenance/DECISION_LEDGER.md",
        "sha256": "14ebc6f4f7f1edba7a82525e668d8cf30fecf8df8eed4da58f13d57c1881acbb",
        "bytes": 440222,
        "lines": 4517,
    },
    "observationLedger": {
        "path": "provenance/OBSERVATION_LEDGER.md",
        "sha256": "8e0be9f5bcee0af1aeb87b8ee71fa18121376c1e2b8e23416439c8834e17787f",
        "bytes": 33153,
        "lines": 561,
    },
    "manifest": {
        "path": "MANIFEST.json",
        "sha256": "763c8499f78f1ecc693939c0b64aabebf7dce3ad8c68ee86e9d842564870ac89",
        "files": 1997,
        "totalBytes": 302784576,
    },
    "landingReceipt": {
        "path": "qa/l31_governance_admission_receipt.json",
        "sha256": "86d0ed220027f198e69d2d87b3cc04ad2e17a969b5c6542f2312a42b37470f30",
        "bytes": 7887,
    },
    "architectureMap": {
        "path": "docs/ARCHITECTURE_MAP.md",
        "sha256": "865ab785164f85c0426d849cb3314c8c41efe81155ce14bd7fe6392ca5d0c381",
        "bytes": 34880,
    },
    "ledgerSpec": {
        "path": "docs/specs/ledger-formal-definition-v0.1.0.md",
        "sha256": "8b6346abd151a96a8dd6c911317c749e68256e2feb91e72853df023d0f00022f",
        "bytes": 5795,
    },
    "degreeLadderSpec": {
        "path": "docs/specs/degree-ladder-v0.1.0.md",
        "sha256": "7c3c403c9236c21f9c21d23018e6069023318f0bb765315743020cffca2228e6",
        "bytes": 6824,
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
        "e91c6e749b1003da3ad4461b745ad0d35caf23cb394f369d92534d857f6e769c", 8624),
    "tools/governed-loop/mvp6_3/task-b/mvp6_3_fade_renderer.py": (
        "673ac7083b59ee96f4a0d1f429778ad69ef4dd382f72e2f67bc1e3e7989769de", 8145),
    "tools/governed-loop/mvp7_intention/task-a/mvp7_log_spectral_lens.py": (
        "6d3b971ab3750871e2f923d62814bc34a0e0563d3ecdf0ffd1d44f700bb0cdd6", 21956),
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

PREDECL = SCRATCH / "task-0" / "mvp8_4_predeclared_bets.json"
EAR_SCORECARD = SCRATCH / "task-0" / "mvp8_4_ear_scorecard.json"


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
    """The landed pentatonic-aware Q engine, read-only."""
    tb = REPO / "tools/governed-loop/mvp8/task-b"
    if str(tb) not in sys.path:
        sys.path.insert(0, str(tb))
    from mvp8_pentatonic_q_engine import PentatonicEngine
    return PentatonicEngine()


def load_fade():
    fade_dir = str(REPO / "tools/governed-loop/mvp6_3/task-b")
    if fade_dir not in sys.path:
        sys.path.insert(0, fade_dir)
    return load_module("node_observatory_fade_renderer",
                       REPO / "tools/governed-loop/mvp6_3/task-b/mvp6_3_fade_renderer.py")


def palettes_and_offices(engine):
    fade = load_fade()
    palettes = fade.base.extract_audio_parameters(REPO / "orrery/src/audio.ts")["offices"]
    office_lookup = {mask: office for mask, office in engine.planner.office.items() if office}
    return fade, palettes, office_lookup


def load_lens():
    return load_module("node_observatory_lens",
                       REPO / "tools/governed-loop/mvp7_intention/task-a/mvp7_log_spectral_lens.py")


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
