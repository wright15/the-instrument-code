// GOV-520 rebuilt enumerator for the GOV-518 boundary.
// Pure compute only: zero outside reads, zero writes except the single
// JSON line on standard output. Takes no arguments and ignores the
// surrounding environment, so output bytes are a pure function of the
// registered boundary. Single threaded and deterministic.
//
// Registered content:
// R1: assignment space Z7 to the power 7, total 823543, derived run map.
// R2: exactly three predicates below as the sole filter.
// R5: shape form is the argmax set of the run vector.
// D4: quotient by the registered D7 action, lex least representative.
// R4: classes in lex order by representative then by run vector.
// D8: orbit bound 60028 with Burnside arithmetic asserted in code.
// The observed side is handled elsewhere and never appears here.

const MODULUS = 7;
const DIMENSION = 7;
const TOTAL = 823543;
const ORBIT_TOTAL = 60028;
const REFLECTION_FIXED = 2401;
const GROUP_ORDER = 14;
const NONTRIVIAL_ROTATIONS = 6;

function decodeLex(n) {
  const x = new Array(DIMENSION);
  let rest = n;
  for (let i = DIMENSION - 1; i >= 0; i -= 1) {
    x[i] = rest % MODULUS;
    rest = (rest - x[i]) / MODULUS;
  }
  return x;
}

function projectionBits(x) {
  const b = new Array(DIMENSION);
  for (let i = 0; i < DIMENSION; i += 1) {
    const left = x[(i + DIMENSION - 1) % DIMENSION];
    const right = x[(i + 1) % DIMENSION];
    b[i] = left !== right ? 1 : 0;
  }
  return b;
}

function runVector(x) {
  const b = projectionBits(x);
  const s = new Array(DIMENSION);
  for (let i = 0; i < DIMENSION; i += 1) {
    if (b[i] === 0) {
      s[i] = 0;
      continue;
    }
    let length = 0;
    while (length < DIMENSION && b[(i + length) % DIMENSION] === 1) {
      length += 1;
    }
    s[i] = length;
  }
  return s;
}

function holdsAdjacent(x) {
  for (let i = 0; i < DIMENSION; i += 1) {
    if (x[i] === x[(i + 1) % DIMENSION]) {
      return false;
    }
  }
  return true;
}

function holdsStepTwo(x) {
  for (let i = 0; i < DIMENSION; i += 1) {
    if (x[(i + DIMENSION - 1) % DIMENSION] === x[(i + 1) % DIMENSION]) {
      return false;
    }
  }
  return true;
}

function holdsClosure(x) {
  let total = 0;
  for (let i = 0; i < DIMENSION; i += 1) {
    total += x[i];
  }
  return total % MODULUS === 0;
}

function holdsAll(x) {
  return holdsAdjacent(x) && holdsStepTwo(x) && holdsClosure(x);
}

function compareLex(a, b) {
  for (let i = 0; i < DIMENSION; i += 1) {
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
  }
  return 0;
}

function dihedralImages(x) {
  const images = [];
  for (let r = 0; r < DIMENSION; r += 1) {
    const y = new Array(DIMENSION);
    for (let i = 0; i < DIMENSION; i += 1) {
      y[i] = x[((i - r) % DIMENSION + DIMENSION) % DIMENSION];
    }
    images.push(y);
  }
  for (let r = 0; r < DIMENSION; r += 1) {
    const y = new Array(DIMENSION);
    for (let i = 0; i < DIMENSION; i += 1) {
      y[i] = x[((r - i) % DIMENSION + DIMENSION) % DIMENSION];
    }
    images.push(y);
  }
  return images;
}

function canonicalRep(x) {
  let best = x.slice();
  const images = dihedralImages(x);
  for (let k = 0; k < images.length; k += 1) {
    if (compareLex(images[k], best) < 0) {
      best = images[k].slice();
    }
  }
  return best;
}

function argmaxSet(s) {
  let peak = 0;
  for (let i = 0; i < DIMENSION; i += 1) {
    if (s[i] > peak) {
      peak = s[i];
    }
  }
  const out = [];
  for (let i = 0; i < DIMENSION; i += 1) {
    if (s[i] === peak) {
      out.push(i);
    }
  }
  return out;
}

// Burnside arithmetic for the registered D7 action: identity fixes every
// assignment, each nontrivial rotation fixes the constant assignments, each
// reflection fixes assignments constant on its cycles. The bound below must
// hold exactly or the run stops before emitting.
if ((823543 + 6 * 7 + 7 * 2401) / 14 !== 60028) {
  throw new Error("burnside bound mismatch");
}

const seen = new Map();
for (let n = 0; n < TOTAL; n += 1) {
  const x = decodeLex(n);
  const rep = canonicalRep(x);
  const key = rep.join(",");
  if (!seen.has(key)) {
    seen.set(key, rep);
  }
}

const visited = seen.size;
if (visited !== 60028) {
  throw new Error("visited orbit count mismatch");
}

const classes = [];
for (const rep of seen.values()) {
  if (holdsAll(rep)) {
    const stat = runVector(rep);
    classes.push({ representative: rep, statistic: stat, argmax: argmaxSet(stat) });
  }
}
classes.sort(
  (a, b) => compareLex(a.representative, b.representative) || compareLex(a.statistic, b.statistic)
);

const result = {
  boundaryId: "GOV-518",
  N: 823543,
  N_orbit: 60028,
  visited: visited,
  classCount: classes.length,
  classes: classes
};
console.log(JSON.stringify(result));
