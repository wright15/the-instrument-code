# ORRERY-NAV-1 — FULL 12-PHASE ORRERY NAVIGATION TOOLING

**Directive rev 2.1 — paste-ready — status: rev 2 passed maintainer review label-by-label (C1/C2/H1/H2/M1–M3/L1–L2, all PASS; skeleton holds as cut). Amendments A1–A4 folded per that review — no architecture change, no D1/D2 change, no fence change. Dispatch awaits exactly one gate: the maintainer's D-3 ruling. Plan mode remains active on the seated side; no implementation has run.**

## §0. Provenance, decisions, and authority

1. This is revision 2.1 of the ORRERY-NAV-1 directive: rev 2 plus the review amendments recorded in §0.6. It supersedes the rev-1 draft and unamended rev 2 in full; surviving material is restated here, never inherited by reference. The document is self-contained: no instruction-inheritance pins.
2. Two open decisions from the rev-1 review are closed by maintainer ruling, and this revision is cut to those rulings:
   - **D1 — Frontend mechanism: (b) bridge-injected overlay.** Rationale on record: preserves the zero-orrery-change precedent exactly; MVP-2b established the Playwright channel as the legitimate display path with the "authored choices, no canonical claim" posture intact; a realm-hosted parallel UI would create a second surface that can drift from the orrery's grid and palettes and would need its own canon-adjacency discipline — new scope, not tooling.
   - **D2 — Endpoint accounting: (a) split endpoints.** Rationale on record: keeps the "exactly 5,130" fence load-bearing on exactly one object; no partition ambiguity, no subtotal bookkeeping; Tier-1 is rule-computed per node, not a fixed global set, so it takes a sibling endpoint whose count is derived at opening.
3. Policy backdrop (landed, in force): Policy-v3 registration, four decisions α/β/γ/δ in one combined entry — α: licensed cross-phase transfer set exactly 5,040 lifted edges (2,520 raised / 2,520 lowered), teleportation forbidden, v2-P4 retained as mechanical backstop, Family B's 90 outside the set; β: supersession effective, `seam_legal_moves_v3.json` = 5,130 moves (5,040 Family A + 90 Family B) is the current legal-moves authority; γ: 128 + 128 boundary rows licensed, transit-only (reachable-via-seam / escapable-only-via-seam / never-govern / no-camping); δ: drift stays record-only audit.
4. This directive authorizes display-and-navigation tooling only. It executes no policy change, files no new invariant, and tightens nothing δ holds open. Realm-side writes (new module, report artifacts) are the only writes permitted; repo writes are forbidden outright (H1).
5. One disposition remains open and is the single remaining dispatch gate: **D-3** (§3) — the rev-1 "Tier 2 transit" partition's endpoint home, awaiting the maintainer's ruling. The rev-2 review confirmed D-3 is properly flagged for maintainer review rather than smuggled in.
6. **Amendment record** (maintainer rev-2 review — verdict: all labels PASS; four one-line amendments folded):
   - **A1** (review item 1 → §4): census anchor named — realm `census_462.json` payload is the primary byte source; repo `frozen_ground_truth.json` is the correspondence anchor.
   - **A2** (review item 2 → §5 Task C.4, §6 L1, §3 table note): Family B conformance mapping — each of the 42 pairs, both directions, at all 12 phases = 1,008 gate queries, all ACCEPT; the 90-crossing count is verified from catalog + substrate bytes, not through the gate. The undifferentiated "all 5,130 fed through the gate" phrasing is replaced (the 90 crossings are not direct gate queries).
   - **A3** (review item 3 → §7.5, §3 derivation note): a Tier-1 live-derivation mismatch against the 18,984 expectation is a STOP with the mismatch recorded — never a quiet resolution; the verdict line cannot be read as forcing agreement.
   - **A4** (review item 4 → §3 `/api/nodes` row): source rephrased as census + substrate bytes so the source description matches the derivation.

## §1. Objective and posture

Extend the orrery front-end to full 12-phase navigation over the landed Policy-v3 legal surface, through a read-only bridge, holding all of the following intact for the entire arc:

- **Zero repo writes.** The repo stays read-only; HEAD and tree state are recorded at opening and must be identical at close.
- **Zero orrery changes.** The orrery's 12×7 grid, office palettes, and sounding surface are authored choices living repo-side; the overlay drives them without touching them.
- **Authored choices, no canonical claim.** The overlay is a display path over existing surfaces, not a second authority. Counts and move classes it displays are fetched live from the §3 endpoints; it asserts nothing of its own.
- **The gate is the only oracle.** Every accept/reject the tooling reports comes from the frozen gate, imported as a library. No client-side reimplementation of legality exists anywhere in the stack.

## §2. Architecture (D1: bridge-injected overlay)

Three layers, strictly:

1. **Overlay UI — injected, not hosted.** The navigation UI is injected into the existing orrery page through the established MVP-2b Playwright bridge channel. It is not a realm-hosted parallel page. It expresses the 84-cell torus aggregation view, three-state move highlighting mapped 1:1 to the §3 move endpoints, and move-event triggering of the existing sounding surface. It bakes no data (H2) and makes no canonical claims.
   - **Expressibility guardrail (D1):** at opening, the build session verifies the overlay can express the 84-cell torus view plus three-state move highlighting on the live page. If it cannot, that is a convention-gap STOP with a report — not a license to improvise a parallel surface mid-session.
2. **Read-only bridge — `orrery_nav_bridge.py` (new realm-side module).** Imports the frozen gate as a library (C1); serves the §3 endpoints and nothing else; exposes no write route of any kind (no POST/PUT/DELETE exists). Port is a declared run parameter, not a baked constant (L2).
3. **Pure-integer ontology gate — `mvp2.py` (repo, untouched).** Registration-frozen; byte-identical across the whole arc (C1). Anchor lines, verified at opening and cited by the report from bytes: `mvp2.py:150-154` self-transfer veto; `mvp2.py:169` same_root; `mvp2.py:171-172` v2-P4 (the Tier-1 rule); `mvp2.py:183-184` boundary REJECT path; `mvp2.py:733` `ORRERY_BRIDGE_DWELL_MS` (live 1500 / smoke 0).

## §3. Endpoint accounting (D2: split endpoints)

Four read-only endpoints. Every count is derived at opening from pinned bytes; none is assumed; nothing is baked (H2). The rev-1 draft's §5.3-style exactness fence attaches, from here forward, to the seam catalog alone — this resolves the rev-1 internal collision cleanly.

| Endpoint | Object | Count discipline |
|---|---|---|
| `GET /api/nodes` | The lifted node catalog, every node identified mask@phase — **derived from census + substrate bytes** (A4): the 462 masks come from census bytes; seam context comes from `frozen_seam_substrate_v3.json` | Derived at opening as **462 × 12**; expectation **5,544**. The substrate's landed characterization is its own sha256, not this count (H2). |
| `GET /api/legal-moves` | The seam catalog from `seam_legal_moves_v3.json` — this object alone carries the exactness fence | **Exactly 5,130 = 5,040 Family A + 90 Family B**, verified from catalog bytes at opening. No partitions, no tier labels, no subtotals inside this payload. Family B's 90 entries are crossing records (pair + shared subnode), not phase-resolved moves — the gate-query mapping is Task C.4 (A2). |
| `GET /api/tier1-moves` | Tier-1, computed live per node by the gate-as-library: same_root + same phase (`mvp2.py:171-172`) | Count derived at opening, never assumed. Cross-check expectation only — not a pin, not landed: **18,984 = 12 × familySizeSquares = 12 × 1,582**, since Tier-1 accepts every same-family same-phase pair including self. Stated here only so the opening protocol knows what to recompute (H2). |
| `GET /api/boundary-transit` | The γ boundary surface, transit-only, served from substrate bytes | Count derived at opening; expectation **256 = 128 + 128** licensed boundary rows, each carrying the γ semantics verbatim: reachable-via-seam / escapable-only-via-seam / never-govern / no-camping. |

**D-3 (open — the single remaining dispatch gate):** the rev-1 draft's "Tier 2 transit" partition is served by its own endpoint rather than folded into either split endpoint. Rationale: the boundary surface is a fixed licensed set from pinned substrate bytes (catalog-like, so not a Tier-1 sibling), and it is not part of the 5,130 catalog (so not `/api/legal-moves`); folding it into either would recreate the partition ambiguity D2 removes. This home awaits the maintainer's ruling; if the maintainer prefers a different home, that is a one-block amendment before dispatch.

**Display-class naming (L2):** the rev-1 labels "Tier 2" and "Tier 2 transit" are retired; the three highlighted move classes are named endpoint-aligned: **tier-1 / seam-catalog / boundary-transit**.

**Tier-1 derivation note:** the gate's self-transfer veto (`mvp2.py:150-154`) and the "including self" clause of the 18,984 expectation are both statements about gate behavior; the gate-as-library output is the authority. If the live derivation disagrees with the expectation, that disagreement is a STOP under §7.5 — recorded in the verdict block, never quietly resolved; the gate is never adjusted and the expectation is never adjusted to force agreement (A3). If the mismatch traces to gate semantics, it takes the Policy-v3 falsification shape: STOP, escalate.

## §4. Grounding and pins

Load-bearing objects, sha256-pinned at first use; full digests are recorded at opening from realm bytes; the prefixes below are registration-record anchors for correspondence:

- `mvp2.py` — repo gate source (C1). No prefix stated here: the opening pin is the reference; the close re-pin must match it byte-for-byte.
- `policy-v3-registration.md` — prefix `48290a2f` (14,964 B / 142 lines at registration).
- `frozen_seam_substrate_v3.json` — prefix `9f9818ef` (source of the lifted node space and the boundary rows).
- `seam_legal_moves_v3.json` — prefix `e6cf62a8` (the 5,130-move seam catalog).
- `freeze_report_v3.json` — prefix `1c65a07c`.
- `plv3_receipts_manifest.json` — prefix `461a16b0` (registered probe set for §5 Task C and §7 conformance).
- The 462 census (A1): **realm `census_462.json` payload — primary byte source** for the 462 masks; repo `frozen_ground_truth.json` — **correspondence anchor only**, per the landed evidence hierarchy (realm bytes primary, repo files correspondence). The lifted space is census + substrate derived, never census-baked (H2).
- `154` — landed boundary figure from the registration record; carried in rev 2 only as a correspondence anchor. Any structural use in the bridge derives from substrate bytes at opening.

Prefix mismatch at opening = STOP before any endpoint work. This grounding list satisfies L2's requirement that §4 name mvp2.py plus the registration/freeze-v3 pins.

## §5. Tasks

**Task A — Bridge endpoints.** Implement §3 as four read-only endpoints on `orrery_nav_bridge.py`, gate imported as a library, `mvp2.py` untouched. Payloads reference nodes as mask@phase throughout (L2). All four counts are derived at opening from pinned bytes and recorded in the report. No write route exists on the bridge.

**Task B — Overlay display.**
- 84-cell torus view: stated explicitly as an **aggregation view over the 5,544-node catalog** (12 × 7 = 84 cells), never a baked grid (H2, L2).
- Three-state move highlighting, mapped 1:1 to the split move endpoints: tier-1 (`/api/tier1-moves`), seam-catalog (`/api/legal-moves`), boundary-transit (`/api/boundary-transit`).
- Lifted-edge wording (M1): the Family A surface is described as **raised images 2,520 = 210 × 12** and **lowered 2,520**. No ±1 phase-delta shorthand anywhere in UI or report; the R₁+1/L₁-1 notation stays excluded.
- Audio: the overlay triggers the existing repo-side sounding surface on move events; it does not redefine, re-synthesize, or re-map it.
- V₄/Klein-4/M₅/T₆ vocabulary: absent from rev 2 unless grounded in Q-engine source at opening (M2).

**Task C — Smoke: `mvp2_orrery_nav_smoke.py`.** Run parameters (port, K, dwell) are declared before the run and recorded in the report; once declared, they are locked for the run.
1. Full-phase navigation: all 12 phases traversed over the legal surface, decisions from the gate-as-library only.
2. Intra-family walk: Q-engine same-family walk of K steps, K a declared run parameter with **K ≥ 2**; smoke profile runs K = 5.
3. Boundary transfer replay: `1001@0 → 501@1` through the gate-as-library → ACCEPT (FamilyA:R1).
4. Conformance (L1), two legs (A2): **Family A** — all 5,040 phase-resolved seam moves fed through the gate-as-library, every one ACCEPT. **Family B** — each of the 42 crossing pairs, both directions, at all 12 phases: **1,008 gate queries, all ACCEPT** (catalog shape, verified from catalog bytes at opening: 30 pairs sharing 1 subnode + 12 pairs sharing 5 subnodes = 90 crossings across 42 pairs; the 90-crossing count itself is verified from catalog + substrate bytes, not through the gate). Plus the registered negative/positive probe re-runs enumerated from `plv3_receipts_manifest.json` bytes, including at minimum: licensed exit `493@0 → 247@1` → ACCEPT; non-seam escape → REJECT (`mvp2.py:183-184` path). Any disagreement anywhere takes the Policy-v3 falsification shape: STOP, escalate.
5. Audio emission mechanics only, at dwell 0 (`ORRERY_BRIDGE_DWELL_MS` smoke value; `mvp2.py:733`): tones fire on move events; no perceptual claims. Perceptual quality remains a live-mode ear step (MVP-2c cadence finding) and is out of smoke scope (M3).
6. Console: zero ERROR lines across the entire smoke.
7. Output: `orrery_nav_report.json` (machine-readable counterpart of §8) plus the closing report.

## §6. Constraint set (rev-2 review: C1/C2/H1/H2/M1–M3/L1–L2 all PASS; A-marked lines carry the review amendments)

- **C1 — Gate isolation.** `mvp2.py` is registration-frozen; it is not extended in place. New realm module `orrery_nav_bridge.py` imports the frozen gate as a library. `mvp2.py` stays byte-identical: sha256 pinned at opening, re-pinned at close; any anchor drift = STOP. The gate anchor lines (§2.3) must not shift.
- **C2 — Endpoint accounting (resolved by D2a).** Split endpoints. The "exactly 5,130" fence is load-bearing on exactly one object: `/api/legal-moves` = the seam catalog (5,040 Family A + 90 Family B). No partition ambiguity, no subtotal bookkeeping. Tier-1 is rule-computed per node (same_root + same phase), not a fixed global set, so it takes the sibling endpoint `/api/tier1-moves` with its count derived at opening, never assumed.
- **H1 — Surface integrity (resolved by D1b).** Bridge-injected overlay is the only display path; zero repo writes; zero orrery changes; no realm-hosted parallel surface, and mid-session improvisation of one is a STOP, not a fallback. Convention-gap on overlay expressibility = STOP with report.
- **H2 — Derived-count discipline.** `5,544 = 462 × 12` is a derived node-grid count, not a landed characterization of the substrate's contents; `18,984 = 12 × 1,582` is a derived cross-check, not a pin. Both are recomputed at opening from familySizeSquares / census / substrate bytes, never trusted from any message. Zero code baking: nodes, moves, Tier-1 surface, boundary rows — nothing is baked into static bundles; everything is served live from pinned artifacts.
- **M1 — Lifted-edge wording.** Raised images 2,520 = 210 × 12; lowered 2,520. No ±1 phase-delta shorthand anywhere.
- **M2 — Derive-at-opening assumptions.** Office count (expectation 7), GOVERNS edge count (expectation 238), and the V₄/Klein-4/M₅/T₆ vocabulary: all derived at opening from source bytes, never asserted. The vocabulary stays out unless grounded in Q-engine source.
- **M3 — Audio scope.** Smoke verifies emission mechanics at dwell 0 only; perceptual quality stays a live-mode ear step per the MVP-2c cadence finding.
- **L1 — Governance scaffolding.** Opening protocol + fixed point (§7); STOP rules (§7.5); closing verdicts (§8); catalog↔gate conformance criterion, two legs per A2: Family A 5,040 direct gate ACCEPTs + Family B 42 pairs × 2 directions × 12 phases = 1,008 gate ACCEPTs (90-crossing count verified from bytes), plus the registered negative/positive probe re-runs; any disagreement fires a Policy-v3 falsification → STOP, escalate.
- **L2 — Vocabulary and configuration.** mask@phase node vocabulary throughout (rev-1 `anchoredId` naming retired); parameterized K (≥ 2) for the intra-family walk; port as declared parameter; 84-cell torus stated explicitly as an aggregation view over the 5,544-node catalog; §4 grounding lists mvp2.py plus the registration/freeze-v3 pins.

## §7. Opening protocol

Performed read-only, before any implementation. The report opens with the fixed point (task ORRERY-NAV-1, directive rev 2.1 — pinned from the received text; mode: read-only tooling build; repo HEAD, tree state, and ledger line recorded; zero-repo-write posture declared) and records:

1. **Pin re-verification:** full sha256 of every §4 object from realm bytes; correspondence against the §4 prefixes. Mismatch = STOP before any endpoint work.
2. **`mvp2.py` opening pin** recorded; anchors inspected from bytes: `:150-154`, `:169`, `:171-172`, `:183-184`, `:733`.
3. **Derived counts, recomputed from bytes — never trusted from this message.** This is the carried obligation: the Tier-1 global cross-check and the node-grid count are both derived numbers, and the opener recomputes them from familySizeSquares / census bytes rather than trusting this message — that is what keeps the registration discipline intact across the tooling boundary:
   - node grid: **5,544 = 462 × 12** (census + substrate bytes);
   - seam catalog: **5,130 = 5,040 + 90** (catalog bytes);
   - Tier-1 global: recomputed live via gate-as-library; cross-check expectation **18,984 = 12 × familySizeSquares** (familySizeSquares recomputed from family bytes, expectation 1,582; includes self-pairs per the gate rule; see §3 derivation note);
   - boundary transit: expectation **256 = 128 + 128** (substrate bytes);
   - offices: expectation **7**; GOVERNS edges: expectation **238** (both derived, not asserted).
4. **Overlay expressibility check (D1 guardrail):** 84-cell torus view + three-state move highlighting on the live page. Failure = convention-gap STOP with report.
5. **STOP rules in force for the whole arc:** any pin mismatch; any `mvp2.py` byte drift at open or close; any conformance disagreement (L1); any overlay expressibility failure; any repo write attempted or required; any count that can only be asserted and not derived from pinned bytes; **a Tier-1 live derivation that mismatches the 18,984 cross-check expectation — STOP with the mismatch recorded in the verdict block; the gate and the expectation are never adjusted to produce agreement, and if the mismatch traces to gate semantics it takes the Policy-v3 falsification shape: STOP, escalate** (A3). A STOP halts the arc and reports; no step runs past a fired STOP.
6. **Ledger note:** the deferred full-regen posture remains valid only while repo writes stay zero; the zero-repo-write fence (H1) is what carries it.

## §8. Closing report and verdict block

The closing report begins with the fixed point and ends with the machine verdict block — no trailing prose after it. `orrery_nav_report.json` carries the machine-readable counterpart. Verdict lines:

```
ORRERY-NAV-1-VERDICT: PASS
STOP-RULE-FIRED: none
NODES: 5544/5544 MATCH
SEAM-CATALOG: 5130/5130 MATCH
TIER1-DERIVED: 18984 EXPECTATION 18984 MATCH
BOUNDARY-TRANSIT: 256 EXPECTATION 256 MATCH
CONFORMANCE-5130: EXHAUSTIVE-ACCEPT
PROBES: 7/7 MATCH
MVP2-BYTE-IDENTICAL: TRUE
OVERLAY-EXPRESSIBILITY: VERIFIED
CONSOLE-ERRORS: 0
BAKE-CHECK: CLEAN
REPO-WRITES: 0
ORRERY-CHANGES: 0
```

A PASS requires every MATCH / TRUE / VERIFIED / CLEAN / 0 line to hold; any single miss — including TIER1-DERIVED MISMATCH, which is a fired STOP rule per §7.5, not a value to reconcile — flips the verdict to STOP with the fired rule named.
