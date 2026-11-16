# MVP8.6 — Functional Harmony closing report

- **Directive:** `MVP8.6-FUNCTIONAL-HARMONY-DIR-1` rev 1 (endorsed 2026-11-15)
- **Base:** L34 `47dcf854d38b6dd74a136811ef2262ce400e1637` / ledger `60215f9d120a2da7383c4d7f29bad28196be4621735ca951ce9c8ac4d9737b1d` / MANIFEST 2,056 files / 303,776,202 B
- **T0 lock:** `qa/mvp8_6_task_0_receipt.json` — sha256 `26151d12ea61677eb334ed22f4d15b1f4b6dd128e4e5141a76e5bb648043820d`
- **Outcome:** `ADOPT`
- **Ear gate:** `SIGNED` (2026-11-15; sixth signed verdict)
- **Landing:** `L35`, one commit on `mvp8-6-functional-harmony` off L34

## Measured bets

| Bet | Result | Measured |
|---|---|---|
| F1 | PASS | 21 states / 3 families / 9 seams; 20/20 accepts on three arms |
| F2 | PASS | walks 19/19/18 completed 20-step arms (193/192/184 completions); Andalusian 9/20 completed arms (21; L34 control 9/20, 23) |
| F3 | PASS | deterministic greedy delta 0 states; 0 LLM calls |
| F4 | PASS | mean tier-1 F 13,704/1,095 = 12.51; locked L34 baseline 13,697/1,096 = 12.49 |
| D | SIGNED | Arm A adopt; Arm B adopt; Arm C adopt |

## Five-proposition reading

- **Valid algebraic relationship:** the card score remains integer-only; the tier-1 F-term is `F = trunc((w[degree] * a[band]) / 50)` with `D = 50` and flat `W_base = 50`; the hybrid P-term is `+50`; the degree ladder, gate, and Q advance are unchanged.
- **Predicted consequence:** the Chaldean degree hierarchy should change which tier-1 content the card chooses while preserving reach and completing the declared degree walks.
- **Observed pattern:** F1 reproduced 21 states / 3 families / 9 seams with 20/20 accepts; F2 completed the three walks in 19/19/18 of 20 completed arms and the Andalusian in 9/20; F3 matched the card with delta 0; F4 measured mean tier-1 F 12.51 against the locked L34 baseline 12.49. Disclosure: at a fixed step degree the F-term is a monotone rescaling of the A-term, so the three walk arms choose the identical tier-1 sets as the L34 control and the Andalusian arm differs by one decision; the mean-F floor passes, but the measured steering separation from the live L34 control is minimal. The requested-walk L34 control also voices the requested steps (20/20 arms); the F2 separation reading rests on the default-step incidental control (0/20).
- **Demonstrated explanation:** the L34 controls reproduce their landed anchors exactly (default-step 21/3/9 and the Andalusian 9/20; l20-exact 21/3/5; unranked 2/2/20); the hybrid matcher completes the declared walks on consecutive bars; the deterministic greedy control matches the card; the eight-fence audit passes across the artifacts.
- **Formally admitted claim:** none. No Q admission, no band admission, no weights admission, no card admission; all results are observed patterns and demonstrated explanations.

## Fences

- No Roman-numeral-led labels; progression language is degree/stride/shape.
- No weights in the ontology or the degree ladder; weights live only in the steering layer.
- Zero symbolic floats; integer truncation toward zero.
- `harmonic.C_H` remains null.
- Q engine and pressure bridge untouched and unadmitted; `SPEC-001 §1.3` untouched.
- `m1` bands and the character reading remain stated hypothesis / stated choice.
- Menu order and position bias reported; 0 LLM calls.
- Degrees 1–7 throughout; stride, not span.

## Ear package

- Manifest: `/home/erick/workspace/scratch-governed-loop-run/mvp8_6_functional_harmony/task-d/mvp8_6_ear_manifest.json` — sha256 `c169c5d932e06289dea8a55d672dc669aaf9a4e3d24c82b12e12872890254748`
- Arm A on: `/home/erick/workspace/scratch-governed-loop-run/mvp8_6_functional_harmony/task-d/sessions/mvp8-6-arm-a-f-on.wav` — sha256 `899a724483db47e5f832f7925e4506b026a573c6070ee247a4791edba2287252`
- Arm A off: `/home/erick/workspace/scratch-governed-loop-run/mvp8_6_functional_harmony/task-d/sessions/mvp8-6-arm-a-f-off.wav` — sha256 `9acda01e6be2dccb784d47fdaf2d8f98512e679525d6969e927d3bdab0930d09`
- Arm B 2741: `/home/erick/workspace/scratch-governed-loop-run/mvp8_6_functional_harmony/task-d/sessions/mvp8-6-arm-b-plagal-2741.wav` — sha256 `f510ad93d82f4df5100a4b817d7044a91b2bf819fdd380a946a29c135c387cbd`
- Arm B 1453: `/home/erick/workspace/scratch-governed-loop-run/mvp8_6_functional_harmony/task-d/sessions/mvp8-6-arm-b-plagal-1453.wav` — sha256 `d62e5dce5be3cf301e04cb5842698709d4f82ceaf3555974bf0db932f2d8d10e`
- Arm C walk: `/home/erick/workspace/scratch-governed-loop-run/mvp8_6_functional_harmony/task-d/sessions/mvp8-6-arm-c-walk-20.wav` — sha256 `08ed0e15d9ea6379e1e3e4cd7264ffe51050ede8cc17f4b010de33af9f7d9ceb`

Play any WAV with `ffplay -autoexit -nodisp -loglevel error <path>` or `paplay <path>`. The ear gate is human; no agent-authored listener field.

## Signed ear verdict (human-authored, verbatim)

> These are my verbatim verdicts, and I see no reason not to adopt.

### Per-arm verbatim verdicts

| Arm | Verdict | Verbatim |
|---|---|---|
| A | adopt | between arm AF off and arm AF on, there's a big difference in the chords that it's selecting. I can't tell what the difference is. |
| B | adopt | For the plagal 1453 and the plagal 2741, they both sound different. They both seem to be doing a vamp between one chord and the next, which is exactly what you would expect in a Plagal cadence. ... Also for the Plagal cadences, they are different chord qualities, as expected. |
| C | adopt | For the C-Walk 20 The chord changes seem to be very much related, like minimal steps in the chord changes, and it seems to be hitting all different types of chord progressions. So, it's hard for me to know what's happening, but the chord progressions definitely sound related. |

## Artifact hashes

| Artifact | SHA-256 |
|---|---|
| T0 receipt — `qa/mvp8_6_task_0_receipt.json` | `26151d12ea61677eb334ed22f4d15b1f4b6dd128e4e5141a76e5bb648043820d` |
| Task A receipt — `qa/mvp8_6_task_a_receipt.json` | `2382f3ba9e681fb617b0317e71b0ff7d565739277d1d634fdd270410ad474be9` |
| Task B receipt — `qa/mvp8_6_task_b_receipt.json` | `fde5f2a338ec3b0d133b78d154f57e57f7e8fe1caf4ac250381850260dffabf0` |
| Task C receipt — `qa/mvp8_6_task_c_receipt.json` | `03c7a3cb58685d4301f38f1b6d5454ec13215a3ae1a6d2be0df9cceafe5b7114` |
| Fence audit — `qa/mvp8_6_fence_audit.json` | `aa8db3979055e524c08e70e364c6cfba75ee543b52e95876920012105d32e657` |
| Task D receipt — `qa/mvp8_6_task_d_receipt.json` | `82ec3e965d2f1ba68285bd7fb53222c5f43e6c53f791adb7607feb3afac39241` |
| Signed ear manifest — sha256 | `c169c5d932e06289dea8a55d672dc669aaf9a4e3d24c82b12e12872890254748` |
| Signed ear scorecard — sha256 | `e9934c25950886b41f50b7283116783e54b8ae7c7d3999533c816edad9570315` |

No technical bet failed. The outcome is `ADOPT`; landing remains one commit on the review branch with no push.
