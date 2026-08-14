#!/usr/bin/env python3
"""Generate or verify the canonical GOV-213 scoped sidecar."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "court-mathematics/src"))

from governor.harmonic_compression import (  # noqa: E402
    build_harmonic_compression_candidate,
    serialize_harmonic_compression_candidate,
)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        type=Path,
        default=ROOT / "canonical/harmonic-compression-candidates/CH_A012_q_v1.json",
    )
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    document = build_harmonic_compression_candidate(root=ROOT)
    payload = serialize_harmonic_compression_candidate(document)
    if args.check:
        if not args.output.is_file() or args.output.read_bytes() != payload:
            raise SystemExit("STALE_GOV213_HARMONIC_COMPRESSION_CANDIDATE")
    else:
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
