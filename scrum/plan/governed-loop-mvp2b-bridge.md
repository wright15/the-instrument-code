# GOV-528-successor: MVP-2b — the orrery bridge (gate verdicts made audible)

**Status:** Executed in scratch realm; no repository writes beyond this landing (planning-side record; the bridge implementation stays scratch-side).

## Fences held

One-way (gate → display); zero orrery code changes; no canonical mutation; `gate_log.jsonl` is not the decision ledger; "use is not admission" extends to palettes and replay plans; nothing baked into generated assets.

## Mechanism

Playwright-driven browser session against the locally-running orrery Vite app (the `test-harmonic-orrery-browser.sh` pattern: named `-s=` sessions, headless, route fixtures from `orrery/test/fixtures/`, cleanup trap). The bridge (scratch, `mvp2.py bridge`) drives the session: each gate-log line maps to a replay hop or a rest.

## Audio mapping (as built)

- ACCEPT → navigate `?anchor=<id>` + enable-once audio → office-palette timbre at replay-hop cadence, tier-group posture as emphasis (Spike-01 T3 audible; exact parameters per the existing preset schema — no new assets).
- VETO → rest (silence); state unchanged; existing mute/volume controls as escape hatch. Maintainer-tunable.

## Smoke test — Mac-1 8-line replay (deterministic)

Input: the Mac-1 live session's 8-line gate log (6 accepts incl. FamilyA:L1 + FamilyB bridge, 1 disputed boundary veto). Expected DOM-state sequence: Saturn palette ×3 → Sun (post-L1) → **rest on line 5** (no navigation, silence state held) → Sun → Moon (post-bridge).

Per-line assertions:
    seq0: Saturn A0 "Saturn A0 / heptatonic voicing / {0, 1, 3, 5, 6, 8, 10}" (voicing asserted at enable: Saturn [0, 1, 3, 5, 6, 8, 10, 0])
    seq1: Saturn A0 "Saturn A0 / heptatonic voicing / {0, 1, 3, 5, 6, 8, 10}" (voicing asserted at enable: Saturn [0, 1, 3, 5, 6, 8, 10, 0])
    seq2: Saturn A0 "Saturn A0 / heptatonic voicing / {0, 1, 3, 5, 6, 8, 10}" (voicing asserted at enable: Saturn [0, 1, 3, 5, 6, 8, 10, 0])
    seq3: Sun A0 "Sun A0 / heptatonic voicing / {0, 2, 4, 6, 7, 9, 11}", voiced [0, 2, 4, 6, 7, 9, 11, 0]
    seq4: Sun A0 "Sun A0 / heptatonic voicing / {0, 2, 4, 6, 7, 9, 11}" (anchor unchanged from seq3 — palette held)
    seq5: VETO rest held (?anchor=2773, palette unchanged: "Sun A0 / heptatonic voicing / {0, 2, 4, 6, 7, 9, 11}"), dispute=true metadata only
    seq6: Sun A0 "Sun A0 / heptatonic voicing / {0, 2, 4, 6, 7, 9, 11}" (anchor unchanged from seq3 — palette held)
    seq7: Moon A0 "Moon A0 / heptatonic voicing / {0, 2, 4, 5, 7, 9, 11}", voiced [0, 2, 4, 5, 7, 9, 11, 0]

Re-run: byte-identical assertion results (`cmp` clean; `bridge_smoke_log.json` SHA-256 `b30bfb58…`).

## Results

- orrery diff: `git status --porcelain -- orrery/` empty (0 lines) at close; audio/interface SHAs unchanged.
- `orrery:audio:check`: exit 0 (asset manifest pinned bytes verified).
- Console errors / pageerrors: replay window 0 / 0 (instrumented); session console log 0 ERROR lines (verified by grep on the playwright-cli session log).

## Honesty

Headless asserts engine state, not audible sound — human-ear evidence arrives with live bridge sessions. The smoke proves plumbing + determinism, nothing more.
