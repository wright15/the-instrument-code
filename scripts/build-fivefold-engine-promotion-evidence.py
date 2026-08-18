#!/usr/bin/env python3
"""Build the CRT-348 Fivefold engine promotion evidence (proposed status)."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
from typing import Any

import jsonschema
import yaml


ROOT = Path(__file__).resolve().parents[1]

SCHEMA_VERSION = "crt-348.fivefold-engine-promotion-evidence.v1"
EVIDENCE_ID = "fivefold-engine-promotion-evidence-v1"
CONTRACT_PATH = "schemas/fivefold-engine-admission-contract.json"
CONTRACT_SCHEMA_PATH = "schemas/fivefold-engine-admission-contract.schema.json"

FROZEN_ENGINE_SHA256 = "9cbf038c93a72719387e6a8094f5b466a79e61ce03371f5b2334fb26a480b64a"
DECISION_LEDGER_SHA256 = "32f08a16eeb4c13187939281621b4085fe377778539cc1268913e3cb285b9bc6"

SOURCE_BINDINGS = (
    ("court-admission-contract", "schemas/court-admission-contract.json", "machine Court authority boundary"),
    ("court-admission-release", "provenance/court-admission-release.json", "current bounded Court admission"),
    ("court-runtime-policy", "schemas/court-runtime-policy.json", "admitted Court runtime policy"),
    ("court-runtime-types-schema", "schemas/court-runtime/court-runtime-types.schema.json", "per-position runtime type pins"),
    ("court-runtime-source", "src/governor/court_runtime.py", "runtime enforcement surface"),
    ("fivefold-engine", "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/fivefold_engine.yaml", "frozen fivefold engine source"),
    ("fivefold-engine-schema", "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/fivefold-engine.schema.json", "toolkit schema pins"),
    ("harmonic-invariant-registry", "seven-governors-harmonic-invariants-v0.1.0/canonical/harmonic-invariant-registry.json", "admitted exact Court geometry"),
)

ZODIAC_NAMES = (
    "Aries", "Scorpio", "Sagittarius", "Pisces", "Libra", "Taurus",
    "Aquarius", "Capricorn", "Gemini", "Virgo", "Leo", "Cancer",
)

EXPECTED_HAMMING_MATRIX = [
    [0, 2, 4, 6, 8],
    [2, 0, 2, 4, 6],
    [4, 2, 0, 2, 4],
    [6, 4, 2, 0, 2],
    [8, 6, 4, 2, 0],
]

EXPECTED_GRAM_MATRIX = [[2, 0, 0, 0], [0, 2, 0, 0], [0, 0, 2, 0], [0, 0, 0, 2]]

EXPECTED_GUARDS = (
    "Ordinary movement is adjacent.",
    "A non-adjacent jump must be expanded or explicitly marked exceptional.",
    "Court state is runtime context, not State Governor identity.",
    "kappa_court is not C_P, C_H, C_S, temperature, entropy, enthalpy, or free energy.",
)

EXPECTED_POLE_ORDER = [
    {
        "governor": "Mars",
        "element": "Fire",
        "function": "energy_modulation",
        "diagnosticQuestion": "How does force enter the pattern?",
    },
    {
        "governor": "Jupiter",
        "element": "Air",
        "function": "direction_and_distribution",
        "diagnosticQuestion": "Where is the flow going?",
    },
    {
        "governor": "Venus",
        "element": "Water",
        "function": "selective_cohesion",
        "diagnosticQuestion": "What enters meaningful relation?",
    },
    {
        "governor": "Saturn",
        "element": "Earth",
        "function": "constraint_and_form",
        "diagnosticQuestion": "What can the flow not do?",
    },
]

EXPECTED_CANONICAL_STATES = [
    {"stateId": "C0", "vector": "0000", "internalPoles": [], "kappaCourt": {"numerator": 0, "denominator": 1}},
    {"stateId": "C1", "vector": "1000", "internalPoles": ["Mars"], "kappaCourt": {"numerator": 1, "denominator": 4}},
    {"stateId": "C2", "vector": "1100", "internalPoles": ["Mars", "Jupiter"], "kappaCourt": {"numerator": 1, "denominator": 2}},
    {"stateId": "C3", "vector": "1110", "internalPoles": ["Mars", "Jupiter", "Venus"], "kappaCourt": {"numerator": 3, "denominator": 4}},
    {"stateId": "C4", "vector": "1111", "internalPoles": ["Mars", "Jupiter", "Venus", "Saturn"], "kappaCourt": {"numerator": 1, "denominator": 1}},
]

EXPECTED_TRANSITIONS = [
    {"transitionId": "court:C0:C1", "from": "C0", "to": "C1", "pole": "Mars"},
    {"transitionId": "court:C1:C2", "from": "C1", "to": "C2", "pole": "Jupiter"},
    {"transitionId": "court:C2:C3", "from": "C2", "to": "C3", "pole": "Venus"},
    {"transitionId": "court:C3:C4", "from": "C3", "to": "C4", "pole": "Saturn"},
]

FORBIDDEN_KAPPA_NAMESPACES = [
    "physical.C_P",
    "harmonic.C_H",
    "semantic.C_S",
    "physical.temperature",
    "physical.entropy",
    "physical.enthalpy",
    "physical.freeEnergy",
]


class PromotionEvidenceBuildError(ValueError):
    """Stable CRT-348 evidence build failure."""


def _sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _check(check_id: str, locator: str, expected: Any, actual: Any) -> dict[str, Any]:
    return {
        "checkId": check_id,
        "locator": locator,
        "expected": expected,
        "actual": actual,
        "pass": actual == expected,
    }


def _group(group_id: str, checks: list[dict[str, Any]], *, key: str = "itemId") -> dict[str, Any]:
    return {
        key: group_id,
        "status": "PASS" if all(check["pass"] for check in checks) else "FAIL",
        "checks": checks,
    }


def _source_bindings(root: Path) -> list[dict[str, str]]:
    records = []
    for binding_id, relative_path, role in SOURCE_BINDINGS:
        records.append(
            {
                "path": relative_path,
                "role": role,
                "sha256": _sha256_bytes((root / relative_path).read_bytes()),
            }
        )
    return sorted(records, key=lambda item: item["path"])


def _load_engine(root: Path) -> dict[str, Any]:
    return yaml.safe_load(
        (
            root
            / "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/fivefold_engine.yaml"
        ).read_text(encoding="utf-8")
    )["fivefold_engine"]


def _load_engine_schema(root: Path) -> dict[str, Any]:
    return _read_json(
        root
        / "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/fivefold-engine.schema.json"
    )


def _load_policy(root: Path) -> dict[str, Any]:
    return _read_json(root / "schemas/court-runtime-policy.json")


def _load_runtime_types_schema(root: Path) -> dict[str, Any]:
    return _read_json(root / "schemas/court-runtime/court-runtime-types.schema.json")


def _load_runtime_source(root: Path) -> str:
    return _read_text(root / "src/governor/court_runtime.py")


def _load_admission_contract(root: Path) -> dict[str, Any]:
    return _read_json(root / "schemas/court-admission-contract.json")


def _load_harmonic_registry(root: Path) -> dict[str, Any]:
    return _read_json(
        root
        / "seven-governors-harmonic-invariants-v0.1.0/canonical/harmonic-invariant-registry.json"
    )


def _load_admission_release(root: Path) -> dict[str, Any]:
    return _read_json(root / "provenance/court-admission-release.json")


def _load_proposed_contract(root: Path) -> dict[str, Any]:
    return _read_json(root / CONTRACT_PATH)


def _load_crt347_candidate(root: Path) -> dict[str, Any]:
    return _read_json(
        root
        / "canonical/fivefold-capability-candidates/fivefold-capability-teleology-v1.json"
    )


def _engine_state_replay(engine: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "stateId": item["state_id"],
            "vector": item["vector"],
            "internalPoles": item["internal_poles"],
            "kappaCourt": _ratio(item["kappa_court"]),
        }
        for item in engine["canonical_states"]
    ]


def _ratio(value: Any) -> dict[str, int]:
    if isinstance(value, dict):
        return {"numerator": value["numerator"], "denominator": value["denominator"]}
    from fractions import Fraction

    fraction = Fraction(value).limit_denominator(4)
    return {"numerator": fraction.numerator, "denominator": fraction.denominator}


def _engine_transition_replay(engine: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "transitionId": item["transition_id"],
            "from": item["from"],
            "to": item["to"],
            "pole": item["pole"],
        }
        for item in engine["canonical_transitions"]
    ]


def _engine_pole_order_replay(engine: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "governor": item["governor"],
            "element": item["element"],
            "function": item["function"],
            "diagnosticQuestion": item["diagnostic_question"],
        }
        for item in engine["pole_order"]
    ]


def _policy_position_replay(policy: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "stateId": item["positionId"],
            "vector": item["poleVector"],
            "internalPoles": item["internalPoles"],
            "kappaCourt": item["kappaCourt"],
        }
        for item in policy["positions"]
    ]


def build_item_evidence(root: Path) -> list[dict[str, Any]]:
    engine = _load_engine(root)
    engine_schema = _load_engine_schema(root)
    policy = _load_policy(root)
    runtime_types = _load_runtime_types_schema(root)
    runtime = _load_runtime_source(root)
    admission_contract = _load_admission_contract(root)
    registry = _load_harmonic_registry(root)
    contract = _load_proposed_contract(root)
    promoted = contract["promotedFields"]

    evidence: list[dict[str, Any]] = []

    evidence.append(
        _group(
            "fivefold_engine.physical_quantity_claim=false",
            [
                _check("engine-value", "fivefold_engine.yaml#physical_quantity_claim", False, engine["physical_quantity_claim"]),
                _check(
                    "toolkit-schema-pin",
                    "fivefold-engine.schema.json#/properties/fivefold_engine/properties/physical_quantity_claim",
                    {"const": False},
                    engine_schema["properties"]["fivefold_engine"]["properties"]["physical_quantity_claim"],
                ),
                _check(
                    "proposed-contract-value",
                    CONTRACT_PATH + "#promotedFields.physicalQuantityClaim.value",
                    False,
                    promoted["physicalQuantityClaim"]["value"],
                ),
            ],
        )
    )

    evidence.append(
        _group(
            "fivefold_engine.pole_order",
            [
                _check("engine-replay", "fivefold_engine.yaml#pole_order", EXPECTED_POLE_ORDER, _engine_pole_order_replay(engine)),
                _check("runtime-policy-pole-order", "court-runtime-policy.json#poleOrder", ["Mars", "Jupiter", "Venus", "Saturn"], policy["poleOrder"]),
                _check(
                    "runtime-enforcement",
                    "src/governor/court_runtime.py",
                    True,
                    'COURT_POLE_ORDER = ("Mars", "Jupiter", "Venus", "Saturn")' in runtime
                    and "court_policy_pole_order_mismatch" in runtime,
                ),
                _check("proposed-contract-replay", CONTRACT_PATH + "#promotedFields.poleOrder", EXPECTED_POLE_ORDER, promoted["poleOrder"]),
            ],
        )
    )

    zodiac_names_in_policy = [name for name in ZODIAC_NAMES if name in json.dumps(policy)]
    evidence.append(
        _group(
            "fivefold_engine.bit_semantics",
            [
                _check(
                    "engine-bit-semantics",
                    "fivefold_engine.yaml#bit_semantics",
                    {"0": "External", "1": "Internal"},
                    engine["bit_semantics"],
                ),
                _check(
                    "runtime-vector-enum",
                    "court-runtime-types.schema.json#/$defs/poleRegister/properties/vector",
                    ["0000", "1000", "1100", "1110", "1111"],
                    runtime_types.get("$defs", {}).get("poleRegister", {}).get("properties", {}).get("vector", {}).get("enum"),
                ),
                _check(
                    "runtime-bit-derivation",
                    "src/governor/court_runtime.py#PoleRegister",
                    True,
                    'if bit == "1"' in runtime and "court_internal_poles_mismatch" in runtime,
                ),
                _check(
                    "zodiac-signs-excluded",
                    CONTRACT_PATH + "#promotedFields.bitSemantics.zodiacSignNames",
                    "excluded",
                    promoted["bitSemantics"]["zodiacSignNames"],
                ),
                _check(
                    "policy-contains-no-zodiac-signs",
                    "schemas/court-runtime-policy.json",
                    [],
                    zodiac_names_in_policy,
                ),
            ],
        )
    )

    evidence.append(
        _group(
            "fivefold_engine.canonical_states",
            [
                _check("engine-replay", "fivefold_engine.yaml#canonical_states", EXPECTED_CANONICAL_STATES, _engine_state_replay(engine)),
                _check("runtime-policy-replay", "court-runtime-policy.json#positions", EXPECTED_CANONICAL_STATES, _policy_position_replay(policy)),
                _check("proposed-contract-replay", CONTRACT_PATH + "#promotedFields.canonicalStates", EXPECTED_CANONICAL_STATES, promoted["canonicalStates"]),
                _check(
                    "runtime-vector-enforcement",
                    "src/governor/court_runtime.py",
                    True,
                    'COURT_POLE_VECTORS = ("0000", "1000", "1100", "1110", "1111")' in runtime,
                ),
            ],
        )
    )

    ordinary_moves = policy["ordinaryMoves"]
    adjacent_pairs = {
        (item["from"], item["to"]) for item in _engine_transition_replay(engine)
    }
    advance_pairs = {
        (item["source"], item["target"]) for item in ordinary_moves if item["operationId"] == "court:advance"
    }
    retreat_pairs = {
        (item["source"], item["target"]) for item in ordinary_moves if item["operationId"] == "court:retreat"
    }
    retreat_expected = {(target, source) for source, target in adjacent_pairs}
    evidence.append(
        _group(
            "fivefold_engine.canonical_transitions",
            [
                _check("engine-replay", "fivefold_engine.yaml#canonical_transitions", EXPECTED_TRANSITIONS, _engine_transition_replay(engine)),
                _check("ordinary-advance-pairs", "court-runtime-policy.json#ordinaryMoves", sorted(adjacent_pairs), sorted(advance_pairs)),
                _check("ordinary-retreat-pairs", "court-runtime-policy.json#ordinaryMoves", sorted(retreat_expected), sorted(retreat_pairs)),
                _check(
                    "runtime-adjacency-enforcement",
                    "src/governor/court_runtime.py",
                    True,
                    "court_policy_move_not_adjacent" in runtime,
                ),
                _check("proposed-contract-replay", CONTRACT_PATH + "#promotedFields.canonicalTransitions", EXPECTED_TRANSITIONS, promoted["canonicalTransitions"]),
            ],
        )
    )

    kappa_values = [
        _ratio(item["kappa_court"]) for item in engine["canonical_states"]
    ]
    evidence.append(
        _group(
            "fivefold_engine.geometry.kappa_formula",
            [
                _check("engine-formula", "fivefold_engine.yaml#geometry.kappa_formula", "kappa(C_i) = i/4", engine["geometry"]["kappa_formula"]),
                _check(
                    "admission-contract-derivation",
                    "court-admission-contract.json#compressionCoordinate.derivation",
                    "kappa(C_i) = i/4",
                    admission_contract["compressionCoordinate"]["derivation"],
                ),
                _check(
                    "admission-contract-values",
                    "court-admission-contract.json#compressionCoordinate.values",
                    kappa_values,
                    [_ratio(item) for item in admission_contract["compressionCoordinate"]["values"]],
                ),
                _check(
                    "policy-forbidden-namespaces",
                    "court-runtime-policy.json#forbiddenKappaNamespaces",
                    FORBIDDEN_KAPPA_NAMESPACES,
                    policy["forbiddenKappaNamespaces"],
                ),
                _check(
                    "runtime-exact-ratio",
                    "src/governor/court_runtime.py#COURT_KAPPA",
                    True,
                    "COURT_KAPPA = ((0, 1), (1, 4), (1, 2), (3, 4), (1, 1))" in runtime,
                ),
                _check("harmonic-registry-kappa", "harmonic-invariant-registry.json#courtGeometry.kappaCourt", kappa_values, [_ratio(item) for item in registry["courtGeometry"]["kappaCourt"]]),
            ],
        )
    )

    registry_invariant_ids = {
        item["invariantId"] for item in registry.get("invariants", [])
    }
    evidence.append(
        _group(
            "fivefold_engine.geometry.paired_mask_hamming_formula",
            [
                _check("engine-formula", "fivefold_engine.yaml#geometry.paired_mask_hamming_formula", "d_H(C_i,C_j) = 2*abs(i-j)", engine["geometry"]["paired_mask_hamming_formula"]),
                _check("harmonic-registry-matrix", "harmonic-invariant-registry.json#courtGeometry.hammingMatrix", EXPECTED_HAMMING_MATRIX, registry["courtGeometry"]["hammingMatrix"]),
                _check("hamming-invariant-admitted", "harmonic-invariant-registry.json#court.hamming_path", True, "court.hamming_path" in registry_invariant_ids),
            ],
        )
    )

    evidence.append(
        _group(
            "fivefold_engine.geometry.signed_gram_matrix",
            [
                _check("engine-matrix", "fivefold_engine.yaml#geometry.signed_gram_matrix", "2*I_4", engine["geometry"]["signed_gram_matrix"]),
                _check("harmonic-registry-matrix", "harmonic-invariant-registry.json#courtGeometry.gramMatrix", EXPECTED_GRAM_MATRIX, registry["courtGeometry"]["gramMatrix"]),
                _check("gram-invariant-admitted", "harmonic-invariant-registry.json#court.gram_matrix", True, "court.gram_matrix" in registry_invariant_ids),
            ],
        )
    )

    engine_schema_states = engine_schema["properties"]["fivefold_engine"]["properties"]["canonical_states"]
    evidence.append(
        _group(
            "fivefold_engine.geometry.canonical_path_size",
            [
                _check("engine-value", "fivefold_engine.yaml#geometry.canonical_path_size", 5, engine["geometry"]["canonical_path_size"]),
                _check("policy-position-count", "court-runtime-policy.json#positions.length", 5, len(policy["positions"])),
                _check("policy-ordinary-move-count", "court-runtime-policy.json#ordinaryMoves.length", 8, len(policy["ordinaryMoves"])),
                _check("toolkit-schema-pin", "fivefold-engine.schema.json#canonical_states", {"type": "array", "minItems": 5, "maxItems": 5}, engine_schema_states),
            ],
        )
    )

    contract_non_equivalence = [
        item.get("nonEquivalence") for item in admission_contract["namespaceRules"]
    ]
    evidence.append(
        _group(
            "fivefold_engine.guards",
            [
                _check("engine-guard-literals", "fivefold_engine.yaml#guards", list(EXPECTED_GUARDS), engine["guards"]),
                _check("adjacency-guard-enforced", "src/governor/court_runtime.py", True, "court_policy_move_not_adjacent" in runtime),
                _check("exceptional-jump-guard-enforced", "src/governor/court_runtime.py", True, "court_policy_translocation_evidence_mismatch" in runtime),
                _check(
                    "identity-guard-enforced",
                    "court-admission-contract.json#namespaceRules",
                    True,
                    any(
                        "topology.scaleState" in (item or []) and "court.state" in [entry["namespace"] for entry in admission_contract["namespaceRules"]]
                        for item in contract_non_equivalence
                    ),
                ),
                _check("kappa-guard-enforced", "court-runtime-policy.json#forbiddenKappaNamespaces", FORBIDDEN_KAPPA_NAMESPACES, policy["forbiddenKappaNamespaces"]),
                _check("proposed-contract-guards", CONTRACT_PATH + "#promotedFields.guards", list(EXPECTED_GUARDS), [item["guardLiteral"] for item in promoted["guards"]]),
            ],
        )
    )

    return evidence


def build_exclusion_evidence(root: Path) -> list[dict[str, Any]]:
    admission_contract = _load_admission_contract(root)
    admission_release = _load_admission_release(root)
    contract = _load_proposed_contract(root)
    crt347 = _load_crt347_candidate(root)
    policy = _load_policy(root)
    backlog = _read_json(root / "provenance/pentatonic-set-class-admission-backlog.json")
    phase2 = _read_json(root / "qa/pentatonic-binding-audit-neo4j-validation.json")
    ledger_text = (root / "provenance/DECISION_LEDGER.md").read_text(encoding="utf-8")
    engine_digest = _sha256_bytes(
        (
            root
            / "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/fivefold_engine.yaml"
        ).read_bytes()
    )

    source_disposition = admission_contract["fivefoldFieldDisposition"]
    exclusions: list[dict[str, Any]] = []

    exclusions.append(
        _group(
            "fivefold_engine.macro_bracket/controller/runtime_cycle remain proposed",
            [
                _check(
                    "contract-remain-proposed",
                    CONTRACT_PATH + "#remainProposed",
                    source_disposition["remainProposed"],
                    contract["remainProposed"],
                ),
                _check(
                    "source-inventory-verbatim",
                    "court-admission-contract.json#eligibleForPromotionAtCrt309",
                    source_disposition["eligibleForPromotionAtCrt309"],
                    contract["promotionInventory"],
                ),
            ],
            key="exclusionId",
        )
    )

    exclusions.append(
        _group(
            "win-condition enforcement",
            [
                _check(
                    "crt347-win-conditions-authored-only",
                    "canonical/fivefold-capability-candidates/fivefold-capability-teleology-v1.json#winConditions",
                    True,
                    all(
                        item["runtimeEnforced"] is False
                        and item["policyEffect"] is False
                        and item["ledgerSuccessEffect"] is False
                        for item in crt347["winConditions"]
                    ),
                ),
            ],
            key="exclusionId",
        )
    )

    zodiac_names_in_policy = [name for name in ZODIAC_NAMES if name in json.dumps(policy)]
    exclusions.append(
        _group(
            "zodiac-to-Court runtime binding",
            [
                _check(
                    "no-zodiac-signs-in-runtime-policy",
                    "schemas/court-runtime-policy.json",
                    [],
                    zodiac_names_in_policy,
                ),
            ],
            key="exclusionId",
        )
    )

    exclusions.append(
        _group(
            "concurrent Governor/Court transition envelope",
            [
                _check(
                    "operation-allow-list-bounded",
                    "court-runtime-policy.json#operationAllowList",
                    ["court:advance", "court:retreat", "court:translocate"],
                    policy["operationAllowList"],
                ),
                _check(
                    "no-composite-transition-envelope",
                    "court-runtime-policy.json",
                    True,
                    "envelope" not in policy and "transitionEnvelope" not in policy,
                ),
            ],
            key="exclusionId",
        )
    )

    exclusions.append(
        _group(
            "electromagnetic or thermodynamic physical claims",
            [
                _check(
                    "contract-physical-claim-false",
                    CONTRACT_PATH + "#effectBoundary.physicalQuantityClaim",
                    False,
                    contract["effectBoundary"]["physicalQuantityClaim"],
                ),
            ],
            key="exclusionId",
        )
    )

    exclusions.append(
        _group(
            "active complement relation",
            [
                _check(
                    "complement-map-unclaimed",
                    "provenance/court-admission-release.json#projectionRuling.explicitlyNotClaimed",
                    True,
                    "ComplementMap" in admission_release["projectionRuling"]["explicitlyNotClaimed"],
                ),
            ],
            key="exclusionId",
        )
    )

    exclusions.append(
        _group(
            "active SUBSET_OF_7_35 projection",
            [
                _check(
                    "detached-audit-scope",
                    "qa/pentatonic-binding-audit-neo4j-validation.json#graphScope",
                    "detached_audit_only",
                    phase2.get("graphScope"),
                ),
            ],
            key="exclusionId",
        )
    )

    exclusions.append(
        _group(
            "bulk availability of unadmitted pentatonic classes",
            [
                _check(
                    "proposed-class-count-unchanged",
                    "provenance/court-admission-release.json#proposedScope.pentatonicSetClassCount",
                    35,
                    admission_release["proposedScope"]["pentatonicSetClassCount"],
                ),
            ],
            key="exclusionId",
        )
    )

    summary = backlog.get("summary", {})
    exclusions.append(
        _group(
            "CRT-310 gate satisfaction",
            [
                _check(
                    "backlog-summary-unchanged",
                    "provenance/pentatonic-set-class-admission-backlog.json#summary",
                    {
                        "itemCount": 35,
                        "proposedCount": 35,
                        "eligibleForAdmissionReviewCount": 0,
                        "admittedCount": 0,
                    },
                    {
                        key: summary.get(key)
                        for key in (
                            "itemCount",
                            "proposedCount",
                            "eligibleForAdmissionReviewCount",
                            "admittedCount",
                        )
                    },
                ),
                _check(
                    "bulk-promotion-not-allowed",
                    "provenance/pentatonic-set-class-admission-backlog.json#bulkPromotionAllowed",
                    False,
                    backlog.get("bulkPromotionAllowed"),
                ),
            ],
            key="exclusionId",
        )
    )

    exclusions.append(
        _group(
            "frozen fivefold toolkit unchanged",
            [
                _check(
                    "frozen-engine-digest",
                    "fivefold_engine.yaml",
                    FROZEN_ENGINE_SHA256,
                    engine_digest,
                ),
            ],
            key="exclusionId",
        )
    )

    exclusions.append(
        _group(
            "decision ledger CRT-348 amendment recorded",
            [
                _check(
                    "ledger-contains-crt-348-entry",
                    "provenance/DECISION_LEDGER.md",
                    True,
                    "Fivefold engine promotion admission (CRT-348)" in ledger_text,
                ),
                _check(
                    "decision-ledger-digest",
                    "provenance/DECISION_LEDGER.md",
                    DECISION_LEDGER_SHA256,
                    _sha256_bytes((root / "provenance/DECISION_LEDGER.md").read_bytes()),
                ),
            ],
            key="exclusionId",
        )
    )

    return exclusions


def _require_intrinsic_json(value: Any) -> None:
    if value is None or isinstance(value, (str, bool)) or type(value) is int:
        return
    if isinstance(value, float):
        raise TypeError("non_integral_number_not_allowed")
    if isinstance(value, (list, tuple)):
        for item in value:
            _require_intrinsic_json(item)
        return
    if isinstance(value, dict):
        for item in value.values():
            _require_intrinsic_json(item)
        return
    raise TypeError(f"unsupported_json_type:{type(value).__name__}")


def _canonical_bytes(value: Any) -> bytes:
    _require_intrinsic_json(value)
    return json.dumps(
        value,
        ensure_ascii=False,
        allow_nan=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")


def _sha256_payload(value: Any) -> str:
    return _sha256_bytes(_canonical_bytes(value))


def build_evidence(root: Path = ROOT) -> dict[str, Any]:
    source_bindings = _source_bindings(root)
    contract = _load_proposed_contract(root)
    jsonschema.Draft202012Validator(_read_json(root / CONTRACT_SCHEMA_PATH)).validate(contract)
    item_evidence = build_item_evidence(root)
    exclusion_evidence = build_exclusion_evidence(root)
    all_checks = item_evidence + exclusion_evidence
    verdict = "PASS" if all(item["status"] == "PASS" for item in all_checks) else "FAIL"
    core = {
        "schemaVersion": SCHEMA_VERSION,
        "evidenceId": EVIDENCE_ID,
        "admissionStatus": "admitted",
        "contractPath": CONTRACT_PATH,
        "contractSha256": _sha256_bytes((root / CONTRACT_PATH).read_bytes()),
        "contractSchemaValid": True,
        "verdict": verdict,
        "sourceBindings": source_bindings,
        "itemEvidence": item_evidence,
        "exclusionEvidence": exclusion_evidence,
    }
    document = {**core, "evidenceFingerprint": _sha256_payload(core)}
    if _source_bindings(root) != source_bindings:
        raise PromotionEvidenceBuildError("source_changed_during_build")
    return document


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        type=Path,
        default=ROOT / "qa/fivefold-engine-promotion-evidence.json",
    )
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    document = build_evidence(ROOT)
    payload = _canonical_bytes(document) + b"\n"
    if args.check:
        if not args.output.is_file() or args.output.read_bytes() != payload:
            raise SystemExit("STALE_FIVEFOLD_ENGINE_PROMOTION_EVIDENCE")
    else:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_bytes(payload)
    print(
        json.dumps(
            {
                "evidenceId": document["evidenceId"],
                "evidenceFingerprint": document["evidenceFingerprint"],
                "itemEvidenceCount": len(document["itemEvidence"]),
                "exclusionEvidenceCount": len(document["exclusionEvidence"]),
                "verdict": document["verdict"],
            },
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
