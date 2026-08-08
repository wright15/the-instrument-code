// GOV-206 Governor Runtime Graph Projection — Schema Constraints
// Only Gov* labels and GOV_* relationship types are created here.

CREATE CONSTRAINT gov_runtime_policy_release_id IF NOT EXISTS
FOR (n:GovRuntimePolicyRelease)
REQUIRE n.logicalId IS UNIQUE;

CREATE CONSTRAINT gov_typed_aspect_id IF NOT EXISTS
FOR (n:GovTypedAspect)
REQUIRE n.logicalId IS UNIQUE;

CREATE CONSTRAINT gov_bridge_rule_id IF NOT EXISTS
FOR (n:GovBridgeRule)
REQUIRE n.logicalId IS UNIQUE;

CREATE CONSTRAINT gov_classification_evidence_id IF NOT EXISTS
FOR (n:GovClassificationEvidence)
REQUIRE n.logicalId IS UNIQUE;

CREATE CONSTRAINT gov_ledger_snapshot_id IF NOT EXISTS
FOR (n:GovLedgerSnapshot)
REQUIRE n.logicalId IS UNIQUE;

CREATE CONSTRAINT gov_governor_profile_id IF NOT EXISTS
FOR (n:GovGovernorProfileView)
REQUIRE n.logicalId IS UNIQUE;

CREATE CONSTRAINT gov_legal_move_id IF NOT EXISTS
FOR (n:GovLegalMoveView)
REQUIRE n.logicalId IS UNIQUE;

CREATE CONSTRAINT gov_provenance_source_id IF NOT EXISTS
FOR (n:GovProvenanceSource)
REQUIRE n.logicalId IS UNIQUE;

CREATE CONSTRAINT gov_governor_reference_id IF NOT EXISTS
FOR (n:GovGovernorReference)
REQUIRE n.logicalId IS UNIQUE;

CREATE INDEX gov_aspect_id IF NOT EXISTS
FOR (n:GovTypedAspect)
ON (n.aspectId);

CREATE INDEX gov_rule_id IF NOT EXISTS
FOR (n:GovBridgeRule)
ON (n.ruleId);

CREATE INDEX gov_snapshot_sha IF NOT EXISTS
FOR (n:GovLedgerSnapshot)
ON (n.snapshotSha256);

CREATE INDEX gov_snapshot_task IF NOT EXISTS
FOR (n:GovLedgerSnapshot)
ON (n.taskId);

CREATE INDEX gov_policy_fingerprint IF NOT EXISTS
FOR (n:GovRuntimePolicyRelease)
ON (n.projectionFingerprint);

CREATE INDEX gov_governor_name IF NOT EXISTS
FOR (n:GovGovernorProfileView)
ON (n.governor);

CREATE INDEX gov_governor_ref_name IF NOT EXISTS
FOR (n:GovGovernorReference)
ON (n.governor);