import { createHash } from 'node:crypto';
import { types } from 'node:util';

/**
 * Downstream comparison core. No filesystem or generation imports.
 *
 * Generation (all fields required, no extras):
 *   t1_pass, t2_pass, t3_pass, window_invariant_hold,
 *   convergence_unambiguous: boolean
 *   t1_set, t2_set, t3_midpoints: ordered arrays of unique strings
 *   t3_assignment: plain mapping of office coordinates to strings
 *   per_state_routes: array of { state: string, in_t1: boolean, in_t2: boolean }
 *     with unique state IDs and exact membership flags for t1_set/t2_set;
 *     every set member must have a row, and neither-set rows are allowed.
 * Binding: nonempty inert JSON object; numeric values must be safe integers.
 *
 * readReference(): JSON text, synchronously or asynchronously. Its exact UTF-8
 * bytes must match expectedSha256, manifestExpected.sha256, checksumsExpected.sha256.
 * Reference: exactly the four REFERENCE_FIELDS below. Each operand is either an
 * ordered string set or an office-to-state-ID mapping. A different operand type
 * is a failed comparison, not malformed JSON. No coercion or normalization.
 * Checks retain each operand comparison; t1_match/t2_match mirror set matches,
 * and t3_match is the conjunction of assignment and midpoint matches.
 *
 * Digests use lowercase SHA-256 hex. Payload digests hash JSON.stringify output;
 * sealSha256 hashes the entire envelope excluding sealSha256. Object insertion
 * order is significant under JSON serialization, as is set order. SHA-256 is not
 * a signature: a party able to replace a seal can also recompute its digests.
 */
const MARKER = 'GOV517:fixture-generation-seal:v1';
const GENERATION_FIELDS = [
  't1_pass', 't1_set', 't2_pass', 't2_set', 't3_pass', 't3_assignment',
  't3_midpoints', 'per_state_routes', 'window_invariant_hold',
  'convergence_unambiguous',
];
const REFERENCE_FIELDS = [
  'canonical_D5_primary_reference_set',
  'canonical_D5_secondary_reference_set',
  'canonical_D5_convergence_assignment',
  'canonical_D5_midpoint_set',
];
const SEAL_FIELDS = [
  'marker', 'generation', 'binding', 'generationSha256', 'bindingSha256', 'sealSha256',
];
const isObject = value => value !== null && typeof value === 'object'
  && (Object.getPrototypeOf(value) === Object.prototype
    || Object.getPrototypeOf(value) === null);
const sha256 = text => createHash('sha256').update(text, 'utf8').digest('hex');
const isDigest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const exactKeys = (value, keys) => isObject(value)
  && Object.keys(value).length === keys.length
  && keys.every(key => Object.hasOwn(value, key));
const stringArray = value => Array.isArray(value)
  && value.every(item => typeof item === 'string');
const stringSet = value => stringArray(value) && new Set(value).size === value.length;
const assignment = value => isObject(value)
  && Object.entries(value).every(([key, item]) => key.length > 0 && typeof item === 'string');

// Inspect descriptors before serialization so accessors/toJSON never run.
function assertInert(value, ancestors = new Set()) {
  if (types.isProxy(value)) throw new TypeError('Proxy is not inert JSON');
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number' && Number.isSafeInteger(value) && !Object.is(value, -0)) return;
  if (typeof value !== 'object' || (!Array.isArray(value) && !isObject(value))) {
    throw new TypeError('Expected inert JSON');
  }
  if (ancestors.has(value)) throw new TypeError('Cyclic JSON');
  ancestors.add(value);
  const keys = Reflect.ownKeys(value);
  if (Array.isArray(value) && (Object.getPrototypeOf(value) !== Array.prototype
    || keys.length !== value.length + 1)) throw new TypeError('Non-JSON array');
  for (const key of keys) {
    if (Array.isArray(value) && key === 'length') continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')
      || (Array.isArray(value) && !/^(0|[1-9][0-9]*)$/.test(key))) {
      throw new TypeError('Non-JSON property');
    }
    assertInert(descriptor.value, ancestors);
  }
  ancestors.delete(value);
}

function assertGeneration(generation, binding) {
  if (!exactKeys(generation, GENERATION_FIELDS)
    || !['t1_pass', 't2_pass', 't3_pass', 'window_invariant_hold', 'convergence_unambiguous']
      .every(key => typeof generation[key] === 'boolean')
    || !['t1_set', 't2_set', 't3_midpoints'].every(key => stringSet(generation[key]))
    || !assignment(generation.t3_assignment)
    || !Array.isArray(generation.per_state_routes)
    || !generation.per_state_routes.every(row => exactKeys(row, ['state', 'in_t1', 'in_t2'])
      && typeof row.state === 'string'
      && typeof row.in_t1 === 'boolean' && typeof row.in_t2 === 'boolean')
    || !isObject(binding) || Object.keys(binding).length === 0) {
    throw new TypeError('Incomplete or malformed generation/binding');
  }
  const t1 = new Set(generation.t1_set);
  const t2 = new Set(generation.t2_set);
  const states = new Set();
  for (const row of generation.per_state_routes) {
    if (states.has(row.state) || row.in_t1 !== t1.has(row.state) || row.in_t2 !== t2.has(row.state)) {
      throw new TypeError('Duplicate state or inconsistent per-state membership');
    }
    states.add(row.state);
  }
  if ([...t1, ...t2].some(state => !states.has(state))) {
    throw new TypeError('Missing per-state set coverage');
  }
}

function freeze(value) {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function envelope(generation, binding) {
  return {
    marker: MARKER,
    generation,
    binding,
    generationSha256: sha256(JSON.stringify(generation)),
    bindingSha256: sha256(JSON.stringify(binding)),
  };
}

export function sealGeneration(generation, binding) {
  assertInert(generation);
  assertInert(binding);
  assertGeneration(generation, binding);
  const body = envelope(JSON.parse(JSON.stringify(generation)), JSON.parse(JSON.stringify(binding)));
  return freeze({ ...body, sealSha256: sha256(JSON.stringify(body)) });
}

export async function compareSealed(seal, options) {
  return compare(seal, options, false);
}

/**
 * Comparison-only synthetic projection staged for Phase 3, NOT a full canonical
 * carrier adapter; the registered canonical selector is not specified here.
 * Reference schema: { rows: [{ id: string, officeIndex: integer 0..6,
 *   tier: 'D5', type: 'SEAT_CONTACT' }] }, with unique IDs and no extra fields.
 * Generation contains no ledger state IDs: witness strings encode
 * [tier, childOffice, [parentOffice, parentOffice], routeClass].
 * T3 contains all unique tier/pair structures at offices witnessed by both routes.
 * per_state_routes remains raw witness-string membership metadata, not G5.
 * Classifications are in-memory only; any preflight receipt must record hashes
 * only, never these rows or generated/reference content. This module writes nothing.
 */
export async function compareWitnessRows(seal, options) {
  return compare(seal, options, true);
}

function projectWitnessRows(generation) {
  const offices = [new Set(), new Set()];
  const witnesses = [];
  for (const [index, key] of ['t1_set', 't2_set'].entries()) {
    const strings = generation[key];
    if (JSON.stringify(strings) !== JSON.stringify([...strings].sort())) {
      throw new TypeError('Witnesses must be in lexical order');
    }
    for (const text of strings) {
      const tuple = JSON.parse(text);
      if (!Array.isArray(tuple) || tuple.length !== 4
        || !['A0', 'A1', 'A2'].includes(tuple[0])
        || typeof tuple[1] !== 'string' || !/^[0-6]$/.test(tuple[1])
        || !Array.isArray(tuple[2]) || tuple[2].length !== 2
        || !tuple[2].every(office => typeof office === 'string' && /^[0-6]$/.test(office))
        || tuple[2][0] === tuple[2][1]
        || tuple[3] !== ['primary', 'secondary'][index]
        || JSON.stringify(tuple) !== text) throw new TypeError('Malformed witness encoding');
      offices[index].add(tuple[1]);
      witnesses.push(tuple);
    }
  }
  const pairs = new Map();
  const midpoints = new Set();
  for (const [tier, office, pair] of witnesses) {
    if (!offices.every(route => route.has(office))) continue;
    if (!pairs.has(office)) pairs.set(office, new Set());
    pairs.get(office).add(JSON.stringify([tier, pair]));
    midpoints.add(JSON.stringify([office, tier, pair]));
  }
  if (Object.keys(generation.t3_assignment).length !== pairs.size
    || [...pairs].some(([office, structures]) => generation.t3_assignment[office]
      !== JSON.stringify([...structures].sort().map(text => JSON.parse(text))))
    || JSON.stringify(generation.t3_midpoints) !== JSON.stringify([...midpoints].sort())) {
    throw new TypeError('Incomplete or inconsistent witness convergence');
  }
  return offices;
}

async function compare(seal, options, witnessRows) {
  const fixtureOnly = options?.fixtureOnly === true;
  const liveRun = options?.liveRun === true;
  if (!fixtureOnly && !liveRun) {
    throw new TypeError('Nonfixture comparison requires maintainer live-run approval; not implemented');
  }
  let verified;
  let offices;
  try {
    assertInert(seal);
    if (!exactKeys(seal, SEAL_FIELDS) || seal.marker !== MARKER
      || !['generationSha256', 'bindingSha256', 'sealSha256'].every(key => isDigest(seal[key]))) {
      throw new TypeError('Malformed seal');
    }
    verified = sealGeneration(seal.generation, seal.binding);
    if (['generationSha256', 'bindingSha256', 'sealSha256'].some(key => seal[key] !== verified[key])) {
      throw new TypeError('Seal digest mismatch');
    }
    if (witnessRows) offices = projectWitnessRows(verified.generation);
  } catch {
    return freeze({ fixtureOnly, valid: false, error: 'invalid-generation-seal' });
  }

  // Snapshot all expectations before crossing the caller-controlled async boundary.
  let readReference;
  let expectedSha256;
  try {
    readReference = options.readReference;
    expectedSha256 = options.expectedSha256;
    for (const expected of [options.manifestExpected, options.checksumsExpected]) {
      assertInert(expected);
      if (!exactKeys(expected, ['sha256']) || !isDigest(expected.sha256)
        || expected.sha256 !== expectedSha256) throw new TypeError('Fingerprint mismatch');
    }
    if (typeof readReference !== 'function' || !isDigest(expectedSha256)) {
      throw new TypeError('Invalid fixture options');
    }
  } catch {
    return freeze({ fixtureOnly, valid: false, error: 'invalid-reference-expectations' });
  }

  try {
    const text = await readReference();
    if (typeof text !== 'string') throw new TypeError('Reference must be JSON text');
    const referenceSha256 = sha256(text);
    if (referenceSha256 !== expectedSha256) {
      return freeze({ fixtureOnly, valid: false, error: 'reference-fingerprint-mismatch' });
    }
    const reference = JSON.parse(text);
    assertInert(reference);
    const digests = {
      generationSha256: verified.generationSha256,
      bindingSha256: verified.bindingSha256,
      sealSha256: verified.sealSha256,
      referenceSha256,
    };
    if (witnessRows) {
      if (!exactKeys(reference, ['rows']) || !Array.isArray(reference.rows)
        || !reference.rows.every(row => exactKeys(row, ['id', 'officeIndex', 'tier', 'type'])
          && typeof row.id === 'string' && Number.isSafeInteger(row.officeIndex)
          && row.officeIndex >= 0 && row.officeIndex <= 6
          && row.tier === 'D5' && row.type === 'SEAT_CONTACT')
        || new Set(reference.rows.map(row => row.id)).size !== reference.rows.length) {
        throw new TypeError('Malformed synthetic observation projection');
      }
      const classifications = reference.rows.map(row => {
        const in_t1 = offices[0].has(String(row.officeIndex));
        const in_t2 = offices[1].has(String(row.officeIndex));
        return {
          state: row.id, in_t1, in_t2,
          classification: in_t1 ? (in_t2 ? 'both' : 'primary-only')
            : (in_t2 ? 'secondary-only' : 'neither'),
        };
      });
      return freeze({ fixtureOnly, valid: true, digests, classifications });
    }
    if (!exactKeys(reference, REFERENCE_FIELDS)
      || !REFERENCE_FIELDS.every(key => stringSet(reference[key]) || assignment(reference[key]))) {
      throw new TypeError('Malformed reference schema');
    }
    const generation = verified.generation;
    const checks = {};
    for (const [index, key] of ['t1_set', 't2_set', 't3_assignment', 't3_midpoints'].entries()) {
      checks[key] = JSON.stringify(generation[key]) === JSON.stringify(reference[REFERENCE_FIELDS[index]]);
    }
    checks.t1_match = checks.t1_set;
    checks.t2_match = checks.t2_set;
    checks.t3_match = checks.t3_assignment && checks.t3_midpoints;
    for (const key of ['t1_pass', 't2_pass', 't3_pass', 'window_invariant_hold', 'convergence_unambiguous']) {
      checks[key] = generation[key];
    }
    return freeze({
        fixtureOnly,
      valid: true,
      digests,
      checks,
    });
  } catch {
    return freeze({ fixtureOnly, valid: false, error: 'invalid-reference' });
  }
}
