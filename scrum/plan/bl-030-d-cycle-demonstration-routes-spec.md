# BL-030 Spec: D-Tier M-Cycle Demonstration Routes (Boundary-Layer Catalog Section)

**Status:** pre-build spec (sprint artifact). No ledger entry, no evidence obligations.
Related: `plan/bl-029-d-tier-operator-probe-memo.md`,
`plan/bl-023-golden-path-catalog-memo.md`, `docs/ARCHITECTURE_MAP.md` §1 Layer 1 / §4.

**Authority:** the seven routes are structural exhibits derived from admitted mathematics
(GOV-227 anchors, mutation-algebra audit applications) and the BL-029 probe. They are not
musical routes; no audition verdict applies.

## 1. Purpose

The golden-path catalog currently has zero boundary-layer content. BL-029 established that the
49 D1–D7 anchors are M-closed (seven tier-cycles) and fixed-degree-isolated (zero anchor-to-anchor
R/L applications), with the discriminant checks passing over the complete D–D relation set. This
spec records that structure in the catalog as seven demonstration-typed exhibit routes, one per
tier-cycle, grouped by the `d-cycle:` pathId prefix and the catalog segmentation note.

## 2. Four additive schema decisions (v1.1 bump)

The schema (`schemas/harmonic-orrery-golden-path-catalog.schema.json`) is additive-only
(`golden-path.v1`, catalog `versioning` note). This is the first additive bump, recorded as
**v1.1** in the catalog `versioning` string. Four decisions, each avoiding a dishonest shape:

1. **Hop representation.** The hop union has no demonstration hop kind. Each cycle is authored as
   `derived-node` hops (`arrivedBy: "operator"`, `moveId: null`, `legality: null`,
   `mShortcut: "<M application id>"`) with an origin hop at index 0 and a closing hop returning
   to the origin (destination == origin). The validator gains a `boundary-demonstration` branch
   because the existing `derived-path` operator-arrival rule demands `catalog-membership` + a
   `moveId` and must not be stretched.
2. **No synthetic `compresses`.** `demonstrationMove` requires `compresses[2+]`, which exists only
   when an M edge compresses a catalog pair. A pure cycle edge compresses nothing. New def
   `cycleDemonstrationMove`: same provenance fields, `cycleEdge: true`, no `compresses`.
   Existing `demonstrationMove` semantics stay untouched.
3. **Substrate and verdict values.** `substrate` enum gains `"boundary-demonstration"`.
   Verdicts: neither `recorded` (needs a dated statement) nor `pending` (needs a recipe and
   promises future listening) fits a structural exhibit. New additive def `exhibitVerdict`
   (`status: "exhibit"`, statement + source, no date/recipe).
4. **Catalog notes.** The thesis string names "the two registered paths" and remains true as
   stated — **byte-identical**. The boundary-layer section is described in `segmentation`; the
   v1.1 bump is recorded in `versioning`.

## 3. Entry shape (per tier, seven entries)

| Field | Value |
|---|---|
| `pathId` | `d-cycle:{tier}` (D1–D7) |
| `substrate` | `boundary-demonstration` |
| `origin` / `destination` | same nodeId + pitchClasses (closed cycle); nodeId from the bipartite heptatonic id for the anchor mask |
| `hops` | 8 entries: index 0 origin (`arrivedBy: "origin"`), indexes 1–7 the M-successor edges in audit order; each edge hop `arrivedBy: "operator"`, `moveId: null`, `legality: null`, `mShortcut: "M:{src}:{tgt}"` |
| `alternatives` | one `cycle-demonstration` with one variant (`variantId: "m-successor-cycle"`) whose seven `cycleDemonstrationMove` entries mirror the edge hops |
| `verdicts` | one `exhibit` verdict: discriminant-preservation statement + source citation |
| `schemaNote` | boundary-layer exhibit note (not a musical route; no listening verdict applies) |

Provenance conventions: `applicationId` = `M:{src}:{tgt}` (stable key);
`canonicalId` = `modal:{tier}:{src}:{tgt}`; `auditSource` =
`seven-governors-mutation-algebra-audit/audit/operator-applications.csv:{line}` (line retained as
locator; the applicationId is the stable identity).

**Traversal-options precision.** One entry per tier covers both traversal directions as options:
the recorded hop order is the canon M-successor order (directed), and the reverse walk is the
same edges in opposite order, still demonstration-typed. The entry does **not** claim the cycle is
symmetric under traversal.

**Alternatives-emptiness note.** The `cycle-demonstration` basis records why no other alternative
exists: the cycle is the only traversal structure (BL-029); M is row-2-excluded and audit-real.
No `reverse-chain` is authored — there are no catalog moves to chain.

## 4. Basis-field template (verdict statement)

> "(a) demonstration-typed: M is row-2-excluded and audit-real (audit applications cited per
> hop); (b) discriminant preservation verified per the BL-029 probe: tier-preserving,
> family-preserving, twin-separated, Z-partner-separated, rooted-Q preserved over the complete
> D–D relation set; (c) traversal limitation: D-tier is M-closed and fixed-degree-isolated —
> reachable only by M-jump; (d) no listening verdict: boundary demonstration routes are
> structural exhibits."

Per-tier statements cite the tier's own cycle (family, cycle length) rather than a composite
assertion.

## 5. Validator additions (`orrery/scripts/validate-golden-path-catalog.mjs`)

New branch for `substrate === "boundary-demonstration"`:

1. `hops.length === 8`; hop indexes contiguous (generic check already applies); origin nodeId ==
   destination nodeId; origin pitchClasses == destination pitchClasses.
2. Every hop resolves to a bipartite heptatonic node; `nodeKind === "heptatonic"`; pitchClasses
   match the source mask.
3. Hop 0: `arrivedBy === "origin"`, `moveId === null`, `legality === null`, `mShortcut === null`.
4. Hops 1–7: `arrivedBy === "operator"`, `moveId === null`, `legality === null`, `mShortcut`
   resolves to an M application in the audit CSV whose source/target masks chain the previous →
   current hop, and whose `auditSource` line matches the CSV row.
5. Cycle closure: seven distinct edge hops, hop 7 node == hop 0 node; the hop mask sequence
   equals the BL-029 probe's `modalClosure.dToD.cycles` sequence for the tier.
6. The `cycle-demonstration` alternative's variant moves equal the hop `mShortcut` sequence.
7. At least one `exhibit` verdict per entry; its statement mentions the discriminant check and
   its source cites the BL-029 memo.
8. Generic schema conformance and the existing founder checks are unchanged.

## 6. Test plan (`orrery/src/golden-path-catalog.test.ts`)

- Schema conformance for all nine entries (two founders + seven exhibits); every registered
  legality value stays inside the closed set (unchanged).
- Seven `d-cycle:D1`–`d-cycle:D7` entries: substrate value, 8 hops, closed origin == destination,
  seven `cycleDemonstrationMove` entries, `exhibit` verdict, discriminant citation.
- Founder additive-contract pin: the founders' serialized payload hash is unchanged.
- Validator PASS remains the `orrery:check` gate.

## 7. Cycle data (authoring table)

M-successor order per tier (start = lowest anchor mask; closing edge returns to start):

| Tier | Family | Mask order |
|---|---|---|
| D1 | 7-22 | 871 → 2483 → 3289 → 923 → 2509 → 1651 → 2873 → 871 |
| D2 | 7-15 | 471 → 2283 → 3189 → 1821 → 1479 → 2787 → 3441 → 471 |
| D3 | 7-Z37 | 443 → 2269 → 1591 → 2843 → 3469 → 1891 → 2993 → 443 |
| D4 | 7-Z17 | 631 → 2363 → 3229 → 1831 → 2963 → 3529 → 953 → 631 |
| D5 | 7-Z12 | 671 → 2383 → 3239 → 3667 → 3881 → 997 → 1273 → 671 |
| D6 | 7-8 | 381 → 1119 → 2607 → 3351 → 3723 → 3909 → 2001 → 381 |
| D7 | 7-1 | 127 → 2111 → 3103 → 3599 → 3847 → 3971 → 4033 → 127 |

## 8. Non-scope

No M-walkability promotion (row-2 extension) — recorded as a deferred claim event in the BL-030
backlog capture, trigger: BL-032 admission if phase work makes boundary traversal central. No
legal-move byte changes, no audio changes, no graph embedding, no new fences, no listening
verdicts, no playback for boundary collections (C-substrate question remains open, flagged only).

## 9. Build record

Landed same commit as this spec. Schema additive bump **v1.1** (catalog `versioning` string):
`boundary-demonstration` substrate value, `cycleDemonstrationMove` / `cycleDemonstrationVariant` /
`cycleDemonstration`, `exhibitVerdict`; the `golden-path.v1` schemaVersion const is unchanged.

Fixture `orrery/test/fixtures/golden-paths.v1.json`: nine paths (two founders + seven exhibits);
founders byte-identical (payload hash pinned in the test); each exhibit eight hops (origin +
seven M edges), closed origin == destination, one `cycle-demonstration` alternative with seven
audit-cited moves, one exhibit verdict citing the discriminant check and the BL-029 memo.

Validator `orrery/scripts/validate-golden-path-catalog.mjs`: boundary-demonstration branch
(node identity vs. bipartite source, M chaining, audit-line resolution, BL-029 probe-cycle match,
cycle closure, alternative/hop agreement, exhibit-verdict citation). Fail-closed verified by
mutation test (a corrupted hop is rejected). Conformance: `golden-path-catalog:check` PASS at
pathCount 9 with one exhibit verdict per `d-cycle`; `orrery:check` and `orrery:build` green.
