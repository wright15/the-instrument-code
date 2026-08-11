# Court Substrate Source Authority

## Authority order

1. `schemas/court-admission-contract.json` defines the bounded CRT-301 scope.
2. `canonical/universal-network-data.json` supplies the complete 38-family
   heptatonic registry and rooted state identities.
3. `canonical/universal-heptatonic-ledger.json` supplies an independent rooted
   state ledger used for source closure.
4. `framework/AGENTS.md` supplies C0-C4 masks and XOR supports.
5. The frozen companion `fivefold_engine.yaml` supplies proposed pole vectors,
   pole order, and kappa evidence; it is read but never modified.
6. `source/substrate-input.json` records the reviewed bounded selections.

The generated canonical package is a candidate input to CRT-309. It cannot
change the integrated release, topology offices, or the frozen companion.

## Complement policy

Every pentatonic class is paired with the same-numbered heptatonic complement
family in the complete `familyRegistry` of
`canonical/universal-network-data.json`. A concrete rooted pair satisfies:

```text
heptatonicMask = 4095 XOR pentatonicMask
```

`canonical/topology-identity-definitions.json` names 30 of the 38 families. A
nullable `topologyIdentityPointer` records those narrower identity definitions;
the complete canonical family registry remains the complement-pointer owner.

## Bridge derivation

Aeolian `1453` and Harmonic Minor `2477` share
`{0,2,3,5,7,8}`. Two reviewed five-note subsets are:

| Class | Rooted set | Mask | Raw complement mask |
|---|---|---:|---:|
| 5-23 | `{0,2,3,5,7}` | `173` | `3922` (class 7-23 after root normalization) |
| 5-27 | `{0,3,5,7,8}` | `425` | `3670` (class 7-27 after root normalization) |

Both are subsets of both endpoints and therefore independently mediate the
declared filter route. No additional set class is minimally required. Other
five-note subsets of the six shared tones remain proposed.

Because every reviewed pentatonic rooting contains pitch class 0, its raw
complement does not. A raw complement mask is therefore not itself one of the
root-0 `ScaleState` IDs. The package stores the raw complement and a separate
TnI-normalized root-0 `ScaleState` pointer; it never equates the two identities.

## Corrected prose conflict

The former examples in `docs/MATHEMATICAL_REALIZATION_SPECIFICATION.md` used
`{0,2,5,7,9}` for 5-23 and `{0,4,5,7,10}` for 5-27. Those masks are classes
5-35 and 5-29 respectively and include pitches outside the shared endpoint
intersection. CRT-302 corrects the root document and records the executable
derivation above; the frozen framework files remain unchanged.

## T5 policy

Because `gcd(5,12)=1`, T5 has a 12-entry root cycle:

```text
0 -> 5 -> 10 -> 3 -> 8 -> 1 -> 6 -> 11 -> 4 -> 9 -> 2 -> 7 -> 0
```

The reviewed Court sequence is the selected first five-entry segment, not a
closed cycle. C0-C4 point to segment indices 0-4. The concrete bridge rootings
use root 0 and therefore point to full-cycle index 0 with semantics
`root_alignment_only`; this does not claim that T5 generates their set class.
