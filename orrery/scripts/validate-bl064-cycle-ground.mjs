#!/usr/bin/env node
/**
 * Validate the generated BL-064 cycle-ground derivation against its sources.
 *
 * Independent of the builder: re-reads the chain anchor (BL-063), the granted
 * projection and the canonical ledger; re-derives the consumed-kappa
 * validation, the child-side rules (S-int/T-bdy), the coordinate-side rules
 * (K-int/K-bdy), the unified cyclic rule with midpoint consistency, the
 * reflection census, the direction probes (D-mid, canonical class, IC counts)
 * and the coverage comparison; re-checks the derivation fingerprint. Also
 * statically verifies that the generator's intrinsic region reads no grant
 * fields, no phase-1 constructor table and no ledger, and runs mutation
 * probes (flipped pair member, swapped boundary twin, inverted orientation,
 * coverage drift, D-mid count drift, class mislabel, unified child swap,
 * reflection label drift, smuggled reads). Fail-loud.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/bl064-cycle-ground.v1.json";
const GENERATOR_PATH = "scripts/build-bl064-cycle-ground.mjs";
const SCHEMA_VERSION = "harmonic-orrery.bl064-cycle-ground.v1";
const DERIVATION_ID = "BL064_CYCLE_GROUND_V1";
const BL063_PATH = "orrery/src/generated/bl063-office-reconstruction.v1.json";
const BL063_FINGERPRINT = "6d33c67be7b8f87b8ad2f964cd3560ebcbc1ec0dc6b2088ad1f223c35caff8c3";
const GENERATION_PATH = "qa/d4-production-generation.json";
const LEDGER_PATH = "canonical/universal-heptatonic-ledger.json";

function fail(message) {
  throw new Error(`INVALID_BL064_CYCLE_GROUND: ${message}`);
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

function midZ7n(a, b) {
  return (4 * (a + b)) % 7;
}

function sandwichHolds(p, q, child) {
  const inter = p & q;
  const union = p | q;
  return ((inter & child) === inter) && ((child & union) === child);
}

function pairKey(sortedPair) {
  return `${sortedPair[0]}-${sortedPair[1]}`;
}

function sortPairs(pairs) {
  return pairs
    .map((pair) => [pair[0], pair[1]].sort(cmp))
    .sort((left, right) => cmp(left[0], right[0]) || cmp(left[1], right[1]));
}

function icCountsOfMask(mask) {
  const pcs = [];
  for (let pitch = 0; pitch < 12; pitch += 1) if (mask & (1 << pitch)) pcs.push(pitch);
  const counts = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < pcs.length; i += 1) {
    for (let j = i + 1; j < pcs.length; j += 1) {
      const diff = Math.abs(pcs[i] - pcs[j]);
      counts[Math.min(diff, 12 - diff) - 1] += 1;
    }
  }
  return counts;
}

function staticIntrinsicCheck(sourceText) {
  const begin = sourceText.indexOf("INTRINSIC-DERIVATION-BEGIN");
  const end = sourceText.indexOf("INTRINSIC-DERIVATION-END");
  if (begin < 0 || end < 0 || end <= begin) fail("generator intrinsic-region markers missing");
  const head = sourceText.slice(0, end);
  const region = sourceText.slice(begin, end);
  const patterns = [
    /officeIndex/, /\.office\b/, /parentOffice/, /projection\.E\b/, /generation\.projection/,
    /piTable/, /midComparison/, /\bforte\b/, /intervalVector/, /ledgerRows/, /ledgerById/,
  ];
  for (const pattern of patterns) {
    if (pattern.test(region)) fail(`generator intrinsic region reads the grant or the ledger: ${pattern}`);
    if (pattern.test(head)) fail(`forbidden token before the intrinsic-region end: ${pattern}`);
  }
}

function reDerive(sources) {
  const { generation, ledgerRows, bl063 } = sources;
  const anchorRows = generation.projection.anchors.map((row) => ({
    id: Number(row.id), tier: row.tier, officeIndex: Number(row.officeIndex),
  }));
  const a0Rows = anchorRows.filter((row) => row.tier === "A0").sort((left, right) => cmp(left.id, right.id));
  const a1Rows = anchorRows.filter((row) => row.tier === "A1").sort((left, right) => cmp(left.id, right.id));
  const a0Masks = a0Rows.map((row) => row.id);
  const a1Masks = a1Rows.map((row) => row.id);
  const officeById = new Map(anchorRows.map((row) => [row.id, row.officeIndex]));

  const kappa0 = new Map(bl063.kappaBoth.kappa0.map((row) => [Number(row.mask), row.index]));
  const kappa1 = new Map(bl063.kappaBoth.kappa1.map((row) => [Number(row.mask), row.index]));
  if (kappa0.size !== 7 || kappa1.size !== 7) fail("independent kappa census drift");
  const seen = new Set();
  for (const mask of a0Masks) {
    const p0 = kappa0.get(mask);
    const p1 = kappa1.get(mask);
    if (p0 === undefined || p1 === undefined) fail("independent kappa hole");
    if (seen.has(p0)) fail("independent kappa collision");
    seen.add(p0);
    if (p1 !== 6 - p0) fail("independent orientation relation failure");
  }
  const inverse0 = new Map(a0Masks.map((mask) => [kappa0.get(mask), mask]));
  const inverse1 = new Map(a0Masks.map((mask) => [kappa1.get(mask), mask]));
  if (inverse0.size !== 7 || inverse1.size !== 7) fail("independent kappa inverse drift");
  for (const inverse of [inverse0, inverse1]) {
    for (let c = 0; c < 6; c += 1) {
      if (hamming12(inverse.get(c), inverse.get(c + 1)) !== 2) fail("independent line property failure");
    }
  }

  const childSide = a1Masks.map((child) => {
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
  const sandwichEntries = childSide.filter((entry) => entry.mode === "sandwich");
  const twinEntries = childSide.filter((entry) => entry.mode === "twin-closure");
  if (sandwichEntries.length !== 5 || twinEntries.length !== 2) fail("independent mechanism census drift");

  const expectedSInt = sandwichEntries.map((entry) => ({
    child: String(entry.child),
    hamming2Neighbors: entry.neighbors.map(String),
    constructors: entry.constructors.map(String),
    sandwichHolds: true,
  })).sort((left, right) => cmp(Number(left.child), Number(right.child)));
  const expectedTBdy = twinEntries.map((entry) => ({
    child: String(entry.child),
    hamming2Neighbor: String(entry.neighbors[0]),
    twin: String(entry.twin),
    constructors: entry.constructors.map(String),
    sandwichHolds: false,
  })).sort((left, right) => cmp(Number(left.child), Number(right.child)));

  const kInt = [];
  for (let c = 1; c <= 5; c += 1) {
    kInt.push({ center: c, pair: [inverse1.get(c - 1), inverse1.get(c + 1)].sort(cmp) });
  }
  const kBdy = [];
  for (let i = 0; i < a0Masks.length; i += 1) {
    for (let j = i + 1; j < a0Masks.length; j += 1) {
      const a = a0Masks[i];
      const b = a0Masks[j];
      if (rotateMask12(a, 1) === b || rotateMask12(a, 11) === b ||
          rotateMask12(b, 1) === a || rotateMask12(b, 11) === a) {
        kBdy.push([a, b].sort(cmp));
      }
    }
  }
  if (kBdy.length !== 2) fail("independent boundary pair census drift");
  const kBdySorted = sortPairs(kBdy);
  if (canonicalText(sortPairs(kInt.map((row) => row.pair))) !== canonicalText(sortPairs(sandwichEntries.map((entry) => entry.constructors)))) {
    fail("independent K-int/S-int equivalence failure");
  }
  if (canonicalText(kBdySorted) !== canonicalText(sortPairs(twinEntries.map((entry) => entry.constructors)))) {
    fail("independent K-bdy/T-bdy equivalence failure");
  }

  const unified = [];
  for (let c = 0; c < 7; c += 1) {
    const pair = [inverse1.get((c + 6) % 7), inverse1.get((c + 1) % 7)].sort(cmp);
    const mid = midZ7n(kappa1.get(pair[0]), kappa1.get(pair[1]));
    if (mid !== c) fail(`independent midpoint consistency failure at ${c}`);
    unified.push({ center: c, pair, mid });
  }
  const unified0 = [];
  for (let c = 0; c < 7; c += 1) {
    unified0.push({ center: c, pair: [inverse0.get((c + 6) % 7), inverse0.get((c + 1) % 7)].sort(cmp) });
  }
  if (canonicalText(sortPairs(unified.map((row) => row.pair))) !== canonicalText(sortPairs(unified0.map((row) => row.pair)))) {
    fail("independent reflection invariance failure");
  }
  const entryByPair = new Map(childSide.map((entry) => [pairKey(entry.constructors), entry]));
  const expectedUnified = unified.map((row) => {
    const entry = entryByPair.get(pairKey(row.pair));
    if (!entry) fail(`independent unified attachment failure at center ${row.center}`);
    return { center: row.center, pair: row.pair.map(String), mid: row.mid, child: String(entry.child), mode: entry.mode };
  });
  const center0ByPair = new Map(unified0.map((row) => [pairKey(row.pair), row.center]));
  const expectedLabelMap = unified.map((row) => {
    const center0 = center0ByPair.get(pairKey(row.pair));
    if (center0 === undefined) fail(`independent reflection pair missing: ${pairKey(row.pair)}`);
    if (center0 !== (6 - row.center) % 7) fail(`independent reflection label flip failure: ${pairKey(row.pair)}`);
    return { pair: row.pair.map(String), center1: row.center, center0 };
  });

  const expectedDMid = childSide.map((entry) => {
    const [p, q] = entry.constructors;
    const members = [
      { mask: entry.child, middle: sandwichHolds(p, q, entry.child) },
      { mask: p, middle: sandwichHolds(q, entry.child, p) },
      { mask: q, middle: sandwichHolds(p, entry.child, q) },
    ].sort((left, right) => cmp(left.mask, right.mask))
      .map((member) => ({ mask: String(member.mask), middle: member.middle }));
    const resolved = members.filter((member) => member.middle).length === 1;
    const middleIsChild = resolved && members.find((member) => member.middle).mask === String(entry.child);
    return { child: String(entry.child), constructors: entry.constructors.map(String), members, resolved, middleIsChild };
  });
  const dMidInternal = expectedDMid.filter((row, index) => childSide[index].mode === "sandwich" && row.middleIsChild).length;
  const dMidBoundary = expectedDMid.filter((row, index) => childSide[index].mode === "twin-closure" && row.resolved).length;
  if (dMidInternal !== 5 || dMidBoundary !== 0) fail("independent D-mid census drift");

  const ledgerById = new Map(ledgerRows.map((row) => [Number(row.id), row]));
  const expectedClass = childSide.map((entry) => ({
    child: String(entry.child),
    childClass: ledgerById.get(entry.child)?.forte ?? null,
    parentClasses: entry.constructors.map((mask) => ledgerById.get(mask)?.forte ?? null),
  }));
  for (const row of expectedClass) {
    if (row.childClass === null || row.parentClasses.some((value) => value === null)) fail("independent class field missing");
  }
  const childClasses = new Set(expectedClass.map((row) => row.childClass));
  const parentClasses = new Set(expectedClass.flatMap((row) => row.parentClasses));
  if (childClasses.size !== 1 || parentClasses.size !== 1) fail("independent class split drift");
  const [childClass] = [...childClasses];
  const [parentClass] = [...parentClasses];
  if (childClass === parentClass) fail("independent class separation failure");

  const expectedIc = childSide.map((entry) => ({
    child: String(entry.child),
    childIc: icCountsOfMask(entry.child),
    parentIcs: entry.constructors.map((mask) => icCountsOfMask(mask)),
  }));
  const icChildSet = new Set(expectedIc.map((row) => canonicalText(row.childIc)));
  const icParentSet = new Set(expectedIc.flatMap((row) => row.parentIcs.map((ic) => canonicalText(ic))));
  if (icChildSet.size !== 1 || icParentSet.size !== 1) fail("independent IC split drift");
  const childIc = expectedIc[0].childIc;
  const parentIc = expectedIc[0].parentIcs[0];
  if (canonicalText(childIc) === canonicalText(parentIc)) fail("independent IC separation failure");

  const eByChild = new Map();
  const grantedKeys = [];
  for (const edge of generation.projection.E) {
    if (edge.type !== "CONSTRUCTS" || edge.parentTier !== "A0" || edge.childTier !== "A1") fail("independent E edge shape drift");
    const child = Number(edge.target);
    const parent = Number(edge.source);
    const list = eByChild.get(child) ?? [];
    list.push(parent);
    eByChild.set(child, list);
    grantedKeys.push(`${parent}->${child}`);
  }
  if (eByChild.size !== 7) fail("independent E child census drift");
  const derivedKeys = childSide.flatMap((entry) => entry.constructors.map((parent) => `${parent}->${entry.child}`)).sort();
  const sortedGranted = grantedKeys.slice().sort();
  if (canonicalText(derivedKeys) !== canonicalText(sortedGranted)) fail("independent coverage set failure");
  const missing = sortedGranted.filter((key) => !derivedKeys.includes(key));
  const extra = derivedKeys.filter((key) => !sortedGranted.includes(key));
  const perChild = childSide.map((entry) => {
    const derivedPair = entry.constructors.map(String);
    const granted = (eByChild.get(entry.child) ?? []).slice().sort(cmp).map(String);
    if (canonicalText(derivedPair) !== canonicalText(granted)) fail(`independent per-child coverage mismatch at ${entry.child}`);
    return { child: String(entry.child), derived: derivedPair, granted, equal: true };
  });
  const officeAlignment = unified.map((row) => {
    const entry = entryByPair.get(pairKey(row.pair));
    const grantedOffice = officeById.get(entry.child);
    return { child: String(entry.child), center: row.center, grantedOffice, match: row.center === grantedOffice };
  });
  if (officeAlignment.some((row) => !row.match)) fail("independent office alignment failure");

  return {
    anchorRows, a0Masks, a1Masks, kappa0, kappa1, childSide,
    expectedSInt, expectedTBdy, kInt, expectedKInt: kInt.map((row) => ({ center: row.center, pair: row.pair.map(String) })),
    kBdySorted, unified, unified0, expectedUnified, expectedLabelMap,
    expectedDMid, dMidInternal, dMidBoundary,
    expectedClass, childClass, parentClass, expectedIc, childIc, parentIc,
    coverage: { derivedKeys, grantedKeys: sortedGranted, missing, extra, perChild, officeAlignment },
  };
}

function checkAgainstSources(artifact, derived, sources) {
  // ---- header and fingerprint ---------------------------------------------
  if (artifact.schemaVersion !== SCHEMA_VERSION || artifact.derivationId !== DERIVATION_ID ||
      artifact.status !== "planning_evidence" || artifact.generator !== GENERATOR_PATH) {
    fail("header drift");
  }
  const { derivationFingerprint, ...core } = artifact;
  if (typeof derivationFingerprint !== "string" || !/^[0-9a-f]{64}$/.test(derivationFingerprint)) {
    fail("fingerprint format drift");
  }
  if (sha256(canonicalText(core)) !== derivationFingerprint) fail("derivation fingerprint drift");

  // ---- source bindings -----------------------------------------------------
  const expectedBindings = [BL063_PATH, GENERATION_PATH, LEDGER_PATH];
  if (artifact.sourceBindings.length !== expectedBindings.length) fail("source binding census drift");
  for (const [index, bindingPath] of expectedBindings.entries()) {
    const binding = artifact.sourceBindings[index];
    if (binding.artifact !== bindingPath || binding.sha256 !== fileSha(bindingPath)) {
      fail(`source binding drift at ${bindingPath}`);
    }
  }
  if (artifact.base.artifact !== BL063_PATH ||
      artifact.base.reconstructionFingerprint !== BL063_FINGERPRINT ||
      sources.bl063.reconstructionFingerprint !== BL063_FINGERPRINT ||
      sources.bl063.status !== "planning_evidence") fail("chain anchor drift");
  if (artifact.base.projectionArtifact !== GENERATION_PATH) fail("projection artifact binding drift");

  // ---- consumed kappa ------------------------------------------------------
  const expectedKappa0 = sources.bl063.kappaBoth.kappa0.map((row) => ({ mask: String(row.mask), index: row.index }));
  const expectedKappa1 = sources.bl063.kappaBoth.kappa1.map((row) => ({ mask: String(row.mask), index: row.index }));
  if (canonicalText(artifact.kappaConsumed.kappa0) !== canonicalText(expectedKappa0)) fail("consumed kappa0 drift");
  if (canonicalText(artifact.kappaConsumed.kappa1) !== canonicalText(expectedKappa1)) fail("consumed kappa1 drift");
  const validation = artifact.kappaConsumed.validation;
  if (validation.bijection !== true || validation.orientationRelation !== true || validation.lineProperty !== true ||
      canonicalText(validation.reDerivedDegreeSequence) !== canonicalText([1, 1, 2, 2, 2, 2, 2])) {
    fail("kappa validation block drift");
  }

  // ---- rules ---------------------------------------------------------------
  if (canonicalText(artifact.rules.sInt.perAnchor) !== canonicalText(derived.expectedSInt) || artifact.rules.sInt.count !== 5) fail("S-int block drift");
  if (canonicalText(artifact.rules.tBdy.perAnchor) !== canonicalText(derived.expectedTBdy) || artifact.rules.tBdy.count !== 2) fail("T-bdy block drift");
  if (canonicalText(artifact.rules.kInt.perCenter) !== canonicalText(derived.expectedKInt) || artifact.rules.kInt.count !== 5) fail("K-int block drift");
  if (canonicalText(artifact.rules.kBdy.pairs) !== canonicalText(derived.kBdySorted.map((pair) => pair.map(String))) || artifact.rules.kBdy.count !== 2) fail("K-bdy block drift");
  if (canonicalText(artifact.rules.unified.perCenter) !== canonicalText(derived.expectedUnified) || artifact.rules.unified.count !== 7) fail("unified block drift");
  if (artifact.rules.equivalence.kIntEqualsSInt !== true || artifact.rules.equivalence.kBdyEqualsTBdy !== true ||
      !artifact.rules.equivalence.statement.includes("equivalent")) fail("equivalence block drift");

  // ---- coverage ------------------------------------------------------------
  if (artifact.coverage.derivedDirectedCount !== derived.coverage.derivedKeys.length ||
      artifact.coverage.grantedDirectedCount !== derived.coverage.grantedKeys.length ||
      artifact.coverage.setEqual !== true) fail("coverage counts drift");
  if (canonicalText(artifact.coverage.missing) !== canonicalText(derived.coverage.missing) ||
      canonicalText(artifact.coverage.extra) !== canonicalText(derived.coverage.extra)) fail("coverage missing/extra drift");
  if (canonicalText(artifact.coverage.perChild) !== canonicalText(derived.coverage.perChild)) fail("coverage perChild drift");
  if (artifact.coverage.officeAlignment.matches !== 7 ||
      canonicalText(artifact.coverage.officeAlignment.perChild) !== canonicalText(derived.coverage.officeAlignment)) fail("office alignment drift");

  // ---- reflection ----------------------------------------------------------
  if (artifact.reflection.pairsIdentical !== true || artifact.reflection.directionOrientationIndependent !== true) fail("reflection claims drift");
  if (canonicalText(artifact.reflection.unifiedPairsKappa1) !== canonicalText(derived.unified.map((row) => ({ center: row.center, pair: row.pair.map(String) })))) fail("reflection kappa1 pairs drift");
  if (canonicalText(artifact.reflection.unifiedPairsKappa0) !== canonicalText(derived.unified0.map((row) => ({ center: row.center, pair: row.pair.map(String) })))) fail("reflection kappa0 pairs drift");
  if (canonicalText(artifact.reflection.labelMap) !== canonicalText(derived.expectedLabelMap)) fail("reflection label map drift");

  // ---- direction -----------------------------------------------------------
  if (canonicalText(artifact.direction.dMid.perTriple) !== canonicalText(derived.expectedDMid)) fail("D-mid perTriple drift");
  if (artifact.direction.dMid.resolvedCount !== derived.dMidInternal + derived.dMidBoundary ||
      artifact.direction.dMid.internalResolved !== "5/5" ||
      artifact.direction.dMid.boundaryResolved !== "0/2") fail("D-mid counts drift");
  if (canonicalText(artifact.direction.canonicalClass.perTriple) !== canonicalText(derived.expectedClass) ||
      artifact.direction.canonicalClass.childClass !== derived.childClass ||
      artifact.direction.canonicalClass.parentClass !== derived.parentClass ||
      artifact.direction.canonicalClass.splitCount !== 7) fail("canonical class block drift");
  if (canonicalText(artifact.direction.icCounts.perTriple) !== canonicalText(derived.expectedIc) ||
      canonicalText(artifact.direction.icCounts.childIc) !== canonicalText(derived.childIc) ||
      canonicalText(artifact.direction.icCounts.parentIc) !== canonicalText(derived.parentIc) ||
      artifact.direction.icCounts.matchesCanonicalClassSplit !== true) fail("IC block drift");
  const accounting = artifact.direction.accounting.tiers;
  if (!accounting.masksOnly.pairStructure.includes("7/7") ||
      !accounting.masksOnly.internalDirection.includes("5/7") ||
      !accounting.canonicalComputation.fullDirection.includes("7/7") ||
      accounting.remainingGranted.length !== 4) fail("accounting tiers drift");

  // ---- gates and synthesis -------------------------------------------------
  for (const key of ["V-P2-1", "V-P2-2", "V-P2-3", "V-P2-4"]) {
    if (artifact.gates[key]?.result !== "PASS") fail(`gate ${key} not PASS`);
  }
  if (artifact.synthesis.verdict !== "CYCLE_GROUND_DERIVED") fail("synthesis verdict drift");
  if (canonicalText(artifact.synthesis.preRegisteredVerdicts) !== canonicalText([
    "CYCLE_GROUND_DERIVED", "CYCLE_GROUND_CONSTRAINED", "FAILED"])) fail("pre-registered verdict list drift");
  if (!artifact.synthesis.grantDischarge.discharged.includes("pair structure") ||
      !artifact.synthesis.grantDischarge.remaining.includes("anchor set")) fail("grant discharge drift");
  if (!artifact.synthesis.dependencyChain.position.includes("phase 2 of 4") ||
      !artifact.synthesis.dependencyChain.necessaryNotSufficient.includes("necessary-not-sufficient")) {
    fail("dependency chain drift");
  }
  if (artifact.synthesis.limits.length !== 4) fail("synthesis limits drift");

  // ---- fences --------------------------------------------------------------
  if (!artifact.fences.higherTheorem.includes("remains open") || artifact.fences.g1Intra330 !== "untouched" ||
      !artifact.fences.direction.includes("unassigned") || !artifact.fences.membrane.includes("never design input") ||
      !artifact.fences.reflectionBit.includes("BL-065")) fail("fence drift");
  if (artifact.contractCitations.filter((citation) => citation.includes("bl-059-governs-derivability")).length !== 1 ||
      artifact.contractCitations.filter((citation) => citation.includes("bl-063-office-reconstruction-memo")).length !== 1 ||
      artifact.contractCitations.filter((citation) => citation.includes("bl063-office-reconstruction.v1.json")).length !== 1) {
    fail("contract citation drift");
  }
  if (artifact.notAccomplished.length !== 7) fail("notAccomplished inventory drift");
}

// PLACEHOLDER-VALIDATOR-CHECK

function validate() {
  const artifact = readJson(ARTIFACT_PATH);
  const sources = {
    generation: readJson(GENERATION_PATH),
    ledgerRows: readJson(LEDGER_PATH),
    bl063: readJson(BL063_PATH),
  };
  const { reconstructionFingerprint, ...bl063Core } = sources.bl063;
  if (sha256(canonicalText(bl063Core)) !== reconstructionFingerprint) fail("chain anchor fingerprint self-check failed");
  const derived = reDerive(sources);
  checkAgainstSources(artifact, derived, sources);

  const generatorSource = read(GENERATOR_PATH);
  staticIntrinsicCheck(generatorSource);

  const repin = (candidate) => {
    const { derivationFingerprint, ...probeCore } = candidate;
    void derivationFingerprint;
    return { ...probeCore, derivationFingerprint: sha256(canonicalText(probeCore)) };
  };
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const expectRejection = (label, mutated) => {
    let rejected = false;
    try {
      checkAgainstSources(repin(mutated), derived, sources);
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`mutation probe not rejected: ${label}`);
  };

  const flippedPair = clone(artifact);
  flippedPair.rules.kInt.perCenter[0].pair = ["1453", "2773"];
  expectRejection("flipped K-int pair member", flippedPair);
  const swappedTwin = clone(artifact);
  swappedTwin.rules.tBdy.perAnchor[0].twin = "1451";
  expectRejection("swapped boundary twin", swappedTwin);
  const invertedOrientation = clone(artifact);
  invertedOrientation.kappaConsumed.kappa1 = invertedOrientation.kappaConsumed.kappa1
    .map((row) => ({ mask: row.mask, index: 6 - row.index }));
  expectRejection("inverted orientation", invertedOrientation);
  const coverageDrift = clone(artifact);
  coverageDrift.coverage.perChild[0].granted = ["1387", "1453"];
  expectRejection("coverage drift", coverageDrift);
  const dmidDrift = clone(artifact);
  dmidDrift.direction.dMid.resolvedCount = 7;
  expectRejection("D-mid count drift", dmidDrift);
  const classDrift = clone(artifact);
  classDrift.direction.canonicalClass.childClass = "7-35";
  expectRejection("class mislabel", classDrift);
  const unifiedChildDrift = clone(artifact);
  unifiedChildDrift.rules.unified.perCenter[3].child = "1389";
  expectRejection("unified child swap", unifiedChildDrift);
  const labelDrift = clone(artifact);
  labelDrift.reflection.labelMap[0].center0 = 5;
  expectRejection("reflection label drift", labelDrift);

  let smuggleRejected = false;
  try {
    staticIntrinsicCheck(generatorSource.replace(
      "export function deriveChildSide(a0Masks, a1Masks) {",
      "export function deriveChildSide(a0Masks, a1Masks) { const smuggled = a1Masks.officeIndex; void smuggled;",
    ));
  } catch {
    smuggleRejected = true;
  }
  if (!smuggleRejected) fail("mutation probe not rejected: smuggled officeIndex read");

  let ledgerSmuggleRejected = false;
  try {
    staticIntrinsicCheck(generatorSource.replace(
      "export function deriveCoordinateSide(kappa) {",
      "export function deriveCoordinateSide(kappa) { const smuggled = kappa.ledgerRows; void smuggled;",
    ));
  } catch {
    ledgerSmuggleRejected = true;
  }
  if (!ledgerSmuggleRejected) fail("mutation probe not rejected: smuggled ledger read");

  const mutationProbes = [
    "flipped K-int pair member", "swapped boundary twin", "inverted orientation", "coverage drift",
    "D-mid count drift", "class mislabel", "unified child swap", "reflection label drift",
    "smuggled officeIndex read", "smuggled ledger read",
  ];
  console.log(JSON.stringify({
    artifact: ARTIFACT_PATH,
    status: "PASS",
    derivationFingerprint: artifact.derivationFingerprint,
    chainFingerprint: artifact.base.reconstructionFingerprint,
    pairs: artifact.rules.unified.count,
    coverage: { derived: artifact.coverage.derivedDirectedCount, granted: artifact.coverage.grantedDirectedCount, setEqual: artifact.coverage.setEqual },
    reflection: { pairsIdentical: artifact.reflection.pairsIdentical, labelsFlip: "c -> 6-c" },
    dMid: { internal: artifact.direction.dMid.internalResolved, boundary: artifact.direction.dMid.boundaryResolved },
    canonicalClass: `${artifact.direction.canonicalClass.splitCount}/7 (${artifact.direction.canonicalClass.parentClass} vs ${artifact.direction.canonicalClass.childClass})`,
    icCandidate: artifact.direction.icCounts.matchesCanonicalClassSplit,
    verdict: artifact.synthesis.verdict,
    mutationProbes: mutationProbes.length,
  }, null, 2));
}

validate();
