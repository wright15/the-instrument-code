import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { sealGeneration, compareSealed, compareWitnessRows } from './gov-517-downstream-comparison.mjs';

// All state/contact values and bindings in this file are synthetic fixtures.
const hash = text => createHash('sha256').update(text, 'utf8').digest('hex');
const clone = value => JSON.parse(JSON.stringify(value));
function fixture() {
  const generation = {
    t1_pass: true, t1_set: ['synthetic-contact-a', 'synthetic-contact-b'],
    t2_pass: true, t2_set: ['synthetic-contact-c', 'synthetic-contact-d'],
    t3_pass: true, t3_assignment: { 'office-a': 'state-a', 'office-b': 'state-b' },
    t3_midpoints: ['synthetic-midpoint-a', 'synthetic-midpoint-b'],
    per_state_routes: [
      { state: 'synthetic-contact-a', in_t1: true, in_t2: false },
      { state: 'synthetic-contact-b', in_t1: true, in_t2: false },
      { state: 'synthetic-contact-c', in_t1: false, in_t2: true },
      { state: 'synthetic-contact-d', in_t1: false, in_t2: true },
      { state: 'synthetic-neither', in_t1: false, in_t2: false },
    ],
    window_invariant_hold: true, convergence_unambiguous: true,
  };
  const binding = { fixture: 'synthetic-only', inputs: { sha256: hash('synthetic input'), revision: 1 } };
  const reference = {
    canonical_D5_primary_reference_set: clone(generation.t1_set),
    canonical_D5_secondary_reference_set: clone(generation.t2_set),
    canonical_D5_convergence_assignment: clone(generation.t3_assignment),
    canonical_D5_midpoint_set: clone(generation.t3_midpoints),
  };
  return { generation, binding, reference, seal: sealGeneration(generation, binding) };
}
function options(reference) {
  const text = typeof reference === 'string' ? reference : JSON.stringify(reference);
  const sha256 = hash(text);
  return {
    fixtureOnly: true, readReference: () => text, expectedSha256: sha256,
    manifestExpected: { sha256 }, checksumsExpected: { sha256 },
  };
}
async function assertNoRead(seal) {
  let reads = 0;
  const result = await compareSealed(seal, {
    ...options(fixture().reference), readReference: () => { reads++; throw new Error('Unexpected read'); },
  });
  assert.equal(reads, 0);
  assert.deepEqual(result, { fixtureOnly: true, valid: false, error: 'invalid-generation-seal' });
}

test('proxy traps cannot run during seal validation', async () => {
  let traps = 0;
  const trap = () => { traps += 1; throw new Error('proxy trap executed'); };
  const proxy = new Proxy({}, { get: trap, getPrototypeOf: trap, ownKeys: trap, getOwnPropertyDescriptor: trap });
  assert.throws(() => sealGeneration(proxy, { fixture: true }), /Proxy is not inert JSON/);
  await assertNoRead(proxy);
  const { generation, binding } = fixture();
  generation.t1_set = new Proxy([], { get: trap, getPrototypeOf: trap, ownKeys: trap });
  assert.throws(() => sealGeneration(generation, binding), /Proxy is not inert JSON/);
  assert.equal(traps, 0);
});

test('exact comparison exposes only fixture digests and checks', async () => {
  const { seal, reference } = fixture();
  const result = await compareSealed(seal, options(reference));
  assert.deepEqual(Object.keys(result), ['fixtureOnly', 'valid', 'digests', 'checks']);
  assert.equal(result.fixtureOnly, true);
  assert.equal(result.valid, true);
  assert.equal(Object.keys(result.checks).length, 12);
  assert.ok(Object.values(result.checks).every(value => value === true));
  assert.equal(result.digests.referenceSha256, hash(JSON.stringify(reference)));
  assert.ok(Object.isFrozen(result.checks));
});

test('each comparison is exact, order-sensitive, and rejects cross-type equality', async () => {
  const fields = [
    ['canonical_D5_primary_reference_set', 't1_set'],
    ['canonical_D5_secondary_reference_set', 't2_set'],
    ['canonical_D5_convergence_assignment', 't3_assignment'],
    ['canonical_D5_midpoint_set', 't3_midpoints'],
  ];
  for (const [referenceKey, check] of fields) {
    for (const change of ['nonmatching', 'reordered', 'type-mismatch']) {
      const { seal, reference } = fixture();
      const original = reference[referenceKey];
      if (change === 'type-mismatch') reference[referenceKey] = Array.isArray(original) ? {} : [];
      else if (Array.isArray(original)) {
        reference[referenceKey] = change === 'reordered' ? original.toReversed() : ['synthetic-other'];
      } else {
        reference[referenceKey] = change === 'reordered'
          ? Object.fromEntries(Object.entries(original).reverse()) : { 'office-a': 'synthetic-other' };
      }
      const result = await compareSealed(seal, options(reference));
      assert.equal(result.valid, true, `${check}: ${change}`);
      assert.equal(result.checks[check], false, `${check}: ${change}`);
      assert.equal(result.checks.t1_match, check !== 't1_set');
      assert.equal(result.checks.t2_match, check !== 't2_set');
      assert.equal(result.checks.t3_match, check !== 't3_assignment' && check !== 't3_midpoints');
    }
  }
});

test('every materialized field is required before reference reading', async () => {
  const { generation, binding, seal } = fixture();
  for (const key of Object.keys(generation)) {
    const incomplete = clone(generation);
    delete incomplete[key];
    assert.throws(() => sealGeneration(incomplete, binding), TypeError);
    await assertNoRead({ ...seal, generation: incomplete });
  }
});

test('per-state schema, uniqueness, membership, and coverage fail before reading even with recomputed digests', async () => {
  const { generation, binding, seal } = fixture();
  const rows = generation.per_state_routes;
  const invalidRoutes = [
    { 'synthetic-contact-a': ['office-a'] },
    null,
    [],
    [...rows, clone(rows[0])],
    [...rows, { ...rows[0], in_t1: false }],
    [...rows, { state: 'synthetic-extra', in_t1: true, in_t2: false }],
    [...rows, { state: 'synthetic-extra', in_t1: false, in_t2: true }],
  ];
  for (let index = 0; index < 4; index++) {
    invalidRoutes.push(rows.filter((_, i) => i !== index));
  }
  for (const index of [0, 2, 4]) {
    for (const key of ['in_t1', 'in_t2']) {
      const changed = clone(rows);
      changed[index][key] = !changed[index][key];
      invalidRoutes.push(changed);
    }
  }
  for (const key of ['state', 'in_t1', 'in_t2']) {
    const missing = clone(rows);
    delete missing[0][key];
    invalidRoutes.push(missing);
    const malformed = clone(rows);
    malformed[0][key] = key === 'state' ? 1 : 'true';
    invalidRoutes.push(malformed);
  }
  invalidRoutes.push([{ ...rows[0], classification: 'synthetic' }, ...rows.slice(1)]);
  for (const per_state_routes of invalidRoutes) {
    const invalid = { ...generation, per_state_routes };
    assert.throws(() => sealGeneration(invalid, binding), TypeError);
    // Recompute every digest so rejection proves semantic validation, not stale hashes.
    const { sealSha256, ...body } = clone(seal);
    body.generation = invalid;
    body.generationSha256 = hash(JSON.stringify(invalid));
    await assertNoRead({ ...body, sealSha256: hash(JSON.stringify(body)) });
  }
});

test('per-state routes allow both-set and neither-set rows and empty sets', async () => {
  const { generation, binding, reference } = fixture();
  generation.t2_set.push(generation.t1_set[0]);
  generation.per_state_routes[0].in_t2 = true;
  reference.canonical_D5_secondary_reference_set = clone(generation.t2_set);
  const result = await compareSealed(sealGeneration(generation, binding), options(reference));
  assert.equal(result.valid, true);
  assert.equal(result.checks.t2_match, true);
  generation.t1_set = [];
  generation.t2_set = [];
  for (const per_state_routes of [[], [{ state: 'synthetic-neither', in_t1: false, in_t2: false }]]) {
    assert.doesNotThrow(() => sealGeneration({ ...generation, per_state_routes }, binding));
  }
});

test('t3_match requires both operand matches', async () => {
  for (const assignmentMatch of [false, true]) {
    for (const midpointMatch of [false, true]) {
      const { seal, reference } = fixture();
      if (!assignmentMatch) reference.canonical_D5_convergence_assignment = {};
      if (!midpointMatch) reference.canonical_D5_midpoint_set = [];
      const { valid, checks } = await compareSealed(seal, options(reference));
      assert.equal(valid, true);
      assert.equal(checks.t3_assignment, assignmentMatch);
      assert.equal(checks.t3_midpoints, midpointMatch);
      assert.equal(checks.t3_match, assignmentMatch && midpointMatch);
    }
  }
});

test('missing, malformed, and tampered seals never invoke reader', async () => {
  const { seal } = fixture();
  for (const value of [undefined, null, {}, [], 'seal']) await assertNoRead(value);
  for (const key of Object.keys(seal)) {
    const incomplete = clone(seal);
    delete incomplete[key];
    await assertNoRead(incomplete);
  }
  for (const key of ['marker', 'generationSha256', 'bindingSha256', 'sealSha256']) {
    await assertNoRead({ ...seal, [key]: 'malformed' });
  }
  for (const key of Object.keys(seal.generation)) {
    const tampered = clone(seal);
    const value = tampered.generation[key];
    tampered.generation[key] = typeof value === 'boolean' ? !value
      : Array.isArray(value) ? [...value, 'synthetic-extra'] : { ...value, extra: 'synthetic-extra' };
    await assertNoRead(tampered);
  }
  const tampered = clone(seal);
  tampered.binding.inputs.revision = 2;
  await assertNoRead(tampered);
  tampered.bindingSha256 = hash(JSON.stringify(tampered.binding));
  await assertNoRead(tampered);
  await assertNoRead({ ...seal, extra: true });
});

test('digests independently recompute and bind the entire payload and marker', () => {
  const { generation, binding, seal } = fixture();
  assert.equal(seal.generationSha256, hash(JSON.stringify(generation)));
  assert.equal(seal.bindingSha256, hash(JSON.stringify(binding)));
  const { sealSha256, ...body } = seal;
  assert.equal(sealSha256, hash(JSON.stringify(body)));
  assert.deepEqual(sealGeneration(generation, binding), seal);
  assert.notEqual(hash(JSON.stringify({ ...body, marker: 'other' })), sealSha256);
});

test('seal is a detached deeply immutable JSON snapshot', async () => {
  const { generation, binding, seal, reference } = fixture();
  generation.t1_set.push('synthetic-extra');
  binding.inputs.revision = 2;
  assert.throws(() => { seal.generation.t1_set.push('extra'); }, TypeError);
  assert.throws(() => { seal.generation.per_state_routes[0].in_t1 = false; }, TypeError);
  assert.throws(() => { seal.binding.inputs.revision = 3; }, TypeError);
  assert.throws(() => { seal.marker = 'other'; }, TypeError);
  assert.equal((await compareSealed(clone(seal), options(reference))).checks.t1_set, true);
});

test('inert JSON excludes accessors, hooks, cycles, holes, and coercions', async () => {
  const { generation, binding, seal } = fixture();
  let calls = 0;
  const accessor = Object.defineProperty({}, 't1_pass', { enumerable: true, get() { calls++; return true; } });
  assert.throws(() => sealGeneration(accessor, binding), TypeError);
  await assertNoRead(Object.defineProperty({}, 'generation', { enumerable: true, get() { calls++; return generation; } }));
  const cyclic = {}; cyclic.self = cyclic;
  for (const bad of [{}, cyclic, { toJSON() { calls++; return {}; } }, { value: undefined },
    { value: NaN }, { value: 1.5 }, { value: -0 }, { value: 1n }, { value: new Date(0) },
    { value: new Array(2) }, { [Symbol('synthetic')]: true }]) {
    assert.throws(() => sealGeneration(generation, bad), TypeError);
  }
  for (const bad of [1, null, ['duplicate', 'duplicate'], [{ contact: 'synthetic' }]]) {
    await assertNoRead({ ...seal, generation: { ...generation, t1_set: bad } });
  }
  assert.equal(calls, 0);
});

test('all fingerprint expectations must agree and reference bytes must match', async () => {
  const { seal, reference } = fixture();
  for (const key of ['expectedSha256', 'manifestExpected', 'checksumsExpected']) {
    const opts = options(reference);
    opts[key] = key === 'expectedSha256' ? hash('other') : { sha256: hash('other') };
    let reads = 0;
    opts.readReference = () => { reads++; return JSON.stringify(reference); };
    assert.equal((await compareSealed(seal, opts)).valid, false);
    assert.equal(reads, 0);
  }
  const result = await compareSealed(seal, {
    ...options(reference), readReference: () => `${JSON.stringify(reference)} `,
  });
  assert.equal(result.valid, false);
  assert.equal(result.error, 'reference-fingerprint-mismatch');
});

test('reference schema failures and reader failures are invalid', async () => {
  const { seal, reference } = fixture();
  const missing = clone(reference); delete missing.canonical_D5_midpoint_set;
  for (const bad of ['not json', '{}', missing, { ...reference, extra: true },
    { ...reference, canonical_D5_midpoint_set: [1] },
    { ...reference, canonical_D5_convergence_assignment: { office: ['state'] } }]) {
    assert.equal((await compareSealed(seal, options(bad))).error, 'invalid-reference');
  }
  for (const readReference of [() => reference, () => { throw new Error('failure'); },
    async () => { throw new Error('failure'); }]) {
    assert.equal((await compareSealed(seal, { ...options(reference), readReference })).valid, false);
  }
});

test('false generation checks remain checks, never dispositions', async () => {
  const { generation, binding, reference } = fixture();
  for (const key of ['t1_pass', 't2_pass', 't3_pass', 'window_invariant_hold', 'convergence_unambiguous']) {
    generation[key] = false;
  }
  const result = await compareSealed(sealGeneration(generation, binding), options(reference));
  assert.equal(result.valid, true);
  assert.equal(result.checks.t1_pass, false);
  assert.equal(result.checks.window_invariant_hold, false);
  assert.equal(result.checks.convergence_unambiguous, false);
  assert.equal(result.checks.t1_match, true);
  assert.equal(result.checks.t2_match, true);
  assert.equal(result.checks.t3_match, true);
  assert.deepEqual(Object.keys(result), ['fixtureOnly', 'valid', 'digests', 'checks']);
});

test('verification snapshot survives caller mutation during async reference read', async () => {
  const { seal, reference } = fixture();
  const mutable = clone(seal);
  const opts = options(reference);
  opts.readReference = async () => {
    mutable.generation.t1_set.reverse();
    mutable.binding.inputs.revision = 2;
    opts.expectedSha256 = hash('other');
    return JSON.stringify(reference);
  };
  assert.equal((await compareSealed(mutable, opts)).checks.t1_set, true);
});

test('nonfixture calls are explicitly rejected without reading', async () => {
  const { seal, reference } = fixture();
  let reads = 0;
  for (const fixtureOnly of [undefined, false, 'true', 1]) {
    await assert.rejects(compareSealed(seal, {
      ...options(reference), fixtureOnly, readReference: () => { reads++; },
    }), /maintainer live-run approval/);
  }
  await assert.rejects(compareSealed(seal), /maintainer live-run approval/);
  assert.equal(reads, 0);
});

function witnessFixture() {
  const { generation, binding } = fixture();
  generation.t1_set = [
    ['A0', '0', ['1', '2'], 'primary'],
    ['A1', '2', ['0', '3'], 'primary'],
    ['A2', '2', ['4', '6'], 'primary'],
  ].map(JSON.stringify).sort();
  generation.t2_set = [
    ['A0', '1', ['0', '2'], 'secondary'],
    ['A0', '2', ['1', '5'], 'secondary'],
    ['A1', '2', ['0', '3'], 'secondary'],
  ].map(JSON.stringify).sort();
  const pairs = [['A0', ['1', '5']], ['A1', ['0', '3']], ['A2', ['4', '6']]];
  generation.t3_assignment = { 2: JSON.stringify(pairs) };
  generation.t3_midpoints = pairs.map(([tier, pair]) => JSON.stringify(['2', tier, pair])).sort();
  generation.per_state_routes = [...generation.t1_set, ...generation.t2_set].map(state => ({
    state, in_t1: generation.t1_set.includes(state), in_t2: generation.t2_set.includes(state),
  }));
  const reference = { rows: [0, 1, 2, 3].map(officeIndex => ({
    id: `synthetic-row-${officeIndex}`, officeIndex, tier: 'D5', type: 'SEAT_CONTACT',
  })) };
  return { generation, binding, reference, seal: sealGeneration(generation, binding) };
}

test('G5 projects four cells by office, not witness or ledger ID equality, in memory only', async () => {
  const { seal, reference } = witnessFixture();
  const result = await compareWitnessRows(seal, options(reference));
  assert.deepEqual(Object.keys(result), ['fixtureOnly', 'valid', 'digests', 'classifications']);
  assert.equal(result.fixtureOnly, true);
  assert.equal(result.valid, true);
  assert.deepEqual(result.classifications, [
    { state: 'synthetic-row-0', in_t1: true, in_t2: false, classification: 'primary-only' },
    { state: 'synthetic-row-1', in_t1: false, in_t2: true, classification: 'secondary-only' },
    { state: 'synthetic-row-2', in_t1: true, in_t2: true, classification: 'both' },
    { state: 'synthetic-row-3', in_t1: false, in_t2: false, classification: 'neither' },
  ]);
  assert.ok(Object.isFrozen(result.classifications[0]));
  assert.equal(result.digests.generationSha256, hash(JSON.stringify(seal.generation)));
  assert.equal(result.digests.bindingSha256, hash(JSON.stringify(seal.binding)));
  const { sealSha256, ...body } = seal;
  assert.equal(result.digests.sealSha256, hash(JSON.stringify(body)));
  assert.equal(result.digests.referenceSha256, hash(JSON.stringify(reference)));
});

test('ordered reversed parent pairs are accepted and retained in T3 structures', async () => {
  const { generation, binding, reference } = witnessFixture();
  const witness = JSON.stringify(['A1', '2', ['3', '0'], 'primary']);
  generation.t1_set.push(witness);
  generation.t1_set.sort();
  generation.per_state_routes.push({ state: witness, in_t1: true, in_t2: false });
  const structures = JSON.parse(generation.t3_assignment[2]);
  structures.push(['A1', ['3', '0']]);
  generation.t3_assignment[2] = JSON.stringify(
    structures.map(JSON.stringify).sort().map(text => JSON.parse(text)),
  );
  const midpoint = JSON.stringify(['2', 'A1', ['3', '0']]);
  generation.t3_midpoints.push(midpoint);
  generation.t3_midpoints.sort();
  const seal = sealGeneration(generation, binding);
  assert.equal((await compareWitnessRows(seal, options(reference))).valid, true);
  assert.ok(seal.generation.t3_midpoints.includes(midpoint));
  assert.ok(seal.generation.t3_midpoints.includes(JSON.stringify(['2', 'A1', ['0', '3']])));
  assert.deepEqual(JSON.parse(seal.generation.t3_assignment[2]), [
    ['A0', ['1', '5']], ['A1', ['0', '3']], ['A1', ['3', '0']], ['A2', ['4', '6']],
  ]);
});

test('malformed witness encodings including diagonal pairs and incomplete T3 fail before any reference read', async () => {
  const badTuples = [
    ['D5', '0', ['1', '2'], 'primary'], ['A3', '0', ['1', '2'], 'primary'],
    ['A0', 0, ['1', '2'], 'primary'], ['A0', '00', ['1', '2'], 'primary'],
    ['A0', '7', ['1', '2'], 'primary'],
    ['A0', '0', ['1', '1'], 'primary'], ['A0', '0', [1, '2'], 'primary'],
    ['A0', '0', ['1', '7'], 'primary'], ['A0', '0', ['1', '2'], 'secondary'],
    ['A0', '0', ['1', '2']], ['A0', '0', ['1', '2'], 'primary', 'extra'],
  ].map(JSON.stringify);
  const changes = [...badTuples, 'not JSON', '{}', ' ["A0","0",["1","2"],"primary"]']
    .map(text => generation => {
      generation.t1_set[0] = text;
      generation.t1_set.sort();
      generation.per_state_routes = [...generation.t1_set, ...generation.t2_set].map(state => ({
        state, in_t1: generation.t1_set.includes(state), in_t2: generation.t2_set.includes(state),
      }));
    });
  changes.push(
    g => g.t1_set.reverse(),
    g => { g.t3_assignment = {}; },
    g => { g.t3_assignment[2] = JSON.stringify([['A1', ['0', '3']]]); },
    g => { g.t3_assignment[0] = '[]'; },
    g => { g.t3_midpoints = []; },
    g => g.t3_midpoints.reverse(),
    g => { delete g.t3_assignment; },
    g => { delete g.t3_midpoints; },
  );
  for (const change of changes) {
    const { seal, reference } = witnessFixture();
    const { sealSha256, ...body } = clone(seal);
    change(body.generation);
    body.generationSha256 = hash(JSON.stringify(body.generation));
    let reads = 0;
    const result = await compareWitnessRows({ ...body, sealSha256: hash(JSON.stringify(body)) }, {
      ...options(reference), readReference: () => { reads++; throw new Error('Unexpected read'); },
    });
    assert.equal(reads, 0);
    assert.equal(result.error, 'invalid-generation-seal');
  }
});

test('witness comparison checks every sealed field before reading', async () => {
  const { seal, reference } = witnessFixture();
  for (const key of Object.keys(seal.generation)) {
    const changed = clone(seal);
    delete changed.generation[key];
    let reads = 0;
    assert.equal((await compareWitnessRows(changed, {
      ...options(reference), readReference: () => { reads++; },
    })).error, 'invalid-generation-seal');
    assert.equal(reads, 0);
  }
});

test('witness reference fingerprints precede parsing and all expectations precede reading', async () => {
  const { seal, reference } = witnessFixture();
  for (const key of ['expectedSha256', 'manifestExpected', 'checksumsExpected']) {
    const opts = options(reference);
    opts[key] = key === 'expectedSha256' ? hash('other') : { sha256: hash('other') };
    let reads = 0;
    opts.readReference = () => { reads++; };
    assert.equal((await compareWitnessRows(seal, opts)).error, 'invalid-reference-expectations');
    assert.equal(reads, 0);
  }
  for (const text of ['not JSON', `${JSON.stringify(reference)} `]) {
    assert.equal((await compareWitnessRows(seal, {
      ...options(reference), readReference: () => text,
    })).error, 'reference-fingerprint-mismatch');
  }
});

test('synthetic projection rejects malformed rows and duplicate IDs', async () => {
  const { seal, reference } = witnessFixture();
  const row = reference.rows[0];
  const badRows = [null, { ...row, extra: true }, { ...row, id: 1 },
    ...[-1, 7, 1.5, '0', Number.MAX_SAFE_INTEGER + 1].map(officeIndex => ({ ...row, officeIndex })),
    { ...row, tier: 'A0' }, { ...row, type: 'OTHER' }];
  for (const key of Object.keys(row)) {
    const missing = { ...row }; delete missing[key]; badRows.push(missing);
  }
  for (const bad of ['not JSON', {}, { rows: {} }, { ...reference, extra: true },
    { rows: [row, row] }, ...badRows.map(value => ({ rows: [value] }))]) {
    assert.equal((await compareWitnessRows(seal, options(bad))).error, 'invalid-reference');
  }
});

test('true generation values need no canonical reader; witness API refuses nonfixture calls', async () => {
  const { seal, reference } = witnessFixture();
  let syntheticReads = 0;
  const opts = { ...options(reference), readReference: async () => {
    syntheticReads++;
    return JSON.stringify(reference);
  } };
  assert.equal((await compareWitnessRows(seal, opts)).valid, true);
  assert.equal(syntheticReads, 1);
  for (const fixtureOnly of [undefined, false, 'true', 1, new Boolean(true)]) {
    await assert.rejects(compareWitnessRows(seal, { ...opts, fixtureOnly }), /maintainer live-run approval/);
  }
  await assert.rejects(compareWitnessRows(seal), /maintainer live-run approval/);
  assert.equal(syntheticReads, 1);
});

test('authorized live witness comparison preserves G5 classification semantics', async () => {
  const { seal, reference } = witnessFixture();
  const result = await compareWitnessRows(seal, {
    ...options(reference), fixtureOnly: false, liveRun: true,
  });
  assert.equal(result.fixtureOnly, false);
  assert.equal(result.valid, true);
  assert.deepEqual(result.classifications.map(row => row.classification), [
    'primary-only', 'secondary-only', 'both', 'neither',
  ]);
});
