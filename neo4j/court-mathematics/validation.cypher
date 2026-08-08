// CRT-306 executable graph-shape validation. Every statement returns check/status/diagnostic.

MATCH (state:ScaleState)-[r:HAS_TRIAD]->(triad:Triad)
WITH state, r.harmonicProfileSha256 AS profileSha256, count(r) AS edgeCount,
     count(DISTINCT r.degree) AS degreeCount, collect(r.degree) AS degrees
WITH count(CASE WHEN edgeCount <> 7 OR degreeCount <> 7 OR NOT all(d IN degrees WHERE d >= 1 AND d <= 7) THEN 1 END) AS failures
RETURN 'degree_triad_narrow_cardinality' AS check,
       CASE WHEN failures = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       failures AS diagnostic;

MATCH ()-[r:HAS_TRIAD]->()
WITH count(CASE WHEN NOT 'ScaleState' IN labels(startNode(r))
                       OR NOT 'Triad' IN labels(endNode(r)) THEN 1 END) AS failures
RETURN 'has_triad_endpoint_labels' AS check,
       CASE WHEN failures = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       failures AS diagnostic;

MATCH (triad:Triad)
WITH count(CASE WHEN size(triad.pitchClasses) <> 3
                  OR size(triad.intervalSignature) <> 3
                  OR NOT triad.quality IN ['major','minor','diminished','augmented','other']
                THEN 1 END) AS failures
RETURN 'triad_property_domain' AS check,
       CASE WHEN failures = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       failures AS diagnostic;

MATCH (application:CourtFilterApplication)
OPTIONAL MATCH (application)-[filters:FILTERS]->(state:ScaleState)
OPTIONAL MATCH (application)-[uses:USES_FILTER]->(filter:CourtFilterOperator)
OPTIONAL MATCH (application)-[yields:YIELDS_ADMITTED_SET]->(setClass:PentatonicSetClass)
WITH application, count(DISTINCT filters) AS filtersCount,
     count(DISTINCT uses) AS usesCount, count(DISTINCT yields) AS yieldsCount
WITH count(CASE WHEN filtersCount <> 1 OR usesCount <> 1 OR yieldsCount <> 1 THEN 1 END) AS failures
RETURN 'filter_application_required_edges' AS check,
       CASE WHEN failures = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       failures AS diagnostic;

MATCH (application:CourtFilterApplication)-[:FILTERS]->(state:ScaleState)
MATCH (application)-[uses:USES_FILTER]->(filter:CourtFilterOperator)
MATCH (application)-[yields:YIELDS_ADMITTED_SET]->(setClass:PentatonicSetClass)
WITH application, state, uses, filter, yields, setClass,
     reduce(mask = 0, bit IN range(0, 11) |
       mask + CASE
         WHEN toInteger(application.sourceMask / toInteger(2 ^ bit)) % 2 = 1
          AND toInteger(filter.courtMask / toInteger(2 ^ bit)) % 2 = 1
         THEN toInteger(2 ^ bit)
         ELSE 0
       END
     ) AS computedResultMask
WITH count(CASE WHEN application.sourceMask IS NULL
                  OR application.resultMask IS NULL
                  OR filter.courtMask IS NULL
                  OR setClass.pitchMask IS NULL
                  OR application.sourceMask <> state.id
                  OR application.resultMask <> computedResultMask
                  OR application.resultMask <> setClass.pitchMask
                  OR yields.resultMask <> application.resultMask
                  OR uses.derivationMethod <> 'linear-diagonal-bit-and-v1'
                  OR filter.operatorType <> 'linear_diagonal'
                  OR filter.idempotent <> true
                  OR filter.inverse <> 'none'
                  OR size(setClass.pitchClasses) <> 5
                THEN 1 END) AS failures
RETURN 'filter_application_semantics' AS check,
       CASE WHEN failures = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       failures AS diagnostic;

MATCH (record:CourtCommutationRecord)
WITH count(CASE WHEN NOT record.result IN [
  'commutes','does_not_commute','left_undefined','right_undefined','both_undefined'
] THEN 1 END) AS failures
RETURN 'commutation_result_domain' AS check,
       CASE WHEN failures = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       failures AS diagnostic;

MATCH ()-[r:FILTERS|USES_FILTER|YIELDS_ADMITTED_SET|HAS_COMMUTATION_RESULT]->()
WITH count(CASE
  WHEN type(r) = 'FILTERS' AND (NOT 'CourtFilterApplication' IN labels(startNode(r)) OR NOT 'ScaleState' IN labels(endNode(r))) THEN 1
  WHEN type(r) = 'USES_FILTER' AND (NOT 'CourtFilterApplication' IN labels(startNode(r)) OR NOT 'CourtFilterOperator' IN labels(endNode(r))) THEN 1
  WHEN type(r) = 'YIELDS_ADMITTED_SET' AND (NOT 'CourtFilterApplication' IN labels(startNode(r)) OR NOT 'PentatonicSetClass' IN labels(endNode(r))) THEN 1
  WHEN type(r) = 'HAS_COMMUTATION_RESULT' AND (NOT 'CourtFilterApplication' IN labels(startNode(r)) OR NOT 'CourtCommutationRecord' IN labels(endNode(r))) THEN 1
END) AS failures
RETURN 'filter_relationship_endpoint_labels' AS check,
       CASE WHEN failures = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       failures AS diagnostic;

MATCH ()-[r:HAS_POLE_REGISTER]->()
WITH count(CASE WHEN (NOT 'CourtState' IN labels(startNode(r))
                      AND NOT 'CourtRootedPosition' IN labels(startNode(r)))
                  OR NOT 'PoleRegister' IN labels(endNode(r)) THEN 1 END) AS failures
RETURN 'pole_register_endpoint_labels' AS check,
       CASE WHEN failures = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       failures AS diagnostic;

MATCH (pole:PoleRegister)
OPTIONAL MATCH ()-[owner:HAS_POLE_REGISTER]->(pole)
WITH pole, count(owner) AS ownerCount
WITH count(CASE WHEN ownerCount <> 1 THEN 1 END) AS failures
RETURN 'pole_register_unique_owner' AS check,
       CASE WHEN failures = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       failures AS diagnostic;

MATCH (n)
WHERE n:Triad OR n:CourtFilterApplication OR n:CourtFilterOperator
   OR n:PentatonicSetClass OR n:CourtCommutationRecord OR n:CourtState
   OR n:CourtRootedPosition OR n:PoleRegister
WITH count(n) AS total, count(DISTINCT n.logicalId) AS distinctIds,
     count(CASE WHEN n.recordSha256 IS NULL OR n.sourceSha256 IS NULL
                  OR n.admissionStatus IS NULL OR n.projectionFingerprint IS NULL
                THEN 1 END) AS missingEnvelope
RETURN 'court_node_identity_closure' AS check,
       CASE WHEN total = distinctIds AND missingEnvelope = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       {total: total, distinctIds: distinctIds, missingEnvelope: missingEnvelope} AS diagnostic;

MATCH ()-[r:HAS_TRIAD|FILTERS|USES_FILTER|YIELDS_ADMITTED_SET|HAS_COMMUTATION_RESULT|HAS_POLE_REGISTER]->()
WITH count(r) AS total, count(DISTINCT r.logicalId) AS distinctIds,
     count(CASE WHEN r.recordSha256 IS NULL OR r.sourceSha256 IS NULL
                  OR r.admissionStatus IS NULL OR r.projectionFingerprint IS NULL
                THEN 1 END) AS missingEnvelope
RETURN 'court_relationship_identity_closure' AS check,
       CASE WHEN total = distinctIds AND missingEnvelope = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       {total: total, distinctIds: distinctIds, missingEnvelope: missingEnvelope} AS diagnostic;

CALL {
  MATCH (n)
  WHERE n:Triad OR n:CourtFilterApplication OR n:CourtFilterOperator
     OR n:PentatonicSetClass OR n:CourtCommutationRecord OR n:CourtState
     OR n:CourtRootedPosition OR n:PoleRegister
  RETURN n.projectionFingerprint AS fingerprint
  UNION ALL
  MATCH ()-[r:HAS_TRIAD|FILTERS|USES_FILTER|YIELDS_ADMITTED_SET|HAS_COMMUTATION_RESULT|HAS_POLE_REGISTER]->()
  RETURN r.projectionFingerprint AS fingerprint
}
WITH count(DISTINCT fingerprint) AS fingerprintCount,
     count(CASE WHEN fingerprint IS NULL THEN 1 END) AS missingFingerprints
RETURN 'court_projection_freshness' AS check,
       CASE WHEN fingerprintCount = 1 AND missingFingerprints = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       {fingerprintCount: fingerprintCount, missingFingerprints: missingFingerprints} AS diagnostic;
