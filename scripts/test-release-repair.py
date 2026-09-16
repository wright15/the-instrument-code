from copy import deepcopy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys

from jsonschema import RefResolver
import pytest


spec = importlib.util.spec_from_file_location(
    "harmonic_validation", Path(__file__).with_name("validate-harmonic-invariants.py"),
)
validation = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validation)


def test_repeated_validation_keeps_root_and_external_references_scoped():
    root = validation.PACKAGE_ROOT
    schemas = [json.loads(path.read_text()) for path in (root / "schemas").glob("*.json")]
    store = {schema["$id"]: schema for schema in schemas}
    schema = next(item for item in schemas if item.get("title") == "HarmonicInvariantRelease")
    validator = validation.scoped_validator(
        schema, resolver=RefResolver.from_schema(schema, store=store),
    )
    release = json.loads((root / "canonical/harmonic-invariant-registry.json").read_text())
    for field, key, value, expected in (
        ("compressionGuard", "guardLiteral", "C_H equals kappa_court.", "const"),
        ("courtGeometry", "weights", [4, 5, 5, 5, 5], "const"),
        ("courtGeometry", "kappaCourt", [{"numerator": 0, "denominator": 0}] * 5, "minimum"),
        ("carey535", "intervalInstances", [], "minItems"),
    ):
        assert not list(validator.iter_errors(release))
        tampered = deepcopy(release)
        tampered[field][key] = value
        errors = list(validator.iter_errors(tampered))
        assert any(error.validator == expected for error in errors)
    assert not list(validator.iter_errors(release))


def test_frozen_report_comparison_never_rewrites(tmp_path):
    target = tmp_path / "report.json"
    target.write_bytes(b"frozen")
    validation.check_frozen_report(target, b"frozen")
    with pytest.raises(AssertionError, match="FROZEN_REPORT_MISMATCH"):
        validation.check_frozen_report(target, b"different")
    assert target.read_bytes() == b"frozen"


def test_full_runner_preserves_all_frozen_payload_bytes():
    root = validation.PACKAGE_ROOT
    manifest = json.loads((root / "PACKAGE_MANIFEST.json").read_text())
    paths = [root / item["path"] for item in manifest["files"]]
    paths.append(root / "PACKAGE_MANIFEST.json")
    before = {path: path.read_bytes() for path in paths}
    result = subprocess.run(
        [sys.executable, "-B", str(Path(validation.__file__))],
        capture_output=True, text=True,
    )
    assert result.returncode == 0, result.stdout + result.stderr
    assert {path: path.read_bytes() for path in paths} == before
