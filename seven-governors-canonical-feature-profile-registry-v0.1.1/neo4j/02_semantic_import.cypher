// Put the files from neo4j/csv in Neo4j's configured import directory.
// Run after the base Seven Governors topology and mutation algebra have loaded.
// This script is idempotent.

LOAD CSV WITH HEADERS FROM 'file:///registry-releases.csv' AS row
MERGE (release:RegistryRelease {
  release_id: row['release_id:ID(RegistryRelease)']
})
SET release.registry_name = row.registry_name,
    release.registry_version = row.registry_version,
    release.generated_at = row.generated_at,
    release.active = toBoolean(row['active:boolean']),
    release.release_fingerprint = row.release_fingerprint,
    release.source_hashes_json = row.source_hashes_json
WITH release
MATCH (other:RegistryRelease {registry_name: release.registry_name})
WHERE other <> release
SET other.active = false;

LOAD CSV WITH HEADERS FROM 'file:///canonical-profiles.csv' AS row
MERGE (p:CanonicalFeatureProfile {
  profile_id: row['profile_id:ID(CanonicalFeatureProfile)']
})
SET p.office = row.office,
    p.office_index = toInteger(row['office_index:int']),
    p.symbol = row.symbol,
    p.canonical_state_id = toInteger(row['canonical_state_id:int']),
    p.canonical_state_name = row.canonical_state_name,
    p.canonical_mode = row.canonical_mode,
    p.forte_family = row.forte_family,
    p.pitch_mask = row.pitch_mask,
    p.anchor_tier = row.anchor_tier,
    p.thermodynamic_function = row.thermodynamic_function,
    p.optical_function = row.optical_function,
    p.directionality = row.directionality,
    p.archetypal_role = row.archetypal_role,
    p.element = CASE WHEN row.element = '' THEN null ELSE row.element END,
    p.semantic_order = toInteger(row['semantic_order:int']),
    p.semantic_normalized_ordinal =
      toFloat(row['semantic_normalized_ordinal:float']),
    p.semantic_metric = toBoolean(row['semantic_metric:boolean']),
    p.semantic_coordinate_status = row.semantic_coordinate_status,
    p.semantic_scale = row.semantic_scale,
    p.fingerprint = row.fingerprint,
    p.profile_version = row.profile_version
WITH row, p
MATCH (release:RegistryRelease {release_id: row.release_id})
MERGE (p)-[:PART_OF_RELEASE]->(release)
WITH row, p
OPTIONAL MATCH (o:GovernorOffice)
WHERE coalesce(o.name, o.office) = row.office
FOREACH (_ IN CASE WHEN o IS NULL THEN [] ELSE [1] END |
  MERGE (o)-[:HAS_CANONICAL_PROFILE]->(p)
)
WITH row, p
OPTIONAL MATCH (s:ScaleState)
WHERE toInteger(coalesce(s.scale_id, s.id)) =
  toInteger(row['canonical_state_id:int'])
FOREACH (_ IN CASE WHEN s IS NULL THEN [] ELSE [1] END |
  MERGE (p)-[:CANONICALIZED_BY]->(s)
);

LOAD CSV WITH HEADERS FROM 'file:///canonical-profiles.csv' AS row
MATCH (p:CanonicalFeatureProfile {
  profile_id: row['profile_id:ID(CanonicalFeatureProfile)']
})
MATCH (office:GovernorOffice)
WHERE coalesce(office.name, office.office) = row.office
OPTIONAL MATCH (office)-[previous:ACTIVE_PROFILE]->(:CanonicalFeatureProfile)
DELETE previous
MERGE (office)-[:ACTIVE_PROFILE]->(p);

LOAD CSV WITH HEADERS FROM 'file:///photonic-records.csv' AS row
MERGE (n:PhotonicRecord {
  photonic_id: row['photonic_id:ID(PhotonicRecord)']
})
SET n.office = row.office,
    n.office_index = toInteger(row['office_index:int']),
    n.wavelength_nm = toFloat(row['wavelength_nm:float']),
    n.frequency_hz = toFloat(row['frequency_hz:float']),
    n.photon_energy_j = toFloat(row['photon_energy_j:float']),
    n.photon_energy_ev = toFloat(row['photon_energy_ev:float']),
    n.photonic_compression = toFloat(row['photonic_compression:float']),
    n.coordinate_symbol = row.coordinate_symbol,
    n.causation_claim = toBoolean(row['causation_claim:boolean']),
    n.policy_json = row.policy_json
WITH row, n
MATCH (release:RegistryRelease {release_id: row.release_id})
MERGE (n)-[:PART_OF_RELEASE]->(release)
WITH row, n, release
MATCH (p:CanonicalFeatureProfile {office: row.office})-[:PART_OF_RELEASE]->(release)
MERGE (p)-[:HAS_PHOTONIC_RECORD]->(n);

LOAD CSV WITH HEADERS FROM 'file:///feature-definitions.csv' AS row
MERGE (f:FeatureDefinition {
  feature_id: row['feature_id:ID(FeatureDefinition)']
})
SET f.label = row.label,
    f.layer = row.layer,
    f.epistemic_class = row.epistemic_class,
    f.data_type = row.data_type,
    f.unit = CASE WHEN row.unit = '' THEN null ELSE row.unit END,
    f.operator_scope = row.operator_scope,
    f.domain_scope = split(row['domain_scope:string[]'], ';'),
    f.description = row.description,
    f.source_json = row.source_json
WITH row, f
MATCH (release:RegistryRelease {release_id: row.release_id})
MERGE (f)-[:PART_OF_RELEASE]->(release);

LOAD CSV WITH HEADERS FROM 'file:///profile-feature-assertions.csv' AS row
MATCH (p:CanonicalFeatureProfile {
  profile_id: row['profile_id:START_ID(CanonicalFeatureProfile)']
})
MATCH (f:FeatureDefinition {
  feature_id: row['feature_id:END_ID(FeatureDefinition)']
})
MERGE (p)-[r:HAS_FEATURE {assertion_id: row.assertion_id}]->(f)
SET r.value_json = row.value_json,
    r.provenance_json = row.provenance_json;

LOAD CSV WITH HEADERS FROM 'file:///harmonic-measure-definitions.csv' AS row
MERGE (m:HarmonicMeasureDefinition {
  measure_id: row['measure_id:ID(HarmonicMeasureDefinition)']
})
SET m.status = row.status,
    m.scope = row.scope,
    m.tuning_requirement = row.tuning_requirement,
    m.definition = row.definition,
    m.topology_use = row.topology_use
WITH row, m
MATCH (release:RegistryRelease {release_id: row.release_id})
MERGE (m)-[:PART_OF_RELEASE]->(release);

LOAD CSV WITH HEADERS FROM 'file:///semantic-operators.csv' AS row
MERGE (s:SemanticOperator {
  semantic_operator_id: row['semantic_operator_id:ID(SemanticOperator)']
})
SET s.structural_operator_id = row.structural_operator_id,
    s.notation = row.notation,
    s.name = row.name,
    s.operator_class = row.operator_class,
    s.degree = CASE
      WHEN row['degree:int'] = '' THEN null
      ELSE toInteger(row['degree:int'])
    END,
    s.degree_governor = CASE
      WHEN row.degree_governor = '' THEN null
      ELSE row.degree_governor
    END,
    s.direction = row.direction,
    s.domain_rule = row.domain_rule,
    s.harmonic_action = row.harmonic_action,
    s.inverse_structural_operator_id = row.inverse_structural_operator_id,
    s.conjugate_structural_operator_id = row.conjugate_structural_operator_id,
    s.semantic_status = row.semantic_status,
    s.semantic_research_priority = row.semantic_research_priority,
    s.physical_mutation = toBoolean(row['physical_mutation:boolean']),
    s.normalization_policy_json = row.normalization_policy_json,
    s.structural_fixture_ids =
      split(row['structural_fixture_ids:string[]'], ';'),
    s.semantic_effect_fixture_ids =
      split(row['semantic_effect_fixture_ids:string[]'], ';'),
    s.registry_version = row.registry_version
WITH row, s
MATCH (release:RegistryRelease {release_id: row.release_id})
MERGE (s)-[:PART_OF_RELEASE]->(release)
WITH row, s
OPTIONAL MATCH (m:MutationOperator)
WHERE coalesce(m.id, m.operator_id, m.operatorId) = row.structural_operator_id
FOREACH (_ IN CASE WHEN m IS NULL THEN [] ELSE [1] END |
  MERGE (s)-[:REALIZES]->(m)
);

LOAD CSV WITH HEADERS FROM 'file:///semantic-operators.csv' AS row
MATCH (s:SemanticOperator {
  semantic_operator_id: row['semantic_operator_id:ID(SemanticOperator)']
})
MATCH (m:MutationOperator)
WHERE coalesce(m.id, m.operator_id, m.operatorId) = row.structural_operator_id
OPTIONAL MATCH (m)-[previous:ACTIVE_SEMANTIC_OPERATOR]->(:SemanticOperator)
DELETE previous
MERGE (m)-[:ACTIVE_SEMANTIC_OPERATOR]->(s);

LOAD CSV WITH HEADERS FROM 'file:///semantic-unresolved-scopes.csv' AS row
MERGE (u:SemanticUnresolvedScope {
  scope_id: row['scope_id:ID(SemanticUnresolvedScope)']
})
SET u.label = row.label,
    u.status = row.status;

LOAD CSV WITH HEADERS FROM 'file:///semantic-operator-unresolved.csv' AS row
MATCH (s:SemanticOperator {
  semantic_operator_id: row['semantic_operator_id:START_ID(SemanticOperator)']
})
MATCH (u:SemanticUnresolvedScope {
  scope_id: row['scope_id:END_ID(SemanticUnresolvedScope)']
})
MERGE (s)-[r:HAS_UNRESOLVED_SCOPE]->(u)
SET r.status = row.status;

LOAD CSV WITH HEADERS FROM 'file:///domain-projections.csv' AS row
MERGE (d:DomainProjection {
  projection_id: row['projection_id:ID(DomainProjection)']
})
SET d.domain = row.domain,
    d.status = row.status,
    d.input_contract = split(row['input_contract:string[]'], ';'),
    d.output_contract = split(row['output_contract:string[]'], ';'),
    d.provenance_json = row.provenance_json
WITH row, d
MATCH (release:RegistryRelease {release_id: row.release_id})
MERGE (d)-[:PART_OF_RELEASE]->(release);

LOAD CSV WITH HEADERS FROM 'file:///landform-references.csv' AS row
MERGE (l:LandformReference {
  landform_id: row['landform_id:ID(LandformReference)']
})
SET l.name = row.name,
    l.status = row.status;

LOAD CSV WITH HEADERS FROM 'file:///profile-landform-references.csv' AS row
MATCH (p:CanonicalFeatureProfile {
  profile_id: row['profile_id:START_ID(CanonicalFeatureProfile)']
})
MATCH (l:LandformReference {
  landform_id: row['landform_id:END_ID(LandformReference)']
})
MERGE (p)-[r:REFERENCES_LANDFORM]->(l)
SET r.reference_order = toInteger(row['reference_order:int']),
    r.authority = row.authority;

MATCH (d:DomainProjection {domain: 'landforms'})
MATCH (f:FeatureDefinition {feature_id: 'domain.landforms'})
MERGE (d)-[:PROJECTS_FEATURE]->(f);

LOAD CSV WITH HEADERS FROM 'file:///compiled-profiles.csv' AS row
MERGE (n:CompiledFeatureProfile {
  normal_form_id: row['normal_form_id:ID(CompiledFeatureProfile)']
})
SET n.state_id = toInteger(row['state_id:int']),
    n.state_name = row.state_name,
    n.office = row.office,
    n.domain = row.domain,
    n.status = row.status,
    n.intrinsic_fingerprint = row.intrinsic_fingerprint,
    n.required_json = row.required_json,
    n.soft_priors_json = row.soft_priors_json,
    n.reference_pool_json = row.reference_pool_json,
    n.promoted_json = row.promoted_json,
    n.suppressed_json = row.suppressed_json,
    n.prohibited_json = row.prohibited_json,
    n.unresolved_json = row.unresolved_json,
    n.creative_affordances_json = row.creative_affordances_json,
    n.rendering_brief = row.rendering_brief
WITH row, n
MATCH (release:RegistryRelease {release_id: row.release_id})
MERGE (n)-[:PART_OF_RELEASE]->(release)
WITH row, n
OPTIONAL MATCH (s:ScaleState)
WHERE toInteger(coalesce(s.scale_id, s.id)) =
  toInteger(row['state_id:int'])
FOREACH (_ IN CASE WHEN s IS NULL THEN [] ELSE [1] END |
  MERGE (s)-[:HAS_NORMAL_FORM]->(n)
);

LOAD CSV WITH HEADERS FROM 'file:///derivation-routes.csv' AS row
MERGE (r:DerivationRoute {
  route_id: row['route_id:ID(DerivationRoute)']
})
SET r.target_state_id = toInteger(row['target_state_id:int']),
    r.operator_ids = split(row['operator_ids:string[]'], ';'),
    r.note = row.note,
    r.excluded_from_fingerprint =
      toBoolean(row['excluded_from_fingerprint:boolean'])
WITH row, r
OPTIONAL MATCH (r)-[old_release:PART_OF_RELEASE]->(:RegistryRelease)
DELETE old_release
WITH row, r
OPTIONAL MATCH (r)-[old_product:PRODUCES]->(:CompiledFeatureProfile)
DELETE old_product
WITH row, r
MATCH (release:RegistryRelease {release_id: row.release_id})
MERGE (r)-[:PART_OF_RELEASE]->(release)
WITH row, r, release
MATCH (n:CompiledFeatureProfile)-[:PART_OF_RELEASE]->(release)
WHERE n.state_id = toInteger(row['target_state_id:int'])
MERGE (r)-[:PRODUCES]->(n);

LOAD CSV WITH HEADERS FROM 'file:///derivation-steps.csv' AS row
MERGE (d:DerivationStep {
  step_id: row['step_id:ID(DerivationStep)']
})
SET d.sequence = toInteger(row['sequence:int']),
    d.source_state_id = toInteger(row['source_state_id:int']),
    d.target_state_id = toInteger(row['target_state_id:int']),
    d.structural_operator_id = row.structural_operator_id,
    d.application_status = row.application_status,
    d.structural_edge_types =
      split(row['structural_edge_types:string[]'], ';'),
    d.field_edge_types = split(row['field_edge_types:string[]'], ';')
WITH row, d
MATCH (r:DerivationRoute {route_id: row.route_id})
MERGE (r)-[:HAS_STEP {sequence: toInteger(row['sequence:int'])}]->(d)
WITH row, d
OPTIONAL MATCH (source:ScaleState)
WHERE toInteger(coalesce(source.scale_id, source.id)) =
  toInteger(row['source_state_id:int'])
FOREACH (_ IN CASE WHEN source IS NULL THEN [] ELSE [1] END |
  MERGE (d)-[:STARTS_AT]->(source)
)
WITH row, d
OPTIONAL MATCH (target:ScaleState)
WHERE toInteger(coalesce(target.scale_id, target.id)) =
  toInteger(row['target_state_id:int'])
FOREACH (_ IN CASE WHEN target IS NULL THEN [] ELSE [1] END |
  MERGE (d)-[:ENDS_AT]->(target)
)
WITH row, d
OPTIONAL MATCH (d)-[old_application:APPLIES]->(:SemanticOperator)
DELETE old_application
WITH row, d
MATCH (structural:MutationOperator)-[:ACTIVE_SEMANTIC_OPERATOR]->
  (operator:SemanticOperator)
WHERE coalesce(structural.id, structural.operator_id, structural.operatorId) =
  row.structural_operator_id
MERGE (d)-[:APPLIES]->(operator);

LOAD CSV WITH HEADERS FROM 'file:///validation-fixtures.csv' AS row
MERGE (f:ValidationFixture {
  fixture_id: row['fixture_id:ID(ValidationFixture)']
})
SET f.label = row.label,
    f.fixture_class = row.fixture_class,
    f.evidence_scope = split(row['evidence_scope:string[]'], ';'),
    f.semantic_effect_evidence =
      toBoolean(row['semantic_effect_evidence:boolean']),
    f.fixture_type = row.fixture_type,
    f.target_state_id = toInteger(row['target_state_id:int']),
    f.target_state_name = row.target_state_name,
    f.expected_office = row.expected_office,
    f.normal_form_fingerprint = row.normal_form_fingerprint,
    f.assertion = row.assertion,
    f.status = row.status
WITH row, f
OPTIONAL MATCH (f)-[old_release:PART_OF_RELEASE]->(:RegistryRelease)
DELETE old_release
WITH row, f
OPTIONAL MATCH (f)-[old_route:TESTS_ROUTE]->(:DerivationRoute)
DELETE old_route
WITH row, f
MATCH (release:RegistryRelease {release_id: row.release_id})
MERGE (f)-[:PART_OF_RELEASE]->(release)
WITH row, f
UNWIND split(row['route_ids:string[]'], ';') AS route_id
MATCH (r:DerivationRoute {route_id: route_id})
MERGE (f)-[:TESTS_ROUTE]->(r);
