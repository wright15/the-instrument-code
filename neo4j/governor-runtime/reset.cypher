// GOV-206 Governor Runtime Graph Projection — Reset (destructive)
// Deletes ONLY Gov* projection labels. Does NOT touch ScaleState,
// ScaleFamily, GovernorOffice, or any frozen topology projection.

MATCH (n)
WHERE n:GovRuntimePolicyRelease
   OR n:GovTypedAspect
   OR n:GovBridgeRule
   OR n:GovClassificationEvidence
   OR n:GovLedgerSnapshot
   OR n:GovGovernorProfileView
   OR n:GovLegalMoveView
   OR n:GovProvenanceSource
   OR n:GovGovernorReference
DETACH DELETE n;