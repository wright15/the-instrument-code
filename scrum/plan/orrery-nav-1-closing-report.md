# ORRERY-NAV-1 rev 2.1 — Closing Report

## Fixed point (opening, derived)

### SHA-256 pins

Repo (read-only): HEAD `65c72478d83ce3982e51e24d9422191510e89962`; tree clean; ledger L17 prefix `8901b4a3` (307,304 B / 3,967 lines); `MANIFEST.json` fileCount 1402. Zero repo writes, zero orrery changes, no tags.

Opening record: `orrery_nav_opening.json`, sha256 `a29ba9a317d010cc64ea7c872c7089312c0f8a1ad405ed58147c679485a85673` (full 24-pin inventory inside).

| Object | SHA-256 |
|---|---|
| `mvp2.py` (frozen gate source) | `fb9db3cd69234d41417582e0ffae27bbb15c52c777fe3856cf598b2664ca736a` |
| `policy-v3-registration.md` | `48290a2fa89dcaf4e77d91dc134af69db252dc625f2ccb0bd6e97973de4a2357` |
| `frozen_seam_substrate_v3.json` | `9f9818effa5d11e4ef2634122c9f484faf6790323cabae130561c1c75e8a295f` |
| `seam_legal_moves_v3.json` | `e6cf62a8eefa0924da9286f2e664c1914d9d620ed2d299929f684fd48225c274` |
| `freeze_report_v3.json` | `1c65a07c37740797b2a16048ddac4c17c9877465e7c03498d783291a4a433683` |
| `plv3_receipts_manifest.json` | `461a16b060e9ffc7c81e3cd8ea4d7f14e1d3e11022984dcb2eae9b36a67a8307` |
| realm `census_462.json` | `242bce7423bc2eb0ae61ee431c27901d6a87401b8b3ffd6725a04d0e1ed0685a` |
| realm `frozen_ground_truth.json` | `007b0ffe65015bd2c5f1a6fe0df8969961ce8cfb3d499677b143d971e1fc5744` |
| `seam_phase_a_probe.json` | `48f513679d505087277d5670952fb860b755832775f5fb5980aa3f71c73330bb` |
| `seam_operator_applications.csv` | `1f7b2abb047132fa957f761a73e7c76038766f617bed9c916f971a8c0072f53e` |
| `seam_operator_registry.csv` | `e5a9e6929fca048078e0db6ff044facc7137a6ef61e994d74f1d526e27b6482e` |
| `seam_bipartite_inclusion.json` | `903eebf0e1122d8ba81971abcd7efc8ac934d3bfd7885b98b49e58ab0bbe3e41` |
| `seam_census_head.json` | `f7e56b2b180c456fd4abc96069796d6737f77d13ba66c751604fe95cd19e6d5a` |
| `seam_legal_moves_v2.json` | `c017c3c66e10b803eccb82342d030575c8069434063657fb89b5d56169db4d4b` |
| `freeze_report_v2.json` | `da14de46d36aa8f183655bbc56605d7d785dd531f898a25e99805666cbbaefeb` |
| `gate_log_mvp2_live_mac1.jsonl` | `de90eb47d05cfe28646929123f3a01efe1cc156b413676473894c541f1620c29` |
| `dispute_analysis_mvp2c.json` | `df90f405e653e7d148f4bd60c405e47d87a7c7e8c2c893f3ecbbefa43d303d50` |
| `spike01_evidence.json` | `cb170c0d00cea3f2db2b69779dc339848befa60f5a78d257c8680f99f6e56fec` |
| `degenerate_boundary.jsonl` | `f728f8eedec6606a39f95fa41188126aec4447bc1907375fb3eb51395e1d48e1` |
| `degenerate_boundary_report.json` | `339dc8934bb0e5a1f3ec8438c9b2d0f9dd0efabc42bb732322ec3e60093e74d6` |
| `plv3_receipt_nonvacuity.json` | `cb9fa9e65b0ad5425d7c3f40b82d05a9d8b08f1b02f20812549cf4e306c12aae` |
| `plv3_receipt_case501.json` | `0fab6bc4b2710dabe02105d98fc16f4e546e367ac7f4773a44ab284c23fc38d7` |

Anchors re-read verbatim:

```
mvp2.py:150-154
        if cm == nm and cp == np_:
            if self.gov_root[cm] is None:
                checks["boundary_endpoint"] = True
                checks["same_family"] = False
                return "REJECT", ["ungoverned-transition"], checks, None

mvp2.py:169
        same_root = cr is not None and nr is not None and cr == nr

mvp2.py:171-172
        if same_root and cp == np_:
            return "ACCEPT", [], checks, None

mvp2.py:183-184
        if checks["boundary_endpoint"]:
            return "REJECT", ["ungoverned-transition"], checks, None

mvp2.py:733
        plan["dwellMs"] = int(__import__("os").environ.get("ORRERY_BRIDGE_DWELL_MS", "1500"))
```

Derived at opening: nodes 5,544 = 462 × 12; seam catalog 5,130 = 5,040 Family A + 90 Family B; Tier-1 18,984 = 12 × 1,582 family-size squares (includes self); boundary 256 = 128 exit + 128 entry side-rows (196 distinct rows); offices 7; GOVERNS edges 238.

## Read-only endpoints

| Endpoint | Count | Expected | Latency |
|---|---|---|---|
| `GET /api/nodes` | 5,544 | 5,544 | 19.86 ms |
| `GET /api/legal-moves` | 5,130 (5,040 A + 90 B) | 5,130 | 12.21 ms |
| `GET /api/tier1-moves` | 18,984 | 18,984 | 116.22 ms |
| `GET /api/boundary-transit` | 256 (128 + 128) | 256 | 2.70 ms |

Write-route check: `POST /api/nodes` → HTTP 405, rejected. No POST/PUT/DELETE/PATCH route exists.

## Catalog ↔ gate conformance

- **Family A:** 5,040 / 5,040 direct gate queries ACCEPT with `FamilyA:R1` / `FamilyA:L1` citations.
- **Family B:** 1,008 / 1,008 pair queries ACCEPT. Citation split: 720 `FamilyB:bridge`, 288 Tier-1-first (the 7-32 partner is in the anchor's governed family; the gate's Tier 1 ordering fires first). All catalog entries are covered; the 90-crossing count is verified from catalog + substrate bytes, not through the gate.
- **Probes:** 7 / 7 match the registered non-vacuity + 501 receipts: teleportation, family-hop, camping, licensed entry, licensed exit, non-seam boundary escape, case 501.
- **Tier-1:** 18,984 derived via the gate as library; matches 12 × 1,582.
- **Boundary:** 256 side-rows; 196 distinct; all carry the four γ semantics verbatim.
- **Seam catalog:** exactly 5,130; no partitions or tier labels inside the payload.

## Overlay

Injected through the established Playwright channel; `mvp2.py` imported as a library and byte-identical at close (`fb9db3cd…`, same as open).

- **Expressibility:** 84 cells + 12 boundary chips; 5,544 nodes = 3,696 grid + 1,848 boundary; 21 existing display-anchor buttons; three highlight classes verified — `1387@0` [tier-1, seam-catalog], `1001@0` [tier-1, seam-catalog, boundary-transit], `1009@0` [seam-catalog, boundary-transit].
- **Navigation:** 22 moves, all gate-decided; all 12 phases exercised; family walk 5/5; seam demo 3/3; boundary replay `1001@0 → 501@1` ACCEPT `FamilyA:R1`.
- **Audio:** 18 voiced emissions / 4 rests; 144 instrumentation frequency events; 1 context. The boundary accept is a rest because the boundary target has no display anchor (no office palette); this is emission mechanics only at dwell 0, not a perceptual claim.
- **Console/errors:** 0 console errors, 0 page errors.
- **Bake check:** CLEAN — overlay fetches all four endpoints; no baked node IDs or counts; data comes from pinned realm artifacts.

## Recorded findings (not STOP conditions)

1. **Phase connectivity:** no single R1/L1 seam walk spans all 12 phases; the maximum reachable phase set in one seam component is 6 (witness mask 127, phases {0, 7, 8, 9, 10, 11}). All 12 phases are still exercised via overlay selection plus legal Tier-1 moves. If rev 2.1 intended a single connected seam walk, that is infeasible under the current legal surface and would need a policy/traversal ruling; no §8 verdict line is affected.
2. **Family B citation split:** all 1,008 queries ACCEPT; 288 are Tier-1-first by rule ordering. This is recorded so the Family B leg is not misread as 1,008 bridge-citation fires.
3. **Anchor naming discrepancy:** the rev 2.1 §4 label "repo `frozen_ground_truth.json`" does not resolve in the repository. The realm `frozen_ground_truth.json` is the primary 462 ground-truth artifact (pinned); the repo-side correspondence anchor used is `qa/gov-528-production-aggregate.json` (`withheldBoundary = 154`). The gate source `mvp2.py` is realm-side; the repository carries the orrery. Recorded; derivations use realm bytes primary, repo correspondence only.
4. **Harness corrections before green:** the initial Playwright route `**/api/nodes` shadowed the bridge endpoint (fixture 21 nodes), and the Family B check initially required the bridge citation rather than ACCEPT. Both were harness-side fixes; no policy, gate, catalog, or orrery change.

## Fences and artifacts

### SHA-256 pins

Repo close: clean; HEAD unchanged; ledger L17 byte-untouched; zero repo writes; zero orrery changes; no tags. `mvp2.py` identical open/close. All writes are realm-side.

| Artifact | SHA-256 |
|---|---|
| `orrery_nav_bridge.py` | `ae6502b960924b7c94b663ef9ccac67558533833e04500f0722f9c4fd2edc98e` |
| `orrery_nav_overlay.js` | `ad558decfa6547c2b6f7b3ceb9247326a0ee9508df5e9c4523ee90b4a64a0613` |
| `orrery_nav_run.sh` | `2678f719345defd83200a66802f1bcd5faac4e8c6ed22095c752e465eb6082fc` |
| `mvp2_orrery_nav_smoke.py` | `fe81ee3adb3228e788302530471a93f95797cf98c33806ff820b150fb1bce6ec` |
| `orrery_nav_opening.py` | `2461ac90fe63f9db0ea721124a60133f31f1cacbe0c543f6be426b3799f907a2` |
| `orrery_nav_opening.json` | `a29ba9a317d010cc64ea7c872c7089312c0f8a1ad405ed58147c679485a85673` |
| `orrery_nav_opening_probe.js` | `597563ec22a030c9a8965f800056acbcd232aef5f97c3bd7bd81c590998aedfd` |
| `orrery_nav_opening_probe.json` | `9960f36b1db943d29446a5de0bf5d97cd96723b2baef4967818a960c3a484868` |
| `orrery_nav_probe.js` | `811bda70f3a1e66adb6ad84b3c272350a75dc5589038330a8b74054f172467d6` |
| `orrery_nav_browser_log.json` | `bf42f87801d7e0c4a5be878414cd98a151982c2ee919e2113594575563444d8f` |
| `orrery_nav_report.json` | `8c95483ebb745e85969eb555060f8f3dca1995ee0f59e46a8638e0b23bd9477b` |

```
ORRERY-NAV-1-VERDICT: PASS
STOP-RULE-FIRED: none
NODES: 5544/5544 MATCH
SEAM-CATALOG: 5130/5130 MATCH
TIER1-DERIVED: 18984 EXPECTATION 18984 MATCH
BOUNDARY-TRANSIT: 256 EXPECTATION 256 MATCH
CONFORMANCE-5130: EXHAUSTIVE-ACCEPT
PROBES: 7/7 MATCH
MVP2-BYTE-IDENTICAL: TRUE
OVERLAY-EXPRESSIBILITY: VERIFIED
CONSOLE-ERRORS: 0
BAKE-CHECK: CLEAN
REPO-WRITES: 0
ORRERY-CHANGES: 0
```
