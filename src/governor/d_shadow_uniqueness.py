"""Source-bound GOV-516 max-run uniqueness observation."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any, Mapping

from .d_shadow_complement_span import DShadowError, verify_candidate as verify_d_shadow_candidate
from .hashing import canonical_json_bytes, sha256_payload


SCHEMA_VERSION = "fivefold-incubator.d-shadow-uniqueness-check.v0"
CANDIDATE_ID = "D_SHADOW_UNIQUENESS_CHECK_v0"
SOURCE_PATH = Path("canonical/fivefold-incubator/d-shadow-complement-span-v0.json")


class DShadowUniquenessError(ValueError):
    """Raised when the source-bound run-space observation is inconsistent."""


def _read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise DShadowUniquenessError(f"invalid_json_source:{path}") from error


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _coordinate(tier: Any) -> int:
    if not isinstance(tier, str) or not tier.startswith("D"):
        raise DShadowUniquenessError(f"invalid_tier:{tier}")
    try:
        coordinate = int(tier[1:])
    except ValueError as error:
        raise DShadowUniquenessError(f"invalid_tier:{tier}") from error
    if not 1 <= coordinate <= 7:
        raise DShadowUniquenessError(f"invalid_tier:{tier}")
    return coordinate


def _source_rows(*, root: Path, reverse_input: bool = False) -> tuple[Mapping[str, Any], list[dict[str, Any]]]:
    source_path = root / SOURCE_PATH
    source = _read_json(source_path)
    if not isinstance(source, Mapping):
        raise DShadowUniquenessError("source_must_be_object")
    try:
        verify_d_shadow_candidate(source, root=root)
    except DShadowError as error:
        raise DShadowUniquenessError(f"source_binding_mismatch:{error}") from error

    run_space = source.get("runSpace")
    summaries = run_space.get("tierSummaries") if isinstance(run_space, Mapping) else None
    if not isinstance(summaries, list) or len(summaries) != 7:
        raise DShadowUniquenessError("run_space_must_contain_seven_tier_summaries")
    input_rows = list(reversed(summaries)) if reverse_input else list(summaries)
    rows: list[dict[str, Any]] = []
    for summary in input_rows:
        if not isinstance(summary, Mapping):
            raise DShadowUniquenessError("tier_summary_must_be_object")
        coordinate = _coordinate(summary.get("tier"))
        max_run = summary.get("maxRunLength")
        if not isinstance(max_run, int) or isinstance(max_run, bool) or max_run < 1:
            raise DShadowUniquenessError(f"invalid_maxrun:{summary.get('tier')}")
        rows.append({"tier": summary["tier"], "coordinate": coordinate, "maxRunLength": max_run})
    rows.sort(key=lambda row: row["coordinate"])
    if [row["coordinate"] for row in rows] != list(range(1, 8)):
        raise DShadowUniquenessError("D1_through_D7_coordinates_required")
    return source, rows


def derive_d_shadow_uniqueness_model(*, root: Path, reverse_input: bool = False) -> dict[str, Any]:
    """Compute the full uniqueness candidate set from source artifact summaries."""
    source, rows = _source_rows(root=root, reverse_input=reverse_input)
    maximum = max(row["maxRunLength"] for row in rows)
    candidates = [row["coordinate"] for row in rows if row["maxRunLength"] == maximum]
    if candidates == [5]:
        category, verdict = "one_target", "confirmed"
    elif len(candidates) > 1:
        category, verdict = "multiple_targets", "refuted"
    else:
        category, verdict = "incomplete_or_anomalous", "partial"
    return {
        "source": source,
        "rows": rows,
        "maximum": maximum,
        "candidates": candidates,
        "category": category,
        "verdict": verdict,
    }


def build_d_shadow_uniqueness_candidate(*, root: Path, reverse_input: bool = False) -> dict[str, Any]:
    """Build the deterministic, observation-only GOV-516 sidecar."""
    model = derive_d_shadow_uniqueness_model(root=root, reverse_input=reverse_input)
    source = model["source"]
    source_path = root / SOURCE_PATH
    core = {
        "schemaVersion": SCHEMA_VERSION,
        "candidateId": CANDIDATE_ID,
        "status": "planning_evidence",
        "scope": {
            "source": str(SOURCE_PATH),
            "input": "runSpace.tierSummaries",
            "tierCount": len(model["rows"]),
            "excluded": ["declared D4/D5 signature", "office result", "observed result", "non-run-space source"],
        },
        "inputTierSummaries": model["rows"],
        "candidateSet": {
            "definition": "coordinates with maxRunLength equal to the maximum across D1-D7",
            "maximumMaxRunLength": model["maximum"],
            "coordinates": model["candidates"],
            "cardinality": len(model["candidates"]),
            "isD5Unique": model["candidates"] == [5],
            "enumerationComplete": True,
        },
        "category": model["category"],
        "verdict": model["verdict"],
        "hypothesisDisposition": {"H1": "no disposition", "H2": "no disposition", "H3": "no disposition"},
        "evidenceBindings": {
            "dShadowCandidateSha256": _sha256(source_path),
            "dShadowCandidateFingerprint": source.get("candidateFingerprint"),
        },
    }
    return {**core, "candidateFingerprint": sha256_payload(core)}


def serialize_candidate(document: Mapping[str, Any]) -> bytes:
    return canonical_json_bytes(document)


def verify_candidate(document: Mapping[str, Any], *, root: Path) -> None:
    if not isinstance(document, Mapping):
        raise DShadowUniquenessError("candidate_must_be_object")
    core = {key: value for key, value in document.items() if key != "candidateFingerprint"}
    if document.get("candidateFingerprint") != sha256_payload(core):
        raise DShadowUniquenessError("candidate_fingerprint_mismatch")
    if canonical_json_bytes(document) != serialize_candidate(build_d_shadow_uniqueness_candidate(root=root)):
        raise DShadowUniquenessError("candidate_does_not_match_source_derivation")
