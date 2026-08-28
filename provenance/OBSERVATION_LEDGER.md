# Observation Ledger — derived, falsifiable, not admitted

This ledger records derived identities verified against the frozen canonical
ledger and constructionEdges. Records are `planning_evidence` — machine-checked
and falsifiable, but not admitted as topology, runtime, or admission authority.
Each entry must be broken by a single counterexample in the canonical data.

## OBS-004 — Court-core identity (A1 interior skeleton)

**Status:** derived `planning_evidence` 2026-08-26
**Scope:** interior A1 anchors (5 states)

```
core(anchor at office k, tier A1) = parents' intersection = C(k-1)
where C(k-1) ∈ {661,677,1189,1193,1321} = 5-35 Court positions
```

| A1 anchor | office k | parents k-1/k+1 | intersection | court C(k-1) | P_{C(k-1)}(anchor)=core |
|---|---|---|---|---|---|
| 1749 Acoustic Moon k1 | Sun 2773 + Mars 1717 | 661 | C0 661 | 1749&661=661 |
| 2733 Melodic Minor Mars k2 | Moon 2741 + Mercury 1709 | 677 | C1 677 | 2733&677=677 |
| 1461 Mixo♭6 Mercury k3 | Mars 1717 + Jupiter 1453 | 1189 | C2 1189 | 1461&1189=1189 |
| 1707 Dorian♭2 Jupiter k4 | Mercury 1709 + Venus 1451 | 1193 | C3 1193 | 1707&1193=1193 |
| 1389 Half-Dim Venus k5 | Jupiter 1453 + Saturn 1387 | 1321 | C4 1321 | 1389&1321=1321 |

Verification: `python3 -c "parents AND → court mask"` 5/5 Pass. Seams {1371,2901} at dH10 share only 2 notes — no core (correctly).

**Interpretation:** Court masks project A1 interiors onto pentatonic skeletons (`seven-governors-court-filter-algebra-v0.1.0`). No topology rewrite; filter semantics become concrete. `kappa_court(core of anchor_k)=(k-1)/4` reads as interior window position, still `court.compression` only.

**Falsification:** any interior A1 anchor whose parents' intersection ≠ corresponding 5-35 mask (or weight ≠5) breaks it.

**Upstream:** `seven-governors-court-substrate-v0.1.0/canonical/court-rooted-positions.json` T5 cycle; `canonical/universal-network-data.json` constructionEdges.

**Status update:** `subsumedBy: OBS-009` — observational form superseded by window-intersection theorem `window(k−1)∩window(k+1)=5` consecutive fifths; receipts preserved.

---

## OBS-005 — Shifted-complement law (interior core mechanism)

**Status:** derived `planning_evidence` 2026-08-26
**Scope:** interior constructions 10/10 (A1 5 + A2 5)

```
core(anchor at office k, tier t) = T₁(comp(anchor at office k+1, tier t−1))
                                 = T₋₁(comp(anchor at office k−1, tier t−1))
where core = parents' intersection, comp = 12-bit complement (4095 ^ mask) TnI-normalized,
      T±1 = semitone transposition
```

Interior verification 10/10:

- A1: 661 = T₁(comp(1717)) = T₋₁(comp(2773)), 677 = T₁(comp(1453)) …, 1321 = T₁(comp(1387))
- A2: 597 = T₁(comp(1749)), 1173 = T₁(comp(1461)), 681 = T₁(comp(1707)), 1317 = T₁(comp(1389)), 1353 = T₁(comp(1371)) — receipts match A2 core list `1173,681,1317,1353,597` exactly; mirror `T₋₁` forms also hold.

**Reading:** everything absent from one parent, raised one semitone, is present in the other — neighboring anchors are interlocking near-complements, intersection forced to shifted complement. Subsumes family facts: A1 cores ∈ 5-35 (=comp of 7-35), A2 cores ∈ 5-34 (=comp of 7-34). Predicts A3 interior cores would be 5-33.

**Falsification:** any interior construction where neither `T±1(comp(parent))` equals the intersection.

**Shadow ledger consequence:** `shadow(core) of tier t = T₁∘comp of tier t−1 anchors` — zero-parameter shadow ladder, evidence type #2 for CRT-310 (core-of-construction alongside 5-23/5-27 bridge-necessity).

**Status update:** extension clause resolved by `OBS-013`, `domain-bounded, not falsified` — conjugation holds through `A2`; `A3` extension blocked by `dH` exhaustion, not by counterexample.

---

## OBS-006 — Unified core-and-tension rule (10/10 interiors)

**Status:** derived `planning_evidence` 2026-08-26

```
anchor(k,t) = core(k,t) ∪ { bright tension from parent k−1 at degree d(k−t) }
                          ∪ { dark tension from parent k+1 at degree d(k+t−1) }
```

- `core(k,t)` as in OBS-005 (5 notes)
- `d(G)` Chaldean: Saturn 1, Jupiter 2, Mars 3, Sun 4, Venus 5, Mercury 6, Moon 7

A1 (`t=1`): bright at `d(k−1)` — parent office's own degree in bright form (e.g. Lydian ♯4 for Moon) — dark at `d(k)` (target's degree: ♭7,♭3,♭6,♭2,♭5 in office order).
A2: both slots march one office outward (`d(k−1)→d(k−2)`, `d(k)→d(k+1)`) — open-degree window widens one office per side per tier (1→3, spans `6→8→10` in fifth-space).
Cores are complement family of parent tier; parent-tier family `7-35→7-34→7-33` trails by one (`5-35→5-34`).

Verification 10/10 interior anchors (pitch-set derived, degree-address matched to `mutation.degreeGovernor`).

---

## OBS-007 — Seam non-collision disambiguation (4/4)

**Status:** derived `planning_evidence` 2026-08-26

`dH10` endpoint pairs are same-set-class at phase `±1` (`T₁(Ionian)=Locrian` etc., `endpointHamming 0`). From Locrian exactly two single-degree moves land in `7-34` (`D2-raise→Half-Dim`, `D4-lower→Superlocrian`); Half-Dim already claimed by Venus interior midpoint, so Superlocrian is the unique non-colliding choice. Same uniqueness holds for all 4 seams (`LydAug vs Acoustic; LWT vs Aeroptian; LWT-I vs Storian`). Converts authored→derived.

**Falsification:** any seam where both candidates free (under-determined) or none free (over-determined).

---

## OBS-008 — Construction exhaustivity (K forced, not merely consistent)

**Status:** derived `planning_evidence` 2026-08-26

Enumerated all 21 same-family mode pairs per tier:

- `7-35`: exactly 5 pairs at `dH4` — precisely the 5 interior constructions — 6 at `dH2` (modal adjacencies), 3 at `dH10`.
- `7-34`: exactly 5 at `dH4` (again interiors), all distance-1 pairs at `dH6`, 2 at `dH10` (seams).

Every anchor is generated by its office-ring distance-2 pair `{k−1,k+1}`: `dH4` → fixed-tonic midpoint, `dH10` → phase-seam. Hence `K=δ₋₁+δ₊₁` over `Z7` is **exhaustive**; next tier predicts `[1,3,3,1]` (`K³`).

**Falsification:** any same-family `dH4` pair not corresponding to an interior construction, or any anchor lacking the `{k−1,k+1}` provenance.

---

## OBS-009 — Window-intersection theorem (general 7−d form)

**Status:** derived `planning_evidence` 2026-08-27
**Scope:** all heptatonic office windows and Court windows

```
window(k) = [−k, 6−k]  (7 consecutive fifth-positions, office k)
C_j       = [−j, 4−j]  (5 consecutive fifths, court j)
window(j) ∩ window(j+d) = 7−d consecutive fifths
```

`d=1 → 6` common tones (adjacent modes), `d=2 → 5` (Court — second-neighbor overlap stratum), `d=3 → 4`, `d=4 → 3` (quartal/sus, not tertian). Hence `core(k,A1)=window(k−1)∩window(k+1)` is forced `5`-consecutive-fifths `∈5-35` — `OBS-004` reduced to geometry. General `d` form checked `7/7` modes, `5/5` courts.

**Falsification:** any `window(k)` not 7 consecutive fifths, or any `C_j` not 5 consecutive, or intersection size ≠ `7−d`.

---

## OBS-010 — A1 interior tension/hole law (5/5, rigid shape)

**Status:** derived `planning_evidence` 2026-08-27

```
anchor(k,A1) = core[−k+1,5−k] + flanks {tensions} ; holes = window ends
```

Each parent contributes exactly one tension — its window's overhang past the core.

| anchor | core arc | tensions (flanks) | holes (window ends) |
|---|---|---|---|
| Acoustic (Moon) | [0,4] | 10, 6 | 11, 5 |
| Melodic Minor (Mars) | [11,3] | 9, 5 | 10, 4 |
| Mixo♭6 (Mercury) | [10,2] | 8, 4 | 9, 3 |
| Dorian♭2 (Jupiter) | [9,1] | 7, 3 | 8, 2 |
| Half-Dim (Venus) | [8,0] | 6, 2 | 7, 1 |

Each row is previous shifted by one fifth — single rigid shape sliding `+1` fifth per office step. `anchor keeps its mode's interior and trades its mode's edges for its neighbors' edges.`

---

## OBS-011 — Hole-punching recursion (5/5 at A2)

**Status:** derived `planning_evidence` 2026-08-27

```
core(k,A2) = parentArcs[−k+1…] ∩ [−k−1…] (7 fifths) − {inside-holes 1 each}
```

Punched holes become core's own holes:

| core | parent arcs | intersection | punched | core fifth-pos |
|---|---|---|---|---|
| 1173 (Mars) | [10,6]∩[8,4] | [10,4] | 11, 3 | {10,0,1,2,4} |
| 597 (Sun) | [0,8]∩[10,6] | [0,6] | 1, 5 | {0,2,3,4,6} |
| 681 (Mercury) | [9,5]∩[7,3] | [9,3] | 10, 2 | {9,11,0,1,3} |
| 1317 (Jupiter) | [8,4]∩[6,2] | [8,2] | 9, 1 | {8,10,11,0,2} |
| 1353 (Saturn) | [6,2]∩[4,0] | [6,0] | 7, 11 | {6,8,9,10,0} |

Each core's arc-holes are exactly the two punched holes (e.g. `1173` arc `[10,4]` holes `{11,3}`). Unified: **cores are arc-intersections with parents' inside-holes punched through; tension law is the positive-space dual.**

*Erratum 2026-08-27: the prior single-hole `10` transcription was invalid. The five fifth-positions in `[9,3]` leave holes `{10,2}`; canonical sidecar and receipts record both.*

---

## OBS-012 — Seam/twin mechanism

**Status:** derived `planning_evidence` 2026-08-27

`seams(t+1) = office-midpoints of the T₁-twin pairs at tier t` — verified `4/4` historically (`T₁(Ionian)=Locrian→A1 Sun`, `T₁(Lydian)=Phrygian→A1 Saturn`, `T₁(MelMinor)=Superlocrian→A2 Moon`, `T₁(LydAug)=Dorian♭2→A2 Venus`), exactly two twin pairs per tier at ring-distance 2. `A2` twins compute to midpoints `{Mars,Jupiter}` — inward march `{0,6}→{1,5}→{2,4}` ends mid-stride. `T₁`-twin pairs are exactly the `dH10` pairs in the census.

**Cross-reference:** `OBS-007` forced-move allocation vs `OBS-012` pair-twin geometry — different claims, different receipts; `012` does not supersede `007`.

---

## OBS-013 — A-ladder termination (no A3)

**Status:** derived `planning_evidence` 2026-08-27

`dH` census over 7 office-distance-2 pairs at `A2` (masks decomposed pairwise):

| A2 pair (offices) | dH | shared structure |
|---|---|---|
| Sun–Mars, Mars–Jupiter, Jupiter–Saturn, Venus–Sun, Saturn–Moon | **2** (×5) | whole-tone hexachord `{0,2,4,6,8,10}` |
| Venus–Mercury, Mercury–Moon | **10** (×2) | `T₁` twins |

**Zero pairs at `dH4`.** `A-tier` interiors require `dH4` midpoint parents; `A0`/`A1` each have five, `7-33` has none → **no `A3` constructible** under declared `midpoint/phase-seam` algebra — chain terminates at `A2` because construction algebra exhausts, not by fiat. Six `A2` anchors = `WT hex + one odd {1,3,5,7,9,11} each once`, `Neapolitan Major = odd hex + {0}`, `T₁` swaps hexachords (`LWT→NeapMaj→LWT-I`).

Consequences: shadow ladder ends at `5-34`; `5-33` detached on both channels `0` diatonic parents (binding audit `1-parent` class list absent) and no shadow conjugation. `OBS-005` extension clause resolves as `domain-bounded, not falsified`.

**Achirality:** all three shadow families `5-35,5-34,5-33` achiral (complement of achiral `A-tier` is achiral) — no orientation ambiguity.

---

## Index

| ID | Scope | Verification | Admission impact |
|---|---|---|---|
| OBS-004 court-core | 5/5 interior A1 | `parents AND → C(k-1)` | `subsumedBy: 009` — mechanism now `009` |
| OBS-005 shifted-complement | 10/10 interior | `T±1(comp)` equality | `extension resolved by 013, domain-bounded, not falsified` |
| OBS-006 core-and-tension | 10/10 interior | degree-address match | Defines shadow ladder algebra |
| OBS-007 seam non-collision | 4/4 seams | 2-candidate uniqueness | Makes seams derived |
| OBS-008 exhaustivity | 21 pairs/tier | exhaustive enumeration | Proves K forced |
| OBS-009 window-intersection | 7/7 modes, 5/5 courts | `window(j)∩window(j+d)=7−d` | Reduces `004` to geometry; `5-element canon = second-neighbor stratum` |
| OBS-010 tension/hole | 5/5 | `core arc + flanks / holes` table | Rigid shape `+1` fifth per step |
| OBS-011 hole-punching | 5/5 | `arc∩ − punched holes` table | Mechanizes `005` at `A2` |
| OBS-012 seam/twin | 4/4 | `T₁`-twin `4/4`, `2 per tier` | Cross-refs `007` |
| OBS-013 termination | 7/7 masks | `dH 5×2/2×10/0×4`, `WT hex 7/7`, `5-33` dual detachment | Caps shadow ladder at `5-34`; `A3` is clean negative |

No entry writes `ScaleState.office`, `OCCUPIES_OFFICE`, `mutation.degreeGovernor`, `C_H`, `photonicCompression`, or ledger state.
