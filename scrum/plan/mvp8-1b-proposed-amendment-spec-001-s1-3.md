# Proposed Amendment — SPEC-FIVEFOLD-CONSTRUCTS-001 §1.3 (Pentatonic Focal Context)

**Status:** PROPOSAL ONLY — not admitted, not landed.
**Authority required:** separate governance admission act; this document changes no repository byte.
**Prepared by:** `MVP8.1b-DIR-1` Task E, 2026-11-07.
**Evidence:** MVP8-DIR-1 rev 2 receipts and closing report; MVP8.1-DIR-1 stem recalibration; MVP8.1b metric correction; ear gate `SIGNED_HUMAN`.

## 1. Proposed optional reader contract

The §1.3 Quintessence overlay remains exactly as authored: `Q : Z12 -> (16 states -> 16 states)`, `Q_z = Q_1^z`, 16-state substrate, `TRAVERSAL_CYCLE`, `STILL_SET`, and `src/fivefold/quintessence.py` bytes unchanged.

Add an **optional, projection-layer-only** `focal_context` reader with this shape:

```json
{
  "subnodeId": "5-35:0@0",
  "baseSubnodeId": "5-35:0",
  "setClassId": "5-35",
  "rootPc": 0,
  "pitchClasses": [0, 2, 4, 7, 9],
  "selectionMode": "5-35_phase_root | 5-35_head_contained | 5-35_canonical | borrowed_connector | native_class_dwell | NONE",
  "isBridge": false,
  "isCornerstone": true
}
```

Rules:
1. The reader is supplied by the projection layer, not by `quintessence.py`.
2. The source is `derived/hypergraph/bipartite-inclusion-v1.json`, status `planning_evidence`, `admissionEffect: none`, `graphScope: detached_audit_only`.
3. If the reader is absent or `NONE`, the frozen projector behavior is unchanged.
4. `Q` initiation and structural-window governance are optional projection-layer policies; the Q substrate and the 192-row table are untouched.
5. `still_set` behavior remains frozen (`still_set_hold`).

## 2. Evidence basis

- B1: 1,064,448 governed evaluations, 0 out-of-mask; 243,936 still-set evaluations, 0 leaks.
- B2: 144/192 baseline -> 192/192 governed initiation; 80/80 structural; 4 modal-color passes.
- B3: 55,296 emission checks, 0 bad focal/orbit/initiation.
- B4′b: governed stem margin 0.145169 > ungoverned 0.031118 > 0.
- C1/C2/C3a/C3b: all pass; C2 max overhead 0; triangle core 7/7 bars.
- Ear gate: human-signed.

## 3. What this proposal does not do

- It does not admit the bipartite binding into canonical runtime or Neo4j topology.
- It does not amend the historical MVP-6 Law-3 result, which used the Hz-centroid instrument.
- It does not authorize the L28 landing; that is a separate act.
- It does not resolve `SPEC-001` §6(4) or claim `C_H`.

## 4. Admission checklist (for governance)

1. Maintainer review of this proposal and the MVP8.1b closing report.
2. Separate L28 landing authorization.
3. Re-run the release closure after any accepted amendment.
4. Keep `bipartiteEvidenceStatus: planning_evidence` until admission explicitly changes it.
