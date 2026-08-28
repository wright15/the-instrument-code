# Pentatonic-Heptatonic Graph Binding Audit Specification

**Specification ID:** `pre-epic-400.pentatonic-7-35-binding.v1`
**Status:** Phases 0-1 complete; planning evidence only
**Date:** 2026-08-16
**Execution state:** Phases 2-4 not started

## 1. Authority and effect

This is the corrected specification for a deterministic audit of the relation
between five-note pitch-class sets and Forte 7-35. It defines future evidence
artifacts and a detached graph experiment. It does not itself supply the
evidence, execute CRT-310, admit a set class, alter runtime behavior, or add an
active graph relationship.

The current admission baseline is:

- `provenance/court-admission-release.json` admits the five 5-35 Court
  positions C0-C4 and bridge classes 5-23 and 5-27;
- the other 35 pentatonic classes remain proposed behind CRT-310;
- historical `proposed_pending_crt_309` values inside the frozen CRT-302
  package are preserved candidate bytes, not the current integrated decision;
- the CRT-309 projection ruling explicitly does not claim `ComplementMap` or a
  canonical Forte-to-Court graph mapping; and
- `runtime.zodiacContext` remains prose context until separately admitted.

Consequently, Phase 2 must remain a detached audit projection. It cannot be
wired into `graph/runtime/neo4j-bootstrap.mjs`, the active CRT-306 projection,
or any runtime/API path without a separate review and admission decision.

## 2. Audit questions

The audit will answer these finite questions:

1. For every five-note pitch-class set `P`, which transpositions of 7-35
   contain `P`?
2. Is the number of such parents invariant within each pentatonic Forte TnI
   class, and what is the exact 3/2/1/0 class distribution?
3. Which canonical 7-35 `ScaleState` records contain each admitted root-0
   Court or bridge realization?
4. How do subset-parent, exact-complement, transposition, inversion, and Court
   filter-projection relations differ?
5. What do the structured zodiac sources actually assert about the two
   luminaries and five bipolar governors, and which stronger pitch-class or
   physical claims remain unresolved?

The audit must not begin by assuming that every pentatonic set has three
parents. Parent cardinality is an output.

## 3. Controlling sources

| Claim | Controlling source |
|---|---|
| Pitch-mask arithmetic and TnI operations | `court-mathematics/docs/01_COURT_LEXICON.md` and `court_mathematics.PitchClassSet` |
| Complete 38-class pentatonic registry | `seven-governors-court-substrate-v0.1.0/canonical/pentatonic-set-class-registry.json` |
| Exact complement evidence | `seven-governors-court-substrate-v0.1.0/canonical/complement-map.json` |
| Court root-0 realizations | `seven-governors-court-substrate-v0.1.0/canonical/court-rooted-positions.json` |
| Bridge root-0 realizations | `seven-governors-court-substrate-v0.1.0/canonical/bridge-rootings.json` |
| Canonical Governor modes and `ScaleState` IDs | `canonical/universal-network-data.json` |
| Governor-office projection cross-check | `neo4j/csv/governor-offices.csv` |
| Constructive/observational bit policy and zodiac source references | `schemas/governors.yaml` |
| Current bounded Court admission | `provenance/court-admission-release.json` |
| Namespace and graph boundaries | `docs/GOVERNOR_DOMAIN_AUTHORITY.md`, `docs/COURT_ADMISSION_AND_AUTHORITY.md`, and `schemas/court-admission-contract.json` |

No model response is a mathematical or admission source.

## 4. Representation contract

### 4.1 Canonical pitch mask

For `P` contained in `Z_12`, all arithmetic uses the integer pitch mask:

```text
m(P) = sum(2^p for p in P)
```

Bit `p` denotes pitch class `p`. Set inclusion is therefore:

```text
P subset H  iff  (m(P) AND m(H)) = m(P)
```

The twelve-bit universal mask is `4095`.

### 4.2 Pitch-class-ordered display string

The Court substrate's `pitchMask12` string is `b0 b1 ... b11`, where character
`bp` records pitch class `p`. It is a display of pitch-class order, not the
ordinary MSB-first textual expansion of the integer mask:

```text
pcString(m) = reverse(format(m, "012b"))
m = int(reverse(pcString), 2)
```

All Phase 1 arithmetic must use `pitchMask` integers or explicit pitch-class
arrays. A display string may be compared only after its source field and bit
orientation are named.

### 4.3 Governor source coordinates

`schemas/governors.yaml` deliberately records more than one orientation:

- `binary_12bit` is the constructive semitone-index string;
- `binary_observational` is its reverse readback;
- the source policy parses a written string as an MSB integer for the
  `decimal_constructive` / `decimal_observational` coordinates; and
- despite its legacy name, `binary_12bit_lsb` equals `T1(binary_12bit)` for
  Mercury, Venus, Mars, Jupiter, and Saturn. It is not the bitwise complement
  and must not be treated as a general LSB serialization rule.

For Mars:

| Coordinate | Value | Meaning |
|---|---:|---|
| `binary_12bit` | `101011010110` | Constructive pitch-class-ordered Mixolydian string |
| parse-as-written constructive integer | 2774 | `decimal_constructive`; not the canonical pitch mask |
| canonical pitch mask | 1717 | `{0,2,4,5,7,9,10}`; Mars/Mixolydian `ScaleState` |
| `binary_12bit_lsb` | `010101101011` | `T1` of the constructive string |
| inversion witness | `I3` | The same destination set; output equality does not identify the intended operator |
| characterwise complement | `010100101001` | Exact complement string, not the internal-pole string |
| complement canonical pitch mask | 2378 | `{1,3,6,8,11}` |
| complement parse-as-written integer | 1321 | A constructive-coordinate integer, not Court C4 identity |

Court C4 independently has canonical `pitchMask=1321`, pitch classes
`{0,3,5,8,10}`, and `pitchMask12=100101001010`. Equal integers in different
orientation namespaces do not establish equal pitch-class sets. Every audit
record must therefore carry a representation namespace.

### 4.4 Exact realization, rooted realization, and set class

- An **exact realization** is one concrete mask in `Z_12`.
- A **rooted realization** adds an explicit root and may be normalized by
  `N_r(P) = T_{-r}(P)`.
- A **Forte TnI class** is an equivalence class, not one concrete mask.
- A canonical **ScaleState** is a root-0 heptatonic topology record and cannot
  be manufactured from an unrooted class.

Only exact or rooted realizations can be endpoints of subset edges. A
`PentatonicSetClass` node must never have a `SUBSET_OF` edge to one exact
`ScaleState` merely because one representative happens to be contained in it.

## 5. Relation contract

### 5.1 Diatonic parent incidence

Let the absolute diatonic family be:

```text
D = { T_t({0,2,4,5,7,9,11}) | t in Z_12 }
parents(P) = { H in D | P subset H }
```

`parentCount(P) = |parents(P)|`. This is the relation audited by the proposed
graph binding.

### 5.2 Exact complement

```text
complement(P) = Z_12 minus P
m(complement(P)) = 4095 XOR m(P)
```

An exact complement is disjoint from `P`; a parent contains `P`. These
relations are mutually different. The existing `ComplementMap.rootedPairs`
records exact complements and normalized family pointers. They are not empty:
the frozen registry already contains five C0-C4 records and two bridge-rooting
records. These are frozen complement evidence associated with currently
admitted identities; CRT-309 did not admit `ComplementMap` itself as an active
graph relation.

A raw complement of a root-0 pentatonic set does not contain pitch class 0 and
is therefore not itself a canonical root-0 `ScaleState`. Its separately stored
normalized pointer must not be represented as an exact `COMPLEMENT_OF` edge.

### 5.3 Transposition and inversion

```text
T_n(p) = p + n mod 12
I_n(p) = n - p mod 12
```

Transposition, inversion, exact set complement (implemented as 12-bit bitwise
complement), and string reversal are distinct operator definitions, although
their outputs can coincide for a particular symmetric set. The two Mars pole
strings satisfy both `T1(P)` and `I3(P)` while failing exact complement. The
structured source derives the internal field from `binary_12bit_lsb`; output
equality alone cannot establish which mathematical operator was intended.

### 5.4 Filter projection

For a declared diagonal Court filter with mask `c`:

```text
F_c(H) = m(H) AND c
```

If `c=m(P)` and `P subset H`, then `F_c(H)=m(P)`. This does not make subset and
projection synonymous: projection also requires an identified filter and its
provenance. The active graph already represents this ternary evidence through
`CourtFilterApplication`, `FILTERS`, `USES_FILTER`, and
`YIELDS_ADMITTED_SET`. The audit must not collapse that structure into an
unqualified direct `PROJECTS_TO` edge.

### 5.5 Root-anchored mode naming

Mode names are allowed only for rooted witnesses. For a declared root `r`,
normalize both `P` and each parent `H` by `T_{-r}`, then resolve the normalized
heptatonic mask against the canonical mode registry. An unrooted absolute
pitch set receives masks and parent counts, not a Governor or mode label.

## 6. Phase 1 verified result (planning evidence)

The candidate at
`canonical/pentatonic-binding-candidates/pentatonic-7-35-parent-audit-v1.json`
and independent QA report at
`qa/pentatonic-7-35-parent-audit-validation.json` reproduce the following
values. They are deterministic planning evidence, not an admission act. Any
future rebuild mismatch is a stop condition, not permission to modify these
results silently.

### 6.1 Complete five-note universe

There are `C(12,5)=792` exact five-note sets and `12*C(7,5)=252` subset
incidences into the 12 absolute 7-35 sets.

| Parent count | Exact five-note sets |
|---:|---:|
| 0 | 612 |
| 1 | 120 |
| 2 | 48 |
| 3 | 12 |

No exact five-note set has more than three 7-35 parents — proved: span `s∈[4,10]`, parents `max(0,7−s)≤3`; checked invariant `parentCount≤3`.

### 6.2 Forte-class discriminator

| Parent count per realization | Pentatonic TnI classes |
|---:|---|
| 3 | 5-35 only |
| 2 | 5-23, 5-27 |
| 1 | 5-Z12, 5-20, 5-24, 5-25, 5-29, 5-34 |
| 0 | all remaining classes, including 5-32 |

The three-parent property is expected to characterize 5-35, not the complete
pentatonic field.

### 6.3 Court sliding-window witnesses

| Position | Mask / `pitchMask12` | Expected canonical 7-35 parents |
|---|---|---|
| C0 | 661 / `101010010100` | Sun/Lydian/2773; Moon/Ionian/2741; Mars/Mixolydian/1717 |
| C1 | 677 / `101001010100` | Moon/Ionian/2741; Mars/Mixolydian/1717; Mercury/Dorian/1709 |
| C2 | 1189 / `101001010010` | Mars/Mixolydian/1717; Mercury/Dorian/1709; Jupiter/Aeolian/1453 |
| C3 | 1193 / `100101010010` | Mercury/Dorian/1709; Jupiter/Aeolian/1453; Venus/Phrygian/1451 |
| C4 | 1321 / `100101001010` | Jupiter/Aeolian/1453; Venus/Phrygian/1451; Saturn/Locrian/1387 |

Thus the Mars-Mercury-Jupiter example belongs to C2/mask 1189. C4/mask 1321
has the Jupiter-Venus-Saturn window. Both are 5-35; neither is 5-32.

### 6.4 Bridge witnesses

| Bridge | Rooted mask | Expected canonical 7-35 parents |
|---|---:|---|
| 5-23 | 173 | Mercury/Dorian/1709; Jupiter/Aeolian/1453 |
| 5-27 | 425 | Jupiter/Aeolian/1453; Venus/Phrygian/1451 |

## 7. Phase 1 artifact contract

Phase 1 will create these root-owned, non-admitted artifacts:

- `canonical/pentatonic-binding-candidates/pentatonic-7-35-parent-audit-v1.json`
- `canonical/pentatonic-binding-candidates/negative-cases-v1.json`
- `schemas/pentatonic-binding/pentatonic-7-35-parent-audit-v1.schema.json`
- `schemas/pentatonic-binding/pentatonic-7-35-negative-cases-v1.schema.json`
- `schemas/pentatonic-binding/pentatonic-7-35-validation-report-v1.schema.json`
- `scripts/generate-pentatonic-7-35-parent-audit.py`
- `scripts/validate-pentatonic-7-35-parent-audit.py`
- `tests/test_pentatonic_7_35_parent_audit.py`
- `qa/pentatonic-7-35-parent-audit-validation.json`

The main artifact must contain:

1. schema/candidate IDs and `status=planning_evidence`;
2. exact source paths and SHA-256 bindings;
3. the bit-orientation policy above;
4. all 792 exact pitch-set records in ascending integer-mask order;
5. each record's pitch classes, TnI class, parent masks, and parent count;
6. 38 Forte-class summaries in Forte ordinal order;
7. the five Court and two bridge rooted witnesses with canonical parent
   `ScaleState` IDs;
8. separate complement evidence pointers, never encoded as parent edges;
9. relation guards and negative-case IDs; and
10. a float-free intrinsic fingerprint with no timestamp, locale, provider, or
    model field.

Required negative controls include:

- universal-three-parent claim rejected;
- 5-32 parent count is zero;
- Mars external/internal source strings satisfy `T1` and `I3`, while failing
  exact complement;
- constructive integer 1321 is not equated with Court pitch-mask 1321;
- C2, not C4, owns the Mars-Mercury-Jupiter parent window;
- class-to-exact-state subset edges rejected; and
- complement evidence rejected when supplied as subset-parent evidence.

The generator must build twice byte-identically and remain stable under
reordered source input. The validator must independently recompute, not trust,
all counts and relationships. It may not import the generator module or reuse
its parent-enumeration/classification functions. Reordered-input testing must
permute parsed collections only after recording the canonical raw-source
hashes, so the test changes enumeration order without fabricating a new source
binding.

## 8. Phase 2 detached graph contract

Phase 2 will create a non-integrated experiment under:

- `neo4j/pentatonic-binding-audit/README.md`
- `neo4j/pentatonic-binding-audit/schema.cypher`
- `neo4j/pentatonic-binding-audit/import.cypher`
- `neo4j/pentatonic-binding-audit/validation.cypher`
- `neo4j/pentatonic-binding-audit/reset.cypher`
- `neo4j/pentatonic-binding-audit/teardown.cypher`
- `tests/pentatonic_binding_audit/neo4j-live.test.mjs`
- `qa/pentatonic-binding-audit-neo4j-validation.json`

It must not alter the active CRT-306 schema, bootstrap, query catalog, or
runtime projection. All Cypher execution must occur in a newly created,
disposable Neo4j instance with a temporary data volume. The harness must reject
the normal application `NEO4J_URI`; it may connect only through a dedicated
`PENTATONIC_BINDING_AUDIT_NEO4J_URI` plus an explicit ephemeral-test guard. The
instance and volume are destroyed after validation.

The harness should own instance creation. If CI supplies the dedicated URI, it
must reject an endpoint equal to the normalized application URI, verify the
expected fresh fixture identity before import, and destroy/reset the audit
instance from a `finally` path after both success and failure.

The detached graph may project only the seven reviewed root-0 realizations
(C0-C4, 5-23, and 5-27), using an audit-scoped
`PentatonicAuditRealization` label. It may create
`SUBSET_OF_7_35` relationships from exact realizations to ID-only reads of
existing canonical `ScaleState` nodes. The full 792-set enumeration remains in
the sidecar artifact rather than becoming active graph topology.

The detached import must use `MATCH` for `ScaleState` resolution and fail when
an endpoint is absent. A test-only setup step may seed ID-only canonical
`ScaleState` fixtures into the disposable instance; the audit import itself may
not `MERGE` or set them.

Graph guards:

- no `SUBSET_OF_7_35` source may be a class-summary node;
- every relationship replays the bitwise subset test;
- C0-C4 have exactly three parent edges and each bridge has exactly two;
- no `ScaleState` property is set or removed;
- normalized labels/properties for every seeded `ScaleState` remain
  fingerprint-identical after import, validation, and reset;
- no office relationship or authority property is written;
- no direct `PROJECTS_TO` edge is introduced;
- no raw complement is equated with its normalized `ScaleState` pointer;
- no Zodiac node or relationship is introduced; and
- no audit file is included in integrated bootstrap or round-trip baselines;
- active CRT-306/bootstrap/query source hashes remain unchanged; and
- teardown removes every audit constraint/index before the disposable instance
  is destroyed.

Any later active graph integration requires a separately approved projection
scope and is not Phase 2 closure.

## 9. Phase 3 zodiac sidecar contract

Phase 3 will add a planning appendix to
`docs/verification/PENTATONIC_GRAPH_BINDING_AUDIT_REPORT.md`. The appendix may
record the authored twelve-node partition:

```text
2 monopolar luminaries + (5 bipolar governors * 2 poles) = 12 zodiac records
```

It must preserve the operational distinction that Mercury supplies the
engine/ledger pair while only Mars, Jupiter, Venus, and Saturn form the
four-pole Court register.

The appendix will list node ID, sign, Governor, pole, and source vector field.
It will also report the `T1` relation between external and internal source
strings for the five bipolar governors. Because the 7-35 realizations are
inversionally symmetric, it must also report the coincident set-theoretic
inversion witnesses without calling them the source derivation: Mercury `I1`,
Venus `I9`, Mars `I3`, Jupiter `I11`, and Saturn `I7`.

The existing sources do not assign one pitch-class integer to each zodiac
record. Equal cardinality alone is not a 12-TET isomorphism. A future
pitch-class bijection would need an explicit origin, orientation, mapping
function, and structure-preservation test. Until then it remains unresolved
and must not be drawn as a graph edge.

Likewise:

- the one-sign Sun/Moon status is an authored Governor typology, not a result
  derived from Lydian/Ionian spacing;
- all seven canonical modes belong to 7-35, so maximal-evenness does not
  uniquely prove the luminary assignment; and
- electric, magnetic, and photonic language remains authored metaphor unless
  separately supported by a declared physical model. It cannot overwrite or
  claim equivalence with `physical.C_P`.

## 10. Phase 4 closure contract

Phase 4 will add and run these package entry points:

- `build:pentatonic-binding-audit`
- `test:pentatonic-binding-audit`
- `validate:pentatonic-binding-audit`

It will emit `qa/pentatonic-binding-audit-closure.json` as the exact closure
report path. That report must be generated before the final manifest/checksum
refresh so it is included in the fixed-point validation loop.

Closure requires:

1. build-twice and reordered-input identity;
2. independent validator and negative controls passing;
3. detached Cypher syntax and invariant validation passing;
4. focused validators passing before release packaging;
5. manifest/checksum refresh, followed by full root validation against the
   refreshed state;
6. Scrum, source-authority, and QA cross-references that say
   `planning_evidence`, not `admitted`; and
7. frontier or maintainer review of admission-sensitive wording drafted by a
   worker model.

If any full validator writes a tracked artifact, Phase 4 must refresh the
manifest/checksums again and rerun full validation until a complete pass makes
no further tracked change.

No decision-ledger admission entry is created by this audit.

## 11. Stop conditions

Execution stops for review if:

- a Phase 1 count differs from Section 6;
- any source fingerprint changes during a phase;
- one realization maps to a conflicting TnI class;
- a root or bit orientation is implicit rather than recorded;
- subset, complement, or projection evidence is conflated;
- an active graph/runtime file becomes necessary;
- a zodiac-to-pitch mapping must be invented; or
- a proposed class would need promotion to satisfy an acceptance criterion.

## 12. Verbatim handoff package

Every later phase receives this block without reconstruction from model memory:

```text
SPEC_ID=pre-epic-400.pentatonic-7-35-binding.v1
SCOPE=planning_evidence_only
ARITHMETIC=integer pitchMask; bit p means pitch class p
DISPLAY=pitchMask12 is b0..b11; do not parse as ordinary MSB mask
MARS_PAIR=101011010110 ->T1/I3 010101101011; not complement
MARS_CANONICAL_MASK=1717
MARS_COMPLEMENT_MASK=2378
COURT_C4_MASK=1321; coordinate collision is not identity
PARENT_COUNTS_EXACT=0:612,1:120,2:48,3:12
PARENT_COUNTS_CLASS=3:{5-35};2:{5-23,5-27};1:{5-Z12,5-20,5-24,5-25,5-29,5-34};0:{all others}
COURT_WINDOWS=C0:Sun-Moon-Mars;C1:Moon-Mars-Mercury;C2:Mars-Mercury-Jupiter;C3:Mercury-Jupiter-Venus;C4:Jupiter-Venus-Saturn
RELATIONS=parent incidence is subset; complement,Tn,In,projection remain distinct operators (outputs may coincide)
GRAPH=detached audit only; exact realization -> ScaleState SUBSET_OF_7_35
ZODIAC=authored 12-record partition; no pitch-class isomorphism admitted
FROZEN_PACKAGES=no in-place edits
ADMISSION=no class, runtime, topology, zodiac, or physical promotion
```

Phase 1's independent output, not this handoff text, is the mathematical
evidence gate.
