# Court Mathematics

`court-mathematics` is the dependency-free Python implementation of the
framework's exact harmonic structure. It computes pitch-class invariants,
rooted degree triads, rank-2/rank-3 subset incidence, parsimonious
voice-leading data, and immutable harmonic profiles.

The package does not own Governor semantics, topology office assignment,
runtime task state, or Neo4j data. It consumes those domains by stable
identifier and source fingerprint.

## Phase 1 API

```python
import hashlib

from court_mathematics import HarmonicProfile, RootedScale

aeolian = RootedScale.from_pitch_classes(
    (0, 2, 3, 5, 7, 8, 10),
    root=0,
)
profile = HarmonicProfile(
    subject_id="scale-state:1453",
    source_id="universal-heptatonic-ledger:1453",
    source_sha256="6d2603a2499aea55b6bc13d11694ae10e6bfad1d62cb488506a57333e182f6c9",
    rooted_scale=aeolian,
)

assert profile.coordinates.h_c.degree_triads[0].quality.value == "minor"
assert profile.aggregate_harmonic_compression.value is None
assert len(profile.fingerprint_sha256) == 64
assert profile.fingerprint_sha256 == hashlib.sha256(profile.identity_bytes()).hexdigest()
```

All intrinsic calculations use integers, tuples, enums, and `None`. Floats,
`Decimal`, and implicit approximate rationals are rejected by canonical
profile serialization. Future exact ratios must use explicit numerator and
denominator fields.

The formal vocabulary and admission boundaries are defined in
[`docs/01_COURT_LEXICON.md`](docs/01_COURT_LEXICON.md).
