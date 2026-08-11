// GOV-210 isolated availability and housing read-projection constraints.

CREATE CONSTRAINT gov210_release_logical_id IF NOT EXISTS
FOR (n:Gov210AvailabilityRelease) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT gov210_availability_logical_id IF NOT EXISTS
FOR (n:Gov210SkillAvailability) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT gov210_eligibility_logical_id IF NOT EXISTS
FOR (n:Gov210SkillEligibility) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT gov210_assignment_logical_id IF NOT EXISTS
FOR (n:Gov210SkillAssignment) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT gov210_topology_target_logical_id IF NOT EXISTS
FOR (n:Gov210TopologyTarget) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT gov210_court_target_logical_id IF NOT EXISTS
FOR (n:Gov210CourtTarget) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT gov210_housing_logical_id IF NOT EXISTS
FOR (n:Gov210ContextHousing) REQUIRE n.logicalId IS UNIQUE;
CREATE CONSTRAINT gov210_lifecycle_logical_id IF NOT EXISTS
FOR (n:Gov210SkillLifecycle) REQUIRE n.logicalId IS UNIQUE;

CREATE CONSTRAINT gov210_availability_skill_id IF NOT EXISTS
FOR (n:Gov210SkillAvailability) REQUIRE n.skillId IS UNIQUE;
CREATE CONSTRAINT gov210_eligibility_id IF NOT EXISTS
FOR (n:Gov210SkillEligibility) REQUIRE n.eligibilityId IS UNIQUE;
CREATE CONSTRAINT gov210_assignment_id IF NOT EXISTS
FOR (n:Gov210SkillAssignment) REQUIRE n.assignmentId IS UNIQUE;
CREATE CONSTRAINT gov210_topology_target_id IF NOT EXISTS
FOR (n:Gov210TopologyTarget) REQUIRE n.scaleStateId IS UNIQUE;
CREATE CONSTRAINT gov210_court_target_id IF NOT EXISTS
FOR (n:Gov210CourtTarget) REQUIRE n.positionId IS UNIQUE;
CREATE CONSTRAINT gov210_housing_id IF NOT EXISTS
FOR (n:Gov210ContextHousing) REQUIRE n.housingId IS UNIQUE;
CREATE CONSTRAINT gov210_lifecycle_event_id IF NOT EXISTS
FOR (n:Gov210SkillLifecycle) REQUIRE n.eventId IS UNIQUE;

CREATE INDEX gov210_assignment_skill IF NOT EXISTS
FOR (n:Gov210SkillAssignment) ON (n.skillId);
CREATE INDEX gov210_assignment_target IF NOT EXISTS
FOR (n:Gov210SkillAssignment) ON (n.targetNamespace, n.targetId);
