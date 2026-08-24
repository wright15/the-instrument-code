import { describe, expect, it } from "vitest";

import {
  COURT_POLE_ORDER,
  COURT_POSITIONS,
  courtPositionById,
  filterPitchClasses,
  formatCourtRatio,
  isAdjacentCourtPosition,
} from "./court";

describe("Harmonic Orrery Court presentation", () => {
  it("replays all five Court masks, names, ratios, and pole vectors in canonical order", () => {
    expect(
      COURT_POSITIONS.map((position) => ({
        id: position.positionId,
        name: position.scaleName,
        mask: position.pitchMask,
        maskString: position.maskStringMsb,
        pitchClasses: position.pitchClasses,
        ratio: formatCourtRatio(position.kappaCourt),
        poles: position.poleVector,
        internalPoles: position.internalPoles,
      })),
    ).toEqual([
      {
        id: "C0",
        name: "Major Pentatonic",
        mask: 661,
        maskString: "101010010100",
        pitchClasses: [0, 2, 4, 7, 9],
        ratio: "0 / 1",
        poles: "0000",
        internalPoles: [],
      },
      {
        id: "C1",
        name: "Scottish Pentatonic",
        mask: 677,
        maskString: "101001010100",
        pitchClasses: [0, 2, 5, 7, 9],
        ratio: "1 / 4",
        poles: "1000",
        internalPoles: ["Mars"],
      },
      {
        id: "C2",
        name: "Qing Yu",
        mask: 1189,
        maskString: "101001010010",
        pitchClasses: [0, 2, 5, 7, 10],
        ratio: "1 / 2",
        poles: "1100",
        internalPoles: ["Mars", "Jupiter"],
      },
      {
        id: "C3",
        name: "Minor Pentatonic",
        mask: 1193,
        maskString: "100101010010",
        pitchClasses: [0, 3, 5, 7, 10],
        ratio: "3 / 4",
        poles: "1110",
        internalPoles: ["Mars", "Jupiter", "Venus"],
      },
      {
        id: "C4",
        name: "Man Gong",
        mask: 1321,
        maskString: "100101001010",
        pitchClasses: [0, 3, 5, 8, 10],
        ratio: "1 / 1",
        poles: "1111",
        internalPoles: ["Mars", "Jupiter", "Venus", "Saturn"],
      },
    ]);
  });

  it("keeps Mercury as the C2 engine emblem rather than a fifth binary pole", () => {
    expect(COURT_POLE_ORDER).toEqual(["Mars", "Jupiter", "Venus", "Saturn"]);
    expect(COURT_POLE_ORDER).toHaveLength(4);
    expect(COURT_POLE_ORDER).not.toContain("Mercury");
    expect(courtPositionById("C2")).toMatchObject({
      mercuryEngineEmblem: true,
      poleVector: "1100",
      internalPoles: ["Mars", "Jupiter"],
    });
  });

  it("allows exactly the eight directed adjacent presentation routes", () => {
    const expectedRoutes = new Set([
      "C0:C1",
      "C1:C0",
      "C1:C2",
      "C2:C1",
      "C2:C3",
      "C3:C2",
      "C3:C4",
      "C4:C3",
    ]);
    const actualRoutes = new Set<string>();

    for (const source of COURT_POSITIONS) {
      for (const target of COURT_POSITIONS) {
        if (isAdjacentCourtPosition(source.positionId, target.positionId)) {
          actualRoutes.add(`${source.positionId}:${target.positionId}`);
        }
      }
    }

    expect(actualRoutes).toEqual(expectedRoutes);
    expect(isAdjacentCourtPosition("C0", "C0")).toBe(false);
    expect(isAdjacentCourtPosition("C0", "C2")).toBe(false);
    expect(isAdjacentCourtPosition("C4", "C2")).toBe(false);
  });

  it("filters pitch classes with the LSB Court mask without replacing the source palette", () => {
    expect(filterPitchClasses([0, 2, 4, 6, 7, 9, 11], "C0")).toEqual([0, 2, 4, 7, 9]);
    expect(filterPitchClasses([0, 2, 4, 6, 7, 9, 11], "C1")).toEqual([0, 2, 7, 9]);
    expect(filterPitchClasses(Array.from({ length: 12 }, (_, pitchClass) => pitchClass), "C4")).toEqual(
      [0, 3, 5, 8, 10],
    );
    expect(() => filterPitchClasses([12], "C0")).toThrow("0 through 11");
  });
});
