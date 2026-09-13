import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluatePreflight } from './gov-517-engine-preflight.mjs';

test('G1-G5 engine pre-flight controls, isolation, exact dissociation and downstream seal', async () => {
  const result = await evaluatePreflight();
  assert.equal(result.controls_status, 'green');
  assert.equal(result.all_controls_green, true);
  assert.equal(result.engine_implemented, true);
  assert.deepEqual(result.code_verification_signatures.static_ast_call_graph.reachability.intersection, []);
  assert.equal(result.canonical_input_generation_executed, false);
  assert.equal(result.live_derivation_executed, false);
  assert.equal(result.negative_controls.nc3.mutant_failures, 49);
  assert.equal(result.determinism.build_twice_byte_identical, true);
  assert.equal(result.determinism.reordered_input_byte_identical, true);
  assert.equal(result.halt.live_run_authorized, result.status === 'green');
  for (const run of result.fixture_runs) {
    assert.match(run.generation_sha256, /^[a-f0-9]{64}$/);
    assert.equal(Object.hasOwn(run, 't1_set'), false);
    assert.equal(Object.hasOwn(run, 't3_assignment'), false);
  }
});
