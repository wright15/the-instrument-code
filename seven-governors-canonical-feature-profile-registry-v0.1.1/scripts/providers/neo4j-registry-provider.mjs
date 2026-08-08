function native(value) {
  if (value && typeof value.toNumber === "function") return value.toNumber();
  if (Array.isArray(value)) return value.map(native);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, native(child)]),
    );
  }
  return value;
}

function nodeProperties(record, key) {
  const node = record.get(key);
  return node ? native(node.properties) : null;
}

export const NEO4J_PROVIDER_QUERIES = {
  state: `
    MATCH (state:ScaleState)
    WHERE toInteger(coalesce(state.scale_id, state.id)) = $stateId
    RETURN state
    LIMIT 1
  `,
  profile: `
    MATCH (office:GovernorOffice)-[:ACTIVE_PROFILE]->(p:CanonicalFeatureProfile)
    WHERE coalesce(office.name, office.office) = $office
    MATCH (p)-[:PART_OF_RELEASE]->(release_node:RegistryRelease)
    WHERE $releaseId IS NULL OR release_node.release_id = $releaseId
    OPTIONAL MATCH (p)-[:HAS_PHOTONIC_RECORD]->(light:PhotonicRecord)
    OPTIONAL MATCH (p)-[reference:REFERENCES_LANDFORM]->
      (landform:LandformReference)
    WITH p, light, release_node, landform, reference
    ORDER BY reference.reference_order
    RETURN p AS canonical_profile, light,
           release_node.release_id AS release_id,
           collect(landform.name) AS landforms
    LIMIT 1
  `,
  projection: `
    MATCH (projection:DomainProjection {domain: $domain})
    MATCH (projection)-[:PART_OF_RELEASE]->(release:RegistryRelease)
    WHERE ($releaseId IS NULL AND release.active = true)
       OR release.release_id = $releaseId
    RETURN projection, release.release_id AS release_id
    LIMIT 1
  `,
  semanticOperator: `
    MATCH (structural:MutationOperator)-[:ACTIVE_SEMANTIC_OPERATOR]->(operator:SemanticOperator)
    WHERE coalesce(structural.id, structural.operator_id, structural.operatorId) = $operatorId
    MATCH (operator)-[:PART_OF_RELEASE]->(release:RegistryRelease)
    WHERE ($releaseId IS NULL AND release.active = true)
       OR release.release_id = $releaseId
    OPTIONAL MATCH (operator)-[:HAS_UNRESOLVED_SCOPE]->(scope:SemanticUnresolvedScope)
    RETURN operator, collect(DISTINCT scope.scope_id) AS scopes
    LIMIT 1
  `,
};

export class Neo4jRegistryProvider {
  constructor({ session, releaseId = null }) {
    if (!session || typeof session.executeRead !== "function") {
      throw new Error(
        "Neo4jRegistryProvider requires an open neo4j-driver Session.",
      );
    }
    this.session = session;
    this.releaseId = releaseId;
    this.providerName = "neo4j";
  }

  async loadCompilationContext({
    stateId,
    domain,
    structuralOperatorIds = [],
  }) {
    return this.session.executeRead(async (transaction) => {
      const stateResult = await transaction.run(
        NEO4J_PROVIDER_QUERIES.state,
        { stateId: Number(stateId) },
      );
      if (stateResult.records.length !== 1) {
        throw new Error(`Unknown ScaleState id in Neo4j: ${stateId}`);
      }
      const rawState = nodeProperties(stateResult.records[0], "state");
      const state = {
        ...rawState,
        id: Number(rawState.scale_id ?? rawState.id),
        forte: rawState.forte ?? rawState.forte_family,
        bit: rawState.bit ?? rawState.pitch_mask,
        pitchSet: rawState.pitchSet ?? rawState.pitch_set,
        fineRole: rawState.fineRole ?? rawState.fine_role,
        office: rawState.office ?? rawState.governor_office ?? null,
        officeIndex:
          rawState.officeIndex ?? rawState.office_index ?? null,
        assignmentStatus:
          rawState.assignmentStatus ?? rawState.assignment_status,
        resolutionClass:
          rawState.resolutionClass ?? rawState.resolution_class,
        officeBasis: rawState.officeBasis ?? rawState.office_basis,
        officeStatus: rawState.officeStatus ?? rawState.office_status,
      };

      let profile = null;
      let photonic = null;
      let resolvedReleaseId = this.releaseId;
      if (state.office) {
        const profileResult = await transaction.run(
          NEO4J_PROVIDER_QUERIES.profile,
          { office: state.office, releaseId: this.releaseId },
        );
        if (profileResult.records.length !== 1) {
          throw new Error(
            `No active canonical profile for ${state.office} in the requested release.`,
          );
        }
        const record = profileResult.records[0];
        const properties = nodeProperties(record, "canonical_profile");
        const landforms = native(record.get("landforms")).filter(Boolean);
        resolvedReleaseId = record.get("release_id");
        profile = {
          profileId: properties.profile_id,
          profileVersion: properties.profile_version,
          releaseId: resolvedReleaseId,
          office: properties.office,
          officeIndex: properties.office_index,
          intrinsicFingerprint: properties.fingerprint,
          canonicalIdentity: {
            stateId: properties.canonical_state_id,
            stateName: properties.canonical_state_name,
            mode: properties.canonical_mode,
            forteFamily: properties.forte_family,
            pitchMask: properties.pitch_mask,
            anchorTier: properties.anchor_tier,
          },
          semantic: {
            thermodynamicFunction: properties.thermodynamic_function,
            opticalFunction: properties.optical_function,
            directionality: properties.directionality,
            archetypalRole: properties.archetypal_role,
            element: properties.element,
            semanticCompression: {
              coordinateSymbol: "C_S",
              status: properties.semantic_coordinate_status,
              orderedPosition: properties.semantic_order,
              orderedProcess: properties.thermodynamic_function,
              normalizedOrdinal:
                properties.semantic_normalized_ordinal,
              metric: properties.semantic_metric,
              scale: properties.semantic_scale,
              physicalClaim: false,
            },
          },
          domainReferences: { landforms },
        };
        const light = nodeProperties(record, "light");
        photonic = light
          ? {
              photonicId: light.photonic_id,
              releaseId: resolvedReleaseId,
              office: light.office,
              representativeWavelengthNm: light.wavelength_nm,
              vacuumFrequencyHz: light.frequency_hz,
              photonEnergyJ: light.photon_energy_j,
              photonEnergyEv: light.photon_energy_ev,
              photonicCompression: light.photonic_compression,
            }
          : null;
      }

      const projectionResult = await transaction.run(
        NEO4J_PROVIDER_QUERIES.projection,
        { domain, releaseId: resolvedReleaseId ?? this.releaseId },
      );
      if (projectionResult.records.length !== 1) {
        throw new Error(
          `No active Neo4j domain projection for ${domain}.`,
        );
      }
      const projectionRecord = projectionResult.records[0];
      const projectionProperties = nodeProperties(
        projectionRecord,
        "projection",
      );
      resolvedReleaseId =
        resolvedReleaseId ?? projectionRecord.get("release_id");
      const projection = {
        projectionId: projectionProperties.projection_id,
        domain: projectionProperties.domain,
        status: projectionProperties.status,
      };

      const semanticOperators = [];
      for (const operatorId of structuralOperatorIds) {
        const operatorResult = await transaction.run(
          NEO4J_PROVIDER_QUERIES.semanticOperator,
          { operatorId, releaseId: resolvedReleaseId ?? this.releaseId },
        );
        if (operatorResult.records.length !== 1) {
          throw new Error(
            `No active semantic shell for structural operator ${operatorId}.`,
          );
        }
        const record = operatorResult.records[0];
        const properties = nodeProperties(record, "operator");
        semanticOperators.push({
          semanticOperatorId: properties.semantic_operator_id,
          structuralOperatorId: properties.structural_operator_id,
          degree: properties.degree,
          degreeGovernor: properties.degree_governor,
          direction: properties.direction,
          semanticStatus: properties.semantic_status,
          semanticEffects: {
            unresolved: native(record.get("scopes")).map((scope) =>
              scope.replace(/^unresolved:/, ""),
            ),
          },
        });
      }

      return {
        providerName: this.providerName,
        releaseId: resolvedReleaseId,
        state,
        profile,
        photonic,
        projection,
        semanticOperators,
      };
    });
  }
}
