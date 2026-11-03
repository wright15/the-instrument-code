# Orbit Spectral Catalog v1

**Directive:** `MVP5.5-DIR-1` rev 1  
**Catalog ID:** `ORBIT_SPECTRAL_CATALOG_v1`  
**Layer:** `SPEC-001 §1.3 overlay dynamics`  
**Scope:** 10 governed orbits × 12 phases, exact rational arithmetic.

## Status and fences

- `gov517_correspondence_claimed`: `false`
- `still_set_label`: `still_set`
- Modality 1/3 tables are exact rational/integer only (zero floats).
- Modality 2 photonic and acoustic values are external boundary-conditioned measurements with the four registered guard flags.
- `harmonic.C_H` remains `unresolved` with `value: null`.

## Exact 10 × 12 orbit phase-mean matrix

| orbit | n | p0 | p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ORBIT-A0 | 49 | 36 | 1867/49 | 1886/49 | 1893/49 | 1912/49 | 1871/49 | 1902/49 | 1861/49 | 1880/49 | 1887/49 | 1906/49 | 41 |
| ORBIT-A1 | 35 | 36 | 191/5 | 1354/35 | 1311/35 | 268/7 | 269/7 | 270/7 | 271/7 | 1384/35 | 1341/35 | 194/5 | 41 |
| ORBIT-A2 | 49 | 36 | 1867/49 | 1826/49 | 1881/49 | 1840/49 | 1919/49 | 1854/49 | 1933/49 | 1892/49 | 1947/49 | 1906/49 | 41 |
| ORBIT-D1 | 21 | 36 | 253/7 | 270/7 | 279/7 | 276/7 | 269/7 | 270/7 | 263/7 | 260/7 | 269/7 | 286/7 | 41 |
| ORBIT-D2 | 35 | 36 | 1241/35 | 1294/35 | 1371/35 | 40 | 1381/35 | 1314/35 | 37 | 1324/35 | 1401/35 | 1454/35 | 41 |
| ORBIT-D3 | 21 | 36 | 253/7 | 258/7 | 37 | 256/7 | 257/7 | 282/7 | 283/7 | 40 | 281/7 | 286/7 | 41 |
| ORBIT-D4 | 35 | 36 | 253/7 | 1306/35 | 1311/35 | 256/7 | 1333/35 | 1362/35 | 283/7 | 1384/35 | 1389/35 | 286/7 | 41 |
| ORBIT-D5 | 35 | 36 | 1241/35 | 254/7 | 255/7 | 188/5 | 269/7 | 270/7 | 197/5 | 284/7 | 285/7 | 1454/35 | 41 |
| ORBIT-D6 | 21 | 36 | 35 | 234/7 | 235/7 | 244/7 | 261/7 | 278/7 | 295/7 | 304/7 | 305/7 | 42 | 41 |
| ORBIT-D7 | 7 | 36 | 229/7 | 218/7 | 219/7 | 232/7 | 257/7 | 282/7 | 307/7 | 320/7 | 321/7 | 310/7 | 41 |

Every cell is an exact `fractions.Fraction` serialized as a string; no floating-point value is present.

## Exact 10 × 12 orbit total matrix

| orbit | n | p0 | p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ORBIT-A0 | 49 | 1764 | 1867 | 1886 | 1893 | 1912 | 1871 | 1902 | 1861 | 1880 | 1887 | 1906 | 2009 |
| ORBIT-A1 | 35 | 1260 | 1337 | 1354 | 1311 | 1340 | 1345 | 1350 | 1355 | 1384 | 1341 | 1358 | 1435 |
| ORBIT-A2 | 49 | 1764 | 1867 | 1826 | 1881 | 1840 | 1919 | 1854 | 1933 | 1892 | 1947 | 1906 | 2009 |
| ORBIT-D1 | 21 | 756 | 759 | 810 | 837 | 828 | 807 | 810 | 789 | 780 | 807 | 858 | 861 |
| ORBIT-D2 | 35 | 1260 | 1241 | 1294 | 1371 | 1400 | 1381 | 1314 | 1295 | 1324 | 1401 | 1454 | 1435 |
| ORBIT-D3 | 21 | 756 | 759 | 774 | 777 | 768 | 771 | 846 | 849 | 840 | 843 | 858 | 861 |
| ORBIT-D4 | 35 | 1260 | 1265 | 1306 | 1311 | 1280 | 1333 | 1362 | 1415 | 1384 | 1389 | 1430 | 1435 |
| ORBIT-D5 | 35 | 1260 | 1241 | 1270 | 1275 | 1316 | 1345 | 1350 | 1379 | 1420 | 1425 | 1454 | 1435 |
| ORBIT-D6 | 21 | 756 | 735 | 702 | 705 | 732 | 783 | 834 | 885 | 912 | 915 | 882 | 861 |
| ORBIT-D7 | 7 | 252 | 229 | 218 | 219 | 232 | 257 | 282 | 307 | 320 | 321 | 310 | 287 |

## Wrap-count tomography: `w_p = (7n − Δ_p) / 12`

The cyclic first difference `Δ_p = total_(p+1) − total_p` bijectively recovers the pitch-class multiplicity histogram: `w_p = h_O((11 − p) mod 12)`.

| orbit | n | p0 | p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ORBIT-A0 | 49 | 20 | 27 | 28 | 27 | 32 | 26 | 32 | 27 | 28 | 27 | 20 | 49 |
| ORBIT-A1 | 35 | 14 | 19 | 24 | 18 | 20 | 20 | 20 | 18 | 24 | 19 | 14 | 35 |
| ORBIT-A2 | 49 | 20 | 32 | 24 | 32 | 22 | 34 | 22 | 32 | 24 | 32 | 20 | 49 |
| ORBIT-D1 | 21 | 12 | 8 | 10 | 13 | 14 | 12 | 14 | 13 | 10 | 8 | 12 | 21 |
| ORBIT-D2 | 35 | 22 | 16 | 14 | 18 | 22 | 26 | 22 | 18 | 14 | 16 | 22 | 35 |
| ORBIT-D3 | 21 | 12 | 11 | 12 | 13 | 12 | 6 | 12 | 13 | 12 | 11 | 12 | 21 |
| ORBIT-D4 | 35 | 20 | 17 | 20 | 23 | 16 | 18 | 16 | 23 | 20 | 17 | 20 | 35 |
| ORBIT-D5 | 35 | 22 | 18 | 20 | 17 | 18 | 20 | 18 | 17 | 20 | 18 | 22 | 35 |
| ORBIT-D6 | 21 | 14 | 15 | 12 | 10 | 8 | 8 | 8 | 10 | 12 | 15 | 14 | 21 |
| ORBIT-D7 | 7 | 6 | 5 | 4 | 3 | 2 | 2 | 2 | 3 | 4 | 5 | 6 | 7 |

## Pitch-class multiplicity histograms `h_O(c)`

| orbit | n | c0 | c1 | c2 | c3 | c4 | c5 | c6 | c7 | c8 | c9 | c10 | c11 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ORBIT-A0 | 49 | 49 | 20 | 27 | 28 | 27 | 32 | 26 | 32 | 27 | 28 | 27 | 20 |
| ORBIT-A1 | 35 | 35 | 14 | 19 | 24 | 18 | 20 | 20 | 20 | 18 | 24 | 19 | 14 |
| ORBIT-A2 | 49 | 49 | 20 | 32 | 24 | 32 | 22 | 34 | 22 | 32 | 24 | 32 | 20 |
| ORBIT-D1 | 21 | 21 | 12 | 8 | 10 | 13 | 14 | 12 | 14 | 13 | 10 | 8 | 12 |
| ORBIT-D2 | 35 | 35 | 22 | 16 | 14 | 18 | 22 | 26 | 22 | 18 | 14 | 16 | 22 |
| ORBIT-D3 | 21 | 21 | 12 | 11 | 12 | 13 | 12 | 6 | 12 | 13 | 12 | 11 | 12 |
| ORBIT-D4 | 35 | 35 | 20 | 17 | 20 | 23 | 16 | 18 | 16 | 23 | 20 | 17 | 20 |
| ORBIT-D5 | 35 | 35 | 22 | 18 | 20 | 17 | 18 | 20 | 18 | 17 | 20 | 18 | 22 |
| ORBIT-D6 | 21 | 21 | 14 | 15 | 12 | 10 | 8 | 8 | 8 | 10 | 12 | 15 | 14 |
| ORBIT-D7 | 7 | 7 | 6 | 5 | 4 | 3 | 2 | 2 | 2 | 3 | 4 | 5 | 6 |

## I₀ involution closure and dispersion classes

| orbit | n | fixed points | 2-cycles | spread | dispersion class |
|---|---|---|---|---|---|
| ORBIT-A0 | 49 | 1 | 24 | 5 | ANCHOR_FLAT |
| ORBIT-A1 | 35 | 1 | 17 | 5 | ANCHOR_FLAT |
| ORBIT-A2 | 49 | 1 | 24 | 5 | ANCHOR_FLAT |
| ORBIT-D1 | 21 | 1 | 10 | 5 | ANCHOR_FLAT |
| ORBIT-D2 | 35 | 1 | 17 | 213/35 | MODERATE_BEND |
| ORBIT-D3 | 21 | 1 | 10 | 5 | ANCHOR_FLAT |
| ORBIT-D4 | 35 | 1 | 17 | 5 | ANCHOR_FLAT |
| ORBIT-D5 | 35 | 1 | 17 | 213/35 | MODERATE_BEND |
| ORBIT-D6 | 21 | 1 | 10 | 71/7 | DEEP_DISPERSION |
| ORBIT-D7 | 7 | 1 | 3 | 103/7 | EXTREME_RAMP |

`I₀: x ↦ (−x) mod 12` maps every governed orbit bijectively onto itself and the 154 withheld boundary masks onto themselves.

## Cross-orbit spread profile

| quantity | p0 | p1 | p2 | p3 | p4 | p5 | p6 | p7 | p8 | p9 | p10 | p11 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Δ_cross exact | 0 | 192/35 | 264/35 | 60/7 | 48/7 | 96/35 | 96/35 | 48/7 | 60/7 | 264/35 | 192/35 | 0 |
| Var_cross exact | 0 | 3888144/1500625 | 7923984/1500625 | 9388816/1500625 | 6034944/1500625 | 1171344/1500625 | 1171344/1500625 | 6034944/1500625 | 9388816/1500625 | 7923984/1500625 | 3888144/1500625 | 0 |

- Coincidence set: `[0, 11]`
- Global maximum: `60/7` at phases `[3, 8]`
- Interior minimum: `96/35` at phases `[5, 6]`
- Mirror symmetry: `Δ_cross(p) = Δ_cross(11 − p)`.

## Candidate invariant audit

| candidate | verdict | checks | meaning |
|---|---|---|---|
| A — Phase-sum identity | TRIVIAL_IDENTITY | 462/462 census; 792/792 seven-note masks; 10/10 orbits | checksum guardrail; zero orbit-constraining power |
| B — Reflection pairing | ORBIT_INVOLUTION_INVARIANT | 5544/5544 pairwise I₀; 60/60 orbit phase pairs | 2086 chiral per-mask counterexamples |
| C — Orbit tomography | REPRESENTATION_ISOMORPHISM | 120/120 wraps; 120/120 histograms; 45/45 distinct pairs | phase curve is a complete pitch-class representation |
| D — Achromatic boundary | ORBIT_INVOLUTION_INVARIANT | coincidence set {0, 11}; max 60/7; interior min 96/35 | field boundary condition at the reflection endpoints |

## Task B — photonic E = hν boundary condition

| test | disposition | result |
|---|---|---|
| B1 — container frequency sum | BOUNDARY_REFUTED | minimum cross-orbit spread 15.227700 Hz (tolerance 1e-09) |
| B2 — wrap step law | BOUNDARY_CONFIRMED | 5544/5544 checks; max residual 4.547e-13 Hz |
| B2 — log/geometric dual | BOUNDARY_CONFIRMED | exact; max deviation 7.105e-15 |

At both endpoints the first pitch-class moment is orbit-invariant (`['36']` at p=0, `['41']` at p=11), while the frequency mean still splits (correlation with μ₂: `0.999999319` at p=0, `0.999999319` at p=11). The exact achromatic convergence is a property of the logarithmic/geometric-mean coordinate, not of additive frequency mixing.

Guard flags: `causationClaim: false`, `physicalQuantityClaim: false`, `tierClassifier: false`, `globalCHNull: true`.

## Task C — 86-bar acoustic centroid bridge

- C1 renderer-to-air FFT fidelity: `BOUNDARY_CONFIRMED`; correlation `0.999725488`; median relative error `0.005047`.
- C2 symbolic pcSum tracking: `BOUNDARY_REFUTED` (container pcSum alone does not gain from office deconfounding; micro-lead pitch sums carry the intra-office contour).
- C3 equivariant P0→P7 shift: `VERIFIED`.

| office | register | waveform | bars | mean C_FFT (Hz) | min (Hz) | max (Hz) |
|---|---|---|---|---|---|---|
| Jupiter | 0 | triangle | 2 | 512.064 | 494.787 | 529.341 |
| Mercury | 0 | triangle | 24 | 484.717 | 441.528 | 518.378 |
| Saturn | -12 | square | 50 | 708.661 | 659.760 | 787.615 |
| Sun | 12 | sawtooth | 10 | 2574.152 | 2397.678 | 2672.782 |

### Three acoustic register bands

| registerOffset | offices | measured offices | mean C_FFT range (Hz) |
|---|---|---|---|
| -12 | Saturn | Saturn | 708.661 – 708.661 |
| 0 | Jupiter, Mercury, Moon | Jupiter, Mercury | 484.717 – 512.064 |
| +12 | Mars, Sun, Venus | Sun | 2574.152 – 2574.152 |

### Per-bar centroid table (86 voiced bars)

| track | bar | node | office | pcSum | C_FFT (Hz) | C_model (Hz) | rel. error |
|---|---|---|---|---|---|---|---|
| T1_arm1_unranked_2cycle | 1 | 1387@0 | Saturn | 33 | 659.760 | 659.242 | 0.000786 |
| T1_arm1_unranked_2cycle | 2 | 1383@0 | Saturn | 32 | 739.096 | 734.732 | 0.005940 |
| T1_arm1_unranked_2cycle | 3 | 1387@0 | Saturn | 33 | 717.141 | 721.448 | 0.005970 |
| T1_arm1_unranked_2cycle | 4 | 1383@0 | Saturn | 32 | 718.932 | 712.778 | 0.008633 |
| T1_arm1_unranked_2cycle | 5 | 1387@0 | Saturn | 33 | 773.725 | 777.649 | 0.005047 |
| T1_arm1_unranked_2cycle | 6 | 1383@0 | Saturn | 32 | 681.154 | 681.278 | 0.000182 |
| T1_arm1_unranked_2cycle | 7 | 1387@0 | Saturn | 33 | 787.615 | 785.666 | 0.002481 |
| T1_arm1_unranked_2cycle | 8 | 1383@0 | Saturn | 32 | 691.597 | 686.686 | 0.007152 |
| T1_arm1_unranked_2cycle | 9 | 1387@0 | Saturn | 33 | 743.596 | 747.770 | 0.005583 |
| T1_arm1_unranked_2cycle | 10 | 1383@0 | Saturn | 32 | 719.269 | 717.060 | 0.003080 |
| T1_arm1_unranked_2cycle | 11 | 1387@0 | Saturn | 33 | 707.360 | 707.080 | 0.000396 |
| T1_arm1_unranked_2cycle | 12 | 1383@0 | Saturn | 32 | 765.507 | 763.537 | 0.002580 |
| T1_arm1_unranked_2cycle | 13 | 1387@0 | Saturn | 33 | 659.762 | 659.350 | 0.000626 |
| T1_arm1_unranked_2cycle | 14 | 1383@0 | Saturn | 32 | 739.096 | 734.732 | 0.005940 |
| T1_arm1_unranked_2cycle | 15 | 1387@0 | Saturn | 33 | 717.141 | 721.448 | 0.005970 |
| T1_arm1_unranked_2cycle | 16 | 1383@0 | Saturn | 32 | 718.932 | 712.778 | 0.008633 |
| T1_arm1_unranked_2cycle | 17 | 1387@0 | Saturn | 33 | 773.725 | 777.649 | 0.005047 |
| T1_arm1_unranked_2cycle | 18 | 1383@0 | Saturn | 32 | 681.154 | 681.278 | 0.000182 |
| T1_arm1_unranked_2cycle | 19 | 1387@0 | Saturn | 33 | 787.615 | 785.666 | 0.002481 |
| T1_arm1_unranked_2cycle | 20 | 1383@0 | Saturn | 32 | 691.597 | 686.686 | 0.007152 |
| T2_arm2_static_4state | 1 | 1387@0 | Saturn | 33 | 659.760 | 659.242 | 0.000786 |
| T2_arm2_static_4state | 2 | 1383@0 | Saturn | 32 | 739.096 | 734.732 | 0.005940 |
| T2_arm2_static_4state | 3 | 875@0 | Saturn | 32 | 673.967 | 673.785 | 0.000271 |
| T2_arm2_static_4state | 4 | 1259@0 | Saturn | 32 | 687.389 | 708.902 | 0.030348 |
| T2_arm2_static_4state | 5 | 875@0 | Saturn | 32 | 730.787 | 733.495 | 0.003691 |
| T2_arm2_static_4state | 6 | 1259@0 | Saturn | 32 | 682.317 | 706.387 | 0.034075 |
| T2_arm2_static_4state | 7 | 875@0 | Saturn | 32 | 745.081 | 741.769 | 0.004465 |
| T2_arm2_static_4state | 8 | 1259@0 | Saturn | 32 | 691.121 | 713.803 | 0.031776 |
| T2_arm2_static_4state | 9 | 1383@0 | Saturn | 32 | 743.190 | 745.930 | 0.003673 |
| T2_arm2_static_4state | 10 | 875@0 | Saturn | 32 | 688.354 | 690.072 | 0.002490 |
| T2_arm2_static_4state | 11 | 1259@0 | Saturn | 32 | 679.922 | 701.176 | 0.030312 |
| T2_arm2_static_4state | 12 | 1383@0 | Saturn | 32 | 765.507 | 763.537 | 0.002580 |
| T2_arm2_static_4state | 13 | 875@0 | Saturn | 32 | 698.400 | 697.549 | 0.001219 |
| T2_arm2_static_4state | 14 | 1259@0 | Saturn | 32 | 682.252 | 704.832 | 0.032036 |
| T2_arm2_static_4state | 15 | 875@0 | Saturn | 32 | 673.952 | 673.821 | 0.000194 |
| T2_arm2_static_4state | 16 | 1259@0 | Saturn | 32 | 687.389 | 708.902 | 0.030348 |
| T2_arm2_static_4state | 17 | 875@0 | Saturn | 32 | 730.787 | 733.495 | 0.003691 |
| T2_arm2_static_4state | 18 | 1259@0 | Saturn | 32 | 682.317 | 706.387 | 0.034075 |
| T2_arm2_static_4state | 19 | 1383@0 | Saturn | 32 | 771.608 | 768.055 | 0.004626 |
| T2_arm2_static_4state | 20 | 875@0 | Saturn | 32 | 716.580 | 713.325 | 0.004564 |
| T3_arm3a_dynamic_q_reset | 1 | 1387@0 | Saturn | 33 | 659.760 | 659.242 | 0.000786 |
| T3_arm3a_dynamic_q_reset | 2 | 1383@0 | Saturn | 32 | 670.701 | 670.157 | 0.000812 |
| T3_arm3a_dynamic_q_reset | 3 | 875@0 | Saturn | 32 | 698.404 | 697.519 | 0.001269 |
| T3_arm3a_dynamic_q_reset | 4 | 1259@0 | Saturn | 32 | 673.174 | 698.019 | 0.035594 |
| T3_arm3a_dynamic_q_reset | 5 | 2517@11 | Sun | 43 | 2622.316 | 2479.704 | 0.057512 |
| T3_arm3a_dynamic_q_reset | 6 | 2765@11 | Sun | 43 | 2664.148 | 2544.532 | 0.047009 |
| T3_arm3a_dynamic_q_reset | 7 | 2771@11 | Sun | 43 | 2656.481 | 2544.311 | 0.044086 |
| T3_arm3a_dynamic_q_reset | 8 | 2773@11 | Sun | 44 | 2672.782 | 2543.977 | 0.050631 |
| T3_arm3a_dynamic_q_reset | 9 | 1741@11 | Mercury | 42 | 518.378 | 526.506 | 0.015439 |
| T3_arm3a_dynamic_q_reset | 10 | 855@11 | Mercury | 35 | 481.798 | 483.470 | 0.003458 |
| T3_arm3a_dynamic_q_reset | 11 | 1645@11 | Mercury | 40 | 493.342 | 493.188 | 0.000312 |
| T3_arm3a_dynamic_q_reset | 12 | 1693@11 | Mercury | 40 | 508.843 | 508.995 | 0.000298 |
| T3_arm3a_dynamic_q_reset | 13 | 1693@11 | Mercury | 40 | 508.804 | 508.878 | 0.000147 |
| T3_arm3a_dynamic_q_reset | 14 | 1709@11 | Mercury | 41 | 514.612 | 512.656 | 0.003815 |
| T3_arm3a_dynamic_q_reset | 15 | 1837@11 | Mercury | 42 | 501.103 | 501.101 | 0.000005 |
| T3_arm3a_dynamic_q_reset | 16 | 3417@11 | Mercury | 47 | 492.698 | 493.336 | 0.001294 |
| T3_arm3a_dynamic_q_reset | 17 | 1709@0 | Mercury | 36 | 472.008 | 470.573 | 0.003051 |
| T3_arm3a_dynamic_q_reset | 18 | 855@0 | Mercury | 30 | 441.528 | 439.640 | 0.004294 |
| T3_arm3a_dynamic_q_reset | 19 | 1645@0 | Mercury | 35 | 450.740 | 448.075 | 0.005947 |
| T3_arm3a_dynamic_q_reset | 20 | 1693@0 | Mercury | 35 | 469.497 | 468.495 | 0.002138 |
| T4_arm3b_dynamic_q_carried | 1 | 1387@0 | Saturn | 33 | 659.760 | 659.242 | 0.000786 |
| T4_arm3b_dynamic_q_carried | 2 | 1383@0 | Saturn | 32 | 739.096 | 734.732 | 0.005940 |
| T4_arm3b_dynamic_q_carried | 3 | 875@0 | Saturn | 32 | 673.967 | 673.785 | 0.000271 |
| T4_arm3b_dynamic_q_carried | 4 | 1259@0 | Saturn | 32 | 687.389 | 708.902 | 0.030348 |
| T4_arm3b_dynamic_q_carried | 5 | 2517@11 | Sun | 43 | 2562.932 | 2499.377 | 0.025428 |
| T4_arm3b_dynamic_q_carried | 6 | 2765@11 | Sun | 43 | 2564.607 | 2531.786 | 0.012964 |
| T4_arm3b_dynamic_q_carried | 7 | 2771@11 | Sun | 43 | 2411.669 | 2313.607 | 0.042385 |
| T4_arm3b_dynamic_q_carried | 8 | 2773@11 | Sun | 44 | 2615.504 | 2549.628 | 0.025837 |
| T4_arm3b_dynamic_q_carried | 9 | 1741@11 | Mercury | 42 | 491.504 | 502.927 | 0.022713 |
| T4_arm3b_dynamic_q_carried | 10 | 855@11 | Mercury | 35 | 459.491 | 459.308 | 0.000398 |
| T4_arm3b_dynamic_q_carried | 11 | 1645@11 | Mercury | 40 | 482.119 | 484.504 | 0.004923 |
| T4_arm3b_dynamic_q_carried | 12 | 1693@11 | Mercury | 40 | 490.118 | 487.609 | 0.005145 |
| T4_arm3b_dynamic_q_carried | 13 | 1693@11 | Mercury | 40 | 508.804 | 508.878 | 0.000147 |
| T4_arm3b_dynamic_q_carried | 14 | 1709@11 | Mercury | 41 | 485.917 | 482.205 | 0.007697 |
| T4_arm3b_dynamic_q_carried | 15 | 1837@11 | Mercury | 42 | 506.179 | 503.560 | 0.005200 |
| T4_arm3b_dynamic_q_carried | 16 | 3417@11 | Mercury | 47 | 514.548 | 517.957 | 0.006582 |
| T4_arm3b_dynamic_q_carried | 17 | 1709@0 | Mercury | 36 | 458.402 | 461.710 | 0.007166 |
| T4_arm3b_dynamic_q_carried | 18 | 855@0 | Mercury | 30 | 453.894 | 451.676 | 0.004910 |
| T4_arm3b_dynamic_q_carried | 19 | 1645@0 | Mercury | 35 | 460.381 | 460.317 | 0.000138 |
| T4_arm3b_dynamic_q_carried | 20 | 1693@0 | Mercury | 35 | 468.502 | 468.960 | 0.000977 |
| T5_equiv_base_p0 | 1 | 1387@0 | Saturn | 33 | 659.760 | 659.242 | 0.000786 |
| T5_equiv_base_p0 | 2 | 2773@11 | Sun | 44 | 2573.407 | 2487.412 | 0.034572 |
| T5_equiv_base_p0 | 3 | 2905@11 | Jupiter | 46 | 529.341 | 534.618 | 0.009872 |
| T6_equiv_lifted_p7 | 1 | 1387@7 | Saturn | 34 | 707.502 | 717.459 | 0.013879 |
| T6_equiv_lifted_p7 | 2 | 2773@6 | Sun | 33 | 2397.678 | 2322.707 | 0.032277 |
| T6_equiv_lifted_p7 | 3 | 2905@6 | Jupiter | 35 | 494.787 | 501.103 | 0.012605 |

### Equivariant pair

| bar | base mask | phase p0 | phase p7 | Δp | Δwraps | ΔpcSum symbolic | ΔpcSum observed | ΔC_FFT (Hz) |
|---|---|---|---|---|---|---|---|---|
| 1 | 1387 | 0 | 7 | 7 | 4 | 1 | 1 | 47.741 |
| 2 | 2773 | 11 | 6 | -5 | -2 | -11 | -11 | -175.729 |
| 3 | 2905 | 11 | 6 | -5 | -2 | -11 | -11 | -34.554 |

## Orchestration guidance

- Use `p ∈ {0, 11}` when a macro-planner needs orbit-agnostic symbolic behavior: every orbit mean is exactly `36` and `41` respectively, and the cross-orbit spread is zero.
- Treat `p ∈ {3, 8}` as the maximum-dispersion interior phases (`60/7` spread): the same phase selects materially different pitch-class content per orbit.
- Use the wrap ladder `w_p` as the exact orbit fingerprint: it recovers the pitch-class multiplicity histogram and separates `ORBIT-D2` from `ORBIT-D5` despite their equal spread.
- For acoustic rendering, expect three register bands set by `registerOffset` (`Saturn −12`; `Moon/Mercury/Jupiter 0`; `Sun/Mars/Venus +12`); container `pcSum` alone is not a sufficient intra-office centroid predictor, while micro-lead pitches carry most of the contour.
- Do not treat the photonic frequency sums as a physical claim: additive 12-TET frequency mixing retains second-moment dispersion; only the logarithmic/geometric coordinate is achromatic.

## Receipt chain

| task | receipt | sha256 |
|---|---|---|
| T0 | task-0/mvp5_5_task_0_receipt.json | 87761e937782d5fa12b0e61eab13549587c210ae83d46dee199a2715256d2bd0 |
| TA | task-a/mvp5_5_task_a_receipt.json | 9d6ed3d8635680bbb839c39d40e7d02a6d820a030d6a50eed6c0cd7665c17fc9 |
| TB | task-b/mvp5_5_task_b_receipt.json | 9def72961c11f4353c6aa229c98b74c53dc84d91e04eb8cd27c71dd4fcf93800 |
| TC | task-c/mvp5_5_task_c_receipt.json | de0db46c200291a247c1d5c8111413c2aa62a1fa11e7b26eacd12a6f96814f69 |
| TD | task-d/mvp5_5_task_d_receipt.json | (emitted with this catalog) |

