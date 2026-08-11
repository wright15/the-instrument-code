"""Deterministic builder for the CRT-303 invariant registry."""

from __future__ import annotations

from fractions import Fraction
import json
from pathlib import Path
from typing import Any

from .canonical import canonical_json_bytes, compact_json_bytes, sha256_bytes, sha256_file
from .carey import evaluate_carey_535
from .court import (
    court_kappa,
    signed_transition_vector,
    verify_court_gram,
    verify_disjoint_supports,
    verify_hamming_path,
    verify_weight_five,
)


PACKAGE_ROOT = Path(__file__).resolve().parents[2]
INTEGRATED_ROOT = PACKAGE_ROOT.parent
OUTPUT_NAMES = (
    "carey-5-35.json",
    "compression-namespace-guard.json",
    "court-geometry.json",
    "harmonic-invariant-registry.json",
)


def _load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _ratio(value: Fraction) -> dict[str, int]:
    return {"numerator": value.numerator, "denominator": value.denominator}


def _carey_dict(enumeration: object) -> dict[str, object]:
    return {
        "tuning": "12-TET",
        "generator": {"numerator": 7, "denominator": 12},
        "forteNumber": "5-35",
        "seedPitchClasses": list(enumeration.pitch_classes),
        "intervalInstances": list(enumeration.interval_instances),
        "differenceWitnesses": list(enumeration.difference_witnesses),
        "ambiguityWitnesses": list(enumeration.ambiguity_witnesses),
        "contradictionWitnesses": list(enumeration.contradiction_witnesses),
        "counts": {
            "intervalInstances": len(enumeration.interval_instances),
            "differenceSlots": enumeration.difference_slots,
            "differences": enumeration.difference_count,
            "failureSlots": enumeration.failure_slots,
            "ambiguities": enumeration.ambiguity_count,
            "contradictions": enumeration.contradiction_count,
            "failures": enumeration.failure_count,
            "crossGenericComparisons": enumeration.cross_generic_comparisons,
        },
        "CQ": _ratio(enumeration.coherence_quotient),
        "SQ": _ratio(enumeration.sameness_quotient),
        "tolerance": {"numerator": 0, "denominator": 1},
    }


def _provenance(
    definition: dict[str, object], source_hash_by_path: dict[str, str]
) -> list[dict[str, object]]:
    if "externalDoi" in definition:
        return [
            {
                "sourceType": "external_doi",
                "path": None,
                "sha256": None,
                "pointer": "Carey 2007 formal CQ/SQ source",
                "doi": definition["externalDoi"],
            }
        ]
    source_path = str(definition["sourcePath"])
    return [
        {
            "sourceType": "local_document",
            "path": source_path,
            "sha256": source_hash_by_path[source_path],
            "pointer": definition["sourcePointer"],
            "doi": None,
        }
    ]


def build_release(*, reverse_input_order: bool = False) -> dict[str, object]:
    input_path = PACKAGE_ROOT / "source/invariant-input.json"
    authored = _load_json(input_path)
    source_paths = list(authored["sourcePaths"])
    definitions = list(authored["invariantDefinitions"])
    if reverse_input_order:
        source_paths.reverse()
        definitions.reverse()

    substrate_path = INTEGRATED_ROOT / authored["substratePath"]
    substrate = _load_json(substrate_path)
    substrate_core = {
        key: value for key, value in substrate.items() if key != "substrateFingerprint"
    }
    if sha256_bytes(compact_json_bytes(substrate_core)) != substrate["substrateFingerprint"]:
        raise ValueError("substrate_fingerprint_mismatch")
    if substrate["releaseId"] != "court-substrate:0.1.0":
        raise ValueError("substrate_release_id_mismatch")

    positions = sorted(substrate["courtRootedPositions"], key=lambda item: item["positionId"])
    position_ids = [position["positionId"] for position in positions]
    position_masks = [position["pitchMask"] for position in positions]
    vectors = [
        signed_transition_vector(position_masks[index], position_masks[index + 1])
        for index in range(4)
    ]
    gram = verify_court_gram(vectors)
    hamming = verify_hamming_path(position_masks)
    supports = verify_disjoint_supports(
        position["xorSupportFromPrevious"] for position in positions[1:]
    )
    weights = verify_weight_five(position_masks)
    kappas = tuple(court_kappa(index) for index in range(5))
    recorded_kappas = tuple(
        Fraction(
            position["kappaCourt"]["numerator"],
            position["kappaCourt"]["denominator"],
        )
        for position in positions
    )
    if recorded_kappas != kappas:
        raise ValueError("court_kappa_substrate_mismatch")
    court_geometry = {
        "positionIds": position_ids,
        "positionMasks": position_masks,
        "signedTransitionVectors": [list(vector) for vector in vectors],
        "gramMatrix": [list(row) for row in gram],
        "hammingMatrix": [list(row) for row in hamming],
        "xorSupports": [list(support) for support in supports],
        "weights": list(weights),
        "kappaCourt": [_ratio(value) for value in kappas],
    }

    generated_seed = sorted((7 * index) % 12 for index in range(5))
    if generated_seed != [0, 2, 4, 7, 9] or generated_seed != positions[0]["pitchClasses"]:
        raise ValueError("carey_generator_seed_mismatch")
    carey = evaluate_carey_535(generated_seed)
    for position in positions:
        mode_result = evaluate_carey_535(position["pitchClasses"])
        if (
            mode_result.difference_count,
            mode_result.ambiguity_count,
            mode_result.contradiction_count,
        ) != (20, 0, 0):
            raise ValueError(f"carey_mode_enumeration_mismatch:{position['positionId']}")
    carey535 = _carey_dict(carey)

    source_hashes = sorted(
        [
            {"path": source_path, "sha256": sha256_file(INTEGRATED_ROOT / source_path)}
            for source_path in source_paths
        ]
        + [
            {
                "path": "seven-governors-harmonic-invariants-v0.1.0/source/invariant-input.json",
                "sha256": sha256_file(input_path),
            }
        ],
        key=lambda item: item["path"],
    )
    source_hash_by_path = {item["path"]: item["sha256"] for item in source_hashes}
    source_fingerprint = sha256_bytes(compact_json_bytes(source_hashes))
    values = {
        "court.gram_matrix": court_geometry["gramMatrix"],
        "court.hamming_path": court_geometry["hammingMatrix"],
        "court.disjoint_xor_supports": court_geometry["xorSupports"],
        "court.weight_five": court_geometry["weights"],
        "court.kappa_exact": court_geometry["kappaCourt"],
        "carey.coherence_quotient_5_35": carey535["CQ"],
        "carey.sameness_quotient_5_35": carey535["SQ"],
        "harmonic.aggregate_C_H_guard": authored["compressionGuard"],
    }
    invariants = sorted(
        [
            {
                "invariantId": definition["invariantId"],
                "kind": definition["kind"],
                "status": (
                    "unresolved_guarded"
                    if definition["invariantId"] == "harmonic.aggregate_C_H_guard"
                    else "proven"
                ),
                "value": values[definition["invariantId"]],
                "diagnostics": [],
                "provenance": _provenance(definition, source_hash_by_path),
            }
            for definition in definitions
        ],
        key=lambda item: item["invariantId"],
    )
    release_core = {
        "schemaVersion": "1.0.0",
        "packageId": authored["packageId"],
        "packageVersion": authored["packageVersion"],
        "releaseId": authored["releaseId"],
        "integratedAdmission": authored["integratedAdmission"],
        "substrateDependency": {
            "path": authored["substratePath"],
            "releaseId": substrate["releaseId"],
            "substrateFingerprint": substrate["substrateFingerprint"],
        },
        "sourceHashes": source_hashes,
        "sourceFingerprint": source_fingerprint,
        "compressionGuard": authored["compressionGuard"],
        "courtGeometry": court_geometry,
        "carey535": carey535,
        "invariants": invariants,
        "summary": {
            "invariantCount": len(invariants),
            "provenCount": sum(item["status"] == "proven" for item in invariants),
            "unresolvedGuardCount": sum(
                item["status"] == "unresolved_guarded" for item in invariants
            ),
            "careyDifferenceWitnessCount": len(carey535["differenceWitnesses"]),
            "careyFailureWitnessCount": len(carey535["ambiguityWitnesses"])
            + len(carey535["contradictionWitnesses"]),
        },
    }
    return {
        **release_core,
        "invariantFingerprint": sha256_bytes(compact_json_bytes(release_core)),
    }


def _view(release: dict[str, object], key: str) -> dict[str, object]:
    return {
        "schemaVersion": release["schemaVersion"],
        "releaseId": release["releaseId"],
        "integratedAdmission": release["integratedAdmission"],
        "substrateDependency": release["substrateDependency"],
        "sourceFingerprint": release["sourceFingerprint"],
        "invariantFingerprint": release["invariantFingerprint"],
        key: release[key],
    }


def build_artifacts(*, reverse_input_order: bool = False) -> dict[str, bytes]:
    release = build_release(reverse_input_order=reverse_input_order)
    return {
        "harmonic-invariant-registry.json": canonical_json_bytes(release),
        "court-geometry.json": canonical_json_bytes(_view(release, "courtGeometry")),
        "carey-5-35.json": canonical_json_bytes(_view(release, "carey535")),
        "compression-namespace-guard.json": canonical_json_bytes(
            _view(release, "compressionGuard")
        ),
    }
