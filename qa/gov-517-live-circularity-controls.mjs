import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const paths = ['canonical/universal-network-data.json', 'canonical/universal-heptatonic-ledger.json',
  ...['fifth-space-census', 'twin-hub-convergence', 'd-shadow-complement-span',
    'd-tier-interleaving-check', 'd-shadow-uniqueness-check'].map(name => `canonical/fivefold-incubator/${name}-v0.json`)];
const families = ['complements', 'per-tier-differences', 'reversals', 'reorderings', 'dual-encodings', 'paraphrases'];
const digest = value => createHash('sha256').update(value).digest('hex');
const requireControl = condition => { if (!condition) throw new Error('live_circularity_control_failed'); };

// No import-time canonical reads, generator imports, or output sinks. Call only from detection suites.
export async function runLiveCircularityControls({ screenEnvelope, verifySource, engineSource, scannerOptions, makeFixture }) {
  const manifest = JSON.parse(await fs.readFile(new URL('MANIFEST.json', root), 'utf8'));
  const checksums = (await fs.readFile(new URL('CHECKSUMS.sha256', root), 'utf8')).split('\n');
  const bindings = [], documents = [];
  for (const path of paths) {
    const entries = manifest.files.filter(row => row.path === path);
    const lines = checksums.filter(line => line.endsWith(`  ${path}`));
    requireControl(entries.length === 1 && lines.length === 1);
    const bytes = await fs.readFile(new URL(path, root));
    const sha256 = digest(bytes);
    requireControl(entries[0].sha256 === sha256 && lines[0] === `${sha256}  ${path}`);
    bindings.push({ path, sha256 });
    // Binding is mandatory and precedes parsing each source.
    try { documents.push(JSON.parse(bytes)); } catch { throw new Error('live_source_parse_failed'); }
  }
  const [network, ledger, census, twin, shadow, scalar, candidate] = documents;
  const selections = [];
  function select(source_class, index, scope, value, mask = false, tierSequence = false) {
    requireControl(value !== undefined && value !== null && (!Array.isArray(value) || value.length > 0));
    selections.push({ source_class, provenance: { ...bindings[index], scope }, value, mask, tierSequence });
  }
  const audit = network.structuralEdges.filter(row => row.type === 'SEAT_CONTACT' && ['D4', 'D5'].includes(row.auditTier));
  const seats = audit.filter(row => row.auditTier === 'D5');
  requireControl(audit.length === 28 && seats.length === 14);
  select('d5-seat-rows', 0, 'structuralEdges:SEAT_CONTACT,auditTier=D5', seats);
  select('d4-d5-audit-rows', 0, 'structuralEdges:SEAT_CONTACT,auditTier=D4|D5', audit);
  select('d5-ledger-rows', 1, 'tier=D5', ledger.filter(row => row.tier === 'D5'));
  const fifthMasks = census.records.filter(row => row.tier === 'D5').map(row => row.fifthMask);
  select('d5-fifth-masks', 2, 'records:tier=D5:fifthMask', fifthMasks, true);
  select('twin-hub-conclusions', 3, 'd5Case', twin.d5Case);
  const court = shadow.runSpace.d5CourtRun;
  requireControl(court.tier === 'D5');
  const runMasks = court.runs.flatMap(row => row.maxRunMasks);
  select('d5-run-masks', 4, 'runSpace.d5CourtRun.runs.maxRunMasks', runMasks, true);
  select('d-channel-maxrun-sequence', 4, 'runSpace.dRunSequence', shadow.runSpace.dRunSequence, false, true);
  select('containment', 4, 'runSpace.d5CourtRun:conclusion', {
    tier: court.tier, courtClass: court.courtClass, allD5MaxRunsAreCourtClass: court.allD5MaxRunsAreCourtClass });
  requireControl(typeof court.courtClass === 'string' && typeof court.allD5MaxRunsAreCourtClass === 'boolean');
  select('intersection', 4, 'runSpace.d5CourtRun.twinOuterOfficeIntersection', court.twinOuterOfficeIntersection);
  select('gov514-scalar-result', 5, 'fixedWitness,lpModels,collisionControls,verdict,hypothesisDisposition',
    Object.fromEntries(['fixedWitness', 'lpModels', 'collisionControls', 'verdict', 'hypothesisDisposition'].map(key => {
      requireControl(scalar[key] !== undefined); return [key, scalar[key]];
    })));
  select('candidate-value-record', 6, 'candidateSet', candidate.candidateSet);

  async function invalid(operation) {
    try { await operation(); } catch (error) { requireControl(error.status === 'invalid'); return; }
    throw new Error('live_carrier_not_intercepted');
  }
  const fixture = makeFixture();
  // A broken baseline must not make all negative controls vacuously pass.
  await screenEnvelope(structuredClone(fixture), { fixtureOnly: true });
  await verifySource(engineSource, scannerOptions);
  async function intercept(value) {
    await invalid(() => verifySource(`${engineSource}\nfunction liveCarrier() { return ${JSON.stringify(value)}; }`, scannerOptions));
    for (const field of ['i3', 'excludedCarrier']) {
      const envelope = structuredClone(fixture);
      envelope[field] = value;
      await invalid(() => screenEnvelope(envelope, { fixtureOnly: true }));
    }
  }
  const cases = [];
  for (const selection of selections) {
    const { source_class, provenance, value, mask, tierSequence } = selection;
    const integers = Array.isArray(value) && value.every(Number.isSafeInteger);
    if (mask) requireControl(integers && value.every(number => number >= 0 && number < 4096));
    for (const family of families) {
      let transformed = structuredClone(value);
      // Arithmetic has a defined domain only for mask lists and the ordered tier sequence.
      // Other families re-encode a provenance carrier, not mathematical transforms of prose.
      if (family === 'complements' && mask) transformed = value.map(number => number ^ 4095);
      if (family === 'per-tier-differences' && tierSequence) {
        requireControl(integers); transformed = value.slice(1).map((number, index) => number - value[index]);
      }
      if (family === 'reversals' || family === 'reorderings') {
        if (Array.isArray(value)) transformed = family === 'reversals' ? [...value].reverse() : [...value.slice(1), value[0]];
        else if (typeof value === 'object') transformed = Object.fromEntries(Object.entries(value).reverse());
      }
      if (family === 'dual-encodings') transformed = { json: JSON.stringify(value), value };
      const wrapper = { family, source_class, provenance, value: transformed };
      if (family === 'paraphrases') wrapper.description = `Observed conclusion carrier from ${source_class}; detection only`;
      await intercept(wrapper);
      cases.push({ source_class, family, sha256: digest(JSON.stringify(wrapper)), static_intercepted: true, runtime_intercepted: true });
    }
  }
  // Value-only masks/tuples are a narrower extra check, not a universal scalar blacklist.
  const tuples = [fifthMasks, runMasks, shadow.runSpace.dRunSequence];
  for (const value of tuples) await intercept(value);
  return { status: 'green', bindings, cases, counts: { bindings: bindings.length, source_classes: selections.length,
    families: families.length, cases: cases.length, value_only_cases: tuples.length,
    static_intercepts: cases.length + tuples.length, runtime_intercepts: (cases.length + tuples.length) * 2, skipped_classes: 0 } };
}
