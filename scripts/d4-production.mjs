// One-shot Grant 2 orchestration, outside the accepted nine-file implementation closure.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { fork } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const self = fileURLToPath(import.meta.url);
const env = { PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C', TZ: 'UTC' };
const mode = process.argv[2];
const check = (ok, message) => { if (!ok) throw new Error(message); };
const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url));
const json = path => JSON.parse(read(path));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const digest = '7ab950fac561016afc816e8b6947f7ce0b5f25573f1472321054ddbc9c1e097f';
const evidencePins = [
  ['qa/d4-grant1-revision.json', '0340e3161e46d68255df0bc21599b76a56ac26160950b4c4544f81f586686c35'],
  ['qa/d4-preflight-receipt.json', 'e2086bd0072c453d75cc8afb229a1a69f1881afb7600482c86a8230d2d63f527'],
  ['qa/d4-preflight-registration.json', '4d2068bca9f6bd358ce3d11dcbab873d428ab1ecf8e929e857bc625d7618df50'],
  ['qa/d4-preflight-seal.json', '6a675bd4d8e54d1c41cd254d4641ece1c1b56b9ddbfc70f7f1a758be7264030e'],
];
const paths = {
  generation: 'qa/d4-production-generation.json', seal: 'qa/d4-production-seal.json',
  receipt: 'qa/d4-production-receipt.json', run: 'qa/d4-production-run.json',
  failure: 'qa/d4-production-failure.json',
};
const artifactPaths = ['qa/d4-grant2-authorization.json', ...evidencePins.map(p => p[0]),
  paths.generation, paths.seal, paths.receipt];
const stages = ['binding verification', 'complete structural extraction', 'generation', 'durable materialization',
  'durable seal', 'fresh comparison process', 'accounting verification', 'frozen outcome selection'];
const write = (path, value) => {
  check(Object.values(paths).includes(path), 'Unregistered output');
  const fd = fs.openSync(new URL(`../${path}`, import.meta.url),
    fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o644);
  try { fs.writeFileSync(fd, JSON.stringify(value, null, 2) + '\n'); fs.fsyncSync(fd); }
  finally { fs.closeSync(fd); }
};

check(['--verify-bindings', '--run', '--compare-worker', '--verify-evidence'].includes(mode), 'Explicit mode required');
check(process.argv.length === 3, 'Unexpected arguments');
check(process.version === 'v22.22.0' && process.execArgv.length === 0, 'Pinned Node without flags required');
check(Object.keys(process.env).length === Object.keys(env).length &&
  Object.entries(env).every(([k, v]) => process.env[k] === v), 'Exact clean environment required');
check(hash(fs.readFileSync(process.execPath)) === '1bec56ef7cfa9a76f3e0b7c0a87f220eb73f23102b9c0b4c7529a3f7c3ce7c31', 'Node executable binding');
const require = createRequire(import.meta.url);
const ajvPath = require.resolve('ajv/package.json');
check(JSON.parse(fs.readFileSync(ajvPath)).version === '8.20.0' &&
  hash(fs.readFileSync(ajvPath)) === '1f9033ee5a6515e7d76938b7072941862d1ed228a6879cc7fe10cdeb75107989', 'AJV binding');
for (const [path, expected] of evidencePins) check(hash(read(path)) === expected, `Evidence binding: ${path}`);
const revision = json(evidencePins[0][0]);
const registration = json(evidencePins[2][0]);
const preflight = json(evidencePins[1][0]);
const preflightSeal = json(evidencePins[3][0]);
const authority = json('qa/d4-grant2-authorization.json');
check(authority.grant2 === 'GRANTED' && authority.productionAuthorized === true && authority.status === 'ACTIVE' &&
  authority.implementationDigest === digest && authority.scope === 'D4_CANONICAL_DOMAIN', 'Grant 2 required');
const pins = registration.hashes.map(({ path, expected }) => ({ path, sha256: expected }));
for (const { path, sha256 } of pins) check(hash(read(path)) === sha256, `Frozen byte mismatch: ${path}`);
for (const { path, sha256 } of revision.inventory) check(hash(read(path)) === sha256, `Closure mismatch: ${path}`);

// No project or third-party module is loaded until its registered bytes are checked.
const W = await import('./d4-wire.mjs');
const I = await import('./d4-inputs.mjs');
const same = (a, b) => W.canonicalJSON(a) === W.canonicalJSON(b);
check(W.implementationDigest(revision.inventory) === digest && registration.implementationDigest === digest,
  'Implementation closure digest');
check(W.digestObject(preflight) === preflightSeal.receipt && W.digestObject(registration) === preflightSeal.registration &&
  preflightSeal.implementationDigest === digest, 'Preflight detached seal');
const schema = json('schemas/d4-derivation-wire.schema.json');
W.validateWire(preflight, schema);
check(registration.failure === null && registration.review.controlsPassed === '18', 'Preflight failure');
check(Object.keys(preflight.controls).length === W.CONTROL_NAMES.length, 'Control inventory');
for (const name of W.CONTROL_NAMES) {
  const control = registration.controls[name], receipt = preflight.controls[name];
  check(control.status === 'PASS' && control.cleanAccepted === true && receipt.state === 'ran' &&
    receipt.implementationDigest === digest, `Preflight control: ${name}`);
}
const documents = revision.frozenDocuments;
const boundarySha256 = documents[0].expected;
const specSha256 = W.digestBytes(W.specPreimage(documents.slice(0, 4).map(d => d.expected)));
check(preflight.boundarySha256 === boundarySha256 && preflight.specSha256 === specSha256, 'Contract binding');
const sourcePaths = ['canonical/universal-heptatonic-ledger.json', 'canonical/universal-network-data.json',
  'qa/twin-hub-convergence-validation.json'];
const manifest = json('MANIFEST.json');
const checksums = read('CHECKSUMS.sha256').toString();
const packaging = pins.map(({ path, sha256 }) => ({ path, sha256,
  manifestMatches: manifest.files.some(f => f.path === path && f.sha256 === sha256),
  checksumMatches: checksums.split('\n').includes(`${sha256}  ${path}`) }));
// The reviewed Grant 1 revision supersedes only its old implementation manifest entries.
for (const row of packaging.filter(p => sourcePaths.includes(p.path) || documents.some(d => d.path === p.path))) {
  check(row.manifestMatches && row.checksumMatches, `Source/contract packaging mismatch: ${row.path}`);
}
const bindings = preflight.bindings;
check(bindings.implementationDigest === digest, 'Receipt closure');
const verifyUnchanged = () => {
  for (const { path, sha256 } of pins) check(hash(read(path)) === sha256, `Changed during execution: ${path}`);
  for (const [path, sha256] of evidencePins) check(hash(read(path)) === sha256, `Changed evidence: ${path}`);
};
const loadPacket = () => {
  const materialized = json(paths.generation), sealed = json(paths.seal);
  check(hash(read(paths.generation)) === sealed.generationFileSha256, 'Materialization byte binding');
  check(same(materialized.bindings, bindings) && materialized.boundarySha256 === boundarySha256 &&
    materialized.specSha256 === specSha256, 'Production packet binding');
  return { ...materialized, seal: sealed.seal };
};

if (mode === '--verify-bindings') {
  console.log(JSON.stringify({ bindings: 'PASS', node: process.version, ajv: '8.20.0', implementationDigest: digest,
    controlsPassed: '18', packaging }, null, 2));
} else if (mode === '--compare-worker') {
  check(typeof process.send === 'function' && process.connected, 'Parent IPC handoff required');
  check(fs.readFileSync(`/proc/${process.ppid}/cmdline`).toString() ===
    [process.execPath, self, '--run', ''].join('\0'), 'Authorized launcher parent required');
  for (const path of [paths.receipt, paths.run, paths.failure]) {
    check(!fs.existsSync(new URL(`../${path}`, import.meta.url)), `Terminal evidence already exists: ${path}`);
  }
  const handoff = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Parent handoff timeout')), 10000);
    process.once('message', message => { clearTimeout(timer); resolve(message); });
    process.send({ ready: true });
  });
  const { generationHash, sealHash, authorizationHash, launcherHash, parentPid } = handoff;
  check(parentPid === String(process.ppid), 'Parent identity mismatch');
  check(hash(read(paths.generation)) === generationHash && hash(read(paths.seal)) === sealHash &&
    hash(read('qa/d4-grant2-authorization.json')) === authorizationHash && hash(fs.readFileSync(self)) === launcherHash,
  'Original parent-pinned generation/seal/authority/launcher bytes');
  const C = await import('./d4-downstream-comparison.mjs');
  const packet = loadPacket();
  let observationReads = 0;
  const comparison = C.compareSealed(packet, () => {
    observationReads++;
    return { ledgerBytes: read(sourcePaths[0]), networkBytes: read(sourcePaths[1]) };
  });
  check(observationReads === 1, 'Canonical comparison read count');
  const receipt = C.buildReceipt(packet, comparison, schema);
  // Carry the already executed, byte-pinned controls; never fabricate a second run.
  receipt.controls = structuredClone(preflight.controls);
  receipt.category = C.selectCategory(comparison);
  W.validateWire(receipt, schema);
  verifyUnchanged();
  write(paths.receipt, receipt);
  console.log(JSON.stringify({ category: receipt.category, canonicalComparisonReads: '1' }));
  process.disconnect();
} else if (mode === '--verify-evidence') {
  const C = await import('./d4-downstream-comparison.mjs');
  const packet = loadPacket(), receipt = json(paths.receipt), run = json(paths.run);
  C.verifySeal(packet);
  W.validateWire(receipt, schema);
  check(same(receipt.generation, packet.generation) && same(receipt.seal, packet.seal) &&
    same(receipt.bindings, packet.bindings) && receipt.boundarySha256 === boundarySha256 &&
    receipt.specSha256 === specSha256 && same(receipt.controls, preflight.controls), 'Receipt packet/control mismatch');
  C.buildReceipt(packet, receipt.comparison, schema);
  check(receipt.category === C.selectCategory(receipt.comparison), 'Outcome mismatch');
  check(same(run.artifacts.map(a => a.path), artifactPaths), 'Incomplete run artifact inventory');
  for (const { path, sha256 } of run.artifacts) check(hash(read(path)) === sha256, `Run artifact binding: ${path}`);
  check(run.launcher.sha256 === hash(fs.readFileSync(self)) && run.status === 'COMPLETE' &&
    run.category === receipt.category && run.implementationDigest === digest && run.scope === authority.scope &&
    run.executor === authority.executor && run.grant2 === 'GRANTED' && run.productionAuthorized === true &&
    run.canonicalComparisonReads === '1' && run.comparisonWorker.exitStatus === '0' && same(run.stages, stages) &&
    run.controls.count === '18' && run.controls.allPassed === true && run.controls.rerun === false &&
    run.runtime.node === process.version && run.runtime.ajv === '8.20.0' && same(run.runtime.environment, env) &&
    run.runtime.preload === false && same(run.runtime.execArgv, []), 'Run record mismatch');
  verifyUnchanged();
  console.log(JSON.stringify({ verification: 'PASS', category: receipt.category, canonicalComparatorRerun: false }));
} else {
  for (const path of Object.values(paths)) check(!fs.existsSync(new URL(`../${path}`, import.meta.url)), `Refusing overwrite: ${path}`);
  const startedAt = new Date().toISOString();
  const launcher = { path: 'scripts/d4-production.mjs', sha256: hash(fs.readFileSync(self)), includedInNineFileClosure: false };
  const authorityHash = hash(read('qa/d4-grant2-authorization.json'));
  try {
    const projection = I.extractBound(read(sourcePaths[0]), read(sourcePaths[1]), bindings);
    check(same(I.projectionDigests(projection), bindings.projectionDigests) &&
      same(projection, registration.sourceProjection.projection), 'Complete registered projection required');
    const G = await import('./d4-generation.mjs');
    const generation = G.generate(projection);
    write(paths.generation, { boundarySha256, specSha256, bindings, projection, generation });
    const generationHash = hash(read(paths.generation));
    const persisted = json(paths.generation);
    const seal = G.sealGeneration(persisted.generation, bindings, boundarySha256, specSha256, persisted.projection);
    write(paths.seal, { generationFileSha256: generationHash, seal });
    const sealHash = hash(read(paths.seal));
    verifyUnchanged();
    const result = await new Promise((resolve, reject) => {
      const child = fork(self, ['--compare-worker'], { cwd: root, env, execArgv: [], silent: true });
      let stdout = '', stderr = '';
      const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('Comparison timeout')); }, 120000);
      child.stdout.on('data', data => { stdout += data; });
      child.stderr.on('data', data => { stderr += data; });
      child.once('message', message => {
        if (message.ready === true) child.send({ generationHash, sealHash, authorizationHash: authorityHash,
          launcherHash: launcher.sha256, parentPid: String(process.pid) });
      });
      child.once('error', error => { clearTimeout(timer); reject(error); });
      child.once('exit', status => { clearTimeout(timer); resolve({ status, stdout, stderr }); });
    });
    check(result.status === 0, `Comparison failed: ${result.stderr}`);
    const receipt = json(paths.receipt);
    W.validateWire(receipt, schema);
    check(hash(read(paths.generation)) === generationHash && hash(read(paths.seal)) === sealHash &&
      hash(fs.readFileSync(self)) === launcher.sha256 && hash(read('qa/d4-grant2-authorization.json')) === authorityHash,
    'Post-comparison original byte pins');
    verifyUnchanged();
    write(paths.run, {
      status: 'COMPLETE', grant2: 'GRANTED', productionAuthorized: true, scope: authority.scope,
      executor: authority.executor, startedAt, completedAt: new Date().toISOString(), launcher,
      implementationDigest: digest, limitation: authority.limitation,
      runtime: { node: process.version, executable: process.execPath, executableSha256: hash(fs.readFileSync(process.execPath)),
        ajv: '8.20.0', ajvPackageSha256: hash(fs.readFileSync(ajvPath)), environment: env, execArgv: [], preload: false },
      stages,
      controls: { source: evidencePins[1][0], count: '18', allPassed: true, rerun: false },
      canonicalComparisonReads: '1', comparisonWorker: { exitStatus: String(result.status), stdout: result.stdout, stderr: result.stderr },
      category: receipt.category, packagingAtStart: packaging,
      artifacts: artifactPaths
        .map(path => ({ path, sha256: hash(read(path)) })),
      releasePromotion: false,
    });
    console.log(JSON.stringify({ status: 'COMPLETE', category: receipt.category, completion: generation.completion,
      fourCellCounts: receipt.comparison.fourCellCounts, observedKeyCount: receipt.comparison.observedKeyCount,
      routes: receipt.comparison.routes, tC: receipt.comparison.tC }, null, 2));
  } catch (error) {
    write(paths.failure, { status: 'HALT', grant2: 'GRANTED', productionAuthorized: true,
      startedAt, failedAt: new Date().toISOString(), error: error.message, launcher,
      note: 'Partial artifacts retained; no automatic retry, reseal or rebind.' });
    throw error;
  }
}
