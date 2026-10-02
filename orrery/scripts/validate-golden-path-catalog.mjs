import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const orreryRoot = path.resolve(scriptDirectory, "..");
const root = path.resolve(orreryRoot, "..");
const fixturePath = path.join(orreryRoot, "test", "fixtures", "golden-paths.v1.json");
const schemaPath = path.join(root, "schemas", "harmonic-orrery-golden-path-catalog.schema.json");
const catalogPath = path.join(orreryRoot, "src", "generated", "legal-moves.v2.json");
const bipartitePath = path.join(root, "derived", "hypergraph", "bipartite-inclusion-v1.json");

function fail(message) {
  throw new Error(`INVALID_GOLDEN_PATH_CATALOG: ${message}`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isSubset(childMask, parentMask) {
  return (childMask & parentMask) === childMask;
}

function maskOf(pitchClasses) {
  return pitchClasses.reduce((mask, pitchClass) => mask | (1 << pitchClass), 0);
}

const fixture = readJson(fixturePath);
const schema = readJson(schemaPath);
const catalog = readJson(catalogPath);
const bipartite = readJson(bipartitePath);

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validate = ajv.compile(schema);
if (!validate(fixture)) {
  fail(`schema: ${ajv.errorsText(validate.errors)}`);
}

const moveIds = new Set(catalog.moves.map((move) => move.id));
const heptatonicById = bipartite.heptatonicNodes;
const pentatonicById = bipartite.pentatonicSubnodes;
const heptatonicByMask = new Map(
  Object.entries(heptatonicById).map(([id, node]) => [node.pitchMask, id]),
);

function resolveMove(moveId, context) {
  if (!moveIds.has(moveId)) {
    fail(`${context}: move ${moveId} is not in the committed legal-move catalog`);
  }
  return moveId;
}

const pathIds = new Set();
for (const goldenPath of fixture.paths) {
  if (pathIds.has(goldenPath.pathId)) {
    fail(`duplicate pathId ${goldenPath.pathId}`);
  }
  pathIds.add(goldenPath.pathId);

  const { hops } = goldenPath;
  hops.forEach((hop, index) => {
    if (hop.index !== index) {
      fail(`${goldenPath.pathId}: hop indexes are not contiguous at ${index}`);
    }
  });
  if (hops[0].nodeId !== goldenPath.origin.nodeId) {
    fail(`${goldenPath.pathId}: origin ${goldenPath.origin.nodeId} does not match first hop ${hops[0].nodeId}`);
  }
  if (hops[hops.length - 1].nodeId !== goldenPath.destination.nodeId) {
    fail(
      `${goldenPath.pathId}: destination ${goldenPath.destination.nodeId} does not match last hop ${hops[hops.length - 1].nodeId}`,
    );
  }

  for (const [index, hop] of hops.entries()) {
    if (hop.kind === "collection" || hop.kind === "derived-node") {
      if (hop.moveId !== null) {
        resolveMove(hop.moveId, `${goldenPath.pathId} hop ${index}`);
        const move = catalog.moves.find((candidate) => candidate.id === hop.moveId);
        if (move && index > 0) {
          const previous = hops[index - 1];
          const previousMask = maskOf(previous.pitchClasses);
          const currentMask = maskOf(hop.pitchClasses);
          if (move.sourceId !== previousMask || move.targetId !== currentMask) {
            fail(
              `${goldenPath.pathId} hop ${index}: move ${hop.moveId} does not chain ${previous.nodeId} -> ${hop.nodeId}`,
            );
          }
        }
      } else if (hop.kind === "collection" && index > 0) {
        fail(`${goldenPath.pathId} hop ${index}: a walk hop after the origin must carry a moveId`);
      }
    }
    if (hop.legality === "both-collections-containment" && !hop.seamCrossing && hop.kind === "bridge") {
      fail(`${goldenPath.pathId} hop ${index}: bridge hop must flag seamCrossing`);
    }
  }

  if (goldenPath.substrate === "derived-path") {
    hops.forEach((hop, index) => {
      const heptatonic = heptatonicById[hop.nodeId];
      const pentatonic = pentatonicById[hop.nodeId];
      const node = heptatonic ?? pentatonic;
      if (!node) {
        fail(`${goldenPath.pathId}: derived hop ${index} node ${hop.nodeId} is not in the bipartite source`);
      }
      if (maskOf(hop.pitchClasses) !== node.pitchMask) {
        fail(`${goldenPath.pathId}: derived hop ${index} node ${hop.nodeId} pitch classes disagree with the source`);
      }
      if ((hop.nodeKind === "heptatonic") !== Boolean(heptatonic)) {
        fail(`${goldenPath.pathId}: derived hop ${index} nodeKind disagrees with the node universe`);
      }
      if (hop.arrivedBy === "origin") {
        if (index !== 0 || hop.legality !== null || hop.moveId !== null) {
          fail(`${goldenPath.pathId}: derived origin hop must be index 0 with no legality or move`);
        }
        return;
      }
      if (hop.arrivedBy === "operator") {
        if (hop.legality !== "catalog-membership" || hop.moveId === null) {
          fail(`${goldenPath.pathId}: derived hop ${index} operator arrival must be catalog-membership with a moveId`);
        }
        return;
      }
      const pentatonicIndex = hop.nodeKind === "pentatonic" ? index : index - 1;
      const pentatonicNode = pentatonicById[hops[pentatonicIndex]?.nodeId];
      if (!pentatonicNode) {
        fail(`${goldenPath.pathId}: derived hop ${index} containment arrival has no pentatonic node`);
      }
      const heptatonicNeighbors = [hops[pentatonicIndex - 1], hops[pentatonicIndex + 1]]
        .filter((neighbor) => neighbor && heptatonicById[neighbor.nodeId]);
      if (heptatonicNeighbors.length === 0) {
        fail(`${goldenPath.pathId}: derived hop ${index} containment arrival has no heptatonic endpoint`);
      }
      for (const neighbor of heptatonicNeighbors) {
        if (!isSubset(pentatonicNode.pitchMask, heptatonicById[neighbor.nodeId].pitchMask)) {
          fail(
            `${goldenPath.pathId}: derived hop ${index} ${pentatonicNode.id} is not contained in ${neighbor.nodeId}`,
          );
        }
      }
      const bridge = heptatonicNeighbors.length === 2;
      if (hop.bridge !== bridge) {
        fail(`${goldenPath.pathId}: derived hop ${index} bridge flag disagrees with the crossing topology`);
      }
      const expectedLegality = bridge ? "both-collections-containment" : "containment-membership";
      if (hop.legality !== expectedLegality) {
        fail(`${goldenPath.pathId}: derived hop ${index} legality must be ${expectedLegality}`);
      }
    });
    if (goldenPath.hopCount !== hops.length - 1) {
      fail(`${goldenPath.pathId}: derived hopCount disagrees with the hop list`);
    }
    if (goldenPath.crossesBridge !== hops.some((hop) => hop.bridge)) {
      fail(`${goldenPath.pathId}: derived crossesBridge disagrees with the hop list`);
    }
  }

  if (goldenPath.bridge) {
    const endpoints = [goldenPath.origin, goldenPath.destination];
    for (const voicing of [goldenPath.bridge.chosen, goldenPath.bridge.alternative]) {
      const node = pentatonicById[voicing.nodeId];
      if (!node) {
        fail(`${goldenPath.pathId}: bridge voicing ${voicing.nodeId} is not a pentatonic node`);
      }
      if (!node.isBridge) {
        fail(`${goldenPath.pathId}: bridge voicing ${voicing.nodeId} is not a census bridge`);
      }
      if (voicing.setClassId && voicing.setClassId !== node.setClassId) {
        fail(`${goldenPath.pathId}: bridge voicing ${voicing.nodeId} setClassId disagrees with the bipartite source`);
      }
      if (maskOf(voicing.pitchClasses) !== node.pitchMask) {
        fail(`${goldenPath.pathId}: bridge voicing ${voicing.nodeId} pitch classes disagree with the bipartite source`);
      }
      for (const endpoint of endpoints) {
        const endpointMask = maskOf(endpoint.pitchClasses);
        if (!isSubset(node.pitchMask, endpointMask)) {
          fail(`${goldenPath.pathId}: bridge voicing ${voicing.nodeId} is not contained in ${endpoint.nodeId}`);
        }
      }
    }
  }

  for (const kernel of goldenPath.interiorKernels ?? []) {
    const node = pentatonicById[kernel.nodeId];
    if (!node) {
      fail(`${goldenPath.pathId}: interior kernel ${kernel.nodeId} is not a pentatonic node`);
    }
    if (maskOf(kernel.pitchClasses) !== node.pitchMask) {
      fail(`${goldenPath.pathId}: interior kernel ${kernel.nodeId} pitch classes disagree with the bipartite source`);
    }
    if (!isSubset(node.pitchMask, maskOf(goldenPath.origin.pitchClasses))) {
      fail(`${goldenPath.pathId}: interior kernel ${kernel.nodeId} is not contained in the origin`);
    }
  }

  if (goldenPath.modeAxis) {
    const originMask = maskOf(goldenPath.origin.pitchClasses);
    const destinationMask = maskOf(goldenPath.destination.pitchClasses);
    const flattened = goldenPath.origin.pitchClasses.filter(
      (pitchClass) => !goldenPath.destination.pitchClasses.includes(pitchClass),
    );
    const sharpened = goldenPath.destination.pitchClasses.filter(
      (pitchClass) => !goldenPath.origin.pitchClasses.includes(pitchClass),
    );
    const common = goldenPath.origin.pitchClasses.filter((pitchClass) =>
      goldenPath.destination.pitchClasses.includes(pitchClass),
    );
    if (JSON.stringify(flattened) !== JSON.stringify(goldenPath.modeAxis.flattenedPitchClasses)) {
      fail(`${goldenPath.pathId}: modeAxis flattenedPitchClasses disagree with the endpoints`);
    }
    if (JSON.stringify(sharpened) !== JSON.stringify(goldenPath.modeAxis.sharpenedPitchClasses)) {
      fail(`${goldenPath.pathId}: modeAxis sharpenedPitchClasses disagree with the endpoints`);
    }
    if (common.length !== goldenPath.modeAxis.commonTones) {
      fail(`${goldenPath.pathId}: modeAxis commonTones disagree with the endpoints`);
    }
    if (originMask === destinationMask) {
      fail(`${goldenPath.pathId}: modeAxis endpoints must differ`);
    }
  }

  for (const move of goldenPath.chosen?.moves ?? []) {
    resolveMove(move, `${goldenPath.pathId} chosen`);
  }
  for (const alternative of goldenPath.alternatives ?? []) {
    const entries =
      alternative.kind === "m-demonstration"
        ? alternative.variants.flatMap((variant) => variant.moves)
        : alternative.moves.map((moveId) => ({ moveId }));
    for (const entry of entries) {
      if (entry.moveId) {
        resolveMove(entry.moveId, `${goldenPath.pathId} alternative`);
      } else if (!entry.applicationId || !entry.compresses) {
        fail(`${goldenPath.pathId}: demonstration entry must carry an applicationId and compresses`);
      }
    }
  }

  const verdictIds = new Set();
  for (const verdict of goldenPath.verdicts ?? []) {
    if (verdictIds.has(verdict.verdictId)) {
      fail(`${goldenPath.pathId}: duplicate verdictId ${verdict.verdictId}`);
    }
    verdictIds.add(verdict.verdictId);
    if (verdict.status === "recorded" && (!verdict.statement || !verdict.date)) {
      fail(`${goldenPath.pathId}: recorded verdict ${verdict.verdictId} needs statement and date`);
    }
    if (verdict.status === "pending" && !verdict.recipe) {
      fail(`${goldenPath.pathId}: pending verdict ${verdict.verdictId} needs a recipe pointer`);
    }
  }
}

console.log(
  JSON.stringify({
    verdict: "PASS",
    schemaVersion: fixture.schemaVersion,
    pathCount: fixture.paths.length,
    pathIds: fixture.paths.map((goldenPath) => goldenPath.pathId),
    verdictCounts: fixture.paths.map((goldenPath) => ({
      pathId: goldenPath.pathId,
      recorded: (goldenPath.verdicts ?? []).filter((verdict) => verdict.status === "recorded").length,
      pending: (goldenPath.verdicts ?? []).filter((verdict) => verdict.status === "pending").length,
    })),
  }),
);
