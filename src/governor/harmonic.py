"""Pure fail-closed harmonic rules over immutable court-mathematics profiles."""

from __future__ import annotations

from dataclasses import dataclass, field
from types import MappingProxyType
from typing import Iterable

from court_mathematics import (
    HarmonicProfile,
    PitchClassError,
    PitchClassSet,
    VoiceLeadingError,
    minimum_voice_leading,
)

from .harmonic_models import HarmonicContextManifest
from .hashing import sha256_payload
from .models import FrozenDict, _require_identifier, _require_sha256
from .runtime_models import AgentState, OperationSpec, TransitionError


HARMONIC_RULE_SET_SCHEMA_VERSION = "governor.harmonic-rules.v1"


@dataclass(frozen=True, slots=True)
class HarmonicRule:
    """Exact transition limits for one registered harmonic operation."""

    operation_id: str
    target_mask_parameter: str
    require_equal_cardinality: bool = True
    max_hamming_distance: int | None = None
    max_voice_leading_distance: int | None = None

    def __post_init__(self) -> None:
        _require_identifier(self.operation_id, "operation_id")
        _require_identifier(self.target_mask_parameter, "target_mask_parameter")
        if type(self.require_equal_cardinality) is not bool:
            raise ValueError("require_equal_cardinality_must_be_boolean")
        for name, value in (
            ("max_hamming_distance", self.max_hamming_distance),
            ("max_voice_leading_distance", self.max_voice_leading_distance),
        ):
            if value is not None and (type(value) is not int or value < 0):
                raise ValueError(f"{name}_must_be_nonnegative_integer_or_null")
        if (
            not self.require_equal_cardinality
            and self.max_voice_leading_distance is not None
        ):
            raise ValueError("voice_leading_limit_requires_equal_cardinality")

    def to_canonical_dict(self) -> dict[str, object]:
        return {
            "maxHammingDistance": self.max_hamming_distance,
            "maxVoiceLeadingDistance": self.max_voice_leading_distance,
            "operationId": self.operation_id,
            "requireEqualCardinality": self.require_equal_cardinality,
            "targetMaskParameter": self.target_mask_parameter,
        }


@dataclass(frozen=True, slots=True)
class HarmonicRuleSet:
    """A deterministic operation-indexed harmonic policy release."""

    release_id: str
    rules: tuple[HarmonicRule, ...]
    harmonic_rule_set_sha256: str = field(init=False)

    def __post_init__(self) -> None:
        _require_identifier(self.release_id, "release_id")
        if not isinstance(self.rules, tuple):
            raise TypeError("harmonic_rules_must_be_tuple")
        if any(not isinstance(rule, HarmonicRule) for rule in self.rules):
            raise TypeError("harmonic_rules_must_contain_harmonic_rule")
        ordered = tuple(sorted(self.rules, key=lambda rule: rule.operation_id))
        if len({rule.operation_id for rule in ordered}) != len(ordered):
            raise ValueError("duplicate_harmonic_operation_rule")
        object.__setattr__(self, "rules", ordered)
        object.__setattr__(
            self,
            "harmonic_rule_set_sha256",
            sha256_payload(harmonic_rule_set_body(self)),
        )

    def rule_for(self, operation_id: str) -> HarmonicRule | None:
        return next((rule for rule in self.rules if rule.operation_id == operation_id), None)


def harmonic_rule_set_body(rule_set: HarmonicRuleSet) -> dict[str, object]:
    return {
        "schemaVersion": HARMONIC_RULE_SET_SCHEMA_VERSION,
        "releaseId": rule_set.release_id,
        "rules": [rule.to_canonical_dict() for rule in rule_set.rules],
    }


class HarmonicValidator:
    """Resolve fingerprinted harmonic context and reject invalid moves purely."""

    def __init__(
        self,
        *,
        manifests: Iterable[HarmonicContextManifest],
        profiles: Iterable[HarmonicProfile],
        rule_sets: Iterable[HarmonicRuleSet],
        admitted_release_sha256s: Iterable[str],
    ) -> None:
        profile_records: dict[str, HarmonicProfile] = {}
        for profile in profiles:
            if not isinstance(profile, HarmonicProfile):
                raise TypeError("harmonic_profiles_must_contain_harmonic_profile")
            if not profile.verify_fingerprint():
                raise ValueError("harmonic_profile_fingerprint_mismatch")
            if profile.fingerprint_sha256 in profile_records:
                raise ValueError("duplicate_harmonic_profile_sha256")
            profile_records[profile.fingerprint_sha256] = profile

        rule_records: dict[str, HarmonicRuleSet] = {}
        for rule_set in rule_sets:
            if not isinstance(rule_set, HarmonicRuleSet):
                raise TypeError("harmonic_rule_sets_must_contain_harmonic_rule_set")
            if rule_set.harmonic_rule_set_sha256 in rule_records:
                raise ValueError("duplicate_harmonic_rule_set_sha256")
            rule_records[rule_set.harmonic_rule_set_sha256] = rule_set

        releases = tuple(sorted(set(admitted_release_sha256s)))
        for release_sha256 in releases:
            _require_sha256(release_sha256, "harmonic_release_sha256")

        manifest_records: dict[str, HarmonicContextManifest] = {}
        for manifest in manifests:
            if not isinstance(manifest, HarmonicContextManifest):
                raise TypeError("harmonic_manifests_must_contain_manifest")
            profile = profile_records.get(manifest.harmonic_profile_sha256)
            if profile is None:
                raise ValueError("harmonic_manifest_profile_missing")
            if profile.subject_id != manifest.harmonic_subject_id:
                raise ValueError("harmonic_manifest_subject_mismatch")
            if manifest.harmonic_rule_set_sha256 not in rule_records:
                raise ValueError("harmonic_manifest_rule_set_missing")
            if manifest.harmonic_release_sha256 not in releases:
                raise ValueError("harmonic_manifest_release_not_admitted")
            if manifest.context_sha256 in manifest_records:
                raise ValueError("duplicate_harmonic_context_sha256")
            manifest_records[manifest.context_sha256] = manifest

        self._profiles = MappingProxyType(profile_records)
        self._rule_sets = MappingProxyType(rule_records)
        self._manifests = MappingProxyType(manifest_records)
        self._admitted_releases = frozenset(releases)

    def validate(
        self,
        *,
        state: AgentState,
        operation_spec: OperationSpec,
        normalized_parameters: FrozenDict,
    ) -> None:
        manifest = self._manifests.get(state.context_sha256)
        if manifest is None:
            raise TransitionError("harmonic_context_unavailable")
        if manifest.harmonic_release_sha256 not in self._admitted_releases:
            raise TransitionError("harmonic_release_not_admitted")
        profile = self._profiles.get(manifest.harmonic_profile_sha256)
        if profile is None:
            raise TransitionError("harmonic_profile_unavailable")
        if not profile.verify_fingerprint():
            raise TransitionError("harmonic_profile_fingerprint_mismatch")
        if profile.subject_id != manifest.harmonic_subject_id:
            raise TransitionError("harmonic_subject_mismatch")
        rule_set = self._rule_sets.get(manifest.harmonic_rule_set_sha256)
        if rule_set is None:
            raise TransitionError("harmonic_rule_set_unavailable")
        rule = rule_set.rule_for(operation_spec.operation_id)
        if rule is None:
            raise TransitionError("harmonic_operation_rule_missing")

        target_value = normalized_parameters.get(rule.target_mask_parameter)
        if target_value is None:
            raise TransitionError("harmonic_target_parameter_missing")
        if type(target_value) is not int or not 0 <= target_value < (1 << 12):
            raise TransitionError("harmonic_target_mask_invalid")

        source = profile.rooted_scale.pitch_set
        try:
            target = PitchClassSet(target_value, source.tuning)
            if rule.require_equal_cardinality and target.cardinality != source.cardinality:
                raise TransitionError("harmonic_cardinality_mismatch")
            hamming_distance = source.hamming_distance(target)
            if (
                rule.max_hamming_distance is not None
                and hamming_distance > rule.max_hamming_distance
            ):
                raise TransitionError("harmonic_hamming_limit_exceeded")
            if rule.max_voice_leading_distance is not None:
                voice_leading = minimum_voice_leading(source, target)
                if voice_leading.distance > rule.max_voice_leading_distance:
                    raise TransitionError("harmonic_voice_leading_limit_exceeded")
        except TransitionError:
            raise
        except (PitchClassError, VoiceLeadingError, TypeError, ValueError) as error:
            raise TransitionError("harmonic_validation_failed") from error
