# Policy-v3 — Governed-Loop Registration (Scratch Realm)

| Field | Value |
|---|---|
| Directive | PLV3-REG-1 |
| Status | Registration — codification, not machinery expansion |
| Site | Governed-loop scratch realm. Zero repository writes, zero orrery changes, no tags. |
| Decisions | α cross-phase transition set; β artifact supersession; γ boundary transit-only licensing and value-space extension; δ enforcement boundary |
| Form | One combined entry, one content hash covering α+β+γ+δ; no partially-expanded intermediate state |
| Authority | None beyond this registration. Candidate structures remain authored choices, not canon. |

## 0. Nature and scope

(a) The gate's existing rule ordering (`mvp2.py:138-185`) already enforces the boundary transit-only mechanics. No new gate logic is authorized. The only gate change in scope is admissible-set data expansion.

(b) The seam licensing codified here is the one already exercised and ear-accepted in the MVP-2c sessions: zero seam disputes; the single dispute — the 501 case — is scoped to licensed-seam context. This registration formalizes exercised practice.

(c) The four decisions land as one combined registration entry with one content hash. A partially-expanded intermediate state is forbidden. The four decisions share one transition set, so one hash avoids a partially-expanded intermediate state.

## 1. Fixed point and evidence basis

All pins were derived at execution from live bytes. The repository was read-only context: HEAD, clean tree, ledger identity and size, and file count were recorded at opening. The operation site was the scratch realm; every realm input was content-hash pinned at opening, and load-bearing files were pinned at first use: the 462-record census payload, the degenerate-boundary artifacts, and the Spike-01 evidence. Nothing in the directive was copied into this text as a pin.

Evidence hierarchy: realm bytes are primary — the seam census probe, the frozen substrate's boundary fields, and the degenerate-boundary artifacts. Repository files are correspondence-only: the production aggregate's withheld-boundary count is recorded as corroboration, non-fatal. No repository byte serves as primary evidence for a realm expectation.

The evidence basis, with every value re-derived at opening and again at freeze:

| Check | Result |
|---|---|
| E1 cross-phase seam census | Exactly 5,040 lifted edges (420 R1/L1 applications × 12; R1 sources 210, L1 sources 210). |
| E2 Family B crossings | 90 crossings over 42 pairs, phase-distance 0 (same-phase bridges); crossing histogram 30×1 + 12×5. |
| E3 boundary pcSum census | 154 records, values spanning 23–49 inclusive, 25 distinct values; exactly four values novel against the governed set: {23, 24, 48, 49}. |
| E4 boundary rows | 128 exit rows at 104 distinct boundary source masks; 128 entry rows at 104 distinct boundary target masks; Tier-2B touching boundary = 0 pairs; Tier 1 cannot fire from a boundary state. |
| E5 equivariance | 40,824 / 40,824 checks, 0 failures (15 operators × 12 phases; 3,402 applications). |
| E6 501 dispute case | `gate_log_mvp2_live_mac1.jsonl` seq 5; [2771,11] → [501,11]; REJECT `ungoverned-transition`; dispute true; no citation. |
| E7 ground truth | 462-tone census; 70 families; 308+154 partition; 10 orbits, each mean exactly 36. |
| E8 exercised-practice record | `seam_operator_applications.csv`: 3,402 rows. |
| E9 superseded catalog | `seam_legal_moves_v2.json` (alias `legal-moves.v2`): 60 moves / 12 operators. |
| E10 line anchors | Self-transition veto on boundary states at `mvp2.py:150-154`; v2-P4 (Tier 1 requires same phase) at `mvp2.py:171-172`; gate body `mvp2.py:138-185`. Re-read verbatim at freeze. |

The E3 boundary-record count and the E7 partition's withheld-boundary side correspond: 154 = 154. The correspondence is recorded, not load-bearing. A divergence would have been recorded, not fatal; only an E3 census failure would stop. No such failure occurred.

## 2. α — Cross-phase transition set

**Ruling.** The licensed cross-phase transition set is exactly the 5,040 lifted edges of E1. No other cross-phase movement is licensed. Free phase movement (teleportation) remains forbidden; v2-P4 is retained unchanged as its mechanical backstop. Family B's 90 same-phase bridges remain in the seam substrate, outside this set (E2).

**Lifted identity.** 420 R1/L1 applications × 12 lifted images = 5,040 lifted edges (2,520 raised / 2,520 lowered). The 420 base applications are 418 cross-7-35 and 2 intra-7-35 in the seam census's sense (R1 209+1, L1 209+1; the two are the canonical 7-35 seam and its inverse). Each lifted edge maps (source, p) to (target, (p + carry) mod 12), with R1 carry +1 and L1 carry −1. The cross-phase set is exactly these 5,040 edges. Family B's 90 crossings are phase-distance 0; they are classified as same-phase bridges within the seam story and are not members of the cross-phase transition set. The seam substrate names both classes and reports a combined seam-move total of 5,130.

**Falsification shape.** Any admitted cross-phase transition not among the 5,040; or any seam edge outside the census admitted as cross-phase.

**Pending receipt-level check.** The 12-phase orbit sweep against the recorded 41-at-T11 prediction. The expectation is pre-declared from the realm's Spike-01 artifacts before the sweep runs, not from the directive. The sweep receipt is filed separately; α's receipt-level check is that receipt. Divergence fires α's falsification shape and stops the session.

## 3. β — Artifact supersession

**Ruling.** `legal-moves.v2` (60 moves / 12 operators) is superseded by the expanded legal-moves artifact derived from the expanded frozen substrate, `seam_legal_moves_v3.json`. v2 remains readable as lineage, not live authority. The supersession is recorded inside this combined entry.

The successor enumerates the gate-legal seam set: 5,040 Family A lifted edges and 90 Family B bridge crossings (5,130 seam moves), over the two gate-licensed seam operators R1 and L1 plus the Family B bridge rule. Tier 1 within-family same-phase, the self-transition rule, and the boundary veto are stated as rules in the successor, not enumerated as moves. The superseded catalog's 60 parallel anchor edges are fixed-degree operator applications, not seam licenses under the frozen gate: Tier 1 requires the same governing root, which distinct self-rooted anchors do not share, and Tier 2A is R1/L1 only. Those edges remain readable in v2 as lineage and are not carried as live moves.

**Alias resolution.** `legal-moves.v2` resolves to `seam_legal_moves_v2.json`. The alias is legitimate on all three grounds: (1) count identity — 60 moves across 12 operators; (2) substrate lineage — the frozen seam substrate's source-file pin records the same bytes under `seam_legal_moves_v2.json`; (3) this record — the alias resolution is stated here, inside the combined entry. The filename literal `legal-moves.v2` need not exist on disk; the referent is the pinned artifact.

## 4. γ — Boundary transit-only licensing and value-space extension

**Ruling.** The 128+128 boundary rows of E4 remain licensed. Boundary states are reachable-via-seam, escapable-only-via-seam, can never govern, and cannot be camped on (self-transition vetoed). The governed pcSum value space is extended by exactly {23, 24, 48, 49}, each novel value witnessed by specific boundary records (one receipt per value), via boundary states only.

**Method and value space.** pcSum is computed from the pitchMask bits; `census_462.json` records carry no pcSum key. The governed value set has 27 distinct values spanning 21–51. The boundary set has 25 distinct values spanning 23–49. The extension is set-theoretic: {23, 24, 48, 49} is absent from the governed value set and lies inside the governed numeric span (21–51). The extension is not a range extension; the values lie inside the span, and no range language is claimed.

**Witnesses.** 23 → 223 (×2: 223, 319); 24 → 239 (×3: 239, 351, 575); 48 → 3809 (×3: 3809, 3921, 3977); 49 → 3937 (×2: 3937, 3985). One receipt per value; each receipt cites every witness and names the primary witness.

**Falsification shape.** Any pcSum produced outside (governed set ∪ the four novel values); any Tier-1 fire from a boundary state; any Tier-2B pair touching boundary; any camping on a boundary state.

**Vacuity note.** Tier-1-from-boundary is unreachable by construction (E4/E10); that shape is retained as a mechanical invariant. Non-vacuity is carried by the camping veto demonstration and the pcSum statistic below — not by Tier-1 fires.

**Non-vacuity (two tiers, demonstrated at freeze).**

- Constraint tier: a teleportation attempt (1387@0 → 1387@1) is rejected (`unlicensed-transition`); a family hop (1387@0 → 1389@0) is rejected (`unlicensed-transition`); a camping attempt (501@11 → 501@11) is rejected (`ungoverned-transition`); a licensed boundary entry (1001@0 → 501@1 via R1) and a licensed boundary exit (493@0 → 247@1 via R1) are accepted; a non-seam boundary escape (247@1 → 247@2) is rejected (`ungoverned-transition`).
- Statistic tier: the pcSum distribution over boundary-adjacent states has 25 distinct values over 154 records; the newly admissible values are non-constant ({23: 2, 24: 3, 48: 3, 49: 2}). The statistic varies across the admissible set.

Both tiers pass at freeze. The receipt is `plv3_receipt_nonvacuity.json`.

## 5. δ — Enforcement boundary

**Ruling.** Drift remains record-only audit per the landed Spike-01 policy. No phase-relative scalar-field conservation veto is written into gate logic under this registration. Invariant enforcement, if ever pursued, requires a new registration with its own falsification shape and non-vacuity burden — not an amendment here.

## 6. Binding constraints

- **C1** — The transition set is exactly 5,040. Landed text must not state "5,040 plus Family B's 90" or any variant; Family B's crossings are phase-distance 0 and are classified as same-phase bridges within the seam story.
- **C2** — The frozen gate contains no phase-relative scalar-field conservation check. Landed Policy-v3 text must not claim or imply such enforcement; drift language stays audit-shaped (record-only).

Both constraints are present verbatim, as required. C2's absence check is mechanical: the frozen gate source contains no conservation, scalar-field, drift, or phase-relative token in the gate body.

## 7. Case 501 re-run

No outcome was pre-declared. The case was re-run through the v3 policy and is unchanged: REJECT `ungoverned-transition`.

The candidate (501@11) is a boundary state; the current (2771@11) is office-supported; the phase delta is 0; there is no R1/L1 row from 2771 to 501; 501 is not a Family B partner of 2771. The firing rule path is the boundary REJECT at `mvp2.py:183-184`. Classification: still-ungoverned. Scope: licensed-seam.

The case is not a licensed edge in the v3 set. Contrast: a licensed boundary entry (1001@0 → 501@1 via R1) is accepted, showing that boundary reachability from a licensed seam is unchanged. The receipt is `plv3_receipt_case501.json`.

## 8. Evidence lineage note

The boundary-strictness ear approvals from MVP-2c are valid post-cadence-fix only. Live-mode veto rests were imperceptible at the default speed before the cadence fix; the fix introduced `ORRERY_BRIDGE_DWELL_MS` (live default 1500 ms; smoke 0; `mvp2.py:733`). The ear approvals cited in this registration are evidence-dependent on that tool fix. Recorded, not re-adjudicated.

## 9. Typology check

Every claim in this registration is finite/combinatorial: counts, set identities, integer sums, and exact rational means. No landed sentence faces continuous mathematics. The expected typology finding is none. The freeze report records the check against the registered typology document by path.

## 10. Freeze, receipts, and hash

The registration freezes once. The combined entry's content hash covers α+β+γ+δ and is announced by `freeze_report_v3.json`; the substrate's own hash coexists as a pinned input and implies no intermediate state. Receipts are filed once:

| Receipt | Content |
|---|---|
| `plv3_receipt_pcsum_23.json` | Novel value 23; witnesses 223, 319; method and value-set context. |
| `plv3_receipt_pcsum_24.json` | Novel value 24; witnesses 239, 351, 575. |
| `plv3_receipt_pcsum_48.json` | Novel value 48; witnesses 3809, 3921, 3977. |
| `plv3_receipt_pcsum_49.json` | Novel value 49; witnesses 3937, 3985. |
| `plv3_receipt_boundary_exits.json` | 128 exit rows, 104 distinct source masks, 64 R1 / 64 L1; row receipts. |
| `plv3_receipt_boundary_entries.json` | 128 entry rows, 104 distinct target masks, 64 R1 / 64 L1; row receipts. |
| `plv3_receipt_crossphase_census.json` | E1 census: 420 applications, 5,040 lifted edges, 2,520 raised / 2,520 lowered; Family B excluded and named. |
| `plv3_receipt_familyb_classification.json` | E2 classification: 42 pairs / 90 crossings, phase-distance 0, same-phase bridges, 0 boundary-touching pairs. |
| `plv3_receipt_beta_supersession.json` | β supersession and alias-resolution record (all three legs). |
| `plv3_receipt_nonvacuity.json` | γ two-tier non-vacuity demonstration. |
| `plv3_receipt_case501.json` | 501 re-run, firing path, classification, scope, contrast. |

The expanded data artifacts are `frozen_seam_substrate_v3.json` (expanded frozen substrate) and `seam_legal_moves_v3.json` (expanded legal-moves catalog). The freeze report pins every input and receipt.

## 11. Out of scope

- Orrery extension for Phase 0 full-grid navigation: separate tooling item, no policy dependency.
- Phase-unlock declarations (Phases 1–11): not granted by declaration. What the licensed set unlocks per phase is determined empirically by the post-landing sweep.
- MVP-3 (LLM proposer, corpus calibration, energy benchmark): remains gated on Policy-v3 stability.
- Gate logic changes beyond admissible-set data expansion.
- Scalar-field veto machinery.
- Any repository write, orrery change, or tag.

## 12. Stop rules

Any Section 1 evidence mismatch stops the session; no improvisation. Any step the realm's conventions cannot express stops the session with a convention-gap report. Disputes arising during the session are recorded, scope-labeled, and not adjudicated here. The post-landing sweep is the only outstanding receipt-level check; its divergence fires α's falsification shape and stops without in-session correction.

## 13. Non-claims

This registration codifies exercised practice. It admits no canon, makes no framework verdict, grants no execution authority beyond the licensed transition set, and amends no prior policy. The 12×7 grid, Family A/B, the office palettes, and the 41 remain authored choices and candidate structures. The scratch realm's receipts are not canonical evidence. Session prose is context, not evidence.
