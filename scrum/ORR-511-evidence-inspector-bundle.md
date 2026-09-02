# ORR-511 - Evidence inspector bundle

**Status:** Done · **Priority:** High · **Points:** TBD · **Epic:** [EPIC-511](EPIC-511-orrery-evidence-surfaces.md) · **Sprint:** Sprint 2
**Depends on:** GOV-501 · **Blocks:** ORR-512, ORR-513, ORR-514

## Story

As an Orrery user, I want a deterministic evidence bundle behind each inspector
view so labels and values can be traced to their declared source without changing
the current node endpoint or legal move set.

## Scope

- Define a versioned read-only bundle and an exact label map for source identity,
  State Governor, tier, office, Forte, pitch-class mask, scoped harmonic value,
  wavelength, provenance, and admission status where each is available.
- When displaying GOV-213's `W_A012`, label it as the unique max-margin optimum
  only under its declared objective; it is not a unique feasible witness and
  `method.uniquenessClaim=false` remains true outside that objective.
- Enumerate all seven $Q(S)$ positions, exact ratios, certificate status, the $3/407$ margin, the $6/407$ next slack, and the 7-member tight set labeled *"active-set rank 8 (7 binding + normalization)"*.
- Keep the bundle separate from local session state and from canonical graph
  authority.
- Preserve the current `/nodes` response shape and the exact bytes of
  `orrery/src/generated/legal-moves.v2.json`.

## Acceptance criteria

1. Every displayed field has a stable label, explicit source path, and a defined
   absent-value representation; no renderer-derived label is treated as source
   truth.
2. The bundle distinguishes State Governor, tier, office, scoped `W_A012`,
   photonic data, provenance, and admission status instead of collapsing them
   into one score; the `W_A012` label preserves its declared-objective unique
   max-margin qualification rather than claiming a unique feasible witness.
3. Contract tests prove the current `/nodes` schema and values are unchanged.
4. Byte-identity tests prove the legal-move catalog is unchanged by this story.
5. Invalid, missing, and incompatible bundle data produce a visible inspector
   state rather than a guessed value or fallback node.

## Non-goals and guards

- No `/nodes` endpoint, canonical data, legal move, Neo4j, or local-session
  authority change belongs in this story.
- The bundle is a presentation contract, not a new canonical record or an
  inference engine.
- Arithmetic output wins over planning assumptions. Displayed counts must come
  from the bundle or its cited receipt, never a hand-maintained UI literal.

## Verification

- Unit-test label mapping, source identity, absent values, and deterministic
  serialization.
- Run `/nodes` compatibility and legal-catalog byte-identity tests.
- `npm run orrery:check`, `npm run orrery:test`, and relevant browser tests.

## Definition of done

The evidence bundle is versioned, deterministic, and fully test-covered without
changing the existing endpoint or legal-move catalog bytes.

## References

- `main.py`
- `schemas/harmonic-orrery-nodes.schema.json`
- `orrery/src/generated/legal-moves.v2.json`
- `docs/A_TIER_TRIADIC_COMPRESSION_THEOREM.md`
- `provenance/SOURCE_AUTHORITY.md`
