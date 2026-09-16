// Pure routes consume validated inert projections; no source or observation reads.
export function rotateMaskZ12(m) {
  return ((m << 1n) & 4095n) | (m >> 11n);
}

export function midZ7(o_a, o_b) {
  return (4n * (o_a + o_b)) % 7n;
}

export function generateRouteTA(a0, R) {
  const witnesses = [];
  let candidates = 0n;
  for (const a of a0) {
    for (const b of a0) {
      for (const r of R) {
        for (let k = 0n; k < 7n; k += 1n) {
          candidates += 1n;
          if (a.id !== b.id && a.officeIndex === (k + 1n) % 7n &&
              b.officeIndex === (k - 1n + 7n) % 7n &&
              rotateMaskZ12(a.id) === b.id && r.parentOffice === k) {
            witnesses.push({ tag: "kernel_twin", a: a.id, b: b.id,
              h: r.source, s: r.target, k: k });
          }
        }
      }
    }
  }
  return { witnesses: witnesses, candidates: candidates };
}

export function generateRouteTB(E, R) {
  const witnesses = [];
  let candidates = 0n;
  for (const e1 of E) {
    for (const e2 of E) {
      for (const r of R) {
        candidates += 1n;
        if (e1.id !== e2.id && e1.source !== e2.source &&
            e1.type === "CONSTRUCTS" && e2.type === "CONSTRUCTS" &&
            e1.parentTier === "A0" && e2.parentTier === "A0" &&
            e1.childTier === "A1" && e2.childTier === "A1" &&
            e1.target === r.source && e2.target === r.source) {
          witnesses.push({ tag: "construction_join", e1source: e1.source,
            e2source: e2.source, h: r.source, s: r.target,
            parentOffice: r.parentOffice, e1id: e1.id, e2id: e2.id });
        }
      }
    }
  }
  return { witnesses: witnesses, candidates: candidates };
}

export function generateRouteTC(anchors) {
  const relations = [];
  let candidates = 0n;
  for (const a of anchors) {
    for (const b of anchors) {
      if (a.tier === b.tier && a.id !== b.id) {
        candidates += 1n;
        if (rotateMaskZ12(a.id) === b.id) {
          relations.push({ tier: a.tier, a: a.id, b: b.id,
            mid: midZ7(a.officeIndex, b.officeIndex) });
        }
      }
    }
  }
  return { relations: relations, candidates: candidates };
}
