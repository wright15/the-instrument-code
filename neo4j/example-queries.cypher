// Familiar queries for exploring the Seven Governors topology.

// 1. Every categorical Jupiter state, ordered by tier and role.
MATCH (state:ScaleState)-[:OCCUPIES_OFFICE]->
      (:GovernorOffice {name: 'Jupiter'})
RETURN state.id,
       state.name,
       state.forte,
       state.tier,
       state.role,
       state.identityType
ORDER BY state.tier, state.role, state.id;

// 2. Harmonic Minor and its selected Governor parent.
MATCH (parent:ScaleState)-[relation:GOVERNS]->(state:ScaleState)
WHERE toLower(state.name) CONTAINS 'harmonic minor'
RETURN parent.name AS parent,
       parent.office AS inheritedOffice,
       state.name AS satellite,
       relation.mode,
       relation.mutation,
       relation.degree,
       relation.degreeGovernor;

// 3. Acoustic as a two-parent A1 construction.
MATCH (parent:ScaleState)-[relation:CONSTRUCTS]->
      (acoustic:ScaleState {id: 1749})
RETURN parent.name,
       parent.office,
       relation.mode,
       relation.mutation,
       acoustic.name,
       acoustic.office,
       acoustic.officeAuthority;

// 4. D7 terminal anchor proof for one selected office.
MATCH (contact:ScaleState)-[relation:SEAT_CONTACT]-
      (anchor:ScaleState {tier: 'D7', office: 'Jupiter'})
RETURN anchor.id,
       anchor.name,
       anchor.office,
       contact.id AS contactId,
       contact.name AS contact,
       contact.orientation,
       relation.mode,
       relation.phaseDelta;

// 5. Boundary states with unanimous relational Venus evidence.
MATCH (state:ScaleState)-[evidence:RELATIONAL_OFFICE_EVIDENCE]->
      (:GovernorOffice {name: 'Venus'})
WHERE state.role = 'boundary' AND evidence.unanimous = true
RETURN state.id,
       state.name,
       state.forte,
       state.fineRole,
       evidence.count,
       state.relationalOffice
ORDER BY state.forte, state.id;

// 6. Mixed-office evidence vector for a junction.
MATCH (junction:ScaleState {fineRole: 'office_junction'})
      -[evidence:RELATIONAL_OFFICE_EVIDENCE]->
      (office:GovernorOffice)
WITH junction,
     collect({
       office: office.name,
       contacts: evidence.count,
       plurality: evidence.plurality
     }) AS evidenceVector
RETURN junction.id,
       junction.name,
       junction.forte,
       junction.pluralityContactOffice,
       evidenceVector
ORDER BY junction.id;

// 7. A fixed-tonic path and a phase path remain distinguishable.
MATCH path=(source:ScaleState)-[relation]-(target:ScaleState)
WHERE type(relation) IN ['AUDITED_HAMMING2', 'PHASE_SHIFT']
  AND source.id IN [2773, 1387]
RETURN source.name,
       type(relation) AS relationType,
       relation.mode,
       relation.phaseDeltasJson,
       target.name
LIMIT 50;

// 8. Count categorical states and relational evidence beneath each office.
MATCH (office:GovernorOffice)
OPTIONAL MATCH (categorical:ScaleState)-[:OCCUPIES_OFFICE]->(office)
WITH office, count(DISTINCT categorical) AS categoricalStates
OPTIONAL MATCH (boundary:ScaleState)
      -[:RELATIONAL_OFFICE_EVIDENCE]->(office)
RETURN office.officeIndex,
       office.name,
       categoricalStates,
       count(DISTINCT boundary) AS boundaryEvidenceStates
ORDER BY office.officeIndex;

