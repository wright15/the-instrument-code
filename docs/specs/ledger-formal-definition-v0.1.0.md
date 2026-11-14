# Specification — THE LEDGER (v0.1.0)

**Spec ID:** `THE-LEDGER-V0.1.0`.
**Status:** ADMITTED at L31 (`L31-GOV-ADMISSION-DIR-1`, 2026-11-14). `admissionEffect: admitted_at_L31`. Authority flows from the L31 entry in `provenance/DECISION_LEDGER.md` and `qa/l31_governance_admission_receipt.json`; this header grants nothing by its own text.
**Prepared by:** `MVP8.2-OBS-LEDGER-DIR-1` Task A, 2026-11-08. Landed as PROPOSED at L29; admitted at L31.
**Guard block:**

```json
{"layer":"SPEC-001 §1.3 overlay dynamics + governance ledger specification","causationClaim":false,"physicalQuantityClaim":false,"tierClassifier":false,"globalCHNull":true,"gov517_correspondence_claimed":false,"still_set_label":"still_set","bipartiteEvidenceStatus":"planning_evidence","bipartiteAdmissionEffect":"none","bipartiteGraphScope":"detached_audit_only","ledgerDefinitionStatus":"admitted","observatoryArtifactClass":"observation_only","llmCalls":0}
```

## 1. Witnesses — the term is used everywhere and defined nowhere

The framework already runs on three artifacts that carry the name:

- `provenance/DECISION_LEDGER.md` — the decision/admission record.
- `provenance/OBSERVATION_LEDGER.md` — the observation record.
- `canonical/universal-heptatonic-ledger.json` — the 462-state registry.

Two definition fragments already depend on the term as a primitive:

- **Admission is defined ledger-wise.** `docs/ARCHITECTURE_MAP.md` status legend:
  *admitted = GOV/CRT admission landed with a receipt or ledger entry.*
- **Quintessence is defined ledger-wise.** `docs/ARCHITECTURE_MAP.md` Row 6:
  *Quintessence is ... the operational coherence produced by the Mercury
  engine-ledger pair translating between the active bracket and the four Court
  registers.*

The map's §3 is titled "Invariant ledger"; its maintenance rule states:
*a statement without a resolvable receipt does not belong here.*

## 2. Proposed definition

**Definition (Ledger).** The ledger is the framework's append-only, hash-chained
record of governance acts — decisions, admissions, observations, releases —
constituting the system's memory: an act has architectural existence exactly
when it is entered in the ledger, and an artifact has standing exactly when it
is ledgered or regenerable from ledgered inputs.

Properties, each checkable:

- **L1 — Prefix closure.** Every successor state of the ledger contains its
  predecessor as a byte prefix. History is extended, never rewritten.
- **L2 — Tamper-evidence.** Any alteration of entered history changes the head
  hash. A fixed point is the triple (HEAD, MANIFEST, ledger head); verification
  is recomputation of the triple, not trust in any process.
- **L3 — Admission by entry.** A claim, artifact class, or status is admitted
  if and only if a receipt or ledger entry for it exists.
- **L4 — Regenerability.** Any artifact not itself carried in the ledger must
  be reproducible byte-for-byte from ledgered inputs; otherwise it is carried.
- **L5 — Joint record.** In the governed loop, the ledger is the single record
  shared by referee, proposer, and auditor; no participant's private state has
  architectural standing.

## 3. Fivefold placement (correspondence, not claim)

The four Court registers are the elements (Fire → Air/Wind → Water → Earth,
map Row 9). Mercury is the engine-ledger pair whose coherence among the
registers is quintessence (Row 6). Within that pair the two halves divide:

- the **engine** is the pair's *motion* — transition, projection, the Q law;
- the **ledger** is the pair's *memory* — inscription, persistence, the reason
  coherence survives the act that produced it.

On this reading the ledger is not a fifth thing beside the four elements. It is
half of the fifth's mechanism: quintessence is coherence, and the ledger is the
half of coherence that makes it persist. The governors move; the ledger is what
their motions are carried in.

## 4. Epistemic status, in the five-proposition vocabulary

- L1, L2: **demonstrated explanation** (mechanical, re-verified per landing).
- L3: **formally admitted claim** in operative form (map status legend).
- L4: **demonstrated explanation** at L28 plus the 2026-11-07 regeneration check.
- L5: **valid structural relationship** in the loop design, not yet a formally
  admitted claim about the runtime.
- The unified definition itself: **formally admitted at L31** (2026-11-14).
  Property L1 carries its measured historical boundary — append-only from the
  clean era (`9a0764b6` onward) and the formal landing chain from L12; the
  all-history scope failed and remains recorded evidence. The act of admission
  is the L31 governance entry; by it, the definition satisfies its own L3.

## 5. What admission would decide

- Scratch work (e.g. the audition/harmonic-debugger tooling) has no
  architectural existence until receipted; its outputs are observations,
  citable as such, never as results.
- The tools/engines distinction becomes definitional: engines and specs change
  what the ledger can be asked to record; tools only produce entries.
- Future fixed points continue to be stated as the L2 triple — already the
  practice; the definition names it.

## 6. Verification basis (Task A audit)

- **A1:** pairwise byte-prefix identity across every commit in git history
  that touched `provenance/DECISION_LEDGER.md`, cross-checked against the
  before/after SHA-256 pairs in `qa/` landing receipts.
- **A2:** recomputation of the L28 fixed-point triple and the five
  ledger-bound cascade artifacts.
- **A3:** byte-identical regeneration of a representative sample of the audio
  artifacts excluded from the ledger at L28, from the landed traces and the
  pinned renderer.

Measured results are recorded in `task-a/mvp8_2_task_a_receipt.json`.
