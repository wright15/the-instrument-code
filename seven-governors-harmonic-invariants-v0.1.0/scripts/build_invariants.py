from __future__ import annotations

import argparse
from pathlib import Path
import sys

from _bootstrap import PACKAGE_ROOT

from harmonic_invariants.builder import OUTPUT_NAMES, build_artifacts
from harmonic_invariants.canonical import write_atomic


def main() -> int:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--check", action="store_true")
    mode.add_argument("--emit", action="store_true")
    parser.add_argument("--output-dir", type=Path)
    parser.add_argument("--test-reverse-input-order", action="store_true")
    arguments = parser.parse_args()
    output_directory = (arguments.output_dir or PACKAGE_ROOT / "canonical").resolve()
    artifacts = build_artifacts(reverse_input_order=arguments.test_reverse_input_order)
    mismatches = []
    if arguments.emit:
        output_directory.mkdir(parents=True, exist_ok=True)
    for name, payload in artifacts.items():
        target = output_directory / name
        if arguments.emit:
            write_atomic(target, payload)
        elif not target.is_file() or target.read_bytes() != payload:
            mismatches.append(name)
    if output_directory.exists():
        mismatches.extend(
            f"unexpected:{path.name}"
            for path in output_directory.iterdir()
            if path.is_file() and path.name not in OUTPUT_NAMES
        )
    if mismatches:
        print(f"STALE_CANONICAL_OUTPUT: {', '.join(sorted(mismatches))}", file=sys.stderr)
        return 1
    print(
        {
            "mode": "emit" if arguments.emit else "check",
            "outputs": list(artifacts),
            "status": "passed",
        }
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
