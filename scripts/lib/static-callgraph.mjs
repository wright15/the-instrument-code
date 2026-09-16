import { readFileSync } from 'node:fs';

export const ROOTS = Object.freeze(['generateRouteTA', 'generateRouteTB', 'generateRouteTC']);
export const SHARED_HELPER_ALLOWLIST = Object.freeze({
  rotateMaskZ12: Object.freeze({
    reason: 'Pure Z12 rotation; no state, selection, or observation.',
    consumers: Object.freeze(['generateRouteTA', 'generateRouteTC']),
  }),
});
export const PRIVATE_HELPER_ALLOWLIST = Object.freeze({
  midZ7: Object.freeze({
    reason: 'Pure Z7 midpoint calculation, private to route TC; no cross-route sharing.',
    consumers: Object.freeze(['generateRouteTC']),
  }),
});

const forbidden = new Set([
  'constructor', 'prototype', '__proto__', 'fs', 'process', 'Date', 'Math',
  'crypto', 'global', 'globalThis', 'window', 'document', 'eval', 'Function',
  'require', 'module', 'exports', 'import', 'this', 'new', 'arguments',
  'provenance', 'selected', 'eligible', 'phaseDelta', 'contacts', 'comparison',
]);
const reserved = new Set([
  'export', 'function', 'const', 'let', 'var', 'for', 'of', 'in', 'if', 'else',
  'return', 'true', 'false', 'null', 'undefined', 'async', 'await', 'yield',
  'class', 'extends', 'super', 'default', 'switch', 'case', 'break', 'continue',
  'while', 'do', 'try', 'catch', 'finally', 'throw', 'delete', 'typeof', 'void',
  'instanceof', 'with', 'debugger', 'static', 'implements', 'interface',
  'package', 'private', 'protected', 'public', 'enum',
]);
const operators = [
  '===', '!==', '**', '<<', '>>', '<=', '>=', '&&', '||', '+=', '-=', '*=',
  '/=', '%=', '&=', '|=', '^=', '==', '!=',
  '{', '}', '(', ')', '[', ']', '.', ',', ';', ':', '?', '=', '+', '-', '*',
  '/', '%', '&', '|', '^', '~', '!', '<', '>',
];
const precedence = new Map([
  ['||', 1], ['&&', 2], ['|', 3], ['^', 4], ['&', 5], ['==', 6], ['!=', 6],
  ['===', 6], ['!==', 6], ['<', 7], ['>', 7], ['<=', 7], ['>=', 7],
  ['<<', 8], ['>>', 8], ['+', 9], ['-', 9], ['*', 10], ['/', 10], ['%', 10], ['**', 11],
]);
const assignments = new Set(['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=']);
const sorted = values => [...values].sort();
const same = (a, b) => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));

function fail(message, token) {
  throw new SyntaxError(`${message}${token ? ` at offset ${token.offset}` : ''}`);
}

// This lexer consumes every character. It deliberately has no regex/template mode.
function lex(source) {
  const tokens = [];
  let i = 0;
  while (i < source.length) {
    if (/\s/.test(source[i])) { i++; continue; }
    if (source.startsWith('//', i)) {
      while (i < source.length && !/[\r\n\u2028\u2029]/.test(source[i])) i++;
      continue;
    }
    if (source.startsWith('/*', i)) {
      const end = source.indexOf('*/', i + 2);
      if (end < 0) fail('Unterminated comment', { offset: i });
      i = end + 2;
      continue;
    }
    const offset = i;
    const char = source[i];
    if (char === '"' || char === "'") {
      let value = '';
      i++;
      while (i < source.length && source[i] !== char) {
        if (/[\r\n\u2028\u2029]/.test(source[i])) fail('Newline in string', { offset: i });
        if (source[i] === '\\') {
          i++;
          const escapes = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', '\\': '\\', '"': '"', "'": "'" };
          if (!Object.hasOwn(escapes, source[i])) fail('Unsupported string escape', { offset: i });
          value += escapes[source[i++]];
        } else value += source[i++];
      }
      if (i >= source.length) fail('Unterminated string', { offset });
      i++;
      if (/SEAT_CONTACT|seat-contact:|twin-hub|gov-517|\bD[45]\b|[0-9a-f]{64}/i.test(value)) {
        fail('Observation-bearing literal prohibited', { offset });
      }
      tokens.push({ kind: 'string', value, offset });
      continue;
    }
    const identifier = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(source.slice(i));
    if (identifier) {
      i += identifier[0].length;
      tokens.push({ kind: 'identifier', value: identifier[0], offset });
      continue;
    }
    const number = /^(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|0|[1-9][0-9]*)(n)?/.exec(source.slice(i));
    if (number) {
      if (!number[1]) fail('Number literal prohibited; BigInt required', { offset });
      const integer = BigInt(number[0].slice(0, -1));
      if (integer > 12n && integer !== 4095n) fail('Unregistered structural integer', { offset });
      i += number[0].length;
      tokens.push({ kind: number[1] ? 'bigint' : 'number', value: number[0], offset });
      continue;
    }
    if (['++', '--', '=>', '?.', '??', '...', '>>>', '**='].some(op => source.startsWith(op, i))) {
      fail('Unsupported compound token', { offset });
    }
    const operator = operators.find(op => source.startsWith(op, i));
    if (!operator) fail('Unknown or unsupported token', { offset });
    tokens.push({ kind: 'punctuation', value: operator, offset });
    i += operator.length;
  }
  tokens.push({ kind: 'eof', value: '<eof>', offset: source.length });
  return tokens;
}

class Scanner {
  constructor(source) {
    this.source = source;
    this.tokens = lex(source);
    this.position = 0;
    this.functions = new Map();
    this.scopes = [];
  }
  peek(value) {
    const token = this.tokens[this.position];
    return !['string', 'number', 'bigint'].includes(token.kind) && token.value === value;
  }
  take() { return this.tokens[this.position++]; }
  eat(value) {
    if (!this.peek(value)) return false;
    this.take();
    return true;
  }
  expect(value) {
    if (!this.eat(value)) fail(`Expected ${value}`, this.tokens[this.position]);
  }
  name() {
    const token = this.take();
    if (token.kind !== 'identifier' || forbidden.has(token.value) || reserved.has(token.value)) {
      fail('Forbidden or unsupported identifier', token);
    }
    return token.value;
  }
  property(dot = false) {
    const token = this.take();
    if (!(dot ? ['identifier'] : ['identifier', 'string', 'number']).includes(token.kind) || forbidden.has(token.value)) {
      fail('Forbidden or unsupported property', token);
    }
    return token.value;
  }
  collect() {
    while (!this.peek('<eof>')) {
      this.expect('export');
      this.expect('function');
      const name = this.name();
      if (this.functions.has(name)) fail(`Duplicate function ${name}`);
      this.expect('(');
      const parameters = [];
      if (!this.peek(')')) {
        do { parameters.push(this.name()); } while (this.eat(','));
      }
      this.expect(')');
      if (new Set(parameters).size !== parameters.length) fail(`Duplicate parameter in ${name}`);
      const start = this.position;
      this.expect('{');
      const stack = ['}'];
      while (stack.length) {
        const token = this.take();
        if (token.kind === 'eof') fail('Unbalanced function body', token);
        if (token.kind !== 'punctuation') continue;
        if (['{', '(', '['].includes(token.value)) stack.push({ '{': '}', '(': ')', '[': ']' }[token.value]);
        else if (['}', ')', ']'].includes(token.value) && stack.pop() !== token.value) fail('Unbalanced delimiter', token);
      }
      this.functions.set(name, { parameters, start, end: this.position, calls: new Set() });
    }
    for (const [name, fn] of this.functions) {
      this.current = fn;
      this.position = fn.start;
      this.scopes = [new Map()];
      for (const parameter of fn.parameters) this.declare(parameter, { kind: 'unknown' }, false);
      this.block(false);
      if (this.position !== fn.end) fail(`Incomplete body scan of ${name}`);
    }
    return this.functions;
  }
  declare(name, value, mutable) {
    const scope = this.scopes.at(-1);
    // Disallow shadowing entirely, including function names and parameters.
    if (this.functions.has(name) || this.scopes.some(s => s.has(name))) fail(`Shadowed or duplicate identifier ${name}`);
    const binding = { kind: mutable && value.kind !== 'array' ? 'unknown' : value.kind, mutable, name };
    scope.set(name, binding);
    return binding;
  }
  block(newScope = true) {
    this.expect('{');
    if (newScope) this.scopes.push(new Map());
    while (!this.peek('}')) this.statement();
    this.expect('}');
    if (newScope) this.scopes.pop();
  }
  terminator() {
    if (!this.eat(';') && !this.peek('}')) fail('Explicit semicolon required', this.tokens[this.position]);
  }
  declaration() {
    const mutable = this.take().value === 'let';
    const name = this.name();
    this.expect('=');
    const value = this.expression();
    this.declare(name, value, mutable);
  }
  statement() {
    if (this.peek('{')) return this.block();
    if (this.eat(';')) return;
    if (this.peek('const') || this.peek('let')) {
      this.declaration();
      return this.terminator();
    }
    if (this.eat('if')) {
      this.expect('('); this.expression(); this.expect(')');
      if (this.peek('const') || this.peek('let')) fail('Conditional declarations require braces');
      this.statement();
      if (this.eat('else')) {
        if (this.peek('const') || this.peek('let')) fail('Conditional declarations require braces');
        this.statement();
      }
      return;
    }
    if (this.eat('return')) {
      const start = this.tokens[this.position - 1].offset;
      if (!this.peek(';') && !this.peek('}') && /[\r\n\u2028\u2029]/.test(this.source.slice(start, this.tokens[this.position].offset))) {
        fail('Return expression must begin on the same line');
      }
      if (!this.peek(';') && !this.peek('}')) this.expression();
      return this.terminator();
    }
    if (this.eat('for')) {
      this.expect('(');
      this.scopes.push(new Map());
      if (!this.peek('let') && !this.peek('const')) fail('For loop requires local declaration', this.tokens[this.position]);
      const mutable = this.take().value === 'let';
      const name = this.name();
      if (this.eat('of')) {
        this.expression();
        this.declare(name, { kind: 'unknown' }, mutable);
        this.expect(')');
      } else {
        if (!mutable) fail('Counting loop requires let');
        this.expect('=');
        this.declare(name, this.expression(), true);
        this.expect(';'); this.expression(); this.expect(';');
        this.expression(); this.expect(')');
      }
      this.block();
      this.scopes.pop();
      return;
    }
    this.expression();
    this.terminator();
  }
  expression(minimum = 0) {
    let left = this.unary();
    while (this.tokens[this.position].kind === 'punctuation' && (precedence.get(this.tokens[this.position].value) ?? -1) >= minimum) {
      const operator = this.take().value;
      const right = this.expression(precedence.get(operator) + (operator === '**' ? 0 : 1));
      const arithmetic = ['+', '-', '*', '/', '%', '**', '<<', '>>', '&', '|', '^'].includes(operator);
      left = { kind: arithmetic && left.kind === 'bigint' && right.kind === 'bigint' ? 'bigint' : 'unknown' };
    }
    if (minimum === 0 && this.eat('?')) {
      this.expression(); this.expect(':'); this.expression();
      left = { kind: 'unknown' };
    }
    if (minimum === 0 && this.tokens[this.position].kind === 'punctuation' && assignments.has(this.tokens[this.position].value)) {
      const operator = this.take().value;
      if (!left.binding?.mutable) fail('Assignment requires a mutable local identifier');
      const right = this.expression();
      if (left.binding.kind === 'array' && (operator !== '=' || right.kind !== 'array')) {
        fail('Cannot replace proven local array with an unproven value');
      }
      left = { kind: 'unknown' };
    }
    return left;
  }
  unary() {
    if (this.tokens[this.position].kind === 'punctuation' && ['!', '~', '-', '+'].includes(this.tokens[this.position].value)) {
      const operator = this.take().value;
      const value = this.unary();
      return { kind: operator !== '!' && operator !== '+' && value.kind === 'bigint' ? 'bigint' : 'unknown' };
    }
    let value;
    const token = this.tokens[this.position];
    if (['string', 'number', 'bigint'].includes(token.kind)) {
      this.take(); value = { kind: token.kind };
    } else if (this.eat('true') || this.eat('false') || this.eat('null')) {
      value = { kind: 'unknown' };
    } else if (this.eat('(')) {
      value = this.expression(); this.expect(')');
      // Parenthesized or derived call targets are not direct calls.
      value = { kind: value.kind };
    } else if (this.eat('[')) {
      if (!this.peek(']')) {
        do {
          this.expression();
          if (this.peek(']')) break;
        } while (this.eat(',') && !this.peek(']'));
      }
      this.expect(']'); value = { kind: 'array' };
    } else if (this.eat('{')) {
      if (!this.peek('}')) {
        do {
          const key = this.property();
          if (this.eat(':')) this.expression();
          else {
            if (this.tokens[this.position - 1].kind !== 'identifier') fail('Object key requires value');
            this.reference(key);
          }
          if (this.peek('}')) break;
        } while (this.eat(',') && !this.peek('}'));
      }
      this.expect('}'); value = { kind: 'object' };
    } else {
      const name = this.name();
      if (this.functions.has(name) && this.peek('(')) {
        const count = this.arguments();
        if (count !== this.functions.get(name).parameters.length) fail(`Wrong argument count for ${name}`);
        this.current.calls.add(name);
        value = { kind: 'unknown' };
      } else value = this.reference(name);
    }
    while (this.eat('.')) {
      const property = this.property(true);
      if (this.peek('(')) {
        const safePush = property === 'push' && value.kind === 'array' && value.binding;
        const safeString = property === 'toString' && value.kind === 'bigint';
        if (!safePush && !safeString) fail(`Unproven method receiver for ${property}; only local-array push and proven-BigInt toString are permitted`);
        const count = this.arguments();
        if (safeString && count !== 0) fail('BigInt toString accepts no arguments in this grammar');
        value = { kind: safeString ? 'string' : 'number' };
      } else value = { kind: 'unknown' };
    }
    if (this.peek('(') || this.peek('[')) fail('Computed access or indirect call is forbidden', this.tokens[this.position]);
    return value;
  }
  reference(name) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const scope = this.scopes[i];
      if (scope.has(name)) {
        const binding = scope.get(name);
        return { kind: binding.kind, binding };
      }
    }
    if (this.functions.has(name)) fail(`Function alias or non-call reference to ${name}`);
    fail(`Unresolved identifier or free-variable reference: ${name}`);
  }
  arguments() {
    this.expect('(');
    let count = 0;
    if (!this.peek(')')) {
      do { this.expression(); count++; } while (this.eat(','));
    }
    this.expect(')');
    return count;
  }
}

/**
 * Scan a deliberately restricted language, not general JavaScript. Throws on
 * unsupported syntax or policy violations. Reachability includes each root.
 * Policy may replace sharedHelpers/privateHelpers; route roots remain fixed.
 * Input data and standard, unmodified built-in prototypes are trusted. Property
 * reads/for-of are syntactically checked, not proofs against getters/iterators.
 */
export function inspectSource(source, policy = {}) {
  if (typeof source !== 'string') throw new TypeError('source must be a string');
  const shared = policy.sharedHelpers ?? SHARED_HELPER_ALLOWLIST;
  const privateHelpers = policy.privateHelpers ?? PRIVATE_HELPER_ALLOWLIST;
  const functions = new Scanner(source).collect();
  for (const root of ROOTS) if (!functions.has(root)) fail(`Missing route root ${root}`);
  const reachability = {};
  for (const root of ROOTS) {
    const reached = new Set();
    const visit = name => {
      if (reached.has(name)) return;
      reached.add(name);
      for (const callee of functions.get(name).calls) visit(callee);
    };
    visit(root);
    reachability[root] = sorted(reached);
    for (const other of ROOTS) if (other !== root && reached.has(other)) fail(`Cross-route call: ${root} reaches ${other}`);
  }
  const consumers = Object.fromEntries(sorted(functions.keys()).map(name => [name, ROOTS.filter(root => reachability[root].includes(name))]));
  for (const [group, entries] of [['shared', shared], ['private', privateHelpers]]) {
    if (!entries || typeof entries !== 'object' || Array.isArray(entries)) fail(`Invalid ${group} helper policy`);
    for (const [name, entry] of Object.entries(entries)) {
      if (!entry || typeof entry.reason !== 'string' || !entry.reason.trim()) fail(`Missing reason for ${name}`);
      if (!Array.isArray(entry.consumers) || new Set(entry.consumers).size !== entry.consumers.length || entry.consumers.some(root => !ROOTS.includes(root))) fail(`Invalid consumers for ${name}`);
      if (ROOTS.includes(name) || (group === 'private' ? entry.consumers.length !== 1 : entry.consumers.length < 2)) fail(`Invalid ${group} helper ${name}`);
      if (Object.hasOwn(shared, name) && Object.hasOwn(privateHelpers, name)) fail(`Conflicting helper policy for ${name}`);
      if (!functions.has(name) || !same(consumers[name], entry.consumers)) fail(`Actual usage differs from permissions for ${name}`);
    }
  }
  for (const [name, routes] of Object.entries(consumers)) {
    if (!routes.length) fail(`Unreachable function ${name}`);
    if (routes.length > 1 && !Object.hasOwn(shared, name)) fail(`Unapproved shared helper ${name}`);
    if (!ROOTS.includes(name) && routes.length === 1 && !Object.hasOwn(privateHelpers, name)) fail(`Unapproved private helper ${name}`);
  }
  const intersections = {};
  for (let i = 0; i < ROOTS.length; i++) {
    for (let j = i + 1; j < ROOTS.length; j++) {
      const a = ROOTS[i];
      const b = ROOTS[j];
      const actual = reachability[a].filter(name => reachability[b].includes(name));
      const expected = i === 0 && j === 2 ? ['rotateMaskZ12'] : [];
      if (!same(actual, expected)) fail(`Unexpected reachability intersection: ${a}/${b}`);
      intersections[`${a}/${b}`] = actual;
    }
  }
  const normalize = entries => Object.fromEntries(sorted(Object.keys(entries)).map(name => [name, { reason: entries[name].reason, consumers: sorted(entries[name].consumers) }]));
  return {
    grammar: 'restricted-engine-token-scanner-v1',
    roots: [...ROOTS],
    reachabilityIncludesRoot: true,
    directCalls: Object.fromEntries(sorted(functions.keys()).map(name => [name, sorted(functions.get(name).calls)])),
    reachability,
    consumers,
    intersections,
    sharedHelpers: normalize(shared),
    privateHelpers: normalize(privateHelpers),
  };
}

export function inspectFile(path) {
  return inspectSource(readFileSync(path, 'utf8'));
}
