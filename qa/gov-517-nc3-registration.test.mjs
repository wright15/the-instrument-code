import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const registration = JSON.parse(readFileSync(
  new URL('./gov-517-nc3-boundary-registration.json', import.meta.url), 'utf8',
));

// Enumerate integer points rather than assuming the intersection formula.
for (const [stimulus, offset, upper, expectedFailures] of [
  ['baseline', 0n, 6n, 0n],
  ['uniform_offset', 1n, 6n, 0n],
  ['width_mutant', 0n, 5n, 49n],
]) {
  test(`NC-3 stimulus reachability: ${stimulus}`, () => {
    let cases = 0n;
    let failures = 0n;
    for (let j = 0n; j < 7n; j++) {
      for (let d = 0n; d < 7n; d++) {
        let cardinality = 0n;
        for (let x = -j + offset; x <= upper - j + offset; x++) {
          if (x >= -(j + d) + offset && x <= upper - (j + d) + offset) {
            cardinality++;
          }
        }
        cases++;
        if (cardinality !== 7n - d) failures++;
      }
    }
    assert.equal(cases, 49n);
    assert.equal(failures, expectedFailures);
    const recorded = registration.empirical_verification.results.find(
      (row) => row.stimulus === stimulus,
    );
    assert.ok(recorded);
    assert.equal(BigInt(recorded.cases), cases);
    assert.equal(BigInt(recorded.intersection_rule_failures), failures);
  });
}
