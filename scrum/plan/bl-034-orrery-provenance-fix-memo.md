# BL-034 Sprint Memo: Orrery Semantic Provenance Fix

**Status:** sprint artifact (surface remediation + inheritance audit). No ledger entry, no
evidence obligations. Related: `plan/bl-035-semantic-derivation-census-memo.md`,
`plan/bl-044-court-voicing-audit.md`, `docs/GRAPH_AND_COMPILER_API.md`,
`seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/domain-projection-registry.json`.

**Landed:**

| Artifact | Role |
|---|---|
| `orrery/src/landform-provenance.ts` | Pure resolver: `landformProvenance(node)` → office, native (A0 only), seed state id, pool copy; `landformPoolLabel` / `landformPoolNote` |
| `orrery/src/landform-provenance.test.ts` | 4 pins: seven seed ids, native A0 labeling, derived A1/A2 labeling, non-mutation |
| `orrery/src/main.ts` | `renderLandforms(node)` sets the tier-branched label + note; `clearInspector` resets both |
| `orrery/index.html`, `orrery/src/style.css` | `#selected-landforms-label` id + `#selected-landforms-note` element + `.field-note` style |

## The defect

The inspector's static label read "Baseline A0 landform reference pool" for every anchor. A1/A2
anchors display their office's A0 pool (the admitted office-following projection), so the
surface presented an inherited payload as if it were the node's own baseline. The payload is
canon — `projection:landforms:v0.1.1` (`canonical_reference_projection`), seven canonical A0
seed profiles, `REFERENCES_LANDFORM` in the API contract — so the defect was **provenance
display, not data**.

## The fix

- A0: `Baseline A0 landform reference pool — {office} seed {stateId} (native)` plus the native
  note.
- A1/A2: `Derived landform reference pool — inherits the {office} A0 pool (seed {stateId})` plus
  a note stating the tier carries no native pool and the display is the office-derived
  projection (presentation, not a new semantic payload).

**Rule recorded:** no tier's semantic payload displays as another tier's native content;
inherited display carries the office and the seed citation. The rule is
provenance-labeling, not payload removal — the projection is admitted and stays.

## Inheritance audit (find-and-report; A1/A2 fixed only)

| Surface | Instance | Disposition |
|---|---|---|
| Inspector landform block (`main.ts:1645`; `index.html:583`) | A1/A2 displayed A0 pool under the A0 label | **Fixed** |
| Scene presentation prompt (`scene-composer.ts:116-117`; `main.ts:917`) | A1/A2 pick an office pool entry for the authored scene | Already explicitly presentation-typed ("reference prompt only"; scene disclaimer `index.html:545-547`); not fixed |
| Audio palette (`audio.ts` `OFFICE_PALETTES`, office-keyed) | A1/A2 inherit the office A0 timbre preset | Already explicitly derived ("inherits the authored {office} A0 preset (presentation, not a pitch claim)", `main.ts:556,565-567`; pinned `audio.test.ts:243-255`); not fixed |
| Kernel-window labels | no presentation consumer exists | No instance; nothing to fix |
| Evidence/photonic blocks | per-node validated values | No tier inheritance; no instance |

**Directional non-foreclosure:** the provenance rule must not preclude future directional
display (BL-035 records direction as unassigned, not absent). Labels carry the office/seed now;
a direction attribute is additive when sourced.

## Governance

No payload bytes, legal-move, audio-manifest, or canonical bytes changed; no new semantic
content invented; the resolver is pure and mutation-free.
