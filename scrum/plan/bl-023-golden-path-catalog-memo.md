# BL-023 Sprint Memo: Golden-Path Catalog Formalization

**Status:** sprint artifact (schema contract + verdict transcription + promotion ceremony).
No ledger entry, no evidence obligations. Related: `plan/bl-021-golden-path-memo.md`,
`plan/bl-022-parallel-minor-memo.md`, `plan/bl-028-path-finder-memo.md`,
`docs/ARCHITECTURE_MAP.md` §1 Layer 2.

**Landed:**

| Artifact | Role |
|---|---|
| `schemas/harmonic-orrery-golden-path-catalog.schema.json` | Formal `golden-path.v1` catalog schema (draft 2020-12): required core, closed enums, verdict contract, additive-only versioning |
| `orrery/scripts/validate-golden-path-catalog.mjs` | Schema validation (ajv, strict) plus semantic closure: hop contiguity, endpoint match, catalog move chaining, bridge/kernel subset checks, mode-axis arithmetic, derived-path promotion checks |
| `orrery/src/golden-path-catalog.test.ts` | 4 conformance tests: both registered paths valid; every legality value inside the closed enum; a BL-028 finder-exported record validates through the same schema; verdict contract enforced (recorded needs date, pending needs recipe) |
| `orrery/test/fixtures/golden-paths.v1.json` | Catalog thesis/segmentation/promotion/versioning block; BL-021's two recorded verdicts; BL-022's three pending verdicts with recipe pointers; `bridge.legality` renamed to `legalityNote` |
| `orrery/package.json`, `package.json` | `golden-path-catalog:check` wired into `orrery:check` and `orrery:build` |

Suite 189 green (185 → 189); `tsc` clean; `orrery:check` green. No catalog/audio/palette
bytes changed; no graph embedding; G1 stays shut.

## The formal contract

A `golden-path.v1` catalog is `{schemaVersion, status, catalog?, paths[]}`. Every path
requires `pathId`, `substrate` (`golden-path` | `golden-path-parallel-minor` | `derived-path`),
`origin`, `destination`, `hops[]`; endpoints require `nodeId` + `pitchClasses` (mode fields are
optional because pentatonic and derived endpoints have no mode). Movement blocks are optional
and shape-checked: `seam`, `modeAxis`, `interiorKernels`, `bridge`, `chosen`, `alternatives`,
`triadOverlay`, plus derived-record fields (`hopCount`, `crossesBridge`, `mShortcuts`).

**Closed enums are the schema's teeth:** hop `kind` (`chord` | `bridge` | `collection` |
`derived-node`), hop `legality` (`collection-membership`, `both-collections-containment`,
`set-class-preserved`, `catalog-membership`, `containment-membership`, `demonstration`,
`null`), verdict `status` (`recorded` | `pending`), substrate values, alternative `kind`
(`reverse-chain` | `m-demonstration`). The conformance test machine-checks that every
registered legality value is inside the declared set.

**Verdict contract:** recorded verdicts require `statement` + `date`; pending verdicts require
a `recipe` pointer (actionable, not merely incomplete). Verdicts are **append-only** once
recorded — a changed ear supersedes with a new dated entry, it never rewrites the record.

**Versioning:** additive-only. v1.x bumps may add optional fields or enum members; registered
records are never migrated or rewritten.

## Catalog thesis (landed in the fixture)

> The two registered paths are the movement vocabulary's founding evidence: cross-family
> movement via admitted bridges (route-dependence, anticipation/prolongation axis) and
> same-family movement via window traversal (stepwise L/R versus the M successor, linear
> versus stepped brightness).

**Segmentation principle:** routes are selected gestaltwise (the cadence-as-gesture) and
verified hopwise (membership, containment, seam flags). BL-021's perceptual finding is now
catalog-level data, not memo prose.

## Verdict transcription

- **BL-021 (recorded):** `seam-motion-not-arrival` and `interior-one-gesture`, transcribed
  from the sprint memo with the landing date (2026-09-27) and memo source.
- **BL-022 (pending):** `mode-axis-reillumination`, `m-shortcut-compression`,
  `triad-overlay-flip` — each with a recipe pointer into the BL-022 listening recipe
  (steps 2–5). Pending entries resolve through the maintainer's ear, then become dated
  recorded entries.

## Promotion ceremony (finder → registered)

1. Run the finder on the chosen endpoints (`Derive & replay path`).
2. Audition the derived route (and its alternatives/options).
3. Record verdicts (audition basis, character notes); pending entries may be carried until
   the ear reports.
4. Add the derived record to `paths[]` (the BL-028 `derivedPathRecord` output is already
   schema-conformant).
5. Add a short memo section to the registering sprint's memo.
6. Extend the consuming tests (fixture comparisons, route regression).

**Quality floor:** machine derivation alone never promotes. A derived route enters as a
candidate; registration requires the same human layer as the founders — audition plus
recorded verdicts. The validator enforces conformance; it does not replace the judgment.

## Formalization findings (recorded, not smoothed)

1. **`bridge.legality` was prose, not an enum.** The field held "both-collections-containment
   per derived/hypergraph/…" — a sentence. Renamed `legalityNote` so the enum contract holds
   everywhere `legality` appears.
2. **Endpoint mode is optional.** BL-028's derived records carry pentatonic endpoints with no
   mode; the schema formalizes `mode`/`modeTonicPitchClass` as optional rather than inventing
   a mode for node classes that have none.
3. **The hop union is exactly the three proven record shapes** (cadence chord/bridge,
   collection walk, derived node). Rendering-only hops (triad overlay, M-jump) are not record
   hops; the M-demonstration lives in `alternatives` with `legality: "demonstration"`.
4. **No movement discriminator.** Whether cross-family vs. same-family becomes a top-level
   field or stays derivable is left to the data; two instances don't force the question. Any
   future discriminator is a v1.x additive bump.

## Forward-compatibility proof

A BL-028 finder-derived record (`derived-7-35:3-to-7-32:0`, via the registered bridge
`5-27:0`) validates through the formal schema in the conformance test. The full node
validator's derived-path checks (node identity, containment subsets, bridge-flag/legality
consistency, hop count, crossing flag) were smoke-tested with the record appended to the
catalog — validator PASS — then reverted. The catalog and the finder speak one schema by
test.

## Non-scope

No movement discriminator field, no promotion helper code, no playback/rendering changes
(rendering polish is BL-027-class), no graph embedding, no new fences, no legal-move byte
changes.
