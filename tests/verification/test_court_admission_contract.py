from __future__ import annotations

import json

from ._oracles import ROOT


CONTRACT_PATH = ROOT / "schemas/court-admission-contract.json"
SCHEMA_PATH = ROOT / "schemas/court-admission-contract.schema.json"
AUTHORITY_PATH = ROOT / "docs/COURT_ADMISSION_AND_AUTHORITY.md"
LEDGER_PATH = ROOT / "provenance/DECISION_LEDGER.md"


def _contract() -> dict[str, object]:
    return json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))


def test_court_namespace_and_compression_contract_is_closed() -> None:
    contract = _contract()
    namespaces = contract["namespaceRules"]
    assert {item["namespace"] for item in namespaces} == {
        "court.compression",
        "court.filter",
        "court.fivefoldEngine",
        "court.poleDisposition",
        "court.poleRegister",
        "court.registerGovernor",
        "court.state",
        "court.transition",
        "court.translocation",
    }
    assert all(item["owner"] and item["allowedWriters"] for item in namespaces)
    coordinate = contract["compressionCoordinate"]
    assert coordinate["values"] == [
        {"numerator": 0, "denominator": 1},
        {"numerator": 1, "denominator": 4},
        {"numerator": 1, "denominator": 2},
        {"numerator": 3, "denominator": 4},
        {"numerator": 1, "denominator": 1},
    ]
    assert coordinate["forbiddenEquivalences"] == [
        "physical.C_P",
        "harmonic.C_H",
        "semantic.C_S",
        "physical.temperature",
        "physical.entropy",
        "physical.enthalpy",
        "physical.freeEnergy",
    ]
    assert coordinate["guardLiteral"] == (
        "kappa_court is not C_P, C_H, C_S, temperature, entropy, enthalpy, "
        "or free energy."
    )


def test_court_scope_supersedes_all_38_without_admitting_out_of_scope_material() -> None:
    contract = _contract()
    scope = contract["admissionScope"]
    assert scope["canonicalCourtPositions"] == ["C0", "C1", "C2", "C3", "C4"]
    assert scope["canonicalSetClass"] == "5-35"
    assert scope["bridgeSetClasses"] == ["5-23", "5-27"]
    assert "all 38" in scope["supersedes"]
    assert scope["remainingPentatonicSetClasses"] == "proposed"
    assert scope["careyEvaluationScope"] == "5-35 only"
    assert scope["admittedFilter"] == "P_c = diag(c) only"
    assert contract["courtSubsystemAdmission"] == "proposed_pending_crt_309"
    out_of_scope = {item["id"]: item for item in contract["outOfScope"]}
    assert out_of_scope["physical_phenomena.yaml"]["followOn"] == "EPIC-004"
    assert out_of_scope["thermodynamic_processes.yaml"]["followOn"] == "EPIC-004"
    assert all(item["status"] == "proposed" for item in out_of_scope.values())


def test_court_forbidden_writes_and_fivefold_field_disposition_are_explicit() -> None:
    contract = _contract()
    assert set(contract["forbiddenWrites"]) >= {
        "ScaleState.office",
        "OCCUPIES_OFFICE",
        "mutation.degreeGovernor",
        "aspect.primaryGovernor",
        "canonical.heptatonicTopology",
    }
    disposition = contract["fivefoldFieldDisposition"]
    assert disposition["sourceAdmission"] == "proposed"
    assert "fivefold_engine.canonical_states" in disposition["eligibleForPromotionAtCrt309"]
    assert "fivefold_engine.controller" in disposition["remainProposed"]
    assert "Fourier Court filters" in disposition["excludedCandidateClaims"]
    assert "thermodynamic analogies" in disposition["excludedCandidateClaims"]


def test_court_contract_sources_resolve_and_authority_records_cross_reference() -> None:
    contract = _contract()
    assert SCHEMA_PATH.is_file()
    assert AUTHORITY_PATH.is_file()
    assert all((ROOT / source).is_file() for source in contract["sourceReferences"])

    authority = AUTHORITY_PATH.read_text(encoding="utf-8")
    ledger = LEDGER_PATH.read_text(encoding="utf-8")
    for required in (
        "schemas/court-admission-contract.json",
        "schemas/court-admission-contract.schema.json",
        "docs/GOVERNOR_DOMAIN_AUTHORITY.md",
        "CRT-309",
    ):
        assert required in authority
    assert "Court admission authority contract (CRT-301)" in ledger
    assert "all 38 pentatonic set classes" in ledger
