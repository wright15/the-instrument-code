# MVP-7 Ear Validation Protocol — Log-Spectral Lens, Cadential Benchmarks, and the Intention A/B

Directive `MVP7-INTENTION-DIR-1` rev 1 · scratch realm
`/home/erick/workspace/scratch-governed-loop-run/mvp7_intention/` · landing `L27`.

Layer: `SPEC-001 §1.3 overlay dynamics` · `gov517_correspondence_claimed: false` ·
`still_set_label: still_set`. This is a pre-registered listening protocol and a
Modality 2 measurement report. It makes no canonical or physical causation claim.
The guard flags `causationClaim: false`, `physicalQuantityClaim: false`,
`tierClassifier: false`, `globalCHNull: true` travel with every number below.

**Ear-gate status: PENDING_HUMAN.** No listener verdict has been authored by the
agent. `task-0/ear_baseline_scorecard.json` and `task-d/blind_manifest.json` stay
unsigned until Erick listens.

## 1. Measurement lens

- Coordinate: `log2(f / 440 Hz)`, the logarithmic/geometric coordinate where L22
  proved the container sums achromatic.
- STFT: 4096-sample Hann, hop 1024 at 44.1 kHz; power-weighted log-spectral
  centroid and spread per window; equal-weight mean per 300 ms region, bar, and
  section. No entropy, no `C_H`, no perceptual model.
- Inputs are the six pinned WAVs (L21 reset/carried, L23, L24, L25, L26).

## 2. Predeclared instrument bets

| Bet | Claim | Observed | Verdict |
|---|---|---|---|
| A1 Q2 calibration | quiet→climax log-centroid gap in 0.60–0.80 oct | **0.6414 oct** (arithmetic-protocol ratio 0.6960) | PASS (calibration) |
| A2 legato | L24→L25 delta concentrated at seams; interior < 0.01 oct | seam **0.3748**, interior **0.00486** oct | PASS |
| A2 fade | L25→L26 delta 0.0 on bars 1–54, confined to bar 55 | bars 1–54 **0.0**, bar 55 **7.06e-06** oct | PASS |
| A3 de-loop | L23→L24 delta on the 10 declared bars (+3 tails), zero elsewhere | recall **0.538**, false positive **0.0** at 0.01 oct | **FAIL as predeclared** |
| A4 carried Q | carried inter-bar variance > reset | 0.465610 vs 0.464897 (**+0.15 %**) | PASS (direction only) |

A3 diagnostic (post-hoc, not a bet): the 0.01-octave threshold is too high for
six of the thirteen declared changed units. At 0.001 octaves, recall is 1.0 and
the false-positive rate is 0.0. The localisation claim holds; the magnitude
threshold did not. The descriptor is nearly blind to amplitude-only changes:
the L26 fade moves bar 55 by only 7e-06 octaves, so the sample-domain end-cut
metric remains the correct Q8 instrument.

## 3. Q1–Q8 log-spectral table (L26 unless stated)

| Q | Section | Measured |
|---|---|---|
| Q1 | opening mirror | bar 1 home −0.665 oct; apex bar 3 **−0.215**; home bar 5 −0.684; departure bar 6 **+1.227**; apex−home **+0.450**, departure−apex **+1.443** |
| Q2 | quiet vs climax | quiet section −0.016 oct / spread 0.642; climax **+0.625** / 0.702; gap **0.641** oct |
| Q3 | the Shore | 300 ms rest at 74.7 s; 12 overlapping windows; power decays from 1274 to 2.55; last windows fall to a low residual, no hard zero |
| Q4 | return vs departure | departure +0.124 / 0.638; return +0.156 / 0.760; centroid delta **+0.032**, spread delta **+0.121** oct |
| Q5 | homecoming | bar 1 −0.665; bar 55 **−0.619**; terminal−first **+0.046** oct |
| Q6 | de-loop A/B | per-run variance L23→L24: `1453@6` 4.35e-07→1.74e-05; `623@8` 2.42e-06→1.28e-04; `379@7` 1.73e-06→1.55e-04; `1387@0` 3.30e-05→6.51e-05 |
| Q7 | legato A/B | seam mean **0.3748** / max 2.336 oct; interior mean **0.00486** / max 0.227; 1395 seam and 2636 interior windows |
| Q8 | clean ending | L25 `max|last32|` 215, last-50 ms RMS 0.01229; L26 **0**, 0.00917; bar 55 log-centroid delta 7.06e-06 oct |

## 4. Cadential benchmarks (deterministic, `llmCalls = 0`)

| Benchmark | Waypoints (governed S000) | Hops | Bars | Gate | Terminal | WAV |
|---|---|---:|---:|---|---|---|
| B1 Andalusian `i–VII–VI–V–i` | `375@11` → `1143@0` → `379@0` → `859@11` (Mars +12) → `375@11` | 38 | 45 | 100 % ACCEPT | lead pc 0 present | `78dd4d8a` |
| B2 borrowed minor `I6–iv–I` | `671@0` (has 9) → `375@0` (has 8, not 9) → `375@11` | 17 | 22 | 100 % ACCEPT | — | `02edb76a` |

Section log-centroids (octaves): B1 `[+0.678, +0.260, −0.049, +0.506, +0.652]`;
B2 `[−0.069, +0.398, +0.391]`. The cadential descent is symbolic (pitch-class
support, gate legality, lead resolution); the acoustic centroid does **not**
descend monotonically, consistent with Law 3 and the L22 warning that container
`pcSum` is not a sufficient register predictor. Seams: B1 median 3.17 / max 6.10 dB;
B2 median 3.47 / max 6.67 dB.

## 5. Intention A/B (blind-ready, unsigned)

Nine accepted LLM pieces (three free-proposal C1, six menu C2) are rendered under
the same legato + 50 ms fade law and paired with the L26 planner control in
`task-d/blind_manifest.json`. Each pair has a deterministic A/B order. Objective
log-spectral distances from the control range 0.112–0.471 octaves; the largest
separations are the C2 open-arc and C2 Andalusian pieces (0.35–0.47 octaves,
mostly centroid rise).

### Q9 — prompt realization and preference

Listen to each pair without reading the manifest. For each pair record:

| Pair | Which render better realizes the stated prompt? (A/B/tie) | Is the divergence an improvement over the planner default? (Y/N) | Confidence 1–5 |
|---|---|---|---|
|  |  |  |  |

Then answer the standing question: **does the LLM's divergence earn a place as
an intention proposer, a menu-bound guest curator, or an explainer/annotator?**

## 6. Scorecard

| Question | Listener 1 heard (Y/N) | Rating 1–5 | Notes | Listener 2 heard (Y/N) | Rating | Notes |
|---|---|---:|---|---|---:|---|
| Q1 mirror gesture |  |  |  |  |  |  |
| Q2 quiet vs climax |  |  |  |  |  |  |
| Q3 shore breath |  |  |  |  |  |  |
| Q4 return as new territory |  |  |  |  |  |  |
| Q5 voiced homecoming |  |  |  |  |  |  |
| Q6 de-loop A/B |  |  |  |  |  |  |
| Q7 legato boundaries |  |  |  |  |  |  |
| Q8 clean ending |  |  |  |  |  |  |
| Q9 intention preference |  |  |  |  |  |  |

| Field | Listener 1 (Erick) | Listener 2 (external) |
|---|---|---|
| Name | Erick |  |
| Date |  |  |
| Session |  |  |
| Overall verdict (PASS / PASS WITH NOTES / FAIL) |  |  |

## 7. Standing intention verdict (deterministic part)

- Divergence (C1 first attempts): **0.720** mean; open-arc only **0.665**.
- Free-proposal legality: first pass **0.333**, compile **0.500**, retry recovery **0.25**.
- Verified-menu legality: first pass **1.000**, compile **1.000**.
- FM1/FM2/FM4 not triggered; FM3 has no accepted open-arc C1 trial, but five of six
  C1 open-arc proposals chose `far_shore_return` (diagnostic, not a verdict).
- Acoustic bijection: 9/9 renders pass seams, end-of-file, determinism, mask, and
  boundary-dwell checks. Deconfounded lead-line tracking `r_lead > r_container`
  is **0/9** on these waypoint-driven pieces; container `pcSum` is the stronger
  predictor here. This qualifies, rather than confirms, the L22 C2 bridge for
  cadence/menu forms.
- **Provisional outcome: `CONDITIONAL_OUTCOME_2_GUEST_CURATOR_MENU_BOUND_PENDING_EAR`.**
  OUTCOME_1 is ruled out on legality (0.333 < 0.90); OUTCOME_3 is ruled out on
  divergence (0.720 > 0.10). The menu arm is legal and divergent; the ear
  preference required to finalise OUTCOME_2 is the unsigned step.

## 8. Non-claims and fences

- No entropy, no `C_H` formulation, no cochlea/cortex/perception model.
- ANCHOR_FLAT is not a linear ramp; B2 is the wrap step law, not proved by the
  log dual; ORBIT-D7 is a symbolic container coordinate.
- The descriptors measure rendered audio, not hearing; listener verdicts are human.
- No gate, Q-engine, pinned renderer, or `audio.ts` byte change; no tag or push.
- L23–L26 renders remain frozen as controls.
