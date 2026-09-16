# D4 Implementation Report

## Current Build Result

**Build + self-verification complete; HALT for review.** This section supersedes
the historical pre-correction stop record retained below. It does not claim
pre-flight completion, production readiness, a D4 verdict, or a release fixed
point. The later corrected-v1 and scanner/digest ratifications govern this build.
No frozen documents, ledger, manifest, checksums, QA receipts or shared history
were written. No canonical observation comparison or 18-tuple pre-flight suite ran.

### File Inventory And SHA-256

Nine implementation/test files were added. This existing report was updated;
its prior SHA-256 was `93ddea6d7bca50b2326ce129f87018182e97e4d39b67db4d2d46d7206b57d53c`.
Its final raw digest is emitted in the final relay, outside itself to avoid a
self-referential hash. All hashes below were recomputed from the actual bytes.

| Added File | SHA-256 |
|---|---|
| `scripts/d4-derivation-engine.mjs` | `28b1474c2a81d9715cc510cebffe18da24753270bc303b4fa1c3548040a413c8` |
| `scripts/d4-inputs.mjs` | `3bea18eccc6252a9b5578fecf60925da29a799a1ef17702dc7f66bd159de8199` |
| `scripts/d4-generation.mjs` | `2fd7f5bc43a9883108397138508a5724171f03d4fca7b6afa0dd2311a6c0f1bd` |
| `scripts/d4-downstream-comparison.mjs` | `eb8ae60620b2cc7a2161acb2f122b64d03f18b8a85a4caa74681e5bed2d65bfe` |
| `scripts/d4-wire.mjs` | `f8c85a18d6c7c1df0f26fc456da935af80e75017db1f6699f792d415b9505adb` |
| `scripts/lib/static-callgraph.mjs` | `2d45f5368515771f6732c64aa896ea82c7bb8398f3fb4758974b5535d0ef9a35` |
| `tests/d4/build.test.mjs` | `66f1be8749ad467972d635d654827e2d73b34d0e256f8f94081179c0cddaa43f` |
| `tests/d4/static-callgraph.test.mjs` | `7f2c12c6db0301b881b2b99a92f9c6950b8163a276705173ed47d2b2fbc36b7e` |
| `tests/d4/synthetic.mjs` | `f273210e20013a631be39ae466b33435d37c6f16cef2f42bf82efb3e2d58a435` |

Bound inputs checked by the test suite and again at report preparation:

| Input | SHA-256 |
|---|---|
| Frozen boundary | `751d56d4f01ea1a0d054c8119d178a64b20787aa9fb095a02c99f3ba3b135de2` |
| Implementation spec | `5096f1e3caf5e1f2a9a3984bcb4aa54b38a7cab4d20a9d34bb57516dfafa9042` |
| Corrected v1 schema | `b2b3eaed07fba5082a9f6ff18cd40fbe75cb833b0bd8d8a7dc8055eefcbfc52d` |
| Corrected v1 addendum | `56db87ffcd73dd9b6c9a97a5c99d23881767c93ebc430c6a17e70c49e6b3a68c` |
| Domain-cardinality verification | `58717ab4ec26b615b617401da4c613d23a4d8cdeb3c3fb408f119e4e91e78946` |

No conflict with the proven math was found. The raw full-file hashes identify
sources; they are not interchangeable with JCS object digests or the four-file
spec aggregate. The four-file boundary/spec/schema/addendum preimage is exactly
260 UTF-8 bytes with one newline after each hex digest, including the last.
Its computed SHA-256 is
`9d8357cb05b73b4a25aeea3074ebe49d89a27dbf83f039d5698c4f77afc3a24c`.

### Mechanical Isolation Evidence

The scanner consumed the entire actual pure-route file, without executing it.
Reachability includes the root; these are computed sets, not declarations:

```text
generateRouteTA -> {generateRouteTA, rotateMaskZ12}
generateRouteTB -> {generateRouteTB}
generateRouteTC -> {generateRouteTC, midZ7, rotateMaskZ12}
TA intersect TB = {}
TA intersect TC = {rotateMaskZ12}
TB intersect TC = {}
```

Allowlist data emitted alongside those sets:

```json
{
  "sharedHelpers": {
    "rotateMaskZ12": {
      "reason": "Pure Z12 rotation; no state, selection, or observation.",
      "consumers": ["generateRouteTA", "generateRouteTC"]
    }
  },
  "privateHelpers": {
    "midZ7": {
      "reason": "Pure Z7 midpoint calculation, private to route TC; no cross-route sharing.",
      "consumers": ["generateRouteTC"]
    }
  }
}
```

The default scanner rejects every unlisted private/shared helper, unused or
mis-consumed entry, blank reason, cross-route call, free-variable capture,
default/nested closure, indirect call, function alias, computed access, import,
unknown token, forbidden observation field/literal and numeric Number literal.
Structural BigInt literals are bounded to the small ring/bit-index range 0..12
and the 12-bit all-ones mask 4095; they are not outcome-derived values.

This is a restricted token/identifier parser, not a general JavaScript AST
parser or unrestricted information-flow proof. It accepts only its declared
grammar, handles strings/comments separately and checks balanced function scopes.
The platform parser was exercised with `node --check` on the actual engine and
other implementation modules (Node v22.22.0). Fifty-two scanner self-tests cover
clean acceptance and planted failures, including transitive helper/cross-route
calls, imports, closures, aliasing, dynamic dispatch and token edge cases.
No npm parser was substituted or installed. AJV 8.20.0 is used outside the
pure engine for Draft 2020-12 schema validation.

The pure engine has no imports, globals, filesystem, clock, RNG or observation
reader. It operates on validated BigInt data from the trusted wrapper. The
extractor rejects proxies/accessors/conflicting identities, copies only allowed
fields, and validates typed R/E endpoints. Its API consumes bound bytes supplied
by the host, rather than opening canonical paths itself. Only the build test's
source-arithmetic check reads the two canonical structural documents.

T-A/T-B are generatively call-graph-disjoint. T-A/T-C share both an arithmetic
primitive and A0 anchor data; they are NOT claimed statistically independent or
input-disjoint. T-C does not read R, E or either route output. Scanner guarantees
assume trusted standard intrinsics and validated inert inputs; maliciously
replaced built-in iterators/prototypes and process containment remain pre-flight
environment obligations, not proven by lexical reachability alone.

### Predicate Correspondence

Frozen T-A anchor:

```text
Enumerate (a,b,h,s,k) in A0 x A0 x R x Z7, preserving ordered a,b.
Emit the tuple tagged `kernel_twin` iff a != b, o(a)=k+1 mod 7,
o(b)=k-1 mod 7, T+1(m(a))=m(b), and o(h)=k.
```

Implemented predicate (inside the complete a0/a0/R/k enumeration):

```js
if (a.id !== b.id && a.officeIndex === (k + 1n) % 7n &&
    b.officeIndex === (k - 1n + 7n) % 7n &&
    rotateMaskZ12(a.id) === b.id && r.parentOffice === k) {
```

Here a/b are A0 anchor records, m(a)=a.id, o(a)=a.officeIndex,
h=r.source and s=r.target. Parent office is independently projected from h.
The +7n implements nonnegative modular reduction for k=0, not an orientation
change. No midpoint helper is used by T-A; k is independently enumerated.

Frozen T-B anchor:

```text
Enumerate ordered pairs (e1,e2) from the complete proposed A0-to-A1
`CONSTRUCTS` slice E, joined with every (h,s) in R. Emit
(source(e1),source(e2),h,s,o(h),e1.id,e2.id) tagged `construction_join` iff
e1 != e2, their source anchors are distinct A0 members, and both targets equal
h. Each edge must independently match its bound ID, type, endpoints and tiers;
```

Implemented predicate (inside the complete E/E/R enumeration):

```js
if (e1.id !== e2.id && e1.source !== e2.source &&
    e1.type === "CONSTRUCTS" && e2.type === "CONSTRUCTS" &&
    e1.parentTier === "A0" && e2.parentTier === "A0" &&
    e1.childTier === "A1" && e2.childTier === "A1" &&
    e1.target === r.source && e2.target === r.source) {
```

The trusted projection enforces source binding, unique edge IDs, stored direction
and actual endpoint membership before invocation. Thus edge-ID inequality is
edge inequality on that validated domain. The route uses no masks or rotation;
both ordered co-parent witnesses survive. It emits h=r.source, s=r.target,
o(h)=r.parentOffice and both original edge IDs.

Frozen T-C anchor:

```text
Independently enumerate (t,a,b) over t in {A0,A1} and ordered distinct anchors
in that tier. Emit (t,a,b,mid(a,b)) iff T+1(m(a))=m(b).
```

Implemented selection and midpoint computation:

```js
if (a.tier === b.tier && a.id !== b.id) {
  candidates += 1n;
  if (rotateMaskZ12(a.id) === b.id) {
    relations.push({ tier: a.tier, a: a.id, b: b.id,
      mid: midZ7(a.officeIndex, b.officeIndex) });
  }
}
```

`midZ7` returns `(4n * (o_a + o_b)) % 7n`. All A0/A1 ordered distinct
pairs are considered, no R/E or seam-label inputs occur, and tier/order remain
in the emitted relation. Normalizing a parent pair happens only in comparison.

### Self-Verification Results

Executed command:

```sh
node --test tests/d4/static-callgraph.test.mjs tests/d4/build.test.mjs
```

Final result: **63 passed, 0 failed** (52 scanner tests, 11 build tests).
The first combined run had one extractor failure: an implementation assumption
that every out-of-scope ledger tier was a string rejected legitimate null tiers.
The extractor now permits null outside selected A0/A1 structures while preserving
strict selected-record validation. A regression covers that case. No frozen
predicate was changed and no arithmetic conflict was suppressed.

| Obligation | State | Actual Evidence |
|---|---|---|
| Frozen contracts and math-reference hashes | ran | All five accepted digests match |
| Midpoint identity and Z12 arithmetic | ran | All seven k; 12 rotations return every one of the 4096 masks to itself |
| Source-only candidate counts | ran | T-A 9604, T-B 5488, T-C 84; computed by route loops and checked against formulas |
| Source-only demonstration references | ran | Clean T-A 8 keys / T-B 28 keys; in-memory old-K mutation gives T-A 0; edge deletion gives T-B 24 with T-A set unchanged; restoration equals clean output |
| Static isolation and scanner self-checks | ran | Actual graph/intersections above; 52 clean/adversarial tests; platform syntax checks |
| Trusted extraction | ran | Bind-before-parse, inert field projection, endpoint typing, complete R, duplicate/getter/mask/extra-field rejection; no contact-based generation selector |
| Synthetic seal and comparator | ran | No reader call on invalid/absent seal; snapshot resists reader-side mutation; source binding checked before parse; stored direction and unique-parent validation |
| Synthetic accounting and categories | ran | Two rows sharing one key; all five lists/counts; both conservation identities; empty G=U flag; all seven mapper branches and invalid-over-incomplete precedence |
| Schema and wire semantics | ran | Full synthetic receipt passes corrected v1; canonical full-string scalar/key checks; boolean rejected/structured evidence shape; absent stages cannot earn a mathematical category; count tampering rejected |
| Synthetic determinism | ran | Build twice, reversed anchor/R/E order, identical materialized generation, projection digests and seal |
| Digest framing | ran | Number-free JCS vectors, UTF16 key ordering, surrogate/cycle/accessor rejection; exact 260-byte four-file preimage and terminal newline; ordered closure inventory |
| Full 18-tuple pre-flight suite | skipped | Not authorized; no pre-flight receipt generated |
| Production/canonical observation comparison | skipped | Not authorized; comparator exercised on toy bytes only |
| Ledger/manifest/QA writes and release validation | skipped | Prohibited in build phase; no new fixed-point claim |
| Commit/push | skipped | Not authorized |

The canonical-byte arithmetic unit is not a production derivation: only the
authorized structural extraction and numerical reference assertions ran; no
canonical contact/seam comparator was invoked, sealed production artifact emitted,
or canonical generated witness set persisted. Synthetic tooling green is not
obligation green. Mapper-oracle branches are hypothetical tests, not evidence
that strict `derived` is reachable on registered E/R.

### Concrete Digest Preimages And Review Choices

The implementation makes the following payload choices explicit for review:

1. Object digests hash UTF-8 JCS bytes with no trailing newline. The canonicalizer
   supports objects/arrays/strings/booleans/null, rejects numbers/BigInt/functions,
   lone surrogates, sparse arrays, getters, proxies and cycles. Engine BigInts
   become canonical decimal strings in materialization, not via lossy coercion.
2. `generationDigest` covers JCS of
   `{boundarySha256,specSha256,bindings,generation}`. This includes all completion,
   projection and audit bindings, not just witness arrays. Per-route digests
   cover their complete sorted witness/relation arrays.
3. `implementationDigest` is JCS of a path-sorted array of exact
   `{path,sha256}` source-file records; duplicate/absolute/traversing paths fail.
   Completeness of the accepted runtime/dependency inventory is a separate
   registration/pre-flight obligation, not proved by hashing caller-supplied data.
4. Normalized projection digests cover the actual string-valued anchors/R/E
   consumed by the wrapper, sorted by state identity or edge ID. Raw canonical
   source files retain their separate raw-byte SHA bindings.
5. The pure mapper accepts trusted validity/completeness facts; it is not itself
   a pre-flight adjudicator. The build receipt assembler always leaves all 18
   pre-flight controls ABSENT, so it cannot emit a positive research result.
   A later authorized harness must provide and verify actual control evidence;
   no production runner or automatic canonical file reader was added now.
6. `validateWire` applies schema, exact full-string pattern and ABSENT-category
   rules; it does not claim schema alone proves arithmetic. Receipt assembly
   independently recomputes comparison accounting from the sealed generation,
   rows and seam provenance and rejects inconsistent fields. Hash equality
   establishes consistency, not producer authentication or execution chronology.
7. T-C comparison lists use the ratified `tier:a:b:mid` form. Only A0 comparison
   keys normalize parent order; generated operands preserve directed tuples,
   and A1 output remains separate. The corrected-v1 changelog governs the older
   addendum's looser key-regex sentence; exact string checks reject terminal
   newlines as well as leading zeros without modifying the frozen schema.

These surfaced choices do not rewrite the seven outcomes or predicates. The
report and code await review; there is no claim that they discharge future
process-containment, runtime-hook, source-isolation or canonical-read controls.
Tests use `tests/d4/`, not `qa/`, to honor the no-QA-write constraint. The naming
stays `d4-*`; no unassigned GOV number is anticipated.

### Worked Full Synthetic Receipt

The following JSON is the actual output of the implemented toy path:
`syntheticPacket -> generate -> sealGeneration -> compareSealed -> buildReceipt`.
Its source documents are constructed in `tests/d4/synthetic.mjs`, not copied
from canonical observations. Toy binding hashes are explicitly not production
acceptance bindings. Its JCS digest is
`83cbe63ecfbb14d78833d37c9438a6e39bab18a28b8221306c9a79a495fdd794`.

Read field-by-field: one T-A witness and both ordered T-B witnesses carry their
parent/satellite/edge provenance. One directed A0 midpoint relation matches the
toy seam. Two different contact rows project to one observed key, so `both=2`
while `observedKeyCount=1`. For each route the five counts are (1,1,0,0,0):
1=1+0 and |U|=1=1+0. Both equality flags remain true. All 18 controls are present
as ABSENT, and the emitted category is therefore `incomplete_or_anomalous`, not
a claimed successful pre-flight or D4 verdict. The independent synthetic mapper
test selects `filter_plus_geometry` only when supplied hypothetical complete
valid evidence; that hypothetical condition is not applied to this receipt.

<!-- D4_WORKED_RECEIPT -->
```json
{
  "schemaVersion": "d4-derivation-wire.v1",
  "boundarySha256": "fd1ba87f9362ef51887b3755a3abdf6797c6c254bc253a424fbecfc9c78a924e",
  "specSha256": "96036307f1de5daf6269fb17ac3cbedce2b60341f9364041f784514cf8f16363",
  "bindings": {
    "ledgerSha256": "7ee55f073f352e740f6e1d56bb417868ecf054547b601ed579f57da579b53f47",
    "networkSha256": "676d3c4d01bd472c519c182ee277190aff029dd357b13f707663fbf6d8b6c944",
    "twinHubReceiptSha256": "e03e7730fa0d95cd3c8dcf28d25aa5c324ab0a0071dae587a49f4d324bd62977",
    "implementationDigest": "d808fb3ba10a793a3dc9677417a658447cf0574d2fa172e2db68b69c2e5ba18c",
    "projectionDigests": {
      "anchors": "319933c6d1644a19db734160a9e51ccfc98e22e81a8a894117e40b04f70a23e8",
      "R": "659637bedcda694d09b98994d1174979ea90778032f6ed78e30dfacbda1bd29d",
      "E": "99d15476c53b47f3d084828cbbbbd8d21c69a4e0c2569f180ae851143abe1083"
    }
  },
  "generation": {
    "routes": {
      "T-A": {"witnesses": [
        {"tag":"kernel_twin","a":"127","b":"254","h":"253","s":"90001","k":"0"}
      ]},
      "T-B": {"witnesses": [
        {"tag":"construction_join","e1source":"127","e2source":"254","h":"253","s":"90001","parentOffice":"0","e1id":"synthetic:construct:a","e2id":"synthetic:construct:b"},
        {"tag":"construction_join","e1source":"254","e2source":"127","h":"253","s":"90001","parentOffice":"0","e1id":"synthetic:construct:b","e2id":"synthetic:construct:a"}
      ]}
    },
    "tC": {"relations": [{"tier":"A0","a":"127","b":"254","mid":"0"}]},
    "completion": {
      "perRoute": {
        "T-A": {"expected":"343","visited":"343","outputs":"1","digest":"8d35f84e079028ca8737f95bf7511d157b833aab9e8fe5855d526d36d754956d"},
        "T-B": {"expected":"4","visited":"4","outputs":"2","digest":"d0c1453225c592428eb5793ed605d200a98f00ade841f3c2858f39d4b3588bfa"},
        "T-C": {"expected":"84","visited":"84","outputs":"1","digest":"13e5cb2fa0df4d18299dbce084beb7476b31aaa93096b6bf91a5c910dca99ab3"}
      },
      "status": "complete"
    }
  },
  "seal": {
    "generationDigest": "a7065591f317afb7dc3cb0f0f2312ca2e7edd32034b94b60fbd6de2a7fd9d1ea",
    "inputIdentities": {
      "ledgerSha256": "7ee55f073f352e740f6e1d56bb417868ecf054547b601ed579f57da579b53f47",
      "networkSha256": "676d3c4d01bd472c519c182ee277190aff029dd357b13f707663fbf6d8b6c944",
      "implementationDigest": "d808fb3ba10a793a3dc9677417a658447cf0574d2fa172e2db68b69c2e5ba18c"
    },
    "complete": true
  },
  "comparison": {
    "rows": [
      {"contactRowId":"synthetic:contact:a","d":"80001","s":"90001","h":"253","parentOffice":"0","key":{"parentOffice":"0","s":"90001"},"membership":"both"},
      {"contactRowId":"synthetic:contact:b","d":"80002","s":"90001","h":"253","parentOffice":"0","key":{"parentOffice":"0","s":"90001"},"membership":"both"}
    ],
    "routes": {
      "A": {
        "generated_key_count":"1","in_R_count":"1","extra_beyond_R_count":"0","R_missed_count":"0","in_R_but_unmatched_count":"0",
        "generatedKeys":["0:90001"],"inRKeys":["0:90001"],"extraBeyondRKeys":[],"rMissedKeys":[],"inRButUnmatchedKeys":[],
        "matchedObservedKeys":["0:90001"],"missedObservedKeys":[],"restatement_signature":true
      },
      "B": {
        "generated_key_count":"1","in_R_count":"1","extra_beyond_R_count":"0","R_missed_count":"0","in_R_but_unmatched_count":"0",
        "generatedKeys":["0:90001"],"inRKeys":["0:90001"],"extraBeyondRKeys":[],"rMissedKeys":[],"inRButUnmatchedKeys":[],
        "matchedObservedKeys":["0:90001"],"missedObservedKeys":[],"restatement_signature":true
      }
    },
    "observedKeyCount":"1",
    "fourCellCounts":{"aOnly":"0","bOnly":"0","both":"2","neither":"0"},
    "uKeys":["0:90001"],
    "tC": {
      "matches":["A0:127:254:0"],"missing":[],"extra":[],"midpoint_exact":true,"a1Separate":[],
      "generatedRelations":[{"a":"127","b":"254","mid":"0","tier":"A0"}],
      "observedRelations":[{"tier":"A0","a":"127","b":"254","mid":"0"}],
      "seamProvenance":[{"targetH":"253","parentA":"127","parentB":"254","parentOffice":"0","edgeId1":"synthetic:construct:a","edgeId2":"synthetic:construct:b"}]
    }
  },
  "controls": {
    "binding":{"status":"ABSENT","reason":"Build phase only; pre-flight not executed"},
    "isolation":{"status":"ABSENT","reason":"Build phase only; pre-flight not executed"},
    "route_isolation":{"status":"ABSENT","reason":"Build phase only; pre-flight not executed"},
    "kernel_perturbation":{"status":"ABSENT","reason":"Build phase only; pre-flight not executed"},
    "edge_deletion":{"status":"ABSENT","reason":"Build phase only; pre-flight not executed"},
    "production_E_completeness":{"status":"ABSENT","reason":"Build phase only; pre-flight not executed"},
    "anchor_input":{"status":"ABSENT","reason":"Build phase only; pre-flight not executed"},
    "edge_input":{"status":"ABSENT","reason":"Build phase only; pre-flight not executed"},
    "T-C":{"status":"ABSENT","reason":"Build phase only; pre-flight not executed"},
    "contact_join":{"status":"ABSENT","reason":"Build phase only; pre-flight not executed"},
    "seam_input":{"status":"ABSENT","reason":"Build phase only; pre-flight not executed"},
    "seal":{"status":"ABSENT","reason":"Build phase only; pre-flight not executed"},
    "completeness":{"status":"ABSENT","reason":"Build phase only; pre-flight not executed"},
    "R_bounds":{"status":"ABSENT","reason":"Build phase only; pre-flight not executed"},
    "accounting":{"status":"ABSENT","reason":"Build phase only; pre-flight not executed"},
    "outcome_precedence":{"status":"ABSENT","reason":"Build phase only; pre-flight not executed"},
    "determinism":{"status":"ABSENT","reason":"Build phase only; pre-flight not executed"},
    "nonvacuity":{"status":"ABSENT","reason":"Build phase only; pre-flight not executed"}
  },
  "category":"incomplete_or_anomalous"
}
```

### Scope Check And HALT

`git status --short` before and after distinguishes the nine added files above
from the pre-existing dirty freeze/product/migration work. This pass updates
only this report in addition to those files. Raw SHA checks preserve the frozen
boundary/spec/schema/addendum/math reference, decision ledger, manifest and
checksums. No package or dependency files were modified. No canonical observation
test was hidden inside the synthetic comparator checks.

**HALT upon report completion.** Review the implementation, payload choices,
scanner evidence and worked receipt. Pre-flight execution, production authorization,
canonical comparison, ledger landing and packaging require separate grants.
The prior integrated 416/2 receipt is not fresh validation of these new build
files; it is neither rerun nor relabeled here.

## Historical Stop Record (Before Corrected-v1 Ratifications)

The following is the previous blocked-at-contract assessment, retained as history.
It does not describe the current implemented state summarized above.

**Build status: stopped before implementation.** The accepted wire documents
conflict with the frozen boundary/spec and omit required receipt representations.
The build directive's stop-and-report rule applies. No D4 engine, extractor,
comparator, static screen, or test module was created. No pre-flight, production
run, canonical observation comparison, or research category was executed/emitted.

This is a build report, not a ledger entry or an assertion that the frozen
boundary has been amended. No frozen document was changed. Earlier claims that
the wire schema was fully faithful were based on field-name presence checks,
not these representability tests; those checks did not establish conformance.

## 1. File Inventory And Input Bindings

Only `scrum/plan/d4-implementation-report.md` is created in this pass. No existing
file is modified. Its final raw SHA-256 is emitted separately in the execution
transcript/final relay: putting the full-file hash inside the file would create
an unsatisfiable self-reference. This is the sole inventory exception, not a
substitute digest claimed to identify the complete file.

Frozen/read input SHA-256 values recomputed at this sitting:

| File | SHA-256 |
|---|---|
| `scrum/plan/d4-boundary-draft.md` | `751d56d4f01ea1a0d054c8119d178a64b20787aa9fb095a02c99f3ba3b135de2` |
| `scrum/plan/d4-implementation-spec-draft.md` | `5096f1e3caf5e1f2a9a3984bcb4aa54b38a7cab4d20a9d34bb57516dfafa9042` |
| `schemas/d4-derivation-wire.schema.json` | `beb422487def16ca68c9c377a2acfa7d05c15acdfeccf1fde540a3b82d5d8c80` |
| `scrum/plan/d4-wire-schema-addendum.md` | `cbf54aba073e8e759f0a7f1c1a1186dd91005e81024c255bf5638c7b65acd1fe` |
| `scrum/plan/d4-domain-cardinality-verification.md` | `58717ab4ec26b615b617401da4c613d23a4d8cdeb3c3fb408f119e4e91e78946` |

Protected-file checkpoints before the report write:

| File | SHA-256 |
|---|---|
| `provenance/DECISION_LEDGER.md` | `ac50241b6c432394b55864e2ea79755d70ddca60529476edf470f2c39f509c74` |
| `MANIFEST.json` | `688ad597a3bfcc1e0da1b4426359332cc718d6a6774ca2d1a013583cd632fcd0` |
| `CHECKSUMS.sha256` | `59123b2dbfb395494bb83df1334b8aac9103a3dc582ef826c9d757851cfcc967` |

## 2. Stop Findings

### A. Observation Population And R Direction Conflict

Boundary lines 188-196 and implementation spec sections 3.2/3.3 define O from
the D4-only contacts, with A1 satellite source s and D4 anchor target d. The
addendum lines 12-15 instead says the D4/D5 combined population defines O.
That is a different observation domain; the implementation cannot silently
choose the D4 subset while claiming the addendum says the same thing.

The addendum line 13 calls R directed "satellite-to-parent edges". The frozen
spec section 3.1 and ENTRY 9 explicitly define GOVERNS.source=h (parent anchor)
and GOVERNS.target=s (satellite). Informal inheritance direction must not replace
stored endpoint direction. Both wording corrections require explicit approval;
neither was applied here. No canonical contact rows were read to find these
textual conflicts.

### B. Early Failure Receipts Cannot Represent Missing Stages

The spec sections 5, 6 and 7 require honest incomplete handling when a seal or
comparison evidence is absent. The wire root unconditionally requires
`generation`, `seal`, `comparison`, all control slots, and `category`.
`seal.complete` is unconditionally `const: true`; seal omission, null, or false
is rejected. Thus there is no specified conforming representation of an absent
seal, even for `incomplete_or_anomalous`. A stage-specific failure envelope could
resolve this, but none is registered and inventing one locally is prohibited.
Fabricated complete seals, empty observations standing for unread observations,
or placeholder successful stages are not acceptable substitutes.

### C. Required Comparator/Control Evidence Is Not Encodable As Specified

ENTRY 9 attachment F requires each of the five counts to carry its sorted witness
key list, plus observed-key and four-cell contact-row counts. Wire
`definitions.routeAccounting` permits only `generatedKeys`, `matchedObservedKeys`,
and `missedObservedKeys` as lists. It has no witness-list fields for G intersect U,
G minus U, U minus G, or (G intersect U) minus O. The comparison object also has
no `observed_key_count` or four-cell count fields, and additional properties are
forbidden. Derivability of some quantities from other data does not satisfy a
requirement to carry first-class fields. U's complete set is not carried either.

Spec section 7 explicitly requires paths such as `controls.binding.rejected=true`.
Wire `definitions.controlResult` forbids a `rejected` property and restricts
`evidence` and `cleanCounterpart` to unspecified nonempty strings. A structured
evidence object is rejected. Embedding a new JSON subprotocol in those strings
would be an unreviewed encoding choice, not implementation fidelity.

Spec sections 3.4 and 5 require full generated/observed T-C relation operands and
source-edge provenance. Wire `comparison.tC` permits only string lists
`matches`, `missing`, `extra`, `a1Separate`, plus `midpoint_exact`. The relation
string encoding, tuple ordering within those strings and provenance shape are
unspecified. Adding typed operand fields is rejected. A permissive string schema
can carry arbitrary bytes, but it does not define the agreed wire protocol.

### D. Canonical Integer Rules Have Conflicting Accepted Encodings

The addendum line 19 forbids leading zeros and whitespace. Its line 20 and the
wire key pattern `^[0-6]:[0-9]+$` accept `0:01`. The scalar decimal pattern also
accepts `"0\n"` under the exercised Draft 2020-12 validator because `$` can match
before a terminal newline. These are schema-accepted values, not correct
canonical decimal encodings. A stricter semantic parser could reject them, but
that must be explicitly reconciled with the frozen wire rules, not silently
advertised as schema-enforced rejection.

### E. Seal And Spec Digest Preimages Are Underspecified

The schema describes `specSha256` as including the addendum, but supplies no
multi-file aggregation/preimage convention. It also names `generationDigest`,
`implementationDigest` and projection digests without a complete canonical byte
serialization and closure-inventory format. Tuple sorting alone does not specify
object-key order, framing or the exact digest preimage. These are choices needing
ratification before implementing byte-identity or tamper guarantees. No arbitrary
concatenation, stringified evidence format, or hash convention was selected here.

## 3. Executed Schema Counterexamples

Ran the existing `.venv/bin/python -B` with `jsonschema 4.26.0`, using
`Draft202012Validator.check_schema` and `iter_errors`. The metaschema check passed:
the document is a structurally valid schema, not a compatible complete contract.
No dependencies were installed and no bytecode/fixture/QA output was written.

A full in-memory shape-only baseline used zero digest strings, empty route and
comparison lists, canonical zero count strings, all 18 controls marked skipped,
and category `incomplete_or_anomalous`. Its hypothetical `seal.complete=true`
allowed it to validate. This baseline is NOT a generated receipt, a verified
seal, a pre-flight result, or the requested worked engine example. It exists
only to isolate schema rules while varying one field at a time.

Thirteen schema probes were asserted against that baseline:

| Probe | Actual Schema Result | Rule / Message |
|---|---|---|
| Omit seal | REJECT | `required`: `'seal' is a required property` |
| Set seal to null | REJECT | `type`: `None is not of type 'object'` |
| Set seal.complete=false | REJECT | `const`: `True was expected` |
| Add controls.binding.rejected=true | REJECT | `additionalProperties`: rejected was unexpected |
| Use controls.binding.evidence={rejected:true} | REJECT | `type`: object is not of type string |
| Add comparison.observed_key_count | REJECT | `additionalProperties`: observed_key_count was unexpected |
| Add an in-R witness list | REJECT | `additionalProperties` in routeAccounting |
| Add a beyond-R witness list | REJECT | `additionalProperties` in routeAccounting |
| Add an R-missed witness list | REJECT | `additionalProperties` in routeAccounting |
| Add an in-R-but-unmatched witness list | REJECT | `additionalProperties` in routeAccounting |
| Add typed T-C generated/observed operands | REJECT | `additionalProperties` in comparison.tC |
| Use generatedKeys=["0:01"] | ACCEPT | Noncanonical satellite component permitted by key regex |
| Use generated_key_count="0\n" | ACCEPT | Terminal newline permitted by scalar regex |

The four list probe names (`inRKeys`, `extraBeyondRKeys`, `RMissedKeys`,
`inRButUnmatchedKeys`) and two operand probe names (`generatedRelations`,
`observedRelations`) were illustrative unknown fields, not proposed registered
names. The findings follow from the closed allowed-property sets, not from
claiming those particular spellings were already mandated.

Small independent reproduction for the most direct contradictions:

```python
import json
from pathlib import Path
from jsonschema import Draft202012Validator as V

s = json.loads(Path("schemas/d4-derivation-wire.schema.json").read_text())
V.check_schema(s)
h = "0" * 64
seal = {"generationDigest": h,
        "inputIdentities": {"ledgerSha256": h, "networkSha256": h,
                            "implementationDigest": h}, "complete": False}
assert not V(s["properties"]["seal"]).is_valid(seal)
control = {"state": "skipped", "reason": "schema probe only",
           "observed_gate": "unexecuted", "evidence": "not run",
           "cleanCounterpart": "not run", "implementationDigest": h}
assert V(s["definitions"]["controlResult"]).is_valid(control)
assert not V(s["definitions"]["controlResult"]).is_valid({**control, "rejected": True})
accounting = s["definitions"]["routeAccounting"]["properties"]
assert V(accounting["generatedKeys"]).is_valid(["0:01"])
assert V(accounting["generated_key_count"]).is_valid("0\n")
```

Passing these assertions reproduces the defects; it is not engine schema
conformance green. Cross-field semantic validation would still be necessary
after a corrected wire contract. The report does not demand that JSON Schema
alone prove cryptographic seals, arithmetic conservation or execution chronology.

## 4. Isolation And Utility Decisions

No engine exists, so no mechanical route reachability sets, intersections or
code-to-predicate correspondence can truthfully be reported. AST parser pinning,
parser probes and call-graph verification were skipped after the contract stop;
schema validation above does not substitute for parser verification.

The maintainer decisions remain recorded as requirements for the eventual build:
stable `d4-` filenames, no anticipated GOV identifier, one shared
`rotateMaskZ12(m)` primitive consumed by T-A/T-C with a pure-arithmetic/no-state/
no-selection/no-observation reason, and T-C-private `midZ7(o_a,o_b)`.
These are not yet an implemented or mechanically checked helper allowlist.
T-A/T-B require generative call-graph separation. T-A/T-C both consume A0
anchors; their input sets are not literally disjoint. Their separate-output
dependencies must be checked without claiming independence from helper topology.

## 5. Predicate And Verification-Artifact Conformance

No implementation code is available to quote alongside the frozen anchors;
the stop occurred before authoring route logic. The approved T-A endpoint
orientation, T-B co-parent join, T-C midpoint relation and the 9604/5488/84
candidate domains were not changed. No conflict with the verified midpoint or
domain arithmetic was found during contract inspection. Engine arithmetic
tests were not run, and that is not equivalent to having verified an engine.

The verification-artifact SHA in section 1 binds the mathematical reference.
The missing worked synthetic generation -> seal -> comparison -> category example
is explicitly skipped: producing it now would conceal the contract gaps by
inventing field encodings or omitting mandated evidence. No fabricated example
is offered as an implementation result.

## 6. Ran / Skipped And Worktree Scope

| Build Obligation | State | Result / Reason |
|---|---|---|
| Required ordered reading | ran | Standing rules, hold/correction/ENTRY 9, boundary, spec, wire documents and arithmetic reference read; D5 consulted only at its isolation-history pointer |
| Frozen input SHA verification | ran | Boundary/spec match directed hashes; all five input digests recorded |
| Schema metaschema and synthetic representability checks | ran | Metaschema valid; 13 asserted probes expose contract defects; no canonical observations read |
| Predicate units and source-backed demonstration sets | skipped | Stop-and-report triggered before engine implementation |
| Static isolation, parser verification, shared-helper allowlist proof | skipped | No implementation/call graph exists; no empty-set proof fabricated |
| Synthetic comparator and conservation tests | skipped | Required comparison evidence cannot be represented as specified |
| Worked full synthetic engine receipt | skipped | No engine, verified seal or comparator output exists |
| Build-twice and reordered-input byte identity | skipped | Not meaningful without the implemented routes and fixed digest preimages |
| Eighteen-tuple pre-flight suite | skipped | Explicitly prohibited in build-only phase |
| Production and canonical D4 comparison | skipped | Explicitly prohibited; no source observations loaded by the schema probes |
| Ledger, manifest, QA receipt, frozen-document writes | skipped | Prohibited; none performed |
| Commit, push, release change | skipped | Prohibited; none performed |

`git status --short` was inspected before writing: the workspace already contained
the prior freeze, migration, product, schema and planning changes. They were
retained, not reverted or claimed as this pass's implementation. The only new
path from this pass is this report. Final whitespace, frozen/protected SHA and
worktree checks accompany the relay. No generated QA receipt is written merely
to package these schema diagnostics.

## 7. Required Maintainer Resolution And HALT

Approve reconciled O selection and R direction wording, a wire representation
for unexecuted/missing stages, the required first-class accounting/control
evidence, typed T-C encoding/provenance, canonical scalar/key rejection rules,
and seal/spec/closure digest preimages. Whether this is a corrected v1 or a new
wire revision is a maintainer registration decision. Do not edit ENTRY 9's
predicates to repair an encoding defect.

After the reconciled contract is accepted, resume build-only implementation and
its self-verification under the existing exclusions. This report authorizes no
repair of frozen bytes. **HALT: implementation incomplete due to contract
conflict; no green engine, pre-flight, production, or research-verdict claim.**
