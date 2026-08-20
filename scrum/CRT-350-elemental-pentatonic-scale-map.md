# CRT-350 — Elemental Pentatonic Scale Map

**Status:** Done · **Priority:** Medium · **Points:** 5 · **Epic:** pre-EPIC-400 follow-on (planned; no epic activated)
**Depends on:** CRT-305, CRT-309, CRT-347, CRT-349 · **Blocks:** —

## Story

As the release owner, I want the five elemental capability schools bound to
their canonical Ian Ring pentatonic identities (661 Major Pentatonic, 677
Scottish Pentatonic, 1189 Qing Yu, 1193 Minor Pentatonic, 1321 Màn Gong) as a
deterministic, validated, proposed registry, so the dual-core physics
categorization of domain registries (Photonic/Governor vs
Electromagnetic/Element) is machine-replayable without any runtime, graph,
policy, ledger, admission, or physics effect.

## Context

A rigorous mathematical audit preceded this story:

- Ian Ring ID 667 is **not** pentatonic: it is "Blues Dorian Hexatonic"
  (6 notes, Forte 6-Z49). The Scottish Pentatonic is ID **677** — confirmed
  from Ian Ring's catalog pages for 1189 and 1321, which list "Scale 677
  Scottish Pentatonic" as a mode of the 5-35 family.
- With Air = 677, the five masks are exactly the admitted C0-C4 Court masks
  in canonical order: 661, 677, 1189, 1193, 1321.
- All five are the same set class 5-35 (anhemitonic, interval vector
  <0,3,2,1,4,0>, prime form (0,2,4,7,9), CQ=1, SQ=1/2); semantic
  differentiation comes from mode/brightness, and Leonard brightness
  22→26 tracks kappa_court 0→1 monotonically along C0→C4.
- Each mask's raw 12-bit complement equals the frozen complement-map rooted
  pair for its Court position (C0↔3434/Saturn, C1↔3418/Venus,
  C2↔2906/Jupiter, C3↔2902/Mercury, C4↔2774/Mars) — frozen evidence, not an
  active relation.
- Orientation policy is preserved: mask strings are written MSB; the
  pitch-mask integers are LSB parses; ordinary MSB parsing is forbidden.

## Tasks

- [x] Author `schemas/elemental_pentatonic_scale_map_v1.0.0.yaml`: dual-core
      physics categorization, five scale bindings with Ian Ring citations,
      complement evidence, six invariants, eight guards.
- [x] Author the strict JSON Schema.
- [x] Build the independent validator (15 checks, 10 adversarial mutations);
      emit `qa/elemental-pentatonic-scale-map-validation.json`.
- [x] Add `tests/test_elemental_pentatonic_scale_map.py` (11 tests).
- [x] One additive `proposed` row in `provenance/SOURCE_AUTHORITY.md`.
- [x] Refresh manifest/checksums; run full root validation to a fixed point.

## Acceptance criteria

- **AC-1**: schema-valid; `admission_status: proposed`;
  `physical_quantity_claim: false`; no EM equivalence.
- **AC-2**: the five masks replay policy positions exactly; orientation
  (MSB string / LSB integer) verified per record.
- **AC-3**: all five are admitted class 5-35; brightness/kappa monotonic;
  complement pairs replay the frozen map.
- **AC-4**: Mercury is emblem-only (no register bit, no pole index,
  `register_membership: excluded`).
- **AC-5**: cross-registry refs resolve (CRT-347 schools/zodiac facets,
      CRT-349 transitions).
- **AC-6**: validator 15/15 PASS; pytest 11/11; root validation PASS.

## Verification

```bash
python3 scripts/validate-elemental-pentatonic-scale-map.py
python3 -m pytest -p no:cacheprovider -q tests/test_elemental_pentatonic_scale_map.py
npm run validate
```

**Results (2026-08-18):** validator 15/15 PASS; pytest 11/11; root validation
PASS; manifest and checksums refreshed.

## Definition of done

All acceptance criteria pass; the registry remains `proposed` with zero
authority effect; SOURCE_AUTHORITY carries one additive proposed row; no
runtime, graph, policy, ledger, CRT-310, decision-ledger, or frozen-toolkit
change occurred. Admission of this map, if desired, follows the CRT-348-style
gate path as a separate story.
