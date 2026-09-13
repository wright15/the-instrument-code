import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { verifySource, verifyClosure, verifyComparisonClosure } from './gov-517-static-screen.mjs';

const base = `
export function check_T1(i1) { return first(i1); }
export function check_T2(i2) { return second(i2); }
function first(value) { return z7(value); }
function second(value) { return z7(value); }
function z7(value) { return value; }
`;
const options = { literalAllowlist: { integers: ['0', '1', '2', '9007199254740993'], strings: ['ok'] } };
function rejects(source, pattern = /./, opts = options) {
  assert.throws(() => verifySource(source, opts), error => {
    assert.equal(error.status, 'invalid');
    assert.equal(error.reason, error.message);
    assert.match(error.reason, pattern);
    return true;
  });
}
function body(code) { return base.replace('return first(i1);', code); }

test('named call trees include roots, exact shared allowlist, parser pin and source digest', () => {
  const result = verifySource(base);
  assert.equal(result.status, 'green');
  assert.deepEqual(result.reachability, {
    check_T1: ['check_T1', 'first', 'z7'], check_T2: ['check_T2', 'second', 'z7'],
    intersection: ['z7'], registered_allowlist: ['z7'], compliant: true
  });
  assert.deepEqual(result.call_trees.check_T1, { function: 'check_T1', calls: [
    { function: 'first', calls: [{ function: 'z7', calls: [] }] }
  ] });
  assert.equal(result.trusted_tooling.parser.version, '7.29.7');
  assert.equal(result.trusted_tooling.parser.sha256, '201724d1415df7749087d9d6e88af50f2bcafe2eb68dfbe9347f49d3361ff426');
  assert.match(result.trusted_tooling.scope, /no zero-FPU claim/);
  assert.match(result.modules[0].sha256, /^[a-f0-9]{64}$/);
});

test('BigInt loops, arrays, literal objects, booleans, null and intrinsics', () => {
  const source = body(`
    const output = [];
    let total = 0n;
    for (const item of i1) {
      const value = BigInt(item);
      if (value < 0n) { continue; }
      total = total + value;
      output.push({value: value, valid: true, missing: null});
      if (total > 2n) { break; }
    }
    const found = output.includes(null);
    const safe = Number.isSafeInteger(i1.length);
    const label = found && safe ? 'ok' : null;
    return first({items: output, total: total, label: label});
  `);
  const result = verifySource(source, options);
  assert.deepEqual(result.intrinsics.by_route.check_T1,
    ['Array.prototype.includes', 'Array.prototype.push', 'BigInt', 'Number.isSafeInteger']);
  assert.deepEqual(result.intrinsics.by_route.check_T2, []);
  assert.deepEqual(result.reachability.intersection, ['z7']);
  assert.deepEqual(result.shared_intrinsics, []);
  assert.equal(result.compliant, true);
});

test('explicit alternate and empty helper allowlists', () => {
  assert.equal(verifySource(base.replaceAll('z7', 'utility'), { allowlist: ['utility'] }).status, 'green');
  const source = 'function check_T1(i1) { return i1; } function check_T2(i2) { return i2; }';
  assert.equal(verifySource(source, { allowlist: [] }).status, 'green');
  rejects(source, /intersection/);
  rejects(base, /intersection/, { allowlist: [] });
  rejects(base, /intersection/, { allowlist: ['z7', 'unused'] });
});

const adversarial = [
  ['hidden closure calls', body('function hidden() { return second(i1); } return hidden();'), /Unlisted statement/],
  ['arrow callbacks', body('return i1.map(value => first(value));'), /intrinsic/],
  ['callback arguments', body('return first(second);'), /alias/],
  ['direct recursion', base.replace('return value;', 'return z7(value);'), /Recursive/],
  ['mutual recursion', base.replace('return value;', 'return first(value);'), /Recursive/],
  ['unreachable recursion', base + 'function dead(x) { return dead(x); }', /Recursive/],
  ['call aliases', body('const alias = first; return alias(i1);'), /alias/],
  ['parameter calls', body('return i1();'), /Unresolved/],
  ['indirect calls', body('return (true ? first : second)(i1);'), /Indirect/],
  ['dynamic property calls', body("const a = []; return a['push'](i1);"), /literal|dynamic/],
  ['member call escape', body('return first.call(null, i1);'), /alias/],
  ['re-exports', base + "export { x } from './helper.mjs';", /Re-exports/],
  ['pure imports', "import { x } from './helper.mjs';" + base, /Imports prohibited/],
  ['dynamic imports', body("return import('ok');"), /Unlisted expression/],
  ['require', body("return require('ok');"), /Forbidden identifier/],
  ['eval', body("return eval('ok');"), /Forbidden identifier/],
  ['Function', body("return Function('ok');"), /Forbidden identifier/],
  ['globalThis', body('return globalThis;'), /Forbidden identifier/],
  ['process', body('return process;'), /Forbidden identifier/],
  ['fs', body('return fs;'), /Forbidden identifier/],
  ['RNG', body('return Math.random();'), /Forbidden identifier/],
  ['time', body('return Date.now();'), /Forbidden identifier/],
  ['locale', body('return i1.toLocaleString();'), /Forbidden identifier/],
  ['floating literal', body('return 1.5;'), /floating/],
  ['Number arithmetic', body('return 1 + 2;'), /BigInt operands/],
  ['unknown arithmetic', body('return i1 * i1;'), /BigInt operands/],
  ['decimal notation', body('return 1.0;'), /floating/],
  ['exponent notation', body('return 1e0;'), /floating/],
  ['hex notation', body('return 0x1;'), /Non-decimal/],
  ['BigInt hex', body('return 0x1n;'), /Non-decimal/],
  ['numeric separators', body('return 1_0n;'), /Non-decimal/],
  ['unsafe Number', body('return 9007199254740993;'), /Unsafe/],
  ['numeric tuple payload', body('return [1, 2, 37];'), /Unregistered integer/],
  ['unknown BigInt', body('return 37n;'), /Unregistered integer/],
  ['unknown string', body("return 'secret';"), /Unregistered string/],
  ['I3 parameter', base.replace('check_T2(i2)', 'check_T2(i3)'), /Forbidden identifier/],
  ['I3 reachable reference', body('return i1.i3;'), /Forbidden identifier/],
  ['I3 hidden reference', base + 'function unused(i3) { return i3; }', /Forbidden identifier/],
  ['T1 i2 helper parameter', base.replace('first(value)', 'first(i2)').replace('return z7(value);', 'return z7(i2);'), /T1 reads i2/],
  ['T1 i2 property', body('return first(i1.i2);'), /T1 reads i2/],
  ['T2 T1 helper closure', base.replace('return second(i2);', 'return first(i2);'), /intersection/],
  ['cross-root invocation', base.replace('return second(i2);', 'return check_T1(i2);'), /Cross-route/],
  ['unresolved hidden helper', base + 'function dead(x) { return missing(x); }', /Unresolved/],
  ['member mutation', body('const a = []; a.push = i1; return first(a);'), /local assignment/],
  ['type laundering', body('let a = []; a = i1; return a.push(null);'), /type change/],
  ['block scope escape', body('if (true) { const a = []; } return a.push(null);'), /Unresolved/],
  ['template literals', body('return `ok`;'), /Unlisted expression/],
  ['spread', body('return [...i1];'), /Unlisted expression/],
  ['getters', body('return {get value() { return i1; }};'), /plain static/],
  ['constructor escape', body('return i1.constructor;'), /Forbidden identifier/],
  ['optional calls', body('return first?.(i1);'), /Unlisted expression/],
  ['module state', 'const secret = 1;' + base, /module scope/],
  ['async functions', base.replace('function first', 'async function first'), /synchronous/],
  ['default parameter', base.replace('first(value)', 'first(value = 1)'), /Destructuring/],
  ['function expression', body('const a = function named() {}; return first(i1);'), /Unlisted expression/],
  ['unbounded while syntax', body('while (true) {} return first(i1);'), /Unlisted statement/]
];
for (const [name, source, pattern] of adversarial) test(`rejects ${name}`, () => rejects(source, pattern));

test('forbidden literal regex overrides explicit registration, including escaped literals', () => {
  for (const value of ['GOV-517', 'ground truth', 'canonical data', 'expected output', 'artifact identifier', 'I3', 'D5', 'a'.repeat(64), '__proto__']) {
    rejects(body(`return ${JSON.stringify(value)};`), /Forbidden/, { literalAllowlist: { strings: [value] } });
  }
  rejects(body("return '\\x47OV-517';"), /Forbidden/, { literalAllowlist: { strings: ['GOV-517'] } });
});

test('artifact classes remain forbidden even when caller registers values and field strings', () => {
  for (const value of ['5-35', 'window_5_35', '5 \u2013 35', 'SEAT_CONTACT',
    'seat-contact', 'maxrun', 'max_run', 'maxRun', 'twin-hub', 'twin_hub_conclusion',
    'twinHubConclusion', 'unseated-midpoint', 'unseated_midpoint_conclusion',
    'unseatedMidpointConclusion']) {
    const opts = { literalAllowlist: { strings: [value] } };
    rejects(body(`return first(${JSON.stringify(value)});`), /Forbidden artifact\/semantic literal/, opts);
    rejects(body(`return first({${JSON.stringify(value)}: true});`), /Forbidden artifact\/semantic literal/, opts);
  }
  rejects(body("return first('SEAT\\x5fCONTACT');"), /Forbidden/, { literalAllowlist: { strings: ['SEAT_CONTACT'] } });
});

test('structural window and standalone registered five are not forbidden artifacts', () => {
  const result = verifySource(body("return first({'window': [5, 5n, '5']});"), {
    literalAllowlist: { strings: ['window', '5'], integers: ['5'] }
  });
  assert.equal(result.status, 'green');
});

test('verifySource rejects a valid relative named import without reading it', () => {
  const source = "import { z7 } from './helper.mjs';" + base.replace('function z7(value) { return value; }', '');
  rejects(source, /Imports prohibited in verifySource/, { literalAllowlist: { strings: ['./helper.mjs'] } });
});

test('integer registration is explicit, canonical and not extracted from source', () => {
  rejects(body('return first(1n);'), /Unregistered integer/, {});
  assert.equal(verifySource(body('return first(1n);'), { literalAllowlist: { integers: [1] } }).status, 'green');
  rejects(base, /registration/, { literalAllowlist: { integers: ['1e0'] } });
});

test('malformed or unknown options fail closed', () => {
  for (const opts of [null, [], { allowlist: null }, { allowImports: true },
    { literalAllowlist: null }, { literalAllowlist: { strings: 'ok' } },
    { literalAllowlist: { integers: '1' } }, { literalAllowlist: { extra: [] } }]) {
    rejects(base, /./, opts);
  }
  assert.throws(() => verifyClosure('/virtual/engine.mjs'), error => error.status === 'invalid');
});

test('shared integer intrinsics are explicitly registered apart from helper intersection', () => {
  const source = base.replaceAll('return z7(value);', 'const safe = Number.isSafeInteger(value); const n = BigInt(value); return z7(n);');
  const result = verifySource(source);
  assert.deepEqual(result.reachability.intersection, ['z7']);
  assert.deepEqual(result.intrinsics.by_route, {
    check_T1: ['BigInt', 'Number.isSafeInteger'], check_T2: ['BigInt', 'Number.isSafeInteger']
  });
  assert.deepEqual(result.shared_intrinsics, ['BigInt', 'Number.isSafeInteger']);
  assert.deepEqual(result.integer_intrinsic_allowlist, ['BigInt', 'Number.isSafeInteger']);
  assert.equal(result.compliant, true);
});

for (const method of ['push', 'includes']) {
  for (const location of ['roots', 'private helpers', 'shared helper']) {
    test(`shared Array.prototype.${method} in ${location} fails integer-only sharing`, () => {
      const call = `const items = []; items.${method}(null); `;
      let source;
      if (location === 'roots') source = base.replace('return first(i1);', call + 'return first(i1);').replace('return second(i2);', call + 'return second(i2);');
      else if (location === 'private helpers') source = base.replaceAll('return z7(value);', call + 'return z7(value);');
      else source = base.replace('return value;', call + 'return value;');
      assert.throws(() => verifySource(source), error => {
        assert.equal(error.status, 'invalid');
        assert.equal(error.compliant, false);
        assert.match(error.reason, /Shared collection intrinsics prohibited/);
        assert.deepEqual(error.shared_intrinsics, [`Array.prototype.${method}`]);
        assert.deepEqual(error.integer_intrinsic_allowlist, ['BigInt', 'Number.isSafeInteger']);
        return true;
      });
    });
  }
}

test('distinct route-local collection intrinsics are not shared utilities', () => {
  const source = base.replace('return first(i1);', 'const items = []; items.push(i1); return first(i1);')
    .replace('return second(i2);', 'const items = []; items.includes(i2); return second(i2);');
  const result = verifySource(source);
  assert.deepEqual(result.shared_intrinsics, []);
  assert.equal(result.compliant, true);
});

// Virtual registered files exercise the real closure loader without creating
// fixtures or reading project/canonical data. Restore Node's ESM fs bindings.
test('read-only explicitly registered import closure', t => {
  const entry = '/virtual/engine.mjs', helper = '/virtual/helper.mjs';
  const files = new Map([
    [entry, "import { z7 } from './helper.mjs';\nfunction check_T1(i1) { return z7(i1); }\nfunction check_T2(i2) { return z7(i2); }"],
    [helper, 'export function z7(value) { return value; }']
  ]);
  const reads = [];
  t.mock.method(fs, 'realpathSync', path => path);
  t.mock.method(fs, 'readFileSync', path => {
    reads.push(path);
    assert.ok(files.has(path), `Unexpected read: ${path}`);
    return files.get(path);
  });
  syncBuiltinESMExports();
  try {
    const opts = { registeredPaths: [entry, helper] };
    const result = verifyClosure(entry, opts);
    assert.equal(result.status, 'green');
    assert.deepEqual(reads, [entry, helper]);
    assert.deepEqual(result.modules[0].imports, { z7: helper });
    reads.length = 0;
    assert.throws(() => verifyClosure(entry, { registeredPaths: [entry] }), /Unregistered import path/);
    assert.deepEqual(reads, [entry]);
    reads.length = 0;
    assert.throws(() => verifyClosure(entry, { registeredPaths: [] }), /Unregistered/);
    assert.deepEqual(reads, []);
    for (const imported of ["import { z7 as other } from './helper.mjs';", "import * as z7 from './helper.mjs';", "import z7 from './helper.mjs';", "import './helper.mjs';", "import { z7 } from 'node:fs';", "import { z7 } from '../escape.mjs';"]) {
      files.set(entry, imported + base.replace('function z7(value) { return value; }', ''));
      assert.throws(() => verifyClosure(entry, opts), error => error.status === 'invalid');
    }
    files.set(entry, "import { z7 } from './helper.mjs';" + base.replace('function z7(value) { return value; }', ''));
    files.set(helper, 'function z7(value) { return value; }');
    assert.throws(() => verifyClosure(entry, opts), /Unresolved named import/);
    files.set(helper, 'export { z7 } from "./elsewhere.mjs";');
    assert.throws(() => verifyClosure(entry, opts), /Re-exports/);
    files.set(helper, 'export function z7(value) { return hidden(value); } function hidden(value) { return process; }');
    assert.throws(() => verifyClosure(entry, opts), /Forbidden identifier/);
    files.set(helper, 'export function z7(value) { return hidden(value); } function hidden(value) { return value.i2; }');
    assert.throws(() => verifyClosure(entry, opts), /T1 reads i2 through hidden/);
    files.set(helper, 'export function z7(value) { return hidden(value); } function hidden(value) { return value; }');
    assert.throws(() => verifyClosure(entry, opts), /intersection/);
    assert.deepEqual(verifyClosure(entry, { ...opts, allowlist: ['hidden', 'z7'] }).reachability.intersection, ['hidden', 'z7']);
    t.mock.method(fs, 'realpathSync', () => '/different/path.mjs');
    syncBuiltinESMExports();
    assert.throws(() => verifyClosure(entry, opts), /Symlink/);
  } finally {
    t.mock.restoreAll();
    syncBuiltinESMExports();
  }
});

test('integer tuple registration is separate from scalar authorization', () => {
  const source = body('const tuple = [0n, 1n]; return first(i1);');
  rejects(source, /Unregistered integer tuple/);
  assert.equal(verifySource(source, { ...options, literalAllowlist: {
    ...options.literalAllowlist, integerArrays: [['0', '1']],
  } }).status, 'green');
  rejects(source.replace('[0n, 1n]', '[1n, 0n]'), /Unregistered integer tuple/, {
    ...options, literalAllowlist: { ...options.literalAllowlist, integerArrays: [['0', '1']] },
  });
});

test('unquoted artifact property names cannot bypass literal screening', () => {
  for (const name of ['maxRunSequence', 'twinHubConclusion', 'SEAT_CONTACT']) {
    rejects(body(`const payload = { ${name}: 1n }; return first(i1);`), /Forbidden artifact field/);
  }
});

test('comparison closure cannot import generation or acquire filesystem access', t => {
  t.mock.method(fs, 'realpathSync', path => path);
  let source = "import { createHash } from 'node:crypto'; export function compare() { return true; }";
  t.mock.method(fs, 'readFileSync', () => source);
  syncBuiltinESMExports();
  try {
    assert.deepEqual(verifyComparisonClosure('/virtual/comparison.mjs').imports, ['node:crypto']);
    for (const unsafe of [
      "import { generate } from './engine.mjs';", "import fs from 'node:fs';",
      "export * from './engine.mjs';", "const engine = import('./engine.mjs');",
      'const engine = require("./engine.mjs");',
    ]) {
      source = unsafe;
      assert.throws(() => verifyComparisonClosure('/virtual/comparison.mjs'), error => error.status === 'invalid');
    }
  } finally {
    t.mock.restoreAll();
    syncBuiltinESMExports();
  }
});
