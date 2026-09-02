#!/usr/bin/env python3
import argparse, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
from governor.fifth_space_census import build_census_candidate, serialize_candidate
def main():
    p = argparse.ArgumentParser()
    p.add_argument("--output", type=Path, default=ROOT / "canonical/fivefold-incubator/fifth-space-census-v0.json")
    p.add_argument("--check", action="store_true")
    args = p.parse_args()
    doc = build_census_candidate(root=ROOT)
    payload = serialize_candidate(doc)
    if args.check:
        if not args.output.is_file() or args.output.read_bytes() != payload:
            raise SystemExit("STALE_FIFTH_SPACE_CENSUS")
    else:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_bytes(payload)
    print(json.dumps({"candidateId": doc["candidateId"], "candidateFingerprint": doc["candidateFingerprint"], "records": len(doc["records"]), "verdict": doc["researchVerdict"]["verdict"]}, sort_keys=True))
    return 0
if __name__ == "__main__":
    raise SystemExit(main())
