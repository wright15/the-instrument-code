# BL-010 Freeze Memo — Q Transition Table (Quintessence)

**Status:** sprint artifact. No ledger entry, no evidence obligations. Labels capture
`BL-010` per `scrum/BACKLOG.md`; authoring proceeds under `docs/TIERING.md` (sprint).

## Step 0 — Extraction search

Search conducted against the named artifact classes (`qa/gov-517-canonical-derivation-report.json`,
`qa/gov-517-generative-semantics-registration.json`, `qa/gov-517-input-boundary-registration.json`,
`provenance/OBSERVATION_LEDGER.md`, `scrum/GOV-517-*.md`, the three admission-attempt
receipts, and a repo-wide grep for `16-state`, `Z12-indexed`, `Q transition`, `quintessence`).

Result NOT FOUND, consistent with attempt-1/attempt-2 receipts; authoring proceeds under
BL-010 per TIERING.md (sprint) with the closure assertion deferred to its documented
decision point. The only repo-wide hits are this debt's own statements
(`docs/specs/fivefold_constructs_engine_spec.md:102-115,290`), the attempt receipts
(`qa/specs/fivefold-constructs-001-admission-attempt-1.json:17`,
`attempt-2.json:71`), the plan docs themselves, and one authoring-toolkit disclaimer
(`seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/docs/INVARIANT_CATALOG.md:126`).
No admissible table exists.

## Step 1.5 — Canonical designation search (partition)

Verdicts (read-only search of `framework/`, `canonical/`, `docs/`, `schemas/`, `scrum/`):

- (a) **0000 as origin/ground: NOT FOUND as designation.** Canon designates C0=0000 as
  initial/seed (`framework/AGENTS.md:279`, `framework/TOPOLOGICAL_ANCHORING.md:92`), never
  "origin". Recorded as `[DEFINED]` overlay decision with the C0 mapping as background fact.
- (b) **Kernel-like exclusion: NOT FOUND; canon points opposite.** C4=1111 is a reachable
  terminus with admitted register moves both ways (`framework/AGENTS.md:283`,
  `schemas/court-runtime-policy.json:74`). Recorded as `[DEFINED]` overlay decision.
- (c) **`{11xx}` as a class: NOT FOUND.** Only the single canonical point C2=1100 is named
  (`framework/AGENTS.md:281`); 1101 is off-chain and never named.

Canonical grounding that **is** cited: bit semantics 0=External / 1=Internal
(`framework/AGENTS.md:279-283`; `framework/TOPOLOGICAL_ANCHORING.md:90-96`); elemental
mapping Fire=Mars, Air=Jupiter, Water=Venus, Earth=Saturn; Mercury-Quintessence is not a
fifth pole (`framework/AGENTS.md:257-261`); the 16-state field exists with 11 off-chain
configurations unlabeled (`framework/AGENTS.md:310`; `scrum/pre-epic-400-audit-notes.md:43`).

## Freeze decisions

### §1 Composition (4+1)

The substrate's four bits are the elemental governors (Mars/Fire b3, Jupiter/Air b2,
Venus/Water b1, Saturn/Earth b0); states enumerate their engagement configurations.
Quintessence (Mercury) is not a bit but the transition law. Luminary brackets (Sun/Moon)
are outside this substrate. [Derived from framework canon per Step 1.5.]

### §2 Stationarity (repaired)

0000 is **on-path**: the unengaged ground is the origin from which mediation begins, and it
is the origin of the traversal. 1111 lies in the **still set**: the fully-realized
configuration is the boundary at which motion rests, not a stop on the path.

*Motivation: Mercury's circuit mediates between engagements; the fully-realized configuration
is the engine at its fixed point — termination, not a stop on the path. 0000 differs: the
unengaged ground is the origin from which mediation begins.*

Overlay decision — canon points opposite for 1111 (Step 1.5 verdict b). Court runtime's
C3<->C4 register moves are a different layer; correspondence gated SPEC-001 §6(4).
The mirror-symmetric dynamics (0000 stationary instead) is a different partition and a
different Q1; the algebra does not force the frozen one.

### §3 Generator and partition

- Q1 is the fifth-stack 12-cycle: traversal states are the 4-bit encodings of
  t_k = 7k mod 12 (k=0..11) -> (0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5) -> 0000, 0111, 0010,
  1001, 0100, 1011, 0110, 0001, 1000, 0011, 1010, 0101. [Admitted math: SPEC-001 §2.1.]
- Authored object is Q1 plus the action law Q_z = Q1^z; the 12 x 16 table is generated.
- Traversal `{0000..1011}`, still set `{1100..1111}`. The word **still set** is used
  throughout; never bare "kernel" (canon collision, `framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md:1159`).
- Still-set behavior: primary = fixed points; recorded variant = 4-cycle elemental rotation
  (+1 mod 4 on the low two bits). Both invariants covered by the suite.
- Bit order pinned MSB-first, identical to SPEC-001 §1.2 and canon C1=1000
  (`framework/AGENTS.md:279`).

### §4 Future-work hypothesis (labeled)

The 4-states+1-law composition — elemental governors as substrate, Mercury as dynamics — is
recorded as the candidate semantic bridge for the SPEC-001 §6(4) correspondence investigation
(feeds BL-011 and the eventual governs semantic layer). **Hypothesis, not claim.**

### §5 Decision point (deferred)

Whether the closure assertion (INV-5) graduates to a claim event is **not taken in this
sprint**. It waits at the exit decision point below.

## Results and exit

**Suite:** `python3 -m pytest -p no:cacheprovider -q tests/test_fivefold_q_table.py`
-> **13 passed**. Command output is local execution output, not a receipt; this is a
sprint artifact.

**Completion/closure pair (the required green):**

- `Q1^4 != id` with the orbit segment `{Q1^z(0000) : z=0..4} = {0000, 0111, 0010, 1001, 0100}`
  (the five-state generative window) — **completion** at k=4.
- `Q1^12 = id` on all 16 states, with all-pairs composition `Q_a . Q_b = Q_(a+b mod 12)`
  verified over both still-set behaviors (4,608 state-level checks) — **closure** at k=12.

**Other invariants green:** Q0 = identity; traversal 12-cycle equals the fifth-stack
transcription (0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5); still-set set-invariance under both
variants (primary fixed points; recorded 4-cycle rotation); bijectivity `Q_(12-z) = Q_z^-1`;
partition disjoint and total; bit order pinned to canon (C1 = 1000 = Fire/Mars internal);
fixture replay byte-equality (`tests/fixtures/fivefold_q_table.v1.json`, 192 rows, 8,185 bytes).

**Artifacts:** `src/fivefold/quintessence.py`, `src/fivefold/__init__.py`,
`tests/test_fivefold_q_table.py`, `tests/fixtures/fivefold_q_table.v1.json`.

**INV-5 graduation decision: deferred.** The suite green is the precondition; graduation of
the closure assertion into the admitted evidence surface is a claim event per
`docs/TIERING.md` and is not opened by this sprint. The decision point is now
documented and reachable: when the maintainer chooses to graduate, the ceremony is the
SPEC-001 §4.2 refresh path (BL-052) or a standalone candidate record per the convention.
No claim event, no ledger entry, no promotion state change is created here;
`STALE_FIVEFOLD_ENGINE_PROMOTION_EVIDENCE` is recorded unchanged.

**Hypothesis carried forward (labeled):** the §4 composition remains the candidate bridge
for SPEC-001 §6(4), feeding BL-011.
