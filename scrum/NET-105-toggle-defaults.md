# NET-105 — Toggle UX + default view

**Status:** Done · **Priority:** Medium · **Points:** 3 · **Epic:** [EPIC-001](EPIC-001-network-replica.md)
**Depends on:** — · **Blocks:** —

## Story

As a dashboard user, I want the Network ⇄ Grid toggle to make the active
view unmistakable and the Network view to load first, so the "clicking
Network does nothing" confusion from EPIC-001's diagnosis is gone.

## Context

Root-cause finding: Network is already the default, so clicking the active
Network button is a no-op; combined with a network view that didn't look
like a network, it felt broken. Fixes: (a) Network stays default and now
visibly *is* the replica; (b) the toggle becomes a segmented control with a
strong active state; (c) aria-label reflects the active view.

## Tasks

- [x] Convert the two buttons into a segmented control (shared container,
      active = accent fill + border, inactive = muted border)
- [x] Keep Network as the SSR default (grid group `hidden`)
- [x] `setView()` updates aria-label per view (already implemented — verify
      against new markup)
- [x] No-JS path: network renders, grid hidden, no broken markup

## Acceptance criteria

- **AC-1**: on load, Network is visible and Grid is hidden; the Network
  button renders in the active state.
- **AC-2**: clicking Grid hides the network group and shows the grid; the
  aria-label updates to the scatter description; clicking Network returns
  and updates the aria-label to the network description.
- **AC-3**: the active button is visually distinct at a glance (accent
  background + border vs muted).
- **AC-4**: with JavaScript disabled, the page still renders the Network
  view (SSR default) and the Grid group is not visible.

## Verification

Playwright: initial state, toggle both ways, aria assertions; disable-JS
smoke via curl on dist HTML (grid group has `hidden` attribute).

Verified 2026-07-31: SSR and JavaScript-disabled contexts both show Network
and hide Grid, with Network `aria-pressed=true`. Clicking Grid applies a real
SVG `hidden` attribute to Network, removes it from Grid, updates computed
display, moves the accent active state, and changes the topology section's
label to the 598-archetype scatter description; Network reverses every state.
The segmented control is 121px wide at a 390px viewport, the document has no
horizontal overflow, and the console is clean.

## Definition of done

Toggle behavior verified in browser, determinism intact, manifest
refreshed, validate green.
