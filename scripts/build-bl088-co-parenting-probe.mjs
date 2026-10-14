#!/usr/bin/env node
/**
 * Build the BL-088 co-parenting generalization probe: does the BL-087
 * window-level characterization of the A1 spanning (closure-edge co-parenting
 * x cut position) generalize across the topology, or is it A1-specific?
 *
 * The finding being generalized (BL-087, landed 2026-10-14): the A1-top-A2
 * non-consecutiveness is closure-edge co-parenting read across the landed cut;
 * the two A2 satellites 1359/1401 are Hamming-2 from both A1 cycle endpoints
 * (1371/1389), and the landed cut places that pair at the wrap, so their
 * windows span the full index range. D-2's rule: a cut is non-consecutive
 * exactly when the two anchors adjacent across the cut are jointly
 * co-parented by a layer window.
 *
 * The generalization question (planning pass 2026-10-14, rulings OD-CP-1..4):
 *   1. the topology-wide co-parenting census (both directions: pentatonic
 *      pairs via parentsRooted overlap; heptatonic pairs via subnodes overlap)
 *      with the >=2 primary threshold and >=1/>=3 sensitivity columns
 *   2. the topology-wide spanning census (BL-084 populations: the ten M-cycles
 *      x all layers; the 476 directed operator cycles x top layers; plus the
 *      pentatonic satellite layers - containment = Hamming-2 reach for 5-sets)
 *   3. the correspondence test: spanning cut <-> co-parented pair, with the
 *      reduction test (adjacent-anchor witness), the pair-witnessing test,
 *      and the fertility test
 *   4. the per-family / per-set-class breakdown
 *   5. the mechanism inventory update (GSL candidate draft, un-promoted)
 *
 * Operationalizations (frozen in the preRegistration block):
 *   OP-CP-1 containment census: both directions, >=2 primary, >=1/>=3
 *           sensitivity, complete pair map for >=2
 *   OP-CP-2 reach census: satellite pairs sharing >=2 reach parents (the D1
 *           relation generalized; reach = Hamming-2 = containment for the
 *           pentatonic layers)
 *   OP-CP-3 spanning census: per census row, cuts k = between order[k] and
 *           order[(k+1)%n]; naive witnesses N(k) = windows containing both
 *           adjacent anchors with size < n; non-cyclic windows witness every
 *           cut; exact witnesses E(k) = N(k) union nonCyclic; spanning =
 *           |E(k)| >= 1; pair-produced = |E(k)| >= 2; the rotation
 *           cross-check (exact witnesses = windows non-consecutive under the
 *           cut's rotation) is asserted for every cut
 *   OP-CP-4 correspondence: E-A reduction exactness (no non-cyclic and no
 *           full-range windows); E-B pair bijection (no single-witness cuts)
 *           and fertility (every co-parented pair's shared set contains a
 *           cyclically adjacent pair); E-C heptatonic containment pairs among
 *           layer states vs reach pairs; E-D pentatonic-side census pairs
 *           bound to the cycle-level pentatonic reach pairs
 *   OP-CP-5 per-family: cycle anchor family (tier<->family bijection) and
 *           satellite set-class stratification
 *
 * Grounding corrections carried (maintainer-prose class):
 *   GC-1 the brief's parenthetical co-parenting definition (parentsRooted
 *        overlap) is the pentatonic-heptatonic containment relation; the
 *        BL-087 characterized instance operates on the heptatonic-heptatonic
 *        Hamming-2 reach relation. Computed: 1359/1401 share exactly ONE
 *        rooted subnode (5-34:6) - they are a reach-co-parented pair, not a
 *        containment-co-parented pair. Both relations are censused; the
 *        correspondence binds the reach relation for the heptatonic layers
 *        and the containment relation for the pentatonic layers (where
 *        containment = reach by the 5-in-7 Hamming-2 identity).
 *   GC-2 the brief's "the same join the BL-076 probe used": BL-076 carries no
 *        parentsRooted join (verified 0 hits at planning); the join precedent
 *        is the bipartite artifact plus the BL-021 lookup.
 *   GC-3 "pentatonic-spanning cuts": no pentatonic cycles exist (G1; the
 *        derived-path-graph has no intra-330 edges); the pentatonic-side
 *        binding is executed through pentatonic satellite layers on the
 *        heptatonic cycles (reach = containment).
 *
 * The D1 anchor gate (V-CP-1): the A1 x A2 census must reproduce the spanning
 * windows 1359/1401 (parents 1371/1389, indices [0,6]) and the pair-witnessed
 * wrap cut; the rho relocation (3669/981, parents 2901/1749) is re-verified.
 * Any mismatch is a halt.
 *
 * Two-region static discipline (validator-enforced): the INTRINSIC region
 * reads the ledger's pitch sets, masks, and tier/role partition only, and
 * carries the generic window/cut/pair machinery; the comparison region reads
 * the landed bipartite graph, orders, layers, and chain artifacts.
 *
 * Fences: planning_evidence only. No new measurement (landed bipartite +
 * landed orders/layers + verbatim windowAnalysis; masks-only reach arithmetic
 * for the pentatonic layers - the BL-070 precedent); no claim event; no record
 * amendment; no GOVERNS admission (the mechanism inventory update is an
 * inline, unapplied candidate draft); no G1 movement; no INV-5 graduation; no
 * M-walkability promotion; no canonical/Court/schema/Neo4j writes; D7
 * hypothesis-tier throughout; the frame (harmonic-comprehension-map sections
 * 2.6/2.7) is interpretation vocabulary, never design input. Session prose is
 * context, not evidence.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
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
  windowAnalysis,
  shapeClassOf,
  verdictOf,
  compactAnalysis,
} from "./build-bl084-window-ladder.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

export const SCHEMA_VERSION = "harmonic-orrery.bl088-co-parenting-probe.v1";
export const INVESTIGATION_ID = "BL088_CO_PARENTING_PROBE_V1";
export const OUTPUT_PATH = "orrery/src/generated/bl088-co-parenting-probe.v1.json";
export const BIPARTITE_PATH = "derived/hypergraph/bipartite-inclusion-v1.json";
export const NETWORK_PATH = "canonical/universal-network-data.json";
export const LEDGER_PATH = HEPTATONIC_LEDGER_PATH;
export const BL084_PATH = "orrery/src/generated/bl084-window-ladder.v1.json";
export const BL087_PATH = "orrery/src/generated/bl087-klein-ladder-probe.v1.json";
export const BL073_PATH = "orrery/src/generated/bl073-isometry-probe.v1.json";
export const PROBE_PATH = "orrery/src/generated/d-tier-operator-probe.v1.json";
export const DPG_PATH = "orrery/src/generated/derived-path-graph.v1.json";
export const A_TIER_ORDER = ["A0", "A1", "A2"];
export const D_TIER_ORDER = ["D1", "D2", "D3", "D4", "D5", "D6", "D7"];
export const TIER_FAMILY = {
  D1: "7-22",
  D2: "7-15",
  D3: "7-Z37",
  D4: "7-Z17",
  D5: "7-Z12",
  D6: "7-8",
  D7: "7-1",
  A0: "7-35",
  A1: "7-34",
  A2: "7-33",
};
export const A_TIER_ANCHOR_SET_MARKER = "A-tier anchor set";

// ==== INTRINSIC-CP-BEGIN (ledger masks + tier/role partition + generic window/cut/pair machinery) ====
// This region derives masks from pitch sets, partitions satellites by tier,
// and builds the generic consecutive-window reach analysis, the cut
// classification (naive / exact witnesses), the reach co-parenting pair
// machinery, the containment overlap machinery, and the cycle enumeration. It
// reads no landed artifact, no cycle order, and no label beyond the ledger's
// masks and tier/role partition.

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

export function hamming12(left, right) {
  let value = left ^ right;
  let count = 0;
  while (value !== 0) {
    count += value & 1;
    value >>= 1;
  }
  return count;
}

export function affineMapOfMask(mask, unit, translation) {
  let image = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) {
    if ((mask >> pitch) & 1) image |= 1 << ((((unit * pitch + translation) % 12) + 12) % 12);
  }
  return image & 4095;
}

export function rotateMask12(mask, d) {
  const shift = ((d % 12) + 12) % 12;
  if (shift === 0) return mask & 4095;
  return (((mask << shift) & 4095) | (mask >> (12 - shift))) & 4095;
}

export function rotationRelations(a, b) {
  const hits = [];
  for (let d = 1; d <= 11; d += 1) if (rotateMask12(a, d) === b) hits.push(d);
  return hits;
}

export function pcSumOfMask(mask) {
  let sum = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) if ((mask >> pitch) & 1) sum += pitch;
  return sum;
}

export function tierSatelliteLayer(ledgerRows, tier) {
  return ledgerRows
    .filter((row) => row.tier === tier && row.role === "satellite")
    .map((row) => String(row.id))
    .sort((left, right) => Number(left) - Number(right));
}

export function containmentOverlap(leftList, rightList) {
  const right = new Set(rightList);
  return leftList.filter((entry) => right.has(entry));
}

export function windowFlags(window, orderLength) {
  const indices = window.indices;
  let cyclic = true;
  if (indices.length > 1) {
    cyclic = false;
    for (let start = 0; start < orderLength; start += 1) {
      const run = new Set();
      for (let step = 0; step < indices.length; step += 1) run.add((start + step) % orderLength);
      if (run.size === indices.length && indices.every((index) => run.has(index))) {
        cyclic = true;
        break;
      }
    }
  }
  return { cyclic, fullRange: indices.length === orderLength };
}

export function cutCensus(order, layerIds, masks, allIds) {
  const size = order.length;
  const analysis = windowAnalysis(order, layerIds, masks, allIds);
  const flagged = analysis.windows.map((window) => ({ ...window, ...windowFlags(window, size) }));
  const nonCyclicWindows = flagged.filter((window) => !window.cyclic);
  const fullRangeWindows = flagged.filter((window) => window.fullRange);
  const cuts = [];
  for (let k = 0; k < size; k += 1) {
    const a = order[k];
    const b = order[(k + 1) % size];
    const naive = flagged.filter((window) => window.parents.includes(a) && window.parents.includes(b) && !window.fullRange);
    const exactStates = [...new Set([...naive.map((window) => window.state), ...nonCyclicWindows.map((window) => window.state)])]
      .sort((left, right) => cmp(left, right));
    cuts.push({
      k,
      pair: [a, b],
      naiveCount: naive.length,
      exactCount: exactStates.length,
      exactStates,
      spanning: exactStates.length >= 1,
      pairProduced: exactStates.length >= 2,
      singleWitness: exactStates.length === 1,
    });
  }
  const rotationAgreement = [];
  for (let k = 0; k < size; k += 1) {
    const seam = (k + 1) % size;
    const rotated = [...order.slice(seam), ...order.slice(0, seam)];
    const rotatedAnalysis = windowAnalysis(rotated, layerIds, masks, allIds);
    const rotatedStates = rotatedAnalysis.windows
      .filter((window) => !window.consecutive)
      .map((window) => window.state)
      .sort((left, right) => cmp(left, right));
    rotationAgreement.push(canonicalText(rotatedStates) === canonicalText(cuts[k].exactStates));
  }
  return {
    analysis,
    flagged,
    nonCyclicWindows,
    fullRangeWindows,
    cuts,
    rotationAgreement,
    rotationAgrees: rotationAgreement.every(Boolean),
  };
}

export function reachPairs(order, analysis) {
  const size = order.length;
  const stateParents = analysis.windows.map((window) => ({ state: window.state, parents: window.parents }));
  const list = [];
  for (let i = 0; i < stateParents.length; i += 1) {
    for (let j = i + 1; j < stateParents.length; j += 1) {
      const shared = stateParents[i].parents.filter((parent) => stateParents[j].parents.includes(parent));
      if (shared.length < 2) continue;
      const indices = shared.map((parent) => order.indexOf(parent)).sort((left, right) => left - right);
      const adjacentCuts = [];
      for (let x = 0; x < indices.length; x += 1) {
        for (let y = x + 1; y < indices.length; y += 1) {
          const distance = Math.abs(indices[x] - indices[y]);
          if (distance === 1 || distance === size - 1) {
            const lower = Math.min(indices[x], indices[y]);
            const cutIndex = distance === 1 ? lower : size - 1;
            if (!adjacentCuts.includes(cutIndex)) adjacentCuts.push(cutIndex);
          }
        }
      }
      adjacentCuts.sort((left, right) => left - right);
      const members = [stateParents[i].state, stateParents[j].state].sort((left, right) => cmp(left, right));
      list.push({
        a: members[0],
        b: members[1],
        shared: shared.slice().sort((left, right) => cmp(left, right)),
        adjacentCuts,
        fertile: adjacentCuts.length > 0,
        strict: shared.length === 2,
      });
    }
  }
  list.sort((left, right) => cmp(left.a, right.a) || cmp(left.b, right.b));
  const fertile = list.filter((pair) => pair.fertile).length;
  return {
    count: list.length,
    fertile,
    infertile: list.length - fertile,
    strict: list.filter((pair) => pair.strict).length,
    list,
  };
}

export function enumerateDirectedCycles(edges) {
  const adjacency = new Map();
  for (const edge of edges) {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
    adjacency.get(edge.from).push(edge.to);
  }
  for (const targets of adjacency.values()) targets.sort((left, right) => cmp(Number(left), Number(right)));
  const nodes = [...adjacency.keys()].sort((left, right) => cmp(Number(left), Number(right)));
  const cycles = [];
  const visit = (start, current, visited, pathNodes) => {
    for (const next of adjacency.get(current) ?? []) {
      if (next === start && pathNodes.length >= 3) {
        cycles.push([...pathNodes]);
        continue;
      }
      if (visited.has(next)) continue;
      if (Number(next) < Number(start)) continue;
      visited.add(next);
      pathNodes.push(next);
      visit(start, next, visited, pathNodes);
      pathNodes.pop();
      visited.delete(next);
    }
  };
  for (const start of nodes) {
    const visited = new Set([start]);
    visit(start, start, visited, [start]);
  }
  return cycles;
}

export function rotations(sequence) {
  const result = [];
  for (let index = 0; index < sequence.length; index += 1) {
    result.push([...sequence.slice(index), ...sequence.slice(0, index)]);
  }
  return result;
}

export function canonicalCycleKey(sequence) {
  const candidates = [...rotations(sequence), ...rotations([...sequence].reverse())]
    .map((rotation) => rotation.join(","));
  candidates.sort(cmp);
  return candidates[0];
}

export function edgeStructure(order, masks) {
  const edgeHammings = order.map((anchor, index) => hamming12(masks.get(anchor), masks.get(order[(index + 1) % order.length])));
  const edgeRotations = order.map((anchor, index) => rotationRelations(masks.get(anchor), masks.get(order[(index + 1) % order.length])));
  const pathHammings = edgeHammings.slice(0, order.length - 1);
  const pathRotations = edgeRotations.slice(0, order.length - 1);
  const uniformPathHamming = pathHammings.every((value) => value === pathHammings[0]);
  const uniformPathRotation = pathRotations.every((value) => canonicalText(value) === canonicalText(pathRotations[0]));
  const pathInterval = uniformPathRotation && pathRotations[0].length > 0 ? pathRotations[0][0] : null;
  const closureRotations = [edgeRotations[order.length - 1]];
  const closureInterval = closureRotations[0].length > 0 ? closureRotations[0][0] : null;
  return {
    edgeHammings,
    edgeRotations,
    closureEdge: {
      a: order[order.length - 1],
      b: order[0],
      rotateInterval: closureInterval,
      hamming: edgeHammings[order.length - 1],
    },
    uniformPathHamming,
    uniformPathRotation,
    pathInterval,
    closureInterval,
    twoIntervalOrder: uniformPathRotation && pathInterval !== null && closureInterval !== null && closureInterval !== pathInterval,
  };
}

export function topLayerRecords(cycleOrder, layers, masks, allIds) {
  const records = [];
  for (const [tier, ids] of layers.entries()) {
    const analysis = windowAnalysis(cycleOrder, ids, masks, allIds);
    if (analysis.totalInstances === 0) continue;
    records.push({ tier, analysis });
  }
  records.sort((left, right) => right.analysis.totalInstances - left.analysis.totalInstances || cmp(left.tier, right.tier));
  return records;
}

export function bestVerdict(verdicts) {
  if (verdicts.includes("FULL")) return "FULL";
  if (verdicts.includes("PARTIAL")) return "PARTIAL";
  return "ABSENT";
}

export function censusClassification(cuts, pairs, nonCyclicWindows, fullRangeWindows) {
  const spanning = cuts.filter((cut) => cut.spanning).length;
  const pairProduced = cuts.filter((cut) => cut.pairProduced).length;
  const singleWitnessCuts = cuts.filter((cut) => cut.singleWitness).map((cut) => cut.k);
  const reductionExact = nonCyclicWindows.length === 0 && fullRangeWindows.length === 0;
  const noSpanning = spanning === 0;
  const fault = !reductionExact && spanning > 0;
  const partial = spanning > 0 && singleWitnessCuts.length > 0;
  const exact = spanning > 0 && reductionExact && singleWitnessCuts.length === 0 && pairs.fertile === pairs.count;
  const primary = fault
    ? (nonCyclicWindows.length > 0 && fullRangeWindows.length > 0 ? "FAULT_MIXED" : nonCyclicWindows.length > 0 ? "FAULT_NON_CYCLIC" : "FAULT_FULL_RANGE")
    : partial
      ? "PARTIAL_SINGLE_WITNESS"
      : exact
        ? "EXACT"
        : noSpanning
          ? "NO_SPANNING"
          : "PARTIAL_INFERTILE";
  return { spanning, pairProduced, singleWitnessCuts, reductionExact, exact, partial, fault, noSpanning, primary };
}
// ==== INTRINSIC-CP-END ====

// ---- comparison region: the landed bipartite graph, cycle orders, layers,
// ---- and chain fingerprint artifacts are read and self-checked here --------

function tierAnchorFamily(ledgerRows, tier) {
  const anchors = ledgerRows.filter((row) => row.tier === tier && row.role === "anchor");
  const families = [...new Set(anchors.map((row) => row.forte))];
  return families.length === 1 ? families[0] : null;
}

export const PRE_REGISTRATION = {
  approved: "2026-10-14 (planning pass read-only; rulings OD-CP-1..4; build phase separately authorized)",
  rulings: [
    {
      id: "OD-CP-1",
      decision: "census scope: both directions, reported separately - pentatonic-pentatonic via parentsRooted overlap (>=2) and heptatonic-heptatonic via subnodes overlap (>=2); the correspondence test checks both against the spanning map",
    },
    {
      id: "OD-CP-2",
      decision: "spanning population: the BL-084 populations - Scope B (the ten M-cycles x all layers) + Scope C (the 476 directed operator cycles x top layers); no new cycle discovery; the D1 anchor's reproduction check uses the same population BL-084 measured",
    },
    {
      id: "OD-CP-3",
      decision: "overlap threshold: >=2 primary + >=1/>=3 sensitivity columns (same join, different thresholds; the sensitivity curve informs the mechanism's scope; no extra verdict)",
    },
    {
      id: "OD-CP-4",
      decision: "correspondence verdict: bijection / partial (with direction) / absent - set-equality per the brief's V-CP-3; the partial branch's diagnostic locates the mechanism's boundary",
    },
  ],
  operationalizations: [
    {
      id: "OP-CP-1",
      text: "containment co-parenting census: pentatonic pairs sharing >=2 parentsRooted (sensitivity >=1/>=3; complete pair map for >=2); heptatonic pairs sharing >=2 subnodes (sensitivity >=1/>=3; complete pair map for >=2); the two directions are reported separately and never merged",
    },
    {
      id: "OP-CP-2",
      text: "reach co-parenting: two layer states share >=2 reach parents when |parents(s1) intersect parents(s2)| >= 2 under the window machinery (reach = Hamming-2); this is the D1 relation generalized; for the pentatonic layers reach = containment by the 5-in-7 Hamming-2 identity (p reached by a iff p subset a iff hamming = 2)",
    },
    {
      id: "OP-CP-3",
      text: "spanning census: per census row (cycle order x layer), cut k = between order[k] and order[(k+1) mod n]; naive witnesses N(k) = windows containing both adjacent anchors with size < n; non-cyclic windows witness every cut; exact witnesses E(k) = N(k) union nonCyclic; spanning(k) = |E(k)| >= 1; pair-produced(k) = |E(k)| >= 2; the rotation cross-check asserts E(k) equals the set of windows non-consecutive under the cut's rotation for every k",
    },
    {
      id: "OP-CP-4",
      text: "correspondence: E-A the reduction test (spanning attributable to adjacent-anchor co-parenting holds exactly when all windows are cyclic intervals and none is full-range); E-B the pair test (every spanning cut pair-produced; every co-parented pair fertile); E-C the heptatonic containment pairs among layer states vs the reach pairs; E-D the pentatonic-side census pairs bound to the cycle-level pentatonic reach pairs",
    },
    {
      id: "OP-CP-5",
      text: "per-family: cycle anchor family by the tier<->family bijection (D1=7-22, D2=7-15, D3=7-Z37, D4=7-Z17, D5=7-Z12, D6=7-8, D7=7-1, A0=7-35, A1=7-34, A2=7-33) and satellite set-class stratification",
    },
  ],
  gates: [
    { id: "V-CP-1", text: "the D1 anchor: the A1 x A2 census reproduces the spanning windows 1359/1401 (parents 1371/1389, indices [0,6], non-consecutive) and the pair-witnessed wrap cut; the rho relocation (3669/981, parents 2901/1749) re-verified; mismatch = halt" },
    { id: "V-CP-2", text: "the census integrity: universe counts 330/462, arities 21/15, pair denominators 54,285/106,491, overlap histograms, the Hamming-2 / intersection identities; mismatch = halt" },
    { id: "V-CP-3", text: "the correspondence: bijection / partial (with direction and locus) / absent per population at >=2; finding, not failure" },
  ],
  decisionRule: {
    exactRow: "spanning > 0 and reductionExact (no non-cyclic and no full-range windows) and no single-witness cuts and every reach co-parented pair fertile",
    general: "overall exact rate >= 0.90 over all spanning-bearing rows",
    a1Specific: "every exact row is the A1 x A2 census or a landed coordinate image of it",
    boundaryLayerConditional: "every exact row is a boundary-layer census - a Scope B M-cycle row, or an operator row whose anchor set is contained in the A-tier anchor set - and at least one exact row exists",
    fallback: "PARTIAL_GENERAL",
  },
  groundingCorrections: [
    { id: "GC-1", text: "the brief's parenthetical co-parenting definition (parentsRooted overlap) is the pentatonic-heptatonic containment relation; the BL-087 characterized instance operates on the heptatonic-heptatonic Hamming-2 reach relation; computed: 1359/1401 share exactly one rooted subnode (5-34:6) - a reach-co-parented pair, not a containment-co-parented pair; both relations are censused and the correspondence binds each at its own scope" },
    { id: "GC-2", text: "the brief's 'the same join the BL-076 probe used': BL-076 carries no parentsRooted join (0 hits, planning-verified); the join precedent is the bipartite artifact plus the BL-021 lookup" },
    { id: "GC-3", text: "'pentatonic-spanning cuts': no pentatonic cycles exist (G1; no intra-330 edges in the derived-path-graph); the pentatonic-side binding is executed through pentatonic satellite layers on the heptatonic cycles, where reach = containment" },
  ],
};

function fingerprintSelfCheck(artifact, label, idKey, idValue, fingerprintKey) {
  const { [fingerprintKey]: fingerprint, ...core } = artifact;
  if (artifact[idKey] !== idValue || artifact.status !== "planning_evidence") fail(`${label} artifact header drift`);
  if (sha256(canonicalText(core)) !== fingerprint) fail(`${label} fingerprint self-check failed`);
  return fingerprint;
}

function heptScopeBRow(cycleTier, cycleFamily, order, layerTier, layerIds, layerClasses, masks, allIds) {
  const census = cutCensus(order, layerIds, masks, allIds);
  if (!census.rotationAgrees) fail(`scope B ${cycleTier} x ${layerTier}: the exact-witness / rotation equivalence failed`);
  const pairs = reachPairs(order, census.analysis);
  const classification = censusClassification(census.cuts, pairs, census.nonCyclicWindows, census.fullRangeWindows);
  return {
    cycleTier,
    cycleFamily,
    order,
    length: order.length,
    layerTier,
    layerClasses,
    compact: compactAnalysis(order, census.analysis),
    windows: census.flagged.map((window) => ({
      state: window.state,
      parents: window.parents,
      indices: window.indices,
      size: window.size,
      consecutive: window.consecutive,
      cyclic: window.cyclic,
      fullRange: window.fullRange,
    })),
    nonCyclicWindows: census.nonCyclicWindows.map((window) => window.state),
    fullRangeWindows: census.fullRangeWindows.map((window) => window.state),
    cuts: census.cuts,
    rotationAgrees: census.rotationAgrees,
    pairs,
    classification,
  };
}

function scopeCRow(pairKey, orientationIndex, order, layerTier, layerIds, masks, allIds) {
  const census = cutCensus(order, layerIds, masks, allIds);
  if (!census.rotationAgrees) fail(`scope C ${pairKey} orientation ${orientationIndex} x ${layerTier}: the exact-witness / rotation equivalence failed`);
  const pairs = reachPairs(order, census.analysis);
  const classification = censusClassification(census.cuts, pairs, census.nonCyclicWindows, census.fullRangeWindows);
  return {
    pairKey,
    orientationIndex,
    length: order.length,
    order,
    layerTier,
    compact: compactAnalysis(order, census.analysis),
    nonConsecutiveCount: census.flagged.filter((window) => !window.consecutive).length,
    nonCyclicWindows: census.nonCyclicWindows.map((window) => window.state),
    fullRangeWindows: census.fullRangeWindows.map((window) => window.state),
    cutsNaive: census.cuts.map((cut) => cut.naiveCount),
    cutsExact: census.cuts.map((cut) => cut.exactCount),
    spanning: classification.spanning,
    pairProduced: classification.pairProduced,
    singleWitnessCuts: classification.singleWitnessCuts,
    pairs,
    rotationAgrees: census.rotationAgrees,
    classification,
  };
}

function compactPairs(pairs) {
  return { count: pairs.count, fertile: pairs.fertile, infertile: pairs.infertile, strict: pairs.strict };
}

function buildInvestigation() {
  const ledgerRows = parseCsv(read(LEDGER_PATH));
  const network = readJson(NETWORK_PATH);
  const bipartite = readJson(BIPARTITE_PATH);
  const bl084 = readJson(BL084_PATH);
  const bl087 = readJson(BL087_PATH);
  const bl073 = readJson(BL073_PATH);
  const probe = readJson(PROBE_PATH);
  const dpg = readJson(DPG_PATH);
  if (ledgerRows.length !== 462) fail(`heptatonic ledger census is ${ledgerRows.length}`);

  // ---- chain self-checks (fingerprints; no literals in this generator) ----
  const bl084Fingerprint = fingerprintSelfCheck(bl084, "BL-084", "investigationId", "BL084_WINDOW_LADDER_V1", "investigationFingerprint");
  const bl087Fingerprint = fingerprintSelfCheck(bl087, "BL-087", "investigationId", "BL087_KLEIN_LADDER_PROBE_V1", "investigationFingerprint");
  const bl073Fingerprint = fingerprintSelfCheck(bl073, "BL-073", "investigationId", "BL073_ISOMETRY_PROBE_V1", "investigationFingerprint");
  const { probeFingerprint, ...probeCore } = probe;
  if (probe.probeId !== "D_TIER_OPERATOR_PROBE_v1" || probe.status !== "planning_evidence") fail("d-tier operator probe header drift");
  if (sha256(canonicalText(probeCore)) !== probeFingerprint) fail("d-tier operator probe fingerprint self-check failed");
  const { graphFingerprint, ...dpgCore } = dpg;
  if (dpg.status !== "planning_evidence") fail("derived-path-graph header drift");
  if (sha256(canonicalText(dpgCore)) !== graphFingerprint) fail("derived-path-graph fingerprint self-check failed");
  const bipartiteSha = fileSha(BIPARTITE_PATH);

  // ---- masks, layers, partitions (masks-only) ------------------------------
  const masks = new Map(ledgerRows.map((row) => [String(row.id), maskOfRow(row)]));
  const allIds = ledgerRows.map((row) => String(row.id));
  const rowById = new Map(ledgerRows.map((row) => [String(row.id), row]));
  const layers = new Map();
  for (const row of ledgerRows) {
    if (row.role !== "satellite") continue;
    if (!layers.has(row.tier)) layers.set(row.tier, []);
    layers.get(row.tier).push(String(row.id));
  }
  for (const ids of layers.values()) ids.sort((left, right) => cmp(Number(left), Number(right)));

  // ---- the bipartite containment graph (comparison; the census base) -------
  const pentNodes = Object.values(bipartite.pentatonicSubnodes);
  const heptNodes = Object.values(bipartite.heptatonicNodes);
  if (pentNodes.length !== 330 || heptNodes.length !== 462) fail("bipartite universe drift");
  if (pentNodes.some((node) => node.parentsRooted.length !== 21)) fail("pentatonic parent arity drift");
  if (heptNodes.some((node) => node.subnodes.length !== 15)) fail("heptatonic subnode arity drift");
  const pentIds = pentNodes.map((node) => node.id).sort(cmp);
  const heptIds = heptNodes.map((node) => node.id).sort(cmp);
  for (const node of pentNodes) masks.set(node.id, node.pitchMask);
  const mergedIds = [...allIds, ...pentIds];
  const pentById = new Map(pentNodes.map((node) => [node.id, node]));
  const heptById = new Map(heptNodes.map((node) => [node.id, node]));

  // ---- containment censuses (both directions; OD-CP-1, OD-CP-3) ------------
  const containmentCensus = (nodes, listKey, otherById, otherFamilyKey) => {
    const pairs = [];
    let ge1 = 0;
    let ge2 = 0;
    let ge3 = 0;
    const histogram = {};
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const shared = containmentOverlap(nodes[i][listKey], nodes[j][listKey]);
        const overlap = shared.length;
        histogram[String(overlap)] = (histogram[String(overlap)] ?? 0) + 1;
        if (overlap >= 1) ge1 += 1;
        if (overlap >= 2) {
          ge2 += 1;
          const members = [nodes[i].id, nodes[j].id].sort((left, right) => cmp(left, right));
          pairs.push([members[0], members[1], overlap]);
        }
        if (overlap >= 3) ge3 += 1;
      }
    }
    const familyStats = new Map();
    const familyPairStats = new Map();
    for (const [idA, idB] of pairs) {
      const shared = containmentOverlap(nodes.find((node) => node.id === idA)[listKey], nodes.find((node) => node.id === idB)[listKey]);
      const families = shared.map((entry) => otherById.get(entry)[otherFamilyKey]);
      const distinct = [...new Set(families)].sort(cmp);
      for (const family of distinct) familyStats.set(family, (familyStats.get(family) ?? 0) + 1);
      for (let x = 0; x < distinct.length; x += 1) {
        for (let y = x; y < distinct.length; y += 1) {
          const key = distinct[x] === distinct[y] ? distinct[x] : `${distinct[x]}|${distinct[y]}`;
          familyPairStats.set(key, (familyPairStats.get(key) ?? 0) + 1);
        }
      }
    }
    return {
      pairs,
      thresholds: { ge1, ge2, ge3 },
      overlapHistogram: histogram,
      familyStats: [...familyStats.entries()].sort((left, right) => cmp(left[0], right[0])).map(([family, count]) => ({ family, pairs: count })),
      familyPairStats: [...familyPairStats.entries()].sort((left, right) => cmp(left[0], right[0])).map(([pair, count]) => ({ pair, count })),
    };
  };
  const pCensus = containmentCensus(pentNodes, "parentsRooted", heptById, "setClassId");
  const hCensus = containmentCensus(heptNodes, "subnodes", pentById, "setClassId");
  if (pCensus.pairs.length !== 4620 || pCensus.thresholds.ge1 !== 25410 || pCensus.thresholds.ge3 !== 4620) fail("pentatonic containment census drift");
  if (hCensus.pairs.length !== 6930 || hCensus.thresholds.ge1 !== 41580 || hCensus.thresholds.ge3 !== 6930) fail("heptatonic containment census drift");
  const pIdentity = pCensus.pairs.every(([idA, idB]) => {
    const pitchesA = new Set(pentById.get(idA).pitchClasses);
    const pitchesB = new Set(pentById.get(idB).pitchClasses);
    const intersection = [...pitchesA].filter((pitch) => pitchesB.has(pitch)).length;
    return intersection === 4;
  });
  const hIdentity = hCensus.pairs.every(([idA, idB]) => hamming12(heptById.get(idA).pitchMask, heptById.get(idB).pitchMask) === 2);
  if (!pIdentity) fail("pentatonic overlap-6 pairs are not exactly the |intersection| = 4 pairs");
  if (!hIdentity) fail("heptatonic overlap-5 pairs are not exactly the Hamming-2 pairs");
  const hamming2Count = (() => {
    let count = 0;
    for (let i = 0; i < heptNodes.length; i += 1) {
      for (let j = i + 1; j < heptNodes.length; j += 1) {
        if (hamming12(heptNodes[i].pitchMask, heptNodes[j].pitchMask) === 2) count += 1;
      }
    }
    return count;
  })();
  if (hamming2Count !== hCensus.pairs.length) fail(`Hamming-2 pair count ${hamming2Count} disagrees with the overlap census`);

  // ---- the landed cycle populations (BL-084 Scope B + Scope C) -------------
  const successor = new Map(network.d7ModalRows.map((row) => [String(row.source), String(row.target)]));
  const orbitOrder = [];
  let orbitCursor = "127";
  for (let step = 0; step < 7; step += 1) {
    orbitOrder.push(orbitCursor);
    const next = successor.get(orbitCursor);
    if (!next) fail(`modal orbit dead-end at ${orbitCursor}`);
    orbitCursor = next;
  }
  if (orbitCursor !== "127") fail("modal orbit does not close");
  const a0Order = bl073.cycles.A0.order.slice();
  const cycleSources = { dToD: probe.modalClosure.dToD.cycles, aToA: probe.modalClosure.aToA.cycles };
  const scopeBCycles = [
    ...D_TIER_ORDER.map((tier) => ({ tier, order: cycleSources.dToD.find((cycle) => cycle.tier === tier).stateIds.map(String) })),
    ...A_TIER_ORDER.map((tier) => ({ tier, order: tier === "A0" ? a0Order : cycleSources.aToA.find((cycle) => cycle.tier === tier).stateIds.map(String) })),
  ];

  // ---- calibration gate 1: BL-084 Scope B re-derivation (fail-loud) --------
  const calibrationScopeB = { cycles: 0, layers: 0 };
  for (const cycle of scopeBCycles) {
    const landed = cycle.tier === "A0"
      ? bl084.scopeB.supplementaryCycles.find((record) => record.tier === "A0")
      : cycle.tier === "A1" || cycle.tier === "A2"
        ? bl084.scopeB.supplementaryCycles.find((record) => record.tier === cycle.tier)
        : bl084.scopeB.cycles.find((record) => record.tier === cycle.tier);
    if (!landed) fail(`BL-084 scope B record missing for ${cycle.tier}`);
    if (canonicalText(landed.order) !== canonicalText(cycle.order)) fail(`BL-084 ${cycle.tier} order drift`);
    const layerRecords = [];
    for (const [tier, ids] of layers.entries()) {
      const analysis = windowAnalysis(cycle.order, ids, masks, allIds);
      if (analysis.totalInstances === 0) continue;
      layerRecords.push({ tier, analysis });
    }
    layerRecords.sort((left, right) => right.analysis.totalInstances - left.analysis.totalInstances || cmp(left.tier, right.tier));
    if (layerRecords.length !== landed.layers.length) fail(`BL-084 ${cycle.tier} layer census drift`);
    for (const record of layerRecords) {
      const landedLayer = landed.layers.find((layer) => layer.tier === record.tier);
      if (!landedLayer) fail(`BL-084 ${cycle.tier}: layer ${record.tier} missing`);
      const compact = compactAnalysis(cycle.order, record.analysis);
      for (const [key, value] of Object.entries(compact)) {
        if (canonicalText(landedLayer[key]) !== canonicalText(value)) fail(`BL-084 ${cycle.tier} x ${record.tier}: ${key} drift`);
      }
      calibrationScopeB.layers += 1;
    }
    const topTotal = layerRecords[0].analysis.totalInstances;
    const topLayers = layerRecords.filter((record) => record.analysis.totalInstances === topTotal).map((record) => record.tier);
    const topVerdict = bestVerdict(layerRecords.filter((record) => record.analysis.totalInstances === topTotal).map((record) => verdictOf(record.analysis)));
    const bestLayerVerdict = bestVerdict(layerRecords.map((record) => verdictOf(record.analysis)));
    const slidingLayers = layerRecords.filter((record) => ["TWO_REGIME", "SLIDING_ONE_REGIME"].includes(shapeClassOf(record.analysis))).map((record) => record.tier);
    if (canonicalText(landed.topLayers) !== canonicalText(topLayers)) fail(`BL-084 ${cycle.tier}: topLayers drift`);
    if (landed.topVerdict !== topVerdict) fail(`BL-084 ${cycle.tier}: topVerdict drift`);
    if (landed.bestLayerVerdict !== bestLayerVerdict) fail(`BL-084 ${cycle.tier}: bestLayerVerdict drift`);
    if (canonicalText(landed.slidingLayers) !== canonicalText(slidingLayers)) fail(`BL-084 ${cycle.tier}: slidingLayers drift`);
    calibrationScopeB.cycles += 1;
  }
  if (canonicalText(orbitOrder) !== canonicalText(cycleSources.dToD.find((cycle) => cycle.tier === "D7").stateIds.map(String))) {
    fail("the network orbit order disagrees with the probe D7 order");
  }

  // ---- calibration gate 2: BL-084 Scope C re-derivation (fail-loud) --------
  const heptByKey = new Map(Object.entries(dpg.heptatonicNodes).map(([key, node]) => [key, String(node.pitchMask)]));
  const catalogEdges = dpg.operatorEdges.map((edge) => ({
    from: heptByKey.get(edge.sourceNodeId),
    to: heptByKey.get(edge.targetNodeId),
  }));
  if (catalogEdges.length !== 60 || catalogEdges.some((edge) => !edge.from || !edge.to)) fail("catalog edge resolution drift");
  const catalogAnchors = [...new Set(catalogEdges.flatMap((edge) => [edge.from, edge.to]))];
  if (catalogAnchors.length !== 21) fail("catalog anchor census drift");
  const directedCycles = enumerateDirectedCycles(catalogEdges);
  if (directedCycles.length !== 476) fail(`directed cycle census drift: ${directedCycles.length}`);
  const pairGroups = new Map();
  for (const cycle of directedCycles) {
    const key = canonicalCycleKey(cycle);
    if (!pairGroups.has(key)) pairGroups.set(key, []);
    pairGroups.get(key).push(cycle);
  }
  if ([...pairGroups.values()].some((group) => group.length !== 2)) fail("directed cycle pairing drift");
  const scopeCRows = [];
  for (const [key, group] of pairGroups.entries()) {
    const orientations = group
      .map((cycle) => ({ cycle, analysis: topLayerRecords(cycle, layers, masks, allIds) }))
      .sort((left, right) => cmp(left.cycle.join(","), right.cycle.join(",")));
    orientations.forEach((orientation, orientationIndex) => {
      const cycle = orientation.cycle;
      const structure = edgeStructure(cycle, masks);
      const topTotal = orientation.analysis[0].analysis.totalInstances;
      const topLayers = orientation.analysis.filter((record) => record.analysis.totalInstances === topTotal);
      const layerRows = topLayers.map((record) => ({ tier: record.tier, ...compactAnalysis(cycle, record.analysis) }));
      scopeCRows.push({
        pairKey: key,
        orientationIndex,
        length: cycle.length,
        order: cycle,
        rotationEdges: structure.edgeRotations.filter((hits) => hits.length > 0).length,
        topLayers: layerRows,
        verdict: bestVerdict(layerRows.map((row) => row.verdict)),
      });
    });
  }
  scopeCRows.sort((left, right) => left.length - right.length
    || cmp(left.pairKey, right.pairKey)
    || left.orientationIndex - right.orientationIndex);
  if (scopeCRows.length !== bl084.scopeC.rows.length) fail("BL-084 scope C row census drift");
  for (let index = 0; index < scopeCRows.length; index += 1) {
    const landed = bl084.scopeC.rows[index];
    const derived = scopeCRows[index];
    if (canonicalText(landed.order) !== canonicalText(derived.order)) fail(`BL-084 scope C row ${index}: order drift`);
    if (landed.pairKey !== derived.pairKey || landed.orientationIndex !== derived.orientationIndex || landed.length !== derived.length) fail(`BL-084 scope C row ${index}: identity drift`);
    if (landed.rotationEdges !== derived.rotationEdges) fail(`BL-084 scope C row ${index}: rotationEdges drift`);
    if (landed.verdict !== derived.verdict) fail(`BL-084 scope C row ${index}: verdict drift`);
    if (canonicalText(landed.topLayers) !== canonicalText(derived.topLayers)) fail(`BL-084 scope C row ${index}: topLayers drift`);
  }

  // ---- calibration gate 3: BL-087 landed diagnostics (fail-loud) -----------
  const a1Cycle = cycleSources.aToA.find((cycle) => cycle.tier === "A1");
  const a1Order = a1Cycle.stateIds.map(String);
  const a2Layer = layers.get("A2");
  const d6Layer = layers.get("D6");
  const a0Layer = layers.get("A0");
  if (a2Layer.length !== 42 || d6Layer.length !== 14 || a0Layer.length !== 42) fail("calibration layers drift");
  const rotationCuts = (order, layerIds) => {
    const cuts = [];
    for (let shift = 0; shift < order.length; shift += 1) {
      const rotated = [...order.slice(shift), ...order.slice(0, shift)];
      const analysis = windowAnalysis(rotated, layerIds, masks, allIds);
      cuts.push({ shift, allConsecutive: analysis.allConsecutive, verdict: verdictOf(analysis) });
    }
    return cuts;
  };
  const landedCutComparison = (order, layerIds, landedCuts, label) => {
    const cuts = rotationCuts(order, layerIds);
    if (cuts.length !== landedCuts.length) fail(`BL-087 ${label}: cut census drift`);
    cuts.forEach((entry, index) => {
      if (entry.allConsecutive !== landedCuts[index].allConsecutive || entry.verdict !== landedCuts[index].verdict) {
        fail(`BL-087 ${label}: cut ${index} drift`);
      }
    });
    return cuts;
  };
  landedCutComparison(a0Order, a0Layer, bl087.diagnostics.cutSensitivity.A0, "A0");
  landedCutComparison(orbitOrder, d6Layer, bl087.diagnostics.cutSensitivity.D7, "D7");
  landedCutComparison(a1Order, a2Layer, bl087.diagnostics.cutSensitivity.A1, "A1");
  const a1BaseSpanning = bl087.diagnostics.rhoA1Relocation.baseSpanningWindows;
  if (canonicalText(a1BaseSpanning.map((window) => window.state).sort(cmp)) !== canonicalText(["1359", "1401"])) fail("V-CP-1: BL-087 base spanning states drift");
  if (a1BaseSpanning.some((window) => canonicalText(window.parents) !== canonicalText(["1371", "1389"]))) fail("V-CP-1: BL-087 base spanning parents drift");
  const rhoA1 = a1Order.map((state) => {
    const imageMask = affineMapOfMask(masks.get(state), 11, 0);
    const row = ledgerRows.find((candidate) => maskOfRow(candidate) === imageMask);
    if (!row) fail(`V-CP-1: rho image of ${state} is ledger-absent`);
    return String(row.id);
  });
  if (canonicalText(rhoA1) !== canonicalText(bl087.diagnostics.rhoA1Relocation.imageOrder)) fail("V-CP-1: rho image order drift");
  const rhoAnalysis = windowAnalysis(rhoA1, a2Layer, masks, allIds);
  const rhoSpanning = rhoAnalysis.windows.filter((window) => !window.consecutive);
  if (canonicalText(rhoSpanning.map((window) => window.state).sort(cmp)) !== canonicalText(["3669", "981"])) fail("V-CP-1: rho relocation spanning states drift");
  if (rhoSpanning.some((window) => canonicalText(window.parents) !== canonicalText(["2901", "1749"]))) fail("V-CP-1: rho relocation parents drift");

  // ---- V-CP-1: the D1 anchor recomputation ---------------------------------
  const a1Census = cutCensus(a1Order, a2Layer, masks, allIds);
  const d1Windows = a1Census.flagged.filter((window) => ["1359", "1401"].includes(window.state));
  if (d1Windows.length !== 2) fail("V-CP-1: the D1 spanning pair is not present in the recomputed A1 census");
  for (const window of d1Windows) {
    if (canonicalText(window.parents) !== canonicalText(["1371", "1389"])) fail("V-CP-1: D1 parent set drift");
    if (canonicalText(window.indices) !== canonicalText([0, 6])) fail("V-CP-1: D1 index set drift");
    if (window.consecutive !== false || window.cyclic !== true) fail("V-CP-1: D1 window flag drift");
  }
  const wrapCut = a1Census.cuts.find((cut) => cut.k === 6);
  if (!wrapCut || canonicalText(wrapCut.exactStates) !== canonicalText(["1359", "1401"]) || !wrapCut.pairProduced) {
    fail("V-CP-1: the wrap cut is not pair-witnessed by the D1 spanning pair");
  }
  const d1Pair = reachPairs(a1Order, a1Census.analysis).list.find((pair) => pair.a === "1359" && pair.b === "1401");
  if (!d1Pair || canonicalText(d1Pair.shared) !== canonicalText(["1371", "1389"]) || !d1Pair.strict || !d1Pair.fertile) {
    fail("V-CP-1: the D1 reach pair record drift");
  }
  const d1ContainmentOverlap = containmentOverlap(
    heptById.get(heptNodes.find((node) => node.pitchMask === masks.get("1359")).id).subnodes,
    heptById.get(heptNodes.find((node) => node.pitchMask === masks.get("1401")).id).subnodes,
  );
  if (d1ContainmentOverlap.length !== 1) fail("GC-1: the D1 containment overlap is not exactly 1");

  // ---- the spanning census: Scope B (H layers) ------------------------------
  const classBreakdown = (tier) => {
    const counts = new Map();
    for (const row of ledgerRows) {
      if (row.tier !== tier || row.role !== "satellite") continue;
      counts.set(row.forte, (counts.get(row.forte) ?? 0) + 1);
    }
    return [...counts.entries()].sort((left, right) => cmp(left[0], right[0])).map(([forte, count]) => ({ forte, count }));
  };
  const scopeB = [];
  for (const cycle of scopeBCycles) {
    const family = tierAnchorFamily(ledgerRows, cycle.tier);
    for (const [tier, ids] of layers.entries()) {
      const analysis = windowAnalysis(cycle.order, ids, masks, allIds);
      if (analysis.totalInstances === 0) continue;
      scopeB.push(heptScopeBRow(cycle.tier, family, cycle.order, tier, ids, classBreakdown(tier), masks, allIds));
    }
  }

  // ---- the spanning census: Scope C (H top layers) --------------------------
  const scopeC = [];
  for (const [key, group] of pairGroups.entries()) {
    const orientations = group
      .map((cycle) => ({ cycle, analysis: topLayerRecords(cycle, layers, masks, allIds) }))
      .sort((left, right) => cmp(left.cycle.join(","), right.cycle.join(",")));
    orientations.forEach((orientation, orientationIndex) => {
      const cycle = orientation.cycle;
      const topTotal = orientation.analysis[0].analysis.totalInstances;
      const topLayers = orientation.analysis.filter((record) => record.analysis.totalInstances === topTotal);
      for (const record of topLayers) {
        const row = scopeCRow(key, orientationIndex, cycle, record.tier, layers.get(record.tier), masks, allIds);
        scopeC.push({ ...row, pairs: compactPairs(row.pairs) });
      }
    });
  }
  scopeC.sort((left, right) => left.length - right.length
    || cmp(left.pairKey, right.pairKey)
    || left.orientationIndex - right.orientationIndex
    || cmp(left.layerTier, right.layerTier));
  if (scopeC.length !== 488) fail(`scope C H-layer row census drift: ${scopeC.length}`);

  // ---- the spanning census: pentatonic layers (OD-CP-1/GC-3) -----------------
  const pentScopeB = [];
  for (const cycle of scopeBCycles) {
    const family = tierAnchorFamily(ledgerRows, cycle.tier);
    pentScopeB.push(heptScopeBRow(cycle.tier, family, cycle.order, "PENT", pentIds, [{ forte: "5-side", count: pentIds.length }], masks, mergedIds));
  }
  const pentScopeC = [];
  const eDScopeC = { rows: 0, totalPairs: 0, maxPairs: 0 };
  const pCensusPairSet = new Set(pCensus.pairs.map(([idA, idB]) => `${idA}|${idB}`));
  for (const [key, group] of pairGroups.entries()) {
    const orientations = group
      .map((cycle) => ({ cycle }))
      .sort((left, right) => cmp(left.cycle.join(","), right.cycle.join(",")));
    orientations.forEach((orientation, orientationIndex) => {
      const row = scopeCRow(key, orientationIndex, orientation.cycle, "PENT", pentIds, masks, mergedIds);
      for (const pair of row.pairs.list) {
        const pairKey = `${pair.a}|${pair.b}`;
        if (!pCensusPairSet.has(pairKey)) fail(`E-D: pent layer pair ${pairKey} is not in the global pentatonic census`);
      }
      eDScopeC.rows += 1;
      eDScopeC.totalPairs += row.pairs.count;
      eDScopeC.maxPairs = Math.max(eDScopeC.maxPairs, row.pairs.count);
      pentScopeC.push({ ...row, pairs: compactPairs(row.pairs) });
    });
  }
  pentScopeC.sort((left, right) => left.length - right.length
    || cmp(left.pairKey, right.pairKey)
    || left.orientationIndex - right.orientationIndex);
  if (pentScopeC.length !== 476) fail(`scope C pentatonic row census drift: ${pentScopeC.length}`);

  // ---- correspondence E-A: the reduction test ------------------------------
  const eAAggregate = (rows, label) => {
    const spanningRows = rows.filter((row) => row.classification.spanning > 0);
    const reductionExact = spanningRows.filter((row) => row.classification.reductionExact).length;
    const faults = spanningRows.filter((row) => row.classification.fault);
    return {
      population: label,
      spanningRows: spanningRows.length,
      reductionExact,
      faults: faults.length,
      nonCyclicRows: spanningRows.filter((row) => row.nonCyclicWindows.length > 0).length,
      fullRangeRows: spanningRows.filter((row) => row.fullRangeWindows.length > 0).length,
      nonCyclicStatesTotal: spanningRows.reduce((sum, row) => sum + row.nonCyclicWindows.length, 0),
      fullRangeStatesTotal: spanningRows.reduce((sum, row) => sum + row.fullRangeWindows.length, 0),
      faultSample: faults.slice(0, 8).map((row) => ({
        cycle: row.cycleTier ?? row.pairKey,
        layer: row.layerTier,
        nonCyclic: row.nonCyclicWindows.length,
        fullRange: row.fullRangeWindows.length,
      })),
    };
  };
  const eA = {
    rule: "spanning(k) is attributable to adjacent-anchor co-parenting iff N(k) (windows containing both adjacent anchors, size < n) is non-empty for every spanning cut; the reduction is exact for a census row iff no window is non-cyclic and none is full-range; the exact-witness / rotation equivalence is asserted for every cut of every row (rotationAgrees); the complete per-row fault loci live in the spanning map (nonCyclicWindows / fullRangeWindows)",
    populations: {
      scopeB_H: eAAggregate(scopeB, "scopeB_H"),
      scopeC_H: eAAggregate(scopeC, "scopeC_H"),
      scopeB_PENT: eAAggregate(pentScopeB, "scopeB_PENT"),
      scopeC_PENT: eAAggregate(pentScopeC, "scopeC_PENT"),
    },
    reading: "the D-2 rule (a cut is non-consecutive exactly when its adjacent-across anchors are jointly co-parented by a layer window) holds for every census row whose windows are all cyclic intervals and none is full-range; non-cyclic windows span cuts without any adjacent-anchor witness (uncut spanning) and full-range windows witness every cut without breaking consecutiveness",
  };

  // ---- correspondence E-B: the pair test ------------------------------------
  const eBRow = (row) => ({
    cycle: row.cycleTier ?? row.pairKey,
    layer: row.layerTier,
    spanning: row.classification.spanning,
    pairProduced: row.classification.pairProduced,
    singleWitnessCuts: row.classification.singleWitnessCuts,
    pairs: { count: row.pairs.count, fertile: row.pairs.fertile, infertile: row.pairs.infertile, strict: row.pairs.strict },
  });
  const eBAggregate = (rows, label) => {
    const spanningRows = rows.filter((row) => row.classification.spanning > 0);
    return {
      population: label,
      spanningRows: spanningRows.length,
      pairBijectionRows: spanningRows.filter((row) => row.classification.singleWitnessCuts.length === 0).length,
      singleWitnessRows: spanningRows.filter((row) => row.classification.singleWitnessCuts.length > 0).length,
      allFertileRows: spanningRows.filter((row) => row.pairs.fertile === row.pairs.count).length,
      infertilePairRows: spanningRows.filter((row) => row.pairs.infertile > 0).length,
    };
  };
  const eB = {
    rule: "direction 1: every reach co-parented pair (shared >= 2 parents) whose shared set contains a cyclically adjacent pair produces spanning at that cut (fertility); direction 2: every spanning cut is produced by a co-parented pair iff it is pair-witnessed (exact witnesses >= 2; any two witnesses of a cut share the adjacent anchor pair)",
    populations: {
      scopeB_H: eBAggregate(scopeB, "scopeB_H"),
      scopeC_H: eBAggregate(scopeC, "scopeC_H"),
      scopeB_PENT: eBAggregate(pentScopeB, "scopeB_PENT"),
      scopeC_PENT: eBAggregate(pentScopeC, "scopeC_PENT"),
    },
    d1Anchor: {
      cycle: "A1",
      layer: "A2",
      pair: ["1359", "1401"],
      shared: ["1371", "1389"],
      wrapCut: { k: 6, pair: ["1389", "1371"], exactStates: wrapCut.exactStates },
      strict: true,
      fertile: true,
    },
    partialLoci: [
      ...scopeB.filter((row) => row.classification.partial).map(eBRow),
      ...pentScopeB.filter((row) => row.classification.partial).map(eBRow),
      ...scopeC.filter((row) => row.classification.partial).map(eBRow),
      ...pentScopeC.filter((row) => row.classification.partial).map(eBRow),
    ].slice(0, 40),
    reading: "direction 1 holds exactly when every window is a cyclic interval (then every shared set of size >= 2 is a cyclic run and contains an adjacent pair); direction 2 holds exactly when no spanning cut is single-witnessed; the A1 x A2 census (the D1 instance) satisfies both",
  };

  // ---- correspondence E-C: heptatonic containment pairs among layer states ---
  const eCRows = [];
  for (const row of [...scopeB, ...scopeC]) {
    const reached = row.compact.reachedCount;
    const reachedStates = row.windows
      ? row.windows.map((window) => window.state)
      : null;
    if (reachedStates === null) continue;
    const nodeIds = reachedStates
      .map((state) => heptNodes.find((node) => node.pitchMask === masks.get(state)))
      .filter((node) => node !== undefined)
      .map((node) => node.id);
    let containmentPairs = 0;
    for (let i = 0; i < nodeIds.length; i += 1) {
      for (let j = i + 1; j < nodeIds.length; j += 1) {
        if (containmentOverlap(heptById.get(nodeIds[i]).subnodes, heptById.get(nodeIds[j]).subnodes).length >= 2) containmentPairs += 1;
      }
    }
    eCRows.push({
      cycle: row.cycleTier,
      layer: row.layerTier,
      reached,
      reachPairs: row.pairs.count,
      containmentPairs,
      coincidence: row.pairs.list.filter((pair) => {
        const nodeA = heptNodes.find((node) => node.pitchMask === masks.get(pair.a));
        const nodeB = heptNodes.find((node) => node.pitchMask === masks.get(pair.b));
        return nodeA && nodeB && containmentOverlap(heptById.get(nodeA.id).subnodes, heptById.get(nodeB.id).subnodes).length >= 2;
      }).length,
    });
  }
  const eC = {
    rule: "heptatonic-side containment co-parenting (subnodes overlap >= 2) among the reached layer states vs the reach co-parenting pairs of the same census; coincidence = pairs satisfying both",
    rows: eCRows,
    reading: "the containment relation (overlap >= 2) is exactly the Hamming-2 partner relation (all overlap-5 pairs are Hamming-2, verified); the reach relation binds states by shared cycle anchors; the two relations coincide only where a Hamming-2 partner pair also shares >= 2 cycle-anchor parents",
  };

  // ---- correspondence E-D: pentatonic-side census bound to pent layers -------
  const eDPairs = pentScopeB.map((row) => ({
    cycle: row.cycleTier,
    pairs: row.pairs.count,
    keys: row.pairs.list.map((pair) => `${pair.a}|${pair.b}`),
  }));
  const eD = {
    rule: "the pentatonic-layer reach pairs (pairs of pentatonics sharing >= 2 cycle-anchor parents) are a subset of the global pentatonic containment census pairs (sharing >= 2 of the 21 parents) - verified fail-loud for every row",
    scopeB: eDPairs,
    scopeC: eDScopeC,
    reading: "no pentatonic cycles exist (G1), so the pentatonic-side correspondence binds through the pentatonic satellite layers on the heptatonic cycles; every such reach pair is a global containment-co-parented pair by construction (the shared cycle anchors are shared containment parents)",
  };

  // ---- per-family / per-class breakdown --------------------------------------
  const familyRows = new Map();
  const addFamilyRow = (family, row) => {
    if (!familyRows.has(family)) familyRows.set(family, { family, rows: 0, exact: 0, partial: 0, fault: 0, noSpanning: 0, spanningCuts: 0 });
    const entry = familyRows.get(family);
    entry.rows += 1;
    entry.spanningCuts += row.classification.spanning;
    if (row.classification.exact) entry.exact += 1;
    else if (row.classification.fault) entry.fault += 1;
    else if (row.classification.partial) entry.partial += 1;
    else entry.noSpanning += 1;
  };
  for (const row of [...scopeB, ...pentScopeB]) addFamilyRow(row.cycleFamily, row);
  const satelliteClassStats = new Map();
  for (const row of scopeB) {
    for (const window of row.windows) {
      const rowEntry = rowById.get(window.state);
      const key = rowEntry.forte;
      if (!satelliteClassStats.has(key)) satelliteClassStats.set(key, { forte: key, witnessIncidences: 0, nonConsecutiveWindows: 0 });
      const entry = satelliteClassStats.get(key);
      entry.witnessIncidences += window.indices.length;
      if (!window.consecutive) entry.nonConsecutiveWindows += 1;
    }
  }
  const perFamily = {
    cycleFamilies: [...familyRows.values()].sort((left, right) => cmp(left.family, right.family)),
    satelliteClasses: [...satelliteClassStats.values()].sort((left, right) => cmp(left.forte, right.forte)),
    containment: {
      pSide: pCensus.familyStats,
      hSide: hCensus.familyStats,
    },
  };

  // ---- context: the D2 dual-phenomenon trio (comparison-only) ---------------
  const d2TrioPairs = [["471", "1479"], ["2283", "2787"], ["3189", "3441"]];
  const d2Trio = {
    note: "context re-verification (comparison-only): the BL-074/BL-087 dual-phenomenon trio (rotation-6 and displacement-6 coincide); the D2 cycle is also the D-tier non-cyclic-fault locus (D2 x D2: 12 non-cyclic windows; D2 x A2: 10)",
    pairs: d2TrioPairs.map(([left, right]) => {
      const leftMask = masks.get(left);
      const rightMask = masks.get(right);
      const rotation6 = rotateMask12(leftMask, 6) === rightMask || rotateMask12(rightMask, 6) === leftMask;
      const displacement = Math.abs(pcSumOfMask(leftMask) - pcSumOfMask(rightMask));
      return {
        pair: [left, right],
        tiers: [rowById.get(left).tier, rowById.get(right).tier],
        rotation6,
        pcSumDisplacement: displacement,
        displacement6: displacement === 6,
        dual: rotation6 && displacement === 6,
      };
    }),
    d2FaultRows: { d2xD2NonCyclic: 12, d2xA2NonCyclic: 10 },
  };
  if (!d2Trio.pairs.every((entry) => entry.dual)) fail("the D2 dual-phenomenon trio re-verification failed");

  // ---- synthesis -------------------------------------------------------------
  const allRows = [...scopeB, ...scopeC, ...pentScopeB, ...pentScopeC];
  const spanningRows = allRows.filter((row) => row.classification.spanning > 0);
  const exactRows = spanningRows.filter((row) => row.classification.exact);
  const exactRate = spanningRows.length > 0 ? exactRows.length / spanningRows.length : 0;
  const aTierAnchorMasks = new Set(
    ledgerRows.filter((row) => A_TIER_ORDER.includes(row.tier) && row.role === "anchor").map((row) => maskOfRow(row)),
  );
  const exactIsA1Only = exactRows.length <= 3 && exactRows.every((row) => row.cycleTier === "A1" && row.layerTier === "A2");
  const exactIsBoundary = exactRows.length > 0 && exactRows.every((row) => {
    if (row.cycleTier !== undefined) return true;
    const anchors = row.order.map((state) => masks.get(state));
    return anchors.every((mask) => aTierAnchorMasks.has(mask));
  });
  const verdict = exactRate >= 0.9
    ? "GENERAL"
    : exactIsA1Only
      ? "A1_SPECIFIC"
      : exactIsBoundary
        ? "BOUNDARY_LAYER_CONDITIONAL"
        : "PARTIAL_GENERAL";
  const exactLoci = exactRows.map((row) => ({ cycle: row.cycleTier ?? row.pairKey, layer: row.layerTier, length: row.length }));
  const faultLoci = spanningRows.filter((row) => row.classification.fault).map((row) => ({
    cycle: row.cycleTier ?? row.pairKey,
    layer: row.layerTier,
    nonCyclic: row.nonCyclicWindows.length,
    fullRange: row.fullRangeWindows.length,
  }));
  const synthesis = {
    verdict,
    scope: verdict === "BOUNDARY_LAYER_CONDITIONAL"
      ? "the co-parenting <-> spanning correspondence in its exact form (adjacent-anchor reduction + pair-witnessed cuts + all pairs fertile) recurs on the boundary layer's censuses and degrades across the general topology"
      : "see the exact-row loci",
    exactRowCensus: {
      total: exactRows.length,
      spanningRows: spanningRows.length,
      exactRate: `${exactRows.length}/${spanningRows.length}`,
      loci: exactLoci,
    },
    faultCensus: {
      total: faultLoci.length,
      nonCyclicFaults: faultLoci.filter((row) => row.nonCyclic > 0).length,
      fullRangeFaults: faultLoci.filter((row) => row.fullRange > 0).length,
      loci: faultLoci.slice(0, 60),
    },
    direction1: "every co-parented pair fertile holds exactly on the reduction-exact rows (shared sets of cyclic intervals are cyclic runs); infertile pairs occur exactly where non-cyclic windows exist",
    direction2: "every spanning cut pair-witnessed fails on the single-witness cuts (A0 own-tier: 2 cuts; pent A1: 5 cuts; 464 of 488 Scope C H-rows carry single-witness cuts) and degenerates where non-cyclic windows flood every cut",
    d1AnchorStatement: "the A1 spanning is closure-edge co-parenting read across the landed cut (BL-087, reproduced): 1359/1401 reached by both endpoints 1371/1389, the wrap cut pair-witnessed; the mechanism is exact at this census",
    higherTheoremNote: "no higher-theorem answer; the correspondence's scope is bounded by the measured loci; no claim event; D7 hypothesis-tier throughout",
  };

  const gslTreatment = {
    rule: "the BL-072/BL-084 precedent: generalization findings land as an inline, unapplied candidate/refinement; no new GSL number is registered; no registration is performed by this artifact",
    candidateDraft: {
      status: "GSL-8 candidate draft (un-promoted, inline, unapplied)",
      text: "the cut-level mechanism of the reach-order alignment: a cut is non-consecutive exactly when its adjacent-across anchors are jointly co-parented by a layer window (exact for cyclic-interval layers); pair-witnessing (>= 2 co-parenting states) and fertility hold on the boundary layer's censuses and degrade in the general topology (non-cyclic windows, single-witness cuts)",
    },
    generalizationVerdict: "the mechanism is boundary-layer-conditional in its exact form; the reduction's failures and the single-witness cuts are the measured degradation loci",
    newEntry: "none: no GSL-7 status change; no registration",
  };

  const sourceBindings = [
    { artifact: BIPARTITE_PATH, sha256: bipartiteSha, role: "the containment graph (330 pentatonic parentsRooted; 462 heptatonic subnodes) - the census base" },
    { artifact: LEDGER_PATH, sha256: fileSha(LEDGER_PATH), role: "462-record pitch sets, masks, tiers, roles (masks-only)" },
    { artifact: NETWORK_PATH, sha256: fileSha(NETWORK_PATH), role: "the D7 modal orbit order (calibration)" },
    { artifact: BL084_PATH, sha256: fileSha(BL084_PATH), role: "the landed populations, layer censuses, and scope C rows (calibration target)" },
    { artifact: BL087_PATH, sha256: fileSha(BL087_PATH), role: "the D1 spanning pair and rho relocation (V-CP-1 calibration)" },
    { artifact: BL073_PATH, sha256: fileSha(BL073_PATH), role: "the A0 ring order (comparison)" },
    { artifact: PROBE_PATH, sha256: fileSha(PROBE_PATH), role: "the M-cycle orders (comparison)" },
    { artifact: DPG_PATH, sha256: fileSha(DPG_PATH), role: "the 60 catalog edges (the Scope C cycle population)" },
  ];

  const grounding = {
    receipt: [
      { claim: "the containment graph: 330 pentatonic nodes x 21 parentsRooted; 462 heptatonic nodes x 15 subnodes; byte-stable planning_evidence", source: `${BIPARTITE_PATH} (sha256 ${bipartiteSha})`, verdict: "GROUNDED (EXACT)" },
      { claim: "the window machinery: windowAnalysis imported verbatim from the BL-084 generator (OD-84-5 same-code-path)", source: `scripts/build-bl084-window-ladder.mjs; ${BL084_PATH} fingerprint self-checked`, verdict: "GROUNDED (EXACT)" },
      { claim: "the D1 anchor: 1359/1401 spanned by parents 1371/1389 at indices [0,6]; the wrap cut pair-witnessed; rho relocates to 3669/981 (parents 2901/1749)", source: `${BL087_PATH} fingerprint self-checked + recomputation`, verdict: "GROUNDED (EXACT)" },
      { claim: "the BL-084 populations: Scope B (10 M-cycles x all layers) and Scope C (476 directed cycles x top layers) re-derived field-for-field", source: `${BL084_PATH}`, verdict: "GROUNDED (EXACT)" },
      { claim: "the containment identities: pentatonic overlap-6 = |intersection| 4; heptatonic overlap-5 = Hamming-2 (6930 = 6930)", source: "recomputation over the bipartite bytes", verdict: "GROUNDED (EXACT)" },
      { claim: "GC-1: 1359/1401 share exactly one rooted subnode (5-34:6) - the D1 pair is reach-co-parented, not containment-co-parented", source: "recomputation over the bipartite bytes", verdict: "GROUNDED (EXACT)" },
    ],
    calibration: {
      scopeB: { cycles: calibrationScopeB.cycles, layers: calibrationScopeB.layers, status: "EXACT" },
      scopeC: { rows: scopeCRows.length, status: "EXACT" },
      bl087Cuts: { A0: "EXACT", D7: "EXACT", A1: "EXACT", rhoRelocation: "EXACT" },
      d1Anchor: "EXACT",
      containmentIntegrity: { pPairs: pCensus.pairs.length, hPairs: hCensus.pairs.length, hamming2: hamming2Count, status: "EXACT" },
    },
  };

  const method = {
    windowMachinery: "imported verbatim from scripts/build-bl084-window-ladder.mjs (windowAnalysis, shapeClassOf, verdictOf, compactAnalysis) - the OD-84-5 same-code-path discipline: differences are data differences",
    reachDefinition: "p is reached by a iff hamming12(mask(a), mask(p)) = 2; for pentatonics (5-sets) against heptatonic anchors this is exactly containment (p subset a)",
    cutRule: "cut k between order[k] and order[(k+1) mod n]; exact witnesses E(k) = {windows containing both adjacent anchors with size < n} union {non-cyclic windows}; asserted equal to the windows non-consecutive under the cut's rotation for every cut (rotationAgrees)",
    populations: "Scope B (the ten M-cycles x all satellite tiers with nonzero reach) and Scope C (the 476 directed operator cycles x top layers) per BL-084; plus the pentatonic satellite layers (the 330 rooted pentatonics) on the same cycles",
    containmentJoin: "the bipartite parentsRooted / subnodes overlap joins; the >=2 primary threshold with >=1/>=3 sensitivity columns",
    descriptiveRead: "the census and the window recomputation are analysis over landed bytes (the OD-74-1/OD-1 descriptive-read class); no new measurement, no new universe, no new witness discovery",
  };

  const accounting = {
    masksOnly: [
      "the ledger's pitch sets, masks, and tier/role partition",
      "every window analysis, cut classification, rotation cross-check, and reach-pair computation through the shared window machinery",
      "the pentatonic-layer reach arithmetic (containment = Hamming-2 for 5-in-7; the BL-070 precedent)",
      "the containment overlap joins and the pair machinery",
      "the Scope C cycle enumeration (DFS over the 60 catalog edges; pure graph arithmetic)",
      "the correspondence classifications and the decision rule application",
    ],
    canonicalComputation: [
      "the bipartite containment graph (the census base; sha-pinned)",
      "the landed cycle orders: the network modal rows, BL-073's A0 order, the probe's M-cycle stateIds",
      "the BL-084 landed populations and layer censuses (calibration targets)",
      "the BL-087 landed D1 diagnostics (V-CP-1 calibration)",
      "the chain fingerprints (self-checked)",
    ],
    remainingGranted: [
      "the tier/role partition membership itself (the ledger's marking)",
      "the recorded cycle orders and their cuts (the landed presentation)",
      "presentation conventions and the frame vocabulary (never a design input)",
    ],
    statement: "the analysis is masks-only reach arithmetic plus labelled reads over landed orders, layers, and the containment graph; no new measurement occurs beyond the arithmetic the BL-070/BL-086 descriptive-read precedent licenses; every calibration mismatch is a halt",
  };

  const fences = {
    noNewMeasurement: "the census and the window recomputation are analysis over landed bytes; the pentatonic-layer reach is masks-only containment arithmetic; no new universe, no new cycle discovery",
    noMechanismClaim: "no causal claim beyond the correspondence verdict; production questions stay open",
    noClaimEvent: "no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20/21 byte-untouched)",
    noGovernsAdmission: "no GOVERNS admission; no new GSL number; the GSL-8 candidate draft is inline, unapplied; no registration",
    d7HypothesisTier: "D7 hypothesis-tier throughout (ENTRY 15's D7 clause carries forward verbatim)",
    noG1: "no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment",
    noWrites: "no canonical/Court/schema/Neo4j writes",
    membrane: "the frame (harmonic-comprehension-map sections 2.6/2.7) is interpretation vocabulary, never a probe input",
    sessionProse: "session prose is context, not evidence",
  };

  const contractCitations = [
    "orrery/src/generated/bl087-klein-ladder-probe.v1.json (the D1 spanning pair, the rho relocation, the cut-sensitivity diagnostics; fingerprint self-checked)",
    "orrery/src/generated/bl084-window-ladder.v1.json (the window machinery, the populations, the landed layer censuses; fingerprint self-checked)",
    "orrery/src/generated/bl073-isometry-probe.v1.json (the A0 ring order; fingerprint self-checked)",
    "orrery/src/generated/d-tier-operator-probe.v1.json (the M-cycle orders; fingerprint self-checked)",
    "orrery/src/generated/derived-path-graph.v1.json (the 60 catalog edges; fingerprint self-checked)",
    "derived/hypergraph/bipartite-inclusion-v1.json (the containment graph; the census base; sha-pinned)",
    "canonical/universal-heptatonic-ledger.csv (masks and the tier/role partition)",
    "canonical/universal-network-data.json (the D7 modal rows)",
    "scrum/plan/bl-087-klein-ladder-probe-memo.md (the closure-edge co-parenting characterization)",
    "scrum/plan/bl-086-term-b-own-tier-memo.md (the A1 spanning pair context)",
    "scrum/plan/bl-074-tritone-anatomy-memo.md (the D2 dual-phenomenon trio; comparison-only)",
    "scrum/plan/bl-067-governs-semantic-synthesis.md (the governs semantic layer; no registration here)",
  ];

  const notAccomplished = [
    "no new measurement (landed bipartite + landed orders/layers + verbatim windowAnalysis + masks-only pentatonic containment arithmetic; the descriptive-read class)",
    "no mechanism (causal) claim beyond the correspondence verdict",
    "no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20/21 byte-untouched)",
    "no GOVERNS admission; no new GSL number; the GSL-8 candidate draft is inline, unapplied; no registration",
    "no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment",
    "no canonical/Court/schema/Neo4j writes; D7 hypothesis-tier throughout",
  ];

  const core = {
    schemaVersion: SCHEMA_VERSION,
    investigationId: INVESTIGATION_ID,
    status: "planning_evidence",
    generator: "scripts/build-bl088-co-parenting-probe.mjs",
    role: "the co-parenting generalization probe: does the BL-087 closure-edge co-parenting x cut characterization of the A1 spanning generalize across the topology? Both-direction containment census + spanning census + correspondence + per-family breakdown; planning evidence",
    preRegistration: PRE_REGISTRATION,
    method,
    sourceBindings,
    base: {
      bipartite: { artifact: BIPARTITE_PATH, sha256: bipartiteSha },
      chainFingerprints: { bl084: bl084Fingerprint, bl087: bl087Fingerprint, bl073: bl073Fingerprint, probe: probeFingerprint, dpg: graphFingerprint },
      importPolicy: "the chain artifacts are consumed by fingerprint self-check (no literals in this generator); the BL-084 populations and the BL-087 D1 diagnostics are re-derived fail-loud; no landed artifact is rewritten",
    },
    grounding,
    containment: {
      pSide: {
        universe: pentNodes.length,
        arity: 21,
        pairCount: (pentNodes.length * (pentNodes.length - 1)) / 2,
        thresholds: pCensus.thresholds,
        overlapHistogram: pCensus.overlapHistogram,
        pairs: pCensus.pairs,
        identity: "overlap-6 pairs are exactly the |p1 intersect p2| = 4 pairs (verified)",
      },
      hSide: {
        universe: heptNodes.length,
        arity: 15,
        pairCount: (heptNodes.length * (heptNodes.length - 1)) / 2,
        thresholds: hCensus.thresholds,
        overlapHistogram: hCensus.overlapHistogram,
        pairs: hCensus.pairs,
        identity: "overlap-5 pairs are exactly the Hamming-2 pairs (verified; 6930 = 6930)",
      },
    },
    spanning: {
      scopeB,
      scopeC,
      pentatonic: { scopeB: pentScopeB, scopeC: pentScopeC },
    },
    correspondence: { eA, eB, eC, eD },
    context: { d2Trio },
    perFamily,
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
    calibration: investigation.grounding.calibration,
    containment: {
      pPairs: investigation.containment.pSide.pairs.length,
      hPairs: investigation.containment.hSide.pairs.length,
    },
    correspondence: {
      eA: investigation.correspondence.eA.populations,
      eB: investigation.correspondence.eB.populations,
    },
    synthesis: investigation.synthesis.verdict,
    exactRows: investigation.synthesis.exactRowCensus.total,
    faultRows: investigation.synthesis.faultCensus.total,
    investigationFingerprint: investigation.investigationFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_BL088_CO_PARENTING_PROBE");
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
