from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
from typing import Any

import jsonschema
import pytest
import yaml


ROOT = Path(__file__).resolve().parents[1]
GENERATOR_PATH = ROOT / "scripts/build-fivefold-capability-teleology.py"
VALIDATOR_PATH = ROOT / "scripts/validate-fivefold-capability-teleology.py"
AUTHORED_PATH = ROOT / "schemas/fivefold-capability/fivefold-capability-teleology.yaml"
CANDIDATE_PATH = (
    ROOT
    / "canonical/fivefold-capability-candidates/fivefold-capability-teleology-v1.json"
)
NEGATIVE_PATH = (
    ROOT
    / "canonical/fivefold-capability-candidates/fivefold-capability-teleology-negative-cases-v1.json"
)
CANDIDATE_SCHEMA_PATH = (
    ROOT
    / "schemas/fivefold-capability/fivefold-capability-teleology.schema.json"
)
NEGATIVE_SCHEMA_PATH = (
    ROOT
    / "schemas/fivefold-capability/fivefold-capability-teleology-negative-cases.schema.json"
)
REPORT_SCHEMA_PATH = (
    ROOT
    / "schemas/fivefold-capability/fivefold-capability-teleology-validation-report.schema.json"
)
REPORT_PATH = ROOT / "qa/fivefold-capability-teleology-validation.json"

EXPECTED_PROMOTION_ITEMS = [
    "fivefold_engine.physical_quantity_claim=false",
    "fivefold_engine.pole_order",
    "fivefold_engine.bit_semantics",
    "fivefold_engine.canonical_states",
    "fivefold_engine.canonical_transitions",
    "fivefold_engine.geometry.kappa_formula",
    "fivefold_engine.geometry.paired_mask_hamming_formula",
    "fivefold_engine.geometry.signed_gram_matrix",
    "fivefold_engine.geometry.canonical_path_size",
    "fivefold_engine.guards",
]

EXPECTED_REMAIN_PROPOSED = [
    "fivefold_engine.macro_bracket",
    "fivefold_engine.controller",
    "fivefold_engine.runtime_cycle",
]

FORBIDDEN_IMPORT_TOKENS = (
    "import court_runtime",
    "import court_graph",
    "from src.governor",
    "from governor import",
    "neo4j-bootstrap",
    "graph.runtime",
)


def _load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


GENERATOR = _load_module(GENERATOR_PATH, "fivefold_teleology_generator")
VALIDATOR = _load_module(VALIDATOR_PATH, "fivefold_teleology_validator")


@pytest.fixture(scope="module")
def document() -> dict[str, Any]:
    return json.loads(CANDIDATE_PATH.read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def negative_fixture() -> dict[str, Any]:
    return json.loads(NEGATIVE_PATH.read_text(encoding="utf-8"))


def _sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def test_candidate_is_schema_valid_fresh_and_deterministic(document) -> None:
    first = GENERATOR.build_candidate(ROOT)
    second = GENERATOR.build_candidate(ROOT)
    reordered = GENERATOR.build_candidate(ROOT, reverse_input=True)
    first_bytes = GENERATOR.serialize_candidate(first)
    assert CANDIDATE_PATH.read_bytes() == first_bytes
    assert first_bytes == GENERATOR.serialize_candidate(second)
    assert first_bytes == GENERATOR.serialize_candidate(reordered)
    jsonschema.Draft202012Validator(
        json.loads(CANDIDATE_SCHEMA_PATH.read_text(encoding="utf-8"))
    ).validate(document)
    VALIDATOR.verify_candidate_document(document, ROOT)


def test_authored_yaml_has_no_unqualified_capability_identity() -> None:
    authored = yaml.safe_load(AUTHORED_PATH.read_text(encoding="utf-8"))

    def walk(value: Any, location: str) -> None:
        if isinstance(value, dict):
            for key, item in value.items():
                assert key.lower() != "capability", f"unqualified capability key at {location}"
                walk(item, f"{location}.{key}")
        elif isinstance(value, list):
            for index, item in enumerate(value):
                walk(item, f"{location}[{index}]")

    walk(authored, "root")
    assert authored["metadata"]["admission_status"] == "planning_evidence"
    assert authored["admission_boundary"]["physical_quantity_claim"] is False
    assert authored["compression_coordinate_contract"]["C_H"]["status"] == "unresolved"
    assert authored["compression_coordinate_contract"]["C_H"]["value"] is None


def test_promotion_inventory_replays_verbatim_ten_items(document) -> None:
    replay = document["promotionInventoryReplay"]
    assert replay["eligibleForPromotionAtCrt309"] == EXPECTED_PROMOTION_ITEMS
    assert len(replay["eligibleForPromotionAtCrt309"]) == 10
    assert replay["remainProposed"] == EXPECTED_REMAIN_PROPOSED
    assert replay["role"] == "read_only_evidence_for_crt_348"
    contract = json.loads(
        (ROOT / "schemas/court-admission-contract.json").read_text(encoding="utf-8")
    )
    disposition = contract["fivefoldFieldDisposition"]
    assert replay["eligibleForPromotionAtCrt309"] == disposition[
        "eligibleForPromotionAtCrt309"
    ]
    assert replay["remainProposed"] == disposition["remainProposed"]


def test_five_schools_with_four_binary_poles_and_quintessence_meta(document) -> None:
    schools = document["capabilitySchools"]
    assert len(schools) == 5
    binary = [item for item in schools if item["isBinaryCourtPole"]]
    meta = [item for item in schools if not item["isBinaryCourtPole"]]
    assert len(binary) == 4
    assert len(meta) == 1
    assert meta[0]["element"] == "Quintessence"
    assert meta[0]["courtPoleIndex"] is None
    assert meta[0]["courtPoleRef"] is None
    assert sorted(item["courtPoleIndex"] for item in binary) == [0, 1, 2, 3]
    assert all(item["runtimeEffect"] is False for item in schools)
    assert all(
        item["semanticRelation"] in {"AFFORDS", "AMPLIFIES", "CONSTRAINS", "OPPOSES", "CORRESPONDS_TO"}
        for item in schools
    )


def test_court_parity_replays_source(document) -> None:
    replay = document["courtParityReplay"]
    assert replay["poleOrder"] == ["Mars", "Jupiter", "Venus", "Saturn"]
    assert [item["positionId"] for item in replay["positions"]] == ["C0", "C1", "C2", "C3", "C4"]
    assert [item["poleVector"] for item in replay["positions"]] == [
        "0000",
        "1000",
        "1100",
        "1110",
        "1111",
    ]
    assert replay["positions"][-1]["internalPoles"] == ["Mars", "Jupiter", "Venus", "Saturn"]
    assert replay["operationAllowList"] == ["court:advance", "court:retreat", "court:translocate"]
    assert replay["ordinaryMoveCount"] == 8
    assert replay["kappaFormula"] == "kappa(C_i) = i/4"


def test_mercury_excluded_from_register(document) -> None:
    assert "Mercury" not in document["courtParityReplay"]["poleOrder"]
    assert all(
        "Mercury" not in item["internalPoles"]
        for item in document["courtParityReplay"]["positions"]
    )
    quintessence = next(
        item for item in document["capabilitySchools"] if item["element"] == "Quintessence"
    )
    assert quintessence["isBinaryCourtPole"] is False
    assert quintessence["courtPoleIndex"] is None


def test_zodiac_partition_and_replay(document) -> None:
    facets = document["zodiacFacets"] + document["systemLevelFacets"]
    assert len(facets) == 12
    assert len(document["zodiacFacets"]) == 10
    assert len(document["systemLevelFacets"]) == 2
    system_zodiacs = {item["zodiac"] for item in document["systemLevelFacets"]}
    assert system_zodiacs == {"leo", "cancer"}
    governors = yaml.safe_load(
        (ROOT / "schemas/governors.yaml").read_text(encoding="utf-8")
    )["governors"]
    for item in facets:
        governor_key = item["governorRef"].rsplit(".", 1)[1]
        source = governors[governor_key]["zodiacal_systems"][item["zodiac"]]
        assert source["derives_from"] == item["derivesFrom"]
        field = item["derivesFrom"].rsplit(".", 1)[1]
        assert governors[governor_key]["canonical_expression"][field] == item["sourceVector"]
        assert item["writesCourtPoleDisposition"] is False
        assert item["relationToCourt"] == "authored_correspondence"
        if item["polarity"] == "Internal":
            assert item["t1Relation"]["matches"] is True
            assert item["inversionRelation"]["matches"] is True


def test_forbidden_writes_and_physics_guards(document) -> None:
    assert document["separationContract"]["semanticFieldWritesCourtRegister"] is False
    compression = document["compressionCoordinateContract"]
    assert compression["CH"]["status"] == "unresolved"
    assert compression["CH"]["value"] is None
    assert compression["CP"]["writableByThisRegistry"] is False
    assert compression["CS"]["access"] == "shade_only"
    assert document["admissionBoundary"]["physicalQuantityClaim"] is False
    physical = document["physicalClaimContract"]
    assert physical["noSiUnits"] is True
    assert physical["noElectromagneticEquivalence"] is True
    assert physical["noEnergyEquations"] is True
    assert physical["noPhysicalCausation"] is True
    assert physical["polarityLabels"]["electric"]["status"] == "authored_semantic_correspondence"


def test_win_conditions_are_authored_only(document) -> None:
    wins = document["winConditions"]
    assert len(wins) == 5
    for item in wins:
        assert item["classification"] == "authored_teleology"
        assert item["runtimeEnforced"] is False
        assert item["policyEffect"] is False
        assert item["ledgerSuccessEffect"] is False
        assert item["admissionEffect"] is False
        assert item["containsExecutablePredicate"] is False


def test_active_cross_graph_relations_are_filter_projection_only(document) -> None:
    relations = document["activeCrossGraphRelations"]
    assert relations["declaredActive"] == ["filter_projection"]
    assert relations["declaredInactive"] == ["complement_map", "SUBSET_OF_7_35"]


def test_negative_case_matrix_rejected_with_expected_codes(document, negative_fixture) -> None:
    expected_codes = {item["caseId"]: item["expectedCode"] for item in negative_fixture["cases"]}
    assert tuple(item["caseId"] for item in negative_fixture["cases"]) == VALIDATOR.NEGATIVE_CASE_IDS
    jsonschema.Draft202012Validator(
        json.loads(NEGATIVE_SCHEMA_PATH.read_text(encoding="utf-8"))
    ).validate(negative_fixture)
    mutations = VALIDATOR._mutated_cases(document)
    for case_id, mutated in mutations.items():
        code = VALIDATOR._semantic_rejection_code(mutated, ROOT)
        assert code == expected_codes[case_id], f"{case_id}: {code}"
        with pytest.raises(VALIDATOR.FivefoldTeleologyValidationError) as error:
            VALIDATOR.verify_candidate_document(mutated, ROOT)
        assert error.value.reason_code == expected_codes[case_id]


def test_generator_check_mode_rejects_drift(tmp_path) -> None:
    stale = tmp_path / "stale.json"
    stale.write_text("{}", encoding="utf-8")
    result = subprocess.run(
        [
            sys.executable,
            str(GENERATOR_PATH),
            "--check",
            "--output",
            str(stale),
        ],
        capture_output=True,
        text=True,
    )
    assert result.returncode != 0
    assert "STALE_FIVEFOLD_CAPABILITY_TELEOLOGY" in result.stderr


def test_scripts_import_no_runtime_or_graph_surfaces() -> None:
    for path in (GENERATOR_PATH, VALIDATOR_PATH):
        for line in path.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if not stripped.startswith(("import ", "from ")):
                continue
            assert not any(
                token in line for token in FORBIDDEN_IMPORT_TOKENS
            ), f"{path}:{line}"


def test_qa_report_is_schema_valid_fingerprinted_and_passing() -> None:
    report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
    jsonschema.Draft202012Validator(
        json.loads(REPORT_SCHEMA_PATH.read_text(encoding="utf-8"))
    ).validate(report)
    assert report["verdict"] == "PASS"
    assert report["checksFailed"] == 0
    assert report["checksPassed"] == 22
    assert len(report["checks"]) == 22
    check_ids = tuple(item["checkId"] for item in report["checks"])
    assert check_ids == VALIDATOR.REPORT_CHECK_IDS
    assert check_ids[:8] == (
        "candidate-schema",
        "negative-case-schema",
        "candidate-fingerprint",
        "source-binding-freshness",
        "record-fingerprints",
        "independent-rebuild",
        "build-twice-identity",
        "reordered-input-identity",
    )
    fct_ids = tuple(item for item in check_ids if item.startswith("FCT-"))
    assert fct_ids == tuple(
        f"FCT-{index:03d}-{name}"
        for index, name in enumerate(
            (
                "schema-and-identity",
                "source-bindings",
                "namespace-separation",
                "school-cardinality",
                "court-parity",
                "mercury-exclusion",
                "zodiac-partition",
                "zodiac-replay",
                "forbidden-write-guard",
                "compression-physics-guard",
                "teleology-boundary",
                "determinism-admission-boundary",
            ),
            start=1,
        )
    )
    assert all(
        item["status"] == "PASS" and item["evidenceLocator"] for item in report["checks"]
    )
    core = {key: value for key, value in report.items() if key != "reportFingerprint"}
    assert report["reportFingerprint"] == VALIDATOR._sha256_payload(core)


def test_source_authority_records_planning_evidence_row() -> None:
    text = (ROOT / "provenance/SOURCE_AUTHORITY.md").read_text(encoding="utf-8")
    assert "canonical/fivefold-capability-candidates/fivefold-capability-teleology-v1.json" in text
    assert "CRT-347" in text
    assert "planning_evidence" in text


def test_frozen_fivefold_toolkit_bytes_unchanged() -> None:
    engine_path = (
        ROOT
        / "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/fivefold_engine.yaml"
    )
    digest = _sha256_bytes(engine_path.read_bytes())
    assert digest == "9cbf038c93a72719387e6a8094f5b466a79e61ce03371f5b2334fb26a480b64a"
