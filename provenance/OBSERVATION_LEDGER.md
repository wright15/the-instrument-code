# Observation Ledger — derived, falsifiable, not admitted

This ledger records derived identities verified against the frozen canonical
ledger and constructionEdges. Records are `planning_evidence` — machine-checked
and falsifiable, but not admitted as topology, runtime, or admission authority.
Each entry must be broken by a single counterexample in the canonical data.

## Sprint 3 → EPIC-520 boundary — 2026-09-04

**Status:** navigation-only project epistemic-state summary; no authority implied.

Research mode transition: Sprints 1–2 derived structure; EPIC-520 opens
hypothesis discrimination (three hypotheses, zero checks run). Evidence surfaces
completed in Sprint 3 support this phase.

**Guard:** This entry reports current status, not hypothesis likelihood. It is
not topology, admission, operator, or runtime authority.

---

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

**Addendum 2026-09-01 (GOV-511 fifth-space census): geometric termination.** Any 7 points on the 12-cycle have seven gaps summing to 12, so the largest gap is ≥ `ceil(12/7)=2` and the minimal covering arc `span = 12 − max gap ≤ 10` — the A-ladder ceiling is geometry, not fiat. The 462-record census (`canonical/fivefold-incubator/fifth-space-census-v0.json`) shows no state exceeds span 10. Ceiling attainment: exactly 21 anchor states sit at span 10 — the 7 `7-33` (A2) anchors, the 7 `7-1` (D7) anchors, **and** the 7 `7-8` (D6) anchors (arithmetic output; the D6 family shares the ceiling, which the planning prose did not list). `7-33`/`7-1` sitting at the ceiling is confirmed; exclusivity is not claimed.

---

## OBS-014 — Twin-hub contact convergence (D4/D5 seat-contact audit)

**Status:** derived `planning_evidence` 2026-09-01
**Scope:** 28 D4/D5 `SEAT_CONTACT` rows; T₁-twin census over tiers A0/A1/A2
**Verdict:** `confirmed`

Definitions are pre-registered in `scrum/GOV-510-twin-hub-contact-convergence-audit.md` and carried verbatim in the machine artifact (`method` block); the executable checks are `scripts/validate-twin-hub-convergence.py`.

**T₁ receipt:** `T₁(Ionian)=Locrian` under the declared 12-bit mask convention (`2741 → 1387`), joined by a `root_phase` phase-seam edge into the A1 Sun seam (`1371`); the near-match `T₁(Locrian)=2774` (same family, root-0) is rejected because `2774 ≠ 2741`.

**Twin census (T₁-twin pairs per tier, all dH10):**

| tier | pair 1 | pair 2 | hub |
|---|---|---|---|
| A0 (7-35) | {Ionian 2741 Moon, Locrian 1387 Saturn} | {Lydian 2773 Sun, Phrygian 1451 Venus} | undefined (disjoint) |
| A1 (7-34) | {MelMinor 2733 Mars, Superlocrian 1371 Sun} | {LydAug 2901 Saturn, Dorian♭2 1707 Jupiter} | undefined (disjoint) |
| A2 (7-33) | {LWT-I 1367 Moon, NeapMaj 2731 Mercury} | {LWT 3413 Venus, NeapMaj 2731 Mercury} | **Mercury** |

**D4 (7-Z17) — convergence-through-twins:** the A1-generating twin pairs `{Moon,Saturn}/{Sun,Venus}` are disjoint (no hub); their ring midpoints `{Sun,Saturn}` are seated as A1 phase seams (`1371`,`2901`). All 14 D4 `SEAT_CONTACT` rows route the permitted chain (D-anchor ← `SEAT_CONTACT` ← satellite ← `GOVERNS` ← parent anchor; single hop; satellite tier = parent tier = A1), two selected contacts per anchor, 7/7 offices.

**D5 (7-Z12) — convergence-onto-unseated-midpoints:** the A2 twin pairs share the Mercury hub; their ring midpoints `{Mars,Jupiter}` are unseated as seams (the A2 anchors `1493`,`1397` there are exact midpoints, not phase seams; no A3 exists per `OBS-013`). All 14 D5 rows route the permitted chain (satellite tier = parent tier = A2), and D5 anchors seat the unseated-midpoint offices Mars and Jupiter.

**Reading:** D-tier seat-contact evidence routes through T₁-twin structure exactly as spec'd: D4 converges through twins whose midpoints are already seated; D5 converges onto the offices the twin march designated but the A-ladder could not construct — the field closes its own seams from below. This derives the seam mechanism (`OBS-012`) a second time, from below, over the spec'd D4/D5 asymmetry. No topology rewrite; `planning_evidence` only.

**Falsification:** any D4/D5 chain violating the permitted single-hop chain, any A2 twin pair not sharing Mercury, or any A2 anchor at Mars/Jupiter carrying phase-seam provenance breaks it.

**Upstream:** `canonical/universal-heptatonic-ledger.json`, `canonical/universal-network-data.json` (`SEAT_CONTACT`/`GOVERNS`/`CONSTRUCTS`), `src/governor/shadow_ladder.py` (`transpose_mask`).

---

## OBS-015 — D-channel span sequence (oscillation, then ridge)

**Status:** derived `planning_evidence` 2026-09-01
**Scope:** 70 A0-D7 anchors; per-tier fifth-space span, office-uniform within each tier

```
span(A0,A1,A2) = 6, 8, 10          (strict climb, even steps)
span(D1..D7)   = 9, 8, 9, 8, 9, 10, 10   (oscillation 9↔8, then ridge climb 9→10→10)
```

Every tier is office-uniform (same span at all 7 offices). The D-channel is not a monotone climb: D1-D5 alternate 9↔8 around the field's middle, and only D6-D7 commit to the ceiling. Mirror: the A-ladder climbs 6→8→10 in even steps; the D-channel's signature is alternation. D5 — the tier converging onto the unseated midpoints (OBS-014) — sits at span 9, one below the ceiling; the seam-closure convergence concentrates immediately preceding the ceiling ridge. For EPIC-520 this poses the question: why does seam-closure concentrate at span 9?

**Falsification:** any tier whose anchors are not office-uniform in span, or any recomputation of the sequence differing from the above.

**Upstream:** `canonical/fivefold-incubator/fifth-space-census-v0.json` (records), `qa/fifth-space-census-validation.json`.

## OBS-016 — Three-family fifth-span ceiling

**Status:** derived `planning_evidence` 2026-09-01
**Scope:** all 462 states; ceiling = span 10

```
geometric bound: 7 points on the 12-cycle force a gap >= 2, so span <= 10 (OBS-013 addendum)
ceiling attained by exactly 21 anchors:
  7-33 (A2) x7, 7-8 (D6) x7, 7-1 (D7) x7
all with gap multiset [1,1,2,2,2,2,2]
```

The ceiling census is richer than the planning prose: three families, not two — the 7-8 D6 family is arithmetic output, and D6 is the ridge between the A-terminal (7-33) and D-terminal (7-1) ceiling families, which are ceiling co-residents. No state exceeds span 10.

**Falsification:** any anchor at span 10 outside the three families, or any state exceeding span 10.

**Upstream:** `canonical/fivefold-incubator/fifth-space-census-v0.json` (records), `qa/fifth-space-census-validation.json`.

---

## OBS-017 — D-shadow complement/run identity

**Status:** derived `planning_evidence` 2026-09-06
**Scope:** 49 canonical D1-D7 anchors
**Provenance:** derived in the maintainer re-audit and receipted by the
source-derived D-shadow generator. Artifact identity (candidate fingerprint):
`8c2416b8f51f8ae8cdb0fc9f2490beeb9e3cc49f435be7d992f55f5f7c122cb8`.
Artifact file SHA-256:
`91fead6b1e637ed6dd82dc4f47bd3c357abfee6958aabfe28406399414a6d34c`.
QA validation report fingerprint:
`1651b362eb5317d03b13664af99eba718d2db7772ba5c3fe55376d3af4a13db7`.
QA receipt file SHA-256:
`af2cdd6cde8a1da708a3df9dee1ceb10670f9ab1742939193a7b130b6a153bbf`.

```
span(complement(C)) = 11 - maxrun(C)
```

Here `maxrun(C)` is recomputed as the largest cyclic consecutive run in the
anchor's fifth-position mask. The identity holds for all 49 anchors.

**Frame-level combinatorics guard:** this asserts the generator's
combinatorial verification only, not a hypothesis meaning, preference, or
disposition.

**Binding philosophy:** source-bound artifacts and receipts bind arithmetic;
this ledger entry records the derived observation and creates no topology,
admission, runtime, office, or `harmonic.C_H` authority.

**Falsification:** any in-scope anchor for which recomputed complement span is
not `11 - maxrun(C)` breaks it.

**Upstream:** `canonical/fivefold-incubator/d-shadow-complement-span-v0.json`,
`qa/d-shadow-complement-span-validation.json`.

---

## OBS-018 — D-channel run-space route

**Status:** derived `planning_evidence` 2026-09-06
**Scope:** D1-D7 anchors, office-uniform per tier
**Provenance:** derived in the maintainer re-audit and receipted by the
source-derived D-shadow generator and QA validation receipt.
**Artifact identity (candidate fingerprint):**
`8c2416b8f51f8ae8cdb0fc9f2490beeb9e3cc49f435be7d992f55f5f7c122cb8`.
**Artifact file SHA-256:**
`91fead6b1e637ed6dd82dc4f47bd3c357abfee6958aabfe28406399414a6d34c`.
**QA validation report fingerprint:**
`1651b362eb5317d03b13664af99eba718d2db7772ba5c3fe55376d3af4a13db7`.
**QA receipt file SHA-256:**
`af2cdd6cde8a1da708a3df9dee1ceb10670f9ab1742939193a7b130b6a153bbf`.

The D-channel's run-space route is hold `3` through D1-D4, spike to `5` at
D5, then floor at `2` for D6-D7:

```
(3, 3, 3, 3, 5, 2, 2)
```

**Falsification:** any regenerated D-tier maxrun summary that differs from the
complete sequence breaks it.

**Binding philosophy:** source-bound artifacts and receipts bind the run-space
arithmetic; this ledger entry records the derived observation and creates no
topology, admission, runtime, office, or `harmonic.C_H` authority.

**Upstream:** `canonical/fivefold-incubator/d-shadow-complement-span-v0.json`,
`qa/d-shadow-complement-span-validation.json`.

---

## OBS-019 — D5 Court-class five-run containment

**Status:** derived `planning_evidence` 2026-09-06
**Scope:** all seven D5 anchors
**Provenance:** derived in the maintainer re-audit and receipted by the
source-derived D-shadow generator and QA validation receipt.
**Artifact identity (candidate fingerprint):**
`8c2416b8f51f8ae8cdb0fc9f2490beeb9e3cc49f435be7d992f55f5f7c122cb8`.
**Artifact file SHA-256:**
`91fead6b1e637ed6dd82dc4f47bd3c357abfee6958aabfe28406399414a6d34c`.
**QA validation report fingerprint:**
`1651b362eb5317d03b13664af99eba718d2db7772ba5c3fe55376d3af4a13db7`.
**QA receipt file SHA-256:**
`af2cdd6cde8a1da708a3df9dee1ceb10670f9ab1742939193a7b130b6a153bbf`.

Every D5 maximal five-run is contained in Court class `5-35`. The D5 anchors
at the non-hub offices of the two A2 T1-twin pairs intersect at state IDs
`{2383, 3667}`.

**Falsification:** any D5 maximal run that is not `5-35`, or a regenerated
twin-outer-office intersection other than `{2383, 3667}`, breaks it.

**Binding philosophy:** source-bound artifacts and receipts bind the
containment arithmetic; this ledger entry records the derived observation and
creates no topology, admission, runtime, office, or `harmonic.C_H` authority.

**Upstream:** `canonical/fivefold-incubator/d-shadow-complement-span-v0.json`,
`qa/d-shadow-complement-span-validation.json`.

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
| OBS-014 twin-hub convergence | 28/28 chains | T₁ receipt, `hub A0/A1 undefined, A2 Mercury`, `midpoints {Sun,Saturn} seated / {Mars,Jupiter} unseated`, verdict `confirmed` | Derives `012` from below over spec'd D4/D5 asymmetry |
| OBS-015 D-channel span sequence | 70 anchors | `A 6→8→10` climb; `D 9,8,9,8,9,10,10` oscillation-then-ridge; office-uniform per tier | Well-poses "seam-closure at span 9" for EPIC-520 |
| OBS-016 three-family ceiling | 462 states | span 10 attained by exactly 21 anchors of `7-33`/`7-8`/`7-1`, gap `[1,1,2,2,2,2,2]` | D6 is the ceiling ridge; A- and D-terminal families co-reside at 10 |
| OBS-017 D-shadow complement/run identity | 49 D anchors | `span(complement(C)) = 11 - maxrun(C)` | Combinatorics only; no hypothesis disposition or authority |
| OBS-018 D-channel run-space route | D1-D7 anchors | `3,3,3,3,5,2,2` hold/spike/floor | D5 is the run-space spike |
| OBS-019 D5 Court-class five-run containment | 7 D5 anchors | all maximal runs `5-35`; intersection `{2383,3667}` | Bounded containment observation only |

No entry writes `ScaleState.office`, `OCCUPIES_OFFICE`, `mutation.degreeGovernor`, `C_H`, `photonicCompression`, or ledger state.
