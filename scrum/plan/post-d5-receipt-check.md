# Post-D5 Receipt Check

**Status:** source and arithmetic check completed 2026-09-13; planning only.
No new research execution receipt, admission, ledger entry, or ticket closure.
The original capture is filed verbatim in `post-d5-analysis-capture.md`; corrections
to it and the subsequent planning amendments are recorded here. Source citations refer to this checkout, not a promise of
freshness for every historical binding.

## Verified Claims And Corrections

| Claim | Checked result | Source |
|---|---|---|
| GOV-520 counts | `N=823543`, `N_orbit=visited=60028`, `classCount=classes.length=2859`; 53 distinct representative statistic tuples; 1911 matching and 948 nonmatching results | `qa/gov-520-production-enumeration.json:1`, fields `N`, `N_orbit`, `visited`, `classes[].statistic`; `qa/gov-520-production-comparison.json:1`, `results[].matches`; receipt lines 94-121 |
| GOV-520 comparison target | Verbatim `[4]`; do not replace it with `[5]` from another artifact or silently assign a coordinate convention absent from the comparison file | `qa/gov-520-production-comparison.json:1`; GOV-518 comparison amendment A3 at `scrum/GOV-518-ring-constraint-forcing-enumeration.md:129` |
| Theorem 3 prime denominator | `407`, for witness and dual coefficients; optimum margin `3/407`. Unique only under the declared max-margin objective, not a uniquely necessary natural weighting | `docs/A_TIER_TRIADIC_COMPRESSION_THEOREM.md:357-409`; `src/governor/certificate_verifier.py:11-22`; `canonical/harmonic-compression-candidates/CH_A012_q_v1.json:1`, `certificate` |
| Fibonacci expiry: 20 versus 21 | Different conditional bounds, not interchangeable receipts. Seven `q_v1` entries in `[0,3]` give upper bound 21. Retaining one Governor-seat entry equal to 2 tightens it to `2+6*3=20`. Thus the proposed next Fibonacci sum 21 is impossible under BOTH assumptions; without the seat constraint, the crude bound alone does not exclude 21 | `src/governor/harmonic_compression.py:44-58,92-106`; seat theorem `docs/A_TIER_TRIADIC_COMPRESSION_THEOREM.md:173-203`; observed sums and noncausal guard at lines 232-248 |
| Fibonacci extension status | `5,8,13` is observed/noncausal over A0-A2, not a registered recurrence. Neither upper bound proves attainability or an A3 value. No A3 under the declared construction algebra. As a separate descriptive check, all seven D1 `q_v2` record sums are 10, not 20 or 21; D1 is not A3 | `canonical/harmonic-compression-candidates/CH_A012_q_v1.json:1`, `invariants`; `canonical/harmonic-compression-candidates/CH_D17_q_v2.json:1`, D1 `records[].triadicCompressionSignature`; `provenance/OBSERVATION_LEDGER.md:196-213` |
| Fifth census imports | Imports hashing helpers and `FIFTH_POS`, `FULL_MASK`, `ShadowLadderError`, `_mask`, `_read_json`, `_sha`, `fifth_arc`, `fifth_span`, `mask_pitch_classes` from `shadow_ladder`. It also binds canonical ledger/network, Court positions, decision and observation ledgers. Not an input-independent ring-only oracle | `src/governor/fifth_space_census.py:11-40,108-135` |
| Z7 versus coefficient ring | Z7 indexes office positions; it does not automatically reduce coefficients modulo 7. Over integers, convolution gives `K^7=[2,35,7,21,21,7,35]` in office order starting at zero. Reduction in characteristic 7 gives `[2,0,0,0,0,0,0]`. `K^7=2*delta_0` is not a real identity | `docs/TIERED_PHOTONIC_THEOREM.md:53-71`; fresh seven-step integer convolution in this check |
| Photonic flags | `causationClaim:false`, `physicalQuantityClaim:false`, `tierClassifier:false`, `globalCHNull:true`; informational binding, not a physical law, classifier, or global C_H value | `canonical/tiered-photonic-candidates/tiered-photonic-v1.json:1`, `interpretationPolicy`; `docs/TIERED_PHOTONIC_THEOREM.md:117-135` |
| Photonic 325.9 | Not verified as a canonical A1/A2 derived wavelength. The complete theorem table contains no 325.9; sum bands are A1 `[216.09,317.19]`, A2 `[114.06,144.78]`, and geometric bands A1 `[433.59,637.18]`, A2 `[462.79,591.25]` nm. 325.9 lies outside all four. No supplied operand, formula, unit, or variant establishes another meaning | `docs/TIERED_PHOTONIC_THEOREM.md:99-115`; sidecar `invariants.strictBands`. Do not silently repair the number or invent its origin |

The Fibonacci bound is an elementary conditional calculation, not a test failure.
The seat theorem and `q_v1` domain are scoped to the admitted A tiers; imposing
them on a hypothetical continuation requires a separate definition. The D-tier
`q_v2` extension is not globally capped at 3 (`docs/D_TIER_TRIADIC_COMPRESSION_THEOREM.md:58`
and `scripts/validate-d-tier-harmonic-compression.py:180`).

## D-Tier Quantity Audit

The subsequent amendment's **declared-signature counts** `2,2,4,2,2,4,2` must not be relabeled
as `SEAT_CONTACT` rows. Nor is that sequence verified here as total contacts per
mode: the authoritative topology definition specifies FOUR for D1, split `2+2`
across two offices. Two is a per-office multiplicity for D1, not its total.
If the capture intends a different signature unit, that unit remains undefined.
No normalization is invented to make the proposed sequence agree.

| Tier | Capture count (unit unresolved for D1) | Defined contacts per mode | Selected SEAT_CONTACT rows | Distinct target anchors |
|---|---:|---:|---:|---:|
| D1 | 2 | 4 | 28 | 7 |
| D2 | 2 | 2 | 14 | 7 |
| D3 | 4 | 4 | 28 | 7 |
| D4 | 2 | 2 | 14 | 7 |
| D5 | 2 | 2 | 14 | 7 |
| D6 | 4 | 4 | 28 | 7 |
| D7 | 2 | 2 | 14 | 7 |

Source: `canonical/topology-identity-definitions.json:54-141`,
`anchorCategories.D.tiers`, and
`docs/TOPOLOGY_IDENTITY_AND_INVARIANTS.md:119-149`. Row counts were freshly
computed from `canonical/universal-network-data.json`, `d1SeatContactRows` through
`d7SeatContactRows`, grouped by `target`, and cross-checked against
`structuralEdges` of type `SEAT_CONTACT`. These are distinct quantities from
the 28 A-tier `CONSTRUCTS` edges and from GOV-517's 28 T2 witnesses.

## Recurrence Definition Gate

**Blocked at definition stage; no recurrence test run, no failed recurrence,
no test receipt.** OBS-008 defines the A-tier construction kernel, not a map
from powers of K to D1-D7 declared signature multiplicities
(`provenance/OBSERVATION_LEDGER.md:108-119`). The GOV-518 run-length/argmax map
also does not supply such a per-tier signature readout.

An executable proposal must independently define the coefficient ring, initial
condition, tier-to-power indexing, signature unit, and total readout from K to
each per-tier signature before observation/comparison. It must justify each
choice from permitted sources, not from the counts, including exceptions and
tie handling. No fitted rule, interpolation, selected coefficient, threshold,
or post-hoc D1 normalization is supplied here.

The analyst has already seen the capture counts and canonical counts. This work
cannot truthfully claim blind analyst status. A future isolated generator can
demonstrate target-independent execution, but cannot retroactively establish
blind discovery. Independent pre-existing justification and review are needed;
a fresh reviewer alone does not erase the design's exposure history.

## Execution Record

- **Ran:** read-only Node arithmetic over existing GOV-520 artifacts, counting
  class/statistic/result arrays and recomputing SHA-256; no enumeration rerun.
- **Ran:** read-only Node grouping of D-tier contact rows, D1 Q sums, integer
  K convolution and conditional scalar-bound arithmetic.
- **Ran:** `PYTHONDONTWRITEBYTECODE=1 python3 -m pytest -p no:cacheprovider -q tests/test_gov_213_harmonic_compression.py tests/test_fifth_space_census.py tests/test_gov_2xx_tiered_photonic.py`;
  **50 passed in 7.75s**. These are focused tests, not a full release receipt.
- **Not run:** recurrence, D4 derivation, canalization discrimination, or new
  ring-forcing enumeration; definitions/authorization are absent.
- **Not run:** generators, ledger synchronization, manifest packaging, full
  release validation, browser or Neo4j suites; this assignment owns only drafts.

Fresh SHA-256 checks match the historical receipt for the three files below:

| File under `qa/` | SHA-256 |
|---|---|
| `gov-520-production-enumeration.json` | `15b56a2c4f953e7bd19c583c04155d26728498e7bed66e6e82f8a450b34ea653` |
| `gov-520-production-comparison.json` | `695c816cd4c86fb928c8f611ab6226d487b309763f1bdd99ed165cb23d5bc1df` |
| `gov-520-production-receipt.json` | `475355836ef7bbbfb9a014f8e271447ebb625b5f03bdb07af718e422f892434b` |

This checks existing receipt bytes and internal counts, not every historical
input binding or the live validity of B3. The original three-predicate boundary
never ran; GOV-520's closed result is underdetermination under amended B3 only
(`provenance/DECISION_LEDGER.md:1624`). GOV-517 remains D5 office-coordinate
geometry only, per `provenance/DECISION_LEDGER.md:1680-1711`.
