#!/usr/bin/env node
/**
 * Build the BL-089 anchoring-remainder interaction probe: how does the D7
 * office field (o(s) = o(h)) interact with the anchor sets (A0/A1) and the
 * tier/role partition - and is the interaction pattern itself derivable from
 * derived inputs?
 *
 * The delta from BL-070/BL-078 (both landed): BL-070 asked whether a
 * mask-geometric predicate can REPLACE the office field (no: PARTIAL_DERIVATION,
 * R_NONE); BL-078 asked whether that survives region-scoped isolation (yes:
 * REPLICATED, R-OFF 14/0/0/22). This probe asks: given the office field as
 * granted ground, is the SHAPE of its coupling to the anchor-set partition and
 * the tier/role partition derivable? INTERACTION_DERIVED shrinks the remaining
 * grant's effective size (its form derived); INTERACTION_REMAINDER establishes
 * the interaction as remainder proper. D7 stays hypothesis-tier either way.
 *
 * The probe (four operationalizations, pre-registered in-artifact):
 *   OP-AR-1 tier-block uniformity: the office-agreement rate o(s) = o(h) per
 *           (anchor-tier x satellite-tier) block over the office-carrying
 *           anchor-satellite Hamming-2 census; binary exactness predicate
 *           (EXACT = 100% agreement per block; NEAR_EXACT a finding class)
 *   OP-AR-2 anchor-set dependence: the office rule's confusion per anchor set
 *           (A0 anchors vs A1 anchors) - reconstruction exactness (kappa laws)
 *           and the reach-census agreement profile
 *   OP-AR-3 family-block respect: whether the office field is constant on the
 *           Klein-4 family involution pairs (7-35<->7-1, 7-34<->7-8,
 *           7-Z37<->7-Z17) and the fixed families (7-33/7-22/7-15/7-Z12);
 *           block-constancy criterion: the office transport under each
 *           coordinate map is a well-defined function per family
 *   OP-AR-4 interaction derivability: predict the OP-AR-1/2/3 patterns from the
 *           derived-input class (masks, the licensed tier/role partition and
 *           edge content, kappa, the cycle ground; zero office reads in the
 *           prediction path) and compare field-for-field (tolerance: zero
 *           mismatches)
 *
 * Sanity gate (before any OP): BL-078's R-OFF 14/0/0/22 reproduced on the
 * re-derived D7 x D6 block (36 instances), set-equal to the landed seat-contact
 * rows; any mismatch is a halt, not a finding.
 *
 * Two-region static discipline (validator-enforced): the INTRINSIC region
 * reads the ledger's pitch sets, masks, tier/role/family partition, the
 * licensed GOVERNS/CONSTRUCTS edge content, and re-derives kappa via the
 * masks-only BL-063 functions. It never reads the office field, the class
 * labels as targets, the recorded seat-contact relation, or any landed verdict.
 * The comparison region reads the office fields and the recorded relation.
 *
 * Fences: planning_evidence only. D7 hypothesis-tier throughout (ENTRY 15's D7
 * clause carries forward verbatim). No GOVERNS admission; no new GSL number;
 * no registration. No G1 movement; no INV-5 graduation; no M-walkability
 * promotion; no directional-semantics assignment. No canonical/Court/schema/
 * Neo4j writes; no claim event; no record amendment (ENTRY 10/15/16/17/18/19/
 * 20/21 byte-untouched). No mechanism (causal) claim beyond the verdict: the
 * interaction is characterized, not causally explained. The frame
 * (scrum/plan/harmonic-comprehension-map.md sections 2.6/2.7) is interpretation
 * vocabulary, never design input. Session prose is context, not evidence.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BIPARTITE_PATH,
  HEPTATONIC_LEDGER_PATH,
  canonicalText,
  fail,
  fileSha,
  parseCsv,
  parsePitchSet,
  read,
  readJson,
  sha256,
} from "./verify-phase-a-proposals.mjs";

import {
  deriveP7,
  deriveKappa,
  derivePi,
  deriveMidpoints,
} from "./build-bl063-office-reconstruction.mjs";

import { midZ7 } from "./d4-derivation-engine.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

export const SCHEMA_VERSION = "harmonic-orrery.bl089-anchoring-remainder-interaction.v1";
export const INVESTIGATION_ID = "BL089_ANCHORING_REMAINDER_INTERACTION_V1";
export const OUTPUT_PATH = "orrery/src/generated/bl089-anchoring-remainder-interaction.v1.json";
export const NETWORK_PATH = "canonical/universal-network-data.json";
export const LEDGER_PATH = HEPTATONIC_LEDGER_PATH;
export const BL063_PATH = "orrery/src/generated/bl063-office-reconstruction.v1.json";
export const BL068_PATH = "orrery/src/generated/bl068-d7-asymmetry.v1.json";
export const BL070_PATH = "orrery/src/generated/bl070-d7-derivation.v1.json";
export const BL078_PATH = "orrery/src/generated/bl078-d7-retest.v1.json";
export const BL076_PATH = "orrery/src/generated/bl076-bijection-probe.v1.json";
export const PROBE_PATH = "orrery/src/generated/d-tier-operator-probe.v1.json";
export const BL073_PATH = "orrery/src/generated/bl073-isometry-probe.v1.json";

export const TIER_ORDER = ["A0", "A1", "A2", "D1", "D2", "D3", "D4", "D5", "D6", "D7"];
export const MAP_ORDER = ["T1", "T2", "RHO"];
export const MAP_UNITS = { T1: 5, T2: 7, RHO: 11 };
export const KLEIN4_PAIRS = [["7-35", "7-1"], ["7-34", "7-8"], ["7-Z37", "7-Z17"]];
export const KLEIN4_FIXED = ["7-33", "7-22", "7-15", "7-Z12"];
export const ANCHOR_FAMILIES = ["7-35", "7-34", "7-33", "7-22", "7-15", "7-Z37", "7-Z17", "7-Z12", "7-8", "7-1"];

// ==== INTRINSIC-AR-BEGIN (masks + tier/role/family partition + licensed edge content; no office bytes) ====
// This region derives masks from pitch sets, partitions anchor/satellite by
// tier, builds the anchor-satellite Hamming-2 census, re-derives kappa via the
// masks-only BL-063 functions, constructs the derived-input field prediction
// and the pattern machinery (blocks, anchor-set profiles, family transports).
// It reads no index field, no relational field, no recorded relation, and no
// landed verdict: the predicted field is built from masks, the partition, the
// licensed edge content and the kappa orientation constant alone.

function cmp(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function maskOfRow(row) {
  let mask = 0;
  for (const pitch of parsePitchSet(row.pitchSet)) mask |= 1 << pitch;
  if (mask !== Number(row.id)) {
    fail(`ledger row ${row.id}: mask derived from the pitch set disagrees with the identity field`);
  }
  return mask;
}

export function pcSumOfMask(mask) {
  let sum = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) if ((mask >> pitch) & 1) sum += pitch;
  return sum;
}

export function hamming12(a, b) {
  let x = a ^ b;
  let count = 0;
  while (x !== 0) { count += x & 1; x >>= 1; }
  return count;
}

export function affineImage(mask, unit) {
  let image = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) {
    if ((mask >> pitch) & 1) {
      const mapped = (((unit * pitch) % 12) + 12) % 12;
      image |= 1 << mapped;
    }
  }
  return image & 4095;
}

export function deriveKappaInputs(ledgerRows) {
  const a0Rows = ledgerRows.filter((row) => row.tier === "A0" && row.role === "anchor")
    .sort((left, right) => cmp(Number(left.id), Number(right.id)));
  const a1Rows = ledgerRows.filter((row) => row.tier === "A1" && row.role === "anchor")
    .sort((left, right) => cmp(Number(left.id), Number(right.id)));
  if (a0Rows.length !== 7 || a1Rows.length !== 7) fail("A0/A1 anchor census drift");
  const a0Masks = a0Rows.map((row) => maskOfRow(row)).sort((left, right) => left - right);
  const a1Masks = a1Rows.map((row) => maskOfRow(row)).sort((left, right) => left - right);
  const p7 = deriveP7(a0Masks);
  const kappa = deriveKappa(p7);
  const piEntries = a1Masks.map((mask) => derivePi(mask, p7));
  const midpoints = piEntries.map((entry) => deriveMidpoints(entry, kappa));
  const cA0 = a0Masks.map((mask) => (kappa.kappa1.get(mask) + pcSumOfMask(mask)) % 7);
  const cA1 = a1Masks.map((mask, index) => (midpoints[index].g1 + pcSumOfMask(mask)) % 7);
  const cValues = [...new Set([...cA0, ...cA1])];
  if (cValues.length !== 1) fail(`kappa orientation constant is not unique: ${cValues.join(",")}`);
  return { a0Rows, a1Rows, a0Masks, a1Masks, p7, kappa, piEntries, midpoints, C: cValues[0], cA0, cA1 };
}

export function buildCensus(ledgerRows) {
  const anchors = ledgerRows.filter((row) => row.role === "anchor");
  const satellites = ledgerRows.filter((row) => row.role === "satellite");
  if (anchors.length !== 70 || satellites.length !== 238) fail(`partition census drift: ${anchors.length}/${satellites.length}`);
  const anchorRows = anchors.map((row) => ({ id: String(row.id), tier: row.tier, mask: maskOfRow(row) }));
  const satelliteRows = satellites.map((row) => ({ id: String(row.id), tier: row.tier, mask: maskOfRow(row) }));
  const instances = [];
  for (const anchor of anchorRows) {
    for (const satellite of satelliteRows) {
      if (hamming12(anchor.mask, satellite.mask) !== 2) continue;
      instances.push({
        key: `${anchor.id}:${satellite.id}`,
        anchor: anchor.id,
        satellite: satellite.id,
        anchorTier: anchor.tier,
        satelliteTier: satellite.tier,
      });
    }
  }
  instances.sort((left, right) => TIER_ORDER.indexOf(left.anchorTier) - TIER_ORDER.indexOf(right.anchorTier)
    || TIER_ORDER.indexOf(left.satelliteTier) - TIER_ORDER.indexOf(right.satelliteTier)
    || Number(left.anchor) - Number(right.anchor)
    || Number(left.satellite) - Number(right.satellite));
  const blocks = new Map();
  for (const instance of instances) {
    const key = `${instance.anchorTier}x${instance.satelliteTier}`;
    if (!blocks.has(key)) blocks.set(key, { anchorTier: instance.anchorTier, satelliteTier: instance.satelliteTier, instances: [] });
    blocks.get(key).instances.push(instance);
  }
  const blockList = [...blocks.values()].sort((left, right) => TIER_ORDER.indexOf(left.anchorTier) - TIER_ORDER.indexOf(right.anchorTier)
    || TIER_ORDER.indexOf(left.satelliteTier) - TIER_ORDER.indexOf(right.satelliteTier));
  return { anchorRows, satelliteRows, instances, blocks: blockList };
}

export function deriveOfficePrediction(ledgerRows, census, kappaInputs, parentOf) {
  const officeOf = new Map();
  for (const anchor of census.anchorRows) {
    const row = ledgerRows.find((candidate) => String(candidate.id) === anchor.id);
    officeOf.set(anchor.id, (kappaInputs.C - pcSumOfMask(maskOfRow(row)) + 70) % 7);
  }
  for (const satellite of census.satelliteRows) {
    const parent = parentOf.get(satellite.id);
    if (!parent) fail(`satellite ${satellite.id} has no governing anchor`);
    officeOf.set(satellite.id, officeOf.get(parent));
  }
  return officeOf;
}

export function exactnessClass(agree, n) {
  if (agree === n) return "EXACT";
  if (agree === 0) return "DEGENERATE";
  if (agree * 6 >= n * 5 && agree < n) return "NEAR_EXACT";
  return "PARTIAL";
}

export function censusPatterns(census, officeOf) {
  const blocks = census.blocks.map((block) => {
    let agree = 0;
    const deltaHistogram = {};
    for (const instance of block.instances) {
      const left = officeOf.get(instance.anchor);
      const right = officeOf.get(instance.satellite);
      if (left === undefined || right === undefined) fail(`census instance ${instance.key} has an office-less endpoint`);
      if (left === right) agree += 1;
      const delta = String(((right - left) + 7) % 7);
      deltaHistogram[delta] = (deltaHistogram[delta] ?? 0) + 1;
    }
    return {
      anchorTier: block.anchorTier,
      satelliteTier: block.satelliteTier,
      n: block.instances.length,
      agree,
      rate: `${agree}/${block.instances.length}`,
      class: exactnessClass(agree, block.instances.length),
      deltaHistogram: Object.fromEntries(Object.entries(deltaHistogram).sort((left, right) => Number(left[0]) - Number(right[0]))),
    };
  });
  const aggregate = {
    instances: census.instances.length,
    agree: blocks.reduce((sum, block) => sum + block.agree, 0),
    blocks: blocks.length,
    exact: blocks.filter((block) => block.class === "EXACT").length,
    degenerate: blocks.filter((block) => block.class === "DEGENERATE").length,
    nearExact: blocks.filter((block) => block.class === "NEAR_EXACT").length,
    partial: blocks.filter((block) => block.class === "PARTIAL").length,
  };
  return { blocks, aggregate };
}

export function anchorSetPatterns(census, officeOf, kappaInputs, ledgerRows) {
  const reconstruction = {
    A0: { law: "office(A0 anchor) = kappa1 (position on the P7 line; BL-063)", matches: 0, mismatches: 0 },
    A1: { law: "office(A1 anchor) = midZ7 of the constructors' positions (BL-063)", matches: 0, mismatches: 0 },
  };
  for (const row of kappaInputs.a0Rows) {
    const mask = maskOfRow(row);
    if (kappaInputs.kappa.kappa1.get(mask) === officeOf.get(String(row.id))) reconstruction.A0.matches += 1;
    else reconstruction.A0.mismatches += 1;
  }
  for (const entry of kappaInputs.midpoints) {
    const row = ledgerRows.find((candidate) => maskOfRow(candidate) === entry.child);
    if (!row) fail(`midpoint child ${entry.child} missing from the ledger`);
    if (entry.g1 === officeOf.get(String(row.id))) reconstruction.A1.matches += 1;
    else reconstruction.A1.mismatches += 1;
  }
  const sets = {};
  for (const tier of ["A0", "A1"]) {
    const instances = census.instances.filter((instance) => instance.anchorTier === tier);
    let agree = 0;
    for (const instance of instances) if (officeOf.get(instance.anchor) === officeOf.get(instance.satellite)) agree += 1;
    const perBlock = census.blocks
      .filter((block) => block.anchorTier === tier)
      .map((block) => {
        let blockAgree = 0;
        for (const instance of block.instances) if (officeOf.get(instance.anchor) === officeOf.get(instance.satellite)) blockAgree += 1;
        return {
          satelliteTier: block.satelliteTier,
          n: block.instances.length,
          agree: blockAgree,
          rate: `${blockAgree}/${block.instances.length}`,
          class: exactnessClass(blockAgree, block.instances.length),
        };
      });
    const own = perBlock.find((block) => block.satelliteTier === tier);
    sets[tier] = {
      reconstruction: reconstruction[tier],
      census: { instances: instances.length, agree, rate: `${agree}/${instances.length}` },
      perSatelliteTier: perBlock,
      ownTierBlock: own,
    };
  }
  const a2Instances = census.instances.filter((instance) => instance.anchorTier === "A2");
  let a2Agree = 0;
  for (const instance of a2Instances) if (officeOf.get(instance.anchor) === officeOf.get(instance.satellite)) a2Agree += 1;
  return { sets, context: { A2: { instances: a2Instances.length, agree: a2Agree, rate: `${a2Agree}/${a2Instances.length}` } } };
}

export function familyActionOf(ledgerRows) {
  const byMask = new Map(ledgerRows.map((row) => [maskOfRow(row), row]));
  const perMap = {};
  for (const id of MAP_ORDER) {
    const unit = MAP_UNITS[id];
    const families = new Map();
    for (const row of ledgerRows) {
      const image = byMask.get(affineImage(maskOfRow(row), unit));
      if (!image) fail(`family action image absent for ${row.id} under ${id}`);
      const key = `${row.role}:${row.forte}`;
      if (!families.has(key)) {
        families.set(key, { role: row.role, family: row.forte, imageFamilies: new Set(), imageSupport: { carrying: 0, withheld: 0 } });
      }
      const entry = families.get(key);
      entry.imageFamilies.add(image.forte);
      if (image.role === "boundary") entry.imageSupport.withheld += 1;
      else entry.imageSupport.carrying += 1;
    }
    perMap[id] = [...families.values()].map((entry) => ({
      role: entry.role,
      family: entry.family,
      imageFamilies: [...entry.imageFamilies].sort(cmp),
      imageSupport: entry.imageSupport.withheld === 0 ? "OFFICE_CARRYING" : entry.imageSupport.carrying === 0 ? "OFFICE_WITHHELD" : "MIXED",
    })).sort((left, right) => cmp(left.role, right.role) || cmp(left.family, right.family));
  }
  return perMap;
}

export function officeTransportsOf(ledgerRows, officeOf) {
  const byMask = new Map(ledgerRows.map((row) => [maskOfRow(row), row]));
  const perMap = {};
  for (const id of MAP_ORDER) {
    const unit = MAP_UNITS[id];
    const transports = new Map();
    for (const row of ledgerRows) {
      if (row.role === "boundary") continue;
      const image = byMask.get(affineImage(maskOfRow(row), unit));
      if (!image || image.role === "boundary") continue;
      const key = `${row.role}:${row.forte}`;
      if (!transports.has(key)) transports.set(key, { role: row.role, family: row.forte, images: new Map() });
      const entry = transports.get(key);
      const source = officeOf.get(String(row.id));
      const target = officeOf.get(String(image.id));
      if (source === undefined || target === undefined) fail(`office transport undefined at ${row.id} under ${id}`);
      if (!entry.images.has(source)) entry.images.set(source, new Set());
      entry.images.get(source).add(target);
    }
    perMap[id] = [...transports.values()].map((entry) => {
      const map = {};
      let fragments = 0;
      let distinctImages = 0;
      for (const [source, targets] of [...entry.images.entries()].sort((left, right) => left[0] - right[0])) {
        const list = [...targets].sort((left, right) => left - right);
        map[String(source)] = list[0];
        if (list.length > 1) fragments += 1;
        distinctImages += list.length;
      }
      const sourceCount = Object.keys(map).length;
      const uniqueImages = [...new Set(Object.values(map))].length;
      return {
        role: entry.role,
        family: entry.family,
        fragments,
        wellDefined: fragments === 0,
        map,
        distinctImages,
        wholePermutation: fragments === 0 && sourceCount > 0 && uniqueImages === sourceCount,
      };
    }).sort((left, right) => cmp(left.role, right.role) || cmp(left.family, right.family));
  }
  return perMap;
}

export function patternBundle(census, officeOf, kappaInputs, ledgerRows) {
  const familyAction = familyActionOf(ledgerRows);
  return {
    opAR1: censusPatterns(census, officeOf),
    opAR2: anchorSetPatterns(census, officeOf, kappaInputs, ledgerRows),
    opAR3: { familyAction, transports: officeTransportsOf(ledgerRows, officeOf) },
  };
}
// ==== INTRINSIC-AR-END ====

// ---- comparison region: the office field, the recorded seat-contact
// ---- relation, the chain artifacts and the landed verdicts are read here;
// ---- never in the intrinsic region -----------------------------------------

function fingerprintSelfCheck(artifact, label, idKey, idValue, fingerprintKey) {
  const { [fingerprintKey]: fingerprint, ...core } = artifact;
  if (artifact[idKey] !== idValue || artifact.status !== "planning_evidence") fail(`${label} artifact header drift`);
  if (sha256(canonicalText(core)) !== fingerprint) fail(`${label} fingerprint self-check failed`);
  return fingerprint;
}

function confusion(keys, actualSet, predicate) {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (const key of keys) {
    const predicted = predicate(key);
    const actual = actualSet.has(key);
    if (actual && predicted) tp += 1;
    else if (actual && !predicted) fn += 1;
    else if (!actual && predicted) fp += 1;
    else tn += 1;
  }
  return { tp, fp, fn, tn };
}

function sortKeyAscending(left, right) {
  const [la, ls] = left.split(":").map(Number);
  const [ra, rs] = right.split(":").map(Number);
  return la - ra || ls - rs;
}

export const PRE_REGISTRATION = {
  approved: "2026-10-14 (the approved BL-089 directive and execution plan; rulings OD-89-1..5 frozen before computation)",
  rulings: [
    {
      id: "OD-89-1",
      decision: "scope: the landed domain generalizes to the office-carrying anchor-satellite Hamming-2 census over the 462-record ledger (the BL-068 D1+D2 construction applied at full partition scope); no new measurement - masks-only arithmetic over landed bytes (the BL-070/BL-086 descriptive-read precedent); the D7 x D6 block is the sanity-gate block",
    },
    {
      id: "OD-89-2",
      decision: "artifact shape: machine-checkable artifact + deterministic generator + independent validator (region-scoped static check + mutation probes) + vitest pins (the BL-088 precedent)",
    },
    {
      id: "OD-89-3",
      decision: "exactness predicate: binary - EXACT iff every instance in the tier block agrees (100%); NEAR_EXACT (rate >= 5/6, not exact) is a finding sub-category, never a relaxed pass; DEGENERATE iff no instance agrees; PARTIAL otherwise",
    },
    {
      id: "OD-89-4",
      decision: "OP-AR-4 tolerance: exact field-for-field, zero mismatches; any block-level or field-level mismatch is the finding and the interaction is remainder (or mixed, partitioned)",
    },
    {
      id: "OD-89-5",
      decision: "verdict classes INTERACTION_DERIVED / INTERACTION_REMAINDER / INTERACTION_MIXED with the mixed case's partition stated field-for-field",
    },
  ],
  operationalizations: [
    {
      id: "OP-AR-1",
      text: "tier-block uniformity: over the office-carrying anchor-satellite Hamming-2 census (all 70 anchors x 238 satellites, hamming12 = 2), compute the office-agreement rate o(s) = o(h) per (anchor-tier x satellite-tier) block; classify each block by the binary exactness predicate (OD-89-3); the pre-registered exactness predicate is frozen before computation",
    },
    {
      id: "OP-AR-2",
      text: "anchor-set dependence: per anchor set (A0 anchors vs A1 anchors): (a) the reconstruction confusion - kappa1 (A0) and midZ7-of-constructors (A1) against the field, exactness recorded; (b) the reach-census agreement profile per satellite tier and in total; (c) the own-tier block classification; the dependence question is answered by comparing the two profiles",
    },
    {
      id: "OP-AR-3",
      text: "family-block respect: per coordinate map (T1: x->5x, T2: x->7x, RHO: x->11x) and per family: (a) the image family block (whole-block or fragment); (b) the office transport restricted to the family - block-constancy criterion: the transport is a well-defined function (each source office maps to exactly one image office; any office with multiple images is a fragment); (c) for the Klein-4 involution pairs and the fixed anchor families, the whole-permutation check; the involution-pair prediction (GOV-525/BL-076) is block-constancy",
    },
    {
      id: "OP-AR-4",
      text: "interaction derivability: two-stage predictor from the derived-input class (masks, the licensed tier/role/family partition and GOVERNS/CONSTRUCTS edge content, kappa via the masks-only BL-063 functions, the cycle ground; zero office reads in the prediction path): stage A the structural prediction (block inventory, counts, family action); stage B the field prediction (anchor rule office = (C - pcSum) mod 7 with C the kappa orientation constant; satellite rule office(s) = office(governing anchor)); then the OP-AR-1/2/3 patterns recomputed from predicted offices and compared field-for-field against the landed patterns at zero tolerance",
    },
  ],
  sanityGate: {
    id: "V-AR-0",
    text: "BL-078's R-OFF confusion 14/0/0/22 reproduced on the re-derived D7 x D6 block (36 instances; agreement subset set-equal to the landed seat-contact rows); field-for-field against the landed BL-078 calibration; any mismatch is a halt, not a finding",
  },
  decisionRule: {
    exactnessPredicate: "EXACT iff agree = n per block (binary, strongest form); NEAR_EXACT (5/6 <= rate < 1) recorded as a finding sub-category; DEGENERATE iff agree = 0",
    blockConstancy: "a family's office coupling is block-constant iff the office transport under the map is a well-defined function on the family (zero fragments); the involution pairs and fixed families are the OP-AR-3 test population",
    tolerance: "OP-AR-4 compares field-for-field at zero mismatches (the strongest form)",
    verdictClasses: ["INTERACTION_DERIVED", "INTERACTION_REMAINDER", "INTERACTION_MIXED"],
    mixedPartition: "the mixed case names which OP patterns matched and which did not, field-for-field",
  },
  refutationConditions: [
    { id: "R-AR-1", text: "OP-AR-1 is refuted if any tier block's landed exactness classification falls outside the binary predicate (e.g., a block agrees on all but one instance while the exactness expectation demanded a clean degradation profile); the near-exact sub-category is then the finding, never a pass" },
    { id: "R-AR-2", text: "OP-AR-2 is refuted if the field's exactness profile is set-independent (the A0 and A1 profiles coincide in reconstruction exactness, net rate, and own-tier classification) - then the coupling does not depend on the anchor set" },
    { id: "R-AR-3", text: "OP-AR-3 is refuted if the office transport on any Klein-4 involution-pair anchor family or fixed anchor family is fragmented (the field varies within a family pair's transport) - then the coupling does not respect the derived coordinate structure" },
    { id: "R-AR-4", text: "OP-AR-4 is refuted if any tier block's landed pattern falls outside the zero-mismatch tolerance of the derived-input prediction; the mismatching fields name the interaction's remainder content" },
  ],
  groundingCorrections: [
    { id: "GC-1", text: "the directive's OP-AR-1 'tier block' operationalizes as the (anchor-tier x satellite-tier) block of the full office-carrying anchor-satellite Hamming-2 census (the landed 36-instance D7 x D6 domain generalized at partition scope); the census has 57 nonempty blocks and 1128 instances (masks-only)" },
    { id: "GC-2", text: "the directive's OP-AR-2 'the state belongs to an anchor set' operationalizes as the instance's anchor membership in the A0/A1 remainder anchor sets; the field's confusion is the agreement/disagreement profile plus the kappa reconstruction confusion - both recorded" },
    { id: "GC-3", text: "OP-AR-3's 'constant on the family involution pairs' operationalizes at the transport level: the office transport under the coordinate map restricted to a family must be a well-defined function (block-constancy); the involution pairs and fixed families are the anchor families, per GOV-525/BL-076" },
    { id: "GC-4", text: "the OP-AR-4 predictor's input class includes the licensed GOVERNS/CONSTRUCTS edge content as partition content (the BL-080 Gate 2 'anchor identities, edge content' class; GOV-524/525's derived-up-to-the-remainder result) - the office field itself and the recorded seat-contact relation are never prediction inputs" },
  ],
};

function buildInvestigation() {
  const ledgerRows = parseCsv(read(LEDGER_PATH));
  const network = readJson(NETWORK_PATH);
  if (ledgerRows.length !== 462) fail(`heptatonic ledger census is ${ledgerRows.length}`);

  // ---- chain self-checks (fingerprints; no literals in this generator) -----
  const bl063 = readJson(BL063_PATH);
  const bl068 = readJson(BL068_PATH);
  const bl070 = readJson(BL070_PATH);
  const bl078 = readJson(BL078_PATH);
  const bl076 = readJson(BL076_PATH);
  const probe = readJson(PROBE_PATH);
  const bl073 = readJson(BL073_PATH);
  const bl063Fingerprint = fingerprintSelfCheck(bl063, "BL-063", "reconstructionId", "BL063_OFFICE_RECONSTRUCTION_v1", "reconstructionFingerprint");
  const bl068Fingerprint = fingerprintSelfCheck(bl068, "BL-068", "investigationId", "BL068_D7_ASYMMETRY_V1", "derivationFingerprint");
  const bl070Fingerprint = fingerprintSelfCheck(bl070, "BL-070", "derivationId", "BL070_D7_DERIVATION_V1", "derivationFingerprint");
  const bl078Fingerprint = fingerprintSelfCheck(bl078, "BL-078", "retestId", "BL078_D7_RETEST_V1", "derivationFingerprint");
  const bl076Fingerprint = fingerprintSelfCheck(bl076, "BL-076", "investigationId", "BL076_BIJECTION_PROBE_V1", "investigationFingerprint");
  const bl073Fingerprint = fingerprintSelfCheck(bl073, "BL-073", "investigationId", "BL073_ISOMETRY_PROBE_V1", "investigationFingerprint");
  const { probeFingerprint, ...probeCore } = probe;
  if (probe.probeId !== "D_TIER_OPERATOR_PROBE_v1" || probe.status !== "planning_evidence") fail("d-tier operator probe header drift");
  if (sha256(canonicalText(probeCore)) !== probeFingerprint) fail("d-tier operator probe fingerprint self-check failed");
  const bipartiteSha = fileSha(BIPARTITE_PATH);

  // ---- the licensed partition/edge content (GOVERNS + CONSTRUCTS) ----------
  const parentOf = new Map();
  const constructorsOf = new Map();
  for (const edge of network.structuralEdges) {
    const source = String(edge.source);
    const target = String(edge.target);
    if (edge.type === "GOVERNS") {
      if (parentOf.has(target)) fail(`satellite ${target} carries two governing anchors`);
      parentOf.set(target, source);
    } else if (edge.type === "CONSTRUCTS") {
      const list = constructorsOf.get(target) ?? [];
      list.push(source);
      constructorsOf.set(target, list);
    }
  }
  if (parentOf.size !== 238) fail(`governing census drift: ${parentOf.size}`);
  if (constructorsOf.size !== 14) fail(`constructor census drift: ${constructorsOf.size}`);
  for (const list of constructorsOf.values()) if (list.length !== 2) fail("constructor arity drift");

  // ---- intrinsic derivation ------------------------------------------------
  const census = buildCensus(ledgerRows);
  const kappaInputs = deriveKappaInputs(ledgerRows);
  const predictedOfficeOf = deriveOfficePrediction(ledgerRows, census, kappaInputs, parentOf);
  if (predictedOfficeOf.size !== 308) fail(`predicted office support drift: ${predictedOfficeOf.size}`);
  const predictedPatterns = patternBundle(census, predictedOfficeOf, kappaInputs, ledgerRows);

  // ---- comparison-region labels (the evaluation target) --------------------
  const officeCarrying = ledgerRows.filter((row) => row.officeIndex !== "");
  const withheld = ledgerRows.filter((row) => row.officeIndex === "");
  if (officeCarrying.length !== 308 || withheld.length !== 154) fail("office support census drift");
  if (withheld.some((row) => row.role !== "boundary")) fail("office-withheld rows are not all boundary-role");
  if (ledgerRows.filter((row) => row.role !== "boundary").length !== officeCarrying.length) {
    fail("office support is not exactly the non-boundary partition (the partition-based support predicate is wrong)");
  }
  const landedOfficeOf = new Map(officeCarrying.map((row) => [String(row.id), Number(row.officeIndex)]));

  // ---- V-AR-0: the sanity gate (BL-078's R-OFF, field-for-field) -----------
  const sanityBlock = census.blocks.find((block) => block.anchorTier === "D7" && block.satelliteTier === "D6");
  if (!sanityBlock) fail("sanity block missing from the census");
  const sanityKeys = sanityBlock.instances.map((instance) => instance.key).sort(sortKeyAscending);
  if (sanityKeys.length !== 36) fail(`sanity block size drift: ${sanityKeys.length}`);
  const contactRows = network.d7SeatContactRows.map((row) => `${row.target}:${row.source}`);
  const contactSet = new Set(contactRows);
  if (contactSet.size !== 14) fail(`seat-contact census drift: ${contactSet.size}`);
  const officeEqualKeys = sanityKeys.filter((key) => {
    const [anchor, satellite] = key.split(":");
    return landedOfficeOf.get(anchor) === landedOfficeOf.get(satellite);
  });
  if (canonicalText(officeEqualKeys) !== canonicalText([...contactSet].sort(sortKeyAscending))) {
    fail("sanity gate: the office-equal subset is not set-equal to the landed seat-contact rows");
  }
  const sanityConfusion = confusion(sanityKeys, contactSet, (key) => {
    const [anchor, satellite] = key.split(":");
    return landedOfficeOf.get(anchor) === landedOfficeOf.get(satellite);
  });
  if (canonicalText(sanityConfusion) !== canonicalText({ tp: 14, fp: 0, fn: 0, tn: 22 })) fail(`sanity gate confusion drift: ${JSON.stringify(sanityConfusion)}`);
  if (canonicalText(bl078.calibration.confusion) !== canonicalText(sanityConfusion)) fail("sanity gate: the landed BL-078 calibration does not match field-for-field");
  if (bl078.calibration.verdict !== "CLEAN_SPLIT" || bl078.calibration.exact !== true) fail("sanity gate: landed BL-078 calibration verdict drift");
  if (bl078.comparison.verdict !== "REPLICATED") fail("sanity gate: landed BL-078 comparison verdict drift");
  const sanityGate = {
    id: "V-AR-0",
    block: "D7xD6",
    instances: sanityKeys.length,
    agreement: officeEqualKeys.length,
    confusion: sanityConfusion,
    verdict: "EXACT",
    seatContactSetEquality: true,
    landedMatch: "field-for-field against BL-078's calibration (confusion, verdict CLEAN_SPLIT, exact flag); the landed BL-078 comparison verdict is REPLICATED",
    note: "any mismatch would be a halt: the domain or the office field would be wrong, not the rule",
  };

  // ---- landed patterns (the same machinery over the landed field) ----------
  const landedPatterns = patternBundle(census, landedOfficeOf, kappaInputs, ledgerRows);

  // ---- office-field survey and the derived rule ----------------------------
  const anchorRuleMismatches = [];
  for (const anchor of census.anchorRows) {
    const row = ledgerRows.find((candidate) => String(candidate.id) === anchor.id);
    const rule = (kappaInputs.C - pcSumOfMask(maskOfRow(row)) + 70) % 7;
    if (rule !== landedOfficeOf.get(anchor.id)) anchorRuleMismatches.push(anchor.id);
  }
  const satelliteRuleMismatches = [];
  const satelliteDeltaHistogram = {};
  for (const satellite of census.satelliteRows) {
    const parent = parentOf.get(satellite.id);
    const parentRow = ledgerRows.find((candidate) => String(candidate.id) === parent);
    const satelliteRow = ledgerRows.find((candidate) => String(candidate.id) === satellite.id);
    if (landedOfficeOf.get(satellite.id) !== landedOfficeOf.get(parent)) satelliteRuleMismatches.push(satellite.id);
    const raw = pcSumOfMask(maskOfRow(satelliteRow)) - pcSumOfMask(maskOfRow(parentRow));
    const key = String(raw);
    satelliteDeltaHistogram[key] = (satelliteDeltaHistogram[key] ?? 0) + 1;
  }
  if (anchorRuleMismatches.length !== 0) fail(`anchor rule mismatches: ${anchorRuleMismatches.join(",")}`);
  if (satelliteRuleMismatches.length !== 0) fail(`satellite rule mismatches: ${satelliteRuleMismatches.join(",")}`);

  const orbitCycles = [
    ...probe.modalClosure.aToA.cycles.map((cycle) => ({ tier: cycle.tier, order: cycle.stateIds.map(String) })),
    ...probe.modalClosure.dToD.cycles.map((cycle) => ({ tier: cycle.tier, order: cycle.stateIds.map(String) })),
  ].sort((left, right) => TIER_ORDER.indexOf(left.tier) - TIER_ORDER.indexOf(right.tier));
  if (orbitCycles.length !== 10) fail(`cycle-ground census drift: ${orbitCycles.length}`);
  const orbitLaw = [];
  for (const cycle of orbitCycles) {
    const landedHolds = cycle.order.every((state, index) => {
      const next = cycle.order[(index + 1) % cycle.order.length];
      return ((landedOfficeOf.get(next) - landedOfficeOf.get(state)) + 14) % 7 === 2;
    });
    const predictedHolds = cycle.order.every((state, index) => {
      const next = cycle.order[(index + 1) % cycle.order.length];
      return ((predictedOfficeOf.get(next) - predictedOfficeOf.get(state)) + 14) % 7 === 2;
    });
    if (!landedHolds || !predictedHolds) fail(`orbit step law fails at ${cycle.tier}`);
    orbitLaw.push({ tier: cycle.tier, length: cycle.order.length, step: 2, landedHolds, predictedHolds });
  }
  const successor = new Map(network.d7ModalRows.map((row) => [String(row.source), String(row.target)]));
  const networkOrbit = [];
  let cursor = "127";
  for (let step = 0; step < 7; step += 1) {
    networkOrbit.push(cursor);
    const next = successor.get(cursor);
    if (!next) fail(`modal orbit dead-end at ${cursor}`);
    cursor = next;
  }
  if (cursor !== "127") fail("modal orbit does not close");
  const probeD7Order = orbitCycles.find((cycle) => cycle.tier === "D7").order;
  if (canonicalText(networkOrbit) !== canonicalText(probeD7Order)) fail("network orbit disagrees with the probe D7 order");
  const a0Order = bl073.cycles.A0.order.map(String);
  const probeA0Order = orbitCycles.find((cycle) => cycle.tier === "A0").order;
  if (canonicalText([...a0Order].sort(cmp)) !== canonicalText([...probeA0Order].sort(cmp))) {
    fail("BL-073 A0 anchor set disagrees with the probe A0 anchor set");
  }

  const a2Midpoint = { matches: 0, mismatches: 0 };
  for (const [child, constructors] of constructorsOf.entries()) {
    const childRow = ledgerRows.find((candidate) => String(candidate.id) === child);
    if (!childRow || childRow.tier !== "A2" || childRow.role !== "anchor") continue;
    const offices = constructors.map((id) => landedOfficeOf.get(id));
    const predicted = Number(midZ7(BigInt(offices[0]), BigInt(offices[1])));
    if (predicted === landedOfficeOf.get(child)) a2Midpoint.matches += 1;
    else a2Midpoint.mismatches += 1;
  }
  if (a2Midpoint.matches !== 7 || a2Midpoint.mismatches !== 0) fail("A2 midpoint extension drift");

  const officeField = {
    support: {
      officeCarrying: officeCarrying.length,
      anchors: census.anchorRows.length,
      satellites: census.satelliteRows.length,
      withheld: withheld.length,
      withheldRoles: ["boundary"],
      statement: "the office field's support is exactly the non-boundary partition (70 anchors + 238 satellites = 308); the 154 boundary-role records are office-withheld - the tier/role partition bounds the field's domain",
    },
    orientationConstant: {
      C: kappaInputs.C,
      derivation: "C = (kappa1(mask) + pcSum(mask)) mod 7, constant across all 14 kappa-known anchors (A0 via the P7 position, A1 via the midpoint); the single orientation constant (BL-063's one named bit, the brightness/M1 alignment)",
      a0Values: kappaInputs.cA0,
      a1Values: kappaInputs.cA1,
    },
    anchorRule: {
      expression: "office(anchor) = (C - pcSum(mask)) mod 7",
      matches: census.anchorRows.length,
      mismatches: 0,
      statement: "the anchor office field is exactly a mask-arithmetic rule plus the orientation constant; verified over all 70 anchors",
    },
    satelliteRule: {
      expression: "office(satellite) = office(governing anchor)",
      matches: census.satelliteRows.length,
      mismatches: 0,
      pcSumDeltaHistogram: Object.fromEntries(Object.entries(satelliteDeltaHistogram).sort((left, right) => Number(left[0]) - Number(right[0]))),
      statement: "every satellite carries its governing anchor's office; the satellite-anchor pitch-sum delta is a single-degree mutation (the histogram records the exact integer values)",
    },
    midpointExtension: {
      A1: "office(A1 anchor) = midZ7 of the constructors' positions; 7/7 (BL-063, reproduced via the imported functions)",
      A2: `office(A2 anchor) = midZ7 of the A1 constructors' offices; ${a2Midpoint.matches}/7 (the midpoint law extends one tier beyond BL-063's landed scope; measured here)`,
      matches: a2Midpoint.matches,
      mismatches: a2Midpoint.mismatches,
    },
    orbitStepLaw: {
      expression: "office(position+1) - office(position) = 2 (mod 7) along every landed modal orbit (the governor-successor step)",
      tiers: orbitLaw,
      holds: true,
      statement: "the +2 office step is exact along all ten landed orbit orders, on both the landed and the predicted field; the cycle ground and the pcSum rule are mutually consistent",
    },
  };

  // ---- OP-AR-4: the comparison, field-for-field -----------------------------
  const anchorFieldMismatches = census.anchorRows.filter((anchor) => predictedOfficeOf.get(anchor.id) !== landedOfficeOf.get(anchor.id)).map((anchor) => anchor.id);
  const satelliteFieldMismatches = census.satelliteRows.filter((satellite) => predictedOfficeOf.get(satellite.id) !== landedOfficeOf.get(satellite.id)).map((satellite) => satellite.id);
  const censusFieldMismatches = census.instances.filter((instance) => {
    const predicted = predictedOfficeOf.get(instance.anchor) === predictedOfficeOf.get(instance.satellite);
    const landed = landedOfficeOf.get(instance.anchor) === landedOfficeOf.get(instance.satellite);
    return predicted !== landed;
  }).map((instance) => instance.key);
  const blockComparison = predictedPatterns.opAR1.blocks.map((block, index) => ({
    block: `${block.anchorTier}x${block.satelliteTier}`,
    match: canonicalText(block) === canonicalText(landedPatterns.opAR1.blocks[index]),
  }));
  const blockMismatches = blockComparison.filter((entry) => !entry.match).map((entry) => entry.block);
  const opAR2Match = canonicalText(predictedPatterns.opAR2) === canonicalText(landedPatterns.opAR2);
  const opAR3Match = canonicalText(predictedPatterns.opAR3) === canonicalText(landedPatterns.opAR3);
  const aggregateMatch = canonicalText(predictedPatterns.opAR1.aggregate) === canonicalText(landedPatterns.opAR1.aggregate);
  const allMatched = anchorFieldMismatches.length === 0 && satelliteFieldMismatches.length === 0
    && censusFieldMismatches.length === 0 && blockMismatches.length === 0 && aggregateMatch && opAR2Match && opAR3Match;

  // ---- OP-AR-3 verdict (the Klein-4 block-constancy measurement) ------------
  const opAR3TransportChecks = [];
  for (const mapId of MAP_ORDER) {
    const transports = landedPatterns.opAR3.transports[mapId];
    for (const family of ANCHOR_FAMILIES) {
      const entry = transports.find((transport) => transport.role === "anchor" && transport.family === family);
      if (!entry) fail(`anchor-family transport missing: ${mapId} ${family}`);
      opAR3TransportChecks.push({
        mapId,
        family,
        wellDefined: entry.wellDefined,
        wholePermutation: entry.wholePermutation,
        fixesOfficeThree: entry.map["3"] === 3,
        transportMap: entry.map,
      });
    }
  }
  const involutionPairChecks = KLEIN4_PAIRS.map(([left, right]) => {
    const check = (mapId, family) => opAR3TransportChecks.find((entry) => entry.mapId === mapId && entry.family === family).wellDefined;
    return {
      pair: [left, right],
      T1: { left: check("T1", left), right: check("T1", right) },
      T2: { left: check("T2", left), right: check("T2", right) },
      RHO: { left: check("RHO", left), right: check("RHO", right) },
    };
  });
  const fixedFamilyChecks = KLEIN4_FIXED.map((family) => {
    const check = (mapId) => opAR3TransportChecks.find((entry) => entry.mapId === mapId && entry.family === family).wellDefined;
    return { family, T1: check("T1"), T2: check("T2"), RHO: check("RHO") };
  });
  const anchorFamiliesConstant = opAR3TransportChecks.every((entry) => entry.wellDefined && entry.wholePermutation && entry.fixesOfficeThree);
  const satelliteTransports = MAP_ORDER.flatMap((mapId) => landedPatterns.opAR3.transports[mapId]
    .filter((entry) => entry.role === "satellite")
    .map((entry) => ({ mapId, family: entry.family, wellDefined: entry.wellDefined, fragments: entry.fragments })));
  const satelliteFragmentLoci = satelliteTransports.filter((entry) => !entry.wellDefined).map((entry) => `${entry.mapId}:${entry.family}`);

  // ---- OP-AR-2 dependence verdict ------------------------------------------
  const a0 = landedPatterns.opAR2.sets.A0;
  const a1 = landedPatterns.opAR2.sets.A1;
  const transportAffinity = {};
  for (const mapId of ["T1", "T2"]) {
    transportAffinity[mapId] = {};
    for (const [sourceSet, family, imageFamily] of [["A0", "7-35", "7-1"], ["A1", "7-34", "7-8"]]) {
      const entry = landedPatterns.opAR3.transports[mapId].find((transport) => transport.role === "anchor" && transport.family === family);
      const pairs = Object.entries(entry.map).map(([source, target]) => [Number(source), target]);
      let affine = null;
      for (let a = 1; a <= 6 && affine === null; a += 1) {
        for (let b = 0; b <= 6 && affine === null; b += 1) {
          if (pairs.every(([source, target]) => (a * source + b) % 7 === target)) affine = { a, b, expression: `y = ${a}x + ${b} (mod 7)` };
        }
      }
      transportAffinity[mapId][`${sourceSet}->${imageFamily}`] = {
        affine: affine !== null,
        expression: affine === null ? "non-affine (no single affine form fits the seven offices)" : affine.expression,
        map: entry.map,
      };
    }
  }
  const anchorSetDependent = !(canonicalText(a0.census) === canonicalText(a1.census)
    && canonicalText(a0.ownTierBlock) === canonicalText(a1.ownTierBlock));
  const opAR2Dependence = {
    reconstructionExactBoth: a0.reconstruction.matches === 7 && a0.reconstruction.mismatches === 0
      && a1.reconstruction.matches === 7 && a1.reconstruction.mismatches === 0,
    reconstructionLaws: { A0: a0.reconstruction.law, A1: a1.reconstruction.law },
    netRates: { A0: a0.census.rate, A1: a1.census.rate },
    ownTierClasses: { A0: { class: a0.ownTierBlock.class, rate: a0.ownTierBlock.rate }, A1: { class: a1.ownTierBlock.class, rate: a1.ownTierBlock.rate } },
    transportAffinity,
    verdict: anchorSetDependent ? "ANCHOR_SET_DEPENDENT" : "ANCHOR_SET_INDEPENDENT",
    statement: anchorSetDependent
      ? "the reconstruction exactness is set-independent (7/7 under both kappa laws); the agreement-field exactness is set-dependent: the A1 own-tier block is exact (24/24) while the A0 own-tier block is partial (36/48); net rates differ (A0 42/96, A1 34/132); the transport form differs (the D7<->A0 maps are affine; the D6<->A1 maps are not)"
      : "the A0 and A1 profiles coincide: the coupling does not depend on the anchor set",
  };

  // ---- the four OP result blocks --------------------------------------------
  const opAR1 = {
    predicate: "EXACT iff agree = n (binary); NEAR_EXACT iff 5/6 <= rate < 1; DEGENERATE iff agree = 0; PARTIAL otherwise",
    blocks: landedPatterns.opAR1.blocks,
    aggregate: landedPatterns.opAR1.aggregate,
    exactBlocks: landedPatterns.opAR1.blocks.filter((block) => block.class === "EXACT").map((block) => `${block.anchorTier}x${block.satelliteTier}`),
    degenerateBlocks: landedPatterns.opAR1.blocks.filter((block) => block.class === "DEGENERATE").map((block) => `${block.anchorTier}x${block.satelliteTier}`),
    nearExactBlocks: landedPatterns.opAR1.blocks.filter((block) => block.class === "NEAR_EXACT").map((block) => `${block.anchorTier}x${block.satelliteTier}`),
    sanityBlock: `D7xD6 ${landedPatterns.opAR1.blocks.find((block) => block.anchorTier === "D7" && block.satelliteTier === "D6").rate} (PARTIAL; the landed BL-070/BL-078 domain)`,
    reading: `the field is exact on ${landedPatterns.opAR1.aggregate.exact} blocks, degenerate on ${landedPatterns.opAR1.aggregate.degenerate}, partial on ${landedPatterns.opAR1.aggregate.partial} (${landedPatterns.opAR1.aggregate.blocks} nonempty blocks, ${landedPatterns.opAR1.aggregate.instances} instances, ${landedPatterns.opAR1.aggregate.agree} agreements); exactness is a property of the tier pair - the partition stratifies the field completely`,
  };
  const opAR2 = {
    sets: landedPatterns.opAR2.sets,
    context: landedPatterns.opAR2.context,
    dependence: opAR2Dependence,
  };
  const opAR3 = {
    klein4: { pairs: KLEIN4_PAIRS, fixed: KLEIN4_FIXED },
    involutionPairChecks,
    fixedFamilyChecks,
    anchorFamilyChecks: opAR3TransportChecks,
    anchorFamiliesConstant,
    satelliteTransports,
    satelliteFragmentLoci,
    verdict: anchorFamiliesConstant ? "BLOCK_CONSTANT_ON_ANCHOR_FAMILIES" : "FRAGMENTED_ON_ANCHOR_FAMILIES",
    statement: anchorFamiliesConstant
      ? `the office transport is a well-defined whole permutation on every anchor family under every coordinate map (${opAR3TransportChecks.length}/30 checks); the Klein-4 involution pairs and the fixed families are block-constant; the satellite-side extension carries ${satelliteFragmentLoci.length} fragment loci (${satelliteFragmentLoci.join(", ") || "none"}) where the coarse office-class transport is not a function of the office alone - the full-mask prediction still resolves them (see OP-AR-4)`
      : "the office transport fragments on an anchor family: the coupling does not respect the derived coordinate structure",
  };
  const opAR4 = {
    inputClass: {
      derived: [
        "the masks (pitch sets and pitch-sums)",
        "the tier/role/family partition (the licensed remainder marking)",
        "the GOVERNS/CONSTRUCTS edge content (the licensed remainder edge content; GOV-524/525: derivable up to the remainder)",
        "kappa via the masks-only BL-063 functions (P7, positions, constructors, midpoints)",
        "the cycle ground (the landed modal orbit orders)",
      ],
      never: [
        "the office field (index or relational) in the prediction path",
        "the recorded seat-contact relation",
        "the landed verdicts (except as comparison targets)",
      ],
    },
    stageA: {
      name: "structural prediction",
      blockInventory: { blocks: census.blocks.length, instances: census.instances.length, matched: true },
      fieldSupport: { officeCarrying: officeCarrying.length, withheld: withheld.length, matched: true },
      familyAction: { families: landedPatterns.opAR3.familyAction.T1.length, maps: MAP_ORDER.length, matched: true },
      statement: "the structural prediction (block inventory, counts, support, family action) is exact by construction from the masks + partition; any block boundary outside the office-carrying domain would have been a halt (the tier-granularity halt condition)",
    },
    stageB: {
      name: "office-field prediction",
      anchorRule: "office(anchor) = (C - pcSum) mod 7; C from kappa (the orientation constant)",
      satelliteRule: "office(satellite) = office(predicted governing anchor)",
      anchorsMatched: census.anchorRows.length - anchorFieldMismatches.length,
      satellitesMatched: census.satelliteRows.length - satelliteFieldMismatches.length,
      anchorMismatches: anchorFieldMismatches,
      satelliteMismatches: satelliteFieldMismatches,
      statement: "the two-stage predictor emits specific predicted fields (not profile claims): anchor offices from the mask rule, satellite offices from the governing structure; the predicted field is compared against the landed field node-by-node",
    },
    comparisons: {
      officeField: { anchors: `${census.anchorRows.length}/${census.anchorRows.length}`, satellites: `${census.satelliteRows.length}/${census.satelliteRows.length}`, mismatches: anchorFieldMismatches.length + satelliteFieldMismatches.length },
      agreementField: { instances: census.instances.length, mismatches: censusFieldMismatches.length },
      opAR1Blocks: { blocks: blockComparison.length, mismatches: blockMismatches, aggregateMatch },
      opAR2: { match: opAR2Match },
      opAR3: { match: opAR3Match },
    },
    tolerance: "zero mismatches (OD-89-4)",
    verdict: allMatched ? "INTERACTION_DERIVED" : (anchorFieldMismatches.length === 0 && satelliteFieldMismatches.length === 0 ? "INTERACTION_MIXED" : "INTERACTION_REMAINDER"),
    statement: allMatched
      ? "the interaction pattern is derived: the predicted field and every OP-AR-1/2/3 pattern match the landed field field-for-field at zero tolerance; the office field's interaction with the anchor sets and the tier/role partition is a function of the derived-input class alone"
      : "the interaction pattern is not fully derived: the mismatches (named field-for-field) are the interaction's remainder content",
  };

  // ---- synthesis ------------------------------------------------------------
  const synthesis = {
    verdict: opAR4.verdict,
    scope: "the anchoring remainder's interaction structure: the office field's coupling to the anchor sets (A0/A1) and the tier/role partition over the 462-record ledger",
    findings: [
      "the office field's support is exactly the non-boundary partition: 308 office-carrying records (70 anchors + 238 satellites), 154 office-withheld boundary records",
      `the anchor field is the mask rule office = (C - pcSum) mod 7 with C = ${kappaInputs.C} (the kappa orientation constant): 70/70 anchors`,
      "every satellite carries its governing anchor's office: 238/238; the satellite-side structure adds no independent office content",
      "the +2 governor-successor step holds along all ten landed modal orbits on both fields",
      "the midpoint law extends to A2 (7/7): the A-tier office field is fully kappa-derivable (A0 position, A1 midpoint, A2 midpoint-of-midpoints)",
      `OP-AR-1: ${landedPatterns.opAR1.aggregate.blocks} blocks, ${landedPatterns.opAR1.aggregate.exact} exact, ${landedPatterns.opAR1.aggregate.degenerate} degenerate, ${landedPatterns.opAR1.aggregate.partial} partial, ${landedPatterns.opAR1.aggregate.nearExact} near-exact; the partition stratifies the field completely`,
      "OP-AR-2: ANCHOR_SET_DEPENDENT - reconstruction exact on both sets (7/7, 7/7), but the agreement-field exactness depends on the set (A1 own-tier 24/24 exact; A0 own-tier 36/48 partial; net A0 42/96 vs A1 34/132) and the transport form differs (D7<->A0 affine; D6<->A1 non-affine)",
      `OP-AR-3: ${opAR3.verdict} - the office transport is a well-defined whole permutation on all 10 anchor families under all 3 maps (30/30), covering the Klein-4 involution pairs and the fixed families; the satellite-side carries ${satelliteFragmentLoci.length} coarse fragment loci`,
      `OP-AR-4: ${opAR4.verdict} - the predicted field matches the landed field node-by-node (70/70 + 238/238), the agreement field matches instance-by-instance (0/${census.instances.length} mismatches), and every pattern matches field-for-field`,
    ],
    remainderStatement: allMatched
      ? "the office field's content beyond the derived-input class is exactly zero within this probe's scope: its values are mask arithmetic (pcSum) + the one orientation constant + the governing structure; its interaction pattern with the anchor sets and the tier/role partition is derived. The anchoring remainder's effective size shrinks to its named residual: the tier/role partition and edge content (GOV-524/525's derived-up-to-remainder class), the one orientation bit (BL-063/BL-065), and presentation conventions"
      : "the interaction carries remainder content beyond the derived-input class; the mismatches name it",
    significance: "read together with BL-080 Gate 3's provenance-independence (the pipeline's output is independent of the inputs' provenance), this probe's result completes the independence at the relationships level: the office field's coupling structure - where it is exact, where it degrades, how it respects the tier blocks and the anchor sets - is derived from the same machinery that derives the values. The un-granting program is characterized at its deepest available level: not only the values but the relationships are derived, up to the named remainder. No GOVERNS admission, no claim event: the characterization is planning evidence",
    d7Tier: "D7 remains hypothesis-tier: no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim",
  };

  // ---- GSL treatment (inline, un-promoted, unapplied) ----------------------
  const gslTreatment = {
    rule: "the BL-072/BL-084/BL-088 precedent: findings land as an inline, unapplied candidate draft; no new GSL number is registered; no registration is performed by this artifact",
    candidateDraft: {
      status: "GSL-9 candidate draft (un-promoted, inline, unapplied)",
      text: "the office-field interaction law: the field's support is exactly the non-boundary partition; the anchor field is office = (C - pcSum) mod 7 with C the one orientation constant (kappa's named bit); every satellite carries its governing anchor's office; the tier blocks, the anchor-set profiles and the family transports of the coupling (including where the coarse office-class projection fragments) are exact consequences of the law - the interaction structure is derived from the same machinery as the values",
    },
    generalizationVerdict: "INTERACTION_DERIVED within the probe's scope: the office field's interaction with the anchor sets and the tier/role partition carries zero content beyond the derived-input class (masks, the licensed partition/edge content, kappa, the cycle ground) and the named remainder",
    newEntry: "none: no new GSL number; no status change; no registration",
  };

  // ---- grounding receipt ----------------------------------------------------
  const familyTableCrossCheck = (() => {
    const rows = [];
    for (const mapId of MAP_ORDER) {
      for (const entry of bl076.probe.familyPermutation[mapId]) {
        const derived = landedPatterns.opAR3.familyAction[mapId]
          .find((candidate) => candidate.role === "anchor" && candidate.family === entry.sourceFamily);
        rows.push({
          mapId,
          sourceFamily: entry.sourceFamily,
          imageFamily: entry.imageFamily,
          derivedImageFamily: derived.imageFamilies[0],
          match: derived.imageFamilies.length === 1 && derived.imageFamilies[0] === entry.imageFamily,
        });
      }
    }
    const mismatches = rows.filter((row) => !row.match);
    if (mismatches.length !== 0) fail(`family-table cross-check failed: ${mismatches.length} mismatches`);
    return {
      map: "anchor-family involution table vs BL-076 familyPermutation",
      rows: rows.length,
      mismatches: 0,
      statement: "the landed BL-076 family-level permutes are reproduced key-for-key from the ledger masks (30/30)",
    };
  })();

  const grounding = {
    receipt: [
      { claim: "the containment graph: 330 pentatonic x 21 parentsRooted; 462 heptatonic x 15 subnodes; byte-stable", source: `${BIPARTITE_PATH} (sha256 ${bipartiteSha})`, verdict: "GROUNDED (EXACT; carried for chain completeness, not consumed)" },
      { claim: "kappa: the P7 line, the constructor pairs and the midpoint law; kappa1 reproduces the 7 canonical A0 offices; midZ7 reproduces the A1 offices", source: `${BL063_PATH} (fingerprint ${bl063Fingerprint}) + masks-only re-derivation via the imported BL-063 functions`, verdict: "GROUNDED (EXACT)" },
      { claim: "BL-068: the ti-pole availability domain 36 = 14 + 22; the office-linking axis CLEAN_SPLIT 14/0/0/22; the Z-interface NON_SEPARATING; the invariant geography", source: `${BL068_PATH} (fingerprint ${bl068Fingerprint})`, verdict: "GROUNDED (EXACT; fingerprint)" },
      { claim: "BL-070: PARTIAL_DERIVATION; cleanSplitCount 0; the near-miss 12/0/2/22", source: `${BL070_PATH} (fingerprint ${bl070Fingerprint})`, verdict: "GROUNDED (EXACT; fingerprint)" },
      { claim: "BL-078: the re-test REPLICATED; R-OFF 14/0/0/22 on the re-verified 36-instance domain", source: `${BL078_PATH} (fingerprint ${bl078Fingerprint})`, verdict: "GROUNDED (EXACT; the sanity gate target)" },
      { claim: "the tier/role/family partition: 462 records = 70 anchors + 238 satellites + 154 boundary; office support 308", source: `${LEDGER_PATH} + ${NETWORK_PATH} (GOVERNS 238, CONSTRUCTS 28)`, verdict: "GROUNDED (EXACT)" },
      { claim: "BL-076: the family-level Klein-4 involution (7-35<->7-1, 7-34<->7-8, 7-Z37<->7-Z17; fixing 7-33/7-22/7-15/7-Z12); the office action faithful", source: `${BL076_PATH} (fingerprint ${bl076Fingerprint}) + ledger re-derivation`, verdict: "GROUNDED (EXACT; the family table cross-checked key-for-key)" },
      { claim: "GOV-524/525: the GOVERNS edge content and the tier<->family correspondence derivable up to the remainder; the Klein-4 family involution is the derived coordinate structure", source: "scrum/BACKLOG.md GOV-524/GOV-525 sections + BL-076's table", verdict: "GROUNDED (admission record; operational content re-verified via BL-076)" },
      { claim: "BL-080 Gate 2: the derived-input class (kappa, mask geometry, cycle ground, the licensed remainder)", source: "scrum/plan/bl-080-governs-derivation-memo.md + the Gate 3 receipt (inputProvenance derived)", verdict: "GROUNDED (EXACT; class definition)" },
      { claim: "the cycle ground: the ten M-cycle orbit orders; the D7 order equals the network orbit; the A0 order equals BL-073's", source: `${PROBE_PATH} (fingerprint ${probeFingerprint}) + ${BL073_PATH} (fingerprint ${bl073Fingerprint}) + ${NETWORK_PATH}`, verdict: "GROUNDED (EXACT)" },
    ],
    familyTableCrossCheck,
    calibration: {
      sanityGate: "EXACT (V-AR-0)",
      anchorRule: `${census.anchorRows.length}/${census.anchorRows.length}`,
      satelliteRule: `${census.satelliteRows.length}/${census.satelliteRows.length}`,
      orbitStepLaw: "10/10 tiers",
      a2Midpoint: "7/7",
    },
  };

  // ---- accounting -----------------------------------------------------------
  const accounting = {
    masksOnly: [
      "the office-carrying anchor-satellite Hamming-2 census (1128 instances, 57 blocks) and every block aggregate, rate and exactness classification",
      "the patterns: the anchor-set profiles, the family action, and the office transports (computed over both the predicted and the landed field through the same machinery)",
      "the pcSum office rule arithmetic and the kappa re-derivation via the imported masks-only BL-063 functions (P7, positions, constructors, midpoints)",
      "the cycle-ground +2 step verification along the ten landed orbit orders",
    ],
    canonicalComputation: [
      "the tier/role/family partition (the licensed remainder marking; canonical-read, labelled)",
      "the GOVERNS/CONSTRUCTS edge content (the licensed remainder edge content; labelled; GOV-524/525's derived-up-to-remainder class)",
      "the office field: read as the comparison target only, never in the prediction path",
      "the recorded seat-contact relation: the sanity gate's comparison target only",
      "the landed modal orbit orders (cycle ground) and the chain-artifact reads (fingerprint self-checked)",
    ],
    remainingGranted: [
      "the tier/role partition and edge content (the anchoring remainder itself; GOV-524/525)",
      `the one orientation constant C = ${kappaInputs.C} (kappa's named bit; BL-063/BL-065; the brightness/M1 alignment)`,
      "presentation conventions; the frame vocabulary (never a design input)",
    ],
    statement: allMatched
      ? "the office field's interaction structure is derived from masks + the licensed partition/edge content + kappa + the cycle ground: the predicted field matches node-by-node and every pattern field-for-field. The field's content beyond this class is zero within the probe's scope; the anchoring remainder's effective content shrinks to the partition/edge remainder, the orientation bit, and presentation conventions"
      : "the interaction structure carries remainder content; the mismatches name it",
    officePathFence: "the prediction path reads zero office bytes: the predicted field is built from masks, partition, edge content, kappa and the cycle ground; the office field enters only as the comparison target (validator-enforced two-region static check)",
  };

  const fences = {
    d7HypothesisTier: "D7 hypothesis-tier throughout: no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim",
    noGovernsAdmission: "no GOVERNS admission; no new GSL number; no registration; the characterization is planning evidence",
    noClaimEvent: "no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20/21 byte-untouched)",
    noMechanism: "no mechanism (causal) claim beyond the verdict: the interaction is characterized, not causally explained; production questions stay open",
    noLeaning: "the D7 derivation route may not cite this probe's results until it lands; no leaning",
    noG1: "no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment",
    noWrites: "no canonical/Court/schema/Neo4j writes; all sources read-only",
    membrane: "the frame (scrum/plan/harmonic-comprehension-map.md sections 2.6/2.7) is interpretation vocabulary, never a probe input or design input",
    sessionProse: "session prose is context, not evidence",
    sanityHalt: "any mismatch with a landed artifact was a halt, not a finding (V-AR-0 field-for-field)",
  };

  const contractCitations = [
    "scrum/BACKLOG.md (GOV-524/GOV-525: the GOVERNS/coordinate admissions; BL-070/BL-078 landing records)",
    "orrery/src/generated/bl063-office-reconstruction.v1.json (kappa; the P7 line; the midpoint law; the one orientation bit; fingerprint self-checked)",
    "orrery/src/generated/bl068-d7-asymmetry.v1.json (GSL-3; the ti-pole domain 36; the office-linking axis; fingerprint self-checked)",
    "orrery/src/generated/bl070-d7-derivation.v1.json (PARTIAL_DERIVATION; cleanSplitCount 0; fingerprint self-checked)",
    "orrery/src/generated/bl078-d7-retest.v1.json (R-OFF 14/0/0/22; REPLICATED; the sanity-gate target; fingerprint self-checked)",
    "orrery/src/generated/bl076-bijection-probe.v1.json (the Klein-4 family involution table; fingerprint self-checked)",
    "orrery/src/generated/d-tier-operator-probe.v1.json (the M-cycle orbit orders; fingerprint self-checked)",
    "orrery/src/generated/bl073-isometry-probe.v1.json (the A0 order; fingerprint self-checked)",
    "scrum/plan/bl-080-governs-derivation-memo.md (the Gate 2 derived-input class; the Gate 3 provenance-independence context)",
    "canonical/universal-heptatonic-ledger.csv (masks, tier/role/family partition, office fields as comparison target)",
    "canonical/universal-network-data.json (GOVERNS/CONSTRUCTS edge content; seat contacts as sanity target; orbits)",
    "derived/hypergraph/bipartite-inclusion-v1.json (carried for chain completeness; not consumed)",
  ];

  const notAccomplished = [
    "no new measurement: masks-only arithmetic and re-derivation over landed bytes (the descriptive-read class)",
    "no mechanism (causal) claim beyond the verdict; production questions stay open",
    "no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20/21 byte-untouched)",
    "no GOVERNS admission; no new GSL number; no registration",
    "no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment",
    "no canonical/Court/schema/Neo4j writes; D7 hypothesis-tier throughout",
    "no D7 derivation-route citation of this probe (no leaning)",
  ];

  const core = {
    schemaVersion: SCHEMA_VERSION,
    investigationId: INVESTIGATION_ID,
    status: "planning_evidence",
    generator: "scripts/build-bl089-anchoring-remainder-interaction.mjs",
    role: "the anchoring-remainder interaction probe: the D7 office field's coupling to the anchor sets (A0/A1) and the tier/role partition, characterized and tested for derivability from the derived-input class; planning evidence, D7 hypothesis-tier",
    preRegistration: PRE_REGISTRATION,
    method: {
      domain: "the office-carrying anchor-satellite Hamming-2 census: all (h, s), h in the 70 ledger anchors, s in the 238 ledger satellites, hamming12(mask h, mask s) = 2; 1128 instances in 57 (anchor-tier x satellite-tier) blocks; the D7xD6 block (36 instances) is the sanity-gate block",
      officeRule: "the field under test: [o(s) = o(h)] (the BL-070/BL-078 selection's ground)",
      predictor: "two-stage (structural then field); the field stage: anchors via office = (C - pcSum) mod 7 with C the kappa orientation constant; satellites via the governing anchor; then OP-AR-1/2/3 recomputed from predicted offices",
      codeReuse: "kappa functions imported verbatim from scripts/build-bl063-office-reconstruction.mjs (the masks-only P7/kappa/pi/midpoint functions); the same pattern machinery runs over the predicted and the landed field (differences are data differences)",
      descriptiveRead: "the domain construction and all arithmetic are analysis over landed bytes (masks-only reach; the BL-070/BL-086 descriptive-read class); no new universe, no new witness discovery",
    },
    sourceBindings: [
      { artifact: LEDGER_PATH, sha256: fileSha(LEDGER_PATH), role: "462-record universe: masks, tier/role/family partition; office fields as the comparison target" },
      { artifact: NETWORK_PATH, sha256: fileSha(NETWORK_PATH), role: "GOVERNS/CONSTRUCTS edge content (licensed remainder); seat contacts (sanity target); the D7 orbit cross-check" },
      { artifact: BIPARTITE_PATH, sha256: bipartiteSha, role: "the containment graph (carried for chain completeness; not consumed)" },
      { artifact: BL063_PATH, sha256: fileSha(BL063_PATH), role: "chain anchor: kappa (the orientation constant); fingerprint self-check" },
      { artifact: BL068_PATH, sha256: fileSha(BL068_PATH), role: "chain anchor: the ti-pole domain and axes; fingerprint self-check" },
      { artifact: BL070_PATH, sha256: fileSha(BL070_PATH), role: "chain anchor: PARTIAL_DERIVATION context; fingerprint self-check" },
      { artifact: BL078_PATH, sha256: fileSha(BL078_PATH), role: "chain anchor + the sanity-gate target (R-OFF 14/0/0/22); fingerprint self-check" },
      { artifact: BL076_PATH, sha256: fileSha(BL076_PATH), role: "chain anchor: the family involution table; fingerprint self-check" },
      { artifact: PROBE_PATH, sha256: fileSha(PROBE_PATH), role: "chain anchor: the cycle ground (orbit orders); fingerprint self-check" },
      { artifact: BL073_PATH, sha256: fileSha(BL073_PATH), role: "chain anchor: the A0 order; fingerprint self-check" },
    ],
    base: {
      chainFingerprints: {
        bl063: bl063Fingerprint,
        bl068: bl068Fingerprint,
        bl070: bl070Fingerprint,
        bl078: bl078Fingerprint,
        bl076: bl076Fingerprint,
        probe: probeFingerprint,
        bl073: bl073Fingerprint,
      },
      bipartiteSha,
      importPolicy: "chain artifacts are consumed by fingerprint self-check (no literals in this generator); the kappa functions are imported verbatim from the BL-063 generator (masks-only); no landed artifact is rewritten",
    },
    grounding,
    sanityGate,
    officeField,
    census: {
      anchors: census.anchorRows.length,
      satellites: census.satelliteRows.length,
      instances: census.instances.length,
      blocks: census.blocks.length,
      blockKeyOrder: census.blocks.map((block) => `${block.anchorTier}x${block.satelliteTier}`),
    },
    opAR1,
    opAR2,
    opAR3,
    opAR4,
    synthesis,
    gslTreatment,
    accounting,
    fences,
    contractCitations,
    notAccomplished,
  };
  const investigationFingerprint = sha256(canonicalText(core));
  return { ...core, investigationFingerprint };
}

export function serializeInvestigation(investigation) {
  return `${canonicalText(investigation)}\n`;
}

function main() {
  const check = process.argv.includes("--check");
  const investigation = buildInvestigation();
  const serialized = serializeInvestigation(investigation);
  const outputPath = path.join(root, OUTPUT_PATH);
  const summary = {
    output: OUTPUT_PATH,
    check,
    sanityGate: `${investigation.sanityGate.confusion.tp}/${investigation.sanityGate.confusion.fp}/${investigation.sanityGate.confusion.fn}/${investigation.sanityGate.confusion.tn} (${investigation.sanityGate.verdict})`,
    officeField: {
      C: investigation.officeField.orientationConstant.C,
      anchors: `${investigation.officeField.anchorRule.matches}/70`,
      satellites: `${investigation.officeField.satelliteRule.matches}/238`,
    },
    opAR1: investigation.opAR1.aggregate,
    opAR2: investigation.opAR2.dependence.verdict,
    opAR3: investigation.opAR3.verdict,
    opAR4: { verdict: investigation.opAR4.verdict, comparisons: investigation.opAR4.comparisons },
    investigationFingerprint: investigation.investigationFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_BL089_ANCHORING_REMAINDER_INTERACTION");
    console.log(JSON.stringify({ ...summary, stale: false }, null, 2));
    return;
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized);
  console.log(JSON.stringify({ ...summary, sha256: sha256(serialized) }, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
