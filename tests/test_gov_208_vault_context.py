"""GOV-208 deterministic vault provider and context-free parity tests."""

from __future__ import annotations

import json
from pathlib import Path
import shutil

import pytest

from governor.classifier import classify
from governor.hashing import sha256_payload
from governor.vault_context import (
    ObsidianVaultProvider,
    VaultContextError,
    VaultLimits,
    classify_with_optional_context,
)

from conftest import classification_request, classifier_policy


POLICY = "a" * 64


def _request(*seed_ids: str, depth: int = 2) -> dict:
    return {
        "schemaVersion": "gov-208.context-request.v1",
        "requestId": "request:gov-208:test",
        "policyFingerprint": POLICY,
        "seedNoteIds": list(seed_ids),
        "maxDepth": depth,
    }


def _note(
    note_id: str,
    body: str,
    *,
    sensitivity: str = "public",
    admission: str = "admitted",
    extra: str = "",
) -> str:
    return (
        "---\n"
        f"noteId: {note_id}\n"
        f"title: {note_id}\n"
        "aspectRefs: [\"aspect:test:distribution:v1\"]\n"
        "ruleRefs: [\"rule:test:distribution:v1\"]\n"
        "governor: Jupiter\n"
        f"admissionStatus: {admission}\n"
        "source: source:test:synthetic\n"
        f"sensitivity: {sensitivity}\n"
        "maxTraversalDepth: 3\n"
        f"{extra}"
        "---\n"
        f"{body}\n"
    )


def test_context_free_classification_is_exact_direct_result():
    policy = classifier_policy()
    request = classification_request()
    direct = classify(policy, request)
    assert classify_with_optional_context(policy, request) == direct
    assert classify_with_optional_context(policy, request)["resultFingerprint"] == direct["resultFingerprint"]


def test_bundle_is_independent_of_absolute_root_and_enumeration(tmp_path):
    first = tmp_path / "first"
    second = tmp_path / "second"
    first.mkdir()
    (first / "z.md").write_text(_note("note:z", "Z links [[note:a]]."), encoding="utf-8")
    (first / "a.md").write_text(_note("note:a", "A."), encoding="utf-8")
    shutil.copytree(first, second)
    left = ObsidianVaultProvider(first).compile(_request("note:z"))
    right = ObsidianVaultProvider(second).compile(_request("note:z"))
    assert left == right
    assert [note["noteId"] for note in left["notes"]] == ["note:a", "note:z"]
    core = {key: value for key, value in left.items() if key != "bundleFingerprint"}
    assert left["bundleFingerprint"] == sha256_payload(core)
    assert str(first) not in json.dumps(left)
    assert str(second) not in json.dumps(right)


def test_context_refinement_preserves_base_and_cannot_promote(tmp_path):
    vault = tmp_path / "vault"
    vault.mkdir()
    (vault / "candidate.md").write_text(
        _note("note:candidate", "Candidate context.", admission="proposed"),
        encoding="utf-8",
    )
    policy = classifier_policy()
    request = classification_request()
    result = classify_with_optional_context(
        policy,
        request,
        provider=ObsidianVaultProvider(vault),
        context_request=_request("note:candidate"),
    )
    assert result["baseClassification"] == classify(policy, request)
    assert result["contextualRefinement"]["canonicalClassificationChanged"] is False
    assert result["contextualRefinement"]["evidenceCandidates"][0]["disposition"] == "candidate_only"


def test_sensitive_notes_and_hidden_paths_do_not_leak(tmp_path):
    vault = tmp_path / "vault"
    vault.mkdir()
    (vault / "public.md").write_text(_note("note:public", "Public."), encoding="utf-8")
    (vault / "private-name.md").write_text(
        _note("note:private", "secret marker", sensitivity="private"), encoding="utf-8"
    )
    hidden = vault / ".obsidian"
    hidden.mkdir()
    (hidden / "config.md").write_text("private config", encoding="utf-8")
    bundle = ObsidianVaultProvider(vault).compile(_request())
    serialized = json.dumps(bundle)
    assert "secret marker" not in serialized
    assert "note:private" not in serialized
    assert "private-name" not in serialized
    assert bundle["notes"][0]["noteId"] == "note:public"
    assert {item["reasonCode"] for item in bundle["exclusions"]} == {
        "hidden_path_excluded",
        "sensitive_note_excluded",
    }


def test_broken_link_is_explicit_and_deterministic(tmp_path):
    vault = tmp_path / "vault"
    vault.mkdir()
    (vault / "a.md").write_text(_note("note:a", "See [[missing]]."), encoding="utf-8")
    bundle = ObsidianVaultProvider(vault).compile(_request("note:a"))
    assert bundle["notes"][0]["links"] == [
        {"target": "missing", "status": "broken", "targetNoteId": None}
    ]
    assert bundle["diagnostics"] == [
        {"reasonCode": "broken_link", "noteId": "note:a", "target": "missing"}
    ]


def test_symlink_escape_is_rejected(tmp_path):
    vault = tmp_path / "vault"
    outside = tmp_path / "outside.md"
    vault.mkdir()
    outside.write_text(_note("note:outside", "Outside."), encoding="utf-8")
    (vault / "escape.md").symlink_to(outside)
    with pytest.raises(VaultContextError, match="vault_symlink_rejected"):
        ObsidianVaultProvider(vault).compile(_request())


@pytest.mark.parametrize(
    "payload,reason",
    [
        ("No frontmatter", "frontmatter_required"),
        ("---\nnoteId: note:a\n---\nBody", "frontmatter_missing_field"),
        (_note("note:a", "Body", extra="unknownField: value\n"), "frontmatter_unknown_field"),
    ],
)
def test_malformed_frontmatter_fails_closed(tmp_path, payload, reason):
    vault = tmp_path / "vault"
    vault.mkdir()
    (vault / "bad.md").write_text(payload, encoding="utf-8")
    with pytest.raises(VaultContextError, match=reason):
        ObsidianVaultProvider(vault).compile(_request())


def test_file_and_byte_limits_are_enforced(tmp_path):
    vault = tmp_path / "vault"
    vault.mkdir()
    (vault / "a.md").write_text(_note("note:a", "long body"), encoding="utf-8")
    with pytest.raises(VaultContextError, match="vault_note_too_large"):
        ObsidianVaultProvider(vault, limits=VaultLimits(max_note_bytes=10)).compile(_request())


def test_request_rejects_unknown_fields(tmp_path):
    vault = tmp_path / "vault"
    vault.mkdir()
    request = {**_request(), "vaultPath": str(vault)}
    with pytest.raises(VaultContextError, match="context_request_unknown_field:vaultPath"):
        ObsidianVaultProvider(vault).compile(request)
