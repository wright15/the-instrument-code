export const DIAL_SIZE = 200;
export const DIAL_CENTER = DIAL_SIZE / 2;
export const DIAL_DOT_R = 84;
export const DIAL_LABEL_R = 96;

export function dialAngle(pc: number): number {
  return ((pc * 30 - 90) * Math.PI) / 180;
}

export function dialPoint(pc: number, radius: number): { x: number; y: number } {
  const angle = dialAngle(pc);
  return {
    x: DIAL_CENTER + radius * Math.cos(angle),
    y: DIAL_CENTER + radius * Math.sin(angle),
  };
}

export function dialArcPath(pc: number, radius: number): string {
  const start = dialPoint(pc, radius);
  const end = dialPoint((pc + 1) % 12, radius);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
}
