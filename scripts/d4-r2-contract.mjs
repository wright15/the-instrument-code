#!/usr/bin/env node
/**
 * BL-057 Gate 2 — D4 R2 contract engine (`d4-r2-contract`).
 *
 * The implemented R2 route: R2(h) = {(o(h), s) : s in satellites(h) and P(s)},
 * P(s) = [forte(s) = '7-27'], over the 7 A0 cycle edges with generalized
 * cycle-twin verification. This module is the contract machinery only: it
 * performs no I/O, no source reads, and no registered derivation execution.
 *
 *   selectSatellites        predicate as code: a single-hop read of the
 *                           caller-supplied forte field (the canonical ledger
 *                           value). No satellite-ID lists, no derived
 *                           proxies; selection flows only through the reader.
 *   evaluateRouteOffice     the four-step route evaluation per office:
 *                           (1) cycle edge from the anchor's two A0
 *                           CONSTRUCTS parents, (2) cycle-twin verification
 *                           rotateMaskZ12^d(a) = b at the edge interval,
 *                           (3) predicate selection, (4) contact emission.
 *   emitContacts            deterministic contact keys and witnesses.
 *   calibrateIdentityPhase  identity-phase replay of the anchored kernel-twin
 *                           route (frozen semantics as specification
 *                           reference). Gate 2 exercises the mechanism on the
 *                           minimal frozen keying fixture only; the full
 *                           calibration verdict is reserved to the Gate 3
 *                           execution run (no-collapse).
 *   EXECUTION_RECEIPT_INTERFACE
 *                           the documented Gate 3 receipt shape this engine
 *                           feeds; the schema file is authored at Gate 3
 *                           (schemas/ is fence-protected at Gate 2).
 *
 * Fences: sandbox only. No canonical/Court/schema/Neo4j writes; no ledger
 * writes; no registered execution; the frozen D4 stack (scripts/d4-*.mjs) is
 * read-only specification reference, never modified, never re-executed under
 * its old freeze. Byte-stable, fail-loud. The cycle-walk presentation order is
 * frozen at the Gate 1 kickoff convention (the Ionian-adjacent seed first; the
 * cycle is closed and M-successor-directed).
 */

export const CONTRACT_SCHEMA_VERSION = "harmonic-orrery.d4-r2-contract.v1";
export const CONTRACT_ID = "BL057_D4_R2_CONTRACT_v1";
export const CONTRACT_STATUS = "implementation_evidence";
export const ROUTE_ID = "R2";
export const ROUTE_NAME = "Filtered Cycle-Walk";
export const PREDICATE_FORTE = "7-27";
export const PREDICATE_STATEMENT = "P(s) = [forte(s) = '7-27']";
export const CONTACT_WITNESS_TAG = "r2_filtered_cycle_walk";
export const JUSTIFICATION_CYCLE_TWIN = "cycle-twin-verified";
export const JUSTIFICATION_PREDICATE_ONLY = "predicate-only";

function cmp(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function keyOf(office, satellite) {
  return `${office}:${satellite}`;
}

export function sortedUnique(values) {
  return [...new Set(values)].sort(cmp);
}

// Number-level mask rotation pinned to the BL-055/BL-056 builder convention;
// semantically identical to the frozen engine's BigInt-level primitive.
export function rotateMaskZ12(mask) {
  return ((mask << 1) & 4095) | (mask >> 11);
}

export function rotatePow(mask, d) {
  let value = mask;
  for (let step = 0; step < d; step += 1) value = rotateMaskZ12(value);
  return value;
}

export function predicateHolds(forte) {
  return forte === PREDICATE_FORTE;
}

// ---- step 3: SELECT ------------------------------------------------------

export function selectSatellites(satellites, forteOf) {
  return sortedUnique(satellites.filter((satellite) => predicateHolds(forteOf(satellite))));
}

// ---- steps 1-4: per-office route evaluation ------------------------------

export function evaluateRouteOffice({ office, parentH, eParents, cycleEdge, satellites, forteOf }) {
  const twinHolds = rotatePow(Number(cycleEdge.a), cycleEdge.d) === Number(cycleEdge.b);
  const selected = selectSatellites(satellites, forteOf);
  return {
    office: String(office),
    parentH: String(parentH),
    eParents: [...eParents].map(String).sort(cmp),
    cycleEdge: {
      a: String(cycleEdge.a),
      b: String(cycleEdge.b),
      d: cycleEdge.d,
      aPhase: String(cycleEdge.aPhase),
      bPhase: String(cycleEdge.bPhase),
    },
    cycleTwin: {
      checked: `rotateMaskZ12^${cycleEdge.d}(${cycleEdge.a}) = ${cycleEdge.b}`,
      holds: twinHolds,
    },
    justification: twinHolds ? JUSTIFICATION_CYCLE_TWIN : JUSTIFICATION_PREDICATE_ONLY,
    satellites: [...satellites].map(String).sort(cmp),
    selected,
    selectedCount: selected.length,
  };
}

// ---- step 4: EMIT --------------------------------------------------------

export function emitContacts(perOffice) {
  const witnesses = [];
  for (const row of perOffice) {
    for (const satellite of row.selected) {
      witnesses.push({
        tag: CONTACT_WITNESS_TAG,
        a: row.cycleEdge.a,
        b: row.cycleEdge.b,
        d: row.cycleEdge.d,
        h: row.parentH,
        s: satellite,
        parentOffice: row.office,
      });
    }
  }
  const deduped = [...new Map(witnesses.map((witness) => [keyOf(witness.parentOffice, witness.s), witness])).values()];
  deduped.sort((left, right) => cmp(left.parentOffice, right.parentOffice) || cmp(left.s, right.s));
  return { keys: deduped.map((witness) => keyOf(witness.parentOffice, witness.s)), witnesses: deduped };
}

// ---- identity-phase calibration mechanism (Gate 2: mechanism only) -------
//
// Replays the anchored kernel-twin route (the frozen route's semantics as
// specification reference) at the identity keying over an inert projection:
// a pair of A0 anchors (a, b) with rotateMaskZ12(a) = b and office stagger
// a.office = (k + 1) % 7, b.office = (k + 6) % 7 selects every R-satellite
// keyed to office k. Gate 2 asserts the mechanism on the minimal frozen
// keying fixture (8 keys, offices 0 and 6). The full calibration verdict
// against the registered observation record is the Gate 3 execution run's
// result and is deliberately not produced here.

export function calibrateIdentityPhase({ a0Anchors, R }) {
  const witnesses = [];
  for (const a of a0Anchors) {
    for (const b of a0Anchors) {
      if (a.id === b.id) continue;
      if (rotateMaskZ12(Number(a.id)) !== Number(b.id)) continue;
      for (let office = 0; office < 7; office += 1) {
        if (Number(a.officeIndex) !== (office + 1) % 7) continue;
        if (Number(b.officeIndex) !== (office + 6) % 7) continue;
        for (const r of R) {
          if (Number(r.parentOffice) !== office) continue;
          witnesses.push({
            office: String(office),
            parentH: String(r.source),
            satellite: String(r.target),
            a: String(a.id),
            b: String(b.id),
          });
        }
      }
    }
  }
  const deduped = [...new Map(witnesses.map((witness) => [keyOf(witness.office, witness.satellite), witness])).values()];
  deduped.sort((left, right) => cmp(left.office, right.office) || cmp(left.satellite, right.satellite));
  return {
    method: "identity-phase replay of the anchored kernel-twin route (A-same) over the frozen projection",
    keys: deduped.map((witness) => keyOf(witness.office, witness.satellite)),
    offices: sortedUnique(deduped.map((witness) => witness.office)),
    witnesses: deduped,
    verdict: "mechanism_only",
    scope: "minimal frozen keying fixture: 8 keys, offices 0 and 6; the full calibration verdict is reserved to the Gate 3 execution run",
  };
}

// ---- documented Gate 3 receipt interface (shape now; schema at Gate 3) ---

export const EXECUTION_RECEIPT_INTERFACE = Object.freeze({
  name: "d4-r2-execution-receipt",
  schemaVersion: "d4-r2-execution-receipt.v1",
  path: "qa/d4-r2-execution-receipt.json",
  routeId: ROUTE_ID,
  statusTokens: ["execution_verified", "attribution_incomplete"],
  fields: {
    schemaVersion: "string: d4-r2-execution-receipt.v1",
    routeId: "string: R2",
    status: "execution_verified | attribution_incomplete",
    executionTimestamp: "ISO-8601 UTC timestamp of the Gate 3 execution run",
    implementationDigest: "sha256 over the Gate 2 contract implementation file set (engine, generator, validator, pins, artifact)",
    inputHashes: "map of pinned source artifact path -> sha256 verified at execution time",
    outputHashes: "map of generated-keys digest and the 14 generated office:satellite keys",
    gates: "map of G1..G5 pass booleans",
    passFail: "boolean: all gates green and no unexpected invariant failure",
  },
  failureBranch: "any gate false or unexpected invariant failure -> status attribution_incomplete; additive ledger note only, never an amendment (BL-057 1.1)",
});
