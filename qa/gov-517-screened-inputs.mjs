import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { types } from 'node:util';
import {
  digest, verifyBinding, enumerateAnchors, loadAOnlyMasks, registeredConstructionRows,
} from './gov-517-input-registration.mjs';

const root = new URL('../', import.meta.url);
const paths = [
  'canonical/universal-network-data.json',
  'canonical/universal-heptatonic-ledger.json',
  'canonical/fivefold-incubator/fifth-space-census-v0.json',
];
const tiers = ['A0', 'A1', 'A2'];

function requireInput(condition) {
  if (!condition) throw Object.assign(new Error('excluded_input_detected'), { status: 'invalid', reason: 'excluded_input_detected' });
}

export function screenBoundEnvelope(envelope, expectedSha256) {
  const screened = screenEnvelope(envelope);
  requireInput(typeof expectedSha256 === 'string' && /^[a-f0-9]{64}$/.test(expectedSha256));
  requireInput(digest(JSON.stringify(screened)) === expectedSha256);
  return screened;
}

// Inspect descriptors, never getters. Reject proxies before any reflective operation.
function fields(value, keys, array = false) {
  requireInput(value !== null && typeof value === 'object' && !types.isProxy(value));
  requireInput(Array.isArray(value) === array);
  requireInput(Object.getPrototypeOf(value) === (array ? Array.prototype : Object.prototype));
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const ownKeys = Reflect.ownKeys(descriptors);
  requireInput(ownKeys.length === keys.length && keys.every((key) => Object.hasOwn(descriptors, key)));
  for (const key of ownKeys) {
    requireInput(Object.hasOwn(descriptors[key], 'value'));
    requireInput(key === 'length' || descriptors[key].enumerable);
  }
  return Object.fromEntries(keys.map((key) => [key, descriptors[key].value]));
}

function rows(value, count, keys) {
  const indices = Array.from({ length: count }, (_, index) => String(index));
  const data = fields(value, [...indices, 'length'], true);
  requireInput(data.length === count);
  return indices.map((index) => fields(data[index], keys));
}

function integer(value) {
  return Number.isSafeInteger(value) && value >= 0 && !Object.is(value, -0);
}

function freeze(value) {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

/** Shape screening only, not independent source authority. Fixture mode never authorizes production.
 * This trusted I/O adapter is outside the pure integer engine's AST claim.
 */
export function screenEnvelope(envelope, { fixtureOnly = false } = {}) {
  requireInput(typeof fixtureOnly === 'boolean');
  const data = fields(envelope, ['i1', 'i2', 'i3', 'i4']);
  requireInput(data.i3 === null);
  const i4 = rows(data.i4, 21, ['id', 'tier', 'role', 'officeIndex', 'fifthMask']);
  const byId = new Map();
  for (const row of i4) {
    requireInput(integer(row.id) && !byId.has(row.id));
    requireInput(tiers.includes(row.tier) || (fixtureOnly && row.tier === 'X'));
    requireInput(row.role === 'anchor' || (fixtureOnly && row.role === 'decoy'));
    requireInput(integer(row.officeIndex) && row.officeIndex < 7);
    requireInput(integer(row.fifthMask) && row.fifthMask < 4096);
    let bits = BigInt(row.fifthMask);
    let count = 0n;
    while (bits) { count += bits & 1n; bits >>= 1n; }
    requireInput(count === 7n);
    byId.set(row.id, row);
  }
  const badTierFixture = fixtureOnly && i4.some((row) => row.tier === 'X');
  for (const tier of tiers) {
    const group = i4.filter((row) => row.tier === tier);
    requireInput(badTierFixture ? group.length <= 7 : group.length === 7);
    requireInput(new Set(group.map((row) => row.officeIndex)).size === group.length);
  }
  const edgeKeys = ['id', 'source', 'target', 'type', 'parentTier'];
  const i1 = rows(data.i1, 28, edgeKeys);
  const i2 = rows(data.i2, 28, edgeKeys);
  for (const edges of [i1, i2]) {
    const ids = new Set();
    for (const row of edges) {
      // IDs are opaque inert tokens, not a channel for observation prose or source classes.
      requireInput(typeof row.id === 'string' && /^constructs:A[01]:[0-9]+:[0-9]+:-?[0-9]+$/.test(row.id));
      requireInput(!ids.has(row.id));
      ids.add(row.id);
      requireInput(integer(row.source) && integer(row.target));
      requireInput(row.type === 'CONSTRUCTS' || (fixtureOnly && edges === i2 && row.type === 'DECOY'));
      requireInput(row.parentTier === 'A0' || row.parentTier === 'A1');
      const source = byId.get(row.source);
      const target = byId.get(row.target);
      requireInput(source !== undefined && target !== undefined);
      requireInput(source.tier === row.parentTier || (fixtureOnly && source.tier === 'X'));
      requireInput(target.tier === (row.parentTier === 'A0' ? 'A1' : 'A2') || (fixtureOnly && target.tier === 'X'));
    }
  }
  return freeze({ i1, i2, i3: null, i4 });
}

/** Fixed-path, read-only loading. Verify every carrier before decoding any carrier JSON. */
export function loadRegisteredEnvelope() {
  const registration = JSON.parse(readFileSync(new URL('qa/gov-517-input-boundary-registration.json', root)));
  const manifestBytes = readFileSync(new URL('MANIFEST.json', root));
  const manifest = JSON.parse(manifestBytes);
  const checksums = readFileSync(new URL('CHECKSUMS.sha256', root), 'utf8');
  const bytes = paths.map((path) => readFileSync(new URL(path, root)));
  const bindings = paths.map((path, index) => verifyBinding(path, bytes[index], manifest, checksums));
  assert.deepEqual(bindings, registration.bindings, 'registration_bindings_mismatch');
  assert.equal(registration.status, 'green', 'registration_not_green');
  const [network, ledger, census] = bytes.map((value) => JSON.parse(value));
  const anchors = enumerateAnchors(ledger);
  assert.deepEqual(anchors, registration.i4.enumerated_anchor_list, 'registration_enumeration_mismatch');
  assert.equal(registration.i4.enumerated_anchor_count, 21);
  assert.equal(registration.i4.loaded_record_count, 21);
  const i4 = loadAOnlyMasks(census, anchors).map(({ stateId, tier, role, officeIndex, fifthMask }) =>
    ({ id: stateId, tier, role, officeIndex, fifthMask }));
  const edges = registeredConstructionRows(network).map((row) => {
    requireInput(row.relationTier === row.auditTier && row.selected === true);
    return { id: row.id, source: row.source, target: row.target, type: row.type, parentTier: row.auditTier };
  });
  // I1 is an independent snapshot; transition provenance consumes I2 source records.
  const envelope = screenEnvelope({ i1: edges.map((row) => ({ ...row })), i2: edges, i3: null, i4 });
  const binding = {
    i1: bindings[0].recomputed_sha256,
    i2: bindings[0].recomputed_sha256,
    i3: null,
    i4: { ledger: bindings[1].recomputed_sha256, census: bindings[2].recomputed_sha256 },
    manifest_binding: 'per-file MANIFEST.json and CHECKSUMS.sha256 entries',
    envelope_sha256: digest(JSON.stringify(envelope)),
  };
  return freeze({ envelope, binding, screening: {
    pass: true, fixtureOnly: false, source_bound: true, generation_authorized: true,
  } });
}

/** Synthetic generator inputs, not canonical observations and never production-authorized.
 * Mutable by design so negative controls can alter them before detached screening.
 */
export function makeFixture() {
  const i4 = [];
  const i2 = [];
  for (let tier = 0n; tier < 3n; tier += 1n) {
    for (let office = 0n; office < 7n; office += 1n) {
      const initial = (1n << 7n) - 1n;
      const mask = ((initial >> office) | (initial << (12n - office))) & ((1n << 12n) - 1n);
      i4.push({ id: Number(10000n + tier * 7n + office), tier: `A${tier}`, role: 'anchor',
        officeIndex: Number(office), fifthMask: Number(mask) });
      if (tier === 2n) continue;
      for (const delta of [-1n, 1n]) {
        const source = 10000n + tier * 7n + (office + delta + 7n) % 7n;
        const target = 10000n + (tier + 1n) * 7n + office;
        i2.push({ id: `constructs:A${tier}:${source}:${target}:0`, source: Number(source),
          target: Number(target), type: 'CONSTRUCTS', parentTier: `A${tier}` });
      }
    }
  }
  return { i1: i2.map((row) => ({ ...row })), i2, i3: null, i4 };
}
