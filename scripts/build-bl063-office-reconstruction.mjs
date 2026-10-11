#!/usr/bin/env node
/**
 * Build the BL-063 intrinsic office reconstruction (Phase 1 of the BL-059
 * un-granting roadmap: requirement 2, office recovery from non-office data).
 *
 * The derivation, from pitch masks and the frozen midpoint form only:
 *   p7          - the seven A0 anchor masks (7-35 modes) carry a Hamming-2
 *                 adjacency graph isomorphic to the path P7; degree sequence
 *                 {1,2,2,2,2,2,1}; endpoints are the line terminals
 *   kappa       - kappa0 = BFS position from the numerically smaller terminal
 *                 (claim-free scaffold); kappa1 = 6 - kappa0; the alignment
 *                 against canonical offices is recorded (validation only)
 *   pi          - constructor identification from masks alone: internal
 *                 anchors have exactly two Hamming-2 A0 neighbors (the
 *                 sandwich holds on that unique pair); boundary anchors have
 *                 exactly one (construction is T+/-1 twin-closure, not
 *                 sandwich); the unrestricted sandwich multiplicity is
 *                 recorded as a bounded observation
 *   midZ7       - for each A1 anchor, midZ7 of its constructors' kappa
 *                 positions under both orientations; three-branch outcome
 *                 (M1 exactly one matches / M2 neither / M3 both)
 *   reflection  - sigma-equivariance of the frozen midpoint form
 *                 (midZ7(6-a,6-b) == (6 - midZ7(a,b)) % 7): the midpoint law
 *                 is reflection-blind; orientation cannot be resolved by it
 *   orientation - H_A (pcSum / brightness premise, interpretation-tagged) and
 *                 H_B (D-tier containment asymmetry, existence-only);
 *                 decision rule and residual-dependency bookkeeping
 *   synthesis   - requirement-2 discharge verdict:
 *                 FORMALLY_DISCHARGED / CONSTRAINED_TO_REFLECTION / FAILED
 *
 * Fences: planning_evidence only. No claim event, no record amendment, no
 * GOVERNS derivation, no admission, no G1 movement, no directional assignment,
 * no canonical/Court/schema/Neo4j writes. The frame 2.6/2.7 is interpretation
 * vocabulary, never design input.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { midZ7 } from "./d4-derivation-engine.mjs";
import {
  BIPARTITE_PATH,
  HEPTATONIC_NETWORK_PATH,
  canonicalText,
  fail,
  fileSha,
  readJson,
  sha256,
} from "./verify-phase-a-proposals.mjs";

const NETWORK_PATH = HEPTATONIC_NETWORK_PATH;

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

export const SCHEMA_VERSION = "harmonic-orrery.bl063-office-reconstruction.v1";
export const RECONSTRUCTION_ID = "BL063_OFFICE_RECONSTRUCTION_v1";
export const OUTPUT_PATH = "orrery/src/generated/bl063-office-reconstruction.v1.json";
export const GENERATION_PATH = "qa/d4-production-generation.json";
export const LEDGER_PATH = "canonical/universal-heptatonic-ledger.json";
export const CHAIN_ANCHOR_PATH = "orrery/src/generated/d4-14v14-hunt.v1.json";
export const NON_Z_D_FAMILIES = ["7-1", "7-15", "7-22", "7-8"];
export const Z_D_FAMILIES = ["7-Z12", "7-Z17", "7-Z37"];

// ==== INTRINSIC-DERIVATION-BEGIN (masks only; the grant is unread) ====

function cmp(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function hamming12(a, b) {
  let x = a ^ b;
  let count = 0;
  while (x !== 0) { count += x & 1; x >>= 1; }
  return count;
}

export function rotateMask12(mask, d) {
  const shift = ((d % 12) + 12) % 12;
  if (shift === 0) return mask & 4095;
  return (((mask << shift) & 4095) | (mask >> (12 - shift))) & 4095;
}

export function pcSumOfMask(mask) {
  let sum = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) if (mask & (1 << pitch)) sum += pitch;
  return sum;
}

function midpoint(oA, oB) {
  return Number(midZ7(BigInt(oA), BigInt(oB)));
}

export function deriveP7(a0Masks) {
  const nodes = a0Masks.map((mask) => ({ mask, pcSum: pcSumOfMask(mask), degree: 0 }));
  const edges = [];
  for (let i = 0; i < a0Masks.length; i += 1) {
    for (let j = i + 1; j < a0Masks.length; j += 1) {
      if (hamming12(a0Masks[i], a0Masks[j]) === 2) {
        edges.push([a0Masks[i], a0Masks[j]].sort(cmp));
        nodes.find((node) => node.mask === a0Masks[i]).degree += 1;
        nodes.find((node) => node.mask === a0Masks[j]).degree += 1;
      }
    }
  }
  edges.sort((left, right) => cmp(left[0], right[0]) || cmp(left[1], right[1]));
  const endpoints = nodes.filter((node) => node.degree === 1).map((node) => node.mask).sort(cmp);
  const adjacency = new Map(a0Masks.map((mask) => [mask, []]));
  for (const [a, b] of edges) { adjacency.get(a).push(b); adjacency.get(b).push(a); }
  for (const list of adjacency.values()) list.sort(cmp);
  const start = endpoints[0];
  const order = [];
  const visited = new Set([start]);
  const queue = [start];
  while (queue.length > 0) {
    const current = queue.shift();
    order.push(current);
    for (const next of adjacency.get(current)) {
      if (!visited.has(next)) { visited.add(next); queue.push(next); }
    }
  }
  return { nodes: nodes.sort((left, right) => cmp(left.mask, right.mask)), edges, endpoints, order, adjacency };
}

export function deriveKappa(p7) {
  const kappa0 = new Map(p7.order.map((mask, index) => [mask, index]));
  const kappa1 = new Map(p7.order.map((mask, index) => [mask, 6 - index]));
  return { kappa0, kappa1 };
}

function sandwichHolds(p, q, child) {
  const inter = p & q;
  const union = p | q;
  return ((inter & child) === inter) && ((child & union) === child);
}

export function derivePi(a1Mask, p7) {
  const neighbors = p7.nodes.map((node) => node.mask)
    .filter((mask) => hamming12(mask, a1Mask) === 2)
    .sort(cmp);
  if (neighbors.length === 2) {
    const [p, q] = neighbors;
    if (!sandwichHolds(p, q, a1Mask)) {
      fail(`construction envelope: sandwich fails on the unique Hamming-2 pair at ${a1Mask}`);
    }
    return { child: a1Mask, mode: "sandwich", neighbors, constructors: [p, q].sort(cmp), twin: null,
      sandwichOnConstructors: true };
  }
  if (neighbors.length === 1) {
    const pStar = neighbors[0];
    const twins = p7.nodes.map((node) => node.mask)
      .filter((q) => q !== pStar && (
        rotateMask12(pStar, 1) === q || rotateMask12(pStar, 11) === q ||
        rotateMask12(q, 1) === pStar || rotateMask12(q, 11) === pStar))
      .sort(cmp);
    if (twins.length !== 1) fail(`twin-closure: ${twins.length} rotation partners at ${a1Mask}`);
    const [twin] = twins;
    return { child: a1Mask, mode: "twin-closure", neighbors, constructors: [pStar, twin].sort(cmp), twin,
      sandwichOnConstructors: sandwichHolds(pStar, twin, a1Mask) };
  }
  fail(`Hamming-2 neighbor count ${neighbors.length} outside {1,2} at ${a1Mask}`);
}

export function deriveMidpoints(piEntry, kappa) {
  const [p, q] = piEntry.constructors;
  return {
    child: piEntry.child,
    g0: midpoint(kappa.kappa0.get(p), kappa.kappa0.get(q)),
    g1: midpoint(kappa.kappa1.get(p), kappa.kappa1.get(q)),
  };
}

// ==== INTRINSIC-DERIVATION-END ====

// ---- Grant comparison (validation only; this section reads the grant) ----

function unrestrictedSandwichPairs(a1Mask, a0Masks) {
  const pairs = [];
  for (let i = 0; i < a0Masks.length; i += 1) {
    for (let j = i + 1; j < a0Masks.length; j += 1) {
      if (sandwichHolds(a0Masks[i], a0Masks[j], a1Mask)) pairs.push([a0Masks[i], a0Masks[j]].sort(cmp));
    }
  }
  return pairs;
}

function containmentProfile(mask, heptNodeByMask, pentatonicById) {
  const node = heptNodeByMask.get(String(mask));
  if (!node) fail(`H_B endpoint ${mask} missing from the bipartite mesh`);
  const shared = (family) => node.subnodes
    .filter((id) => (pentatonicById[id]?.parentsUnrooted ?? []).includes(family)).length;
  const counts = Object.fromEntries(
    [...NON_Z_D_FAMILIES, ...Z_D_FAMILIES].map((family) => [family, shared(family)]),
  );
  const nonZSum = NON_Z_D_FAMILIES.reduce((sum, family) => sum + counts[family], 0);
  const zSum = Z_D_FAMILIES.reduce((sum, family) => sum + counts[family], 0);
  return { mask, counts, nonZSum, zSum, sign: nonZSum < zSum ? "Z-majority" : nonZSum > zSum ? "nonZ-majority" : "balanced" };
}

// ---------------------------------------------------------------------------

export function buildReconstruction() {
  const generation = readJson(GENERATION_PATH);
  const ledgerRows = readJson(LEDGER_PATH);
  const network = readJson(NETWORK_PATH);
  const bipartite = readJson(BIPARTITE_PATH);
  const chainAnchor = readJson(CHAIN_ANCHOR_PATH);
  const { huntFingerprint: chainFingerprint, ...chainCore } = chainAnchor;
  if (sha256(canonicalText(chainCore)) !== chainFingerprint) fail("chain anchor fingerprint self-check failed");
  if (chainAnchor.status !== "planning_evidence") fail("chain anchor status drift");

  const anchorRows = generation.projection.anchors.map((row) => ({
    id: Number(row.id), tier: row.tier, officeIndex: Number(row.officeIndex),
  }));
  const a0Rows = anchorRows.filter((row) => row.tier === "A0").sort((left, right) => cmp(left.id, right.id));
  const a1Rows = anchorRows.filter((row) => row.tier === "A1").sort((left, right) => cmp(left.id, right.id));
  if (a0Rows.length !== 7 || a1Rows.length !== 7) fail("anchor tier census drift");
  if (anchorRows.length !== 14) fail("anchor census drift");

  const idOnly = anchorRows.map((row) => ({ id: row.id, tier: row.tier }));
  const a0Masks = idOnly.filter((row) => row.tier === "A0").map((row) => row.id).sort(cmp);
  const a1Masks = idOnly.filter((row) => row.tier === "A1").map((row) => row.id).sort(cmp);
  if (a0Masks.length !== 7 || a1Masks.length !== 7) fail("mask census drift");

  // ---- intrinsic derivation ----------------------------------------------
  const p7 = deriveP7(a0Masks);
  const kappa = deriveKappa(p7);
  const degrees = p7.nodes.map((node) => node.degree).sort(cmp);
  if (canonicalText(degrees) !== canonicalText([1, 1, 2, 2, 2, 2, 2])) fail("P7 degree sequence drift");
  if (p7.edges.length !== 6 || p7.order.length !== 7) fail("P7 shape drift");
  if (p7.nodes.some((node) => node.pcSum !== pcSumOfMask(node.mask))) fail("pcSum drift");
  const pcSumChain = p7.order.map((mask) => p7.nodes.find((node) => node.mask === mask).pcSum);
  for (let i = 1; i < pcSumChain.length; i += 1) {
    if (pcSumChain[i] - pcSumChain[i - 1] !== 1) fail("pcSum chain is not the unit ladder");
  }

  const piEntries = a1Masks.map((mask) => derivePi(mask, p7));
  const internalEntries = piEntries.filter((entry) => entry.mode === "sandwich");
  const boundaryEntries = piEntries.filter((entry) => entry.mode === "twin-closure");
  if (internalEntries.length !== 5 || boundaryEntries.length !== 2) fail("pi mode census drift");

  const midpointEntries = piEntries.map((entry) => deriveMidpoints(entry, kappa));

  // ---- grant comparison (validation) --------------------------------------
  const officeById = new Map(anchorRows.map((row) => [row.id, row.officeIndex]));
  const eByChild = new Map();
  for (const edge of generation.projection.E) {
    const list = eByChild.get(Number(edge.target)) ?? [];
    list.push(Number(edge.source));
    eByChild.set(Number(edge.target), list);
  }
  if (eByChild.size !== 7) fail("E child census drift");
  for (const entry of piEntries) {
    const grant = (eByChild.get(entry.child) ?? []).slice().sort(cmp);
    if (canonicalText(entry.constructors) !== canonicalText(grant)) {
      fail(`pi constructor mismatch against granted E at ${entry.child}`);
    }
  }

  const ledgerById = new Map(ledgerRows.map((row) => [Number(row.id), row]));
  for (const row of anchorRows) {
    const ledgerRow = ledgerById.get(row.id);
    if (!ledgerRow || ledgerRow.role !== "anchor" || ledgerRow.tier !== row.tier ||
        Number(ledgerRow.officeIndex) !== row.officeIndex) {
      fail(`ledger cross-check drift at ${row.id}`);
    }
  }
  const officeOrder = network.officeOrder.map(String);
  if (canonicalText(officeOrder) !== canonicalText(["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"])) {
    fail("canonical office order drift");
  }

  const alignment = {
    kappa0MatchesCanonical: a0Rows.filter((row) => kappa.kappa0.get(row.id) === row.officeIndex).length,
    kappa1MatchesCanonical: a0Rows.filter((row) => kappa.kappa1.get(row.id) === row.officeIndex).length,
    statement: "kappa1 reproduces all seven canonical A0 offices; kappa0 reproduces one (the reflection-fixed center). The midZ7 midpoint test is reflection-equivariant, so the match against canonical offices is the orientation-resolving comparison, not an intrinsic property of the midpoint relation.",
  };

  const midComparison = midpointEntries.map((entry) => {
    const canonical = officeById.get(entry.child);
    return {
      child: entry.child,
      constructors: piEntries.find((pi) => pi.child === entry.child).constructors,
      g0: entry.g0,
      g1: entry.g1,
      canonical,
      match0: entry.g0 === canonical,
      match1: entry.g1 === canonical,
      complementary: entry.g0 + entry.g1 === 6,
    };
  });
  const match0Count = midComparison.filter((row) => row.match0).length;
  const match1Count = midComparison.filter((row) => row.match1).length;
  const outcome = match0Count === 7 && match1Count === 7 ? "M3"
    : match0Count === 7 || match1Count === 7 ? "M1"
      : "M2";
  if (!["M1", "M2", "M3"].includes(outcome)) fail("three-branch outcome outside the pre-registered set");
  if (midComparison.some((row) => !row.complementary)) fail("midpoint complementarity drift");

  const reflectionPairs = [];
  for (let a = 0; a < 7; a += 1) {
    for (let b = 0; b < 7; b += 1) {
      if (Number(midZ7(BigInt(6 - a), BigInt(6 - b))) !== (6 - Number(midZ7(BigInt(a), BigInt(b))) % 7) % 7) {
        reflectionPairs.push([a, b]);
      }
    }
  }
  if (reflectionPairs.length !== 0) fail("reflection equivariance failure");

  // ---- orientation --------------------------------------------------------
  const [lowEndpoint, highEndpoint] = p7.endpoints;
  const pcSumByMask = new Map(p7.nodes.map((node) => [node.mask, node.pcSum]));
  const maxPcSumEndpoint = pcSumByMask.get(highEndpoint) >= pcSumByMask.get(lowEndpoint) ? highEndpoint : lowEndpoint;
  const minPcSumEndpoint = maxPcSumEndpoint === highEndpoint ? lowEndpoint : highEndpoint;
  const hAOrientation = kappa.kappa1.get(maxPcSumEndpoint) === 0 ? "kappa1" : "kappa0";
  if (kappa.kappa1.get(maxPcSumEndpoint) !== 0) fail("H_A orientation is not kappa1");

  const heptNodeByMask = new Map(Object.values(bipartite.heptatonicNodes).map((node) => [String(node.pitchMask), node]));
  if (heptNodeByMask.size !== 462) fail("bipartite heptatonic census drift");
  const pentatonicById = bipartite.pentatonicSubnodes;
  const hBProfiles = p7.endpoints.map((mask) => containmentProfile(mask, heptNodeByMask, pentatonicById));
  const hBDistinguishable = canonicalText(hBProfiles[0].counts) !== canonicalText(hBProfiles[1].counts);

  // ---- synthesis -----------------------------------------------------------
  const synthesis = {
    requirement: "BL-059 section 3 requirement 2: a rule generating the seven offices (or recovering o(h)) from non-office data",
    preRegisteredVerdicts: ["FORMALLY_DISCHARGED", "CONSTRAINED_TO_REFLECTION", "FAILED"],
    verdict: "CONSTRAINED_TO_REFLECTION",
    verdictStatement: `The office structure is intrinsically recoverable from mask geometry up to the Lydian/Locrian reflection. The seven A0 offices are the positions of the 7-35 modes on the Hamming-2 line graph (P7), derived from pitch masks alone; the seven A1 offices are the frozen midZ7 midpoints of their constructors' line positions. The global reversal (which terminal is office 0) is not derivable from mask geometry by the midpoint relation: midZ7 is reflection-equivariant (midZ7(6-a,6-b) = (6 - midZ7(a,b)) % 7, verified on all 49 label pairs), so the midpoint law holds identically in both orientations and is reflection-blind; no other mask-only orientation signal was found (the two terminals' D-tier containment profiles are identical). The reversal requires exactly one bit, supplied either by the interpretive brightness premise (max-pcSum endpoint = office 0; framework 7-35 mode-order convention carried as interpretation vocabulary) or by one comparison against the granted office fields (outcome M1: kappa1 matches 7/7, kappa0 1/7). Both routes agree on kappa1.`,
    recovery: {
      rule: "office(A0 anchor) = position on P7 (kappa1); office(A1 anchor) = midZ7 of constructors' positions",
      a0Recovered: a0Rows.map((row) => ({ id: row.id, kappa1: kappa.kappa1.get(row.id), canonical: row.officeIndex,
        matches: kappa.kappa1.get(row.id) === row.officeIndex })),
      a1Recovered: midComparison.map((row) => ({ id: row.child, g1: row.g1, canonical: row.canonical, matches: row.match1 })),
      upToReflectionStatement: "without the orientation bit the office of each A0 anchor is determined as the unordered pair {k, 6-k}; only the center (office 3) is reflection-fixed; one bit (which terminal is 0) determines all seven values.",
    },
    residualDependency: {
      bits: 1,
      namedAlternatives: [
        "interpretive: the max-pcSum (brightest) terminal is office 0 (Lydian/Sun end); framework 7-35 canonical mode order, interpretation vocabulary, never design input",
        "grant comparison: the canonical-alignment bit (M1 unique match, kappa1 7/7)",
      ],
      alternativesAgree: true,
    },
    limits: [
      "constrained-to-reflection: the reversal bit is named, not smuggled; the coordinate scaffold kappa0 is claim-free (BFS from the numerically smaller terminal)",
      "the equivalence proof covers the frozen midZ7 form; other mask-only orientation statistics were not exhausted (H_B records one null probe: endpoints are containment twins)",
      "this sprint derives coordinates, not edges: the CONSTRUCTS cycle ground (requirement 4), the 28-edge generator (requirements 1 and 3), and the dual-pole unification are the subsequent roadmap phases",
      "the higher-theorem question (can GOVERNS itself be derived?) remains open",
    ],
    dependencyChain: {
      position: "phase 1 of 4 (BL-059 un-granting roadmap); the first recovered link",
      consumes: "granted projection anchors (masks) and the frozen midZ7 form",
      provides: "kappa (office coordinates up to one named bit) for phase 2 (cycle-ground derivation)",
      necessaryNotSufficient: "recovering offices does not derive the CONSTRUCTS edges; each phase is necessary-not-sufficient and the chain is only as strong as its first recovered link",
    },
  };
  if (outcome !== "M1") fail(`three-branch outcome ${outcome} outside the pre-registered expectation`);

  // ---- core assembly -------------------------------------------------------
  const core = {
    schemaVersion: SCHEMA_VERSION,
    reconstructionId: RECONSTRUCTION_ID,
    status: "planning_evidence",
    generator: "scripts/build-bl063-office-reconstruction.mjs",
    sourceBindings: [
      { artifact: GENERATION_PATH, sha256: fileSha(GENERATION_PATH), role: "granted projection (A0/A1 anchors, E construct edges; grant-comparison only)" },
      { artifact: LEDGER_PATH, sha256: fileSha(LEDGER_PATH), role: "canonical ledger cross-check (anchors: role, tier, forte, office fields)" },
      { artifact: NETWORK_PATH, sha256: fileSha(NETWORK_PATH), role: "canonical office order (Sun..Saturn)" },
      { artifact: BIPARTITE_PATH, sha256: fileSha(BIPARTITE_PATH), role: "H_B D-tier containment profiles of the terminals" },
      { artifact: CHAIN_ANCHOR_PATH, sha256: fileSha(CHAIN_ANCHOR_PATH), role: "prior-landing chain anchor (BL-060 hunt fingerprint)" },
    ],
    base: {
      artifact: CHAIN_ANCHOR_PATH,
      huntFingerprint: chainAnchor.huntFingerprint,
      projectionArtifact: GENERATION_PATH,
      importPolicy: "the granted projection is read for masks, the E construct edges and the canonical office fields, each confined to its own section: the intrinsic region derives coordinates from masks alone (validator-checked); the grant is read only in the comparison sections",
    },
    p7: {
      nodes: p7.nodes.map((node) => ({ mask: String(node.mask), pcSum: node.pcSum, degree: node.degree })),
      edges: p7.edges.map(([a, b]) => [String(a), String(b)]),
      endpoints: p7.endpoints.map(String),
      bfsOrder: p7.order.map(String),
      pcSumChain,
      statement: "the seven A0 anchor masks carry a Hamming-2 adjacency graph isomorphic to the path P7 (degree sequence 1,2,2,2,2,2,1; six edges; connected); the pcSum ladder is the unit ladder 33..39 along the line, monotone by position - the modes' brightness order is intrinsic",
    },
    kappaBoth: {
      kappa0: p7.order.map((mask, index) => ({ mask: String(mask), index })),
      kappa1: p7.order.map((mask, index) => ({ mask: String(mask), index: 6 - index })),
      derivation: "kappa0 = BFS position from the numerically smaller terminal (claim-free scaffold); kappa1 = 6 - kappa0",
      alignment,
    },
    piTable: {
      perAnchor: piEntries.map((entry) => {
        const unrestricted = unrestrictedSandwichPairs(entry.child, a0Masks);
        return {
          child: String(entry.child),
          mode: entry.mode,
          hamming2Neighbors: entry.neighbors.map(String),
          constructors: entry.constructors.map(String),
          sandwichOnConstructors: entry.sandwichOnConstructors,
          twin: entry.twin === null ? null : String(entry.twin),
          unrestrictedSandwichCount: unrestricted.length,
          unrestrictedSandwichPairs: entry.mode === "twin-closure" ? unrestricted.map(([a, b]) => [String(a), String(b)]) : null,
        };
      }),
      internalCount: internalEntries.length,
      boundaryCount: boundaryEntries.length,
      statement: "internal anchors (offices 1..5): exactly two Hamming-2 A0 neighbors form the unique Hamming-2-adjacent pair on which the containment sandwich holds - that pair is the constructor pair. Boundary anchors (offices 0 and 6): exactly one Hamming-2 neighbor; construction is T+/-1 twin-closure (unique rotation partner), and the sandwich does not hold on the constructor pair. The unrestricted sandwich scan (all 21 A0 pairs) is non-unique by itself; the Hamming-2 adjacency restriction is the identifying condition - recorded as a bounded observation.",
    },
    midComparison: {
      definition: {
        expression: "midZ7(a,b) = (4*(a+b)) % 7",
        source: "scripts/d4-derivation-engine.mjs (frozen T-C midpoint definition)",
        inverseOfTwo: "2 * 4 = 8 = 1 (mod 7)",
      },
      perAnchor: midComparison.map((row) => ({ ...row, child: String(row.child), constructors: row.constructors.map(String) })),
      match0Count,
      match1Count,
      outcome,
      outcomeStatement: "M1: exactly one orientation (kappa1) matches all seven canonical offices; kappa0 matches only the reflection-fixed center (office 3). Under the pre-registered protocol this validates the midpoint reconstruction and resolves the orientation against the canonical grant; no fourth outcome occurred.",
    },
    reflection: {
      formula: "midZ7(6-a, 6-b) == (6 - midZ7(a,b)) % 7",
      verifiedPairs: 49,
      holds: true,
      statement: "the frozen midpoint form is reflection-equivariant: it holds identically in both orientations of kappa (g0 = 6 - g1 on every anchor), so the midpoint relation alone is reflection-blind and cannot resolve the Lydian/Locrian reversal; the resolution is the canonical comparison (M1) or the interpretive premise (H_A)",
    },
    orientation: {
      preRegistration: "O-0 scaffold claim-free; O-A content premise (conditional); O-B existence-only; decision rule: orientation claimed resolved only if H_A coincides with the uniquely-matching orientation",
      hA: {
        criterion: "mask-bit pcSum; the max-pcSum terminal is proposed as index 0",
        maxPcSum: { mask: String(maxPcSumEndpoint), pcSum: pcSumByMask.get(maxPcSumEndpoint) },
        minPcSum: { mask: String(minPcSumEndpoint), pcSum: pcSumByMask.get(minPcSumEndpoint) },
        orientation: hAOrientation,
        coincidesWithUniqueMatch: hAOrientation === "kappa1",
        premise: "the brightness end (Lydian/Sun) is office 0 - framework 7-35 canonical mode order, carried as interpretation vocabulary; the single interpretive bit",
        verdict: "premise corroborated by the unique canonical match (M1); conditional, stated - not derived",
      },
      hB: {
        criterion: "D-tier containment profile over the bipartite mesh (BL-060/062 functions)",
        profiles: hBProfiles.map((profile) => ({ mask: String(profile.mask), counts: profile.counts, nonZSum: profile.nonZSum,
          zSum: profile.zSum, sign: profile.sign })),
        distinguishable: hBDistinguishable,
        note: "the terminals are containment twins (identical profiles); no asymmetry is available for orientation - the structural test returns existence-only null",
      },
      decision: "the unique canonical match (M1, kappa1) and the H_A orientation (kappa1) coincide; the coincidence corroborates the interpretive premise but does not remove it: the reversal bit is supplied by the premise or by one grant comparison, recorded as the residual dependency",
    },
    synthesis,
    fences: {
      governsVerdicts: "none: no GOVERNS derivation is claimed; D4 derivable-via-R2 and D7 hypothesis-tier unchanged",
      recordAmendment: "none: this is a sandbox planning artifact",
      requirementScope: "requirement 2 only (office recovery); no cycle ground, no 28-edge generator, no dual-pole unification",
      higherTheorem: "not answered: the scoping memo's question remains open; this sprint is the first recovered link of the un-granting roadmap",
      d7Control: "fenced: D7 remains hypothesis-tier; no D7 computation",
      g1Intra330: "untouched",
      direction: "unassigned (BL-035 carried)",
      membrane: "frame 2.6/2.7 and the brightness premise are interpretation vocabulary, never design input",
      canonical: "no canonical/Court/schema/Neo4j writes; the projection and ledgers are read-only",
      packaging: "landing-time packaging (manifest, backlog registration) is a separate step",
      sessionProse: "context, not evidence",
    },
    contractCitations: [
      "scrum/plan/bl-059-governs-derivability-scoping-memo.md (higher-theorem question; section 3 requirement 2; section 6.4 midpoint reconstruction)",
      "provenance/DECISION_LEDGER.md:2665-2810 (ENTRY 15; midpoint invariant G5 scope)",
      "scrum/plan/bl-056-d4-r2-route-memo.md (midZ7 frozen definition; midpoint-office invariant)",
      "scrum/plan/bl-059-d4-derivation-statement.md (T-C midpoint scope: 2 observation-exact, 5 predictions)",
      "qa/d4-production-generation.json (granted projection: anchors, E, office fields)",
      "scrum/plan/harmonic-comprehension-map.md:138-526 (frame sections 2.6-2.7: interpretation vocabulary only)",
    ],
    notAccomplished: [
      "no GOVERNS derivation; requirement 2 only, and only up to the named reflection bit",
      "no cycle-ground derivation (roadmap phase 2 not attempted)",
      "no 28-edge generator theorem (roadmap phase 3 not attempted)",
      "no dual-pole membrane unification (roadmap phase 4 not attempted)",
      "no claim event, no record amendment, no admission, no verdicts",
      "no D7 computation; no G1 movement; no canonical/Court/schema/Neo4j writes",
    ],
  };
  const reconstructionFingerprint = sha256(canonicalText(core));
  return { ...core, reconstructionFingerprint };
}

export function serializeReconstruction(reconstruction) {
  return `${canonicalText(reconstruction)}\n`;
}

function main() {
  const check = process.argv.includes("--check");
  const reconstruction = buildReconstruction();
  const serialized = serializeReconstruction(reconstruction);
  const outputPath = path.join(root, OUTPUT_PATH);
  const summary = {
    output: OUTPUT_PATH,
    check,
    chainFingerprint: reconstruction.base.huntFingerprint,
    p7Endpoints: reconstruction.p7.endpoints,
    kappaAlignment: reconstruction.kappaBoth.alignment.statement.slice(0, 60),
    piModes: { internal: reconstruction.piTable.internalCount, boundary: reconstruction.piTable.boundaryCount },
    midpointOutcome: reconstruction.midComparison.outcome,
    orientation: reconstruction.orientation.hA.orientation,
    verdict: reconstruction.synthesis.verdict,
    reconstructionFingerprint: reconstruction.reconstructionFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_BL063_OFFICE_RECONSTRUCTION");
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
