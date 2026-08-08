"""Fingerprint-only harmonic context and parallel CRT-305 Court state."""

from __future__ import annotations

from dataclasses import dataclass, field, replace

from .hashing import sha256_payload
from .ledger import GENESIS_SHA256
from .models import LedgerAnchor, _require_identifier, _require_sha256


HARMONIC_CONTEXT_SCHEMA_VERSION = "governor.harmonic-context.v1"
COURT_STATE_SCHEMA_VERSION = "crt-305.court-state.v1"


@dataclass(frozen=True, slots=True)
class HarmonicContextManifest:
    """The exact harmonic identities transitively bound by AgentState context."""

    harmonic_subject_id: str
    harmonic_profile_sha256: str
    harmonic_release_sha256: str
    harmonic_rule_set_sha256: str
    context_sha256: str = field(init=False)

    def __post_init__(self) -> None:
        _require_identifier(self.harmonic_subject_id, "harmonic_subject_id")
        _require_sha256(self.harmonic_profile_sha256, "harmonic_profile_sha256")
        _require_sha256(self.harmonic_release_sha256, "harmonic_release_sha256")
        _require_sha256(self.harmonic_rule_set_sha256, "harmonic_rule_set_sha256")
        object.__setattr__(self, "context_sha256", sha256_payload(harmonic_context_body(self)))


def harmonic_context_body(manifest: HarmonicContextManifest) -> dict[str, str]:
    return {
        "schemaVersion": HARMONIC_CONTEXT_SCHEMA_VERSION,
        "harmonicSubjectId": manifest.harmonic_subject_id,
        "harmonicProfileSha256": manifest.harmonic_profile_sha256,
        "harmonicReleaseSha256": manifest.harmonic_release_sha256,
        "harmonicRuleSetSha256": manifest.harmonic_rule_set_sha256,
    }


def harmonic_context_record(manifest: HarmonicContextManifest) -> dict[str, str]:
    return {**harmonic_context_body(manifest), "contextSha256": manifest.context_sha256}


@dataclass(frozen=True, slots=True)
class CourtState:
    """A Court runtime state parallel to, and never embedded in, AgentState."""

    court_position_id: str
    revision: int
    harmonic_profile_sha256: str
    court_policy_sha256: str
    ledger_anchor: LedgerAnchor
    court_state_sha256: str

    def __post_init__(self) -> None:
        _require_identifier(self.court_position_id, "court_position_id")
        if type(self.revision) is not int or self.revision < 0:
            raise ValueError("court_revision_must_be_nonnegative_integer")
        _require_sha256(self.harmonic_profile_sha256, "harmonic_profile_sha256")
        _require_sha256(self.court_policy_sha256, "court_policy_sha256")
        if not isinstance(self.ledger_anchor, LedgerAnchor):
            raise TypeError("court_ledger_anchor_must_be_ledger_anchor")
        _require_sha256(self.court_state_sha256, "court_state_sha256")
        if compute_court_state_hash(self) != self.court_state_sha256:
            raise ValueError("court_state_sha256_mismatch")


def court_state_body(state: CourtState) -> dict[str, object]:
    """Return intrinsic Court state fields; ledger position is bound separately."""

    return {
        "schema_version": COURT_STATE_SCHEMA_VERSION,
        "court_position_id": state.court_position_id,
        "revision": state.revision,
        "harmonic_profile_sha256": state.harmonic_profile_sha256,
        "court_policy_sha256": state.court_policy_sha256,
    }


def compute_court_state_hash(state: CourtState) -> str:
    return sha256_payload(court_state_body(state))


def create_court_state(
    *,
    court_position_id: str,
    harmonic_profile_sha256: str,
    court_policy_sha256: str,
    revision: int = 0,
    ledger_anchor: LedgerAnchor | None = None,
) -> CourtState:
    anchor = ledger_anchor or LedgerAnchor(0, GENESIS_SHA256)
    draft = object.__new__(CourtState)
    object.__setattr__(draft, "court_position_id", court_position_id)
    object.__setattr__(draft, "revision", revision)
    object.__setattr__(draft, "harmonic_profile_sha256", harmonic_profile_sha256)
    object.__setattr__(draft, "court_policy_sha256", court_policy_sha256)
    object.__setattr__(draft, "ledger_anchor", anchor)
    object.__setattr__(draft, "court_state_sha256", GENESIS_SHA256)
    return CourtState(
        court_position_id=court_position_id,
        revision=revision,
        harmonic_profile_sha256=harmonic_profile_sha256,
        court_policy_sha256=court_policy_sha256,
        ledger_anchor=anchor,
        court_state_sha256=sha256_payload(court_state_body(draft)),
    )


def court_state_with_anchor(state: CourtState, anchor: LedgerAnchor) -> CourtState:
    if not isinstance(anchor, LedgerAnchor):
        raise TypeError("court_ledger_anchor_must_be_ledger_anchor")
    return replace(state, ledger_anchor=anchor)
