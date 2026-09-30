# BL-022 Sprint Memo: Parallel-Minor Mode-Axis Golden Path (C Ionian ↔ C Aeolian)

**Status:** sprint artifact (route registration + findings memo). No ledger entry, no
evidence obligations. Related: `plan/bl-021-golden-path-memo.md`,
`plan/bl-021a-signature-analysis-memo.md`, `plan/bl-020-debugger-foundation-memo.md`,
`plan/harmonic-comprehension-map.md`.

**Landed:**

| Artifact | Role |
|---|---|
| `orrery/src/path-replay.ts` | `planParallelMinorModulationReplay`: four routes (forward walk, reverse walk, two M-demonstration compressions); `PARALLEL_MINOR_STATES`, `PARALLEL_MINOR_WALK_MOVES`, `PARALLEL_MINOR_M_APPLICATIONS`; new legality class `set-class-preserved`; M hops demonstration-typed (`legality: null`) with audit provenance |
| `orrery/index.html`, `orrery/src/main.ts` | "Replay parallel minor (mode axis)" trigger, four-route select, triad-overlay toggle (default on) |
| `orrery/test/fixtures/golden-paths.v1.json` | `paths[1]` = `c-parallel-minor-mode-axis` — the first multi-path instance of `golden-path.v1` |
| `orrery/src/path-replay.test.ts` | 7 new tests (route/legality, reverse, triad arc, voices, M demonstrations + compression replay, fixture match, fail-closed); orrery suite 173 green, `tsc --noEmit` clean, all `orrery:check` gates green |

No bytes changed in `legal-moves.v2.json`, the legal-move validator, `OFFICE_PALETTES`,
or the `audio.v1` guard. The Andalusian cadence and the C-minor golden path are untouched.

## The route

Origin `7-35:0` = `[0,2,4,5,7,9,11]` (C Ionian, `stateId 2741`); destination `7-35:3` =
`[0,2,3,5,7,8,10]` (C Aeolian, `stateId 1453`). Tonic pc 0 fixed throughout; every state
is Forte 7-35; the walk changes one degree per step.

| # | State | Node | stateId | Pitch classes | Move |
|---|---|---|---|---|---|
| 0 | C Ionian | `7-35:0` | 2741 | `[0,2,4,5,7,9,11]` | — |
| 1 | C Mixolydian | `7-35:5` | 1717 | `[0,2,4,5,7,9,10]` | `L7:2741:1717` (Moon 11→10) |
| 2 | C Dorian | `7-35:10` | 1709 | `[0,2,3,5,7,9,10]` | `L3:1717:1709` (Mars 4→3) |
| 3 | C Aeolian | `7-35:3` | 1453 | `[0,2,3,5,7,8,10]` | `L6:1709:1453` (Mercury 9→8) |

Reverse (selectable alternative): `R6:1453:1709`, `R3:1709:1717`, `R7:1717:2741`. All six
move ids verified present in the committed catalog (`orrery/src/generated/legal-moves.v2.json`,
60 moves) before landing; zero `M:` ids exist in the catalog, correctly — row 2's projection
owns R/L edges only and cannot project row 1's successor operator.

## Thesis 1 — structure preserved, focal point moved

The mode-axis move changes *which pitch is the focus* while the rotated 7-35 structure stays
identical. Flattening drops `{4,9,11}` to `{3,8,10}`; four tones `{0,2,5,7}` are common; the
set-class never changes and neither does the tonic. This is the property only same-family
structures have, and it is exactly what the Andalusian could not do:

| | BL-021 (Andalusian seam) | BL-022 (parallel minor) |
|---|---|---|
| What changes | The collection (7-35 → 7-32) | The focal point (Ionian → Aeolian) |
| What is preserved | The tonic | The structure (same rotated set) |
| Mechanism | Cross-family bridge (one hop) | Re-rooting via M, or stepwise L-chain |
| Common tones | 6 of 7 | 4 of 7 (three degrees lowered) |
| Legality class | `both-collections-containment` | `set-class-preserved` |
| Perceived as | A seam *crossing* | A re-*illumination* of the same object |

## Thesis 2 — mechanism contrast: stepwise decomposition vs successor operation

The same transformation admits two vocabularies, and the golden path records both. The two
audit M applications each compress an adjacent pair of walk steps into one successor
operation:

| M application | Audit source | Compresses | Lands on |
|---|---|---|---|
| `M:2741:1709` | `seven-governors-mutation-algebra-audit/audit/operator-applications.csv:291` (`modal:A0:2741:1709`, `formal_substrate_observed`) | `L7:2741:1717` + `L3:1717:1709` | 1709 (C Dorian) |
| `M:1717:1453` | `…/operator-applications.csv:165` (`modal:A0:1717:1453`, `formal_substrate_observed`) | `L3:1717:1709` + `L6:1709:1453` | 1453 (C Aeolian) |

Two compressed routes are therefore available, one per compressible pair, and both are
rendered: **compress-first** (`M:2741:1709` then `L6:1709:1453`) and **compress-second**
(`L7:2741:1717` then `M:1717:1453`). Each is a two-move route to the same destination — the
stepwise walk's three moves minus one. The tests replay each compression through the catalog
and confirm it lands on the M target.

Mechanical note (sprint arithmetic, verified in the tests): the rooted mask registry
normalizes every state to root 0. `M:2741:1709`'s target is 2741's pitch set re-rooted at
pc 2 (`{0,2,4,5,7,9,11} − 2 = {10,0,2,3,5,7,9}` → mask 1709); `M:1717:1453`'s target is
1717's set re-rooted at pc 2. M is the audit's `modal_re_rooting` successor
(`docs/R_L_OPERATOR_MATH.md:121`); the L-chain keeps the tonic and alters interior pitches.
Both roads normalize to the same rooted state — which is exactly why the shortcut exists on
paper. The replay renders the rooted-state jump; **the M hops carry `legality: null`,
`demonstration: true`, `sourceNodeId`, `applicationId`, `canonicalId`, `auditSource`, and
`compresses`**, so nothing in the trace claims the M hop was walked through the legal-move
layer.

## The triad overlay (both layers audible)

The walk is the process; the tonic triad per state is the progress. The overlay is
data-defined per mode and default-on:

| State | Triad | Third | Note |
|---|---|---|---|
| C Ionian | C major `[0,4,7]` | major | |
| C Mixolydian | C major `[0,4,7]` | major | E natural retained |
| C Dorian | C minor `[0,3,7]` | minor | **E♭ arrives — the modal flip, heard at the step that changes it** |
| C Aeolian | C minor `[0,3,7]` | minor | |

Reverse direction mirrors this: the major third (E natural) arrives at the Mixolydian step.
The overlay triads are subsets of their collections, so the engine renders the collection
hop (1.6s step) followed by a brief triad tag (0.6s hold, same pivot convention as the
BL-021 bridge). Toggling the overlay off leaves the pure darkening/brightening process.

## Listening recipe (maintainer)

1. **Enable & play sound**, open the route desk.
2. **Replay parallel minor**, route *Ionian → Aeolian (stepwise walk)*, triad overlay **on**:
   four 7-note collection states, each followed by its C major/C minor tag; the minor tag
   arrives with the Dorian step.
3. Same route, overlay **off**: the pure flattening process, one note at a time.
4. Route *Aeolian → Ionian (stepwise walk)*: brightening; the major-third tag arrives at
   Mixolydian.
5. Routes *M:2741:1709, then L6* and *L7, then M:1717:1453*: the M hop compresses two
   walk steps into one jump (two semitones at once); compare against the stepwise pass.
   The hop label announces the audit demonstration.
6. Record verdicts in this memo: (a) does the mode axis read as re-illumination of one
   structure rather than a change of object; (b) does the M jump sound like compressed
   darkening; (c) does the triad tag carry the flip.

## Fixture schema generalization (BL-023 head start)

`paths[1]` is the pioneering schema's first multi-path instance. Findings for BL-023:

- **Alternatives may differ in hop topology, not just hop content.** BL-021's alternative
  was another bridge (same shape); BL-022's are a reverse chain (3 legal steps) and two
  M-demonstration compressions (2 moves, one demonstration-typed). The fixture records
  this in `alternatives[].kind` with a `m-demonstration` entry carrying `variants`.
- **`bridge` is optional per path.** The mode-axis path crosses no collection seam; the
  entry omits `bridge` and instead carries `modeAxis` (set-class, structure-preserved
  flag, focal-point pair, flattened/sharpened pitches, common-tone count). A movement-
  kind discriminator would formalize this.
- **New per-path fields:** `chosen` (direction, moves, basis), `alternatives`,
  `triadOverlay`, `schemaNote`. `schemaVersion` stays `golden-path.v1`; the fixture
  remains static test data.

## BL-031 control reconciliation

BACKLOG v0.3 reclassified C Ionian ↔ C Aeolian as the lattice's *control* (same collection,
same phase — explicitly not a seam edge). Different layers, no conflict: the lattice control
guards the seam census against treating the mode axis as a seam, and BL-022 pins the same
negative mechanically — every hop carries `seamCrossing: false` and
`legality: "set-class-preserved"`. If BL-031's census probes the pair, it inherits a pinned
negative rather than an assumption.

## G1 preview

This path is the heptatonic prototype of BL-024's question. The pentatonic edge rule will
have to decide whether its graph admits successor-style jumps, stepwise edges, or both —
and here both vocabularies are recorded, separately typed, and mechanically related: the M
hops are the shape of a "direct" edge, the L chain the shape of a "stepwise" edge, and the
compression table is the equivalence between them. No intra-330 adjacency is implied.

## Governance

Planning evidence only. The planner asserts its declared constants (tonic membership,
one-semitone step deltas, move-identity shape, M compression targets); it derives no
artifact facts. M hops are rendered, never claimed legal. The replay is a renderer: no
canonical, Court, catalog, or audio-manifest mutation, and no objective-layer change. The
objective pattern (`lydian-to-mixolydian`) already demonstrates the scoring shape; a future
`ionian-to-aeolian` objective is a one-line addition if the game surface wants it.
