from __future__ import annotations

import json

import pytest

from harmonic_invariants import CareyScopeError, evaluate_carey_535
from harmonic_invariants.builder import build_release

from ._oracles import ROOT


RELEASE_PATH = (
    ROOT
    / "seven-governors-harmonic-invariants-v0.1.0/canonical/harmonic-invariant-registry.json"
)


def test_invariant_registry_matches_production_builder_and_substrate_fingerprint() -> None:
    release = json.loads(RELEASE_PATH.read_text(encoding="utf-8"))
    substrate = json.loads(
        (
            ROOT
            / "seven-governors-court-substrate-v0.1.0/canonical/substrate-registry-release.json"
        ).read_text(encoding="utf-8")
    )
    assert release == build_release()
    assert release["substrateDependency"]["substrateFingerprint"] == substrate[
        "substrateFingerprint"
    ]
    assert release["summary"] == {
        "invariantCount": 8,
        "provenCount": 7,
        "unresolvedGuardCount": 1,
        "careyDifferenceWitnessCount": 20,
        "careyFailureWitnessCount": 0,
    }


def test_every_invariant_has_closed_provenance() -> None:
    release = json.loads(RELEASE_PATH.read_text(encoding="utf-8"))
    for invariant in release["invariants"]:
        assert invariant["provenance"]
        for provenance in invariant["provenance"]:
            if provenance["sourceType"] == "external_doi":
                assert provenance["doi"] == "10.1080/17459730701376743"
            else:
                assert (ROOT / provenance["path"]).is_file()
                assert len(provenance["sha256"]) == 64


def test_C_H_remains_unresolved_and_distinct() -> None:
    release = json.loads(RELEASE_PATH.read_text(encoding="utf-8"))
    guard = release["compressionGuard"]
    assert (guard["namespace"], guard["status"], guard["value"]) == (
        "harmonic.C_H",
        "unresolved",
        None,
    )
    assert set(guard["forbiddenEquivalences"]) == {
        "physical.C_P",
        "semantic.C_S",
        "court.kappa_court",
        "physical.temperature",
        "physical.entropy",
        "physical.enthalpy",
        "physical.freeEnergy",
    }


def test_noncanonical_carey_input_fails_closed() -> None:
    with pytest.raises(CareyScopeError, match="carey_scope_requires_forte_5_35"):
        evaluate_carey_535((0, 2, 3, 5, 7))
