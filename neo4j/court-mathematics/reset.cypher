// Delete only Court-owned projection nodes. DETACH removes HAS_TRIAD from ScaleState.
MATCH (n)
WHERE n:Triad
   OR n:CourtFilterApplication
   OR n:CourtFilterOperator
   OR n:CourtCommutationRecord
   OR n:CourtLedgerSnapshot
   OR n:CourtRootedPosition
   OR n:CourtRuntimeSession
   OR n:CourtState
   OR n:CourtTransitionEvent
   OR n:PentatonicSetClass
   OR n:PoleRegister
   OR n:TopologicalTranslocationRecord
DETACH DELETE n;
