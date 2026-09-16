import { createHash } from "node:crypto";
import { types } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";

export const CATEGORIES = Object.freeze(["invalid", "incomplete_or_anomalous",
  "filter_plus_geometry", "restatement_signature", "overshoot", "derived", "not_derived"]);
export const CONTROL_NAMES = Object.freeze(["binding", "isolation", "route_isolation",
  "kernel_perturbation", "edge_deletion", "production_E_completeness", "anchor_input",
  "edge_input", "T-C", "contact_join", "seam_input", "seal", "completeness", "R_bounds",
  "accounting", "outcome_precedence", "determinism", "nonvacuity"]);

export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function decimal(value) {
  assert(typeof value === "string" && /^(?:0|[1-9][0-9]*)(?![\s\S])/.test(value), "invalid:decimal");
  return BigInt(value);
}

export function office(value) {
  const result = decimal(value);
  assert(result < 7n, "invalid:office");
  return result;
}

export function sha(value) {
  assert(typeof value === "string" && /^[0-9a-f]{64}(?![\s\S])/.test(value), "invalid:sha256");
  return value;
}

function quote(value) {
  for (let i = 0; i < value.length; i++) {
    const unit = value.charCodeAt(i);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(++i);
      assert(next >= 0xdc00 && next <= 0xdfff, "invalid:lone_surrogate");
    } else assert(unit < 0xdc00 || unit > 0xdfff, "invalid:lone_surrogate");
  }
  return JSON.stringify(value);
}

// RFC 8785 subset: wire integers are strings, so JSON Number is rejected.
export function canonicalJSON(value, ancestors = new Set()) {
  if (value === null) return "null";
  if (typeof value === "string") return quote(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  assert(typeof value === "object" && !types.isProxy(value), "invalid:non_inert_json");
  assert(!ancestors.has(value), "invalid:cycle");
  const array = Array.isArray(value);
  assert(Object.getPrototypeOf(value) === (array ? Array.prototype : Object.prototype) ||
    (!array && Object.getPrototypeOf(value) === null), "invalid:prototype");
  const descriptors = Object.getOwnPropertyDescriptors(value);
  assert(Object.getOwnPropertySymbols(value).length === 0, "invalid:symbol");
  const keys = Object.keys(descriptors).filter(key => !(array && key === "length"));
  for (const key of keys) {
    const descriptor = descriptors[key];
    assert(Object.hasOwn(descriptor, "value") && descriptor.enumerable, "invalid:accessor_or_hidden");
  }
  if (array) assert(keys.length === value.length && keys.every((key, i) => key === String(i)), "invalid:sparse_array");
  ancestors.add(value);
  const parts = (array ? keys : keys.sort()).map(key =>
    (array ? "" : `${quote(key)}:`) + canonicalJSON(descriptors[key].value, ancestors));
  ancestors.delete(value);
  return (array ? "[" : "{") + parts.join(",") + (array ? "]" : "}");
}

export function digestBytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function digestObject(value) {
  return digestBytes(Buffer.from(canonicalJSON(value), "utf8"));
}

export function specPreimage(hashes) {
  assert(Array.isArray(hashes) && hashes.length === 4, "invalid:spec_binding_count");
  return hashes.map(value => sha(value) + "\n").join("");
}

export function implementationDigest(files) {
  const sorted = files.map(file => {
    assert(Object.keys(file).sort().join(",") === "path,sha256", "invalid:closure_record");
    assert(typeof file.path === "string" && file.path.length > 0 && !file.path.startsWith("/") &&
      !file.path.includes("\\") && !file.path.split("/").some(p => p === ".." || p === "." || !p), "invalid:closure_path");
    return { path: file.path, sha256: sha(file.sha256) };
  }).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  assert(sorted.length > 0 && new Set(sorted.map(x => x.path)).size === sorted.length, "invalid:closure_inventory");
  return digestObject(sorted);
}

export function absent(reason) {
  assert(typeof reason === "string" && reason.trim().length > 0, "invalid:absent_reason");
  return { status: "ABSENT", reason };
}

export function absentControls(reason) {
  return Object.fromEntries(CONTROL_NAMES.map(name => [name, absent(reason)]));
}

export function absentReceipt(bindings, boundarySha256, specSha256, reason, schema, category = "incomplete_or_anomalous") {
  assert(["invalid", "incomplete_or_anomalous"].includes(category), "invalid:absent_category");
  const receipt = { schemaVersion: "d4-derivation-wire.v1", boundarySha256, specSha256, bindings,
    generation: absent(reason), seal: absent(reason), comparison: absent(reason),
    controls: absentControls(reason), category };
  validateWire(receipt, schema);
  return receipt;
}

// Semantic full matching supplements the frozen schema's permissive $ anchors.
export function validateWire(receipt, schema) {
  canonicalJSON(receipt);
  const ajv = new Ajv2020({ strict: false, allErrors: true, coerceTypes: false, useDefaults: false, removeAdditional: false });
  assert(ajv.validateSchema(schema), "invalid:wire_schema");
  assert(ajv.validate(schema, receipt), `invalid:wire_shape:${ajv.errorsText()}`);
  const exactPatterns = (rule, value) => {
    if (rule.$ref) {
      const resolved = rule.$ref.slice(2).split("/").reduce((x, key) => x[key], schema);
      exactPatterns(resolved, value);
    }
    if (rule.oneOf) {
      const branch = rule.oneOf.find(candidate => ajv.validate({ ...candidate, definitions: schema.definitions }, value));
      assert(branch, "invalid:wire_union");
      exactPatterns(branch, value);
    }
    if (rule.pattern && typeof value === "string") {
      const match = new RegExp(rule.pattern, "u").exec(value);
      assert(match && match.index === 0 && match[0] === value, "invalid:wire_noncanonical_string");
    }
    if (rule.properties && value && typeof value === "object") {
      for (const [key, child] of Object.entries(rule.properties)) if (Object.hasOwn(value, key)) exactPatterns(child, value[key]);
    }
    if (rule.items && Array.isArray(value)) for (const item of value) exactPatterns(rule.items, item);
  };
  exactPatterns(schema, receipt);
  const missing = [receipt.generation, receipt.seal, receipt.comparison, ...Object.values(receipt.controls)]
    .some(stage => stage.status === "ABSENT" || stage.state === "skipped");
  if (missing) assert(["invalid", "incomplete_or_anomalous"].includes(receipt.category), "invalid:absent_category");
  return true;
}
