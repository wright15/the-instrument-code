import {
  asArray,
  readJson,
  readText,
  readYaml,
  sha256,
  writeJson,
} from "./lib.mjs";

const VERSION = "0.1.1";
const GENERATED_AT = "2026-07-30";
const RELEASE_ID = `canonical-profile-registry:${VERSION}`;
const C = 299_792_458;
const H = 6.626_070_15e-34;
const ELECTRON_VOLT_J = 1.602_176_634e-19;

const governorsSource = readYaml("source/governors.yaml");
const network = readJson("source/universal-network-data.json");
const operatorCandidates = readJson("source/operator-candidates.json");

const sourceHashes = Object.fromEntries(
  [
    "source/governors.yaml",
    "source/universal-network-data.json",
    "source/topology-identity-definitions.json",
    "source/operator-candidates.json",
    "source/operator-applications.csv",
    "source/framework/AGENTS.md",
    "source/framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md",
    "source/framework/TOPOLOGICAL_ANCHORING.md",
    "source/framework/NATURAL_ORGANIZATION_THESIS.md",
  ].map((sourcePath) => [sourcePath, sha256(readText(sourcePath))]),
);
const releaseFingerprint = sha256({
  version: VERSION,
  sourceHashes,
});

const officeOrder = network.officeOrder;
const governorByName = new Map(
  Object.values(governorsSource.governors).map((governor) => [
    governor.display_name,
    governor,
  ]),
);
const nodeById = new Map(network.nodes.map((node) => [node.id, node]));
const governorRowByName = new Map(
  network.governorRows.map((row) => [row.Office, row]),
);

const wavelengths = officeOrder.map(
  (office) => governorByName.get(office).canonical_expression.wavelength_nm,
);
const longestWavelength = Math.max(...wavelengths);
const shortestWavelength = Math.min(...wavelengths);
const inverseMin = 1 / longestWavelength;
const inverseMax = 1 / shortestWavelength;

function sourceRef(pointer) {
  return {
    artifact: "source/governors.yaml",
    pointer,
    authority: "framework_declared",
  };
}

function derivedRef(formula) {
  return {
    artifact: "scripts/build-registry.mjs",
    authority: "physically_derived_from_framework_anchor",
    formula,
  };
}

function implementationRef(description) {
  return {
    artifact: "scripts/build-registry.mjs",
    authority: "registry_coordinate_convention",
    description,
  };
}

const featureDefinitions = [
  {
    featureId: "physical.wavelength_nm",
    label: "Representative wavelength",
    layer: "physical",
    epistemicClass: "framework_declared_physical_anchor",
    dataType: "number",
    unit: "nm",
    operatorScope: "office",
    domainScope: ["all"],
    description:
      "Representative optical wavelength assigned to a Governor office. It is not caused by musical mutation.",
  },
  {
    featureId: "physical.frequency_hz",
    label: "Optical frequency",
    layer: "physical",
    epistemicClass: "physically_derived",
    dataType: "number",
    unit: "Hz",
    operatorScope: "office",
    domainScope: ["all"],
    description: "Vacuum frequency c/λ derived from the representative wavelength.",
  },
  {
    featureId: "physical.photon_energy_j",
    label: "Photon energy",
    layer: "physical",
    epistemicClass: "physically_derived",
    dataType: "number",
    unit: "J",
    operatorScope: "office",
    domainScope: ["all"],
    description: "Single-photon energy hν derived from the representative wavelength.",
  },
  {
    featureId: "physical.photon_energy_ev",
    label: "Photon energy",
    layer: "physical",
    epistemicClass: "physically_derived",
    dataType: "number",
    unit: "eV",
    operatorScope: "office",
    domainScope: ["all"],
    description: "Single-photon energy expressed in electron-volts.",
  },
  {
    featureId: "physical.C_P",
    label: "Photonic compression coordinate",
    layer: "physical",
    epistemicClass: "physical_anchor_plus_normalization_convention",
    dataType: "number",
    unit: "normalized_inverse_wavelength",
    operatorScope: "office",
    domainScope: ["all"],
    description:
      "Inverse-wavelength coordinate normalized across the seven declared office anchors. Sun=0 and Saturn=1 are a registry coordinate convention, not absolute physical endpoints.",
  },
  {
    featureId: "harmonic.canonical_scale_state",
    label: "Canonical scale state",
    layer: "harmonic",
    epistemicClass: "formally_audited",
    dataType: "integer",
    unit: null,
    operatorScope: "state",
    domainScope: ["all"],
    description: "Rooted scale-state identifier of the canonical A0 office anchor.",
  },
  {
    featureId: "harmonic.pitch_mask",
    label: "Rooted pitch mask",
    layer: "harmonic",
    epistemicClass: "formally_audited",
    dataType: "string",
    unit: "12-bit mask",
    operatorScope: "state",
    domainScope: ["all"],
    description: "Rooted twelve-position binary representation.",
  },
  {
    featureId: "harmonic.forte_family",
    label: "Forte family",
    layer: "harmonic",
    epistemicClass: "formally_audited",
    dataType: "string",
    unit: null,
    operatorScope: "family",
    domainScope: ["all"],
    description: "Forte set-class membership.",
  },
  {
    featureId: "harmonic.anchor_tier",
    label: "Anchor tier",
    layer: "harmonic",
    epistemicClass: "framework_validated_topology",
    dataType: "string",
    unit: null,
    operatorScope: "state",
    domainScope: ["all"],
    description: "Validated anchoring stratum such as A0, A1, A2, or D1–D7.",
  },
  {
    featureId: "harmonic.C_H",
    label: "Harmonic compression coordinate",
    layer: "harmonic",
    epistemicClass: "unresolved_measure",
    dataType: "number_or_null",
    unit: "method_dependent",
    operatorScope: "state_or_family",
    domainScope: ["all"],
    description:
      "Reserved harmonic coordinate. Registry v0.1.1 deliberately supplies no aggregate formula.",
  },
  {
    featureId: "semantic.thermodynamic_function",
    label: "Thermodynamic correspondence",
    layer: "semantic",
    epistemicClass: "authored_correspondence",
    dataType: "string",
    unit: null,
    operatorScope: "office",
    domainScope: ["all"],
    description:
      "Framework-authored process correspondence; not a claim of physical causation.",
  },
  {
    featureId: "semantic.optical_function",
    label: "Optical correspondence",
    layer: "semantic",
    epistemicClass: "authored_correspondence",
    dataType: "string",
    unit: null,
    operatorScope: "office",
    domainScope: ["all"],
    description:
      "Framework-authored optical metaphor/correspondence distinct from measured wavelength.",
  },
  {
    featureId: "semantic.directionality",
    label: "Directionality",
    layer: "semantic",
    epistemicClass: "authored_correspondence",
    dataType: "string",
    unit: null,
    operatorScope: "office",
    domainScope: ["all"],
    description: "Canonical inward, outward, or mediating orientation.",
  },
  {
    featureId: "semantic.archetypal_role",
    label: "Archetypal role",
    layer: "semantic",
    epistemicClass: "authored_correspondence",
    dataType: "string",
    unit: null,
    operatorScope: "office",
    domainScope: ["all"],
    description: "Canonical role statement for the Governor.",
  },
  {
    featureId: "semantic.element",
    label: "Element",
    layer: "semantic",
    epistemicClass: "authored_correspondence",
    dataType: "string_or_null",
    unit: null,
    operatorScope: "office",
    domainScope: ["all"],
    description: "Declared elemental correspondence where present.",
  },
  {
    featureId: "semantic.zodiacal_systems",
    label: "Zodiacal systems",
    layer: "semantic",
    epistemicClass: "authored_correspondence",
    dataType: "object",
    unit: null,
    operatorScope: "office",
    domainScope: ["all"],
    description: "External/internal system records declared under an office.",
  },
  {
    featureId: "semantic.C_S",
    label: "Semantic compression coordinate",
    layer: "semantic",
    epistemicClass: "framework_order_plus_registry_coordinate_convention",
    dataType: "object",
    unit: "ordered_category_nonmetric",
    operatorScope: "office",
    domainScope: ["all"],
    description:
      "Ordered position along the declared Sun→Saturn process canon. The optional 0–1 normalization is non-metric and does not assert equal semantic distance.",
  },
  ...[
    ["landforms", "Landform references"],
    ["architecture", "Architecture references"],
    ["botany", "Botanical references"],
    ["material", "Material references"],
    ["color_associations", "Color references"],
    ["symbolic_references", "Symbolic references"],
  ].map(([key, label]) => ({
    featureId: `domain.${key}`,
    label,
    layer: "domain",
    epistemicClass: "canonical_reference_library",
    dataType: "array",
    unit: null,
    operatorScope: "office",
    domainScope: [key === "landforms" ? "landforms" : "cross_domain"],
    description: `Canonical ${label.toLowerCase()} declared in the Governor reference library.`,
  })),
  ...[
    ["required_features", "Required features"],
    ["soft_priors", "Soft priors"],
    ["reference_pool", "Reference pool"],
    ["promoted_features", "Promoted features"],
    ["suppressed_features", "Suppressed features"],
    ["prohibited_features", "Prohibited features"],
    ["unresolved_features", "Unresolved features"],
    ["creative_affordances", "Creative affordances"],
  ].map(([key, label]) => ({
    featureId: `generative.${key}`,
    label,
    layer: "generative",
    epistemicClass: "compiled_constraint",
    dataType: "array",
    unit: null,
    operatorScope: "compiled_profile",
    domainScope: ["all"],
    description: `${label} emitted by the deterministic compiler.`,
  })),
].map((definition) => ({
  ...definition,
  source:
    definition.epistemicClass === "physically_derived" ||
    definition.epistemicClass ===
      "physical_anchor_plus_normalization_convention"
      ? derivedRef("See photonic-records.json calculation policy.")
      : {
          artifact:
            "source/framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md",
          authority: "framework_specification",
        },
}));

const featureRegistry = {
  schemaVersion: "1.0.0",
  registryVersion: VERSION,
  releaseId: RELEASE_ID,
  generatedAt: GENERATED_AT,
  status: "canonical_fields_plus_explicit_unresolved_slots",
  invariants: [
    "Physical, harmonic, semantic, domain, and generative fields retain distinct epistemic classes.",
    "State Governor is a node/profile identity; Degree Governor is an operator/edge label.",
    "CQ and SQ, when added, are properties of a Forte family under a declared tuning.",
    "An empty semantic effect is preferable to an invented effect.",
    "Route history is excluded from an intrinsic normal-form fingerprint.",
    "C_S ordering is canonical; its normalized ordinal is a non-metric registry convention.",
    "Reference-pool entities are candidates, not requirements that must all appear.",
  ],
  definitions: featureDefinitions,
};

const photonicRecords = [];
const profiles = [];

for (const [officeIndex, office] of officeOrder.entries()) {
  const governor = governorByName.get(office);
  if (!governor) throw new Error(`Missing Governor source record for ${office}`);
  const row = governorRowByName.get(office);
  const canonicalState = nodeById.get(row["A0 ID"]);
  const canonical = governor.canonical_expression;
  const archetype = governor.archetype ?? {};
  const library = governor.reference_library ?? {};
  const wavelengthNm = Number(canonical.wavelength_nm);
  const wavelengthM = wavelengthNm * 1e-9;
  const frequencyHz = C / wavelengthM;
  const photonEnergyJ = H * frequencyHz;
  const photonEnergyEv = photonEnergyJ / ELECTRON_VOLT_J;
  const photonicCompression =
    (1 / wavelengthNm - inverseMin) / (inverseMax - inverseMin);
  const photonicId = `photonic:${office.toLowerCase()}:v${VERSION}`;
  const profileId = `profile:${office.toLowerCase()}:v${VERSION}`;

  photonicRecords.push({
    photonicId,
    releaseId: RELEASE_ID,
    office,
    officeIndex,
    representativeWavelengthNm: wavelengthNm,
    vacuumFrequencyHz: frequencyHz,
    photonEnergyJ,
    photonEnergyEv,
    photonicCompression: photonicCompression,
    coordinateSymbol: "C_P",
    calculation: {
      constants: {
        speedOfLightMS: C,
        planckConstantJS: H,
        electronVoltJ: ELECTRON_VOLT_J,
      },
      formulas: {
        frequency: "c / (wavelength_nm * 1e-9)",
        photonEnergy: "h * frequency_hz",
        photonicCompression:
          "(1/lambda - 1/700nm) / (1/400nm - 1/700nm)",
      },
    },
    interpretationPolicy: {
      status: "representative_office_anchor",
      inheritedBySeatedState: true,
      mutatedByMusicalOperator: false,
      causationClaim: false,
      note:
        "The wavelength is framework-declared. Frequency and energy are physical calculations from that value. The office correspondence is authored.",
    },
    provenance: [
      sourceRef(`governors.${office.toLowerCase()}.canonical_expression.wavelength_nm`),
      derivedRef("nu=c/lambda; E=h*nu"),
    ],
  });

  const assertions = [
    ["physical.wavelength_nm", wavelengthNm],
    ["physical.frequency_hz", frequencyHz],
    ["physical.photon_energy_j", photonEnergyJ],
    ["physical.photon_energy_ev", photonEnergyEv],
    ["physical.C_P", photonicCompression],
    ["harmonic.canonical_scale_state", canonicalState.id],
    ["harmonic.pitch_mask", canonicalState.bit],
    ["harmonic.forte_family", canonicalState.forte],
    ["harmonic.anchor_tier", canonicalState.tier],
    ["harmonic.C_H", null],
    ["semantic.thermodynamic_function", canonical.thermodynamic_function],
    ["semantic.optical_function", canonical.optical_function],
    ["semantic.directionality", archetype.directionality],
    [
      "semantic.archetypal_role",
      archetype.luminary_role ?? archetype.engine_function ?? null,
    ],
    ["semantic.element", archetype.element ?? null],
    ["semantic.zodiacal_systems", governor.zodiacal_systems ?? {}],
    [
      "semantic.C_S",
      {
        orderedPosition: officeIndex + 1,
        orderedProcess: canonical.thermodynamic_function,
        normalizedOrdinal: officeIndex / (officeOrder.length - 1),
        metric: false,
        status: "framework_order_plus_registry_coordinate_convention",
      },
    ],
    ["domain.landforms", asArray(library.landforms)],
    ["domain.architecture", asArray(library.architecture)],
    ["domain.botany", asArray(library.botany)],
    ["domain.material", asArray(library.material)],
    ["domain.color_associations", asArray(library.color_associations)],
    ["domain.symbolic_references", asArray(library.symbolic_references)],
  ].map(([featureId, value]) => ({
    featureId,
    value,
    provenance:
      featureId.startsWith("physical.") && featureId !== "physical.wavelength_nm"
        ? derivedRef("Derived from declared wavelength.")
        : featureId === "semantic.C_S"
          ? {
              authority:
                "framework_order_plus_registry_coordinate_convention",
              sources: [
                sourceRef(
                  `governors.${office.toLowerCase()}.canonical_expression.thermodynamic_function`,
                ),
                implementationRef(
                  "The ordered position is exposed as a non-metric normalized ordinal.",
                ),
              ],
            }
          : sourceRef(`governors.${office.toLowerCase()}`),
  }));

  const profile = {
    profileId,
    profileVersion: VERSION,
    releaseId: RELEASE_ID,
    office,
    officeIndex,
    symbol: governor.symbol,
    type: governor.type,
    canonicalIdentity: {
      stateId: canonicalState.id,
      stateName: canonicalState.name,
      mode: canonical.mode,
      forteFamily: canonicalState.forte,
      pitchMask: canonicalState.bit,
      pitchSet: canonicalState.pitchSet,
      anchorTier: canonicalState.tier,
      chirality: canonicalState.chirality,
      assignmentStatus: canonicalState.assignmentStatus,
    },
    physical: {
      photonicId,
      wavelengthNm,
      color: canonical.color,
      physicalExtension: governor.physical_extension ?? {},
      interpretationPolicy: "office_anchor_not_musical_causation",
    },
    harmonic: {
      stateGovernor: office,
      canonicalMode: canonical.mode,
      canonicalStateId: canonicalState.id,
      binary12Bit: canonical.binary_12bit,
      constructiveEncoding: {
        binary: canonical.binary_constructive,
        decimal: canonical.decimal_constructive,
        hex: canonical.hex_constructive,
      },
      observationalEncoding: {
        binary: canonical.binary_observational,
        decimal: canonical.decimal_observational,
        hex: canonical.hex_observational,
      },
      bitWeight: canonical.bit_weight,
      compressionDerived: canonical.compression_derived,
      harmonicCompression: {
        coordinateSymbol: "C_H",
        status: "unresolved",
        value: null,
        reason:
          "No aggregate harmonic-compression formula has yet been admitted to canon.",
      },
    },
    semantic: {
      thermodynamicFunction: canonical.thermodynamic_function,
      opticalFunction: canonical.optical_function,
      directionality: archetype.directionality,
      archetypalRole:
        archetype.luminary_role ?? archetype.engine_function ?? null,
      element: archetype.element ?? null,
      mythologyLayer: archetype.mythology_layer ?? null,
      zodiacalSystems: governor.zodiacal_systems ?? {},
      expressionVariants: governor.expression_variants ?? {},
      semanticCompression: {
        coordinateSymbol: "C_S",
        status: "framework_order_plus_registry_coordinate_convention",
        orderedPosition: officeIndex + 1,
        orderedProcess: canonical.thermodynamic_function,
        normalizedOrdinal: officeIndex / (officeOrder.length - 1),
        metric: false,
        scale: "declared Sun-to-Saturn process order",
        physicalClaim: false,
      },
    },
    domainReferences: {
      landforms: asArray(library.landforms),
      architecture: asArray(library.architecture),
      botany: asArray(library.botany),
      material: asArray(library.material),
      colorAssociations: asArray(library.color_associations),
      symbolicReferences: asArray(library.symbolic_references),
      rawReferenceLibrary: library,
    },
    featureAssertions: assertions,
    provenance: {
      authority: "framework_declared_and_topology_audited",
      sources: [
        sourceRef(`governors.${office.toLowerCase()}`),
        {
          artifact: "source/universal-network-data.json",
          pointer: `governorRows[Office=${office}]`,
          authority: "topology_audit",
        },
      ],
    },
  };
  profile.intrinsicFingerprint = sha256({
    profileId: profile.profileId,
    canonicalIdentity: profile.canonicalIdentity,
    physical: profile.physical,
    harmonic: profile.harmonic,
    semantic: profile.semantic,
    domainReferences: profile.domainReferences,
  });
  profiles.push(profile);
}

const canonicalProfiles = {
  schemaVersion: "1.0.0",
  registryVersion: VERSION,
  releaseId: RELEASE_ID,
  generatedAt: GENERATED_AT,
  profileCount: profiles.length,
  officeOrder,
  status: "canonical_profile_registry_v0.1.1",
  profiles,
};

const harmonicMeasureDefinitions = {
  schemaVersion: "1.0.0",
  registryVersion: VERSION,
  releaseId: RELEASE_ID,
  generatedAt: GENERATED_AT,
  aggregateHarmonicCompression: {
    symbol: "C_H",
    status: "unresolved",
    value: null,
    admissionRule:
      "A candidate C_H formula must declare domain, tuning, normalization, invariances, failure cases, and regression fixtures before promotion.",
  },
  measures: [
    {
      measureId: "rooted_hamming_distance",
      status: "active",
      scope: "ScaleState_pair",
      tuningRequirement: "12-TET rooted 12-bit representation",
      definition: "Population count of XOR between two rooted 12-bit masks.",
      topologyUse: "fixed-tonic one-tone exchange uses dH=2",
    },
    {
      measureId: "raw_exchange_hamming",
      status: "active",
      scope: "unrooted_pitch_set_pair",
      tuningRequirement: "12-TET",
      definition: "Cardinality of the symmetric difference of two pitch-class sets.",
      topologyUse: "single-pitch exchange validation",
    },
    {
      measureId: "common_tone_count",
      status: "candidate",
      scope: "ScaleState_pair",
      tuningRequirement: "declared pitch representation",
      definition: "Cardinality of pitch-set intersection.",
      topologyUse: "possible local affinity descriptor; not C_H",
    },
    {
      measureId: "interval_vector",
      status: "active_descriptor",
      scope: "ScaleFamily",
      tuningRequirement: "12-TET",
      definition: "Six-entry interval-class vector.",
      topologyUse: "family-level structural descriptor; not an office value",
    },
    {
      measureId: "carey_CQ",
      status: "reserved_external_measure",
      scope: "ScaleFamily_under_tuning",
      tuningRequirement: "must be declared",
      definition: "Carey coherence quotient, when computed under a declared tuning.",
      topologyUse: "family/tuning property only; never copied to a Governor state as such",
    },
    {
      measureId: "carey_SQ",
      status: "reserved_external_measure",
      scope: "ScaleFamily_under_tuning",
      tuningRequirement: "must be declared",
      definition: "Carey simplicity quotient, when computed under a declared tuning.",
      topologyUse: "family/tuning property only; never copied to a Governor state as such",
    },
    {
      measureId: "anchor_distance",
      status: "active",
      scope: "ScaleState_to_anchor",
      tuningRequirement: "12-TET rooted topology",
      definition: "Declared eligible relation distance and tier-precedence record.",
      topologyUse: "anchor/satellite/boundary resolution",
    },
    {
      measureId: "modal_phase",
      status: "active",
      scope: "ScaleState_in_family_orbit",
      tuningRequirement: "ordered rooted scale",
      definition: "Successor index under modal re-rooting M.",
      topologyUse: "phase closure and covariance testing",
    },
    {
      measureId: "fourier_pitch_class_descriptor",
      status: "candidate_uncomputed",
      scope: "ScaleState_or_family",
      tuningRequirement: "explicit transform convention",
      definition: "Discrete Fourier descriptor of pitch-class occupancy.",
      topologyUse: "candidate C_H input; not admitted in registry v0.1.1",
    },
  ],
};

const fixtureOperators = new Set(["M", "R4", "R6", "L6", "R7", "L7"]);
const prioritySemanticOperators = new Set(["R4", "L4", "R7", "L7"]);
const semanticOperators = operatorCandidates.operators.map((operator) => {
  const fixtureBacked = fixtureOperators.has(operator.operator_id);
  const unresolved = [
    "canonical_feature_delta",
    "domain_projection_delta",
    "semantic_compression_delta",
    "semantic_commutation_after_normalization",
  ];
  return {
    semanticOperatorId: `semantic:${operator.operator_id}:v${VERSION}`,
    registryVersion: VERSION,
    releaseId: RELEASE_ID,
    structuralOperatorId: operator.operator_id,
    notation: operator.notation,
    name: operator.name,
    operatorClass: operator.operator_class,
    degree: operator.degree,
    degreeGovernor: operator.degree_governor,
    direction: operator.direction,
    domainRule: operator.domain_rule,
    harmonicAction: {
      status: "structurally_validated",
      action: operator.action,
      partial: operator.partial,
      applicationCount: operator.application_count,
      domainSize: operator.domain_size,
      imageSize: operator.image_size,
      structuralSupportCount: operator.structural_support_count,
      fieldSupportCount: operator.field_support_count,
    },
    inverseStructuralOperatorId: operator.inverse_operator_id,
    conjugateStructuralOperatorId: operator.conjugate_operator_id,
    semanticStatus: fixtureBacked
      ? "structural_fixture_backed_semantics_unresolved"
      : "structural_operator_semantics_unresolved",
    semanticResearchPriority: prioritySemanticOperators.has(operator.operator_id)
      ? "priority_v0.1_sun_moon_axis"
      : "standard",
    semanticEffects: {
      preserves: [],
      transforms: [],
      promotes: [],
      suppresses: [],
      prohibits: [],
      unresolved,
    },
    physicalPolicy: {
      mutatesPhysicalQuantities: false,
      targetResolution:
        "The compiled destination state resolves the photonic anchor of its own Governor office.",
      prohibitedInference:
        "Do not infer that musical pitch mutation physically changes optical wavelength.",
    },
    normalizationPolicy: {
      destinationDefinesIntrinsicProfile: true,
      routeHistoryStoredSeparately: true,
      confluenceRequired: true,
    },
    structuralFixtureIds: {
      M: ["fixture:aeolian-modal-covariance"],
      R4: [
        "fixture:acoustic-confluence",
        "fixture:lydian-minor-midpoint",
      ],
      R6: ["fixture:aeolian-modal-covariance"],
      L6: ["fixture:lydian-minor-midpoint"],
      R7: [
        "fixture:harmonic-minor-satellite",
        "fixture:aeolian-modal-covariance",
      ],
      L7: ["fixture:acoustic-confluence"],
    }[operator.operator_id] ?? [],
    semanticEffectFixtureIds: [],
    provenance: {
      structural: "source/operator-candidates.json",
      semantic:
        "source/framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md",
      authority:
        "structural_action_validated; semantic_effects_explicitly_unresolved",
    },
  };
});

const semanticOperatorRegistry = {
  schemaVersion: "1.0.0",
  registryVersion: VERSION,
  releaseId: RELEASE_ID,
  generatedAt: GENERATED_AT,
  status: "structural_operators_bound_semantic_effects_unresolved",
  operatorCount: semanticOperators.length,
  admissionPolicy: {
    minimumEvidence: [
      "named source and target feature",
      "direction of effect",
      "domain restriction",
      "normalization behavior",
      "inverse or declared irreversibility",
      "at least one positive fixture",
      "at least one counterexample or failure boundary",
    ],
    default: "unresolved",
    prohibition:
      "No semantic effect may be inferred solely from a harmonic edge, a Degree Governor label, or a photonic coordinate.",
  },
  operators: semanticOperators,
};

const domainProjectionRegistry = {
  schemaVersion: "1.0.0",
  registryVersion: VERSION,
  releaseId: RELEASE_ID,
  generatedAt: GENERATED_AT,
  projections: [
    {
      projectionId: `projection:landforms:v${VERSION}`,
      domain: "landforms",
      status: "canonical_reference_projection",
      inputContract: [
        "resolved ScaleState",
        "resolved Governor office or explicit unresolved office",
        "canonical profile",
        "optional derivation route",
      ],
      outputContract: [
        "requiredFeatures",
        "softPriors",
        "referencePool",
        "promotedFeatures",
        "suppressedFeatures",
        "prohibitedFeatures",
        "unresolvedFeatures",
        "creativeAffordances",
        "provenance",
      ],
      rules: profiles.map((profile) => ({
        office: profile.office,
        canonicalReferences: profile.domainReferences.landforms,
        status: "framework_declared_reference_set",
        semanticMutationPolicy:
          "No operator-specific landform delta is admitted in v0.1.1.",
      })),
      provenance: {
        artifact: "source/governors.yaml",
        pointer: "governors.*.reference_library.landforms",
        authority: "framework_declared",
      },
    },
  ],
};

const sourceAuthorityRegistry = {
  schemaVersion: "1.0.0",
  registryVersion: VERSION,
  releaseId: RELEASE_ID,
  generatedAt: GENERATED_AT,
  policy:
    "Authoring sources own declared canon; audited topology owns structural resolution; compiled registries are deterministic projections; Neo4j is the integrated runtime view.",
  authorityMatrix: [
    {
      claimClass: "canonical_governor_identity_and_semantics",
      authority: "source/governors.yaml plus current framework documents",
    },
    {
      claimClass: "scale_state_topology_and_office_resolution",
      authority: "source/universal-network-data.json",
    },
    {
      claimClass: "structural_mutation_behavior",
      authority:
        "source/operator-candidates.json and source/operator-applications.csv",
    },
    {
      claimClass: "compiled_coordinates_and_normal_forms",
      authority: "versioned deterministic build scripts",
    },
    {
      claimClass: "runtime_hypotheses_and_observations",
      authority: "separate Mercury/Virgo ledger; never canonical by default",
    },
  ],
  consumedSources: Object.entries(sourceHashes).map(([artifact, hash]) => ({
    artifact,
    sha256: hash,
    packaged: true,
  })),
  legacyReferences: [
    "CONSTITUTION.md",
    "UNIFIED_PROCESS_ONTOLOGY.md",
    "schemas/vector_b_physics.yaml",
    "schemas/physical_phenomena.yaml",
    "schemas/color_palettes.yaml",
    "schemas/zodiacal_systems.yaml",
    "schemas/governors.yaml",
  ].map((target) => ({
    target,
    packaged: false,
    status: "legacy_or_external_reference_unresolved",
    runtimeAuthority: false,
  })),
  governorYamlPolicy: {
    status: "frozen_authoring_input_snapshot",
    runtimeReadsDirectly: false,
    note:
      "File-backed builds consume this snapshot. Integrated runtime compilation uses the provider contract and should use the Neo4j provider.",
  },
};

const registryRelease = {
  schemaVersion: "1.0.0",
  registryName: "seven-governors-canonical-feature-profile-registry",
  registryVersion: VERSION,
  releaseId: RELEASE_ID,
  generatedAt: GENERATED_AT,
  activeByDefault: true,
  releaseFingerprint,
  sourceHashes,
  compatibility: {
    priorRelease: "canonical-profile-registry:0.1.0",
    topologySchema: network.schemaVersion,
    providerContract: "1.0.0",
  },
};

writeJson("canonical/feature-registry.json", featureRegistry);
writeJson("canonical/photonic-records.json", {
  schemaVersion: "1.0.0",
  registryVersion: VERSION,
  releaseId: RELEASE_ID,
  generatedAt: GENERATED_AT,
  recordCount: photonicRecords.length,
  records: photonicRecords,
});
writeJson("canonical/canonical-governor-profiles.json", canonicalProfiles);
writeJson(
  "canonical/harmonic-measure-definitions.json",
  harmonicMeasureDefinitions,
);
writeJson(
  "canonical/semantic-operator-registry.json",
  semanticOperatorRegistry,
);
writeJson(
  "canonical/domain-projection-registry.json",
  domainProjectionRegistry,
);
writeJson(
  "canonical/source-authority-registry.json",
  sourceAuthorityRegistry,
);
writeJson("canonical/registry-release.json", registryRelease);

console.log(
  `Built ${profiles.length} canonical profiles, ${featureDefinitions.length} feature definitions, ${photonicRecords.length} photonic records, and ${semanticOperators.length} semantic operator shells.`,
);
