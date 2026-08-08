from __future__ import annotations

import builtins
import copy
from typing import Any

import pytest

from governor.classifier import MAX_FACTS, ClassifierError, classify
from governor.hashing import canonical_json_bytes, sha256_payload
from governor.models import FrozenDict, thaw_json


POLICY_FINGERPRINT = "a" * 64
SOURCE_FINGERPRINT = "b" * 64
SOURCE_ID = "source:test:canonical"


def _aspect(
    aspect_id: str,
    *,
    facet_path: str,
    governor: str = "Jupiter",
    feature_id: str = "semantic.thermodynamic_function",
) -> dict[str, Any]:
    return {
        "schemaVersion": "1.0.0",
        "aspectId": aspect_id,
        "aspectVersion": "1.0.0",
        "facetPath": facet_path,
        "featureId": feature_id,
        "ownerScope": "entity.aspect",
        "valueContractId": "semantic:test",
        "epistemicClass": "authored_correspondence",
        "admission": "canonical",
        "primaryGovernor": governor,
        "provenance": [{"sourceId": SOURCE_ID, "pointer": "/aspects/test"}],
    }


def _antecedent(
    antecedent_id: str,
    expected: Any,
    *,
    kind: str = "feature_equals",
    feature_id: str = "semantic.thermodynamic_function",
) -> dict[str, Any]:
    item: dict[str, Any] = {
        "antecedentId": antecedent_id,
        "kind": kind,
        "subjectScope": "entity.aspect",
        "expectedValue": expected,
        "provenance": [{"sourceId": SOURCE_ID, "pointer": "/rules/test"}],
    }
    if kind in {"feature_equals", "feature_contains"}:
        item["featureId"] = feature_id
    return item


def _rule(
    rule_id: str,
    aspect_id: str,
    governor: str,
    expected: Any,
    *,
    priority: int = 100,
    missing_policy: str = "return_unresolved",
    conflict_policy: str = "return_ambiguous",
    include_owner: bool = False,
) -> dict[str, Any]:
    antecedents = [_antecedent(f"antecedent:{rule_id}:feature", expected)]
    if include_owner:
        antecedents.insert(
            0,
            _antecedent(
                f"antecedent:{rule_id}:owner",
                "subject:test",
                kind="owner_equals",
            ),
        )
    return {
        "schemaVersion": "1.0.0",
        "ruleId": rule_id,
        "ruleVersion": "1.0.0",
        "antecedents": antecedents,
        "output": {"aspectId": aspect_id, "primaryGovernor": governor},
        "ruleScope": "entity.facet",
        "authoritySourceIds": [SOURCE_ID],
        "epistemicClass": "authored_correspondence",
        "admission": "canonical",
        "priority": priority,
        "missingPolicy": missing_policy,
        "conflictPolicy": conflict_policy,
        "causalClaim": False,
        "provenance": [{"sourceId": SOURCE_ID, "pointer": "/rules/test"}],
    }


def _policy(
    aspects: list[dict[str, Any]],
    rules: list[dict[str, Any]],
    *,
    active_aspect_ids: list[str] | None = None,
    active_rule_ids: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "schemaVersion": "1.0.0",
        "releaseId": "governor-runtime:test",
        "policyFingerprint": POLICY_FINGERPRINT,
        "sourceFingerprint": SOURCE_FINGERPRINT,
        "typedAspects": aspects,
        "bridgeRules": rules,
        "operations": [],
        "activeAspectIds": (
            [item["aspectId"] for item in aspects]
            if active_aspect_ids is None
            else active_aspect_ids
        ),
        "activeRuleIds": (
            [item["ruleId"] for item in rules]
            if active_rule_ids is None
            else active_rule_ids
        ),
    }


def _fact(
    fact_id: str,
    value: Any,
    *,
    facet_path: str,
    feature_id: str = "semantic.thermodynamic_function",
    provenance: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    return {
        "schemaVersion": "1.0.0",
        "factId": fact_id,
        "kind": "feature_value",
        "facetPath": facet_path,
        "featureId": feature_id,
        "value": value,
        "epistemicClass": "authored_correspondence",
        "provenance": provenance
        or [{"sourceId": SOURCE_ID, "pointer": f"/facts/{fact_id}"}],
    }


def _quantity(quantity_id: str, value: float = 1.0) -> dict[str, Any]:
    return {
        "schemaVersion": "1.0.0",
        "quantityId": quantity_id,
        "value": value,
        "dimension": "dimensionless",
        "unit": "one",
        "epistemicClass": "observed_measurement",
        "basis": {
            "kind": "observed_measurement",
            "subjectId": "subject:test",
            "methodId": "method:test",
        },
        "provenance": [
            {"sourceId": "source:test:z", "pointer": "/quantities/z"},
            {"sourceId": "source:test:a", "pointer": "/quantities/a"},
        ],
        "assumptions": ["assumption:z", "assumption:a"],
    }


def _request(
    aspect_ids: list[str],
    *,
    facts: list[dict[str, Any]] | None = None,
    quantities: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    return {
        "schemaVersion": "1.0.0",
        "policyReleaseId": "governor-runtime:test",
        "subject": {"subjectId": "subject:test", "subjectType": "domain_entity"},
        "facts": facts or [],
        "quantities": quantities or [],
        "requestedAspectIds": aspect_ids,
    }


def _result_core(result: FrozenDict) -> dict[str, Any]:
    body = thaw_json(result)
    body.pop("resultFingerprint")
    return body


def _all_mapping_keys(value: Any) -> tuple[str, ...]:
    keys: list[str] = []
    if isinstance(value, dict) or isinstance(value, FrozenDict):
        for key, item in value.items():
            keys.append(key)
            keys.extend(_all_mapping_keys(item))
    elif isinstance(value, (list, tuple)):
        for item in value:
            keys.extend(_all_mapping_keys(item))
    return tuple(keys)


def test_classified_facet_is_immutable_and_has_complete_provenance() -> None:
    aspect_id = "aspect:jupiter:wind:v1"
    facet_path = "/processes/wind"
    rule = _rule(
        "rule:jupiter:wind:v1",
        aspect_id,
        "Jupiter",
        "atmospheric wind",
        include_owner=True,
    )
    policy = _policy([_aspect(aspect_id, facet_path=facet_path)], [rule])
    request = _request(
        [aspect_id],
        facts=[_fact("fact:wind", "  ATMOSPHERIC\u00a0WIND  ", facet_path=facet_path)],
    )

    result = classify(policy, request)

    assert isinstance(result, FrozenDict)
    assert result["policyFingerprint"] == POLICY_FINGERPRINT
    assert result["sourceFingerprint"] == SOURCE_FINGERPRINT
    facet = result["facetResults"][0]
    assert facet == {
        "facetId": "facet:jupiter-wind",
        "requestedAspectId": aspect_id,
        "outcome": "classified",
        "aspectId": aspect_id,
        "primaryGovernor": "Jupiter",
        "evidencePaths": (
            FrozenDict(
                {
                    "ruleId": "rule:jupiter:wind:v1",
                    "factIds": ("fact:wind",),
                    "provenanceSourceIds": (SOURCE_ID,),
                }
            ),
        ),
    }
    assert result["resultFingerprint"] == sha256_payload(_result_core(result))
    with pytest.raises(TypeError):
        facet["outcome"] = "invalid"  # type: ignore[index]


def test_equal_priority_conflicting_rules_abstain_as_ambiguous() -> None:
    aspect_id = "aspect:climate:temperature:v1"
    facet_path = "/climate/temperature"
    rules = [
        _rule("rule:temperature:mars", aspect_id, "Mars", "hot"),
        _rule("rule:temperature:moon", aspect_id, "Moon", "cold"),
    ]
    policy = _policy([_aspect(aspect_id, facet_path=facet_path)], rules)
    request = _request(
        [aspect_id],
        facts=[
            _fact("fact:hot", "hot", facet_path=facet_path),
            _fact("fact:cold", "cold", facet_path=facet_path),
        ],
    )

    facet = classify(policy, request)["facetResults"][0]

    assert facet["outcome"] == "ambiguous"
    assert facet["candidates"] == (
        FrozenDict(
            {
                "aspectId": aspect_id,
                "primaryGovernor": "Mars",
                "ruleIds": ("rule:temperature:mars",),
            }
        ),
        FrozenDict(
            {
                "aspectId": aspect_id,
                "primaryGovernor": "Moon",
                "ruleIds": ("rule:temperature:moon",),
            }
        ),
    )
    assert "primaryGovernor" not in facet


def test_prefer_higher_priority_uses_priority_not_governor_order() -> None:
    aspect_id = "aspect:climate:priority:v1"
    facet_path = "/climate/priority"
    rules = [
        _rule(
            "rule:priority:low",
            aspect_id,
            "Sun",
            "bright",
            priority=10,
            conflict_policy="prefer_higher_priority_then_ambiguous",
        ),
        _rule(
            "rule:priority:high",
            aspect_id,
            "Saturn",
            "bounded",
            priority=900,
            conflict_policy="prefer_higher_priority_then_ambiguous",
        ),
    ]
    policy = _policy([_aspect(aspect_id, facet_path=facet_path)], rules)
    request = _request(
        [aspect_id],
        facts=[
            _fact("fact:bright", "bright", facet_path=facet_path),
            _fact("fact:bounded", "bounded", facet_path=facet_path),
        ],
    )

    facet = classify(policy, request)["facetResults"][0]

    assert facet["outcome"] == "classified"
    assert facet["primaryGovernor"] == "Saturn"
    assert tuple(path["ruleId"] for path in facet["evidencePaths"]) == (
        "rule:priority:high",
    )


def test_missing_evidence_and_inactive_aspect_remain_explicit_abstentions() -> None:
    active_id = "aspect:test:active:v1"
    inactive_id = "aspect:test:inactive:v1"
    active_path = "/test/active"
    inactive_path = "/test/inactive"
    rule = _rule("rule:test:active", active_id, "Venus", "present")
    policy = _policy(
        [
            _aspect(active_id, facet_path=active_path),
            _aspect(inactive_id, facet_path=inactive_path),
        ],
        [rule],
        active_aspect_ids=[active_id],
        active_rule_ids=[rule["ruleId"]],
    )

    facets = classify(policy, _request([inactive_id, active_id]))["facetResults"]

    assert tuple(item["requestedAspectId"] for item in facets) == (
        active_id,
        inactive_id,
    )
    assert facets[0]["outcome"] == "unresolved"
    assert facets[0]["reasonCodes"] == ("required_evidence_missing",)
    assert facets[1]["outcome"] == "unresolved"
    assert facets[1]["reasonCodes"] == ("aspect_not_active",)
    assert all("primaryGovernor" not in item for item in facets)


def test_composite_request_does_not_upgrade_unresolved_facet() -> None:
    known_id = "aspect:entity:known:v1"
    unknown_id = "aspect:entity:unknown:v1"
    known_path = "/entity/known"
    unknown_path = "/entity/unknown"
    rules = [
        _rule("rule:entity:known", known_id, "Mercury", "known"),
        _rule("rule:entity:unknown", unknown_id, "Moon", "unknown"),
    ]
    policy = _policy(
        [
            _aspect(known_id, facet_path=known_path),
            _aspect(unknown_id, facet_path=unknown_path),
        ],
        rules,
    )
    request = _request(
        [unknown_id, known_id],
        facts=[_fact("fact:known", "known", facet_path=known_path)],
    )

    facets = classify(policy, request)["facetResults"]

    assert tuple(item["outcome"] for item in facets) == ("classified", "unresolved")
    assert facets[0]["primaryGovernor"] == "Mercury"
    assert facets[1]["reasonCodes"] == ("required_evidence_missing",)


def test_unknown_aspect_and_malformed_facet_evidence_are_invalid() -> None:
    aspect_id = "aspect:test:malformed:v1"
    facet_path = "/test/malformed"
    rule = _rule("rule:test:malformed", aspect_id, "Mars", "valid")
    policy = _policy([_aspect(aspect_id, facet_path=facet_path)], [rule])
    malformed = _fact("fact:malformed", "valid", facet_path=facet_path)
    malformed["office"] = "Moon"

    facets = classify(
        policy,
        _request(["aspect:not-registered", aspect_id], facts=[malformed]),
    )["facetResults"]

    assert facets[0]["requestedAspectId"] == "aspect:not-registered"
    assert facets[0]["outcome"] == "invalid"
    assert facets[0]["errorCodes"] == ("requested_aspect_not_registered",)
    assert facets[1]["outcome"] == "invalid"
    assert facets[1]["errorCodes"] == ("fact_invalid",)


def test_malformed_quantity_invalidates_request_without_guessing() -> None:
    aspect_id = "aspect:test:quantity:v1"
    facet_path = "/test/quantity"
    rule = _rule("rule:test:quantity", aspect_id, "Sun", "valid")
    policy = _policy([_aspect(aspect_id, facet_path=facet_path)], [rule])
    quantity = _quantity("quantity:test")
    quantity["dimension"] = "energy"
    quantity["unit"] = "nm"
    request = _request(
        [aspect_id],
        facts=[_fact("fact:valid", "valid", facet_path=facet_path)],
        quantities=[quantity],
    )

    facet = classify(policy, request)["facetResults"][0]

    assert facet["outcome"] == "invalid"
    assert facet["errorCodes"] == ("quantity_invalid",)


def test_hard_input_bounds_reject_before_rule_evaluation() -> None:
    aspect_id = "aspect:test:bounded:v1"
    facet_path = "/test/bounded"
    rule = _rule("rule:test:bounded", aspect_id, "Mars", "value")
    policy = _policy([_aspect(aspect_id, facet_path=facet_path)], [rule])
    oversized = _request([aspect_id], facts=[{}] * (MAX_FACTS + 1))

    with pytest.raises(ClassifierError) as error:
        classify(policy, oversized)

    assert error.value.reason_code == "facts_limit_or_shape_invalid"


def test_reordered_provider_input_has_identical_bytes_and_fingerprints() -> None:
    alpha_id = "aspect:test:alpha:v1"
    zeta_id = "aspect:test:zeta:v1"
    alpha_path = "/test/alpha"
    zeta_path = "/test/zeta"
    aspects = [
        _aspect(zeta_id, facet_path=zeta_path),
        _aspect(alpha_id, facet_path=alpha_path),
    ]
    rules = [
        _rule("rule:test:zeta", zeta_id, "Venus", "zeta", include_owner=True),
        _rule("rule:test:alpha", alpha_id, "Mars", "alpha", include_owner=True),
    ]
    policy = _policy(aspects, rules)
    provenance = [
        {"sourceId": "source:test:z", "pointer": "/z"},
        {"sourceId": "source:test:a", "pointer": "/a"},
    ]
    facts = [
        _fact("fact:zeta", "zeta", facet_path=zeta_path, provenance=provenance),
        _fact("fact:alpha", "alpha", facet_path=alpha_path, provenance=provenance),
    ]
    request = _request(
        [zeta_id, alpha_id],
        facts=facts,
        quantities=[_quantity("quantity:z"), _quantity("quantity:a")],
    )

    reordered_policy = copy.deepcopy(policy)
    reordered_policy["typedAspects"].reverse()
    reordered_policy["bridgeRules"].reverse()
    reordered_policy["activeAspectIds"].reverse()
    reordered_policy["activeRuleIds"].reverse()
    for reordered_rule in reordered_policy["bridgeRules"]:
        reordered_rule["antecedents"].reverse()
        reordered_rule["authoritySourceIds"].reverse()
        reordered_rule["provenance"].reverse()
    reordered_policy = dict(reversed(tuple(reordered_policy.items())))

    reordered_request = copy.deepcopy(request)
    reordered_request["facts"].reverse()
    reordered_request["quantities"].reverse()
    reordered_request["requestedAspectIds"].reverse()
    for reordered_fact in reordered_request["facts"]:
        reordered_fact["provenance"].reverse()
    for reordered_quantity in reordered_request["quantities"]:
        reordered_quantity["provenance"].reverse()
        reordered_quantity["assumptions"].reverse()
    reordered_request = dict(reversed(tuple(reordered_request.items())))

    first = classify(policy, request)
    second = classify(reordered_policy, reordered_request)

    assert first["requestFingerprint"] == second["requestFingerprint"]
    assert first["resultFingerprint"] == second["resultFingerprint"]
    assert canonical_json_bytes(first) == canonical_json_bytes(second)


def test_classifier_has_no_file_graph_state_or_office_mutation_path(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    aspect_id = "aspect:test:boundary:v1"
    facet_path = "/test/boundary"
    rule = _rule("rule:test:boundary", aspect_id, "Jupiter", "context")
    policy = _policy([_aspect(aspect_id, facet_path=facet_path)], [rule])
    policy["canonicalTopologyReadOnly"] = {
        "ScaleState": {"stateId": "223", "office": None},
        "edges": [],
    }
    request = _request(
        [aspect_id],
        facts=[_fact("fact:context", "context", facet_path=facet_path)],
    )
    canonical_state = {
        "1749": {"office": "Moon"},
        "2477": {"office": "Jupiter"},
        "223": {"office": None},
    }
    policy_before = copy.deepcopy(policy)
    request_before = copy.deepcopy(request)
    state_before = copy.deepcopy(canonical_state)

    def forbidden_open(*args: Any, **kwargs: Any) -> Any:
        raise AssertionError("classifier attempted file access")

    monkeypatch.setattr(builtins, "open", forbidden_open)
    result = classify(policy, request)

    assert result["facetResults"][0]["outcome"] == "classified"
    assert policy == policy_before
    assert request == request_before
    assert canonical_state == state_before
    output_keys = {key.casefold() for key in _all_mapping_keys(result)}
    assert "office" not in output_keys
    assert "scalestate.office" not in output_keys
    assert "occupies_office" not in canonical_json_bytes(result).decode("utf-8").casefold()
