// Pure compute closure. Only the screened harness supplies inert input records.
export function check_T1(p, q, office, kernel) {
  if (p.role !== 'anchor' || q.role !== 'anchor' || p.tier !== q.tier) {
    return false;
  }
  if (p.tier !== 'A0' && p.tier !== 'A1' && p.tier !== 'A2') {
    return false;
  }
  if (BigInt(kernel[0]) !== -1n || BigInt(kernel[1]) !== 1n) {
    return false;
  }
  const left = z7(BigInt(office) + BigInt(kernel[0]));
  const right = z7(BigInt(office) + BigInt(kernel[1]));
  if (BigInt(p.officeIndex) !== left || BigInt(q.officeIndex) !== right) {
    return false;
  }
  return maskOverlap(p.fifthMask, q.fifthMask) === 5n;
}

function z7(value) {
  return ((BigInt(value) % 7n) + 7n) % 7n;
}

function maskOverlap(left, right) {
  const intersection = BigInt(left) & BigInt(right);
  let count = 0n;
  for (const bit of [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, 11n]) {
    count = count + ((intersection >> BigInt(bit)) & 1n);
  }
  return count;
}

export function check_T2(p, q, office, steps, transitions, anchors) {
  if (p.role !== 'anchor' || q.role !== 'anchor' || p.tier !== q.tier || p.id === q.id) {
    return false;
  }
  if (p.tier !== 'A0' && p.tier !== 'A1') {
    return false;
  }
  const childTier = p.tier === 'A0' ? 'A1' : 'A2';
  for (const first of transitions) {
    if (first.type !== 'CONSTRUCTS' || first.source !== p.id || first.parentTier !== p.tier) {
      continue;
    }
    for (const second of transitions) {
      if (second.type !== 'CONSTRUCTS' || second.source !== q.id || second.parentTier !== q.tier || first.target !== second.target || first.id === second.id) {
        continue;
      }
      if (!stepRegistered(first, steps) || !stepRegistered(second, steps)) {
        continue;
      }
      for (const child of anchors) {
        if (child.role === 'anchor' && child.tier === childTier && child.id === first.target && BigInt(child.officeIndex) === BigInt(office)) {
          return true;
        }
      }
    }
  }
  return false;
}

function stepRegistered(edge, steps) {
  for (const step of steps) {
    if (step.id === edge.id && step.source === edge.source && step.target === edge.target && step.parentTier === edge.parentTier && step.type === 'CONSTRUCTS') {
      return true;
    }
  }
  return false;
}

export function windowCheck(width) {
  let cases = 0n;
  let failures = 0n;
  for (const j of [0n, 1n, 2n, 3n, 4n, 5n, 6n]) {
    for (const d of [0n, 1n, 2n, 3n, 4n, 5n, 6n]) {
      let cardinality = 0n;
      for (const offset of [0n, 1n, 2n, 3n, 4n, 5n, 6n]) {
        const x = BigInt(offset) - BigInt(j);
        if (BigInt(offset) < BigInt(width) && x >= -BigInt(j) - BigInt(d) && x <= BigInt(width) - 1n - BigInt(j) - BigInt(d)) {
          cardinality = cardinality + 1n;
        }
      }
      cases = cases + 1n;
      if (cardinality !== 7n - BigInt(d)) {
        failures = failures + 1n;
      }
    }
  }
  return { cases: cases, failures: failures, hold: failures === 0n };
}

export function check_T3(primary, secondary, anchors, width) {
  const invariant = windowCheck(width);
  const assignment = [];
  const midpoints = [];
  let validMasks = BigInt(anchors.length) === 21n;
  for (const anchor of anchors) {
    if (anchor.role !== 'anchor' || (anchor.tier !== 'A0' && anchor.tier !== 'A1' && anchor.tier !== 'A2')) {
      validMasks = false;
    }
  }
  if (!validMasks) {
    return { pass: false, assignment: assignment, midpoints: midpoints, window: invariant, unambiguous: false };
  }
  for (const office of [0n, 1n, 2n, 3n, 4n, 5n, 6n]) {
    let foundPrimary = false;
    let foundSecondary = false;
    for (const left of primary) {
      if (BigInt(left[1]) === BigInt(office)) {
        foundPrimary = true;
      }
    }
    for (const right of secondary) {
      if (BigInt(right[1]) === BigInt(office)) {
        foundSecondary = true;
      }
    }
    if (foundPrimary && foundSecondary) {
      const pairs = [];
      for (const primaryWitness of primary) {
        if (BigInt(primaryWitness[1]) === BigInt(office)) {
          pairs.push([primaryWitness[0], primaryWitness[2]]);
          midpoints.push([office, primaryWitness[0], primaryWitness[2]]);
        }
      }
      for (const secondaryWitness of secondary) {
        if (BigInt(secondaryWitness[1]) === BigInt(office)) {
          pairs.push([secondaryWitness[0], secondaryWitness[2]]);
          midpoints.push([office, secondaryWitness[0], secondaryWitness[2]]);
        }
      }
      assignment.push([office, pairs]);
    }
  }
  const nonempty = BigInt(assignment.length) > 0n;
  return { pass: invariant.hold && nonempty, assignment: assignment, midpoints: midpoints, window: invariant, unambiguous: nonempty };
}

export function generate(steps, transitions, anchors, kernel, width) {
  const primary = [];
  const secondary = [];
  let candidates = 0n;
  for (const p of anchors) {
    if (p.role !== 'anchor' || (p.tier !== 'A0' && p.tier !== 'A1' && p.tier !== 'A2')) {
      continue;
    }
    for (const q of anchors) {
      if (p.tier !== q.tier || q.role !== 'anchor') {
        continue;
      }
      for (const office of [0n, 1n, 2n, 3n, 4n, 5n, 6n]) {
        candidates = candidates + 1n;
        if (check_T1(p, q, office, kernel)) {
          primary.push([p.tier, office, [BigInt(p.officeIndex), BigInt(q.officeIndex)], 'primary']);
        }
        if (check_T2(p, q, office, steps, transitions, anchors)) {
          secondary.push([p.tier, office, [BigInt(p.officeIndex), BigInt(q.officeIndex)], 'secondary']);
        }
      }
    }
  }
  const convergence = check_T3(primary, secondary, anchors, width);
  return { t1_pass: BigInt(primary.length) > 0n, t1_set: primary,
    t2_pass: BigInt(secondary.length) > 0n, t2_set: secondary,
    t3_pass: convergence.pass, t3_assignment: convergence.assignment,
    t3_midpoints: convergence.midpoints, window_invariant_hold: convergence.window.hold,
    convergence_unambiguous: convergence.unambiguous, window_cases: convergence.window.cases,
    window_failures: convergence.window.failures, candidates: candidates };
}
