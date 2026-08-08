# Court Mathematics Governor Integration Plan

Status: Implemented in Phase 2

## Purpose

Integrate the immutable `court-mathematics` domain package into the governor
runtime without expanding the persisted `AgentState` or `ValidationToken`
schemas. Harmonic identity is represented by fingerprints, while the source
profile and rules remain separately loaded, immutable inputs.

## Ownership Boundaries

`court-mathematics` owns deterministic harmonic value objects and algorithms:

- pitch-class sets and rooted scales
- harmonic profile construction and fingerprinting
- Hamming and voice-leading distance calculations

`governor` owns runtime policy and authorization:

- admission of harmonic release fingerprints
- operation-to-rule assignment
- context manifest resolution
- move validation, token issuance, execution, and ledger persistence

The governor does not copy a `HarmonicProfile` into `AgentState.data`. It stores
only the context fingerprint derived from immutable harmonic identifiers.

## Fingerprint Flow

The runtime constructs a `HarmonicContextManifest` from four identities:

```python
manifest = HarmonicContextManifest(
    harmonic_subject_id=profile.subject_id,
    harmonic_profile_sha256=profile.fingerprint_sha256,
    harmonic_release_sha256=release_sha256,
    harmonic_rule_set_sha256=rule_set.harmonic_rule_set_sha256,
)
```

Its `context_sha256` is the canonical SHA-256 fingerprint of:

```json
{
  "schema_version": "gov-204.harmonic-context.v1",
  "harmonic_subject_id": "...",
  "harmonic_profile_sha256": "...",
  "harmonic_release_sha256": "...",
  "harmonic_rule_set_sha256": "..."
}
```

`create_agent_state()` derives `AgentState.context_sha256` from the manifest.
If a caller also supplies `context_sha256`, the two values must match. This
prevents a session from claiming a context unrelated to its harmonic inputs.

```python
state = create_agent_state(
    task_id="task:harmonic",
    phase="INSPECTED",
    policy_sha256=policy_sha256,
    capabilities=("runtime.harmonic.mutate",),
    harmonic_context_manifest=manifest,
)
```

The existing `ValidationToken.context_sha256` field then binds an authorized
move to the manifest fingerprint without changing the token schema.

## Rule Wiring

Harmonic enforcement is opt-in at the operation specification:

```python
spec = OperationSpec(
    operation_id="operation:harmonic-mutate",
    capability="runtime.harmonic.mutate",
    allowed_phases=("INSPECTED",),
    result_phase="PROPOSED",
    parameter_schema={"target_mask": "integer"},
    required_parameters=("target_mask",),
    requires_harmonic_validation=True,
)
```

The registry must receive a `HarmonicValidator` whenever any registered
operation requires harmonic validation. Construction fails closed otherwise.

```python
validator = HarmonicValidator(
    manifests=(manifest,),
    profiles=(profile,),
    rule_sets=(rule_set,),
    admitted_release_sha256s=(release_sha256,),
)

registry = OperationRegistry(
    {spec.operation_id: (spec, reducer)},
    harmonic_validator=validator,
)
```

Each `HarmonicRule` identifies the normalized parameter containing the target
pitch-class mask and sets cardinality, Hamming-distance, and voice-leading
constraints. Rules are deterministic records included in the rule-set
fingerprint.

## Validation Order

`validate_move()` enforces this order:

1. Confirm policy, context, operation, phase, and capability bindings.
2. Normalize and type-check operation parameters.
3. Resolve the manifest from `state.context_sha256`.
4. Resolve and fingerprint-check the profile and rule set.
5. Confirm the harmonic release is admitted.
6. Evaluate the normalized target against the operation's harmonic rule.
7. Construct the `ValidationToken` only after all checks pass.

No reducer or executor runs during validation. A failed harmonic check raises a
stable `TransitionError` reason code before token construction.

## Lifecycle Event Ordering

External-effect operations need a `VALIDATED` state before token issuance, but
the `move_validated` event must not be promoted before validation succeeds.
The API therefore uses a staged transition:

1. Advance the lifecycle to `VALIDATED` in memory.
2. Seal `move_validated` and its resulting ledger anchor as a staged event.
3. Call `validate_move()` against the staged state.
4. On success, promote the staged event after checking its expected result
   state.
5. On failure, discard the staged state and event and return the persisted
   pre-validation state.

This also lets the token bind the ledger head that will exist after promotion,
avoiding a stale-ledger token while preserving the required event ordering.

## Failure Semantics

Harmonic validation fails closed for all unresolved or inconsistent inputs,
including:

- missing validator, manifest, profile, rule set, or operation rule
- unadmitted release fingerprint
- profile subject or fingerprint mismatch
- rule-set fingerprint mismatch
- invalid target mask or disallowed cardinality change
- exceeded Hamming or voice-leading distance

For any rejection before token issuance:

- no validation token is returned
- no reducer or executor is invoked
- no runtime event is persisted
- the state revision and ledger anchor remain unchanged

## Court State

`CourtState` is a separate immutable runtime record rather than an extension of
`AgentState`:

```python
court = create_court_state(
    court_position_id="court-position:C2",
    harmonic_profile_sha256=profile.fingerprint_sha256,
    court_policy_sha256=court_policy_sha256,
)
```

Its fingerprint covers its schema, position identity, revision, harmonic
profile fingerprint, and court policy fingerprint. Its ledger anchor remains
parallel metadata and can be updated without changing court-state identity.

## Compatibility

Existing non-harmonic operations retain `requires_harmonic_validation=False`.
They do not require a validator and continue to accept an opaque explicit
`context_sha256`. Existing serialized `AgentState` and `ValidationToken`
documents remain readable because neither persisted schema changed.

## Verification

The Phase 2 suite verifies:

- deterministic manifest and rule-set fingerprints
- manifest-to-agent-context binding and explicit mismatch rejection
- valid harmonic token issuance and reducer application
- invalid harmonic rejection before token construction
- zero reducer calls and zero ledger delta on rejection
- fail-closed registry construction
- non-harmonic backward compatibility
- immutable, parallel `CourtState` identity
- exact pure and external lifecycle event sequences
- `validate_move()` completion before `move_validated` promotion
- rejection without a persisted validation event

Run the focused suite with:

```bash
python3 -m pytest \
  tests/test_harmonic_runtime.py \
  tests/test_gov_204_transitions.py \
  tests/test_gov_207_agent_api.py
```

Run all governor and repository regressions with:

```bash
python3 -m pytest
```

Run the standalone domain package suite with:

```bash
python3 -m pytest court-mathematics/tests
```
