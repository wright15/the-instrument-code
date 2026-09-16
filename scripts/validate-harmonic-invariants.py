"""Execute frozen harmonic checks with scoped references and read-only receipts."""

from pathlib import Path
import os
import runpy
import subprocess
import sys
from unittest.mock import patch

from jsonschema import Draft202012Validator
from referencing import Registry, Resource


ROOT = Path(__file__).resolve().parents[1]
PACKAGE_ROOT = ROOT / "seven-governors-harmonic-invariants-v0.1.0"


def scoped_validator(schema, *, resolver):
    # RefResolver retains mutable scope across repeated iter_errors calls.
    # Use the same frozen schemas, but immutable Draft 2020-12 resolution.
    registry = Registry().with_resources(
        (uri, Resource.from_contents(document))
        for uri, document in resolver.store.items()
    )
    return Draft202012Validator(schema, registry=registry)


def check_frozen_report(target, payload):
    if target.read_bytes() != payload:
        raise AssertionError(f"FROZEN_REPORT_MISMATCH:{target.name}")


def main():
    sys.dont_write_bytecode = True
    os.environ["PYTHONDONTWRITEBYTECODE"] = "1"
    sys.path.insert(0, str(PACKAGE_ROOT / "scripts"))
    # Bootstrap the frozen imports without modifying package files.
    import _bootstrap  # noqa: F401
    from harmonic_invariants import canonical

    subprocess.run(
        [sys.executable, "-B", "scripts/build_invariants.py", "--check"],
        cwd=PACKAGE_ROOT, check=True,
    )
    subprocess.run(
        [sys.executable, "-B", "-m", "pytest", "-p", "no:cacheprovider", "-q", "tests"],
        cwd=PACKAGE_ROOT, check=True,
    )
    with patch("jsonschema.Draft202012Validator", scoped_validator), patch.object(
        canonical, "write_atomic", check_frozen_report,
    ):
        for script, arguments in (
            ("validate_package.py", []),
            ("validate_determinism.py", []),
            ("build_package_manifest.py", ["--check"]),
        ):
            sys.argv = [str(PACKAGE_ROOT / "scripts" / script), *arguments]
            try:
                runpy.run_path(sys.argv[0], run_name="__main__")
            except SystemExit as error:
                if error.code not in (None, 0):
                    raise


if __name__ == "__main__":
    main()
