#!/usr/bin/env node
/**
 * Validate the generated BL-061/BL-062 Z-structure and residual-pair artifact
 * against its sources.
 *
 * Independent of the builder: re-reads the canonical ledger, the bipartite
 * containment mesh, the network family registry, the BL-060 artifact and the
 * BL-055 artifact; re-derives the tier<->family bijection, the inversion
 * pairs, the per-family vocabularies, the composition table, the three
 * mechanism summaries, the residual profiles, the refinement scan (including
 * the dual-threshold scan and the inversion-symmetry rejection), and the base
 * import chain; re-checks the fingerprint. Fail-loud.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/d4-zresidual-hunt.v1.json";
const SCHEMA_VERSION = "harmonic-orrery.d4-zresidual-hunt.v1";
const HUNT_ID = "BL061_BL062_ZRESIDUAL_HUNT_v1";
const BL060_PATH = "orrery/src/generated/d4-14v14-hunt.v1.json";
const BL055_PATH = "orrery/src/generated/d4-selection-review.v1.json";
const LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";
const BIPARTITE_PATH = "derived/hypergraph/bipartite-inclusion-v1.json";
const NETWORK_PATH = "canonical/universal-network-data.json";

const Z_FAMILIES = ["7-Z12", "7-Z17", "7-Z37"];
const D_ANCHOR_FAMILIES = ["7-1", "7-15", "7-22", "7-8", "7-Z12", "7-Z17", "7-Z37"];

function fail(message) {
  throw new Error(`INVALID_D4_ZRESIDUAL_HUNT: ${message}`);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") { row.push(field); field = ""; }
    else if (character === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += character;
  }
  if (field.length > 0 || row.length > 0) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  const [headers, ...records] = rows;
  return records.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]])));
}

function canonicalText(value) {
  if (value === null) return "null";
  if (value === true) return "true";
  if (value === false) return "false";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isInteger(value)) fail("non-integer number in payload");
    return String(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalText).join(",")}]`;
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalText(value[key])}`).join(",")}}`;
  }
  fail(`unsupported JSON type: ${typeof value}`);
}

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const unique = (values) => [...new Set(values)].sort(cmp);

function confusion(keys, observedSet, predicate) {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (const key of keys) {
    const predicted = predicate(key);
    const actual = observedSet.has(key);
    if (actual && predicted) tp += 1;
    else if (actual && !predicted) fn += 1;
    else if (!actual && predicted) fp += 1;
    else tn += 1;
  }
  return { tp, fp, fn, tn };
}

function classify(matrix) {
  if (matrix.tp === 14 && matrix.fp === 0 && matrix.fn === 0 && matrix.tn === 14) return "CLEAN";
  return matrix.tp + matrix.tn >= 26 ? "NEAR" : "FAIL";
}

function validate() {
  const artifact = readJson(ARTIFACT_PATH);
  const bl060 = readJson(BL060_PATH);
  const bl055 = readJson(BL055_PATH);
  const ledger = parseCsv(read(LEDGER_PATH));
  const bipartite = readJson(BIPARTITE_PATH);
  const network = readJson(NETWORK_PATH);

  // ---- header, fingerprint, bindings --------------------------------------
  if (artifact.schemaVersion !== SCHEMA_VERSION || artifact.huntId !== HUNT_ID ||
      artifact.status !== "planning_evidence" ||
      artifact.generator !== "scripts/build-d4-zresidual-hunt.mjs") fail("header drift");
  const { huntFingerprint, ...core } = artifact;
  if (typeof huntFingerprint !== "string" || !/^[0-9a-f]{64}$/.test(huntFingerprint) ||
      sha256(canonicalText(core)) !== huntFingerprint) fail("fingerprint drift");
  for (const binding of artifact.sourceBindings) {
    if (sha256(fs.readFileSync(path.join(root, binding.artifact))) !== binding.sha256) {
      fail(`source binding drift: ${binding.artifact}`);
    }
  }

  // ---- base import chain ---------------------------------------------------
  const { huntFingerprint: bl060Fingerprint, ...bl060Core } = bl060;
  if (sha256(canonicalText(bl060Core)) !== bl060Fingerprint) fail("BL-060 fingerprint drift");
  const { reviewFingerprint: bl055Fingerprint, ...bl055Core } = bl055;
  if (sha256(canonicalText(bl055Core)) !== bl055Fingerprint) fail("BL-055 fingerprint drift");
  if (bl060.base.fingerprint !== bl055Fingerprint) fail("BL-060 -> BL-055 chain drift");
  if (artifact.base.artifact !== BL060_PATH || artifact.base.fingerprint !== bl060Fingerprint ||
      artifact.base.huntId !== bl060.huntId || artifact.base.domainKeys !== 28 || artifact.base.observedKeys !== 14) {
    fail("base import drift");
  }
  const uKeys = unique(bl060.domain.uKeys);
  const observedKeys = unique(bl060.domain.observedKeys);
  const observedSet = new Set(observedKeys);
  if (uKeys.length !== 28 || observedKeys.length !== 14) fail("BL-060 domain drift");
  if (canonicalText(artifact.domain.uKeys) !== canonicalText(uKeys) ||
      canonicalText(artifact.domain.observedKeys) !== canonicalText(observedKeys)) fail("domain disagreement");
  const bl060RowByKey = new Map(bl060.table28.map((row) => [row.key, row]));

  // ---- inversion pairs -----------------------------------------------------
  const siblingOfKey = (key) => {
    const sibling = bl060RowByKey.get(key)?.symmetry?.inversionSibling;
    if (!sibling) fail(`sibling missing for ${key}`);
    const siblingKey = uKeys.find((candidate) => candidate.split(":")[1] === sibling);
    if (!siblingKey) fail(`sibling key missing for ${key}`);
    return siblingKey;
  };
  const seen = new Set();
  const pairs = [];
  for (const key of uKeys) {
    if (seen.has(key)) continue;
    const siblingKey = siblingOfKey(key);
    if (siblingOfKey(siblingKey) !== key) fail(`sibling not mutual at ${key}`);
    const officeSum = (Number(key.split(":")[0]) + Number(siblingKey.split(":")[0])) % 7;
    if (officeSum !== 6) fail(`office-sum drift at ${key}`);
    if (observedSet.has(key) !== observedSet.has(siblingKey)) fail(`pair status split at ${key}`);
    pairs.push({ a: key, b: siblingKey, officeSum: String(officeSum) });
    seen.add(key);
    seen.add(siblingKey);
  }
  pairs.sort((left, right) => cmp(left.a, right.a));
  if (pairs.length !== 14) fail("pair census drift");
  if (canonicalText(artifact.domain.inversionPairs) !== canonicalText(pairs.map((pair) => ({
    a: pair.a, b: pair.b, observed: observedSet.has(pair.a), officeSum: pair.officeSum })))) {
    fail("inversion pair artifact drift");
  }

  // ---- tier<->family bijection --------------------------------------------
  const dAnchors = ledger.filter((row) => row.role === "anchor" && row.tier.startsWith("D"));
  if (dAnchors.length !== 49) fail("D-tier anchor census drift");
  const tiers = unique(dAnchors.map((row) => row.tier)).map((tier) => {
    const rows = dAnchors.filter((row) => row.tier === tier);
    const families = unique(rows.map((row) => row.forte));
    if (families.length !== 1 || rows.length !== 7) fail(`tier ${tier} structure drift`);
    return { tier, family: families[0], band: Z_FAMILIES.includes(families[0]) ? "Z" : "non-Z",
      anchorCount: rows.length, anchors: unique(rows.map((row) => row.id)) };
  });
  const expectedTiers = tiers.map((entry) => ({ tier: entry.tier, family: entry.family, band: entry.band,
    anchorCount: entry.anchorCount, anchors: entry.anchors }));
  if (canonicalText(artifact.dTierTiers) !== canonicalText(expectedTiers)) fail("tier artifact drift");

  // ---- mesh ----------------------------------------------------------------
  const heptNodeByMask = new Map(Object.values(bipartite.heptatonicNodes).map((node) => [String(node.pitchMask), node]));
  if (heptNodeByMask.size !== 462) fail("bipartite census drift");
  const pentatonicById = bipartite.pentatonicSubnodes;
  const nodeOfKey = (key) => {
    const node = heptNodeByMask.get(key.split(":")[1]);
    if (!node) fail(`bipartite node missing for ${key}`);
    return node;
  };
  const subnodeRecords = (key) => nodeOfKey(key).subnodes.map((id) => {
    const penta = pentatonicById[id];
    if (!penta) fail(`pentatonic missing: ${id}`);
    return { id, setClass: penta.setClassId, orientation: penta.orientation, root: penta.root,
      isBridge: penta.isBridge === true, isCornerstone: penta.isCornerstone === true,
      z: penta.setClassId.includes("-Z"), achiral: penta.orientation === "single",
      dFamilies: D_ANCHOR_FAMILIES.filter((family) => (penta.parentsUnrooted ?? []).includes(family)) };
  });

  // ---- zAnatomy re-derivation ---------------------------------------------
  const expectedProfiles = D_ANCHOR_FAMILIES.map((family) => {
    const tierEntry = tiers.find((entry) => entry.family === family);
    const contained = new Set();
    for (const anchorId of tierEntry.anchors) {
      const node = heptNodeByMask.get(anchorId);
      if (!node) fail(`anchor node missing: ${anchorId}`);
      for (const sub of node.subnodes) contained.add(sub);
    }
    const classHistogram = {};
    let zClassNodes = 0;
    let singleClassNodes = 0;
    for (const sub of contained) {
      const penta = pentatonicById[sub];
      classHistogram[penta.setClassId] = (classHistogram[penta.setClassId] ?? 0) + 1;
      if (penta.setClassId.includes("-Z")) zClassNodes += 1;
      if (penta.orientation === "single") singleClassNodes += 1;
    }
    return { family, tier: tierEntry.tier, band: tierEntry.band, anchorCount: tierEntry.anchorCount,
      anchors: tierEntry.anchors, containedPentaNodes: contained.size, zClassNodes, singleClassNodes,
      classHistogram, containedNodeIds: [...contained].sort(cmp) };
  });
  if (canonicalText(artifact.zAnatomy.familyProfiles) !== canonicalText(expectedProfiles)) fail("zAnatomy drift");
  const expectedJaccard = expectedProfiles.map((left) => expectedProfiles.map((right) => {
    const a = new Set(left.containedNodeIds);
    const b = new Set(right.containedNodeIds);
    const inter = [...a].filter((value) => b.has(value)).length;
    const union = new Set([...a, ...b]).size;
    return Math.round((1000 * inter) / union);
  }));
  if (canonicalText(artifact.zAnatomy.vocabularyJaccardMilli) !== canonicalText(expectedJaccard)) fail("Jaccard drift");
  const expectedCornerstones = [];
  for (const tierEntry of tiers) {
    for (const anchorId of tierEntry.anchors) {
      const windows = heptNodeByMask.get(anchorId).subnodes.filter((sub) => pentatonicById[sub].isCornerstone === true);
      if (windows.length > 0) {
        const row = ledger.find((candidate) => candidate.id === anchorId);
        expectedCornerstones.push({ anchor: anchorId, family: tierEntry.family, tier: tierEntry.tier,
          office: row.office, officeIndex: row.officeIndex, windows });
      }
    }
  }
  if (canonicalText(artifact.zAnatomy.cornerstoneAnchors) !== canonicalText(expectedCornerstones) ||
      expectedCornerstones.length !== 5) fail("cornerstone anatomy drift");

  // ---- composition re-derivation ------------------------------------------
  const compositionOf = (key) => {
    const records = subnodeRecords(key);
    const classList = unique(records.map((record) => record.setClass));
    const zRecords = records.filter((record) => record.z);
    const zClasses = unique(zRecords.map((record) => record.setClass));
    const singleClasses = unique(records.filter((record) => record.achiral).map((record) => record.setClass));
    const orientationCounts = { A: 0, B: 0, single: 0 };
    for (const record of records) orientationCounts[record.orientation] += 1;
    return {
      key, observed: observedSet.has(key), distinctClasses: classList.length, classList,
      rootedZCount: zRecords.length, distinctZClasses: zClasses.length, zClasses,
      achiralZClasses: zClasses.filter((setClass) => singleClasses.includes(setClass)),
      chiralZClasses: zClasses.filter((setClass) => !singleClasses.includes(setClass)),
      singleEntryCount: records.filter((record) => record.achiral).length,
      distinctSingleClasses: singleClasses.length, singleClasses, orientationCounts,
      orientationZCounts: {
        A: zRecords.filter((record) => record.orientation === "A").length,
        B: zRecords.filter((record) => record.orientation === "B").length,
        single: zRecords.filter((record) => record.orientation === "single").length,
      },
    };
  };
  const composition = uKeys.map(compositionOf);
  const compositionByKey = new Map(composition.map((entry) => [entry.key, entry]));
  if (canonicalText(artifact.composition) !== canonicalText(composition)) fail("composition table drift");

  // ---- mechanisms re-derivation -------------------------------------------
  const zPentaConfusion = confusion(uKeys, observedSet, (key) => compositionByKey.get(key).distinctZClasses >= 1);
  const singleConfusion = confusion(uKeys, observedSet, (key) => compositionByKey.get(key).singleEntryCount >= 1);
  if (canonicalText(artifact.mechanisms.b.confusion) !== canonicalText(zPentaConfusion) ||
      canonicalText(artifact.mechanisms.c.singleOrientationConfusion) !== canonicalText(singleConfusion)) {
    fail("mechanism confusion drift");
  }
  if (classify(zPentaConfusion) !== "CLEAN" || classify(singleConfusion) !== "CLEAN") fail("mechanism split drift");
  if (!artifact.mechanisms.b.verdict.startsWith("SUPPORTED") ||
      !artifact.mechanisms.a.verdict.startsWith("PARTIAL") ||
      !artifact.mechanisms.c.verdict.startsWith("SUPPORTED for achiral content")) fail("mechanism verdict drift");

  // ---- residual re-derivation ---------------------------------------------
  const residualKeys = ["1:1765", "5:1261"];
  if (canonicalText(artifact.residualPair.keys) !== canonicalText(residualKeys)) fail("residual keys drift");
  for (const key of residualKeys) {
    const expected = artifact.residualPair.perKey.find((entry) => entry.key === key);
    if (!expected) fail(`residual entry missing: ${key}`);
    const row = bl060RowByKey.get(key);
    const comp = compositionByKey.get(key);
    if (canonicalText(expected.zFamilyCounts) !== canonicalText({ "7-Z12": row.dTier.counts["7-Z12"],
        "7-Z17": row.dTier.counts["7-Z17"], "7-Z37": row.dTier.counts["7-Z37"] }) ||
        expected.zSum !== row.dTier.zSum || expected.nonZSum !== row.dTier.nonZSum ||
        expected.sign !== row.dTier.nonZSum - row.dTier.zSum ||
        expected.sibling !== siblingOfKey(key) ||
        canonicalText(expected.composition.zClasses) !== canonicalText(comp.zClasses) ||
        canonicalText(expected.composition.achiralZClasses) !== canonicalText(comp.achiralZClasses) ||
        canonicalText(expected.composition.chiralZClasses) !== canonicalText(comp.chiralZClasses)) {
      fail(`residual profile drift: ${key}`);
    }
    const expectedSubnodes = subnodeRecords(key).map((record) => ({ id: record.id, setClass: record.setClass,
      orientation: record.orientation, root: record.root, bridge: record.isBridge,
      cornerstone: record.isCornerstone, dFamilies: record.dFamilies }));
    if (canonicalText(expected.subnodes) !== canonicalText(expectedSubnodes)) fail(`residual subnodes drift: ${key}`);
  }
  if (residualKeys.some((key) => compositionByKey.get(key).achiralZClasses.length !== 0) ||
      residualKeys.some((key) => compositionByKey.get(key).chiralZClasses.length !== 2)) {
    fail("residual Z-content expectation drift");
  }

  // ---- refinement scan re-derivation ---------------------------------------
  const shapesByArtifact = new Map(artifact.refinementScan.shapes.map((entry) => [entry.id, entry]));
  const shapeExpectations = {
    S1: { predicate: (key) => bl060RowByKey.get(key).dTier.nonZSum <= 13, result: "HIT" },
    S2: { predicate: (key) => 2 * bl060RowByKey.get(key).dTier.nonZSum - bl060RowByKey.get(key).dTier.zSum <= 14, result: "HIT" },
    S3: { predicate: (key) => bl060RowByKey.get(key).dTier.nonZSum < bl060RowByKey.get(key).dTier.zSum, result: "HIT" },
    S4: { predicate: (key) => bl060RowByKey.get(key).dTier.nonZSum <= 13 && bl060RowByKey.get(key).dTier.zSum >= 11, result: "HIT_DEGENERATE" },
    S5: { predicate: (key) => bl060RowByKey.get(key).dTier.zSum >= 14, result: "MISS_NEAR" },
    S6: { predicate: (key) => compositionByKey.get(key).distinctZClasses >= 1, result: "HIT" },
    S7: { predicate: (key) => compositionByKey.get(key).achiralZClasses.length >= 1, result: "MISS_NEAR" },
    S8: { predicate: (key) => compositionByKey.get(key).chiralZClasses.length >= 1, result: "MISS_NEAR" },
    S9: { predicate: (key) => compositionByKey.get(key).singleEntryCount >= 1, result: "HIT" },
    S10: { predicate: (key) => compositionByKey.get(key).distinctClasses >= 11, result: "HIT" },
    S11: { predicate: (key) => compositionByKey.get(key).orientationZCounts.A + compositionByKey.get(key).orientationZCounts.B >= 1, result: "MISS_NEAR" },
    S12: { predicate: (key) => compositionByKey.get(key).orientationZCounts.single >= 1, result: "MISS_NEAR" },
    S13: { predicate: (key) => compositionByKey.get(key).orientationZCounts.A >= 1, result: "REJECTED_INVERSION_SPLIT" },
    S14: { predicate: (key) => compositionByKey.get(key).orientationZCounts.B >= 1, result: "REJECTED_INVERSION_SPLIT" },
  };
  if (artifact.refinementScan.shapes.length !== 14) fail("shape census drift");
  for (const [id, expectation] of Object.entries(shapeExpectations)) {
    const entry = shapesByArtifact.get(id);
    if (!entry) fail(`shape missing: ${id}`);
    const matrix = confusion(uKeys, observedSet, expectation.predicate);
    if (canonicalText(entry.confusion) !== canonicalText(matrix) || entry.result !== expectation.result) {
      fail(`shape drift: ${id}`);
    }
    let symmetric = true;
    for (const pair of pairs) if (expectation.predicate(pair.a) !== expectation.predicate(pair.b)) symmetric = false;
    if (entry.inversionSymmetric !== symmetric) fail(`shape symmetry drift: ${id}`);
    if (expectation.result === "HIT" && !symmetric) fail(`HIT shape splits a pair: ${id}`);
  }
  const nonZValues = unique(uKeys.map((key) => bl060RowByKey.get(key).dTier.nonZSum));
  const zValues = unique(uKeys.map((key) => bl060RowByKey.get(key).dTier.zSum));
  const separatingPairs = [];
  for (const a of nonZValues) {
    for (const b of zValues) {
      const matrix = confusion(uKeys, observedSet, (key) => bl060RowByKey.get(key).dTier.nonZSum <= a && bl060RowByKey.get(key).dTier.zSum >= b);
      if (matrix.tp === 14 && matrix.fp === 0 && matrix.fn === 0 && matrix.tn === 14) separatingPairs.push({ a: String(a), b: String(b) });
    }
  }
  const degenerate = separatingPairs.every((pair) => uKeys.filter((key) => !observedSet.has(key))
    .every((key) => bl060RowByKey.get(key).dTier.nonZSum > Number(pair.a)));
  if (canonicalText(artifact.refinementScan.dualThreshold.separatingPairs) !== canonicalText(separatingPairs) ||
      artifact.refinementScan.dualThreshold.allDegenerate !== degenerate ||
      artifact.refinementScan.dualThreshold.space !== nonZValues.length * zValues.length) fail("dual scan drift");
  if (separatingPairs.length !== 2 || !degenerate) fail("dual degeneracy expectation drift");
  const counts = artifact.refinementScan.shapeCounts;
  if (counts.hits !== 6 || counts.degenerateHits !== 1 || counts.nearMisses !== 5 ||
      counts.misses !== 0 || counts.rejectedInversionSplit !== 2) fail("shape counts drift");

  // ---- synthesis and fences ------------------------------------------------
  const synthesis = artifact.synthesis;
  if (synthesis.zVerdict !== "STRUCTURAL" || synthesis.residualVerdict !== "EXPLAINED_NOT_PRIMITIVE") fail("synthesis verdict drift");
  if (synthesis.governsSemanticLayer.refinement.id !== "GSL-1R" ||
      synthesis.governsSemanticLayer.anatomy.id !== "GSL-2" ||
      !synthesis.governsSemanticLayer.refinement.statement.includes("Z-majority") ||
      !synthesis.governsSemanticLayer.anatomy.statement.includes("inversion")) fail("governs entry drift");
  if (synthesis.limits.length !== 3) fail("limits drift");
  if (!artifact.fences.d7Control.includes("OD-60-D7") ||
      !artifact.fences.higherTheorem.includes("remains open") ||
      artifact.fences.g1Intra330 !== "untouched" ||
      !artifact.fences.direction.includes("unassigned") ||
      !artifact.fences.twelfthCatch.includes("computed from landed bytes")) fail("fence drift");
  if (artifact.notAccomplished.length !== 6) fail("notAccomplished drift");

  console.log(JSON.stringify({
    artifact: ARTIFACT_PATH,
    status: "PASS",
    fingerprint: huntFingerprint,
    baseFingerprint: bl060Fingerprint,
    inversionPairs: pairs.length,
    zVerdict: synthesis.zVerdict,
    residualVerdict: synthesis.residualVerdict,
    shapeCounts: counts,
  }, null, 2));
}

validate();
