"""CRT-308 Court vault context contract and authority-boundary tests."""

from __future__ import annotations

import json
from pathlib import Path
import shutil

import pytest

from governor.court_vault_context import CourtVaultContextProvider
from governor.hashing import sha256_bytes, sha256_payload
from governor.vault_context import VaultContextError


ROOT = Path(__file__).resolve().parents[1]
POLICY = "9" * 64


def _request(*seed_ids: str) -> dict:
    return {
        "schemaVersion": "gov-208.context-request.v1",
        "requestId": "request:crt-308:test",
        "policyFingerprint": POLICY,
        "seedNoteIds": list(seed_ids),
        "maxDepth": 2,
    }


def _court_note(
    note_id: str,
    *,
    position: str | None,
    set_class: str,
    kappa: str,
    mask: str,
    admission: str,
    provenance: str,
    body: str = "Synthetic Court pedagogy.",
) -> str:
    position_value = "null" if position is None else position
    return (
        "---\n"
        f"noteId: {note_id}\n"
        f"admissionStatus: {admission}\n"
        "source: source:test:crt-308\n"
        "sensitivity: public\n"
        f"courtRootedPosition: {position_value}\n"
        f"pentatonicSetClass: {set_class}\n"
        f"kappaCourt: {kappa}\n"
        f"courtFilterMask: {mask}\n"
        f"courtProvenanceRef: {provenance}\n"
        "---\n"
        f"{body}\n"
    )


def test_canonical_position_and_invariant_pointer_compile(tmp_path):
    vault = tmp_path / "vault"
    vault.mkdir()
    (vault / "c0.md").write_text(
        _court_note(
            "court:c0",
            position="C0",
            set_class="5-35",
            kappa="0",
            mask="101010010100",
            admission="admitted",
            provenance="crt-303:court.gram_matrix",
        ),
        encoding="utf-8",
    )
    result = CourtVaultContextProvider(vault).compile(_request("court:c0"))
    assert result["status"] == "ok"
    assert result["courtNotes"][0]["effectiveAdmissionStatus"] == "admitted"
    assert result["canonicalCourtPolicyChanged"] is False
    assert result["canonicalAdmissionChanged"] is False
    assert result["graphQueryFingerprintChanged"] is False
    core = {key: value for key, value in result.items() if key != "bundleFingerprint"}
    assert result["bundleFingerprint"] == sha256_payload(core)


def test_bridge_note_remains_admitted_bridge(tmp_path):
    vault = tmp_path / "vault"
    vault.mkdir()
    (vault / "bridge.md").write_text(
        _court_note(
            "court:bridge:5-23",
            position=None,
            set_class="5-23",
            kappa="null",
            mask="101101010000",
            admission="admitted-bridge",
            provenance="crt-302:bridge-rooting:5-23:aeolian-harmonic-minor",
        ),
        encoding="utf-8",
    )
    result = CourtVaultContextProvider(vault).compile(_request())
    assert result["courtNotes"][0]["effectiveAdmissionStatus"] == "admitted-bridge"


def test_false_admission_claim_is_downgraded_by_crt_309_gate(tmp_path):
    vault = tmp_path / "vault"
    vault.mkdir()
    (vault / "proposed.md").write_text(
        _court_note(
            "court:proposed:5-1",
            position=None,
            set_class="5-1",
            kappa="null",
            mask="111110000000",
            admission="admitted",
            provenance="crt-302:pentatonic:5-1",
        ),
        encoding="utf-8",
    )
    result = CourtVaultContextProvider(vault).compile(_request())
    note = result["courtNotes"][0]
    assert note["claimedAdmissionStatus"] == "admitted"
    assert note["effectiveAdmissionStatus"] == "proposed"
    assert result["diagnostics"] == [
        {
            "reasonCode": "court_admission_claim_downgraded",
            "noteId": "court:proposed:5-1",
            "responsibleGate": "CRT-309",
        }
    ]


@pytest.mark.parametrize(
    "field,value,reason",
    [
        ("kappa", "0.25", "court_frontmatter_kappa_mismatch"),
        ("mask", "101001010100", "court_frontmatter_filter_mask_mismatch"),
        ("provenance", "crt-303:court.missing", "court_invariant_pointer_dangling"),
    ],
)
def test_mismatched_court_claims_fail_closed(tmp_path, field, value, reason):
    values = {
        "kappa": "0",
        "mask": "101010010100",
        "provenance": "crt-303:court.gram_matrix",
    }
    values[field] = value
    vault = tmp_path / "vault"
    vault.mkdir()
    (vault / "bad.md").write_text(
        _court_note(
            "court:bad",
            position="C0",
            set_class="5-35",
            kappa=values["kappa"],
            mask=values["mask"],
            admission="admitted",
            provenance=values["provenance"],
        ),
        encoding="utf-8",
    )
    with pytest.raises(VaultContextError, match=reason):
        CourtVaultContextProvider(vault).compile(_request())


def test_court_bundle_is_root_independent_and_does_not_mutate_authority(tmp_path):
    first = tmp_path / "first"
    second = tmp_path / "second"
    first.mkdir()
    note = _court_note(
        "court:c4",
        position="C4",
        set_class="5-35",
        kappa="1",
        mask="100101001010",
        admission="admitted",
        provenance="crt-303:court.kappa_exact",
    )
    (first / "c4.md").write_text(note, encoding="utf-8")
    shutil.copytree(first, second)
    policy_path = ROOT / "schemas" / "court-runtime-policy.json"
    query_path = ROOT / "src" / "governor" / "court_graph_queries.py"
    before = (sha256_bytes(policy_path.read_bytes()), sha256_bytes(query_path.read_bytes()))
    left = CourtVaultContextProvider(first).compile(_request())
    right = CourtVaultContextProvider(second).compile(_request())
    after = (sha256_bytes(policy_path.read_bytes()), sha256_bytes(query_path.read_bytes()))
    assert left == right
    assert before == after
    assert str(first) not in json.dumps(left)
