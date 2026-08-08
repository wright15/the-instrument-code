// Seven Governors Canonical Feature Profile + Semantic Operator Registry
// Neo4j 5.x constraints and indexes. Safe to rerun.

CREATE CONSTRAINT registry_release_id IF NOT EXISTS
FOR (n:RegistryRelease) REQUIRE n.release_id IS UNIQUE;

CREATE CONSTRAINT canonical_profile_id IF NOT EXISTS
FOR (n:CanonicalFeatureProfile) REQUIRE n.profile_id IS UNIQUE;

CREATE CONSTRAINT photonic_record_id IF NOT EXISTS
FOR (n:PhotonicRecord) REQUIRE n.photonic_id IS UNIQUE;

CREATE CONSTRAINT feature_definition_id IF NOT EXISTS
FOR (n:FeatureDefinition) REQUIRE n.feature_id IS UNIQUE;

CREATE CONSTRAINT harmonic_measure_id IF NOT EXISTS
FOR (n:HarmonicMeasureDefinition) REQUIRE n.measure_id IS UNIQUE;

CREATE CONSTRAINT semantic_operator_id IF NOT EXISTS
FOR (n:SemanticOperator) REQUIRE n.semantic_operator_id IS UNIQUE;

CREATE CONSTRAINT semantic_unresolved_scope_id IF NOT EXISTS
FOR (n:SemanticUnresolvedScope) REQUIRE n.scope_id IS UNIQUE;

CREATE CONSTRAINT domain_projection_id IF NOT EXISTS
FOR (n:DomainProjection) REQUIRE n.projection_id IS UNIQUE;

CREATE CONSTRAINT landform_reference_id IF NOT EXISTS
FOR (n:LandformReference) REQUIRE n.landform_id IS UNIQUE;

CREATE CONSTRAINT compiled_profile_id IF NOT EXISTS
FOR (n:CompiledFeatureProfile) REQUIRE n.normal_form_id IS UNIQUE;

CREATE CONSTRAINT derivation_route_id IF NOT EXISTS
FOR (n:DerivationRoute) REQUIRE n.route_id IS UNIQUE;

CREATE CONSTRAINT derivation_step_id IF NOT EXISTS
FOR (n:DerivationStep) REQUIRE n.step_id IS UNIQUE;

CREATE CONSTRAINT validation_fixture_id IF NOT EXISTS
FOR (n:ValidationFixture) REQUIRE n.fixture_id IS UNIQUE;

CREATE INDEX canonical_profile_office IF NOT EXISTS
FOR (n:CanonicalFeatureProfile) ON (n.office);

CREATE INDEX semantic_operator_structural_id IF NOT EXISTS
FOR (n:SemanticOperator) ON (n.structural_operator_id);

CREATE INDEX compiled_profile_fingerprint IF NOT EXISTS
FOR (n:CompiledFeatureProfile) ON (n.intrinsic_fingerprint);

CREATE INDEX registry_release_active IF NOT EXISTS
FOR (n:RegistryRelease) ON (n.registry_name, n.active);
