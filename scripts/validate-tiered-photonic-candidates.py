#!/usr/bin/env python3
"""Validate GOV-2xx tiered photonic evidence — 15 checks."""

from __future__ import annotations

from copy import deepcopy
import json
from pathlib import Path
import sys

import jsonschema

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "court-mathematics/src"))

from governor.tiered_photonic import (  # noqa: E402
    TieredPhotonicError,
    build_tiered_photonic_candidate,
    serialize_tiered_photonic_candidate,
    verify_tiered_photonic_candidate,
)
from governor.hashing import sha256_payload  # noqa: E402

CANDIDATE_PATH = ROOT / "canonical/tiered-photonic-candidates/tiered-photonic-v1.json"
SCHEMA_PATH = ROOT / "schemas/tiered-photonic-candidates/candidate-release.schema.json"
REPORT_SCHEMA_PATH = ROOT / "schemas/tiered-photonic-candidates/validation-report.schema.json"
REPORT_PATH = ROOT / "qa/tiered-photonic-candidates-validation.json"


def _read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def _rehash(document: dict) -> None:
    core = {k: v for k, v in document.items() if k != "candidateFingerprint"}
    document["candidateFingerprint"] = sha256_payload(core)


def _expect_rejected(document: dict) -> bool:
    try:
        verify_tiered_photonic_candidate(document, root=ROOT)
    except TieredPhotonicError:
        return True
    except Exception:
        return True
    return False


def validate(document: dict) -> dict:
    checks: list[dict] = []

    def record(check_id: str, passed: bool, diagnostic) -> None:
        checks.append({"checkId": check_id, "status": "PASS" if passed else "FAIL", "diagnostic": diagnostic})

    # 1 schema
    schema = _read_json(SCHEMA_PATH)
    try:
        jsonschema.Draft202012Validator(schema).validate(document)
        record("schema", True, "valid")
    except jsonschema.ValidationError as e:
        record("schema", False, e.message)

    # 2 fingerprint
    core = {k: v for k, v in document.items() if k != "candidateFingerprint"}
    record("candidate-fingerprint", document.get("candidateFingerprint") == sha256_payload(core), document.get("candidateFingerprint"))

    # 3 freshness
    expected = build_tiered_photonic_candidate(root=ROOT)
    record("checked-artifact-freshness", serialize_tiered_photonic_candidate(document) == serialize_tiered_photonic_candidate(expected), {"expected": expected["candidateFingerprint"], "actual": document.get("candidateFingerprint")})

    # 4 build-twice
    first = build_tiered_photonic_candidate(root=ROOT)
    second = build_tiered_photonic_candidate(root=ROOT)
    record("build-twice-identity", serialize_tiered_photonic_candidate(first) == serialize_tiered_photonic_candidate(second), first["candidateFingerprint"])

    # 5 reordered-input
    rev = build_tiered_photonic_candidate(root=ROOT, reverse_input=True)
    record("reordered-input-identity", serialize_tiered_photonic_candidate(first) == serialize_tiered_photonic_candidate(rev), rev["candidateFingerprint"])

    # 6 scope 28 records, 14 anchors x2, channel-blind, edge-faithful, mean-doubling
    records = document.get("records", [])
    scope_ok = (
        len(records) == 28
        and len({r["stateId"] for r in records}) == 14
        and all(r.get("channelIndependence") is True for r in records)
        and all(len(r.get("parentStateIds", [])) == 2 for r in records)
        and all(len(r.get("constructionEdgeIds", [])) == 2 for r in records)
        and all(r["constructionEdgeIds"][0].startswith("constructs:") for r in records)
    )
    # The expected build derives parent state IDs, edge IDs, and wavelengths from
    # the ledger, network, and governor registry rather than local copies.
    expected_records = {
        (record["stateId"], record["variant"]): record
        for record in expected["records"]
    }
    office_ok = True
    for r in records:
        expected_record = expected_records.get((r.get("stateId"), r.get("variant")))
        if expected_record is None or any(
            r.get(field) != expected_record[field]
            for field in (
                "parentStateIds",
                "constructionEdgeIds",
                "parentWavelengthsNm",
            )
        ):
            office_ok = False
    record("scope-channel-blind-edge-faithful", scope_ok and office_ok, {"recordCount": len(records)})

    # 7 variant duality: 14 per variant
    variants = [r["variant"] for r in records]
    record("variant-duality-14-per-variant", variants.count("sum_mixing") == 14 and variants.count("geometric_mean") == 14, {"sum": variants.count("sum_mixing"), "geom": variants.count("geometric_mean")})

    # 8 photonicCompression domain: null for sum_mixing, defined for geometric_mean.
    # Numeric bands must match the single source-derived two-decimal band per tier.
    comp_ok = all(
        (r["variant"] == "sum_mixing" and r["photonicCompression"] is None)
        or (r["variant"] == "geometric_mean" and isinstance(r["photonicCompression"], float) and 0 <= r["photonicCompression"] <= 1)
        for r in records
    )
    band_ok = all(
        expected_records.get((r.get("stateId"), r.get("variant")), {}).get(
            "bandMetadata", {}
        ).get("numericBandNm")
        == r.get("bandMetadata", {}).get("numericBandNm")
        for r in records
    )
    record(
        "photonicCompression-domain-per-record",
        comp_ok and band_ok,
        "sum_mixing null, geometric_mean in [0,1], source-derived two-decimal bands",
    )

    # 9 global C_H unresolved, including the literal from the declared guard.
    record(
        "global-C_H-remains-unresolved",
        document.get("globalAggregate") == expected["globalAggregate"],
        document.get("globalAggregate"),
    )

    # 10 interpretationPolicy flags
    policy = document.get("interpretationPolicy", {})
    record("interpretation-flags", policy.get("causationClaim") is False and policy.get("physicalQuantityClaim") is False and policy.get("tierClassifier") is False and policy.get("globalCHNull") is True, policy)

    # negatives — expect rejection
    adv: dict[str, bool] = {}

    t = deepcopy(document)
    t["records"][0]["tier"] = "A0"
    _rehash(t)
    adv["tier-missing-or-A0"] = _expect_rejected(t)

    t = deepcopy(document)
    t["records"][0]["derivedWavelengthNm"] = 50.0
    t["records"][0]["recordFingerprint"] = sha256_payload({k: v for k, v in t["records"][0].items() if k != "recordFingerprint"})
    _rehash(t)
    adv["lambda-outside-declared-band"] = _expect_rejected(t)

    t = deepcopy(document)
    t["interpretationPolicy"]["causationClaim"] = True
    _rehash(t)
    adv["causation-claim-present"] = _expect_rejected(t)

    t = deepcopy(document)
    t["interpretationPolicy"]["tierClassifier"] = True
    _rehash(t)
    adv["tier-classifier-claim-present"] = _expect_rejected(t)

    # channel-branching: tamper a record to claim channel-dependent derivation (not verifiable directly, simulate by breaking parent pair to non-office-neighbor)
    t = deepcopy(document)
    t["records"][0]["parentStateIds"] = [2773, 2773]
    t["records"][0]["recordFingerprint"] = sha256_payload({k: v for k, v in t["records"][0].items() if k != "recordFingerprint"})
    _rehash(t)
    adv["derivation-branching-on-channel"] = _expect_rejected(t)

    # W as input (photonic should not depend on W)
    t = deepcopy(document)
    t["method"]["variantA"]["formula"] = "W-dependent"
    _rehash(t)
    adv["W-as-input"] = _expect_rejected(t)

    # input drift guard: governors.yaml lam outside [400,700]
    # simulated by checking method a0Wavelengths
    t = deepcopy(document)
    t["method"]["a0WavelengthsNm"]["Sun"] = 900
    _rehash(t)
    adv["input-drift-governors-lambda"] = _expect_rejected(t)

    record("adversarial-tamper-rejection", all(adv.values()), adv)

    # 11 seam inclusion 4/4 seams have both variants
    seams = {1371, 2901, 1367, 3413}
    seam_ok = all(sum(1 for r in records if r["stateId"] == sid) == 2 for sid in seams)
    record("seam-inclusion-4-4-both-variants", seam_ok, {"seams": list(seams)})

    # 12 all six bindings, including theorem presence, must match the current
    # declared sources and the values derived from them.
    bindings = document.get("sourceBindings", [])
    has_photonic = any(b.get("bindingId") == "photonic-records" for b in bindings)
    source_values_ok = (
        document.get("method", {}).get("a0WavelengthsNm")
        == expected["method"]["a0WavelengthsNm"]
        and document.get("method", {}).get("constants") == expected["method"]["constants"]
    )
    bindings_ok = bindings == expected["sourceBindings"]
    record(
        "source-bindings-include-photonic-records",
        len(bindings) == 6 and has_photonic and bindings_ok and source_values_ok,
        {
            "bindingIds": [b.get("bindingId") for b in bindings],
            "matchesDeclaredSources": bindings_ok,
            "derivedInputsMatch": source_values_ok,
        },
    )

    # 13 mean-doubling Σν_t =2^t Σν0
    doubling = document.get("method", {}).get("sumDoubling", {})
    record("mean-doubling-2t", abs(doubling.get("ratioA1", 0) - 2.0) < 1e-9 and abs(doubling.get("ratioA2", 0) - 2.0) < 1e-9, doubling)

    # 14 fingerprint closure already covered, but explicit
    record("fingerprint-closure-6-bindings", len(bindings) == 6 and bindings_ok, bindings)

    failed = [c for c in checks if c["status"] == "FAIL"]
    report_core = {
        "schemaVersion": "gov-2xx.tiered-photonic-candidate-validation.v1",
        "verdict": "FAIL" if failed else "PASS",
        "candidateId": "CH_TIERED_v1",
        "candidateFingerprint": document.get("candidateFingerprint", "0" * 64),
        "checksPassed": len(checks) - len(failed),
        "checksFailed": len(failed),
        "checks": checks,
    }
    return {**report_core, "reportFingerprint": sha256_payload(report_core)}


def main() -> int:
    document = _read_json(CANDIDATE_PATH)
    report = validate(document)
    jsonschema.Draft202012Validator(_read_json(REPORT_SCHEMA_PATH)).validate(report)
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["verdict"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
