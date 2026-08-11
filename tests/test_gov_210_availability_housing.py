from __future__ import annotations

from collections import Counter
import copy
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys

import jsonschema
import pytest

from governor.availability_housing import (
    AvailabilityHousingError,
    build_availability_housing_projection,
    build_skill_lifecycle_records,
    iter_gov210_ingestion_batches,
    project_context_housing,
    serialize_availability_housing_projection,
    verify_availability_housing_projection,
)
from governor.availability_housing_queries import (
    GOV210_QUERY_CATALOG,
    execute_gov210_snapshot_query,
    normalize_gov210_query_parameters,
)
from governor.hashing import canonical_json_bytes, sha256_payload


ROOT = Path(__file__).resolve().parents[1]
CANONICAL_PATH = ROOT / "canonical/gov-210-availability-housing.json"


@pytest.fixture(scope="module")
def snapshot():
    return build_availability_housing_projection(root=ROOT)


def _rehash_record(record):
    core = {key: value for key, value in record.items() if key != "recordSha256"}
    record["recordSha256"] = sha256_payload(core)


def _rehash_snapshot(document):
    core = {key: value for key, value in document.items() if key != "projectionFingerprint"}
    document["projectionFingerprint"] = sha256_payload(core)


def _context_bundle():
    core = {
        "schemaVersion": "gov-208.context-bundle.v1",
        "status": "ok",
        "requestFingerprint": "1" * 64,
        "policyFingerprint": "2" * 64,
        "vaultFingerprint": "3" * 64,
        "notes": [
            {
                "noteId": "public-note",
                "relativePath": "private/folder/public-note.md",
                "depth": 0,
                "metadata": {
                    "noteId": "public-note",
                    "title": "Private title is a value, not structure",
                    "admissionStatus": "proposed",
                    "source": "/home/user/private/public-note.md",
                    "aspectRefs": ["aspect:one"],
                },
                "excerpt": "secret raw excerpt",
                "contentSha256": "4" * 64,
                "links": [
                    {
                        "target": "private/folder/linked-note",
                        "status": "resolved",
                        "targetNoteId": "linked-note",
                    },
                    {
                        "target": "private/missing-note",
                        "status": "broken",
                        "targetNoteId": None,
                    },
                ],
            }
        ],
        "exclusions": [],
        "diagnostics": [],
    }
    return {**core, "bundleFingerprint": sha256_payload(core)}


def test_canonical_projection_is_exact_and_complete(snapshot) -> None:
    assert verify_availability_housing_projection(snapshot)
    assert CANONICAL_PATH.read_bytes() == serialize_availability_housing_projection(snapshot)
    assert snapshot["counts"] == {
        "assignmentCount": 1873,
        "availabilityCount": 10,
        "courtTargetCount": 5,
        "eligibilityCount": 10,
        "housingCount": 0,
        "lifecycleCount": 0,
        "nodeCount": 2361,
        "relationshipCount": 3766,
        "topologyTargetCount": 462,
    }
    assert snapshot["coverage"] == {
        "availabilityByNamespace": {"court": 5, "governor": 5},
        "courtFilterCount": 5,
        "courtOrdinaryMoveCount": 8,
        "courtOrdinaryMoveCoverageBySkill": {
            "list_legal_court_moves": 8,
            "validate_and_execute_court_transition": 8,
            "verify_court_postcondition": 8,
        },
        "courtPositionCount": 5,
        "eligibilityCount": 10,
        "mutationApplicationCount": 3402,
        "mutationApplicationCoverageBySkill": {
            "list_legal_moves": 3402,
            "validate_and_execute_move": 3402,
            "verify_outcome": 3402,
        },
        "mutationOperatorCount": 15,
        "topologyTargetCount": 462,
    }


def test_registry_and_eligibility_coverage_is_explicit(snapshot) -> None:
    by_label = {}
    for node in snapshot["nodes"]:
        by_label.setdefault(node["label"], []).append(node)
    availability = {
        node["properties"]["skillId"]: node["properties"]
        for node in by_label["Gov210SkillAvailability"]
    }
    eligibility = {
        node["properties"]["skillId"]: node["properties"]
        for node in by_label["Gov210SkillEligibility"]
    }
    assert set(availability) == set(eligibility)
    assert Counter(record["registryNamespace"] for record in availability.values()) == {
        "court": 5,
        "governor": 5,
    }
    assert eligibility["classify_governor"]["basisSelector"] == "availability_only"
    assert not any(
        node["properties"]["skillId"] == "classify_governor"
        for node in by_label["Gov210SkillAssignment"]
    )
    serialized_skill_records = json.dumps([*availability.values(), *eligibility.values()]).lower()
    for forbidden in ("governoraffinity", "skillgovernor", "skilloffice"):
        assert forbidden not in serialized_skill_records


def test_exact_mutation_basis_explains_topology_assignment(snapshot) -> None:
    rows = execute_gov210_snapshot_query(
        snapshot, "skills_for_topology_target", {"scaleStateId": 1453}
    )
    assert [row["skillId"] for row in rows] == [
        "inspect_context",
        "list_legal_moves",
        "validate_and_execute_move",
        "verify_outcome",
    ]
    explanation = execute_gov210_snapshot_query(
        snapshot,
        "skill_assignment_explanation",
        {"assignmentId": "assignment:list_legal_moves:topology:1453"},
    )[0]
    assert explanation["basisKind"] == "mutation_application_source"
    assert "R7:1453:2477" in explanation["applicationIds"]
    assert "R7" in explanation["operatorIds"]
    assert "D7:Moon" in explanation["degreeAddresses"]
    assert "governs:A0:1453:2477:0" in explanation["edgeIds"]
    assert explanation["targetOffice"] == "Jupiter"
    assert explanation["informationalOnly"] is True
    assert explanation["runtimeAuthority"] is False


def test_court_queries_preserve_position_and_filter_basis(snapshot) -> None:
    rows = execute_gov210_snapshot_query(
        snapshot, "skills_for_court_position", {"positionId": "C2"}
    )
    assert [row["skillId"] for row in rows] == [
        "inspect_court_state",
        "list_legal_court_moves",
        "project_through_court",
        "validate_and_execute_court_transition",
        "verify_court_postcondition",
    ]
    explanation = execute_gov210_snapshot_query(
        snapshot,
        "skill_assignment_explanation",
        {"assignmentId": "assignment:project_through_court:court:C2"},
    )[0]
    assert explanation["basisKind"] == "court_filter_position"
    assert explanation["basisIds"] == ["court-filter:C2"]
    assert explanation["applicationIds"] == []


def test_housing_strips_raw_text_paths_values_and_unresolved_targets() -> None:
    bundle = _context_bundle()
    housing = project_context_housing(bundle)
    assert len(housing) == 1
    record = housing[0]
    assert record["frontmatterFields"] == [
        "admissionStatus",
        "aspectRefs",
        "noteId",
        "source",
        "title",
    ]
    assert record["resolvedLinkNoteIds"] == ["linked-note"]
    assert record["linkStatuses"] == ["broken", "resolved:linked-note"]
    assert record["sectionRoles"] == [
        "governor_reference",
        "identity",
        "link_topology",
        "provenance",
    ]
    assert record["sectionRoleStatus"] == "derived_from_frontmatter_structure"
    assert record["provenanceRefs"] == [
        f"provenance-sha256:{sha256_payload('/home/user/private/public-note.md')}"
    ]
    serialized = json.dumps(record)
    for secret in (
        "secret raw excerpt",
        "private/folder/public-note.md",
        "private/missing-note",
        "Private title is a value",
        "/home/user/private/public-note.md",
    ):
        assert secret not in serialized

    contextual = build_availability_housing_projection(root=ROOT, context_bundle=bundle)
    assert contextual["counts"]["housingCount"] == 1
    assert verify_availability_housing_projection(contextual)

    path_ids = _context_bundle()
    path_ids["notes"][0]["noteId"] = "private/folder/public-note"
    path_ids["notes"][0]["metadata"]["noteId"] = "private/folder/public-note"
    path_ids["notes"][0]["links"][0]["targetNoteId"] = "private/folder/linked-note"
    path_core = {key: value for key, value in path_ids.items() if key != "bundleFingerprint"}
    path_ids["bundleFingerprint"] = sha256_payload(path_core)
    redacted = project_context_housing(path_ids)[0]
    assert redacted["noteId"].startswith("redacted:")
    assert all(target.startswith("redacted:") for target in redacted["resolvedLinkNoteIds"])
    assert "private/folder" not in json.dumps(redacted)


def test_no_context_parity_and_context_tampering_fail_closed(snapshot) -> None:
    assert project_context_housing(None) == ()
    assert build_availability_housing_projection(root=ROOT) == snapshot
    bad_bundle = _context_bundle()
    bad_bundle["notes"][0]["excerpt"] = "tampered"
    with pytest.raises(AvailabilityHousingError, match="context_bundle_fingerprint_invalid"):
        project_context_housing(bad_bundle)

    tampered = copy.deepcopy(snapshot)
    assignment = next(
        node for node in tampered["nodes"] if node["label"] == "Gov210SkillAssignment"
    )
    assignment["properties"]["runtimeAuthority"] = True
    _rehash_record(assignment)
    _rehash_snapshot(tampered)
    assert not verify_availability_housing_projection(tampered)

    swapped = copy.deepcopy(snapshot)
    edges = [
        edge
        for edge in swapped["relationships"]
        if edge["relationshipType"] == "GOV210_HAS_ELIGIBILITY"
    ]
    edges[0]["targetLogicalId"], edges[1]["targetLogicalId"] = (
        edges[1]["targetLogicalId"],
        edges[0]["targetLogicalId"],
    )
    edges[0]["targetLabel"] = edges[1]["targetLabel"] = "Gov210SkillEligibility"
    _rehash_record(edges[0])
    _rehash_record(edges[1])
    _rehash_snapshot(swapped)
    assert not verify_availability_housing_projection(swapped)

    stale_source = copy.deepcopy(snapshot)
    stale_source["sourceBindings"][0]["sha256"] = "f" * 64
    _rehash_snapshot(stale_source)
    assert not verify_availability_housing_projection(stale_source)

    wrong_target = copy.deepcopy(snapshot)
    target_edges = [
        edge
        for edge in wrong_target["relationships"]
        if edge["relationshipType"] == "GOV210_TARGETS"
        and edge["targetLabel"] == "Gov210TopologyTarget"
    ]
    target_edges[0]["targetLogicalId"], target_edges[1]["targetLogicalId"] = (
        target_edges[1]["targetLogicalId"],
        target_edges[0]["targetLogicalId"],
    )
    _rehash_record(target_edges[0])
    _rehash_record(target_edges[1])
    _rehash_snapshot(wrong_target)
    assert not verify_availability_housing_projection(wrong_target)

    false_provenance = copy.deepcopy(snapshot)
    assignment = next(
        node for node in false_provenance["nodes"] if node["label"] == "Gov210SkillAssignment"
    )
    assignment["sourceSha256"] = "e" * 64
    _rehash_record(assignment)
    _rehash_snapshot(false_provenance)
    assert not verify_availability_housing_projection(false_provenance)

    extra_authority = copy.deepcopy(snapshot)
    availability = next(
        node
        for node in extra_authority["nodes"]
        if node["label"] == "Gov210SkillAvailability"
    )
    availability["properties"]["runtimeAuthority"] = True
    _rehash_record(availability)
    _rehash_snapshot(extra_authority)
    assert not verify_availability_housing_projection(extra_authority)


def test_context_and_lifecycle_resource_bounds_fail_closed() -> None:
    oversized = _context_bundle()
    template = oversized["notes"][0]
    oversized["notes"] = []
    for index in range(65):
        note = copy.deepcopy(template)
        note["noteId"] = f"note-{index}"
        note["metadata"]["noteId"] = f"note-{index}"
        oversized["notes"].append(note)
    core = {key: value for key, value in oversized.items() if key != "bundleFingerprint"}
    oversized["bundleFingerprint"] = sha256_payload(core)
    with pytest.raises(AvailabilityHousingError, match="context_bundle_notes_invalid"):
        project_context_housing(oversized)
    with pytest.raises(AvailabilityHousingError, match="lifecycle_chain_invalid"):
        build_skill_lifecycle_records(
            [
                {
                    "eventId": "bad-sequence",
                    "skillId": "inspect_context",
                    "action": "publish",
                    "sequence": "bad",
                    "evidenceSha256": "a" * 64,
                }
            ],
            {"inspect_context"},
        )


def test_optional_lifecycle_is_hash_chained_and_bounded(snapshot) -> None:
    recipes = [
        {
            "eventId": "inspect-context-published",
            "skillId": "inspect_context",
            "action": "publish",
            "sequence": 1,
            "evidenceSha256": "a" * 64,
        },
        {
            "eventId": "inspect-context-validated",
            "skillId": "inspect_context",
            "action": "validate",
            "sequence": 2,
            "evidenceSha256": "b" * 64,
        },
    ]
    records = build_skill_lifecycle_records(recipes, {"inspect_context"})
    assert records[0]["priorEventSha256"] == "0" * 64
    assert records[1]["priorEventSha256"] == records[0]["eventSha256"]
    contextual = build_availability_housing_projection(root=ROOT, lifecycle_recipes=reversed(recipes))
    rows = execute_gov210_snapshot_query(
        contextual, "skill_lifecycle_history", {"skillId": "inspect_context"}
    )
    assert [row["action"] for row in rows] == ["publish", "validate"]
    with pytest.raises(AvailabilityHousingError, match="lifecycle_chain_invalid"):
        build_skill_lifecycle_records([recipes[1]], {"inspect_context"})


def test_schemas_validate_every_projected_domain_record(snapshot) -> None:
    schema_by_label = {
        "Gov210SkillAvailability": "skill-availability.schema.json",
        "Gov210SkillEligibility": "skill-eligibility.schema.json",
        "Gov210SkillAssignment": "skill-assignment.schema.json",
        "Gov210ContextHousing": "context-housing.schema.json",
        "Gov210SkillLifecycle": "skill-lifecycle.schema.json",
    }
    lifecycle_recipe = {
        "eventId": "inspect-context-published",
        "skillId": "inspect_context",
        "action": "publish",
        "sequence": 1,
        "evidenceSha256": "a" * 64,
    }
    populated = build_availability_housing_projection(
        root=ROOT,
        context_bundle=_context_bundle(),
        lifecycle_recipes=[lifecycle_recipe],
    )
    for label, filename in schema_by_label.items():
        schema = json.loads((ROOT / "schemas/gov-210" / filename).read_text(encoding="utf-8"))
        matching = [node for node in populated["nodes"] if node["label"] == label]
        assert matching
        for node in matching:
            if node["label"] == label:
                jsonschema.Draft202012Validator(schema).validate(node["properties"])
    projection_schema = json.loads(
        (ROOT / "schemas/gov-210/graph-projection.schema.json").read_text(encoding="utf-8")
    )
    schema_store = {
        filename: json.loads((ROOT / "schemas/gov-210" / filename).read_text(encoding="utf-8"))
        for filename in schema_by_label.values()
    }
    schema_store.update({schema["$id"]: schema for schema in schema_store.values()})
    resolver = jsonschema.RefResolver.from_schema(projection_schema, store=schema_store)
    jsonschema.Draft202012Validator(
        projection_schema, resolver=resolver
    ).validate(snapshot)


def test_query_catalog_is_allow_listed_read_only_and_bounded(snapshot) -> None:
    assert tuple(GOV210_QUERY_CATALOG) == (
        "skills_for_topology_target",
        "skills_for_court_position",
        "skill_assignment_explanation",
        "skill_availability",
        "context_housing_for_note",
        "skill_lifecycle_history",
    )
    for spec in GOV210_QUERY_CATALOG.values():
        assert spec.max_rows <= 100
        assert spec.max_depth <= 3
        assert spec.timeout_ms <= 1000
        assert "ORDER BY" in spec.cypher and "LIMIT" in spec.cypher
        assert not re.search(
            r"\b(?:CREATE|MERGE|SET|DELETE|DETACH|DROP|REMOVE|CALL)\b",
            spec.cypher,
            flags=re.IGNORECASE,
        )
    assert execute_gov210_snapshot_query(
        snapshot, "skill_availability", {"skillId": "classify_governor"}
    )[0]["basisSelector"] == "availability_only"
    with pytest.raises(AvailabilityHousingError, match="query_not_allow_listed"):
        normalize_gov210_query_parameters("raw_cypher", {})
    with pytest.raises(AvailabilityHousingError, match="query_parameter_unknown"):
        normalize_gov210_query_parameters(
            "skill_availability", {"skillId": "inspect_context", "cypher": "MATCH (n)"}
        )
    with pytest.raises(AvailabilityHousingError, match="query_limit_invalid"):
        normalize_gov210_query_parameters(
            "skill_lifecycle_history", {"skillId": "inspect_context", "limit": 4}
        )


def test_ingestion_is_stable_idempotent_and_namespace_isolated(snapshot) -> None:
    first = iter_gov210_ingestion_batches(snapshot, batch_size=37)
    second = iter_gov210_ingestion_batches(snapshot, batch_size=37)
    assert [batch.sequence for batch in first] == list(range(1, len(first) + 1))
    assert [batch.canonical_bytes() for batch in first] == [
        batch.canonical_bytes() for batch in second
    ]
    assert [batch.kind for batch in first[:2]] == ["reset:relationships", "reset:nodes"]
    assert all(
        len(batch.parameters["records"]) <= 37
        for batch in first[2:]
    )
    assert all("MERGE" in batch.cypher for batch in first[2:])
    assert all("DELETE" in batch.cypher for batch in first[:2])
    assert all(value.startswith("GOV210_") for value in first[0].parameters["relationshipTypes"])
    assert all(value.startswith("Gov210") for value in first[1].parameters["nodeLabels"])
    assert all(
        "Gov210" in batch.cypher or "GOV210_" in batch.cypher for batch in first[2:]
    )
    reset = (ROOT / "neo4j/gov-210/reset.cypher").read_text(encoding="utf-8")
    assert "Gov210" in reset and "GOV210_" in reset
    for forbidden in ("GovRuntimePolicyRelease", "CourtState", "HAS_TRIAD"):
        assert forbidden not in reset


def test_build_twice_cli_check_and_hash_seed_identity(snapshot, tmp_path: Path) -> None:
    outputs = []
    for index, seed in enumerate(("1", "987")):
        output = tmp_path / f"projection-{index}.json"
        environment = {
            **os.environ,
            "PYTHONHASHSEED": seed,
            "TZ": "UTC" if index == 0 else "Pacific/Honolulu",
        }
        subprocess.run(
            [
                sys.executable,
                str(ROOT / "scripts/generate-availability-housing.py"),
                "--output",
                str(output),
            ],
            cwd=ROOT,
            env=environment,
            check=True,
        )
        outputs.append(output.read_bytes())
    assert outputs[0] == outputs[1] == canonical_json_bytes(snapshot)
    subprocess.run(
        [
            sys.executable,
            str(ROOT / "scripts/generate-availability-housing.py"),
            "--check",
        ],
        cwd=ROOT,
        check=True,
    )


def test_gov206_and_crt306_query_catalog_fingerprints_are_unchanged() -> None:
    expected = {
        "graph/runtime/query-catalog.mjs": "c6e7f5a4bb87f0fb190e54bc5879271408d38c83fd58dbc2f6953f0523fd5e94",
        "src/governor/court_graph_queries.py": "3442e4cd03a3885a5cd7706d8146974eba20fc564edf08acb4bb2db0479ddcc8",
    }
    for relative_path, expected_sha256 in expected.items():
        assert hashlib.sha256((ROOT / relative_path).read_bytes()).hexdigest() == expected_sha256
