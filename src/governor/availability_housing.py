"""Deterministic GOV-210 skill availability, assignment, and housing projection."""

from __future__ import annotations

from collections import defaultdict
from collections.abc import Iterable, Mapping, Sequence
import csv
from dataclasses import dataclass
from functools import lru_cache
import hashlib
import json
from pathlib import Path
import re
from typing import Any

from .hashing import canonical_json_bytes, sha256_payload


GOV210_SCHEMA_VERSION = "gov-210.graph-projection.v1"
GOV210_RELEASE_ID = "gov-210-availability-housing:1.0.0"
GENESIS_SHA256 = "0" * 64
ROOT = Path(__file__).resolve().parents[2]

SOURCE_BINDINGS = (
    ("canonical-topology", "canonical/universal-network-data.json"),
    ("court-runtime-policy", "schemas/court-runtime-policy.json"),
    ("gov210-eligibility-policy", "schemas/gov-210/skill-eligibility-policy.json"),
    (
        "court-filter-operators",
        "seven-governors-court-filter-algebra-v0.1.0/canonical/filter-operator-registry.json",
    ),
    (
        "mutation-applications",
        "seven-governors-mutation-algebra-audit/audit/operator-applications.csv",
    ),
    (
        "mutation-operators",
        "seven-governors-mutation-algebra-audit/audit/operator-registry.csv",
    ),
    ("crt307-registry", "skills/court/registry.json"),
    ("gov207-registry", "skills/governor/registry.json"),
)
CLOSED_SOURCE_SHA256 = {
    "canonical/universal-network-data.json": "21e2a632837ecf40fe9229e9eb4ec0a5cceb9e2043fe89cb8e1d320518d7bdbc",
    "schemas/court-runtime-policy.json": "5164b74bf6cbbb55625eb0e9b958542cf20ddacb426813b7a93c1bffd7347605",
    "schemas/gov-210/skill-eligibility-policy.json": "0f5b19a232e55aa5b96deddf86c86da32b7d5221ff536031b87053f745a7c2d7",
    "seven-governors-court-filter-algebra-v0.1.0/canonical/filter-operator-registry.json": "278abdbd5df579407d5dd8d7b8a0d1213b8d0aa0d67d7ce9c72f42dac5e8ab8b",
    "seven-governors-mutation-algebra-audit/audit/operator-applications.csv": "1f7b2abb047132fa957f761a73e7c76038766f617bed9c916f971a8c0072f53e",
    "seven-governors-mutation-algebra-audit/audit/operator-registry.csv": "e5a9e6929fca048078e0db6ff044facc7137a6ef61e994d74f1d526e27b6482e",
    "skills/court/registry.json": "9eb2f62a6c30f6e608c37d9c9c383917f26475ec9d33c4a4b471bddd67803ca3",
    "skills/governor/registry.json": "f326aabe01c4be4d80589c84c7b8e9591e283c50d63d4b40b140bab11fbf64ae",
}
SOURCE_PATHS = tuple(path for _, path in SOURCE_BINDINGS)
HOUSING_SECTION_ROLE_RULES = (
    {
        "frontmatterFields": [
            "courtFilterMask",
            "courtRootedPosition",
            "kappaCourt",
            "pentatonicSetClass",
        ],
        "role": "court_coordinate",
    },
    {
        "frontmatterFields": ["aspectRefs", "governor", "ruleRefs"],
        "role": "governor_reference",
    },
    {"frontmatterFields": ["noteId", "title"], "role": "identity"},
    {"role": "link_topology", "structuralSignal": "links_present"},
    {
        "frontmatterFields": ["admissionStatus", "courtProvenanceRef", "source"],
        "role": "provenance",
    },
)

NODE_LABELS = (
    "Gov210AvailabilityRelease",
    "Gov210ContextHousing",
    "Gov210CourtTarget",
    "Gov210SkillAssignment",
    "Gov210SkillAvailability",
    "Gov210SkillEligibility",
    "Gov210SkillLifecycle",
    "Gov210TopologyTarget",
)
RELATIONSHIP_TYPES = (
    "GOV210_ASSIGNS_SKILL",
    "GOV210_DECLARES_AVAILABILITY",
    "GOV210_DECLARES_HOUSING",
    "GOV210_DECLARES_LIFECYCLE",
    "GOV210_HAS_ELIGIBILITY",
    "GOV210_REFERENCES_SKILL",
    "GOV210_TARGETS",
)
_ENDPOINTS = {
    "GOV210_ASSIGNS_SKILL": ("Gov210SkillEligibility", "Gov210SkillAssignment"),
    "GOV210_DECLARES_AVAILABILITY": (
        "Gov210AvailabilityRelease",
        "Gov210SkillAvailability",
    ),
    "GOV210_DECLARES_HOUSING": ("Gov210AvailabilityRelease", "Gov210ContextHousing"),
    "GOV210_DECLARES_LIFECYCLE": (
        "Gov210AvailabilityRelease",
        "Gov210SkillLifecycle",
    ),
    "GOV210_HAS_ELIGIBILITY": ("Gov210SkillAvailability", "Gov210SkillEligibility"),
    "GOV210_REFERENCES_SKILL": ("Gov210SkillLifecycle", "Gov210SkillAvailability"),
    "GOV210_TARGETS": (
        "Gov210SkillAssignment",
        ("Gov210TopologyTarget", "Gov210CourtTarget"),
    ),
}
_SELECTORS = frozenset(
    {
        "availability_only",
        "topology_node_identity",
        "mutation_application_source",
        "mutation_application_target",
        "court_position_identity",
        "court_ordinary_move_source",
        "court_ordinary_move_target",
        "court_filter_position",
    }
)
EXPECTED_ELIGIBILITY = {
    "classify_governor": ("governor", "availability", "availability_only"),
    "inspect_context": ("governor", "topology", "topology_node_identity"),
    "list_legal_moves": ("governor", "topology", "mutation_application_source"),
    "validate_and_execute_move": (
        "governor",
        "topology",
        "mutation_application_source",
    ),
    "verify_outcome": ("governor", "topology", "mutation_application_target"),
    "inspect_court_state": ("court", "court", "court_position_identity"),
    "list_legal_court_moves": ("court", "court", "court_ordinary_move_source"),
    "project_through_court": ("court", "court", "court_filter_position"),
    "validate_and_execute_court_transition": (
        "court",
        "court",
        "court_ordinary_move_source",
    ),
    "verify_court_postcondition": ("court", "court", "court_ordinary_move_target"),
}
_FORBIDDEN_SKILL_KEYS = frozenset(
    {"governoraffinity", "skillgovernor", "skilloffice", "mythologicalaffinity"}
)
_FORBIDDEN_HOUSING_KEYS = frozenset(
    {"body", "excerpt", "rawtext", "relativepath", "absolutepath", "privatepath"}
)
_PUBLIC_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$")
_BASE_BUNDLE_FIELDS = frozenset(
    {
        "schemaVersion",
        "status",
        "requestFingerprint",
        "policyFingerprint",
        "vaultFingerprint",
        "notes",
        "exclusions",
        "diagnostics",
        "bundleFingerprint",
    }
)
_BASE_NOTE_FIELDS = frozenset(
    {"noteId", "relativePath", "depth", "metadata", "excerpt", "contentSha256", "links"}
)
_BASE_METADATA_FIELDS = frozenset(
    {
        "noteId",
        "title",
        "aspectRefs",
        "ruleRefs",
        "governor",
        "admissionStatus",
        "source",
        "maxTraversalDepth",
        "courtRootedPosition",
        "pentatonicSetClass",
        "kappaCourt",
        "courtFilterMask",
        "courtProvenanceRef",
    }
)
_COURT_BUNDLE_FIELDS = frozenset(
    {
        "schemaVersion",
        "status",
        "authority",
        "baseBundleFingerprint",
        "policyFingerprint",
        "dependencyFingerprints",
        "courtNotes",
        "diagnostics",
        "canonicalCourtPolicyChanged",
        "canonicalAdmissionChanged",
        "graphQueryFingerprintChanged",
        "bundleFingerprint",
    }
)
_COURT_NOTE_FIELDS = frozenset(
    {
        "noteId",
        "baseNoteFingerprint",
        "courtRootedPosition",
        "pentatonicSetClass",
        "kappaCourt",
        "courtFilterMask",
        "claimedAdmissionStatus",
        "effectiveAdmissionStatus",
        "courtProvenanceRef",
    }
)
_NODE_PROPERTY_KEYS = {
    "Gov210AvailabilityRelease": frozenset(
        {"authority", "policyFingerprint", "releaseId", "runtimeAuthority"}
    ),
    "Gov210SkillAvailability": frozenset(
        {
            "apiVersion",
            "bundleId",
            "bundleVersion",
            "inputSchemaId",
            "name",
            "operationId",
            "outputSchemaId",
            "registryNamespace",
            "registrySha256",
            "skillId",
        }
    ),
    "Gov210SkillEligibility": frozenset(
        {
            "assignmentSemantics",
            "basisSelector",
            "eligibilityId",
            "registryNamespace",
            "runtimeAuthority",
            "skillId",
            "targetNamespace",
        }
    ),
    "Gov210SkillAssignment": frozenset(
        {
            "applicationIds",
            "assignmentId",
            "basisIds",
            "basisKind",
            "basisSha256",
            "degreeAddresses",
            "directions",
            "edgeIds",
            "informationalOnly",
            "operatorIds",
            "runtimeAuthority",
            "skillId",
            "targetId",
            "targetNamespace",
            "targetOffice",
            "targetRole",
            "targetTier",
        }
    ),
    "Gov210TopologyTarget": frozenset(
        {"fineRole", "forte", "name", "office", "role", "scaleStateId", "tier"}
    ),
    "Gov210CourtTarget": frozenset(
        {
            "index",
            "internalPoles",
            "kappaDenominator",
            "kappaNumerator",
            "pitchMask",
            "positionId",
        }
    ),
    "Gov210ContextHousing": frozenset(
        {
            "contentSha256",
            "contextNamespace",
            "depth",
            "frontmatterFields",
            "housingFingerprint",
            "housingId",
            "linkStatuses",
            "noteId",
            "provenanceRefs",
            "resolvedLinkNoteIds",
            "sectionRoleStatus",
            "sectionRoles",
            "sourceBundleFingerprint",
        }
    ),
    "Gov210SkillLifecycle": frozenset(
        {
            "action",
            "eventId",
            "eventSha256",
            "evidenceSha256",
            "priorEventSha256",
            "sequence",
            "skillId",
        }
    ),
}
_NODE_ADMISSION = {
    "Gov210AvailabilityRelease": "canonical",
    "Gov210ContextHousing": "contextual",
    "Gov210CourtTarget": "canonical",
    "Gov210SkillAssignment": "informational",
    "Gov210SkillAvailability": "canonical",
    "Gov210SkillEligibility": "canonical",
    "Gov210SkillLifecycle": "informational",
    "Gov210TopologyTarget": "canonical",
}


class AvailabilityHousingError(ValueError):
    """Stable rejection code for malformed GOV-210 inputs."""

    def __init__(self, reason_code: str) -> None:
        super().__init__(reason_code)
        self.reason_code = reason_code


@dataclass(frozen=True, slots=True)
class Gov210IngestionBatch:
    sequence: int
    kind: str
    cypher: str
    parameters: Mapping[str, object]

    def canonical_bytes(self) -> bytes:
        return canonical_json_bytes(
            {
                "cypher": self.cypher,
                "kind": self.kind,
                "parameters": dict(self.parameters),
                "sequence": self.sequence,
            }
        )


def _read_json(root: Path, relative_path: str) -> dict[str, Any]:
    try:
        value = json.loads((root / relative_path).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise AvailabilityHousingError(f"source_unreadable:{relative_path}") from error
    if not isinstance(value, dict):
        raise AvailabilityHousingError(f"source_not_object:{relative_path}")
    return value


def _read_csv(root: Path, relative_path: str) -> tuple[dict[str, str], ...]:
    try:
        with (root / relative_path).open(encoding="utf-8", newline="") as handle:
            return tuple(dict(row) for row in csv.DictReader(handle))
    except OSError as error:
        raise AvailabilityHousingError(f"source_unreadable:{relative_path}") from error


def _file_sha256(path: Path) -> str:
    try:
        return hashlib.sha256(path.read_bytes()).hexdigest()
    except OSError as error:
        raise AvailabilityHousingError(f"source_unreadable:{path.as_posix()}") from error


def _is_sha256(value: object) -> bool:
    return (
        isinstance(value, str)
        and len(value) == 64
        and all(character in "0123456789abcdef" for character in value)
    )


def _normalized_key(value: object) -> str:
    return "".join(character for character in str(value).casefold() if character.isalnum())


def _contains_key(value: object, forbidden: frozenset[str]) -> bool:
    if isinstance(value, Mapping):
        return any(
            _normalized_key(key) in forbidden or _contains_key(item, forbidden)
            for key, item in value.items()
        )
    if isinstance(value, (list, tuple)):
        return any(_contains_key(item, forbidden) for item in value)
    return False


def _node(
    label: str,
    logical_id: str,
    properties: Mapping[str, object],
    *,
    source_sha256: str,
    admission_status: str,
) -> dict[str, object]:
    core = {
        "admissionStatus": admission_status,
        "label": label,
        "logicalId": logical_id,
        "properties": dict(properties),
        "sourceSha256": source_sha256,
    }
    return {**core, "recordSha256": sha256_payload(core)}


def _relationship(
    relationship_type: str,
    logical_id: str,
    source_label: str,
    source_logical_id: str,
    target_label: str,
    target_logical_id: str,
    *,
    source_sha256: str,
) -> dict[str, object]:
    core = {
        "admissionStatus": "informational",
        "logicalId": logical_id,
        "properties": {"runtimeAuthority": False},
        "relationshipType": relationship_type,
        "sourceLabel": source_label,
        "sourceLogicalId": source_logical_id,
        "sourceSha256": source_sha256,
        "targetLabel": target_label,
        "targetLogicalId": target_logical_id,
    }
    return {**core, "recordSha256": sha256_payload(core)}


def _append_unique(records: dict[str, dict[str, object]], record: dict[str, object]) -> None:
    logical_id = str(record["logicalId"])
    if logical_id in records:
        raise AvailabilityHousingError("duplicate_projection_logical_id")
    records[logical_id] = record


def _sorted_unique(values: Iterable[str]) -> list[str]:
    return sorted({value for value in values if value})


def _verify_fingerprinted_document(
    document: Mapping[str, object],
    fingerprint_field: str,
    expected_schema: str,
    expected_fields: frozenset[str],
) -> None:
    if set(document) != expected_fields or document.get("schemaVersion") != expected_schema:
        raise AvailabilityHousingError("context_bundle_schema_version_invalid")
    core = {key: value for key, value in document.items() if key != fingerprint_field}
    if document.get(fingerprint_field) != sha256_payload(core):
        raise AvailabilityHousingError("context_bundle_fingerprint_invalid")


def _public_id(value: str) -> str:
    if _PUBLIC_ID.fullmatch(value):
        return value
    return f"redacted:{sha256_payload(value)}"


def _provenance_fingerprint(value: str) -> str:
    return f"provenance-sha256:{sha256_payload(value)}"


def project_context_housing(
    context_bundle: Mapping[str, object] | None,
    *,
    court_bundle: Mapping[str, object] | None = None,
    section_role_rules: Sequence[Mapping[str, object]] = HOUSING_SECTION_ROLE_RULES,
) -> tuple[dict[str, object], ...]:
    """Strip context bundles to topology, field names, provenance, and fingerprints."""

    if context_bundle is None:
        if court_bundle is not None:
            raise AvailabilityHousingError("court_context_requires_base_bundle")
        return ()
    _verify_fingerprinted_document(
        context_bundle,
        "bundleFingerprint",
        "gov-208.context-bundle.v1",
        _BASE_BUNDLE_FIELDS,
    )
    if (
        context_bundle.get("status") not in {"ok", "empty"}
        or any(
            not _is_sha256(context_bundle.get(field))
            for field in (
                "requestFingerprint",
                "policyFingerprint",
                "vaultFingerprint",
                "bundleFingerprint",
            )
        )
        or len(canonical_json_bytes(context_bundle)) > 2 * 1024 * 1024
    ):
        raise AvailabilityHousingError("context_bundle_contract_invalid")
    notes = context_bundle.get("notes")
    if not isinstance(notes, list) or len(notes) > 64:
        raise AvailabilityHousingError("context_bundle_notes_invalid")
    if (context_bundle.get("status") == "empty") != (len(notes) == 0):
        raise AvailabilityHousingError("context_bundle_status_invalid")

    court_by_note: dict[str, Mapping[str, object]] = {}
    court_fingerprint: str | None = None
    if court_bundle is not None:
        _verify_fingerprinted_document(
            court_bundle,
            "bundleFingerprint",
            "crt-308.court-context-bundle.v1",
            _COURT_BUNDLE_FIELDS,
        )
        if (
            court_bundle.get("authority") != "context_evidence_only"
            or court_bundle.get("status") not in {"ok", "empty"}
            or court_bundle.get("canonicalCourtPolicyChanged") is not False
            or court_bundle.get("canonicalAdmissionChanged") is not False
            or court_bundle.get("graphQueryFingerprintChanged") is not False
            or not _is_sha256(court_bundle.get("policyFingerprint"))
            or not isinstance(court_bundle.get("dependencyFingerprints"), Mapping)
            or set(court_bundle["dependencyFingerprints"])
            != {"substrate", "invariants", "filters"}
            or any(
                not _is_sha256(value)
                for value in court_bundle["dependencyFingerprints"].values()
            )
            or len(canonical_json_bytes(court_bundle)) > 2 * 1024 * 1024
        ):
            raise AvailabilityHousingError("court_context_authority_invalid")
        if court_bundle.get("baseBundleFingerprint") != context_bundle.get("bundleFingerprint"):
            raise AvailabilityHousingError("court_context_base_bundle_mismatch")
        court_notes = court_bundle.get("courtNotes")
        if not isinstance(court_notes, list) or len(court_notes) > 64:
            raise AvailabilityHousingError("court_context_notes_invalid")
        if (court_bundle.get("status") == "empty") != (len(court_notes) == 0):
            raise AvailabilityHousingError("court_context_status_invalid")
        court_by_note = {
            str(note["noteId"]): note
            for note in court_notes
            if isinstance(note, Mapping)
            and set(note) == _COURT_NOTE_FIELDS
            and isinstance(note.get("noteId"), str)
        }
        if len(court_by_note) != len(court_notes):
            raise AvailabilityHousingError("court_context_note_identity_invalid")
        for note in court_notes:
            assert isinstance(note, Mapping)
            if (
                not isinstance(note.get("noteId"), str)
                or len(str(note["noteId"])) > 128
                or not _is_sha256(note.get("baseNoteFingerprint"))
                or note.get("courtRootedPosition")
                not in {"C0", "C1", "C2", "C3", "C4", None}
                or not isinstance(note.get("pentatonicSetClass"), str)
                or re.fullmatch(r"5-[0-9]+", str(note["pentatonicSetClass"])) is None
                or note.get("kappaCourt") not in {0, 0.25, 0.5, 0.75, 1, None}
                or not isinstance(note.get("courtFilterMask"), str)
                or re.fullmatch(r"[01]{12}", str(note["courtFilterMask"])) is None
                or note.get("claimedAdmissionStatus")
                not in {"admitted", "admitted-bridge", "proposed", "unresolved"}
                or note.get("effectiveAdmissionStatus")
                not in {"admitted", "admitted-bridge", "proposed", "unresolved"}
                or not isinstance(note.get("courtProvenanceRef"), str)
                or not 0 < len(str(note["courtProvenanceRef"])) <= 128
            ):
                raise AvailabilityHousingError("court_context_note_contract_invalid")
        court_fingerprint = str(court_bundle["bundleFingerprint"])

    records: list[dict[str, object]] = []
    seen: set[str] = set()
    for note in notes:
        if not isinstance(note, Mapping) or set(note) != _BASE_NOTE_FIELDS:
            raise AvailabilityHousingError("context_bundle_note_invalid")
        note_id = note.get("noteId")
        metadata = note.get("metadata")
        links = note.get("links")
        content_sha256 = note.get("contentSha256")
        depth = note.get("depth")
        if (
            not isinstance(note_id, str)
            or not note_id
            or len(note_id) > 128
            or note_id in seen
            or not isinstance(metadata, Mapping)
            or not {"noteId", "admissionStatus", "source"}.issubset(metadata)
            or set(metadata) - _BASE_METADATA_FIELDS
            or not isinstance(links, list)
            or len(links) > 64
            or not _is_sha256(content_sha256)
            or type(depth) is not int
            or not 0 <= depth <= 4
            or not isinstance(note.get("relativePath"), str)
            or not isinstance(note.get("excerpt"), str)
            or len(str(note.get("excerpt"))) > 1200
        ):
            raise AvailabilityHousingError("context_bundle_note_invalid")
        if metadata.get("noteId") != note_id:
            raise AvailabilityHousingError("context_bundle_note_identity_invalid")
        seen.add(note_id)
        public_note_id = _public_id(note_id)
        resolved_ids: list[str] = []
        statuses: list[str] = []
        for link in links:
            if (
                not isinstance(link, Mapping)
                or set(link) != {"target", "status", "targetNoteId"}
                or not isinstance(link.get("target"), str)
                or link.get("status") not in {
                "resolved",
                "broken",
                "ambiguous",
                }
            ):
                raise AvailabilityHousingError("context_bundle_link_invalid")
            status = str(link["status"])
            target_id = link.get("targetNoteId")
            if status == "resolved":
                if not isinstance(target_id, str) or not target_id:
                    raise AvailabilityHousingError("context_bundle_link_invalid")
                public_target_id = _public_id(target_id)
                resolved_ids.append(public_target_id)
                statuses.append(f"resolved:{public_target_id}")
            else:
                statuses.append(status)

        court_note = court_by_note.get(note_id)
        source = metadata.get("source")
        if not isinstance(source, str) or not 0 < len(source) <= 128:
            raise AvailabilityHousingError("context_bundle_provenance_invalid")
        provenance = [_provenance_fingerprint(source)]
        source_fingerprints = [str(context_bundle["bundleFingerprint"])]
        namespace = "governor"
        frontmatter_fields = list(metadata)
        if court_note is not None:
            if court_note.get("baseNoteFingerprint") != content_sha256:
                raise AvailabilityHousingError("court_context_note_fingerprint_mismatch")
            namespace = "court"
            provenance_ref = court_note.get("courtProvenanceRef")
            if isinstance(provenance_ref, str):
                provenance.append(_provenance_fingerprint(provenance_ref))
            frontmatter_fields.extend(
                field
                for field in (
                    "courtRootedPosition",
                    "pentatonicSetClass",
                    "kappaCourt",
                    "courtFilterMask",
                    "courtProvenanceRef",
                )
                if field in court_note
            )
            assert court_fingerprint is not None
            source_fingerprints.append(court_fingerprint)

        frontmatter_fields = _sorted_unique(frontmatter_fields)
        section_roles = []
        for rule in section_role_rules:
            role = rule.get("role")
            fields = rule.get("frontmatterFields", [])
            structural_signal = rule.get("structuralSignal")
            if not isinstance(role, str) or not isinstance(fields, list):
                raise AvailabilityHousingError("housing_section_role_rule_invalid")
            if set(fields) & set(frontmatter_fields) or (
                structural_signal == "links_present" and links
            ):
                section_roles.append(role)
        core = {
            "contentSha256": content_sha256,
            "contextNamespace": namespace,
            "depth": depth,
            "frontmatterFields": frontmatter_fields,
            "housingId": f"housing:{namespace}:{public_note_id}",
            "linkStatuses": _sorted_unique(statuses),
            "noteId": public_note_id,
            "provenanceRefs": _sorted_unique(provenance),
            "resolvedLinkNoteIds": _sorted_unique(resolved_ids),
            "sectionRoleStatus": "derived_from_frontmatter_structure",
            "sectionRoles": _sorted_unique(section_roles),
            "sourceBundleFingerprint": sha256_payload(sorted(source_fingerprints)),
        }
        records.append({**core, "housingFingerprint": sha256_payload(core)})

    if set(court_by_note) - seen:
        raise AvailabilityHousingError("court_context_note_not_in_base_bundle")
    return tuple(sorted(records, key=lambda record: str(record["housingId"])))


def build_skill_lifecycle_records(
    recipes: Iterable[Mapping[str, object]], skill_ids: Iterable[str]
) -> tuple[dict[str, object], ...]:
    """Build optional deterministic publish/validate/retire event chains."""

    known_skills = set(skill_ids)
    grouped: dict[str, list[Mapping[str, object]]] = defaultdict(list)
    for recipe in recipes:
        if set(recipe) != {"eventId", "skillId", "action", "sequence", "evidenceSha256"}:
            raise AvailabilityHousingError("lifecycle_recipe_fields_invalid")
        skill_id = recipe.get("skillId")
        if not isinstance(skill_id, str) or skill_id not in known_skills:
            raise AvailabilityHousingError("lifecycle_skill_not_available")
        if (
            type(recipe.get("sequence")) is not int
            or not 1 <= int(recipe["sequence"]) <= 3
        ):
            raise AvailabilityHousingError("lifecycle_chain_invalid")
        grouped[skill_id].append(recipe)

    expected_actions = ("publish", "validate", "retire")
    result: list[dict[str, object]] = []
    event_ids: set[str] = set()
    for skill_id in sorted(grouped):
        prior = GENESIS_SHA256
        events = sorted(grouped[skill_id], key=lambda event: int(event["sequence"]))
        for index, event in enumerate(events, 1):
            event_id = event.get("eventId")
            action = event.get("action")
            evidence = event.get("evidenceSha256")
            if (
                not isinstance(event_id, str)
                or not event_id
                or event_id in event_ids
                or event.get("sequence") != index
                or index > len(expected_actions)
                or action != expected_actions[index - 1]
                or not _is_sha256(evidence)
            ):
                raise AvailabilityHousingError("lifecycle_chain_invalid")
            event_ids.add(event_id)
            core = {
                "action": action,
                "eventId": event_id,
                "evidenceSha256": evidence,
                "priorEventSha256": prior,
                "sequence": index,
                "skillId": skill_id,
            }
            record = {**core, "eventSha256": sha256_payload(core)}
            result.append(record)
            prior = str(record["eventSha256"])
    return tuple(sorted(result, key=lambda event: (str(event["skillId"]), int(event["sequence"]))))


def _basis_properties(
    *,
    assignment_id: str,
    skill_id: str,
    target_namespace: str,
    target_id: str | int,
    basis_kind: str,
    basis_ids: Iterable[str],
    applications: Sequence[Mapping[str, str]] = (),
    target_role: str | None = None,
    target_tier: str | None = None,
    target_office: str | None = None,
) -> dict[str, object]:
    application_ids = _sorted_unique(str(item.get("application_id", "")) for item in applications)
    operator_ids = _sorted_unique(str(item.get("operator_id", "")) for item in applications)
    edge_ids = _sorted_unique(
        str(item.get(field, ""))
        for item in applications
        for field in ("structural_edge_ids", "field_edge_ids")
    )
    degree_addresses = _sorted_unique(
        f"D{item['degree']}:{item['degree_governor']}"
        for item in applications
        if item.get("degree") and item.get("degree_governor")
    )
    directions = _sorted_unique(str(item.get("direction", "")) for item in applications)
    basis = {
        "applicationIds": application_ids,
        "basisIds": _sorted_unique(basis_ids),
        "basisKind": basis_kind,
        "degreeAddresses": degree_addresses,
        "directions": directions,
        "edgeIds": edge_ids,
        "operatorIds": operator_ids,
        "targetId": target_id,
        "targetNamespace": target_namespace,
        "targetOffice": target_office,
        "targetRole": target_role,
        "targetTier": target_tier,
    }
    return {
        "assignmentId": assignment_id,
        "skillId": skill_id,
        **basis,
        "basisSha256": sha256_payload(basis),
        "informationalOnly": True,
        "runtimeAuthority": False,
    }


def build_availability_housing_projection(
    *,
    root: str | Path = ROOT,
    context_bundle: Mapping[str, object] | None = None,
    court_context_bundle: Mapping[str, object] | None = None,
    lifecycle_recipes: Iterable[Mapping[str, object]] = (),
    _verify_result: bool = True,
) -> dict[str, object]:
    """Build the complete authority-free GOV-210 graph snapshot."""

    source_root = Path(root).resolve(strict=True)
    bindings = [
        {
            "dependencyId": dependency_id,
            "path": relative_path,
            "sha256": _file_sha256(source_root / relative_path),
        }
        for dependency_id, relative_path in SOURCE_BINDINGS
    ]
    source_hash = {record["path"]: record["sha256"] for record in bindings}
    for relative_path, expected_sha256 in CLOSED_SOURCE_SHA256.items():
        if source_hash.get(relative_path) != expected_sha256:
            raise AvailabilityHousingError(f"closed_source_fingerprint_mismatch:{relative_path}")
    policy = _read_json(source_root, "schemas/gov-210/skill-eligibility-policy.json")
    policy_core = {key: value for key, value in policy.items() if key != "policyFingerprint"}
    if (
        policy.get("schemaVersion") != "gov-210.skill-eligibility-policy.v1"
        or policy.get("authority") != "informational_assignment_only"
        or policy.get("runtimeAuthority") is not False
        or policy.get("policyFingerprint") != sha256_payload(policy_core)
        or policy.get("housingSectionRoles") != list(HOUSING_SECTION_ROLE_RULES)
    ):
        raise AvailabilityHousingError("eligibility_policy_invalid")
    for binding in policy.get("registryBindings", []):
        if (
            not isinstance(binding, Mapping)
            or source_hash.get(str(binding.get("path"))) != binding.get("sha256")
        ):
            raise AvailabilityHousingError("eligibility_registry_binding_mismatch")

    registries: dict[str, dict[str, Any]] = {
        namespace: _read_json(source_root, f"skills/{namespace}/registry.json")
        for namespace in ("governor", "court")
    }
    skill_by_id: dict[str, tuple[str, Mapping[str, object], Mapping[str, object]]] = {}
    for namespace, registry in registries.items():
        skills = registry.get("skills")
        if not isinstance(skills, list) or len(skills) != 5:
            raise AvailabilityHousingError("registry_skill_coverage_invalid")
        for skill in skills:
            if not isinstance(skill, Mapping) or not isinstance(skill.get("skillId"), str):
                raise AvailabilityHousingError("registry_skill_invalid")
            skill_id = str(skill["skillId"])
            if skill_id in skill_by_id:
                raise AvailabilityHousingError("registry_skill_id_duplicate")
            skill_by_id[skill_id] = (namespace, registry, skill)
    if len(skill_by_id) != 10:
        raise AvailabilityHousingError("registry_skill_coverage_invalid")

    eligibility_records = policy.get("eligibilities")
    if not isinstance(eligibility_records, list) or len(eligibility_records) != 10:
        raise AvailabilityHousingError("eligibility_coverage_invalid")
    eligibility_by_skill: dict[str, Mapping[str, object]] = {}
    for eligibility in eligibility_records:
        if not isinstance(eligibility, Mapping):
            raise AvailabilityHousingError("eligibility_record_invalid")
        skill_id = eligibility.get("skillId")
        selector = eligibility.get("basisSelector")
        if (
            not isinstance(skill_id, str)
            or skill_id in eligibility_by_skill
            or skill_id not in skill_by_id
            or selector not in _SELECTORS
            or eligibility.get("registryNamespace") != skill_by_id[skill_id][0]
        ):
            raise AvailabilityHousingError("eligibility_record_invalid")
        eligibility_by_skill[skill_id] = eligibility
    if set(eligibility_by_skill) != set(skill_by_id):
        raise AvailabilityHousingError("eligibility_coverage_invalid")
    if {
        skill_id: (
            str(record["registryNamespace"]),
            str(record["targetNamespace"]),
            str(record["basisSelector"]),
        )
        for skill_id, record in eligibility_by_skill.items()
    } != EXPECTED_ELIGIBILITY:
        raise AvailabilityHousingError("eligibility_policy_mapping_invalid")

    network = _read_json(source_root, "canonical/universal-network-data.json")
    topology_nodes = network.get("nodes")
    if not isinstance(topology_nodes, list) or len(topology_nodes) != 462:
        raise AvailabilityHousingError("topology_target_coverage_invalid")
    topology_by_id = {
        int(node["id"]): node
        for node in topology_nodes
        if isinstance(node, Mapping) and type(node.get("id")) is int
    }
    if len(topology_by_id) != 462:
        raise AvailabilityHousingError("topology_target_identity_invalid")

    applications = _read_csv(
        source_root,
        "seven-governors-mutation-algebra-audit/audit/operator-applications.csv",
    )
    operators = _read_csv(
        source_root, "seven-governors-mutation-algebra-audit/audit/operator-registry.csv"
    )
    if len(applications) != 3402 or len(operators) != 15:
        raise AvailabilityHousingError("mutation_source_coverage_invalid")
    operator_ids = {row.get("operator_id") for row in operators}
    if len(operator_ids) != 15 or any(row.get("operator_id") not in operator_ids for row in applications):
        raise AvailabilityHousingError("mutation_operator_closure_invalid")
    outgoing: dict[int, list[Mapping[str, str]]] = defaultdict(list)
    incoming: dict[int, list[Mapping[str, str]]] = defaultdict(list)
    application_ids: set[str] = set()
    for row in applications:
        try:
            source_id = int(row["source_id"])
            target_id = int(row["target_id"])
        except (KeyError, ValueError) as error:
            raise AvailabilityHousingError("mutation_application_invalid") from error
        application_id = row.get("application_id")
        if (
            not application_id
            or application_id in application_ids
            or source_id not in topology_by_id
            or target_id not in topology_by_id
        ):
            raise AvailabilityHousingError("mutation_application_invalid")
        application_ids.add(application_id)
        outgoing[source_id].append(row)
        incoming[target_id].append(row)

    court_policy = _read_json(source_root, "schemas/court-runtime-policy.json")
    if (
        court_policy.get("schemaVersion") != "crt-305.court-runtime-policy.v1"
        or court_policy.get("policyId") != "court-runtime-policy:0.1.0"
        or court_policy.get("policyFingerprint")
        != "90431c79b8bc06da7e6f5cb5ce207cb6cbfd86519bdb91df5aacc137065ec456"
    ):
        raise AvailabilityHousingError("court_policy_identity_invalid")
    positions = court_policy.get("positions")
    ordinary_moves = court_policy.get("ordinaryMoves")
    if not isinstance(positions, list) or len(positions) != 5 or not isinstance(ordinary_moves, list) or len(ordinary_moves) != 8:
        raise AvailabilityHousingError("court_policy_coverage_invalid")
    position_by_id = {
        str(position["positionId"]): position
        for position in positions
        if isinstance(position, Mapping) and isinstance(position.get("positionId"), str)
    }
    if len(position_by_id) != 5:
        raise AvailabilityHousingError("court_position_identity_invalid")
    court_outgoing: dict[str, list[Mapping[str, object]]] = defaultdict(list)
    court_incoming: dict[str, list[Mapping[str, object]]] = defaultdict(list)
    for move in ordinary_moves:
        if not isinstance(move, Mapping):
            raise AvailabilityHousingError("court_move_invalid")
        source = str(move.get("source"))
        target = str(move.get("target"))
        if source not in position_by_id or target not in position_by_id:
            raise AvailabilityHousingError("court_move_invalid")
        court_outgoing[source].append(move)
        court_incoming[target].append(move)

    filter_registry = _read_json(
        source_root,
        "seven-governors-court-filter-algebra-v0.1.0/canonical/filter-operator-registry.json",
    )
    if filter_registry.get("filterAlgebraFingerprint") != (
        "40bd74397ff9f4c8c0f0b845630e008cea66c9495413195c1e1c92ff02968589"
    ):
        raise AvailabilityHousingError("court_filter_registry_identity_invalid")
    filter_by_position = {
        str(operator["filterId"]).removeprefix("court-filter:"): operator
        for operator in filter_registry.get("operators", [])
        if isinstance(operator, Mapping)
        and str(operator.get("filterId", "")).startswith("court-filter:C")
    }
    if set(position_by_id) - set(filter_by_position):
        raise AvailabilityHousingError("court_filter_position_closure_invalid")

    housing_records = project_context_housing(
        context_bundle,
        court_bundle=court_context_bundle,
        section_role_rules=policy["housingSectionRoles"],
    )
    lifecycle_records = build_skill_lifecycle_records(lifecycle_recipes, skill_by_id)
    nodes: dict[str, dict[str, object]] = {}
    relationships: dict[str, dict[str, object]] = {}
    policy_source_sha = source_hash["schemas/gov-210/skill-eligibility-policy.json"]
    release_logical_id = "gov210-release:1.0.0"
    _append_unique(
        nodes,
        _node(
            "Gov210AvailabilityRelease",
            release_logical_id,
            {
                "authority": "informational_catalog_only",
                "policyFingerprint": policy["policyFingerprint"],
                "releaseId": GOV210_RELEASE_ID,
                "runtimeAuthority": False,
            },
            source_sha256=policy_source_sha,
            admission_status="canonical",
        ),
    )

    for skill_id in sorted(skill_by_id):
        namespace, registry, skill = skill_by_id[skill_id]
        registry_path = f"skills/{namespace}/registry.json"
        registry_sha = source_hash[registry_path]
        availability_id = f"gov210-skill:{skill_id}"
        availability = {
            "apiVersion": registry["apiVersion"],
            "bundleId": registry["bundleId"],
            "bundleVersion": registry["bundleVersion"],
            "inputSchemaId": skill["inputSchemaId"],
            "name": skill["name"],
            "operationId": skill["operationId"],
            "outputSchemaId": skill["outputSchemaId"],
            "registryNamespace": namespace,
            "registrySha256": registry_sha,
            "skillId": skill_id,
        }
        _append_unique(
            nodes,
            _node(
                "Gov210SkillAvailability",
                availability_id,
                availability,
                source_sha256=registry_sha,
                admission_status="canonical",
            ),
        )
        eligibility = eligibility_by_skill[skill_id]
        eligibility_id = f"gov210-eligibility:{skill_id}"
        eligibility_properties = {
            "assignmentSemantics": "informational_catalog_only",
            "basisSelector": eligibility["basisSelector"],
            "eligibilityId": eligibility["eligibilityId"],
            "registryNamespace": eligibility["registryNamespace"],
            "runtimeAuthority": False,
            "skillId": skill_id,
            "targetNamespace": eligibility["targetNamespace"],
        }
        _append_unique(
            nodes,
            _node(
                "Gov210SkillEligibility",
                eligibility_id,
                eligibility_properties,
                source_sha256=policy_source_sha,
                admission_status="canonical",
            ),
        )
        for edge in (
            _relationship(
                "GOV210_DECLARES_AVAILABILITY",
                f"gov210-declares:{skill_id}",
                "Gov210AvailabilityRelease",
                release_logical_id,
                "Gov210SkillAvailability",
                availability_id,
                source_sha256=registry_sha,
            ),
            _relationship(
                "GOV210_HAS_ELIGIBILITY",
                f"gov210-has-eligibility:{skill_id}",
                "Gov210SkillAvailability",
                availability_id,
                "Gov210SkillEligibility",
                eligibility_id,
                source_sha256=policy_source_sha,
            ),
        ):
            _append_unique(relationships, edge)

    network_sha = source_hash["canonical/universal-network-data.json"]
    for state_id, target in sorted(topology_by_id.items()):
        _append_unique(
            nodes,
            _node(
                "Gov210TopologyTarget",
                f"gov210-topology-target:{state_id}",
                {
                    "fineRole": target.get("fineRole"),
                    "forte": target.get("forte"),
                    "name": target.get("name"),
                    "office": target.get("office"),
                    "role": target.get("role"),
                    "scaleStateId": state_id,
                    "tier": target.get("tier"),
                },
                source_sha256=network_sha,
                admission_status="canonical",
            ),
        )

    court_policy_sha = source_hash["schemas/court-runtime-policy.json"]
    for position_id, position in sorted(position_by_id.items()):
        kappa = position["kappaCourt"]
        _append_unique(
            nodes,
            _node(
                "Gov210CourtTarget",
                f"gov210-court-target:{position_id}",
                {
                    "index": position["index"],
                    "internalPoles": position["internalPoles"],
                    "kappaDenominator": kappa["denominator"],
                    "kappaNumerator": kappa["numerator"],
                    "pitchMask": position["pitchMask"],
                    "positionId": position_id,
                },
                source_sha256=court_policy_sha,
                admission_status="canonical",
            ),
        )

    assignment_records: list[tuple[dict[str, object], str]] = []
    for skill_id, eligibility in sorted(eligibility_by_skill.items()):
        selector = str(eligibility["basisSelector"])
        if selector == "availability_only":
            continue
        if str(eligibility["targetNamespace"]) == "topology":
            for state_id, target in sorted(topology_by_id.items()):
                selected: Sequence[Mapping[str, str]] = ()
                basis_ids: list[str]
                source_sha = network_sha
                if selector == "topology_node_identity":
                    basis_ids = [f"scale-state:{state_id}"]
                elif selector == "mutation_application_source":
                    selected = outgoing[state_id]
                    basis_ids = [str(row["application_id"]) for row in selected]
                    source_sha = source_hash[
                        "seven-governors-mutation-algebra-audit/audit/operator-applications.csv"
                    ]
                elif selector == "mutation_application_target":
                    selected = incoming[state_id]
                    basis_ids = [str(row["application_id"]) for row in selected]
                    source_sha = source_hash[
                        "seven-governors-mutation-algebra-audit/audit/operator-applications.csv"
                    ]
                else:
                    raise AvailabilityHousingError("topology_selector_invalid")
                assignment_id = f"assignment:{skill_id}:topology:{state_id}"
                assignment_records.append(
                    (
                        _basis_properties(
                            assignment_id=assignment_id,
                            skill_id=skill_id,
                            target_namespace="topology",
                            target_id=state_id,
                            basis_kind=selector,
                            basis_ids=basis_ids,
                            applications=selected,
                            target_role=str(target.get("role")) if target.get("role") else None,
                            target_tier=str(target.get("tier")) if target.get("tier") else None,
                            target_office=str(target.get("office")) if target.get("office") else None,
                        ),
                        source_sha,
                    )
                )
        else:
            for position_id in sorted(position_by_id):
                selected_moves: Sequence[Mapping[str, object]] = ()
                if selector == "court_position_identity":
                    basis_ids = [f"court-position:{position_id}"]
                    source_sha = court_policy_sha
                elif selector in {"court_ordinary_move_source", "court_ordinary_move_target"}:
                    selected_moves = (
                        court_outgoing[position_id]
                        if selector.endswith("source")
                        else court_incoming[position_id]
                    )
                    basis_ids = [
                        f"court-move:{move['source']}:{move['target']}:{move['operationId']}"
                        for move in selected_moves
                    ]
                    source_sha = court_policy_sha
                elif selector == "court_filter_position":
                    basis_ids = [str(filter_by_position[position_id]["filterId"])]
                    source_sha = source_hash[
                        "seven-governors-court-filter-algebra-v0.1.0/canonical/filter-operator-registry.json"
                    ]
                else:
                    raise AvailabilityHousingError("court_selector_invalid")
                assignment_id = f"assignment:{skill_id}:court:{position_id}"
                assignment_records.append(
                    (
                        _basis_properties(
                            assignment_id=assignment_id,
                            skill_id=skill_id,
                            target_namespace="court",
                            target_id=position_id,
                            basis_kind=selector,
                            basis_ids=basis_ids,
                        ),
                        source_sha,
                    )
                )

    for assignment, source_sha in sorted(
        assignment_records, key=lambda item: str(item[0]["assignmentId"])
    ):
        assignment_id = str(assignment["assignmentId"])
        logical_id = f"gov210-{assignment_id}"
        skill_id = str(assignment["skillId"])
        target_namespace = str(assignment["targetNamespace"])
        target_id = assignment["targetId"]
        target_label = (
            "Gov210TopologyTarget" if target_namespace == "topology" else "Gov210CourtTarget"
        )
        target_logical_id = f"gov210-{target_namespace}-target:{target_id}"
        _append_unique(
            nodes,
            _node(
                "Gov210SkillAssignment",
                logical_id,
                assignment,
                source_sha256=source_sha,
                admission_status="informational",
            ),
        )
        for edge in (
            _relationship(
                "GOV210_ASSIGNS_SKILL",
                f"gov210-assigns:{skill_id}:{target_namespace}:{target_id}",
                "Gov210SkillEligibility",
                f"gov210-eligibility:{skill_id}",
                "Gov210SkillAssignment",
                logical_id,
                source_sha256=source_sha,
            ),
            _relationship(
                "GOV210_TARGETS",
                f"gov210-targets:{skill_id}:{target_namespace}:{target_id}",
                "Gov210SkillAssignment",
                logical_id,
                target_label,
                target_logical_id,
                source_sha256=source_sha,
            ),
        ):
            _append_unique(relationships, edge)

    for housing in housing_records:
        logical_id = f"gov210-{housing['housingId']}"
        source_sha = str(housing["sourceBundleFingerprint"])
        _append_unique(
            nodes,
            _node(
                "Gov210ContextHousing",
                logical_id,
                housing,
                source_sha256=source_sha,
                admission_status="contextual",
            ),
        )
        _append_unique(
            relationships,
            _relationship(
                "GOV210_DECLARES_HOUSING",
                f"gov210-declares-{housing['housingId']}",
                "Gov210AvailabilityRelease",
                release_logical_id,
                "Gov210ContextHousing",
                logical_id,
                source_sha256=source_sha,
            ),
        )

    for event in lifecycle_records:
        logical_id = f"gov210-lifecycle:{event['eventId']}"
        source_sha = str(event["eventSha256"])
        _append_unique(
            nodes,
            _node(
                "Gov210SkillLifecycle",
                logical_id,
                event,
                source_sha256=source_sha,
                admission_status="informational",
            ),
        )
        for edge in (
            _relationship(
                "GOV210_DECLARES_LIFECYCLE",
                f"gov210-declares-lifecycle:{event['eventId']}",
                "Gov210AvailabilityRelease",
                release_logical_id,
                "Gov210SkillLifecycle",
                logical_id,
                source_sha256=source_sha,
            ),
            _relationship(
                "GOV210_REFERENCES_SKILL",
                f"gov210-lifecycle-skill:{event['eventId']}:{event['skillId']}",
                "Gov210SkillLifecycle",
                logical_id,
                "Gov210SkillAvailability",
                f"gov210-skill:{event['skillId']}",
                source_sha256=source_sha,
            ),
        ):
            _append_unique(relationships, edge)

    sorted_nodes = sorted(nodes.values(), key=lambda record: str(record["logicalId"]))
    sorted_relationships = sorted(
        relationships.values(), key=lambda record: str(record["logicalId"])
    )
    assignment_nodes = [
        node for node in sorted_nodes if node["label"] == "Gov210SkillAssignment"
    ]
    mutation_skills = (
        "list_legal_moves",
        "validate_and_execute_move",
        "verify_outcome",
    )
    court_move_skills = (
        "list_legal_court_moves",
        "validate_and_execute_court_transition",
        "verify_court_postcondition",
    )
    coverage = {
        "availabilityByNamespace": {"court": 5, "governor": 5},
        "courtFilterCount": 5,
        "courtOrdinaryMoveCount": len(ordinary_moves),
        "courtOrdinaryMoveCoverageBySkill": {
            skill_id: len(
                {
                    basis_id
                    for node in assignment_nodes
                    if node["properties"]["skillId"] == skill_id
                    for basis_id in node["properties"]["basisIds"]
                }
            )
            for skill_id in court_move_skills
        },
        "courtPositionCount": len(position_by_id),
        "eligibilityCount": len(eligibility_by_skill),
        "mutationApplicationCount": len(application_ids),
        "mutationApplicationCoverageBySkill": {
            skill_id: len(
                {
                    application_id
                    for node in assignment_nodes
                    if node["properties"]["skillId"] == skill_id
                    for application_id in node["properties"]["applicationIds"]
                }
            )
            for skill_id in mutation_skills
        },
        "mutationOperatorCount": len(operator_ids),
        "topologyTargetCount": len(topology_by_id),
    }
    counts = {
        "assignmentCount": len(assignment_records),
        "availabilityCount": len(skill_by_id),
        "courtTargetCount": len(position_by_id),
        "eligibilityCount": len(eligibility_by_skill),
        "housingCount": len(housing_records),
        "lifecycleCount": len(lifecycle_records),
        "nodeCount": len(sorted_nodes),
        "relationshipCount": len(sorted_relationships),
        "topologyTargetCount": len(topology_by_id),
    }
    core = {
        "authority": "informational_catalog_only",
        "counts": counts,
        "coverage": coverage,
        "nodes": sorted_nodes,
        "relationships": sorted_relationships,
        "releaseId": GOV210_RELEASE_ID,
        "runtimeAuthority": False,
        "schemaVersion": GOV210_SCHEMA_VERSION,
        "sourceBindings": sorted(bindings, key=lambda binding: str(binding["path"])),
    }
    snapshot = {**core, "projectionFingerprint": sha256_payload(core)}
    if _verify_result and not verify_availability_housing_projection(snapshot):
        raise AvailabilityHousingError("built_projection_invalid")
    return snapshot


@lru_cache(maxsize=1)
def _canonical_static_projection() -> dict[str, object]:
    return build_availability_housing_projection(root=ROOT, _verify_result=False)


def _verify_availability_housing_projection(snapshot: Mapping[str, object]) -> bool:
    if (
        snapshot.get("schemaVersion") != GOV210_SCHEMA_VERSION
        or snapshot.get("releaseId") != GOV210_RELEASE_ID
        or snapshot.get("authority") != "informational_catalog_only"
        or snapshot.get("runtimeAuthority") is not False
    ):
        return False
    core = {key: value for key, value in snapshot.items() if key != "projectionFingerprint"}
    if snapshot.get("projectionFingerprint") != sha256_payload(core):
        return False
    nodes = snapshot.get("nodes")
    relationships = snapshot.get("relationships")
    counts = snapshot.get("counts")
    coverage = snapshot.get("coverage")
    bindings = snapshot.get("sourceBindings")
    if not all(isinstance(value, list) for value in (nodes, relationships, bindings)):
        return False
    if not isinstance(counts, Mapping) or not isinstance(coverage, Mapping):
        return False
    assert isinstance(nodes, list) and isinstance(relationships, list) and isinstance(bindings, list)
    node_ids = [record.get("logicalId") for record in nodes if isinstance(record, Mapping)]
    rel_ids = [record.get("logicalId") for record in relationships if isinstance(record, Mapping)]
    if (
        len(node_ids) != len(nodes)
        or len(rel_ids) != len(relationships)
        or any(not isinstance(value, str) for value in (*node_ids, *rel_ids))
        or node_ids != sorted(node_ids)
        or rel_ids != sorted(rel_ids)
        or len(set(node_ids)) != len(node_ids)
        or len(set(rel_ids)) != len(rel_ids)
    ):
        return False
    node_by_id: dict[str, Mapping[str, object]] = {}
    labels: dict[str, str] = {}
    by_label: dict[str, list[Mapping[str, object]]] = defaultdict(list)
    for node in nodes:
        if not isinstance(node, Mapping):
            return False
        label = node.get("label")
        properties = node.get("properties")
        if (
            set(node)
            != {
                "admissionStatus",
                "label",
                "logicalId",
                "properties",
                "recordSha256",
                "sourceSha256",
            }
            or label not in NODE_LABELS
            or not isinstance(properties, Mapping)
        ):
            return False
        record_core = {key: value for key, value in node.items() if key != "recordSha256"}
        if node.get("recordSha256") != sha256_payload(record_core) or not _is_sha256(
            node.get("sourceSha256")
        ):
            return False
        if (
            set(properties) != _NODE_PROPERTY_KEYS[str(label)]
            or node.get("admissionStatus") != _NODE_ADMISSION[str(label)]
        ):
            return False
        expected_source = None
        if label in {"Gov210AvailabilityRelease", "Gov210SkillEligibility"}:
            expected_source = CLOSED_SOURCE_SHA256[
                "schemas/gov-210/skill-eligibility-policy.json"
            ]
        elif label == "Gov210SkillAvailability":
            expected_source = CLOSED_SOURCE_SHA256.get(
                f"skills/{properties.get('registryNamespace')}/registry.json"
            )
        elif label == "Gov210TopologyTarget":
            expected_source = CLOSED_SOURCE_SHA256["canonical/universal-network-data.json"]
        elif label == "Gov210CourtTarget":
            expected_source = CLOSED_SOURCE_SHA256["schemas/court-runtime-policy.json"]
        elif label == "Gov210SkillAssignment":
            selector = properties.get("basisKind")
            if selector == "topology_node_identity":
                expected_source = CLOSED_SOURCE_SHA256[
                    "canonical/universal-network-data.json"
                ]
            elif selector in {
                "mutation_application_source",
                "mutation_application_target",
            }:
                expected_source = CLOSED_SOURCE_SHA256[
                    "seven-governors-mutation-algebra-audit/audit/operator-applications.csv"
                ]
            elif selector in {
                "court_position_identity",
                "court_ordinary_move_source",
                "court_ordinary_move_target",
            }:
                expected_source = CLOSED_SOURCE_SHA256[
                    "schemas/court-runtime-policy.json"
                ]
            elif selector == "court_filter_position":
                expected_source = CLOSED_SOURCE_SHA256[
                    "seven-governors-court-filter-algebra-v0.1.0/canonical/filter-operator-registry.json"
                ]
        elif label == "Gov210ContextHousing":
            expected_source = properties.get("sourceBundleFingerprint")
        elif label == "Gov210SkillLifecycle":
            expected_source = properties.get("eventSha256")
        if node.get("sourceSha256") != expected_source:
            return False
        logical_id = str(node["logicalId"])
        node_by_id[logical_id] = node
        labels[logical_id] = str(label)
        by_label[str(label)].append(node)
        if label in {"Gov210SkillAvailability", "Gov210SkillEligibility"} and _contains_key(
            properties, _FORBIDDEN_SKILL_KEYS
        ):
            return False
        if label == "Gov210ContextHousing" and _contains_key(
            properties, _FORBIDDEN_HOUSING_KEYS
        ):
            return False
        if label == "Gov210SkillAssignment" and (
            properties.get("informationalOnly") is not True
            or properties.get("runtimeAuthority") is not False
        ):
            return False
        if label == "Gov210SkillEligibility" and (
            properties.get("runtimeAuthority") is not False
            or properties.get("assignmentSemantics") != "informational_catalog_only"
            or properties.get("basisSelector") not in _SELECTORS
        ):
            return False
        if label == "Gov210ContextHousing":
            housing_core = {
                key: value for key, value in properties.items() if key != "housingFingerprint"
            }
            if (
                properties.get("housingFingerprint") != sha256_payload(housing_core)
                or properties.get("sectionRoleStatus")
                != "derived_from_frontmatter_structure"
                or not _PUBLIC_ID.fullmatch(str(properties.get("noteId", "")))
                or any(
                    not str(value).startswith("provenance-sha256:")
                    for value in properties.get("provenanceRefs", [])
                )
            ):
                return False
    if len(by_label["Gov210AvailabilityRelease"]) != 1:
        return False
    release = by_label["Gov210AvailabilityRelease"][0]
    release_properties = release["properties"]
    if release_properties.get("authority") != "informational_catalog_only" or (
        release_properties.get("runtimeAuthority") is not False
        or release_properties.get("releaseId") != GOV210_RELEASE_ID
        or not _is_sha256(release_properties.get("policyFingerprint"))
    ):
        return False
    if (
        release_properties.get("policyFingerprint")
        != "0f3e2c2fb8bb85a656425d6a1b580480c966422d52b565c0ed61425a89c980ac"
        or release.get("sourceSha256")
        != CLOSED_SOURCE_SHA256["schemas/gov-210/skill-eligibility-policy.json"]
    ):
        return False

    outgoing: dict[str, dict[str, list[Mapping[str, object]]]] = defaultdict(
        lambda: defaultdict(list)
    )
    incoming: dict[str, dict[str, list[Mapping[str, object]]]] = defaultdict(
        lambda: defaultdict(list)
    )
    for edge in relationships:
        if not isinstance(edge, Mapping):
            return False
        relationship_type = edge.get("relationshipType")
        if (
            set(edge)
            != {
                "admissionStatus",
                "logicalId",
                "properties",
                "recordSha256",
                "relationshipType",
                "sourceLabel",
                "sourceLogicalId",
                "sourceSha256",
                "targetLabel",
                "targetLogicalId",
            }
            or relationship_type not in RELATIONSHIP_TYPES
            or edge.get("admissionStatus") != "informational"
            or edge.get("properties") != {"runtimeAuthority": False}
        ):
            return False
        record_core = {key: value for key, value in edge.items() if key != "recordSha256"}
        if edge.get("recordSha256") != sha256_payload(record_core) or not _is_sha256(
            edge.get("sourceSha256")
        ):
            return False
        source_id = str(edge.get("sourceLogicalId"))
        target_id = str(edge.get("targetLogicalId"))
        if source_id not in node_by_id or target_id not in node_by_id:
            return False
        expected_source, expected_target = _ENDPOINTS[str(relationship_type)]
        target_label = labels[target_id]
        if labels[source_id] != expected_source or (
            target_label not in expected_target
            if isinstance(expected_target, tuple)
            else target_label != expected_target
        ):
            return False
        if edge.get("sourceLabel") != labels[source_id] or edge.get("targetLabel") != target_label:
            return False
        expected_edge_source = {
            "GOV210_DECLARES_AVAILABILITY": node_by_id[target_id]["sourceSha256"],
            "GOV210_HAS_ELIGIBILITY": node_by_id[target_id]["sourceSha256"],
            "GOV210_ASSIGNS_SKILL": node_by_id[target_id]["sourceSha256"],
            "GOV210_TARGETS": node_by_id[source_id]["sourceSha256"],
            "GOV210_DECLARES_HOUSING": node_by_id[target_id]["sourceSha256"],
            "GOV210_DECLARES_LIFECYCLE": node_by_id[target_id]["sourceSha256"],
            "GOV210_REFERENCES_SKILL": node_by_id[source_id]["sourceSha256"],
        }[str(relationship_type)]
        if edge.get("sourceSha256") != expected_edge_source:
            return False
        outgoing[source_id][str(relationship_type)].append(edge)
        incoming[target_id][str(relationship_type)].append(edge)

    availability = by_label["Gov210SkillAvailability"]
    eligibility = by_label["Gov210SkillEligibility"]
    assignments = by_label["Gov210SkillAssignment"]
    topology_targets = by_label["Gov210TopologyTarget"]
    court_targets = by_label["Gov210CourtTarget"]
    if not (
        len(availability) == 10
        and len(eligibility) == 10
        and len(topology_targets) == 462
        and len(court_targets) == 5
    ):
        return False
    availability_skills = {str(node["properties"]["skillId"]) for node in availability}
    eligibility_skills = {str(node["properties"]["skillId"]) for node in eligibility}
    if availability_skills != eligibility_skills or len(availability_skills) != 10:
        return False
    availability_by_skill = {
        str(node["properties"]["skillId"]): node for node in availability
    }
    eligibility_by_skill = {
        str(node["properties"]["skillId"]): node for node in eligibility
    }
    if availability_skills != set(EXPECTED_ELIGIBILITY):
        return False
    if {
        skill_id: (
            str(node["properties"].get("registryNamespace")),
            str(node["properties"].get("targetNamespace")),
            str(node["properties"].get("basisSelector")),
        )
        for skill_id, node in eligibility_by_skill.items()
    } != EXPECTED_ELIGIBILITY:
        return False
    for skill_id, node in availability_by_skill.items():
        properties = node["properties"]
        expected_registry_sha = CLOSED_SOURCE_SHA256[
            f"skills/{properties['registryNamespace']}/registry.json"
        ]
        if (
            properties.get("registrySha256") != expected_registry_sha
            or node.get("sourceSha256") != expected_registry_sha
            or len(incoming[str(node["logicalId"])]["GOV210_DECLARES_AVAILABILITY"]) != 1
            or len(outgoing[str(node["logicalId"])]["GOV210_HAS_ELIGIBILITY"]) != 1
        ):
            return False
        declares = incoming[str(node["logicalId"])]["GOV210_DECLARES_AVAILABILITY"][0]
        eligibility_edge = outgoing[str(node["logicalId"])]["GOV210_HAS_ELIGIBILITY"][0]
        if (
            declares["sourceLogicalId"] != release["logicalId"]
            or eligibility_edge["targetLogicalId"]
            != eligibility_by_skill[skill_id]["logicalId"]
        ):
            return False
    for node in eligibility:
        props = node["properties"]
        selector = props.get("basisSelector")
        assigned = outgoing[str(node["logicalId"])]["GOV210_ASSIGNS_SKILL"]
        if (
            node.get("logicalId") != f"gov210-eligibility:{props['skillId']}"
            or props.get("eligibilityId") != f"eligibility:{props['skillId']}"
            or node.get("sourceSha256")
            != CLOSED_SOURCE_SHA256["schemas/gov-210/skill-eligibility-policy.json"]
        ):
            return False
        if selector == "availability_only" and assigned:
            return False
        if selector != "availability_only" and not assigned:
            return False
        if props.get("registryNamespace") != availability_by_skill[str(props["skillId"])][
            "properties"
        ]["registryNamespace"]:
            return False
        if any(
            node_by_id[str(edge["targetLogicalId"])]["properties"]["skillId"]
            != props["skillId"]
            for edge in assigned
        ):
            return False
    for node in assignments:
        logical_id = str(node["logicalId"])
        properties = node["properties"]
        if (
            len(incoming[logical_id]["GOV210_ASSIGNS_SKILL"]) != 1
            or len(outgoing[logical_id]["GOV210_TARGETS"]) != 1
            or properties.get("basisSha256")
            != sha256_payload(
                {
                    key: properties[key]
                    for key in (
                        "applicationIds",
                        "basisIds",
                        "basisKind",
                        "degreeAddresses",
                        "directions",
                        "edgeIds",
                        "operatorIds",
                        "targetId",
                        "targetNamespace",
                        "targetOffice",
                        "targetRole",
                        "targetTier",
                    )
                }
            )
        ):
            return False
        eligibility_edge = incoming[logical_id]["GOV210_ASSIGNS_SKILL"][0]
        eligibility_properties = node_by_id[str(eligibility_edge["sourceLogicalId"])][
            "properties"
        ]
        target_edge = outgoing[logical_id]["GOV210_TARGETS"][0]
        target = node_by_id[str(target_edge["targetLogicalId"])]
        target_properties = target["properties"]
        expected_target_label = (
            "Gov210TopologyTarget"
            if properties["targetNamespace"] == "topology"
            else "Gov210CourtTarget"
        )
        expected_target_id = (
            target_properties.get("scaleStateId")
            if expected_target_label == "Gov210TopologyTarget"
            else target_properties.get("positionId")
        )
        if (
            properties.get("skillId") != eligibility_properties.get("skillId")
            or properties.get("basisKind") != eligibility_properties.get("basisSelector")
            or target.get("label") != expected_target_label
            or properties.get("targetId") != expected_target_id
            or any(
                not isinstance(values, list)
                or values != sorted(set(values))
                for values in (
                    properties.get("applicationIds"),
                    properties.get("basisIds"),
                    properties.get("degreeAddresses"),
                    properties.get("directions"),
                    properties.get("edgeIds"),
                    properties.get("operatorIds"),
                )
            )
        ):
            return False
    if len(assignments) != 1873:
        return False
    topology_ids = {node["properties"].get("scaleStateId") for node in topology_targets}
    court_ids = {node["properties"].get("positionId") for node in court_targets}
    expected_topology_ids = {
        value for value in range(1, 1 << 12) if value & 1 and value.bit_count() == 7
    }
    if topology_ids != expected_topology_ids or court_ids != {
        "C0",
        "C1",
        "C2",
        "C3",
        "C4",
    }:
        return False
    if any(
        len(incoming[str(node["logicalId"])]["GOV210_TARGETS"])
        != (4 if node["label"] == "Gov210TopologyTarget" else 5)
        for node in (*topology_targets, *court_targets)
    ):
        return False

    assignment_properties = [node["properties"] for node in assignments]
    mutation_skills = (
        "list_legal_moves",
        "validate_and_execute_move",
        "verify_outcome",
    )
    mutation_coverage = {
        skill_id: len(
            {
                application_id
                for properties in assignment_properties
                if properties["skillId"] == skill_id
                for application_id in properties["applicationIds"]
            }
        )
        for skill_id in mutation_skills
    }
    mutation_operator_count = len(
        {
            operator_id
            for properties in assignment_properties
            if properties["skillId"] in mutation_skills
            for operator_id in properties["operatorIds"]
        }
    )
    court_move_skills = (
        "list_legal_court_moves",
        "validate_and_execute_court_transition",
        "verify_court_postcondition",
    )
    court_move_coverage = {
        skill_id: len(
            {
                basis_id
                for properties in assignment_properties
                if properties["skillId"] == skill_id
                for basis_id in properties["basisIds"]
            }
        )
        for skill_id in court_move_skills
    }
    court_filter_count = len(
        {
            basis_id
            for properties in assignment_properties
            if properties["skillId"] == "project_through_court"
            for basis_id in properties["basisIds"]
        }
    )

    housing_nodes = by_label["Gov210ContextHousing"]
    if any(
        len(incoming[str(node["logicalId"])]["GOV210_DECLARES_HOUSING"]) != 1
        or incoming[str(node["logicalId"])]["GOV210_DECLARES_HOUSING"][0][
            "sourceLogicalId"
        ]
        != release["logicalId"]
        for node in housing_nodes
    ):
        return False
    lifecycle_nodes = by_label["Gov210SkillLifecycle"]
    lifecycle_by_skill: dict[str, list[Mapping[str, object]]] = defaultdict(list)
    for node in lifecycle_nodes:
        props = node["properties"]
        core_event = {key: value for key, value in props.items() if key != "eventSha256"}
        if (
            props.get("eventSha256") != sha256_payload(core_event)
            or len(incoming[str(node["logicalId"])]["GOV210_DECLARES_LIFECYCLE"]) != 1
            or len(outgoing[str(node["logicalId"])]["GOV210_REFERENCES_SKILL"]) != 1
            or node_by_id[
                str(outgoing[str(node["logicalId"])]["GOV210_REFERENCES_SKILL"][0]["targetLogicalId"])
            ]["properties"]["skillId"]
            != props.get("skillId")
        ):
            return False
        lifecycle_by_skill[str(props["skillId"])].append(node)
    for events in lifecycle_by_skill.values():
        prior = GENESIS_SHA256
        for sequence, node in enumerate(
            sorted(events, key=lambda event: int(event["properties"]["sequence"])), 1
        ):
            props = node["properties"]
            if (
                props.get("sequence") != sequence
                or props.get("action") != ("publish", "validate", "retire")[sequence - 1]
                or props.get("priorEventSha256") != prior
            ):
                return False
            prior = str(props["eventSha256"])
    expected_counts = {
        "assignmentCount": len(assignments),
        "availabilityCount": len(availability),
        "courtTargetCount": len(court_targets),
        "eligibilityCount": len(eligibility),
        "housingCount": len(by_label["Gov210ContextHousing"]),
        "lifecycleCount": len(by_label["Gov210SkillLifecycle"]),
        "nodeCount": len(nodes),
        "relationshipCount": len(relationships),
        "topologyTargetCount": len(topology_targets),
    }
    if dict(counts) != expected_counts:
        return False
    if coverage.get("availabilityByNamespace") != {"court": 5, "governor": 5}:
        return False
    if coverage.get("eligibilityCount") != 10 or coverage.get("topologyTargetCount") != 462:
        return False
    if coverage.get("mutationApplicationCount") != 3402 or coverage.get("mutationOperatorCount") != 15:
        return False
    if mutation_coverage != {
        "list_legal_moves": 3402,
        "validate_and_execute_move": 3402,
        "verify_outcome": 3402,
    } or coverage.get("mutationApplicationCoverageBySkill") != mutation_coverage:
        return False
    if (
        mutation_operator_count != 15
        or coverage.get("courtPositionCount") != 5
        or court_filter_count != 5
        or coverage.get("courtFilterCount") != court_filter_count
    ):
        return False
    if coverage.get("courtOrdinaryMoveCount") != 8 or coverage.get(
        "courtOrdinaryMoveCoverageBySkill"
    ) != court_move_coverage or court_move_coverage != {
        "list_legal_court_moves": 8,
        "validate_and_execute_court_transition": 8,
        "verify_court_postcondition": 8,
    }:
        return False
    expected_binding_ids = {
        path: dependency_id for dependency_id, path in SOURCE_BINDINGS
    }
    if (
        len(bindings) != len(SOURCE_PATHS)
        or any(not isinstance(binding, Mapping) for binding in bindings)
        or [binding.get("path") for binding in bindings] != sorted(SOURCE_PATHS)
        or len({binding.get("dependencyId") for binding in bindings}) != len(bindings)
    ):
        return False
    if not all(
        binding.get("dependencyId") == expected_binding_ids.get(str(binding.get("path")))
        and binding.get("sha256") == CLOSED_SOURCE_SHA256.get(str(binding.get("path")))
        for binding in bindings
    ):
        return False
    expected = _canonical_static_projection()
    static_labels = set(NODE_LABELS) - {"Gov210ContextHousing", "Gov210SkillLifecycle"}
    static_relationships = set(RELATIONSHIP_TYPES) - {
        "GOV210_DECLARES_HOUSING",
        "GOV210_DECLARES_LIFECYCLE",
        "GOV210_REFERENCES_SKILL",
    }
    if [node for node in nodes if node["label"] in static_labels] != [
        node for node in expected["nodes"] if node["label"] in static_labels
    ]:
        return False
    if [
        edge for edge in relationships if edge["relationshipType"] in static_relationships
    ] != [
        edge
        for edge in expected["relationships"]
        if edge["relationshipType"] in static_relationships
    ]:
        return False
    return True


def verify_availability_housing_projection(snapshot: Mapping[str, object]) -> bool:
    try:
        return _verify_availability_housing_projection(snapshot)
    except (IndexError, KeyError, TypeError, ValueError):
        return False


def serialize_availability_housing_projection(snapshot: Mapping[str, object]) -> bytes:
    if not verify_availability_housing_projection(snapshot):
        raise AvailabilityHousingError("projection_invalid")
    return canonical_json_bytes(snapshot)


def iter_gov210_ingestion_batches(
    snapshot: Mapping[str, object], *, batch_size: int = 100
) -> tuple[Gov210IngestionBatch, ...]:
    """Return stable, convergent reset-and-MERGE batches in dependency order."""

    if not verify_availability_housing_projection(snapshot):
        raise AvailabilityHousingError("projection_invalid")
    if type(batch_size) is not int or not 1 <= batch_size <= 1000:
        raise AvailabilityHousingError("batch_size_invalid")
    nodes = snapshot["nodes"]
    relationships = snapshot["relationships"]
    assert isinstance(nodes, list) and isinstance(relationships, list)
    projection_fingerprint = str(snapshot["projectionFingerprint"])
    batches: list[Gov210IngestionBatch] = [
        Gov210IngestionBatch(
            1,
            "reset:relationships",
            "MATCH ()-[r]->() WHERE type(r) IN $relationshipTypes DELETE r",
            {
                "projectionFingerprint": projection_fingerprint,
                "relationshipTypes": list(RELATIONSHIP_TYPES),
            },
        ),
        Gov210IngestionBatch(
            2,
            "reset:nodes",
            "MATCH (n) WHERE any(label IN labels(n) WHERE label IN $nodeLabels) DETACH DELETE n",
            {
                "nodeLabels": list(NODE_LABELS),
                "projectionFingerprint": projection_fingerprint,
            },
        ),
    ]

    def append(kind: str, cypher: str, records: list[dict[str, object]]) -> None:
        for offset in range(0, len(records), batch_size):
            batches.append(
                Gov210IngestionBatch(
                    len(batches) + 1,
                    kind,
                    cypher,
                    {
                        "projectionFingerprint": projection_fingerprint,
                        "records": records[offset : offset + batch_size],
                    },
                )
            )

    for label in NODE_LABELS:
        append(
            f"nodes:{label}",
            f"""UNWIND $records AS record
MERGE (n:{label} {{logicalId: record.logicalId}})
SET n = record.properties
SET n.logicalId = record.logicalId, n.recordSha256 = record.recordSha256,
    n.sourceSha256 = record.sourceSha256, n.admissionStatus = record.admissionStatus,
    n.projectionFingerprint = $projectionFingerprint""",
            [dict(record) for record in nodes if record["label"] == label],
        )
    for relationship_type in RELATIONSHIP_TYPES:
        source_label, target_spec = _ENDPOINTS[relationship_type]
        records = [
            dict(record)
            for record in relationships
            if record["relationshipType"] == relationship_type
        ]
        if not records:
            continue
        if isinstance(target_spec, tuple):
            target_match = "MATCH (target {logicalId: record.targetLogicalId})\nWHERE any(label IN labels(target) WHERE label IN ['Gov210TopologyTarget', 'Gov210CourtTarget'])"
        else:
            target_match = f"MATCH (target:{target_spec} {{logicalId: record.targetLogicalId}})"
        cypher = f"""UNWIND $records AS record
MATCH (source:{source_label} {{logicalId: record.sourceLogicalId}})
{target_match}
MERGE (source)-[r:{relationship_type} {{logicalId: record.logicalId}}]->(target)
SET r = record.properties
SET r.logicalId = record.logicalId, r.recordSha256 = record.recordSha256,
    r.sourceSha256 = record.sourceSha256, r.admissionStatus = record.admissionStatus,
    r.projectionFingerprint = $projectionFingerprint"""
        append(f"relationships:{relationship_type}", cypher, records)
    return tuple(batches)
