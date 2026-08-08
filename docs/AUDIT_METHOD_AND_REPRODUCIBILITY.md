# Audit Method and Reproducibility

## 1. State universe

A rooted heptatonic state is a twelve-bit pitch-class mask with:

- pitch class 0 present;
- exactly seven occupied pitch classes.

There are `C(11,6) = 462` such states. Enumeration is independent of Ian Ring's
catalogue or any other naming source. Names are metadata; the topology is
computed from the bitmasks.

The 462 states reduce to:

- 38 Forte Tn/I classes;
- 66 modal-orientation orbits;
- 10 achiral classes;
- 28 chiral classes.

## 2. Relation channels

### Fixed-tonic single-degree relation

The tonic remains pitch class 0. One occupied non-tonic pitch class is replaced
by an adjacent semitone in an unoccupied position. Degree order must remain
valid. The two masks therefore have Hamming distance 2.

### Adjacent-root phase relation

The root alone is displaced one semitone below or above the current tonic when
the destination is unoccupied. All other absolute pitch positions remain
unchanged, then the result is renormalized so the new root is pitch class 0.

This is the relation that preserves connections such as Lydian–Locrian across
adjacent tonics. It is stored separately from fixed-tonic evidence through
`mode`, `phaseDelta`, and mutation fields.

### Midpoint test

For a fixed-tonic bridge, the candidate is Hamming distance 2 from each
endpoint and the two endpoints are Hamming distance 4 apart. Phase-seam cases
are recorded as phase relations rather than retroactively treated as
fixed-tonic midpoint pairs.

## 3. Precedence

Office resolution always uses the highest already-established eligible tier:

`A0 → A1 → A2 → D1 → D2 → D3 → D4 → D5 → D6 → D7`

The completion build freezes every A0–D6 role, tier, and office. It can:

- add a previously missing state;
- refine a generic `boundary` fine role;
- record new non-governing evidence.

It cannot overwrite an established governor assignment.

## 4. D7 qualification test

Forte 7-1 is admitted as a D7 terminal anchor only if all of the following pass:

1. one complete seven-mode achiral orbit;
2. no earlier anchor claim for any mode;
3. exactly two eligible D6 contacts per mode;
4. both contacts are 7-2 satellites;
5. one contact comes from each chiral 7-2 orientation;
6. both contacts agree on one governor office;
7. the seven modes occupy the seven offices exactly once;
8. fixed contacts form Hamming-4 endpoint pairs where applicable;
9. phase-seam cases remain explicitly phase relations;
10. no eligible residual children remain.

The result is seven D7 anchors, fourteen D6 seat contacts, twelve fixed
relations, two phase relations, and no D7 satellites.

## 5. Chiral boundary classification

### Oriented convergence ring

A complete chiral pair of orientations receives at least two independent
same-office satellite contacts per state. Each orientation traverses all seven
offices once. The office is recorded as relational evidence but is not inherited
categorically because the family remains orientation-dependent.

### Office junction

Each state receives a stable multi-office contact vector. The plurality and
offset pattern are retained. No office is assigned because the framework has no
declared tie-resolution operator.

### Peripheral leaf

Each 7-5 state receives one office-consistent D4 contact. One non-governing
contact does not authorize recursive office inheritance.

## 6. Reproduction

The scripts require a current Node.js runtime. Workbook generation additionally
requires `@oai/artifact-tool`.

From the package root:

```bash
export SEVEN_GOVERNORS_WORKSPACE="$PWD/reproduction"
export SEVEN_GOVERNORS_D6_SNAPSHOT="$PWD/source-snapshots/seven-governors-a0-a2-d1-d2-d3-d4-d5-d6-network-data.json"
export SEVEN_GOVERNORS_PACKAGE_ROOT="$PWD/rebuilt-package"
node scripts/build_universal_completion.mjs
node scripts/validate_universal_completion.mjs
```

The workbook scripts resolve their inputs and outputs from
`SEVEN_GOVERNORS_PACKAGE_ROOT`. Run them in an environment where
`@oai/artifact-tool` is available:

```bash
node scripts/build_universal_workbook.mjs
node scripts/validate_universal_workbook.mjs
```

## 7. Release checks

The package is accepted only if:

- the build validation report is `PASS`;
- the independent validator is `PASS`;
- all 462 state IDs are unique and complete;
- every edge endpoint resolves;
- all formal D7 validations pass;
- all boundary families pass their declared role tests;
- no chiral boundary state receives a Governor office;
- the exported workbook has the expected sheets, row counts, formulas, and
  eight passing release gates.
