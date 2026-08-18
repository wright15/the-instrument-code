# Pre-EPIC-400 Audit Notes — Seven Governors / Court Mathematics Structural Audit

Audit performed on the integrated-release head (`48df13c` Closure pass: refresh
manifest/checksums, green validation, scrum statuses, candidate admission
record). Scope: Python runtime (`src/governor/`, `court-mathematics/src/`),
YAML/JSON schemas (`schemas/`), Neo4j Cypher (`neo4j/`), Markdown specs
(`docs/`, `court-mathematics/docs/`). Out-of-scope-but-referenced: `framework/`,
`seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/` (toolkit),
`seven-governors-court-filter-algebra-v0.1.0/` (filter-algebra sibling package).

Status legend:

- **[IMPLEMENTED]** — enforced by code/schema/Cypher.
- **[PLANNED]** — specified in markdown/YAML but not enforced.
- **[MISSING]** — absent from the integrated release.

CRT-310 clarification: the distinctions below are research directions, not
automatic evidence for admitting a pentatonic set class. Off-path pole vectors,
zodiac mappings, five-bit aspect masks, filter substitution, and Mercury or
Fivefold engines remain separate namespace proposals. A class may advance only
through the seven per-class gates in
`provenance/pentatonic-set-class-admission-backlog.json`; eligibility is not
admission.

## Cross-cutting finding

The canonical "fivefold engine" framework (`framework/AGENTS.md`,
`seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/fivefold_engine.yaml`,
`schemas/governors.yaml` `fivefold_engine:` block) is **explicitly marked as
`proposed`** in `schemas/court-admission-contract.json:135-154`
(`fivefoldFieldDisposition.eligibleForPromotionAtCrt309`). The Court admission
contract `forbiddenWrites` (`court-admission-contract.json:113-124`)
**prohibits** writing `governor.office` / `ScaleState.hasGovernorSeat` /
`OCCUPIES_OFFICE`. The integrated runtime deliberately keeps Distinctions 1,
2 (zodiac half), 4, and 6 out of the writable runtime surface.

## Summary table

| # | Distinction | Python runtime | YAML / JSON schemas | Neo4j Cypher | Markdown specs | Net verdict |
|---|---|---|---|---|---|---|
| 1 | Monopolar (Sun/Moon) vs Bipolar (Mar/Jup/Ven/Sat) vs Quintessential (Mercury) separation; Sun/Moon excluded from Court | PARTIAL — flat `GOVERNORS` frozenset at `src/governor/models.py:15-17`; Sun/Moon/Mercury de facto absent from `COURT_POLE_ORDER` (`court_runtime.py:39`); no enum/Monopolar tag | **[IMPLEMENTED]** — `governors.yaml:43,199,365` `type: monopolar_luminary` vs `bipolar_engine_governor`; Mercury `archetype.element: Quintessence`; `court-runtime-policy.json:76` `poleOrder` excludes Sun/Moon/Mercury | **[MISSING]** — `GovernorOffice` has only `name`, no polarity/role (`neo4j/schema.cypher:15-17`; `import.cypher:92-98`) | PLANNED — `framework/AGENTS.md:212-219,244-246,259`; `fivefold_engine.yaml:8-20` | **[PLANNED]** in schema; only implicit-by-exclusion in Python |
| 2 | 4-bit register C0–C4 with External/Internal zodiacal mapping | **[IMPLEMENTED]** register (`court_runtime.py:37-41, 123-138`; `C0="0000"`, `C4="1111"`); **[MISSING]** zodiac names (zero matches for Aries/Scorpio/etc. in any `.py`) | **[IMPLEMENTED]** register (`court-runtime-policy.json:70-75` positions + `poleOrder`; `court-runtime-types.schema.json:21-29` enum); **[PLANNED]** zodiac only in `governors.yaml` `zodiacal_systems` directionality+`derives_from` | **[MISSING]** — no `CourtState` 4-bit property, no `Zodiac` labels in `neo4j/` (only in `seven-…-toolkit-v0.2.0/neo4j/context-projection.cypher`, out-of-scope) | **[DOCUMENTED PLANNING EVIDENCE]** `docs/verification/PENTATONIC_GRAPH_BINDING_AUDIT_REPORT.md` records the authored 12-record partition and non-equivalence guards; no sign-to-pitch assignment or implementation | **[PARTIAL]** — register IMPLEMENTED everywhere relevant; zodiac remains absent from JSON/Python/Cypher and is not admitted |
| 3 | 16-state space vs 5 canonical states; adjacency-only transitions | **[PARTIAL]** — 5-state enum + off-path rejection (`court_runtime.py:89-95, 132-133`), adjacency via `abs(index delta)==1` (`:307-325, 942-972`); **[MISSING]** 16-element table, literal Hamming/popcount on the 4-bit register; non-adjacent translocations admitted via `TopologicalTranslocationRecord` | **[PARTIAL]** — `court-runtime-types.schema.json:21-29` `vector enum ["0000","1000","1100","1110","1111"]` (other 11 excluded); `court-runtime-policy.json:77-86` enumerates 8 adjacent ordinary moves + `court:translocate` escape hatch | **[MISSING]** — no `LEGAL_TRANSITION` relationship; only invariant is `hamming=2` (`neo4j/validation.cypher:97-110, 282-297`) on heptatonic `GOVERNS`, not the Court register | **[PARTIALLY PLANNED]** — `01_COURT_LEXICON.md:256-263, 418-447`; `framework/AGENTS.md:310` "Off-chain configurations require an explicit modal-mixture or mutation rule"; explicit per-mixture labeling of all 11 = MISSING | **[PARTIAL]** — adjacency on the canonical 5-path is enforced everywhere; literal 16-state framing + per-mixture labeling MISSING |
| 4 | Governor seats / 5-bit elemental aspect variants; alt-variant inheritance | **[MISSING + forbidden]** — `_FORBIDDEN_AUTHORITY_KEYS` includes `office`, `hasgovernorseat`, `relationaloffice`, `scalestateoffice` (`court_graph_projection.py:47-66`); `ProjectionBoundaryError("projection_reserved_office")` raised (`models.py:112-121, 251-253`); `AgentState`/`CourtState` directly lack any seat/aspect-mask field | **[MISSING]** — 5-bit mask absent; office write is `forbiddenWrites` (`court-admission-contract.json:113-124`); only read-only legacy `topologyLocks` survive; `fivefoldFieldDisposition.sourceAdmission: "proposed"` (`:135-154`) | **[PARTIAL]** — `GovernorOffice` node + `OCCUPIES_OFFICE` + `hasGovernorSeat` + `SEAT_CONTACT` exist (`schema.cypher:15-17`; `import.cypher:25, 92-98, 145-164, 284-294`); `GovTypedAspect` opaque label; **[MISSING]** `ALT_GOVERNOR_OF`, `INHERITS_ASPECT`, Fire/Air/Water/Earth/Quintessence literals | **[PLANNED]** — Fire/Air/Water/Earth/Quintessence ↔ Mars/Jupiter/Venus/Saturn/Mercury in `framework/AGENTS.md:234-241`, `governors.yaml:1393-1418` `fivefold_engine:` block, `fivefold_engine.yaml:22-37`; **[PARTIALLY PLANNED]** alt-office variants (Acoustic=alt-Moon, Harmonic Minor=alt-Jupiter at `AGENTS.md:87-93,143`) but no "5-bit aspect variant" concept | **[PLANNED]** (subset) in framework/YAML — actively forbidden from writable runtime; promotion scheduled for CRT-309, currently un-actioned |
| 5 | Decoupling of 4-bit engine from 5-35 mask; `P_c = diag(c)` pluggable for 5-23/5-27 etc. | **[NOT-MEANINGFULLY-IMPLEMENTED]** — `COURT_MASKS = (661,677,1189,1193,1321)` hard-coupled to `COURT_POSITIONS` by index `i` (`court_runtime.py:38, 425-430, 496-497`); only the translocation bridge is parameterized, and only over hardcoded `("5-23", 173)`/`("5-27", 425)` (`:549-572, 590-606, 696-725`); actual `P_c` operator lives in separate `seven-governors-court-filter-algebra-v0.1.0/src/court_filter_algebra/algebra.py:24` (`class CourtFilterOperator`) | **[IMPLEMENTED]** — separate `court.poleRegister` vs `court.filter` namespaces (`court-admission-contract.json:17-25` vs `44-52`); `admissionScope` enumerates `canonicalSetClass:"5-35"`, `bridgeSetClasses:["5-23","5-27"]`, `admittedFilter:"P_c = diag(c) only"` (`:125-134`); runtime-policy `routes` admit both 5-23/5-27 (`court-runtime-policy.json:143-148`); schema `enum:["5-23","5-27"]` (`court-runtime-policy.schema.json:80`) | **[MISSING]** — no `CourtPolicy` label; no `5-35|5-23|5-27` literal anywhere in `neo4j/`; the actual `P_c = x AND c` is computed *only in Cypher internals* at `court-mathematics/validation.cypher:42-58` (`bit IN range(0,11)`) on 12-bit pitch masks | **[PLANNED]** — `01_COURT_LEXICON.md §16 Court Filter`, `MRS §3.5`, `PHASE4_VERIFICATION.md:100-130` | **[PLANNED]** pluggability is real at contract level; **[PARTIAL]** at runtime (only bridge filters can be swapped; substituting a 5-29 pentatonic mask for the canonical 5-35 path would break `court_runtime.py:38` index coupling) |
| 6 | Dual Mercury engine: Gemini = Constructive +5 mod 12; Virgo = Observational +7 mod 12; Court↔heptatonic connector | **[MISSING]** — zero matches for `Gemini|Virgo|MercuryEngine|CONSTRUCTIVE_STEP|OBSERVATIONAL_STEP` across the entire integrated release's `.py` (`rg` confirmed); the only non-adjacent mutation in `court_runtime.py:671-676` (`_canonical_translocation_values`) is a Moon-led `±1` semitone R7/L7, not `+5/+7 mod 12`; toolkit's `algebra.py:127` does `[(pitch + rotation) % 12]` generically with no Mercury tagging | **[PLANNED in YAML]** — `governors.yaml` Mercury carries BOTH `binary_12bit` (`:400`) and `binary_12bit_lsb` (`:409`); `gemini.system_name: "Operational Interface Mastery"` (`:482-489`) with `derives_from: binary_12bit` and `virgo.system_name: "Diagnostic Story-Ledger"` (`:497-508`) with `derives_from: binary_12bit_lsb`; `governors.yaml:22-23, 36-39` declares `constructive_engine.mod_12_step: 5`, `observational_engine.mod_12_step: 7`; **[MISSING from JSON]** — no `gemini`/`virgo` literal in any `*.json` Court schema | **[MISSING]** — single `GovernorOffice {name:"Mercury", canonicalMode:"Dorian"}` from `csv/governor-offices.csv`; no Gemini/Virgo split, no `step:5|step:7`, no `role:'movement'|'ledger'` anywhere in `neo4j/**` (rg confirmed zero matches) | **[PLANNED]** — `framework/AGENTS.md:221-228` (Tier 2: Gemini/Virgo explicit), `docs/MATHEMATICAL_REALIZATION_SPECIFICATION.md:269-308` §3.8 "Dual Mercury Engine" with verbatim Python dataclass exampled ONLY as spec; `01_COURT_LEXICON.md:486-516` §17 Mercury Engine (`T_5`, `T_7`, `T_7∘T_5 = id`); `MRS:754,898` flags "Mercury dual engine not in CRT-305 scope" as a risk | **[PLANNED]** in markdown + YAML only — explicitly OUT of CRT-305 scope; **[MISSING]** from Python runtime, JSON Court schemas, Neo4j schema |

## Key cross-cutting verdicts

- The **4-bit register mechanics** (Distinction 2 register half, Distinction 3
  adjacency) are the only distinctions genuinely **[IMPLEMENTED]** across all
  three code-bearing layers.
- The **monopolar/bipolar/quintessential typology** (Distinction 1) is
  **[IMPLEMENTED]** in `governors.yaml` `type:` + `archetype.element:`, only
  implicit-by-exclusion in Python.
- The **zodiacal bit→Aries/Scorpio/etc. mapping** (Distinction 2 second half)
  and the **Dual Mercury engine** (Distinction 6) exist **only in
  `framework/AGENTS.md` + `governors.yaml`**, which the Court admission
  contract deliberately demotes to `runtime.zodiacContext = "Prose context
  until separately admitted"` (`GOVERNOR_DOMAIN_AUTHORITY.md:171`) — i.e.
  **PLANNED** at framework, **MISSING** from any enforcer.
- The **5-bit aspect mask per governor office/seat** (Distinction 4) is
  **MISSING** and **architecturally forbidden** in the writable projection
  until CRT-309 promotion.
- The **`P_c = diag(c)` filter is implemented** in the sibling package
  `seven-governors-court-filter-algebra-v0.1.0`, but the integrated
  `src/governor/court_runtime.py` hard-couples the C0→C4 path to the 5-35
  masks by index — so a real 5-23/5-27 substitution is supported only for
  translocation bridges, not for the canonical Court path itself (Distinction
  5).
- `MercuryEngine` appears only as a code-sample in
  `docs/MATHEMATICAL_REALIZATION_SPECIFICATION.md:269-308` — no actual `class
  MercuryEngine` exists in `src/governor/`, `court-mathematics/src/`, or
  `seven-governors-court-filter-algebra-v0.1.0/src/` (rg confirmed).

## Next Steps

For each distinction currently below [IMPLEMENTED] in the runtime, in priority
order:

### Step 1 — Python: add the polarity typology enum (Distinction 1)

- **File:** `src/governor/models.py`
- **Action:** Replace the flat `GOVERNORS = frozenset({...})` at `:15-17` with
  a typed enum / three frozensets:
  - `MONOPOLAR = frozenset({"Sun", "Moon"})`
  - `BIPOLAR = frozenset({"Mars", "Jupiter", "Venus", "Saturn"})`
  - `QUINTESSENTIAL = frozenset({"Mercury"})`
  - `GOVERNORS = MONOPOLAR | BIPOLAR | QUINTESSENTIAL`
- **Mirror in:** `src/governor/classifier.py:344-346` `if governor not in
  GOVERNORS` — split into `if governor in MONOPOLAR: raise
  ClassifierError("court_engine_bracket_excluded")` for any path that feeds
  the Court register.
- **Mirror in Neo4j:** `neo4j/schema.cypher` add `CREATE CONSTRAINT
  governorOfficePolarity` + `SET office.polarity =
  "monopolar"|"bipolar"|"quintessential"` driven by an extended
  `csv/governor-offices.csv` (add `polarity` column — values already exist in
  `schemas/governors.yaml`).
- **Schema:** `schemas/court-runtime/court-runtime-types.schema.json` — add a
  `governor.polarity` property enum
  `["monopolar","bipolar","quintessential"]`.

### Step 2 — Python: add the External/Internal zodiacal sidecar (Distinction 2, missing half)

The Phase 3 pentatonic graph-binding appendix now documents the authored
twelve-record partition as `planning_evidence`. It does not authorize the
implementation proposal below, satisfy a CRT-310 gate, or change the current
Python/JSON/Cypher absence.

- **New file:** `src/governor/court_zodiac.py` (or
  `src/governor/court_runtime.py` near `COURT_POLE_ORDER`).
- **Action:** Define `COURT_POLE_ZODIACS: dict[str, tuple[str, str]]`
  mirroring `governors.yaml` `zodiacal_systems.directionality`:

  ```python
  COURT_POLE_ZODIACS = {
      "Mars":    ("Aries",       "Scorpio"),    # external / internal
      "Jupiter": ("Sagittarius", "Pisces"),
      "Venus":   ("Libra",       "Taurus"),
      "Saturn":  ("Aquarius",    "Capricorn"),
  }
  COURT_POLE_BIT_LABELS = {"0": "External", "1": "Internal"}
  ```

- **Wire into:** `PoleRegister.__post_init__` (`court_runtime.py:123-138`) —
  derive `external_zodiacs = tuple(z for pole, (ext, _) in zip(pole_order,
  ...) if bit == "0")` and `internal_zodiacs = ...` for evidence records
  (read-only; not used for write-typing).
- **Mirror in Neo4j:** `neo4j/court-mathematics/schema.cypher` — `MERGE
  (z:Zodiac {name, governor, polarity: "External"|"Internal"})` keyed off
  `GovernorOffice`; cross-link `(zodiac)-[:BIT_OF]->(pole:CourtState)`. The
  integrated Court package (`neo4j/court-mathematics/`) currently has no
  `Zodiac` label at all.
- **Mirror in JSON schema:** `schemas/court-runtime/court-runtime-types.schema.json`
  — add a `"poleZodiacs"` readonly property.

### Step 3 — Markdown: enumerate the 11 off-path 4-bit mixtures (Distinction 3, missing half)

- **File:** `docs/COURT_ADMISSION_AND_AUTHORITY.md` §6 "Amended admission
  scope"
- **Action:** Add a table titled "Off-path pole configurations" with one row
  per each of `0001, 0010, 0011, 0100, 0101, 0110, 0111, 1001, 1010, 1011,
  1101` and its disposition:
  - For the integrated release: `rejected as not on canonical 5-35 monotone
    cadence` (matching the runtime's `court_pole_vector_off_chain` error).
  - For the planned CRT-310 "remaining pentatonic admission", label each as
    either "future modal mixture admitted via `court.translocation` evidence"
    or "permanently rejected".
- **Code action (optional):** Add `OFF_PATH_VECTORS = frozenset(...)` to
  `court_runtime.py` (or have a single canonical `ZIP(...)` of all 16 →
  `dict[vector:str, OnPathCourtState|None]`) so the runtime's
  `court_pole_vector_off_chain` rejection list is self-documenting rather
  than implicit in `COURT_POLE_VECTORS` membership.
- **Test:** Add `tests/court/test_off_path_rejection.py` exercising each of
  the 11 rejected vectors returns `court_pole_vector_off_chain`.

### Step 4 — Promote the Fivefold Engine from `proposed` to `admitted` under CRT-309 (Distinction 4)

- **Pre-condition:** the eight `eligibleForPromotionAtCrt309` items
  enumerated in `court-admission-contract.json:140-148`
  (`fivefold_engine.pole_order`, `bit_semantics`, `canonical_states`,
  `canonical_transitions`, `geometry.kappa_formula`,
  `paired_mask_hamming_formula`, `signed_gram_matrix`,
  `canonical_path_size`, `guards`).
- **Action:** Author `scrum/CRT-309-court-admission-release-closure.md`
  acceptance against each of those 8 entries (currently this file exists but
  should be updated with the admission decision).
- **Code (after admission):** Add `src/governor/court_runtime.py`:
  - `CourtAspectMask` dataclass — 5-bit `int` (bits 4..0 = Fire / Air /
    Water / Earth / Quintessence) with a `governor:
    Literal["Mars","Jupiter","Venus","Saturn","Mercury"]` field.
  - `COURT_ASPECT_MASKS: dict[str, CourtAspectMask]` mirroring
    `governors.yaml:1393-1418` `fivefold_engine:` block.
- **Projection boundary update:** Remove `office`, `hasgovernorseat`,
  `scalestateoffice`, `relationaloffice` from `_FORBIDDEN_AUTHORITY_KEYS` in
  `src/governor/court_graph_projection.py:47-66` ONLY for read-snapshot
  paths (the runtime today bans them across all paths because no admission
  had occurred).
- **Neo4j:** Add `ALTER`-style constraint or new `CourtAspectVariant` label +
  `INHERITS_ASPECT` and `ALT_GOVERNOR_OF` relationship types in
  `neo4j/court-mathematics/schema.cypher` (the current `GovTypedAspect` label
  in `governor-runtime/schema.cypher:8-10` is opaque — promote it to a typed
  variant carrier).

### Step 5 — Decouple `COURT_MASKS` from `COURT_POSITIONS` in Python (Distinction 5, missing half)

- **File:** `src/governor/court_runtime.py:37-41, 425-430, 496-497`.
- **Action:** Replace the parallel tuples `COURT_POSITIONS` /
  `COURT_MASKS` / `COURT_POLE_VECTORS` with a single
  `CourtPosition(forte_family="5-35", index=0, pitch_mask=661,
  pole_vector="0000", internal_poles=())` frozen dataclass, parameterized by
  `forte_family`. Provide a `_canonical_court_path(forte_family: str) ->
  tuple[CourtPosition, ...]` that reads `forte_family` → `(pitch_masks,
  pole_vectors)` from a registry table sourced from `court_filter_algebra`
  package (or `court-mathematics/src/court_mathematics/`).
- **Default:** Keep `forte_family="5-35"` as the default for backwards
  compatibility. Add a `motion_only_5_35_supported_until_CRT310: bool`
  deprecation guard so loading a `5-23`/`5-27`/`5-29` Court policy raises a
  clear, surfaced-by-design deprecation error until the remaining 35
  pentatonic classes are admitted under CRT-310 (per
  `admissionScope.remainingPentatonicSetClasses: "proposed"`).
- **Test:** Extend `tests/test_court_runtime.py` with a substitution test
  that loads `5-23` Court masks and verifies that `pole_register.vector`
  still resolves to canonical adjacency vectors without resetting
  `pole_order`. Currently, substituting a 5-23 Court mask would break
  `court_runtime.py:425-430` because `pitch_mask != COURT_MASKS[index]`
  would raise `court_pitch_mask_mismatch` even if the pole register is
  well-formed.

### Step 6 — Implement the Dual Mercury Engine in Python (Distinction 6)

- **Out of scope today:** `docs/MATHEMATICAL_REALIZATION_SPECIFICATION.md:898`
  flags "Mercury dual engine not in CRT-305 scope" as a risk. Treat this as
  a CRT-310 (or post-CRT-310) deliverable.
- **Action:** Create `src/governor/court_mercury_engine.py` transferring the
  dataclass example from `MRS §3.8 (lines 269-308)` into actual Python:

  ```python
  @dataclass(frozen=True, slots=True)
  class MercuryEngine:
      CONSTRUCTIVE_STEP: ClassVar[int] = 5
      OBSERVATIONAL_STEP: ClassVar[int] = 7

      def constructive(self, pitch: int) -> int: return (pitch + 5) % 12
      def observational(self, pitch: int) -> int: return (pitch + 7) % 12
      def constructive_sequence(self, root: int = 0) -> tuple[int, ...]: ...
  ```

- **Wire into Court↔heptatonic bridge:** `src/governor/court_runtime.py:671-676`
  (`_canonical_translocation_values`) currently ties the only
  Court↔heptatonic jump to Moon's leading-tone `±1` semitone via R7/L7.
  Refactor so non-adjacent Court translocations can be generated two ways:
  (a) the existing Moon-led R7/L7 single-semitone bridge, and (b) a
  Mercury-led `T_5`/`T_7` sequence spanning the 5-position Court cadence
  (`0 → 5 → 10 → 3 → 8`) coupled to the 5-23/5-27 diagonal filter masks.
- **Neo4j:** `neo4j/court-mathematics/schema.cypher` — add `GeminiEngine` and
  `VirgoEngine` labels (or expand `GovernorOffice {name:"Mercury"}` into
  three nodes with `:MERCURY_PARENT_OF` edges), with `step: 5|7` and
  `role: "movement"|"ledger"` properties. The CSV
  `csv/governor-offices.csv` currently has a single Mercury row; either add a
  `dual_aspect` column or split into curated seed CSV.
- **Schema:** Add to
  `schemas/court-runtime/court-runtime-types.schema.json` a `mercuryEngine`
  type with `constructiveStep: const 5`, `observationalStep: const 7`.
- **Test:** Add `tests/court/test_mercury_engine.py` asserting
  `T_7 ∘ T_5 == id_mod_12` (the invariant claimed in
  `01_COURT_LEXICON.md:514`).

### Cross-cutting cleanup

- `tests/test_court_graph_projection.py:62, 599, 622` and
  `tests/verification/test_court_admission_contract.py:60-64` reference
  `"5-35"` — once Step 5 lands, replace these with a parameterized
  `pytest.mark.parametrize` over `["5-35", "5-23", "5-27"]` (with deprecation
  guard).
- `framework/AGENTS.md` and `schemas/governors.yaml` `zodiacal_systems` and
  `fivefold_engine` blocks currently act as the de-facto canonical source
  for Distinctions 1, 2 (zodiac half), 4, and 6 — promote explicit
  "Authoritative source" inline markers (e.g., a YAML
  `admission_status: admitted_CRT-309 | proposed | rejected` field) so the
  runtime can read the admission status directly instead of through the JSON
  `court-admission-contract.json` indirection.
- `docs/GOVERNOR_DOMAIN_AUTHORITY.md:264` notes "Fivefold Engine and Court
  C0–C4 | Proposed companion material | Cannot become operational state,
  topology, or Governor authority." — once Steps 1, 4, and 6 land, update
  this clause with the active CRT-309 / CRT-310 admission record.

## Suggested epic mapping

| Step | Suggested epic / ticket |
|---|---|
| 1 (polarity enum) | EPIC-004 candidate (Court micro-engine promotion) — or amend CRT-309 scope |
| 2 (zodiac sidecar) | EPIC-004 candidate — read-only, no admission needed |
| 3 (off-path enumeration) | EPIC-004 doc-only ticket, plus CRT-310 scoping note |
| 4 (fivefold admission) | CRT-309 admission gate (existing ticket, scope amendment) |
| 5 (mask decoupling) | EPIC-004 candidate — blocking for CRT-310 "remaining pentatonic admission" |
| 6 (Mercury engine) | EPIC-004 candidate — post-CRT-309, blocks heptatonic bridge refactor |

A new EPIC-004 (proposed title: "Court Fivefold Engine Promotion and Mercury
Dual-Engine Implementation") would carry Steps 1, 2, 5, and 6 plus the
code-action halves of Steps 3 and 4. Step 4 admission remains a CRT-309
amendment; Step 3 doc half can ship under CRT-309 alongside the admission
scope clarification.
