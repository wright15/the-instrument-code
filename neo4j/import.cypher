// Seven Governors universal topology import.
// Copy neo4j/csv/ to <neo4j-import>/seven-governors/csv/ before running.

LOAD CSV WITH HEADERS
FROM 'file:///seven-governors/csv/scale-states.csv' AS row
MERGE (state:ScaleState {id: toInteger(row.id)})
SET state.nodeId = row.node_id,
    state.name = row.name,
    state.forte = row.forte,
    state.bit = row.bit,
    state.bitReverse = row.bit_reverse,
    state.pitchSet = row.pitch_set,
    state.intervalCycle = row.interval_cycle,
    state.intervalVector = row.interval_vector,
    state.orientation = row.orientation,
    state.chirality = row.chirality,
    state.role = row.role,
    state.fineRole = row.fine_role,
    state.identityCategory = row.identity_category,
    state.identityType = row.identity_type,
    state.tier = CASE row.tier WHEN '' THEN null ELSE row.tier END,
    state.tierNumber = CASE row.tier_number WHEN '' THEN null ELSE toInteger(row.tier_number) END,
    state.office = CASE row.office WHEN '' THEN null ELSE row.office END,
    state.officeIndex = CASE row.office_index WHEN '' THEN null ELSE toInteger(row.office_index) END,
    state.hasGovernorSeat = CASE row.has_governor_seat WHEN 'true' THEN true ELSE false END,
    state.officeAuthority = row.office_authority,
    state.anchorMechanism = CASE row.anchor_mechanism WHEN '' THEN null ELSE row.anchor_mechanism END,
    state.assignmentStatus = row.assignment_status,
    state.resolutionClass = row.resolution_class,
    state.universalClassification = row.universal_classification,
    state.governingParentCount = toInteger(row.governing_parent_count),
    state.constructionParentCount = toInteger(row.construction_parent_count),
    state.seatContactCount = toInteger(row.seat_contact_count),
    state.identityEvidenceContactCount =
      CASE row.identity_evidence_contact_count
      WHEN '' THEN null
      ELSE toInteger(row.identity_evidence_contact_count)
      END,
    state.identityEvidenceOfficeCountsJson =
      CASE row.identity_evidence_office_counts_json
      WHEN '' THEN null
      ELSE row.identity_evidence_office_counts_json
      END,
    state.identityEvidenceTierCountsJson =
      CASE row.identity_evidence_tier_counts_json
      WHEN '' THEN null
      ELSE row.identity_evidence_tier_counts_json
      END,
    state.relationalOffice =
      CASE row.relational_office WHEN '' THEN null ELSE row.relational_office END,
    state.pluralityContactOffice =
      CASE row.plurality_contact_office
      WHEN '' THEN null
      ELSE row.plurality_contact_office
      END,
    state.contactCount =
      CASE row.contact_count WHEN '' THEN null ELSE toInteger(row.contact_count) END,
    state.contactOfficeCountsJson =
      CASE row.contact_office_counts_json
      WHEN '' THEN null
      ELSE row.contact_office_counts_json
      END,
    state.contactTierCountsJson =
      CASE row.contact_tier_counts_json
      WHEN '' THEN null
      ELSE row.contact_tier_counts_json
      END,
    state.officeBasis = row.office_basis,
    state.registeredBeforeCompletion =
      CASE row.registered_before_completion WHEN 'true' THEN true ELSE false END,
    state.addedByCompletion =
      CASE row.added_by_completion WHEN 'true' THEN true ELSE false END;

LOAD CSV WITH HEADERS
FROM 'file:///seven-governors/csv/scale-families.csv' AS row
MERGE (family:ScaleFamily {forte: row.forte})
SET family.nodeId = row.node_id,
    family.stateCount = toInteger(row.state_count),
    family.modalOrientationCount = toInteger(row.modal_orientation_count),
    family.chirality = row.chirality,
    family.registeredBeforeCompletion = toInteger(row.registered_before_completion),
    family.missingBeforeCompletion = toInteger(row.missing_before_completion),
    family.zPartner = CASE row.z_partner WHEN '' THEN null ELSE row.z_partner END,
    family.topologyRole = row.topology_role,
    family.anchorTier = CASE row.anchor_tier WHEN '' THEN null ELSE row.anchor_tier END,
    family.anchorCount = toInteger(row.anchor_count),
    family.satelliteCount = toInteger(row.satellite_count),
    family.boundaryCount = toInteger(row.boundary_count),
    family.satelliteTiersJson = row.satellite_tiers_json,
    family.boundaryTypesJson = row.boundary_types_json;

LOAD CSV WITH HEADERS
FROM 'file:///seven-governors/csv/governor-offices.csv' AS row
MERGE (office:GovernorOffice {name: row.office})
SET office.nodeId = row.node_id,
    office.officeIndex = toInteger(row.office_index),
    office.canonicalScaleId = toInteger(row.canonical_scale_id),
    office.canonicalMode = row.canonical_mode;

// Common harmonic relationship property projection is repeated intentionally
// so every relationship retains its own native Neo4j type without APOC.

LOAD CSV WITH HEADERS
FROM 'file:///seven-governors/csv/governs.csv' AS row
MATCH (source:ScaleState {id: toInteger(row.source_scale_id)})
MATCH (target:ScaleState {id: toInteger(row.target_scale_id)})
MERGE (source)-[relation:GOVERNS {id: row.id}]->(target)
SET relation.directed = row.directed = 'true',
    relation.governing = row.governing = 'true',
    relation.auditTier = row.audit_tier,
    relation.relationTier = row.relation_tier,
    relation.phaseDelta = CASE row.phase_delta WHEN '' THEN null ELSE toInteger(row.phase_delta) END,
    relation.phaseDeltasJson = CASE row.phase_deltas_json WHEN '' THEN null ELSE row.phase_deltas_json END,
    relation.hamming = CASE row.hamming WHEN '' THEN null ELSE toInteger(row.hamming) END,
    relation.endpointHamming = CASE row.endpoint_hamming WHEN '' THEN null ELSE toInteger(row.endpoint_hamming) END,
    relation.mode = row.mode,
    relation.mutation = row.mutation,
    relation.degree = CASE row.degree WHEN '' THEN null ELSE toInteger(row.degree) END,
    relation.degreeGovernor = row.degree_governor,
    relation.eligible = row.eligible = 'true',
    relation.selected = row.selected = 'true',
    relation.provenance = row.provenance;

LOAD CSV WITH HEADERS
FROM 'file:///seven-governors/csv/constructs.csv' AS row
MATCH (source:ScaleState {id: toInteger(row.source_scale_id)})
MATCH (target:ScaleState {id: toInteger(row.target_scale_id)})
MERGE (source)-[relation:CONSTRUCTS {id: row.id}]->(target)
SET relation.directed = row.directed = 'true',
    relation.governing = row.governing = 'true',
    relation.auditTier = row.audit_tier,
    relation.relationTier = row.relation_tier,
    relation.phaseDelta = CASE row.phase_delta WHEN '' THEN null ELSE toInteger(row.phase_delta) END,
    relation.phaseDeltasJson = CASE row.phase_deltas_json WHEN '' THEN null ELSE row.phase_deltas_json END,
    relation.hamming = CASE row.hamming WHEN '' THEN null ELSE toInteger(row.hamming) END,
    relation.endpointHamming = CASE row.endpoint_hamming WHEN '' THEN null ELSE toInteger(row.endpoint_hamming) END,
    relation.mode = row.mode,
    relation.mutation = row.mutation,
    relation.degree = CASE row.degree WHEN '' THEN null ELSE toInteger(row.degree) END,
    relation.degreeGovernor = row.degree_governor,
    relation.eligible = row.eligible = 'true',
    relation.selected = row.selected = 'true',
    relation.provenance = row.provenance;

LOAD CSV WITH HEADERS
FROM 'file:///seven-governors/csv/seat-contact.csv' AS row
MATCH (source:ScaleState {id: toInteger(row.source_scale_id)})
MATCH (target:ScaleState {id: toInteger(row.target_scale_id)})
MERGE (source)-[relation:SEAT_CONTACT {id: row.id}]->(target)
SET relation.directed = row.directed = 'true',
    relation.governing = row.governing = 'true',
    relation.auditTier = row.audit_tier,
    relation.relationTier = row.relation_tier,
    relation.phaseDelta = CASE row.phase_delta WHEN '' THEN null ELSE toInteger(row.phase_delta) END,
    relation.phaseDeltasJson = CASE row.phase_deltas_json WHEN '' THEN null ELSE row.phase_deltas_json END,
    relation.hamming = CASE row.hamming WHEN '' THEN null ELSE toInteger(row.hamming) END,
    relation.endpointHamming = CASE row.endpoint_hamming WHEN '' THEN null ELSE toInteger(row.endpoint_hamming) END,
    relation.mode = row.mode,
    relation.mutation = row.mutation,
    relation.degree = CASE row.degree WHEN '' THEN null ELSE toInteger(row.degree) END,
    relation.degreeGovernor = row.degree_governor,
    relation.eligible = row.eligible = 'true',
    relation.selected = row.selected = 'true',
    relation.provenance = row.provenance;

LOAD CSV WITH HEADERS
FROM 'file:///seven-governors/csv/modal-successor.csv' AS row
MATCH (source:ScaleState {id: toInteger(row.source_scale_id)})
MATCH (target:ScaleState {id: toInteger(row.target_scale_id)})
MERGE (source)-[relation:MODAL_SUCCESSOR {id: row.id}]->(target)
SET relation.directed = row.directed = 'true',
    relation.governing = row.governing = 'true',
    relation.auditTier = row.audit_tier,
    relation.relationTier = row.relation_tier,
    relation.mode = row.mode,
    relation.provenance = row.provenance;

LOAD CSV WITH HEADERS
FROM 'file:///seven-governors/csv/audited-hamming2.csv' AS row
MATCH (source:ScaleState {id: toInteger(row.source_scale_id)})
MATCH (target:ScaleState {id: toInteger(row.target_scale_id)})
MERGE (source)-[relation:AUDITED_HAMMING2 {id: row.id}]->(target)
SET relation.directed = row.directed = 'true',
    relation.governing = row.governing = 'true',
    relation.auditTier = row.audit_tier,
    relation.relationTier = row.relation_tier,
    relation.hamming = toInteger(row.hamming),
    relation.mode = row.mode,
    relation.eligible = row.eligible = 'true',
    relation.selected = row.selected = 'true',
    relation.provenance = row.provenance;

LOAD CSV WITH HEADERS
FROM 'file:///seven-governors/csv/phase-shift.csv' AS row
MATCH (source:ScaleState {id: toInteger(row.source_scale_id)})
MATCH (target:ScaleState {id: toInteger(row.target_scale_id)})
MERGE (source)-[relation:PHASE_SHIFT {id: row.id}]->(target)
SET relation.directed = row.directed = 'true',
    relation.governing = row.governing = 'true',
    relation.auditTier = row.audit_tier,
    relation.relationTier = row.relation_tier,
    relation.phaseDelta = CASE row.phase_delta WHEN '' THEN null ELSE toInteger(row.phase_delta) END,
    relation.phaseDeltasJson = row.phase_deltas_json,
    relation.mode = row.mode,
    relation.eligible = row.eligible = 'true',
    relation.selected = row.selected = 'true',
    relation.provenance = row.provenance;

LOAD CSV WITH HEADERS
FROM 'file:///seven-governors/csv/convergence-contact.csv' AS row
MATCH (source:ScaleState {id: toInteger(row.source_scale_id)})
MATCH (target:ScaleState {id: toInteger(row.target_scale_id)})
MERGE (source)-[relation:CONVERGENCE_CONTACT {id: row.id}]->(target)
SET relation.directed = row.directed = 'true',
    relation.governing = row.governing = 'true',
    relation.auditTier = row.audit_tier,
    relation.relationTier = row.relation_tier,
    relation.contactTier = row.contact_tier,
    relation.contactOffice = row.contact_office,
    relation.phaseDelta = CASE row.phase_delta WHEN '' THEN null ELSE toInteger(row.phase_delta) END,
    relation.hamming = CASE row.hamming WHEN '' THEN null ELSE toInteger(row.hamming) END,
    relation.mode = row.mode,
    relation.mutation = row.mutation,
    relation.degree = CASE row.degree WHEN '' THEN null ELSE toInteger(row.degree) END,
    relation.degreeGovernor = row.degree_governor,
    relation.eligible = row.eligible = 'true',
    relation.selected = row.selected = 'true',
    relation.targetClassification = row.target_classification,
    relation.provenance = row.provenance;

LOAD CSV WITH HEADERS
FROM 'file:///seven-governors/csv/junction-contact.csv' AS row
MATCH (source:ScaleState {id: toInteger(row.source_scale_id)})
MATCH (target:ScaleState {id: toInteger(row.target_scale_id)})
MERGE (source)-[relation:JUNCTION_CONTACT {id: row.id}]->(target)
SET relation.directed = row.directed = 'true',
    relation.governing = row.governing = 'true',
    relation.auditTier = row.audit_tier,
    relation.relationTier = row.relation_tier,
    relation.contactTier = row.contact_tier,
    relation.contactOffice = row.contact_office,
    relation.phaseDelta = CASE row.phase_delta WHEN '' THEN null ELSE toInteger(row.phase_delta) END,
    relation.hamming = CASE row.hamming WHEN '' THEN null ELSE toInteger(row.hamming) END,
    relation.mode = row.mode,
    relation.mutation = row.mutation,
    relation.degree = CASE row.degree WHEN '' THEN null ELSE toInteger(row.degree) END,
    relation.degreeGovernor = row.degree_governor,
    relation.eligible = row.eligible = 'true',
    relation.selected = row.selected = 'true',
    relation.targetClassification = row.target_classification,
    relation.provenance = row.provenance;

LOAD CSV WITH HEADERS
FROM 'file:///seven-governors/csv/leaf-contact.csv' AS row
MATCH (source:ScaleState {id: toInteger(row.source_scale_id)})
MATCH (target:ScaleState {id: toInteger(row.target_scale_id)})
MERGE (source)-[relation:LEAF_CONTACT {id: row.id}]->(target)
SET relation.directed = row.directed = 'true',
    relation.governing = row.governing = 'true',
    relation.auditTier = row.audit_tier,
    relation.relationTier = row.relation_tier,
    relation.contactTier = row.contact_tier,
    relation.contactOffice = row.contact_office,
    relation.phaseDelta = CASE row.phase_delta WHEN '' THEN null ELSE toInteger(row.phase_delta) END,
    relation.hamming = CASE row.hamming WHEN '' THEN null ELSE toInteger(row.hamming) END,
    relation.mode = row.mode,
    relation.mutation = row.mutation,
    relation.degree = CASE row.degree WHEN '' THEN null ELSE toInteger(row.degree) END,
    relation.degreeGovernor = row.degree_governor,
    relation.eligible = row.eligible = 'true',
    relation.selected = row.selected = 'true',
    relation.targetClassification = row.target_classification,
    relation.provenance = row.provenance;

LOAD CSV WITH HEADERS
FROM 'file:///seven-governors/csv/belongs-to-family.csv' AS row
MATCH (source:ScaleState {id: toInteger(row.source_scale_id)})
MATCH (target:ScaleFamily {forte: replace(row.target_node_id, 'family:', '')})
MERGE (source)-[relation:BELONGS_TO_FAMILY {id: row.id}]->(target)
SET relation.directed = true,
    relation.governing = false,
    relation.provenance = row.provenance;

LOAD CSV WITH HEADERS
FROM 'file:///seven-governors/csv/occupies-office.csv' AS row
MATCH (source:ScaleState {id: toInteger(row.source_scale_id)})
MATCH (target:GovernorOffice {name: replace(row.target_node_id, 'office:', '')})
MERGE (source)-[relation:OCCUPIES_OFFICE {id: row.id}]->(target)
SET relation.directed = true,
    relation.governing = false,
    relation.auditTier = row.audit_tier,
    relation.relationTier = row.relation_tier,
    relation.categorical = true,
    relation.provenance = row.provenance;

LOAD CSV WITH HEADERS
FROM 'file:///seven-governors/csv/relational-office-evidence.csv' AS row
MATCH (source:ScaleState {id: toInteger(row.source_scale_id)})
MATCH (target:GovernorOffice {name: replace(row.target_node_id, 'office:', '')})
MERGE (source)-[relation:RELATIONAL_OFFICE_EVIDENCE {id: row.id}]->(target)
SET relation.directed = true,
    relation.governing = false,
    relation.contactOffice = row.contact_office,
    relation.count = toInteger(row.evidence_count),
    relation.evidenceRole = row.evidence_role,
    relation.unanimous = row.unanimous = 'true',
    relation.plurality = row.plurality = 'true',
    relation.categorical = false,
    relation.contactTierCountsJson = row.contact_tier_counts_json,
    relation.provenance = row.provenance;

