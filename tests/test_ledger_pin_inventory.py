import importlib.util
import json
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("ledger_pin_inventory", ROOT / "scripts/validate-ledger-pins.py")
scanner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scanner)


def test_repository_inventory():
    result = scanner.inspect(ROOT, json.loads((ROOT / "schemas/ledger-pin-allowlist.json").read_text()))
    assert result["verdict"] == "PASS", result["violations"]
    assert "scripts/build-fivefold-engine-promotion-evidence.py" in result["ledgerConsumers"]
    assert "scripts/build-pentatonic-binding-audit-closure.mjs" in result["ledgerConsumers"]


@pytest.mark.parametrize("filename,source", [
    ("bad.py", 'DECISION_LEDGER_SHA256: str = "' + "a" * 64 + '"'),
    ("bad.py", 'bindings = {"observationLedgerSha256": "' + "b" * 64 + '"}'),
    ("bad.mjs", 'const decisionLedgerSha =\n "' + "c" * 64 + '";'),
    ("bad.ts", 'const PIN: string = "' + "d" * 64 + '";'),
    ("bad.js", 'const bindings = {decisionLedgerSha256: "' + "e" * 64 + '"};'),
])
def test_literal_pin_is_rejected(tmp_path, filename, source):
    (tmp_path / "scripts").mkdir()
    (tmp_path / "scripts" / filename).write_text(source)
    assert scanner.inspect(tmp_path, [])["verdict"] == "FAIL"


def test_allowlist_is_exact_and_justified(tmp_path):
    (tmp_path / "scripts").mkdir()
    (tmp_path / "scripts/frozen.py").write_text('FROZEN_PIN = "' + "f" * 64 + '"')
    entry = {"path": "scripts/frozen.py", "name": "FROZEN_PIN", "sha256": "f" * 64,
             "reason": "Immutable admitted package payload."}
    assert scanner.inspect(tmp_path, [entry])["verdict"] == "PASS"
    for reason in ("", " ", None):
        with pytest.raises(ValueError, match="reason_required"):
            scanner.inspect(tmp_path, [{**entry, "reason": reason}])
    assert scanner.inspect(tmp_path, [{**entry, "sha256": "0" * 64}])["verdict"] == "FAIL"
    with pytest.raises(ValueError, match="duplicate"):
        scanner.inspect(tmp_path, [entry, entry])
    with pytest.raises(ValueError, match="cannot_be_allowlisted"):
        scanner.inspect(tmp_path, [{**entry, "name": "LEDGER_SHA256"}])


def test_generated_ledger_binding_is_allowed(tmp_path):
    (tmp_path / "scripts").mkdir()
    (tmp_path / "scripts/fresh.py").write_text('decisionLedgerSha256 = hash_file("provenance/DECISION_LEDGER.md")')
    result = scanner.inspect(tmp_path, [])
    assert result["verdict"] == "PASS"
    assert result["ledgerConsumers"] == ["scripts/fresh.py"]
