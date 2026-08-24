export const COURT_POSITION_IDS = ["C0", "C1", "C2", "C3", "C4"] as const;
export type CourtPosition = (typeof COURT_POSITION_IDS)[number];

export const COURT_POLE_ORDER = ["Mars", "Jupiter", "Venus", "Saturn"] as const;
export type CourtPole = (typeof COURT_POLE_ORDER)[number];

export interface CourtRatio {
  numerator: number;
  denominator: number;
}

export interface CourtPresentation {
  positionId: CourtPosition;
  index: number;
  emblem: string;
  scaleId: number;
  scaleName: string;
  maskStringMsb: string;
  pitchMask: number;
  pitchClasses: readonly number[];
  kappaCourt: CourtRatio;
  poleVector: string;
  internalPoles: readonly CourtPole[];
  strategyEmphasis: string;
  mercuryEngineEmblem: boolean;
}

// This presentation-only replay mirrors the Court positions without importing runtime policy.
export const COURT_POSITIONS = [
  {
    positionId: "C0",
    index: 0,
    emblem: "Fire / Mars",
    scaleId: 661,
    scaleName: "Major Pentatonic",
    maskStringMsb: "101010010100",
    pitchMask: 661,
    pitchClasses: [0, 2, 4, 7, 9],
    kappaCourt: { numerator: 0, denominator: 1 },
    poleVector: "0000",
    internalPoles: [],
    strategyEmphasis: "Electric seed / open entry state",
    mercuryEngineEmblem: false,
  },
  {
    positionId: "C1",
    index: 1,
    emblem: "Air / Wind / Jupiter",
    scaleId: 677,
    scaleName: "Scottish Pentatonic",
    maskStringMsb: "101001010100",
    pitchMask: 677,
    pitchClasses: [0, 2, 5, 7, 9],
    kappaCourt: { numerator: 1, denominator: 4 },
    poleVector: "1000",
    internalPoles: ["Mars"],
    strategyEmphasis: "Suspended horizon / expansion",
    mercuryEngineEmblem: false,
  },
  {
    positionId: "C2",
    index: 2,
    emblem: "Quintessence / Mercury",
    scaleId: 1189,
    scaleName: "Qing Yu",
    maskStringMsb: "101001010010",
    pitchMask: 1189,
    pitchClasses: [0, 2, 5, 7, 10],
    kappaCourt: { numerator: 1, denominator: 2 },
    poleVector: "1100",
    internalPoles: ["Mars", "Jupiter"],
    strategyEmphasis: "Engine hinge / transductive pivot",
    mercuryEngineEmblem: true,
  },
  {
    positionId: "C3",
    index: 3,
    emblem: "Water / Venus",
    scaleId: 1193,
    scaleName: "Minor Pentatonic",
    maskStringMsb: "100101010010",
    pitchMask: 1193,
    pitchClasses: [0, 3, 5, 7, 10],
    kappaCourt: { numerator: 3, denominator: 4 },
    poleVector: "1110",
    internalPoles: ["Mars", "Jupiter", "Venus"],
    strategyEmphasis: "Inward cohesion / coupling",
    mercuryEngineEmblem: false,
  },
  {
    positionId: "C4",
    index: 4,
    emblem: "Earth / Saturn",
    scaleId: 1321,
    scaleName: "Man Gong",
    maskStringMsb: "100101001010",
    pitchMask: 1321,
    pitchClasses: [0, 3, 5, 8, 10],
    kappaCourt: { numerator: 1, denominator: 1 },
    poleVector: "1111",
    internalPoles: ["Mars", "Jupiter", "Venus", "Saturn"],
    strategyEmphasis: "Magnetic terminus / fixation",
    mercuryEngineEmblem: false,
  },
] as const satisfies readonly CourtPresentation[];

export function isCourtPosition(value: unknown): value is CourtPosition {
  return typeof value === "string" && (COURT_POSITION_IDS as readonly string[]).includes(value);
}

export function courtPositionById(positionId: CourtPosition): CourtPresentation {
  const position = COURT_POSITIONS.find((item) => item.positionId === positionId);
  if (!position) {
    throw new Error(`Unknown Court position ${positionId}.`);
  }
  return position;
}

export function isAdjacentCourtPosition(source: CourtPosition, target: CourtPosition): boolean {
  return Math.abs(courtPositionById(source).index - courtPositionById(target).index) === 1;
}

export function filterPitchClasses(
  pitchClasses: readonly number[],
  position: CourtPosition | CourtPresentation,
): number[] {
  const court = typeof position === "string" ? courtPositionById(position) : position;
  for (const pitchClass of pitchClasses) {
    if (!Number.isInteger(pitchClass) || pitchClass < 0 || pitchClass > 11) {
      throw new Error("Court pitch filtering requires pitch classes from 0 through 11.");
    }
  }
  return pitchClasses.filter((pitchClass) => (court.pitchMask & (1 << pitchClass)) !== 0);
}

export function formatCourtRatio(ratio: CourtRatio): string {
  return `${ratio.numerator} / ${ratio.denominator}`;
}
