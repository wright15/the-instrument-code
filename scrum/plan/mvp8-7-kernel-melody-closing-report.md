# MVP8.7 kernel-only melody — closing report

**Directive:** `MVP8.7-KERNEL-MELODY-DIR-1` rev 1 (ENDORSED, 2026-11-16).
**Base:** L35 `d724de62c1675cb0062f199f0bf80d6fb823a047`.
**Outcome:** `ADOPT`. K1–K5 pass and the ear gate is signed (2026-11-16).

## The change

One conditional in `PentatonicEngine.project()`:

```
- elif orbit_index is not None and 0 <= orbit_index <= 4:
+ elif orbit_index is not None:
```

`_snap_pc` is byte-identical; the Q row, focal resolution, initiation, the
still-set branch, the dyad partner rule, the card, F-term, P-term, the gate,
census, encoder, planner, and renderer law are untouched. The diff artifact is
`mvp8_7_task_a_diff.patch`
(`d845daae5a0544a1b32c4cb587ad9d8fa993b67a87b3b7c8223080b8d0699bed`).

## Predeclared bets

| Bet | Bar | Measured |
|---|---|---|
| K1 dwell | 3,696 nodes, 44,352 steps, 0 outside focal | 44352 steps, 0 outside — PASS |
| K1 transit | 440 pairs, 2-bar chains, 0 outside focal | 440 pairs, 7480 steps, 0 outside — PASS |
| K2 row invariance | 0 identity mismatches; only modal-color rows change | 0 mismatches; 202 changed rows — PASS |
| K3 render reproduction | four WAV shas exact | 4/4 exact — PASS |
| K4 dyad invariants | 36/36 on each render, 0 leaks | 36/36 on 4/4; 0 leaks — PASS |
| K5 zero modal color | 0 under MVP8.7 build outputs | 0 — PASS |

K5 scope excludes the T0 L35 control baselines, the Arm (i) L35 tail control,
and the K2 diff metadata that records the L35 side of each transition.

## Fences and audits

Task C passed the diff-scope audit, `_snap_pc` byte check, engine source
identity, Q-table identity, fenced-file pins, float scan, `harmonic.C_H` null
check, Q-unadmitted posture check, 0-LLM attestation, K4, and K5. Menu order
(phase-root, head-contained, canonical) and snap-distance position bias are
reported in the Task C receipt. Zero symbolic floats; zero LLM calls.

## Ear gate (SIGNED, 2026-11-16)

Erick's signed verdict, verbatim:

> the melodies all sound to match the harmonies, the different melody steps that happen are audible and all work

All three arms: adopt.

- Arm (i): strict vs tail A/B on the 2741 plagal.
  strict `5b876c9e1147a10d9904fdfbadd882431bcf061220d7989dafda60fe40566ac1`;
  tail `f510ad93d82f4df5100a4b817d7044a91b2bf819fdd380a946a29c135c387cbd`.
- Arm (ii): strict 20-step default traversal from 1387@0.
  WAV `46336975701982b457ed553d7f16af7d93fe32abc001f7cfc86d953ff2dabbdb`.
- Arm (iii): strict Lydian + Mixolydian plagal pair.
  Lydian `b5865ce19c89c02b9816d14d08e26afc24a09011918b6aa8d7f5e960ec902e8b`;
  Mixolydian `afbe5670ed1c45e0f7187b8589879d682505126e544cefd7ba43434751f1b223`.

No listener field is authored by the agent; the verdict is transcribed
verbatim from Erick's signed listening session.

## Consequences recorded

- MVP-9 §5.1 must be re-authored: the modal-color tail duration row
  (150/200 ms) no longer has a runtime population; snapped tail positions
  take its place.
- The other 9 snap equivalence classes remain explored-and-not-chosen.
- Motifs, counterpoint, and duration governance remain after the pitch
  vocabulary and MVP-9.
- No admission: the Q engine, bands, weights, and card remain unadmitted;
  `harmonic.C_H` remains null.

## Landing

The guarded lander is `mvp8_7_land.py`. It refuses without
`--authorize-mvp8-7` and a signed ADOPT ear gate. Landing is one commit on the
review branch; no push, no tag.
