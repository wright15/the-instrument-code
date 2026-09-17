import { extractBound, projectionDigests } from "../../scripts/d4-inputs.mjs";
import { generate, sealGeneration } from "../../scripts/d4-generation.mjs";
import { digestBytes, digestObject, specPreimage } from "../../scripts/d4-wire.mjs";

// Generated toy anchors, not canonical observation fixtures.
function rotation(m) { return ((m << 1) & 4095) | (m >> 11); }
function fillMasks(seed, forbidden) {
  const masks = [...seed];
  for (let candidate = 0; masks.length < 7; candidate++) {
    if (candidate.toString(2).replaceAll("0", "").length !== 7 || forbidden.includes(candidate) || masks.includes(candidate)) continue;
    if (masks.some(m => rotation(m) === candidate || rotation(candidate) === m)) continue;
    masks.push(candidate);
  }
  return masks;
}

export function syntheticDocuments() {
  const a0 = fillMasks([127, 254], []), a1 = fillMasks([], a0);
  const indices = [1, 6, 0, 2, 3, 4, 5];
  const ledger = [
    ...a0.map((id, i) => ({ id, tier: "A0", role: "anchor", officeIndex: indices[i] })),
    ...a1.map((id, i) => ({ id, tier: "A1", role: "anchor", officeIndex: i })),
    { id: 90001, tier: "A1", role: "satellite", officeIndex: 0 },
    { id: 80001, tier: "D4", role: "anchor", officeIndex: 3 },
    { id: 80002, tier: "D4", role: "anchor", officeIndex: 5 },
  ];
  const structuralEdges = [
    { id: "synthetic:construct:a", type: "CONSTRUCTS", directed: true,
      source: a0[0], target: a1[0], provenance: "phase-seam construction" },
    { id: "synthetic:construct:b", type: "CONSTRUCTS", directed: true,
      source: a0[1], target: a1[0], provenance: "phase-seam construction" },
    { id: "synthetic:governs", type: "GOVERNS", directed: true, source: a1[0], target: 90001 },
    { id: "synthetic:contact:a", type: "SEAT_CONTACT", directed: false, source: 90001, target: 80001 },
    { id: "synthetic:contact:b", type: "SEAT_CONTACT", directed: false, source: 90001, target: 80002 },
  ];
  return { ledger, network: { structuralEdges } };
}

export function regressionDocuments(name) {
  const docs = syntheticDocuments();
  if (name === "D4 target role satellite") docs.ledger.find(a => a.id === 80001).role = "satellite";
  else if (name === "D4 target tier A2") docs.ledger.find(a => a.id === 80001).tier = "A2";
  else if (name === "benign A2 satellite to D5 anchor") {
    docs.ledger.push({ id: 81001, tier: "A2", role: "satellite", officeIndex: 0 },
      { id: 81002, tier: "D5", role: "anchor", officeIndex: 0 });
    docs.network.structuralEdges.push({ id: "synthetic:benign", type: "SEAT_CONTACT", directed: false, source: 81001, target: 81002 });
  } else if (name === "seam provenance flip") docs.network.structuralEdges[1].provenance = "exact midpoint construction";
  else throw new Error("Unknown regression fixture");
  return docs;
}

export function syntheticPacket(documents = syntheticDocuments()) {
  const reference = { ledgerBytes: Buffer.from(JSON.stringify(documents.ledger)),
    networkBytes: Buffer.from(JSON.stringify(documents.network)) };
  const expected = { ledgerSha256: digestBytes(reference.ledgerBytes), networkSha256: digestBytes(reference.networkBytes) };
  const projection = extractBound(reference.ledgerBytes, reference.networkBytes, expected);
  // Explicit toy binding metadata, not acceptance of an actual implementation.
  const boundarySha256 = digestBytes("synthetic-boundary"), specSha256 = digestBytes(specPreimage([
    boundarySha256, digestBytes("synthetic-spec"), digestBytes("synthetic-schema"), digestBytes("synthetic-addendum") ]));
  const bindings = { ...expected, twinHubReceiptSha256: digestBytes("synthetic-audit"),
    implementationDigest: digestObject([{ path: "synthetic-engine", sha256: digestBytes("synthetic-code") }]),
    projectionDigests: projectionDigests(projection) };
  const generation = generate(projection);
  const seal = sealGeneration(generation, bindings, boundarySha256, specSha256, projection);
  return { packet: { boundarySha256, specSha256, bindings, generation, seal, projection }, reference };
}
