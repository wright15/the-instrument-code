"""Source-derived GOV-514 reproduction receipt with no new coordinate."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any, Mapping

from .harmonic_compression_d_tier import build_d_tier_harmonic_compression_candidate, serialize_d_tier_candidate
from .hashing import canonical_json_bytes, sha256_payload


SCHEMA_VERSION = "fivefold-incubator.d-tier-interleaving-check.v0"
CANDIDATE_ID = "D_TIER_INTERLEAVING_CHECK_v0"


class DTierInterleavingError(ValueError):
    """Raised when the GOV-227 reproduction inputs do not close."""


def _read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise DTierInterleavingError(f"invalid_json_source:{path}") from error


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _anchor_count(ledger: Any) -> int:
    if not isinstance(ledger, list):
        raise DTierInterleavingError("ledger_source_must_be_array")
    count = sum(
        isinstance(record, Mapping)
        and record.get("role") == "anchor"
        and record.get("tier") in {"A0", "A1", "A2", "D1", "D2", "D3", "D4", "D5", "D6", "D7"}
        for record in ledger
    )
    if count != 70:
        raise DTierInterleavingError("comparison_universe_must_have_70_anchors")
    return count


def _verdict(candidate: Mapping[str, Any]) -> str:
    audit = candidate.get("linearProgrammingAudit", {})
    fixed = audit.get("fixedWitness", {}) if isinstance(audit, Mapping) else {}
    models = audit.get("models", []) if isinstance(audit, Mapping) else []
    comparisons = fixed.get("adjacentComparisons", []) if isinstance(fixed, Mapping) else []
    controls = candidate.get("comparisonEvidence", {})
    complete = (
        len(comparisons) == 9
        and fixed.get("declaredOrderStrictlySeparated") is False
        and len(models) == 3
        and all(model.get("status") == "WEAK_SYSTEM_INFEASIBLE" for model in models if isinstance(model, Mapping))
        and isinstance(controls, Mapping)
        and controls.get("d2D5MultisetTwins", {}).get("sharedQMultiset") == [2, 3, 3, 6, 6, 7, 7]
        and controls.get("zPartnerD3D4", {}).get("intervalVectorsEqual") is True
    )
    if complete:
        return "confirmed"
    if any(model.get("status") == "LIMIT" for model in models if isinstance(model, Mapping)):
        return "partial"
    return "refuted"


def derive_d_tier_interleaving_model(*, root: Path, reverse_input: bool = False) -> dict[str, Any]:
    candidate_path = root / "canonical/harmonic-compression-candidates/CH_D17_q_v2.json"
    ledger_path = root / "canonical/universal-heptatonic-ledger.json"
    checked = _read_json(candidate_path)
    fresh = build_d_tier_harmonic_compression_candidate(root=root, reverse_input=reverse_input)
    if serialize_d_tier_candidate(checked) != serialize_d_tier_candidate(fresh):
        raise DTierInterleavingError("gov227_candidate_is_not_fresh")
    _anchor_count(_read_json(ledger_path))
    audit = fresh["linearProgrammingAudit"]
    return {
        "gov227Candidate": fresh,
        "comparisonUniverseAnchorCount": 70,
        "fixedWitness": audit["fixedWitness"],
        "models": audit["models"],
        "collisionControls": fresh["comparisonEvidence"],
        "verdict": _verdict(fresh),
        "sourceBindings": {
            "gov227CandidateSha256": _sha256(candidate_path),
            "canonicalLedgerSha256": _sha256(ledger_path),
            "gov227GeneratorSha256": _sha256(root / "src/governor/harmonic_compression_d_tier.py"),
        },
    }


def build_d_tier_interleaving_candidate(*, root: Path, reverse_input: bool = False) -> dict[str, Any]:
    """Build the bounded GOV-514 reproduction receipt from fresh GOV-227 inputs."""
    model = derive_d_tier_interleaving_model(root=root, reverse_input=reverse_input)
    core = {
        "schemaVersion": SCHEMA_VERSION,
        "candidateId": CANDIDATE_ID,
        "status": "planning_evidence",
        "scope": {
            "sourceCandidateId": "CH_D17_q_v2",
            "dTierAnchorCount": 49,
            "comparisonUniverseAnchorCount": model["comparisonUniverseAnchorCount"],
            "excluded": ["satellites", "boundary states", "runtime", "Neo4j", "global harmonic.C_H"],
        },
        "method": {
            "reproduction": "fresh GOV-227 generator output compared byte-for-byte with the checked sidecar",
            "fixedWitness": "all declared-adjacent signed gaps are retained in declared tier order",
            "lpModels": "three exact models retain WEAK_SYSTEM_INFEASIBLE only when the exact solver reports that status",
            "quotientControls": "D2/D5 q multiset and D3/D4 interval vector reject multiset, sum, and interval-vector tier classification",
            "verdictSemantics": "confirmed=all gaps, all three exact models, and both controls reproduce; partial=one or more named model is LIMIT; refuted=other fresh valid contradiction",
        },
        "gov227CandidateFingerprint": model["gov227Candidate"]["candidateFingerprint"],
        "fixedWitness": model["fixedWitness"],
        "lpModels": model["models"],
        "collisionControls": model["collisionControls"],
        "verdict": model["verdict"],
        "hypothesisDisposition": {
            "H1": "partial weakening: scalar evidence cannot supply every D4/D5 contact, office, or orientation condition",
            "H2": "neutral; no ring-force enumeration occurred",
            "H3": "partial support that non-scalar topology remains necessary; irreducibility is not proven",
        },
        "evidenceBindings": model["sourceBindings"],
    }
    return {**core, "candidateFingerprint": sha256_payload(core)}


def serialize_candidate(document: Mapping[str, Any]) -> bytes:
    return canonical_json_bytes(document)


def verify_candidate(document: Mapping[str, Any], *, root: Path) -> None:
    if not isinstance(document, Mapping):
        raise DTierInterleavingError("candidate_must_be_object")
    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    if document.get("candidateFingerprint") != sha256_payload(core):
        raise DTierInterleavingError("candidate_fingerprint_mismatch")
    if serialize_candidate(document) != serialize_candidate(build_d_tier_interleaving_candidate(root=root)):
        raise DTierInterleavingError("candidate_does_not_match_fresh_GOV227_reproduction")
