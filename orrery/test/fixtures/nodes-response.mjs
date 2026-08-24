const governors = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
const tiers = ["A0", "A1", "A2"];
const forteFamilies = ["7-35", "7-34", "7-33"];
const descriptorReleaseId =
  process.argv[2] ?? "harmonic-compression-candidate:CH_A012_q_v1:1.0.0";

const nodes = tiers.flatMap((tier, tierIndex) =>
  governors.map((office, officeIndex) => {
    const stateId = tierIndex * 100 + officeIndex + 1;

    return {
      state: {
        stateId,
        nodeId: `scale:${stateId}`,
        name: `${office} ${tier}`,
        forteFamily: forteFamilies[tierIndex],
        tier,
        role: "anchor",
      },
      resolution: { office, officeBearing: true },
      photonic: {
        photonicId: `photonic:${office.toLowerCase()}`,
        office,
        representativeWavelengthNm: 500 + stateId,
        photonicCompression: stateId / 100,
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
        weightedProjection: { numerator: stateId, denominator: 407 },
      },
    };
  }),
);

process.stdout.write(
  JSON.stringify({
    schemaVersion: "harmonic-orrery.nodes.v1",
    profileRegistryReleaseId: "canonical-feature-profile-registry:0.1.1",
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
