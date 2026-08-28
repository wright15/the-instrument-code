#!/usr/bin/env python3
"""Generate or verify the canonical GOV-2xx tiered photonic sidecar."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "court-mathematics/src"))

from governor.tiered_photonic import (  # noqa: E402
    TieredPhotonicError,
    build_tiered_photonic_candidate,
    serialize_tiered_photonic_candidate,
)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        type=Path,
        default=ROOT / "canonical/tiered-photonic-candidates/tiered-photonic-v1.json",
    )
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        document = build_tiered_photonic_candidate(root=ROOT)
    except TieredPhotonicError as exc:
        print(f"INVALID_TIERED_PHOTONIC_SOURCE:{exc}", file=sys.stderr)
        return 1
    payload = serialize_tiered_photonic_candidate(document)
    if args.check:
        if not args.output.is_file() or args.output.read_bytes() != payload:
            raise SystemExit("STALE_TIERED_PHOTONIC_CANDIDATE")
    else:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_bytes(payload)
    print(
        json.dumps(
            {
                "candidateId": document["candidateId"],
                "candidateFingerprint": document["candidateFingerprint"],
                "recordCount": len(document["records"]),
                "status": document["status"],
                "globalAggregateStatus": document["globalAggregate"]["status"],
            },
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
