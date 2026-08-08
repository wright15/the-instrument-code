import { sha256, stableStringify } from "./lib.mjs";
import { FileRegistryProvider } from "./providers/file-registry-provider.mjs";

const VERSION = "0.1.1";

function compileLandforms(state, profile, projection) {
  if (!profile) {
    const requiredFeatures = [
      {
        featureId: "harmonic.scale_state",
        value: state.id,
        reason: "The rooted harmonic identity remains known.",
      },
    ];
    return {
      domain: "landforms",
      projectionId: projection.projectionId,
      status: "unresolved_office",
      canonicalReferences: [],
      requiredFeatures,
      softPriors: [],
      referencePool: [],
      promotedFeatures: [],
      suppressedFeatures: [],
      prohibitedFeatures: [
        {
          featureId: "semantic.governor_office",
          reason:
            "Boundary states do not receive a categorical office by default.",
        },
      ],
      unresolvedFeatures: [
        "governor_office",
        "canonical_semantic_profile",
        "landform_projection",
      ],
      creativeAffordances: [
        "Non-Governor-specific surface realization may be explored if it does not imply a categorical office.",
      ],
      renderingBrief:
        "Preserve the rooted harmonic identity, but do not assign a Governor-specific landform vocabulary until an office is formally resolved.",
    };
  }

  const landforms = profile.domainReferences.landforms;
  const requiredFeatures = [
    {
      featureId: "harmonic.scale_state",
      value: state.id,
      reason: "Intrinsic rooted state identity.",
    },
    {
      featureId: "semantic.governor_office",
      value: profile.office,
      reason: "Resolved State Governor.",
    },
    {
      featureId: "semantic.thermodynamic_function",
      value: profile.semantic.thermodynamicFunction,
      reason: "Canonical office process correspondence.",
    },
    {
      featureId: "semantic.directionality",
      value: profile.semantic.directionality,
      reason: "Canonical office orientation.",
    },
  ];
  const softPriors = [
    {
      featureId: "semantic.archetypal_role",
      value: profile.semantic.archetypalRole,
      reason:
        "Guide salience and interpretation without requiring literal depiction.",
    },
  ].filter((prior) => prior.value != null);
  const referencePool = [
    {
      poolId: `landforms:${profile.office.toLowerCase()}:canonical`,
      featureId: "domain.landforms",
      candidates: landforms,
      selectionRule: "select_zero_or_more_without_implying_exhaustiveness",
      authority: "framework_declared_reference_library",
    },
  ];
  const creativeAffordances = [
    "composition",
    "scale",
    "weather",
    "material",
    "viewpoint",
    "inhabitants",
    "surface detail",
  ];

  return {
    domain: "landforms",
    projectionId: projection.projectionId,
    status: "canonical_reference_projection",
    canonicalReferences: landforms,
    requiredFeatures,
    softPriors,
    referencePool,
    promotedFeatures: [],
    suppressedFeatures: [],
    prohibitedFeatures: [
      {
        featureId: "physical.musical_to_optical_causation",
        reason:
          "A musical mutation does not physically alter the representative wavelength.",
      },
      {
        featureId: "semantic.unproven_operator_effect",
        reason:
          "No promote/suppress/transform claim may be added without semantic admission evidence.",
      },
    ],
    unresolvedFeatures: [
      "operator_specific_semantic_delta_if_a_route_is_applied",
    ],
    creativeAffordances,
    renderingBrief: [
      `Resolve the creation in the ${profile.office} office.`,
      `Honor the canonical process correspondence “${profile.semantic.thermodynamicFunction}” and directionality “${profile.semantic.directionality}”.`,
      landforms.length
        ? `Select freely from, combine, or abstract the reference pool: ${landforms.join(", ")}.`
        : "No canonical landform reference pool is currently declared.",
      "Surface realization may vary within the listed creative affordances.",
      "Any mutation route remains provenance-only until its semantic feature delta is admitted.",
    ].join(" "),
  };
}

export function compileProfileFromContext({
  context,
  stateId,
  domain = "landforms",
  route = null,
}) {
  const {
    providerName,
    releaseId,
    state,
    profile,
    photonic,
    projection,
    semanticOperators,
  } = context;
  if (Number(state.id) !== Number(stateId)) {
    throw new Error(
      `Provider returned ScaleState ${state.id} for requested id ${stateId}.`,
    );
  }

  const operatorById = new Map(
    semanticOperators.map((operator) => [
      operator.structuralOperatorId,
      operator,
    ]),
  );
  let routeContext = null;
  if (route) {
    const structuralOperatorIds = route.operatorIds ?? [route.operatorId];
    const sourceIds = route.sourceIds ?? [route.sourceId];
    for (const operatorId of structuralOperatorIds) {
      if (!operatorById.has(operatorId)) {
        throw new Error(`Provider omitted route operator: ${operatorId}`);
      }
    }
    routeContext = {
      routeId:
        route.routeId ??
        `route:${sourceIds.join("-")}:${structuralOperatorIds.join("-")}:${state.id}`,
      sourceIds: sourceIds.map(Number),
      targetId: state.id,
      structuralOperatorIds,
      operatorAnnotations: structuralOperatorIds.map((operatorId) => {
        const operator = operatorById.get(operatorId);
        return {
          structuralOperatorId: operatorId,
          semanticOperatorId: operator.semanticOperatorId,
          degree: operator.degree,
          degreeGovernor: operator.degreeGovernor,
          direction: operator.direction,
          semanticStatus: operator.semanticStatus,
          semanticEffectEvidence: false,
        };
      }),
      relationEvidence: route.relationEvidence ?? [],
      note: route.note ?? null,
      excludedFromIntrinsicFingerprint: true,
    };
  }

  const domainPacket =
    domain === "landforms"
      ? compileLandforms(state, profile, projection)
      : null;
  if (!domainPacket) {
    throw new Error(`Unsupported domain projection: ${domain}`);
  }

  const intrinsic = {
    schemaVersion: "1.0.0",
    compilerVersion: VERSION,
    releaseId,
    normalFormId: `nf:scale:${state.id}:${domain}:v${VERSION}`,
    state: {
      stateId: state.id,
      name: state.name,
      forteFamily: state.forte,
      bit: state.bit,
      pitchSet: state.pitchSet,
      role: state.role,
      fineRole: state.fineRole,
      tier: state.tier ?? null,
      chirality: state.chirality,
      orientation: state.orientation,
      assignmentStatus: state.assignmentStatus,
      resolutionClass: state.resolutionClass,
    },
    resolution: {
      office: state.office ?? null,
      officeIndex: state.officeIndex ?? null,
      officeBearing: Boolean(state.office),
      officeBasis: state.officeBasis,
      officeStatus: state.officeStatus,
    },
    canonicalProfile: profile
      ? {
          profileId: profile.profileId,
          releaseId: profile.releaseId,
          office: profile.office,
          canonicalStateId: profile.canonicalIdentity.stateId,
          intrinsicFingerprint: profile.intrinsicFingerprint,
        }
      : null,
    photonic: photonic
      ? {
          photonicId: photonic.photonicId,
          representativeWavelengthNm:
            photonic.representativeWavelengthNm,
          vacuumFrequencyHz: photonic.vacuumFrequencyHz,
          photonEnergyEv: photonic.photonEnergyEv,
          photonicCompression: photonic.photonicCompression,
          coordinateSymbol: "C_P",
          normalizationStatus: "registry_coordinate_convention",
          inheritancePolicy: "resolved_from_state_governor_office",
          causationClaim: false,
        }
      : null,
    harmonic: {
      stateGovernor: state.office ?? null,
      rootedPitchMask: state.bit,
      forteFamily: state.forte,
      tier: state.tier ?? null,
      role: state.role,
      harmonicCompression: {
        coordinateSymbol: "C_H",
        status: "unresolved",
        value: null,
      },
    },
    semantic: profile
      ? {
          stateGovernor: profile.office,
          thermodynamicFunction:
            profile.semantic.thermodynamicFunction,
          opticalFunction: profile.semantic.opticalFunction,
          directionality: profile.semantic.directionality,
          archetypalRole: profile.semantic.archetypalRole,
          element: profile.semantic.element,
          semanticCompression: profile.semantic.semanticCompression,
        }
      : {
          stateGovernor: null,
          status: "unresolved_boundary_semantics",
        },
    domainProjection: domainPacket,
    creationConstraints: {
      required: domainPacket.requiredFeatures,
      softPriors: domainPacket.softPriors,
      referencePool: domainPacket.referencePool,
      promoted: domainPacket.promotedFeatures,
      suppressed: domainPacket.suppressedFeatures,
      prohibited: domainPacket.prohibitedFeatures,
      unresolved: domainPacket.unresolvedFeatures,
      creativeAffordances: domainPacket.creativeAffordances,
    },
    provenance: {
      releaseId,
      providerContract: "1.0.0",
      providerUsed: providerName,
      providerExcludedFromIntrinsicIdentity: true,
      stateAuthority: "audited topology",
      canonicalProfileAuthority: profile
        ? "active versioned canonical profile"
        : null,
      projectionAuthority: projection.projectionId,
      compiler: "scripts/compiler.mjs",
    },
  };

  const fingerprintInput = {
    ...intrinsic,
    provenance: {
      ...intrinsic.provenance,
      providerUsed: null,
    },
  };
  const intrinsicFingerprint = sha256(fingerprintInput);
  return {
    ...intrinsic,
    intrinsicFingerprint,
    fingerprintInputCanonicalJson: stableStringify(fingerprintInput),
    routeContext,
  };
}

export async function compileProfileWithProvider({
  provider,
  stateId,
  domain = "landforms",
  route = null,
}) {
  if (!provider || typeof provider.loadCompilationContext !== "function") {
    throw new Error(
      "A registry provider implementing loadCompilationContext is required.",
    );
  }
  const structuralOperatorIds = route
    ? route.operatorIds ?? [route.operatorId]
    : [];
  const context = await provider.loadCompilationContext({
    stateId: Number(stateId),
    domain,
    structuralOperatorIds,
  });
  return compileProfileFromContext({
    context,
    stateId,
    domain,
    route,
  });
}

export async function compileProfile(options) {
  return compileProfileWithProvider({
    provider: new FileRegistryProvider(),
    ...options,
  });
}
