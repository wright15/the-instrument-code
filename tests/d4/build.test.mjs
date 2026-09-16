import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { runInNewContext } from "node:vm";
import { execFileSync } from "node:child_process";
import { rotateMaskZ12, midZ7, generateRouteTA, generateRouteTB } from "../../scripts/d4-derivation-engine.mjs";
import { extractGeneration, extractBound, validateProjection, projectionDigests } from "../../scripts/d4-inputs.mjs";
import { generate, sealGeneration } from "../../scripts/d4-generation.mjs";
import { canonicalJSON, digestBytes, digestObject, specPreimage, implementationDigest, decimal, validateWire, absentReceipt } from "../../scripts/d4-wire.mjs";
import { compareSealed, compareSynthetic, routeAccounting, selectCategory, verifySeal, buildReceipt } from "../../scripts/d4-downstream-comparison.mjs";
import { inspectFile } from "../../scripts/lib/static-callgraph.mjs";
import { syntheticPacket, syntheticDocuments } from "./synthetic.mjs";

const root = new URL("../../", import.meta.url);
const read = path => readFileSync(new URL(path, root));
const schema = JSON.parse(read("schemas/d4-derivation-wire.schema.json"));

test("frozen contracts and proven arithmetic reference match raw bytes", () => {
  for (const [path, hash] of [
    ["scrum/plan/d4-boundary-draft.md", "751d56d4f01ea1a0d054c8119d178a64b20787aa9fb095a02c99f3ba3b135de2"],
    ["scrum/plan/d4-implementation-spec-draft.md", "5096f1e3caf5e1f2a9a3984bcb4aa54b38a7cab4d20a9d34bb57516dfafa9042"],
    ["schemas/d4-derivation-wire.schema.json", "b2b3eaed07fba5082a9f6ff18cd40fbe75cb833b0bd8d8a7dc8055eefcbfc52d"],
    ["scrum/plan/d4-wire-schema-addendum.md", "56db87ffcd73dd9b6c9a97a5c99d23881767c93ebc430c6a17e70c49e6b3a68c"],
    ["scrum/plan/d4-domain-cardinality-verification.md", "58717ab4ec26b615b617401da4c613d23a4d8cdeb3c3fb408f119e4e91e78946"],
  ]) assert.equal(digestBytes(read(path)), hash);
});

test("midpoint identity all seven offices; exact Z12 rotation", () => {
  for (let k = 0n; k < 7n; k++) assert.equal(midZ7((k + 1n) % 7n, (k + 6n) % 7n), k);
  for (let mask = 0n; mask < 4096n; mask++) {
    let value = mask;
    for (let i = 0n; i < 12n; i++) value = rotateMaskZ12(value);
    assert.equal(value, mask);
  }
});

test("source-only candidate domains and demonstration sets, never canonical comparison", () => {
  const projection = extractBound(read("canonical/universal-heptatonic-ledger.json"), read("canonical/universal-network-data.json"), {
    ledgerSha256: "e6570972260fdae5c4ca878272dc89a9ff353d48762eefbe019707d229cd242d",
    networkSha256: "21e2a632837ecf40fe9229e9eb4ec0a5cceb9e2043fe89cb8e1d320518d7bdbc",
  });
  const clean = generate(projection);
  assert.deepEqual(Object.values(clean.completion.perRoute).map(c => c.expected), ["9604", "5488", "84"]);
  const keySet = (generation, route) => new Set(generation.routes[route].witnesses.map(w => `${w.k ?? w.parentOffice}:${w.s}`));
  assert.equal(keySet(clean, "T-A").size, 8);
  assert.equal(keySet(clean, "T-B").size, 28);
  const deleted = structuredClone(projection); deleted.E.shift();
  const changed = generate(deleted);
  assert.equal(keySet(changed, "T-B").size, 24);
  assert.deepEqual(keySet(changed, "T-A"), keySet(clean, "T-A"));
  assert.deepEqual(generate(projection), clean);
  // Build-unit source mutation, in-memory only; not the separately gated pre-flight.
  const source = read("scripts/d4-derivation-engine.mjs").toString();
  const altered = source.replace("a.officeIndex === (k + 1n) % 7n", "a.officeIndex === (k + 6n) % 7n")
    .replace("b.officeIndex === (k - 1n + 7n) % 7n", "b.officeIndex === (k + 1n) % 7n");
  assert.notEqual(altered, source);
  const module = runInNewContext(altered.replaceAll("export function", "function") + ";({generateRouteTA,generateRouteTB})");
  const a0 = projection.anchors.filter(a => a.tier === "A0").map(a => ({ id: BigInt(a.id), officeIndex: BigInt(a.officeIndex) }));
  const R = projection.R.map(r => ({ source: BigInt(r.source), target: BigInt(r.target), parentOffice: BigInt(r.parentOffice) }));
  const E = projection.E.map(e => ({ ...e, source: BigInt(e.source), target: BigInt(e.target) }));
  assert.equal(module.generateRouteTA(a0, R).witnesses.length, 0);
  assert.equal(module.generateRouteTB(E, R).witnesses.length, generateRouteTB(E, R).witnesses.length);
  assert(generateRouteTA(a0, R).witnesses.length > 0);
});

test("platform parser and mechanical scanner verify actual engine closure", () => {
  execFileSync(process.execPath, ["--check", new URL("scripts/d4-derivation-engine.mjs", root).pathname]);
  const evidence = inspectFile(new URL("scripts/d4-derivation-engine.mjs", root).pathname);
  assert.deepEqual(evidence.intersections["generateRouteTA/generateRouteTB"], []);
  assert.deepEqual(evidence.intersections["generateRouteTA/generateRouteTC"], ["rotateMaskZ12"]);
  assert.deepEqual(evidence.intersections["generateRouteTB/generateRouteTC"], []);
  assert.deepEqual(evidence.consumers.midZ7, ["generateRouteTC"]);
  assert(evidence.sharedHelpers.rotateMaskZ12.reason.trim());
});

test("extractor is strict, typed and excludes observation-bearing fields", () => {
  const doc = syntheticDocuments();
  const original = extractGeneration(doc.ledger, doc.network);
  assert(Object.isFrozen(original) && Object.isFrozen(original.R[0]));
  const changed = structuredClone(doc);
  changed.ledger.push({ id: 81001, tier: null, role: "boundary", officeIndex: null });
  changed.network.structuralEdges[0].provenance = "different comparison-only text";
  changed.network.structuralEdges[0].selected = false;
  assert.deepEqual(extractGeneration(changed.ledger, changed.network), original);
  const duplicate = structuredClone(doc); duplicate.ledger.push(duplicate.ledger[0]);
  assert.throws(() => extractGeneration(duplicate.ledger, duplicate.network), /duplicate/);
  const wrong = structuredClone(doc); wrong.network.structuralEdges[0].type = "wrong";
  assert.throws(() => extractGeneration(wrong.ledger, wrong.network), /E_type/);
  const missing = structuredClone(doc); missing.network.structuralEdges = missing.network.structuralEdges.filter(e => e.type !== "GOVERNS");
  assert.throws(() => extractGeneration(missing.ledger, missing.network), /R_completeness/);
  const getter = structuredClone(doc); let calls = 0;
  Object.defineProperty(getter.ledger[0], "id", { enumerable: true, get() { calls++; return 1; } });
  assert.throws(() => extractGeneration(getter.ledger, getter.network), /accessor/); assert.equal(calls, 0);
  const badProjection = structuredClone(original); badProjection.anchors[0].id = "4096";
  assert.throws(() => validateProjection(badProjection), /anchor_mask/);
  const poison = structuredClone(original); poison.R[0].provenance = "not permitted";
  assert.throws(() => validateProjection(poison), /extra_projection_field/);
});

test("JCS number-free subset: exact bytes, UTF16 ordering, strict inert values", () => {
  assert.equal(canonicalJSON({ z: "2", a: [true, null, "\n"] }), '{"a":[true,null,"\\n"],"z":"2"}');
  assert.equal(canonicalJSON({ "\ue000": "b", "\ud83d\ude00": "a" }), '{"😀":"a","":"b"}');
  for (const value of [0, -0, NaN, Infinity, 1n, undefined, () => {}, new Date(), "\ud800", "\udc00"])
    assert.throws(() => canonicalJSON(value), /invalid/);
  assert.throws(() => canonicalJSON([, "x"]), /sparse/);
  let calls = 0; const getter = { get x() { calls++; return "x"; } };
  assert.throws(() => canonicalJSON(getter), /accessor/); assert.equal(calls, 0);
  assert.throws(() => canonicalJSON(new Proxy({}, {})), /inert/);
  const cycle = {}; cycle.self = cycle; assert.throws(() => canonicalJSON(cycle), /cycle/);
  const same = { a: "x" }; assert.equal(canonicalJSON([same, same]), '[{"a":"x"},{"a":"x"}]');
  for (const value of [0, true, null, "01", "0\n", "+1", " 1", "1e1"]) assert.throws(() => decimal(value), /decimal/);
});

test("four-file 260-byte spec framing and path-ordered closure digest", () => {
  const hashes = ["a", "b", "c", "d"].map(x => x.repeat(64));
  const preimage = specPreimage(hashes);
  assert.equal(Buffer.byteLength(preimage), 260); assert(preimage.endsWith("\n"));
  assert.equal(preimage, hashes.join("\n") + "\n");
  assert.equal(digestBytes(preimage), createHash("sha256").update(preimage).digest("hex"));
  assert.notEqual(digestBytes(preimage), digestBytes(preimage.trimEnd()));
  const inventory = [{ path: "z.mjs", sha256: hashes[0] }, { path: "a.mjs", sha256: hashes[1] }];
  assert.equal(implementationDigest(inventory), implementationDigest([...inventory].reverse()));
  assert.throws(() => implementationDigest([...inventory, inventory[0]]), /inventory/);
});

test("synthetic build-twice and reordered projection byte identity", () => {
  const { packet } = syntheticPacket();
  const reordered = structuredClone(packet.projection);
  reordered.anchors.reverse(); reordered.R.reverse(); reordered.E.reverse();
  assert.equal(canonicalJSON(generate(reordered)), canonicalJSON(packet.generation));
  assert.deepEqual(projectionDigests(reordered), projectionDigests(packet.projection));
  assert.deepEqual(sealGeneration(generate(reordered), packet.bindings, packet.boundarySha256, packet.specSha256, reordered), packet.seal);
  assert.equal(canonicalJSON(syntheticPacket().packet), canonicalJSON(packet));
});

test("synthetic seal verification prevents premature reads and observes endpoint rules", () => {
  const { packet, reference } = syntheticPacket(); let reads = 0;
  const reader = () => { reads++; return reference; };
  const tampered = structuredClone(packet); tampered.generation.routes["T-A"].witnesses.pop();
  assert.throws(() => compareSealed(tampered, reader), /seal_digest/); assert.equal(reads, 0);
  assert.throws(() => compareSealed({ ...packet, seal: { status: "ABSENT", reason: "not run" } }, reader), /seal/); assert.equal(reads, 0);
  const comparison = compareSealed(packet, reader); assert.equal(reads, 1);
  assert.equal(comparison.rows.length, 2); assert.equal(comparison.observedKeyCount, "1");
  assert.equal(comparison.fourCellCounts.both, "2");
  assert.equal(comparison.routes.A.restatement_signature, true);
  assert.equal(comparison.routes.B.restatement_signature, true);
  assert.equal(comparison.tC.midpoint_exact, true);
  assert.equal(comparison.tC.seamProvenance.length, 1);
  assert(comparison.rows.every(r => r.parentOffice === "0"));
  const mutable = structuredClone(packet);
  const isolated = compareSealed(mutable, () => {
    mutable.generation.routes["T-A"].witnesses.length = 0;
    return reference;
  });
  assert.deepEqual(isolated, comparison);
  const reversed = syntheticDocuments(); reversed.network.structuralEdges[3].directed = true;
  const wrong = syntheticPacket(reversed);
  assert.throws(() => compareSealed(wrong.packet, () => wrong.reference), /contact_endpoint/);
  const mismatched = { ...reference, networkBytes: Buffer.from("{}") };
  assert.throws(() => compareSealed(packet, () => mismatched), /comparison_binding/);
});

test("worked full synthetic receipt: schema accepts honest absent controls", () => {
  const { packet, reference } = syntheticPacket();
  const comparison = compareSealed(packet, () => reference);
  const receipt = buildReceipt(packet, comparison, schema);
  assert.equal(receipt.category, "incomplete_or_anomalous");
  assert(Object.values(receipt.controls).every(c => c.status === "ABSENT"));
  assert(validateWire(receipt, schema));
  const badCounts = structuredClone(comparison); badCounts.routes.A.generated_key_count = "2";
  assert.throws(() => buildReceipt(packet, badCounts, schema), /comparison_accounting/);
  const corrupt = structuredClone(receipt); corrupt.comparison.routes.A.generated_key_count = "1\n";
  assert.throws(() => validateWire(corrupt, schema), /invalid/);
  const leading = structuredClone(receipt); leading.comparison.routes.A.generatedKeys = ["0:090001"];
  assert.throws(() => validateWire(leading, schema), /invalid/);
  const dishonest = structuredClone(receipt); dishonest.category = "derived";
  assert.throws(() => validateWire(dishonest, schema), /absent_category/);
  const incomplete = absentReceipt(packet.bindings, packet.boundarySha256, packet.specSha256, "Synthetic unexecuted stage", schema);
  assert.equal(incomplete.seal.status, "ABSENT");
  assert.equal(incomplete.category, "incomplete_or_anomalous");
  assert(validateWire(incomplete, schema));
  const shapeOnly = structuredClone(receipt);
  shapeOnly.controls.binding = { state: "ran", reason: "Hypothetical control shape, not a pre-flight execution",
    observed_gate: "binding", rejected: true, evidence: { summary: "synthetic rejection field" },
    cleanCounterpart: { summary: "synthetic clean-counterpart field" }, implementationDigest: packet.bindings.implementationDigest };
  assert(validateWire(shapeOnly, schema));
  shapeOnly.controls.binding.rejected = "true";
  assert.throws(() => validateWire(shapeOnly, schema), /wire_shape/);
});

test("synthetic five counts, empty restatement and all seven mapper categories", () => {
  const U = ["0:90001", "0:90002", "0:90003"], O = ["0:90001"];
  const fixture = (ga, gb, exact) => ({ routes: { A: routeAccounting(ga, U, O), B: routeAccounting(gb, U, O) },
    observedKeyCount: "1", tC: { midpoint_exact: exact, observedRelations: [{ tier: "A0", a: "1", b: "2", mid: "0" }] } });
  const positive = fixture(O, O, true);
  assert.equal(selectCategory(positive, { valid: false }), "invalid");
  assert.equal(selectCategory(positive, { complete: false }), "incomplete_or_anomalous");
  assert.equal(selectCategory(fixture(O, U, true)), "filter_plus_geometry");
  assert.equal(selectCategory(fixture(O, U, false)), "restatement_signature");
  assert.equal(selectCategory(fixture(U.slice(0, 2), O, true)), "overshoot");
  assert.equal(selectCategory(positive), "derived");
  assert.equal(selectCategory(fixture([], U, true)), "not_derived");
  assert.equal(selectCategory(fixture(O, O, false)), "not_derived");
  assert.equal(selectCategory(fixture(["0:99999"], O, true)), "invalid");
  assert.equal(selectCategory(fixture(["0:99999"], O, true), { complete: false }), "invalid");
  const empty = routeAccounting([], [], []); assert.equal(empty.restatement_signature, true);
  const a = routeAccounting(["0:90001", "0:90002", "0:99999"], U, O);
  assert.deepEqual([a.generated_key_count, a.in_R_count, a.extra_beyond_R_count, a.R_missed_count, a.in_R_but_unmatched_count], ["3", "2", "1", "1", "1"]);
  assert.deepEqual(a.rMissedKeys, ["0:90003"]); assert.deepEqual(a.inRButUnmatchedKeys, ["0:90002"]);
});
