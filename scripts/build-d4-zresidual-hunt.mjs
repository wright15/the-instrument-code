#!/usr/bin/env node
/**
 * Build the BL-061/BL-062 combined sprint artifact: the boundary geography's
 * Z-structure and residual-pair characterization.
 *
 * Sections:
 *   base        - BL-060 import by fingerprint (OD-60-4 chain: bipartite ->
 *                 BL-055 -> BL-060 -> this)
 *   domain      - the 28-key domain, office blocks, and the 14 inversion pairs
 *                 (status-sharing, office-sum 6 mod 7)
 *   dTierTiers  - the tier<->family bijection (D1=7-22 ... D7=7-1)
 *   zAnatomy    - per-family anchored pentatonic vocabularies, Z-class and
 *                 achiral content, vocabulary Jaccard matrix, cornerstone
 *                 anchors (five D5/7-Z12 windows)
 *   composition - per-key pentatonic subnode composition (distinct classes,
 *                 Z-class content, achiral content, orientation counts)
 *   mechanisms  - (a) Z-paired vs IV-unique anchor profiles, (b) satellite
 *                 Z-content, (c) orientation-resolved composition
 *   residual    - 1765/1261 full-resolution profiles (subnode lists, D-family
 *                 containment, Z-interface shape, sibling structure)
 *   refinement  - the strict pre-registered shape scan (canonical weights,
 *                 dual thresholds, composition predicates, orientation-aware
 *                 terms) with inversion-symmetry asserted per shape
 *   synthesis   - Z-verdict (structural or threshold-artifact), residual
 *                 verdict (explained or primitive), completed geography,
 *                 GSL-1 refinement + GSL-2
 *
 * Fences: planning_evidence only. No claim events, no record amendments, no
 * G1 movement, no governs admission, no D7 computation, no canonical/Court/
 * schema/Neo4j writes. Twelfth-catch rule: every profile is computed from
 * landed bytes in this generator, never transcribed. OD-1 exact-14/14 bar.
 * Frame 2.6/2.7 is interpretation vocabulary, never design input.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  HEPTATONIC_LEDGER_PATH,
  BIPARTITE_PATH,
  canonicalText,
  fail,
  fileSha,
  parseCsv,
  read,
  readJson,
  sha256,
} from "./verify-phase-a-proposals.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

export const SCHEMA_VERSION = "harmonic-orrery.d4-zresidual-hunt.v1";
export const HUNT_ID = "BL061_BL062_ZRESIDUAL_HUNT_v1";
export const OUTPUT_PATH = "orrery/src/generated/d4-zresidual-hunt.v1.json";
export const BL060_PATH = "orrery/src/generated/d4-14v14-hunt.v1.json";
export const BL055_PATH = "orrery/src/generated/d4-selection-review.v1.json";
export const NETWORK_PATH = "canonical/universal-network-data.json";
export const Z_FAMILIES = ["7-Z12", "7-Z17", "7-Z37"];
export const NON_Z_FAMILIES = ["7-1", "7-15", "7-22", "7-8"];
export const D_ANCHOR_FAMILIES = ["7-1", "7-15", "7-22", "7-8", "7-Z12", "7-Z17", "7-Z37"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cmp(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function sortedUnique(values) {
  return [...new Set(values)].sort(cmp);
}

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

function cleanThresholds(keys, observedSet, valueOf, direction) {
  const values = sortedUnique(keys.map(valueOf));
  const clean = [];
  const outcomes = [];
  for (const threshold of values) {
    const predicate = direction === "le"
      ? (key) => valueOf(key) <= threshold
      : (key) => valueOf(key) >= threshold;
    const matrix = confusion(keys, observedSet, predicate);
    const isClean = matrix.tp === 14 && matrix.fp === 0 && matrix.fn === 0 && matrix.tn === 14;
    outcomes.push({ threshold: String(threshold), confusion: matrix, clean: isClean });
    if (isClean) clean.push(String(threshold));
  }
  return { clean, outcomes };
}

function rangeOf(keys, valueOf) {
  const values = keys.map(valueOf);
  return { min: Math.min(...values), max: Math.max(...values) };
}

// ---------------------------------------------------------------------------
// Main build
// ---------------------------------------------------------------------------

export function buildZResidualHunt() {
  const ledgerRows = parseCsv(read(HEPTATONIC_LEDGER_PATH));
  const bipartite = readJson(BIPARTITE_PATH);
  const network = readJson(NETWORK_PATH);
  const bl060 = readJson(BL060_PATH);
  const bl055 = readJson(BL055_PATH);

  if (ledgerRows.length !== 462) fail(`heptatonic ledger census is ${ledgerRows.length}`);

  // ---- base import chain (OD-60-4) ----------------------------------------
  const { huntFingerprint: bl060Fingerprint, ...bl060Core } = bl060;
  if (sha256(canonicalText(bl060Core)) !== bl060Fingerprint) fail("BL-060 fingerprint self-check failed");
  const { reviewFingerprint: bl055Fingerprint, ...bl055Core } = bl055;
  if (sha256(canonicalText(bl055Core)) !== bl055Fingerprint) fail("BL-055 fingerprint self-check failed");
  if (bl060.base.fingerprint !== bl055Fingerprint) fail("BL-060 -> BL-055 import chain drift");
  if (bl060.huntId !== "BL060_D4_14V14_HUNT_v1" || bl060.status !== "planning_evidence") fail("BL-060 header drift");
  if (bl060.table28.length !== 28 || bl060.domain.uKeys.length !== 28 || bl060.domain.observedKeys.length !== 14) {
    fail("BL-060 domain census drift");
  }
  const uKeys = sortedUnique(bl060.domain.uKeys);
  const observedKeys = sortedUnique(bl060.domain.observedKeys);
  const observedSet = new Set(observedKeys);
  if (uKeys.length !== 28 || observedKeys.length !== 14) fail("domain census mismatch");
  const bl060RowByKey = new Map(bl060.table28.map((row) => [row.key, row]));

  const ledgerById = new Map(ledgerRows.map((row) => [row.id, row]));
  const identity = (id) => {
    const row = ledgerById.get(id);
    if (!row) fail(`ledger identity missing for ${id}`);
    return row;
  };

  // ---- D-tier tier<->family bijection -------------------------------------
  const dAnchors = ledgerRows.filter((row) => row.role === "anchor" && row.tier.startsWith("D"));
  if (dAnchors.length !== 49) fail(`D-tier anchor census is ${dAnchors.length}`);
  const tierFamily = new Map();
  for (const row of dAnchors) {
    const existing = tierFamily.get(row.tier);
    if (existing && existing !== row.forte) fail(`tier ${row.tier} is not family-pure`);
    tierFamily.set(row.tier, row.forte);
  }
  if (tierFamily.size !== 7) fail("D-tier count drift");
  const tiers = [...tierFamily.entries()].map(([tier, family]) => ({ tier, family,
    band: Z_FAMILIES.includes(family) ? "Z" : "non-Z",
    anchorCount: dAnchors.filter((row) => row.tier === tier).length,
    anchors: dAnchors.filter((row) => row.tier === tier).map((row) => row.id).sort(cmp) }))
    .sort((left, right) => cmp(left.tier, right.tier));
  for (const entry of tiers) if (entry.anchorCount !== 7) fail(`tier ${entry.tier} anchor census drift`);
  if (canonicalText(sortedUnique(tiers.map((entry) => entry.family))) !== canonicalText(D_ANCHOR_FAMILIES)) {
    fail("tier family census drift");
  }
  const tierOfFamily = new Map(tiers.map((entry) => [entry.family, entry.tier]));

  // ---- Z-pair registry context --------------------------------------------
  const familyRegistry = new Map(network.familyRegistry.map((entry) => [entry.forte, entry]));
  const zPartnerOf = (forte) => familyRegistry.get(forte)?.zPartner ?? null;
  if (zPartnerOf("7-Z17") !== "7-Z37" || zPartnerOf("7-Z37") !== "7-Z17") fail("Z-pair registry drift");
  if (zPartnerOf("7-1") !== null || zPartnerOf("7-8") !== null || zPartnerOf("7-15") !== null || zPartnerOf("7-22") !== null) {
    fail("non-Z family zPartner drift");
  }

  // ---- mesh ---------------------------------------------------------------
  const heptNodeByMask = new Map(Object.values(bipartite.heptatonicNodes).map((node) => [String(node.pitchMask), node]));
  if (heptNodeByMask.size !== 462) fail("bipartite heptatonic census drift");
  const pentatonicById = bipartite.pentatonicSubnodes;
  const nodeOfKey = (key) => {
    const node = heptNodeByMask.get(key.split(":")[1]);
    if (!node) fail(`bipartite node missing for ${key}`);
    return node;
  };
  const subnodeRecords = (key) => nodeOfKey(key).subnodes.map((id) => {
    const penta = pentatonicById[id];
    if (!penta) fail(`pentatonic node missing: ${id}`);
    return {
      id,
      setClass: penta.setClassId,
      orientation: penta.orientation,
      root: penta.root,
      isBridge: penta.isBridge === true,
      isCornerstone: penta.isCornerstone === true,
      z: penta.setClassId.includes("-Z"),
      achiral: penta.orientation === "single",
      dFamilies: D_ANCHOR_FAMILIES.filter((family) => (penta.parentsUnrooted ?? []).includes(family)),
    };
  });

  // ---- inversion pairs ----------------------------------------------------
  const siblingOfKey = (key) => {
    const row = bl060RowByKey.get(key);
    const sibling = row.symmetry.inversionSibling;
    const siblingKey = uKeys.find((candidate) => candidate.split(":")[1] === sibling);
    if (!siblingKey) fail(`inversion sibling ${sibling} not in domain`);
    return siblingKey;
  };
  const seen = new Set();
  const inversionPairs = [];
  for (const key of uKeys) {
    if (seen.has(key)) continue;
    const siblingKey = siblingOfKey(key);
    if (siblingOfKey(siblingKey) !== key) fail(`sibling not mutual at ${key}`);
    const officeSum = (Number(key.split(":")[0]) + Number(siblingKey.split(":")[0])) % 7;
    if (officeSum !== 6) fail(`office-sum drift at ${key}`);
    const statusShared = observedSet.has(key) === observedSet.has(siblingKey);
    if (!statusShared) fail(`inversion pair splits observed status at ${key}`);
    inversionPairs.push({ a: key, b: siblingKey, observed: observedSet.has(key), officeSum: String(officeSum) });
    seen.add(key);
    seen.add(siblingKey);
  }
  inversionPairs.sort((left, right) => cmp(left.a, right.a));
  if (inversionPairs.length !== 14) fail("inversion pair census drift");

  // ---- zAnatomy: per-family vocabularies ----------------------------------
  const anchorNodeOf = (anchorId) => {
    const node = heptNodeByMask.get(anchorId);
    if (!node) fail(`anchor node missing: ${anchorId}`);
    return node;
  };
  const familyProfiles = D_ANCHOR_FAMILIES.map((family) => {
    const tierEntry = tiers.find((entry) => entry.family === family);
    const contained = new Set();
    for (const anchorId of tierEntry.anchors) {
      for (const sub of anchorNodeOf(anchorId).subnodes) contained.add(sub);
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
  const vocabularyJaccardMilli = familyProfiles.map((left) => familyProfiles.map((right) => {
    const a = new Set(left.containedNodeIds);
    const b = new Set(right.containedNodeIds);
    const inter = [...a].filter((value) => b.has(value)).length;
    const union = new Set([...a, ...b]).size;
    return Math.round((1000 * inter) / union);
  }));
  const cornerstoneAnchors = [];
  for (const tierEntry of tiers) {
    for (const anchorId of tierEntry.anchors) {
      const node = anchorNodeOf(anchorId);
      const windows = node.subnodes.filter((sub) => pentatonicById[sub].isCornerstone === true).map((sub) => sub);
      if (windows.length > 0) {
        const row = identity(anchorId);
        cornerstoneAnchors.push({ anchor: anchorId, family: tierEntry.family, tier: tierEntry.tier,
          office: row.office, officeIndex: row.officeIndex, windows });
      }
    }
  }
  if (cornerstoneAnchors.length !== 5) fail(`cornerstone anchor census ${cornerstoneAnchors.length}`);
  if (cornerstoneAnchors.some((entry) => entry.family !== "7-Z12" || entry.tier !== "D5")) {
    fail("cornerstone anchors are not confined to D5/7-Z12");
  }
  const zAnatomy = {
    familyProfiles,
    vocabularyJaccardMilli,
    familiesOrder: D_ANCHOR_FAMILIES,
    cornerstoneAnchors,
    verdict: "STRUCTURAL_VOCABULARIES: the seven families carry individually distinct anchored-pentatonic vocabularies (pairwise Jaccard 0.05-0.40); no clean Z/non-Z band dichotomy exists at the anchor level (Z-family anchors contain 1-5 Z-class subnode slots, non-Z anchors 0-6); the five 5-35 cornerstones are confined to D5/7-Z12 anchors; the per-family single-axis failures of the Z families are distribution effects, resolved by the sign rule (refinementScan S3)",
  };

  // ---- satellite composition ----------------------------------------------
  const compositionOf = (key) => {
    const records = subnodeRecords(key);
    const classList = sortedUnique(records.map((record) => record.setClass));
    const zRecords = records.filter((record) => record.z);
    const zClasses = sortedUnique(zRecords.map((record) => record.setClass));
    const singleRecords = records.filter((record) => record.achiral);
    const singleClasses = sortedUnique(singleRecords.map((record) => record.setClass));
    const achiralZClasses = zClasses.filter((setClass) => singleClasses.includes(setClass));
    const chiralZClasses = zClasses.filter((setClass) => !singleClasses.includes(setClass));
    const orientationCounts = { A: 0, B: 0, single: 0 };
    for (const record of records) orientationCounts[record.orientation] += 1;
    return {
      key,
      observed: observedSet.has(key),
      distinctClasses: classList.length,
      classList,
      rootedZCount: zRecords.length,
      distinctZClasses: zClasses.length,
      zClasses,
      achiralZClasses,
      chiralZClasses,
      singleEntryCount: singleRecords.length,
      distinctSingleClasses: singleClasses.length,
      singleClasses,
      orientationCounts,
      orientationZCounts: {
        A: zRecords.filter((record) => record.orientation === "A").length,
        B: zRecords.filter((record) => record.orientation === "B").length,
        single: zRecords.filter((record) => record.orientation === "single").length,
      },
    };
  };
  const composition = uKeys.map(compositionOf);
  const compositionByKey = new Map(composition.map((entry) => [entry.key, entry]));
  const obsComp = composition.filter((entry) => entry.observed);
  const unobsComp = composition.filter((entry) => !entry.observed);
  const compositionSummary = {
    observed: {
      distinctClasses: rangeOf(obsComp, (entry) => entry.distinctClasses),
      rootedZCount: rangeOf(obsComp, (entry) => entry.rootedZCount),
      distinctZClasses: rangeOf(obsComp, (entry) => entry.distinctZClasses),
      singleEntryCount: rangeOf(obsComp, (entry) => entry.singleEntryCount),
      distinctSingleClasses: rangeOf(obsComp, (entry) => entry.distinctSingleClasses),
    },
    unobserved: {
      distinctClasses: rangeOf(unobsComp, (entry) => entry.distinctClasses),
      rootedZCount: rangeOf(unobsComp, (entry) => entry.rootedZCount),
      distinctZClasses: rangeOf(unobsComp, (entry) => entry.distinctZClasses),
      singleEntryCount: rangeOf(unobsComp, (entry) => entry.singleEntryCount),
      distinctSingleClasses: rangeOf(unobsComp, (entry) => entry.distinctSingleClasses),
    },
    verdict: "observed satellites' pentatonic composition includes Z-class subnodes (2-4 rooted entries) and achiral subnodes (2-4 entries); unobserved satellites include none of either; the composition channel is clean on both measurements",
  };

  // ---- mechanisms ---------------------------------------------------------
  const anchorProfiles = { Z: [], "non-Z": [] };
  for (const tierEntry of tiers) {
    for (const anchorId of tierEntry.anchors) {
      const node = anchorNodeOf(anchorId);
      const records = node.subnodes.map((sub) => pentatonicById[sub]);
      anchorProfiles[tierEntry.band].push({
        anchor: anchorId,
        family: tierEntry.family,
        tier: tierEntry.tier,
        zSlots: records.filter((record) => record.setClassId.includes("-Z")).length,
        singleSlots: records.filter((record) => record.orientation === "single").length,
        distinctClasses: new Set(records.map((record) => record.setClassId)).size,
        bridgeSlots: records.filter((record) => record.isBridge === true).length,
        cornerstoneSlots: records.filter((record) => record.isCornerstone === true).length,
      });
    }
  }
  const bandSummary = (band) => {
    const entries = anchorProfiles[band];
    const histogram = (field) => {
      const result = {};
      for (const entry of entries) result[String(entry[field])] = (result[String(entry[field])] ?? 0) + 1;
      return result;
    };
    return { n: entries.length, zSlots: histogram("zSlots"), singleSlots: histogram("singleSlots"),
      distinctClasses: rangeOf(entries, (entry) => entry.distinctClasses),
      bridgeSlots: histogram("bridgeSlots"), cornerstoneSlots: histogram("cornerstoneSlots") };
  };
  const mechanismA = {
    question: "do Z-family (D3/D4/D5) anchor profiles differ structurally from non-Z (D1/D2/D6/D7) anchor profiles?",
    zBand: bandSummary("Z"),
    nonZBand: bandSummary("non-Z"),
    verdict: "PARTIAL: no clean band dichotomy (Z-slot ranges overlap: Z band 1-5, non-Z band 0-6); two structural asymmetries hold: the five 5-35 cornerstones occur only in Z-band anchors (D5/7-Z12), and the families' vocabularies are individually distinct; the Z/non-Z selection asymmetry is therefore not an anchor-profile dichotomy but a satellite-interface distribution effect",
  };
  const zPentaConfusion = confusion(uKeys, observedSet, (key) => compositionByKey.get(key).distinctZClasses >= 1);
  const singleConfusion = confusion(uKeys, observedSet, (key) => compositionByKey.get(key).singleEntryCount >= 1);
  const mechanismB = {
    question: "does the satellite's own Z-class pentatonic content separate the split?",
    predicate: "distinctZClasses >= 1 (equivalently rootedZCount >= 1)",
    confusion: zPentaConfusion,
    thresholdsClean: cleanThresholds(uKeys, observedSet, (key) => compositionByKey.get(key).distinctZClasses, "ge").clean,
    verdict: "SUPPORTED: every observed satellite carries at least two Z-class pentatonic subnodes (2-4), every unobserved carries zero; clean 14/14",
  };
  const zOrientationPairs = inversionPairs.map((pair) => ({
    a: pair.a, b: pair.b, observed: pair.observed,
    zA: compositionByKey.get(pair.a).orientationZCounts.A,
    zB: compositionByKey.get(pair.a).orientationZCounts.B,
    siblingZA: compositionByKey.get(pair.b).orientationZCounts.A,
    siblingZB: compositionByKey.get(pair.b).orientationZCounts.B,
  }));
  const mechanismC = {
    question: "does orientation-resolved composition separate the split?",
    singleOrientationPredicate: "singleEntryCount >= 1",
    singleOrientationConfusion: singleConfusion,
    singleThresholdsClean: cleanThresholds(uKeys, observedSet, (key) => compositionByKey.get(key).singleEntryCount, "ge").clean,
    orientationCountsByStatus: {
      observed: { A: rangeOf(obsComp, (entry) => entry.orientationCounts.A), B: rangeOf(obsComp, (entry) => entry.orientationCounts.B) },
      unobserved: { A: rangeOf(unobsComp, (entry) => entry.orientationCounts.A), B: rangeOf(unobsComp, (entry) => entry.orientationCounts.B) },
    },
    zOrientationPairs,
    verdict: "SUPPORTED for achiral content: every observed satellite carries achiral (single-orientation) pentatonic subnodes (2-4 entries), every unobserved carries zero; NOT SUPPORTED for pure A/B counts (ranges overlap); the Z-class orientation split is not a discriminator (siblings carry the same Z classes in opposite orientations)",
  };

  // ---- residual pair ------------------------------------------------------
  const residualKeys = ["1:1765", "5:1261"];
  const residualPerKey = residualKeys.map((key) => {
    const row = bl060RowByKey.get(key);
    const comp = compositionByKey.get(key);
    const records = subnodeRecords(key);
    const zFamilyCounts = { "7-Z12": row.dTier.counts["7-Z12"], "7-Z17": row.dTier.counts["7-Z17"], "7-Z37": row.dTier.counts["7-Z37"] };
    return {
      key,
      node: nodeOfKey(key).id,
      observed: row.observed,
      sibling: siblingOfKey(key),
      zFamilyCounts,
      zSum: row.dTier.zSum,
      nonZSum: row.dTier.nonZSum,
      sign: row.dTier.nonZSum - row.dTier.zSum,
      composition: {
        distinctClasses: comp.distinctClasses,
        zClasses: comp.zClasses,
        achiralZClasses: comp.achiralZClasses,
        chiralZClasses: comp.chiralZClasses,
        singleClasses: comp.singleClasses,
        rootedZCount: comp.rootedZCount,
        singleEntryCount: comp.singleEntryCount,
        orientationCounts: comp.orientationCounts,
        orientationZCounts: comp.orientationZCounts,
      },
      subnodes: records.map((record) => ({ id: record.id, setClass: record.setClass,
        orientation: record.orientation, root: record.root,
        bridge: record.isBridge, cornerstone: record.isCornerstone, dFamilies: record.dFamilies })),
     };
  });
  const zSumObserved = observedKeys.map((key) => bl060RowByKey.get(key).dTier.zSum);
  const zSumUnobserved = uKeys.filter((key) => !observedSet.has(key)).map((key) => bl060RowByKey.get(key).dTier.zSum);
  const residualPair = {
    keys: residualKeys,
    perKey: residualPerKey,
    normComparison: {
      zSumObserved: { min: Math.min(...zSumObserved), max: Math.max(...zSumObserved) },
      zSumUnobserved: { min: Math.min(...zSumUnobserved), max: Math.max(...zSumUnobserved) },
      residualZSumRank: "minimum among observed (11, tied between the two members)",
      residualSignRank: "closest to the refined threshold among observed (nonZSum - zSum = -3; observed range -13..-3, unobserved range 1..11)",
      zContentType: "chiral-Z-only: 5-Z18 and 5-Z36, no achiral Z class (every other observed carries 5-Z17 or 5-Z37)",
      residualPairAffinity: "the pair is the unique observed pair with achiralZClasses empty",
    },
    verdict: "EXPLAINED_NOT_PRIMITIVE: the pair is the Z12-only interface extreme (7-Z12 = 7, 7-Z17 = 7-Z37 = 2; zSum = 11 minimum) and the chiral-Z-only composition pair (5-Z18/5-Z36; no achiral Z class); it defeats per-family and per-content-type thresholds by construction, and sits inside the sign rule at margin 3 (nonZSum - zSum = -3; threshold 0; unobserved minimum +1)",
  };

  // ---- refinement scan ----------------------------------------------------
  const shapes = [];
  const shape = ({ id, rule, kind, predicate, note, resultOverride = null }) => {
    const matrix = confusion(uKeys, observedSet, predicate);
    const clean = matrix.tp === 14 && matrix.fp === 0 && matrix.fn === 0 && matrix.tn === 14;
    const hit = matrix.tp + matrix.tn;
    const nearMiss = !clean && hit >= 26;
    let inversionSymmetric = true;
    for (const pair of inversionPairs) {
      if (predicate(pair.a) !== predicate(pair.b)) inversionSymmetric = false;
    }
    shapes.push({ id, rule, kind, confusion: matrix, hit,
      result: resultOverride ?? (!inversionSymmetric ? "REJECTED_INVERSION_SPLIT" : clean ? "HIT" : nearMiss ? "MISS_NEAR" : "MISS"),
      inversionSymmetric, note });
    return { matrix, clean };
  };
  const s1 = shape({ id: "S1", rule: "nonZSum <= 13 (w = 0; BL-060 baseline)", kind: "weighted",
    predicate: (key) => bl060RowByKey.get(key).dTier.nonZSum <= 13,
    note: "the BL-060 composite; observed 8..13 / unobserved 14..19, gap 1" });
  const s2 = shape({ id: "S2", rule: "2*nonZSum - zSum <= 14 (w = -1/2, integer form)", kind: "weighted",
    predicate: (key) => 2 * bl060RowByKey.get(key).dTier.nonZSum - bl060RowByKey.get(key).dTier.zSum <= 14,
    note: "observed max 8 / unobserved min 15, gap 7" });
  const s3 = shape({ id: "S3", rule: "nonZSum < zSum (w = -1, Z-majority interface)", kind: "weighted",
    predicate: (key) => bl060RowByKey.get(key).dTier.nonZSum < bl060RowByKey.get(key).dTier.zSum,
    note: "observed -13..-3 / unobserved 1..11, gap 4; the canonical refinement" });
  if (!s1.clean || !s2.clean || !s3.clean) fail("weighted shape expectation failed");

  const nonZValues = sortedUnique(uKeys.map((key) => bl060RowByKey.get(key).dTier.nonZSum));
  const zValues = sortedUnique(uKeys.map((key) => bl060RowByKey.get(key).dTier.zSum));
  const dualSeparatingPairs = [];
  let dualSpace = 0;
  for (const a of nonZValues) {
    for (const b of zValues) {
      dualSpace += 1;
      const matrix = confusion(uKeys, observedSet, (key) => bl060RowByKey.get(key).dTier.nonZSum <= a && bl060RowByKey.get(key).dTier.zSum >= b);
      if (matrix.tp === 14 && matrix.fp === 0 && matrix.fn === 0 && matrix.tn === 14) dualSeparatingPairs.push({ a: String(a), b: String(b) });
    }
  }
  // degeneracy check: does the z-clause exclude any unobserved key that the
  // non-Z clause alone would admit? (all separating pairs are non-Z degenerate
  // exactly when no unobserved key has nonZSum <= a)
  const dualDegenerate = dualSeparatingPairs.every((pair) =>
    uKeys.filter((key) => !observedSet.has(key)).every((key) => bl060RowByKey.get(key).dTier.nonZSum > Number(pair.a)));
  const s4 = shape({ id: "S4", rule: "dual: nonZSum <= a AND zSum >= b (all landed (a, b))", kind: "dual",
    predicate: (key) => bl060RowByKey.get(key).dTier.nonZSum <= 13 && bl060RowByKey.get(key).dTier.zSum >= 11,
    note: `scan space ${dualSpace} pairs, ${dualSeparatingPairs.length} separating, all degenerate (a = 13; the z-clause excludes no unobserved key that the non-Z clause does not already exclude): the dual hit is S1 extended, not a Z-separated classifier`,
    resultOverride: dualSeparatingPairs.length > 0 && dualDegenerate ? "HIT_DEGENERATE" : null });
  if (!s4.clean) fail("dual shape expectation failed");
  const s5 = shape({ id: "S5", rule: "zSum >= 14", kind: "single-channel",
    predicate: (key) => bl060RowByKey.get(key).dTier.zSum >= 14,
    note: "misses the residual pair (zSum 11); 12/0/2/14" });
  const s6 = shape({ id: "S6", rule: "distinctZClasses >= 1 (satellite Z-content)", kind: "composition",
    predicate: (key) => compositionByKey.get(key).distinctZClasses >= 1,
    note: "observed 2..4 / unobserved 0" });
  const s7 = shape({ id: "S7", rule: "achiralZClasses >= 1 (5-Z17/5-Z37 content)", kind: "composition",
    predicate: (key) => compositionByKey.get(key).achiralZClasses.length >= 1,
    note: "misses the residual pair (chiral-Z-only); 12/0/2/14" });
  const s8 = shape({ id: "S8", rule: "chiralZClasses >= 1 (5-Z18/5-Z36 content)", kind: "composition",
    predicate: (key) => compositionByKey.get(key).chiralZClasses.length >= 1,
    note: "misses 1465/949 (achiral-Z-only); 12/0/2/14" });
  const s9 = shape({ id: "S9", rule: "singleEntryCount >= 1 (achiral subnode presence)", kind: "composition",
    predicate: (key) => compositionByKey.get(key).singleEntryCount >= 1,
    note: "observed 2..4 / unobserved 0" });
  const s10 = shape({ id: "S10", rule: "distinctClasses >= 11 (composition richness)", kind: "composition",
    predicate: (key) => compositionByKey.get(key).distinctClasses >= 11,
    note: "observed 11..13 / unobserved 7" });
  const s11 = shape({ id: "S11", rule: "orientation-resolved Z counts (zA + zB >= 1; chiral-orientation Z entries only)", kind: "orientation-aware",
    predicate: (key) => compositionByKey.get(key).orientationZCounts.A + compositionByKey.get(key).orientationZCounts.B >= 1,
    note: "misses 1465/949 (single-orientation Z entries only); 12/0/2/14" });
  const s12 = shape({ id: "S12", rule: "single-orientation-resolved Z counts (zSingle >= 1)", kind: "orientation-aware",
    predicate: (key) => compositionByKey.get(key).orientationZCounts.single >= 1,
    note: "misses the residual pair (chiral-Z-only); 12/0/2/14" });
  const s13 = shape({ id: "S13", rule: "orientation-polarized term (zA >= 1 alone)", kind: "orientation-aware",
    predicate: (key) => compositionByKey.get(key).orientationZCounts.A >= 1,
    note: "splits the 1765/1261 inversion pair (opposed orientations) - rejected at scan level" });
  const s14 = shape({ id: "S14", rule: "orientation-polarized term (zB >= 1 alone)", kind: "orientation-aware",
    predicate: (key) => compositionByKey.get(key).orientationZCounts.B >= 1,
    note: "splits the 1765/1261 inversion pair (opposed orientations) - rejected at scan level" });
  const shapeCounts = { hits: shapes.filter((entry) => entry.result === "HIT").length,
    degenerateHits: shapes.filter((entry) => entry.result === "HIT_DEGENERATE").length,
    misses: shapes.filter((entry) => entry.result === "MISS").length,
    nearMisses: shapes.filter((entry) => entry.result === "MISS_NEAR").length,
    rejectedInversionSplit: shapes.filter((entry) => entry.result === "REJECTED_INVERSION_SPLIT").length };
  if (!shapes.filter((entry) => entry.result === "HIT").every((entry) => entry.inversionSymmetric)) {
    fail("a HIT shape is not inversion-symmetric");
  }
  if (shapeCounts.rejectedInversionSplit !== 2) fail("orientation-split rejection census drift");
  if (shapeCounts.degenerateHits !== 1) fail("dual degeneracy census drift");
  const refinementScan = {
    shapes,
    shapeCounts,
    dualThreshold: { space: dualSpace, separatingPairs: dualSeparatingPairs, allDegenerate: dualDegenerate },
    inversionSymmetry: { pairs: inversionPairs.length,
      allHitsSymmetric: shapes.filter((entry) => entry.result === "HIT").every((entry) => entry.inversionSymmetric),
      shapesWithInversionSplit: shapeCounts.rejectedInversionSplit,
      note: "asserted per shape; shapes that split an inversion pair are rejected at scan level (S13/S14), the same fail-closed pattern as the no-collapse rule; every HIT is inversion-symmetric" },
    verdict: "REFINED: canonical-weight shapes hit (w = 0, -1/2, -1); the w = -1 sign rule nonZSum < zSum is the canonical refinement (gap 4); dual thresholds separate only degenerately (both separating pairs have a = 13 and a non-binding z-clause - S1 extended, not a Z-separated classifier); composition predicates separate on Z-content, achiral presence, and class richness; orientation-polarized Z terms are rejected as inversion-splitting; every HIT is inversion-symmetric",
  };

  // ---- synthesis ----------------------------------------------------------
  const synthesis = {
    zVerdict: "STRUCTURAL",
    zMechanism: {
      channels: [
        "interface polarization: observed satellites are Z-majority in their D-tier containment interface (nonZSum < zSum; observed -13..-3, unobserved +1..+11, gap 4) - the Z-channel carries the split with inverted polarity relative to the BL-060 non-Z threshold",
        "composition content: observed satellites carry Z-class pentatonic subnodes (2-4 rooted entries) and achiral subnodes (2-4 entries); unobserved carry zero of either - clean on both measurements (mechanism b and c SUPPORTED)",
        "anchor vocabulary: the seven families are individually distinct; cornerstones confined to D5/7-Z12; no clean band dichotomy (mechanism a PARTIAL)",
      ],
      thresholdArtifactVerdict: "REFUTED as the sole reading: a differently-shaped predicate (the sign rule, and the composition channel) does expose the Z-structure; per-family Z failures are distribution effects, not inertness",
    },
    residualVerdict: "EXPLAINED_NOT_PRIMITIVE",
    completedGeography: {
      mechanism: "D4 contact selection is boundary-geography-selective: observed satellites are the states whose D-tier containment interface is Z-majority and whose pentatonic composition carries Z-class and achiral content",
      thresholds: [
        "nonZSum <= 13 (w = 0 projection; BL-060)",
        "2*nonZSum - zSum <= 14 (w = -1/2)",
        "nonZSum < zSum (w = -1; canonical; gap 4)",
        "composition: distinctZClasses >= 1; singleEntryCount >= 1; distinctClasses >= 11",
      ],
      exceptions: "none primitive: the residual pair (1765/1261) is explained as the chiral-Z-only, Z12-only interface extreme; the boundary pairs 2395/2899 (nonZ 13) and 731/2921 (nonZ 14) bracket the original threshold; no shape-scan survivor splits an inversion pair",
      zStructure: "D-tier tiers D3/D4/D5 carry the Z families (7-Z37/7-Z17/7-Z12); the Z-interface exists for every observed satellite but its per-family distribution varies (Z12-only extreme: the residual pair); every unobserved satellite is non-Z-majority",
      orientationStructure: "14 inversion pairs, status shared within every pair (selection selects whole pairs; any mechanism must be inversion-symmetric); pairs link offices summing to 6 mod 7; achiral subnode content present in all observed, zero in all unobserved; pure A/B counts non-separating",
    },
    governsSemanticLayer: {
      refinement: {
        id: "GSL-1R",
        statement: "GSL-1 refined: the boundary geography is a polarization, not a non-Z-only threshold. Observed satellites are exactly those whose D-tier containment interface is Z-majority (nonZSum < zSum; equivalently the w = 0 threshold nonZSum <= 13 of GSL-1, a projection of the same structure). Complementarily, observed satellites' pentatonic composition carries Z-class subnodes (>= 1 distinct; 2-4 rooted entries) and achiral subnodes; unobserved carry none. The Z-structure participates; per-family single-axis failures are distribution effects, not inertness.",
      },
      anatomy: {
        id: "GSL-2",
        statement: "Residual anatomy: the 1765/1261 pair is the boundary geography's explained extreme - the unique observed pair with chiral-Z-only composition (5-Z18/5-Z36; no 5-Z17/5-Z37) and the solo Z12-rich Z17/Z37-poor interface (7/2/2; zSum minimum 11). It defeats per-family Z thresholds and per-content-type thresholds by construction, and sits inside the sign rule at margin 3. Inversion-invariance: every one of the 14 inversion pairs shares status, so the selection mechanism is inversion-symmetric by observation; the pair's members are inversion siblings with opposed orientations, confirming the residual is not an orientation artifact.",
      },
    },
    limits: [
      "characterization, not mechanism: the geography's shape is fully measured; why boundary containment governs contact remains open",
      "anchored-representation statistics: all counts read the landed pc-0-anchored mesh; inversion-stability verified; broader representation invariance untested (carried from GSL-1)",
      "GOVERNS remains granted input; the higher-theorem question remains open",
    ],
  };

  // ---- core assembly ------------------------------------------------------
  const core = {
    schemaVersion: SCHEMA_VERSION,
    huntId: HUNT_ID,
    status: "planning_evidence",
    generator: "scripts/build-d4-zresidual-hunt.mjs",
    sourceBindings: [
      { artifact: HEPTATONIC_LEDGER_PATH, sha256: fileSha(HEPTATONIC_LEDGER_PATH), role: "462-record canonical ledger (D-tier anchors, tiers, forte, offices)" },
      { artifact: BIPARTITE_PATH, sha256: fileSha(BIPARTITE_PATH), role: "anchored containment mesh (subnodes, parentsUnrooted, orientation, bridge/cornerstone flags)" },
      { artifact: NETWORK_PATH, sha256: fileSha(NETWORK_PATH), role: "family registry (Z-pair chirality/zPartner context) and office order" },
      { artifact: BL060_PATH, sha256: fileSha(BL060_PATH), role: "BL-060 hunt (base table: dTier counts, inversion siblings, domain) - imported by fingerprint" },
      { artifact: BL055_PATH, sha256: fileSha(BL055_PATH), role: "BL-055 selection review (transitive base)" },
    ],
    base: {
      artifact: BL060_PATH,
      fingerprint: bl060Fingerprint,
      huntId: bl060.huntId,
      domainKeys: uKeys.length,
      observedKeys: observedKeys.length,
      predicate: "P(s) = [forte(s) = 7-27]",
      importPolicy: "OD-60-4 chain: the BL-060 table is imported by fingerprint; this artifact appends the Z-anatomy, composition, mechanism, residual and refinement analyses and never edits the base",
    },
    domain: {
      uKeys,
      observedKeys,
      inversionPairs,
      inversionPairCount: inversionPairs.length,
    },
    dTierTiers: tiers.map((entry) => ({ tier: entry.tier, family: entry.family, band: entry.band,
      anchorCount: entry.anchorCount, anchors: entry.anchors })),
    zAnatomy,
    composition,
    compositionSummary,
    mechanisms: { a: mechanismA, b: mechanismB, c: mechanismC },
    residualPair,
    refinementScan,
    synthesis,
    fences: {
      governsVerdicts: "none: D4 derivable-via-R2 and D7 hypothesis-tier unchanged; no verdict is claimed from this sandbox",
      recordAmendment: "none: any amendment is its own claim event",
      d7Control: "fenced out entirely (OD-60-D7): no D7 computation; ENTRY 15 D7 clause carried forward",
      higherTheorem: "not attempted: the BL-059 scoping question remains open; this sprint feeds its evidence base only",
      g1Intra330: "untouched",
      direction: "unassigned (BL-035 carried)",
      membrane: "frame 2.6/2.7 interpretation vocabulary, never design input",
      entry13: "correlation-only axes untouched (OD-60-3 carried)",
      packaging: "planning_evidence; landing-time packaging in the landing commit",
      sessionProse: "context, not evidence",
      twelfthCatch: "every profile in this artifact is computed from landed bytes by this generator; no prose transcription",
    },
    contractCitations: [
      "orrery/src/generated/d4-14v14-hunt.v1.json (BL-060; fingerprint 8a1295ca...)",
      "orrery/src/generated/d4-selection-review.v1.json (BL-055; fingerprint 6d11fd93...)",
      "canonical/universal-heptatonic-ledger.csv (49 D-anchors; tier<->family bijection)",
      "derived/hypergraph/bipartite-inclusion-v1.json (anchored pc-0 containment)",
      "scrum/BACKLOG.md BL-061/BL-062 captures (twelfth-catch corrections)",
      "scrum/plan/bl-060-14v14-hunt-memo.md section 13 (post-landing register; exception pairs)",
      "scrum/plan/bl-029-d-tier-operator-probe-memo.md (D-tier M-closure; fixed-degree isolation)",
    ],
    notAccomplished: [
      "no claim event and no record amendment",
      "no governs admission and no higher-theorem answer",
      "no G1 movement and no directional-semantics assignment",
      "no D7 computation (fenced; OD-60-D7)",
      "no INV-5 graduation and no M-walkability promotion",
      "no canonical/Court/Neo4j/schema writes; session prose is not evidence",
    ],
  };
  const huntFingerprint = sha256(canonicalText(core));
  return { ...core, huntFingerprint };
}

// ---------------------------------------------------------------------------

export function serializeHunt(hunt) {
  return `${canonicalText(hunt)}\n`;
}

function main() {
  const check = process.argv.includes("--check");
  const hunt = buildZResidualHunt();
  const serialized = serializeHunt(hunt);
  const outputPath = path.join(root, OUTPUT_PATH);
  const summary = {
    output: OUTPUT_PATH,
    check,
    baseFingerprint: hunt.base.fingerprint,
    inversionPairs: hunt.domain.inversionPairCount,
    zVerdict: hunt.synthesis.zVerdict,
    residualVerdict: hunt.synthesis.residualVerdict,
    shapes: hunt.refinementScan.shapeCounts,
    huntFingerprint: hunt.huntFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_D4_ZRESIDUAL_HUNT");
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
