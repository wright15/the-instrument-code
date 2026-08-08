// Explain one state, its categorical office, governing parent, and release.
MATCH (state:ScaleState {id: 2773})
OPTIONAL MATCH (parent:ScaleState)-[governs:GOVERNS]->(state)
OPTIONAL MATCH (state)-[:OCCUPIES_OFFICE]->(office:GovernorOffice)
MATCH (release:AuditRelease {
  releaseId: 'seven-governors-integrated-1.0.0'
})
RETURN
  state.id AS stateId,
  state.name AS state,
  state.forte AS family,
  state.role AS role,
  office.name AS categoricalOffice,
  parent.id AS governingParentId,
  parent.name AS governingParent,
  governs.mutation AS mutation,
  release.releaseId AS release;

// Explain why a boundary state can have relational evidence but no seat.
MATCH (boundary:ScaleState {id: 367})
OPTIONAL MATCH (source:ScaleState)-[evidence:
  CONVERGENCE_CONTACT|JUNCTION_CONTACT|LEAF_CONTACT
]->(boundary)
OPTIONAL MATCH (boundary)-[:OCCUPIES_OFFICE]->(categorical:GovernorOffice)
RETURN
  boundary.name AS boundaryState,
  boundary.universalClassification AS classification,
  boundary.relationalOffice AS relationalOffice,
  boundary.contactOfficeCountsJson AS contactVector,
  collect(DISTINCT {
    sourceId: source.id,
    sourceName: source.name,
    sourceOffice: source.office,
    relationshipType: type(evidence)
  }) AS evidence,
  categorical.name AS categoricalOffice;

// List the invariants and documents declared by this release.
MATCH (release:AuditRelease {
  releaseId: 'seven-governors-integrated-1.0.0'
})-[:DECLARES_INVARIANT]->(invariant:InvariantDefinition)
MATCH (invariant)-[:DEFINED_BY]->(document:FrameworkDocument)
RETURN
  invariant.invariantId AS invariantId,
  invariant.name AS invariant,
  invariant.definition AS definition,
  document.path AS definedBy,
  document.sha256 AS sourceHash
ORDER BY invariantId;

// Show all original sources with their authority roles.
MATCH (release:AuditRelease {
  releaseId: 'seven-governors-integrated-1.0.0'
})-[:INCLUDES_DOCUMENT]->(document:FrameworkDocument)
RETURN
  document.documentId AS documentId,
  document.path AS path,
  document.authorityRole AS authorityRole,
  document.sha256 AS sha256
ORDER BY authorityRole, documentId;
