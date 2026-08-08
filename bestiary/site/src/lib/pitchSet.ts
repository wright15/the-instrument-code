export function pcsOfMask(mask: number): number[] {
  const pcs: number[] = [];
  for (let pc = 0; pc < 12; pc++) {
    if ((mask & (1 << pc)) !== 0) pcs.push(pc);
  }
  return pcs;
}

export function maskOfPcs(pcs: number[]): number {
  return pcs.reduce((acc, pc) => acc | (1 << pc), 0);
}

export function complementMask(mask: number): number {
  return (~mask) & 0xfff;
}

export function setSize(mask: number): number {
  let count = 0;
  for (let pc = 0; pc < 12; pc++) {
    if ((mask & (1 << pc)) !== 0) count++;
  }
  return count;
}

export function transposition(mask: number, steps: number): number {
  const normalized = ((steps % 12) + 12) % 12;
  const up = ((mask << normalized) & 0xfff) | (mask >> (12 - normalized));
  return normalized === 0 ? mask : up;
}

export function intervalVector(mask: number): number[] {
  const vector = [0, 0, 0, 0, 0, 0];
  const pcs = pcsOfMask(mask);
  for (let i = 0; i < pcs.length; i++) {
    for (let j = i + 1; j < pcs.length; j++) {
      const raw = Math.abs(pcs[i] - pcs[j]) % 12;
      const interval = Math.min(raw, 12 - raw);
      if (interval > 0) vector[interval - 1]++;
    }
  }
  return vector;
}

export function pitchSetLabel(mask: number): string {
  return `{${pcsOfMask(mask).join(",")}}`;
}
