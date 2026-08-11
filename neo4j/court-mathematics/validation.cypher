// CRT-306 executable graph-shape validation. Every statement returns check/status/diagnostic.

MATCH (state:ScaleState)-[r:HAS_TRIAD]->(:Triad)
WITH state, r.harmonicProfileSha256 AS profileSha256, count(r) AS edgeCount,
     count(DISTINCT r.degree) AS degreeCount, min(r.degree) AS minimumDegree,
     max(r.degree) AS maximumDegree
WITH count(CASE WHEN edgeCount <> 7 OR degreeCount <> 7
                       OR minimumDegree <> 1 OR maximumDegree <> 7 THEN 1 END) AS failures
RETURN 'degree_triad_narrow_cardinality' AS check,
       CASE WHEN failures = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       failures AS diagnostic;

MATCH (application:CourtFilterApplication)
OPTIONAL MATCH (application)-[filters:FILTERS]->(:ScaleState)
OPTIONAL MATCH (application)-[uses:USES_FILTER]->(:CourtFilterOperator)
OPTIONAL MATCH (application)-[yields:YIELDS_ADMITTED_SET]->(:PentatonicSetClass)
WITH application, count(DISTINCT filters) AS filtersCount,
     count(DISTINCT uses) AS usesCount, count(DISTINCT yields) AS yieldsCount
WITH count(CASE WHEN filtersCount <> 1 OR usesCount <> 1 OR yieldsCount <> 1 THEN 1 END) AS failures
RETURN 'filter_application_required_edges' AS check,
       CASE WHEN failures = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       failures AS diagnostic;

MATCH (application:CourtFilterApplication)-[:FILTERS]->(state:ScaleState)
MATCH (application)-[uses:USES_FILTER]->(filter:CourtFilterOperator)
MATCH (application)-[yields:YIELDS_ADMITTED_SET]->(setClass:PentatonicSetClass)
WITH application, state, uses, filter, yields, setClass,
     reduce(mask = 0, bit IN range(0, 11) |
       mask + CASE
         WHEN toInteger(application.sourceMask / toInteger(2 ^ bit)) % 2 = 1
          AND toInteger(filter.courtMask / toInteger(2 ^ bit)) % 2 = 1
         THEN toInteger(2 ^ bit) ELSE 0 END
     ) AS computedResultMask
WITH count(CASE WHEN application.sourceMask <> state.id
                  OR application.resultMask <> computedResultMask
                  OR application.resultMask <> setClass.pitchMask
                  OR yields.resultMask <> application.resultMask
                  OR uses.derivationMethod <> 'linear-diagonal-bit-and-v1'
                  OR filter.operatorType <> 'linear_diagonal'
                  OR filter.idempotent <> true OR filter.inverse <> 'none'
                  OR size(setClass.pitchClasses) <> 5 THEN 1 END) AS failures
RETURN 'filter_application_semantics' AS check,
       CASE WHEN failures = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       failures AS diagnostic;

MATCH (record:CourtCommutationRecord)
WITH count(CASE WHEN record.result IS NULL OR NOT record.result IN [
  'commutes','does_not_commute','left_undefined','right_undefined','both_undefined'
] OR record.mutationOperatorId IS NULL OR record.routeSemantics IS NULL
  OR record.sourceSha256 IS NULL OR record.ledgerPointer IS NOT NULL THEN 1 END) AS failures
RETURN 'static_commutation_domain_and_null_ledger_pointer' AS check,
       CASE WHEN failures = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       failures AS diagnostic;

MATCH (session:CourtRuntimeSession)
OPTIONAL MATCH (session)-[eventEdge:HAS_TRANSITION_EVENT]->(:CourtTransitionEvent)
OPTIONAL MATCH (session)-[snapshotEdge:HAS_LEDGER_SNAPSHOT]->(:CourtLedgerSnapshot)
WITH session, count(DISTINCT eventEdge) AS eventEdges,
     count(DISTINCT snapshotEdge) AS snapshotEdges
WITH count(CASE WHEN session.replayVerified IS NULL OR session.replayVerified <> true
                   OR session.sessionId IS NULL OR session.genesisStateSha256 IS NULL
                   OR session.currentStateSha256 IS NULL OR session.eventCount IS NULL
                   OR session.ledgerHeadSha256 IS NULL OR session.policyFingerprint IS NULL
                   OR session.contextFingerprint IS NULL
                   OR eventEdges <> session.eventCount OR snapshotEdges <> 1 THEN 1 END) AS failures
RETURN 'runtime_session_event_snapshot_cardinality' AS check,
       CASE WHEN failures = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       failures AS diagnostic;

MATCH (session:CourtRuntimeSession)-[:HAS_TRANSITION_EVENT]->(event:CourtTransitionEvent)
OPTIONAL MATCH (session)-[:HAS_TRANSITION_EVENT]->(next:CourtTransitionEvent)
WHERE next.sequence = event.sequence + 1
WITH session, event, next
WITH count(CASE
  WHEN event.sequence IS NULL OR event.sessionId IS NULL OR event.sessionId <> session.sessionId
       OR event.verificationStatus IS NULL OR event.verificationStatus <> 'VERIFIED'
       OR event.evidenceEventIds IS NULL OR size(event.evidenceEventIds) = 0
       OR size(event.evidenceEventIds) <> size(reduce(unique = [], evidenceId IN event.evidenceEventIds |
            CASE WHEN evidenceId IN unique THEN unique ELSE unique + evidenceId END))
       OR any(evidenceId IN event.evidenceEventIds WHERE evidenceId IS NULL
              OR evidenceId = '0000000000000000000000000000000000000000000000000000000000000000'
              OR NOT (evidenceId =~ '^[0-9a-f]{64}$'))
       OR any(hash IN [event.eventId, event.intrinsicSha256, event.eventSha256,
                       event.envelopeSha256, event.previousEventSha256,
                       event.priorStateSha256, event.resultingStateSha256, event.tokenId]
              WHERE hash IS NULL OR NOT (hash =~ '^[0-9a-f]{64}$')) THEN 1
  WHEN event.sequence = 1 AND event.priorStateSha256 <> session.genesisStateSha256 THEN 1
  WHEN event.sequence = 1 AND event.previousEventSha256 <> '0000000000000000000000000000000000000000000000000000000000000000' THEN 1
  WHEN event.sequence = session.eventCount
       AND (event.resultingStateSha256 <> session.currentStateSha256
            OR event.eventSha256 <> session.ledgerHeadSha256) THEN 1
  WHEN event.sequence < session.eventCount
       AND (next IS NULL OR next.priorStateSha256 <> event.resultingStateSha256) THEN 1
  WHEN event.sequence < session.eventCount
       AND next.previousEventSha256 <> event.eventSha256 THEN 1
END) AS failures
RETURN 'runtime_event_chain_closure' AS check,
       CASE WHEN failures = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       failures AS diagnostic;

MATCH (session:CourtRuntimeSession)
OPTIONAL MATCH (session)-[:HAS_TRANSITION_EVENT]->(event:CourtTransitionEvent)
WITH session, count(event) AS eventCount, count(DISTINCT event.sequence) AS sequenceCount,
     min(event.sequence) AS minimumSequence, max(event.sequence) AS maximumSequence
WITH count(CASE WHEN session.eventCount IS NULL OR eventCount <> session.eventCount
                   OR sequenceCount <> session.eventCount
                  OR (session.eventCount > 0 AND (minimumSequence <> 1 OR maximumSequence <> session.eventCount))
                THEN 1 END) AS failures
RETURN 'runtime_event_sequence_contiguous' AS check,
       CASE WHEN failures = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       failures AS diagnostic;

MATCH (session:CourtRuntimeSession)-[:HAS_LEDGER_SNAPSHOT]->(snapshot:CourtLedgerSnapshot)
OPTIONAL MATCH (snapshot)-[stateEdge:SNAPSHOTS_STATE]->(state:CourtState)
WITH session, snapshot, count(stateEdge) AS stateEdges, collect(state)[0] AS state
WITH count(CASE WHEN stateEdges <> 1 OR snapshot.replayVerified IS NULL
                   OR snapshot.replayVerified <> true OR snapshot.stateSha256 IS NULL
                   OR snapshot.eventCount IS NULL OR snapshot.ledgerHeadSha256 IS NULL
                   OR snapshot.policyFingerprint IS NULL OR snapshot.contextFingerprint IS NULL
                   OR snapshot.kappaNumerator IS NULL OR snapshot.kappaDenominator IS NULL
                   OR state IS NULL OR state.courtStateSha256 IS NULL OR state.eventCount IS NULL
                   OR state.ledgerHeadSha256 IS NULL OR state.policyFingerprint IS NULL
                   OR state.contextFingerprint IS NULL OR state.sessionId IS NULL
                   OR state.revision IS NULL OR state.consumedTokenCount IS NULL
                  OR snapshot.stateSha256 <> state.courtStateSha256
                  OR snapshot.stateSha256 <> session.currentStateSha256
                  OR snapshot.eventCount <> state.eventCount
                  OR snapshot.eventCount <> session.eventCount
                  OR snapshot.ledgerHeadSha256 <> state.ledgerHeadSha256
                  OR snapshot.ledgerHeadSha256 <> session.ledgerHeadSha256
                  OR snapshot.policyFingerprint <> state.policyFingerprint
                  OR snapshot.policyFingerprint <> session.policyFingerprint
                  OR snapshot.contextFingerprint <> state.contextFingerprint
                  OR snapshot.contextFingerprint <> session.contextFingerprint
                  OR snapshot.kappaNumerator <> state.kappaNumerator
                  OR snapshot.kappaDenominator <> state.kappaDenominator
                  OR state.sessionId <> session.sessionId
                  OR state.revision <> session.eventCount
                  OR state.consumedTokenCount <> session.eventCount THEN 1 END) AS failures
RETURN 'runtime_snapshot_terminal_state_closure' AS check,
       CASE WHEN failures = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       failures AS diagnostic;

MATCH (event:CourtTransitionEvent)
OPTIONAL MATCH (event)-[transEdge:HAS_TRANSLOCATION]->(:TopologicalTranslocationRecord)
OPTIONAL MATCH (event)-[routeEdge:USES_ROUTE_RECORD]->(:CourtCommutationRecord)
WITH event, count(DISTINCT transEdge) AS transCount, count(DISTINCT routeEdge) AS routeCount
WITH count(CASE
  WHEN event.operationId IS NULL THEN 1
  WHEN event.operationId = 'court:translocate' AND (transCount <> 1 OR routeCount <> 1
       OR event.translocationRecordHash IS NULL OR event.routeContextHash IS NULL) THEN 1
  WHEN event.operationId <> 'court:translocate' AND (transCount <> 0 OR routeCount <> 0
       OR event.translocationRecordHash IS NOT NULL OR event.routeContextHash IS NOT NULL) THEN 1
END) AS failures
RETURN 'runtime_translocation_route_pairing' AS check,
       CASE WHEN failures = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       failures AS diagnostic;

MATCH (event:CourtTransitionEvent)-[:HAS_TRANSLOCATION]->(record:TopologicalTranslocationRecord)
MATCH (event)-[:USES_ROUTE_RECORD]->(route:CourtCommutationRecord)
WITH count(CASE WHEN event.translocationRecordHash IS NULL OR record.recordHash IS NULL
                   OR record.staticRouteRecordId IS NULL OR route.commutationId IS NULL
                   OR record.operatorId IS NULL OR route.mutationOperatorId IS NULL
                   OR record.filterId IS NULL OR record.sourceScaleStateId IS NULL
                   OR record.classification IS NULL OR route.result IS NULL
                   OR record.crt304Fingerprint IS NULL OR route.sourceSha256 IS NULL
                   OR route.routeSemantics IS NULL
                   OR event.translocationRecordHash <> record.recordHash
                   OR record.staticRouteRecordId <> route.commutationId
                   OR record.staticRouteRecordId <> 'noncomm:' + record.filterId + ':'
                        + record.operatorId + ':' + toString(record.sourceScaleStateId)
                   OR record.classification <> route.result
                   OR record.classification <> 'right_undefined'
                   OR record.operatorId <> route.mutationOperatorId
                   OR record.crt304Fingerprint <> '40bd74397ff9f4c8c0f0b845630e008cea66c9495413195c1e1c92ff02968589'
                   OR route.sourceSha256 <> '40bd74397ff9f4c8c0f0b845630e008cea66c9495413195c1e1c92ff02968589'
                   OR route.routeSemantics <> 'mutation_then_filter_only'
                   OR route.ledgerPointer IS NOT NULL THEN 1 END) AS failures
RETURN 'runtime_exact_static_route_target' AS check,
       CASE WHEN failures = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       failures AS diagnostic;

MATCH (session:CourtRuntimeSession)-[:HAS_LEDGER_SNAPSHOT]->(:CourtLedgerSnapshot)-[:SNAPSHOTS_STATE]->(state:CourtState)
MATCH (source:ScaleState)-[has:HAS_TRIAD]->(:Triad)
WHERE has.harmonicProfileSha256 = state.harmonicProfileSha256
WITH session, state, collect(DISTINCT source.id) AS profileScaleIds
OPTIONAL MATCH (session)-[:HAS_TRANSITION_EVENT]->(:CourtTransitionEvent)-[:HAS_TRANSLOCATION]->(record:TopologicalTranslocationRecord)
WITH session, state, profileScaleIds, collect(record) AS records
WITH count(CASE WHEN size(profileScaleIds) <> 1
                   OR session.policyFingerprint IS NULL OR session.contextFingerprint IS NULL
                   OR state.policyFingerprint IS NULL OR state.contextFingerprint IS NULL
                   OR any(record IN records WHERE record IS NOT NULL
                     AND record.sourceScaleStateId <> profileScaleIds[0])
                  OR state.policyFingerprint <> session.policyFingerprint
                  OR state.contextFingerprint <> session.contextFingerprint THEN 1 END) AS failures
RETURN 'runtime_source_profile_policy_context_closure' AS check,
       CASE WHEN failures = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       failures AS diagnostic;

MATCH (record:TopologicalTranslocationRecord)
WITH count(CASE WHEN record.degreeGovernor IS NOT NULL
                  OR record.sourcePosition IS NULL OR record.targetPosition IS NULL
                  OR record.sourceScaleStateId IS NULL OR record.targetScaleStateId IS NULL
                  OR record.sourceForte IS NULL OR record.targetForte IS NULL
                  OR record.evidenceSha256 IS NULL OR record.crt304Fingerprint IS NULL
                  OR record.staticRouteRecordId IS NULL THEN 1 END) AS failures
RETURN 'translocation_minimal_properties_no_authority_write' AS check,
       CASE WHEN failures = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       failures AS diagnostic;

CALL {
  MATCH (n)
  WHERE n:Triad OR n:CourtFilterApplication OR n:CourtFilterOperator
     OR n:CourtCommutationRecord OR n:CourtLedgerSnapshot OR n:CourtRootedPosition
     OR n:CourtRuntimeSession OR n:CourtState OR n:CourtTransitionEvent
     OR n:PentatonicSetClass OR n:PoleRegister OR n:TopologicalTranslocationRecord
  UNWIND keys(n) AS propertyKey
  RETURN propertyKey
  UNION ALL
  MATCH ()-[r:HAS_TRIAD|FILTERS|USES_FILTER|YIELDS_ADMITTED_SET|HAS_COMMUTATION_RESULT|HAS_POLE_REGISTER|HAS_LEDGER_SNAPSHOT|SNAPSHOTS_STATE|HAS_TRANSITION_EVENT|HAS_TRANSLOCATION|USES_ROUTE_RECORD]->()
  UNWIND keys(r) AS propertyKey
  RETURN propertyKey
}
WITH count(CASE WHEN toLower(replace(replace(propertyKey, '.', ''), '_', '')) IN [
  'aspectprimarygovernor','canonicalheptatonictopology','degreegovernor',
  'hasgovernorseat','mutationdegreegovernor','office','officeevidence',
  'officeindex','operationalgovernor','primarygovernor','relationaloffice',
  'runtimeoperationalgovernor','scalestatehasgovernorseat','scalestateoffice',
  'scalestateofficeindex','topologyofficeevidence'
] THEN 1 END) AS failures
RETURN 'court_forbidden_authority_property_writes' AS check,
       CASE WHEN failures = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       failures AS diagnostic;

MATCH ()-[r:HAS_TRIAD|FILTERS|USES_FILTER|YIELDS_ADMITTED_SET|HAS_COMMUTATION_RESULT|HAS_POLE_REGISTER|HAS_LEDGER_SNAPSHOT|SNAPSHOTS_STATE|HAS_TRANSITION_EVENT|HAS_TRANSLOCATION|USES_ROUTE_RECORD]->()
WITH count(CASE
  WHEN type(r) = 'HAS_TRIAD' AND (NOT 'ScaleState' IN labels(startNode(r)) OR NOT 'Triad' IN labels(endNode(r))) THEN 1
  WHEN type(r) = 'FILTERS' AND (NOT 'CourtFilterApplication' IN labels(startNode(r)) OR NOT 'ScaleState' IN labels(endNode(r))) THEN 1
  WHEN type(r) = 'USES_FILTER' AND (NOT 'CourtFilterApplication' IN labels(startNode(r)) OR NOT 'CourtFilterOperator' IN labels(endNode(r))) THEN 1
  WHEN type(r) = 'YIELDS_ADMITTED_SET' AND (NOT 'CourtFilterApplication' IN labels(startNode(r)) OR NOT 'PentatonicSetClass' IN labels(endNode(r))) THEN 1
  WHEN type(r) = 'HAS_COMMUTATION_RESULT' AND (NOT 'CourtFilterApplication' IN labels(startNode(r)) OR NOT 'CourtCommutationRecord' IN labels(endNode(r))) THEN 1
  WHEN type(r) = 'HAS_POLE_REGISTER' AND ((NOT 'CourtState' IN labels(startNode(r)) AND NOT 'CourtRootedPosition' IN labels(startNode(r))) OR NOT 'PoleRegister' IN labels(endNode(r))) THEN 1
  WHEN type(r) = 'HAS_LEDGER_SNAPSHOT' AND (NOT 'CourtRuntimeSession' IN labels(startNode(r)) OR NOT 'CourtLedgerSnapshot' IN labels(endNode(r))) THEN 1
  WHEN type(r) = 'SNAPSHOTS_STATE' AND (NOT 'CourtLedgerSnapshot' IN labels(startNode(r)) OR NOT 'CourtState' IN labels(endNode(r))) THEN 1
  WHEN type(r) = 'HAS_TRANSITION_EVENT' AND (NOT 'CourtRuntimeSession' IN labels(startNode(r)) OR NOT 'CourtTransitionEvent' IN labels(endNode(r))) THEN 1
  WHEN type(r) = 'HAS_TRANSLOCATION' AND (NOT 'CourtTransitionEvent' IN labels(startNode(r)) OR NOT 'TopologicalTranslocationRecord' IN labels(endNode(r))) THEN 1
  WHEN type(r) = 'USES_ROUTE_RECORD' AND (NOT 'CourtTransitionEvent' IN labels(startNode(r)) OR NOT 'CourtCommutationRecord' IN labels(endNode(r))) THEN 1
END) AS failures
RETURN 'court_relationship_endpoint_labels' AS check,
       CASE WHEN failures = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       failures AS diagnostic;

MATCH (n)
WHERE n:Triad OR n:CourtFilterApplication OR n:CourtFilterOperator
   OR n:CourtCommutationRecord OR n:CourtLedgerSnapshot OR n:CourtRootedPosition
   OR n:CourtRuntimeSession OR n:CourtState OR n:CourtTransitionEvent
   OR n:PentatonicSetClass OR n:PoleRegister OR n:TopologicalTranslocationRecord
WITH count(n) AS total, count(DISTINCT n.logicalId) AS distinctIds,
     count(CASE WHEN n.recordSha256 IS NULL OR n.sourceSha256 IS NULL
                  OR n.admissionStatus IS NULL OR n.projectionFingerprint IS NULL THEN 1 END) AS missingEnvelope
RETURN 'court_node_identity_fingerprint_closure' AS check,
       CASE WHEN total = distinctIds AND missingEnvelope = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       {total: total, distinctIds: distinctIds, missingEnvelope: missingEnvelope} AS diagnostic;

MATCH ()-[r:HAS_TRIAD|FILTERS|USES_FILTER|YIELDS_ADMITTED_SET|HAS_COMMUTATION_RESULT|HAS_POLE_REGISTER|HAS_LEDGER_SNAPSHOT|SNAPSHOTS_STATE|HAS_TRANSITION_EVENT|HAS_TRANSLOCATION|USES_ROUTE_RECORD]->()
WITH count(r) AS total, count(DISTINCT r.logicalId) AS distinctIds,
     count(CASE WHEN r.recordSha256 IS NULL OR r.sourceSha256 IS NULL
                  OR r.admissionStatus IS NULL OR r.projectionFingerprint IS NULL THEN 1 END) AS missingEnvelope,
     count(DISTINCT r.projectionFingerprint) AS fingerprintCount
RETURN 'court_relationship_identity_fingerprint_closure' AS check,
       CASE WHEN total = distinctIds AND missingEnvelope = 0 AND fingerprintCount = 1 THEN 'PASS' ELSE 'FAIL' END AS status,
       {total: total, distinctIds: distinctIds, missingEnvelope: missingEnvelope,
        fingerprintCount: fingerprintCount} AS diagnostic;
