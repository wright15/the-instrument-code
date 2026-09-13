import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import { runLiveCircularityControls } from './gov-517-live-circularity-controls.mjs';
import { screenEnvelope, makeFixture } from './gov-517-screened-inputs.mjs';
import { verifySource } from './gov-517-static-screen.mjs';

const root = new URL('../', import.meta.url);
test('live bound detection only: digest receipt and fail-closed controls', async t => {
  const registration = JSON.parse(await fs.readFile(new URL('qa/gov-517-generative-semantics-registration.json', root)));
  // Read source as text only; never import or execute the engine.
  const engineSource = await fs.readFile(new URL('scripts/gov-517-d5-derivation-engine.mjs', root), 'utf8');
  const options = { screenEnvelope, makeFixture, verifySource, engineSource, scannerOptions: {
    allowlist: registration.integer_utility_allowlist.shared_named_helpers,
    literalAllowlist: Object.fromEntries(['integers', 'integerArrays', 'strings']
      .map(key => [key, registration.engine_literal_allowlist[key]])) } };
  const result = await runLiveCircularityControls(options);
  assert.equal(result.status, 'green');
  assert.deepEqual(Object.keys(result).sort(), ['bindings', 'cases', 'counts', 'status']);
  assert.equal(result.counts.bindings, 7);
  assert.equal(result.counts.source_classes, 11);
  assert.equal(result.counts.cases, 66);
  assert.equal(result.counts.skipped_classes, 0);
  for (const binding of result.bindings) {
    assert.deepEqual(Object.keys(binding).sort(), ['path', 'sha256']);
    assert.match(binding.sha256, /^[a-f0-9]{64}$/);
  }
  for (const row of result.cases) {
    assert.deepEqual(Object.keys(row).sort(), ['family', 'runtime_intercepted', 'sha256', 'source_class', 'static_intercepted']);
    assert.match(row.sha256, /^[a-f0-9]{64}$/);
    assert.equal(row.static_intercepted && row.runtime_intercepted, true);
  }
  assert.ok(Object.values(result.counts).every(Number.isSafeInteger));
  assert.deepEqual(await runLiveCircularityControls(options), result);
  for (const replacement of [{ verifySource: () => ({ status: 'green' }) },
    { screenEnvelope: value => value }, { verifySource: () => { throw new Error('wrong rejection'); } }]) {
    await assert.rejects(runLiveCircularityControls({ ...options, ...replacement }));
  }
  const read = fs.readFile.bind(fs);
  for (const mode of ['missing', 'checksum', 'unparseable']) {
    let canonicalReads = 0;
    t.mock.method(fs, 'readFile', async (url, ...args) => {
      if (url.pathname.endsWith('/MANIFEST.json') && mode === 'missing') return '{"files":[]}';
      if (url.pathname.endsWith('/CHECKSUMS.sha256') && mode === 'checksum') return '';
      if (url.pathname.includes('/canonical/')) {
        canonicalReads++;
        if (mode === 'unparseable') return Buffer.from('not JSON');
      }
      return read(url, ...args);
    });
    await assert.rejects(runLiveCircularityControls(options), { message: 'live_circularity_control_failed' });
    assert.equal(canonicalReads, mode === 'unparseable' ? 1 : 0);
    t.mock.restoreAll();
  }
});
