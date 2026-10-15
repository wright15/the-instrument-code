#!/usr/bin/env node
/**
 * Validate the generated BL-089 anchoring-remainder interaction probe against
 * its sources.
 *
 * Independent of the generator: re-reads the 462-record ledger, the network,
 * the chain artifacts (BL-063/068/070/076/078, the d-tier operator probe,
 * BL-073) and re-derives the office-carrying anchor-satellite Hamming-2 census,
 * the kappa orientation constant, the predicted and landed office fields, the
 * tier-block table, the anchor-set profiles, the family transports and the
 * OP-AR-4 comparisons - each through its own data flow. Re-checks the artifact
 * fingerprint; statically verifies the generator's region-scoped isolation
 * (office bytes absent from the intrinsic region and the pre-region text; the
 * comparison region carries the office and recorded-relation reads - the
 * region-scoping proof; a permissive probe passes; a proof-strip probe is
 * rejected); and runs mutation probes (artifact drift, smuggled reads,
 * presence-strip). Fail-loud.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { midZ7 } from "../../scripts/d4-derivation-engine.mjs";
import {
  deriveP7,
  deriveKappa,
  derivePi,
  deriveMidpoints,
} from "../../scripts/build-bl063-office-reconstruction.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/bl089-anchoring-remainder-interaction.v1.json";
const GENERATOR_PATH = "scripts/build-bl089-anchoring-remainder-interaction.mjs";
const SCHEMA_VERSION = "harmonic-orrery.bl089-anchoring-remainder-interaction.v1";
const INVESTIGATION_ID = "BL089_ANCHORING_REMAINDER_INTERACTION_V1";
const LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";
const NETWORK_PATH = "canonical/universal-network-data.json";
const BIPARTITE_PATH = "derived/hypergraph/bipartite-inclusion-v1.json";
const BL063_PATH = "orrery/src/generated/bl063-office-reconstruction.v1.json";
const BL068_PATH = "orrery/src/generated/bl068-d7-asymmetry.v1.json";
const BL070_PATH = "orrery/src/generated/bl070-d7-derivation.v1.json";
const BL078_PATH = "orrery/src/generated/bl078-d7-retest.v1.json";
const BL076_PATH = "orrery/src/generated/bl076-bijection-probe.v1.json";
const PROBE_PATH = "orrery/src/generated/d-tier-operator-probe.v1.json";
const BL073_PATH = "orrery/src/generated/bl073-isometry-probe.v1.json";

const TIER_ORDER = ["A0", "A1", "A2", "D1", "D2", "D3", "D4", "D5", "D6", "D7"];
const MAP_ORDER = ["T1", "T2", "RHO"];
const MAP_UNITS = { T1: 5, T2: 7, RHO: 11 };
const ANCHOR_FAMILIES = ["7-35", "7-34", "7-33", "7-22", "7-15", "7-Z37", "7-Z17", "7-Z12", "7-8", "7-1"];

function fail(message) {
  throw new Error(`INVALID_BL089_ANCHORING_REMAINDER_INTERACTION: ${message}`);
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

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = [];
    let current = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (quoted) {
        if (char === '"' && line[index + 1] === '"') { current += '"'; index += 1; }
        else if (char === '"') quoted = false;
        else current += char;
      } else if (char === '"') quoted = true;
      else if (char === ",") { cells.push(current); current = ""; }
      else current += char;
    }
    cells.push(current);
    return Object.fromEntries(header.map((key, index) => [key, cells[index] ?? ""]));
  });
}

function parsePitchSet(text) {
  return text.replace(/[{}]/g, "").split(",").map((entry) => Number(entry.trim()));
}

function cmp(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function maskOfPitches(pitches) {
  let mask = 0;
  for (const pitch of pitches) mask |= 1 << pitch;
  return mask;
}

function pcSum(mask) {
  let sum = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) if ((mask >> pitch) & 1) sum += pitch;
  return sum;
}

function hamming(a, b) {
  let x = a ^ b;
  let count = 0;
  while (x !== 0) { count += x & 1; x >>= 1; }
  return count;
}

function affineImage(mask, unit) {
  let image = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) {
    if ((mask >> pitch) & 1) image |= 1 << ((((unit * pitch) % 12) + 12) % 12);
  }
  return image & 4095;
}

function exactnessClass(agree, n) {
  if (agree === n) return "EXACT";
  if (agree === 0) return "DEGENERATE";
  if (agree * 6 >= n * 5 && agree < n) return "NEAR_EXACT";
  return "PARTIAL";
}

function sortKeyAscending(left, right) {
  const [la, ls] = left.split(":").map(Number);
  const [ra, rs] = right.split(":").map(Number);
  return la - ra || ls - rs;
}

function fingerprintOf(artifact, key) {
  const { [key]: fingerprint, ...core } = artifact;
  if (sha256(canonicalText(core)) !== fingerprint) fail(`${key} self-check failed`);
  return fingerprint;
}

// ---------------------------------------------------------------------------
// Independent re-derivation
// ---------------------------------------------------------------------------

function reDerive() {
  const ledgerRows = parseCsv(read(LEDGER_PATH));
  const network = readJson(NETWORK_PATH);
  if (ledgerRows.length !== 462) fail(`ledger census drift: ${ledgerRows.length}`);

  const masks = new Map();
  const rowById = new Map();
  for (const row of ledgerRows) {
    const mask = maskOfPitches(parsePitchSet(row.pitchSet));
    if (mask !== Number(row.id)) fail(`mask/id disagreement at ${row.id}`);
    masks.set(String(row.id), mask);
    rowById.set(String(row.id), row);
  }

  // governing structure (independent pass)
  const parentOf = new Map();
  const constructorsOf = new Map();
  for (const edge of network.structuralEdges) {
    const source = String(edge.source);
    const target = String(edge.target);
    if (edge.type === "GOVERNS") parentOf.set(target, source);
    else if (edge.type === "CONSTRUCTS") {
      const list = constructorsOf.get(target) ?? [];
      list.push(source);
      constructorsOf.set(target, list);
    }
  }
  if (parentOf.size !== 238) fail("governing census drift");

  // census by tier pair (independent grouping)
  const anchors = ledgerRows.filter((row) => row.role === "anchor");
  const satellites = ledgerRows.filter((row) => row.role === "satellite");
  const anchorByTier = new Map(TIER_ORDER.map((tier) => [tier, []]));
  for (const row of anchors) anchorByTier.get(row.tier).push(String(row.id));
  const satelliteByTier = new Map(TIER_ORDER.map((tier) => [tier, []]));
  for (const row of satellites) satelliteByTier.get(row.tier).push(String(row.id));
  const blockKeys = [];
  const blockInstances = new Map();
  let instances = 0;
  for (const anchorTier of TIER_ORDER) {
    for (const satelliteTier of TIER_ORDER) {
      const list = [];
      for (const anchor of anchorByTier.get(anchorTier)) {
        for (const satellite of satelliteByTier.get(satelliteTier)) {
          if (hamming(masks.get(anchor), masks.get(satellite)) === 2) {
            list.push(`${anchor}:${satellite}`);
            instances += 1;
          }
        }
      }
      if (list.length > 0) {
        blockKeys.push(`${anchorTier}x${satelliteTier}`);
        blockInstances.set(`${anchorTier}x${satelliteTier}`, list);
      }
    }
  }
  if (instances !== 1128) fail(`census instance drift: ${instances}`);
  if (blockKeys.length !== 57) fail(`block census drift: ${blockKeys.length}`);

  // kappa inputs
  const a0Rows = anchors.filter((row) => row.tier === "A0").sort((left, right) => Number(left.id) - Number(right.id));
  const a1Rows = anchors.filter((row) => row.tier === "A1").sort((left, right) => Number(left.id) - Number(right.id));
  const a0Masks = a0Rows.map((row) => masks.get(String(row.id))).sort((left, right) => left - right);
  const a1Masks = a1Rows.map((row) => masks.get(String(row.id))).sort((left, right) => left - right);
  const p7 = deriveP7(a0Masks);
  const kappa = deriveKappa(p7);
  const piEntries = a1Masks.map((mask) => derivePi(mask, p7));
  const midpoints = piEntries.map((entry) => deriveMidpoints(entry, kappa));
  const cValues = [
    ...a0Masks.map((mask) => (kappa.kappa1.get(mask) + pcSum(mask)) % 7),
    ...a1Masks.map((mask, index) => (midpoints[index].g1 + pcSum(mask)) % 7),
  ];
  const C = [...new Set(cValues)][0];
  if ([...new Set(cValues)].length !== 1) fail("kappa orientation constant not unique");

  // fields
  const landedOfficeOf = new Map();
  for (const row of ledgerRows) {
    if (row.officeIndex !== "") landedOfficeOf.set(String(row.id), Number(row.officeIndex));
  }
  if (landedOfficeOf.size !== 308) fail("office support drift");
  const predictedOfficeOf = new Map();
  for (const row of anchors) predictedOfficeOf.set(String(row.id), (C - pcSum(masks.get(String(row.id))) + 70) % 7);
  for (const row of satellites) {
    const parent = parentOf.get(String(row.id));
    predictedOfficeOf.set(String(row.id), predictedOfficeOf.get(parent));
  }

  // block tables
  const tableFor = (officeOf) => blockKeys.map((key) => {
    const list = blockInstances.get(key);
    let agree = 0;
    for (const instanceKey of list) {
      const [anchor, satellite] = instanceKey.split(":");
      if (officeOf.get(anchor) === officeOf.get(satellite)) agree += 1;
    }
    return { key, n: list.length, agree, class: exactnessClass(agree, list.length) };
  });
  const landedTable = tableFor(landedOfficeOf);
  const predictedTable = tableFor(predictedOfficeOf);
  const landedAgree = landedTable.reduce((sum, entry) => sum + entry.agree, 0);
  if (landedAgree !== 340) fail(`agreement total drift: ${landedAgree}`);
  const aggregate = {
    instances,
    agree: landedAgree,
    blocks: blockKeys.length,
    exact: landedTable.filter((entry) => entry.class === "EXACT").length,
    degenerate: landedTable.filter((entry) => entry.class === "DEGENERATE").length,
    nearExact: landedTable.filter((entry) => entry.class === "NEAR_EXACT").length,
    partial: landedTable.filter((entry) => entry.class === "PARTIAL").length,
  };
  const blockMismatches = landedTable.filter((entry, index) => canonicalText(entry) !== canonicalText(predictedTable[index])).map((entry) => entry.key);
  const fieldMismatches = [...predictedOfficeOf.keys()].filter((id) => predictedOfficeOf.get(id) !== landedOfficeOf.get(id));

  // anchor-set profiles (independent)
  const sets = {};
  for (const tier of ["A0", "A1"]) {
    let n = 0;
    let agree = 0;
    for (const [key, list] of blockInstances.entries()) {
      if (!key.startsWith(`${tier}x`)) continue;
      n += list.length;
      for (const instanceKey of list) {
        const [anchor, satellite] = instanceKey.split(":");
        if (landedOfficeOf.get(anchor) === landedOfficeOf.get(satellite)) agree += 1;
      }
    }
    sets[tier] = { n, agree };
  }
  if (sets.A0.n !== 96 || sets.A0.agree !== 42 || sets.A1.n !== 132 || sets.A1.agree !== 34) fail("anchor-set profile drift");

  // transports (independent implementation)
  const byMask = new Map([...masks.entries()].map(([id, mask]) => [mask, id]));
  const transportFor = (mapId, officeOf) => {
    const unit = MAP_UNITS[mapId];
    const perFamily = new Map();
    for (const row of ledgerRows) {
      if (row.role === "boundary") continue;
      const imageId = byMask.get(affineImage(masks.get(String(row.id)), unit));
      const imageRow = rowById.get(imageId);
      if (!imageRow || imageRow.role === "boundary") continue;
      const key = `${row.role}:${row.forte}`;
      if (!perFamily.has(key)) perFamily.set(key, []);
      perFamily.get(key).push([officeOf.get(String(row.id)), officeOf.get(imageId)]);
    }
    return perFamily;
  };
  const transportSummary = (mapId, officeOf) => {
    const perFamily = transportFor(mapId, officeOf);
    const result = new Map();
    for (const [key, pairs] of perFamily.entries()) {
      const images = new Map();
      for (const [source, target] of pairs) {
        if (!images.has(source)) images.set(source, new Set());
        images.get(source).add(target);
      }
      const fragments = [...images.values()].filter((targets) => targets.size > 1).length;
      result.set(key, { fragments, wellDefined: fragments === 0 });
    }
    return result;
  };
  const anchorFamilyWellDefined = {};
  for (const mapId of MAP_ORDER) {
    const summary = transportSummary(mapId, landedOfficeOf);
    anchorFamilyWellDefined[mapId] = ANCHOR_FAMILIES.map((family) => summary.get(`anchor:${family}`).wellDefined);
  }
  const satelliteFragmentCount = MAP_ORDER.reduce((sum, mapId) => {
    const summary = transportSummary(mapId, landedOfficeOf);
    return sum + [...summary.entries()].filter(([key, value]) => key.startsWith("satellite:") && !value.wellDefined).length;
  }, 0);
  if (satelliteFragmentCount !== 14) fail(`satellite fragment loci drift: ${satelliteFragmentCount}`);

  // family action cross-check vs BL-076 (independent)
  const bl076 = readJson(BL076_PATH);
  let familyRows = 0;
  for (const mapId of MAP_ORDER) {
    const unit = MAP_UNITS[mapId];
    for (const entry of bl076.probe.familyPermutation[mapId]) {
      const sourceRows = ledgerRows.filter((row) => row.role === "anchor" && row.forte === entry.sourceFamily);
      if (sourceRows.length !== 7) fail(`anchor family census drift: ${entry.sourceFamily}`);
      const imageFamilies = new Set(sourceRows.map((row) => rowById.get(byMask.get(affineImage(masks.get(String(row.id)), unit))).forte));
      if (imageFamilies.size !== 1 || !imageFamilies.has(entry.imageFamily)) fail(`family cross-check drift: ${mapId} ${entry.sourceFamily}`);
      familyRows += 1;
    }
  }
  if (familyRows !== 30) fail("family cross-check census drift");

  // sanity gate
  const contactSet = new Set(network.d7SeatContactRows.map((row) => `${row.target}:${row.source}`));
  const sanityKeys = blockInstances.get("D7xD6").slice().sort(sortKeyAscending);
  if (sanityKeys.length !== 36 || contactSet.size !== 14) fail("sanity gate census drift");
  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (const key of sanityKeys) {
    const [anchor, satellite] = key.split(":");
    const predicted = landedOfficeOf.get(anchor) === landedOfficeOf.get(satellite);
    const actual = contactSet.has(key);
    if (actual && predicted) tp += 1;
    else if (actual && !predicted) fn += 1;
    else if (!actual && predicted) fp += 1;
    else tn += 1;
  }
  const sanityConfusion = { tp, fp, fn, tn };
  if (canonicalText(sanityConfusion) !== canonicalText({ tp: 14, fp: 0, fn: 0, tn: 22 })) fail("sanity confusion drift");

  // attachment histogram
  const deltaHistogram = {};
  for (const row of satellites) {
    const parent = parentOf.get(String(row.id));
    const delta = pcSum(masks.get(String(row.id))) - pcSum(masks.get(parent));
    deltaHistogram[String(delta)] = (deltaHistogram[String(delta)] ?? 0) + 1;
  }

  // A2 midpoint
  let a2Matches = 0;
  let a2Total = 0;
  for (const [child, constructorList] of constructorsOf.entries()) {
    const childRow = rowById.get(child);
    if (!childRow || childRow.tier !== "A2") continue;
    const predicted = Number(midZ7(BigInt(landedOfficeOf.get(constructorList[0])), BigInt(landedOfficeOf.get(constructorList[1]))));
    if (predicted === landedOfficeOf.get(child)) a2Matches += 1;
    a2Total += 1;
  }
  if (a2Matches !== 7 || a2Total !== 7) fail("A2 midpoint drift");

  // orbit law
  const probe = readJson(PROBE_PATH);
  const orbitOrders = [
    ...probe.modalClosure.aToA.cycles.map((cycle) => ({ tier: cycle.tier, order: cycle.stateIds.map(String) })),
    ...probe.modalClosure.dToD.cycles.map((cycle) => ({ tier: cycle.tier, order: cycle.stateIds.map(String) })),
  ];
  if (orbitOrders.length !== 10) fail("orbit census drift");
  for (const cycle of orbitOrders) {
    for (let index = 0; index < cycle.order.length; index += 1) {
      const state = cycle.order[index];
      const next = cycle.order[(index + 1) % cycle.order.length];
      if (((landedOfficeOf.get(next) - landedOfficeOf.get(state)) + 14) % 7 !== 2) fail(`orbit law drift at ${cycle.tier}`);
    }
  }

  return {
    C,
    blockKeys,
    tableFor,
    landedTable,
    predictedTable,
    aggregate,
    blockMismatches,
    fieldMismatches,
    sets,
    sanityConfusion,
    deltaHistogram,
    a2Matches,
    anchorFamilyWellDefined,
    satelliteFragmentCount,
    predictedTotal: [...predictedOfficeOf.keys()].filter((id) => predictedOfficeOf.get(id) === landedOfficeOf.get(id)).length,
  };
}

// ---------------------------------------------------------------------------
// Artifact checks
// ---------------------------------------------------------------------------

function checkAgainstSources(artifact, derived) {
  const {
    C, blockKeys, landedTable, predictedTable, aggregate, blockMismatches, fieldMismatches,
    sets, sanityConfusion, deltaHistogram, a2Matches, anchorFamilyWellDefined, satelliteFragmentCount, predictedTotal,
  } = derived;

  if (artifact.schemaVersion !== SCHEMA_VERSION || artifact.investigationId !== INVESTIGATION_ID) fail("artifact header drift");
  if (artifact.status !== "planning_evidence") fail("status drift");
  if (artifact.generator !== GENERATOR_PATH) fail("generator path drift");

  // source bindings
  for (const binding of artifact.sourceBindings) {
    if (binding.sha256 !== fileSha(binding.artifact)) fail(`source binding sha drift: ${binding.artifact}`);
  }
  const bindingPaths = artifact.sourceBindings.map((binding) => binding.artifact).sort(cmp);
  if (canonicalText(bindingPaths) !== canonicalText([
    LEDGER_PATH, NETWORK_PATH, BIPARTITE_PATH, BL063_PATH, BL068_PATH, BL070_PATH, BL078_PATH, BL076_PATH, PROBE_PATH, BL073_PATH,
  ].sort(cmp))) fail("source binding set drift");

  // chain fingerprints (recomputed from the landed artifacts)
  const chain = artifact.base.chainFingerprints;
  const expectedChain = {
    bl063: fingerprintOf(readJson(BL063_PATH), "reconstructionFingerprint"),
    bl068: fingerprintOf(readJson(BL068_PATH), "derivationFingerprint"),
    bl070: fingerprintOf(readJson(BL070_PATH), "derivationFingerprint"),
    bl078: fingerprintOf(readJson(BL078_PATH), "derivationFingerprint"),
    bl076: fingerprintOf(readJson(BL076_PATH), "investigationFingerprint"),
    probe: fingerprintOf(readJson(PROBE_PATH), "probeFingerprint"),
    bl073: fingerprintOf(readJson(BL073_PATH), "investigationFingerprint"),
  };
  for (const key of Object.keys(expectedChain)) {
    if (chain[key] !== expectedChain[key]) fail(`chain fingerprint drift: ${key}`);
  }

  // pre-registration
  const rulingIds = artifact.preRegistration.rulings.map((ruling) => ruling.id);
  if (canonicalText(rulingIds) !== canonicalText(["OD-89-1", "OD-89-2", "OD-89-3", "OD-89-4", "OD-89-5"])) fail("ruling inventory drift");
  const opIds = artifact.preRegistration.operationalizations.map((op) => op.id);
  if (canonicalText(opIds) !== canonicalText(["OP-AR-1", "OP-AR-2", "OP-AR-3", "OP-AR-4"])) fail("operationalization inventory drift");
  if (!artifact.preRegistration.decisionRule.tolerance.includes("zero mismatches")) fail("tolerance drift");
  if (canonicalText(artifact.preRegistration.decisionRule.verdictClasses) !== canonicalText(["INTERACTION_DERIVED", "INTERACTION_REMAINDER", "INTERACTION_MIXED"])) fail("verdict class drift");
  if (!artifact.preRegistration.decisionRule.exactnessPredicate.includes("EXACT")) fail("exactness predicate drift");

  // sanity gate
  if (canonicalText(artifact.sanityGate.confusion) !== canonicalText(sanityConfusion)) fail("sanity gate confusion drift");
  if (artifact.sanityGate.verdict !== "EXACT" || artifact.sanityGate.seatContactSetEquality !== true) fail("sanity gate flags drift");
  if (artifact.sanityGate.instances !== 36 || artifact.sanityGate.agreement !== 14) fail("sanity gate census drift");

  // office field
  if (artifact.officeField.orientationConstant.C !== C) fail("orientation constant drift");
  if (artifact.officeField.anchorRule.matches !== 70 || artifact.officeField.anchorRule.mismatches !== 0) fail("anchor rule census drift");
  if (artifact.officeField.satelliteRule.matches !== 238 || artifact.officeField.satelliteRule.mismatches !== 0) fail("satellite rule census drift");
  if (canonicalText(artifact.officeField.satelliteRule.pcSumDeltaHistogram) !== canonicalText(deltaHistogram)) fail("attachment histogram drift");
  if (artifact.officeField.midpointExtension.matches !== 7 || artifact.officeField.midpointExtension.mismatches !== 0) fail("A2 midpoint drift");
  if (artifact.officeField.support.officeCarrying !== 308 || artifact.officeField.support.withheld !== 154) fail("support census drift");
  if (artifact.officeField.orbitStepLaw.tiers.length !== 10 || artifact.officeField.orbitStepLaw.holds !== true) fail("orbit law drift");

  // census
  if (artifact.census.blocks !== 57 || artifact.census.instances !== 1128) fail("census drift");
  if (canonicalText(artifact.census.blockKeyOrder) !== canonicalText(blockKeys)) fail("block key order drift");

  // OP-AR-1
  if (artifact.opAR1.blocks.length !== landedTable.length) fail("block table length drift");
  for (let index = 0; index < landedTable.length; index += 1) {
    const block = artifact.opAR1.blocks[index];
    const expected = landedTable[index];
    if (`${block.anchorTier}x${block.satelliteTier}` !== expected.key) fail(`block identity drift at ${index}`);
    if (block.n !== expected.n || block.agree !== expected.agree || block.class !== expected.class) fail(`block content drift at ${expected.key}`);
    if (block.rate !== `${expected.agree}/${expected.n}`) fail(`block rate drift at ${expected.key}`);
  }
  if (canonicalText(artifact.opAR1.aggregate) !== canonicalText(aggregate)) fail("aggregate drift");

  // OP-AR-2
  const a0 = artifact.opAR2.sets.A0;
  const a1 = artifact.opAR2.sets.A1;
  if (a0.census.instances !== sets.A0.n || a0.census.agree !== sets.A0.agree) fail("A0 profile drift");
  if (a1.census.instances !== sets.A1.n || a1.census.agree !== sets.A1.agree) fail("A1 profile drift");
  if (a0.reconstruction.matches !== 7 || a0.reconstruction.mismatches !== 0) fail("A0 reconstruction drift");
  if (a1.reconstruction.matches !== 7 || a1.reconstruction.mismatches !== 0) fail("A1 reconstruction drift");
  if (artifact.opAR2.dependence.reconstructionExactBoth !== true) fail("reconstruction-exactness flag drift");
  if (artifact.opAR2.dependence.verdict !== "ANCHOR_SET_DEPENDENT") fail("dependence verdict drift");
  if (artifact.opAR2.dependence.ownTierClasses.A0.class !== "PARTIAL" || artifact.opAR2.dependence.ownTierClasses.A1.class !== "EXACT") fail("own-tier class drift");
  const affinity = artifact.opAR2.dependence.transportAffinity;
  if (affinity.T1["A0->7-1"].affine !== true || affinity.T1["A1->7-8"].affine !== false) fail("T1 affinity drift");
  if (affinity.T2["A0->7-1"].affine !== true || affinity.T2["A1->7-8"].affine !== false) fail("T2 affinity drift");

  // OP-AR-3
  if (artifact.opAR3.anchorFamiliesConstant !== true) fail("anchor-family constancy flag drift");
  if (artifact.opAR3.anchorFamilyChecks.length !== 30 || artifact.opAR3.anchorFamilyChecks.some((entry) => !entry.wellDefined || !entry.wholePermutation || !entry.fixesOfficeThree)) {
    fail("anchor-family transport check drift");
  }
  for (const mapId of MAP_ORDER) {
    const expected = anchorFamilyWellDefined[mapId];
    const actual = ANCHOR_FAMILIES.map((family) => artifact.opAR3.anchorFamilyChecks
      .find((entry) => entry.mapId === mapId && entry.family === family).wellDefined);
    if (canonicalText(actual) !== canonicalText(expected)) fail(`anchor-family well-definedness drift: ${mapId}`);
  }
  if (artifact.opAR3.satelliteFragmentLoci.length !== satelliteFragmentCount) fail("satellite fragment count drift");

  // OP-AR-4
  if (artifact.opAR4.verdict !== "INTERACTION_DERIVED") fail("OP-AR-4 verdict drift");
  if (artifact.opAR4.comparisons.officeField.mismatches !== 0) fail("office-field mismatches drift");
  if (artifact.opAR4.comparisons.agreementField.mismatches !== 0) fail("agreement-field mismatches drift");
  if (canonicalText(artifact.opAR4.comparisons.opAR1Blocks.mismatches) !== canonicalText(blockMismatches)) fail("OP-AR-1 mismatches drift");
  if (artifact.opAR4.comparisons.opAR2.match !== true || artifact.opAR4.comparisons.opAR3.match !== true) fail("OP-AR-2/3 match flags drift");
  if (predictedTotal !== 308) fail("predicted/landed agreement drift");
  if (blockMismatches.length !== 0 || fieldMismatches.length !== 0) fail("comparison mismatch drift");

  // synthesis + accounting
  if (artifact.synthesis.verdict !== "INTERACTION_DERIVED") fail("synthesis verdict drift");
  if (!artifact.synthesis.remainderStatement.includes("shrinks")) fail("remainder statement drift");
  if (!artifact.synthesis.significance.includes("provenance-independence")) fail("significance statement drift");
  if (!artifact.synthesis.d7Tier.includes("hypothesis-tier")) fail("D7 tier statement drift");
  if (artifact.accounting.masksOnly.length !== 4 || artifact.accounting.canonicalComputation.length !== 5 || artifact.accounting.remainingGranted.length !== 3) {
    fail("accounting tier census drift");
  }
  if (!artifact.accounting.statement.includes("shrinks")) fail("accounting statement drift");
  if (!artifact.accounting.officePathFence.includes("zero office bytes")) fail("office-path fence drift");

  // fences
  if (!artifact.fences.d7HypothesisTier.includes("ENTRY 15")) fail("D7 fence drift");
  if (!artifact.fences.noLeaning.includes("no leaning")) fail("no-leaning fence drift");
  if (!artifact.fences.membrane.includes("never a probe input")) fail("membrane fence drift");
  if (!artifact.fences.sanityHalt.includes("halt")) fail("sanity-halt fence drift");
}

// ---------------------------------------------------------------------------
// Static generator checks (region-scoped)
// ---------------------------------------------------------------------------

function staticIntrinsicCheck(sourceText) {
  const begin = sourceText.indexOf("INTRINSIC-AR-BEGIN");
  const end = sourceText.indexOf("INTRINSIC-AR-END");
  if (begin < 0 || end < 0 || end <= begin) fail("generator intrinsic-region markers missing");
  const before = sourceText.slice(0, begin);
  const region = sourceText.slice(begin, end);
  const comparison = sourceText.slice(end);
  const forbidden = [
    /officeIndex/, /\.office\b/, /parentOffice/, /relationalOffice/,
    /pluralityContactOffice/, /d7SeatContactRows/, /d7AnchorRows/, /d7ModalRows/,
    /officeEqualKeys/, /landedOfficeOf/,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(region)) fail(`generator intrinsic region reads a forbidden input: ${pattern}`);
    if (pattern.test(before)) fail(`forbidden token before the intrinsic region: ${pattern}`);
  }
  // region-scoping proof: the comparison region must carry the office reads,
  // so a file-scoped scan (over-banning the whole file) is rejected.
  if (!/officeIndex/.test(comparison)) fail("region-scoping proof failed: the comparison region does not read the office index");
  if (!/d7SeatContactRows/.test(comparison)) fail("region-scoping proof failed: the comparison region does not read the network records");
  const required = ["ledgerRows", "pitchSet", "hamming12", "maskOfRow", "buildCensus", "deriveKappaInputs", "deriveOfficePrediction", "censusPatterns", "familyActionOf", "officeTransportsOf"];
  for (const token of required) {
    if (!region.includes(token)) fail(`generator intrinsic region is missing a required masks-only token: ${token}`);
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate() {
  const artifact = readJson(ARTIFACT_PATH);
  const derived = reDerive();
  checkAgainstSources(artifact, derived);

  const { investigationFingerprint, ...artifactCore } = artifact;
  if (sha256(canonicalText(artifactCore)) !== investigationFingerprint) fail("artifact fingerprint self-check failed");

  const generatorSource = read(GENERATOR_PATH);
  staticIntrinsicCheck(generatorSource);

  const repin = (candidate) => {
    const { investigationFingerprint: ignored, ...core } = candidate;
    void ignored;
    return { ...core, investigationFingerprint: sha256(canonicalText(core)) };
  };
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const expectRejection = (label, mutated) => {
    let rejected = false;
    try {
      checkAgainstSources(repin(mutated), derived);
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`mutation probe not rejected: ${label}`);
  };

  const sanityDrift = clone(artifact);
  sanityDrift.sanityGate.confusion.fn = 1;
  expectRejection("sanity gate confusion drift", sanityDrift);
  const sanityAgreementDrift = clone(artifact);
  sanityAgreementDrift.sanityGate.agreement = 13;
  expectRejection("sanity gate agreement drift", sanityAgreementDrift);
  const constantDrift = clone(artifact);
  constantDrift.officeField.orientationConstant.C = 5;
  expectRejection("orientation constant drift", constantDrift);
  const anchorRuleDrift = clone(artifact);
  anchorRuleDrift.officeField.anchorRule.matches = 69;
  expectRejection("anchor rule census drift", anchorRuleDrift);
  const satelliteRuleDrift = clone(artifact);
  satelliteRuleDrift.officeField.satelliteRule.matches = 237;
  expectRejection("satellite rule census drift", satelliteRuleDrift);
  const histogramDrift = clone(artifact);
  histogramDrift.officeField.satelliteRule.pcSumDeltaHistogram = { "-1": 103, "1": 101, "-6": 17, "6": 17 };
  expectRejection("attachment histogram drift", histogramDrift);
  const midpointDrift = clone(artifact);
  midpointDrift.officeField.midpointExtension.matches = 6;
  expectRejection("A2 midpoint drift", midpointDrift);
  const supportDrift = clone(artifact);
  supportDrift.officeField.support.withheld = 153;
  expectRejection("support census drift", supportDrift);
  const orbitDrift = clone(artifact);
  orbitDrift.officeField.orbitStepLaw.holds = false;
  expectRejection("orbit law flag drift", orbitDrift);
  const censusDrift = clone(artifact);
  censusDrift.census.instances = 1127;
  expectRejection("census instance drift", censusDrift);
  const blockKeyDrift = clone(artifact);
  blockKeyDrift.census.blockKeyOrder = ["A0xA0"];
  expectRejection("block key order drift", blockKeyDrift);
  const blockContentDrift = clone(artifact);
  blockContentDrift.opAR1.blocks[0].agree = 35;
  expectRejection("block content drift", blockContentDrift);
  const blockClassDrift = clone(artifact);
  blockClassDrift.opAR1.blocks[0].class = "EXACT";
  expectRejection("block class drift", blockClassDrift);
  const blockRateDrift = clone(artifact);
  blockRateDrift.opAR1.blocks[0].rate = "35/48";
  expectRejection("block rate drift", blockRateDrift);
  const aggregateDrift = clone(artifact);
  aggregateDrift.opAR1.aggregate.exact = 12;
  expectRejection("aggregate drift", aggregateDrift);
  const a0ProfileDrift = clone(artifact);
  a0ProfileDrift.opAR2.sets.A0.census.agree = 41;
  expectRejection("A0 profile drift", a0ProfileDrift);
  const a1ProfileDrift = clone(artifact);
  a1ProfileDrift.opAR2.sets.A1.census.agree = 35;
  expectRejection("A1 profile drift", a1ProfileDrift);
  const dependenceDrift = clone(artifact);
  dependenceDrift.opAR2.dependence.verdict = "ANCHOR_SET_INDEPENDENT";
  expectRejection("dependence verdict drift", dependenceDrift);
  const affinityDrift = clone(artifact);
  affinityDrift.opAR2.dependence.transportAffinity.T1["A1->7-8"].affine = true;
  expectRejection("affinity flag drift", affinityDrift);
  const constancyDrift = clone(artifact);
  constancyDrift.opAR3.anchorFamiliesConstant = false;
  expectRejection("constancy flag drift", constancyDrift);
  const transportDrift = clone(artifact);
  transportDrift.opAR3.anchorFamilyChecks[0].wellDefined = false;
  transportDrift.opAR3.anchorFamilyChecks[0].wholePermutation = false;
  expectRejection("anchor-family transport drift", transportDrift);
  const fragmentDrift = clone(artifact);
  fragmentDrift.opAR3.satelliteFragmentLoci = fragmentDrift.opAR3.satelliteFragmentLoci.slice(0, 13);
  expectRejection("satellite fragment count drift", fragmentDrift);
  const opAR4Drift = clone(artifact);
  opAR4Drift.opAR4.verdict = "INTERACTION_REMAINDER";
  expectRejection("OP-AR-4 verdict drift", opAR4Drift);
  const opAR4FieldDrift = clone(artifact);
  opAR4FieldDrift.opAR4.comparisons.officeField.mismatches = 1;
  expectRejection("office-field mismatch drift", opAR4FieldDrift);
  const opAR4BlockDrift = clone(artifact);
  opAR4BlockDrift.opAR4.comparisons.opAR1Blocks.mismatches = ["D7xD6"];
  expectRejection("OP-AR-1 mismatch list drift", opAR4BlockDrift);
  const synthesisDrift = clone(artifact);
  synthesisDrift.synthesis.verdict = "INTERACTION_REMAINDER";
  expectRejection("synthesis verdict drift", synthesisDrift);
  const accountingDrift = clone(artifact);
  accountingDrift.accounting.masksOnly = [];
  expectRejection("accounting tier emptying", accountingDrift);
  const bindingDrift = clone(artifact);
  bindingDrift.sourceBindings[0].sha256 = "0".repeat(64);
  expectRejection("source binding sha drift", bindingDrift);
  const chainDrift = clone(artifact);
  chainDrift.base.chainFingerprints.bl063 = "0".repeat(64);
  expectRejection("chain anchor drift", chainDrift);
  const fenceDrift = clone(artifact);
  fenceDrift.fences.noLeaning = "unfenced";
  expectRejection("no-leaning fence drift", fenceDrift);

  const staticProbes = [
    ["smuggled office-index read", "const drawn = ledgerRows[0].officeIndex; void drawn;"],
    ["smuggled office-field read", "const drawn = ledgerRows[0].office; void drawn;"],
    ["smuggled relational-office read", "const drawn = ledgerRows[0].relationalOffice; void drawn;"],
    ["smuggled network seat-contact read", "const drawn = network.d7SeatContactRows; void drawn;"],
    ["smuggled modal-rows read", "const drawn = network.d7ModalRows; void drawn;"],
  ];
  let staticRejections = 0;
  for (const [label, smuggled] of staticProbes) {
    let rejected = false;
    try {
      staticIntrinsicCheck(generatorSource.replace(
        "export function buildCensus(ledgerRows) {",
        `export function buildCensus(ledgerRows) { ${smuggled}`,
      ));
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`mutation probe not rejected: ${label}`);
    staticRejections += 1;
  }
  const stripProbes = ["buildCensus", "hamming12", "maskOfRow", "pitchSet", "deriveOfficePrediction", "officeTransportsOf"];
  for (const token of stripProbes) {
    let rejected = false;
    try {
      staticIntrinsicCheck(generatorSource.split(token).join("STRIPPED"));
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`presence-strip probe not rejected: ${token}`);
    staticRejections += 1;
  }
  const permissiveSource = generatorSource.replace(
    "// ==== INTRINSIC-AR-END ====",
    "// ==== INTRINSIC-AR-END ==== const allowedOfficeRead = ledgerRows[0].office; void allowedOfficeRead;",
  );
  staticIntrinsicCheck(permissiveSource);
  let proofStripRejected = false;
  try {
    staticIntrinsicCheck(generatorSource.split("officeIndex").join("office_index"));
  } catch {
    proofStripRejected = true;
  }
  if (!proofStripRejected) fail("mutation probe not rejected: region-scoping proof strip");

  const mutationProbes = [
    "sanity gate confusion drift", "sanity gate agreement drift", "orientation constant drift",
    "anchor rule census drift", "satellite rule census drift", "attachment histogram drift",
    "A2 midpoint drift", "support census drift", "orbit law flag drift", "census instance drift",
    "block key order drift", "block content drift", "block class drift", "block rate drift",
    "aggregate drift", "A0 profile drift", "A1 profile drift", "dependence verdict drift",
    "affinity flag drift", "constancy flag drift", "anchor-family transport drift",
    "satellite fragment count drift", "OP-AR-4 verdict drift", "office-field mismatch drift",
    "OP-AR-1 mismatch list drift", "synthesis verdict drift", "accounting tier emptying",
    "source binding sha drift", "chain anchor drift", "no-leaning fence drift",
    ...staticProbes.map(([label]) => label),
    ...stripProbes.map((token) => `presence-strip: ${token}`),
    "region-scoping proof strip",
  ];

  console.log(JSON.stringify({
    artifact: ARTIFACT_PATH,
    status: "PASS",
    investigationFingerprint: artifact.investigationFingerprint,
    chainFingerprints: artifact.base.chainFingerprints,
    sanityGate: `R-OFF ${artifact.sanityGate.confusion.tp}/${artifact.sanityGate.confusion.fp}/${artifact.sanityGate.confusion.fn}/${artifact.sanityGate.confusion.tn} (${artifact.sanityGate.verdict})`,
    officeField: `C=${artifact.officeField.orientationConstant.C}; anchors ${artifact.officeField.anchorRule.matches}/70; satellites ${artifact.officeField.satelliteRule.matches}/238`,
    opAR1: artifact.opAR1.aggregate,
    opAR2: artifact.opAR2.dependence.verdict,
    opAR3: artifact.opAR3.verdict,
    opAR4: artifact.opAR4.verdict,
    mutationProbes: mutationProbes.length,
    probeStaticRejections: staticRejections,
    regionScopingProbes: "2 (permissive pass + proof strip rejected)",
  }, null, 2));
}

validate();
