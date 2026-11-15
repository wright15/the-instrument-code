# MVP8.5 rev 2 — Harmonic Design closing report

- **Directive:** `MVP8.5-HARMONIC-DESIGN-DIR-1` rev 1
- **Base:** L33 `ce61c8164913142d2cbdff2dbf2e349c0100243b` / ledger `18d24f2c6158c513160b3e61356d544a551d7cc36d03966a2db4265b4a36b5ff` / MANIFEST 2042 files
- **Outcome:** `ADOPT`
- **Ear gate:** `SIGNED` (signed: True)

## Measured bets

| Bet | Result | Measured |
|---|---|---|
| A1 | PASS | 21 states / 3 families / 9 seams; 20/20 accepts |
| A2 | PASS | 23 total consecutive-bar completions across 9/20 arms; L20 0 total; unranked 0 total |
| A3 | PASS | greedy delta 0 states; 0 LLM calls |
| B1 | PASS | structural 0; total 38 <= 65 - 15; passing 38/38; harmony hash True |
| B2 | PASS | Q sequence invariant True; L21 emitted 5-gram repeats 0/48 |
| B3 | PASS | 21/144 snaps; 36 dyads; WAV `7e7eb3ea…` |
| C1 | PASS | 95 firings; 80/80 immediate boosts; seam within 5: 88/95 |
| C2 | PASS | union state difference 188; 20/20 accepts |
| C3a | PASS | 21/3/5 |
| C3b | PASS | 21 states vs Task A 21 |

## Five-proposition reading

- **Valid algebraic relationship:** the card score remains integer-only; the degree ladder, gate, and Q advance are unchanged.
- **Predicted consequence:** harmonic terms should steer the macro card toward consonant degree-root shapes while preserving reach.
- **Observed pattern:** A1 measured 21 states / 3 families / 9 seams on all three arms. A2 measured 23 total consecutive-bar completions across 9/20 arms, with L20 and unranked at 0. B1 measured structural_unsafe 0, total_unsafe_chord 38 <= 65 - 15, passing 38/38, and identical harmony WAV hashes. B3 reproduced the prototype exactly.
- **Demonstrated explanation:** A1/A2/A3, B1/B2/B3, and C1/C2/C3a/C3b all pass; the L20 regression (C3a 21/3/5) and the Task A parity control (C3b exact) show the card and bridge wiring behave as specified.
- **Formally admitted claim:** none. No Q admission, no band admission, no card admission.

## Ear package

- Manifest: `/home/erick/workspace/scratch-governed-loop-run/mvp8_5_harmonic_design_rev2/task-d/mvp8_5_ear_manifest.json`
- Arm A harmonic: `/home/erick/workspace/scratch-governed-loop-run/mvp8_5_harmonic_design_rev2/task-d/sessions/arm-a-harmonic.wav`
- Arm A control: `/home/erick/workspace/scratch-governed-loop-run/mvp8_5_harmonic_design_rev2/task-d/sessions/arm-a-control.wav`
- Arm B standard: `/home/erick/workspace/scratch-governed-loop-run/mvp8_5_harmonic_design/task-d/sessions/mvp8-5-arm-b-standard.wav`
- Arm B chord-responsive: `/home/erick/workspace/scratch-governed-loop-run/mvp8_5_harmonic_design/task-d/sessions/mvp8-5-arm-b-chord.wav`
- Arm B A/B combo: `/home/erick/workspace/scratch-governed-loop-run/mvp8_5_harmonic_design/task-d/sessions/mvp8-5-arm-b-lead-AB.wav`
- Arm C bridge on: `/home/erick/workspace/scratch-governed-loop-run/mvp8_5_harmonic_design/task-d/sessions/mvp8-5-arm-c-bridge-on.wav`
- Arm C bridge off: `/home/erick/workspace/scratch-governed-loop-run/mvp8_5_harmonic_design/task-d/sessions/mvp8-5-arm-c-bridge-off.wav`
- Arm D-diag: `/home/erick/workspace/scratch-governed-loop-run/mvp8_5_harmonic_design/task-d/sessions/mvp8-5-arm-d-diag.wav`

Play any WAV with `ffplay -autoexit -nodisp -loglevel error <path>` or `paplay <path>`. The ear gate is human; no agent-authored listener field.

## Signed ear verdict (human-authored, verbatim)

> When listening to A Control, the chords sound not very harmonic and the melody sounds like it fits sometimes, but there's lots of melodies that sound like they don't belong. But I am unsure if this is due to the nodes being used to generate the progression and melody. A harmonic sounds a bit more harmonically sound the longer it goes on. And some of the notes sound off, but it could be due to a less than harmonic progression. But I can't say that it doesn't sound like it belongs. It may. B chord sounds like the melodies and the harmony, even though they are from a less than harmonic node, sound very cohesive and like they all belong. B-lead A sounds like the melody and the chords match well. B-lead B also sounds like the chords and melody align. The melody sounds a bit different between the two, but nothing that would prefer one over the other. But if I had to choose, probably B as there is more variation. B standard. Sounds like the melody and harmonies work well together. Even though the melody is a bit repetitive, it definitely works. C bridge off. Sounds like the melody doesn't quite work and the harmonies sound like they are choosing unique nodes. So it could be that the melodies themselves are true and match the chord selection, but it doesn't sound very pleasant. C Bridge on sounds like it also comes from a not very pleasant node, but the melodies they sound like they belong. Interesting sound. The melodies are a bit off and repetitive, but they sound like they could belong. D diag is short, uses different types of harmonies, and a melody that probably goes along with it, but again, the harmonies are not very harmonic, so the melodies also sound that way.

### Per-arm verdicts

| Arm | Verdict | Note |
|---|---|---|
| A | adopt | |
| B | adopt | chord-responsive variant preferred for variation |
| C | adopt | |
| D-diag | reject | corroborates m1 [H4] over m3 [7] on (0,3,6); retain m1 |

Arm A is signed `adopt`. The prior signed verdicts for Arms B, C, and D-diag are preserved from manifest `221bceb4…`. All technical bets pass; the outcome is `ADOPT`.

### Arm A verbatim notes (human-authored)

> Arm A control uses nodes that have harmonically not consonant harmonies, and you can hear that in the melody lines. But it's pretty clear to me that the melody follows along the harmonic profile, so the melody and harmony align. Arm A Harmonic has more pleasant harmonies even though they sound like they might be from harmonically not consonant nodes, but some of them sound very harmonic and the melodies do seem to align well and sound pretty good, although im sure the nodes used have harmonic not consonant nodes hence some of the melodies being not consonant. I say we should adopt because the nodes that we were using align with the melodies that we heard.

## Fences

- Q engine unadmitted; bands stated hypothesis; ladder weight-free; `harmonic.C_H` null; zero symbolic floats; zero repository writes.
- All technical bets pass and Arm A is signed adopt; the sprint outcome is `ADOPT`.
