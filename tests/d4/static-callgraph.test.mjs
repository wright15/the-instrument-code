import test from 'node:test';
import assert from 'node:assert/strict';
import {
  inspectSource, inspectFile, ROOTS, SHARED_HELPER_ALLOWLIST, PRIVATE_HELPER_ALLOWLIST,
} from '../../scripts/lib/static-callgraph.mjs';

const source = `
export function rotateMaskZ12(mask, k) {
  const h = 12n;
  return ((mask << k) | (mask >> (h - k))) & 4095n;
}
export function midZ7(a, b) { return (a + b) % 7n; }
export function generateRouteTA(candidates) {
  const outputs = [];
  for (const candidate of candidates) {
    const id = candidate.id;
    if (candidate.tier === 1n) {
      outputs.push({id, source: rotateMaskZ12(candidate.source, 1n), tag: 'TA'});
    }
  }
  return outputs;
}
export function generateRouteTB(candidates) {
  const outputs = [];
  for (let k = 0n; k < 7n; k += 1n) {
    const a = 2n * 3n;
    outputs.push({id: a.toString(), tier: k, expected: candidates.length});
  }
  return outputs;
}
export function generateRouteTC(a, b) {
  const mid = midZ7(a, b);
  const outputs = [];
  outputs.push({mid, source: rotateMaskZ12(a, mid)});
  return outputs;
}
`;
const plant = code => source.replace('const outputs = [];', `${code}\n const outputs = [];`);

test('accepts engine subset and emits stable, exact call graph evidence', () => {
  const evidence = inspectSource(source);
  assert.equal(typeof inspectFile, 'function');
  assert.deepEqual(ROOTS, ['generateRouteTA', 'generateRouteTB', 'generateRouteTC']);
  assert.deepEqual(evidence.directCalls.generateRouteTA, ['rotateMaskZ12']);
  assert.deepEqual(evidence.directCalls.generateRouteTB, []);
  assert.deepEqual(evidence.directCalls.generateRouteTC, ['midZ7', 'rotateMaskZ12']);
  assert.deepEqual(evidence.reachability.generateRouteTC, ['generateRouteTC', 'midZ7', 'rotateMaskZ12']);
  assert.equal(evidence.reachabilityIncludesRoot, true);
  assert.deepEqual(Object.values(evidence.intersections), [[], ['rotateMaskZ12'], []]);
  assert.equal(JSON.stringify(evidence), JSON.stringify(inspectSource(source)));
  assert.deepEqual(JSON.parse(JSON.stringify(evidence)), evidence);
  assert.ok(SHARED_HELPER_ALLOWLIST.rotateMaskZ12.reason.trim());
  assert.ok(PRIVATE_HELPER_ALLOWLIST.midZ7.reason.trim());
  assert.deepEqual(SHARED_HELPER_ALLOWLIST.rotateMaskZ12.consumers, [ROOTS[0], ROOTS[2]]);
  assert.deepEqual(PRIVATE_HELPER_ALLOWLIST.midZ7.consumers, [ROOTS[2]]);
});

test('strings and comments do not introduce calls or unbalance scopes', () => {
  const decorated = plant(`
    /* } ) ] generateRouteTB([]); eval('bad'); */
    // { rotateMaskZ12(process); /*
    const tag = "} [ ( // /* eval('x') \\\" constructor";
    const type = 'process';
  `);
  assert.deepEqual(inspectSource(decorated), inspectSource(source));
  assert.deepEqual(inspectSource(plant("const a = '}'; const b = '('; const c = 'return'; const d = '+';")), inspectSource(source));
  assert.deepEqual(inspectSource(plant('if (candidates.length === 0n) return [];')), inspectSource(source));
});

test('records transitive reachability through exclusive helpers', () => {
  const changed = plant('localHelper();') + '\nexport function localHelper() { deeper(); }\nexport function deeper() { return 1n; }';
  assert.throws(() => inspectSource(changed), /Unapproved private helper/);
  const evidence = inspectSource(changed, { privateHelpers: { ...PRIVATE_HELPER_ALLOWLIST,
    localHelper: { reason: 'Synthetic transitive graph fixture only.', consumers: [ROOTS[0]] },
    deeper: { reason: 'Synthetic transitive leaf fixture only.', consumers: [ROOTS[0]] },
  } });
  assert.deepEqual(evidence.directCalls.localHelper, ['deeper']);
  assert.deepEqual(evidence.consumers.deeper, ['generateRouteTA']);
  assert.ok(evidence.reachability.generateRouteTA.includes('deeper'));
});

test('rejects transitive cross-route calls and shared helpers', () => {
  assert.throws(() => inspectSource(plant('bridge();') + '\nexport function bridge() { generateRouteTB([]); }'), /Cross-route/);
  const shared = source.replace('return outputs;', 'extra(); return outputs;').replace('const mid = midZ7(a, b);', 'extra(); const mid = midZ7(a, b);') + '\nexport function extra() { leaf(); }\nexport function leaf() { return 0n; }';
  assert.throws(() => inspectSource(shared), /Unapproved shared helper/);
  assert.throws(() => inspectSource(plant('midZ7(1n, 2n);')), /usage differs.*midZ7/);
  assert.throws(() => inspectSource(source.replace('rotateMaskZ12(candidate.source, 1n)', 'candidate.source')), /usage differs.*rotateMaskZ12/);
});

for (const [label, code] of Object.entries({
  eval: "eval('x');",
  global: 'process.exit();',
  Math: 'Math.random();',
  Date: 'Date.now();',
  crypto: 'crypto.randomUUID();',
  capture: 'const a = externalValue;',
  alias: 'const alias = rotateMaskZ12;',
  assignmentAlias: 'let alias = 0n; alias = rotateMaskZ12;',
  shorthandAlias: 'const object = {rotateMaskZ12};',
  indirectCall: '(rotateMaskZ12)(1n, 2n);',
  nested: 'function closure() { return candidates; }',
  arrow: 'const closure = () => candidates;',
  callback: 'candidates.map(rotateMaskZ12);',
  computedMethod: "candidates['push'](1n);",
  computedRead: 'const value = candidates[0];',
  userMethod: 'candidates.push(1n);',
  userString: 'candidates.id.toString();',
  constructor: 'const value = candidates.constructor;',
  prototype: 'const value = candidates.prototype;',
  protoKey: "const value = {'__proto__': candidates};",
  propertyWrite: 'candidates.id = 1n;',
  methodReplacement: 'const local = []; local.push = candidates;',
  arrayReplacement: 'let local = []; local = candidates; local.push(1n);',
  localCallable: 'const local = candidates; local();',
  template: 'const value = `text`;',
  regex: 'const value = /x/;',
  unknown: 'const value = @;',
  spread: 'const value = [...candidates];',
  objectMethod: 'const value = { method() { return 1n; } };',
  getter: 'const value = { get id() { return 1n; } };',
  destructuring: 'const {id} = candidates;',
  uninitialized: 'let value;',
  shadow: 'const rotateMaskZ12 = 1n;',
  selfReference: 'const value = value;',
  blockEscape: '{ const hidden = 1n; } hidden;',
  mutableBigInt: "let value = 1n; value.toString();",
  increment: 'let value = 1n; ++value;',
  optionalChain: 'const value = candidates?.id;',
  quotedDot: "const value = candidates.'id';",
  returnNewline: 'return\n candidates;',
  conditionalDeclaration: 'if (true) const value = 1n;',
  numericLiteral: 'const value = 1;',
  unregisteredInteger: 'const value = 80001n;',
  observationLiteral: 'const value = "SEAT_CONTACT";',
  observedField: 'const value = candidates.provenance;',
})) {
  test(`rejects ${label}`, () => assert.throws(() => inspectSource(plant(code)), SyntaxError));
}

test('rejects imports, global helpers/captures, parameters and malformed source', () => {
  for (const changed of [
    "import fs from 'node:fs';\n" + source,
    'const captured = 1n;\n' + source,
    'function globalHelper() { return 1n; }\n' + source,
    source.replace('(mask, k)', '(mask, k = 1n)'),
    source.replace('(mask, k)', '({mask}, k)'),
    source.replace('(mask, k)', '(mask, mask)'),
    source + '/* unfinished',
    source + '"unfinished',
    source + '@',
    source.replace('return outputs;', 'return outputs; ]'),
    source.replace('return outputs;', 'return outputs; /*'),
    source + '\nexport function unused() { return 1n; }',
  ]) assert.throws(() => inspectSource(changed), SyntaxError);
});

test('policy requires nonempty reasons and exact actual consumers', () => {
  assert.throws(() => inspectSource(source, { sharedHelpers: { rotateMaskZ12: { reason: ' ', consumers: [ROOTS[0], ROOTS[2]] } } }), /Missing reason/);
  assert.throws(() => inspectSource(source, { privateHelpers: { midZ7: { reason: 'private', consumers: [ROOTS[0]] } } }), /usage differs/);
  assert.throws(() => inspectSource(source, { sharedHelpers: {} }), /Unapproved shared/);
  assert.throws(() => inspectSource(source, { privateHelpers: { midZ7: { reason: 'private', consumers: [ROOTS[2], ROOTS[2]] } } }), /Invalid consumers/);
});

test('file entry point reads through the scanner without executing source', () => {
  // This module contains templates/imports outside the accepted engine grammar.
  assert.throws(() => inspectFile(new URL('./static-callgraph.test.mjs', import.meta.url)), SyntaxError);
});
