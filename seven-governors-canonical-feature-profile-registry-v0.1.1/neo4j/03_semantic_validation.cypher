// Every row returned by a "violations" query requires attention.
// All release-scoped tests use the one active RegistryRelease.

// 1. Exactly one release is active for this registry.
MATCH (release:RegistryRelease {
  registry_name: 'seven-governors-canonical-feature-profile-registry',
  active: true
})
WITH count(release) AS actual
RETURN 'active_release_count' AS test, actual, 1 AS expected,
       actual = 1 AS passed;

// 2. Exactly seven canonical profiles belong to the active release.
MATCH (release:RegistryRelease {
  registry_name: 'seven-governors-canonical-feature-profile-registry',
  active: true
})
MATCH (p:CanonicalFeatureProfile)-[:PART_OF_RELEASE]->(release)
WITH count(p) AS actual
RETURN 'active_canonical_profile_count' AS test, actual, 7 AS expected,
       actual = 7 AS passed;

// 3. Every active profile is the sole ACTIVE_PROFILE of one office.
MATCH (release:RegistryRelease {active: true})
MATCH (p:CanonicalFeatureProfile)-[:PART_OF_RELEASE]->(release)
OPTIONAL MATCH (o:GovernorOffice)-[:ACTIVE_PROFILE]->(p)
WITH p, count(o) AS office_count
WHERE office_count <> 1
RETURN 'active_profile_office_cardinality' AS violation,
       p.profile_id AS profile_id, office_count;

// 4. Canonical profile state matches the base topology office and A0 tier.
MATCH (release:RegistryRelease {active: true})
MATCH (p:CanonicalFeatureProfile)-[:PART_OF_RELEASE]->(release)
MATCH (p)-[:CANONICALIZED_BY]->(s:ScaleState)
WHERE coalesce(s.office, s.governor_office) <> p.office
   OR coalesce(s.tier, s.anchor_tier) <> 'A0'
RETURN 'canonical_state_mismatch' AS violation,
       p.profile_id AS profile_id,
       p.office AS expected_office,
       coalesce(s.office, s.governor_office) AS actual_office,
       coalesce(s.tier, s.anchor_tier) AS actual_tier;

// 5. C_S is an ordered, non-metric semantic coordinate.
MATCH (release:RegistryRelease {active: true})
MATCH (p:CanonicalFeatureProfile)-[:PART_OF_RELEASE]->(release)
WITH count(p) AS profiles,
     min(p.semantic_order) AS minimum_order,
     max(p.semantic_order) AS maximum_order,
     sum(CASE WHEN p.semantic_metric = false THEN 1 ELSE 0 END) AS nonmetric
RETURN 'semantic_coordinate_contract' AS test,
       profiles, minimum_order, maximum_order, nonmetric,
       profiles = 7 AND minimum_order = 1 AND maximum_order = 7
         AND nonmetric = 7 AS passed;

// 6. Photonic coordinates are complete, bounded, and explicitly non-causal.
MATCH (release:RegistryRelease {active: true})
MATCH (r:PhotonicRecord)-[:PART_OF_RELEASE]->(release)
WITH count(r) AS records,
     min(r.photonic_compression) AS minimum,
     max(r.photonic_compression) AS maximum,
     sum(CASE WHEN r.causation_claim = false THEN 1 ELSE 0 END) AS noncausal
RETURN 'photonic_contract' AS test, records, minimum, maximum, noncausal,
       records = 7 AND minimum >= 0.0 AND maximum <= 1.0
         AND noncausal = 7 AS passed;

// 7. All 15 active semantic shells realize one structural MutationOperator.
MATCH (release:RegistryRelease {active: true})
MATCH (s:SemanticOperator)-[:PART_OF_RELEASE]->(release)
OPTIONAL MATCH (s)-[:REALIZES]->(m:MutationOperator)
WITH s, count(m) AS structural_count
RETURN 'semantic_operator_binding' AS test,
       count(s) AS semantic_operators,
       sum(CASE WHEN structural_count = 1 THEN 1 ELSE 0 END) AS bound_once,
       count(s) = 15
         AND sum(CASE WHEN structural_count = 1 THEN 1 ELSE 0 END) = 15
       AS passed;

// 8. Every structural operator points to one active semantic shell.
MATCH (release:RegistryRelease {active: true})
MATCH (s:SemanticOperator)-[:PART_OF_RELEASE]->(release)
MATCH (m:MutationOperator)<-[:REALIZES]-(s)
OPTIONAL MATCH (m)-[:ACTIVE_SEMANTIC_OPERATOR]->(active:SemanticOperator)
WITH m, s, collect(active) AS active_shells
WHERE size(active_shells) <> 1 OR active_shells[0] <> s
RETURN 'active_semantic_operator_binding' AS violation,
       coalesce(m.id, m.operator_id, m.operatorId) AS operator;

// 9. Semantic operators cannot claim a physical mutation.
MATCH (release:RegistryRelease {active: true})
MATCH (s:SemanticOperator)-[:PART_OF_RELEASE]->(release)
WHERE s.physical_mutation <> false
RETURN 'physical_mutation_prohibition' AS violation,
       s.semantic_operator_id AS operator;

// 10. Every active semantic operator retains four unresolved scopes and no
// semantic-effect fixture.
MATCH (release:RegistryRelease {active: true})
MATCH (s:SemanticOperator)-[:PART_OF_RELEASE]->(release)
OPTIONAL MATCH (s)-[:HAS_UNRESOLVED_SCOPE]->(u:SemanticUnresolvedScope)
WITH s, count(u) AS unresolved_count
WHERE unresolved_count <> 4
   OR size(s.semantic_effect_fixture_ids) <> 0
RETURN 'unresolved_semantic_scope_contract' AS violation,
       s.semantic_operator_id AS operator,
       unresolved_count,
       s.semantic_effect_fixture_ids AS semantic_effect_fixture_ids;

// 11. Route history must be excluded from intrinsic fingerprints.
MATCH (release:RegistryRelease {active: true})
MATCH (r:DerivationRoute)-[:PART_OF_RELEASE]->(release)
WHERE r.excluded_from_fingerprint <> true
RETURN 'route_fingerprint_separation' AS violation, r.route_id AS route;

// 12. Every structural fixture's routes converge, and no fixture claims
// semantic-effect evidence.
MATCH (release:RegistryRelease {active: true})
MATCH (f:ValidationFixture)-[:PART_OF_RELEASE]->(release)
MATCH (f)-[:TESTS_ROUTE]->(r:DerivationRoute)
MATCH (r)-[:PRODUCES]->(n:CompiledFeatureProfile)
WITH f, collect(DISTINCT n.intrinsic_fingerprint) AS fingerprints
WHERE size(fingerprints) <> 1
   OR fingerprints[0] <> f.normal_form_fingerprint
   OR f.fixture_class <> 'structural_normalization'
   OR f.semantic_effect_evidence <> false
RETURN 'fixture_contract' AS violation,
       f.fixture_id AS fixture, fingerprints,
       f.normal_form_fingerprint AS expected,
       f.fixture_class AS fixture_class,
       f.semantic_effect_evidence AS semantic_effect_evidence;

// 13. State Governor is intrinsic; Degree Governor remains operator/route data.
MATCH (release:RegistryRelease {active: true})
MATCH (n:CompiledFeatureProfile)-[:PART_OF_RELEASE]->(release)
WHERE n.office IS NULL OR n.office = ''
RETURN 'compiled_office_missing' AS violation,
       n.normal_form_id AS normal_form;

// 14. Reference pools are candidate vocabularies, not hard requirements.
MATCH (release:RegistryRelease {active: true})
MATCH (n:CompiledFeatureProfile)-[:PART_OF_RELEASE]->(release)
WHERE n.office IS NOT NULL
  AND (
    n.reference_pool_json IS NULL
    OR n.reference_pool_json = '[]'
    OR n.required_json CONTAINS '"domain.landforms"'
  )
RETURN 'reference_pool_contract' AS violation,
       n.normal_form_id AS normal_form;

// 15. No resolved semantic effect relationship may appear before admission.
MATCH (release:RegistryRelease {active: true})
MATCH (s:SemanticOperator)-[:PART_OF_RELEASE]->(release)
MATCH (s)-[r:PRESERVES|TRANSFORMS|PROMOTES|SUPPRESSES|PROHIBITS]->()
RETURN 'premature_semantic_promotion' AS violation,
       s.semantic_operator_id AS operator, type(r) AS relation_type;

// 16. CQ/SQ definitions remain scoped to family-under-tuning.
MATCH (release:RegistryRelease {active: true})
MATCH (m:HarmonicMeasureDefinition)-[:PART_OF_RELEASE]->(release)
WHERE m.measure_id IN ['carey_CQ', 'carey_SQ']
  AND m.scope <> 'ScaleFamily_under_tuning'
RETURN 'carey_scope_violation' AS violation,
       m.measure_id AS measure, m.scope AS actual_scope;
