#!/usr/bin/env python3
"""Generate or check the GOV-514 D-tier interleaving receipt."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "court-mathematics/src"))

from governor.d_tier_interleaving_check import build_d_tier_interleaving_candidate, serialize_candidate


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "canonical/fivefold-incubator/d-tier-interleaving-check-v0.json")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    document = build_d_tier_interleaving_candidate(root=ROOT)
    payload = serialize_candidate(document)
    if args.check:
        if not args.output.is_file() or args.output.read_bytes() != payload:
            raise SystemExit("STALE_D_TIER_INTERLEAVING_CHECK")
    else:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_bytes(payload)
    print(json.dumps({"candidateId": document["candidateId"], "candidateFingerprint": document["candidateFingerprint"], "verdict": document["verdict"]}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
