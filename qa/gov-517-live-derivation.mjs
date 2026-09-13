import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { generate } from '../scripts/gov-517-d5-derivation-engine.mjs';
import { compareWitnessRows, sealGeneration } from './gov-517-downstream-comparison.mjs';
import { digest, verifyBinding } from './gov-517-input-registration.mjs';
import { loadRegisteredEnvelope, screenBoundEnvelope } from './gov-517-screened-inputs.mjs';

const root = new URL('../', import.meta.url);
const encode = value => JSON.stringify(value, (_, item) => typeof item === 'bigint' ? String(item) : item);
const unique = values => [...new Set(values)].sort();

function materialize(raw) {
  const t1_set = unique(raw.t1_set.map(encode));
  const t2_set = unique(raw.t2_set.map(encode));
  const t3_assignment = {};
  for (const [office, pairs] of raw.t3_assignment) {
    t3_assignment[String(office)] = JSON.stringify(unique(pairs.map(encode)).map(text => JSON.parse(text)));
  }
  return {
    t1_pass: raw.t1_pass, t1_set,
    t2_pass: raw.t2_pass, t2_set,
    t3_pass: raw.t3_pass, t3_assignment,
    t3_midpoints: unique(raw.t3_midpoints.map(encode)),
    per_state_routes: unique([...t1_set, ...t2_set]).map(state => ({
      state, in_t1: t1_set.includes(state), in_t2: t2_set.includes(state),
    })),
    window_invariant_hold: raw.window_invariant_hold,
    convergence_unambiguous: raw.convergence_unambiguous,
  };
}

function canonicalD5Reference() {
  const manifest = JSON.parse(readFileSync(new URL('MANIFEST.json', root)));
  const checksums = readFileSync(new URL('CHECKSUMS.sha256', root), 'utf8');
  const paths = ['canonical/universal-network-data.json', 'canonical/universal-heptatonic-ledger.json'];
  const bytes = paths.map(path => readFileSync(new URL(path, root)));
  const bindings = paths.map((path, index) => verifyBinding(path, bytes[index], manifest, checksums));
  const [network, ledger] = bytes.map(value => JSON.parse(value));
  const byId = new Map(ledger.map(row => [row.id, row]));
  const rows = network.structuralEdges.filter(edge => edge.type === 'SEAT_CONTACT'
    && edge.auditTier === 'D5' && edge.relationTier === 'D5'
    && edge.contactTier === 'A2' && edge.selected === true).map(edge => {
    const satellite = byId.get(edge.source);
    const target = byId.get(edge.target);
    assert.ok(satellite && target, 'canonical_d5_endpoint_missing');
    assert.equal(satellite.role, 'satellite', 'canonical_d5_satellite_role');
    assert.equal(satellite.tier, edge.contactTier, 'canonical_d5_satellite_tier');
    assert.equal(target.role, 'anchor', 'canonical_d5_target_role');
    assert.equal(target.tier, 'D5', 'canonical_d5_target_tier');
    assert.ok(Number.isSafeInteger(target.officeIndex) && target.officeIndex >= 0 && target.officeIndex < 7);
    const governors = network.structuralEdges.filter(governs => governs.type === 'GOVERNS'
      && governs.target === edge.source && governs.selected === true);
    assert.equal(governors.length, 1, 'canonical_d5_governing_parent_count');
    const parent = byId.get(governors[0].source);
    assert.ok(parent, 'canonical_d5_parent_missing');
    assert.equal(parent.role, 'anchor', 'canonical_d5_parent_role');
    assert.equal(parent.tier, 'A2', 'canonical_d5_parent_tier');
    assert.equal(parent.officeIndex, satellite.officeIndex, 'canonical_d5_parent_office');
    assert.equal(parent.officeIndex, target.officeIndex, 'canonical_d5_target_office');
    return { id: edge.id, officeIndex: target.officeIndex, tier: 'D5', type: 'SEAT_CONTACT' };
  });
  assert.equal(rows.length, 14, 'canonical_d5_row_count');
  assert.equal(new Set(rows.map(row => row.id)).size, rows.length, 'canonical_d5_row_identity');
  return { text: JSON.stringify({ rows }), bindings };
}

function category(generation, comparison) {
  const targetsPass = generation.t1_pass && generation.t2_pass && generation.t3_pass;
  const allBoth = comparison.classifications.length > 0
    && comparison.classifications.every(row => row.classification === 'both');
  if (targetsPass && allBoth) {
    return {
      category: 'derived',
      disposition: 'Supports H1-mechanism route for D5; weakens H3-authorship for D5; H2: no disposition; D4: no disposition.',
    };
  }
  return {
    category: 'not_derived',
    disposition: 'Weakens H1-mechanism route for D5; compatible-with-but-not-confirming H3; H2: no disposition; no frame enlargement.',
  };
}

export async function runCanonicalDerivation() {
  const preflight = JSON.parse(readFileSync(new URL('qa/gov-517-preflight-report.json', root)));
  assert.equal(preflight.status, 'green', 'preflight_not_green');
  assert.equal(preflight.controls_status, 'green', 'preflight_controls_not_green');
  assert.equal(preflight.halt?.live_run_authorized, true, 'live_run_not_authorized');
  const bound = loadRegisteredEnvelope();
  const envelope = screenBoundEnvelope(bound.envelope, bound.binding.envelope_sha256);
  // The single authorized engine invocation completes before any canonical D5 read.
  const generation = materialize(generate(envelope.i1, envelope.i2, envelope.i4, [-1, 1], 7));
  const seal = sealGeneration(generation, { boundary: 'GOV-517', inputs: bound.binding });
  const reference = canonicalD5Reference();
  const comparison = await compareWitnessRows(seal, {
    fixtureOnly: false, liveRun: true, readReference: () => reference.text,
    expectedSha256: digest(reference.text), manifestExpected: { sha256: digest(reference.text) },
    checksumsExpected: { sha256: digest(reference.text) },
  });
  assert.equal(comparison.valid, true, 'canonical_comparison_invalid');
  const distribution = Object.fromEntries(['both', 'primary-only', 'secondary-only', 'neither']
    .map(name => [name, comparison.classifications.filter(row => row.classification === name).length]));
  const verdict = category(generation, comparison);
  return {
    boundary: 'GOV-517',
    phase: 'canonical live derivation',
    execution: { production_passes: 1, retries: 0, heuristic_search: false, arithmetic: 'BigInt engine',
      generation_sealed_before_canonical_read: true },
    inputs: bound.binding,
    input_digest_citations: { i1_sha256: bound.binding.i1, i2_sha256: bound.binding.i2,
      i3_sha256: null, i4_ledger_sha256: bound.binding.i4.ledger, i4_census_sha256: bound.binding.i4.census },
    generation,
    witness_set_counts: { T1: generation.t1_set.length, T2: generation.t2_set.length,
      T3: Object.keys(generation.t3_assignment).length },
    target_flags: { 'T1-PASS': generation.t1_pass, 'T2-PASS': generation.t2_pass, 'T3-PASS': generation.t3_pass },
    comparison: { canonical_bindings: reference.bindings, seal_sha256: seal.sealSha256,
      reference_sha256: comparison.digests.referenceSha256, g5_state_classification_pairs: comparison.classifications,
      four_cell_distribution: distribution },
    formal_category_verdict: verdict,
    halt: { active: true, reason: 'receipt_emitted_awaiting_maintainer_relay_and_independent_reaudit',
      ledger_writes: false, board_status_changed: false, remote_operations: false },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  assert.equal(process.argv.length, 2, 'unexpected_arguments');
  const report = await runCanonicalDerivation();
  writeFileSync(new URL('qa/gov-517-canonical-derivation-report.json', root), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ category: report.formal_category_verdict.category,
    target_flags: report.target_flags, four_cell_distribution: report.comparison.four_cell_distribution }));
}
