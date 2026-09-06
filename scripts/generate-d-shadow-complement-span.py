#!/usr/bin/env python3
"""Generate or check the GOV-513 D-shadow complement-span sidecar."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from governor.d_shadow_complement_span import build_d_shadow_candidate, serialize_candidate


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "canonical/fivefold-incubator/d-shadow-complement-span-v0.json")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    document = build_d_shadow_candidate(root=ROOT)
    payload = serialize_candidate(document)
    if args.check:
        if not args.output.is_file() or args.output.read_bytes() != payload:
            raise SystemExit("STALE_D_SHADOW_COMPLEMENT_SPAN")
    else:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_bytes(payload)
    print(json.dumps({"candidateId": document["candidateId"], "candidateFingerprint": document["candidateFingerprint"], "verdict": document["verdict"]}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
