import { array, record, sourceInteger, extractBound, projectionDigests } from "./d4-inputs.mjs";
import { assert, canonicalJSON, decimal, office, digestBytes, digestObject, absent, absentControls, validateWire } from "./d4-wire.mjs";

function cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
function keySort(a, b) {
  const [ao, as] = a.split(":"), [bo, bs] = b.split(":");
  return cmp(office(ao), office(bo)) || cmp(decimal(as), decimal(bs));
}
function keys(values) { return [...new Set(values)].sort(keySort); }
function key(k, s) { office(k); decimal(s); return `${k}:${s}`; }
function count(values) { return BigInt(values.length).toString(); }
function difference(a, b) { const other = new Set(b); return a.filter(x => !other.has(x)); }
function intersection(a, b) { const other = new Set(b); return a.filter(x => other.has(x)); }

export function routeAccounting(G, U, O) {
  G = keys(G); U = keys(U); O = keys(O);
  const inRKeys = intersection(G, U), extraBeyondRKeys = difference(G, U), rMissedKeys = difference(U, G);
  const inRButUnmatchedKeys = difference(inRKeys, O);
  const value = { generated_key_count: count(G), in_R_count: count(inRKeys),
    extra_beyond_R_count: count(extraBeyondRKeys), R_missed_count: count(rMissedKeys),
    in_R_but_unmatched_count: count(inRButUnmatchedKeys), generatedKeys: G, inRKeys,
    extraBeyondRKeys, rMissedKeys, inRButUnmatchedKeys,
    matchedObservedKeys: intersection(O, G), missedObservedKeys: difference(O, G),
    restatement_signature: G.length === U.length && difference(G, U).length === 0 };
  assert(decimal(value.generated_key_count) === decimal(value.in_R_count) + decimal(value.extra_beyond_R_count), "invalid:G_conservation");
  assert(BigInt(U.length) === decimal(value.in_R_count) + decimal(value.R_missed_count), "invalid:U_conservation");
  return value;
}

function relationKey(r, normalize) {
  assert(["A0", "A1"].includes(r.tier), "invalid:relation_tier");
  const a = decimal(r.a), b = decimal(r.b); office(r.mid);
  assert(a !== b, "invalid:relation_diagonal");
  return normalize && b < a ? `${r.tier}:${r.b}:${r.a}:${r.mid}` : `${r.tier}:${r.a}:${r.b}:${r.mid}`;
}
function relationSort(a, b) {
  const x = a.split(":"), y = b.split(":");
  return cmp(x[0], y[0]) || cmp(decimal(x[1]), decimal(y[1])) ||
    cmp(decimal(x[2]), decimal(y[2])) || cmp(office(x[3]), office(y[3]));
}
function relationKeys(rows, normalize) { return [...new Set(rows.map(r => relationKey(r, normalize)))].sort(relationSort); }

// This registered observation extractor is called only after verifySeal.
// Build tests supply synthetic byte documents; there is no canonical reader here.
export function extractObservations(ledger, network, projection) {
  const identities = new Map();
  for (const raw of array(ledger)) {
    const item = record(raw, ["id", "tier", "role", "officeIndex"]);
    const id = sourceInteger(item.id);
    assert(!identities.has(id), "invalid:comparison_duplicate_identity");
    identities.set(id, { ...item, id });
  }
  const parents = new Map();
  for (const r of projection.R) parents.set(r.target, [...(parents.get(r.target) ?? []), r]);
  const edges = array(record(network, ["structuralEdges"]).structuralEdges);
  const contacts = [], seamGroups = new Map(), contactIds = new Set();
  let excludedContacts = 0, excludedSeam = 0, totalContacts = 0, totalSeam = 0;
  const benignContacts = new Set(["A0:D1", "A0:D2", "A2:D3", "A2:D5", "D2:D3", "D3:D6", "D5:D6", "D6:D7"]);
  for (const raw of edges) {
    const edge = record(raw, ["id", "type", "source", "target", "directed"]);
    const s = sourceInteger(edge.source), d = sourceInteger(edge.target);
    const source = identities.get(s), target = identities.get(d);
    if (edge.type === "SEAT_CONTACT") {
      totalContacts++;
      if (source?.tier === "D4" && source.role === "anchor") throw new Error("invalid:contact_reversed");
      assert(source && target, "invalid:contact_endpoint");
      if (target.tier === "D4" || parents.has(s)) {
        assert(source.tier === "A1" && source.role === "satellite" && target.tier === "D4" &&
          target.role === "anchor" && edge.directed === false, "invalid:contact_endpoint");
        assert(typeof edge.id === "string" && edge.id.length > 0 && !contactIds.has(edge.id), "invalid:duplicate_contact");
        const group = parents.get(s) ?? [];
        assert(group.length === 1, "invalid:contact_parent");
        const parent = group[0];
        contactIds.add(edge.id);
        contacts.push({ contactRowId: edge.id, d, s, h: parent.source, parentOffice: parent.parentOffice });
      } else {
        assert(source.role === "satellite" && target.role === "anchor" && edge.directed === false &&
          benignContacts.has(`${source.tier}:${target.tier}`), "invalid:contact_endpoint");
        excludedContacts++;
      }
    } else if (edge.type === "CONSTRUCTS") {
      totalSeam++;
      assert(source && target && source.role === "anchor" && target.role === "anchor" &&
        edge.directed === true, "invalid:seam_endpoint");
      const provenance = raw.provenance;
      if (source.tier === "A0" && target.tier === "A1") {
        assert(["phase-seam construction", "exact midpoint construction"].includes(provenance), "invalid:seam_group");
        const group = seamGroups.get(d) ?? [];
        group.push({ source: s, id: edge.id, selected: provenance === "phase-seam construction" });
        seamGroups.set(d, group);
        if (provenance === "exact midpoint construction") excludedSeam++;
      } else {
        assert(source.tier === "A1" && target.tier === "A2" &&
          ["phase-seam construction", "exact midpoint construction"].includes(provenance), "invalid:seam_endpoint");
        excludedSeam++;
      }
    } else assert(source && target, "invalid:comparison_endpoint");
  }
  const seams = [];
  for (const [h, group] of seamGroups) {
    if (!group.some(e => e.selected)) continue;
    assert(group.every(e => e.selected), "invalid:seam_group");
    assert(group.length === 2 && group[0].source !== group[1].source, "invalid:seam_group");
    group.sort((a, b) => cmp(decimal(a.source), decimal(b.source)));
    const value = identities.get(h).officeIndex;
    assert(Number.isSafeInteger(value) && value >= 0 && value < 7 && !Object.is(value, -0), "invalid:seam_endpoint");
    const parentOffice = sourceInteger(value);
    seams.push({ targetH: h, parentA: group[0].source, parentB: group[1].source, parentOffice,
      edgeId1: group[0].id, edgeId2: group[1].id });
  }
  seams.sort((a, b) => cmp(decimal(a.targetH), decimal(b.targetH)));
  contacts.sort((a, b) => cmp(a.contactRowId, b.contactRowId));
  assert(contacts.length + excludedContacts === totalContacts, "invalid:contact_reconciliation");
  assert(seams.length * 2 + excludedSeam === totalSeam, "invalid:seam_group");
  return { contacts, seams, excludedContacts: String(excludedContacts), excludedSeam: String(excludedSeam) };
}

export function compareSynthetic(generation, projection, observations) {
  canonicalJSON(generation); canonicalJSON(observations);
  const U = keys(projection.R.map(r => key(r.parentOffice, r.target)));
  const G_A = keys(generation.routes["T-A"].witnesses.map(w => key(w.k, w.s)));
  const G_B = keys(generation.routes["T-B"].witnesses.map(w => key(w.parentOffice, w.s)));
  const ids = new Set(), seenA = new Set(G_A), seenB = new Set(G_B);
  const rowCounts = { aOnly: 0n, bOnly: 0n, both: 0n, neither: 0n };
  const rows = observations.contacts.map(raw => {
    const row = record(raw, ["contactRowId", "d", "s", "h", "parentOffice"], true);
    assert(typeof row.contactRowId === "string" && row.contactRowId.length > 0 && !ids.has(row.contactRowId), "invalid:duplicate_contact");
    ids.add(row.contactRowId); decimal(row.d); decimal(row.h);
    assert(projection.R.some(r => r.source === row.h && r.target === row.s && r.parentOffice === row.parentOffice), "invalid:contact_parent");
    const k = key(row.parentOffice, row.s), a = seenA.has(k), b = seenB.has(k);
    const membership = a ? (b ? "both" : "A-only") : (b ? "B-only" : "neither");
    rowCounts[membership === "A-only" ? "aOnly" : membership === "B-only" ? "bOnly" : membership] += 1n;
    return { ...row, key: { parentOffice: row.parentOffice, s: row.s }, membership };
  }).sort((a, b) => cmp(a.contactRowId, b.contactRowId));
  const O = keys(rows.map(r => key(r.parentOffice, r.s)));
  const A = routeAccounting(G_A, U, O), B = routeAccounting(G_B, U, O);
  const seamProvenance = observations.seams.map(raw => {
    const group = record(raw, ["targetH", "parentA", "parentB", "parentOffice", "edgeId1", "edgeId2"], true);
    decimal(group.targetH); office(group.parentOffice);
    assert(decimal(group.parentA) < decimal(group.parentB) && group.edgeId1 !== group.edgeId2, "invalid:seam_group");
    for (const [id, source] of [[group.edgeId1, group.parentA], [group.edgeId2, group.parentB]])
      assert(projection.E.some(e => e.id === id && e.source === source && e.target === group.targetH), "invalid:seam_edge");
    assert(projection.anchors.some(a => a.id === group.targetH && a.tier === "A1" && a.officeIndex === group.parentOffice), "invalid:seam_office");
    return group;
  }).sort((a, b) => cmp(decimal(a.targetH), decimal(b.targetH)));
  assert(new Set(seamProvenance.map(s => s.targetH)).size === seamProvenance.length, "invalid:duplicate_seam_group");
  const observedRelations = seamProvenance.map(s => ({ tier: "A0", a: s.parentA, b: s.parentB, mid: s.parentOffice }))
    .sort((a, b) => relationSort(relationKey(a, false), relationKey(b, false)));
  const generatedRelations = generation.tC.relations.filter(r => r.tier === "A0")
    .sort((a, b) => relationSort(relationKey(a, false), relationKey(b, false)));
  const generated = relationKeys(generatedRelations, true), observed = relationKeys(observedRelations, true);
  const matches = intersection(generated, observed), missing = difference(observed, generated), extra = difference(generated, observed);
  const comparison = { rows, routes: { A, B }, observedKeyCount: count(O),
    fourCellCounts: Object.fromEntries(Object.entries(rowCounts).map(([k, v]) => [k, v.toString()])), uKeys: U,
    tC: { matches, missing, extra, midpoint_exact: observed.length > 0 && missing.length === 0 && extra.length === 0,
      a1Separate: relationKeys(generation.tC.relations.filter(r => r.tier === "A1"), false),
      generatedRelations, observedRelations, seamProvenance } };
  assert(Object.values(rowCounts).reduce((a, b) => a + b, 0n) === BigInt(rows.length), "invalid:row_conservation");
  return comparison;
}

// Mapper flags are trusted verification results, not claims inferred from shape.
export function selectCategory(comparison, { valid = true, complete = true } = {}) {
  if (!valid) return "invalid";
  if (!comparison || comparison.status === "ABSENT") return "incomplete_or_anomalous";
  const { A, B } = comparison.routes;
  if (decimal(A.extra_beyond_R_count) > 0n || decimal(B.extra_beyond_R_count) > 0n) return "invalid";
  if (!complete) return "incomplete_or_anomalous";
  if (decimal(comparison.observedKeyCount) === 0n || comparison.tC.observedRelations.length === 0) return "incomplete_or_anomalous";
  const covered = A.missedObservedKeys.length === 0 && B.missedObservedKeys.length === 0;
  const C = comparison.tC.midpoint_exact;
  if (covered && (A.restatement_signature || B.restatement_signature)) return C ? "filter_plus_geometry" : "restatement_signature";
  if (covered && (decimal(A.in_R_but_unmatched_count) > 0n || decimal(B.in_R_but_unmatched_count) > 0n)) return "overshoot";
  if (covered && C) return "derived";
  return "not_derived";
}

export function verifySeal(packet) {
  canonicalJSON(packet);
  const { generation, bindings, seal, boundarySha256, specSha256, projection } = packet;
  assert(generation?.completion?.status === "complete" && seal?.complete === true, "incomplete_or_anomalous:seal");
  assert(canonicalJSON(bindings.projectionDigests) === canonicalJSON(projectionDigests(projection)), "invalid:projection_binding");
  assert(canonicalJSON(seal.inputIdentities) === canonicalJSON({ ledgerSha256: bindings.ledgerSha256,
    networkSha256: bindings.networkSha256, implementationDigest: bindings.implementationDigest }), "invalid:seal_inputs");
  assert(seal.generationDigest === digestObject({ boundarySha256, specSha256, bindings, generation }), "invalid:seal_digest");
  const n0 = BigInt(projection.anchors.filter(a => a.tier === "A0").length);
  const n1 = BigInt(projection.anchors.filter(a => a.tier === "A1").length);
  const nr = BigInt(projection.R.length), ne = BigInt(projection.E.length);
  const expected = { "T-A": n0 * n0 * nr * 7n, "T-B": ne * ne * nr,
    "T-C": n0 * (n0 - 1n) + n1 * (n1 - 1n) };
  for (const route of ["T-A", "T-B", "T-C"]) {
    const rows = route === "T-C" ? generation.tC.relations : generation.routes[route].witnesses;
    const c = generation.completion.perRoute[route];
    assert(decimal(c.expected) === expected[route] && decimal(c.expected) === decimal(c.visited) &&
      decimal(c.outputs) === BigInt(rows.length) && c.digest === digestObject(rows), "invalid:seal_completion");
  }
  return true;
}

export function compareSealed(packet, readReference) {
  // Snapshot before invoking any caller-controlled observation reader.
  canonicalJSON(packet);
  const snapshot = JSON.parse(canonicalJSON(packet));
  verifySeal(snapshot);
  const reference = readReference();
  assert(digestBytes(reference.ledgerBytes) === snapshot.bindings.ledgerSha256 &&
    digestBytes(reference.networkBytes) === snapshot.bindings.networkSha256, "invalid:comparison_binding");
  const independent = extractBound(reference.ledgerBytes, reference.networkBytes, snapshot.bindings);
  assert(canonicalJSON(projectionDigests(independent)) === canonicalJSON(snapshot.bindings.projectionDigests), "invalid:comparison_projection");
  const observations = extractObservations(JSON.parse(reference.ledgerBytes.toString("utf8")),
    JSON.parse(reference.networkBytes.toString("utf8")), independent);
  return compareSynthetic(snapshot.generation, independent, { contacts: observations.contacts, seams: observations.seams });
}

export function buildReceipt(packet, comparison, schema) {
  verifySeal(packet);
  if (comparison) {
    canonicalJSON(comparison);
    const recomputed = compareSynthetic(packet.generation, packet.projection, {
      contacts: comparison.rows.map(row => ({ contactRowId: row.contactRowId, d: row.d, s: row.s, h: row.h, parentOffice: row.parentOffice })),
      seams: comparison.tC.seamProvenance,
    });
    assert(canonicalJSON(recomputed) === canonicalJSON(comparison), "invalid:comparison_accounting");
  }
  // Build-only report: the separately gated 18 pre-flight controls have NOT run.
  const controls = absentControls("Build phase only; pre-flight not executed");
  const receipt = { schemaVersion: "d4-derivation-wire.v1", boundarySha256: packet.boundarySha256,
    specSha256: packet.specSha256, bindings: packet.bindings, generation: packet.generation,
    seal: packet.seal, comparison: comparison ?? absent("Comparison not executed"), controls,
    category: selectCategory(comparison, { complete: false }) };
  validateWire(receipt, schema);
  return receipt;
}
