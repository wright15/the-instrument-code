ERRATUM F3 (ORRERY-NAV-1). Directive rev 2.1 section 4/A1 names "repo
frozen_ground_truth.json" as the census correspondence anchor; that path does
not resolve in-repo. Corrected hierarchy: realm-side frozen_ground_truth.json
(sha256 007b0ffe..., 91,360 B) is the PRIMARY 462 ground-truth artifact —
mvp2.py loads it as GT_PATH and orrery_nav_bridge.py loads it in Model; the
repo-side correspondence anchor is qa/gov-528-production-aggregate.json
(withheldBoundary = 154), which carries the 308 member records/orbits/partition
but not the 462 masks, roles, pcSum, families, governing roots, or orbit
membership. mvp2.py is realm-side; the repo carries the orrery. The 154 chain
closes: registration 154 <-> withheld 154 <-> 1,848 = 154 x 12. Rev 2.1 stands
as cut with this erratum attached; no re-cut. Non-fatal per the GAP-C evidence
hierarchy (realm bytes primary; repo files correspondence-only). Issued by the
Planning Seat at the ORRERY-NAV-1 closing adjudication; landed with the L18
incubator landing.
