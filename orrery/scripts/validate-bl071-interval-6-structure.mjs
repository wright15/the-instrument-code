#!/usr/bin/env node
/**
 * Validate the generated BL-071 interval-6 structure against its sources.
 *
 * Independent of the generator: re-reads the 462-record ledger, the network,
 * the mesh, the landed D4 hunt domain, the BL-070 and BL-068 artifacts, the
 * Gate 3 receipt and the Phase A probe; re-derives the five universe censuses
 * (D7-36, D6-tier, A1-28, A0-P7, D-anchor-49) with the three distinct
 * measures, the B1 structural reach, the B2 D4-domain control, the Fisher
 * tables, the 7-27/7-31 cross geometry, the lifted-space root coherence, the
 * boundary IC6 aggregate and the near-miss cross-check; re-checks the artifact
 * fingerprint; statically verifies the generator's census-core region
 * (forbidden label/status reads absent, required masks-only reads present);
 * and runs mutation probes (artifact drift, smuggled reads, presence-strip).
 * Fail-loud.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/bl071-interval-6-structure.v1.json";
const GENERATOR_PATH = "scripts/build-bl071-interval-6-structure.mjs";
const SCHEMA_VERSION = "harmonic-orrery.bl071-interval-6-structure.v1";
const INVESTIGATION_ID = "BL071_INTERVAL_6_STRUCTURE_V1";
const LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";
const NETWORK_PATH = "canonical/universal-network-data.json";
const MESH_PATH = "derived/hypergraph/bipartite-inclusion-v1.json";
const D4_HUNT_PATH = "orrery/src/generated/d4-14v14-hunt.v1.json";
const BL070_PATH = "orrery/src/generated/bl070-d7-derivation.v1.json";
const BL068_PATH = "orrery/src/generated/bl068-d7-asymmetry.v1.json";
const GATE3_PATH = "qa/d4-r2-execution-receipt.json";
const PHASE_A_PATH = "orrery/src/generated/phase-a-probe.v1.json";

const BL070_FINGERPRINT = "9db10a088a05664a5cf60f6fad14514a4fc9aab278dcf0359d684bce70607731";
const BL068_FINGERPRINT = "b0d65bd6149978de4f5ef3f1a0b281d0f6324a81114e8aa9da07eda8ef5ef849";
const D4_HUNT_FINGERPRINT = "8a1295ca9639fab7e16b980576954a1f12824d839e6743abebe176e3df23cac9";
const PHASE_A_FINGERPRINT = "c8271c20a7aaf23c8f25fbe12d849854eb02ffbfd6fa24fb3f091b15970b87ac";

const ROLE_VOCABULARY = ["separation", "exclusion", "transition", "mixed", "none"];

function fail(message) {
  throw new Error(`INVALID_BL071_INTERVAL_6_STRUCTURE: ${message}`);
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

function parsePitchSet(text) {
  const trimmed = text.replace(/[{}]/g, "");
  if (trimmed.length === 0) return [];
  return trimmed.split(",").map((value) => Number(value));
}

const cmp = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const cmpNumericStrings = (left, right) => Number(left) - Number(right);
const sortedUnique = (values) => [...new Set(values)].sort(cmp);

function maskOfPitches(pitches) {
  let mask = 0;
  for (const pitch of pitches) mask |= 1 << pitch;
  return mask;
}

function hamming12(a, b) {
  let x = a ^ b;
  let count = 0;
  while (x !== 0) { count += 1; x &= x - 1; }
  return count;
}

function rotateMask12(mask, d) {
  const shift = ((d % 12) + 12) % 12;
  if (shift === 0) return mask & 4095;
  return (((mask << shift) & 4095) | (mask >> (12 - shift))) & 4095;
}

function pcSumOfMask(mask) {
  let sum = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) if ((mask >> pitch) & 1) sum += pitch;
  return sum;
}

function icVectorOfMask(mask) {
  const pitches = [];
  for (let pitch = 0; pitch < 12; pitch += 1) if ((mask >> pitch) & 1) pitches.push(pitch);
  const vector = [0, 0, 0, 0, 0, 0];
  for (let left = 0; left < pitches.length; left += 1) {
    for (let right = left + 1; right < pitches.length; right += 1) {
      const raw = (pitches[right] - pitches[left]) % 12;
      vector[Math.min(raw, 12 - raw) - 1] += 1;
    }
  }
  return vector;
}

function singlePitchDisplacement(aPitches, bPitches) {
  const aSet = new Set(aPitches);
  const bSet = new Set(bPitches);
  const removed = aPitches.filter((pitch) => !bSet.has(pitch));
  const added = bPitches.filter((pitch) => !aSet.has(pitch));
  if (removed.length !== 1 || added.length !== 1) fail("displacement: not a single-pitch swap");
  const raw = (added[0] - removed[0] + 12) % 12;
  return { raw, linear: raw > 6 ? raw - 12 : raw };
}

function ic6HistogramOf(states, masks) {
  const histogram = {};
  for (const state of states) {
    const value = String(icVectorOfMask(masks.get(state))[5]);
    histogram[value] = (histogram[value] ?? 0) + 1;
  }
  return histogram;
}

function censusOfInstances(instances, masks, pitches) {
  const hammingHistogram = {};
  const displacementHistogram = {};
  const rotation6Witnesses = [];
  const displacement6Witnesses = [];
  let hamming2Count = 0;
  const memberStates = new Set();
  const ordered = instances.slice().sort((left, right) => cmpNumericStrings(left.a, right.a) || cmpNumericStrings(left.b, right.b));
  for (const { key, a, b } of ordered) {
    memberStates.add(a);
    memberStates.add(b);
    const hamming = hamming12(masks.get(a), masks.get(b));
    hammingHistogram[String(hamming)] = (hammingHistogram[String(hamming)] ?? 0) + 1;
    if (hamming === 2) {
      hamming2Count += 1;
      const displacement = singlePitchDisplacement(pitches.get(a), pitches.get(b));
      displacementHistogram[String(displacement.linear)] = (displacementHistogram[String(displacement.linear)] ?? 0) + 1;
      if (Math.abs(displacement.linear) === 6) displacement6Witnesses.push(key);
    }
    if (rotateMask12(masks.get(a), 6) === masks.get(b)) rotation6Witnesses.push(key);
  }
  return {
    instanceCount: ordered.length,
    hamming2Count,
    nonSwapCount: ordered.length - hamming2Count,
    hammingHistogram,
    displacementHistogram,
    displacement6Count: displacement6Witnesses.length,
    rotation6Count: rotation6Witnesses.length,
    rotation6Witnesses,
    displacement6Witnesses,
    memberStates: [...memberStates].sort(cmpNumericStrings),
  };
}

function censusOfPairs(nodes, masks, pitches) {
  const sorted = nodes.slice().sort(cmpNumericStrings);
  const hammingHistogram = {};
  const displacementHistogram = {};
  const rotation6Witnesses = [];
  const displacement6Witnesses = [];
  let hamming2Count = 0;
  for (let left = 0; left < sorted.length; left += 1) {
    for (let right = left + 1; right < sorted.length; right += 1) {
      const a = sorted[left];
      const b = sorted[right];
      const key = `${a}:${b}`;
      const hamming = hamming12(masks.get(a), masks.get(b));
      hammingHistogram[String(hamming)] = (hammingHistogram[String(hamming)] ?? 0) + 1;
      if (hamming === 2) {
        hamming2Count += 1;
        const displacement = singlePitchDisplacement(pitches.get(a), pitches.get(b));
        displacementHistogram[String(displacement.linear)] = (displacementHistogram[String(displacement.linear)] ?? 0) + 1;
        if (Math.abs(displacement.linear) === 6) displacement6Witnesses.push(key);
      }
      if (rotateMask12(masks.get(a), 6) === masks.get(b)) rotation6Witnesses.push(key);
    }
  }
  return {
    pairSpaceCount: (sorted.length * (sorted.length - 1)) / 2,
    hamming2Count,
    hammingHistogram,
    displacementHistogram,
    displacement6Count: displacement6Witnesses.length,
    rotation6Count: rotation6Witnesses.length,
    rotation6Witnesses,
    displacement6Witnesses,
    memberStates: sorted,
  };
}

function fisherGreaterExact(a, b, c, d) {
  function combinations(n, k) {
    const reduced = Math.min(k, n - k);
    let result = 1n;
    for (let index = 0n; index < BigInt(reduced); index += 1n) {
      result = (result * (BigInt(n) - index)) / (index + 1n);
    }
    return result;
  }
  function gcd(left, right) {
    let x = left;
    let y = right;
    while (y !== 0n) { const next = x % y; x = y; y = next; }
    return x;
  }
  const r1 = a + b;
  const r2 = c + d;
  const successes = a + c;
  let numerator = 0n;
  for (let i = a; i <= Math.min(r1, successes); i += 1) {
    numerator += combinations(r1, i) * combinations(r2, successes - i);
  }
  const denominator = combinations(r1 + r2, successes);
  const divisor = gcd(numerator, denominator);
  return { num: numerator / divisor, den: denominator / divisor };
}

function decimalOf(rational, digits) {
  const scaled = (rational.num * 10n ** BigInt(digits)) / rational.den;
  return `0.${scaled.toString().padStart(digits, "0")}`;
}

// ---------------------------------------------------------------------------
// Independent re-derivation
// ---------------------------------------------------------------------------

function reDerive(sources) {
  const { ledgerRows, network, mesh, d4Hunt, bl070, bl068, gate3, phaseA } = sources;
  if (ledgerRows.length !== 462) fail(`ledger census ${ledgerRows.length}`);
  const masks = new Map(ledgerRows.map((row) => [String(row.id), maskOfPitches(parsePitchSet(row.pitchSet))]));
  for (const row of ledgerRows) {
    if (masks.get(String(row.id)) !== Number(row.id)) fail(`ledger mask/id disagreement at ${row.id}`);
  }
  const pitches = new Map(ledgerRows.map((row) => [String(row.id), parsePitchSet(row.pitchSet)]));
  const officeByState = new Map(ledgerRows.map((row) => [String(row.id), row.office]));
  const forteByState = new Map(ledgerRows.map((row) => [String(row.id), row.forte]));

  const membersOf = (tier, role) => ledgerRows
    .filter((row) => row.tier === tier && (role === null || row.role === role))
    .map((row) => String(row.id))
    .sort(cmpNumericStrings);
  const d7Anchors = membersOf("D7", "anchor");
  const d6Satellites = membersOf("D6", "satellite");
  const d6Anchors = membersOf("D6", "anchor");
  const a0Anchors = membersOf("A0", "anchor");
  const a1Anchors = membersOf("A1", "anchor");
  const a1Satellites = membersOf("A1", "satellite");
  const dAnchors = ["D1", "D2", "D3", "D4", "D5", "D6", "D7"].flatMap((tier) => membersOf(tier, "anchor")).sort(cmpNumericStrings);
  if (d7Anchors.length !== 7 || d6Satellites.length !== 14 || d6Anchors.length !== 7 ||
      a0Anchors.length !== 7 || a1Anchors.length !== 7 || a1Satellites.length !== 28 || dAnchors.length !== 49) {
    fail("partition census drift");
  }

  const d7Instances = [];
  for (const anchor of d7Anchors) {
    for (const satellite of d6Satellites) {
      if (hamming12(masks.get(anchor), masks.get(satellite)) === 2) {
        d7Instances.push({ key: `${anchor}:${satellite}`, a: anchor, b: satellite });
      }
    }
  }
  const d7Census = censusOfInstances(d7Instances, masks, pitches);
  if (d7Census.instanceCount !== 36 || d7Census.displacement6Count !== 12 || d7Census.rotation6Count !== 0) fail("D7-36 census drift");

  const d6Instances = [];
  for (const anchor of d6Anchors) {
    for (const satellite of d6Satellites) {
      if (anchor === satellite) continue;
      d6Instances.push({ key: `${anchor}:${satellite}`, a: anchor, b: satellite });
    }
  }
  const d6Census = censusOfInstances(d6Instances, masks, pitches);
  if (d6Census.instanceCount !== 98 || d6Census.hamming2Count !== 12 || d6Census.displacement6Count !== 0 || d6Census.rotation6Count !== 0) fail("D6-tier census drift");

  const a0Edges = [];
  for (let left = 0; left < a0Anchors.length; left += 1) {
    for (let right = left + 1; right < a0Anchors.length; right += 1) {
      const a = a0Anchors[left];
      const b = a0Anchors[right];
      const hamming = hamming12(masks.get(a), masks.get(b));
      if (hamming === 2 || rotateMask12(masks.get(a), 6) === masks.get(b)) a0Edges.push({ key: `${a}:${b}`, a, b });
    }
  }
  const a0Census = censusOfInstances(a0Edges, masks, pitches);
  if (a0Census.instanceCount !== 7 || a0Census.hamming2Count !== 6 || a0Census.displacement6Count !== 0 || a0Census.rotation6Count !== 1) fail("A0 ring census drift");
  if (canonicalText(a0Census.rotation6Witnesses) !== canonicalText(["1387:2773"])) fail("A0 ring closure witness drift");

  const u5Census = censusOfPairs(dAnchors, masks, pitches);
  if (u5Census.pairSpaceCount !== 1176 || u5Census.hamming2Count !== 69 || u5Census.displacement6Count !== 15 || u5Census.rotation6Count !== 12) fail("D-anchor census drift");

  const allIds = ledgerRows.map((row) => String(row.id)).sort(cmpNumericStrings);
  const b1DisplacementHistogram = {};
  const b1Rotation6Witnesses = [];
  let b1Hamming2 = 0;
  let b1Displacement6 = 0;
  let b1H2Rot6 = 0;
  for (let left = 0; left < allIds.length; left += 1) {
    for (let right = left + 1; right < allIds.length; right += 1) {
      const a = allIds[left];
      const b = allIds[right];
      const hamming = hamming12(masks.get(a), masks.get(b));
      const rotation6 = rotateMask12(masks.get(a), 6) === masks.get(b);
      if (hamming === 2) {
        b1Hamming2 += 1;
        const displacement = singlePitchDisplacement(pitches.get(a), pitches.get(b));
        b1DisplacementHistogram[String(displacement.linear)] = (b1DisplacementHistogram[String(displacement.linear)] ?? 0) + 1;
        if (Math.abs(displacement.linear) === 6) b1Displacement6 += 1;
        if (rotation6) b1H2Rot6 += 1;
      }
      if (rotation6) b1Rotation6Witnesses.push(`${a}:${b}`);
    }
  }
  const b1 = {
    pairSpaceCount: (allIds.length * (allIds.length - 1)) / 2,
    hamming2Count: b1Hamming2,
    displacementHistogram: b1DisplacementHistogram,
    displacement6Count: b1Displacement6,
    rotation6Count: b1Rotation6Witnesses.length,
    rotation6Witnesses: b1Rotation6Witnesses,
    hamming2AndRotation6Count: b1H2Rot6,
  };
  if (b1.pairSpaceCount !== 106491 || b1.hamming2Count !== 6930 || b1.displacement6Count !== 630 || b1.rotation6Count !== 126 || b1.hamming2AndRotation6Count !== 30) {
    fail("B1 census drift");
  }

  // D4 domain (label fields read for the comparison only)
  const a1ByOffice = new Map(network.governorRows.map((row) => [Number(row["Office order"]) - 1, String(row["A1 ID"])]));
  const d4Instances = d4Hunt.domain.uKeys.map((key) => {
    const [officeIndex, satellite] = key.split(":");
    const anchor = a1ByOffice.get(Number(officeIndex));
    if (!anchor) fail(`D4 key without mapping: ${key}`);
    return { key: `${anchor}:${satellite}`, a: anchor, b: satellite };
  });
  const a1Census = censusOfInstances(d4Instances, masks, pitches);
  if (a1Census.instanceCount !== 28 || a1Census.hamming2Count !== 24 || a1Census.displacement6Count !== 0 || a1Census.rotation6Count !== 0) {
    fail("A1-28 census drift");
  }

  // near-miss cross-check
  const facts = d7Instances.map(({ key, a, b }) => {
    const displacement = hamming12(masks.get(a), masks.get(b)) === 2 ? singlePitchDisplacement(pitches.get(a), pitches.get(b)) : null;
    return {
      key,
      dPcSum: Math.abs(pcSumOfMask(masks.get(a)) - pcSumOfMask(masks.get(b))),
      displacementLinear: displacement ? displacement.linear : null,
      recorded: officeByState.get(a) === officeByState.get(b),
    };
  });
  const nearMissSelected = facts.filter((fact) => fact.dPcSum === 1).map((fact) => fact.key);
  const nearMissMissed = facts.filter((fact) => fact.recorded && fact.dPcSum !== 1).map((fact) => fact.key);
  const recordedDisplacement6 = facts.filter((fact) => fact.recorded && fact.displacementLinear !== null && Math.abs(fact.displacementLinear) === 6).map((fact) => fact.key);
  if (canonicalText(nearMissSelected) !== canonicalText(bl070.nearMiss.selectedKeys)) fail("near-miss selection cross-check drift");
  if (canonicalText(nearMissMissed) !== canonicalText(bl070.nearMiss.missedKeys.map((miss) => miss.key))) fail("near-miss missed cross-check drift");
  if (canonicalText(recordedDisplacement6) !== canonicalText(["127:253", "4033:2017"])) fail("recorded displacement-6 drift");

  // orbit
  const modalSuccessor = new Map(network.d7ModalRows.map((row) => [String(row.source), String(row.target)]));
  const orbitEdges = [];
  let cursor = "127";
  for (let step = 0; step < 7; step += 1) {
    const next = modalSuccessor.get(cursor);
    if (!next) fail(`orbit dead-end at ${cursor}`);
    orbitEdges.push({ a: cursor, b: next });
    cursor = next;
  }
  if (cursor !== "127") fail("orbit does not close");
  const orbitPerEdge = orbitEdges.map((edge) => {
    const hamming = hamming12(masks.get(edge.a), masks.get(edge.b));
    const displacement = hamming === 2 ? singlePitchDisplacement(pitches.get(edge.a), pitches.get(edge.b)) : null;
    const rotations = [];
    for (let d = 1; d <= 11; d += 1) if (rotateMask12(masks.get(edge.a), d) === masks.get(edge.b)) rotations.push(d);
    if (rotations.length !== 1) fail(`orbit edge not an exact rotation at ${edge.a}->${edge.b}`);
    const landed = gate3.d7Analogue.cycleTwinVerification.perEdge.find((entry) => String(entry.a) === edge.a && String(entry.b) === edge.b);
    if (!landed || landed.rotateInterval !== rotations[0]) fail(`Gate 3 interval disagreement at ${edge.a}->${edge.b}`);
    return {
      a: edge.a,
      b: edge.b,
      hamming,
      displacementLinear: displacement ? displacement.linear : null,
      rotateInterval: rotations[0],
      landedRotateInterval: landed.rotateInterval,
      exact: true,
    };
  });

  // 7-27 / 7-31
  const family727 = ledgerRows.filter((row) => row.forte === "7-27").map((row) => String(row.id)).sort(cmpNumericStrings);
  const family731 = ledgerRows.filter((row) => row.forte === "7-31").map((row) => String(row.id)).sort(cmpNumericStrings);
  if (family727.length !== 14 || family731.length !== 14) fail("family census drift");
  const crossHistogram = {};
  let crossRotation6 = 0;
  let crossComplement = 0;
  for (const a of family727) {
    for (const b of family731) {
      const hamming = hamming12(masks.get(a), masks.get(b));
      crossHistogram[String(hamming)] = (crossHistogram[String(hamming)] ?? 0) + 1;
      if (rotateMask12(masks.get(a), 6) === masks.get(b)) crossRotation6 += 1;
      if (((~masks.get(a)) & 4095) === masks.get(b)) crossComplement += 1;
    }
  }
  if (canonicalText(crossHistogram) !== canonicalText({ "4": 60, "6": 112, "8": 24 }) || crossRotation6 !== 0 || crossComplement !== 0) {
    fail("7-27/7-31 cross geometry drift");
  }
  const ic6ByFamily = {
    "7-27": sortedUnique(family727.map((state) => String(icVectorOfMask(masks.get(state))[5]))),
    "7-31": sortedUnique(family731.map((state) => String(icVectorOfMask(masks.get(state))[5]))),
  };
  if (canonicalText(ic6ByFamily) !== canonicalText({ "7-27": ["1"], "7-31": ["3"] })) fail("family IC6 drift");

  // lifted coherence
  const meshRootByMask = new Map(Object.values(mesh.heptatonicNodes).map((node) => [String(node.pitchMask), node.root]));
  const rot6Pairs = [];
  for (const a of allIds) {
    const partner = rotateMask12(masks.get(a), 6);
    if (String(partner) > a && masks.has(String(partner))) rot6Pairs.push({ a, b: String(partner) });
  }
  if (rot6Pairs.length !== 126) fail("ledger rotation-6 census drift");
  const rootMismatches = rot6Pairs.filter((pair) => {
    const rootA = meshRootByMask.get(pair.a);
    const rootB = meshRootByMask.get(pair.b);
    if (rootA === undefined || rootB === undefined) fail(`mesh root missing for ${pair.a}:${pair.b}`);
    return (rootA + 6) % 12 !== rootB;
  });
  if (rootMismatches.length !== 0) fail("rotation-6 root coherence drift");
  if (rotateMask12(masks.get("1387"), 6) !== masks.get("2773")) fail("A0 endpoint relation drift");
  if (rotateMask12(masks.get("4033"), 6) !== masks.get("127")) fail("D7 closure relation drift");

  // boundary IC6
  const boundaryStates = sortedUnique([...d7Anchors, ...d6Satellites, ...d6Anchors, ...a0Anchors, ...a1Anchors, ...a1Satellites]);
  if (boundaryStates.length !== 70) fail("boundary state census drift");
  const boundaryIc6 = ic6HistogramOf(boundaryStates, masks);
  const allIc6 = ic6HistogramOf(allIds, masks);
  if (canonicalText(boundaryIc6) !== canonicalText({ "1": 42, "2": 14, "3": 14 })) fail("boundary IC6 drift");
  if (canonicalText(allIc6) !== canonicalText({ "1": 112, "2": 280, "3": 70 })) fail("ledger IC6 drift");
  const boundaryHigh = boundaryStates.filter((state) => icVectorOfMask(masks.get(state))[5] >= 2).length;
  const nonBoundaryStates = allIds.filter((state) => !boundaryStates.includes(state));
  const nonBoundaryHigh = nonBoundaryStates.filter((state) => icVectorOfMask(masks.get(state))[5] >= 2).length;
  if (boundaryHigh !== 28 || nonBoundaryHigh !== 322 || nonBoundaryStates.length !== 392) fail("IC6 incidence drift");

  // Fisher tables
  const fisherTables = [
    { id: "TEST-1", table: { a: 12, b: 24, c: 630, d: 6300 } },
    { id: "TEST-2", table: { a: 12, b: 24, c: 0, d: 28 } },
    { id: "TEST-2b", table: { a: 12, b: 24, c: 0, d: 24 } },
    { id: "TEST-3", table: { a: 12, b: 1164, c: 126, d: 106365 } },
    { id: "TEST-4", table: { a: 322, b: 70, c: 28, d: 42 } },
  ].map(({ id, table }) => {
    const { num, den } = fisherGreaterExact(table.a, table.b, table.c, table.d);
    return { id, table, pExact: `${num.toString()}/${den.toString()}`, pDecimal: decimalOf({ num, den }, 24) };
  });

  return {
    sources: { ledgerRows, network, mesh, d4Hunt, bl070, bl068, gate3, phaseA },
    masks, pitches, officeByState, forteByState,
    d7Anchors, d6Satellites, d6Anchors, a0Anchors, a1Anchors, a1Satellites, dAnchors,
    d7Census, d6Census, a0Census, a1Census, u5Census, b1,
    nearMissSelected, nearMissMissed, recordedDisplacement6,
    orbitPerEdge, family727, family731, crossHistogram, crossRotation6, crossComplement, ic6ByFamily,
    rot6Pairs, rootMismatches, boundaryStates, boundaryIc6, allIc6, boundaryHigh, nonBoundaryHigh,
    fisherTables,
  };
}

// ---------------------------------------------------------------------------
// Artifact checks
// ---------------------------------------------------------------------------

function checkAgainstSources(artifact, derived) {
  const {
    d7Census, d6Census, a0Census, a1Census, u5Census, b1,
    nearMissSelected, nearMissMissed, recordedDisplacement6, orbitPerEdge,
    crossHistogram, crossRotation6, crossComplement, ic6ByFamily,
    rot6Pairs, boundaryIc6, allIc6, boundaryHigh, nonBoundaryHigh, fisherTables,
  } = derived;

  if (artifact.schemaVersion !== SCHEMA_VERSION || artifact.investigationId !== INVESTIGATION_ID) fail("artifact header drift");
  if (artifact.status !== "planning_evidence") fail("status drift");
  if (artifact.generator !== "scripts/build-bl071-interval-6-structure.mjs") fail("generator path drift");

  const bindingPaths = artifact.sourceBindings.map((binding) => binding.artifact);
  if (canonicalText(sortedUnique(bindingPaths)) !== canonicalText(sortedUnique([
    LEDGER_PATH, NETWORK_PATH, MESH_PATH, D4_HUNT_PATH, BL070_PATH, BL068_PATH, GATE3_PATH, PHASE_A_PATH,
  ]))) fail("source binding set drift");
  for (const binding of artifact.sourceBindings) {
    if (binding.sha256 !== fileSha(binding.artifact)) fail(`source binding sha drift: ${binding.artifact}`);
  }
  if (artifact.base.bl070.derivationFingerprint !== BL070_FINGERPRINT) fail("BL-070 chain literal drift");
  if (artifact.base.bl068.derivationFingerprint !== BL068_FINGERPRINT) fail("BL-068 chain literal drift");
  if (artifact.base.d4Hunt.huntFingerprint !== D4_HUNT_FINGERPRINT) fail("D4 hunt chain literal drift");
  if (artifact.base.phaseA.probeFingerprint !== PHASE_A_FINGERPRINT) fail("Phase A chain literal drift");
  const { derivationFingerprint: bl070Fingerprint, ...bl070Core } = derived.sources.bl070;
  if (sha256(canonicalText(bl070Core)) !== bl070Fingerprint || bl070Fingerprint !== BL070_FINGERPRINT) fail("BL-070 fingerprint self-check drift");
  const { derivationFingerprint: bl068Fingerprint, ...bl068Core } = derived.sources.bl068;
  if (sha256(canonicalText(bl068Core)) !== bl068Fingerprint || bl068Fingerprint !== BL068_FINGERPRINT) fail("BL-068 fingerprint self-check drift");

  const rulingIds = artifact.preRegistration.rulings.map((ruling) => ruling.id);
  if (canonicalText(rulingIds) !== canonicalText(["OD-71-1", "OD-71-2", "OD-71-3", "OD-71-4", "OD-71-5", "OD-71-6"])) fail("ruling inventory drift");
  if (canonicalText(artifact.preRegistration.baselineLock.roleVocabulary) !== canonicalText(ROLE_VOCABULARY)) fail("role vocabulary drift");
  if (artifact.preRegistration.baselineLock.fisher.tests.length !== 5) fail("Fisher test inventory drift");

  // triangulation
  const triangulation = artifact.triangulation;
  if (!triangulation.statement.includes("two landed + one framed")) fail("triangulation statement drift");
  if (canonicalText(triangulation.t1.perEdge) !== canonicalText(orbitPerEdge)) fail("T-1 per-edge drift");
  if (!(triangulation.t1.reVerified === true)) fail("T-1 verification flag drift");
  if (!triangulation.t1.parallelFinding.includes("both boundary seven-cycles close at interval 6")) fail("T-1 parallel finding drift");
  if (canonicalText(triangulation.t2.selectedKeys) !== canonicalText(nearMissSelected)) fail("T-2 selected drift");
  if (canonicalText(triangulation.t2.missedKeys) !== canonicalText(nearMissMissed)) fail("T-2 missed drift");
  if (canonicalText(triangulation.t2.recordedDisplacement6) !== canonicalText(recordedDisplacement6)) fail("T-2 recorded displacement-6 drift");
  if (triangulation.t3.reVerified !== false || triangulation.t3.status !== "HYPOTHESIS_FRAMING" || triangulation.t3.excludedFromVerdict !== true) {
    fail("T-3 framing flags drift");
  }

  // census universes
  const universes = artifact.census.universes;
  if (universes.length !== 5) fail("universe census drift");
  const byId = new Map(universes.map((universe) => [universe.id, universe]));
  if (canonicalText(universes.map((universe) => universe.id)) !== canonicalText(["D7-36", "D6-tier", "A1-28", "A0-P7", "D-anchor-49"])) {
    fail("universe id inventory drift");
  }
  const expected = [
    ["D7-36", d7Census, "instanceCount"],
    ["D6-tier", d6Census, "instanceCount"],
    ["A1-28", a1Census, "instanceCount"],
    ["A0-P7", a0Census, "instanceCount"],
    ["D-anchor-49", u5Census, "pairSpaceCount"],
  ];
  for (const [id, census, countKey] of expected) {
    const universe = byId.get(id);
    if (universe[countKey] !== census[countKey]) fail(`${id} count drift`);
    if (universe.hamming2Count !== census.hamming2Count) fail(`${id} hamming2 drift`);
    if (canonicalText(universe.displacementHistogram) !== canonicalText(census.displacementHistogram)) fail(`${id} displacement histogram drift`);
    if (universe.displacement6Count !== census.displacement6Count) fail(`${id} displacement6 drift`);
    if (canonicalText(universe.displacement6Witnesses) !== canonicalText(census.displacement6Witnesses)) fail(`${id} displacement6 witness drift`);
    if (universe.rotation6Count !== census.rotation6Count) fail(`${id} rotation6 drift`);
    if (canonicalText(universe.rotation6Witnesses) !== canonicalText(census.rotation6Witnesses)) fail(`${id} rotation6 witness drift`);
    if (canonicalText(universe.ic6Content) !== canonicalText(ic6HistogramOf(census.memberStates, derived.masks))) fail(`${id} ic6 drift`);
  }
  if (byId.get("A1-28").nonSwapCount !== a1Census.nonSwapCount) fail("A1-28 non-swap drift");
  if (canonicalText(artifact.census.boundaryAggregate.ic6Content) !== canonicalText(boundaryIc6)) fail("boundary IC6 drift");
  if (canonicalText(artifact.census.boundaryAggregate.ledgerComparison) !== canonicalText(allIc6)) fail("ledger IC6 comparison drift");
  if (artifact.census.boundaryAggregate.stateCount !== 70) fail("boundary state count drift");

  // baseline
  const baseline = artifact.baseline;
  if (baseline.b1.pairSpaceCount !== b1.pairSpaceCount || baseline.b1.hamming2Count !== b1.hamming2Count) fail("B1 counts drift");
  if (canonicalText(baseline.b1.displacementHistogram) !== canonicalText(b1.displacementHistogram)) fail("B1 histogram drift");
  if (baseline.b1.displacement6Count !== b1.displacement6Count) fail("B1 displacement6 drift");
  if (baseline.b1.rotation6Count !== b1.rotation6Count) fail("B1 rotation6 drift");
  if (baseline.b1.hamming2AndRotation6Count !== b1.hamming2AndRotation6Count) fail("B1 overlap drift");
  if (baseline.b2.instanceCount !== 28 || baseline.b2.hamming2Count !== 24 ||
      baseline.b2.displacement6Count !== 0 || baseline.b2.rotation6Count !== 0) {
    fail("B2 computed counts drift");
  }
  if (!baseline.b2.groundingCorrection.includes("0/28")) fail("B2 grounding correction missing");
  if (artifact.baseline.tests.length !== fisherTables.length) fail("Fisher test census drift");
  for (const expectedTest of fisherTables) {
    const test = artifact.baseline.tests.find((entry) => entry.id === expectedTest.id);
    if (!test) fail(`Fisher test missing: ${expectedTest.id}`);
    if (canonicalText(test.table) !== canonicalText(expectedTest.table)) fail(`Fisher table drift: ${expectedTest.id}`);
    if (test.pExact !== expectedTest.pExact) fail(`Fisher exact drift: ${expectedTest.id}`);
    if (test.pDecimal !== expectedTest.pDecimal) fail(`Fisher decimal drift: ${expectedTest.id}`);
  }

  // split block
  const split = artifact.splitSevenTwentySeven;
  if (canonicalText(split.crossHammingHistogram) !== canonicalText(crossHistogram)) fail("split cross histogram drift");
  if (split.crossRotation6Count !== crossRotation6 || split.crossComplementCount !== crossComplement) fail("split cross relation drift");
  if (canonicalText(split.ic6ContentByFamily) !== canonicalText(ic6ByFamily)) fail("split IC6 drift");
  if (!split.characterization.startsWith("SPLIT_NOT_TRITONE_STRUCTURED")) fail("split characterization drift");

  // lifted block
  const lifted = artifact.liftedSpace;
  if (lifted.status !== "COMPUTABLE_EXACT_ROOTED_CONGRUENCE") fail("lifted status drift");
  if (lifted.universalCheck.rotation6Pairs !== rot6Pairs.length || lifted.universalCheck.rootCoherent !== rot6Pairs.length) fail("lifted coherence drift");
  if (lifted.universalCheck.mismatches.length !== 0) fail("lifted mismatch inventory drift");
  if (!lifted.endpointPair.congruence.includes("phase-shift-6")) fail("endpoint congruence drift");

  // role verdict
  const role = artifact.roleVerdict;
  if (canonicalText(role.vocabulary) !== canonicalText(ROLE_VOCABULARY)) fail("role vocabulary drift");
  if (role.verdict !== "mixed") fail("role verdict drift");
  for (const measure of ["M-DISP", "M-ROT", "M-IC6"]) {
    if (!ROLE_VOCABULARY.includes(role.perMeasure[measure].role)) fail(`per-measure role outside the closed vocabulary: ${measure}`);
  }
  const roleText = canonicalText(role);
  for (const token of ["because", "caused by", "due to"]) {
    if (roleText.includes(token)) fail(`role block carries a mechanism token: ${token}`);
  }
  if (!role.statement.includes("No mechanism claim")) fail("role mechanism fence drift");

  // gsl
  if (artifact.gsl.id !== "GSL-4" || artifact.gsl.status !== "CANDIDATE_UNPROMOTED") fail("GSL draft drift");
  if (!artifact.gsl.statement.includes("measure-dependent")) fail("GSL statement drift");

  // gates
  for (const gate of ["V-BL-071-1", "V-BL-071-2", "V-BL-071-3", "V-BL-071-4"]) {
    if (artifact.gates[gate].result !== "PASS") fail(`gate drift: ${gate}`);
  }

  // fences and accounting
  if (!artifact.fences.d7HypothesisTier.includes("2703-2712")) fail("D7 fence drift");
  if (!artifact.fences.membrane.includes("never a probe input")) fail("membrane fence drift");
  if (!artifact.fences.noMechanismClaim.includes("no mechanism claim")) fail("mechanism fence drift");
  if (artifact.accounting.masksOnly.length < 4 || artifact.accounting.canonicalComputation.length < 4 || artifact.accounting.remainingGranted.length < 3) {
    fail("accounting tier inventory drift");
  }
  if (artifact.contractCitations.length < 10) fail("contract citation inventory drift");
  if (artifact.notAccomplished.length !== 7) fail("notAccomplished inventory drift");
  if (!artifact.notAccomplished.some((item) => item.includes("no mechanism claim"))) fail("notAccomplished mechanism item drift");
}

// ---------------------------------------------------------------------------
// Static generator checks
// ---------------------------------------------------------------------------

function staticCensusCoreCheck(sourceText) {
  const begin = sourceText.indexOf("CENSUS-CORE-BEGIN");
  const end = sourceText.indexOf("CENSUS-CORE-END");
  if (begin < 0 || end < 0 || end <= begin) fail("generator census-core markers missing");
  const head = sourceText.slice(0, end);
  const region = sourceText.slice(begin, end);
  const forbidden = [
    /\bforte\b/, /office/i, /observed/, /coverage/, /uKeys/,
    /d7SeatContactRows/, /d7ModalRows/, /d6SatelliteRows/, /d7AnchorRows/, /\bnearMiss\b/,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(region)) fail(`generator census-core reads a forbidden input: ${pattern}`);
    if (pattern.test(head)) fail(`forbidden token before the census-core end: ${pattern}`);
  }
  const required = ["partitionMembers", "censusPairs", "censusInstances", "hamming12", "rotateMask12", "maskOfRow", "singlePitchDisplacement", "pitchSet"];
  for (const token of required) {
    if (!region.includes(token)) fail(`generator census-core is missing a required masks-only token: ${token}`);
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate() {
  const artifact = readJson(ARTIFACT_PATH);
  const sources = {
    ledgerRows: parseCsv(read(LEDGER_PATH)),
    network: readJson(NETWORK_PATH),
    mesh: readJson(MESH_PATH),
    d4Hunt: readJson(D4_HUNT_PATH),
    bl070: readJson(BL070_PATH),
    bl068: readJson(BL068_PATH),
    gate3: readJson(GATE3_PATH),
    phaseA: readJson(PHASE_A_PATH),
  };

  const derived = reDerive(sources);
  checkAgainstSources(artifact, derived);

  const { investigationFingerprint, ...artifactCore } = artifact;
  if (sha256(canonicalText(artifactCore)) !== investigationFingerprint) fail("artifact fingerprint self-check failed");

  const generatorSource = read(GENERATOR_PATH);
  staticCensusCoreCheck(generatorSource);

  const repin = (candidate) => {
    const { investigationFingerprint: ignored, ...probeCore } = candidate;
    void ignored;
    return { ...probeCore, investigationFingerprint: sha256(canonicalText(probeCore)) };
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

  const driftProbes = [
    ["D7-36 displacement6 flip", (candidate) => { candidate.census.universes[0].displacement6Count = 11; }],
    ["D7-36 rotation6 flip", (candidate) => { candidate.census.universes[0].rotation6Count = 1; }],
    ["D6-tier hamming2 flip", (candidate) => { candidate.census.universes[1].hamming2Count = 11; }],
    ["A1-28 instance flip", (candidate) => { candidate.census.universes[2].instanceCount = 27; }],
    ["A1-28 non-swap flip", (candidate) => { candidate.census.universes[2].nonSwapCount = 3; }],
    ["A0-P7 closure witness strip", (candidate) => { candidate.census.universes[3].rotation6Witnesses = []; }],
    ["D-anchor pair-space flip", (candidate) => { candidate.census.universes[4].pairSpaceCount = 1175; }],
    ["D-anchor displacement witness drift", (candidate) => { candidate.census.universes[4].displacement6Witnesses[0] = "127:632"; }],
    ["D-anchor rotation witness drift", (candidate) => { candidate.census.universes[4].rotation6Witnesses[0] = "127:4031"; }],
    ["boundary state count flip", (candidate) => { candidate.census.boundaryAggregate.stateCount = 69; }],
    ["boundary IC6 histogram flip", (candidate) => { candidate.census.boundaryAggregate.ic6Content = { "1": 43, "2": 14, "3": 13 }; }],
    ["B1 pair-space flip", (candidate) => { candidate.baseline.b1.pairSpaceCount = 106492; }],
    ["B1 overlap flip", (candidate) => { candidate.baseline.b1.hamming2AndRotation6Count = 29; }],
    ["B2 computed count reverted to the pre-registered prose", (candidate) => { candidate.baseline.b2.displacement6Count = 2; }],
    ["B2 grounding correction stripped", (candidate) => { candidate.baseline.b2.groundingCorrection = "none"; }],
    ["TEST-1 decimal drift", (candidate) => { candidate.baseline.tests[0].pDecimal = "0.0001"; }],
    ["TEST-2 table drift", (candidate) => { candidate.baseline.tests[1].table.c = 1; }],
    ["TEST-3 exact drift", (candidate) => { candidate.baseline.tests[3].pExact = "1/2"; }],
    ["TEST-4 table drift", (candidate) => { candidate.baseline.tests[4].table.a = 321; }],
    ["T-1 per-edge interval drift", (candidate) => { candidate.triangulation.t1.perEdge[0].rotateInterval = 10; }],
    ["T-1 parallel finding strip", (candidate) => { candidate.triangulation.t1.parallelFinding = "none"; }],
    ["T-2 missed swap", (candidate) => { candidate.triangulation.t2.missedKeys[0] = "127:191"; }],
    ["T-3 framing flags cleared", (candidate) => { candidate.triangulation.t3.excludedFromVerdict = false; }],
    ["split cross histogram drift", (candidate) => { candidate.splitSevenTwentySeven.crossHammingHistogram = { "4": 61, "6": 111, "8": 24 }; }],
    ["split cross rotation flip", (candidate) => { candidate.splitSevenTwentySeven.crossRotation6Count = 1; }],
    ["lifted coherence flip", (candidate) => { candidate.liftedSpace.universalCheck.rootCoherent = 125; }],
    ["role verdict outside the closed set", (candidate) => { candidate.roleVerdict.verdict = "separation"; }],
    ["role block mechanism token", (candidate) => { candidate.roleVerdict.perMeasure["M-DISP"].assessment = "the tritone separates because the boundary demands it"; }],
    ["GSL promotion", (candidate) => { candidate.gsl.status = "PROMOTED"; }],
    ["gate flip", (candidate) => { candidate.gates["V-BL-071-3"].result = "FAIL"; }],
    ["mechanism fence strip", (candidate) => { candidate.fences.noMechanismClaim = "unfenced"; }],
    ["accounting tier emptying", (candidate) => { candidate.accounting.masksOnly = []; }],
    ["source binding sha zero", (candidate) => { candidate.sourceBindings[0].sha256 = "0".repeat(64); }],
    ["chain fingerprint zero", (candidate) => { candidate.base.bl070.derivationFingerprint = "0".repeat(64); }],
  ];
  for (const [label, mutate] of driftProbes) {
    const candidate = clone(artifact);
    mutate(candidate);
    expectRejection(label, candidate);
  }

  const staticProbes = [
    ["smuggled office-index read", "const drawn = ledgerRows[0].officeIndex; void drawn;"],
    ["smuggled label-field read", "const drawn = ledgerRows[0].office; void drawn;"],
    ["smuggled class-label read", "const drawn = ledgerRows[0].forte; void drawn;"],
    ["smuggled relational-label read", "const drawn = ledgerRows[0].relationalOffice; void drawn;"],
    ["smuggled network record read", "const drawn = network.d7SeatContactRows; void drawn;"],
  ];
  let staticRejections = 0;
  for (const [label, smuggled] of staticProbes) {
    let rejected = false;
    try {
      staticCensusCoreCheck(generatorSource.replace(
        "export function partitionMembers(ledgerRows) {",
        `export function partitionMembers(ledgerRows) { ${smuggled}`,
      ));
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`mutation probe not rejected: ${label}`);
    staticRejections += 1;
  }
  const stripProbes = ["partitionMembers", "hamming12", "rotateMask12", "maskOfRow", "pitchSet"];
  for (const token of stripProbes) {
    let rejected = false;
    try {
      staticCensusCoreCheck(generatorSource.split(token).join("STRIPPED"));
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`presence-strip probe not rejected: ${token}`);
    staticRejections += 1;
  }

  console.log(JSON.stringify({
    artifact: ARTIFACT_PATH,
    status: "PASS",
    investigationFingerprint: artifact.investigationFingerprint,
    chainFingerprints: {
      bl070: BL070_FINGERPRINT,
      bl068: BL068_FINGERPRINT,
      d4Hunt: D4_HUNT_FINGERPRINT,
      phaseA: PHASE_A_FINGERPRINT,
    },
    census: artifact.census.universes.map((universe) =>
      `${universe.id}:${universe.instanceCount ?? universe.pairSpaceCount}/disp6:${universe.displacement6Count}/rot6:${universe.rotation6Count}`),
    tests: artifact.baseline.tests.map((test) => `${test.id}:${test.pDecimal}`),
    roleVerdict: artifact.roleVerdict.verdict,
    lifted: artifact.liftedSpace.status,
    mutationProbes: driftProbes.length + staticProbes.length + stripProbes.length,
    probeStaticRejections: staticRejections,
  }, null, 2));
}

validate();
