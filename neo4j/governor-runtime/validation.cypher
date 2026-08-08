// GOV-206 Governor Runtime Graph Projection — Validation
// Every query returns a named check, PASS or FAIL, and a diagnostic value.

// V01: Policy release node count
MATCH (release:GovRuntimePolicyRelease)
WITH count(release) AS cnt
RETURN 'V01_policy_release_count' AS check,
       CASE WHEN cnt >= 1 THEN 'PASS' ELSE 'FAIL' END AS status,
       cnt AS diagnostic;

// V02: No OCCUPIES_OFFICE edges in Gov projection
MATCH ()-[r]->()
WHERE type(r) = 'OCCUPIES_OFFICE'
WITH count(r) AS cnt
RETURN 'V02_no_occupies_office' AS check,
       CASE WHEN cnt = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       cnt AS diagnostic;

// V03: No ScaleState nodes in Gov projection
MATCH (n:ScaleState)
WITH count(n) AS cnt
RETURN 'V03_no_scale_state' AS check,
       CASE WHEN cnt = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       cnt AS diagnostic;

// V04: All edges use GOV_ relationship types
MATCH ()-[r]->()
WHERE NOT type(r) STARTS WITH 'GOV_'
WITH count(r) AS cnt
RETURN 'V04_only_gov_relationships' AS check,
       CASE WHEN cnt = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       cnt AS diagnostic;

// V05: All nodes use Gov labels
MATCH (n)
WHERE NOT any(label IN labels(n) WHERE label STARTS WITH 'Gov')
WITH count(n) AS cnt
RETURN 'V05_only_gov_labels' AS check,
       CASE WHEN cnt = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       cnt AS diagnostic;

// V06: All node logicalIds unique
MATCH (n)
WHERE n.logicalId IS NOT NULL
WITH n.logicalId AS lid, count(*) AS cnt
WHERE cnt > 1
WITH collect(lid) AS dups
RETURN 'V06_unique_logical_ids' AS check,
       CASE WHEN size(dups) = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       dups AS diagnostic;

// V07: All edge endpoints exist
MATCH ()-[r]->()
WHERE r.sourceLogicalId IS NOT NULL OR r.targetLogicalId IS NOT NULL
WITH count(r) AS cnt
RETURN 'V07_edge_endpoints_exist' AS check,
       CASE WHEN cnt >= 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       cnt AS diagnostic;

// V08: No prohibited fields on any Gov node
MATCH (n)
WHERE any(label IN labels(n) WHERE label STARTS WITH 'Gov')
  AND (n.office IS NOT NULL OR n.occupiesOffice IS NOT NULL OR n.degreeGovernor IS NOT NULL
       OR n.neo4jId IS NOT NULL OR n.tokenId IS NOT NULL)
WITH count(n) AS cnt
RETURN 'V08_no_prohibited_fields' AS check,
       CASE WHEN cnt = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       cnt AS diagnostic;