// A. Inspect one fully layered active canonical office profile.
MATCH (o:GovernorOffice)-[:ACTIVE_PROFILE]->(p:CanonicalFeatureProfile)
WHERE coalesce(o.name, o.office) = 'Sun'
MATCH (p)-[:PART_OF_RELEASE]->(release:RegistryRelease {active: true})
MATCH (p)-[:HAS_PHOTONIC_RECORD]->(light:PhotonicRecord)
OPTIONAL MATCH (p)-[claim:HAS_FEATURE]->(f:FeatureDefinition)
RETURN release, o, p, light, claim, f;

// B. Show State Governor separately from Degree Governor for Harmonic Minor.
MATCH (release:RegistryRelease {active: true})
MATCH (source:ScaleState)-[:HAS_NORMAL_FORM]->(nf:CompiledFeatureProfile)
MATCH (nf)-[:PART_OF_RELEASE]->(release)
WHERE toInteger(coalesce(source.scale_id, source.id)) = 2477
MATCH (route:DerivationRoute)-[:PRODUCES]->(nf)
MATCH (route)-[:HAS_STEP]->(:DerivationStep)-[:APPLIES]->(op:SemanticOperator)
RETURN source.name AS state,
       nf.office AS state_governor,
       op.structural_operator_id AS mutation,
       op.degree_governor AS degree_governor,
       nf.intrinsic_fingerprint AS normal_form;

// C. Inspect the Acoustic structural cospan and its single normal form.
MATCH (release:RegistryRelease {active: true})
MATCH (fixture:ValidationFixture {
  fixture_id: 'fixture:acoustic-confluence'
})-[:PART_OF_RELEASE]->(release)
MATCH (fixture)-[:TESTS_ROUTE]->(route:DerivationRoute)
MATCH (route)-[:HAS_STEP]->(step:DerivationStep)
MATCH (step)-[:STARTS_AT]->(source:ScaleState)
MATCH (step)-[:APPLIES]->(operator:SemanticOperator)
MATCH (route)-[:PRODUCES]->(normal:CompiledFeatureProfile)
RETURN fixture.label AS fixture,
       fixture.evidence_scope AS evidence_scope,
       fixture.semantic_effect_evidence AS semantic_effect_evidence,
       source.name AS source,
       operator.structural_operator_id AS operator,
       normal.state_name AS target,
       normal.office AS state_governor,
       normal.intrinsic_fingerprint AS fingerprint
ORDER BY source.name;

// D. Find hypotheses that have structural evidence but unresolved semantics.
MATCH (release:RegistryRelease {active: true})
MATCH (s:SemanticOperator)-[:PART_OF_RELEASE]->(release)
MATCH (s)-[:REALIZES]->(m:MutationOperator)
MATCH (s)-[:HAS_UNRESOLVED_SCOPE]->(u:SemanticUnresolvedScope)
RETURN s.structural_operator_id AS operator,
       s.degree_governor AS degree_governor,
       s.direction AS direction,
       s.semantic_research_priority AS priority,
       s.structural_fixture_ids AS structural_fixture_ids,
       s.semantic_effect_fixture_ids AS semantic_effect_fixture_ids,
       collect(u.label) AS unresolved_scopes
ORDER BY CASE s.semantic_research_priority
  WHEN 'priority_v0.1_sun_moon_axis' THEN 0 ELSE 1 END,
  operator;

// E. Retrieve a deterministic landform creation packet.
MATCH (release:RegistryRelease {active: true})
MATCH (state:ScaleState)-[:HAS_NORMAL_FORM]->(packet:CompiledFeatureProfile)
MATCH (packet)-[:PART_OF_RELEASE]->(release)
WHERE toInteger(coalesce(state.scale_id, state.id)) = 1749
RETURN state.name AS scale_state,
       packet.office AS governor,
       packet.rendering_brief AS brief,
       packet.required_json AS hard_requirements,
       packet.soft_priors_json AS soft_priors,
       packet.reference_pool_json AS reference_pool,
       packet.creative_affordances_json AS creative_affordances,
       packet.prohibited_json AS prohibited_features,
       packet.unresolved_json AS unresolved_features;

// F. Compare C_P, unresolved C_H, and non-metric C_S without conflation.
MATCH (o:GovernorOffice)-[:ACTIVE_PROFILE]->(p:CanonicalFeatureProfile)
MATCH (p)-[:PART_OF_RELEASE]->(:RegistryRelease {active: true})
MATCH (p)-[:HAS_PHOTONIC_RECORD]->(light:PhotonicRecord)
RETURN p.office AS office,
       light.photonic_compression AS C_P,
       'unresolved' AS C_H,
       p.semantic_order AS C_S_order,
       p.semantic_normalized_ordinal AS C_S_display_coordinate,
       p.semantic_metric AS C_S_is_metric,
       p.thermodynamic_function AS ordered_process
ORDER BY p.semantic_order;

// G. Candidate observation ledger for the Sun/Moon mutation axis.
MATCH (release:RegistryRelease {active: true})
MATCH (s:SemanticOperator)-[:PART_OF_RELEASE]->(release)
WHERE s.semantic_research_priority = 'priority_v0.1_sun_moon_axis'
OPTIONAL MATCH (fixture:ValidationFixture)
WHERE fixture.fixture_id IN s.structural_fixture_ids
RETURN s.structural_operator_id AS operator,
       s.degree_governor AS degree_governor,
       s.direction AS direction,
       s.harmonic_action AS exact_harmonic_action,
       collect(fixture.label) AS structural_fixtures,
       false AS semantic_effect_admitted,
       'Observe repeatable domain feature deltas; structural fixtures alone do not authorize semantic promotion.'
         AS experiment_rule;

// H. Inspect release provenance and source fingerprint before compilation.
MATCH (release:RegistryRelease {
  registry_name: 'seven-governors-canonical-feature-profile-registry',
  active: true
})
RETURN release.release_id AS release_id,
       release.registry_version AS version,
       release.release_fingerprint AS release_fingerprint,
       release.source_hashes_json AS frozen_source_hashes;
