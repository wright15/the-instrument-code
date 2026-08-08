// Delete only Court-owned projection nodes. DETACH removes HAS_TRIAD from ScaleState.
MATCH (n)
WHERE n:Triad
   OR n:CourtFilterApplication
   OR n:CourtFilterOperator
   OR n:PentatonicSetClass
   OR n:CourtCommutationRecord
   OR n:CourtState
   OR n:CourtRootedPosition
   OR n:PoleRegister
DETACH DELETE n;
