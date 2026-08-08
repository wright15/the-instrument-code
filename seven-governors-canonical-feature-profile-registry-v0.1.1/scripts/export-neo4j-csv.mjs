import fs from "node:fs";
import path from "node:path";
import {
  PACKAGE_ROOT,
  readJson,
  sha256,
  writeCsv,
} from "./lib.mjs";

const profiles = readJson("canonical/canonical-governor-profiles.json").profiles;
const registryRelease = readJson("canonical/registry-release.json");
const photonic = readJson("canonical/photonic-records.json").records;
const featureDefinitions = readJson(
  "canonical/feature-registry.json",
).definitions;
const measures = readJson(
  "canonical/harmonic-measure-definitions.json",
).measures;
const operators = readJson(
  "canonical/semantic-operator-registry.json",
).operators;
const projections = readJson(
  "canonical/domain-projection-registry.json",
).projections;
const fixtureIndex = readJson("fixtures/reference-fixture-index.json");

writeCsv(
  "neo4j/csv/registry-releases.csv",
  [
    "release_id:ID(RegistryRelease)",
    "registry_name",
    "registry_version",
    "generated_at",
    "active:boolean",
    "release_fingerprint",
    "source_hashes_json",
    ":LABEL",
  ],
  [
    {
      "release_id:ID(RegistryRelease)": registryRelease.releaseId,
      registry_name: registryRelease.registryName,
      registry_version: registryRelease.registryVersion,
      generated_at: registryRelease.generatedAt,
      "active:boolean": registryRelease.activeByDefault,
      release_fingerprint: registryRelease.releaseFingerprint,
      source_hashes_json: registryRelease.sourceHashes,
      ":LABEL": "RegistryRelease",
    },
  ],
);

const examplesDirectory = path.join(
  PACKAGE_ROOT,
  "examples/compiled-landform-packets",
);
const packets = fs
  .readdirSync(examplesDirectory)
  .filter((name) => name.endsWith(".json"))
  .sort()
  .map((name) =>
    JSON.parse(fs.readFileSync(path.join(examplesDirectory, name), "utf8")),
  );

writeCsv(
  "neo4j/csv/canonical-profiles.csv",
  [
    "profile_id:ID(CanonicalFeatureProfile)",
    "release_id",
    "office",
    "office_index:int",
    "symbol",
    "canonical_state_id:int",
    "canonical_state_name",
    "canonical_mode",
    "forte_family",
    "pitch_mask",
    "anchor_tier",
    "thermodynamic_function",
    "optical_function",
    "directionality",
    "archetypal_role",
    "element",
    "semantic_order:int",
    "semantic_normalized_ordinal:float",
    "semantic_metric:boolean",
    "semantic_coordinate_status",
    "semantic_scale",
    "fingerprint",
    "profile_version",
    ":LABEL",
  ],
  profiles.map((profile) => ({
    "profile_id:ID(CanonicalFeatureProfile)": profile.profileId,
    release_id: profile.releaseId,
    office: profile.office,
    "office_index:int": profile.officeIndex,
    symbol: profile.symbol,
    "canonical_state_id:int": profile.canonicalIdentity.stateId,
    canonical_state_name: profile.canonicalIdentity.stateName,
    canonical_mode: profile.canonicalIdentity.mode,
    forte_family: profile.canonicalIdentity.forteFamily,
    pitch_mask: profile.canonicalIdentity.pitchMask,
    anchor_tier: profile.canonicalIdentity.anchorTier,
    thermodynamic_function: profile.semantic.thermodynamicFunction,
    optical_function: profile.semantic.opticalFunction,
    directionality: profile.semantic.directionality,
    archetypal_role: profile.semantic.archetypalRole,
    element: profile.semantic.element,
    "semantic_order:int":
      profile.semantic.semanticCompression.orderedPosition,
    "semantic_normalized_ordinal:float":
      profile.semantic.semanticCompression.normalizedOrdinal,
    "semantic_metric:boolean":
      profile.semantic.semanticCompression.metric,
    semantic_coordinate_status:
      profile.semantic.semanticCompression.status,
    semantic_scale: profile.semantic.semanticCompression.scale,
    fingerprint: profile.intrinsicFingerprint,
    profile_version: profile.profileVersion,
    ":LABEL": "CanonicalFeatureProfile",
  })),
);

writeCsv(
  "neo4j/csv/photonic-records.csv",
  [
    "photonic_id:ID(PhotonicRecord)",
    "release_id",
    "office",
    "office_index:int",
    "wavelength_nm:float",
    "frequency_hz:float",
    "photon_energy_j:float",
    "photon_energy_ev:float",
    "photonic_compression:float",
    "coordinate_symbol",
    "causation_claim:boolean",
    "policy_json",
    ":LABEL",
  ],
  photonic.map((record) => ({
    "photonic_id:ID(PhotonicRecord)": record.photonicId,
    release_id: record.releaseId,
    office: record.office,
    "office_index:int": record.officeIndex,
    "wavelength_nm:float": record.representativeWavelengthNm,
    "frequency_hz:float": record.vacuumFrequencyHz,
    "photon_energy_j:float": record.photonEnergyJ,
    "photon_energy_ev:float": record.photonEnergyEv,
    "photonic_compression:float": record.photonicCompression,
    coordinate_symbol: record.coordinateSymbol,
    "causation_claim:boolean": false,
    policy_json: record.interpretationPolicy,
    ":LABEL": "PhotonicRecord",
  })),
);

writeCsv(
  "neo4j/csv/feature-definitions.csv",
  [
    "feature_id:ID(FeatureDefinition)",
    "release_id",
    "label",
    "layer",
    "epistemic_class",
    "data_type",
    "unit",
    "operator_scope",
    "domain_scope:string[]",
    "description",
    "source_json",
    ":LABEL",
  ],
  featureDefinitions.map((definition) => ({
    "feature_id:ID(FeatureDefinition)": definition.featureId,
    release_id: registryRelease.releaseId,
    label: definition.label,
    layer: definition.layer,
    epistemic_class: definition.epistemicClass,
    data_type: definition.dataType,
    unit: definition.unit,
    operator_scope: definition.operatorScope,
    "domain_scope:string[]": definition.domainScope.join(";"),
    description: definition.description,
    source_json: definition.source,
    ":LABEL": "FeatureDefinition",
  })),
);

const assertions = profiles.flatMap((profile) =>
  profile.featureAssertions.map((assertion) => ({
    assertion_id: `assertion:${sha256({
      profile: profile.profileId,
      feature: assertion.featureId,
    }).slice(0, 20)}`,
    profile_id: profile.profileId,
    feature_id: assertion.featureId,
    value_json: assertion.value,
    provenance_json: assertion.provenance,
  })),
);
writeCsv(
  "neo4j/csv/profile-feature-assertions.csv",
  [
    "assertion_id",
    "profile_id:START_ID(CanonicalFeatureProfile)",
    "feature_id:END_ID(FeatureDefinition)",
    "value_json",
    "provenance_json",
    ":TYPE",
  ],
  assertions.map((assertion) => ({
    assertion_id: assertion.assertion_id,
    "profile_id:START_ID(CanonicalFeatureProfile)": assertion.profile_id,
    "feature_id:END_ID(FeatureDefinition)": assertion.feature_id,
    value_json: assertion.value_json,
    provenance_json: assertion.provenance_json,
    ":TYPE": "HAS_FEATURE",
  })),
);

writeCsv(
  "neo4j/csv/harmonic-measure-definitions.csv",
  [
    "measure_id:ID(HarmonicMeasureDefinition)",
    "release_id",
    "status",
    "scope",
    "tuning_requirement",
    "definition",
    "topology_use",
    ":LABEL",
  ],
  measures.map((measure) => ({
    "measure_id:ID(HarmonicMeasureDefinition)": measure.measureId,
    release_id: registryRelease.releaseId,
    status: measure.status,
    scope: measure.scope,
    tuning_requirement: measure.tuningRequirement,
    definition: measure.definition,
    topology_use: measure.topologyUse,
    ":LABEL": "HarmonicMeasureDefinition",
  })),
);

writeCsv(
  "neo4j/csv/semantic-operators.csv",
  [
    "semantic_operator_id:ID(SemanticOperator)",
    "release_id",
    "structural_operator_id",
    "notation",
    "name",
    "operator_class",
    "degree:int",
    "degree_governor",
    "direction",
    "domain_rule",
    "harmonic_action",
    "inverse_structural_operator_id",
    "conjugate_structural_operator_id",
    "semantic_status",
    "semantic_research_priority",
    "physical_mutation:boolean",
    "normalization_policy_json",
    "structural_fixture_ids:string[]",
    "semantic_effect_fixture_ids:string[]",
    "registry_version",
    ":LABEL",
  ],
  operators.map((operator) => ({
    "semantic_operator_id:ID(SemanticOperator)":
      operator.semanticOperatorId,
    release_id: operator.releaseId,
    structural_operator_id: operator.structuralOperatorId,
    notation: operator.notation,
    name: operator.name,
    operator_class: operator.operatorClass,
    "degree:int": operator.degree,
    degree_governor: operator.degreeGovernor,
    direction: operator.direction,
    domain_rule: operator.domainRule,
    harmonic_action: operator.harmonicAction.action,
    inverse_structural_operator_id: operator.inverseStructuralOperatorId,
    conjugate_structural_operator_id:
      operator.conjugateStructuralOperatorId,
    semantic_status: operator.semanticStatus,
    semantic_research_priority: operator.semanticResearchPriority,
    "physical_mutation:boolean":
      operator.physicalPolicy.mutatesPhysicalQuantities,
    normalization_policy_json: operator.normalizationPolicy,
    "structural_fixture_ids:string[]":
      operator.structuralFixtureIds.join(";"),
    "semantic_effect_fixture_ids:string[]":
      operator.semanticEffectFixtureIds.join(";"),
    registry_version: operator.registryVersion,
    ":LABEL": "SemanticOperator",
  })),
);

const unresolvedScopes = [
  {
    scopeId: "unresolved:canonical_feature_delta",
    label: "Canonical feature delta",
  },
  {
    scopeId: "unresolved:domain_projection_delta",
    label: "Domain projection delta",
  },
  {
    scopeId: "unresolved:semantic_compression_delta",
    label: "Semantic compression delta",
  },
  {
    scopeId: "unresolved:semantic_commutation_after_normalization",
    label: "Semantic commutation after normalization",
  },
];
writeCsv(
  "neo4j/csv/semantic-unresolved-scopes.csv",
  ["scope_id:ID(SemanticUnresolvedScope)", "label", "status", ":LABEL"],
  unresolvedScopes.map((scope) => ({
    "scope_id:ID(SemanticUnresolvedScope)": scope.scopeId,
    label: scope.label,
    status: "unresolved",
    ":LABEL": "SemanticUnresolvedScope",
  })),
);
writeCsv(
  "neo4j/csv/semantic-operator-unresolved.csv",
  [
    "semantic_operator_id:START_ID(SemanticOperator)",
    "scope_id:END_ID(SemanticUnresolvedScope)",
    "status",
    ":TYPE",
  ],
  operators.flatMap((operator) =>
    operator.semanticEffects.unresolved.map((scope) => ({
      "semantic_operator_id:START_ID(SemanticOperator)":
        operator.semanticOperatorId,
      "scope_id:END_ID(SemanticUnresolvedScope)": `unresolved:${scope}`,
      status: "unresolved",
      ":TYPE": "HAS_UNRESOLVED_SCOPE",
    })),
  ),
);

writeCsv(
  "neo4j/csv/domain-projections.csv",
  [
    "projection_id:ID(DomainProjection)",
    "release_id",
    "domain",
    "status",
    "input_contract:string[]",
    "output_contract:string[]",
    "provenance_json",
    ":LABEL",
  ],
  projections.map((projection) => ({
    "projection_id:ID(DomainProjection)": projection.projectionId,
    release_id: registryRelease.releaseId,
    domain: projection.domain,
    status: projection.status,
    "input_contract:string[]": projection.inputContract.join(";"),
    "output_contract:string[]": projection.outputContract.join(";"),
    provenance_json: projection.provenance,
    ":LABEL": "DomainProjection",
  })),
);

const landformNames = [
  ...new Set(
    profiles.flatMap((profile) => profile.domainReferences.landforms),
  ),
].sort();
writeCsv(
  "neo4j/csv/landform-references.csv",
  ["landform_id:ID(LandformReference)", "name", "status", ":LABEL"],
  landformNames.map((name) => ({
    "landform_id:ID(LandformReference)": `landform:${sha256(name).slice(0, 16)}`,
    name,
    status: "canonical_reference",
    ":LABEL": "LandformReference",
  })),
);
writeCsv(
  "neo4j/csv/profile-landform-references.csv",
  [
    "profile_id:START_ID(CanonicalFeatureProfile)",
    "landform_id:END_ID(LandformReference)",
    "reference_order:int",
    "authority",
    ":TYPE",
  ],
  profiles.flatMap((profile) =>
    profile.domainReferences.landforms.map((name, index) => ({
      "profile_id:START_ID(CanonicalFeatureProfile)": profile.profileId,
      "landform_id:END_ID(LandformReference)": `landform:${sha256(name).slice(0, 16)}`,
      "reference_order:int": index,
      authority: "framework_declared",
      ":TYPE": "REFERENCES_LANDFORM",
    })),
  ),
);

const uniquePackets = [
  ...new Map(
    packets.map((packet) => [packet.intrinsicFingerprint, packet]),
  ).values(),
];
writeCsv(
  "neo4j/csv/compiled-profiles.csv",
  [
    "normal_form_id:ID(CompiledFeatureProfile)",
    "release_id",
    "state_id:int",
    "state_name",
    "office",
    "domain",
    "status",
    "intrinsic_fingerprint",
    "required_json",
    "soft_priors_json",
    "reference_pool_json",
    "promoted_json",
    "suppressed_json",
    "prohibited_json",
    "unresolved_json",
    "creative_affordances_json",
    "rendering_brief",
    ":LABEL",
  ],
  uniquePackets.map((packet) => ({
    "normal_form_id:ID(CompiledFeatureProfile)": packet.normalFormId,
    release_id: packet.releaseId,
    "state_id:int": packet.state.stateId,
    state_name: packet.state.name,
    office: packet.resolution.office,
    domain: packet.domainProjection.domain,
    status: packet.domainProjection.status,
    intrinsic_fingerprint: packet.intrinsicFingerprint,
    required_json: packet.creationConstraints.required,
    soft_priors_json: packet.creationConstraints.softPriors,
    reference_pool_json: packet.creationConstraints.referencePool,
    promoted_json: packet.creationConstraints.promoted,
    suppressed_json: packet.creationConstraints.suppressed,
    prohibited_json: packet.creationConstraints.prohibited,
    unresolved_json: packet.creationConstraints.unresolved,
    creative_affordances_json:
      packet.creationConstraints.creativeAffordances,
    rendering_brief: packet.domainProjection.renderingBrief,
    ":LABEL": "CompiledFeatureProfile",
  })),
);

writeCsv(
  "neo4j/csv/derivation-routes.csv",
  [
    "route_id:ID(DerivationRoute)",
    "release_id",
    "target_state_id:int",
    "operator_ids:string[]",
    "note",
    "excluded_from_fingerprint:boolean",
    ":LABEL",
  ],
  packets.map((packet) => ({
    "route_id:ID(DerivationRoute)": packet.routeContext.routeId,
    release_id: packet.releaseId,
    "target_state_id:int": packet.routeContext.targetId,
    "operator_ids:string[]":
      packet.routeContext.structuralOperatorIds.join(";"),
    note: packet.routeContext.note,
    "excluded_from_fingerprint:boolean":
      packet.routeContext.excludedFromIntrinsicFingerprint,
    ":LABEL": "DerivationRoute",
  })),
);

const routeSteps = packets.flatMap((packet) =>
  packet.routeContext.relationEvidence.map((edge, index) => ({
    stepId: `step:${packet.routeContext.routeId}:${index + 1}`,
    routeId: packet.routeContext.routeId,
    sequence: index + 1,
    sourceId: edge.sourceId,
    targetId: edge.targetId,
    operatorId: edge.operatorId,
    applicationStatus: edge.applicationStatus,
    structuralEdgeTypes: edge.structuralEdgeTypes,
    fieldEdgeTypes: edge.fieldEdgeTypes,
  })),
);
writeCsv(
  "neo4j/csv/derivation-steps.csv",
  [
    "step_id:ID(DerivationStep)",
    "route_id",
    "sequence:int",
    "source_state_id:int",
    "target_state_id:int",
    "structural_operator_id",
    "application_status",
    "structural_edge_types:string[]",
    "field_edge_types:string[]",
    ":LABEL",
  ],
  routeSteps.map((step) => ({
    "step_id:ID(DerivationStep)": step.stepId,
    route_id: step.routeId,
    "sequence:int": step.sequence,
    "source_state_id:int": step.sourceId,
    "target_state_id:int": step.targetId,
    structural_operator_id: step.operatorId,
    application_status: step.applicationStatus,
    "structural_edge_types:string[]": step.structuralEdgeTypes.join(";"),
    "field_edge_types:string[]": step.fieldEdgeTypes.join(";"),
    ":LABEL": "DerivationStep",
  })),
);

writeCsv(
  "neo4j/csv/validation-fixtures.csv",
  [
    "fixture_id:ID(ValidationFixture)",
    "release_id",
    "label",
    "fixture_class",
    "evidence_scope:string[]",
    "semantic_effect_evidence:boolean",
    "fixture_type",
    "target_state_id:int",
    "target_state_name",
    "expected_office",
    "route_ids:string[]",
    "normal_form_fingerprint",
    "assertion",
    "status",
    ":LABEL",
  ],
  fixtureIndex.fixtures.map((fixture) => ({
    "fixture_id:ID(ValidationFixture)": fixture.fixtureId,
    release_id: fixtureIndex.releaseId,
    label: fixture.label,
    fixture_class: fixture.fixtureClass,
    "evidence_scope:string[]": fixture.evidenceScope.join(";"),
    "semantic_effect_evidence:boolean":
      fixture.semanticEffectEvidence,
    fixture_type: fixture.fixtureType,
    "target_state_id:int": fixture.targetStateId,
    target_state_name: fixture.targetStateName,
    expected_office: fixture.expectedOffice,
    "route_ids:string[]": fixture.routes
      .map((route) => route.routeId)
      .join(";"),
    normal_form_fingerprint: fixture.normalFormFingerprint,
    assertion: fixture.assertion,
    status: fixture.status,
    ":LABEL": "ValidationFixture",
  })),
);

console.log(
  `Exported Neo4j CSV for ${profiles.length} profiles, ${operators.length} semantic operator shells, ${uniquePackets.length} normal forms, ${packets.length} routes, and ${routeSteps.length} steps.`,
);
