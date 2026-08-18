// Parameters come directly from the Phase 1 candidate's reviewedRootedWitnesses.
// The preflight deliberately violates the audit witness constraint when any
// endpoint is absent, rolling back the complete transaction. The caller also
// verifies the returned counts before commit as a second guard.
CALL {
  UNWIND $realizations AS requestedRealization
  UNWIND requestedRealization.parentScaleStates AS requestedParent
  OPTIONAL MATCH (requestedState:ScaleState {id: requestedParent.scaleStateId})
  RETURN count(*) AS requestedEdges, count(requestedState) AS resolvedEdges
}
FOREACH (_ IN CASE WHEN requestedEdges = resolvedEdges THEN [] ELSE [1] END |
  CREATE (:PentatonicAuditRealization {witnessId: '__missing_scale_state_endpoint__'})
  CREATE (:PentatonicAuditRealization {witnessId: '__missing_scale_state_endpoint__'})
)
WITH $realizations AS requestedRealizations
UNWIND requestedRealizations AS realization
CALL {
  WITH realization
  UNWIND realization.parentScaleStates AS parent
  MATCH (state:ScaleState {id: parent.scaleStateId})
  RETURN collect({state: state, parent: parent}) AS resolvedParents
}
WITH realization, resolvedParents
WHERE size(resolvedParents) = size(realization.parentScaleStates)
MERGE (audit:PentatonicAuditRealization {witnessId: realization.witnessId})
SET audit = {
  witnessId: realization.witnessId,
  witnessType: realization.witnessType,
  setClassId: realization.setClassId,
  forteNumber: realization.forteNumber,
  pitchMask: realization.pitchMask,
  pitchMask12: realization.pitchMask12,
  rootPc: realization.rootPc,
  candidateFingerprint: $candidateFingerprint,
  evidenceStatus: 'planning_evidence',
  admissionEffect: 'none'
}
WITH audit, resolvedParents
UNWIND resolvedParents AS resolved
WITH audit, resolved.state AS state, resolved.parent AS parent
MERGE (audit)-[edge:SUBSET_OF_7_35]->(state)
SET edge = {
  logicalId: 'pentatonic-audit:' + audit.witnessId + '->' + toString(parent.scaleStateId),
  pentatonicMask: audit.pitchMask,
  scaleStateId: parent.scaleStateId,
  candidateFingerprint: $candidateFingerprint,
  evidenceStatus: 'planning_evidence',
  admissionEffect: 'none'
}
RETURN count(DISTINCT audit) AS importedRealizations,
       count(edge) AS importedEdges;
