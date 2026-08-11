# Seven Governors Court Substrate

Version `0.1.0` is the deterministic CRT-302 pentatonic substrate registry. It
materializes the bounded Court scope defined by CRT-301 without editing the
frozen companion `fivefold_engine.yaml`.

The package contains:

- all 38 pentatonic Forte set classes and complement pointers into the
  canonical 38-family heptatonic registry;
- the five rooted C0-C4 positions of 5-35 with exact masks, pole registers,
  normalized `kappa_court` ratios, XOR supports, and selected T5 offsets;
- concrete 5-23 and 5-27 rootings shared by Aeolian `1453` and Harmonic Minor
  `2477`;
- the full 12-entry T5 root cycle and the selected Court segment
  `0 -> 5 -> 10 -> 3 -> 8`; and
- explicit `admitted`, `admitted-bridge`, and `proposed` records with no
  integrated-release effect before CRT-309.

`minimalAdditionalBridgeSetClasses` is empty because both required bridge
classes independently mediate the example. Other shared five-note subsets are
possible filters, but none is minimally necessary.

## Validate

Node.js 20 or later is required.

```bash
npm install
npm run validate
```

Regenerate the canonical package and deterministic reports with:

```bash
npm run release:emit
```

The release remains `proposed_pending_crt_309`. Internal record admission marks
the bounded data eligible for later integration; it does not retroactively
change integrated release 1.2.0.

See `docs/SOURCE_AUTHORITY.md` for derivations and conflict rulings.
