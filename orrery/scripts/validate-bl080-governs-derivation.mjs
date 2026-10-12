#!/usr/bin/env node
/**
 * Validate the generated BL-080 GOVERNS derivation against its sources.
 *
 * Independent of the builder: re-reads the chain anchors (BL-063/BL-064/
 * BL-066/BL-078/BL-055), the frozen projection, the receipt and the canonical
 * ledger; re-derives the consumed-kappa validation, the masks-only pair
 * derivation, the R-edge structure (H2 reach + H8 census closure, masks-only),
 * the derived office assembly (both orientations), the predicate selection,
 * the projection assembly with the frozen validateProjection and digests, the
 * S0' set-equality, the orientation label map and the frozen baseline;
 * re-checks the derivation fingerprint. Also statically verifies that the
 * generator's intrinsic region reads no granted projection bytes, no receipt
 * and no class field, proves the region-scoping (the comparison region must
 * contain the granted reads), and runs mutation probes (artifact drift,
 * smuggled reads, presence strips, a proof strip, a permissive probe).
 * Fail-loud.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { projectionDigests, validateProjection } from "../../scripts/d4-inputs.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/bl080-governs-derivation.v1.json";
const GENERATOR_PATH = "scripts/build-bl080-governs-derivation.mjs";
const SCHEMA_VERSION = "harmonic-orrery.bl080-governs-derivation.v1";
const DERIVATION_ID = "BL080_GOVERNS_DERIVATION_V1";
const BL063_PATH = "orrery/src/generated/bl063-office-reconstruction.v1.json";
const BL063_FINGERPRINT = "6d33c67be7b8f87b8ad2f964cd3560ebcbc1ec0dc6b2088ad1f223c35caff8c3";
const BL064_PATH = "orrery/src/generated/bl064-cycle-ground.v1.json";
const BL064_FINGERPRINT = "aa975820136658dd2fb3c84d98b34bf7a1901d39edd6548a300f458858305918";
const BL066_PATH = "orrery/src/generated/bl066-r-edge-derivation.v1.json";
const BL066_FINGERPRINT = "94f0661ff6e76b0dea69fbe9f09ead24da7901393fb735495f3a25c3d9a1a886";
const BL078_PATH = "orrery/src/generated/bl078-d7-retest.v1.json";
const BL078_FINGERPRINT = "11644d401eff5ef951a2173f390041531743df682ad9c502f98a048c0f76e1b1";
const BL055_PATH = "orrery/src/generated/d4-selection-review.v1.json";
const BL055_FINGERPRINT = "6d11fd932efbe96892b3cf2e6a6cdad6f54e69cd2a8f284ebb72232c59d8b745";
const GENERATION_PATH = "qa/d4-production-generation.json";
const RECEIPT_PATH = "qa/d4-production-receipt.json";
const LEDGER_PATH = "canonical/universal-heptatonic-ledger.json";
const PREDICATE_CLASS = "7-27";

function fail(message) {
  throw new Error(`INVALID_BL080_GOVERNS_DERIVATION: ${message}`);
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

function fileSha(relativePath) {
  return sha256(fs.readFileSync(path.join(root, relativePath)));
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

function hamming12(a, b) {
  let x = a ^ b;
  let count = 0;
  while (x !== 0) { count += x & 1; x >>= 1; }
  return count;
}

function rotateMask12(mask, d) {
  const shift = ((d % 12) + 12) % 12;
  if (shift === 0) return mask & 4095;
  return (((mask << shift) & 4095) | (mask >> (12 - shift))) & 4095;
}

function sandwichHolds(p, q, child) {
  const inter = p & q;
  const union = p | q;
  return ((inter & child) === inter) && ((child & union) === child);
}

function sortPairs(pairs) {
  return pairs
    .map((pair) => [pair[0], pair[1]].sort(cmp))
    .sort((left, right) => cmp(left[0], right[0]) || cmp(left[1], right[1]));
}

function chainSelfCheck(artifact, fingerprintField, label) {
  const core = { ...artifact };
  delete core[fingerprintField];
  if (artifact.status !== "planning_evidence") fail(`${label}: chain anchor status drift`);
  if (typeof artifact[fingerprintField] !== "string" || !/^[0-9a-f]{64}$/.test(artifact[fingerprintField])) {
    fail(`${label}: chain anchor fingerprint format drift`);
  }
  if (sha256(canonicalText(core)) !== artifact[fingerprintField]) {
    fail(`${label}: chain anchor fingerprint self-check failed`);
  }
}

function strip(row, fields) {
  return Object.fromEntries(fields.map((field) => [field, row[field]]));
}

function staticIntrinsicCheck(sourceText) {
  const begin = sourceText.indexOf("INTRINSIC-DERIVATION-BEGIN");
  const end = sourceText.indexOf("INTRINSIC-DERIVATION-END");
  if (begin < 0 || end < 0 || end <= begin) fail("generator intrinsic-region markers missing");
  const head = sourceText.slice(0, end);
  const region = sourceText.slice(begin, end);
  const forbidden = [
    /officeIndex/, /parentOffice/, /generation\.projection/, /projection\.R\b/, /projection\.E\b/,
    /SEAT_CONTACT/, /d7SeatContact/, /observed/, /contactRow/, /\bforte\b/, /intervalVector/, /receipt\.comparison/,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(region)) fail(`generator intrinsic region reads the grant: ${pattern}`);
    if (pattern.test(head)) fail(`forbidden token before the intrinsic-region end: ${pattern}`);
  }
  const required = [
    "validateConsumedKappa", "derivePairsFromMasks", "readPairs", "readREdges",
    "deriveOffices", "predicateSelect", "flipPairs", "hamming12", "sandwichHolds",
  ];
  for (const token of required) {
    if (!region.includes(token)) fail(`generator intrinsic region missing required derivation token: ${token}`);
  }
  const comparison = sourceText.slice(end);
  const proof = ["officeIndex", "parentOffice", "forte", "receipt.comparison", "generation.projection"];
  for (const token of proof) {
    if (!comparison.includes(token)) fail(`generator comparison region missing the granted-read proof token: ${token}`);
  }
}

function reDerive(sources) {
  const { generation, receipt, ledgerRows, bl063, bl064, bl066, bl055, bl078 } = sources;
  chainSelfCheck(bl063, "reconstructionFingerprint", "BL-063");
  chainSelfCheck(bl064, "derivationFingerprint", "BL-064");
  chainSelfCheck(bl066, "derivationFingerprint", "BL-066");
  chainSelfCheck(bl078, "derivationFingerprint", "BL-078");
  chainSelfCheck(bl055, "reviewFingerprint", "BL-055");

  // ---- independent kappa validation ----
  const kappa0 = new Map(bl063.kappaBoth.kappa0.map((row) => [Number(row.mask), row.index]));
  const kappa1 = new Map(bl063.kappaBoth.kappa1.map((row) => [Number(row.mask), row.index]));
  const a0Masks = bl063.kappaBoth.kappa1.map((row) => Number(row.mask)).sort(cmp);
  if (a0Masks.length !== 7) fail("independent A0 mask census drift");
  const positions0 = new Set();
  for (const mask of a0Masks) {
    const p0 = kappa0.get(mask);
    const p1 = kappa1.get(mask);
    if (p0 === undefined || p1 === undefined) fail("independent kappa hole");
    if (positions0.has(p0)) fail("independent kappa collision");
    positions0.add(p0);
    if (p1 !== 6 - p0) fail("independent orientation relation failure");
  }
  const inverse1 = new Map(a0Masks.map((mask) => [kappa1.get(mask), mask]));
  for (let c = 0; c < 6; c += 1) {
    if (hamming12(inverse1.get(c), inverse1.get(c + 1)) !== 2) fail("independent line property failure");
  }
  const degrees = new Map(a0Masks.map((mask) => [mask, 0]));
  for (let i = 0; i < a0Masks.length; i += 1) {
    for (let j = i + 1; j < a0Masks.length; j += 1) {
      if (hamming12(a0Masks[i], a0Masks[j]) === 2) {
        degrees.set(a0Masks[i], degrees.get(a0Masks[i]) + 1);
        degrees.set(a0Masks[j], degrees.get(a0Masks[j]) + 1);
      }
    }
  }
  const degreeSequence = [...degrees.values()].sort(cmp);
  if (canonicalText(degreeSequence) !== canonicalText([1, 1, 2, 2, 2, 2, 2])) fail("independent degree sequence drift");

  // ---- masks-only pair derivation (child-side rule) ----
  const a1Masks = bl064.rules.unified.perCenter.map((row) => Number(row.child)).sort(cmp);
  if (a1Masks.length !== 7) fail("independent A1 mask census drift");
  const masksOnlyPairs = a1Masks.map((child) => {
    const neighbors = a0Masks.filter((mask) => hamming12(mask, child) === 2).sort(cmp);
    if (neighbors.length === 2) {
      const [p, q] = neighbors;
      if (!sandwichHolds(p, q, child)) fail(`independent sandwich failure at ${child}`);
      return { child, mode: "sandwich", neighbors, constructors: [p, q].sort(cmp), twin: null };
    }
    if (neighbors.length === 1) {
      const [pStar] = neighbors;
      const twins = a0Masks.filter((mask) => mask !== pStar && (
        rotateMask12(pStar, 1) === mask || rotateMask12(pStar, 11) === mask ||
        rotateMask12(mask, 1) === pStar || rotateMask12(mask, 11) === pStar)).sort(cmp);
      if (twins.length !== 1) fail(`independent twin-closure failure at ${child}`);
      const [twin] = twins;
      if (sandwichHolds(pStar, twin, child)) fail(`independent boundary sandwich unexpectedly holds at ${child}`);
      return { child, mode: "twin-closure", neighbors, constructors: [pStar, twin].sort(cmp), twin };
    }
    fail(`independent neighbour count ${neighbors.length} at ${child}`);
  });
  const consumedPairs = bl064.rules.unified.perCenter.map((row) => ({
    center: row.center,
    child: String(row.child),
    pair: [String(row.pair[0]), String(row.pair[1])].sort((left, right) => cmp(Number(left), Number(right))),
    mode: row.mode,
    mid: row.mid,
  })).sort((left, right) => cmp(left.center, right.center));
  const masksOnlyPairKeys = sortPairs(masksOnlyPairs.map((row) => row.constructors));
  const consumedPairKeys = sortPairs(consumedPairs.map((row) => row.pair.map(Number)));
  if (canonicalText(masksOnlyPairKeys) !== canonicalText(consumedPairKeys)) {
    fail("independent masks-only pair mismatch");
  }
  const masksOnlyChildByPair = new Map(masksOnlyPairs.map((row) => [`${row.constructors[0]}-${row.constructors[1]}`, String(row.child)]));
  const pairsCrossCheck = consumedPairs.every((row) => masksOnlyChildByPair.get(`${Math.min(...row.pair.map(Number))}-${Math.max(...row.pair.map(Number))}`) === row.child);
  if (!pairsCrossCheck) fail("independent masks-only child attachment mismatch");

  // ---- independent R structure: H2 reach + H8 census closure (masks-only) ----
  const parents = consumedPairs.map((row) => Number(row.child)).sort(cmp);
  const domainMasks = ledgerRows
    .filter((row) => row.tier === "A1" && row.role === "satellite")
    .map((row) => Number(row.id))
    .sort(cmp);
  if (domainMasks.length !== 28) fail("independent domain census drift");
  const reachCount = new Map(parents.map((parent) => [parent, 0]));
  const h2ByParent = new Map(parents.map((parent) => [parent, 0]));
  const closureByParent = new Map(parents.map((parent) => [parent, 0]));
  const assignment = new Map();
  const unplaced = [];
  for (const satellite of domainMasks) {
    const hubs = parents.filter((parent) => hamming12(parent, satellite) === 2);
    if (hubs.length === 1) {
      assignment.set(satellite, hubs[0]);
      reachCount.set(hubs[0], reachCount.get(hubs[0]) + 1);
      h2ByParent.set(hubs[0], h2ByParent.get(hubs[0]) + 1);
    } else if (hubs.length === 0) {
      unplaced.push(satellite);
    } else {
      fail(`independent multi-hub satellite ${satellite}`);
    }
  }
  if (assignment.size !== 24 || unplaced.length !== 4) fail("independent reach census drift");
  for (const satellite of unplaced) {
    const candidates = parents.filter((parent) => hamming12(parent, satellite) === 8);
    if (candidates.length !== 2) fail(`independent H8 candidate drift at ${satellite}`);
    const reaches = candidates.map((parent) => h2ByParent.get(parent));
    if (reaches[0] === reaches[1]) fail(`independent H8 reach tie at ${satellite}`);
    const chosen = reaches[0] < reaches[1] ? candidates[0] : candidates[1];
    assignment.set(satellite, chosen);
    reachCount.set(chosen, reachCount.get(chosen) + 1);
    closureByParent.set(chosen, closureByParent.get(chosen) + 1);
  }
  const centerByChild = new Map(consumedPairs.map((row) => [row.child, row.center]));
  const rEdges = parents.map((parent) => ({
    parent: String(parent),
    center1: centerByChild.get(String(parent)),
    satellites: domainMasks.filter((satellite) => assignment.get(satellite) === parent).map(String).sort((left, right) => cmp(Number(left), Number(right))),
    h2Count: h2ByParent.get(parent),
    closureCount: closureByParent.get(parent),
  }));
  const bl066Rows = bl066.mechanism.perOffice.map((row) => ({
    parent: String(row.parent),
    center1: row.center1,
    satellites: [...row.satellites].map(String).sort((left, right) => cmp(Number(left), Number(right))),
    h2Count: row.h2Count,
    closureCount: row.closureCount,
  })).sort((left, right) => cmp(Number(left.parent), Number(right.parent)));
  if (canonicalText(rEdges) !== canonicalText(bl066Rows)) fail("independent R structure mismatch against BL-066");

  // ---- offices (both orientations) and selection ----
  const offices1 = new Map();
  for (const [mask, index] of kappa1.entries()) offices1.set(String(mask), index);
  for (const row of consumedPairs) offices1.set(row.child, row.center);
  const offices0 = new Map();
  for (const [mask, index] of kappa0.entries()) offices0.set(String(mask), index);
  for (const row of consumedPairs) offices0.set(row.child, (6 - row.center) % 7);
  for (const row of rEdges) {
    if (offices1.get(row.parent) !== row.center1) fail(`independent office mismatch at ${row.parent}`);
  }
  const classById = new Map(ledgerRows.map((row) => [String(row.id), row.forte]));
  const selection = rEdges.map((row) => ({
    parent: row.parent,
    center1: row.center1,
    satellites: row.satellites,
    selected: row.satellites.filter((satellite) => classById.get(satellite) === PREDICATE_CLASS),
  }));
  if (selection.reduce((total, row) => total + row.selected.length, 0) !== 14) fail("independent selection census drift");

  // ---- projection assembly ----
  const rIdByPair = new Map(generation.projection.R.map((edge) => [`${edge.source}>${edge.target}`, edge.id]));
  const eIdByPair = new Map(generation.projection.E.map((edge) => [`${edge.source}>${edge.target}`, edge.id]));
  const derivedAnchors = generation.projection.anchors
    .map((row) => ({ id: row.id, tier: row.tier, role: row.role, officeIndex: String(offices1.get(row.id)) }))
    .sort((left, right) => cmp(left.id, right.id));
  const derivedR = rEdges.flatMap((row) => row.satellites.map((satellite) => ({
    id: rIdByPair.get(`${row.parent}>${satellite}`),
    type: "GOVERNS",
    source: row.parent,
    target: satellite,
    directed: true,
    parentTier: "A1",
    childTier: "A1",
    parentOffice: String(row.center1),
  }))).sort((left, right) => cmp(left.id, right.id));
  const derivedE = consumedPairs.flatMap((row) => row.pair.map((parent) => ({
    id: eIdByPair.get(`${parent}>${row.child}`),
    type: "CONSTRUCTS",
    source: parent,
    target: row.child,
    directed: true,
    parentTier: "A0",
    childTier: "A1",
  }))).sort((left, right) => cmp(left.id, right.id));
  if (derivedR.some((row) => typeof row.id !== "string") || derivedE.some((row) => typeof row.id !== "string")) {
    fail("independent presentation id carry hole");
  }
  const projection = { anchors: derivedAnchors, R: derivedR, E: derivedE };
  validateProjection(projection);
  const digests = projectionDigests(projection);
  const frozenDigests = generation.bindings.projectionDigests;
  if (canonicalText(digests) !== canonicalText(frozenDigests)) fail("independent digests mismatch against the frozen bindings");

  // ---- S0' comparison ----
  const compareCollection = (derivedRows, grantedRows, keyOf, semanticOf) => {
    const dKeys = derivedRows.map(keyOf);
    const gKeys = grantedRows.map(keyOf);
    const dSet = new Set(dKeys);
    const gSet = new Set(gKeys);
    const dSem = derivedRows.map((row) => canonicalText(semanticOf(row))).sort();
    const gSem = grantedRows.map((row) => canonicalText(semanticOf(row))).sort();
    const gByKey = new Map(grantedRows.map((row) => [keyOf(row), row]));
    const fullRowSetEqual = derivedRows.every((row) => canonicalText(row) === canonicalText(gByKey.get(keyOf(row))));
    return {
      derivedCount: derivedRows.length,
      grantedCount: grantedRows.length,
      semanticSetEqual: canonicalText(dSem) === canonicalText(gSem),
      fullRowSetEqual,
      missing: gKeys.filter((key) => !dSet.has(key)),
      extra: dKeys.filter((key) => !gSet.has(key)),
    };
  };
  const granted = generation.projection;
  const anchorsEquality = compareCollection(derivedAnchors, granted.anchors, (row) => row.id, (row) => row);
  const rEquality = compareCollection(derivedR, granted.R, (row) => `${row.source}>${row.target}`,
    (row) => strip(row, ["type", "source", "target", "directed", "parentTier", "childTier", "parentOffice"]));
  const eEquality = compareCollection(derivedE, granted.E, (row) => `${row.source}>${row.target}`,
    (row) => strip(row, ["type", "source", "target", "directed", "parentTier", "childTier"]));

  // ---- selection comparison ----
  const observedKeys = receipt.comparison.rows.map((row) => `${row.key.parentOffice}:${row.key.s}`).sort();
  const selectedKeys = selection.flatMap((row) => row.selected.map((satellite) => `${row.center1}:${satellite}`)).sort();
  const uKeys = selection.flatMap((row) => row.satellites.map((satellite) => `${row.center1}:${satellite}`)).sort();
  const selectedSet = new Set(selectedKeys);
  const observedSet = new Set(observedKeys);
  const confusion = {
    tp: selectedKeys.filter((key) => observedSet.has(key)).length,
    fp: selectedKeys.filter((key) => !observedSet.has(key)).length,
    fn: observedKeys.filter((key) => !selectedSet.has(key)).length,
    tn: uKeys.filter((key) => !selectedSet.has(key) && !observedSet.has(key)).length,
  };
  const perOfficeSelection = selection
    .map((row) => ({ office: row.center1, parent: row.parent, selected: row.selected.map((satellite) => `${row.center1}:${satellite}`).sort() }))
    .sort((left, right) => cmp(left.office, right.office));

  // ---- flatness calibration ----
  const ledgerOfficeById = new Map(ledgerRows.map((row) => [String(row.id), String(row.officeIndex)]));
  const flatRows = selection.flatMap((row) => row.satellites.map((satellite) => ({
    satellite,
    parentOffice: ledgerOfficeById.get(row.parent),
    satelliteOffice: ledgerOfficeById.get(satellite),
  })));
  const officeFlatCount = flatRows.filter((row) => row.parentOffice === row.satelliteOffice).length;
  if (officeFlatCount !== 28) fail("independent office-flatness drift");

  // ---- orientation ----
  const labelMap = derivedAnchors
    .map((row) => ({ id: row.id, office1: Number(row.officeIndex), office0: offices0.get(row.id) }))
    .sort((left, right) => cmp(left.id, right.id));
  const center1ByParent = new Map(bl066.coverage.officeAlignment.perEdge.map((row) => [row.source, row.derivedCenter1]));
  const center0ByParent = new Map(bl066.coverage.officeAlignment.perEdge.map((row) => [row.source, row.derivedCenter0]));
  const orientationCrossCheck = rEdges.every((row) =>
    center1ByParent.get(row.parent) === offices1.get(row.parent) &&
    center0ByParent.get(row.parent) === offices0.get(row.parent));
  if (!orientationCrossCheck) fail("independent orientation cross-check failure");

  // ---- baseline ----
  const routeA = receipt.comparison.routes.A;
  const routeB = receipt.comparison.routes.B;
  const tC = receipt.comparison.tC;
  const baseline = {
    source: RECEIPT_PATH,
    observedKeyCount: Number(receipt.comparison.observedKeyCount),
    fourCellCounts: receipt.comparison.fourCellCounts,
    routeA: {
      generated: routeA.generated_key_count,
      matched: routeA.matchedObservedKeys.length,
      inRButUnmatched: routeA.in_R_but_unmatched_count,
      missed: routeA.missedObservedKeys.length,
      extra: routeA.extra_beyond_R_count,
      restatement: routeA.restatement_signature,
    },
    routeB: {
      generated: routeB.generated_key_count,
      matched: routeB.matchedObservedKeys.length,
      inRButUnmatched: routeB.in_R_but_unmatched_count,
      missed: routeB.missedObservedKeys.length,
      extra: routeB.extra_beyond_R_count,
      restatement: routeB.restatement_signature,
    },
    tC: { matches: tC.matches, missing: tC.missing, extra: tC.extra, midpointExact: tC.midpoint_exact },
    category: receipt.category,
  };

  return {
    kappa0, kappa1, a0Masks, a1Masks, consumedPairs, masksOnlyPairs, pairsCrossCheck,
    rEdges, domainMasks, offices1, offices0, selection,
    projection, digests, frozenDigests,
    equality: { anchors: anchorsEquality, R: rEquality, E: eEquality },
    selectedKeys, observedKeys, confusion, perOfficeSelection, officeFlatCount,
    labelMap, orientationCrossCheck, baseline,
  };
}

function checkAgainstSources(artifact, derived, sources) {
  // ---- header and fingerprint ----
  if (artifact.schemaVersion !== SCHEMA_VERSION || artifact.derivationId !== DERIVATION_ID ||
      artifact.status !== "planning_evidence" || artifact.generator !== GENERATOR_PATH) {
    fail("header drift");
  }
  const { derivationFingerprint, ...core } = artifact;
  if (typeof derivationFingerprint !== "string" || !/^[0-9a-f]{64}$/.test(derivationFingerprint)) {
    fail("fingerprint format drift");
  }
  if (sha256(canonicalText(core)) !== derivationFingerprint) fail("derivation fingerprint drift");

  // ---- source bindings ----
  const expectedBindings = [BL063_PATH, BL064_PATH, BL066_PATH, BL078_PATH, BL055_PATH, GENERATION_PATH, RECEIPT_PATH, LEDGER_PATH];
  if (artifact.sourceBindings.length !== expectedBindings.length) fail("source binding census drift");
  for (const [index, bindingPath] of expectedBindings.entries()) {
    const binding = artifact.sourceBindings[index];
    if (binding.artifact !== bindingPath || binding.sha256 !== fileSha(bindingPath)) {
      fail(`source binding drift at ${bindingPath}`);
    }
  }

  // ---- chain anchors ----
  const expectedAnchors = [
    [BL063_PATH, BL063_FINGERPRINT], [BL064_PATH, BL064_FINGERPRINT],
    [BL066_PATH, BL066_FINGERPRINT], [BL078_PATH, BL078_FINGERPRINT],
  ];
  if (artifact.base.chainAnchors.length !== expectedAnchors.length) fail("chain anchor census drift");
  for (const [index, [anchorPath, fingerprint]] of expectedAnchors.entries()) {
    const anchor = artifact.base.chainAnchors[index];
    if (anchor.artifact !== anchorPath || anchor.fingerprint !== fingerprint || anchor.selfChecked !== true) {
      fail(`chain anchor drift at ${anchorPath}`);
    }
  }
  if (artifact.base.predicateSource.artifact !== BL055_PATH ||
      artifact.base.predicateSource.reviewFingerprint !== BL055_FINGERPRINT ||
      artifact.base.predicateSource.selfChecked !== true) fail("predicate source drift");

  // ---- consumed kappa ----
  const expectedKappa0 = sources.bl063.kappaBoth.kappa0.map((row) => ({ mask: String(row.mask), index: row.index }));
  const expectedKappa1 = sources.bl063.kappaBoth.kappa1.map((row) => ({ mask: String(row.mask), index: row.index }));
  if (canonicalText(artifact.consumed.kappa.kappa0) !== canonicalText(expectedKappa0)) fail("consumed kappa0 drift");
  if (canonicalText(artifact.consumed.kappa.kappa1) !== canonicalText(expectedKappa1)) fail("consumed kappa1 drift");
  const validation = artifact.consumed.kappa.validation;
  if (validation.bijection !== true || validation.orientationRelation !== true || validation.lineProperty !== true ||
      canonicalText(validation.reDerivedDegreeSequence) !== canonicalText([1, 1, 2, 2, 2, 2, 2])) {
    fail("kappa validation block drift");
  }

  // ---- consumed pairs and R edges ----
  if (artifact.consumed.pairs.count !== 7 || canonicalText(artifact.consumed.pairs.perCenter) !== canonicalText(derived.consumedPairs)) {
    fail("consumed pairs drift");
  }
  if (artifact.consumed.pairs.masksOnlyCrossCheck.reproducesPairContent !== true ||
      artifact.consumed.pairs.masksOnlyCrossCheck.reproducesChildAttachment !== true) {
    fail("masks-only cross-check drift");
  }
  if (artifact.consumed.rEdges.count !== 7 || canonicalText(artifact.consumed.rEdges.perParent) !== canonicalText(derived.rEdges)) {
    fail("consumed rEdges drift");
  }
  if (artifact.consumed.rEdges.satelliteCensus !== 28) fail("satellite census drift");

  // ---- projection ----
  if (canonicalText(artifact.projection.anchors) !== canonicalText(derived.projection.anchors)) fail("projection anchors drift");
  if (canonicalText(artifact.projection.R) !== canonicalText(derived.projection.R)) fail("projection R drift");
  if (canonicalText(artifact.projection.E) !== canonicalText(derived.projection.E)) fail("projection E drift");
  if (artifact.projection.validation.frozenValidator !== "PASS") fail("frozen validator claim drift");
  if (canonicalText(artifact.projection.validation.digests) !== canonicalText(derived.digests)) fail("projection digests drift");
  if (canonicalText(artifact.projection.validation.frozenBindings) !== canonicalText(derived.frozenDigests)) fail("frozen bindings drift");
  if (artifact.projection.validation.digestsMatchFrozenBindings !== true) fail("digest match flag drift");
  const setEquality = artifact.projection.setEquality;
  for (const label of ["anchors", "R", "E"]) {
    const block = setEquality[label];
    const expected = derived.equality[label];
    if (block.derivedCount !== expected.derivedCount || block.grantedCount !== expected.grantedCount ||
        block.semanticSetEqual !== true || block.fullRowSetEqual !== true ||
        canonicalText(block.missing) !== canonicalText(expected.missing) ||
        canonicalText(block.extra) !== canonicalText(expected.extra)) {
      fail(`set-equality block drift at ${label}`);
    }
  }
  if (setEquality.presentationCarried.edgeIds !== 42) fail("presentation carry drift");

  // ---- selection ----
  if (!artifact.selection.predicate.definition.includes(PREDICATE_CLASS) ||
      artifact.selection.predicate.source !== LEDGER_PATH) fail("predicate block drift");
  if (artifact.selection.domain.uKeyCount !== 28 || artifact.selection.domain.selectedKeyCount !== 14) fail("selection domain drift");
  if (canonicalText(artifact.selection.selectedKeys) !== canonicalText(derived.selectedKeys)) fail("selected keys drift");
  if (canonicalText(artifact.selection.observedKeys) !== canonicalText(derived.observedKeys)) fail("observed keys drift");
  if (canonicalText(artifact.selection.confusion) !== canonicalText(derived.confusion)) fail("confusion drift");
  if (artifact.selection.setEqual !== true ||
      canonicalText(artifact.selection.missing) !== canonicalText([]) ||
      canonicalText(artifact.selection.extra) !== canonicalText([])) fail("selection set-equality drift");
  if (canonicalText(artifact.selection.perOffice) !== canonicalText(derived.perOfficeSelection)) fail("per-office selection drift");
  if (artifact.selection.calibration.officeFlatCount !== derived.officeFlatCount ||
      artifact.selection.calibration.officeFlatTotal !== 28) fail("calibration drift");

  // ---- orientation ----
  if (!artifact.orientation.default.includes("kappa1")) fail("orientation default drift");
  if (canonicalText(artifact.orientation.labelMap) !== canonicalText(derived.labelMap)) fail("orientation label map drift");
  if (artifact.orientation.pairsIdentical !== true || artifact.orientation.edgesIdentical !== true ||
      artifact.orientation.selectionIdentical !== true) fail("orientation invariance claims drift");
  if (artifact.orientation.crossCheck.perEdgeRows !== 28 ||
      artifact.orientation.crossCheck.derivedCenter1MatchesOffice1 !== true ||
      artifact.orientation.crossCheck.derivedCenter0MatchesOffice0 !== true) fail("orientation cross-check drift");

  // ---- pipeline, pre-registration, baseline ----
  if (artifact.pipeline.status !== "landed_unexecuted" || artifact.pipeline.frozenModules.length !== 4 ||
      !artifact.pipeline.executionGate.includes("Gate 3")) fail("pipeline block drift");
  if (artifact.preRegistration.criteria.length !== 4 ||
      !artifact.preRegistration.criteria[2].includes("finding, not a failure")) fail("pre-registration drift");
  if (canonicalText(artifact.gate3Baseline) !== canonicalText(derived.baseline)) fail("baseline drift");

  // ---- isolation ----
  if (artifact.isolation.regime !== "region-scoped" || artifact.isolation.grantedBytesInDerivationPath !== 0) {
    fail("isolation regime drift");
  }
  if (artifact.isolation.licensedReads.length !== 4 || artifact.isolation.forbiddenReads.length !== 4) {
    fail("isolation read inventory drift");
  }
  if (!artifact.isolation.validatorDiscipline.includes("two-sided")) fail("validator discipline drift");
  if (artifact.isolation.statements.length !== 3) fail("isolation statements drift");

  // ---- gates and readiness ----
  for (const key of ["V-G2-1", "V-G2-2", "V-G2-3", "V-G2-4", "V-G2-5"]) {
    if (artifact.gates[key]?.result !== "PASS") fail(`gate ${key} not PASS`);
  }
  if (!artifact.readiness.conditionalGreen.includes("anchoring remainder")) fail("conditional-green statement drift");
  if (artifact.readiness.remainingGranted.length !== 3) fail("remaining-granted inventory drift");
  if (!artifact.readiness.statement.includes("Gate 3")) fail("readiness statement drift");

  // ---- accounting and fences ----
  if (artifact.accounting.tiers.remainingGranted.length !== 3) fail("accounting remaining drift");
  if (artifact.fences.pipelineExecution !== "none: the pipeline is landed and unexecuted; the run is Gate 3, separately authorized") fail("pipeline fence drift");
  if (!artifact.fences.d4Record.includes("derivable-via-R2")) fail("D4 record fence drift");
  if (!artifact.fences.d7Control.includes("hypothesis-tier")) fail("D7 fence drift");
  if (!artifact.fences.anchoringRemainder.includes("unchanged")) fail("remainder fence drift");
  if (artifact.fences.g1Intra330 !== "untouched") fail("G1 fence drift");
  if (!artifact.fences.membrane.includes("never design input")) fail("membrane fence drift");
  if (!artifact.fences.canonical.includes("no canonical")) fail("canonical fence drift");
  if (!artifact.fences.frozenStack.includes("byte-untouched")) fail("frozen stack fence drift");
  if (artifact.contractCitations.length !== 10) fail("citation census drift");
  if (!artifact.contractCitations.some((citation) => citation.includes("bl-079-governs-derivation-design-spec"))) fail("design spec citation missing");
  if (!artifact.contractCitations.some((citation) => citation.includes("qa/d4-production-receipt.json"))) fail("receipt citation missing");
  if (artifact.notAccomplished.length !== 8) fail("notAccomplished inventory drift");
}

function validate() {
  const artifact = readJson(ARTIFACT_PATH);
  const sources = {
    generation: readJson(GENERATION_PATH),
    receipt: readJson(RECEIPT_PATH),
    ledgerRows: readJson(LEDGER_PATH),
    bl063: readJson(BL063_PATH),
    bl064: readJson(BL064_PATH),
    bl066: readJson(BL066_PATH),
    bl078: readJson(BL078_PATH),
    bl055: readJson(BL055_PATH),
  };
  const derived = reDerive(sources);
  checkAgainstSources(artifact, derived, sources);

  const generatorSource = read(GENERATOR_PATH);
  staticIntrinsicCheck(generatorSource);

  const mutationProbes = [];
  const repin = (candidate) => {
    const { derivationFingerprint, ...probeCore } = candidate;
    void derivationFingerprint;
    return { ...probeCore, derivationFingerprint: sha256(canonicalText(probeCore)) };
  };
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const expectRejection = (label, mutate) => {
    const mutated = clone(artifact);
    mutate(mutated);
    let rejected = false;
    try {
      checkAgainstSources(repin(mutated), derived, sources);
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`mutation probe not rejected: ${label}`);
    mutationProbes.push(label);
  };
  const expectStaticRejection = (label, mutatedSource) => {
    let rejected = false;
    try {
      staticIntrinsicCheck(mutatedSource);
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`mutation probe not rejected: ${label}`);
    mutationProbes.push(label);
  };
  const expectStaticPass = (label, mutatedSource) => {
    try {
      staticIntrinsicCheck(mutatedSource);
    } catch {
      fail(`permissive probe rejected: ${label}`);
    }
    mutationProbes.push(label);
  };

  expectRejection("schema version drift", (a) => { a.schemaVersion = "harmonic-orrery.bl080-governs-derivation.v2"; });
  expectRejection("status drift", (a) => { a.status = "implementation_evidence"; });
  expectRejection("generator path drift", (a) => { a.generator = "scripts/build-other.mjs"; });
  const fingerprintProbe = clone(artifact);
  fingerprintProbe.derivationFingerprint = "xyz";
  let fingerprintRejected = false;
  try {
    checkAgainstSources(fingerprintProbe, derived, sources);
  } catch {
    fingerprintRejected = true;
  }
  if (!fingerprintRejected) fail("mutation probe not rejected: fingerprint format drift");
  mutationProbes.push("fingerprint format drift");
  const fingerprintZero = clone(artifact);
  fingerprintZero.derivationFingerprint = "0".repeat(64);
  let fingerprintZeroRejected = false;
  try {
    checkAgainstSources(fingerprintZero, derived, sources);
  } catch {
    fingerprintZeroRejected = true;
  }
  if (!fingerprintZeroRejected) fail("mutation probe not rejected: fingerprint-zero probe");
  mutationProbes.push("fingerprint-zero probe");
  expectRejection("source binding count drift", (a) => { a.sourceBindings.pop(); });
  expectRejection("source binding sha drift", (a) => { a.sourceBindings[0].sha256 = "0".repeat(64); });
  expectRejection("chain anchor fingerprint drift", (a) => { a.base.chainAnchors[0].fingerprint = "0".repeat(64); });
  expectRejection("chain anchor self-check flag drift", (a) => { a.base.chainAnchors[1].selfChecked = false; });
  expectRejection("predicate source fingerprint drift", (a) => { a.base.predicateSource.reviewFingerprint = "0".repeat(64); });
  expectRejection("consumed kappa index drift", (a) => { a.consumed.kappa.kappa1[0].index = 0; });
  expectRejection("kappa validation flag drift", (a) => { a.consumed.kappa.validation.bijection = false; });
  expectRejection("consumed pair member swap", (a) => { a.consumed.pairs.perCenter[0].pair = ["1387", "2773"]; });
  expectRejection("consumed pairs count drift", (a) => { a.consumed.pairs.count = 6; });
  expectRejection("masks-only cross-check drift", (a) => { a.consumed.pairs.masksOnlyCrossCheck.reproducesChildAttachment = false; });
  expectRejection("consumed rEdge satellite swap", (a) => { a.consumed.rEdges.perParent[0].satellites = ["1243", "1339", "1627", "877"]; });
  expectRejection("consumed rEdge center drift", (a) => { a.consumed.rEdges.perParent[1].center1 = 0; });
  expectRejection("satellite census drift", (a) => { a.consumed.rEdges.satelliteCensus = 27; });
  expectRejection("projection anchor office drift", (a) => { a.projection.anchors[0].officeIndex = "9"; });
  expectRejection("projection anchor tier drift", (a) => { a.projection.anchors[1].tier = "A2"; });
  expectRejection("projection R target drift", (a) => { a.projection.R[0].target = "877"; });
  expectRejection("projection R parent office drift", (a) => { a.projection.R[1].parentOffice = "1"; });
  expectRejection("projection E source drift", (a) => { a.projection.E[0].source = "2773"; });
  expectRejection("projection digest drift", (a) => { a.projection.validation.digests.anchors = "0".repeat(64); });
  expectRejection("digest match flag drift", (a) => { a.projection.validation.digestsMatchFrozenBindings = false; });
  expectRejection("set-equality flag drift", (a) => { a.projection.setEquality.R.semanticSetEqual = false; });
  expectRejection("set-equality missing drift", (a) => { a.projection.setEquality.anchors.missing = ["1387"]; });
  expectRejection("presentation carry drift", (a) => { a.projection.setEquality.presentationCarried.edgeIds = 41; });
  expectRejection("predicate definition drift", (a) => { a.selection.predicate.definition = "P(s) = [forte(s) = '7-31']"; });
  expectRejection("selected keys drop", (a) => { a.selection.selectedKeys = a.selection.selectedKeys.slice(1); });
  expectRejection("confusion drift", (a) => { a.selection.confusion.fp = 1; });
  expectRejection("per-office selection drift", (a) => { a.selection.perOffice[0].selected = []; });
  expectRejection("calibration drift", (a) => { a.selection.calibration.officeFlatCount = 27; });
  expectRejection("orientation label map drift", (a) => { a.orientation.labelMap[0].office0 = 1; });
  expectRejection("orientation cross-check drift", (a) => { a.orientation.crossCheck.derivedCenter0MatchesOffice0 = false; });
  expectRejection("pipeline status drift", (a) => { a.pipeline.status = "executed"; });
  expectRejection("pre-registration drift", (a) => { a.preRegistration.criteria.pop(); });
  expectRejection("baseline observed count drift", (a) => { a.gate3Baseline.observedKeyCount = 13; });
  expectRejection("baseline route drift", (a) => { a.gate3Baseline.routeA.restatement = true; });
  expectRejection("isolation byte drift", (a) => { a.isolation.grantedBytesInDerivationPath = 1; });
  expectRejection("isolation regime drift", (a) => { a.isolation.regime = "file-scoped"; });
  expectRejection("gate result drift", (a) => { a.gates["V-G2-1"].result = "FAIL"; });
  expectRejection("conditional-green drift", (a) => { a.readiness.conditionalGreen = "the derivation runs on derived inputs alone"; });
  expectRejection("remaining-granted inventory drift", (a) => { a.readiness.remainingGranted.pop(); });
  expectRejection("accounting remaining drift", (a) => { a.accounting.tiers.remainingGranted = []; });
  expectRejection("fence drift", (a) => { a.fences.g1Intra330 = "moved"; });
  expectRejection("citation census drift", (a) => { a.contractCitations.pop(); });
  expectRejection("notAccomplished census drift", (a) => { a.notAccomplished.pop(); });

  expectStaticRejection("smuggled office read", generatorSource.replace(
    "export function readREdges(rows) {",
    "export function readREdges(rows) { const smuggled = rows.officeIndex; void smuggled;",
  ));
  expectStaticRejection("smuggled parent-office read", generatorSource.replace(
    "export function deriveOffices(kappa, pairs) {",
    "export function deriveOffices(kappa, pairs) { const smuggled = pairs.parentOffice; void smuggled;",
  ));
  expectStaticRejection("smuggled class read", generatorSource.replace(
    "export function predicateSelect(rEdges, classById) {",
    "export function predicateSelect(rEdges, classById) { const smuggled = classById.forte; void smuggled;",
  ));
  expectStaticRejection("smuggled projection read", generatorSource.replace(
    "export function readPairs(rows) {",
    "export function readPairs(rows) { const smuggled = generation.projection; void smuggled;",
  ));
  expectStaticRejection("smuggled receipt read", generatorSource.replace(
    "export function validateConsumedKappa(kappa0, kappa1, a0Masks) {",
    "export function validateConsumedKappa(kappa0, kappa1, a0Masks) { const smuggled = receipt.comparison; void smuggled;",
  ));
  expectStaticRejection("presence strip predicateSelect", generatorSource.replace(
    "export function predicateSelect(", "export function selectionRule(", 
  ));
  expectStaticRejection("presence strip deriveOffices", generatorSource.replace(
    "export function deriveOffices(", "export function officeAssembly(", 
  ));
  expectStaticRejection("presence strip validateConsumedKappa", generatorSource.replace(
    "export function validateConsumedKappa(", "export function kappaValidation(", 
  ));
  expectStaticRejection("presence strip derivePairsFromMasks", generatorSource.replace(
    "export function derivePairsFromMasks(", "export function pairDerivation(", 
  ));
  expectStaticRejection("presence strip readREdges", generatorSource.replace(
    "export function readREdges(", "export function edgeStructure(", 
  ));
  expectStaticRejection("proof strip", generatorSource.replaceAll("receipt.comparison", "receiptData"));
  expectStaticPass("permissive comparison-region read", generatorSource.replace(
    "// ==== INTRINSIC-DERIVATION-END ====",
    "// ==== INTRINSIC-DERIVATION-END ====\nconst permissiveProbe = generation.projection.anchors[0].officeIndex; void permissiveProbe;",
  ));

  console.log(JSON.stringify({
    artifact: ARTIFACT_PATH,
    status: "PASS",
    derivationFingerprint: artifact.derivationFingerprint,
    chainAnchors: artifact.base.chainAnchors.length,
    projection: {
      anchors: artifact.projection.anchors.length,
      R: artifact.projection.R.length,
      E: artifact.projection.E.length,
      setEqual: artifact.projection.setEquality.R.semanticSetEqual,
      digestsMatch: artifact.projection.validation.digestsMatchFrozenBindings,
    },
    selection: {
      selected: artifact.selection.selectedKeys.length,
      observed: artifact.selection.observedKeys.length,
      confusion: artifact.selection.confusion,
    },
    orientation: { labelsFlip: "c -> 6-c", crossCheckRows: artifact.orientation.crossCheck.perEdgeRows },
    isolation: { regime: artifact.isolation.regime, grantedBytesInDerivationPath: artifact.isolation.grantedBytesInDerivationPath },
    pipeline: artifact.pipeline.status,
    readiness: artifact.readiness.conditionalGreen.slice(0, 96),
    mutationProbes: mutationProbes.length,
  }, null, 2));
}

validate();
