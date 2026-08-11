#!/usr/bin/env python3
"""Generate or verify the canonical GOV-210 read projection."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from governor.availability_housing import (  # noqa: E402
    build_availability_housing_projection,
    iter_gov210_ingestion_batches,
    serialize_availability_housing_projection,
)
from governor.hashing import canonical_json_bytes  # noqa: E402
from governor.availability_housing_queries import (  # noqa: E402
    GOV210_QUERY_CATALOG,
    execute_gov210_snapshot_query,
)


def _json(path: Path | None):
    if path is None:
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        type=Path,
        default=ROOT / "canonical/gov-210-availability-housing.json",
    )
    parser.add_argument("--context", type=Path)
    parser.add_argument("--court-context", type=Path)
    parser.add_argument("--lifecycle", type=Path)
    parser.add_argument("--batches", type=Path)
    parser.add_argument("--query-results", type=Path)
    parser.add_argument("--batch-size", type=int, default=100)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    lifecycle = _json(args.lifecycle)
    if lifecycle is None:
        lifecycle = []
    if not isinstance(lifecycle, list):
        raise ValueError("lifecycle_input_must_be_array")
    if (
        (args.context is not None or args.court_context is not None or args.lifecycle is not None)
        and args.output == ROOT / "canonical/gov-210-availability-housing.json"
        and not args.check
    ):
        raise ValueError("contextual_build_requires_explicit_output")
    snapshot = build_availability_housing_projection(
        root=ROOT,
        context_bundle=_json(args.context),
        court_context_bundle=_json(args.court_context),
        lifecycle_recipes=lifecycle,
    )
    payload = serialize_availability_housing_projection(snapshot)
    if args.check:
        if not args.output.is_file() or args.output.read_bytes() != payload:
            raise SystemExit("STALE_GOV210_PROJECTION")
    else:
        args.output.write_bytes(payload)
    if args.batches is not None:
        batches = [
            {
                "sequence": batch.sequence,
                "kind": batch.kind,
                "cypher": batch.cypher,
                "parameters": dict(batch.parameters),
            }
            for batch in iter_gov210_ingestion_batches(snapshot, batch_size=args.batch_size)
        ]
        args.batches.write_bytes(canonical_json_bytes(batches))
    if args.query_results is not None:
        housing_note_id = next(
            (
                node["properties"]["noteId"]
                for node in snapshot["nodes"]
                if node["label"] == "Gov210ContextHousing"
            ),
            "absent-note",
        )
        lifecycle_skill_id = next(
            (
                node["properties"]["skillId"]
                for node in snapshot["nodes"]
                if node["label"] == "Gov210SkillLifecycle"
            ),
            "inspect_context",
        )
        query_inputs = (
            ("skills_for_topology_target", {"scaleStateId": 1453}),
            ("skills_for_court_position", {"positionId": "C2"}),
            (
                "skill_assignment_explanation",
                {"assignmentId": "assignment:list_legal_moves:topology:1453"},
            ),
            ("skill_availability", {"skillId": "classify_governor"}),
            ("context_housing_for_note", {"noteId": housing_note_id}),
            ("skill_lifecycle_history", {"skillId": lifecycle_skill_id, "limit": 3}),
        )
        results = [
            {
                "cypher": GOV210_QUERY_CATALOG[query_id].cypher,
                "parameters": parameters,
                "queryId": query_id,
                "rows": list(execute_gov210_snapshot_query(snapshot, query_id, parameters)),
                "timeoutMs": GOV210_QUERY_CATALOG[query_id].timeout_ms,
            }
            for query_id, parameters in query_inputs
        ]
        args.query_results.write_bytes(canonical_json_bytes(results))
    print(
        json.dumps(
            {
                "projectionFingerprint": snapshot["projectionFingerprint"],
                "counts": snapshot["counts"],
            },
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
