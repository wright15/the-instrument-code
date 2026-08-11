"""CRT-308 Court-specific extension to GOV-208 vault context bundles."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Mapping

from .hashing import sha256_payload
from .vault_context import ObsidianVaultProvider, VaultContextError, VaultLimits


COURT_CONTEXT_BUNDLE_SCHEMA_VERSION = "crt-308.court-context-bundle.v1"
_ROOT = Path(__file__).resolve().parents[2]
_SUBSTRATE_PATH = Path(
    "seven-governors-court-substrate-v0.1.0/canonical/substrate-registry-release.json"
)
_INVARIANT_PATH = Path(
    "seven-governors-harmonic-invariants-v0.1.0/canonical/harmonic-invariant-registry.json"
)
_FILTER_PATH = Path(
    "seven-governors-court-filter-algebra-v0.1.0/canonical/filter-algebra-release.json"
)


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


class CourtVaultContextProvider:
    """Compile Court pedagogy without changing runtime or admission authority."""

    def __init__(
        self,
        vault_root: str | Path,
        *,
        authority_root: str | Path = _ROOT,
        limits: VaultLimits | None = None,
    ) -> None:
        self._authority_root = Path(authority_root).resolve(strict=True)
        self._provider = ObsidianVaultProvider(
            vault_root,
            limits=limits,
            allow_court_fields=True,
        )

    def _authority(self) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
        substrate = _read_json(self._authority_root / _SUBSTRATE_PATH)
        invariants = _read_json(self._authority_root / _INVARIANT_PATH)
        filters = _read_json(self._authority_root / _FILTER_PATH)
        return substrate, invariants, filters

    def compile(self, request: Mapping[str, Any]) -> dict[str, Any]:
        base = self._provider.compile(request)
        substrate, invariants, filters = self._authority()
        positions = {record["positionId"]: record for record in substrate["courtRootedPositions"]}
        bridges = {
            record["setClassId"].split(":", 1)[1]: record
            for record in substrate["bridgeRootings"]
        }
        set_classes = {
            record["setClassId"].split(":", 1)[1]: record
            for record in substrate["pentatonicSetClasses"]
        }
        invariant_ids = {record["invariantId"] for record in invariants["invariants"]}
        court_notes: list[dict[str, Any]] = []
        diagnostics = list(base["diagnostics"])

        for note in base["notes"]:
            metadata = note["metadata"]
            required = {
                "courtRootedPosition",
                "pentatonicSetClass",
                "kappaCourt",
                "courtFilterMask",
                "courtProvenanceRef",
            }
            missing = sorted(required - set(metadata))
            if missing:
                raise VaultContextError(f"court_frontmatter_missing_field:{missing[0]}")
            position_id = metadata["courtRootedPosition"]
            set_class = metadata["pentatonicSetClass"]
            if position_id is not None and position_id not in positions:
                raise VaultContextError("court_frontmatter_invalid_position")
            if not isinstance(set_class, str) or set_class not in set_classes:
                raise VaultContextError("court_frontmatter_invalid_set_class")
            mask = metadata["courtFilterMask"]
            if not isinstance(mask, str) or len(mask) != 12 or any(bit not in "01" for bit in mask):
                raise VaultContextError("court_frontmatter_invalid_filter_mask")

            if position_id is not None:
                authority = positions[position_id]
                expected_set = authority["setClassId"].split(":", 1)[1]
                expected_kappa = authority["kappaCourt"]["numerator"] / authority["kappaCourt"]["denominator"]
                if set_class != expected_set:
                    raise VaultContextError("court_frontmatter_position_set_class_mismatch")
                if metadata["kappaCourt"] != expected_kappa:
                    raise VaultContextError("court_frontmatter_kappa_mismatch")
                if mask != authority["pitchMask12"]:
                    raise VaultContextError("court_frontmatter_filter_mask_mismatch")
                expected_admission = "admitted"
            elif set_class in bridges:
                authority = bridges[set_class]
                if metadata["kappaCourt"] is not None:
                    raise VaultContextError("court_bridge_kappa_must_be_null")
                if mask != authority["pitchMask12"]:
                    raise VaultContextError("court_frontmatter_filter_mask_mismatch")
                expected_admission = "admitted-bridge"
            else:
                authority = set_classes[set_class]
                expected_admission = "proposed"

            provenance_ref = metadata["courtProvenanceRef"]
            if not isinstance(provenance_ref, str):
                raise VaultContextError("court_frontmatter_invalid_provenance_ref")
            if provenance_ref.startswith("crt-303:"):
                if provenance_ref.removeprefix("crt-303:") not in invariant_ids:
                    raise VaultContextError("court_invariant_pointer_dangling")
            elif not provenance_ref.startswith(("crt-302:", "crt-304:", "crt-305:")):
                raise VaultContextError("court_frontmatter_invalid_provenance_ref")

            claimed_admission = metadata["admissionStatus"]
            effective_admission = claimed_admission
            if claimed_admission in {"admitted", "admitted-bridge"} and claimed_admission != expected_admission:
                effective_admission = expected_admission
                diagnostics.append(
                    {
                        "reasonCode": "court_admission_claim_downgraded",
                        "noteId": note["noteId"],
                        "responsibleGate": "CRT-309",
                    }
                )
            court_notes.append(
                {
                    "noteId": note["noteId"],
                    "baseNoteFingerprint": note["contentSha256"],
                    "courtRootedPosition": position_id,
                    "pentatonicSetClass": set_class,
                    "kappaCourt": metadata["kappaCourt"],
                    "courtFilterMask": mask,
                    "claimedAdmissionStatus": claimed_admission,
                    "effectiveAdmissionStatus": effective_admission,
                    "courtProvenanceRef": provenance_ref,
                }
            )

        core = {
            "schemaVersion": COURT_CONTEXT_BUNDLE_SCHEMA_VERSION,
            "status": "ok" if court_notes else "empty",
            "authority": "context_evidence_only",
            "baseBundleFingerprint": base["bundleFingerprint"],
            "policyFingerprint": base["policyFingerprint"],
            "dependencyFingerprints": {
                "substrate": substrate["substrateFingerprint"],
                "invariants": invariants["invariantFingerprint"],
                "filters": filters["filterAlgebraFingerprint"],
            },
            "courtNotes": sorted(court_notes, key=lambda record: record["noteId"]),
            "diagnostics": sorted(
                diagnostics,
                key=lambda item: (item["reasonCode"], item.get("noteId", "")),
            ),
            "canonicalCourtPolicyChanged": False,
            "canonicalAdmissionChanged": False,
            "graphQueryFingerprintChanged": False,
        }
        return {**core, "bundleFingerprint": sha256_payload(core)}
