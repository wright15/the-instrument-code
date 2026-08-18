// Detached pentatonic binding audit schema. Never install in the active graph.

CREATE CONSTRAINT pentatonic_audit_realization_witness_id IF NOT EXISTS
FOR (n:PentatonicAuditRealization) REQUIRE n.witnessId IS UNIQUE;

CREATE INDEX pentatonic_audit_realization_mask IF NOT EXISTS
FOR (n:PentatonicAuditRealization) ON (n.pitchMask);
