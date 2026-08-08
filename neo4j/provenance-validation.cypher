// Each query returns PASS or FAIL without mutating the graph.

MATCH (release:AuditRelease {
  releaseId: 'seven-governors-integrated-1.0.0'
})
RETURN
  'integrated release exists' AS check,
  CASE WHEN count(release) = 1 THEN 'PASS' ELSE 'FAIL' END AS result,
  count(release) AS diagnostic;

MATCH (release:AuditRelease {
  releaseId: 'seven-governors-integrated-1.0.0'
})-[:INCLUDES_DOCUMENT]->(document:FrameworkDocument)
RETURN
  'five hashed framework sources included' AS check,
  CASE
    WHEN count(document) = 5
      AND count(document.sha256) = 5
    THEN 'PASS'
    ELSE 'FAIL'
  END AS result,
  count(document) AS diagnostic;

MATCH (release:AuditRelease {
  releaseId: 'seven-governors-integrated-1.0.0'
})-[:DECLARES_INVARIANT]->(invariant:InvariantDefinition)
RETURN
  'core identity invariants declared' AS check,
  CASE WHEN count(invariant) = 4 THEN 'PASS' ELSE 'FAIL' END AS result,
  count(invariant) AS diagnostic;

MATCH (boundary:ScaleState {role: 'boundary'})
OPTIONAL MATCH (boundary)-[:OCCUPIES_OFFICE]->(office:GovernorOffice)
WITH boundary, count(office) AS categoricalSeats
RETURN
  'provenance does not promote boundary evidence' AS check,
  CASE
    WHEN count(boundary) = 154
      AND sum(categoricalSeats) = 0
    THEN 'PASS'
    ELSE 'FAIL'
  END AS result,
  {
    boundaries: count(boundary),
    categoricalSeats: sum(categoricalSeats)
  } AS diagnostic;
