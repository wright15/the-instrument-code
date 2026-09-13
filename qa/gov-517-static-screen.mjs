/**
 * Static screen, not a sandbox. Engine inputs must be inert data, never proxies,
 * accessors, functions, or objects with custom coercion. No engine code executes.
 *
 * verifySource(source, {allowlist = ['z7'], literalAllowlist = {strings: [],
 * integers: []}}). Integer registrations are canonical decimal strings (shared
 * by Number and BigInt literals); safe integer numbers are also accepted.
 * Justifications belong in caller-owned records, not harvested source literals.
 * verifyClosure(entryPath, {...options, registeredPaths: [absolutePath, ...]})
 * additionally permits relative, unaliased named imports of named declarations.
 * No re-exports, default exports, module state, nested functions or callbacks.
 *
 * Syntax: const/let identifiers, named declarations, return, if, blocks,
 * for-of (const identifier), break/continue, arrays, plain literal objects,
 * booleans/null, data member reads, strict equality, logical/conditional
 * expressions. Arithmetic and ordering require statically known BigInts
 * (use BigInt(data) explicitly). No Number arithmetic or updates. Intrinsics:
 * BigInt(data), Number.isSafeInteger(data), localArray.push(data...),
 * localArray.includes(data). Intrinsics are reported apart from helper edges.
 * Only the fixed integer intrinsic allowlist (BigInt, Number.isSafeInteger)
 * may be shared across routes. Shared collection calls fail, including calls
 * through helpers. Results expose shared_intrinsics, integer_intrinsic_allowlist
 * and compliant; shared-intrinsic errors expose those fields with compliant=false.
 * All functions, including unreachable ones, are screened. Bindings may not
 * shadow or alias functions; mutable bindings retain their inferred type.
 * The parser/scanner is trusted tooling, NOT a zero-FPU generation program.
 * Synthetic scanner tests do not constitute verification of a production engine.
 */
import { createRequire } from 'node:module';
import { readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const require = createRequire(new URL('../bestiary/site/package.json', import.meta.url));
const parserPath = require.resolve('@babel/parser');
const parserPackage = require('@babel/parser/package.json');
const sha256 = value => createHash('sha256').update(value).digest('hex');
const PARSER = Object.freeze({ name: '@babel/parser', version: '7.29.7',
  sha256: '201724d1415df7749087d9d6e88af50f2bcafe2eb68dfbe9347f49d3361ff426' });
const actualDigest = sha256(readFileSync(parserPath));
const { parse } = require('@babel/parser');
const roots = ['check_T1', 'check_T2'];
const integerIntrinsicAllowlist = Object.freeze(['BigInt', 'Number.isSafeInteger']);
// Match artifact classes, not generic structural fields such as "window" or 5.
const forbidden = /(?:gov[-_\s]*517|(?:^|[^a-z0-9])(?:i3|d5)(?:$|[^a-z0-9])|(?:^|[^0-9])5\s*[-_\u2013\u2014]\s*35(?:$|[^0-9])|seat[-_\s]*contact|max[-_\s]*run|twin[-_\s]*hub|unseated[-_\s]*midpoint|check[_\s-]*t[12]|derivation[-_\s]*engine|canonical[-_\s]*data|ground[-_\s]*truth|expected[-_\s]*(?:answer|output)|golden[-_\s]*(?:answer|output)|artifact[-_\s]*(?:id|identifier)|\b[0-9a-f]{64}\b|\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b)/i;
const banned = new Set(['i3', 'eval', 'Function', 'globalThis', 'process', 'fs',
  'require', 'Math', 'Date', 'Intl', 'performance', 'crypto', 'constructor',
  'prototype', '__proto__', 'toLocaleString', 'localeCompare']);
function invalid(reason, details = {}) {
  throw Object.assign(new Error(reason), { status: 'invalid', reason }, details);
}
function assert(ok, reason) { if (!ok) invalid(reason); }
function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  if (node.type) visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (['loc', 'extra', 'comments', 'tokens', 'leadingComments', 'trailingComments', 'innerComments'].includes(key)) continue;
    if (Array.isArray(value)) value.forEach(child => walk(child, visit));
    else if (value && typeof value === 'object') walk(value, visit);
  }
}
function parseSource(source) {
  assert(parserPackage.version === PARSER.version && actualDigest === PARSER.sha256, 'Parser pin mismatch');
  assert(typeof source === 'string', 'Source must be a string');
  try { return parse(source, { sourceType: 'module', createImportExpressions: true }); }
  catch (error) { invalid(`Parse error: ${error.message}`); }
}

function validateOptions(options, closure = false) {
  assert(options && typeof options === 'object' && !Array.isArray(options), 'Options must be an object');
  const keys = ['allowlist', 'literalAllowlist', ...(closure ? ['registeredPaths'] : [])];
  assert(Object.keys(options).every(key => keys.includes(key)), 'Unknown scanner option');
  if (options.allowlist !== undefined) assert(Array.isArray(options.allowlist), 'allowlist must be an array');
  if (closure) assert(Array.isArray(options.registeredPaths) && options.registeredPaths.every(path => typeof path === 'string'), 'registeredPaths must be an explicit array of paths');
  if (options.literalAllowlist !== undefined) {
    const literals = options.literalAllowlist;
    assert(literals && typeof literals === 'object' && !Array.isArray(literals) && Object.keys(literals).every(key => ['strings', 'integers', 'integerArrays'].includes(key)), 'Invalid literalAllowlist');
    if (literals.strings !== undefined) assert(Array.isArray(literals.strings) && literals.strings.every(value => typeof value === 'string'), 'strings must be an array of strings');
    if (literals.integers !== undefined) assert(Array.isArray(literals.integers), 'integers must be an array');
    if (literals.integerArrays !== undefined) assert(Array.isArray(literals.integerArrays) && literals.integerArrays.every(row => Array.isArray(row) && row.every(value => typeof value === 'string' && /^(?:0|-?[1-9][0-9]*)$/.test(value))), 'integerArrays must be explicit decimal tuples');
  }
}

export function verifySource(source, options = {}) {
  validateOptions(options);
  return screen([{ path: '<memory>', source, ast: parseSource(source), imports: new Map() }], options);
}

export function verifyClosure(entryPath, options = {}) {
  validateOptions(options, true);
  const registered = new Set(options.registeredPaths ?? []);
  assert(typeof entryPath === 'string' && isAbsolute(entryPath), 'Entry must be an absolute registered path');
  for (const path of registered) assert(typeof path === 'string' && isAbsolute(path) && resolve(path) === path, 'Registration must use normalized absolute paths');
  const modules = new Map();
  function load(path) {
    assert(registered.has(path), `Unregistered import path: ${path}`);
    if (modules.has(path)) return;
    assert(realpathSync(path) === path, 'Symlink paths prohibited');
    const source = readFileSync(path, 'utf8');
    const ast = parseSource(source);
    const module = { path, source, ast, imports: new Map() };
    modules.set(path, module);
    for (const node of ast.program.body) {
      if (node.type !== 'ImportDeclaration') continue;
      const specifier = node.source.value;
      assert(/^\.\.?\//.test(specifier) && specifier.endsWith('.mjs'), 'Only registered relative .mjs imports permitted');
      assert(node.specifiers.length > 0 && !node.attributes?.length && !node.assertions?.length, 'Side-effect imports and attributes prohibited');
      const target = resolve(dirname(path), specifier);
      for (const spec of node.specifiers) {
        assert(spec.type === 'ImportSpecifier' && spec.imported.type === 'Identifier' && spec.local.name === spec.imported.name, 'Import aliases/default/namespace imports prohibited');
        module.imports.set(spec.local.name, target);
      }
      load(target);
    }
  }
  try { load(entryPath); }
  catch (error) { if (error.status === 'invalid') throw error; invalid(`Closure read failed: ${error.message}`); }
  return screen([...modules.values()], options);
}

export function verifyComparisonClosure(entryPath) {
  assert(typeof entryPath === 'string' && isAbsolute(entryPath) && realpathSync(entryPath) === entryPath, 'Comparison entry must be a real absolute path');
  const source = readFileSync(entryPath, 'utf8');
  const ast = parseSource(source);
  const imports = [];
  walk(ast, node => {
    if (node.type === 'ImportDeclaration') {
      assert(['node:crypto', 'node:util'].includes(node.source.value), 'Comparison imports an unregistered module');
      imports.push(node.source.value);
    }
    assert(node.type !== 'ImportExpression', 'Dynamic comparison import prohibited');
    if (node.type === 'ExportNamedDeclaration' || node.type === 'ExportAllDeclaration') assert(!node.source, 'Comparison re-export prohibited');
    if (node.type === 'Identifier') assert(!['require', 'eval', 'Function', 'globalThis', 'process', 'fs'].includes(node.name), 'Comparison has an unregistered ambient capability');
  });
  return { status: 'green', path: entryPath, sha256: sha256(source), imports: [...new Set(imports)].sort(),
    generation_import_reachable: false, filesystem_capability: false };
}

function screen(modules, options) {
  const allowed = options.allowlist ?? ['z7'];
  assert(Array.isArray(allowed) && allowed.every(x => typeof x === 'string') && new Set(allowed).size === allowed.length && !allowed.some(x => roots.includes(x)), 'Invalid shared helper allowlist');
  const strings = new Set(options.literalAllowlist?.strings ?? []);
  const integerArrays = new Set((options.literalAllowlist?.integerArrays ?? []).map(row => JSON.stringify(row)));
  const integers = new Set((options.literalAllowlist?.integers ?? []).map(value => {
    assert((typeof value === 'string' && /^(?:0|[1-9][0-9]*)$/.test(value)) || (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0), 'Integer registration must be canonical nonnegative decimal');
    return String(value);
  }));
  const functions = new Map();
  const exports = new Map();
  for (const module of modules) {
    assert(!module.ast.program.directives.length, 'Directives prohibited');
    const exported = new Set();
    exports.set(module.path, exported);
    for (let node of module.ast.program.body) {
      if (node.type === 'ImportDeclaration') {
        assert(module.imports.size > 0, 'Imports prohibited in verifySource');
        continue;
      }
      if (node.type === 'ExportNamedDeclaration') {
        assert(!node.source && node.declaration?.type === 'FunctionDeclaration', 'Re-exports/export lists prohibited');
        node = node.declaration;
        exported.add(node.id?.name);
      }
      assert(node.type === 'FunctionDeclaration' && node.id && !node.async && !node.generator, 'Only named synchronous function declarations at module scope');
      const name = node.id.name;
      assert(!functions.has(name) && !banned.has(name) && !['BigInt', 'Number'].includes(name), `Duplicate/reserved function: ${name}`);
      functions.set(name, { node, module, calls: new Set(), intrinsics: new Set(), identifiers: new Set() });
    }
    walk(module.ast.program, node => {
      if (node.type === 'ObjectProperty' && !node.computed && node.key.type === 'Identifier') {
        assert(!forbidden.test(node.key.name), `Forbidden artifact field: ${node.key.name}`);
      }
      if (node.type === 'ArrayExpression' && node.elements.length > 0) {
        const tuple = node.elements.map(element => {
          const negative = element?.type === 'UnaryExpression' && element.operator === '-';
          const literal = negative ? element.argument : element;
          if (!['NumericLiteral', 'BigIntLiteral'].includes(literal?.type)) return null;
          return `${negative ? '-' : ''}${literal.value}`;
        });
        if (tuple.every(value => value !== null)) assert(integerArrays.has(JSON.stringify(tuple)), 'Unregistered integer tuple');
      }
      if (node.type === 'Identifier') assert(!banned.has(node.name), `Forbidden identifier: ${node.name}`);
      if (node.type === 'StringLiteral') {
        // Import specifiers are validated as paths, not generation literals.
        if (module.ast.program.body.some(x => x.type === 'ImportDeclaration' && x.source === node)) return;
        assert(!forbidden.test(node.value) && !banned.has(node.value), `Forbidden artifact/semantic literal: ${node.value}`);
        assert(strings.has(node.value), `Unregistered string literal: ${node.value}`);
      }
      if (node.type === 'NumericLiteral' || node.type === 'BigIntLiteral') {
        const raw = node.extra?.raw ?? '';
        const digits = node.type === 'BigIntLiteral' ? raw.slice(0, -1) : raw;
        assert(/^(?:0|[1-9][0-9]*)$/.test(digits), `Non-decimal or floating literal: ${raw}`);
        assert(node.type === 'BigIntLiteral' || Number.isSafeInteger(node.value), 'Unsafe Number literal');
        assert(integers.has(digits), `Unregistered integer literal: ${raw}`);
      }
    });
  }
  for (const module of modules) for (const [name, target] of module.imports) {
    assert(exports.get(target)?.has(name) && functions.get(name)?.module.path === target, `Unresolved named import: ${name}`);
    assert(!roots.includes(name), 'Importing route roots prohibited');
  }
  for (const root of roots) assert(functions.get(root)?.module === modules[0], `Missing entry root: ${root}`);

  for (const [name, info] of functions) {
    const bindings = new Map();
    const declared = new Set();
    function bind(id, type, mutable = false) {
      assert(id.type === 'Identifier' && !declared.has(id.name) && !functions.has(id.name) && !['BigInt', 'Number'].includes(id.name), 'Destructuring/shadowing/function aliases prohibited');
      declared.add(id.name);
      bindings.set(id.name, { type, mutable });
    }
    for (const param of info.node.params) bind(param, 'data');
    walk(info.node, node => { if (node.type === 'Identifier') info.identifiers.add(node.name); });
    function expr(node) {
      assert(node, 'Missing expression');
      switch (node.type) {
        case 'BigIntLiteral': return 'bigint';
        case 'NumericLiteral': return 'number';
        case 'StringLiteral': return 'string';
        case 'BooleanLiteral': return 'boolean';
        case 'NullLiteral': return 'null';
        case 'Identifier':
          assert(bindings.has(node.name), `Unresolved value/function alias: ${node.name}`);
          return bindings.get(node.name).type;
        case 'ArrayExpression':
          node.elements.forEach(expr); return 'array';
        case 'ObjectExpression':
          for (const prop of node.properties) {
            assert(prop.type === 'ObjectProperty' && !prop.computed && !prop.method && ['Identifier', 'StringLiteral'].includes(prop.key.type), 'Only plain static object properties permitted');
            expr(prop.value);
          }
          return 'object';
        case 'MemberExpression':
          expr(node.object);
          if (node.computed) {
            assert(['number', 'bigint'].includes(expr(node.property)), 'Computed reads require integer indices');
          } else assert(node.property.type === 'Identifier', 'Invalid property');
          return 'data';
        case 'CallExpression': {
          assert(!node.optional && node.arguments.every(x => x.type !== 'SpreadElement'), 'Optional/spread calls prohibited');
          let result = 'data';
          const callee = node.callee;
          if (callee.type === 'Identifier' && callee.name === 'BigInt') {
            assert(node.arguments.length === 1, 'BigInt requires one argument');
            info.intrinsics.add('BigInt'); result = 'bigint';
          } else if (callee.type === 'Identifier') {
            const target = functions.get(callee.name);
            assert(target && (target.module === info.module || info.module.imports.get(callee.name) === target.module.path), `Unresolved/aliased call: ${callee.name}`);
            assert(node.arguments.length === target.node.params.length, 'Helper call arity mismatch');
            info.calls.add(callee.name);
          } else {
            assert(callee.type === 'MemberExpression' && !callee.computed && !callee.optional, 'Indirect/dynamic calls prohibited');
            const property = callee.property.name;
            if (callee.object.type === 'Identifier' && callee.object.name === 'Number' && property === 'isSafeInteger') {
              assert(node.arguments.length === 1, 'isSafeInteger requires one argument');
              info.intrinsics.add('Number.isSafeInteger'); result = 'boolean';
            } else {
              assert(expr(callee.object) === 'array' && ['push', 'includes'].includes(property), 'Unregistered member intrinsic');
              assert(property !== 'includes' || node.arguments.length === 1, 'includes requires one argument');
              info.intrinsics.add(`Array.prototype.${property}`);
              result = property === 'push' ? 'number' : 'boolean';
            }
          }
          node.arguments.forEach(expr); return result;
        }
        case 'BinaryExpression': {
          const left = expr(node.left), right = expr(node.right);
          if (['===', '!=='].includes(node.operator)) return 'boolean';
          assert(left === 'bigint' && right === 'bigint', 'Arithmetic/ordering requires BigInt operands');
          assert(['+', '-', '*', '/', '%', '**', '<', '<=', '>', '>=', '&', '|', '^', '<<', '>>'].includes(node.operator), 'Unregistered binary operator');
          return ['<', '<=', '>', '>='].includes(node.operator) ? 'boolean' : 'bigint';
        }
        case 'UnaryExpression': {
          const type = expr(node.argument);
          assert(node.operator === '!' || (['-', '~'].includes(node.operator) && type === 'bigint'), 'Unregistered unary operation');
          return node.operator === '!' ? 'boolean' : 'bigint';
        }
        case 'LogicalExpression':
          assert(['&&', '||', '??'].includes(node.operator), 'Unknown logical operator');
          expr(node.left); expr(node.right); return 'data';
        case 'ConditionalExpression': {
          expr(node.test); const a = expr(node.consequent), b = expr(node.alternate);
          return a === b ? a : 'data';
        }
        case 'AssignmentExpression':
          assert(node.operator === '=' && node.left.type === 'Identifier' && bindings.get(node.left.name)?.mutable, 'Only mutable local assignment permitted');
          assert(expr(node.right) === bindings.get(node.left.name).type, 'Assignment type change prohibited');
          return bindings.get(node.left.name).type;
        default: invalid(`Unlisted expression: ${node.type}`);
      }
    }
    function stmt(node, loop = false) {
      switch (node.type) {
        case 'BlockStatement': {
          assert(!node.directives.length, 'Directives prohibited');
          const previous = new Map(bindings);
          node.body.forEach(child => stmt(child, loop));
          bindings.clear(); previous.forEach((value, key) => bindings.set(key, value));
          break;
        }
        case 'VariableDeclaration':
          assert(['const', 'let'].includes(node.kind), 'var prohibited');
          for (const decl of node.declarations) bind(decl.id, expr(decl.init), node.kind === 'let');
          break;
        case 'ReturnStatement': if (node.argument) expr(node.argument); break;
        case 'ExpressionStatement': expr(node.expression); break;
        case 'IfStatement':
          expr(node.test);
          assert(node.consequent.type === 'BlockStatement' && (!node.alternate || ['BlockStatement', 'IfStatement'].includes(node.alternate.type)), 'Conditional branches require blocks');
          stmt(node.consequent, loop); if (node.alternate) stmt(node.alternate, loop); break;
        case 'ForOfStatement': {
          assert(!node.await && node.left.type === 'VariableDeclaration' && node.left.kind === 'const' && node.left.declarations.length === 1 && !node.left.declarations[0].init && node.body.type === 'BlockStatement', 'for-of requires const identifier and block');
          const type = expr(node.right);
          assert(['array', 'data'].includes(type), 'for-of requires data array');
          const id = node.left.declarations[0].id;
          bind(id, 'data'); stmt(node.body, true); bindings.delete(id.name); break;
        }
        case 'BreakStatement': case 'ContinueStatement': assert(loop && !node.label, 'Unscoped/labeled loop control'); break;
        default: invalid(`Unlisted statement: ${node.type}`);
      }
    }
    stmt(info.node.body);
  }
  // Expand every declaration, not only roots, to reject hidden recursive cycles.
  function tree(name, active = new Set()) {
    assert(!active.has(name), `Recursive call graph: ${name}`);
    const next = new Set(active).add(name);
    return { function: name, calls: [...functions.get(name).calls].sort().map(child => tree(child, next)) };
  }
  for (const name of functions.keys()) tree(name);
  function reachable(name, result = new Set()) {
    result.add(name);
    for (const child of functions.get(name).calls) if (!result.has(child)) reachable(child, result);
    return [...result].sort();
  }
  const t1 = reachable(roots[0]), t2 = reachable(roots[1]);
  assert(!t1.includes(roots[1]) && !t2.includes(roots[0]), 'Cross-route root invocation prohibited');
  for (const name of t1) assert(!functions.get(name).identifiers.has('i2'), `T1 reads i2 through ${name}`);
  const intersection = t1.filter(name => t2.includes(name));
  assert(JSON.stringify(intersection) === JSON.stringify([...allowed].sort()), 'Shared helper intersection differs from registered allowlist (T2 enters T1 helper closure)');
  const byRoute = Object.fromEntries(roots.map(name => [name, [...new Set(reachable(name).flatMap(fn => [...functions.get(fn).intrinsics]))].sort()]));
  const sharedIntrinsics = byRoute.check_T1.filter(name => byRoute.check_T2.includes(name));
  const intrinsicCompliance = {
    shared_intrinsics: sharedIntrinsics,
    integer_intrinsic_allowlist: [...integerIntrinsicAllowlist],
    compliant: sharedIntrinsics.every(name => integerIntrinsicAllowlist.includes(name))
  };
  if (!intrinsicCompliance.compliant) invalid('Shared collection intrinsics prohibited: only registered integer utilities may be shared', intrinsicCompliance);
  return {
    status: 'green',
    ...intrinsicCompliance,
    reachability: { check_T1: t1, check_T2: t2, intersection, registered_allowlist: [...allowed].sort(), compliant: true },
    call_trees: Object.fromEntries(roots.map(name => [name, tree(name)])),
    call_graph: Object.fromEntries([...functions].map(([name, info]) => [name, [...info.calls].sort()])),
    intrinsics: {
      by_function: Object.fromEntries([...functions].map(([name, info]) => [name, [...info.intrinsics].sort()])),
      by_route: byRoute
    },
    modules: modules.map(module => ({ path: module.path, sha256: sha256(module.source), imports: Object.fromEntries(module.imports) })),
    trusted_tooling: { parser: { ...PARSER }, scope: 'Scanner and parser are trusted tooling; no zero-FPU claim applies to them.' }
  };
}
