#!/usr/bin/env python3
"""Validate source-derived GOV-513 D-shadow complement-span evidence."""

from __future__ import annotations

import argparse
from copy import deepcopy
import hashlib
import json
import sys
from pathlib import Path
from typing import Any, Mapping

import jsonschema

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from governor.d_shadow_complement_span import (
    CANDIDATE_ID,
    D_TIERS,
    DShadowError,
    EXPECTED_D_TIER_RUN_SEQUENCE,
    SCHEMA_VERSION,
    SHUFFLE_SEED,
    _fifth_positions,
    _max_runs,
    build_d_shadow_candidate,
    derive_d_shadow_model,
    serialize_candidate,
    verify_candidate,
)
from governor.hashing import sha256_payload
from governor.shadow_ladder import complement_mask, fifth_span, mask_pitch_classes, transpose_mask


CANDIDATE_PATH = ROOT / "canonical/fivefold-incubator/d-shadow-complement-span-v0.json"
CANDIDATE_SCHEMA_PATH = ROOT / "schemas/fivefold-incubator/d-shadow-complement-span-v0.schema.json"
REPORT_PATH = ROOT / "qa/d-shadow-complement-span-validation.json"
REPORT_SCHEMA_PATH = ROOT / "schemas/fivefold-incubator/d-shadow-complement-span-validation.schema.json"


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _rehash(document: dict[str, Any]) -> None:
    document["candidateFingerprint"] = sha256_payload(
        {key: value for key, value in document.items() if key != "candidateFingerprint"}
    )


def _is_rejected(document: dict[str, Any]) -> bool:
    try:
        verify_candidate(document, root=ROOT)
    except DShadowError:
        return True
    return False


def _negative_controls(document: dict[str, Any]) -> dict[str, bool]:
    controls: dict[str, bool] = {}
    mutations = {
        "a-anchor-rejected": lambda candidate: candidate["records"][0].update(tier="A0"),
        "satellite-rejected": lambda candidate: candidate["records"][0].update(role="satellite"),
        "boundary-rejected": lambda candidate: candidate["records"][0].update(role="boundary"),
        "duplicate-rejected": lambda candidate: candidate["records"].__setitem__(1, deepcopy(candidate["records"][0])),
        "missing-anchor-rejected": lambda candidate: candidate["records"].pop(),
        "mask-tamper-rejected": lambda candidate: candidate["records"][0].update(complementMask=1),
        "span-tamper-rejected": lambda candidate: candidate["records"][0].update(complementSpan=0),
        "maxrun-tamper-rejected": lambda candidate: candidate["records"][0].update(maxRunLength=0),
        "expectation-tamper-rejected": lambda candidate: candidate["records"][0].update(expectedComplementSpan=0),
        "identity-pairing-tamper-rejected": lambda candidate: candidate["records"][0].update(stateId=1),
        "shuffle-tamper-rejected": lambda candidate: candidate["shuffleControl"]["permutation"].__setitem__(0, 0),
        "verdict-tamper-rejected": lambda candidate: candidate.update(verdict="confirmed" if candidate["verdict"] != "confirmed" else "refuted"),
        "source-binding-tamper-rejected": lambda candidate: candidate["evidenceBindings"].update(canonicalLedgerSha256="0" * 64),
        "court-run-tamper-rejected": lambda candidate: candidate["runSpace"]["d5CourtRun"]["runs"][0].update(forteNumber="5-34"),
        "authority-field-rejected": lambda candidate: candidate.update(admissionEffect="writes_topology"),
    }
    for control_id, mutate in mutations.items():
        tampered = deepcopy(document)
        mutate(tampered)
        _rehash(tampered)
        controls[control_id] = _is_rejected(tampered)
    return controls


def _suite_status() -> list[dict[str, str]]:
    return [
        {"suite": "source-binding", "status": "ran", "reason": "validator compared source hashes to live files"},
        {"suite": "schema", "status": "ran", "reason": "validator applied the candidate and receipt schemas"},
        {"suite": "scope", "status": "ran", "reason": "validator recomputed complete D1-D7 anchor scope"},
        {"suite": "arithmetic", "status": "ran", "reason": "validator recomputed complement masks, fifth spans, maxrun, and identities"},
        {"suite": "build-twice", "status": "ran", "reason": "validator built the source-derived candidate twice"},
        {"suite": "reordered-input", "status": "ran", "reason": "validator rebuilt from reversed authoritative input order"},
        {"suite": "negative-control", "status": "ran", "reason": "validator checked the declared deranged-pairing null control"},
        {"suite": "adversarial-tamper", "status": "ran", "reason": "validator proved rehashed semantic tampering is rejected"},
    ]


def validate(document: Mapping[str, Any]) -> dict[str, Any]:
    checks: list[dict[str, Any]] = []

    def record(check_id: str, passed: bool, diagnostic: Any) -> None:
        checks.append({"checkId": check_id, "status": "PASS" if passed else "FAIL", "diagnostic": diagnostic})

    try:
        jsonschema.Draft202012Validator(json.loads(CANDIDATE_SCHEMA_PATH.read_text(encoding="utf-8"))).validate(document)
    except (OSError, json.JSONDecodeError, jsonschema.ValidationError) as error:
        record("schema", False, str(error))
    else:
        record("schema", True, "valid")

    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    record("candidate-fingerprint", document.get("candidateFingerprint") == sha256_payload(core), document.get("candidateFingerprint"))

    try:
        model = derive_d_shadow_model(root=ROOT)
        expected = build_d_shadow_candidate(root=ROOT)
        reordered = build_d_shadow_candidate(root=ROOT, reverse_input=True)
    except DShadowError as error:
        model = expected = reordered = None
        source_error = str(error)
    else:
        source_error = None

    record("freshness", expected is not None and serialize_candidate(document) == serialize_candidate(expected), expected["candidateFingerprint"] if expected else source_error)
    record("determinism-build-twice", expected is not None and serialize_candidate(expected) == serialize_candidate(build_d_shadow_candidate(root=ROOT)), "identical source builds" if expected else source_error)
    record("determinism-reorder", expected is not None and reordered is not None and serialize_candidate(expected) == serialize_candidate(reordered), "ledger order independent" if expected else source_error)
    record("determinism-schema", expected is not None and document.get("schemaVersion") == SCHEMA_VERSION and set(document) == set(expected), "stable candidate envelope" if expected else source_error)

    records = document.get("records")
    record(
        "scope-closure",
        isinstance(records, list)
        and len(records) == 49
        and {record.get("tier") for record in records if isinstance(record, Mapping)} == set(D_TIERS)
        and all(isinstance(record, Mapping) and record.get("role") == "anchor" for record in records),
        {"recordCount": len(records) if isinstance(records, list) else "non-list", "tiers": sorted({record.get("tier") for record in records if isinstance(record, Mapping)}) if isinstance(records, list) else []},
    )
    record(
        "scope-identity-pairings",
        isinstance(records, list)
        and len({record.get("stateId") for record in records if isinstance(record, Mapping)}) == 49
        and all(record.get("stateId") == record.get("anchorMask") for record in records if isinstance(record, Mapping)),
        "49 unique canonical anchor identities paired with their direct complements",
    )

    arithmetic_valid = isinstance(records, list) and all(
        isinstance(record, Mapping)
        and record.get("complementMask") == complement_mask(record.get("anchorMask"))
        and record.get("anchorSpan") == fifth_span(mask_pitch_classes(record.get("anchorMask")))
        and record.get("complementSpan") == fifth_span(mask_pitch_classes(record.get("complementMask")))
        and record.get("expectedComplementSpan") == record.get("anchorSpan") - 2
        and record.get("complementHoles") == record.get("complementSpan") + 1 - 5
        and record.get("directComplementRelationHolds") == (record.get("complementSpan") == record.get("expectedComplementSpan"))
        for record in records
    )
    record("direct-complement-arithmetic", arithmetic_valid, "direct complement masks and fifth-space relation recomputed")
    maxrun_identity_valid = isinstance(records, list) and all(
        isinstance(record, Mapping)
        and record.get("maxRunLength") == _max_runs(_fifth_positions(record.get("anchorMask")))[0]
        and record.get("complementSpan") == 11 - record.get("maxRunLength")
        for record in records
    )
    record("maxrun-complement-identity", maxrun_identity_valid, "span(complement(mask)) = 11 - maxrun(mask) across all 49 anchors")
    transposition_valid = isinstance(records, list) and all(
        isinstance(record, Mapping)
        and record.get("transposedComplementControl", {}).get("plusOneSpan") == record.get("complementSpan")
        and record.get("transposedComplementControl", {}).get("minusOneSpan") == record.get("complementSpan")
        and record.get("transposedComplementControl", {}).get("spanInvariant") is True
        and fifth_span(mask_pitch_classes(transpose_mask(record.get("complementMask"), 1))) == record.get("complementSpan")
        and fifth_span(mask_pitch_classes(transpose_mask(record.get("complementMask"), -1))) == record.get("complementSpan")
        for record in records
    )
    record("transposition-control", transposition_valid, "T+/-1 complement forms preserve span and cannot create a pass")

    summaries = document.get("tierSummaries")
    record("tier-counts", summaries == (expected or {}).get("tierSummaries"), summaries)
    record("verdict-case-logic", document.get("verdict") == (model or {}).get("verdict") and document.get("verdict") in {"confirmed", "partial", "refuted"}, document.get("verdict"))
    record("hypothesis-disposition", document.get("hypothesisDisposition") == (expected or {}).get("hypothesisDisposition"), document.get("hypothesisDisposition"))
    run_space = document.get("runSpace")
    record(
        "D-tier-maxrun-sequence",
        isinstance(run_space, Mapping)
        and run_space.get("dRunSequence") == list(EXPECTED_D_TIER_RUN_SEQUENCE)
        and run_space == (expected or {}).get("runSpace"),
        run_space.get("dRunSequence") if isinstance(run_space, Mapping) else None,
    )
    d5_court_run = run_space.get("d5CourtRun") if isinstance(run_space, Mapping) else None
    record(
        "D5-court-class-5-run-containment",
        isinstance(d5_court_run, Mapping)
        and d5_court_run.get("maxRunLength") == 5
        and d5_court_run.get("courtClass") == "5-35"
        and d5_court_run.get("allD5MaxRunsAreCourtClass") is True
        and d5_court_run.get("twinOuterOfficeIntersection", {}).get("stateIds") == [2383, 3667],
        d5_court_run,
    )

    shuffle = document.get("shuffleControl")
    record(
        "shuffle-null-control",
        shuffle == (expected or {}).get("shuffleControl")
        and isinstance(shuffle, Mapping)
        and shuffle.get("seed") == SHUFFLE_SEED
        and shuffle.get("isDerangement") is True,
        {"passingPairCount": shuffle.get("passingPairCount") if isinstance(shuffle, Mapping) else None, "totalPairCount": shuffle.get("totalPairCount") if isinstance(shuffle, Mapping) else None},
    )

    bindings = document.get("evidenceBindings")
    record(
        "source-bindings",
        isinstance(bindings, Mapping)
        and bindings.get("canonicalLedgerSha256") == _sha256(ROOT / "canonical/universal-heptatonic-ledger.json")
        and bindings.get("networkSha256") == _sha256(ROOT / "canonical/universal-network-data.json")
        and bindings.get("pentatonicAuditSha256") == _sha256(ROOT / "canonical/pentatonic-binding-candidates/pentatonic-7-35-parent-audit-v1.json")
        and bindings.get("courtRootedPositionsSha256") == _sha256(ROOT / "seven-governors-court-substrate-v0.1.0/canonical/court-rooted-positions.json")
        and bindings.get("spanDefinitionSha256") == _sha256(ROOT / "src/governor/shadow_ladder.py")
        and bindings == (model or {}).get("sourceBindings"),
        bindings,
    )
    controls = _negative_controls(dict(document))
    record("adversarial-tamper-rejection", all(controls.values()), controls)

    failed = [check for check in checks if check["status"] == "FAIL"]
    report_core = {
        "schemaVersion": "d-shadow-complement-span-validation.v0",
        "verdict": "FAIL" if failed else "PASS",
        "candidateId": document.get("candidateId", CANDIDATE_ID),
        "candidateFingerprint": document.get("candidateFingerprint", "0" * 64),
        "checksPassed": len(checks) - len(failed),
        "checksFailed": len(failed),
        "checks": checks,
        "suiteStatus": _suite_status(),
    }
    return {**report_core, "reportFingerprint": sha256_payload(report_core)}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-write", action="store_true")
    args = parser.parse_args(argv)
    document = json.loads(CANDIDATE_PATH.read_text(encoding="utf-8"))
    report = validate(document)
    jsonschema.Draft202012Validator(json.loads(REPORT_SCHEMA_PATH.read_text(encoding="utf-8"))).validate(report)
    if not args.no_write:
        REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["verdict"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
