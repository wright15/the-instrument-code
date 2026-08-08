# Decision Ledger

## Governor runtime transition engine and verification lifecycle — 2026-08-01

### In-repo Python runtime delivery

GOV-204 and GOV-205 were delivered together as an in-repo Python package at
`src/governor/` (root `pytest.ini`, `src/`, and `tests/` are the only new
top-level trees; no pre-existing versioned package directory was modified).
The frozen mutation-audit v1.0.0, canonical-feature-profile-registry v0.1.1,
state-machine-toolkit v0.2.0, and governor-runtime v0.1.0 packages remain
byte-identical.

GOV-204 implements an authoritative transition engine and hash-chained ledger:
strict immutable `AgentState`/`LegalMove`/`ValidatedMove`/`ValidationToken`
contracts; pure legal-move enumeration and move application over canonical
JSON; one-use validation tokens bound to policy, context, capability, and
prior state/ledger hashes that fail closed on reuse, staleness, or expiry;
append-only event ledger with previous-event hash links, intrinsic event
identities, snapshot fingerprints, and replay that detects modify/delete/
insert/reorder at the first broken link; and external atomic state storage
under `XDG_STATE_HOME`/explicit path (never inside release artifacts) with
compare-and-swap and repository-escape rejection. Wall-clock and provider
observations stay outside intrinsic deterministic identity.

GOV-205 adds the evidence-gated lifecycle
`INSPECTED -> PROPOSED -> VALIDATED -> EXECUTED -> EVIDENCE_RECORDED ->
VERIFIED` with explicit `FAILED`, `REPLAN`, and `STOPPED`; capability-scoped
executor and verifier registries with no fallback and no raw shell/Cypher
path; six bounded objective verifiers (exit status, process identity, file
SHA-256, JSON Pointer, bounded regex, loopback-only HTTP); deterministic
evidence records and victory conditions where model prose is never accepted;
and repetition/retry-exhaustion/no-progress/deadline/recovery-dimension loop
guards. `VERIFIED` is reachable only from `EVIDENCE_RECORDED` and only when
victory evidence passes and cleanup succeeds; every attempt, verdict, and
cleanup result is preserved in the ledger and replay is side-effect-free.

The `start_site` fixture launches a fixed first-party server, probes loopback
HTTP + process evidence, records evidence, and cleans up; false-success cases
(early exit, wrong port, wrong status/body, timeout) never reach `VERIFIED`,
and repeated/unchanged attempts produce `REPLAN` or `STOPPED`.

### QA evidence

The full suite passes **86/86** at `PYTHONHASHSEED=1 TZ=UTC` (1.92s) and
`PYTHONHASHSEED=987 TZ=Pacific/Honolulu` (1.80s), with zero residual processes,
zero runtime-state files, and zero frozen-package modifications. Deterministic
replay, one-use token invalidation, byte-identical projection rebuilds, and
canonical office non-mutation are demonstrated by the executable suite.
Classification execution (GOV-203) and graph read projection (GOV-206) remain
separate work items; this decision does not admit the Court/Fivefold,
natural-phenomena, or pentatonic topology.

## Governor runtime policy contracts 0.1.0 — 2026-08-01

### Strict contracts and source-bound policy

GOV-202 creates `seven-governors-governor-runtime-v0.1.0` with policy release
`governor-runtime:0.1.0`. Six strict public schemas define `TypedAspect`,
`Quantity`, `BridgeRule`, `ClassificationRequest`, `ClassificationResult`, and
the policy release. Every object rejects unknown properties; semantic
validation additionally closes source, feature, aspect, rule, operation, and
admission references.

The policy retains all 31 profile-registry FeatureDefinitions exactly once:
15 reusable, 15 extended through strict runtime contracts, and one unresolved
(`harmonic.C_H`). The four unregistered compiler strings identified by GOV-201
are explicit runtime constraint/prohibition markers rather than aliases or new
FeatureDefinitions.

### Physical and semantic separation

Jupiter's 470 nm value is encoded as a framework-declared office anchor.
Frequency and photon energy are registered SI derivations; neither is an
empirical measurement of Jupiter or an effect of a musical state. The scoped
Rayleigh ratio `(700/470)^4 = 4.920403608350627` is physical calculation under
declared assumptions, while its Governor descriptive bridge remains proposed,
non-causal, and inactive. Atmospheric/aeolian process association is likewise
proposed and distinct from musical Aeolian mode. The exact Jupiter symbolic
profile reference is canonical only in its profile-owned scope.

### Candidate package boundary

The package is validated by the integrated root suite, but integrated release
admission remains `proposed`; `provenance/release.json` for 1.2.0 is not
retroactively changed. Classification execution belongs to GOV-203 and graph
projection to GOV-206. The mutation audit v1.0.0, profile registry v0.1.1, and
companion toolkit v0.2.0 remain unchanged. Court/Fivefold, natural phenomena,
and pentatonic topology are not admitted by this decision.

## Governor/domain authority model — 2026-08-01

### Facet exclusivity and entity composition

GOV-201 adopts facet-level exclusivity rather than entity-level exclusivity.
Every aspect admitted by a versioned Governor-runtime policy has exactly one
`primaryGovernor`; an entity may compose zero or more such aspects, including
aspects with different primary Governors, plus zero or more explicitly
non-categorical associations. Raw input may remain `ambiguous`, `unresolved`,
or `invalid`. Office order is not a fallback classifier.

State Governor/`OCCUPIES_OFFICE`, Degree Governor mutation metadata, aspect
`primaryGovernor`, non-categorical Governor association, and task-local
`operationalGovernor` are separate namespaces with separate writers. Aspect
and operational classification cannot write canonical harmonic identity.
`occupiesOffice` remains a partial topology relation: 308 seated states and 154
office-withheld boundaries. Acoustic `1749` remains Moon, Harmonic Minor `2477`
remains Jupiter while its incoming mutation's Degree Governor remains Moon,
and boundary state `223` remains office-null despite relational Jupiter
evidence.

### Claim-specific authority and frozen extensions

Authority is claim-specific: canonical topology owns state identity and office
resolution; the mutation audit owns structural operators and Degree Governor;
the profile registry owns its 31 FeatureDefinitions, admitted profiles,
semantic policy, and `DomainProjection` records; a future versioned
`governor-runtime` policy will own typed-aspect and operational mappings.
Neo4j, renderers, models, and optional vault context remain downstream
projections, presentation, evidence, or proposals only.

The 31 existing feature definitions are retained as 15 reusable, 15 requiring
strict runtime extension, and one explicitly unresolved (`harmonic.C_H`). Four
compiler constraint IDs outside that registry are recorded as compatibility
gaps, not silently aliased. The installed mutation-audit v1.0.0,
profile-registry v0.1.1, and companion-toolkit v0.2.0 directories remain frozen;
GOV-202 must extend them through a new versioned package.

The full contract is `docs/GOVERNOR_DOMAIN_AUTHORITY.md`. This decision does
not admit the Fivefold Engine/Court, natural phenomena, or any of the 38
pentatonic families; their current proposed/not-admitted status is unchanged.

## Integrated release 1.2.0 — 2026-07-31

### Release cut

Release `1.2.0` formalizes the state validated under the 1.1.0 umbrella:
bestiary milestones 3–6 shipped (Astro dashboard + 598 detail pages, pitch
dial, commutation matrix, scatterplot, topology graph, compare page, alias
routes, interactive dial, mini dials, pinned AI narratives). `package.json`,
`provenance/release.json` (releaseId `seven-governors-integrated-1.2.0`),
and the validator's release-id and manifest-version bindings were bumped;
canonical counts are unchanged. Full `npm run validate` green at 117/117 ×2;
dist + data + schema are covered by MANIFEST/CHECKSUMS.

### Machine data is the authority over framework vocabulary

Ruling recorded for the roadmap: where framework documents (e.g. AGENTS.md's
"operational Court", Forte 5–35) and machine data disagree, **machine data
wins**. The Court/pentatonic material remains candidate; admitting any
weight-5 states (scope: all 38 pentatonic set classes) is a deliberate
1.3.0+ admission project per NEXT_STEPS §5 — canonical source extension,
audit regeneration, identity modeling, validator cascade, and a new ledger
entry. It will never be a build side effect.

## Integrated release 1.1.0 — 2026-07-31

### AI narratives pinned (bestiary milestone 6)

Decision per ARCH-SPEC §2.6 (narrative contract): a **one-off offline
authoring pass** (model `deepseek-v4-flash`, reviewed) pinned 22 AI-authored
narratives for the 7 canonical profiles and 15 mutation operators. Pinned
texts are stored verbatim in `bestiary/data/pinned-narratives.json`, merged by
`build-bestiary.mjs` at build time (never regenerated by the builder), and
bound in `bestiary-data.json` by `sha256` over the exact UTF-8 text bytes with
a non-null `model` attribution. The remaining 576 summaries stay
`deterministic_template` (model/sha256 null). The new `bestiary:narrative-pins`
check enforces: 22 pinned, pin↔data closure both directions, text verbatim
from the pin, sha256 recomputed and matched, template summaries clean.

Per §8 change control, regenerating or re-pinning any AI narrative is a
deliberate, reviewed event recorded here — never a build side effect.

## Integrated release 1.1.0 — 2026-07-30

### Composite system adopted

Release `1.1.0` records the composite system now on disk as a single
integrated release. Three versioned sub-packages are declared in
`provenance/release.json`:

- `seven-governors-mutation-algebra-audit` 1.0.0 — structural mutation
  algebra, admitted as the authoritative operator registry.
- `seven-governors-canonical-feature-profile-registry` 0.1.1 — semantic
  profiles, photonic records, compiler, and creation packets, admitted.
- `seven-governors-state-machine-spec-and-authoring-toolkit` 0.2.0 —
  companion guide, candidate extensions, and safe authoring, admitted as a
  companion package only; its Fivefold and natural-phenomenon material is
  **candidate**, not active runtime.

The import order, mutation/semantic counts, and framework hashes were
refreshed to match the installed projection. The toolkit's duplicated topology
and algebra catalogs were replaced by generated catalogs derived from the
audit and registry artifacts; the audit's operator registry is the single
authoritative operator source.

### Fivefold and natural phenomena: not admitted

Decision per Recommendation B5: the Fivefold Engine, Court coordinates,
natural-phenomenon mappings, and their schemas remain **proposed**. They are
marked `admission: proposed` in the toolkit schemas and catalogs, are excluded
from readiness and creation-packet responses, and are not projected into the
active Neo4j import order. This decision is reversible through the admission
procedure described in the companion's roadmap.

### Authoring safety hardened

The companion authoring CLI now blocks every canonical source directory in the
release (root `canonical/`, both sub-package `source/` and `canonical/`
trees), including symlink-equivalent paths, and validates materialized
candidates through the real profile-registry builder/compiler pipeline in an
isolated temporary tree before reporting buildability.

### Root validation integrated

`scripts/validate-release.mjs` now validates topology facts, the mutation
audit (row counts, schema, Cypher, report), the profile registry (full
deterministic rebuild and validation), provider parity, the companion toolkit
(candidate-scoped), the API contract, the offline explorer, cross-package
fingerprints, and manifest/checksum freshness.

## Integrated release 1.0.0 — 2026-07-29

### Framework sources included

The four uploaded framework documents are preserved byte-for-byte under
`framework/`. The structured Governor registry is preserved under
`schemas/governors.yaml`. Their SHA-256 hashes are recorded in `release.json`
and verified by `scripts/validate-release.mjs`.

### Canonical authority retained

The universal network JSON remains the canonical machine snapshot. Neo4j is a
rebuildable projection rather than an independently edited authority.

### Identity separation retained

- Anchors define accepted tier seats.
- Satellites inherit one selected categorical office.
- Boundaries have no categorical office.
- Relational-office evidence records structural attraction without promotion.

### Renderer repaired

The interactive graph is a complete offline HTML document. It no longer
depends on host theme variables, utility styles, or remote runtime assets.

### Provenance added

Neo4j may now include:

- `AuditRelease`
- `FrameworkDocument`
- `InvariantDefinition`
- `INCLUDES_DOCUMENT`
- `DECLARES_INVARIANT`
- `DEFINED_BY`

These nodes explain why facts are authoritative without changing the canonical
scale-state and relationship counts.

### Change control

Any new anchor tier, office-assignment operator, or boundary promotion requires
a new release identifier, regenerated canonical data, all invariant checks,
updated source hashes, and a new decision-ledger entry.
