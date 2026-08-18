// Delete only detached audit realizations and their relationships.
MATCH (audit:PentatonicAuditRealization)
DETACH DELETE audit;
