export class SnapshotRegistryProvider {
  constructor({
    network,
    profileRegistry,
    photonicRegistry,
    semanticRegistry,
    projectionRegistry,
    providerName = "snapshot",
  }) {
    this.providerName = providerName;
    this.releaseId = profileRegistry.releaseId;
    this.nodeById = new Map(network.nodes.map((node) => [node.id, node]));
    this.profileByOffice = new Map(
      profileRegistry.profiles.map((profile) => [profile.office, profile]),
    );
    this.photonicByOffice = new Map(
      photonicRegistry.records.map((record) => [record.office, record]),
    );
    this.semanticOperatorByStructuralId = new Map(
      semanticRegistry.operators.map((operator) => [
        operator.structuralOperatorId,
        operator,
      ]),
    );
    this.projectionByDomain = new Map(
      projectionRegistry.projections.map((projection) => [
        projection.domain,
        projection,
      ]),
    );
  }

  async loadCompilationContext({
    stateId,
    domain,
    structuralOperatorIds = [],
  }) {
    const state = this.nodeById.get(Number(stateId));
    if (!state) throw new Error(`Unknown ScaleState id: ${stateId}`);
    const profile = state.office
      ? this.profileByOffice.get(state.office) ?? null
      : null;
    const photonic = state.office
      ? this.photonicByOffice.get(state.office) ?? null
      : null;
    const projection = this.projectionByDomain.get(domain);
    if (!projection) {
      throw new Error(`Unsupported domain projection: ${domain}`);
    }
    const semanticOperators = structuralOperatorIds.map((operatorId) => {
      const operator = this.semanticOperatorByStructuralId.get(operatorId);
      if (!operator) {
        throw new Error(`Unknown structural operator in route: ${operatorId}`);
      }
      return operator;
    });
    return {
      providerName: this.providerName,
      releaseId: this.releaseId,
      state,
      profile,
      photonic,
      projection,
      semanticOperators,
    };
  }
}

