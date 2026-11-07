# MVP-7 Closing Report — Log-Spectral Instrument, Cadential Benchmarks, and the LLM Intention Experiment

**Directive:** `MVP7-INTENTION-DIR-1` rev 1  
**Execution realm:** `/home/erick/workspace/scratch-governed-loop-run/mvp7_intention/`  
**Status:** SCRATCH COMPLETE; L27 working-tree landing; **ear gate PENDING_HUMAN**

## Opening fixed point and pins

- Opening HEAD: `865abc8be20483e45176c378c4e078ebd3187c26` (tree clean)
- Decision ledger before: `43a529af...` / 398,051 B / 4,348 lines
- Manifest before: `a0ac68b9...` / 1,684 files / 177,672,713 B
- Release closure before: PASS / 418 / 0
- Pins verified: 26/26 SHA-256 and byte counts; `mvp2.py` anchors 11/11
- Strong core: 3,204 reachable / 2,928 in S000 / 276 one-way; 2,388 governed S000 nodes
- Predeclaration locked before evaluation: `0e64b09f...` (one pre-execution
  description correction to the A3 changed-bar list, and one pre-execution
  model/prompt amendment; no thresholds changed)

## Task outcomes

| Task | Receipt | Outcome |
|---|---|---|
| T0 | `qa/mvp7_task_0_receipt.json` | fixed point, 26 pins, 11 anchors, strong core, predeclaration lock, ear gate left unsigned |
| TA | `qa/mvp7_task_a_receipt.json` | log-spectral lens over 6 WAVs; 4/5 bets pass; A3 fails as predeclared but localises perfectly at 0.001 oct |
| TB | `qa/mvp7_task_b_receipt.json` | Andalusian (45 bars, 38 hops) and borrowed-minor (22 bars, 17 hops) compile and render; both PASS |
| TC | `qa/mvp7_task_c_receipt.json` | 9 accepted intentions (3 free C1, 6 verified-menu C2); free legality 0.333 first pass / 0.500 compile |
| TD | `qa/mvp7_task_d_receipt.json` | 9 renders; seams 9/9, end 9/9, determinism 9/9; lead-tracking check 0/9 |
| TE | `qa/mvp7_task_e_receipt.json` | protocol, blind manifest, closing report, landing receipt |

## What the lens found

- A1 Q2 calibration: **0.6414 octaves** (protocol arithmetic ratio 0.6960) — pass.
- A2 legato: seam **0.3748** vs interior **0.00486** octaves — pass; the change is
  localised at bar boundaries.
- A2 fade: bars 1–54 exactly **0.0**, bar 55 **7.06e-06** octaves — pass. The lens
  is nearly blind to an amplitude-only fade; the sample-domain end-cut metric is
  the right Q8 instrument.
- A3 de-loop: **FAIL as predeclared** (recall 0.538 at 0.01 oct); diagnostic at
  0.001 oct gives recall 1.0 and false-positive 0.0. The delta is confined to the
  declared bars; the magnitude threshold was too high.
- A4 carried Q: direction passes, but the uplift is only **0.15 %**; the effect is
  weak and is reported as direction-only.
- Q6: all four de-loop runs show higher L24 variance than L23, as intended.
- Q7: legato localises at seams; Q8: the L26 file ends at zero.

## Cadential benchmarks

Both benchmarks are legal inside the governed strong core: every waypoint supports
its required pitch classes, every hop is gate ACCEPT, every rendered bar is in-mask
with no boundary dwell, and the Andalusian terminal bar emits the tonic lead pc.
The cadence is symbolic: section acoustic centroids do **not** descend monotonically
(B1 `[+0.678, +0.260, −0.049, +0.506, +0.652]`), which is consistent with Law 3 and
the L22 warning that container `pcSum` is not a sufficient register predictor.

## LLM intention experiment

- **Divergence (free C1 first attempts): 0.720 mean; open-arc only 0.665.** The
  choices diverge from the planner defaults at the intention level.
- **Free legality: 0.333 first pass, 0.500 compile, 0.25 retry recovery.** The
  open-arc proposals are the failure class: the model requests constraint
  intersections (dispersion × orbit × phase × pitch classes × band) that S000
  does not contain. Borrowed-minor is legal 2/2 first pass; Andalusian 1/2 by retry 2.
- **Verified menu: 1.000 first pass and compile.** The same model selects legal
  nodes when the compiler enumerates feasibility. This is the neurosymbolic
  headline: the interface, not the model's free proposal, carries legality.
- **Failure modes:** FM1/FM2/FM4 not triggered. FM3 cannot be scored on accepted
  open-arc C1 plans (none compiled); at proposal level, 5/6 open-arc attempts chose
  `far_shore_return` — a diagnostic, not a verdict.
- **Acoustic bijection:** 9/9 renders pass determinism, seams, end-of-file, mask,
  and boundary-dwell checks. Deconfounded `r_lead > r_container` is **0/9** on these
  waypoint-driven pieces; container `pcSum` is the stronger predictor here. This is
  a qualification of the L22 C2 bridge for cadence/menu forms, not a confirmation.
- **Cost:** 25 valid-run calls, 209 s transport, **$0.02624**; including the voided
  parser run, 53 calls and **$0.05631**. The planner is 0 calls / $0.
- **Ear gate:** `task-0/ear_baseline_scorecard.json` and `task-d/blind_manifest.json`
  are `PENDING_HUMAN`; no verdict was authored.

## Instrument corrections (recorded, no claims made)

1. A3 changed-bar list was mistranscribed before evaluation and corrected to the
   landed MVP-6.1 `expected.changedBars`; no threshold changed.
2. The first Task C run was voided by a JSON root-extraction defect (28 calls,
   `$0.03007`); transcripts are preserved under `task-c/void_parser/`. The parser
   was fixed and the arm re-run.
3. The locked open-arc task text deterministically triggers the provider content
   filter inside the C2 preamble (3/3 `ContentFilterError`, zero output). The two
   open-arc C2 trials were re-run with a semantically equivalent, provider-safe
   paraphrase; the paraphrase is recorded in the receipt.

## Standing verdict

- OUTCOME_1 (`INTENTION_PROPOSER`) is ruled out on legality: 0.333 first pass /
  0.500 compile, below the predeclared 0.90.
- OUTCOME_3 (`EXPLAINER_ANNOTATOR_ONLY`) is ruled out on divergence: 0.720 > 0.10.
- **Provisional: `CONDITIONAL_OUTCOME_2_GUEST_CURATOR_MENU_BOUND_PENDING_EAR`.**
  The menu-bound guest curator is the only outcome consistent with the deterministic
  evidence. Final selection requires the unsigned Q9 ear preference.

## Fences

- No gate, census, ground-truth, seam-substrate, Q-engine, encoder, pinned renderer,
  legato renderer, fade renderer, or `audio.ts` byte change; Orrery is read-only.
- Photonic layer overlay-only; `causationClaim: false`, `physicalQuantityClaim: false`,
  `tierClassifier: false`, `globalCHNull: true`; `C_H` unresolved.
- No entropy, no `C_H` formulation, no perception/biology claim.
- L23–L26 renders and receipts remain frozen as controls.
- Scratch tasks made zero repository writes. L27 is a separate authorized working-tree
  landing followed by one dedicated commit; no tag, no push.

## Terminal verdict

```text
MVP7-INTENTION-SPRINT-CLOSING
FIXED-POINT: 865abc8... / TREE CLEAN / L26 43a529af... / 398051 B / 4348 lines
PINS-VERIFIED: 26/26 MATCH / ANCHORS 11/11 MATCH / PREDECLARATION-LOCKED TRUE
TASKS: T0 COMPLETE | TA COMPLETE | TB COMPLETE | TC COMPLETE | TD COMPLETE | TE COMPLETE
LENS: Q2 GAP 0.6414 OCT / LEGATO SEAM 0.3748 VS INTERIOR 0.00486 / FADE BAR55 7.06E-06
BETS: A1 PASS | A2 PASS | A2-FADE PASS | A3 FAIL-AS-DECLARED (0.538, FP 0.0) | A4 PASS-WEAK
CADENCES: B1 45 BARS / 38 HOPS / PASS | B2 22 BARS / 17 HOPS / PASS
LLM: 9 ACCEPTED / DIVERGENCE 0.720 / C1 LEGALITY 0.333 FIRST-PASS / C2 LEGALITY 1.000
ACOUSTIC: SEAMS 9/9 / END 9/9 / DETERMINISM 9/9 / LEAD-TRACK 0/9
COST: 25 VALID CALLS / $0.02624 / 53 CALLS INCLUDING VOID / $0.05631
EAR-GATE: PENDING_HUMAN / OUTCOME CONDITIONAL_2_PENDING_EAR
FENCES: GATE-UNTOUCHED / C-H-NULL / LLM-CALLS 25 / REPO-WRITES 0 (scratch)
STATUS: COMPLETE
```
