// CRT-306 Court mathematics read-projection constraints and indexes (Neo4j 5).
// Cross-node and endpoint closure is checked by validation.cypher.

CREATE CONSTRAINT court_triad_logical_id IF NOT EXISTS
FOR (n:Triad) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT court_filter_application_logical_id IF NOT EXISTS
FOR (n:CourtFilterApplication) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT court_filter_operator_logical_id IF NOT EXISTS
FOR (n:CourtFilterOperator) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT court_commutation_logical_id IF NOT EXISTS
FOR (n:CourtCommutationRecord) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT court_ledger_snapshot_logical_id IF NOT EXISTS
FOR (n:CourtLedgerSnapshot) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT court_rooted_position_logical_id IF NOT EXISTS
FOR (n:CourtRootedPosition) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT court_runtime_session_logical_id IF NOT EXISTS
FOR (n:CourtRuntimeSession) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT court_state_logical_id IF NOT EXISTS
FOR (n:CourtState) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT court_transition_event_logical_id IF NOT EXISTS
FOR (n:CourtTransitionEvent) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT court_pentatonic_set_logical_id IF NOT EXISTS
FOR (n:PentatonicSetClass) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT court_pole_register_logical_id IF NOT EXISTS
FOR (n:PoleRegister) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT court_translocation_logical_id IF NOT EXISTS
FOR (n:TopologicalTranslocationRecord) REQUIRE n.logicalId IS UNIQUE;

CREATE CONSTRAINT court_triad_business_id IF NOT EXISTS
FOR (n:Triad) REQUIRE n.triadId IS UNIQUE;
CREATE CONSTRAINT court_filter_application_business_id IF NOT EXISTS
FOR (n:CourtFilterApplication) REQUIRE n.applicationId IS UNIQUE;
CREATE CONSTRAINT court_filter_operator_business_id IF NOT EXISTS
FOR (n:CourtFilterOperator) REQUIRE n.filterId IS UNIQUE;
CREATE CONSTRAINT court_commutation_business_id IF NOT EXISTS
FOR (n:CourtCommutationRecord) REQUIRE n.commutationId IS UNIQUE;
CREATE CONSTRAINT court_ledger_snapshot_business_id IF NOT EXISTS
FOR (n:CourtLedgerSnapshot) REQUIRE n.snapshotHash IS UNIQUE;
CREATE CONSTRAINT court_rooted_position_business_id IF NOT EXISTS
FOR (n:CourtRootedPosition) REQUIRE n.positionId IS UNIQUE;
CREATE CONSTRAINT court_runtime_session_business_id IF NOT EXISTS
FOR (n:CourtRuntimeSession) REQUIRE n.sessionId IS UNIQUE;
CREATE CONSTRAINT court_state_business_id IF NOT EXISTS
FOR (n:CourtState) REQUIRE n.courtStateSha256 IS UNIQUE;
CREATE CONSTRAINT court_transition_event_business_id IF NOT EXISTS
FOR (n:CourtTransitionEvent) REQUIRE n.eventId IS UNIQUE;
CREATE CONSTRAINT court_pentatonic_set_business_id IF NOT EXISTS
FOR (n:PentatonicSetClass) REQUIRE n.setClassId IS UNIQUE;
CREATE CONSTRAINT court_pole_register_business_id IF NOT EXISTS
FOR (n:PoleRegister) REQUIRE n.poleRegisterId IS UNIQUE;
CREATE CONSTRAINT court_translocation_business_id IF NOT EXISTS
FOR (n:TopologicalTranslocationRecord) REQUIRE n.recordHash IS UNIQUE;

CREATE CONSTRAINT court_triad_record_sha IF NOT EXISTS
FOR (n:Triad) REQUIRE n.recordSha256 IS NOT NULL;
CREATE CONSTRAINT court_filter_application_record_sha IF NOT EXISTS
FOR (n:CourtFilterApplication) REQUIRE n.recordSha256 IS NOT NULL;
CREATE CONSTRAINT court_filter_operator_record_sha IF NOT EXISTS
FOR (n:CourtFilterOperator) REQUIRE n.recordSha256 IS NOT NULL;
CREATE CONSTRAINT court_commutation_record_sha IF NOT EXISTS
FOR (n:CourtCommutationRecord) REQUIRE n.recordSha256 IS NOT NULL;
CREATE CONSTRAINT court_ledger_snapshot_record_sha IF NOT EXISTS
FOR (n:CourtLedgerSnapshot) REQUIRE n.recordSha256 IS NOT NULL;
CREATE CONSTRAINT court_rooted_position_record_sha IF NOT EXISTS
FOR (n:CourtRootedPosition) REQUIRE n.recordSha256 IS NOT NULL;
CREATE CONSTRAINT court_runtime_session_record_sha IF NOT EXISTS
FOR (n:CourtRuntimeSession) REQUIRE n.recordSha256 IS NOT NULL;
CREATE CONSTRAINT court_state_record_sha IF NOT EXISTS
FOR (n:CourtState) REQUIRE n.recordSha256 IS NOT NULL;
CREATE CONSTRAINT court_transition_event_record_sha IF NOT EXISTS
FOR (n:CourtTransitionEvent) REQUIRE n.recordSha256 IS NOT NULL;
CREATE CONSTRAINT court_pentatonic_set_record_sha IF NOT EXISTS
FOR (n:PentatonicSetClass) REQUIRE n.recordSha256 IS NOT NULL;
CREATE CONSTRAINT court_pole_register_record_sha IF NOT EXISTS
FOR (n:PoleRegister) REQUIRE n.recordSha256 IS NOT NULL;
CREATE CONSTRAINT court_translocation_record_sha IF NOT EXISTS
FOR (n:TopologicalTranslocationRecord) REQUIRE n.recordSha256 IS NOT NULL;

CREATE CONSTRAINT court_has_triad_id IF NOT EXISTS
FOR ()-[r:HAS_TRIAD]-() REQUIRE r.logicalId IS UNIQUE;
CREATE CONSTRAINT court_filters_id IF NOT EXISTS
FOR ()-[r:FILTERS]-() REQUIRE r.logicalId IS UNIQUE;
CREATE CONSTRAINT court_uses_filter_id IF NOT EXISTS
FOR ()-[r:USES_FILTER]-() REQUIRE r.logicalId IS UNIQUE;
CREATE CONSTRAINT court_yields_set_id IF NOT EXISTS
FOR ()-[r:YIELDS_ADMITTED_SET]-() REQUIRE r.logicalId IS UNIQUE;
CREATE CONSTRAINT court_has_commutation_id IF NOT EXISTS
FOR ()-[r:HAS_COMMUTATION_RESULT]-() REQUIRE r.logicalId IS UNIQUE;
CREATE CONSTRAINT court_has_pole_id IF NOT EXISTS
FOR ()-[r:HAS_POLE_REGISTER]-() REQUIRE r.logicalId IS UNIQUE;
CREATE CONSTRAINT court_has_snapshot_id IF NOT EXISTS
FOR ()-[r:HAS_LEDGER_SNAPSHOT]-() REQUIRE r.logicalId IS UNIQUE;
CREATE CONSTRAINT court_snapshots_state_id IF NOT EXISTS
FOR ()-[r:SNAPSHOTS_STATE]-() REQUIRE r.logicalId IS UNIQUE;
CREATE CONSTRAINT court_has_transition_event_id IF NOT EXISTS
FOR ()-[r:HAS_TRANSITION_EVENT]-() REQUIRE r.logicalId IS UNIQUE;
CREATE CONSTRAINT court_has_translocation_id IF NOT EXISTS
FOR ()-[r:HAS_TRANSLOCATION]-() REQUIRE r.logicalId IS UNIQUE;
CREATE CONSTRAINT court_uses_route_record_id IF NOT EXISTS
FOR ()-[r:USES_ROUTE_RECORD]-() REQUIRE r.logicalId IS UNIQUE;

CREATE INDEX court_triad_quality_index IF NOT EXISTS
FOR (n:Triad) ON (n.quality);
CREATE INDEX court_filter_application_profile_index IF NOT EXISTS
FOR (n:CourtFilterApplication) ON (n.harmonicProfileSha256);
CREATE INDEX court_filter_operator_mask_index IF NOT EXISTS
FOR (n:CourtFilterOperator) ON (n.courtMask);
CREATE INDEX court_commutation_result_index IF NOT EXISTS
FOR (n:CourtCommutationRecord) ON (n.result);
CREATE INDEX court_ledger_snapshot_state_index IF NOT EXISTS
FOR (n:CourtLedgerSnapshot) ON (n.stateSha256);
CREATE INDEX court_rooted_position_mask_index IF NOT EXISTS
FOR (n:CourtRootedPosition) ON (n.pitchMask);
CREATE INDEX court_runtime_session_head_index IF NOT EXISTS
FOR (n:CourtRuntimeSession) ON (n.ledgerHeadSha256);
CREATE INDEX court_state_session_index IF NOT EXISTS
FOR (n:CourtState) ON (n.sessionId);
CREATE INDEX court_transition_event_session_sequence_index IF NOT EXISTS
FOR (n:CourtTransitionEvent) ON (n.sessionId, n.sequence);
CREATE INDEX court_pentatonic_mask_index IF NOT EXISTS
FOR (n:PentatonicSetClass) ON (n.pitchMask);
CREATE INDEX court_pole_register_admission_index IF NOT EXISTS
FOR (n:PoleRegister) ON (n.admissionStatus);
CREATE INDEX court_translocation_route_index IF NOT EXISTS
FOR (n:TopologicalTranslocationRecord) ON (n.staticRouteRecordId);
