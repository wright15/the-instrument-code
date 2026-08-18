// Detached audit diagnostics. Every statement is read-only and returns PASS/FAIL.

CALL {
  MATCH (audit:PentatonicAuditRealization)
  RETURN count(audit) AS realizationCount
}
CALL {
  MATCH (:PentatonicAuditRealization)-[edge:SUBSET_OF_7_35]->(:ScaleState)
  RETURN count(edge) AS edgeCount
}
RETURN 'exact_projection_counts' AS check,
       CASE WHEN realizationCount = 7 AND edgeCount = 19 THEN 'PASS' ELSE 'FAIL' END AS status,
       {realizations: realizationCount, edges: edgeCount} AS diagnostic;

UNWIND $realizations AS expected
OPTIONAL MATCH (actual:PentatonicAuditRealization {witnessId: expected.witnessId})
OPTIONAL MATCH (actual)-[edge:SUBSET_OF_7_35]->(:ScaleState)
WITH expected, count(DISTINCT actual) AS nodeCount, count(edge) AS edgeCount
WITH count(CASE WHEN nodeCount <> 1 OR edgeCount <> expected.parentCount THEN 1 END) AS violations
RETURN 'realization_parent_cardinality' AS check,
       CASE WHEN violations = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       violations AS diagnostic;

MATCH (audit:PentatonicAuditRealization)-[edge:SUBSET_OF_7_35]->(state:ScaleState)
WITH audit, edge, state,
     reduce(mask = 0, bit IN range(0, 11) |
       mask + CASE
         WHEN toInteger(audit.pitchMask / toInteger(2 ^ bit)) % 2 = 1
          AND toInteger(state.id / toInteger(2 ^ bit)) % 2 = 1
         THEN toInteger(2 ^ bit) ELSE 0 END
     ) AS replayedIntersection
WITH count(CASE WHEN replayedIntersection <> audit.pitchMask
                  OR edge.pentatonicMask <> audit.pitchMask
                  OR edge.scaleStateId <> state.id THEN 1 END) AS violations
RETURN 'bitwise_subset_replay' AS check,
       CASE WHEN violations = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       violations AS diagnostic;

MATCH (audit:PentatonicAuditRealization)-[edge:SUBSET_OF_7_35]->(state:ScaleState)
WITH collect(edge.logicalId) AS actualIds,
     count(CASE WHEN edge.candidateFingerprint <> $candidateFingerprint
                  OR audit.candidateFingerprint <> $candidateFingerprint
                  OR edge.evidenceStatus <> 'planning_evidence'
                  OR audit.evidenceStatus <> 'planning_evidence'
                  OR edge.admissionEffect <> 'none'
                  OR audit.admissionEffect <> 'none' THEN 1 END) AS envelopeViolations
WITH actualIds, envelopeViolations,
     size(actualIds) = size($expectedEdgeIds)
       AND all(id IN actualIds WHERE id IN $expectedEdgeIds)
       AND all(id IN $expectedEdgeIds WHERE id IN actualIds) AS exactIds
RETURN 'exact_edge_identity_and_evidence_envelope' AS check,
       CASE WHEN exactIds AND envelopeViolations = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       {edgeCount: size(actualIds), envelopeViolations: envelopeViolations} AS diagnostic;

MATCH (source)-[edge:SUBSET_OF_7_35]->(target)
WITH count(CASE WHEN NOT source:PentatonicAuditRealization
                  OR source:PentatonicSetClass
                  OR NOT target:ScaleState THEN 1 END) AS violations,
     count(DISTINCT edge.logicalId) AS distinctIds,
     count(edge) AS edgeCount
RETURN 'exact_realization_endpoint_guard' AS check,
       CASE WHEN violations = 0 AND distinctIds = edgeCount THEN 'PASS' ELSE 'FAIL' END AS status,
       {violations: violations, edgeCount: edgeCount, distinctIds: distinctIds} AS diagnostic;

CALL {
  MATCH (node)
  WHERE any(label IN labels(node)
            WHERE NOT (label IN ['PentatonicAuditRealization', 'ScaleState']))
  RETURN count(node) AS forbiddenNodes
}
CALL {
  MATCH ()-[edge]->()
  WHERE type(edge) <> 'SUBSET_OF_7_35'
  RETURN count(edge) AS forbiddenEdges
}
RETURN 'detached_label_and_relationship_scope' AS check,
       CASE WHEN forbiddenNodes = 0 AND forbiddenEdges = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       {forbiddenNodes: forbiddenNodes, forbiddenEdges: forbiddenEdges} AS diagnostic;

CALL {
  MATCH (audit:PentatonicAuditRealization)
  UNWIND keys(audit) AS propertyKey
  RETURN propertyKey
  UNION ALL
  MATCH ()-[edge:SUBSET_OF_7_35]->()
  UNWIND keys(edge) AS propertyKey
  RETURN propertyKey
}
WITH count(CASE WHEN toLower(replace(replace(propertyKey, '.', ''), '_', '')) IN [
  'office','officeevidence','officeindex','governor','mode','pole',
  'projectsto','complementof','zodiac',
  'runtimeauthority','operationalgovernor','degreegovernor','topologyofficeevidence'
] THEN 1 END) AS violations
RETURN 'forbidden_authority_property_guard' AS check,
       CASE WHEN violations = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       violations AS diagnostic;

MATCH (audit:PentatonicAuditRealization)
WITH count(CASE WHEN NOT (audit.witnessType IN ['court_position', 'bridge_rooting'])
                  OR audit.setClassId IS NULL
                  OR audit.forteNumber IS NULL
                  OR audit.pitchMask IS NULL
                  OR audit.pitchMask12 IS NULL
                  OR audit.rootPc IS NULL
                  OR audit.complementMapId IS NOT NULL
                  OR audit.rawHeptatonicComplementMask IS NOT NULL
                  OR audit.normalizedHeptatonicScaleStateId IS NOT NULL THEN 1 END) AS violations
RETURN 'realization_shape_and_complement_separation' AS check,
       CASE WHEN violations = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       violations AS diagnostic;
