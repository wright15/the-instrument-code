// Delete only the isolated GOV-210 namespace. GOV-206, CRT-306, and core topology remain.

MATCH ()-[r:GOV210_ASSIGNS_SKILL|GOV210_DECLARES_AVAILABILITY|GOV210_DECLARES_HOUSING|GOV210_DECLARES_LIFECYCLE|GOV210_HAS_ELIGIBILITY|GOV210_REFERENCES_SKILL|GOV210_TARGETS]->()
DELETE r;

MATCH (n)
WHERE any(label IN labels(n) WHERE label IN [
  'Gov210AvailabilityRelease',
  'Gov210ContextHousing',
  'Gov210CourtTarget',
  'Gov210SkillAssignment',
  'Gov210SkillAvailability',
  'Gov210SkillEligibility',
  'Gov210SkillLifecycle',
  'Gov210TopologyTarget'
])
DETACH DELETE n;
