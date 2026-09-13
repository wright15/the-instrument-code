import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertEmptyI3, digest, enumerateAnchors, loadAOnlyMasks,
  registeredConstructionRows, verifyBinding,
} from './gov-517-input-registration.mjs';

function fixture() {
  const ledger = [];
  for (const tier of ['A0', 'A1', 'A2']) {
    for (let officeIndex = 0; officeIndex < 7; officeIndex++) {
      ledger.push({ id: 10000 + ledger.length, tier, role: 'anchor', office: `office-${officeIndex}`, officeIndex });
    }
  }
  const census = { records: ledger.map(({ id, ...row }) => ({ ...row, stateId: id, fifthMask: 127 })) };
  return { ledger, census };
}

test('binding verifier accepts exact manifest/checksum/byte agreement', () => {
  const bytes = Buffer.from('synthetic-only');
  const sha256 = digest(bytes);
  const result = verifyBinding('fixture', bytes, { files: [{ path: 'fixture', sha256 }] }, `${sha256}  fixture\n`);
  assert.equal(result.pass, true);
});

test('binding verifier rejects altered bytes and missing or duplicate bindings', () => {
  const bytes = Buffer.from('synthetic-only');
  const sha256 = digest(bytes);
  const entry = { path: 'fixture', sha256 };
  assert.throws(() => verifyBinding('fixture', Buffer.from('tamper'), { files: [entry] }, `${sha256}  fixture\n`), /binding_mismatch/);
  assert.throws(() => verifyBinding('fixture', bytes, { files: [] }, ''), /binding_unavailable/);
  assert.throws(() => verifyBinding('fixture', bytes, { files: [entry, entry] }, ''), /binding_unavailable_or_duplicate/);
  assert.throws(() => verifyBinding('fixture', bytes, { files: [entry] }, `${'0'.repeat(64)}  fixture\n`), /checksum_mismatch/);
});

test('I3 accepts exactly the registered null representation', () => {
  assert.doesNotThrow(() => assertEmptyI3(null));
  for (const value of [undefined, {}, [], '', 0, { artifact: 'synthetic-decoy' }]) {
    assert.throws(() => assertEmptyI3(value), /i3_not_empty/);
  }
});

test('anchor enumeration yields exactly 21 identities and 7 per tier', () => {
  const { ledger, census } = fixture();
  const anchors = enumerateAnchors(ledger);
  assert.equal(anchors.length, 21);
  assert.equal(loadAOnlyMasks(census, anchors).length, 21);
  assert.deepEqual(enumerateAnchors([...ledger].reverse()), anchors);
});

test('enumeration rejects count, identity, and office-coordinate corruption', () => {
  const { ledger } = fixture();
  assert.throws(() => enumerateAnchors(ledger.slice(1)), /anchor_count_mismatch/);
  const duplicate = structuredClone(ledger);
  duplicate[1].id = duplicate[0].id;
  assert.throws(() => enumerateAnchors(duplicate), /duplicate_anchor/);
  const wrongOffice = structuredClone(ledger);
  wrongOffice[1].officeIndex = wrongOffice[0].officeIndex;
  assert.throws(() => enumerateAnchors(wrongOffice), /duplicate_office_index/);
});

test('mask slice does not access excluded payloads, even with colliding identities', () => {
  const { ledger, census } = fixture();
  const anchors = enumerateAnchors(ledger);
  const expected = loadAOnlyMasks(census, anchors);
  for (const descriptor of [
    { tier: 'D5', role: 'anchor', office: 'office-0' },
    { tier: 'A0', role: 'satellite', office: 'office-0' },
    { tier: 'A0', role: 'anchor', office: null },
  ]) {
    census.records.push({ ...descriptor, stateId: anchors[0].stateId,
      get fifthMask() { throw new Error('excluded_payload_read'); } });
  }
  assert.deepEqual(loadAOnlyMasks(census, anchors), expected);
});

test('mask loader rejects missing, duplicate, and unregistered identities', () => {
  const { ledger, census } = fixture();
  const anchors = enumerateAnchors(ledger);
  assert.throws(() => loadAOnlyMasks({ records: census.records.slice(1) }, anchors), /loaded_record_count_mismatch/);
  const duplicate = structuredClone(census);
  duplicate.records[1] = duplicate.records[0];
  assert.throws(() => loadAOnlyMasks(duplicate, anchors));
  const unregistered = structuredClone(census);
  unregistered.records[0].stateId = 20000;
  assert.throws(() => loadAOnlyMasks(unregistered, anchors), /unregistered_anchor/);
});

test('mask loader rejects invalid masks and identity metadata mismatches', () => {
  const { ledger, census } = fixture();
  const anchors = enumerateAnchors(ledger);
  const corrupt = structuredClone(census);
  corrupt.records[0].fifthMask = 1;
  assert.throws(() => loadAOnlyMasks(corrupt, anchors), /mask_cardinality_mismatch/);
  corrupt.records[0] = { ...census.records[0], office: 'wrong-office' };
  assert.throws(() => loadAOnlyMasks(corrupt, anchors), /anchor_office_mismatch/);
});

test('confirmed selector selects only CONSTRUCTS, not the summary or an unregistered array', () => {
  const rows = Array.from({ length: 28 }, () => ({ type: 'CONSTRUCTS', auditTier: 'A0' }));
  assert.equal(registeredConstructionRows({ structuralEdges: rows }).length, 28);
  assert.throws(() => registeredConstructionRows({ summary: { constructionEdges: 28 }, constructionEdges: rows }), /registered_section_missing/);
  const excluded = { type: 'SEAT_CONTACT',
    get auditTier() { throw new Error('excluded_row_payload_read'); } };
  assert.deepEqual(registeredConstructionRows({ structuralEdges: [...rows, excluded] }), rows);
});

test('construction screen rejects non-CONSTRUCTS rows and wrong cardinality', () => {
  const rows = Array.from({ length: 28 }, () => ({ type: 'CONSTRUCTS', auditTier: 'A0' }));
  assert.throws(() => registeredConstructionRows({ structuralEdges: rows.slice(1) }), /construction_edge_count_mismatch/);
  rows[0].type = 'NON_CONSTRUCTS';
  assert.throws(() => registeredConstructionRows({ structuralEdges: rows }), /construction_edge_count_mismatch/);
  rows[0] = { type: 'CONSTRUCTS', auditTier: 'D5' };
  assert.throws(() => registeredConstructionRows({ structuralEdges: rows }), /non_a_tier_edge/);
});
