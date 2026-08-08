# Universal Graph Repair Report

## Observed packaging defect

The earlier file began directly with the graph `<div>` and contained only an
embeddable HTML fragment. It referenced host-defined CSS variables such as
`--background`, `--foreground`, `--border`, and the six visualization-series
colors, as well as host utility classes such as `card`, `form-select`, and
`form-label`.

The renderer logic and canonical data were present, but the file was packaged
as though it were a complete standalone document. Outside the original host,
its visual dependencies were absent and some preview surfaces could decline to
execute the inline script. This made the artifact appear blank, incomplete, or
noninteractive even though the internal graph logic passed its fragment-level
tests.

## Repair

- Added a complete HTML document with viewport and document metadata.
- Supplied all required light/dark theme variables and form/card primitives.
- Removed every remote runtime dependency.
- Preserved the canonical embedded snapshot and existing interaction model.
- Added a deterministic rebuild script from the editable fragment.
- Added an optional local server and Neo4j projection-parity check.

## Verification

- Complete-document check: PASS
- Offline asset closure: PASS
- Inline JavaScript syntax: PASS
- Universal view: 462 nodes and 1,824 rendered relationships
- Seated-office view: 308 nodes and 588 relationships
- Typed-boundary view: 378 displayed nodes and 476 relationships
- D7 view, D6 view, ten-anchor view, A0-A2 field view: PASS
- View switching, relationship filtering, state selection, and detail evidence:
  PASS
- Desktop and narrow-width DOM execution: PASS
- Runtime exceptions: 0
- Local HTTP serving and byte-for-byte response check: PASS
