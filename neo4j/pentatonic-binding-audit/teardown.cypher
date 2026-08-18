// Remove every schema object owned by the detached audit.
DROP INDEX pentatonic_audit_realization_mask IF EXISTS;
DROP CONSTRAINT pentatonic_audit_realization_witness_id IF EXISTS;
