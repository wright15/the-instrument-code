// Seven Governors State-Machine query cookbook.
// All statements in this file are read-only.

// Q01 — Topology inventory.
MATCH (s:ScaleState)
RETURN count(s) AS scaleStates,
       count(CASE WHEN s.role = 'anchor' THEN 1 END) AS anchors,
       count(CASE WHEN s.role = 'satellite' THEN 1 END) AS satellites,
       count(CASE WHEN s.role = 'boundary' THEN 1 END) AS boundaries;

// Q02 — Categorical office distribution.
MATCH (o:GovernorOffice)
OPTIONAL MATCH (s:ScaleState)-[:OCCUPIES_OFFICE]->(o)
RETURN o.officeIndex AS officeIndex,
       o.name AS office,
       count(s) AS seatedStates
ORDER BY officeIndex;

// Q03 — Hard invariant: boundaries must never occupy an office.
MATCH (s:ScaleState {role: 'boundary'})-[r:OCCUPIES_OFFICE]->(o:GovernorOffice)
RETURN s.id AS stateId, s.name AS state, type(r) AS relation, o.name AS office;

// Q04 — Hard invariant: every satellite has one selected governing parent.
MATCH (s:ScaleState {role: 'satellite'})
OPTIONAL MATCH (p:ScaleState)-[g:GOVERNS]->(s)
WHERE g.selected = true
WITH s, count(g) AS selectedParents
WHERE selectedParents <> 1
RETURN s.id AS stateId, s.name AS state, s.tier AS tier, selectedParents;

// Q05 — Hard invariant: satellite and selected parent share an office.
MATCH (p:ScaleState)-[g:GOVERNS]->(s:ScaleState {role: 'satellite'})
WHERE g.selected = true AND p.office <> s.office
RETURN p.id AS parentId, p.name AS parent, p.office AS parentOffice,
       s.id AS satelliteId, s.name AS satellite, s.office AS satelliteOffice,
       g.id AS relationId;

// Q06 — Every admitted anchor tier should contain seven offices exactly once.
MATCH (s:ScaleState {role: 'anchor'})
RETURN s.tier AS tier, count(*) AS states,
       count(DISTINCT s.office) AS distinctOffices,
       collect(s.office) AS offices
ORDER BY CASE tier
  WHEN 'A0' THEN 0 WHEN 'A1' THEN 1 WHEN 'A2' THEN 2
  ELSE 2 + toInteger(substring(tier, 1)) END;

// Q07 — Acoustic exact-midpoint cospan.
MATCH (left:ScaleState {id: 2773})-[l:CONSTRUCTS]->(a:ScaleState {id: 1749})
MATCH (right:ScaleState {id: 1717})-[r:CONSTRUCTS]->(a)
RETURN left.name AS leftEndpoint, l.mutation AS leftMutation,
       l.hamming AS leftDistance, right.name AS rightEndpoint,
       r.mutation AS rightMutation, r.hamming AS rightDistance,
       l.endpointHamming AS endpointDistance,
       a.name AS destination, a.office AS destinationOffice;

// Q08 — Fixed-tonic and phase neighbors of Lydian.
MATCH (s:ScaleState {id: 2773})-[r:AUDITED_HAMMING2|PHASE_SHIFT]-(n:ScaleState)
RETURN type(r) AS relationType, n.id AS neighborId, n.name AS neighbor,
       n.forte AS family, n.office AS categoricalOffice,
       r.phaseDeltasJson AS phaseDeltas, r.eligible AS eligible
ORDER BY relationType, neighborId;

// Q09 — Mutation operator inventory and research status.
MATCH (m:MutationOperator)
OPTIONAL MATCH (m)-[:ACTIVE_SEMANTIC_OPERATOR]->(s:SemanticOperator)
RETURN m.id AS operator, m.operatorClass AS structuralClass,
       m.degreeGovernor AS degreeGovernor, m.applicationCount AS applications,
       s.semantic_status AS semanticStatus
ORDER BY CASE m.id WHEN 'M' THEN 0 ELSE toInteger(substring(m.id, 1)) * 2 +
  CASE left(m.id, 1) WHEN 'R' THEN 0 ELSE 1 END END;

// Q10 — State Governor versus Degree Governor for Harmonic Minor.
MATCH (aeolian:ScaleState {id: 1453})-[r:LOCAL_MUTATES_TO]->(hm:ScaleState {id: 2477})
WHERE r.operatorId = 'R7'
RETURN aeolian.name AS source, aeolian.office AS sourceStateGovernor,
       r.operatorId AS operator, r.degreeGovernor AS degreeGovernor,
       hm.name AS destination, hm.office AS destinationStateGovernor;

// Q11 — Inverse round-trip support per local operator.
MATCH (op:MutationOperator)
WHERE op.id <> 'M'
OPTIONAL MATCH (source:ScaleState)-[forward:LOCAL_MUTATES_TO]->(middle:ScaleState)
WHERE forward.operatorId = op.id
OPTIONAL MATCH (middle)-[back:LOCAL_MUTATES_TO]->(target:ScaleState)
WHERE back.operatorId = op.inverseOperatorId
WITH op, forward, target, source,
     CASE WHEN forward IS NOT NULL AND target.id = source.id THEN 1 ELSE 0 END AS success
RETURN op.id AS operator, op.inverseOperatorId AS inverse,
       count(forward) AS definedApplications, sum(success) AS roundTrips,
       count(forward) - sum(success) AS failures
ORDER BY operator;

// Q12 — Pairwise local-operator commutation observations.
MATCH (s:ScaleState)-[a1:LOCAL_MUTATES_TO]->(x:ScaleState)
MATCH (x)-[b1:LOCAL_MUTATES_TO]->(ab:ScaleState)
MATCH (s)-[b2:LOCAL_MUTATES_TO]->(y:ScaleState)
MATCH (y)-[a2:LOCAL_MUTATES_TO]->(ba:ScaleState)
WHERE a1.operatorId = a2.operatorId
  AND b1.operatorId = b2.operatorId
  AND a1.operatorId < b1.operatorId
WITH a1.operatorId AS operatorA, b1.operatorId AS operatorB,
     count(*) AS commonDomain,
     sum(CASE WHEN ab.id = ba.id THEN 1 ELSE 0 END) AS commuting,
     collect(CASE WHEN ab.id <> ba.id THEN {
       sourceId: s.id, abId: ab.id, baId: ba.id
     } END)[0..5] AS sampledCounterexamples
RETURN operatorA, operatorB, commonDomain, commuting,
       commonDomain - commuting AS counterexamples,
       sampledCounterexamples
ORDER BY counterexamples, operatorA, operatorB;

// Q13 — Destinations reached by multiple distinct structural operators.
MATCH (source:ScaleState)-[r:LOCAL_MUTATES_TO|MODAL_MUTATES_TO]->(target:ScaleState)
WITH target, collect(DISTINCT r.operatorId) AS operators,
     collect(DISTINCT source.id) AS sources
WHERE size(operators) > 1
RETURN target.id AS stateId, target.name AS state, target.office AS office,
       operators, size(sources) AS sourceCount
ORDER BY size(operators) DESC, sourceCount DESC, stateId;

// Q14 — Office-transition matrix by structural operator.
MATCH (source:ScaleState)-[r:LOCAL_MUTATES_TO|MODAL_MUTATES_TO]->(target:ScaleState)
RETURN r.operatorId AS operator, source.office AS sourceOffice,
       target.office AS targetOffice, count(*) AS applications
ORDER BY operator, sourceOffice, targetOffice;

// Q15 — Role-transition matrix by structural operator.
MATCH (source:ScaleState)-[r:LOCAL_MUTATES_TO|MODAL_MUTATES_TO]->(target:ScaleState)
RETURN r.operatorId AS operator, source.role AS sourceRole,
       target.role AS targetRole, count(*) AS applications
ORDER BY operator, sourceRole, targetRole;

// Q16 — Structurally supported operators whose semantic scopes remain open.
MATCH (m:MutationOperator)-[:ACTIVE_SEMANTIC_OPERATOR]->(s:SemanticOperator)
OPTIONAL MATCH (s)-[:HAS_UNRESOLVED_SCOPE]->(u:SemanticUnresolvedScope)
RETURN m.id AS operator, m.structuralSupportCount AS structuralSupport,
       m.fieldSupportCount AS fieldSupport, s.semantic_status AS semanticStatus,
       collect(u.label) AS unresolvedScopes
ORDER BY structuralSupport DESC, operator;

// Q17 — Compare independent compression coordinates.
MATCH (o:GovernorOffice)-[:ACTIVE_PROFILE]->(p:CanonicalFeatureProfile)
MATCH (p)-[:HAS_PHOTONIC_RECORD]->(light:PhotonicRecord)
RETURN o.officeIndex AS officeIndex, p.office AS office,
       light.photonic_compression AS C_P, null AS C_H,
       p.semantic_order AS C_S_order,
       p.semantic_normalized_ordinal AS C_S_displayOnly,
       p.semantic_metric AS C_S_isMetric
ORDER BY officeIndex;

// Q18 — Retrieve the active Acoustic landform normal form.
MATCH (state:ScaleState {id: 1749})-[:HAS_NORMAL_FORM]->(packet:CompiledFeatureProfile)
MATCH (packet)-[:PART_OF_RELEASE]->(:RegistryRelease {active: true})
RETURN state.name AS scaleState, packet.office AS governor,
       packet.normal_form_id AS normalFormId,
       packet.rendering_brief AS renderingBrief,
       packet.required_json AS required,
       packet.prohibited_json AS prohibited,
       packet.unresolved_json AS unresolved,
       packet.intrinsic_fingerprint AS fingerprint;

// Q19 — Boundary field by fine role and relational office.
MATCH (s:ScaleState {role: 'boundary'})
RETURN s.fineRole AS boundaryType, s.relationalOffice AS relationalOffice,
       s.pluralityContactOffice AS pluralityOffice, count(*) AS states
ORDER BY boundaryType, relationalOffice, pluralityOffice;

// Q20 — Phenomenon assignment coverage after optional context projection.
MATCH (o:GovernorOffice)
OPTIONAL MATCH (o)-[r:PRIMARY_PHENOMENON]->(p:PhenomenonModel)
RETURN o.officeIndex AS officeIndex, o.name AS office,
       count(r) AS primaryAssignments, collect(p.displayName) AS models
ORDER BY officeIndex;

// Q21 — Hard invariant: Rayleigh scattering is primary only for Jupiter.
MATCH (o:GovernorOffice)-[:PRIMARY_PHENOMENON]->(p:PhenomenonModel {
  phenomenonId: 'phenomenon:rayleigh_scattering'
})
RETURN collect(o.name) AS primaryAssignees,
       count(o) = 1 AND head(collect(o.name)) = 'Jupiter' AS invariantPasses;

// Q22 — Canonical Court path after optional context projection.
MATCH (c:CourtState)
OPTIONAL MATCH (c)-[t:COURT_TRANSITION]->(next:CourtState)
RETURN c.stateIndex AS stateIndex, c.stateId AS state, c.vector AS vector,
       c.kappaCourt AS kappaCourt, next.stateId AS nextState, t.pole AS changedPole
ORDER BY stateIndex;

// Q23 — Semantic research queue: high support, unresolved effects.
MATCH (m:MutationOperator)-[:ACTIVE_SEMANTIC_OPERATOR]->(s:SemanticOperator)
WHERE s.semantic_status CONTAINS 'unresolved'
RETURN m.id AS operator, m.degreeGovernor AS degreeGovernor,
       m.structuralSupportCount AS structuralSupport,
       m.fieldSupportCount AS fieldSupport,
       s.semantic_research_priority AS priority
ORDER BY fieldSupport DESC, structuralSupport DESC, operator;
