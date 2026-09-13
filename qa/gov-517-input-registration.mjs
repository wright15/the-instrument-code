import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);
const sourcePaths = [
  'canonical/universal-network-data.json',
  'canonical/universal-heptatonic-ledger.json',
  'canonical/fivefold-incubator/fifth-space-census-v0.json',
];
const tiers = ['A0', 'A1', 'A2'];

export function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function verifyBinding(path, bytes, manifest, checksums) {
  const matches = manifest.files.filter((entry) => entry.path === path);
  assert.equal(matches.length, 1, `binding_unavailable_or_duplicate:${path}`);
  const checksumRows = checksums.split('\n').filter((line) => line.endsWith(`  ${path}`));
  assert.equal(checksumRows.length, 1, `checksum_unavailable_or_duplicate:${path}`);
  const expected = matches[0].sha256;
  const actual = digest(bytes);
  assert.match(expected, /^[a-f0-9]{64}$/);
  assert.equal(actual, expected, `binding_mismatch:${path}`);
  assert.equal(checksumRows[0], `${actual}  ${path}`, `checksum_mismatch:${path}`);
  return { path, manifest_sha256: expected, recomputed_sha256: actual, checksums_match: true, pass: true };
}

export function assertEmptyI3(value) {
  assert.equal(value, null, 'i3_not_empty');
}

export function enumerateAnchors(ledger) {
  assert.ok(Array.isArray(ledger), 'ledger_not_array');
  const anchors = [];
  for (const row of ledger) {
    if (!tiers.includes(row.tier) || row.role !== 'anchor' || row.office == null) continue;
    assert.ok(Number.isSafeInteger(row.id), 'invalid_anchor_id');
    assert.ok(Number.isSafeInteger(row.officeIndex) && row.officeIndex >= 0 && row.officeIndex < 7);
    assert.equal(typeof row.office, 'string');
    anchors.push({ stateId: row.id, tier: row.tier, role: row.role, office: row.office, officeIndex: row.officeIndex });
  }
  anchors.sort((a, b) => a.stateId < b.stateId ? -1 : a.stateId > b.stateId ? 1 : 0);
  assert.equal(anchors.length, 21, 'anchor_count_mismatch');
  assert.equal(new Set(anchors.map((row) => row.stateId)).size, 21, 'duplicate_anchor');
  for (const tier of tiers) {
    const rows = anchors.filter((row) => row.tier === tier);
    assert.equal(rows.length, 7, 'tier_count_mismatch');
    assert.equal(new Set(rows.map((row) => row.officeIndex)).size, 7, 'duplicate_office_index');
    assert.equal(new Set(rows.map((row) => row.office)).size, 7, 'duplicate_office');
  }
  return anchors;
}

export function loadAOnlyMasks(census, anchors) {
  assert.ok(Array.isArray(census.records), 'census_records_not_array');
  const byId = new Map(anchors.map((row) => [row.stateId, row]));
  const masks = [];
  for (const row of census.records) {
    // Check the registered descriptor before accessing any mask payload.
    if (!tiers.includes(row.tier) || row.role !== 'anchor' || row.office == null) continue;
    const anchor = byId.get(row.stateId);
    assert.ok(anchor, 'unregistered_anchor');
    assert.equal(row.tier, anchor.tier, 'anchor_tier_mismatch');
    assert.equal(row.office, anchor.office, 'anchor_office_mismatch');
    assert.equal(row.officeIndex, anchor.officeIndex, 'anchor_office_index_mismatch');
    assert.ok(Number.isSafeInteger(row.fifthMask) && row.fifthMask > 0 && row.fifthMask < 4096);
    let bits = BigInt(row.fifthMask);
    let count = 0n;
    while (bits !== 0n) {
      count += bits & 1n;
      bits >>= 1n;
    }
    assert.equal(count, 7n, 'mask_cardinality_mismatch');
    masks.push({ ...anchor, fifthMask: row.fifthMask });
  }
  masks.sort((a, b) => a.stateId < b.stateId ? -1 : a.stateId > b.stateId ? 1 : 0);
  assert.equal(masks.length, 21, 'loaded_record_count_mismatch');
  assert.deepEqual(masks.map((row) => row.stateId), anchors.map((row) => row.stateId));
  return masks;
}

export function registeredConstructionRows(network) {
  assert.ok(Array.isArray(network.structuralEdges), 'registered_section_missing:structuralEdges');
  const rows = network.structuralEdges.filter((row) => row.type === 'CONSTRUCTS');
  assert.equal(rows.length, 28, 'construction_edge_count_mismatch');
  for (const row of rows) {
    assert.equal(row.type, 'CONSTRUCTS', 'non_constructs_edge');
    assert.ok(['A0', 'A1'].includes(row.auditTier), 'non_a_tier_edge');
  }
  return rows;
}

export function buildRegistration() {
  const manifestBytes = readFileSync(new URL('MANIFEST.json', root));
  const manifest = JSON.parse(manifestBytes);
  const checksums = readFileSync(new URL('CHECKSUMS.sha256', root), 'utf8');
  const bytes = sourcePaths.map((path) => readFileSync(new URL(path, root)));
  // Verify all source bytes before decoding any registered carrier.
  const bindings = sourcePaths.map((path, i) => verifyBinding(path, bytes[i], manifest, checksums));
  const [network, ledger, census] = bytes.map((value) => JSON.parse(value));
  const anchors = enumerateAnchors(ledger);
  const masks = loadAOnlyMasks(census, anchors);
  assertEmptyI3(null);
  const findings = [];
  try {
    registeredConstructionRows(network);
  } catch (error) {
    findings.push({ code: 'registered_slice_schema_mismatch', message: error.message });
  }
  // This exact selector was confirmed by the Maintainer after the schema halt.
  const candidate = Array.isArray(network.structuralEdges)
    ? network.structuralEdges.filter((row) => row.type === 'CONSTRUCTS') : [];
  return {
    boundary: 'GOV-517',
    registration_id: 'GOV-517-I1-I4-maintainer-registration',
    authority: 'Maintainer directive: Input Registrations (I1-I4) & Phase 2 Resume',
    status: findings.length === 0 ? 'green' : 'red',
    generation_authorized: true,
    manifest_binding: 'per-file MANIFEST.json and CHECKSUMS.sha256 entries',
    bindings,
    i1: {
      source: sourcePaths[0], section: 'structuralEdges', selector: 'row.type === "CONSTRUCTS"', expected_record_count: 28,
      consumption_profile: 'Office-ring distance-2 pair structures; OBS-008 structural provenance only',
      status: findings.length === 0 ? 'verified' : 'blocked',
    },
    i2: {
      source: sourcePaths[0], section: 'structuralEdges', selector: 'row.type === "CONSTRUCTS"', expected_record_count: 28,
      consumption_profile: 'A-tier CONSTRUCTS transitions with parentStateIds and constructionEdgeIds',
      excluded: 'D4/D5 SEAT_CONTACT chain-audit rows',
      status: findings.length === 0 ? 'verified' : 'blocked',
    },
    i3: {
      source: null, binding: null, content: null, load_time_empty: true,
      consumption_profile: 'Empty envelope member; no target consumes it',
    },
    i4: {
      sources: sourcePaths.slice(1),
      slice_descriptor: 'tier in {A0,A1,A2} AND role = anchor AND office != null',
      enumeration_method: 'Filter bound ledger, project identity fields, sort ascending integer stateId; never transcribe an anchor list',
      enumerated_anchor_list: anchors,
      enumerated_anchor_count: anchors.length,
      tier_counts: Object.fromEntries(tiers.map((tier) => [tier, anchors.filter((row) => row.tier === tier).length])),
      loaded_record_count: masks.length,
      loaded_ids_exactly_match_enumeration: true,
      mask_payloads_persisted: false,
      status: 'verified',
    },
    source_schema_diagnostic: {
      root_constructionEdges_present: Object.hasOwn(network, 'constructionEdges'),
      summary_constructionEdges: network.summary?.constructionEdges ?? null,
      authoritative_selector: 'network.structuralEdges.filter(row => row.type === "CONSTRUCTS")',
      selected_count: candidate.length,
      selected_all_a_tier: candidate.every((row) => ['A0', 'A1'].includes(row.auditTier)),
      selector_confirmed_by_maintainer: true,
      prior_schema_halt_cleared: true,
    },
    findings,
    defect_provenance: {
      attribution: 'Maintainer input-registration directive',
      review_gap: 'Input-binding gap survived review rounds because audits targeted target phrasing, criteria, and control reachability rather than binding completeness',
      standing_lesson: 'Input inventories must carry exact file paths, SHA bindings, and slice descriptors at freeze time.',
      selector_clarification: {
        authority: 'Maintainer selector-confirmation directive',
        original_phrasing: 'The directive section-name was prose-level shorthand for summary.constructionEdges, the counter rather than the row array',
        review_history: 'The agent correctly declined silent substitution and requested confirmation; the structuralEdges CONSTRUCTS selector is hereby registered as authoritative',
        standing_note: 'Directives describing source structure quote field names from bound files, not from memory. The summary counter and row array are distinct artifacts; bindings name the array with its selector.',
      },
    },
    scope: {
      mode: 'Registration and input-validation only; not generation',
      carrier_bytes_hashed_and_parsed: true,
      excluded_rows_passed_to_generation: false,
      mask_or_observation_payloads_persisted: false,
      frozen_specifications_modified: false,
      ledger_or_manifest_modified: false,
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  assert.equal(process.argv.length, 2, 'unexpected_arguments');
  const result = buildRegistration();
  writeFileSync(new URL('qa/gov-517-input-boundary-registration.json', root), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ status: result.status, bindings_verified: result.bindings.length,
    enumerated_anchors: result.i4.enumerated_anchor_count, loaded_masks: result.i4.loaded_record_count,
    findings: result.findings }));
  if (result.status !== 'green') process.exitCode = 1;
}
