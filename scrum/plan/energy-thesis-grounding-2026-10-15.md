# Energy thesis — grounding the three stories with published numbers

Prepared 2026-10-15 (UTC) as forward-looking research for Mac's named "energy framework"
thesis. Not a nudge toward the prototype — the button-up sequence stands. This sharpens
the thesis so it's claim-shaped whenever the build work reopens.

> **Registration note (added at landing, 2026-10-16):** this document is registered as
> forward-looking research — planning-side prose, not a boundary, not a ticket, no
> execution authority. Its claim shapes are candidate forms awaiting the button-up
> outputs (op-mix count, frozen-state byte footprint). External energy figures are
> published-literature boundary conditions; the framework-facing stories are structural
> correspondences until measured. Per the registered typology
> (`docs/THREE_PART_CONTINUOUS_TYPOLOGY.md`): Modality 2 boundary conditions with
> `causationClaim: false`; Modality 3 arithmetic excluded from this document entirely.
> The experiment set below is forward work, gated on button-up outputs.

Reference: Horowitz, *Computing's Energy Problem (and what we can do about it)*,
ISSCC 2014 plenary, 45nm CMOS. Cross-checked against two independent reproductions
(Jouppi et al., "Ten Lessons From Three Generations Shaped Google's TPUv4i", ISCA 2021 —
extends the table to 7nm and adds BF16; plus a neuromorphic-design writeup and a
universal-numbers position paper citing the same figures).

## The verified numbers (45nm)

| Operation | Energy |
|---|---|
| 8-bit integer add | ~0.03 pJ |
| 32-bit integer add | ~0.1 pJ |
| 32-bit FP add | ~0.9 pJ |
| 32-bit FP multiply | ~3.7 pJ |
| 32-bit integer multiply | ~3.1 pJ |
| 32-bit DRAM read | ~640 pJ |

Key ratios: a 32-bit **float multiply costs ~37× a 32-bit integer add**; an 8-bit int add
costs ~1/30 of a float add. Integer multiply is not the win — at 32 bits it costs about
the same as float multiply (3.1 vs 3.7 pJ). The win is the **add-heavy, small-word,
integer-only regime** — exactly the framework's op profile (scalar integer steps).

## What each of the three stories gets

**1. Watts per op.** Confirmed direction, with a precision: the advantage is not
"integer vs float" flatly — it's adds over multiplies, small words over wide ones.
An integer-phase machine that multiplies 32-bit words buys little over float; one
that does small integer adds buys ~10–40×. The framework's integer-phase transitions
are on the favorable side of that line, but the claim needs the op-mix stated.

**2. Zero-drift → interruptible.** The numbers say this is the *stronger* story, and
there's a fourth number that makes it: a DRAM read (~640 pJ) dwarfs **all** arithmetic
— it's ~700× a float add, ~6000× a 32-bit int add. The dominant energy cost in real
systems is moving data, not computing. The framework's kilobyte-sized frozen state
fits in cache/register file — the energy story isn't just cheaper ops, it's that the
state never has to travel to DRAM and never needs checkpointing. "Pauses on
intermittent power with zero state loss" is where the pause/resume thesis gets its
mechanism, and the memory-hierarchy numbers are the evidence it's the *big* lever.

**3. Structure does the work energy usually does.** The reservoir claim needs one
benchmark the thesis doesn't yet have: frozen-reservoir + readout vs. trained RNN on
the same task, energy per prediction. The industry direction is already validated
(INT8 inference is standard, INT4 emerging — the quantization race confirms demand
for integer inference, though theirs is approximation bolted onto float-trained
architectures, which is Mac's differentiator). The honest gap stays: measured joules,
not derived elegance.

## The accounting that would close it (experiment set, for later)

- Joules per op on the actual workload (the Q-engine transition mix, counted),
  not per-op table lookups.
- Reservoir vs. RNN chord-prediction on the same corpus, same task — energy per
  prediction, both directions, with the shuffled-hypergraph control already planned.
- Pause/resume on intermittent power with zero state loss — demonstrated, measured
  (the solarpunk mechanism made literal).
- A roofline-style bound: state footprint (kilobytes) × on-chip access energy vs.
  a float baseline's DRAM traffic.

These turn "energy framework" from intuition into the thing a lab can't wave away.
All measurable, all downstream of the button-up.
