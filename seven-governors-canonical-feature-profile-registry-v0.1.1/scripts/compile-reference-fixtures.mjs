import fs from "node:fs";
import {
  parseCsv,
  readJson,
  sha256,
  writeJson,
} from "./lib.mjs";
import { compileProfile } from "./compiler.mjs";

const applications = parseCsv(
  fs.readFileSync(
    new URL("../source/operator-applications.csv", import.meta.url),
    "utf8",
  ),
);
const network = readJson("source/universal-network-data.json");
const nodeById = new Map(network.nodes.map((node) => [node.id, node]));

function observedEdge(sourceId, operatorId, targetId) {
  const row = applications.find(
    (candidate) =>
      Number(candidate.source_id) === sourceId &&
      candidate.operator_id === operatorId &&
      Number(candidate.target_id) === targetId,
  );
  if (!row) {
    throw new Error(
      `Missing observed operator application ${sourceId} -[${operatorId}]-> ${targetId}`,
    );
  }
  return {
    sourceId,
    sourceName: row.source_name,
    operatorId,
    targetId,
    targetName: row.target_name,
    structuralEvidence: row.structural_evidence === "true",
    structuralEdgeTypes: row.structural_edge_types
      ? row.structural_edge_types.split("|")
      : [],
    fieldEvidence: row.field_evidence === "true",
    fieldEdgeTypes: row.field_edge_types
      ? row.field_edge_types.split("|")
      : [],
    applicationStatus: row.application_status,
  };
}

function route(routeId, edges, note) {
  return {
    routeId,
    sourceIds: edges.map((edge) => edge.sourceId),
    operatorIds: edges.map((edge) => edge.operatorId),
    relationEvidence: edges,
    note,
  };
}

function assertSameFingerprint(label, packets) {
  const fingerprints = new Set(
    packets.map((packet) => packet.intrinsicFingerprint),
  );
  if (fingerprints.size !== 1) {
    throw new Error(`${label} failed: route fingerprints diverged`);
  }
  return [...fingerprints][0];
}

const acousticEdges = [
  observedEdge(2773, "L7", 1749),
  observedEdge(1717, "R4", 1749),
];
const acousticPackets = await Promise.all(acousticEdges.map((edge) =>
  compileProfile({
    stateId: 1749,
    domain: "landforms",
    route: route(
      `route:acoustic:${edge.sourceId}:${edge.operatorId}`,
      [edge],
      "Exact A1 midpoint route.",
    ),
  }),
));
const acousticFingerprint = assertSameFingerprint(
  "Acoustic confluence",
  acousticPackets,
);

const harmonicMinorEdge = observedEdge(1453, "R7", 2477);
const harmonicMinorPacket = await compileProfile({
  stateId: 2477,
  domain: "landforms",
  route: route(
    "route:harmonic-minor:aeolian:R7",
    [harmonicMinorEdge],
    "Direct A0 satellite inheritance.",
  ),
});

const lydianMinorEdges = [
  observedEdge(1749, "L6", 1493),
  observedEdge(1461, "R4", 1493),
];
const lydianMinorPackets = await Promise.all(lydianMinorEdges.map((edge) =>
  compileProfile({
    stateId: 1493,
    domain: "landforms",
    route: route(
      `route:lydian-minor:${edge.sourceId}:${edge.operatorId}`,
      [edge],
      "Exact A2 midpoint route.",
    ),
  }),
));
const lydianMinorFingerprint = assertSameFingerprint(
  "Lydian Minor confluence",
  lydianMinorPackets,
);

const aeolianSquareRoutes = [
  route(
    "route:aeolian-square:R7-M",
    [
      observedEdge(1453, "R7", 2477),
      observedEdge(2477, "M", 1643),
    ],
    "Raise Aeolian Degree 7, then apply modal successor.",
  ),
  route(
    "route:aeolian-square:M-R6",
    [
      observedEdge(1453, "M", 1387),
      observedEdge(1387, "R6", 1643),
    ],
    "Apply modal successor, then raise the covariant Degree 6.",
  ),
];
const aeolianSquarePackets = await Promise.all(aeolianSquareRoutes.map((candidateRoute) =>
  compileProfile({
    stateId: 1643,
    domain: "landforms",
    route: candidateRoute,
  }),
));
const aeolianSquareFingerprint = assertSameFingerprint(
  "Aeolian modal covariance",
  aeolianSquarePackets,
);

const fixtures = [
  {
    fixtureId: "fixture:acoustic-confluence",
    fixtureClass: "structural_normalization",
    evidenceScope: [
      "harmonic_structure",
      "office_resolution",
      "normal_form_confluence",
    ],
    semanticEffectEvidence: false,
    label: "Acoustic A1 midpoint confluence",
    fixtureType: "exact_midpoint_confluence",
    targetStateId: 1749,
    targetStateName: nodeById.get(1749).name,
    expectedOffice: "Moon",
    routes: acousticPackets.map((packet) => packet.routeContext),
    normalFormFingerprint: acousticFingerprint,
    assertion:
      "Lydian --L7--> Acoustic and Mixolydian --R4--> Acoustic compile to the same intrinsic Moon-office packet.",
    status: "passed",
  },
  {
    fixtureId: "fixture:harmonic-minor-satellite",
    fixtureClass: "structural_normalization",
    evidenceScope: [
      "harmonic_structure",
      "state_degree_governor_separation",
      "office_resolution",
    ],
    semanticEffectEvidence: false,
    label: "Harmonic Minor direct satellite",
    fixtureType: "direct_satellite_inheritance",
    targetStateId: 2477,
    targetStateName: nodeById.get(2477).name,
    expectedOffice: "Jupiter",
    routes: [harmonicMinorPacket.routeContext],
    normalFormFingerprint: harmonicMinorPacket.intrinsicFingerprint,
    assertion:
      "Aeolian --R7--> Harmonic Minor retains the Jupiter State Governor while the edge records Moon as Degree Governor.",
    status: "passed",
  },
  {
    fixtureId: "fixture:lydian-minor-midpoint",
    fixtureClass: "structural_normalization",
    evidenceScope: [
      "harmonic_structure",
      "office_resolution",
      "normal_form_confluence",
    ],
    semanticEffectEvidence: false,
    label: "Lydian Minor A2 midpoint confluence",
    fixtureType: "exact_midpoint_confluence",
    targetStateId: 1493,
    targetStateName: nodeById.get(1493).name,
    expectedOffice: "Mars",
    routes: lydianMinorPackets.map((packet) => packet.routeContext),
    normalFormFingerprint: lydianMinorFingerprint,
    assertion:
      "Acoustic --L6--> Lydian Minor and Mixolydian ♭6 --R4--> Lydian Minor compile to the same intrinsic Mars-office packet.",
    status: "passed",
  },
  {
    fixtureId: "fixture:aeolian-modal-covariance",
    fixtureClass: "structural_normalization",
    evidenceScope: [
      "harmonic_structure",
      "modal_covariance",
      "normal_form_confluence",
    ],
    semanticEffectEvidence: false,
    label: "Aeolian mutation/modal covariance square",
    fixtureType: "modal_covariance_confluence",
    targetStateId: 1643,
    targetStateName: nodeById.get(1643).name,
    expectedOffice: "Saturn",
    routes: aeolianSquarePackets.map((packet) => packet.routeContext),
    normalFormFingerprint: aeolianSquareFingerprint,
    assertion:
      "M∘R7(Aeolian) and R6∘M(Aeolian) both compile as Locrian ♮6 with one intrinsic Saturn-office packet.",
    status: "passed",
  },
];

const allPackets = [
  ...acousticPackets,
  harmonicMinorPacket,
  ...lydianMinorPackets,
  ...aeolianSquarePackets,
];
for (const packet of allPackets) {
  const routeSlug = packet.routeContext.routeId.replaceAll(":", "-");
  writeJson(
    `examples/compiled-landform-packets/${packet.state.stateId}-${routeSlug}.json`,
    packet,
  );
}

writeJson("fixtures/acoustic-confluence.json", fixtures[0]);
writeJson("fixtures/harmonic-minor-satellite.json", fixtures[1]);
writeJson("fixtures/lydian-minor-midpoint.json", fixtures[2]);
writeJson("fixtures/aeolian-modal-covariance.json", fixtures[3]);
writeJson("fixtures/reference-fixture-index.json", {
  schemaVersion: "1.0.0",
  registryVersion: "0.1.1",
  releaseId: "canonical-profile-registry:0.1.1",
  fixtureCount: fixtures.length,
  generatedAt: "2026-07-30",
  fixtures,
  suiteFingerprint: sha256(fixtures),
});

console.log(
  `Compiled ${allPackets.length} route packets across ${fixtures.length} passed fixtures.`,
);
