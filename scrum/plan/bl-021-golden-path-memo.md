# BL-021 Sprint Memo: Golden-Path Registration (C-Minor Parallel Seam)

**Status:** sprint artifact (route registration + findings memo). No ledger entry, no
evidence obligations. Related: `plan/bl-021-hypergraph-memo.md`,
`plan/bl-021a-signature-analysis-memo.md`, `plan/bipartite-inclusion-spec-v1.4.md`,
`plan/bl-020-debugger-foundation-memo.md`.

**Landed:**

| Artifact | Role |
|---|---|
| `orrery/src/path-replay.ts` | `planGoldenPathCadenceReplay`: C-minor substrate, bridge hop with the new both-collections legality class, both bridge candidates as data |
| `orrery/src/audio.ts` | `ReplayVoice.holdSeconds`: per-hop hold; the bridge pivot holds 0.6s against the 1.6s chord step |
| `orrery/index.html`, `orrery/src/main.ts` | "Replay golden path (C minor)" trigger + bridge-voicing selector (both candidates auditionable) |
| `orrery/test/fixtures/golden-paths.v1.json` | First instance of the `golden-path.v1` fixture schema (BL-023 generalizes) |
| `orrery/src/path-replay.test.ts`, `orrery/src/audio.test.ts` | 4 planner tests + 1 engine hold test; orrery suite 166 green; `tsc --noEmit` clean |

The pre-existing A-minor Andalusian substrate is untouched and still plays. No bytes
changed in `legal-moves.v2.json`, the legal-move validator, `OFFICE_PALETTES`, or the
`audio.v1` guard.

## The registered route

Origin `7-35:3` = `[0,2,3,5,7,8,10]` — the E-flat major collection sounding on C
(C Aeolian, tonic pc 0 as mode context). Destination `7-32:0` =
`[0,2,3,5,7,8,11]` (C harmonic minor). The seam is the raised seventh: 10 -> 11, one
semitone, six common tones.

| # | Hop | Kind | Node | Pitch classes | Legality |
|---|---|---|---|---|---|
| 0 | Cm (aeolian) | chord | `7-35:3` | `[0,3,7]` | collection membership |
| 1 | Bb (aeolian) | chord | `7-35:3` | `[10,2,5]` | collection membership |
| 2 | Ab (aeolian) | chord | `7-35:3` | `[8,0,3]` | collection membership |
| 3 | bridge `5-27:0` | bridge | `5-27:0` | `[0,3,5,7,8]` | **both-collections containment** |
| 4 | G (harmonic-minor) | chord | `7-32:0` | `[7,11,2]` | collection membership |

Hop 3 is the first replay hop in the project whose legality asserts containment in
*two* collections at once. Hops 3 and 4 carry the reserved seam emphasis; the bridge
holds 0.6s (brief pivot) against the 1.6s chord step.

## Verified lookups (`derived/hypergraph/bipartite-inclusion-v1.json`)

Both directions agree (pentatonic `parentsRooted` and heptatonic `subnodes`):

- `7-35:3 ∩ 7-32:0` shares exactly **five** anchored pentatonic voicings:
  `5-20:0B` `{0,2,3,7,8}`, `5-23:0` `{0,2,3,5,7}`, `5-25:0` `{0,2,3,5,8}`,
  `5-27:0` `{0,3,5,7,8}`, `5-29:0B` `{0,2,5,7,8}` — all `isBridge` by the census
  definition. Two are admitted vocabulary: `5-23:0`, `5-27:0`.
- `7-35:3` contains court positions C2, C3, C4 only (rooted kernels `5-35:10`
  `{0,2,5,7,10}`, `5-35:3` `{0,3,5,7,10}`, `5-35:8` `{0,3,5,8,10}`;
  `cornerstoneCountRooted = 3`). This is the interior traversal.
- `7-32:0` contains zero court positions; every `7-32` node does.

## Root-dependence finding (headline)

Seam vocabulary is anchor-sensitive, and the three candidate framings differ:

| Pair | Shared anchored voicings | Admitted among them |
|---|---|---|
| `7-35:0` -> `7-32:9` (A-route, previous) | 5: `5-20:9B`, `5-23:9`, `5-25:9`, `5-27:9`, `5-Z12:11` | `5-23:9`, `5-27:9` |
| `7-35:3` -> `7-32:0` (this route) | 5: `5-20:0B`, `5-23:0`, `5-25:0`, `5-27:0`, `5-29:0B` | `5-23:0`, `5-27:0` |
| `7-35:0` -> `7-32:0` (collection root fixed) | 1: `5-29:11` `{11,0,2,5,7}` | none — vocabulary gap |

The tonic-fixed pair is the collection-level +3 transposition of the A-route pair
(`7-35:0 + 3 = 7-35:3`, `7-32:9 + 3 = 7-32:0`, both verified). The anchored shared
counts match (five each), but the fifth member differs: the A-route's `5-Z12:11`
transposes to an *unanchored* set (`{2,3,5,7,8}`, no pc 0), so the anchored
intersection takes its Z-pair partner `5-29:0B` instead. Holding the collection root
instead of the tonic collapses the seam to a single unadmitted voicing. Root choice
does not just change seam width; it decides whether the admitted bridge vocabulary
serves the crossing at all.

## The bridge choice (recorded by ear)

Both admitted candidates are contained in both endpoint collections and carried as
data (`GOLDEN_PATH_BRIDGE_VOICINGS`); both are legal pivots and remain selectable
voicing options. The maintainer listening audition:

> "5-23 reads more minor; 5-27 has more character and energy. No structural
> precedent for the pick — both are legal pivots; the state machine should treat
> them as selectable voicing options."

Fixture: `chosen: 5-27:0` ("more character and energy" as the tiebreak — character is
what a golden path showcases), `alternative: 5-23:0` (its minor lean noted),
`basis: "maintainer listening audition: 5-27 has more character/energy; both legal,
selectable as voicing options"`.

## Listening verdicts (maintainer, recorded)

1. **Seam (B natural arrival): motion, not arrival.** "The tonic remains C minor
   throughout; the leading tone pulls onward rather than landing." The B natural is
   heard as dominant function still operating — the cadence's tension is unspent at
   the seam, which is the Andalusian's signature (it ends on V, unresolved). The
   tonic-fixed framing is confirmed by the ear: the crossing is intra-tonic motion.
2. **The three minor chords: one gesture, not four events.** "Part of the Andalusian
   recipe — cadences are defined by how they sound and feel; this describes it well."
   The interior is perceived as a unit; the seam does not fracture the family.

Verdict 2 is the architectural finding: **the perceptual unit of the golden path is
the cadence-as-gesture, while the verification unit is the hop.** The machine
verifies hopwise (membership, containment, seam flag); the ear hears one gesture.
This is the segmentation principle for the procedural layer: BL-023's catalog and any
future path-selection engine should catalogue paths gestaltwise while verifying them
hopwise. The route record states both layers explicitly.

## Fixture schema sketch (`golden-path.v1`)

One path object with: `pathId`, `substrate`, `tonicPitchClass`, `origin`/`destination`
(`nodeId`, `mode`, `modeTonicPitchClass`, `pitchClasses`), `seam` (kind, drift,
replaced/raised pc, common tones), `interiorKernels`, `bridge` (`chosen`,
`alternative`, `basis`, `legality`), and `hops` (index, kind, label, nodeId,
chordLabel, chordRoot, collection, pitchClasses, seamCrossing, legality). BL-023
generalizes to multiple paths and catalog export; the chosen/alternative/basis triple
is the schema's first recorded musical judgment.

## Governance

`[DEFINED]` Planning evidence only: the route data and fixture are sprint artifacts.
The planner asserts containment against collections carried in code that mirror
artifact lookups; it derives no containment and mutates no canonical data. The
heptatonic-side transport implications remain BL-031's; the root-dependence finding is
its first cross-layer datum.
