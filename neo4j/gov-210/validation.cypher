// GOV-210 post-import diagnostics. Every query is read-only and returns zero on success.

MATCH (skill:Gov210SkillAvailability)
WITH count(skill) AS actual
RETURN 'availability_count' AS check, actual, 10 AS expected, actual = 10 AS passed;

MATCH (eligibility:Gov210SkillEligibility)
WITH count(eligibility) AS actual
RETURN 'eligibility_count' AS check, actual, 10 AS expected, actual = 10 AS passed;

MATCH (target:Gov210TopologyTarget)
WITH count(target) AS actual
RETURN 'topology_target_count' AS check, actual, 462 AS expected, actual = 462 AS passed;

MATCH (target:Gov210CourtTarget)
WITH count(target) AS actual
RETURN 'court_target_count' AS check, actual, 5 AS expected, actual = 5 AS passed;

MATCH (assignment:Gov210SkillAssignment)
WITH sum(CASE
  WHEN coalesce(assignment.informationalOnly, false) <> true
    OR coalesce(assignment.runtimeAuthority, true) <> false
  THEN 1 ELSE 0 END) AS violations
RETURN 'assignment_authority_guard' AS check, violations;

MATCH (assignment:Gov210SkillAssignment)
OPTIONAL MATCH (:Gov210SkillEligibility)-[decl:GOV210_ASSIGNS_SKILL]->(assignment)
OPTIONAL MATCH (assignment)-[target:GOV210_TARGETS]->()
WITH assignment, count(DISTINCT decl) AS declarations, count(DISTINCT target) AS targets
WHERE declarations <> 1 OR targets <> 1
RETURN 'assignment_endpoint_closure' AS check, count(assignment) AS violations;

MATCH (release:Gov210AvailabilityRelease)
WITH collect(release) AS releases
RETURN 'release_identity' AS check, size(releases) AS actual, 1 AS expected,
       size(releases) = 1
       AND releases[0].releaseId = 'gov-210-availability-housing:1.0.0'
       AND releases[0].authority = 'informational_catalog_only'
       AND coalesce(releases[0].runtimeAuthority, true) = false AS passed;

MATCH (assignment:Gov210SkillAssignment)
WITH count(assignment) AS actual
RETURN 'assignment_count' AS check, actual, 1873 AS expected, actual = 1873 AS passed;

MATCH (skill:Gov210SkillAvailability)
WITH collect(skill.skillId) AS ids,
     collect(DISTINCT skill.registryNamespace) AS namespaces,
     collect(DISTINCT skill.registrySha256) AS registryHashes
WITH ids, namespaces, registryHashes,
     ['classify_governor', 'inspect_context', 'inspect_court_state',
      'list_legal_court_moves', 'list_legal_moves', 'project_through_court',
      'validate_and_execute_court_transition', 'validate_and_execute_move',
      'verify_court_postcondition', 'verify_outcome'] AS expectedIds
RETURN 'exact_registry_skill_coverage' AS check,
       size(ids) AS actual, size(expectedIds) AS expected,
       size(ids) = size(expectedIds)
       AND all(id IN expectedIds WHERE id IN ids)
       AND all(id IN ids WHERE id IN expectedIds)
       AND all(namespace IN ['governor', 'court'] WHERE namespace IN namespaces)
       AND size(registryHashes) = 2 AS passed;

MATCH (assignment:Gov210SkillAssignment)
WHERE assignment.skillId IN ['list_legal_moves', 'validate_and_execute_move', 'verify_outcome']
UNWIND assignment.applicationIds AS applicationId
WITH assignment.skillId AS skillId, count(DISTINCT applicationId) AS actual
RETURN 'mutation_application_basis_closure' AS check, skillId, actual, 3402 AS expected,
       actual = 3402 AS passed
ORDER BY skillId;

MATCH (assignment:Gov210SkillAssignment)
WHERE assignment.skillId IN ['list_legal_moves', 'validate_and_execute_move', 'verify_outcome']
UNWIND assignment.operatorIds AS operatorId
WITH count(DISTINCT operatorId) AS actual
RETURN 'mutation_operator_basis_closure' AS check, actual, 15 AS expected,
       actual = 15 AS passed;

MATCH (assignment:Gov210SkillAssignment)
WHERE assignment.skillId IN ['list_legal_court_moves',
  'validate_and_execute_court_transition', 'verify_court_postcondition']
UNWIND assignment.basisIds AS basisId
WITH assignment.skillId AS skillId, count(DISTINCT basisId) AS actual
RETURN 'court_move_basis_closure' AS check, skillId, actual, 8 AS expected,
       actual = 8 AS passed
ORDER BY skillId;

MATCH (assignment:Gov210SkillAssignment {skillId: 'project_through_court'})
UNWIND assignment.basisIds AS basisId
WITH count(DISTINCT basisId) AS actual
RETURN 'court_filter_basis_closure' AS check, actual, 5 AS expected,
       actual = 5 AS passed;

MATCH (n)
WHERE any(label IN labels(n) WHERE label STARTS WITH 'Gov210')
WITH collect(DISTINCT n.projectionFingerprint) AS fingerprints
RETURN 'node_projection_fingerprint_unity' AS check, size(fingerprints) AS actual,
       1 AS expected, size(fingerprints) = 1 AS passed;

MATCH ()-[r]->()
WHERE type(r) STARTS WITH 'GOV210_'
WITH collect(DISTINCT r.projectionFingerprint) AS fingerprints
RETURN 'relationship_projection_fingerprint_unity' AS check,
       size(fingerprints) AS actual, 1 AS expected,
       size(fingerprints) = 1 AS passed;

CALL {
  MATCH ()-[r]->() WHERE type(r) STARTS WITH 'GOV210_'
  RETURN count(r) AS actual
}
CALL {
  MATCH (:Gov210ContextHousing) RETURN count(*) AS housingCount
}
CALL {
  MATCH (:Gov210SkillLifecycle) RETURN count(*) AS lifecycleCount
}
WITH actual, 3766 + housingCount + (2 * lifecycleCount) AS expected
RETURN 'relationship_count' AS check, actual, expected, actual = expected AS passed;

MATCH (release:Gov210AvailabilityRelease)
OPTIONAL MATCH (release)-[declaration:GOV210_DECLARES_AVAILABILITY]->(skill:Gov210SkillAvailability)
WITH release, count(DISTINCT declaration) AS declarations,
     count(DISTINCT skill) AS skills
RETURN 'release_availability_closure' AS check,
       declarations, skills, declarations = 10 AND skills = 10 AS passed;

MATCH (skill:Gov210SkillAvailability)
OPTIONAL MATCH (skill)-[edge:GOV210_HAS_ELIGIBILITY]->(eligibility:Gov210SkillEligibility)
WITH skill, count(DISTINCT edge) AS edges, count(DISTINCT eligibility) AS eligibilities
WHERE edges <> 1 OR eligibilities <> 1
RETURN 'availability_eligibility_closure' AS check, count(skill) AS violations;

MATCH (skill:Gov210SkillAvailability)-[:GOV210_HAS_ELIGIBILITY]->(eligibility:Gov210SkillEligibility)
WHERE skill.skillId <> eligibility.skillId
   OR skill.registryNamespace <> eligibility.registryNamespace
RETURN 'availability_eligibility_semantic_closure' AS check,
       count(skill) AS violations;

MATCH (eligibility:Gov210SkillEligibility)-[:GOV210_ASSIGNS_SKILL]->(assignment:Gov210SkillAssignment)
WHERE eligibility.skillId <> assignment.skillId
   OR eligibility.basisSelector <> assignment.basisKind
   OR eligibility.targetNamespace <> assignment.targetNamespace
RETURN 'eligibility_assignment_semantic_closure' AS check,
       count(assignment) AS violations;

MATCH (assignment:Gov210SkillAssignment)-[:GOV210_TARGETS]->(target)
WHERE (assignment.targetNamespace = 'topology'
       AND (NOT target:Gov210TopologyTarget OR assignment.targetId <> target.scaleStateId))
   OR (assignment.targetNamespace = 'court'
       AND (NOT target:Gov210CourtTarget OR assignment.targetId <> target.positionId))
   OR NOT assignment.targetNamespace IN ['topology', 'court']
RETURN 'assignment_target_semantic_closure' AS check,
       count(assignment) AS violations;

MATCH (housing:Gov210ContextHousing)
OPTIONAL MATCH (:Gov210AvailabilityRelease)-[edge:GOV210_DECLARES_HOUSING]->(housing)
WITH housing, count(DISTINCT edge) AS declarations
WHERE declarations <> 1
RETURN 'housing_declaration_closure' AS check, count(housing) AS violations;

MATCH (event:Gov210SkillLifecycle)
OPTIONAL MATCH (:Gov210AvailabilityRelease)-[declaration:GOV210_DECLARES_LIFECYCLE]->(event)
OPTIONAL MATCH (event)-[reference:GOV210_REFERENCES_SKILL]->(skill:Gov210SkillAvailability)
WITH event, count(DISTINCT declaration) AS declarations,
     count(DISTINCT reference) AS references, collect(DISTINCT skill.skillId) AS skillIds
WHERE declarations <> 1 OR references <> 1 OR NOT event.skillId IN skillIds
RETURN 'lifecycle_relationship_closure' AS check, count(event) AS violations;
