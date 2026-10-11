#!/usr/bin/env node
/**
 * Validate the generated BL-066 R-edge derivation against its sources.
 *
 * Independent of the builder: re-reads the chain anchor (BL-064 via the
 * artifact's own self-check), the canonical ledger, the granted projection
 * and the containment mesh; re-derives the domain, the R-H2 reach, the H8
 * closure law (member-side minimum + matching-side equalization), the
 * rotation null census, the battery, the officeSum-6 out-of-sample test, the
 * emergent count, the direction probes (unique hub, IC vectors), the
 * containment robustness control, the GSL cross-check, the coverage
 * comparison and the office alignment; re-checks the derivation fingerprint
 * and the source bindings. Also statically verifies the generator's intrinsic
 * region TWO-SIDED: forbidden grant/office/class tokens absent AND the
 * required canonical inputs present (ledger, pitchSet, hamming, rotate,
 * maskOfRow), and runs mutation probes (artifact drift probes plus smuggled
 * reads and a lobotomized region). Fail-loud.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/bl066-r-edge-derivation.v1.json";
const GENERATOR_PATH = "scripts/build-bl066-r-edge-derivation.mjs";
const SCHEMA_VERSION = "harmonic-orrery.bl066-r-edge-derivation.v1";
const DERIVATION_ID = "BL066_R_EDGE_DERIVATION_V1";
const BL064_PATH = "orrery/src/generated/bl064-cycle-ground.v1.json";
const BL064_FINGERPRINT = "aa975820136658dd2fb3c84d98b34bf7a1901d39edd6548a300f458858305918";
const BL063_PATH = "orrery/src/generated/bl063-office-reconstruction.v1.json";
const BL063_FINGERPRINT = "6d33c67be7b8f87b8ad2f964cd3560ebcbc1ec0dc6b2088ad1f223c35caff8c3";
const LEDGER_PATH = "canonical/universal-heptatonic-ledger.json";
const GENERATION_PATH = "qa/d4-production-generation.json";
const BIPARTITE_PATH = "derived/hypergraph/bipartite-inclusion-v1.json";
const NON_Z_FAMILIES = ["7-1", "7-15", "7-22", "7-8"];
const Z_FAMILIES = ["7-Z12", "7-Z17", "7-Z37"];

function fail(message) {
  throw new Error(`INVALID_BL066_R_EDGE_DERIVATION: ${message}`);
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

function maskFromRow(row) {
  let mask = 0;
  const inner = String(row.pitchSet).trim();
  for (const part of inner.slice(1, -1).split(",")) mask |= 1 << Number(part.trim());
  return mask;
}

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

function pcSumOfMask(mask) {
  let sum = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) if (mask & (1 << pitch)) sum += pitch;
  return sum;
}

function staticIntrinsicCheck(sourceText) {
  const begin = sourceText.indexOf("INTRINSIC-DERIVATION-BEGIN");
  const end = sourceText.indexOf("INTRINSIC-DERIVATION-END");
  if (begin < 0 || end < 0 || end <= begin) fail("generator intrinsic-region markers missing");
  const head = sourceText.slice(0, end);
  const region = sourceText.slice(begin, end);
  const forbidden = [
    /projection\.R\b/, /projection\.E\b/, /generation\.projection/,
    /officeIndex/, /parentOffice/, /\.office\b/, /relationalOffice/,
    /\bforte\b/, /intervalVector/, /setClass/, /observed/, /coverage/,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(region)) fail(`generator intrinsic region reads a forbidden input: ${pattern}`);
    if (pattern.test(head)) fail(`forbidden token before the intrinsic-region end: ${pattern}`);
  }
  const required = ["ledgerRows", "pitchSet", "hamming12", "rotateMask12", "maskOfRow", "deriveDomain"];
  for (const token of required) {
    if (!region.includes(token)) fail(`generator intrinsic region is missing a required canonical input: ${token}`);
  }
}

function reDerive(sources) {
  const { generation, ledgerRows, bl064, bl063, bipartite } = sources;

  // chain anchors
  const { derivationFingerprint: bl064Fingerprint, ...bl064Core } = bl064;
  if (sha256(canonicalText(bl064Core)) !== bl064Fingerprint) fail("independent BL-064 chain self-check failure");
  if (bl064Fingerprint !== BL064_FINGERPRINT) fail("independent BL-064 fingerprint literal drift");
  const { reconstructionFingerprint: bl063Fingerprint, ...bl063Core } = bl063;
  if (sha256(canonicalText(bl063Core)) !== bl063Fingerprint) fail("independent BL-063 self-check failure");
  if (bl063Fingerprint !== BL063_FINGERPRINT) fail("independent BL-063 fingerprint literal drift");
  const center1ByParent = new Map(bl064.rules.unified.perCenter.map((row) => [Number(row.child), row.center]));
  if (center1ByParent.size !== 7) fail("independent parent-center census drift");
  const center1 = (mask) => {
    const center = center1ByParent.get(Number(mask));
    if (center === undefined) fail(`independent parent-center hole at ${mask}`);
    return center;
  };
  const center0 = (mask) => (6 - center1(mask)) % 7;

  // domain
  const parentRows = ledgerRows.filter((row) => row.tier === "A1" && row.role === "anchor");
  const satelliteRows = ledgerRows.filter((row) => row.tier === "A1" && row.role === "satellite");
  if (parentRows.length !== 7 || satelliteRows.length !== 28) fail("independent domain census drift");
  const parentMasks = parentRows.map(maskFromRow).sort(cmp);
  const satelliteMasks = satelliteRows.map(maskFromRow).sort(cmp);

  // reach
  const reach = new Map(parentMasks.map((parent) => [parent, satelliteMasks.filter((satellite) => hamming12(parent, satellite) === 2).sort(cmp)]));
  const perParentReach = parentMasks.map((parent) => ({
    parent: String(parent),
    satellites: reach.get(parent).map(String),
    count: reach.get(parent).length,
  }));
  const unplaced = satelliteMasks.filter((mask) => parentMasks.every((parent) => hamming12(parent, mask) !== 2)).sort(cmp);
  if (unplaced.length !== 4 || canonicalText(unplaced.map(String)) !== canonicalText(["695", "731", "2921", "3497"])) {
    fail("independent unplaced census drift");
  }

  // closure candidates / law
  const h8Rows = unplaced.map((mask) => {
    const candidates = parentMasks.filter((parent) => hamming12(parent, mask) === 8).sort(cmp)
      .map((parent) => ({ parent: String(parent), reach: reach.get(parent).length }));
    if (candidates.length !== 2) fail(`independent H8 candidate census drift at ${mask}`);
    const minReach = Math.min(...candidates.map((entry) => entry.reach));
    const maxReach = Math.max(...candidates.map((entry) => entry.reach));
    return { satellite: String(mask), candidates, minReach, maxReach };
  });
  const lawRows = h8Rows.map((row) => {
    const min = Math.min(...row.candidates.map((entry) => entry.reach));
    const picks = row.candidates.filter((entry) => entry.reach === min);
    if (picks.length !== 1) fail(`independent closure tie at ${row.satellite}`);
    return { satellite: row.satellite, parent: picks[0].parent };
  }).sort((left, right) => cmp(Number(left.satellite), Number(right.satellite)));
  const baseCounts = new Map(parentMasks.map((parent) => [parent, reach.get(parent).length]));
  const solutions = [];
  const options = h8Rows.map((row) => row.candidates.map((entry) => Number(entry.parent)));
  const walk = (index, chosen) => {
    if (index === options.length) {
      const counts = new Map(baseCounts);
      for (const [, parent] of chosen) counts.set(parent, counts.get(parent) + 1);
      if (new Set(counts.values()).size === 1) {
        solutions.push(chosen.map(([mask, parent]) => ({ satellite: String(mask), parent: String(parent) }))
          .sort((left, right) => cmp(Number(left.satellite), Number(right.satellite))));
      }
      return;
    }
    for (const parent of options[index]) walk(index + 1, [...chosen, [unplaced[index], parent]]);
  };
  walk(0, []);
  if (solutions.length !== 1) fail(`independent equalizing matching not unique: ${solutions.length}`);
  if (canonicalText(solutions[0]) !== canonicalText(lawRows)) fail("independent closure law mismatch");

  // rotation null census
  const rotationCensus = unplaced.map((mask) => ({
    satellite: String(mask),
    hits: parentMasks.flatMap((parent) => {
      const hits = [];
      for (let d = 1; d <= 11; d += 1) if (rotateMask12(parent, d) === mask) hits.push({ parent: String(parent), shift: d });
      return hits;
    }),
  }));
  if (rotationCensus.some((row) => row.hits.length !== 0)) fail("independent rotation census drift");

  // battery (within-pair scope)
  const crossPair = lawRows.filter((row) => row.satellite === "695" || row.satellite === "3497");
  if (crossPair.length !== 2) fail("independent cross pair census drift");
  const crossParents = [...new Set(crossPair.map((row) => Number(row.parent)))].sort(cmp);
  if (canonicalText(crossParents) !== canonicalText([1389, 1749])) fail("independent cross candidate drift");
  const batteryRows = [
    { member: "pcSum", score: (mask, parent) => Math.abs(pcSumOfMask(mask) - pcSumOfMask(parent)) },
    { member: "maskNumeric", score: (mask, parent) => Math.abs(mask - parent) },
  ].map(({ member, score }) => {
    const assignments = crossPair.map((row) => {
      const mask = Number(row.satellite);
      const scored = crossParents.map((parent) => ({ parent: String(parent), score: score(mask, parent) }));
      const min = Math.min(...scored.map((entry) => entry.score));
      const picks = scored.filter((entry) => entry.score === min);
      return { satellite: row.satellite, parent: picks.length === 1 ? picks[0].parent : null, scores: scored };
    });
    const agrees = assignments.every((row, index) => row.parent === crossPair[index].parent);
    return { member, assignments, agrees };
  });
  const fullH8Proximity = unplaced
    .filter((mask) => mask === 695 || mask === 3497)
    .map((mask) => {
      const candidates = h8Rows.find((row) => Number(row.satellite) === mask).candidates.map((entry) => Number(entry.parent));
      const scored = candidates.map((parent) => ({ parent: String(parent), score: Math.abs(pcSumOfMask(mask) - pcSumOfMask(parent)) }));
      const min = Math.min(...scored.map((entry) => entry.score));
      return { satellite: String(mask), picks: scored.filter((entry) => entry.score === min).map((entry) => entry.parent) };
    });

  // inversion pairs + officeSum-6
  const byPcsKey = new Map(satelliteRows.map((row) => [canonicalText(String(row.pitchSet).trim().slice(1, -1).split(",").map((value) => Number(value.trim())).sort(cmp)), row]));
  const seen = new Set();
  const inversionPairs = [];
  for (const row of satelliteRows) {
    const pcs = String(row.pitchSet).trim().slice(1, -1).split(",").map((value) => Number(value.trim())).sort(cmp);
    const key = canonicalText(pcs);
    if (seen.has(key)) continue;
    const inverse = pcs.map((pc) => (12 - pc) % 12).sort(cmp);
    const sibling = byPcsKey.get(canonicalText(inverse));
    if (!sibling) fail(`independent inversion partner missing at ${row.id}`);
    seen.add(key);
    seen.add(canonicalText(inverse));
    inversionPairs.push([Number(row.id), Number(sibling.id)].sort(cmp));
  }
  if (inversionPairs.length !== 14) fail("independent inversion pair census drift");
  const parentBySatellite = new Map();
  for (const [parent, sats] of reach) for (const satellite of sats) parentBySatellite.set(satellite, parent);
  for (const row of lawRows) parentBySatellite.set(Number(row.satellite), Number(row.parent));
  const officeSumRows = inversionPairs
    .sort((left, right) => cmp(left[0], right[0]) || cmp(left[1], right[1]))
    .map((pair) => ({
      pair: pair.map(String),
      centers: pair.map((mask) => center1(parentBySatellite.get(mask))),
      sum: pair.reduce((sum, mask) => sum + center1(parentBySatellite.get(mask)), 0),
      placed: pair.every((mask) => !unplaced.includes(mask)),
    }));
  if (officeSumRows.filter((row) => row.placed).length !== 12 ||
      officeSumRows.some((row) => row.sum !== 6)) fail("independent officeSum-6 check failure");

  // emergent count
  const emergentRows = parentMasks.map((parent) => {
    const after = reach.get(parent).length + lawRows.filter((row) => Number(row.parent) === parent).length;
    return { parent: String(parent), before: reach.get(parent).length, after };
  });
  if (emergentRows.some((row) => row.after !== 4)) fail("independent emergent count failure");

  // direction
  const hubRows = satelliteMasks.map((mask) => ({
    satellite: String(mask),
    hubs: parentMasks.filter((parent) => hamming12(parent, mask) === 2).map(String),
  }));
  const hubResolved = hubRows.filter((row) => row.hubs.length === 1).length;
  if (hubResolved !== 24) fail("independent unique-hub census drift");
  const parentIc = icCountsOfMask(parentMasks[0]);
  if (!parentMasks.every((mask) => canonicalText(icCountsOfMask(mask)) === canonicalText(parentIc))) {
    fail("independent parent IC uniformity failure");
  }
  const satelliteIc = new Map();
  for (const mask of satelliteMasks) {
    const key = canonicalText(icCountsOfMask(mask));
    satelliteIc.set(key, (satelliteIc.get(key) ?? 0) + 1);
  }
  if (satelliteIc.size !== 2) fail("independent satellite IC class census drift");
  const derivedPairs = [
    ...parentMasks.flatMap((parent) => reach.get(parent).map((satellite) => ({ source: String(parent), target: String(satellite) }))),
    ...lawRows.map((row) => ({ source: row.parent, target: row.satellite })),
  ].sort((left, right) => cmp(Number(left.source), Number(right.source)) || cmp(Number(left.target), Number(right.target)));
  if (derivedPairs.length !== 28) fail("independent derived census drift");
  for (const row of derivedPairs) {
    if (canonicalText(icCountsOfMask(Number(row.source))) === canonicalText(icCountsOfMask(Number(row.target)))) {
      fail(`independent IC-symmetric edge at ${row.source}->${row.target}`);
    }
  }
  const ledgerById = new Map(ledgerRows.map((row) => [String(row.id), row]));
  const sourceClasses = [...new Set(derivedPairs.map((row) => ledgerById.get(row.source).forte))].sort();
  const targetClasses = [...new Set(derivedPairs.map((row) => ledgerById.get(row.target).forte))].sort();
  if (canonicalText(sourceClasses) !== canonicalText(["7-34"]) ||
      canonicalText(targetClasses) !== canonicalText(["7-27", "7-31"])) fail("independent class separation drift");

  // robustness control (mesh)
  const meshByMask = new Map(Object.values(bipartite.heptatonicNodes).map((node) => [String(node.pitchMask), node]));
  const subnodesOf = (mask) => {
    const node = meshByMask.get(String(mask));
    if (!node) fail(`independent mesh node missing at ${mask}`);
    return new Set(node.subnodes);
  };
  const assignedBySatellite = new Map(derivedPairs.map((row) => [Number(row.target), Number(row.source)]));
  const robustnessRows = satelliteMasks.map((mask) => {
    const subs = subnodesOf(mask);
    const overlaps = parentMasks.map((parent) => ({ parent, overlap: [...subs].filter((id) => subnodesOf(parent).has(id)).length }));
    const max = Math.max(...overlaps.map((entry) => entry.overlap));
    const best = overlaps.filter((entry) => entry.overlap === max).map((entry) => String(entry.parent)).sort(cmp);
    const assigned = String(assignedBySatellite.get(mask));
    return {
      satellite: String(mask),
      bestParents: best,
      overlap: max,
      uniqueBest: best.length === 1,
      assignedParent: assigned,
      agrees: best.length === 1 && best[0] === assigned,
    };
  });
  const robustnessPlaced = robustnessRows.filter((row) => row.uniqueBest);
  const robustnessSummary = {
    placedAgreement: robustnessPlaced.filter((row) => row.agrees).length,
    placedCount: robustnessPlaced.length,
    unplacedTieCount: robustnessRows.filter((row) => !row.uniqueBest).length,
  };
  if (robustnessSummary.placedAgreement !== 24 || robustnessSummary.placedCount !== 24 ||
      robustnessSummary.unplacedTieCount !== 4) fail("independent robustness control drift");

  // GSL cross-check
  const pent = bipartite.pentatonicSubnodes;
  const gslRows = satelliteRows.map((row) => {
    const mask = maskFromRow(row);
    const shared = (family) => meshByMask.get(String(mask)).subnodes.filter((id) => (pent[id]?.parentsUnrooted ?? []).includes(family)).length;
    const nonZSum = NON_Z_FAMILIES.reduce((sum, family) => sum + shared(family), 0);
    const zSum = Z_FAMILIES.reduce((sum, family) => sum + shared(family), 0);
    const forte = ledgerById.get(String(row.id)).forte;
    return { satellite: String(mask), forte, nonZSum, zSum, signAgreesWithClass: (forte === "7-27") === (nonZSum < zSum) };
  });
  if (gslRows.filter((row) => row.signAgreesWithClass).length !== 28) fail("independent GSL cross-check drift");
  const gslPerOffice = parentMasks.map((parent) => {
    const group = gslRows.filter((row) => assignedBySatellite.get(Number(row.satellite)) === parent);
    return {
      seven27: group.filter((row) => row.forte === "7-27").map((row) => row.satellite),
      seven31: group.filter((row) => row.forte === "7-31").map((row) => row.satellite),
      signSeparates: group.every((row) => row.signAgreesWithClass),
    };
  });

  // coverage (comparison)
  const grantedKeys = [];
  const grantedByParent = new Map();
  for (const edge of generation.projection.R) {
    if (edge.type !== "GOVERNS" || edge.parentTier !== "A1" || edge.childTier !== "A1") fail("independent R shape drift");
    const source = String(edge.source);
    const target = String(edge.target);
    grantedKeys.push(`${source}->${target}`);
    const list = grantedByParent.get(source) ?? [];
    list.push(target);
    grantedByParent.set(source, list);
  }
  if (grantedKeys.length !== 28) fail("independent granted census drift");
  const derivedKeys = derivedPairs.map((row) => `${row.source}->${row.target}`);
  if (canonicalText(derivedKeys.slice().sort()) !== canonicalText(grantedKeys.slice().sort())) {
    fail("independent V-P3-1 coverage failure");
  }
  const perParentCoverage = parentMasks.map((parent) => ({
    parent: String(parent),
    derived: derivedPairs.filter((row) => Number(row.source) === parent).map((row) => row.target)
      .sort((left, right) => cmp(Number(left), Number(right))),
    granted: (grantedByParent.get(String(parent)) ?? []).slice()
      .sort((left, right) => cmp(Number(left), Number(right))),
    equal: true,
  }));
  const officeIndexByMask = new Map(generation.projection.anchors.map((row) => [String(row.id), Number(row.officeIndex)]));
  const officeAlignment = derivedPairs.map((row) => {
    const grantedParentOffice = officeIndexByMask.get(row.source);
    const grantedSatelliteOffice = Number(ledgerById.get(row.target)?.officeIndex ?? NaN);
    return {
      source: row.source,
      target: row.target,
      grantedParentOffice,
      grantedSatelliteOffice,
      derivedCenter1: center1(row.source),
      derivedCenter0: center0(row.source),
      satelliteOfficeMatchesParentOffice: grantedSatelliteOffice === grantedParentOffice,
      match1: center1(row.source) === grantedParentOffice,
      match0: center0(row.source) === grantedParentOffice,
    };
  });
  const match1Count = officeAlignment.filter((row) => row.match1).length;
  const match0Count = officeAlignment.filter((row) => row.match0).length;
  if (match1Count !== 28 || match0Count !== 4) fail("independent office alignment drift");

  return {
    parentMasks, satelliteMasks, perParentReach, unplaced, h8Rows, lawRows,
    solutions, rotationCensus, batteryRows, fullH8Proximity, officeSumRows,
    emergentRows, hubRows, hubResolved, parentIc, satelliteIc, derivedPairs,
    sourceClasses, targetClasses, robustnessRows, robustnessSummary,
    gslRows, gslPerOffice, perParentCoverage, officeAlignment, match1Count, match0Count,
    grantedKeys: grantedKeys.slice().sort(), derivedKeys,
  };
}

function checkAgainstSources(artifact, derived, sources) {
  // header and fingerprint
  if (artifact.schemaVersion !== SCHEMA_VERSION || artifact.derivationId !== DERIVATION_ID ||
      artifact.status !== "planning_evidence" || artifact.generator !== GENERATOR_PATH) {
    fail("header drift");
  }
  const { derivationFingerprint, ...core } = artifact;
  if (typeof derivationFingerprint !== "string" || !/^[0-9a-f]{64}$/.test(derivationFingerprint)) {
    fail("fingerprint format drift");
  }
  if (sha256(canonicalText(core)) !== derivationFingerprint) fail("derivation fingerprint drift");

  // source bindings
  const expectedBindings = [BL064_PATH, LEDGER_PATH, GENERATION_PATH, BIPARTITE_PATH];
  if (artifact.sourceBindings.length !== expectedBindings.length) fail("source binding census drift");
  for (const [index, bindingPath] of expectedBindings.entries()) {
    const binding = artifact.sourceBindings[index];
    if (binding.artifact !== bindingPath || binding.sha256 !== fileSha(bindingPath)) {
      fail(`source binding drift at ${bindingPath}`);
    }
  }
  if (artifact.base.artifact !== BL064_PATH || artifact.base.derivationFingerprint !== BL064_FINGERPRINT ||
      sources.bl064.derivationFingerprint !== BL064_FINGERPRINT) fail("chain anchor drift");
  if (artifact.base.chainAnchor.artifact !== BL063_PATH ||
      artifact.base.chainAnchor.reconstructionFingerprint !== BL063_FINGERPRINT) fail("chain anchor (BL-063) drift");
  if (artifact.base.projectionArtifact !== GENERATION_PATH || artifact.base.containmentArtifact !== BIPARTITE_PATH) {
    fail("artifact bindings drift");
  }

  // kappa consumed
  const expectedKappa0 = sources.bl064.kappaConsumed.kappa0.map((row) => ({ mask: String(row.mask), index: row.index }));
  const expectedKappa1 = sources.bl064.kappaConsumed.kappa1.map((row) => ({ mask: String(row.mask), index: row.index }));
  if (canonicalText(artifact.kappaConsumed.kappa0) !== canonicalText(expectedKappa0) ||
      canonicalText(artifact.kappaConsumed.kappa1) !== canonicalText(expectedKappa1)) fail("consumed kappa drift");

  // domain
  if (canonicalText(artifact.domain.parentCensus.masks) !== canonicalText(derived.parentMasks.map(String)) ||
      canonicalText(artifact.domain.satelliteCensus.masks) !== canonicalText(derived.satelliteMasks.map(String)) ||
      artifact.domain.parentCensus.count !== 7 || artifact.domain.satelliteCensus.count !== 28) fail("domain drift");

  // reach
  if (canonicalText(artifact.reach.perParent) !== canonicalText(derived.perParentReach) ||
      canonicalText(artifact.reach.unplaced) !== canonicalText(derived.unplaced.map(String))) fail("reach block drift");
  if (artifact.reach.census.placed !== 24 || artifact.reach.census.unplaced !== 4 ||
      artifact.reach.census.assigned !== 28 || artifact.reach.census.domainSize !== 28 ||
      artifact.reach.census.extraOnDomain !== 0) fail("reach census drift");
  if (canonicalText(artifact.reach.robustness.perSatellite) !== canonicalText(derived.robustnessRows) ||
      artifact.reach.robustness.placedAgreement !== "24/24" ||
      artifact.reach.robustness.unplacedNonResolution !== "4/4") fail("robustness block drift");

  // closure
  if (canonicalText(artifact.closure.h8Structure.perSatellite) !== canonicalText(derived.h8Rows)) fail("H8 structure drift");
  if (canonicalText(artifact.closure.law.memberSide.assignments) !== canonicalText(derived.lawRows)) fail("closure member-side drift");
  if (artifact.closure.law.matchingSide.equalizingCount !== 1 ||
      canonicalText(artifact.closure.law.matchingSide.equalizing) !== canonicalText(derived.solutions[0]) ||
      artifact.closure.law.matchingSide.enumerationSize !== 16) fail("closure matching-side drift");
  if (canonicalText(artifact.closure.rotationCensus.perSatellite) !== canonicalText(derived.rotationCensus) ||
      artifact.closure.rotationCensus.totalHits !== 0) fail("rotation census drift");
  const pcSumMember = artifact.closure.battery.members.find((member) => member.member === "pcSum");
  const numericMember = artifact.closure.battery.members.find((member) => member.member === "maskNumeric");
  if (!pcSumMember || !numericMember) fail("battery member missing");
  if (canonicalText(pcSumMember.assignments) !== canonicalText(derived.batteryRows[0].assignments) ||
      pcSumMember.agrees !== true ||
      canonicalText(numericMember.assignments) !== canonicalText(derived.batteryRows[1].assignments) ||
      numericMember.agrees !== true) fail("battery assignments drift");
  const kappaMember = artifact.closure.battery.members.find((member) => member.member === "kappa");
  const controlMember = artifact.closure.battery.members.find((member) => member.member === "containment");
  if (kappaMember?.result !== "undecided_orientation_relative" || controlMember?.result !== "control_inapplicable") {
    fail("battery ancillary members drift");
  }
  if (canonicalText(artifact.closure.officeSum6.perPair) !== canonicalText(derived.officeSumRows) ||
      artifact.closure.officeSum6.inducedFromPlacedPairs !== 12 ||
      artifact.closure.officeSum6.predictionConfirmed !== 2) fail("officeSum-6 drift");
  if (canonicalText(artifact.closure.emergentCount.perParent) !== canonicalText(derived.emergentRows) ||
      artifact.closure.emergentCount.commonValue !== 4) fail("emergent count drift");

  // direction
  if (artifact.direction.uniqueHub.resolved !== derived.hubResolved ||
      canonicalText(artifact.direction.uniqueHub.perSatellite) !== canonicalText(derived.hubRows)) fail("unique-hub drift");
  if (canonicalText(artifact.direction.icAxis.parentIc) !== canonicalText(derived.parentIc)) fail("parent IC drift");
  const icClasses = [...derived.satelliteIc].map(([vector, count]) => ({ vector: JSON.parse(vector), count }))
    .sort((left, right) => cmp(canonicalText(left.vector), canonicalText(right.vector)));
  if (canonicalText(artifact.direction.icAxis.satelliteIcClasses) !== canonicalText(icClasses) ||
      artifact.direction.icAxis.distinguishableEdges !== 28) fail("IC classes drift");
  if (canonicalText(artifact.direction.canonicalClass.sourceClasses) !== canonicalText(derived.sourceClasses) ||
      canonicalText(artifact.direction.canonicalClass.targetClasses) !== canonicalText(derived.targetClasses)) {
    fail("class block drift");
  }

  // mechanism
  const perOffice = derived.parentMasks.map((parent) => ({
    parent: String(parent),
    center1: derived.officeAlignment.find((row) => Number(row.source) === parent).derivedCenter1,
    satellites: derived.derivedPairs.filter((row) => Number(row.source) === parent).map((row) => row.target)
      .sort((left, right) => cmp(Number(left), Number(right))),
    h2Count: derived.perParentReach.find((row) => Number(row.parent) === parent).count,
    closureCount: derived.lawRows.filter((row) => Number(row.parent) === parent).length,
  }));
  if (canonicalText(artifact.mechanism.perOffice) !== canonicalText(perOffice)) fail("mechanism perOffice drift");
  if (artifact.mechanism.gsl.signAgreement !== 28) fail("mechanism GSL summary drift");
  const gslOffice = derived.gslPerOffice.map((row, index) => ({ parent: perOffice[index].parent, ...row }));
  if (canonicalText(artifact.mechanism.gsl.perOffice) !== canonicalText(gslOffice)) fail("mechanism GSL perOffice drift");

  // coverage
  if (artifact.coverage.derivedCount !== 28 || artifact.coverage.grantedCount !== 28 || artifact.coverage.setEqual !== true ||
      !Array.isArray(artifact.coverage.missing) || artifact.coverage.missing.length !== 0 ||
      !Array.isArray(artifact.coverage.extra) || artifact.coverage.extra.length !== 0) fail("coverage counts drift");
  if (canonicalText(artifact.coverage.perParent) !== canonicalText(derived.perParentCoverage)) fail("coverage perParent drift");
  if (artifact.coverage.officeAlignment.matchesKappa1 !== 28 || artifact.coverage.officeAlignment.matchesKappa0 !== 4 ||
      canonicalText(artifact.coverage.officeAlignment.perEdge) !== canonicalText(derived.officeAlignment)) {
    fail("office alignment drift");
  }

  // reflection
  if (artifact.reflection.edgeSetInvariant !== true || !artifact.reflection.carried.includes("BL-065")) fail("reflection claims drift");
  const kappa1Centers = derived.parentMasks.map((mask) => ({ mask: String(mask), center: derived.officeAlignment.find((row) => Number(row.source) === mask).derivedCenter1 }));
  const kappa0Centers = derived.parentMasks.map((mask) => ({ mask: String(mask), center: derived.officeAlignment.find((row) => Number(row.source) === mask).derivedCenter0 }));
  if (canonicalText(artifact.reflection.kappa1Centers) !== canonicalText(kappa1Centers) ||
      canonicalText(artifact.reflection.kappa0Centers) !== canonicalText(kappa0Centers)) fail("reflection centers drift");

  // gates and synthesis
  for (const key of ["V-P3-1", "V-P3-2", "V-P3-3", "V-P3-4", "V-P3-5"]) {
    if (artifact.gates[key]?.result !== "PASS") fail(`gate ${key} not PASS`);
  }
  if (artifact.synthesis.verdict !== "R_EDGES_DERIVED") fail("synthesis verdict drift");
  if (canonicalText(artifact.synthesis.preRegisteredVerdicts) !== canonicalText(["R_EDGES_DERIVED", "R_EDGES_PARTIAL", "R_EDGES_FAILED"])) {
    fail("pre-registered verdict list drift");
  }
  if (!artifact.synthesis.grantDischarge.discharged.includes("28-edge") ||
      !artifact.synthesis.grantDischarge.remaining.includes("orientation") ||
      artifact.synthesis.bitInventory.carried.length !== 1 ||
      artifact.synthesis.bitInventory.dissolved.length !== 1) fail("grant discharge / bit inventory drift");
  if (!artifact.synthesis.higherTheorem.answer.includes("affirmative") ||
      !artifact.synthesis.higherTheorem.label.includes("finding, not admission")) fail("higher theorem block drift");
  if (!artifact.synthesis.dependencyChain.position.includes("phase 3 of 4") ||
      !artifact.synthesis.dependencyChain.necessaryNotSufficient.includes("necessary-not-sufficient")) {
    fail("dependency chain drift");
  }
  if (artifact.synthesis.limits.length !== 4) fail("synthesis limits drift");
  if (artifact.accounting.tiers.remainingGranted.length !== 3) fail("accounting tiers drift");

  // fences
  if (!artifact.fences.higherTheorem.includes("finding") || artifact.fences.g1Intra330 !== "untouched" ||
      !artifact.fences.direction.includes("unassigned") || !artifact.fences.membrane.includes("never design input") ||
      !artifact.fences.orientationBit.includes("BL-065") || !artifact.fences.governsVerdicts.includes("not a GOVERNS admission")) {
    fail("fence drift");
  }
  if (artifact.contractCitations.filter((citation) => citation.includes("bl-059-governs-derivability")).length !== 1 ||
      artifact.contractCitations.filter((citation) => citation.includes("bl-063-office-reconstruction-memo")).length !== 1 ||
      artifact.contractCitations.filter((citation) => citation.includes("bl-064-cycle-ground-memo")).length !== 1) {
    fail("contract citation drift");
  }
  if (artifact.notAccomplished.length !== 8) fail("notAccomplished inventory drift");
}

function validate() {
  const artifact = readJson(ARTIFACT_PATH);
  const sources = {
    generation: readJson(GENERATION_PATH),
    ledgerRows: readJson(LEDGER_PATH),
    bl064: readJson(BL064_PATH),
    bl063: readJson(BL063_PATH),
    bipartite: readJson(BIPARTITE_PATH),
  };
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

  const reachDrift = clone(artifact);
  reachDrift.reach.perParent[0].satellites = reachDrift.reach.perParent[0].satellites.slice(0, 3);
  expectRejection("reach member dropped", reachDrift);
  const closureSwap = clone(artifact);
  closureSwap.closure.law.memberSide.assignments[0].parent = "1749";
  expectRejection("closure swap 695/3497", closureSwap);
  const matchingDrift = clone(artifact);
  matchingDrift.closure.law.matchingSide.equalizingCount = 2;
  expectRejection("equalizing matching count drift", matchingDrift);
  const h8Drift = clone(artifact);
  h8Drift.closure.h8Structure.perSatellite[0].candidates[0].reach += 1;
  expectRejection("H8 candidate reach drift", h8Drift);
  const batteryFlip = clone(artifact);
  batteryFlip.closure.battery.members.find((member) => member.member === "pcSum").agrees = false;
  expectRejection("battery agreement flip", batteryFlip);
  const rotationDrift = clone(artifact);
  rotationDrift.closure.rotationCensus.perSatellite[0].hits.push({ parent: "1389", shift: 2 });
  expectRejection("rotation hit injected", rotationDrift);
  const emergentDrift = clone(artifact);
  emergentDrift.closure.emergentCount.perParent[0].after = 3;
  expectRejection("emergent count drift", emergentDrift);
  const sumDrift = clone(artifact);
  sumDrift.closure.officeSum6.predictionConfirmed = 1;
  expectRejection("officeSum prediction drift", sumDrift);
  const hubDrift = clone(artifact);
  hubDrift.direction.uniqueHub.resolved = 25;
  expectRejection("unique-hub drift", hubDrift);
  const icDrift = clone(artifact);
  icDrift.direction.icAxis.satelliteIcClasses[0].count = 13;
  expectRejection("IC count drift", icDrift);
  const coverageDrift = clone(artifact);
  coverageDrift.coverage.perParent[0].granted = ["1243", "1339", "2395", "1627"];
  expectRejection("coverage drift", coverageDrift);
  const alignmentDrift = clone(artifact);
  alignmentDrift.coverage.officeAlignment.matchesKappa1 = 27;
  expectRejection("office alignment drift", alignmentDrift);
  const reflectionDrift = clone(artifact);
  reflectionDrift.reflection.kappa0Centers[0].center = 5;
  expectRejection("reflection center drift", reflectionDrift);
  const robustnessDrift = clone(artifact);
  robustnessDrift.reach.robustness.placedAgreement = "23/24";
  expectRejection("robustness drift", robustnessDrift);
  const gslDrift = clone(artifact);
  gslDrift.mechanism.gsl.signAgreement = 27;
  expectRejection("GSL drift", gslDrift);
  const domainDrift = clone(artifact);
  domainDrift.domain.satelliteCensus.count = 27;
  expectRejection("domain census drift", domainDrift);
  const kappaDrift = clone(artifact);
  kappaDrift.kappaConsumed.kappa1 = kappaDrift.kappaConsumed.kappa1.map((row) => ({ mask: row.mask, index: 6 - row.index }));
  expectRejection("kappa orientation drift", kappaDrift);

  // generator static probes (two-sided isolation)
  let officeSmuggleRejected = false;
  try {
    staticIntrinsicCheck(generatorSource.replace(
      "function maskOfRow(row) {",
      "function maskOfRow(row) { const smuggled = row.officeIndex; void smuggled;",
    ));
  } catch {
    officeSmuggleRejected = true;
  }
  if (!officeSmuggleRejected) fail("mutation probe not rejected: smuggled officeIndex read");

  let rSmuggleRejected = false;
  try {
    staticIntrinsicCheck(generatorSource.replace(
      "export function deriveDomain(ledgerRows) {",
      "export function deriveDomain(ledgerRows) { const smuggled = ledgerRows.projection.R; void smuggled;",
    ));
  } catch {
    rSmuggleRejected = true;
  }
  if (!rSmuggleRejected) fail("mutation probe not rejected: smuggled R read");

  let forteSmuggleRejected = false;
  try {
    staticIntrinsicCheck(generatorSource.replace(
      "export function deriveDomain(ledgerRows) {",
      "export function deriveDomain(ledgerRows) { const smuggled = ledgerRows.forte; void smuggled;",
    ));
  } catch {
    forteSmuggleRejected = true;
  }
  if (!forteSmuggleRejected) fail("mutation probe not rejected: smuggled forte read");

  const presenceProbes = [
    ["pitchSet", "pitchsets"],
    ["hamming12", "hammer12"],
    ["rotateMask12", "rot12"],
    ["ledgerRows", "rowsInput"],
    ["maskOfRow", "maskOfLedgerRowX"],
  ];
  for (const [token, replacement] of presenceProbes) {
    let presenceRejected = false;
    try {
      staticIntrinsicCheck(generatorSource.split(token).join(replacement));
    } catch {
      presenceRejected = true;
    }
    if (!presenceRejected) fail(`presence probe not rejected: ${token}`);
  }

  const artifactProbes = [
    "reach member dropped", "closure swap 695/3497", "equalizing matching count drift",
    "H8 candidate reach drift", "battery agreement flip", "rotation hit injected",
    "emergent count drift", "officeSum prediction drift", "unique-hub drift", "IC count drift",
    "coverage drift", "office alignment drift", "reflection center drift", "robustness drift",
    "GSL drift", "domain census drift", "kappa orientation drift",
  ];
  const generatorProbes = [
    "smuggled officeIndex read", "smuggled R read", "smuggled forte read",
    "presence pitchSet", "presence hamming12", "presence rotateMask12", "presence ledgerRows", "presence maskOfRow",
  ];
  console.log(JSON.stringify({
    artifact: ARTIFACT_PATH,
    status: "PASS",
    derivationFingerprint: artifact.derivationFingerprint,
    chainFingerprint: artifact.base.derivationFingerprint,
    domain: `${artifact.domain.parentCensus.count} parents / ${artifact.domain.satelliteCensus.count} satellites`,
    reach: `${artifact.reach.census.placed} placed / ${artifact.reach.census.unplaced} unplaced`,
    closure: `${artifact.closure.law.matchingSide.equalizingCount} equalizing matching, battery members ${artifact.closure.battery.members.length}`,
    coverage: { derived: artifact.coverage.derivedCount, granted: artifact.coverage.grantedCount, setEqual: artifact.coverage.setEqual },
    emergentCount: artifact.closure.emergentCount.commonValue,
    verdict: artifact.synthesis.verdict,
    mutationProbes: artifactProbes.length + generatorProbes.length,
  }, null, 2));
}

validate();
