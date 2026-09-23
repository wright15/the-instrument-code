# BL-044 Audit — Court Voicing Surface vs. Canon

**Status:** sprint artifact. No ledger entry, no evidence obligations.
Scope: certify the pre-D5-era C0–C4 presentation surface against admitted Court records,
relabel to engagement semantics, retire palette thinning from the voicing path.

## 1. Certify table — registry ↔ Orrery

Registry: `seven-governors-court-substrate-v0.1.0/canonical/court-rooted-positions.json`
(all five `admissionStatus: "admitted"`, `setClassId: "pentatonic:5-35"`,
`complementFamilyId: "7-35"`, `normalizedComplementScaleStateId: 1387`).
Admission scope: `provenance/court-admission-release.json` `admittedScope.canonicalRootedPositions`
(C0–C4 of 5-35); `provenance/SOURCE_AUTHORITY.md:32`. Presentation mirror: `orrery/src/court.ts`.

| Position | Registry lines | `court.ts` lines | mask | pitchClasses | pole vector | internalPoles | kappa | Verdict |
|---|---|---|---|---|---|---|---|---|
| C0 | 3-37 | 31-46 | 661 | [0,2,4,7,9] | 0000 | [] | 0/1 | **MATCH** |
| C1 | 38-77 | 47-62 | 677 | [0,2,5,7,9] | 1000 | [Mars] | 1/4 | **MATCH** |
| C2 | 78-118 | 63-77 | 1189 | [0,2,5,7,10] | 1100 | [Mars,Jupiter] | 1/2 | **MATCH** |
| C3 | 119-160 | 78-92 | 1193 | [0,3,5,7,10] | 1110 | [Mars,Jupiter,Venus] | 3/4 | **MATCH** |
| C4 | 161-203 | 93-107 | 1321 | [0,3,5,8,10] | 1111 | [Mars,Jupiter,Venus,Saturn] | 1/1 | **MATCH** |

T5 offsets 0/5/10/3/8 and XOR support per registry; not mirrored in `court.ts` (not needed
for presentation). **No drift found.** Fail-loud was armed; nothing fired.

## 2. Scale names — traced, presentation-only

`Major Pentatonic / Scottish Pentatonic / Qing Yu / Minor Pentatonic / Man Gong` trace to the
Ian Ring identities in `schemas/elemental_pentatonic_scale_map_v1.0.0.yaml:33-34` (661, 677,
1189, 1193, 1321) and per-position at `:113,143,206`. That schema is CRT-350
**proposed**, `physical_quantity_claim: false`, zero authority effect — so the names are
display labels, not claims.

## 3. Presentation-only inventory (changed nothing)

`emblem`, `strategyEmphasis`, `mercuryEngineEmblem` (`court.ts`), and `scaleName` have no
registry counterpart. `mercuryEngineEmblem` remains correct: Mercury is not a binary Court
pole (`framework/AGENTS.md:257-261`). Pole rendering was already canon-correct
(`court.ts` internalPoles + `main.ts` disposition mapping); no data flip was made.

## 4. What changed

1. **Labels:** `engagementLabel` added to `CourtPresentation`; the surface now reads
   `Engagement: <state> / <strategy> (presentation).` — C0 = seed/all-external,
   C4 = fully realized/all-internal, per canon.
2. **Disclosure (three layers, one sentence):** the voicing readout now says
   "Voicing: Court <id> / <name>'s own five mask pitches <set> (canon, per CRT-302/CRT-309).
   Timbre: <office> preset (presentation, not a pitch claim). Pitch-color associations, if
   shown, are hypothesis-layer (bucket overlay), toggleable and unasserted."
3. **Voicing:** `resolveAudioSelection` court-pentatonic branch voices
   `[...court.pitchClasses]` (the position's own five registered mask pitches). Palette
   thinning retired from the voicing path; `filterPitchClasses` retained for demo use, and
   the "mask filter demo" is explicitly not built (would be a new item with its own label).
4. **Tests:** per-position voicing pin (all five) + destabilizing-member test (C1 voices 5
   not 4; C3 voices 3/10 not 2/9) — pins that voicing is mask data, never a bucket
   re-derivation. `court.test.ts` pins engagement labels. Browser harness pins updated.
5. **README:** voicing description corrected.

## 5. The flip-question origin (process memory → repo memory)

The report that "Major Pentatonic should be all-internal" was not a data error and not a
misremembering of the registry. It came from the **bucket layer**: the comprehension map's
hypothesis reads engagement configurations through keep-or-sharpen color, and its unadopted
all-internal reading of the seed position is exactly the kind of pitch-color association
that hypothesis produces. The canon reading (C0 = 0000 = all elements external) is the
engagement layer, and it was always the rule. Both statements are valid **at their own
layers**; the collision happened because the old UI surface silently blended them —
asserting a hypothesis-layer color as if it were canon. The fix relabels the surface to
engagement semantics and marks any pitch-color association as hypothesis-layer, toggleable,
and unasserted (same convention as the bucket overlay toggle). This is the first recorded
instance of the two-layer semantics colliding in a live surface; it is recorded here so
future sessions resolve it from the record rather than rediscover it.

## 6. Framing — what this audit actually found

The registry is clean. Position→mask mappings confirm field-for-field; scale names trace to
admitted/proposed sources; pole rendering is canon-correct. The only drift was presentation
labeling, and it was a layer-confusion story, not a data-integrity story. The pre-convention
code survived contact with the post-convention semantics almost intact — because the
registry-first discipline (CRT-302/309, admitted substrates, strict schemas) was already
doing the job the binding convention now formalizes. This audit is a confirmation that the
layering held, plus one UI surface updated to speak the current vocabulary.
