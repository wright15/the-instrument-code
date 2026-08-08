// Integrated release provenance projection.

CREATE CONSTRAINT audit_release_id_unique IF NOT EXISTS
FOR (release:AuditRelease)
REQUIRE release.releaseId IS UNIQUE;

CREATE CONSTRAINT framework_document_id_unique IF NOT EXISTS
FOR (document:FrameworkDocument)
REQUIRE document.documentId IS UNIQUE;

CREATE CONSTRAINT invariant_definition_id_unique IF NOT EXISTS
FOR (invariant:InvariantDefinition)
REQUIRE invariant.invariantId IS UNIQUE;

MERGE (release:AuditRelease {
  releaseId: 'seven-governors-integrated-1.0.0'
})
SET release.version = '1.0.0',
    release.releaseDate = date('2026-07-29'),
    release.status = 'validated',
    release.rootedScaleStates = 462,
    release.anchorStates = 70,
    release.satelliteStates = 238,
    release.boundaryStates = 154,
    release.officeBearingStates = 308,
    release.canonicalRelationships = 2594,
    release.neo4jProjectedRelationships = 2818;

UNWIND [
  {
    documentId: 'agents',
    path: 'framework/AGENTS.md',
    sha256: '6109987102ce576874ee5a113d9a0fc556537a2c8ac29e1bc109bd6b2c2e0e24',
    authorityRole: 'operational_behavior'
  },
  {
    documentId: 'feature-profiles',
    path: 'framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md',
    sha256: '5ba49b157aa6fd8ac672610f88df8ac01464fd71387f3c0e21b042e912636960',
    authorityRole: 'semantic_enrichment'
  },
  {
    documentId: 'topological-anchoring',
    path: 'framework/TOPOLOGICAL_ANCHORING.md',
    sha256: 'a3aa1dea0ac4ec08fb4d526b860ed40fd146c52e4e6e579a0f75b23816f4691c',
    authorityRole: 'topology_specification'
  },
  {
    documentId: 'natural-organization-thesis',
    path: 'framework/NATURAL_ORGANIZATION_THESIS.md',
    sha256: '898626127fbc7d7538bb954326f230db4bf97f084f35122c6e42b68dcdd37af9',
    authorityRole: 'theoretical_foundation'
  },
  {
    documentId: 'governor-registry',
    path: 'schemas/governors.yaml',
    sha256: '841fc52f1874de28d98a79e1635cbdd8ece134792a2a1f48ccb7e11a7a534ad2',
    authorityRole: 'machine_registry'
  }
] AS source
MATCH (release:AuditRelease {
  releaseId: 'seven-governors-integrated-1.0.0'
})
MERGE (document:FrameworkDocument {documentId: source.documentId})
SET document.path = source.path,
    document.sha256 = source.sha256,
    document.authorityRole = source.authorityRole
MERGE (release)-[:INCLUDES_DOCUMENT]->(document);

UNWIND [
  {
    invariantId: 'categorical-relational-separation',
    name: 'Categorical and relational office evidence remain distinct',
    definition: 'RELATIONAL_OFFICE_EVIDENCE never implies OCCUPIES_OFFICE.',
    documentId: 'topological-anchoring'
  },
  {
    invariantId: 'anchor-precedence',
    name: 'Earlier valid anchor claims take precedence',
    definition: 'A0, A1, A2, then D1 through D7 are evaluated without silent overwrite.',
    documentId: 'topological-anchoring'
  },
  {
    invariantId: 'unique-satellite-parent',
    name: 'Every satellite has one selected governing parent',
    definition: 'A direct satellite inherits one categorical office through one selected GOVERNS edge.',
    documentId: 'topological-anchoring'
  },
  {
    invariantId: 'boundary-office-withheld',
    name: 'Boundary states have no categorical office',
    definition: 'Boundary evidence may be rich, but office and OCCUPIES_OFFICE remain absent.',
    documentId: 'topological-anchoring'
  }
] AS declared
MATCH (release:AuditRelease {
  releaseId: 'seven-governors-integrated-1.0.0'
})
MATCH (document:FrameworkDocument {documentId: declared.documentId})
MERGE (invariant:InvariantDefinition {invariantId: declared.invariantId})
SET invariant.name = declared.name,
    invariant.definition = declared.definition
MERGE (release)-[:DECLARES_INVARIANT]->(invariant)
MERGE (invariant)-[:DEFINED_BY]->(document);
