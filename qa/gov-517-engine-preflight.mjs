import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { run as runTests } from 'node:test';
import { verifySource, verifyClosure, verifyComparisonClosure } from './gov-517-static-screen.mjs';
import { loadRegisteredEnvelope, screenEnvelope, screenBoundEnvelope, makeFixture } from './gov-517-screened-inputs.mjs';
import { digest, verifyBinding } from './gov-517-input-registration.mjs';
import { sealGeneration, compareWitnessRows, compareSealed } from './gov-517-downstream-comparison.mjs';
import { runLiveCircularityControls } from './gov-517-live-circularity-controls.mjs';

const root = new URL('../', import.meta.url);
const enginePath = fileURLToPath(new URL('scripts/gov-517-d5-derivation-engine.mjs', root));
const encode = value => JSON.stringify(value, (_, item) => typeof item === 'bigint' ? String(item) : item);
const unique = values => [...new Set(values)].sort();

// Lossless set serialization only. All generative decisions occur in the engine.
export function materialize(raw) {
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
    per_state_routes: unique([...t1_set, ...t2_set]).map(state => ({ state, in_t1: t1_set.includes(state), in_t2: t2_set.includes(state) })),
    window_invariant_hold: raw.window_invariant_hold,
    convergence_unambiguous: raw.convergence_unambiguous,
  };
}

function referenceOptions(reference) {
  const text = JSON.stringify(reference);
  const sha256 = digest(text);
  return { fixtureOnly: true, expectedSha256: sha256, manifestExpected: { sha256 },
    checksumsExpected: { sha256 }, readReference: () => text };
}

export async function evaluatePreflight() {
  const protectedPaths = ['scrum/GOV-517-d5-signature-derivation-definition.md',
    'scrum/GOV-517-implementation-spec-draft.md', 'provenance/DECISION_LEDGER.md'];
  const protectedDigests = Object.fromEntries(protectedPaths.map(path => [path, digest(readFileSync(new URL(path, root)))]));
  const registration = JSON.parse(readFileSync(new URL('qa/gov-517-generative-semantics-registration.json', root)));
  const source = readFileSync(enginePath, 'utf8');
  const options = { allowlist: registration.integer_utility_allowlist.shared_named_helpers,
    literalAllowlist: { integers: registration.engine_literal_allowlist.integers,
      integerArrays: registration.engine_literal_allowlist.integerArrays,
      strings: registration.engine_literal_allowlist.strings } };
  const ast = verifyClosure(enginePath, { ...options, registeredPaths: [enginePath] });
  const comparisonClosure = verifyComparisonClosure(fileURLToPath(new URL('qa/gov-517-downstream-comparison.mjs', root)));
  assert.equal(digest(source), ast.modules[0].sha256);
  assert.deepEqual(ast.shared_intrinsics, registration.integer_utility_allowlist.shared_intrinsics);
  // Execute the exact screened bytes, not a second, potentially changed file read.
  const engine = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  const bound = loadRegisteredEnvelope();
  screenBoundEnvelope(bound.envelope, bound.binding.envelope_sha256);
  const fixture = makeFixture();
  const fixtureSha = digest(JSON.stringify(screenEnvelope(fixture, { fixtureOnly: true })));
  assert.notEqual(fixtureSha, bound.binding.envelope_sha256);
  const runs = [];
  function run(input, kernel = [-1, 1], width = 7) {
    const screened = screenEnvelope(input, { fixtureOnly: true });
    const inputSha = digest(JSON.stringify(screened));
    // This executable is a pre-flight harness, never a canonical derivation runner.
    assert.notEqual(inputSha, bound.binding.envelope_sha256, 'canonical_generation_prohibited');
    assert.ok((kernel[0] === -1 || kernel[0] === -2) && kernel[1] === 1 && kernel.length === 2);
    assert.ok(width === 7 || width === 6);
    const raw = engine.generate(screened.i1, screened.i2, screened.i4, kernel, width);
    const admissible = screened.i4.every(row => ['A0', 'A1', 'A2'].includes(row.tier) && row.role === 'anchor');
    assert.equal(raw.candidates, admissible ? 1029n : 0n);
    const generation = materialize(raw);
    const seal = sealGeneration(generation, { fixture_sha256: inputSha, kernel, width, verdict_eligible: false });
    runs.push({ input_sha256: inputSha, kernel, width, candidate_count: String(raw.candidates), generation_sha256: seal.generationSha256,
      t1_sha256: digest(JSON.stringify(generation.t1_set)), t2_sha256: digest(JSON.stringify(generation.t2_set)),
      t3_sha256: digest(JSON.stringify([generation.t3_assignment, generation.t3_midpoints])),
      t1_pass: generation.t1_pass, t2_pass: generation.t2_pass, t3_pass: generation.t3_pass });
    return { raw, generation, seal };
  }

  const baseline = run(fixture);
  assert.equal(baseline.generation.t1_pass, true);
  assert.equal(baseline.generation.t2_pass, true);
  assert.equal(baseline.generation.t3_pass, true);
  const nc1 = run(fixture, [-2, 1]);
  assert.equal(nc1.generation.t1_pass, false);
  assert.deepEqual(nc1.generation.t1_set, []);
  assert.equal(JSON.stringify(nc1.generation.t2_set), JSON.stringify(baseline.generation.t2_set));
  const brokenEdges = structuredClone(fixture);
  for (const edge of brokenEdges.i2) edge.type = 'DECOY';
  const i2Corruption = run(brokenEdges);
  assert.equal(i2Corruption.generation.t2_pass, false);
  assert.deepEqual(i2Corruption.generation.t2_set, []);
  assert.equal(JSON.stringify(i2Corruption.generation.t1_set), JSON.stringify(baseline.generation.t1_set));
  const nc3 = run(fixture, [-1, 1], 6);
  assert.equal(nc3.raw.window_cases, 49n);
  assert.equal(nc3.raw.window_failures, 49n);
  assert.equal(nc3.generation.window_invariant_hold, false);
  assert.equal(nc3.generation.t3_pass, false);
  assert.equal(JSON.stringify(nc3.generation.t1_set), JSON.stringify(baseline.generation.t1_set));
  assert.equal(JSON.stringify(nc3.generation.t2_set), JSON.stringify(baseline.generation.t2_set));
  assert.equal(JSON.stringify(nc3.generation.t3_assignment), JSON.stringify(baseline.generation.t3_assignment));
  assert.equal(JSON.stringify(nc3.generation.t3_midpoints), JSON.stringify(baseline.generation.t3_midpoints));
  assert.equal(baseline.raw.window_cases, 49n);
  assert.equal(baseline.raw.window_failures, 0n);
  for (const field of ['tier', 'role']) {
    const decoy = structuredClone(fixture);
    for (const anchor of decoy.i4) anchor[field] = field === 'tier' ? 'X' : 'decoy';
    const nc4 = run(decoy);
    assert.equal(nc4.generation.t3_pass, false);
    assert.equal(nc4.generation.convergence_unambiguous, false);
    assert.deepEqual(nc4.generation.t3_assignment, {});
    assert.deepEqual(nc4.generation.t3_midpoints, []);
    // Nonempty route witnesses prevent this rejection from passing vacuously.
    const direct = engine.check_T3(baseline.raw.t1_set, baseline.raw.t2_set, decoy.i4, 7);
    assert.equal(direct.pass, false);
    assert.equal(direct.unambiguous, false);
    assert.deepEqual(direct.assignment, []);
    assert.deepEqual(direct.midpoints, []);
  }

  const primaryWitness = baseline.raw.t1_set[0];
  const differentWitness = baseline.raw.t2_set.find(row => row[1] === primaryWitness[1]
    && row[0] !== primaryWitness[0] && encode(row[2]) !== encode(primaryWitness[2]));
  assert.ok(differentWitness);
  const crossPair = engine.check_T3([primaryWitness], [differentWitness], fixture.i4, 7);
  assert.equal(crossPair.pass, true);
  assert.equal(crossPair.assignment.length, 1);
  assert.equal(crossPair.assignment[0][1].length, 2);
  assert.equal(crossPair.midpoints.length, 2);

  const repeated = run(fixture);
  const reordered = structuredClone(fixture);
  for (const key of ['i1', 'i2', 'i4']) reordered[key].reverse();
  const permuted = run(reordered);
  assert.equal(JSON.stringify(repeated.generation), JSON.stringify(baseline.generation));
  assert.equal(JSON.stringify(permuted.generation), JSON.stringify(baseline.generation));

  // Selected-pair specificity and provenance checks exercise both conjuncts directly.
  const p = fixture.i4.find(row => row.tier === 'A0' && row.officeIndex === 0);
  const q = fixture.i4.find(row => row.tier === 'A0' && row.officeIndex === 2);
  assert.equal(engine.check_T1(p, q, 1, [-1, 1]), true);
  assert.equal(engine.check_T1({ ...p, fifthMask: q.fifthMask }, q, 1, [-1, 1]), false);
  assert.equal(engine.check_T1(p, q, 2, [-1, 1]), false);
  assert.equal(engine.check_T2(p, q, 1, fixture.i1, fixture.i2, fixture.i4), true);
  assert.equal(engine.check_T2(q, p, 1, fixture.i1, fixture.i2, fixture.i4), true);
  assert.equal(engine.check_T2(p, q, 1, [], fixture.i2, fixture.i4), false);
  const noMasks = fixture.i4.map(row => ({ id: row.id, role: row.role, tier: row.tier, officeIndex: row.officeIndex,
    get fifthMask() { throw new Error('T2 consulted masks'); } }));
  assert.equal(engine.check_T2(noMasks[0], noMasks[2], 1, fixture.i1, fixture.i2, noMasks), true);

  const matrix = [
    { mutation: 'NC-1', T1: { pass: nc1.generation.t1_pass, rejected: true },
      T2: { byte_identical_to_baseline: true, baseline_sha256: runs[0].t2_sha256, mutated_sha256: runs[1].t2_sha256 } },
    { mutation: 'I2-corruption', T1: { byte_identical_to_baseline: true, baseline_sha256: runs[0].t1_sha256, mutated_sha256: runs[2].t1_sha256 },
      T2: { pass: i2Corruption.generation.t2_pass, rejected: true } },
  ];

  const intercepts = [];
  const families = ['complements', 'per-tier-differences', 'reversals', 'reorderings', 'dual-encodings', 'paraphrases'];
  const classes = ['seat-map', 'run-mask', 'maxrun-sequence', 'containment', 'twin-hub-conclusion', 'candidate-value', 'scalar-result'];
  for (const family of families) for (const source_class of classes) {
    const decoy = { family, source_class, synthetic_value: ['synthetic-only', 10001, 10003] };
    const injected = structuredClone(fixture);
    injected.i3 = decoy;
    assert.throws(() => screenEnvelope(injected, { fixtureOnly: true }), error => error.status === 'invalid');
    assert.throws(() => verifySource(`${source}\nfunction decoy() { return ${JSON.stringify(decoy)}; }`, options), error => error.status === 'invalid');
    intercepts.push({ family, source_class, fixture_sha256: digest(JSON.stringify(decoy)), static: 'invalid', runtime: 'invalid' });
  }
  // Tuple-level screening must reject unregistered structures even when their scalars are legal.
  assert.throws(() => verifySource(`${source}\nfunction decoyTuple() { return [1n, 1n, 1n]; }`, options), /Unregistered integer tuple/);

  // Unconditional file-backed adversarial self-test; cleanup also runs on rejection failures.
  const temp = mkdtempSync('/tmp/opencode/gov-517-');
  try {
    const tamperPath = `${temp}/tampered.mjs`;
    writeFileSync(tamperPath, `${source}\nfunction decoyArtifact() { return 'synthetic-forbidden-payload'; }\n`);
    assert.throws(() => verifyClosure(tamperPath, { ...options, registeredPaths: [tamperPath] }), error => error.status === 'invalid');
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }

  // Detection-only canonical reads. Values and transforms remain in memory, never in the receipt.
  const manifest = JSON.parse(readFileSync(new URL('MANIFEST.json', root)));
  const checksums = readFileSync(new URL('CHECKSUMS.sha256', root), 'utf8');
  const censusPath = 'canonical/fivefold-incubator/fifth-space-census-v0.json';
  const censusBytes = readFileSync(new URL(censusPath, root));
  verifyBinding(censusPath, censusBytes, manifest, checksums);
  const observed = JSON.parse(censusBytes).records.filter(row => row.tier === 'D5');
  assert.ok(observed.length > 0);
  let liveIntercepts = 0;
  for (const record of observed) {
    const value = BigInt(record.fifthMask);
    let reversed = 0n;
    for (let bit = 0n; bit < 12n; bit += 1n) reversed |= ((value >> bit) & 1n) << (11n - bit);
    const transforms = [value, value ^ 4095n, reversed, (value << 1n | value >> 11n) & 4095n,
      value ^ BigInt(bound.envelope.i4[0].fifthMask)];
    for (const transformed of transforms) {
      const injected = structuredClone(bound.envelope);
      const target = injected.i4.find(row => BigInt(row.fifthMask) !== transformed);
      assert.ok(target);
      target.fifthMask = Number(transformed);
      assert.throws(() => screenBoundEnvelope(injected, bound.binding.envelope_sha256), error => error.status === 'invalid');
      liveIntercepts += 1;
    }
  }
  const liveCarrierAudit = await runLiveCircularityControls({ screenEnvelope, verifySource,
    engineSource: source, scannerOptions: options, makeFixture });
  assert.equal(liveCarrierAudit.status, 'green');

  // Four-cell dissociation comes from actual engine runs, not hand-authored generated sets.
  const bothRows = { rows: Array.from({ length: 7 }, (_, officeIndex) => ({ id: `synthetic-row-${officeIndex}`, officeIndex, tier: 'D5', type: 'SEAT_CONTACT' })) };
  const classifications = [];
  for (const completed of [baseline, nc1, i2Corruption]) {
    const result = await compareWitnessRows(completed.seal, referenceOptions(bothRows));
    assert.equal(result.valid, true);
    classifications.push(...result.classifications.map(row => row.classification));
  }
  // A non-CONSTRUCTS transition set plus asymmetric kernel realizes neither everywhere.
  const neither = run(brokenEdges, [-2, 1]);
  const neitherResult = await compareWitnessRows(neither.seal, referenceOptions(bothRows));
  assert.equal(neitherResult.valid, true);
  classifications.push(...neitherResult.classifications.map(row => row.classification));
  assert.deepEqual(unique(classifications), ['both', 'neither', 'primary-only', 'secondary-only']);
  let prematureReads = 0;
  const missingSeal = structuredClone(baseline.seal);
  delete missingSeal.generation.t3_assignment;
  const rejected = await compareWitnessRows(missingSeal, { ...referenceOptions(bothRows), readReference: () => { prematureReads += 1; throw new Error('premature reference read'); } });
  assert.equal(rejected.valid, false);
  assert.equal(prematureReads, 0);
  const exact = await compareSealed(baseline.seal, referenceOptions({
    canonical_D5_primary_reference_set: baseline.generation.t1_set,
    canonical_D5_secondary_reference_set: baseline.generation.t2_set,
    canonical_D5_convergence_assignment: baseline.generation.t3_assignment,
    canonical_D5_midpoint_set: baseline.generation.t3_midpoints,
  }));
  assert.equal(exact.checks.t1_match, true);
  assert.equal(exact.checks.t2_match, true);
  assert.equal(exact.checks.t3_match, true);

  const implementationPaths = [
    'scripts/gov-517-d5-derivation-engine.mjs', 'qa/gov-517-generative-semantics-registration.json',
    'qa/gov-517-static-screen.mjs', 'qa/gov-517-screened-inputs.mjs',
    'qa/gov-517-engine-preflight.mjs', 'qa/gov-517-downstream-comparison.mjs',
    'qa/gov-517-live-circularity-controls.mjs', 'qa/gov-517-input-registration.mjs',
    'qa/gov-517-input-boundary-registration.json', 'qa/gov-517-nc3-boundary-registration.json',
    'qa/gov-517-downstream-comparison.test.mjs', 'qa/gov-517-engine-preflight.test.mjs',
    'qa/gov-517-input-registration.test.mjs', 'qa/gov-517-live-circularity-controls.test.mjs',
    'qa/gov-517-nc3-registration.test.mjs', 'qa/gov-517-screened-inputs.test.mjs',
    'qa/gov-517-static-screen.test.mjs', 'qa/gov-517-live-derivation.mjs',
  ];
  const codeBindings = implementationPaths.map(path => {
    const sha256 = digest(readFileSync(new URL(path, root)));
    const entry = manifest.files.find(row => row.path === path);
    return { path, sha256, manifest_expected: entry?.sha256 ?? null, manifest_match: entry?.sha256 === sha256 };
  });
  for (const path of protectedPaths) assert.equal(digest(readFileSync(new URL(path, root))), protectedDigests[path]);
  return {
    boundary: 'GOV-517', phase: 'Phase 2 fixture pre-flight',
    status: codeBindings.every(row => row.manifest_match) ? 'green' : 'red',
    category: codeBindings.every(row => row.manifest_match) ? null : 'invalid',
    reason: codeBindings.every(row => row.manifest_match) ? null : 'implementation_manifest_binding_pending',
    controls_status: 'green', all_controls_green: true, verdict_eligible: false, disposition: null,
    prior_halts_cleared_by: ['I1-I4 input registration', 'Authoritative structuralEdges CONSTRUCTS selector', 'G1-G5 generative semantics registration'],
    engine_implemented: true, live_derivation_executed: false, canonical_observation_comparison_executed: false,
    canonical_input_generation_executed: false, detection_only_canonical_reads: true,
    input_registration: { status: 'green', binding: bound.binding, i1_count: 28, i2_count: 28, i3: null, i4_count: 21 },
    semantics_registration: 'qa/gov-517-generative-semantics-registration.json',
    code_verification_signatures: {
      static_ast_call_graph: ast,
      i3_quarantine: { compliant: true, load_time_null_asserted: true, nonempty_rejected: true,
        engine_has_no_i3_identifier: true, generation_parameters: ['steps', 'transitions', 'anchors', 'kernel', 'width'] },
      downstream_separation: { engine_imports: [], engine_filesystem_reads: 0,
        comparison_closure: comparisonClosure,
        complete_generation_sealed_before_reference_read: true, premature_reference_reads: prematureReads,
        t3_materialized_fields: ['generation.t3_assignment', 'generation.t3_midpoints'],
        fixture_four_cells: unique(classifications), canonical_adapter_status: 'Deferred to live comparison registration; no canonical projection selector invented' },
    },
    ast_import_closure_screening: { status: 'green', closure_root: 'scripts/gov-517-d5-derivation-engine.mjs',
      scope: 'Entire pure engine module, every declaration and reachable call; trusted I/O, serializer, parser and QA runners are outside the zero-FPU program',
      integer_arrays_preregistered: true, input_schema_screen: 'green', bound_projection_screen: 'green' },
    negative_controls: {
      nc1: { status: 'rejected', t1_pass: false, clean_specificity_pass: true },
      i2_corruption: { status: 'rejected', t2_pass: false, clean_specificity_pass: true },
      nc2: { status: 'rejected', synthetic_transform_matrix: intercepts,
        live_mask_transform_intercepts: liveIntercepts, live_values_persisted: false,
        live_carrier_audit: liveCarrierAudit,
        file_backed_adversarial_self_test: true, temp_files_removed: true,
        coverage_note: 'All registered excluded artifact classes have provenance-preserving live carrier controls, plus value-only mask/sequence and bound-projection tamper cases; no universal scalar blacklist is claimed.' },
      nc3: { status: 'rejected', clean_cases: 49, clean_failures: 0, mutant_cases: 49, mutant_failures: 49,
        window_invariant_hold: false, t3_pass: false, g4_office_membership_preserved: true },
      nc4: { status: 'rejected', non_a_tier_mask_rejected: true, non_anchor_mask_rejected: true,
        tested_with_nonempty_route_witnesses: true, convergence_unambiguous: false },
      g4_cross_pair_specificity: { pass: true, differing_pairs_and_tiers_converge_by_office: true, complete_pair_structures_retained: true },
      differential_dissociation_matrix: { status: 'green', mode: 'exact_serialized_set_byte_equality', rows: matrix },
    },
    determinism: { arithmetic: 'BigInt only in all engine functions; AST-verified', single_pass_per_fixture: true,
      candidate_count_per_admissible_fixture: 1029, rng_time_locale_dependencies: false,
      build_twice_byte_identical: true, reordered_input_byte_identical: true },
    fixture_runs: runs,
    implementation_bindings: codeBindings,
    implementation_regression_note: 'Initial integration exposed enumeration of out-of-domain NC4 decoy tiers; generation now excludes non-A/non-anchor pairs as required by G1. Target rejection predicates were not weakened or re-registered.',
    suites: [
      { name: 'source-binding', status: 'ran', result: 'green', scope: 'Registered I1-I4 sources and slices' },
      { name: 'implementation-binding', status: 'ran', result: codeBindings.every(row => row.manifest_match) ? 'green' : 'red' },
      { name: 'schema', status: 'ran', result: 'green' },
      { name: 'scope', status: 'ran', result: 'green' },
      { name: 'arithmetic', status: 'ran', result: 'green' },
      { name: 'build-twice', status: 'ran', result: 'green' },
      { name: 'reordered-input', status: 'ran', result: 'green' },
      { name: 'negative-control', status: 'ran', result: 'green' },
      { name: 'adversarial-tamper', status: 'ran', result: 'green' },
      { name: 'canonical-comparison', status: 'skipped', reason: 'Live derivation and observation comparison are not authorized' },
      { name: 'live-value-carrier-audit', status: 'ran', result: 'green', source_classes: liveCarrierAudit.counts.source_classes },
      { name: 'fixed-point-convergence', status: 'skipped', reason: 'MANIFEST updates and aggregate validation writes are outside authorized Phase 2 file scope' },
    ],
    environment: { node: process.version, platform: process.platform, arch: process.arch, cpu_only_engine: true },
    preservation: { protected_file_sha256: protectedDigests, unchanged_during_preflight: true,
      git_writes: false, remote_operations: false, canonical_writes: false },
    halt: { active: !codeBindings.every(row => row.manifest_match),
      awaiting: codeBindings.every(row => row.manifest_match) ? null : 'implementation manifest binding',
      live_run_authorized: codeBindings.every(row => row.manifest_match) },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  assert.ok(process.argv.length === 3 && ['--check', '--report'].includes(process.argv[2]), 'Use --check or --report only');
  let report;
  try {
    report = await evaluatePreflight();
    {
      const testPaths = [
        'qa/gov-517-input-registration.test.mjs', 'qa/gov-517-nc3-registration.test.mjs',
        'qa/gov-517-static-screen.test.mjs', 'qa/gov-517-downstream-comparison.test.mjs',
        'qa/gov-517-screened-inputs.test.mjs', 'qa/gov-517-live-circularity-controls.test.mjs',
        'qa/gov-517-engine-preflight.test.mjs',
      ];
      const testedFiles = testPaths.map(path => ({ path, sha256: digest(readFileSync(new URL(path, root))) }));
      let passed = 0;
      let failed = 0;
      let skipped = 0;
      let stderrEvents = 0;
      for await (const event of runTests({ files: testPaths.map(path => fileURLToPath(new URL(path, root))), concurrency: false })) {
        if (event.type === 'test:pass') {
          if (event.data.skip || event.data.todo) skipped += 1;
          else passed += 1;
        }
        if (event.type === 'test:fail') failed += 1;
        if (event.type === 'test:stderr') stderrEvents += 1;
      }
      for (const file of [...testedFiles, ...report.implementation_bindings]) {
        assert.equal(digest(readFileSync(new URL(file.path, root))), file.sha256, 'test_source_changed_during_verification');
      }
      for (const [path, sha256] of Object.entries(report.preservation.protected_file_sha256)) {
        assert.equal(digest(readFileSync(new URL(path, root))), sha256, 'protected_file_changed_during_verification');
      }
      report.executed_tests = { runner: 'node:test run(), sequential file execution',
        equivalent_command: 'node --test qa/gov-517-*.test.mjs', passed, failed, skipped, stderr_events: stderrEvents, test_files: testedFiles };
      if (failed !== 0 || skipped !== 0 || stderrEvents !== 0 || passed === 0) {
        report.status = 'red';
        report.category = 'invalid';
        report.reason = 'test_suite_failure';
        report.all_controls_green = false;
      }
    }
  }
  catch (error) {
    report = { boundary: 'GOV-517', status: 'red', category: 'invalid', all_controls_green: false,
      reason: error.reason ?? error.message, live_derivation_executed: false,
      halt: { active: true, live_run_authorized: false } };
    process.exitCode = 1;
  }
  if (process.argv[2] === '--report') {
    writeFileSync(new URL('qa/gov-517-preflight-report.json', root), `${JSON.stringify(report, null, 2)}\n`);
  } else {
    console.log(JSON.stringify({ status: report.status, controls_status: report.controls_status,
      reason: report.reason, fixture_runs: report.fixture_runs?.length,
      tests: report.executed_tests && { passed: report.executed_tests.passed, failed: report.executed_tests.failed,
        skipped: report.executed_tests.skipped, stderr_events: report.executed_tests.stderr_events },
      ast_reachability: report.code_verification_signatures?.static_ast_call_graph.reachability }));
  }
  if (report.status !== 'green') process.exitCode = 1;
}
