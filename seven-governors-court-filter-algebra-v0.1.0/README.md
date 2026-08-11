# Seven Governors Court Filter Algebra 0.1.0

This versioned CRT-304 package admits only the fixed-root linear diagonal Court
projection `P_c(x) = x AND c`. Its seven filters are C0-C4 and the reviewed
rooted 5-23 and 5-27 bridges from CRT-302. There is no third bridge:
`minimalAdditionalBridgeFilters` is empty.

The Python package `court_filter_algebra` exposes immutable operators,
applications, mutation applications, and five-valued commutation results:

```python
from court_filter_algebra import CourtFilterOperator, apply_filter, evaluate_commutation

court = CourtFilterOperator(
    "court-filter:5-23:root-0", "linear_diagonal", 173, "pentatonic:5-23"
)
application = apply_filter(court, 1453)
commutation = evaluate_commutation(court, "R7", 1453)
```

The ambient domain and codomain are all 12-bit binary vectors. The image is the
set of support subsets of `c`; the global inverse is absent because projection
is non-injective, while restriction to the image is identity. Exact bit
reduction is source weight minus retained weight.

## Canonical outputs

- `canonical/filter-algebra-release.json`
- `canonical/filter-operator-registry.json`
- `canonical/bridge-route-comparison.json`
- `canonical/commutation-table.json`
- `canonical/non-commutation-records.json`

The commutation build covers 7 filters x 15 mutation operators x 462 canonical
rooted heptatonic operands, or 48,510 evaluations. It independently evaluates
all mutation operators and requires exact parity with all 3,402 frozen audit
applications.

## Commands

```text
npm run build:check
npm run build:emit
npm test
npm run validate:registry
npm run validate:determinism
npm run manifest:check
npm run manifest:emit
npm run release:emit
npm run validate
```

The package has `integratedAdmission: proposed_pending_crt_309`. Root validators
consume its evidence, but it makes no active runtime or canonical topology
changes.
