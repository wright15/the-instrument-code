# Seven Governors Harmonic Invariants

Version `0.1.0` is the CRT-303 candidate invariant registry over
`court-substrate:0.1.0`. It computes rather than restates:

- signed Court transition vectors and `G_Court = 2I_4`;
- all 25 values of `d_H(C_i,C_j) = 2|i-j|`;
- pairwise-disjoint XOR supports and the weight-five invariant;
- exact `kappa_court = i/4` ratios;
- Carey's 5-35 difference/failure counts, `CQ = 1`, and `SQ = 1/2`; and
- an unresolved, machine-enforced aggregate `C_H` namespace guard.

The Carey evaluator enumerates 20 directed interval instances, 20 difference
witnesses, and all 150 cross-generic comparisons. It does not import test
oracles or accept supplied failure/difference counts. Non-5-35 input is rejected
by the scoped evaluator; a raw diagnostic enumerator remains available for
research comparisons.

## Validate

```bash
npm run validate
```

Regenerate canonical data, QA reports, and the package manifest with:

```bash
npm run release:emit
```

The package remains `proposed_pending_crt_309`; its proven invariant records do
not totalize aggregate `C_H` and do not alter integrated release 1.2.0.
