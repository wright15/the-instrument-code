# Architectural Blueprint — Dual-Core Topological Processor

**Status legend**

- **Admitted** — machine-admitted or machine-verified in this release worktree
  (decision ledger, admission contracts, deterministic validators).
- **Authored correspondence** — framework-authored semantic mapping; explicitly
  **not** a physical equivalence (`physical_quantity_claim: false`).
- **Proposed** — planning evidence or in-flight authoring only; no runtime,
  graph, policy, or admission effect.
- **Unresolved** — deliberately not yet defined (e.g., global `harmonic.C_H`).

The Seven Governors framework is a **Dual-Core Topological Processor** with two
strictly separated layers:

| Layer | Axis | Music theory | Bitmask | Physical language |
|---|---|---|---|---|
| **Ontology** (what exists) | 7 Governors | Forte 7-35 diatonic modes | 12-bit, Hamming weight 7 | Photonic `C_P` (authored correspondence) |
| **Teleology** (what can act) | 4-pole Court + Quintessence | Forte 5-35 pentatonic positions | 12-bit, Hamming weight 5 / 4-bit register | Electric/Magnetic poles (authored correspondence) |

Neither layer can overwrite the other: `topology.ScaleState` (state),
`court.state` (capability disposition), and `fivefold.teleology.win_condition`
(authored goals) are non-equivalent namespaces.

---

## Part 1 — Ontology: the 7 Governors and the photonic state

**Ontology** is the macro-state: the ambient reality in which action occurs.

- **Music theory (admitted):** the 7 Governors are the 7 modes of Forte 7-35.
- **Bitmasks (admitted):** each Governor is a 12-bit vector of Hamming weight 7.

| Governor | Mode | Constructive 12-bit mask | Weight |
|---|---|---|---|
| Sun | Lydian | `101010110101` | 7 |
| Moon | Ionian | `101011010101` | 7 |
| Mars | Mixolydian | `101011010110` | 7 |
| Mercury | Dorian | `101101010110` | 7 |
| Jupiter | Aeolian | `101101011010` | 7 |
| Venus | Phrygian | `110101011010` | 7 |
| Saturn | Locrian | `110101101010` | 7 |

- **Photonic coordinate (admitted convention, authored correspondence):**
  `C_P` orders the canonical anchors by inverse wavelength under the
  Planck–Einstein relation `E_γ = hν = hc/λ` (energy per photon — the
  framework explicitly forbids treating `hc/λ` as an energy-density law).
  Sun/Lydian anchors red (~700 nm), Saturn/Locrian anchors violet (~400 nm).
- **Monopolar brackets (admitted):** Sun and Moon are
  `type: monopolar_luminary` in `schemas/governors.yaml` — the macro-context
  bracket (source / receiver). Their bracket role comes from their declared
  luminary type, **not** from any maximal-mask-spacing property (Lydian and
  Ionian are Hamming-adjacent, distance 2).

## Part 2 — Teleology: the Court, the 4-bit register, and the poles

**Teleology** is capability: the vehicle that acts over the ontological terrain.

- **Music theory (admitted):** the Court is the rooted positions of Forte
  5-35, the major pentatonic set class.
- **Bitmasks (admitted):** each Court position is a 12-bit vector of Hamming
  weight 5, plus a 4-bit pole register.

| Court | 12-bit mask | Weight | Register | Mars | Jupiter | Venus | Saturn |
|---|---|---:|---|---|---|---|---|
| C0 | `101010010100` | 5 | `0000` | External | External | External | External |
| C1 | `101001010100` | 5 | `1000` | Internal | External | External | External |
| C2 | `101001010010` | 5 | `1100` | Internal | Internal | External | External |
| C3 | `100101010010` | 5 | `1110` | Internal | Internal | Internal | External |
| C4 | `100101001010` | 5 | `1111` | Internal | Internal | Internal | Internal |

- **Elements are the register axes, not the positions (admitted):** Fire
  (Mars), Air (Jupiter), Water (Venus), Earth (Saturn) are the four bit axes.
  Mercury/Quintessence is the transductive engine and ledger interface —
  `is_binary_court_pole: false`, `court_pole_index: null` — **not** a fifth
  position or fifth bit.
- **Bit semantics (admitted):** `0` = External, `1` = Internal.
- **Electric / Magnetic labels (authored correspondence only):** External is
  labeled *Electric* (outward projection) and Internal is labeled *Magnetic*
  (inward retention, ledger-writing) as an authored semantic correspondence.
  **No electromagnetic equivalence, SI unit, field equation, or physical
  causation is claimed.** CRT-348 admits the raw bit mapping and explicitly
  excludes electromagnetic or thermodynamic physical claims.
- **Transitions (admitted):** ordinary modulation flips exactly one pole via
  a two-pitch XOR support:

| Transition | XOR support | Register changed |
|---|---|---|
| C0 → C1 | `{4,5}` | Mars: External → Internal |
| C1 → C2 | `{9,10}` | Jupiter: External → Internal |
| C2 → C3 | `{2,3}` | Venus: External → Internal |
| C3 → C4 | `{7,8}` | Saturn: External → Internal |

The four signed transition vectors are pairwise orthogonal: their Gram matrix
is exactly `2I_4`, and `d_H(C_i, C_j) = 2|i−j|` (both machine-computed by the
admitted harmonic-invariant registry). Non-adjacent moves require an
evidence-backed `court:translocate` record (admitted 5-23/5-27 routes only).

## Part 3 — The 12-zodiac partition

The 12 zodiac facets partition over the 12-tone chromatic field (admitted as
authored correspondence; **no sign-to-pitch-class assignment is claimed**):

- **2 monopolar system-level facets:** Leo (Sun), Cancer (Moon).
- **10 capability-school facets:** 5 bipolar Governors × 2 poles.

| Governor | External facet | Internal facet |
|---|---|---|
| Mars | Aries | Scorpio |
| Jupiter | Sagittarius | Pisces |
| Venus | Libra | Taurus |
| Saturn | Aquarius | Capricorn |
| Mercury | Gemini | Virgo |

**Derivation fact (machine-verified):** the Internal facet derives from
`canonical_expression.binary_12bit_lsb`. For every bipolar Governor the
verified relation between constructive and internal vectors is:

```text
internal = T_1(constructive)   with a coincident unique inversion witness
```

| Governor | Inversion witness axis |
|---|---|
| Mars | 3 |
| Jupiter | 11 |
| Venus | 9 |
| Saturn | 7 |
| Mercury | 1 |

**Correction — the bitwise-complement claim does not hold at the pole level.**
For Mars, `NOT(101011010110) = 010100101001` (weight 5), while the Internal
pole is `010101101011` — the complement of the constructive vector is **not**
the Internal pole vector (verified false for all five bipolar Governors by the
pentatonic binding audit; `complementMatchesInternal: false` everywhere).

**What the 12-bit complement really is (frozen, not active):** complementation
maps the weight-7 family 7-35 to the weight-5 family 5-35
(`12 − 7 = 5`). The frozen `complement-map.json` records those set-class
complements as `frozen_evidence_not_active_graph_relation`; CRT-309 explicitly
does not claim `ComplementMap` as an admitted surface. The zodiac pole pairing
is authored correspondence; the set-class complement is frozen harmonic
evidence. The two notions must not be conflated.

## Part 4 — The compilation pipeline

**1. Domain Registry — the nouns (proposed / in-flight).**
`schemas/domain_landform_registry.yaml` (in-flight authoring) seeds A0
empirical entities (e.g., Jupiter/A0 aeolian landforms: barchan, yardang,
erg). Nouns bind to their Governor by ID; any mask binding must use the
correct Governor vector — Jupiter/Aeolian is `101101011010`, **not**
`101010110101` (which is Sun/Lydian).

**2. Algebraic state machine — the math (admitted).**
The runtime transition engine (`src/governor/`, GOV-204/CRT-305) executes
operators such as `R2` against the mutation-algebra audit; the 12-bit vector,
pitch-class set, and scoped compression evidence update deterministically.
**Neo4j is a read-only, rebuildable projection — it never executes or
authorizes a transition.** Global `harmonic.C_H` remains **unresolved**
(`value: null`); no pipeline step may emit a global `C_H` scalar. Court
context uses the exact ratio `kappa_court = i/4`, and A0/A1/A2 or D1–D7 scoped
descriptors exist only as sidecars (`Q(S)`, `W_A012`, `W_D17`).

**3. Semantic Operator Registry — the verbs (admitted v1.0.1).**
`R2` (Jupiter degree raise) carries the authored semantic delta
`promotes: [updraft, high_altitude_distribution, rarefied_flow]`,
`suppresses: [ground_level_drag]`, with symbolic physical anchors that are
`symbolic_only` — never numerically evaluated.

**4. Synthesis — the render (downstream presentation).**
The renderer may combine noun + verb + state context (e.g., "Base noun:
yardang; applied verb: promote updraft, suppress ground drag; Court context:
kappa_court 1/2") into presentation. Rendering never mutates state, and a
future contextual renderer is a planning model only —
`ContextualRender(g', e_G, c, w) = Render_G(g', e_G) ⊕ CapabilityView(c) ⊕
TeleologyView(w)` — not a runtime contract.

## Part 5 — Teleological registries: what exists and what remains

| Registry | Status | Notes |
|---|---|---|
| Capability schools + win conditions | **Proposed (CRT-347 planning evidence)** | `fivefold.capability_school.*` and `fivefold.teleology.win_condition.*` are authored, non-executable: no enforcement, no ledger-success effect |
| Element capability catalog (e.g., Fire: ignite/sprint/attack) | **Proposed, not yet authored** | Would be a root-owned `planning_evidence` sidecar; must not write `court.poleDisposition` |
| Electric/Magnetic polarity modifier ruleset | **Proposed, high risk** | Must remain authored shading only; any rule that automatically changes a capability when the Court bit flips would be an excluded executable relation (`SETS_COURT_POLE`) |
| Win-condition semantics | **Proposed (CRT-347)** | Authored teleology; Quintessence meta-win is **not** automatically achieved by cycling C0→C4 (explicitly `automatic_c0_c4_completion: false`) |

### Gaps that block a fully executable dual-core pipeline

1. **Element capability catalog** — a deterministic, schema-bound, root-owned
   planning-evidence sidecar (generator + independent validator + negative
   fixtures), mirroring the CRT-347 pattern; zero runtime effect.
2. **Polarity modifier ruleset** — an authored shading contract (allowed
   relation vocabulary only: `AFFORDS`, `AMPLIFIES`, `CONSTRAINS`,
   `OPPOSES`, `CORRESPONDS_TO`); executable Court-move relations remain
   excluded.
3. **Global `C_H` closure** — no admitted global harmonic-compression scalar
   exists; either admit a future scoped theory or keep `unresolved`. Until
   then every pipeline stage must use `kappa_court` or scoped sidecars.
4. **Mercury dual-engine implementation** — constructive `+5` / observational
   `+7` mod 12 remains prose-only; implementation is a future story.
5. **Zodiac sign-to-pitch assignment** — not claimed anywhere; any future
   admission is a separate gate with its own evidence.
6. **Contextual render contract** — a future renderer may consume Court and
   teleology packets, but its contract must be admitted before any runtime
   composite transition exists.
7. **Release identity** — admission records use release identity 1.7.0; the
   release-number rollout (package/release.json/README literals) is a
   separate release-management story.
