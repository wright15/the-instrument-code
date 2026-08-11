"""Deterministic CRT-304 release builder."""

from __future__ import annotations

import csv
import io
import json
from dataclasses import asdict
from pathlib import Path
from typing import Any

from .algebra import CourtFilterOperator, apply_admitted_mutation, apply_filter, evaluate_commutation
from .canonical import canonical_json_bytes, compact_json_bytes, sha256_bytes, sha256_file


PACKAGE_ROOT = Path(__file__).resolve().parents[2]
INTEGRATED_ROOT = PACKAGE_ROOT.parent
OUTPUT_NAMES = (
    "filter-algebra-release.json",
    "filter-operator-registry.json",
    "bridge-route-comparison.json",
    "commutation-table.json",
    "non-commutation-records.json",
)
CLASSIFICATIONS = ("commutes", "does_not_commute", "left_undefined", "right_undefined", "both_undefined")


def _load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _pitch_classes(mask: int) -> list[int]:
    return [pitch for pitch in range(12) if mask & (1 << pitch)]


def _read_csv(path: Path) -> list[dict[str, str]]:
    return list(csv.DictReader(io.StringIO(path.read_text(encoding="utf-8"))))


def _verify_dependencies(authored: dict[str, Any]) -> dict[str, Any]:
    loaded = {}
    for dependency in authored["dependencies"]:
        path = INTEGRATED_ROOT / dependency["path"]
        actual_hash = sha256_file(path)
        if actual_hash != dependency["sha256"]:
            raise ValueError(f"dependency_hash_mismatch:{dependency['dependencyId']}")
        if path.suffix == ".json":
            value = _load_json(path)
            if dependency["releaseId"] is not None:
                actual_release = value.get("releaseId", value.get("contractId"))
                if actual_release != dependency["releaseId"]:
                    raise ValueError(f"dependency_release_mismatch:{dependency['dependencyId']}")
            if dependency["fingerprintField"] is not None and value.get(dependency["fingerprintField"]) != dependency["fingerprint"]:
                raise ValueError(f"dependency_fingerprint_mismatch:{dependency['dependencyId']}")
            loaded[dependency["dependencyId"]] = value
    return loaded


def _operator_theory(filter_id: str, set_class_id: str, mask: int, admission: str) -> dict[str, Any]:
    operator = CourtFilterOperator(filter_id, "linear_diagonal", mask, set_class_id)
    return {
        "filterId": operator.filter_id,
        "filterType": operator.filter_type,
        "admission": admission,
        "setClassId": set_class_id,
        "mask": mask,
        "pitchClasses": _pitch_classes(mask),
        "fixedRootPc": 0,
        "domain": {
            "ambient": "binary_vector_12",
            "maskRange": [0, 4095],
            "coordinateSemantics": "fixed_root_pitch_class_coordinates"
        },
        "image": {
            "ambient": "binary_vector_12",
            "definition": "support_subsets_of_c",
            "condition": "output AND NOT c = 0"
        },
        "inverse": {
            "global": "none",
            "globalReason": "non_injective_projection",
            "restrictionToImage": "identity"
        },
        "commutation": {
            "evaluator": "evaluate_commutation",
            "resultSpace": list(CLASSIFICATIONS),
            "leftRoute": "P_c(T(x))",
            "rightRoute": "T(P_c(x))"
        },
        "exactHarmonicDelta": "source_weight_minus_retained_weight",
        "preservationInvariants": [
            "output_subset_of_source",
            "output_subset_of_filter",
            "idempotent",
            "retained_weight_equals_popcount_source_and_filter"
        ],
        "authorizedTransforms": ["court.filter.projection"],
        "forbiddenWrites": [
            "ScaleState.office",
            "OCCUPIES_OFFICE",
            "mutation.degreeGovernor",
            "mutation.sourceState",
            "mutation.targetState"
        ],
        "validationTests": [
            "ambient_range",
            "fixed_root_weight_five",
            "subset_invariants",
            "idempotence",
            "retained_weight",
            "commutation_coverage"
        ]
    }


def _filters(substrate: dict[str, Any]) -> tuple[list[CourtFilterOperator], list[dict[str, Any]]]:
    rows = []
    for position in sorted(substrate["courtRootedPositions"], key=lambda item: item["positionId"]):
        rows.append(_operator_theory(f"court-filter:{position['positionId']}", position["setClassId"], position["pitchMask"], "admitted"))
    for bridge in sorted(substrate["bridgeRootings"], key=lambda item: item["setClassId"]):
        suffix = bridge["setClassId"].split(":", 1)[1]
        rows.append(_operator_theory(f"court-filter:{suffix}:root-0", bridge["setClassId"], bridge["pitchMask"], "admitted_bridge"))
    operators = [CourtFilterOperator(row["filterId"], "linear_diagonal", row["mask"], row["setClassId"]) for row in rows]
    return operators, rows


def _state(record: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": record["id"],
        "name": record["name"],
        "forte": record["forte"],
        "pitchMask": record["id"],
        "pitchClasses": _pitch_classes(record["id"]),
    }


def _bridge_comparison(filters_by_mask: dict[int, CourtFilterOperator], states: dict[int, dict[str, Any]]) -> dict[str, Any]:
    source = states[1453]
    target = states[2477]
    route_specs = (
        (173, [
            {"degree": 6, "degreeGovernor": "Mercury"},
            {"degree": 7, "degreeGovernor": "Moon"},
        ], "retains Degree 2 / Jupiter at pitch class 2 while suppressing Degree 6 / Mercury at pitch class 8"),
        (425, [
            {"degree": 2, "degreeGovernor": "Jupiter"},
            {"degree": 7, "degreeGovernor": "Moon"},
        ], "retains Degree 6 / Mercury at pitch class 8 while suppressing Degree 2 / Jupiter at pitch class 2"),
    )
    routes = []
    for mask, hidden_addresses, distinction in route_specs:
        operator = filters_by_mask[mask]
        source_application = apply_filter(operator, source["id"])
        target_application = apply_filter(operator, target["id"])
        routes.append({
            "filterId": operator.filter_id,
            "filterMask": mask,
            "retainedPitchClasses": {
                "source": _pitch_classes(source_application.output_mask),
                "target": _pitch_classes(target_application.output_mask),
            },
            "omittedPitchClasses": {
                "source": _pitch_classes(source["id"] & ~mask),
                "target": _pitch_classes(target["id"] & ~mask),
            },
            "distinctExposedInformation": distinction,
            "exactBitReduction": {"source": 2, "target": 2},
            "hiddenDegreeGovernorAddresses": hidden_addresses,
            "governorOfficeDisposition": "preserved_external_authority_not_transformed",
            "routeCost": {
                "status": "unresolved",
                "value": None,
                "blockerPointer": "scrum/CRT-305-court-runtime-ledger.md#topological-translocation-contract"
            },
            "spectralMeasures": {
                "admission": "not_admitted",
                "value": None,
                "blockerPointer": "scrum/CRT-304-court-filter-algebra.md#tasks-follow-on-admission-required"
            },
        })
    return {
        "comparisonId": "bridge-comparison:aeolian-1453:harmonic-minor-2477",
        "sourceState": _state(source),
        "targetState": _state(target),
        "routes": routes,
        "minimalAdditionalBridgeFilters": [],
        "conclusion": "The two admitted bridges expose distinct fixed-root information and are not interchangeable."
    }


def build_release(*, reverse_input_order: bool = False) -> dict[str, Any]:
    authored_path = PACKAGE_ROOT / "source/filter-input.json"
    authored = _load_json(authored_path)
    if reverse_input_order:
        authored["dependencies"].reverse()
        authored["proposedFilterTypes"].reverse()
    loaded = _verify_dependencies(authored)
    substrate = loaded["crt-302-substrate"]
    ledger = loaded["canonical-heptatonic-ledger"]
    if substrate["integratedAdmission"] != "proposed_pending_crt_309" or len(substrate["bridgeRootings"]) != 2:
        raise ValueError("substrate_admission_scope_mismatch")
    states = {record["id"]: record for record in ledger}
    operands = sorted(states)
    if len(operands) != 462 or any(mask.bit_count() != 7 or not mask & 1 for mask in operands):
        raise ValueError("canonical_operand_ledger_mismatch")

    registry_path = INTEGRATED_ROOT / next(item["path"] for item in authored["dependencies"] if item["dependencyId"] == "mutation-operator-registry")
    applications_path = INTEGRATED_ROOT / next(item["path"] for item in authored["dependencies"] if item["dependencyId"] == "mutation-operator-applications")
    operator_rows = sorted(_read_csv(registry_path), key=lambda item: item["operator_id"])
    application_rows = _read_csv(applications_path)
    operator_ids = [row["operator_id"] for row in operator_rows]
    if len(operator_ids) != 15 or len(application_rows) != 3402:
        raise ValueError("mutation_audit_count_mismatch")
    expected_applications = {(row["operator_id"], int(row["source_id"])): int(row["target_id"]) for row in application_rows}
    independent_applications = {}
    for operator_id in operator_ids:
        for source_mask in operands:
            try:
                independent_applications[(operator_id, source_mask)] = apply_admitted_mutation(operator_id, source_mask).target_mask
            except ValueError:
                pass
    if independent_applications != expected_applications:
        raise ValueError("independent_mutation_audit_parity_mismatch")

    filters, filter_rows = _filters(substrate)
    summaries = []
    non_commutation_records = []
    totals = {classification: 0 for classification in CLASSIFICATIONS}
    for operator in filters:
        for operator_id in operator_ids:
            counts = {classification: 0 for classification in CLASSIFICATIONS}
            for source_mask in operands:
                result = evaluate_commutation(operator, operator_id, source_mask)
                counts[result.classification] += 1
                totals[result.classification] += 1
                if result.classification == "right_undefined":
                    target_mask = expected_applications[(operator_id, source_mask)]
                    non_commutation_records.append({
                        "recordId": f"noncomm:{operator.filter_id}:{operator_id}:{source_mask}",
                        "filterId": operator.filter_id,
                        "filterMask": operator.mask,
                        "operatorId": operator_id,
                        "sourceState": _state(states[source_mask]),
                        "targetState": _state(states[target_mask]),
                        "leftResult": {
                            "route": "P_c(T(x))",
                            "outputMask": result.left_result,
                            "pitchClasses": _pitch_classes(result.left_result),
                        },
                        "rightUndefinedReason": result.right_undefined_reason,
                        "routeSemanticsNote": "Mutation is admitted on the rooted weight-seven source before filtering; after filtering, the mutation route is outside its admitted domain, so operator order is route semantics.",
                        "ledgerDeclaration": {
                            "namespace": "court.routeSemantics",
                            "runtimeEventRequired": True,
                            "eventPointer": None,
                        },
                    })
            summaries.append({
                "filterId": operator.filter_id,
                "filterMask": operator.mask,
                "operatorId": operator_id,
                "operandCount": len(operands),
                "classificationCounts": counts,
            })
    if totals != {"commutes": 0, "does_not_commute": 0, "left_undefined": 0, "right_undefined": 23814, "both_undefined": 24696}:
        raise ValueError("commutation_aggregate_mismatch")
    if len(summaries) != 105 or len(non_commutation_records) != totals["right_undefined"]:
        raise ValueError("commutation_coverage_mismatch")

    bridge = _bridge_comparison({operator.mask: operator for operator in filters}, states)
    dependencies = sorted(authored["dependencies"], key=lambda item: item["dependencyId"])
    source_hashes = sorted(
        [{"path": item["path"], "sha256": item["sha256"]} for item in dependencies]
        + [{"path": "seven-governors-court-filter-algebra-v0.1.0/source/filter-input.json", "sha256": sha256_file(authored_path)}],
        key=lambda item: item["path"],
    )
    source_fingerprint = sha256_bytes(compact_json_bytes(source_hashes))
    registry = {
        "operators": filter_rows,
        "proposedFilterTypes": sorted(authored["proposedFilterTypes"], key=lambda item: item["filterType"]),
        "minimalAdditionalBridgeFilters": [],
    }
    commutation = {
        "operandLedgerPath": "canonical/universal-heptatonic-ledger.json",
        "operandCount": 462,
        "filterCount": 7,
        "mutationOperatorCount": 15,
        "evaluationCount": 48510,
        "summaryRowCount": 105,
        "classificationTotals": totals,
        "rows": summaries,
    }
    non_commutation = {
        "recordCount": len(non_commutation_records),
        "records": non_commutation_records,
    }
    fingerprint_core = {
        "releaseId": authored["releaseId"],
        "dependencies": dependencies,
        "registry": registry,
        "bridge": bridge,
        "commutation": commutation,
        "nonCommutation": non_commutation,
    }
    algebra_fingerprint = sha256_bytes(compact_json_bytes(fingerprint_core))
    envelope = {
        "schemaVersion": "1.0.0",
        "releaseId": authored["releaseId"],
        "integratedAdmission": authored["integratedAdmission"],
        "sourceFingerprint": source_fingerprint,
        "filterAlgebraFingerprint": algebra_fingerprint,
    }
    release = {
        **envelope,
        "packageId": authored["packageId"],
        "packageVersion": authored["packageVersion"],
        "dependencyBindings": dependencies,
        "sourceHashes": source_hashes,
        "canonicalOutputs": list(OUTPUT_NAMES),
        "summary": {
            "filterCount": 7,
            "mutationOperatorCount": 15,
            "canonicalOperandCount": 462,
            "evaluationCount": 48510,
            "summaryRowCount": 105,
            "nonCommutationRecordCount": 23814,
            "mutationAuditApplicationCount": 3402,
            "mutationAuditParity": "exact",
        },
    }
    return {
        "release": release,
        "registry": {**envelope, **registry},
        "bridge": {**envelope, **bridge},
        "commutation": {**envelope, **commutation},
        "nonCommutation": {**envelope, **non_commutation},
    }


def build_artifacts(*, reverse_input_order: bool = False) -> dict[str, bytes]:
    release = build_release(reverse_input_order=reverse_input_order)
    return {
        "filter-algebra-release.json": canonical_json_bytes(release["release"]),
        "filter-operator-registry.json": canonical_json_bytes(release["registry"]),
        "bridge-route-comparison.json": canonical_json_bytes(release["bridge"]),
        "commutation-table.json": canonical_json_bytes(release["commutation"]),
        "non-commutation-records.json": canonical_json_bytes(release["nonCommutation"]),
    }
