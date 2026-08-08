// Seven Governors property-graph constraints and indexes.

CREATE CONSTRAINT scale_state_id IF NOT EXISTS
FOR (state:ScaleState)
REQUIRE state.id IS UNIQUE;

CREATE CONSTRAINT scale_state_node_id IF NOT EXISTS
FOR (state:ScaleState)
REQUIRE state.nodeId IS UNIQUE;

CREATE CONSTRAINT scale_family_forte IF NOT EXISTS
FOR (family:ScaleFamily)
REQUIRE family.forte IS UNIQUE;

CREATE CONSTRAINT governor_office_name IF NOT EXISTS
FOR (office:GovernorOffice)
REQUIRE office.name IS UNIQUE;

CREATE INDEX scale_state_role IF NOT EXISTS
FOR (state:ScaleState)
ON (state.role);

CREATE INDEX scale_state_fine_role IF NOT EXISTS
FOR (state:ScaleState)
ON (state.fineRole);

CREATE INDEX scale_state_tier IF NOT EXISTS
FOR (state:ScaleState)
ON (state.tier);

CREATE INDEX scale_state_office IF NOT EXISTS
FOR (state:ScaleState)
ON (state.office);

CREATE INDEX scale_state_forte IF NOT EXISTS
FOR (state:ScaleState)
ON (state.forte);

CREATE INDEX scale_state_identity_category IF NOT EXISTS
FOR (state:ScaleState)
ON (state.identityCategory);

CREATE INDEX scale_state_relational_office IF NOT EXISTS
FOR (state:ScaleState)
ON (state.relationalOffice);

