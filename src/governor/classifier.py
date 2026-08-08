"""Pure, deterministic execution of admitted Governor bridge rules.

The classifier consumes in-memory policy and request mappings only.  It does
not resolve canonical topology, consult a graph, or expose any mutation path.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
import math
import re
import unicodedata
from typing import Any

from .hashing import sha256_payload
from .models import FrozenDict, GOVERNORS, freeze_json, thaw_json


MAX_FACTS = 256
MAX_QUANTITIES = 128
MAX_REQUESTED_ASPECT_IDS = 64
MAX_PROVENANCE_RECORDS = 32
MAX_POLICY_ASPECTS = 1024
MAX_POLICY_RULES = 4096
MAX_RULE_ANTECEDENTS = 64
MAX_IDENTIFIER_LENGTH = 256
MAX_TEXT_LENGTH = 4096

_IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$")
_SHA256_PATTERN = re.compile(r"^[0-9a-f]{64}$")
_VERSION_SUFFIX_PATTERN = re.compile(r"^v[0-9]+$")

_SUBJECT_TYPES = frozenset(
    {"governor_profile", "domain_entity", "phenomenon_model", "runtime_task"}
)
_FACT_EPISTEMIC_CLASSES = frozenset(
    {
        "framework_declared_physical_anchor",
        "physically_derived",
        "physical_anchor_plus_normalization_convention",
        "observed_measurement",
        "formally_audited",
        "framework_validated_topology",
        "authored_correspondence",
        "authored_descriptive_model",
        "empirical_domain_fact",
        "canonical_reference_library",
        "compiled_constraint",
        "framework_order_plus_registry_coordinate_convention",
        "causal_claim",
        "unresolved_measure",
    }
)
_QUANTITY_EPISTEMIC_CLASSES = frozenset(
    {
        "framework_declared_physical_anchor",
        "physically_derived",
        "physical_anchor_plus_normalization_convention",
        "observed_measurement",
    }
)
_DIMENSION_UNITS = {
    "length": frozenset({"nm", "m"}),
    "frequency": frozenset({"Hz"}),
    "energy": frozenset({"J", "eV"}),
    "dimensionless": frozenset({"one", "normalized_inverse_wavelength"}),
}
_ANTECEDENT_KINDS = frozenset(
    {
        "feature_equals",
        "feature_contains",
        "owner_equals",
        "relation_equals",
        "operation_result",
        "assumption_holds",
    }
)
_MISSING_POLICIES = frozenset(
    {"rule_not_applicable", "return_unresolved", "reject_invalid"}
)
_CONFLICT_POLICIES = frozenset(
    {"prefer_higher_priority_then_ambiguous", "return_ambiguous", "reject_invalid"}
)
_FEATURE_QUANTITY_SIGNATURES = {
    "physical.wavelength_nm": ("length", "nm"),
    "physical.frequency_hz": ("frequency", "Hz"),
    "physical.photon_energy_j": ("energy", "J"),
    "physical.photon_energy_ev": ("energy", "eV"),
    "physical.C_P": ("dimensionless", "normalized_inverse_wavelength"),
}


class ClassifierError(ValueError):
    """A stable request or policy boundary rejection."""

    def __init__(self, reason_code: str) -> None:
        super().__init__(reason_code)
        self.reason_code = reason_code


@dataclass(frozen=True, slots=True)
class _Rule:
    rule_id: str
    output_aspect_id: str
    primary_governor: str
    priority: int
    missing_policy: str
    conflict_policy: str
    antecedents: tuple[FrozenDict, ...]


@dataclass(frozen=True, slots=True)
class _Policy:
    schema_version: str
    release_id: str
    policy_fingerprint: str
    source_fingerprint: str
    aspects: FrozenDict
    active_aspect_ids: frozenset[str]
    rules: tuple[_Rule, ...]
    operations: FrozenDict
    feature_ids: frozenset[str]


@dataclass(frozen=True, slots=True)
class _Fact:
    fact_id: str
    kind: str
    facet_path: str
    feature_id: str | None
    value: Any
    provenance_source_ids: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class _Quantity:
    quantity_id: str
    value: int | float | Decimal
    dimension: str
    unit: str
    epistemic_class: str
    basis_kind: str
    operation_id: str | None
    input_quantity_ids: tuple[str, ...]
    assumptions: tuple[str, ...]
    provenance_source_ids: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class _PreparedRequest:
    subject_id: str
    facts: tuple[_Fact, ...]
    quantities: tuple[_Quantity, ...]
    requested_aspect_ids: tuple[str, ...]
    request_fingerprint: str
    global_error_codes: tuple[str, ...]
    path_error_codes: FrozenDict


@dataclass(frozen=True, slots=True)
class _AntecedentEvaluation:
    state: str
    fact_ids: tuple[str, ...] = ()
    provenance_source_ids: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class _RuleMatch:
    rule: _Rule
    fact_ids: tuple[str, ...]
    provenance_source_ids: tuple[str, ...]


def _is_sequence(value: Any) -> bool:
    return isinstance(value, Sequence) and not isinstance(
        value, (str, bytes, bytearray)
    )


def _identifier(value: Any, reason_code: str) -> str:
    if not isinstance(value, str) or not _IDENTIFIER_PATTERN.fullmatch(value):
        raise ClassifierError(reason_code)
    return value


def _sha256(value: Any, reason_code: str) -> str:
    if not isinstance(value, str) or not _SHA256_PATTERN.fullmatch(value):
        raise ClassifierError(reason_code)
    return value


def _mapping(value: Any, reason_code: str) -> FrozenDict:
    if not isinstance(value, Mapping):
        raise ClassifierError(reason_code)
    try:
        frozen = freeze_json(value)
    except (TypeError, ValueError) as error:
        raise ClassifierError(reason_code) from error
    if not isinstance(frozen, FrozenDict):  # pragma: no cover - guarded by Mapping
        raise ClassifierError(reason_code)
    return frozen


def _sequence(value: Any, reason_code: str) -> tuple[Any, ...]:
    if not _is_sequence(value):
        raise ClassifierError(reason_code)
    return tuple(value)


def _bounded_sequence(
    value: Any,
    *,
    maximum: int,
    reason_code: str,
) -> tuple[Any, ...]:
    items = _sequence(value, reason_code)
    if len(items) > maximum:
        raise ClassifierError(reason_code)
    return items


def _normalized_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value).casefold()
    return " ".join(normalized.split())


def _normalized_scalar(value: Any) -> Any:
    return _normalized_text(value) if isinstance(value, str) else value


def _valid_scalar(value: Any) -> bool:
    if value is None or isinstance(value, (str, bool, int, Decimal)):
        if isinstance(value, str):
            return len(value) <= MAX_TEXT_LENGTH
        if isinstance(value, Decimal):
            return value.is_finite()
        return True
    return isinstance(value, float) and math.isfinite(value)


def _valid_number(value: Any) -> bool:
    return (
        not isinstance(value, bool)
        and isinstance(value, (int, float, Decimal))
        and (not isinstance(value, float) or math.isfinite(value))
        and (not isinstance(value, Decimal) or value.is_finite())
    )


def _values_equal(actual: Any, expected: Any, *, approximate: bool = False) -> bool:
    if _valid_number(actual) and _valid_number(expected):
        try:
            left = Decimal(str(actual))
            right = Decimal(str(expected))
        except InvalidOperation:
            return False
        if not approximate:
            return left == right
        tolerance = max(Decimal(1), abs(right)) * Decimal("1e-12")
        return abs(left - right) <= tolerance
    if isinstance(actual, str) and isinstance(expected, str):
        return _normalized_text(actual) == _normalized_text(expected)
    return type(actual) is type(expected) and actual == expected


def _provenance_sources(value: Any) -> tuple[str, ...] | None:
    if not _is_sequence(value):
        return None
    records = tuple(value)
    if not records or len(records) > MAX_PROVENANCE_RECORDS:
        return None
    sources: set[str] = set()
    for raw_record in records:
        if not isinstance(raw_record, Mapping):
            return None
        if not set(raw_record).issubset({"sourceId", "pointer"}):
            return None
        source_id = raw_record.get("sourceId")
        if not isinstance(source_id, str) or not _IDENTIFIER_PATTERN.fullmatch(source_id):
            return None
        pointer = raw_record.get("pointer")
        if pointer is not None and (
            not isinstance(pointer, str)
            or not pointer
            or len(pointer) > MAX_TEXT_LENGTH
        ):
            return None
        sources.add(source_id)
    return tuple(sorted(sources))


def _identifier_list(
    value: Any,
    *,
    maximum: int,
    allow_empty: bool,
    reason_code: str,
) -> tuple[str, ...]:
    items = _bounded_sequence(value, maximum=maximum, reason_code=reason_code)
    if not items and not allow_empty:
        raise ClassifierError(reason_code)
    if any(not isinstance(item, str) or not _IDENTIFIER_PATTERN.fullmatch(item) for item in items):
        raise ClassifierError(reason_code)
    if len(set(items)) != len(items):
        raise ClassifierError(reason_code)
    return tuple(sorted(items))


def _prepare_policy(policy: Mapping[str, Any]) -> _Policy:
    source = _mapping(policy, "policy_must_be_json_mapping")
    schema_version = _identifier(source.get("schemaVersion"), "policy_schema_version_invalid")
    release_id = _identifier(source.get("releaseId"), "policy_release_id_invalid")
    policy_fingerprint = _sha256(
        source.get("policyFingerprint"), "policy_fingerprint_invalid"
    )
    source_fingerprint = _sha256(
        source.get("sourceFingerprint"), "source_fingerprint_invalid"
    )

    aspect_records = _bounded_sequence(
        source.get("typedAspects"),
        maximum=MAX_POLICY_ASPECTS,
        reason_code="policy_aspects_invalid",
    )
    if not aspect_records:
        raise ClassifierError("policy_aspects_invalid")
    aspects: dict[str, dict[str, Any]] = {}
    feature_ids: set[str] = set()
    for raw_aspect in aspect_records:
        if not isinstance(raw_aspect, Mapping):
            raise ClassifierError("policy_aspect_invalid")
        aspect_id = _identifier(raw_aspect.get("aspectId"), "policy_aspect_id_invalid")
        if aspect_id in aspects:
            raise ClassifierError("duplicate_policy_aspect_id")
        facet_path = raw_aspect.get("facetPath")
        if (
            not isinstance(facet_path, str)
            or not facet_path.startswith("/")
            or len(facet_path) > MAX_TEXT_LENGTH
        ):
            raise ClassifierError("policy_facet_path_invalid")
        governor = raw_aspect.get("primaryGovernor")
        if governor not in GOVERNORS:
            raise ClassifierError("policy_aspect_governor_invalid")
        feature_id = raw_aspect.get("featureId")
        if feature_id is not None:
            feature_id = _identifier(feature_id, "policy_feature_id_invalid")
            feature_ids.add(feature_id)
        aspects[aspect_id] = {
            "aspectId": aspect_id,
            "facetPath": facet_path,
            "primaryGovernor": governor,
            "featureId": feature_id,
        }

    active_aspect_ids = frozenset(
        _identifier_list(
            source.get("activeAspectIds"),
            maximum=MAX_POLICY_ASPECTS,
            allow_empty=True,
            reason_code="active_aspect_ids_invalid",
        )
    )
    if not active_aspect_ids.issubset(aspects):
        raise ClassifierError("active_aspect_not_registered")

    raw_rule_records = _bounded_sequence(
        source.get("bridgeRules"),
        maximum=MAX_POLICY_RULES,
        reason_code="policy_rules_invalid",
    )
    rule_records: dict[str, Mapping[str, Any]] = {}
    for raw_rule in raw_rule_records:
        if not isinstance(raw_rule, Mapping):
            raise ClassifierError("policy_rule_invalid")
        rule_id = _identifier(raw_rule.get("ruleId"), "policy_rule_id_invalid")
        if rule_id in rule_records:
            raise ClassifierError("duplicate_policy_rule_id")
        rule_records[rule_id] = raw_rule

    active_rule_ids = _identifier_list(
        source.get("activeRuleIds"),
        maximum=MAX_POLICY_RULES,
        allow_empty=True,
        reason_code="active_rule_ids_invalid",
    )
    if any(rule_id not in rule_records for rule_id in active_rule_ids):
        raise ClassifierError("active_rule_not_registered")

    rules: list[_Rule] = []
    for rule_id in active_rule_ids:
        raw_rule = rule_records[rule_id]
        output = raw_rule.get("output")
        if not isinstance(output, Mapping):
            raise ClassifierError("policy_rule_output_invalid")
        output_aspect_id = _identifier(
            output.get("aspectId"), "policy_rule_output_aspect_invalid"
        )
        if output_aspect_id not in aspects:
            raise ClassifierError("policy_rule_output_aspect_not_registered")
        if output_aspect_id not in active_aspect_ids:
            raise ClassifierError("policy_rule_output_aspect_not_active")
        primary_governor = output.get("primaryGovernor")
        if primary_governor not in GOVERNORS:
            raise ClassifierError("policy_rule_governor_invalid")
        priority = raw_rule.get("priority")
        if isinstance(priority, bool) or not isinstance(priority, int) or not 0 <= priority <= 1000:
            raise ClassifierError("policy_rule_priority_invalid")
        missing_policy = raw_rule.get("missingPolicy")
        if missing_policy not in _MISSING_POLICIES:
            raise ClassifierError("policy_rule_missing_policy_invalid")
        conflict_policy = raw_rule.get("conflictPolicy")
        if conflict_policy not in _CONFLICT_POLICIES:
            raise ClassifierError("policy_rule_conflict_policy_invalid")

        raw_antecedents = _bounded_sequence(
            raw_rule.get("antecedents"),
            maximum=MAX_RULE_ANTECEDENTS,
            reason_code="policy_rule_antecedents_invalid",
        )
        if not raw_antecedents:
            raise ClassifierError("policy_rule_antecedents_invalid")
        antecedents: list[FrozenDict] = []
        antecedent_ids: set[str] = set()
        for raw_antecedent in raw_antecedents:
            if not isinstance(raw_antecedent, Mapping):
                raise ClassifierError("policy_rule_antecedent_invalid")
            antecedent = _mapping(raw_antecedent, "policy_rule_antecedent_invalid")
            antecedent_id = _identifier(
                antecedent.get("antecedentId"), "policy_antecedent_id_invalid"
            )
            if antecedent_id in antecedent_ids:
                raise ClassifierError("duplicate_policy_antecedent_id")
            antecedent_ids.add(antecedent_id)
            kind = antecedent.get("kind")
            if kind not in _ANTECEDENT_KINDS or "expectedValue" not in antecedent:
                raise ClassifierError("policy_antecedent_kind_invalid")
            if not _valid_scalar(antecedent["expectedValue"]):
                raise ClassifierError("policy_antecedent_value_invalid")
            if kind in {"feature_equals", "feature_contains"}:
                feature_id = _identifier(
                    antecedent.get("featureId"), "policy_antecedent_feature_invalid"
                )
                feature_ids.add(feature_id)
            if kind == "operation_result":
                _identifier(
                    antecedent.get("operationId"), "policy_antecedent_operation_invalid"
                )
            antecedents.append(antecedent)

        rules.append(
            _Rule(
                rule_id=rule_id,
                output_aspect_id=output_aspect_id,
                primary_governor=primary_governor,
                priority=priority,
                missing_policy=missing_policy,
                conflict_policy=conflict_policy,
                antecedents=tuple(
                    sorted(antecedents, key=lambda item: item["antecedentId"])
                ),
            )
        )

    operations: dict[str, Mapping[str, Any]] = {}
    raw_operations = source.get("operations", ())
    if not _is_sequence(raw_operations):
        raise ClassifierError("policy_operations_invalid")
    for raw_operation in raw_operations:
        if not isinstance(raw_operation, Mapping):
            raise ClassifierError("policy_operation_invalid")
        operation_id = _identifier(
            raw_operation.get("operationId"), "policy_operation_id_invalid"
        )
        if operation_id in operations:
            raise ClassifierError("duplicate_policy_operation_id")
        operations[operation_id] = raw_operation

    return _Policy(
        schema_version=schema_version,
        release_id=release_id,
        policy_fingerprint=policy_fingerprint,
        source_fingerprint=source_fingerprint,
        aspects=FrozenDict(aspects),
        active_aspect_ids=active_aspect_ids,
        rules=tuple(sorted(rules, key=lambda item: (-item.priority, item.rule_id))),
        operations=FrozenDict(operations),
        feature_ids=frozenset(feature_ids),
    )


def _record_sort_key(value: Any, identifier_key: str) -> tuple[str, str]:
    if isinstance(value, Mapping) and isinstance(value.get(identifier_key), str):
        identifier = value[identifier_key]
    else:
        identifier = ""
    return identifier, sha256_payload(value)


def _sort_provenance(value: Any) -> Any:
    if not _is_sequence(value):
        return value
    return sorted(
        value,
        key=lambda item: (
            item.get("sourceId", "") if isinstance(item, Mapping) else "",
            item.get("pointer", "") if isinstance(item, Mapping) else "",
            sha256_payload(item),
        ),
    )


def _normalized_request_body(request: FrozenDict) -> dict[str, Any]:
    body = thaw_json(request)
    raw_facts = body.get("facts")
    if isinstance(raw_facts, list):
        facts: list[Any] = []
        for raw_fact in raw_facts:
            if not isinstance(raw_fact, dict):
                facts.append(raw_fact)
                continue
            fact = dict(raw_fact)
            if isinstance(fact.get("value"), str):
                fact["value"] = _normalized_text(fact["value"])
            if "provenance" in fact:
                fact["provenance"] = _sort_provenance(fact["provenance"])
            facts.append(fact)
        body["facts"] = sorted(
            facts, key=lambda item: _record_sort_key(item, "factId")
        )

    raw_quantities = body.get("quantities")
    if isinstance(raw_quantities, list):
        quantities: list[Any] = []
        for raw_quantity in raw_quantities:
            if not isinstance(raw_quantity, dict):
                quantities.append(raw_quantity)
                continue
            quantity = dict(raw_quantity)
            if isinstance(quantity.get("assumptions"), list):
                quantity["assumptions"] = sorted(quantity["assumptions"])
            if "provenance" in quantity:
                quantity["provenance"] = _sort_provenance(quantity["provenance"])
            quantities.append(quantity)
        body["quantities"] = sorted(
            quantities, key=lambda item: _record_sort_key(item, "quantityId")
        )

    requested = body.get("requestedAspectIds")
    if isinstance(requested, list):
        body["requestedAspectIds"] = sorted(requested)
    return body


def _path_or_global_error(
    path_errors: dict[str, set[str]],
    global_errors: set[str],
    facet_path: Any,
    code: str,
) -> None:
    if isinstance(facet_path, str) and facet_path.startswith("/"):
        path_errors.setdefault(facet_path, set()).add(code)
    else:
        global_errors.add(code)


def _prepare_facts(
    raw_facts: tuple[Any, ...],
    policy: _Policy,
    global_errors: set[str],
    path_errors: dict[str, set[str]],
) -> tuple[_Fact, ...]:
    facts: list[_Fact] = []
    seen_ids: set[str] = set()
    for raw_fact in raw_facts:
        if not isinstance(raw_fact, Mapping):
            global_errors.add("fact_invalid")
            continue
        facet_path = raw_fact.get("facetPath")
        kind = raw_fact.get("kind")
        required_by_kind = {
            "feature_value": {
                "schemaVersion",
                "factId",
                "kind",
                "facetPath",
                "featureId",
                "value",
                "epistemicClass",
                "provenance",
            },
            "relation": {
                "schemaVersion",
                "factId",
                "kind",
                "facetPath",
                "predicateId",
                "objectId",
                "epistemicClass",
                "provenance",
            },
            "taxonomy_term": {
                "schemaVersion",
                "factId",
                "kind",
                "facetPath",
                "termId",
                "epistemicClass",
                "provenance",
            },
        }
        required = required_by_kind.get(kind)
        if required is None or set(raw_fact) != required:
            _path_or_global_error(path_errors, global_errors, facet_path, "fact_invalid")
            continue
        fact_id = raw_fact.get("factId")
        if not isinstance(fact_id, str) or not _IDENTIFIER_PATTERN.fullmatch(fact_id):
            _path_or_global_error(path_errors, global_errors, facet_path, "fact_invalid")
            continue
        if fact_id in seen_ids:
            global_errors.add("duplicate_fact_id")
            continue
        seen_ids.add(fact_id)
        if (
            raw_fact.get("schemaVersion") != policy.schema_version
            or not isinstance(facet_path, str)
            or not facet_path.startswith("/")
            or len(facet_path) > MAX_TEXT_LENGTH
            or raw_fact.get("epistemicClass") not in _FACT_EPISTEMIC_CLASSES
        ):
            _path_or_global_error(path_errors, global_errors, facet_path, "fact_invalid")
            continue
        sources = _provenance_sources(raw_fact.get("provenance"))
        if sources is None:
            _path_or_global_error(path_errors, global_errors, facet_path, "fact_invalid")
            continue

        feature_id: str | None = None
        value: Any
        if kind == "feature_value":
            feature_id = raw_fact.get("featureId")
            value = raw_fact.get("value")
            if (
                not isinstance(feature_id, str)
                or not _IDENTIFIER_PATTERN.fullmatch(feature_id)
                or feature_id not in policy.feature_ids
                or not _valid_scalar(value)
            ):
                _path_or_global_error(path_errors, global_errors, facet_path, "fact_invalid")
                continue
            value = _normalized_scalar(value)
        elif kind == "relation":
            predicate_id = raw_fact.get("predicateId")
            value = raw_fact.get("objectId")
            if (
                not isinstance(predicate_id, str)
                or not _IDENTIFIER_PATTERN.fullmatch(predicate_id)
                or not isinstance(value, str)
                or not _IDENTIFIER_PATTERN.fullmatch(value)
            ):
                _path_or_global_error(path_errors, global_errors, facet_path, "fact_invalid")
                continue
        else:
            value = raw_fact.get("termId")
            if not isinstance(value, str) or not _IDENTIFIER_PATTERN.fullmatch(value):
                _path_or_global_error(path_errors, global_errors, facet_path, "fact_invalid")
                continue

        facts.append(
            _Fact(
                fact_id=fact_id,
                kind=kind,
                facet_path=facet_path,
                feature_id=feature_id,
                value=value,
                provenance_source_ids=sources,
            )
        )
    return tuple(sorted(facts, key=lambda item: item.fact_id))


def _prepare_quantities(
    raw_quantities: tuple[Any, ...],
    policy: _Policy,
    global_errors: set[str],
) -> tuple[_Quantity, ...]:
    quantities: list[_Quantity] = []
    seen_ids: set[str] = set()
    allowed_keys = {
        "schemaVersion",
        "quantityId",
        "value",
        "dimension",
        "unit",
        "epistemicClass",
        "basis",
        "provenance",
        "assumptions",
    }
    for raw_quantity in raw_quantities:
        if not isinstance(raw_quantity, Mapping) or set(raw_quantity) != allowed_keys:
            global_errors.add("quantity_invalid")
            continue
        quantity_id = raw_quantity.get("quantityId")
        if not isinstance(quantity_id, str) or not _IDENTIFIER_PATTERN.fullmatch(quantity_id):
            global_errors.add("quantity_invalid")
            continue
        if quantity_id in seen_ids:
            global_errors.add("duplicate_quantity_id")
            continue
        seen_ids.add(quantity_id)
        value = raw_quantity.get("value")
        dimension = raw_quantity.get("dimension")
        unit = raw_quantity.get("unit")
        epistemic_class = raw_quantity.get("epistemicClass")
        assumptions_raw = raw_quantity.get("assumptions")
        sources = _provenance_sources(raw_quantity.get("provenance"))
        if (
            raw_quantity.get("schemaVersion") != policy.schema_version
            or not _valid_number(value)
            or dimension not in _DIMENSION_UNITS
            or unit not in _DIMENSION_UNITS.get(dimension, ())
            or epistemic_class not in _QUANTITY_EPISTEMIC_CLASSES
            or not _is_sequence(assumptions_raw)
            or len(assumptions_raw) > MAX_RULE_ANTECEDENTS
            or sources is None
        ):
            global_errors.add("quantity_invalid")
            continue
        assumptions = tuple(assumptions_raw)
        if (
            any(
                not isinstance(item, str) or not _IDENTIFIER_PATTERN.fullmatch(item)
                for item in assumptions
            )
            or len(set(assumptions)) != len(assumptions)
        ):
            global_errors.add("quantity_invalid")
            continue
        if dimension in {"length", "frequency", "energy"} and value <= 0:
            global_errors.add("quantity_invalid")
            continue
        if unit == "normalized_inverse_wavelength" and not 0 <= value <= 1:
            global_errors.add("quantity_invalid")
            continue

        basis = raw_quantity.get("basis")
        if not isinstance(basis, Mapping):
            global_errors.add("quantity_invalid")
            continue
        basis_kind = basis.get("kind")
        operation_id: str | None = None
        input_ids: tuple[str, ...] = ()
        if basis_kind == "framework_declaration":
            if set(basis) != {"kind", "ownerScope", "ownerId"}:
                global_errors.add("quantity_invalid")
                continue
            try:
                _identifier(basis.get("ownerScope"), "quantity_invalid")
                _identifier(basis.get("ownerId"), "quantity_invalid")
            except ClassifierError:
                global_errors.add("quantity_invalid")
                continue
            if epistemic_class != "framework_declared_physical_anchor":
                global_errors.add("quantity_basis_mismatch")
                continue
        elif basis_kind == "observed_measurement":
            if set(basis) != {"kind", "subjectId", "methodId"}:
                global_errors.add("quantity_invalid")
                continue
            try:
                _identifier(basis.get("subjectId"), "quantity_invalid")
                _identifier(basis.get("methodId"), "quantity_invalid")
            except ClassifierError:
                global_errors.add("quantity_invalid")
                continue
            if epistemic_class != "observed_measurement":
                global_errors.add("quantity_basis_mismatch")
                continue
        elif basis_kind == "registered_operation":
            if set(basis) != {"kind", "operationId", "inputQuantityIds"}:
                global_errors.add("quantity_invalid")
                continue
            operation_id = basis.get("operationId")
            try:
                operation_id = _identifier(operation_id, "quantity_invalid")
                input_ids = _identifier_list(
                    basis.get("inputQuantityIds"),
                    maximum=MAX_QUANTITIES,
                    allow_empty=False,
                    reason_code="quantity_invalid",
                )
            except ClassifierError:
                global_errors.add("quantity_invalid")
                continue
            operation = policy.operations.get(operation_id)
            if not isinstance(operation, Mapping):
                global_errors.add("quantity_operation_not_registered")
                continue
            if (
                operation.get("outputDimension") != dimension
                or operation.get("outputUnit") != unit
                or operation.get("outputEpistemicClass") != epistemic_class
            ):
                global_errors.add("quantity_operation_output_mismatch")
                continue
            required_assumptions = operation.get("requiredAssumptions", ())
            if not _is_sequence(required_assumptions) or any(
                item not in assumptions for item in required_assumptions
            ):
                global_errors.add("quantity_assumption_missing")
                continue
            if epistemic_class not in {
                "physically_derived",
                "physical_anchor_plus_normalization_convention",
            }:
                global_errors.add("quantity_basis_mismatch")
                continue
        else:
            global_errors.add("quantity_invalid")
            continue

        quantities.append(
            _Quantity(
                quantity_id=quantity_id,
                value=value,
                dimension=dimension,
                unit=unit,
                epistemic_class=epistemic_class,
                basis_kind=basis_kind,
                operation_id=operation_id,
                input_quantity_ids=input_ids,
                assumptions=tuple(sorted(assumptions)),
                provenance_source_ids=sources,
            )
        )

    available_ids = {item.quantity_id for item in quantities}
    if any(
        item.basis_kind == "registered_operation"
        and any(input_id not in available_ids for input_id in item.input_quantity_ids)
        for item in quantities
    ):
        global_errors.add("quantity_input_not_found")
    return tuple(sorted(quantities, key=lambda item: item.quantity_id))


def _prepare_request(policy: _Policy, request: Mapping[str, Any]) -> _PreparedRequest:
    source = _mapping(request, "request_must_be_json_mapping")
    allowed_keys = {
        "schemaVersion",
        "policyReleaseId",
        "subject",
        "facts",
        "quantities",
        "requestedAspectIds",
    }
    global_errors: set[str] = set()
    path_errors: dict[str, set[str]] = {}
    if set(source) != allowed_keys:
        global_errors.add("request_shape_invalid")
    if source.get("schemaVersion") != policy.schema_version:
        global_errors.add("request_schema_version_mismatch")
    if source.get("policyReleaseId") != policy.release_id:
        global_errors.add("policy_release_mismatch")

    subject = source.get("subject")
    if not isinstance(subject, Mapping):
        raise ClassifierError("request_subject_invalid")
    subject_id = _identifier(subject.get("subjectId"), "request_subject_id_invalid")
    if set(subject) != {"subjectId", "subjectType"} or subject.get("subjectType") not in _SUBJECT_TYPES:
        global_errors.add("request_subject_invalid")

    requested_aspect_ids = _identifier_list(
        source.get("requestedAspectIds"),
        maximum=MAX_REQUESTED_ASPECT_IDS,
        allow_empty=False,
        reason_code="requested_aspect_ids_invalid",
    )
    raw_facts = _bounded_sequence(
        source.get("facts"), maximum=MAX_FACTS, reason_code="facts_limit_or_shape_invalid"
    )
    raw_quantities = _bounded_sequence(
        source.get("quantities"),
        maximum=MAX_QUANTITIES,
        reason_code="quantities_limit_or_shape_invalid",
    )
    facts = _prepare_facts(raw_facts, policy, global_errors, path_errors)
    quantities = _prepare_quantities(raw_quantities, policy, global_errors)
    request_fingerprint = sha256_payload(_normalized_request_body(source))
    return _PreparedRequest(
        subject_id=subject_id,
        facts=facts,
        quantities=quantities,
        requested_aspect_ids=requested_aspect_ids,
        request_fingerprint=request_fingerprint,
        global_error_codes=tuple(sorted(global_errors)),
        path_error_codes=FrozenDict(
            {path: tuple(sorted(codes)) for path, codes in path_errors.items()}
        ),
    )


def _evidence_for_facts(facts: Sequence[_Fact]) -> _AntecedentEvaluation:
    return _AntecedentEvaluation(
        state="match",
        fact_ids=tuple(sorted({item.fact_id for item in facts})),
        provenance_source_ids=tuple(
            sorted(
                {
                    source_id
                    for item in facts
                    for source_id in item.provenance_source_ids
                }
            )
        ),
    )


def _evaluate_antecedent(
    antecedent: Mapping[str, Any],
    *,
    facet_path: str,
    aspect_feature_id: str | None,
    subject_id: str,
    facts: tuple[_Fact, ...],
    quantities: tuple[_Quantity, ...],
) -> _AntecedentEvaluation:
    kind = antecedent["kind"]
    expected = antecedent["expectedValue"]
    facet_facts = tuple(item for item in facts if item.facet_path == facet_path)

    if kind in {"feature_equals", "feature_contains"}:
        feature_id = antecedent["featureId"]
        applicable = tuple(
            item
            for item in facet_facts
            if item.kind == "feature_value" and item.feature_id == feature_id
        )
        matching = tuple(item for item in applicable if _values_equal(item.value, expected))
        quantity_sources: set[str] = set()
        quantity_match = False
        if aspect_feature_id == feature_id and feature_id in _FEATURE_QUANTITY_SIGNATURES:
            dimension, unit = _FEATURE_QUANTITY_SIGNATURES[feature_id]
            matching_quantities = tuple(
                item
                for item in quantities
                if item.dimension == dimension
                and item.unit == unit
                and _values_equal(item.value, expected)
            )
            quantity_match = bool(matching_quantities)
            quantity_sources.update(
                source_id
                for item in matching_quantities
                for source_id in item.provenance_source_ids
            )
        if matching:
            evidence = _evidence_for_facts(matching)
            return _AntecedentEvaluation(
                state="match",
                fact_ids=evidence.fact_ids,
                provenance_source_ids=tuple(
                    sorted(set(evidence.provenance_source_ids) | quantity_sources)
                ),
            )
        if quantity_match:
            return _AntecedentEvaluation(
                state="match", provenance_source_ids=tuple(sorted(quantity_sources))
            )
        return _AntecedentEvaluation(state="no_match" if applicable else "missing")

    if kind == "owner_equals":
        return _AntecedentEvaluation(
            state="match" if _values_equal(subject_id, expected) else "no_match"
        )

    if kind == "relation_equals":
        applicable = tuple(
            item for item in facet_facts if item.kind in {"relation", "taxonomy_term"}
        )
        matching = tuple(item for item in applicable if _values_equal(item.value, expected))
        if matching:
            return _evidence_for_facts(matching)
        return _AntecedentEvaluation(state="no_match" if applicable else "missing")

    if kind == "operation_result":
        operation_id = antecedent["operationId"]
        applicable_quantities = tuple(
            item for item in quantities if item.operation_id == operation_id
        )
        matching_quantities = tuple(
            item
            for item in applicable_quantities
            if _values_equal(item.value, expected, approximate=True)
        )
        if matching_quantities:
            return _AntecedentEvaluation(
                state="match",
                provenance_source_ids=tuple(
                    sorted(
                        {
                            source_id
                            for item in matching_quantities
                            for source_id in item.provenance_source_ids
                        }
                    )
                ),
            )
        return _AntecedentEvaluation(
            state="no_match" if applicable_quantities else "missing"
        )

    matching_facts = tuple(
        item
        for item in facet_facts
        if item.kind == "taxonomy_term" and _values_equal(item.value, expected)
    )
    matching_quantities = tuple(
        item for item in quantities if expected in item.assumptions
    )
    if matching_facts or matching_quantities:
        evidence = _evidence_for_facts(matching_facts)
        return _AntecedentEvaluation(
            state="match",
            fact_ids=evidence.fact_ids,
            provenance_source_ids=tuple(
                sorted(
                    set(evidence.provenance_source_ids)
                    | {
                        source_id
                        for item in matching_quantities
                        for source_id in item.provenance_source_ids
                    }
                )
            ),
        )
    return _AntecedentEvaluation(state="missing" if not quantities else "no_match")


def _evaluate_rule(
    rule: _Rule,
    *,
    facet_path: str,
    aspect_feature_id: str | None,
    request: _PreparedRequest,
) -> tuple[str, _RuleMatch | None]:
    evaluations = tuple(
        _evaluate_antecedent(
            antecedent,
            facet_path=facet_path,
            aspect_feature_id=aspect_feature_id,
            subject_id=request.subject_id,
            facts=request.facts,
            quantities=request.quantities,
        )
        for antecedent in rule.antecedents
    )
    if any(item.state == "no_match" for item in evaluations):
        return "no_match", None
    if any(item.state == "missing" for item in evaluations):
        return "missing", None
    fact_ids = tuple(
        sorted({fact_id for item in evaluations for fact_id in item.fact_ids})
    )
    provenance = tuple(
        sorted(
            {
                source_id
                for item in evaluations
                for source_id in item.provenance_source_ids
            }
        )
    )
    if not fact_ids or not provenance:
        return "incomplete", None
    return "match", _RuleMatch(rule, fact_ids, provenance)


def _facet_id(aspect_id: str) -> str:
    parts = aspect_id.split(":")
    if parts and parts[0] == "aspect":
        parts = parts[1:]
    if parts and _VERSION_SUFFIX_PATTERN.fullmatch(parts[-1]):
        parts = parts[:-1]
    return "facet:" + "-".join(parts)


def _invalid_facet(aspect_id: str, codes: Sequence[str]) -> dict[str, Any]:
    return {
        "facetId": _facet_id(aspect_id),
        "requestedAspectId": aspect_id,
        "outcome": "invalid",
        "errorCodes": sorted(set(codes)) or ["classification_invalid"],
    }


def _unresolved_facet(aspect_id: str, codes: Sequence[str]) -> dict[str, Any]:
    return {
        "facetId": _facet_id(aspect_id),
        "requestedAspectId": aspect_id,
        "outcome": "unresolved",
        "reasonCodes": sorted(set(codes)) or ["classification_unresolved"],
    }


def _ambiguous_facet(
    aspect_id: str, matches: Sequence[_RuleMatch]
) -> dict[str, Any]:
    candidate_rules: dict[tuple[str, str], set[str]] = {}
    for match in matches:
        key = (match.rule.output_aspect_id, match.rule.primary_governor)
        candidate_rules.setdefault(key, set()).add(match.rule.rule_id)
    return {
        "facetId": _facet_id(aspect_id),
        "requestedAspectId": aspect_id,
        "outcome": "ambiguous",
        "candidates": [
            {
                "aspectId": candidate_aspect_id,
                "primaryGovernor": governor,
                "ruleIds": sorted(candidate_rules[(candidate_aspect_id, governor)]),
            }
            for candidate_aspect_id, governor in sorted(candidate_rules)
        ],
    }


def _classified_facet(
    aspect_id: str, matches: Sequence[_RuleMatch]
) -> dict[str, Any]:
    first = matches[0]
    return {
        "facetId": _facet_id(aspect_id),
        "requestedAspectId": aspect_id,
        "outcome": "classified",
        "aspectId": first.rule.output_aspect_id,
        "primaryGovernor": first.rule.primary_governor,
        "evidencePaths": [
            {
                "ruleId": match.rule.rule_id,
                "factIds": list(match.fact_ids),
                "provenanceSourceIds": list(match.provenance_source_ids),
            }
            for match in matches
        ],
    }


def _classify_facet(
    aspect_id: str, policy: _Policy, request: _PreparedRequest
) -> dict[str, Any]:
    if request.global_error_codes:
        return _invalid_facet(aspect_id, request.global_error_codes)
    aspect = policy.aspects.get(aspect_id)
    if not isinstance(aspect, Mapping):
        return _invalid_facet(aspect_id, ("requested_aspect_not_registered",))
    facet_path = aspect["facetPath"]
    path_errors = request.path_error_codes.get(facet_path, ())
    if path_errors:
        return _invalid_facet(aspect_id, path_errors)
    if aspect_id not in policy.active_aspect_ids:
        return _unresolved_facet(aspect_id, ("aspect_not_active",))

    relevant_rules = tuple(
        rule for rule in policy.rules if rule.output_aspect_id == aspect_id
    )
    if not relevant_rules:
        return _unresolved_facet(aspect_id, ("no_active_rule",))

    matches: list[_RuleMatch] = []
    missing_rules: list[_Rule] = []
    incomplete_rules: list[_Rule] = []
    for rule in relevant_rules:
        state, match = _evaluate_rule(
            rule,
            facet_path=facet_path,
            aspect_feature_id=aspect.get("featureId"),
            request=request,
        )
        if state == "match" and match is not None:
            matches.append(match)
        elif state == "missing":
            missing_rules.append(rule)
        elif state == "incomplete":
            incomplete_rules.append(rule)

    if any(rule.missing_policy == "reject_invalid" for rule in missing_rules):
        return _invalid_facet(aspect_id, ("required_evidence_missing",))
    if not matches:
        reasons: list[str] = []
        if any(rule.missing_policy == "return_unresolved" for rule in missing_rules):
            reasons.append("required_evidence_missing")
        if incomplete_rules:
            reasons.append("evidence_path_incomplete")
        if not reasons:
            reasons.append("no_matching_rule")
        return _unresolved_facet(aspect_id, reasons)

    candidate_keys = {
        (match.rule.output_aspect_id, match.rule.primary_governor) for match in matches
    }
    if len(candidate_keys) == 1:
        return _classified_facet(aspect_id, matches)
    if any(match.rule.conflict_policy == "reject_invalid" for match in matches):
        return _invalid_facet(aspect_id, ("matching_rule_conflict",))
    if any(match.rule.conflict_policy == "return_ambiguous" for match in matches):
        return _ambiguous_facet(aspect_id, matches)

    highest_priority = max(match.rule.priority for match in matches)
    preferred = tuple(
        match for match in matches if match.rule.priority == highest_priority
    )
    preferred_keys = {
        (match.rule.output_aspect_id, match.rule.primary_governor)
        for match in preferred
    }
    if len(preferred_keys) > 1:
        return _ambiguous_facet(aspect_id, preferred)
    selected_key = next(iter(preferred_keys))
    selected = tuple(
        match
        for match in matches
        if (match.rule.output_aspect_id, match.rule.primary_governor) == selected_key
    )
    return _classified_facet(aspect_id, selected)


def classify(
    policy: Mapping[str, Any], request: Mapping[str, Any]
) -> FrozenDict:
    """Classify requested facets without reading or mutating external state.

    Envelope failures that prevent a schema-valid result raise
    :class:`ClassifierError`.  Evidence and semantic failures are represented
    by per-facet ``invalid`` or unresolved abstention records.
    """

    prepared_policy = _prepare_policy(policy)
    prepared_request = _prepare_request(prepared_policy, request)
    facet_results = [
        _classify_facet(aspect_id, prepared_policy, prepared_request)
        for aspect_id in prepared_request.requested_aspect_ids
    ]
    core = {
        "schemaVersion": prepared_policy.schema_version,
        "policyReleaseId": prepared_policy.release_id,
        "policyFingerprint": prepared_policy.policy_fingerprint,
        "sourceFingerprint": prepared_policy.source_fingerprint,
        "requestFingerprint": prepared_request.request_fingerprint,
        "subjectId": prepared_request.subject_id,
        "facetResults": facet_results,
    }
    return FrozenDict({**core, "resultFingerprint": sha256_payload(core)})


__all__ = (
    "MAX_FACTS",
    "MAX_QUANTITIES",
    "MAX_REQUESTED_ASPECT_IDS",
    "ClassifierError",
    "classify",
)
