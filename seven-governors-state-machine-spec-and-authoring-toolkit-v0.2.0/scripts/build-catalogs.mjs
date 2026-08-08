// Generates catalog/*.yaml from the authoritative release artifacts:
// the mutation algebra audit, the canonical topology, the profile registry,
// and the installed Cypher import files.
//
// These catalogs are derived explanatory checklists, never a second authority.
// Run: node scripts/build-catalogs.mjs
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const PACKAGE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const AUDIT_DIR = path.resolve(PACKAGE_ROOT, "..", "seven-governors-mutation-algebra-audit");
const REGISTRY_DIR = path.resolve(
  PACKAGE_ROOT,
  "..",
  "seven-governors-canonical-feature-profile-registry-v0.1.1",
);
const RELEASE_ROOT = path.resolve(PACKAGE_ROOT, "..");

function readCsv(relativePath) {
  const text = fs.readFileSync(path.join(AUDIT_DIR, relativePath), "utf8");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else if (character !== "\r") {
      field += character;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const [headers, ...body] = rows;
  return body.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
  );
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(RELEASE_ROOT, relativePath), "utf8"));
}

function readFile(relativePath, base = PACKAGE_ROOT) {
  return fs.readFileSync(path.join(base, relativePath), "utf8");
}

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function parseCypherRelationships(text) {
  const types = new Set();
  const regex = /\[[^:\]]*:([A-Z][A-Z0-9_]*)\]/g;
  for (const match of text.matchAll(regex)) {
    types.add(match[1].replace(/_2$/, "2"));
  }
  return [...types].sort();
}

const sources = [
  { artifact: "audit/operator-registry.csv", base: AUDIT_DIR },
  { artifact: "audit/operator-applications.csv", base: AUDIT_DIR },
  { artifact: "audit/inverse-witnesses.csv", base: AUDIT_DIR },
  { artifact: "audit/modal-covariance-witnesses.csv", base: AUDIT_DIR },
  { artifact: "audit/commutation-summary.csv", base: AUDIT_DIR },
  { artifact: "audit/commutative-squares.csv", base: AUDIT_DIR },
  { artifact: "audit/confluence-witnesses.csv", base: AUDIT_DIR },
  { artifact: "audit/counterexamples.csv", base: AUDIT_DIR },
  { artifact: "audit/cycle-identities.csv", base: AUDIT_DIR },
  { artifact: "audit/projection-coverage.csv", base: AUDIT_DIR },
  { artifact: "audit/structural-edge-validation.csv", base: AUDIT_DIR },
  { artifact: "audit/field-edge-validation.csv", base: AUDIT_DIR },
  { artifact: "audit/mutation-algebra-hypotheses.md", base: AUDIT_DIR },
  { artifact: "audit/stabilizer-results.csv", base: AUDIT_DIR },
  { artifact: "canonical/topology-identity-definitions.json", base: RELEASE_ROOT },
  { artifact: "canonical/universal-network-data.json", base: RELEASE_ROOT },
  { artifact: "neo4j/schema.cypher", base: RELEASE_ROOT },
  { artifact: "neo4j/import.cypher", base: RELEASE_ROOT },
  { artifact: "neo4j/provenance.cypher", base: RELEASE_ROOT },
  { artifact: "schemas/compiled-profile.schema.json", base: REGISTRY_DIR },
  { artifact: "schemas/canonical-profile.schema.json", base: REGISTRY_DIR },
  { artifact: "schemas/semantic-operator.schema.json", base: REGISTRY_DIR },
  { artifact: "neo4j/01_semantic_schema.cypher", base: REGISTRY_DIR },
  { artifact: "neo4j/02_semantic_import.cypher", base: REGISTRY_DIR },
  { artifact: "neo4j/algebra-import.cypher", base: AUDIT_DIR },
];

const sourceFingerprints = sources.map(({ artifact, base }) => ({
  artifact,
  sha256: sha256(readFile(artifact, base)),
}));

function generatedHeader() {
  return {
    tool: "scripts/build-catalogs.mjs",
    regenerated_at: new Date().toISOString(),
    admission:
      "derived_explanatory_catalog; the cited upstream artifacts remain authoritative",
    sources: sourceFingerprints,
  };
}

const operators = readCsv("audit/operator-registry.csv");
const coverage = readCsv("audit/projection-coverage.csv");
const commutation = readCsv("audit/commutation-summary.csv");
const cycles = readCsv("audit/cycle-identities.csv");
const inverseWitnesses = readCsv("audit/inverse-witnesses.csv");
const covarianceWitnesses = readCsv("audit/modal-covariance-witnesses.csv");
const squares = readCsv("audit/commutative-squares.csv");
const confluence = readCsv("audit/confluence-witnesses.csv");
const counterexamples = readCsv("audit/counterexamples.csv");
const structuralEdges = readCsv("audit/structural-edge-validation.csv");
const fieldEdges = readCsv("audit/field-edge-validation.csv");
const topologyIdentity = readJson("canonical/topology-identity-definitions.json");
const network = readJson("canonical/universal-network-data.json");

const operatorMap = new Map(operators.map((operator) => [operator.operator_id, operator]));
const coverageMap = new Map(coverage.map((row) => [row.operator_id, row]));

const classificationCounts = commutation.reduce((counts, row) => {
  counts[row.classification] = (counts[row.classification] ?? 0) + 1;
  return counts;
}, {});

const roleCycleCounts = cycles.reduce((counts, row) => {
  counts[row.role] = (counts[row.role] ?? 0) + 1;
  return counts;
}, {});

const sameSourceDiamonds = confluence.filter(
  (row) => row.witness_type === "same_source_direct_diamond" && row.result === "PASS",
).length;
const cospans = confluence.filter(
  (row) => row.witness_type === "multi_source_construction_cospan" && row.result === "PASS",
).length;

const inversePass = inverseWitnesses.filter((row) => row.result === "PASS").length;
const covariancePass = covarianceWitnesses.filter((row) => row.result === "PASS").length;
const squarePass = squares.filter((row) => row.result === "PASS").length;
const counterexampleCount = counterexamples.length;
const structuralEdgePass = structuralEdges.filter((row) => row.result === "PASS").length;
const fieldEdgePass = fieldEdges.filter((row) => row.result === "PASS").length;

const algebraYaml = {
  algebra: {
    catalog_id: "mutation-algebra:seven-governors:0.2.0",
    version: "0.2.0",
    generated: generatedHeader(),
    baseline_registry: "canonical-profile-registry:0.1.1",
    authoritative_registry: "audit/operator-registry.csv",
    policies: {
      structural_status: "validated_in_baseline_registry",
      semantic_default: "unresolved",
      destination_profile_rule: "resolve_from_State_Governor",
      degree_label_rule: "edge_metadata_only",
      physical_mutation_rule: "never_mutate_office_wavelength",
      route_rule: "exclude_route_from_intrinsic_normal_form",
      coverage_rule: "projection_gaps_are_recorded_not_invented",
    },
    operator_families: operators.map((operator) => ({
      operator_id: operator.operator_id,
      notation: operator.notation,
      name: operator.name,
      class: operator.operator_class,
      action: operator.action,
      degree: operator.degree ? Number(operator.degree) : null,
      degree_governor: operator.degree_governor || null,
      direction: operator.direction || null,
      delta_semitones: operator.delta_semitones
        ? Number(operator.delta_semitones)
        : null,
      domain_rule: operator.domain_rule || null,
      inverse: operator.inverse_operator_id || null,
      conjugate: operator.conjugate_operator_id || null,
      partial: operator.partial === "true",
      status: operator.status,
      application_count: Number(operator.application_count),
      domain_size: Number(operator.domain_size),
      image_size: Number(operator.image_size),
      structural_support_count: Number(operator.structural_support_count),
      field_support_count: Number(operator.field_support_count),
      projection_gap: coverageMap.has(operator.operator_id)
        ? {
            unprojected_applications: Number(
              coverageMap.get(operator.operator_id).unprojected_applications,
            ),
            union_coverage_rate: Number(
              coverageMap.get(operator.operator_id).union_coverage_rate,
            ),
          }
        : null,
    })),
    laws: {
      modal_order_seven: {
        statement: "M^7(s) = s for every rooted state.",
        witness_artifact: "audit/cycle-identities.csv",
        modal_cycles: cycles.length,
        anchor_cycles: roleCycleCounts.anchor ?? 0,
        satellite_cycles: roleCycleCounts.satellite ?? 0,
        boundary_cycles: roleCycleCounts.boundary ?? 0,
        minimal_period_seven: cycles.every((row) => row.minimal_period_seven === "true"),
        result: "structurally_validated",
      },
      modal_office_transport: {
        statement: "office(M(s)) = office(s) + 2 mod 7 on all 308 office-bearing states.",
        witness_artifact: "audit/cycle-identities.csv",
        office_bearing_transported:
          cycles.filter((row) => row.office_bearing === "true").length * 7,
        result: "structurally_validated",
      },
      local_inverse_laws: {
        statement: "Lk(Rk(s)) = s on Dom(Rk) and Rk(Lk(s)) = s on Dom(Lk).",
        witness_artifact: "audit/inverse-witnesses.csv",
        passing_witnesses: inversePass,
        local_applications: 2940,
        modal_inverse: "M^6",
        result: "structurally_validated",
      },
      modal_covariance: {
        statement: "M Rk M^-1 = R(k-1 mod 7) and M Lk M^-1 = L(k-1 mod 7).",
        witness_artifact: "audit/modal-covariance-witnesses.csv",
        passing_cases: covariancePass,
        domain_and_target_cases: 6468,
        defined_applications_each_side: 2940,
        result: "structurally_validated",
      },
      local_commutation: {
        statement:
          "On the common composite domain, local two-step composites agree; unqualified global commutation is not claimed.",
        witness_artifact: "audit/commutation-summary.csv",
        pairs_tested: commutation.length,
        classifications: classificationCounts,
        common_domain_value_mismatches: 0,
        one_sided_only_cases: 3528,
        commutative_squares_passing: squarePass,
        counterexamples: counterexampleCount,
        result: "qualified_partial_commutation",
      },
      confluence: {
        statement:
          "Same-source direct confluence diamonds and multi-source construction cospans are distinct evidence classes.",
        witness_artifact: "audit/confluence-witnesses.csv",
        same_source_direct_diamonds: sameSourceDiamonds,
        multi_source_construction_cospans: cospans,
        result: "structurally_validated",
      },
      edge_validation: {
        structural_edges_passed: structuralEdgePass,
        structural_edges_total: structuralEdges.length,
        field_edges_passed: fieldEdgePass,
        field_edges_total: fieldEdges.length,
        result:
          structuralEdgePass === structuralEdges.length &&
          fieldEdgePass === fieldEdges.length
            ? "structurally_validated"
            : "failed",
      },
    },
    negative_results: {
      hamming_adjacency_is_not_primitive: {
        statement:
          "Hamming distance 2 is adjacency; 150 primitive adjacent pairs vs 435 multi-semitone exchanges do not by themselves authorize macro operators.",
        witness_artifact: "audit/field-edge-validation.csv",
        result: "not_admitted",
      },
      root_phase_is_not_an_office: {
        statement:
          "Complete formal phase domain 210 inverse pairs; 175 projected in the current field and 30 valid pairs remain unprojected. Phase adjacency never assigns an office.",
        witness_artifact: "audit/projection-coverage.csv",
        unprojected_phase_pairs: 30,
        result: "not_admitted",
      },
      lattice_not_proven: {
        statement:
          "Modal cycles prevent a partial-order reading; no global lattice/meet/join theorem is admitted.",
        result: "not_proven",
      },
    },
    assertions: [
      {
        assertion_id: "assertion:acoustic_confluence",
        type: "confluence",
        statement: "NF(L7(Lydian)) = NF(R4(Mixolydian)) = NF(Acoustic)",
        status: "fixture_backed",
        witness_artifact: "audit/confluence-witnesses.csv",
      },
      {
        assertion_id: "assertion:lydian_minor_confluence",
        type: "confluence",
        statement: "NF(L6(Acoustic)) = NF(R4(Mixolydian_flat_6)) = NF(Lydian_Minor)",
        status: "fixture_backed",
        witness_artifact: "audit/confluence-witnesses.csv",
      },
      {
        assertion_id: "assertion:aeolian_modal_covariance",
        type: "covariance",
        statement: "Declared Aeolian structural relation transports under modal rerooting.",
        status: "fixture_backed",
        witness_artifact: "audit/modal-covariance-witnesses.csv",
      },
      {
        assertion_id: "assertion:global_commutation",
        type: "commutation",
        statement:
          "No global operator-pair commutation theorem is currently admitted; equality holds only on the common composite domain.",
        status: "qualified",
        witness_artifact: "audit/commutation-summary.csv",
      },
    ],
  },
};

const topologicalRelationships = parseCypherRelationships(
  readFile("neo4j/import.cypher", RELEASE_ROOT),
).filter((type) =>
  [
    "GOVERNS",
    "CONSTRUCTS",
    "SEAT_CONTACT",
    "MODAL_SUCCESSOR",
    "AUDITED_HAMMING2",
    "PHASE_SHIFT",
    "CONVERGENCE_CONTACT",
    "JUNCTION_CONTACT",
    "LEAF_CONTACT",
    "BELONGS_TO_FAMILY",
    "OCCUPIES_OFFICE",
    "RELATIONAL_OFFICE_EVIDENCE",
  ].includes(type),
);
const semanticRelationships = parseCypherRelationships(
  readFile("neo4j/02_semantic_import.cypher", REGISTRY_DIR),
);
const provenanceRelationships = parseCypherRelationships(
  readFile("neo4j/provenance.cypher", RELEASE_ROOT),
);
const mutationRelationships = parseCypherRelationships(
  readFile("neo4j/algebra-import.cypher", AUDIT_DIR),
);
const candidateRelationships = parseCypherRelationships(
  readFile("neo4j/context-projection.cypher"),
);

const relationshipRow = (type, from, to, admission, categorical) => ({
  relationship_id: `rel:${type}`,
  from,
  to,
  admission,
  categorical_office_claim: categorical,
});

const entitiesYaml = {
  catalog: {
    catalog_id: "entities:seven-governors:0.2.0",
    version: "0.2.0",
    generated: generatedHeader(),
    entities: [
      {
        entity_id: "entity:GovernorOffice",
        graph_label: "GovernorOffice",
        identity_fields: ["name", "officeIndex"],
        owner: "canonical_governor_registry",
        description: "One of seven canonical State-Governor offices.",
      },
      {
        entity_id: "entity:ScaleState",
        graph_label: "ScaleState",
        identity_fields: ["id", "nodeId"],
        owner: "audited_topology",
        description: "A rooted weight-seven pitch-class state.",
      },
      {
        entity_id: "entity:ScaleFamily",
        graph_label: "ScaleFamily",
        identity_fields: ["forte"],
        owner: "audited_topology",
        description: "A Forte set class and family-level property owner.",
      },
      {
        entity_id: "entity:CanonicalFeatureProfile",
        graph_label: "CanonicalFeatureProfile",
        identity_fields: ["profile_id"],
        owner: "canonical_profile_registry",
        description: "Versioned intrinsic semantic and physical office profile.",
      },
      {
        entity_id: "entity:CompiledFeatureProfile",
        graph_label: "CompiledFeatureProfile",
        identity_fields: ["normal_form_id", "intrinsic_fingerprint"],
        owner: "deterministic_compiler",
        description: "Materialized destination/domain packet normal form.",
      },
      {
        entity_id: "entity:MutationOperator",
        graph_label: "MutationOperator",
        identity_fields: ["id"],
        owner: "mutation_operator_registry",
        description: "A structural state-transition function from the audit registry.",
      },
      {
        entity_id: "entity:RegistryRelease",
        graph_label: "RegistryRelease",
        identity_fields: ["release_id"],
        owner: "canonical_profile_registry",
        description: "Versioned profile-registry release.",
      },
      {
        entity_id: "entity:AuditRelease",
        graph_label: "AuditRelease",
        identity_fields: ["releaseId"],
        owner: "integrated_release_provenance",
        description: "Integrated topology release provenance.",
      },
      {
        entity_id: "entity:FrameworkDocument",
        graph_label: "FrameworkDocument",
        identity_fields: ["documentId"],
        owner: "integrated_release_provenance",
        description: "Hashed installed framework or machine-registry source.",
      },
      {
        entity_id: "entity:InvariantDefinition",
        graph_label: "InvariantDefinition",
        identity_fields: ["invariantId"],
        owner: "integrated_release_provenance",
        description: "Declared topology invariant provenance projection.",
      },
      {
        entity_id: "entity:PhenomenonModel",
        graph_label: "PhenomenonModel",
        identity_fields: ["phenomenon_id", "registryVersion"],
        owner: "physical_phenomena_registry",
        admission: "proposed",
        description: "Candidate physical model plus scoped authored office assignment.",
      },
      {
        entity_id: "entity:CourtState",
        graph_label: "CourtState",
        identity_fields: ["state_id", "vector", "engineVersion"],
        owner: "fivefold_engine_registry",
        admission: "proposed",
        description: "Candidate bounded four-pole operational state.",
      },
      {
        entity_id: "entity:LedgerEvent",
        graph_label: "LedgerEvent",
        identity_fields: ["event_id"],
        owner: "runtime_ledger",
        admission: "proposed",
        description: "Candidate append-only observation and transition provenance.",
      },
    ],
    structural_roles: Object.entries(topologyIdentity.primaryRoles ?? {}).map(
      ([role, definition]) => ({
        role_id: `role:${role}`,
        primary_role: role,
        office_bearing: definition.officeBearing ?? false,
        definition: definition.identityRule,
      }),
    ),
    relationships: [
      relationshipRow("BELONGS_TO_FAMILY", "ScaleState", "ScaleFamily", "admitted", false),
      relationshipRow("OCCUPIES_OFFICE", "ScaleState", "GovernorOffice", "admitted", true),
      relationshipRow(
        "RELATIONAL_OFFICE_EVIDENCE",
        "ScaleState",
        "GovernorOffice",
        "admitted",
        false,
      ),
      relationshipRow(
        "GOVERNS",
        "ScaleState",
        "ScaleState",
        "admitted",
        "destination_inherits_parent_office",
      ),
      relationshipRow(
        "CONSTRUCTS",
        "ScaleState",
        "ScaleState",
        "admitted",
        "only_through_declared_anchor_rule",
      ),
      relationshipRow("SEAT_CONTACT", "ScaleState", "ScaleState", "admitted", false),
      relationshipRow("MODAL_SUCCESSOR", "ScaleState", "ScaleState", "admitted", false),
      relationshipRow("AUDITED_HAMMING2", "ScaleState", "ScaleState", "admitted", false),
      relationshipRow("PHASE_SHIFT", "ScaleState", "ScaleState", "admitted", false),
      relationshipRow(
        "CONVERGENCE_CONTACT",
        "ScaleState",
        "ScaleState",
        "admitted",
        false,
      ),
      relationshipRow("JUNCTION_CONTACT", "ScaleState", "ScaleState", "admitted", false),
      relationshipRow("LEAF_CONTACT", "ScaleState", "ScaleState", "admitted", false),
      relationshipRow("MODAL_MUTATES_TO", "ScaleState", "ScaleState", "admitted", false),
      relationshipRow("LOCAL_MUTATES_TO", "ScaleState", "ScaleState", "admitted", false),
      relationshipRow(
        "HAS_CANONICAL_PROFILE",
        "GovernorOffice",
        "CanonicalFeatureProfile",
        "admitted",
        false,
      ),
      relationshipRow(
        "ACTIVE_PROFILE",
        "GovernorOffice",
        "CanonicalFeatureProfile",
        "admitted",
        false,
      ),
      relationshipRow(
        "CANONICALIZED_BY",
        "CanonicalFeatureProfile",
        "ScaleState",
        "admitted",
        false,
      ),
      relationshipRow(
        "HAS_PHOTONIC_RECORD",
        "CanonicalFeatureProfile",
        "PhotonicRecord",
        "admitted",
        false,
      ),
      relationshipRow(
        "HAS_FEATURE",
        "CanonicalFeatureProfile",
        "FeatureDefinition",
        "admitted",
        false,
      ),
      relationshipRow(
        "REFERENCES_LANDFORM",
        "CanonicalFeatureProfile",
        "LandformReference",
        "admitted",
        false,
      ),
      relationshipRow(
        "ACTIVE_SEMANTIC_OPERATOR",
        "MutationOperator",
        "SemanticOperator",
        "admitted",
        false,
      ),
      relationshipRow(
        "REALIZES",
        "SemanticOperator",
        "MutationOperator",
        "admitted",
        false,
      ),
      relationshipRow(
        "HAS_UNRESOLVED_SCOPE",
        "SemanticOperator",
        "SemanticUnresolvedScope",
        "admitted",
        false,
      ),
      relationshipRow(
        "PROJECTS_FEATURE",
        "DomainProjection",
        "FeatureDefinition",
        "admitted",
        false,
      ),
      relationshipRow(
        "HAS_NORMAL_FORM",
        "ScaleState",
        "CompiledFeatureProfile",
        "admitted",
        false,
      ),
      relationshipRow("PART_OF_RELEASE", "registry entity", "RegistryRelease", "admitted", false),
      relationshipRow("PRODUCES", "DerivationRoute", "CompiledFeatureProfile", "admitted", false),
      relationshipRow("HAS_STEP", "DerivationRoute", "DerivationStep", "admitted", false),
      relationshipRow("STARTS_AT", "DerivationStep", "ScaleState", "admitted", false),
      relationshipRow("ENDS_AT", "DerivationStep", "ScaleState", "admitted", false),
      relationshipRow(
        "APPLIES",
        "DerivationStep",
        "SemanticOperator",
        "admitted",
        false,
      ),
      relationshipRow(
        "TESTS_ROUTE",
        "ValidationFixture",
        "DerivationRoute",
        "admitted",
        false,
      ),
      relationshipRow(
        "INCLUDES_DOCUMENT",
        "AuditRelease",
        "FrameworkDocument",
        "admitted",
        false,
      ),
      relationshipRow(
        "DECLARES_INVARIANT",
        "AuditRelease",
        "InvariantDefinition",
        "admitted",
        false,
      ),
      relationshipRow(
        "DEFINED_BY",
        "InvariantDefinition",
        "FrameworkDocument",
        "admitted",
        false,
      ),
      relationshipRow(
        "PRIMARY_PHENOMENON",
        "GovernorOffice",
        "PhenomenonModel",
        "proposed",
        false,
      ),
      relationshipRow(
        "COURT_TRANSITION",
        "CourtState",
        "CourtState",
        "proposed",
        false,
      ),
    ],
    relationship_derivation: {
      topology_cypher: "neo4j/import.cypher",
      semantic_cypher: "neo4j/02_semantic_import.cypher",
      provenance_cypher: "neo4j/provenance.cypher",
      mutation_cypher: "neo4j/algebra-import.cypher",
      candidate_cypher: "neo4j/context-projection.cypher",
      parsed_relationship_types: {
        admitted: [
          ...topologicalRelationships,
          ...semanticRelationships,
          ...provenanceRelationships,
          ...mutationRelationships,
        ].sort(),
        proposed: candidateRelationships,
      },
    },
  },
};

const invariantCatalog = [
  {
    invariant_id: "INV-IDENTITY-001",
    severity: "error",
    owner: "canonical_topology",
    statement: "ScaleState.id and ScaleState.nodeId are independently unique.",
    executable_surface: "neo4j",
    admission: "admitted",
    source: "neo4j/schema.cypher",
  },
  {
    invariant_id: "INV-IDENTITY-002",
    severity: "error",
    owner: "audit_engine",
    statement: "Every heptatonic state mask has bit weight seven.",
    executable_surface: "audit",
    admission: "admitted",
    source: "audit/mutation-algebra-hypotheses.md",
  },
  {
    invariant_id: "INV-OFFICE-001",
    severity: "error",
    owner: "canonical_topology",
    statement: "Every office-bearing state has exactly one OCCUPIES_OFFICE edge.",
    executable_surface: "neo4j",
    admission: "admitted",
    source: "docs/TOPOLOGY_IDENTITY_AND_INVARIANTS.md",
  },
  {
    invariant_id: "INV-OFFICE-002",
    severity: "error",
    owner: "canonical_topology",
    statement: "Boundary states have zero OCCUPIES_OFFICE edges.",
    executable_surface: "neo4j",
    admission: "admitted",
    source: "docs/TOPOLOGY_IDENTITY_AND_INVARIANTS.md",
  },
  {
    invariant_id: "INV-OFFICE-003",
    severity: "error",
    owner: "neo4j_projection",
    statement: "RELATIONAL_OFFICE_EVIDENCE never implies categorical office occupation.",
    executable_surface: "neo4j",
    admission: "admitted",
    source: "docs/TOPOLOGY_IDENTITY_AND_INVARIANTS.md",
  },
  {
    invariant_id: "INV-ANCHOR-001",
    severity: "error",
    owner: "audit_engine",
    statement: "Every admitted anchor family has exactly seven rooted anchor modes.",
    executable_surface: "neo4j",
    admission: "admitted",
    source: "audit/cycle-identities.csv",
  },
  {
    invariant_id: "INV-ANCHOR-002",
    severity: "error",
    owner: "audit_engine",
    statement: "Every admitted anchor family occupies each Governor office exactly once.",
    executable_surface: "neo4j",
    admission: "admitted",
    source: "audit/cycle-identities.csv",
  },
  {
    invariant_id: "INV-ANCHOR-003",
    severity: "error",
    owner: "audit_engine",
    statement: "Every anchor has one in-family modal predecessor and successor.",
    executable_surface: "neo4j",
    admission: "admitted",
    source: "audit/cycle-identities.csv",
  },
  {
    invariant_id: "INV-ANCHOR-004",
    severity: "error",
    owner: "audit_engine",
    statement: "Each anchor modal ring closes in exactly seven successor steps.",
    executable_surface: "neo4j",
    admission: "admitted",
    source: "audit/cycle-identities.csv",
  },
  {
    invariant_id: "INV-BRIDGE-001",
    severity: "error",
    owner: "audit_engine",
    statement: "Direct midpoint has endpoint distances 2 and endpoint-to-endpoint distance 4.",
    executable_surface: "audit",
    admission: "admitted",
    source: "docs/OFFICE_ASSIGNMENT_AND_ANCHOR_QUALIFICATION_RULE.md",
  },
  {
    invariant_id: "INV-SATELLITE-001",
    severity: "error",
    owner: "canonical_topology",
    statement: "Every satellite has exactly one selected incoming GOVERNS edge.",
    executable_surface: "neo4j",
    admission: "admitted",
    source: "docs/TOPOLOGY_IDENTITY_AND_INVARIANTS.md",
  },
  {
    invariant_id: "INV-SATELLITE-002",
    severity: "error",
    owner: "canonical_topology",
    statement: "Satellite and selected governing parent occupy the same State-Governor office.",
    executable_surface: "neo4j",
    admission: "admitted",
    source: "docs/TOPOLOGY_IDENTITY_AND_INVARIANTS.md",
  },
  {
    invariant_id: "INV-PHASE-001",
    severity: "error",
    owner: "audit_engine",
    statement: "Every admitted phase edge records adjacent phase delta and verified inverse.",
    executable_surface: "neo4j",
    admission: "admitted",
    source: "audit/phase-completion-ledger.csv",
  },
  {
    invariant_id: "INV-ALG-001",
    severity: "error",
    owner: "operator_registry",
    statement: "An operator applies only inside its declared partial domain.",
    executable_surface: "compiler",
    admission: "admitted",
    source: "audit/operator-registry.csv",
  },
  {
    invariant_id: "INV-ALG-004",
    severity: "error",
    owner: "compiler",
    statement: "Route history is excluded from intrinsic normal-form fingerprint.",
    executable_surface: "compiler",
    admission: "admitted",
    source: "schemas/compiled-profile.schema.json",
  },
  {
    invariant_id: "INV-ALG-006",
    severity: "error",
    owner: "operator_registry",
    statement: "Commutation claims include tested domain, support count, and counterexamples.",
    executable_surface: "audit",
    admission: "admitted",
    source: "audit/commutation-summary.csv",
  },
  {
    invariant_id: "INV-ALG-007",
    severity: "error",
    owner: "semantic_registry",
    statement: "Unadmitted semantic effects remain unresolved.",
    executable_surface: "compiler",
    admission: "admitted",
    source: "schemas/semantic-operator.schema.json",
  },
  {
    invariant_id: "INV-ALG-008",
    severity: "error",
    owner: "compiler",
    statement: "Musical operators do not mutate representative physical wavelength.",
    executable_surface: "compiler",
    admission: "admitted",
    source: "audit/mutation-algebra-hypotheses.md",
  },
  {
    invariant_id: "INV-COMP-001",
    severity: "error",
    owner: "feature_registry",
    statement: "C_P, C_H, and C_S remain distinct typed coordinates; no aggregate formula is invented.",
    executable_surface: "compiler",
    admission: "admitted",
    source: "schemas/canonical-profile.schema.json",
  },
  {
    invariant_id: "INV-AUTHOR-001",
    severity: "error",
    owner: "authoring_tool",
    statement: "The authoring CLI never overwrites source/governors.yaml.",
    executable_surface: "package_validator",
    admission: "admitted",
    source: "scripts/governor-author.mjs",
  },
  {
    invariant_id: "INV-COURT-001",
    severity: "error",
    owner: "fivefold_engine",
    statement: "Canonical Court vectors are 0000, 1000, 1100, 1110, and 1111.",
    executable_surface: "package_validator",
    admission: "proposed",
    source: "schemas/fivefold_engine.yaml",
  },
  {
    invariant_id: "INV-COURT-002",
    severity: "error",
    owner: "fivefold_engine",
    statement:
      "Each canonical adjacent transition changes exactly one pole in Mars-Jupiter-Venus-Saturn order.",
    executable_surface: "package_validator",
    admission: "proposed",
    source: "schemas/fivefold_engine.yaml",
  },
  {
    invariant_id: "INV-COURT-003",
    severity: "error",
    owner: "fivefold_engine",
    statement: "kappa_court remains a distinct typed coordinate and is not a physical quantity.",
    executable_surface: "package_validator",
    admission: "proposed",
    source: "schemas/fivefold_engine.yaml",
  },
  {
    invariant_id: "INV-PHEN-001",
    severity: "error",
    owner: "physical_phenomena_registry",
    statement: "Each Governor office has exactly one exclusive primary phenomenon model.",
    executable_surface: "package_validator",
    admission: "proposed",
    source: "schemas/physical_phenomena.yaml",
  },
  {
    invariant_id: "INV-PHEN-002",
    severity: "error",
    owner: "physical_phenomena_registry",
    statement: "Rayleigh scattering has Jupiter as its only primary assignee.",
    executable_surface: "package_validator",
    admission: "proposed",
    source: "schemas/physical_phenomena.yaml",
  },
  {
    invariant_id: "INV-PHEN-003",
    severity: "error",
    owner: "physical_phenomena_registry",
    statement: "Each phenomenon declares assumptions, sources, and prohibited inferences.",
    executable_surface: "json_schema",
    admission: "proposed",
    source: "schemas/physical-phenomena.schema.json",
  },
];

const invariantsYaml = {
  invariant_catalog: {
    catalog_id: "invariants:seven-governors:0.2.0",
    version: "0.2.0",
    generated: generatedHeader(),
    admission_policy:
      "Entries marked admitted are executable in the installed release; entries marked proposed belong to candidate extensions and are checked only by this package's validator.",
    invariants: invariantCatalog,
  },
};

const outputs = {
  "catalog/algebra.yaml": algebraYaml,
  "catalog/entities.yaml": entitiesYaml,
  "catalog/invariants.yaml": invariantsYaml,
};

function withoutTimestamp(rendered) {
  return rendered.replace(/^\s*regenerated_at: .*$/m, "regenerated_at: <stripped>");
}

const onlyEmit = process.argv.includes("--emit");
for (const [relativePath, document] of Object.entries(outputs)) {
  const outputPath = path.join(PACKAGE_ROOT, relativePath);
  const rendered = YAML.stringify(document, { lineWidth: 100, minContentWidth: 20 });
  if (onlyEmit) {
    fs.writeFileSync(outputPath, rendered);
    console.log(`Generated ${relativePath}`);
  } else if (fs.existsSync(outputPath)) {
    const current = fs.readFileSync(outputPath, "utf8");
    if (withoutTimestamp(current) !== withoutTimestamp(rendered)) {
      console.error(`Catalog is stale: ${relativePath}`);
      console.error(`Run: node scripts/build-catalogs.mjs --emit`);
      process.exitCode = 1;
    }
  } else {
    console.error(`Catalog missing: ${relativePath}`);
    process.exitCode = 1;
  }
}
if (!onlyEmit && process.exitCode === undefined) {
  console.log("Catalogs are fresh (generated from authoritative artifacts).");
}
