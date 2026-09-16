# D4 Discrete Math & Domain Cardinality Verification

**Status:** planning-grade verification attachment for the D4 implementation-spec
review. No engine, execution, ledger, manifest, or QA receipt was written; no
research verdict or H disposition is implied. Exact BigInt arithmetic and direct
candidate enumeration over the bound structural sources were used.

## 1. Midpoint Algebraic Identity

Claim: given o(a) = (k+1) mod 7 and o(b) = (k-1) mod 7,
mid(a,b) = (4 * (o(a) + o(b))) mod 7 equals k mod 7 for all k in Z7.

**PASS — exhaustive.** Verified for all seven k values, including the wrap cases:

- k=0: offices (1,6), 4*(1+6)=28, 28 mod 7 = 0 = k.
- k=6: offices (0,5), 4*5=20, 20 mod 7 = 6 = k.

Ring checks that make the identity total rather than approximate:

- 2*4 = 8 = 1 mod 7, so 4 is the exact multiplicative inverse of 2 in Z7.
- Modular reduction commutes with addition and scalar multiplication:
  4*((o(a)+o(b)) mod 7) = (4*(o(a)+o(b))) mod 7, including the unreduced
  sum for k=0 where k-1 = -1.
- (k+1) != (k-1) mod 7 for every k (difference 2, nonzero in Z7): the office
  pair can never be a diagonal, independent of the a != b witness rejection.
- The identity is unconditional: it requires only the office relation, not the
  directed T+1 twin predicate. 8k mod 7 = k for all k.

## 2. Domain Size Expressions

Candidates enumerated directly over the bound structural sources
(A0 anchors = 7, A1 anchors = 7, R = 28 directed A1 GOVERNS edges,
E = 14 directed A0-to-A1 CONSTRUCTS edges), counting candidates only,
never accepted witnesses.

**T-A: PASS.** Formula |A0|^2 * |R| * 7 = 49*28*7 = 9604. Direct nested
enumeration counts 9604. The formula includes a == b candidates, which the
predicate rejects; that is correct because the formula bounds the full
enumeration, not the accepted output.

**T-B: PASS.** Formula |E|^2 * |R| = 196*28 = 5488. Direct nested enumeration
counts 5488. Ordered edge pairs include e1 == e2 candidates, rejected by the
predicate; both parent orders are retained by design, so no symmetry division
belongs in the candidate count.

**T-C: PASS.** Formula |A0|(|A0|-1) + |A1|(|A1|-1) = 42 + 42 = 84. Direct
enumeration counts 84. n(n-1) counts ordered distinct pairs within each tier;
both orders are enumerated, and at most one directed twin orientation can fire
per unordered pair (a 7-of-12 mask cannot be invariant under T+1 or T+2), so
no double-counting defect exists. mid(a,b) is symmetric, so both orders share
a midpoint value; that is a witness-level fact, not a domain-count defect.

## Edge-Case / Symmetry Notes

- T-A domain includes all seven k values even where no witness can fire; the
  domain count is not a success expectation.
- R uniqueness (28 distinct (h,s) pairs) is a projection-level invariant; a
  duplicated R pair would make |R| undercount enumeration rows, which is why
  the spec's input validation rejects duplicates rather than deduplicating.
- Candidate-vs-witness distinction: none of the three formulas predicts
  witness counts; the frozen source-only demonstrations (8/28 keys etc.)
  remain separate acceptance references.

## Execution Record

- **Ran:** exhaustive BigInt check of the midpoint identity over k = 0..6,
  inverse and homomorphism properties, and wrap-case representatives.
- **Ran:** direct nested-loop candidate enumeration for T-A, T-B, T-C over
  ledger/network structural projections only; no contact rows or seam
  comparisons were read; formulas and enumerated counts asserted equal.
- **Skipped:** engine implementation, pre-flight suites, T-C seam comparison,
  category mapping, and any packaging/integrated validation; outside this
  verification's scope and the spec remains under review.
