// CRT-306 Court mathematics read-projection constraints and indexes (Neo4j 5).
// Endpoint-label restrictions are checked by validation.cypher.

CREATE CONSTRAINT court_triad_logical_id IF NOT EXISTS
FOR (n:Triad) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT court_triad_id IF NOT EXISTS
FOR (n:Triad) REQUIRE n.triadId IS UNIQUE;
CREATE CONSTRAINT court_triad_record_sha IF NOT EXISTS
FOR (n:Triad) REQUIRE n.recordSha256 IS NOT NULL;
CREATE CONSTRAINT court_triad_pitch_mask IF NOT EXISTS
FOR (n:Triad) REQUIRE n.pitchMask IS NOT NULL;
CREATE CONSTRAINT court_triad_pitch_classes IF NOT EXISTS
FOR (n:Triad) REQUIRE n.pitchClasses IS NOT NULL;
CREATE CONSTRAINT court_triad_root_pc IF NOT EXISTS
FOR (n:Triad) REQUIRE n.rootPc IS NOT NULL;
CREATE CONSTRAINT court_triad_interval_signature IF NOT EXISTS
FOR (n:Triad) REQUIRE n.intervalSignature IS NOT NULL;
CREATE CONSTRAINT court_triad_quality IF NOT EXISTS
FOR (n:Triad) REQUIRE n.quality IS NOT NULL;
CREATE CONSTRAINT court_triad_admission IF NOT EXISTS
FOR (n:Triad) REQUIRE n.admissionStatus IS NOT NULL;

CREATE CONSTRAINT court_filter_application_id IF NOT EXISTS
FOR (n:CourtFilterApplication) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT court_filter_application_business_id IF NOT EXISTS
FOR (n:CourtFilterApplication) REQUIRE n.applicationId IS UNIQUE;
CREATE CONSTRAINT court_filter_application_record_sha IF NOT EXISTS
FOR (n:CourtFilterApplication) REQUIRE n.recordSha256 IS NOT NULL;

CREATE CONSTRAINT court_filter_operator_id IF NOT EXISTS
FOR (n:CourtFilterOperator) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT court_filter_operator_business_id IF NOT EXISTS
FOR (n:CourtFilterOperator) REQUIRE n.filterId IS UNIQUE;
CREATE CONSTRAINT court_filter_operator_record_sha IF NOT EXISTS
FOR (n:CourtFilterOperator) REQUIRE n.recordSha256 IS NOT NULL;

CREATE CONSTRAINT court_pentatonic_set_id IF NOT EXISTS
FOR (n:PentatonicSetClass) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT court_pentatonic_set_class_id IF NOT EXISTS
FOR (n:PentatonicSetClass) REQUIRE n.setClassId IS UNIQUE;
CREATE CONSTRAINT court_pentatonic_set_record_sha IF NOT EXISTS
FOR (n:PentatonicSetClass) REQUIRE n.recordSha256 IS NOT NULL;

CREATE CONSTRAINT court_commutation_id IF NOT EXISTS
FOR (n:CourtCommutationRecord) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT court_commutation_business_id IF NOT EXISTS
FOR (n:CourtCommutationRecord) REQUIRE n.commutationId IS UNIQUE;
CREATE CONSTRAINT court_commutation_record_sha IF NOT EXISTS
FOR (n:CourtCommutationRecord) REQUIRE n.recordSha256 IS NOT NULL;

CREATE CONSTRAINT court_state_logical_id IF NOT EXISTS
FOR (n:CourtState) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT court_state_sha IF NOT EXISTS
FOR (n:CourtState) REQUIRE n.courtStateSha256 IS UNIQUE;
CREATE CONSTRAINT court_state_record_sha IF NOT EXISTS
FOR (n:CourtState) REQUIRE n.recordSha256 IS NOT NULL;

CREATE CONSTRAINT court_rooted_position_id IF NOT EXISTS
FOR (n:CourtRootedPosition) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT court_rooted_position_business_id IF NOT EXISTS
FOR (n:CourtRootedPosition) REQUIRE n.positionId IS UNIQUE;
CREATE CONSTRAINT court_rooted_position_record_sha IF NOT EXISTS
FOR (n:CourtRootedPosition) REQUIRE n.recordSha256 IS NOT NULL;

CREATE CONSTRAINT court_pole_register_id IF NOT EXISTS
FOR (n:PoleRegister) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT court_pole_register_business_id IF NOT EXISTS
FOR (n:PoleRegister) REQUIRE n.poleRegisterId IS UNIQUE;
CREATE CONSTRAINT court_pole_register_record_sha IF NOT EXISTS
FOR (n:PoleRegister) REQUIRE n.recordSha256 IS NOT NULL;

CREATE CONSTRAINT court_triad_source_sha IF NOT EXISTS
FOR (n:Triad) REQUIRE n.sourceSha256 IS NOT NULL;
CREATE CONSTRAINT court_triad_projection_sha IF NOT EXISTS
FOR (n:Triad) REQUIRE n.projectionFingerprint IS NOT NULL;
CREATE CONSTRAINT court_filter_application_source_sha IF NOT EXISTS
FOR (n:CourtFilterApplication) REQUIRE n.sourceSha256 IS NOT NULL;
CREATE CONSTRAINT court_filter_application_admission IF NOT EXISTS
FOR (n:CourtFilterApplication) REQUIRE n.admissionStatus IS NOT NULL;
CREATE CONSTRAINT court_filter_application_projection_sha IF NOT EXISTS
FOR (n:CourtFilterApplication) REQUIRE n.projectionFingerprint IS NOT NULL;
CREATE CONSTRAINT court_filter_application_profile_sha IF NOT EXISTS
FOR (n:CourtFilterApplication) REQUIRE n.harmonicProfileSha256 IS NOT NULL;
CREATE CONSTRAINT court_filter_application_result_mask IF NOT EXISTS
FOR (n:CourtFilterApplication) REQUIRE n.resultMask IS NOT NULL;
CREATE CONSTRAINT court_filter_operator_source_sha IF NOT EXISTS
FOR (n:CourtFilterOperator) REQUIRE n.sourceSha256 IS NOT NULL;
CREATE CONSTRAINT court_filter_operator_admission IF NOT EXISTS
FOR (n:CourtFilterOperator) REQUIRE n.admissionStatus IS NOT NULL;
CREATE CONSTRAINT court_filter_operator_projection_sha IF NOT EXISTS
FOR (n:CourtFilterOperator) REQUIRE n.projectionFingerprint IS NOT NULL;
CREATE CONSTRAINT court_filter_operator_mask IF NOT EXISTS
FOR (n:CourtFilterOperator) REQUIRE n.courtMask IS NOT NULL;
CREATE CONSTRAINT court_pentatonic_source_sha IF NOT EXISTS
FOR (n:PentatonicSetClass) REQUIRE n.sourceSha256 IS NOT NULL;
CREATE CONSTRAINT court_pentatonic_admission IF NOT EXISTS
FOR (n:PentatonicSetClass) REQUIRE n.admissionStatus IS NOT NULL;
CREATE CONSTRAINT court_pentatonic_projection_sha IF NOT EXISTS
FOR (n:PentatonicSetClass) REQUIRE n.projectionFingerprint IS NOT NULL;
CREATE CONSTRAINT court_pentatonic_mask IF NOT EXISTS
FOR (n:PentatonicSetClass) REQUIRE n.pitchMask IS NOT NULL;
CREATE CONSTRAINT court_commutation_source_sha IF NOT EXISTS
FOR (n:CourtCommutationRecord) REQUIRE n.sourceSha256 IS NOT NULL;
CREATE CONSTRAINT court_commutation_admission IF NOT EXISTS
FOR (n:CourtCommutationRecord) REQUIRE n.admissionStatus IS NOT NULL;
CREATE CONSTRAINT court_commutation_projection_sha IF NOT EXISTS
FOR (n:CourtCommutationRecord) REQUIRE n.projectionFingerprint IS NOT NULL;
CREATE CONSTRAINT court_commutation_result IF NOT EXISTS
FOR (n:CourtCommutationRecord) REQUIRE n.result IS NOT NULL;
CREATE CONSTRAINT court_state_source_sha IF NOT EXISTS
FOR (n:CourtState) REQUIRE n.sourceSha256 IS NOT NULL;
CREATE CONSTRAINT court_state_admission IF NOT EXISTS
FOR (n:CourtState) REQUIRE n.admissionStatus IS NOT NULL;
CREATE CONSTRAINT court_state_projection_sha IF NOT EXISTS
FOR (n:CourtState) REQUIRE n.projectionFingerprint IS NOT NULL;
CREATE CONSTRAINT court_state_profile_sha IF NOT EXISTS
FOR (n:CourtState) REQUIRE n.harmonicProfileSha256 IS NOT NULL;
CREATE CONSTRAINT court_rooted_position_source_sha IF NOT EXISTS
FOR (n:CourtRootedPosition) REQUIRE n.sourceSha256 IS NOT NULL;
CREATE CONSTRAINT court_rooted_position_admission IF NOT EXISTS
FOR (n:CourtRootedPosition) REQUIRE n.admissionStatus IS NOT NULL;
CREATE CONSTRAINT court_rooted_position_projection_sha IF NOT EXISTS
FOR (n:CourtRootedPosition) REQUIRE n.projectionFingerprint IS NOT NULL;
CREATE CONSTRAINT court_pole_register_source_sha IF NOT EXISTS
FOR (n:PoleRegister) REQUIRE n.sourceSha256 IS NOT NULL;
CREATE CONSTRAINT court_pole_register_admission IF NOT EXISTS
FOR (n:PoleRegister) REQUIRE n.admissionStatus IS NOT NULL;
CREATE CONSTRAINT court_pole_register_projection_sha IF NOT EXISTS
FOR (n:PoleRegister) REQUIRE n.projectionFingerprint IS NOT NULL;

CREATE CONSTRAINT court_has_triad_id IF NOT EXISTS
FOR ()-[r:HAS_TRIAD]-() REQUIRE r.logicalId IS UNIQUE;
CREATE CONSTRAINT court_has_triad_degree IF NOT EXISTS
FOR ()-[r:HAS_TRIAD]-() REQUIRE r.degree IS NOT NULL;
CREATE CONSTRAINT court_has_triad_method IF NOT EXISTS
FOR ()-[r:HAS_TRIAD]-() REQUIRE r.derivationMethod IS NOT NULL;
CREATE CONSTRAINT court_has_triad_profile IF NOT EXISTS
FOR ()-[r:HAS_TRIAD]-() REQUIRE r.harmonicProfileSha256 IS NOT NULL;
CREATE CONSTRAINT court_has_triad_record_sha IF NOT EXISTS
FOR ()-[r:HAS_TRIAD]-() REQUIRE r.recordSha256 IS NOT NULL;

CREATE CONSTRAINT court_filters_id IF NOT EXISTS
FOR ()-[r:FILTERS]-() REQUIRE r.logicalId IS UNIQUE;
CREATE CONSTRAINT court_filters_record_sha IF NOT EXISTS
FOR ()-[r:FILTERS]-() REQUIRE r.recordSha256 IS NOT NULL;
CREATE CONSTRAINT court_uses_filter_id IF NOT EXISTS
FOR ()-[r:USES_FILTER]-() REQUIRE r.logicalId IS UNIQUE;
CREATE CONSTRAINT court_uses_filter_record_sha IF NOT EXISTS
FOR ()-[r:USES_FILTER]-() REQUIRE r.recordSha256 IS NOT NULL;
CREATE CONSTRAINT court_yields_set_id IF NOT EXISTS
FOR ()-[r:YIELDS_ADMITTED_SET]-() REQUIRE r.logicalId IS UNIQUE;
CREATE CONSTRAINT court_yields_set_record_sha IF NOT EXISTS
FOR ()-[r:YIELDS_ADMITTED_SET]-() REQUIRE r.recordSha256 IS NOT NULL;
CREATE CONSTRAINT court_has_commutation_id IF NOT EXISTS
FOR ()-[r:HAS_COMMUTATION_RESULT]-() REQUIRE r.logicalId IS UNIQUE;
CREATE CONSTRAINT court_has_commutation_record_sha IF NOT EXISTS
FOR ()-[r:HAS_COMMUTATION_RESULT]-() REQUIRE r.recordSha256 IS NOT NULL;
CREATE CONSTRAINT court_has_pole_register_id IF NOT EXISTS
FOR ()-[r:HAS_POLE_REGISTER]-() REQUIRE r.logicalId IS UNIQUE;
CREATE CONSTRAINT court_has_pole_register_record_sha IF NOT EXISTS
FOR ()-[r:HAS_POLE_REGISTER]-() REQUIRE r.recordSha256 IS NOT NULL;

CREATE CONSTRAINT court_has_triad_source_sha IF NOT EXISTS
FOR ()-[r:HAS_TRIAD]-() REQUIRE r.sourceSha256 IS NOT NULL;
CREATE CONSTRAINT court_has_triad_admission IF NOT EXISTS
FOR ()-[r:HAS_TRIAD]-() REQUIRE r.admissionStatus IS NOT NULL;
CREATE CONSTRAINT court_has_triad_projection_sha IF NOT EXISTS
FOR ()-[r:HAS_TRIAD]-() REQUIRE r.projectionFingerprint IS NOT NULL;
CREATE CONSTRAINT court_filters_source_sha IF NOT EXISTS
FOR ()-[r:FILTERS]-() REQUIRE r.sourceSha256 IS NOT NULL;
CREATE CONSTRAINT court_filters_admission IF NOT EXISTS
FOR ()-[r:FILTERS]-() REQUIRE r.admissionStatus IS NOT NULL;
CREATE CONSTRAINT court_filters_projection_sha IF NOT EXISTS
FOR ()-[r:FILTERS]-() REQUIRE r.projectionFingerprint IS NOT NULL;
CREATE CONSTRAINT court_uses_filter_source_sha IF NOT EXISTS
FOR ()-[r:USES_FILTER]-() REQUIRE r.sourceSha256 IS NOT NULL;
CREATE CONSTRAINT court_uses_filter_admission IF NOT EXISTS
FOR ()-[r:USES_FILTER]-() REQUIRE r.admissionStatus IS NOT NULL;
CREATE CONSTRAINT court_uses_filter_projection_sha IF NOT EXISTS
FOR ()-[r:USES_FILTER]-() REQUIRE r.projectionFingerprint IS NOT NULL;
CREATE CONSTRAINT court_yields_set_source_sha IF NOT EXISTS
FOR ()-[r:YIELDS_ADMITTED_SET]-() REQUIRE r.sourceSha256 IS NOT NULL;
CREATE CONSTRAINT court_yields_set_admission IF NOT EXISTS
FOR ()-[r:YIELDS_ADMITTED_SET]-() REQUIRE r.admissionStatus IS NOT NULL;
CREATE CONSTRAINT court_yields_set_projection_sha IF NOT EXISTS
FOR ()-[r:YIELDS_ADMITTED_SET]-() REQUIRE r.projectionFingerprint IS NOT NULL;
CREATE CONSTRAINT court_has_commutation_source_sha IF NOT EXISTS
FOR ()-[r:HAS_COMMUTATION_RESULT]-() REQUIRE r.sourceSha256 IS NOT NULL;
CREATE CONSTRAINT court_has_commutation_admission IF NOT EXISTS
FOR ()-[r:HAS_COMMUTATION_RESULT]-() REQUIRE r.admissionStatus IS NOT NULL;
CREATE CONSTRAINT court_has_commutation_projection_sha IF NOT EXISTS
FOR ()-[r:HAS_COMMUTATION_RESULT]-() REQUIRE r.projectionFingerprint IS NOT NULL;
CREATE CONSTRAINT court_has_pole_source_sha IF NOT EXISTS
FOR ()-[r:HAS_POLE_REGISTER]-() REQUIRE r.sourceSha256 IS NOT NULL;
CREATE CONSTRAINT court_has_pole_admission IF NOT EXISTS
FOR ()-[r:HAS_POLE_REGISTER]-() REQUIRE r.admissionStatus IS NOT NULL;
CREATE CONSTRAINT court_has_pole_projection_sha IF NOT EXISTS
FOR ()-[r:HAS_POLE_REGISTER]-() REQUIRE r.projectionFingerprint IS NOT NULL;

CREATE INDEX court_triad_quality_index IF NOT EXISTS
FOR (n:Triad) ON (n.quality);
CREATE INDEX court_triad_root_index IF NOT EXISTS
FOR (n:Triad) ON (n.rootPc);
CREATE INDEX court_filter_application_profile_index IF NOT EXISTS
FOR (n:CourtFilterApplication) ON (n.harmonicProfileSha256);
CREATE INDEX court_filter_operator_mask_index IF NOT EXISTS
FOR (n:CourtFilterOperator) ON (n.courtMask);
CREATE INDEX court_pentatonic_mask_index IF NOT EXISTS
FOR (n:PentatonicSetClass) ON (n.pitchMask);
CREATE INDEX court_commutation_result_index IF NOT EXISTS
FOR (n:CourtCommutationRecord) ON (n.result);
CREATE INDEX court_state_position_index IF NOT EXISTS
FOR (n:CourtState) ON (n.courtPositionId);
CREATE INDEX court_rooted_position_mask_index IF NOT EXISTS
FOR (n:CourtRootedPosition) ON (n.pitchMask);
CREATE INDEX court_pole_register_admission_index IF NOT EXISTS
FOR (n:PoleRegister) ON (n.admissionStatus);
CREATE INDEX court_has_triad_profile_index IF NOT EXISTS
FOR ()-[r:HAS_TRIAD]-() ON (r.harmonicProfileSha256);
CREATE INDEX court_has_triad_degree_index IF NOT EXISTS
FOR ()-[r:HAS_TRIAD]-() ON (r.degree);
CREATE INDEX court_filters_projection_index IF NOT EXISTS
FOR ()-[r:FILTERS]-() ON (r.projectionFingerprint);
CREATE INDEX court_uses_filter_projection_index IF NOT EXISTS
FOR ()-[r:USES_FILTER]-() ON (r.projectionFingerprint);
CREATE INDEX court_yields_set_projection_index IF NOT EXISTS
FOR ()-[r:YIELDS_ADMITTED_SET]-() ON (r.projectionFingerprint);
CREATE INDEX court_commutation_projection_index IF NOT EXISTS
FOR ()-[r:HAS_COMMUTATION_RESULT]-() ON (r.projectionFingerprint);
CREATE INDEX court_pole_projection_index IF NOT EXISTS
FOR ()-[r:HAS_POLE_REGISTER]-() ON (r.projectionFingerprint);
