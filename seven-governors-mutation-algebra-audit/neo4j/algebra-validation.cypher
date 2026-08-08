// Every statement returns result = PASS after algebra-schema.cypher and
// algebra-import.cypher have run against the canonical network.

MATCH (operator:MutationOperator)
WITH count(operator) AS actual
RETURN 'operator_count_15' AS check,
       CASE actual WHEN 15 THEN 'PASS' ELSE 'FAIL' END AS result,
       actual AS observed,
       15 AS expected;

MATCH ()-[application:MODAL_MUTATES_TO]->()
WITH count(application) AS actual
RETURN 'modal_application_count_462' AS check,
       CASE actual WHEN 462 THEN 'PASS' ELSE 'FAIL' END AS result,
       actual AS observed,
       462 AS expected;

MATCH ()-[application:LOCAL_MUTATES_TO]->()
WITH count(application) AS actual
RETURN 'local_application_count_2940' AS check,
       CASE actual WHEN 2940 THEN 'PASS' ELSE 'FAIL' END AS result,
       actual AS observed,
       2940 AS expected;

MATCH (operator:MutationOperator)
OPTIONAL MATCH ()-[application:LOCAL_MUTATES_TO]->()
WHERE application.operatorId = operator.id
WITH operator, count(application) AS actual
WHERE operator.id <> 'M'
WITH collect({
  operator: operator.id,
  actual: actual
}) AS counts
WITH counts,
     [entry IN counts WHERE entry.actual <> 210] AS failures
RETURN 'each_local_domain_210' AS check,
       CASE size(failures) WHEN 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       counts AS observed,
       '210 applications for each R1-R7 and L1-L7' AS expected;

MATCH (source:ScaleState)-[application:LOCAL_MUTATES_TO]->
      (target:ScaleState)
MATCH (operator:MutationOperator)
WHERE operator.id = application.operatorId
OPTIONAL MATCH (target)-[inverse:LOCAL_MUTATES_TO]->(source)
WHERE inverse.operatorId = operator.inverseOperatorId
WITH application, count(inverse) AS inverseCount
WITH count(CASE WHEN inverseCount <> 1 THEN 1 END) AS violations,
     count(application) AS applications
RETURN 'local_partial_inverses' AS check,
       CASE
         WHEN violations = 0 AND applications = 2940 THEN 'PASS'
         ELSE 'FAIL'
       END AS result,
       {violations: violations, applications: applications} AS observed,
       {violations: 0, applications: 2940} AS expected;

MATCH path = (source:ScaleState)-[:MODAL_MUTATES_TO*7]->(source)
WITH collect(DISTINCT source.id) AS closingStates
MATCH (state:ScaleState)
WITH closingStates, count(state) AS stateCount
RETURN 'modal_order_seven_closure' AS check,
       CASE
         WHEN size(closingStates) = 462 AND stateCount = 462 THEN 'PASS'
         ELSE 'FAIL'
       END AS result,
       size(closingStates) AS observed,
       462 AS expected;

MATCH (source:ScaleState)-[:MODAL_MUTATES_TO]->(target:ScaleState)
WITH count(CASE
  WHEN source.forte <> target.forte
    OR source.orientation <> target.orientation
    OR source.chirality <> target.chirality
    OR source.role <> target.role
    OR source.fineRole <> target.fineRole
    OR source.tier <> target.tier
    OR source.hasGovernorSeat <> target.hasGovernorSeat
  THEN 1 END) AS violations,
  count(*) AS applications
RETURN 'modal_structural_stabilizers' AS check,
       CASE
         WHEN violations = 0 AND applications = 462 THEN 'PASS'
         ELSE 'FAIL'
       END AS result,
       {violations: violations, applications: applications} AS observed,
       {violations: 0, applications: 462} AS expected;

MATCH (source:ScaleState)-[:MODAL_MUTATES_TO]->(target:ScaleState)
WHERE source.office IS NOT NULL
WITH count(CASE
  WHEN target.office IS NULL
    OR target.officeIndex <> (source.officeIndex + 2) % 7
  THEN 1 END) AS violations,
  count(*) AS applications
RETURN 'modal_office_transport_plus_two' AS check,
       CASE
         WHEN violations = 0 AND applications = 308 THEN 'PASS'
         ELSE 'FAIL'
       END AS result,
       {violations: violations, applications: applications} AS observed,
       {violations: 0, applications: 308} AS expected;

MATCH (source:ScaleState)-[local:LOCAL_MUTATES_TO]->
      (localTarget:ScaleState)
MATCH (operator:MutationOperator)
WHERE operator.id = local.operatorId
MATCH (localTarget)-[:MODAL_MUTATES_TO]->(leftTarget:ScaleState)
MATCH (source)-[:MODAL_MUTATES_TO]->(modalTarget:ScaleState)
MATCH (modalTarget)-[transported:LOCAL_MUTATES_TO]->
      (rightTarget:ScaleState)
WHERE transported.operatorId = operator.conjugateOperatorId
WITH count(local) AS applications,
     count(CASE WHEN leftTarget.id <> rightTarget.id THEN 1 END) AS violations
RETURN 'modal_covariance_2940_applications' AS check,
       CASE
         WHEN violations = 0 AND applications = 2940 THEN 'PASS'
         ELSE 'FAIL'
       END AS result,
       {violations: violations, applications: applications} AS observed,
       {violations: 0, applications: 2940} AS expected;

MATCH (operator:MutationOperator)
WHERE operator.id <> 'M'
MATCH (transported:MutationOperator {
  id: operator.conjugateOperatorId
})
WITH operator,
     transported,
     CASE operator.degreeGovernor
       WHEN 'Sun' THEN 'Mars'
       WHEN 'Moon' THEN 'Mercury'
       WHEN 'Mars' THEN 'Jupiter'
       WHEN 'Mercury' THEN 'Venus'
       WHEN 'Jupiter' THEN 'Saturn'
       WHEN 'Venus' THEN 'Sun'
       WHEN 'Saturn' THEN 'Moon'
     END AS expectedGovernor
WITH count(CASE
  WHEN transported.degreeGovernor <> expectedGovernor
  THEN 1 END) AS violations,
  count(*) AS operators
RETURN 'degree_governor_transport_plus_two' AS check,
       CASE
         WHEN violations = 0 AND operators = 14 THEN 'PASS'
         ELSE 'FAIL'
       END AS result,
       {violations: violations, operators: operators} AS observed,
       {violations: 0, operators: 14} AS expected;
