import { generateRouteTA, generateRouteTB, generateRouteTC } from "./d4-derivation-engine.mjs";
import { validateProjection, projectionDigests } from "./d4-inputs.mjs";
import { canonicalJSON, digestObject, assert, decimal, sha } from "./d4-wire.mjs";

const FIELDS = {
  "T-A": ["a", "b", "h", "s", "k", "tag"],
  "T-B": ["e1source", "e2source", "h", "s", "parentOffice", "e1id", "e2id", "tag"],
  "T-C": ["tier", "a", "b", "mid"],
};
const TEXT = new Set(["tier", "tag", "e1id", "e2id"]);

export function orderedWitnesses(rows, route) {
  return [...new Map(rows.map(row => [canonicalJSON(row), row])).values()].sort((a, b) => {
    for (const key of FIELDS[route]) {
      const left = TEXT.has(key) ? a[key] : decimal(a[key]);
      const right = TEXT.has(key) ? b[key] : decimal(b[key]);
      if (left < right) return -1;
      if (left > right) return 1;
    }
    return 0;
  });
}

function toWire(rows) {
  return rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) =>
    [key, typeof value === "bigint" ? value.toString() : value])));
}

// No canonical observation access or production entry point is provided.
export function generate(projection) {
  validateProjection(projection);
  const anchors = projection.anchors.map(a => ({ id: BigInt(a.id), tier: a.tier, officeIndex: BigInt(a.officeIndex) }));
  const a0 = anchors.filter(a => a.tier === "A0");
  const R = projection.R.map(r => ({ source: BigInt(r.source), target: BigInt(r.target), parentOffice: BigInt(r.parentOffice) }));
  const E = projection.E.map(e => ({ id: e.id, source: BigInt(e.source), target: BigInt(e.target),
    type: e.type, parentTier: e.parentTier, childTier: e.childTier }));
  const A = generateRouteTA(a0, R), B = generateRouteTB(E, R), C = generateRouteTC(anchors);
  const wa = orderedWitnesses(toWire(A.witnesses), "T-A");
  const wb = orderedWitnesses(toWire(B.witnesses), "T-B");
  const wc = orderedWitnesses(toWire(C.relations), "T-C");
  const n0 = BigInt(a0.length), n1 = BigInt(anchors.length) - n0, nr = BigInt(R.length), ne = BigInt(E.length);
  const expected = { "T-A": n0 * n0 * nr * 7n, "T-B": ne * ne * nr, "T-C": n0 * (n0 - 1n) + n1 * (n1 - 1n) };
  const perRoute = {};
  for (const [route, result, rows] of [["T-A", A, wa], ["T-B", B, wb], ["T-C", C, wc]]) {
    assert(result.candidates === expected[route], "invalid:candidate_enumeration");
    perRoute[route] = { expected: expected[route].toString(), visited: result.candidates.toString(),
      outputs: BigInt(rows.length).toString(), digest: digestObject(rows) };
  }
  return { routes: { "T-A": { witnesses: wa }, "T-B": { witnesses: wb } },
    tC: { relations: wc }, completion: { perRoute, status: "complete" } };
}

export function sealGeneration(generation, bindings, boundarySha256, specSha256, projection) {
  const actual = projectionDigests(projection);
  assert(canonicalJSON(bindings.projectionDigests) === canonicalJSON(actual), "invalid:projection_binding");
  sha(boundarySha256); sha(specSha256);
  for (const name of ["ledgerSha256", "networkSha256", "twinHubReceiptSha256", "implementationDigest"]) sha(bindings[name]);
  assert(generation.completion.status === "complete", "incomplete_or_anomalous:generation");
  for (const route of ["T-A", "T-B", "T-C"]) {
    const rows = route === "T-C" ? generation.tC.relations : generation.routes[route].witnesses;
    const completion = generation.completion.perRoute[route];
    assert(decimal(completion.expected) === decimal(completion.visited) &&
      decimal(completion.outputs) === BigInt(rows.length) && completion.digest === digestObject(rows), "invalid:completion_binding");
    assert(canonicalJSON(rows) === canonicalJSON(orderedWitnesses(rows, route)), "invalid:witness_order");
  }
  const payload = { boundarySha256, specSha256, bindings, generation };
  return { generationDigest: digestObject(payload), inputIdentities: {
    ledgerSha256: bindings.ledgerSha256, networkSha256: bindings.networkSha256,
    implementationDigest: bindings.implementationDigest }, complete: true };
}
