import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { digest } from './gov-517-input-registration.mjs';
import { loadRegisteredEnvelope, makeFixture, screenEnvelope } from './gov-517-screened-inputs.mjs';

test('fixed registered loading only screens sources, never generates', () => {
  const { envelope, binding, screening } = loadRegisteredEnvelope();
  const registration = JSON.parse(readFileSync(new URL('./gov-517-input-boundary-registration.json', import.meta.url)));
  assert.deepEqual(Object.keys(envelope), ['i1', 'i2', 'i3', 'i4']);
  assert.equal(envelope.i1.length, 28);
  assert.equal(envelope.i2.length, 28);
  assert.equal(envelope.i4.length, 21);
  assert.equal(envelope.i3, null);
  assert.deepEqual(envelope.i4.map((row) => row.id), registration.i4.enumerated_anchor_list.map((row) => row.stateId));
  assert.equal(binding.i1, registration.bindings[0].recomputed_sha256);
  assert.equal(binding.i2, binding.i1);
  assert.equal(binding.i3, null);
  assert.equal(binding.i4.ledger, registration.bindings[1].recomputed_sha256);
  assert.equal(binding.i4.census, registration.bindings[2].recomputed_sha256);
  assert.equal(binding.manifest_binding, registration.manifest_binding);
  assert.equal(binding.envelope_sha256, digest(JSON.stringify(envelope)));
  assert.equal(screening.source_bound, true);
  assert.equal(screening.generation_authorized, true);
  assert.notEqual(envelope.i1, envelope.i2);
  envelope.i1.forEach((row, index) => {
    assert.notEqual(row, envelope.i2[index]);
    assert.deepEqual(Object.keys(row), ['id', 'source', 'target', 'type', 'parentTier']);
  });
  envelope.i4.forEach((row) => assert.deepEqual(Object.keys(row), ['id', 'tier', 'role', 'officeIndex', 'fifthMask']));
});

test('deterministic synthetic fixture, detached immutable snapshots and interior intersections', () => {
  const fixture = makeFixture();
  assert.deepEqual(fixture, makeFixture());
  const screened = screenEnvelope(fixture);
  assert.deepEqual(screened, fixture);
  assert.notEqual(screened, fixture);
  fixture.i2[0].type = 'DECOY';
  assert.equal(fixture.i1[0].type, 'CONSTRUCTS');
  assert.equal(screened.i2[0].type, 'CONSTRUCTS');
  for (const value of [screened, screened.i1, screened.i2, screened.i4, ...screened.i1, ...screened.i2, ...screened.i4]) {
    assert.ok(Object.isFrozen(value));
  }
  assert.throws(() => { screened.i1[0].source = 1; }, TypeError);
  for (let tier = 0; tier < 3; tier++) {
    for (let office = 1; office < 6; office++) {
      let intersection = BigInt(screened.i4[tier * 7 + office - 1].fifthMask)
        & BigInt(screened.i4[tier * 7 + office + 1].fifthMask);
      let count = 0n;
      while (intersection) { count += intersection & 1n; intersection >>= 1n; }
      assert.equal(count, 5n);
    }
  }
});

test('controlled metadata mutations require fixture mode and cannot contaminate I1', () => {
  for (const mutate of [
    (f) => { f.i2[0].type = 'DECOY'; },
    (f) => { f.i4[0].tier = 'X'; },
    (f) => { f.i4[0].role = 'decoy'; },
  ]) {
    const fixture = makeFixture();
    mutate(fixture);
    assert.throws(() => screenEnvelope(fixture), /excluded_input_detected/);
    assert.doesNotThrow(() => screenEnvelope(fixture, { fixtureOnly: true }));
  }
  const fixture = makeFixture();
  fixture.i1[0].type = 'DECOY';
  assert.throws(() => screenEnvelope(fixture, { fixtureOnly: true }), /excluded_input_detected/);
});

test('closed schemas reject malformed values and excluded classes in both modes', () => {
  const mutations = [
    (f) => { f.i1.pop(); }, (f) => { f.i2.pop(); }, (f) => { f.i4.pop(); },
    (f) => { f.i1[1].id = f.i1[0].id; }, (f) => { f.i2[1].id = f.i2[0].id; },
    (f) => { f.i4[1].id = f.i4[0].id; },
    (f) => { f.i4[1].officeIndex = 0; },
    (f) => { f.i2[0].source = 999; }, (f) => { f.i2[0].target = f.i2[0].source; },
    (f) => { f.i1[0].parentTier = 'A1'; },
    (f) => { f.i4[0].tier = 'D5'; }, (f) => { f.i2[0].type = 'SEAT_CONTACT'; },
    (f) => { f.i4[0].role = 'satellite'; },
    ...[undefined, [], {}, '', 0, false].map((value) => (f) => { f.i3 = value; }),
    ...[NaN, Infinity, 1.5, -1, -0, 1n, '10000', Number.MAX_SAFE_INTEGER + 1, () => 1].map((value) =>
      (f) => { f.i4[0].id = value; }),
    ...['', 'observed D5 run', 'SEAT_CONTACT', 1, {}, () => 'id'].map((value) =>
      (f) => { f.i2[0].id = value; }),
    ...[0, 4096, 128, 127.5, '127'].map((value) => (f) => { f.i4[0].fifthMask = value; }),
    ...['observed', 'D5', 'seat', 'run', 'mask', 'maxrun', 'containment', 'twinhub', 'sourceClass', 'mutation', 'office'].flatMap((key) => [
      (f) => { f[key] = { synthetic: true }; },
      (f) => { f.i2[0][key] = { type: 'DECOY' }; },
      (f) => { f.i4[0][key] = 'synthetic'; },
    ]),
    (f) => { f.i2.extra = true; },
    (f) => { delete f.i2[0]; },
    (f) => { f.i4[0][Symbol('hidden')] = true; },
    (f) => { Object.setPrototypeOf(f.i4[0], { observed: true }); },
  ];
  for (const mutate of mutations) {
    for (const fixtureOnly of [false, true]) {
      const fixture = makeFixture();
      mutate(fixture);
      assert.throws(() => screenEnvelope(fixture, { fixtureOnly }), /excluded_input_detected/);
    }
  }
});

test('accessors and proxies are rejected without invoking getters or traps', () => {
  let reads = 0;
  const sentinel = () => { reads++; throw new Error('payload_read'); };
  for (const mutate of [
    (f) => { Object.defineProperty(f, 'i3', { get: sentinel }); },
    (f) => { Object.defineProperty(f.i2[0], 'source', { get: sentinel }); },
    (f) => { Object.defineProperty(f.i4[0], 'observed', { get: sentinel }); },
    (f) => { Object.defineProperty(f.i4, '0', { get: sentinel }); },
    (f) => { f.i4[0] = new Proxy(f.i4[0], { get: sentinel, ownKeys: sentinel, getPrototypeOf: sentinel }); },
    (f) => { const { proxy, revoke } = Proxy.revocable({}, {}); revoke(); f.i3 = proxy; },
  ]) {
    const fixture = makeFixture();
    mutate(fixture);
    assert.throws(() => screenEnvelope(fixture, { fixtureOnly: true }), /excluded_input_detected/);
  }
  assert.throws(() => screenEnvelope(new Proxy(makeFixture(), { getPrototypeOf: sentinel })), /excluded_input_detected/);
  assert.equal(reads, 0);
});
