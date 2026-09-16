import { types } from "node:util";
import { assert, canonicalJSON, decimal, office, sha, digestBytes, digestObject } from "./d4-wire.mjs";

export function record(value, names, exact = false) {
  assert(value && typeof value === "object" && !types.isProxy(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null), "invalid:input_object");
  const descriptors = Object.getOwnPropertyDescriptors(value);
  assert(Object.getOwnPropertySymbols(value).length === 0 && Object.values(descriptors)
    .every(d => Object.hasOwn(d, "value") && d.enumerable), "invalid:input_accessor");
  assert(names.every(name => Object.hasOwn(descriptors, name)), "invalid:input_fields");
  if (exact) assert(Object.keys(descriptors).length === names.length, "invalid:extra_projection_field");
  return Object.fromEntries(names.map(name => [name, descriptors[name].value]));
}

export function array(value) {
  assert(Array.isArray(value) && !types.isProxy(value) && Object.getPrototypeOf(value) === Array.prototype, "invalid:input_array");
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Object.keys(descriptors).filter(key => key !== "length");
  assert(Object.getOwnPropertySymbols(value).length === 0 && keys.length === value.length &&
    keys.every((key, i) => key === String(i) && Object.hasOwn(descriptors[key], "value")), "invalid:input_array_fields");
  return keys.map(key => descriptors[key].value);
}

export function sourceInteger(value) {
  assert(typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && !Object.is(value, -0), "invalid:source_integer");
  return String(value);
}

function compareId(a, b) {
  return BigInt(a.id) < BigInt(b.id) ? -1 : BigInt(a.id) > BigInt(b.id) ? 1 : 0;
}

function freeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

// Only these source fields influence selection; no contact/provenance flags.
export function extractGeneration(ledger, network) {
  const identities = new Map();
  for (const raw of array(ledger)) {
    const item = record(raw, ["id", "tier", "role", "officeIndex"]);
    const id = sourceInteger(item.id);
    assert(!identities.has(id), "invalid:duplicate_state_identity");
    assert((item.tier === null || typeof item.tier === "string") && typeof item.role === "string", "invalid:source_type");
    identities.set(id, { ...item, id });
  }
  const anchors = [...identities.values()].filter(x => ["A0", "A1"].includes(x.tier) && x.role === "anchor")
    .map(x => ({ id: x.id, tier: x.tier, role: x.role, officeIndex: sourceInteger(x.officeIndex) }));
  const R = [], E = [], edgeIds = new Set();
  const edges = record(network, ["structuralEdges"]).structuralEdges;
  for (const raw of array(edges)) {
    const edge = record(raw, ["id", "type", "source", "target", "directed"]);
    assert(typeof edge.id === "string" && edge.id.length > 0 && !edgeIds.has(edge.id), "invalid:edge_identity");
    edgeIds.add(edge.id);
    assert(typeof edge.type === "string" && typeof edge.directed === "boolean", "invalid:edge_type");
    const source = sourceInteger(edge.source), target = sourceInteger(edge.target);
    const parent = identities.get(source), child = identities.get(target);
    assert(parent && child, "invalid:missing_endpoint");
    if (parent.tier === "A1" && parent.role === "anchor" && child.tier === "A1" && child.role === "satellite")
      assert(edge.type === "GOVERNS", "invalid:R_type");
    if (parent.tier === "A0" && parent.role === "anchor" && child.tier === "A1" && child.role === "anchor")
      assert(edge.type === "CONSTRUCTS", "invalid:E_type");
    if (edge.type === "GOVERNS" && child.tier === "A1" && child.role === "satellite") {
      assert(parent.tier === "A1" && parent.role === "anchor" && edge.directed, "invalid:R_parent");
      R.push({ id: edge.id, type: edge.type, source, target, directed: true,
        parentTier: parent.tier, childTier: child.tier, parentOffice: sourceInteger(parent.officeIndex) });
    } else if (edge.type === "GOVERNS" && parent.tier === "A1" && parent.role === "satellite") {
      throw new Error("invalid:R_reversed");
    }
    if (edge.type === "CONSTRUCTS" && parent.tier === "A0" && child.tier === "A1") {
      assert(parent.role === "anchor" && child.role === "anchor" && edge.directed, "invalid:E_endpoints");
      E.push({ id: edge.id, type: edge.type, source, target, directed: true,
        parentTier: parent.tier, childTier: child.tier });
    } else if (edge.type === "CONSTRUCTS" && parent.tier === "A1" && child.tier === "A0") {
      throw new Error("invalid:E_reversed");
    }
  }
  const projection = { anchors: anchors.sort(compareId),
    R: R.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    E: E.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0) };
  validateProjection(projection);
  const declaredSatellites = [...identities.values()].filter(x => x.tier === "A1" && x.role === "satellite");
  assert(declaredSatellites.length === R.length && declaredSatellites.every(s => R.some(r => r.target === s.id)), "invalid:R_completeness");
  return freeze(projection);
}

export function validateProjection(projection) {
  canonicalJSON(projection);
  record(projection, ["anchors", "R", "E"], true);
  const anchors = new Map(), offices = { A0: new Set(), A1: new Set() };
  for (const raw of array(projection.anchors)) {
    const a = record(raw, ["id", "tier", "role", "officeIndex"], true);
    const mask = decimal(a.id), k = office(a.officeIndex);
    assert(mask < 4096n && mask.toString(2).replaceAll("0", "").length === 7, "invalid:anchor_mask");
    assert(["A0", "A1"].includes(a.tier) && a.role === "anchor", "invalid:anchor_type");
    assert(!anchors.has(a.id) && !offices[a.tier].has(k), "invalid:duplicate_anchor");
    anchors.set(a.id, a); offices[a.tier].add(k);
  }
  assert(offices.A0.size === 7 && offices.A1.size === 7, "invalid:anchor_completeness");
  const ids = new Set(), satellites = new Set();
  for (const raw of array(projection.R)) {
    const r = record(raw, ["id", "type", "source", "target", "directed", "parentTier", "childTier", "parentOffice"], true);
    decimal(r.source); decimal(r.target); office(r.parentOffice);
    const parent = anchors.get(r.source);
    assert(r.type === "GOVERNS" && r.directed === true && r.parentTier === "A1" && r.childTier === "A1" &&
      parent?.tier === "A1" && parent.officeIndex === r.parentOffice && !anchors.has(r.target), "invalid:R_endpoints");
    assert(typeof r.id === "string" && r.id.length > 0 && !ids.has(r.id) && !satellites.has(r.target), "invalid:R_duplicate");
    ids.add(r.id); satellites.add(r.target);
  }
  for (const raw of array(projection.E)) {
    const e = record(raw, ["id", "type", "source", "target", "directed", "parentTier", "childTier"], true);
    decimal(e.source); decimal(e.target);
    assert(e.type === "CONSTRUCTS" && e.directed === true && e.parentTier === "A0" && e.childTier === "A1" &&
      anchors.get(e.source)?.tier === "A0" && anchors.get(e.target)?.tier === "A1", "invalid:E_endpoints");
    assert(typeof e.id === "string" && e.id.length > 0 && !ids.has(e.id), "invalid:E_duplicate"); ids.add(e.id);
  }
  return true;
}

export function projectionDigests(projection) {
  validateProjection(projection);
  const anchors = [...projection.anchors].sort(compareId);
  const sort = rows => [...rows].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  return { anchors: digestObject(anchors), R: digestObject(sort(projection.R)), E: digestObject(sort(projection.E)) };
}

export function extractBound(ledgerBytes, networkBytes, expected) {
  assert(digestBytes(ledgerBytes) === sha(expected.ledgerSha256), "invalid:ledger_binding");
  assert(digestBytes(networkBytes) === sha(expected.networkSha256), "invalid:network_binding");
  return extractGeneration(JSON.parse(ledgerBytes.toString("utf8")), JSON.parse(networkBytes.toString("utf8")));
}
