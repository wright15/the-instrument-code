import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const governors = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
const tiers = ["A0", "A1", "A2"];
const descriptorReleaseId =
  process.argv[2] ?? "harmonic-compression-candidate:CH_A012_q_v1:1.0.0";
const fixtureDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(fixtureDirectory, "../../..");
const candidate = JSON.parse(
  fs.readFileSync(
    path.join(root, "canonical/harmonic-compression-candidates/CH_A012_q_v1.json"),
    "utf8",
  ),
);
const topologyByAnchor = new Map(
  candidate.records.map((record) => [`${record.tier}:${record.stateGovernor}`, record]),
);

const nodes = tiers.flatMap((tier) =>
  governors.map((office) => {
    const topology = topologyByAnchor.get(`${tier}:${office}`);
    if (!topology) {
      throw new Error(`Missing canonical topology for ${tier} ${office}.`);
    }

    return {
      state: {
        stateId: topology.stateId,
        pitchMask: topology.stateId,
        pitchClasses: topology.pitchClasses,
        intervalVector: topology.intervalVector,
        chirality: "achiral",
        nodeId: `scale:${topology.stateId}`,
        name: `${office} ${tier}`,
        forteFamily: topology.forte,
        tier,
        role: "anchor",
      },
      resolution: { office, officeBearing: true },
      photonic: {
        photonicId: `photonic:${office.toLowerCase()}`,
        office,
        representativeWavelengthNm: 500 + topology.stateId,
        photonicCompression: topology.stateId / 100,
      },
      canonicalProfile: {
        profileId: `profile:${office.toLowerCase()}`,
        profileVersion: "0.1.1",
        office,
        domainReferences: { landforms: ["ridge", "basin"] },
      },
      scopedHarmonicDescriptor: {
        coordinateId: "harmonic.CH_A012_q_v1",
        status: "admitted_scoped_A012",
        stateGovernor: office,
        weightedProjection: { numerator: topology.stateId, denominator: 407 },
      },
    };
  }),
);

process.stdout.write(
  JSON.stringify({
    schemaVersion: "harmonic-orrery.nodes.v2",
    profileRegistryReleaseId: "canonical-profile-registry:0.1.1",
    harmonicDescriptor: {
      candidateId: "CH_A012_q_v1",
      coordinateId: "harmonic.CH_A012_q_v1",
      releaseId: descriptorReleaseId,
      status: "admitted_scoped_A012",
      candidateFingerprint: "a".repeat(64),
    },
    nodeCount: 21,
    nodes,
  }),
);
