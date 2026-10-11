#!/usr/bin/env node
/**
 * Validate the generated BL-063 intrinsic office reconstruction against its
 * sources.
 *
 * Independent of the builder: re-reads the granted projection, the canonical
 * ledger, the network office order, the bipartite mesh and the chain anchor;
 * re-derives the P7 line graph, both kappa orientations, the constructor
 * identification (sandwich / twin-closure), the midZ7 comparison under both
 * orientations, the reflection-equivariance census, the orientation probes and
 * the synthesis counters; re-checks the reconstruction fingerprint. Also
 * statically verifies that the generator's intrinsic region reads no grant
 * fields, and runs five in-memory mutation probes (flipped endpoint,
 * scrambled constructor pair, inverted orientation, smuggled officeIndex
 * read, corrupted midpoint constant). Fail-loud.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/bl063-office-reconstruction.v1.json";
const GENERATOR_PATH = "scripts/build-bl063-office-reconstruction.mjs";
const SCHEMA_VERSION = "harmonic-orrery.bl063-office-reconstruction.v1";
const RECONSTRUCTION_ID = "BL063_OFFICE_RECONSTRUCTION_v1";
const GENERATION_PATH = "qa/d4-production-generation.json";
const LEDGER_PATH = "canonical/universal-heptatonic-ledger.json";
const NETWORK_PATH = "canonical/universal-network-data.json";
const BIPARTITE_PATH = "derived/hypergraph/bipartite-inclusion-v1.json";
const CHAIN_ANCHOR_PATH = "orrery/src/generated/d4-14v14-hunt.v1.json";
const CHAIN_ANCHOR_FINGERPRINT = "8a1295ca9639fab7e16b980576954a1f12824d839e6743abebe176e3df23cac9";
const NON_Z_D_FAMILIES = ["7-1", "7-15", "7-22", "7-8"];
const Z_D_FAMILIES = ["7-Z12", "7-Z17", "7-Z37"];

function fail(message) {
  throw new Error(`INVALID_BL063_OFFICE_RECONSTRUCTION: ${message}`);
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

function pcSumOfMask(mask) {
  let sum = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) if (mask & (1 << pitch)) sum += pitch;
  return sum;
}

function midZ7n(a, b) {
  return (4 * (a + b)) % 7;
}

function sandwichHolds(p, q, child) {
  const inter = p & q;
  const union = p | q;
  return ((inter & child) === inter) && ((child & union) === child);
}

function staticIntrinsicCheck(sourceText) {
  const begin = sourceText.indexOf("INTRINSIC-DERIVATION-BEGIN");
  const end = sourceText.indexOf("INTRINSIC-DERIVATION-END");
  if (begin < 0 || end < 0 || end <= begin) fail("generator intrinsic-region markers missing");
  const head = sourceText.slice(0, end);
  const region = sourceText.slice(begin, end);
  for (const pattern of [/officeIndex/, /\.office\b/, /parentOffice/, /projection\.E\b/, /generation\.projection/]) {
    if (pattern.test(region)) fail(`generator intrinsic region reads the grant: ${pattern}`);
    if (pattern.test(head)) fail(`grant token before the intrinsic-region end: ${pattern}`);
  }
}

function deriveP7(a0Masks) {
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
  const order = [];
  const visited = new Set([endpoints[0]]);
  const queue = [endpoints[0]];
  while (queue.length > 0) {
    const current = queue.shift();
    order.push(current);
    for (const next of adjacency.get(current)) {
      if (!visited.has(next)) { visited.add(next); queue.push(next); }
    }
  }
  return { nodes: nodes.sort((left, right) => cmp(left.mask, right.mask)), edges, endpoints, order };
}

function derivePi(a1Mask, a0Masks) {
  const neighbors = a0Masks.filter((mask) => hamming12(mask, a1Mask) === 2).sort(cmp);
  if (neighbors.length === 2) {
    const [p, q] = neighbors;
    if (!sandwichHolds(p, q, a1Mask)) fail(`independent sandwich failure at ${a1Mask}`);
    return { child: a1Mask, mode: "sandwich", neighbors, constructors: [p, q].sort(cmp), twin: null,
      sandwichOnConstructors: true };
  }
  if (neighbors.length === 1) {
    const pStar = neighbors[0];
    const twins = a0Masks.filter((q) => q !== pStar && (
      rotateMask12(pStar, 1) === q || rotateMask12(pStar, 11) === q ||
      rotateMask12(q, 1) === pStar || rotateMask12(q, 11) === pStar)).sort(cmp);
    if (twins.length !== 1) fail(`independent twin-closure failure at ${a1Mask}`);
    const [twin] = twins;
    return { child: a1Mask, mode: "twin-closure", neighbors, constructors: [pStar, twin].sort(cmp), twin,
      sandwichOnConstructors: sandwichHolds(pStar, twin, a1Mask) };
  }
  fail(`independent neighbor count ${neighbors.length} at ${a1Mask}`);
}

function containmentProfile(mask, heptNodeByMask, pentatonicById) {
  const node = heptNodeByMask.get(String(mask));
  if (!node) fail(`independent H_B node missing for ${mask}`);
  const shared = (family) => node.subnodes
    .filter((id) => (pentatonicById[id]?.parentsUnrooted ?? []).includes(family)).length;
  const counts = Object.fromEntries(
    [...NON_Z_D_FAMILIES, ...Z_D_FAMILIES].map((family) => [family, shared(family)]),
  );
  const nonZSum = NON_Z_D_FAMILIES.reduce((sum, family) => sum + counts[family], 0);
  const zSum = Z_D_FAMILIES.reduce((sum, family) => sum + counts[family], 0);
  return { mask, counts, nonZSum, zSum, sign: nonZSum < zSum ? "Z-majority" : nonZSum > zSum ? "nonZ-majority" : "balanced" };
}

function reDerive(sources) {
  const { generation, ledgerRows, network, bipartite, chainAnchor } = sources;
  const anchorRows = generation.projection.anchors.map((row) => ({
    id: Number(row.id), tier: row.tier, officeIndex: Number(row.officeIndex),
  }));
  const a0Rows = anchorRows.filter((row) => row.tier === "A0").sort((left, right) => cmp(left.id, right.id));
  const a1Rows = anchorRows.filter((row) => row.tier === "A1").sort((left, right) => cmp(left.id, right.id));
  const a0Masks = a0Rows.map((row) => row.id).sort(cmp);
  const a1Masks = a1Rows.map((row) => row.id).sort(cmp);
  const p7 = deriveP7(a0Masks);
  const kappa0 = new Map(p7.order.map((mask, index) => [mask, index]));
  const kappa1 = new Map(p7.order.map((mask, index) => [mask, 6 - index]));
  const pi = a1Masks.map((mask) => derivePi(mask, a0Masks));
  const mid = pi.map((entry) => {
    const [p, q] = entry.constructors;
    return { child: entry.child, constructors: entry.constructors,
      g0: midZ7n(kappa0.get(p), kappa0.get(q)), g1: midZ7n(kappa1.get(p), kappa1.get(q)) };
  });
  const heptNodeByMask = new Map(Object.values(bipartite.heptatonicNodes).map((node) => [String(node.pitchMask), node]));
  const pentatonicById = bipartite.pentatonicSubnodes;
  return { anchorRows, a0Rows, a1Rows, a0Masks, a1Masks, p7, kappa0, kappa1, pi, mid,
    heptNodeByMask, pentatonicById, chainAnchor, ledgerRows, network, generation };
}

function checkAgainstSources(artifact, derived, sources) {
  // ---- header and fingerprint ---------------------------------------------
  if (artifact.schemaVersion !== SCHEMA_VERSION || artifact.reconstructionId !== RECONSTRUCTION_ID ||
      artifact.status !== "planning_evidence" || artifact.generator !== GENERATOR_PATH) {
    fail("header drift");
  }
  const { reconstructionFingerprint, ...core } = artifact;
  if (typeof reconstructionFingerprint !== "string" || !/^[0-9a-f]{64}$/.test(reconstructionFingerprint)) {
    fail("fingerprint format drift");
  }
  if (sha256(canonicalText(core)) !== reconstructionFingerprint) fail("reconstruction fingerprint drift");

  // ---- source bindings -----------------------------------------------------
  const expectedBindings = [
    [GENERATION_PATH, "granted projection"],
    [LEDGER_PATH, "ledger cross-check"],
    [NETWORK_PATH, "office order"],
    [BIPARTITE_PATH, "H_B containment"],
    [CHAIN_ANCHOR_PATH, "chain anchor"],
  ];
  if (artifact.sourceBindings.length !== expectedBindings.length) fail("source binding census drift");
  for (const [index, [bindingPath]] of expectedBindings.entries()) {
    const binding = artifact.sourceBindings[index];
    if (binding.artifact !== bindingPath || binding.sha256 !== fileSha(bindingPath)) {
      fail(`source binding drift at ${bindingPath}`);
    }
  }
  if (artifact.base.artifact !== CHAIN_ANCHOR_PATH ||
      artifact.base.huntFingerprint !== CHAIN_ANCHOR_FINGERPRINT ||
      derived.chainAnchor.huntFingerprint !== CHAIN_ANCHOR_FINGERPRINT ||
      derived.chainAnchor.status !== "planning_evidence") fail("chain anchor drift");
  if (artifact.base.projectionArtifact !== GENERATION_PATH) fail("projection artifact binding drift");

  // ---- P7 ------------------------------------------------------------------
  const { p7 } = derived;
  const degrees = p7.nodes.map((node) => node.degree).sort(cmp);
  if (canonicalText(degrees) !== canonicalText([1, 1, 2, 2, 2, 2, 2]) || p7.edges.length !== 6 || p7.order.length !== 7) {
    fail("P7 shape drift (independent)");
  }
  if (canonicalText(artifact.p7.nodes) !== canonicalText(p7.nodes.map((node) => ({
    mask: String(node.mask), pcSum: node.pcSum, degree: node.degree })))) fail("P7 node table drift");
  if (canonicalText(artifact.p7.edges) !== canonicalText(p7.edges.map(([a, b]) => [String(a), String(b)]))) {
    fail("P7 edge table drift");
  }
  if (canonicalText(artifact.p7.endpoints) !== canonicalText(p7.endpoints.map(String))) fail("P7 endpoints drift");
  if (canonicalText(artifact.p7.bfsOrder) !== canonicalText(p7.order.map(String))) fail("P7 BFS order drift");
  const pcSumChain = p7.order.map((mask) => p7.nodes.find((node) => node.mask === mask).pcSum);
  if (canonicalText(artifact.p7.pcSumChain) !== canonicalText(pcSumChain)) fail("pcSum chain drift");
  for (let i = 1; i < pcSumChain.length; i += 1) if (pcSumChain[i] - pcSumChain[i - 1] !== 1) fail("pcSum ladder drift");

  // ---- kappa ---------------------------------------------------------------
  const { kappa0, kappa1 } = derived;
  if (canonicalText(artifact.kappaBoth.kappa0) !== canonicalText(p7.order.map((mask, index) => ({
    mask: String(mask), index })))) fail("kappa0 drift");
  if (canonicalText(artifact.kappaBoth.kappa1) !== canonicalText(p7.order.map((mask, index) => ({
    mask: String(mask), index: 6 - index })))) fail("kappa1 drift");
  const expectedAlignment = {
    kappa0MatchesCanonical: derived.a0Rows.filter((row) => kappa0.get(row.id) === row.officeIndex).length,
    kappa1MatchesCanonical: derived.a0Rows.filter((row) => kappa1.get(row.id) === row.officeIndex).length,
  };
  if (artifact.kappaBoth.alignment.kappa0MatchesCanonical !== expectedAlignment.kappa0MatchesCanonical ||
      artifact.kappaBoth.alignment.kappa1MatchesCanonical !== expectedAlignment.kappa1MatchesCanonical) {
    fail("kappa alignment drift");
  }
  if (expectedAlignment.kappa0MatchesCanonical !== 1 || expectedAlignment.kappa1MatchesCanonical !== 7) {
    fail("kappa alignment census drift (expect 1 and 7)");
  }

  // ---- pi table ------------------------------------------------------------
  const eByChild = new Map();
  for (const edge of sources.generation.projection.E) {
    const list = eByChild.get(Number(edge.target)) ?? [];
    list.push(Number(edge.source));
    eByChild.set(Number(edge.target), list);
  }
  const expectedPi = derived.pi.map((entry) => {
    const unrestricted = [];
    for (let i = 0; i < derived.a0Masks.length; i += 1) {
      for (let j = i + 1; j < derived.a0Masks.length; j += 1) {
        if (sandwichHolds(derived.a0Masks[i], derived.a0Masks[j], entry.child)) {
          unrestricted.push([derived.a0Masks[i], derived.a0Masks[j]].sort(cmp));
        }
      }
    }
    return {
      child: String(entry.child), mode: entry.mode,
      hamming2Neighbors: entry.neighbors.map(String), constructors: entry.constructors.map(String),
      sandwichOnConstructors: entry.sandwichOnConstructors,
      twin: entry.twin === null ? null : String(entry.twin),
      unrestrictedSandwichCount: unrestricted.length,
      unrestrictedSandwichPairs: entry.mode === "twin-closure"
        ? unrestricted.map(([a, b]) => [String(a), String(b)]) : null,
    };
  });
  if (canonicalText(artifact.piTable.perAnchor) !== canonicalText(expectedPi)) fail("pi table drift");
  if (artifact.piTable.internalCount !== 5 || artifact.piTable.boundaryCount !== 2) fail("pi mode census drift");
  for (const entry of derived.pi) {
    const grant = (eByChild.get(entry.child) ?? []).slice().sort(cmp);
    if (canonicalText(entry.constructors) !== canonicalText(grant)) fail(`pi/constructor-grant disagreement at ${entry.child}`);
    if (entry.mode === "twin-closure" && entry.sandwichOnConstructors) fail(`boundary sandwich unexpectedly holds at ${entry.child}`);
    if (entry.mode === "sandwich" && !entry.sandwichOnConstructors) fail(`internal sandwich failure at ${entry.child}`);
  }

  // ---- midZ7 comparison ----------------------------------------------------
  const expectedMid = derived.mid.map((row) => {
    const canonical = derived.anchorRows.find((anchor) => anchor.id === row.child).officeIndex;
    return { child: String(row.child), constructors: row.constructors.map(String),
      g0: row.g0, g1: row.g1, canonical,
      match0: row.g0 === canonical, match1: row.g1 === canonical,
      complementary: row.g0 + row.g1 === 6 };
  });
  if (canonicalText(artifact.midComparison.perAnchor) !== canonicalText(expectedMid)) fail("midZ7 comparison drift");
  const match0Count = expectedMid.filter((row) => row.match0).length;
  const match1Count = expectedMid.filter((row) => row.match1).length;
  if (artifact.midComparison.match0Count !== match0Count || artifact.midComparison.match1Count !== match1Count) {
    fail("midZ7 match-count drift");
  }
  if (match0Count !== 1 || match1Count !== 7) fail("midZ7 match census drift (expect 1 and 7)");
  if (artifact.midComparison.outcome !== "M1") fail("three-branch outcome drift");
  if (artifact.midComparison.definition.expression !== "midZ7(a,b) = (4*(a+b)) % 7") fail("midpoint definition drift");
  if ((2 * 4) % 7 !== 1) fail("internal arithmetic failure");

  // ---- reflection ----------------------------------------------------------
  for (let a = 0; a < 7; a += 1) {
    for (let b = 0; b < 7; b += 1) {
      if (midZ7n(6 - a, 6 - b) !== (6 - midZ7n(a, b) % 7) % 7) fail(`equivariance failure at (${a},${b})`);
    }
  }
  if (artifact.reflection.verifiedPairs !== 49 || artifact.reflection.holds !== true ||
      artifact.reflection.formula !== "midZ7(6-a, 6-b) == (6 - midZ7(a,b)) % 7") fail("reflection block drift");

  // ---- orientation ---------------------------------------------------------
  const pcSumByMask = new Map(p7.nodes.map((node) => [node.mask, node.pcSum]));
  const [lowEndpoint, highEndpoint] = p7.endpoints;
  const maxEndpoint = pcSumByMask.get(highEndpoint) >= pcSumByMask.get(lowEndpoint) ? highEndpoint : lowEndpoint;
  const minEndpoint = maxEndpoint === highEndpoint ? lowEndpoint : highEndpoint;
  const hA = artifact.orientation.hA;
  if (hA.maxPcSum.mask !== String(maxEndpoint) || hA.maxPcSum.pcSum !== pcSumByMask.get(maxEndpoint) ||
      hA.minPcSum.mask !== String(minEndpoint) || hA.minPcSum.pcSum !== pcSumByMask.get(minEndpoint)) {
    fail("H_A endpoint profile drift");
  }
  const hAOrientation = kappa1.get(maxEndpoint) === 0 ? "kappa1" : "kappa0";
  if (hA.orientation !== hAOrientation || hA.coincidesWithUniqueMatch !== (hAOrientation === "kappa1") ||
      hA.coincidesWithUniqueMatch !== true) fail("H_A orientation drift");
  const hBProfiles = p7.endpoints.map((mask) => containmentProfile(mask, derived.heptNodeByMask, derived.pentatonicById));
  if (canonicalText(artifact.orientation.hB.profiles) !== canonicalText(hBProfiles.map((profile) => ({
    mask: String(profile.mask), counts: profile.counts, nonZSum: profile.nonZSum, zSum: profile.zSum, sign: profile.sign })))) {
    fail("H_B profile drift");
  }
  const hBDistinguishable = canonicalText(hBProfiles[0].counts) !== canonicalText(hBProfiles[1].counts);
  if (artifact.orientation.hB.distinguishable !== hBDistinguishable || hBDistinguishable !== false) {
    fail("H_B distinguishability drift (expect the terminals to be containment twins)");
  }

  // ---- synthesis -----------------------------------------------------------
  const synthesis = artifact.synthesis;
  if (synthesis.verdict !== "CONSTRAINED_TO_REFLECTION") fail("synthesis verdict drift");
  if (canonicalText(synthesis.preRegisteredVerdicts) !== canonicalText([
    "FORMALLY_DISCHARGED", "CONSTRAINED_TO_REFLECTION", "FAILED"])) fail("pre-registered verdict list drift");
  if (!synthesis.requirement.includes("requirement 2") || !synthesis.verdictStatement.includes("reflection-equivariant") ||
      !synthesis.verdictStatement.includes("Lydian/Locrian")) fail("verdict statement drift");
  if (synthesis.recovery.a0Recovered.length !== 7 || !synthesis.recovery.a0Recovered.every((row) => row.matches) ||
      synthesis.recovery.a1Recovered.length !== 7 || !synthesis.recovery.a1Recovered.every((row) => row.matches)) {
    fail("recovery table drift");
  }
  if (synthesis.residualDependency.bits !== 1 || synthesis.residualDependency.namedAlternatives.length !== 2 ||
      synthesis.residualDependency.alternativesAgree !== true) fail("residual dependency drift");
  if (!synthesis.dependencyChain.position.includes("phase 1 of 4") ||
      !synthesis.dependencyChain.necessaryNotSufficient.includes("necessary-not-sufficient")) {
    fail("dependency chain drift");
  }
  if (synthesis.limits.length !== 4) fail("synthesis limits drift");

  // ---- fences --------------------------------------------------------------
  if (!artifact.fences.higherTheorem.includes("remains open") || artifact.fences.g1Intra330 !== "untouched" ||
      !artifact.fences.direction.includes("unassigned") || !artifact.fences.membrane.includes("never design input") ||
      artifact.fences.canonical.includes("read-only") === false) fail("fence drift");
  if (artifact.contractCitations.filter((citation) => citation.includes("ENTRY 15")).length !== 1 ||
      artifact.contractCitations.filter((citation) => /bl-059/i.test(citation)).length !== 2) {
    fail("contract citation drift");
  }
  if (artifact.notAccomplished.length !== 6) fail("notAccomplished inventory drift");
}

function validate() {
  const artifact = readJson(ARTIFACT_PATH);
  const sources = {
    generation: readJson(GENERATION_PATH),
    ledgerRows: readJson(LEDGER_PATH),
    network: readJson(NETWORK_PATH),
    bipartite: readJson(BIPARTITE_PATH),
    chainAnchor: readJson(CHAIN_ANCHOR_PATH),
  };
  const derived = reDerive(sources);
  checkAgainstSources(artifact, derived, sources);

  // ---- static grant-isolation check ----------------------------------------
  const generatorSource = read(GENERATOR_PATH);
  staticIntrinsicCheck(generatorSource);

  // ---- mutation probes (in-memory only) ------------------------------------
  const repin = (candidate) => {
    const { reconstructionFingerprint, ...probeCore } = candidate;
    void reconstructionFingerprint;
    return { ...probeCore, reconstructionFingerprint: sha256(canonicalText(probeCore)) };
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
  const flippedEndpoint = clone(artifact);
  flippedEndpoint.p7.endpoints[1] = "2741";
  expectRejection("flipped P7 endpoint", flippedEndpoint);
  const scrambledPair = clone(artifact);
  scrambledPair.piTable.perAnchor[0].constructors = ["1387", "2773"];
  expectRejection("scrambled constructor pair", scrambledPair);
  const invertedOrientation = clone(artifact);
  invertedOrientation.kappaBoth.kappa1 = invertedOrientation.kappaBoth.kappa1
    .map((entry) => ({ mask: entry.mask, index: 6 - entry.index }));
  expectRejection("inverted orientation", invertedOrientation);
  const corruptedConstant = clone(artifact);
  corruptedConstant.midComparison.definition.expression = "midZ7(a,b) = (3*(a+b)) % 7";
  expectRejection("corrupted midpoint constant", corruptedConstant);
  let smuggleRejected = false;
  try {
    staticIntrinsicCheck(generatorSource.replace(
      "export function deriveKappa(p7) {",
      "export function deriveKappa(p7) { const smuggled = p7.officeIndex; void smuggled;",
    ));
  } catch {
    smuggleRejected = true;
  }
  if (!smuggleRejected) fail("mutation probe not rejected: smuggled officeIndex read");

  console.log(JSON.stringify({
    artifact: ARTIFACT_PATH,
    status: "PASS",
    reconstructionFingerprint: artifact.reconstructionFingerprint,
    chainFingerprint: artifact.base.huntFingerprint,
    p7Endpoints: artifact.p7.endpoints,
    piModes: { internal: artifact.piTable.internalCount, boundary: artifact.piTable.boundaryCount },
    midpointOutcome: artifact.midComparison.outcome,
    matchCounts: { kappa0: artifact.midComparison.match0Count, kappa1: artifact.midComparison.match1Count },
    orientation: artifact.orientation.hA.orientation,
    verdict: artifact.synthesis.verdict,
    mutationProbes: ["flipped endpoint", "scrambled pair", "inverted orientation", "smuggled read", "corrupted constant"].length,
  }, null, 2));
}

validate();
