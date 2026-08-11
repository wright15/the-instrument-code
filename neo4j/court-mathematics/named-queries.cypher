// Reference copies of the bounded templates in governor.court_graph_queries.

// degree_triads_for_scale(scaleStateId), maxRows=7, maxDepth=1, timeoutMs=1000
MATCH (state:ScaleState {id: $scaleStateId})-[has:HAS_TRIAD]->(triad:Triad)
RETURN state.id AS scaleStateId, has.degree AS degree,
       has.derivationMethod AS derivationMethod,
       has.harmonicProfileSha256 AS harmonicProfileSha256,
       triad.triadId AS triadId, triad.pitchMask AS pitchMask,
       triad.pitchClasses AS pitchClasses, triad.rootPc AS rootPc,
       triad.intervalSignature AS intervalSignature, triad.quality AS quality,
       triad.recordSha256 AS recordSha256, triad.admissionStatus AS admissionStatus
ORDER BY degree, triadId
LIMIT 7;

// modal_scale_states_by_triad_quality(quality, limit), maxRows=100, maxDepth=1
MATCH (state:ScaleState)-[has:HAS_TRIAD]->(triad:Triad {quality: $quality})
RETURN state.id AS scaleStateId, has.degree AS degree,
       has.harmonicProfileSha256 AS harmonicProfileSha256,
       triad.triadId AS triadId, triad.quality AS quality,
       triad.recordSha256 AS recordSha256
ORDER BY scaleStateId, degree, triadId
LIMIT $limit;

// modal_scale_states_by_interval_vector(intervalVector, limit), maxRows=100, maxDepth=1
MATCH (state:ScaleState)-[has:HAS_TRIAD]->(:Triad)
WHERE has.scaleIntervalVector = $intervalVector
WITH DISTINCT state.id AS scaleStateId,
     has.harmonicProfileSha256 AS harmonicProfileSha256
RETURN scaleStateId, harmonicProfileSha256
ORDER BY scaleStateId, harmonicProfileSha256
LIMIT $limit;

// court_filter_commutation_outputs(applicationId), maxRows=100, maxDepth=2
MATCH (application:CourtFilterApplication {applicationId: $applicationId})-[:FILTERS]->(state:ScaleState)
MATCH (application)-[:USES_FILTER]->(filter:CourtFilterOperator)
MATCH (application)-[:YIELDS_ADMITTED_SET]->(yielded:PentatonicSetClass)
OPTIONAL MATCH (application)-[:HAS_COMMUTATION_RESULT]->(commutation:CourtCommutationRecord)
RETURN application.logicalId AS applicationLogicalId,
       application.applicationId AS applicationId,
       state.id AS scaleStateId, filter.filterId AS filterId,
       yielded.setClassId AS yieldedSetClassId,
       yielded.pitchMask AS yieldedPitchMask,
       commutation.commutationId AS commutationId,
       commutation.mutationOperatorId AS mutationOperatorId,
       commutation.result AS commutationResult,
       commutation.routeSemantics AS routeSemantics,
       commutation.ledgerPointer AS ledgerPointer,
       commutation.recordSha256 AS commutationRecordSha256
ORDER BY commutationId, mutationOperatorId
LIMIT 100;

// court_runtime_state_for_session(sessionId), maxRows=1, maxDepth=2
MATCH (session:CourtRuntimeSession {sessionId: $sessionId})-[:HAS_LEDGER_SNAPSHOT]->(snapshot:CourtLedgerSnapshot)-[:SNAPSHOTS_STATE]->(state:CourtState)
RETURN session.sessionId AS sessionId,
       session.genesisStateSha256 AS genesisStateSha256,
       session.currentStateSha256 AS currentStateSha256,
       session.replayVerified AS replayVerified,
       state.courtStateSha256 AS courtStateSha256,
       state.courtPositionId AS courtPositionId, state.revision AS revision,
       state.pitchMask AS pitchMask, state.poleVector AS poleVector,
       state.kappaNumerator AS kappaNumerator,
       state.kappaDenominator AS kappaDenominator,
       state.harmonicProfileSha256 AS harmonicProfileSha256,
       state.policyFingerprint AS policyFingerprint,
       state.contextFingerprint AS contextFingerprint,
       state.eventCount AS eventCount,
       state.ledgerHeadSha256 AS ledgerHeadSha256,
       state.consumedTokenCount AS consumedTokenCount,
       snapshot.snapshotHash AS snapshotHash
ORDER BY sessionId
LIMIT 1;

// court_verified_events_for_session(sessionId, limit), maxRows=100, maxDepth=2
MATCH (session:CourtRuntimeSession {sessionId: $sessionId})-[:HAS_TRANSITION_EVENT]->(event:CourtTransitionEvent)
OPTIONAL MATCH (event)-[:HAS_TRANSLOCATION]->(translocation:TopologicalTranslocationRecord)
OPTIONAL MATCH (event)-[:USES_ROUTE_RECORD]->(route:CourtCommutationRecord)
RETURN event.eventId AS eventId, event.intrinsicSha256 AS intrinsicSha256,
       event.eventSha256 AS eventSha256, event.envelopeSha256 AS envelopeSha256,
       event.previousEventSha256 AS previousEventSha256,
       event.sequence AS sequence, event.sessionId AS sessionId,
       event.operationId AS operationId,
       event.priorStateSha256 AS priorStateSha256,
       event.resultingStateSha256 AS resultingStateSha256,
       event.targetPosition AS targetPosition,
       event.verificationStatus AS verificationStatus,
       event.evidenceEventIds AS evidenceEventIds,
       event.tokenId AS tokenId,
       event.translocationRecordHash AS translocationRecordHash,
       event.routeContextHash AS routeContextHash,
       route.commutationId AS staticRouteRecordId
ORDER BY sequence, eventId
LIMIT $limit;
