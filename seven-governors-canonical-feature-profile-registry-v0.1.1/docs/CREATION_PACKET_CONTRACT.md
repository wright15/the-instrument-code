# Deterministic Creation Packet Contract

## Input

The compiler accepts:

- one rooted `ScaleState` identifier;
- one supported domain (`landforms` in v0.1.1);
- optionally, an ordered derivation route.

The destination state is resolved before any semantic projection.

## Output

Every packet contains four layers:

1. **Identity** — rooted state, Forte family, role, tier, chirality, office
   resolution, and normal-form identifier.
2. **Coordinates** — inherited office `C_P`, unresolved `C_H`, and authored,
   non-metric office-process order `C_S`.
3. **Canonical semantics** — process, optical correspondence, directionality,
   archetypal role, and element from the resolved office profile.
4. **Creation constraints** — hard requirements, soft priors, selectable
   reference pools, promoted, suppressed, prohibited, unresolved features, and
   creative affordances for the chosen domain.

The package also emits a deterministic `renderingBrief`. That brief is suitable
as structured context for a writing, image, environment, or design system, but
it is not a substitute for the structured fields.

## Intrinsic versus route data

`intrinsicFingerprint` covers only the normalized destination packet. It
excludes:

- source state;
- operator sequence;
- edge evidence;
- route notes;
- Degree Governor annotations.

Those fields live in `routeContext`. This ensures Acoustic has one semantic
identity whether reached by `L7(Lydian)` or `R4(Mixolydian)`.

## Constraint semantics

| Field | Runtime behavior |
|---|---|
| `required` | must appear or be explicitly addressed |
| `softPriors` | guide salience or interpretation without requiring literal depiction |
| `referencePool` | select zero or more candidates; the list is not exhaustive and its members are not jointly required |
| `promoted` | increase salience according to a declared scale |
| `suppressed` | reduce salience without necessarily excluding |
| `prohibited` | reject or repair the generated asset |
| `unresolved` | preserve as an unanswered research item |
| `creativeAffordances` | free variables the renderer may vary without changing the normal form |

In v0.1.1, operator-derived promoted/suppressed/transformed effects are empty.
The compiler uses the destination office’s canonical reference projection and
states that the operator-specific delta remains unresolved.

For the landform projection, rooted state, State Governor, canonical process,
and directionality are hard requirements. Archetypal role is a soft prior.
Specific landforms are reference candidates, so a renderer may select, combine,
abstract, or omit them without violating the packet.

## Reproducibility

The same:

- package version,
- frozen source files,
- state identifier,
- domain, and
- admitted semantic registry

must produce the same intrinsic fingerprint. Rendering models may vary their
surface output, but the creation packet is deterministic.

`providerUsed` is provenance-only and is excluded from the intrinsic
fingerprint. Therefore file, snapshot, and Neo4j providers must compile the same
normal form when they expose the same release data.

## Boundary behavior

Boundary states still compile their harmonic identity. They do not receive:

- a Governor office;
- a photonic office record;
- a canonical office profile;
- a Governor-specific landform vocabulary.

The packet marks those fields unresolved and prohibits implicit office
assignment.
