// Seven Governors executable topology invariants.
// Every statement must return result = PASS.

MATCH (state:ScaleState)
WITH count(state) AS actual
RETURN 'scale_state_count' AS check,
       CASE actual WHEN 462 THEN 'PASS' ELSE 'FAIL' END AS result,
       actual AS observed,
       462 AS expected;

MATCH (family:ScaleFamily)
WITH count(family) AS actual
RETURN 'scale_family_count' AS check,
       CASE actual WHEN 38 THEN 'PASS' ELSE 'FAIL' END AS result,
       actual AS observed,
       38 AS expected;

MATCH (office:GovernorOffice)
WITH count(office) AS actual
RETURN 'governor_office_count' AS check,
       CASE actual WHEN 7 THEN 'PASS' ELSE 'FAIL' END AS result,
       actual AS observed,
       7 AS expected;

MATCH (state:ScaleState)
WITH state.role AS role, count(*) AS actual
WITH collect({role: role, actual: actual}) AS counts
WITH counts,
     [entry IN counts WHERE
       (entry.role = 'anchor' AND entry.actual <> 70) OR
       (entry.role = 'satellite' AND entry.actual <> 238) OR
       (entry.role = 'boundary' AND entry.actual <> 154)
     ] AS failures
RETURN 'role_partition_70_238_154' AS check,
       CASE size(failures) WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       counts AS observed,
       'anchor=70, satellite=238, boundary=154' AS expected;

MATCH (state:ScaleState)
WITH state.identityCategory AS category, count(*) AS actual
WITH collect({category: category, actual: actual}) AS counts
WITH counts,
     [entry IN counts WHERE
       (entry.category = 'A' AND entry.actual <> 21) OR
       (entry.category = 'D' AND entry.actual <> 49) OR
       (entry.category = 'SATELLITE' AND entry.actual <> 238) OR
       (entry.category = 'BOUNDARY' AND entry.actual <> 154)
     ] AS failures
RETURN 'identity_partition' AS check,
       CASE size(failures) WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       counts AS observed,
       'A=21, D=49, SATELLITE=238, BOUNDARY=154' AS expected;

MATCH (boundary:ScaleState {role: 'boundary'})
OPTIONAL MATCH (boundary)-[seat:OCCUPIES_OFFICE]->(:GovernorOffice)
WITH boundary, count(seat) AS seatCount
WITH count(CASE
  WHEN boundary.office IS NOT NULL
    OR boundary.tier IS NOT NULL
    OR boundary.hasGovernorSeat
    OR seatCount <> 0
  THEN 1 END) AS violations
RETURN 'boundary_office_withheld' AS check,
       CASE violations WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       violations AS observed,
       0 AS expected;

MATCH (state:ScaleState)
OPTIONAL MATCH (state)-[seat:OCCUPIES_OFFICE]->(:GovernorOffice)
WITH state, count(seat) AS seatCount
WITH count(CASE
  WHEN (state.office IS NOT NULL AND seatCount <> 1)
    OR (state.office IS NULL AND seatCount <> 0)
  THEN 1 END) AS violations
RETURN 'categorical_office_projection' AS check,
       CASE violations WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       violations AS observed,
       0 AS expected;

MATCH (state:ScaleState)
OPTIONAL MATCH (state)-[membership:BELONGS_TO_FAMILY]->(:ScaleFamily)
WITH state, count(membership) AS membershipCount
WITH count(CASE WHEN membershipCount <> 1 THEN 1 END) AS violations
RETURN 'one_family_per_state' AS check,
       CASE violations WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       violations AS observed,
       0 AS expected;

MATCH (satellite:ScaleState {role: 'satellite'})
OPTIONAL MATCH (:ScaleState)-[governs:GOVERNS]->(satellite)
WITH satellite, count(governs) AS parentCount
WITH count(CASE WHEN parentCount <> 1 THEN 1 END) AS violations
RETURN 'one_governing_parent_per_satellite' AS check,
       CASE violations WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       violations AS observed,
       0 AS expected;

MATCH (parent:ScaleState)-[governs:GOVERNS]->(satellite:ScaleState)
WITH count(CASE
  WHEN parent.role <> 'anchor'
    OR satellite.role <> 'satellite'
    OR parent.office <> satellite.office
    OR parent.tier <> satellite.tier
    OR governs.governing <> true
    OR governs.hamming <> 2
  THEN 1 END) AS violations
RETURN 'governing_inheritance_consistency' AS check,
       CASE violations WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       violations AS observed,
       0 AS expected;

MATCH (anchor:ScaleState {role: 'anchor'})
WHERE anchor.identityCategory = 'A'
WITH count(CASE WHEN anchor.chirality <> 'achiral' THEN 1 END) AS violations
RETURN 'A_anchor_achirality' AS check,
       CASE violations WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       violations AS observed,
       0 AS expected;

MATCH (anchor:ScaleState {role: 'anchor'})
WHERE anchor.tier IN ['A1', 'A2']
OPTIONAL MATCH (:ScaleState)-[construction:CONSTRUCTS]->(anchor)
WITH anchor, count(construction) AS parentCount
WITH count(CASE WHEN parentCount <> 2 THEN 1 END) AS violations
RETURN 'A1_A2_two_parent_construction' AS check,
       CASE violations WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       violations AS observed,
       0 AS expected;

MATCH (anchor:ScaleState {role: 'anchor'})
WITH anchor.tier AS tier, count(*) AS actual
WITH collect({tier: tier, actual: actual}) AS counts
WITH counts, [entry IN counts WHERE entry.actual <> 7] AS failures
RETURN 'seven_anchors_per_tier' AS check,
       CASE size(failures) WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       counts AS observed,
       '7 anchors in each of A0,A1,A2,D1-D7' AS expected;

MATCH (anchor:ScaleState {role: 'anchor'})
OPTIONAL MATCH (anchor)-[outgoing:MODAL_SUCCESSOR]->(next:ScaleState)
WHERE next.role = 'anchor' AND next.tier = anchor.tier
WITH anchor, count(outgoing) AS outgoingCount
OPTIONAL MATCH (previous:ScaleState)-[incoming:MODAL_SUCCESSOR]->(anchor)
WHERE previous.role = 'anchor' AND previous.tier = anchor.tier
WITH anchor, outgoingCount, count(incoming) AS incomingCount
WITH count(CASE
  WHEN outgoingCount <> 1 OR incomingCount <> 1 THEN 1 END) AS violations
RETURN 'anchor_modal_cycle_degree' AS check,
       CASE violations WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       violations AS observed,
       0 AS expected;

MATCH (anchor:ScaleState {role: 'anchor'})
      -[:MODAL_SUCCESSOR]->(next:ScaleState {role: 'anchor'})
WHERE anchor.tier = next.tier
WITH count(CASE
  WHEN next.officeIndex <> (anchor.officeIndex + 2) % 7
  THEN 1 END) AS violations
RETURN 'anchor_governor_permutation_plus_2' AS check,
       CASE violations WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       violations AS observed,
       0 AS expected;

MATCH (anchor:ScaleState {role: 'anchor'})
WHERE anchor.tier STARTS WITH 'D'
WITH anchor,
     CASE anchor.tier
       WHEN 'D1' THEN 4
       WHEN 'D2' THEN 2
       WHEN 'D3' THEN 4
       WHEN 'D4' THEN 2
       WHEN 'D5' THEN 2
       WHEN 'D6' THEN 4
       WHEN 'D7' THEN 2
     END AS expectedContacts
WITH count(CASE
  WHEN anchor.seatContactCount <> expectedContacts THEN 1 END) AS violations
RETURN 'D_tier_declared_seat_signatures' AS check,
       CASE violations WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       violations AS observed,
       0 AS expected;

MATCH (d7:ScaleState {role: 'anchor', tier: 'D7'})
OPTIONAL MATCH (d7)-[:SEAT_CONTACT]-(contact:ScaleState)
WITH d7, collect(contact.orientation) AS orientations, count(contact) AS contacts
WITH count(CASE
  WHEN d7.forte <> '7-1'
    OR d7.chirality <> 'achiral'
    OR d7.identityType <> 'terminal_convergence_anchor'
    OR contacts <> 2
    OR size([orientation IN orientations
             WHERE orientation = '7-2 orientation A']) <> 1
    OR size([orientation IN orientations
             WHERE orientation = '7-2 orientation B']) <> 1
  THEN 1 END) AS violations
RETURN 'D7_terminal_orientation_pair' AS check,
       CASE violations WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       violations AS observed,
       0 AS expected;

MATCH (state:ScaleState {tier: 'D7', role: 'satellite'})
WITH count(state) AS actual
RETURN 'D7_no_satellites' AS check,
       CASE actual WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       actual AS observed,
       0 AS expected;

MATCH (boundary:ScaleState {role: 'boundary'})
WITH boundary.fineRole AS boundaryType, count(*) AS actual
WITH collect({boundaryType: boundaryType, actual: actual}) AS counts
WITH counts,
     [entry IN counts WHERE
       (entry.boundaryType = 'oriented_convergence' AND entry.actual <> 84) OR
       (entry.boundaryType = 'office_junction' AND entry.actual <> 56) OR
       (entry.boundaryType = 'peripheral_leaf' AND entry.actual <> 14)
     ] AS failures
RETURN 'typed_boundary_partition' AS check,
       CASE size(failures) WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       counts AS observed,
       'oriented_convergence=84, office_junction=56, peripheral_leaf=14' AS expected;

MATCH (state:ScaleState {fineRole: 'oriented_convergence'})
OPTIONAL MATCH (state)-[evidence:RELATIONAL_OFFICE_EVIDENCE]->
               (:GovernorOffice)
WITH state, collect(evidence) AS evidenceEdges
WITH count(CASE
  WHEN state.relationalOffice IS NULL
    OR state.contactCount < 2
    OR size(evidenceEdges) <> 1
    OR evidenceEdges[0].unanimous <> true
    OR evidenceEdges[0].categorical <> false
  THEN 1 END) AS violations
RETURN 'oriented_convergence_identity' AS check,
       CASE violations WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       violations AS observed,
       0 AS expected;

MATCH (state:ScaleState {fineRole: 'office_junction'})
OPTIONAL MATCH (state)-[evidence:RELATIONAL_OFFICE_EVIDENCE]->
               (:GovernorOffice)
WITH state, collect(evidence) AS evidenceEdges
WITH count(CASE
  WHEN state.pluralityContactOffice IS NULL
    OR size(evidenceEdges) < 2
    OR size([edge IN evidenceEdges WHERE edge.plurality = true]) <> 1
  THEN 1 END) AS violations
RETURN 'office_junction_identity' AS check,
       CASE violations WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       violations AS observed,
       0 AS expected;

MATCH (state:ScaleState {fineRole: 'peripheral_leaf'})
OPTIONAL MATCH (state)-[evidence:RELATIONAL_OFFICE_EVIDENCE]->
               (:GovernorOffice)
WITH state, collect(evidence) AS evidenceEdges
WITH count(CASE
  WHEN state.contactCount <> 1
    OR size(evidenceEdges) <> 1
    OR evidenceEdges[0].count <> 1
  THEN 1 END) AS violations
RETURN 'peripheral_leaf_identity' AS check,
       CASE violations WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       violations AS observed,
       0 AS expected;

MATCH (state:ScaleState)-[evidence:RELATIONAL_OFFICE_EVIDENCE]->
      (:GovernorOffice)
WITH count(CASE
  WHEN state.role <> 'boundary'
    OR evidence.categorical <> false
    OR evidence.governing <> false
  THEN 1 END) AS violations,
  count(evidence) AS evidenceCount
RETURN 'relational_evidence_is_non_categorical' AS check,
       CASE
         WHEN violations = 0 AND evidenceCount = 224 THEN 'PASS'
         ELSE 'FAIL'
       END AS result,
       {violations: violations, evidenceCount: evidenceCount} AS observed,
       {violations: 0, evidenceCount: 224} AS expected;

MATCH ()-[relation]->()
WHERE type(relation) IN [
  'GOVERNS',
  'CONSTRUCTS',
  'SEAT_CONTACT',
  'AUDITED_HAMMING2',
  'CONVERGENCE_CONTACT',
  'JUNCTION_CONTACT',
  'LEAF_CONTACT'
]
AND relation.mode IN ['single_degree', 'fixed']
WITH count(CASE WHEN relation.hamming <> 2 THEN 1 END) AS violations
RETURN 'fixed_relation_Hamming_2' AS check,
       CASE violations WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       violations AS observed,
       0 AS expected;

MATCH ()-[relation]->()
WHERE type(relation) IN [
  'GOVERNS',
  'CONSTRUCTS',
  'SEAT_CONTACT',
  'CONVERGENCE_CONTACT',
  'JUNCTION_CONTACT',
  'LEAF_CONTACT'
]
AND relation.mode = 'root_phase'
WITH count(CASE
  WHEN NOT relation.phaseDelta IN [-1, 1] THEN 1 END) AS violations
RETURN 'directed_root_phase_delta' AS check,
       CASE violations WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       violations AS observed,
       0 AS expected;

MATCH ()-[phase:PHASE_SHIFT]->()
WITH count(CASE
  WHEN phase.phaseDeltasJson <> '[-1,1]' THEN 1 END) AS violations,
  count(phase) AS actual
RETURN 'historical_phase_inverse_pair' AS check,
       CASE
         WHEN violations = 0 AND actual = 175 THEN 'PASS'
         ELSE 'FAIL'
       END AS result,
       {violations: violations, relations: actual} AS observed,
       {violations: 0, relations: 175} AS expected;

MATCH (state:ScaleState)-[:OCCUPIES_OFFICE]->(office:GovernorOffice)
WITH office.name AS office, count(state) AS actual
WITH collect({office: office, actual: actual}) AS counts
WITH counts, [entry IN counts WHERE entry.actual <> 44] AS failures
RETURN '44_states_per_governor_office' AS check,
       CASE size(failures) WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       counts AS observed,
       44 AS expectedPerOffice;

MATCH (state:ScaleState)-[:OCCUPIES_OFFICE]->(office:GovernorOffice)
WITH office.name AS office, count(state) AS actual
WITH collect({office: office, actual: actual}) AS counts
WITH counts, [entry IN counts WHERE entry.actual <> 44] AS failures
RETURN 'everyOfficeHasFortyThreeStates_alias' AS check,
       CASE size(failures) WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       counts AS observed,
       'legacy 43 → 44 alias: 308/7=44 post-D7, everyOfficeHasFortyThreeStates renamed' AS expected;

MATCH ()-[relation]->()
WITH type(relation) AS relationshipType, count(*) AS actual
WITH collect({relationshipType: relationshipType, actual: actual}) AS counts
WITH counts,
     [entry IN counts WHERE
       (entry.relationshipType = 'GOVERNS' AND entry.actual <> 238) OR
       (entry.relationshipType = 'CONSTRUCTS' AND entry.actual <> 28) OR
       (entry.relationshipType = 'SEAT_CONTACT' AND entry.actual <> 140) OR
       (entry.relationshipType = 'MODAL_SUCCESSOR' AND entry.actual <> 182) OR
       (entry.relationshipType = 'AUDITED_HAMMING2' AND entry.actual <> 585) OR
       (entry.relationshipType = 'PHASE_SHIFT' AND entry.actual <> 175) OR
       (entry.relationshipType = 'CONVERGENCE_CONTACT' AND entry.actual <> 210) OR
       (entry.relationshipType = 'JUNCTION_CONTACT' AND entry.actual <> 252) OR
       (entry.relationshipType = 'LEAF_CONTACT' AND entry.actual <> 14) OR
       (entry.relationshipType = 'BELONGS_TO_FAMILY' AND entry.actual <> 462) OR
       (entry.relationshipType = 'OCCUPIES_OFFICE' AND entry.actual <> 308) OR
       (entry.relationshipType = 'RELATIONAL_OFFICE_EVIDENCE' AND entry.actual <> 224)
     ] AS failures
RETURN 'relationship_type_counts' AS check,
       CASE size(failures) WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       counts AS observed,
       'all twelve declared relationship counts' AS expected;

MATCH ()-[relation]->()
WITH count(relation) AS actual
RETURN 'neo4j_relationship_total' AS check,
       CASE actual WHEN 2818 THEN 'PASS' ELSE 'FAIL' END AS result,
       actual AS observed,
       2818 AS expected;

