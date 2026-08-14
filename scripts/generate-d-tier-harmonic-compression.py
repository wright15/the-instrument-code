#!/usr/bin/env python3
"""Generate or verify the GOV-227 D-tier sidecar."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "court-mathematics/src"))

from governor.harmonic_compression_d_tier import (  # noqa: E402
    build_d_tier_harmonic_compression_candidate,
    serialize_d_tier_candidate,
)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        type=Path,
        default=ROOT / "canonical/harmonic-compression-candidates/CH_D17_q_v2.json",
    )
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    document = build_d_tier_harmonic_compression_candidate(root=ROOT)
    payload = serialize_d_tier_candidate(document)
    if args.check:
        if not args.output.is_file() or args.output.read_bytes() != payload:
            raise SystemExit("STALE_GOV227_D_TIER_HARMONIC_COMPRESSION_CANDIDATE")
    else:
        args.output.write_bytes(payload)
    print(
        json.dumps(
            {
                "candidateId": document["candidateId"],
                "candidateFingerprint": document["candidateFingerprint"],
                "recordCount": len(document["records"]),
                "status": document["status"],
                "lpStatuses": [
                    item["status"] for item in document["linearProgrammingAudit"]["models"]
                ],
                "globalAggregateStatus": document["globalAggregate"]["status"],
            },
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
