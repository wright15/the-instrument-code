import { COURT_POSITION_IDS, type CourtPosition } from "./court";
import type { LegalMoveCatalogIndex } from "./moves";
import type { OrrerySession } from "./session";
import type { OrreryNode } from "./types";

export const LOCAL_OBJECTIVE_IDS = [
  "modal-orbit",
  "all-offices",
  "lydian-to-mixolydian",
  "court-c0-c4",
] as const;

export type LocalObjectiveId = (typeof LOCAL_OBJECTIVE_IDS)[number];
export type ObjectiveStatus = "ready" | "in-progress" | "completed";
export type ObjectiveCategory = "discovery" | "strategy" | "learning";

export const OBJECTIVE_CATEGORIES: Record<LocalObjectiveId, ObjectiveCategory> = {
  "modal-orbit": "strategy",
  "all-offices": "discovery",
  "lydian-to-mixolydian": "strategy",
  "court-c0-c4": "learning",
};

export const OBJECTIVE_CATEGORY_LABELS: Record<ObjectiveCategory, string> = {
  discovery: "Discovery",
  strategy: "Strategy",
  learning: "Learning",
};

export interface LocalObjectiveProgress {
  id: LocalObjectiveId;
  title: string;
  detail: string;
  category: ObjectiveCategory;
  categoryLabel: string;
  status: ObjectiveStatus;
  progress: string;
}

function routeMoves(session: OrrerySession, catalog: LegalMoveCatalogIndex) {
  return session.modalRoute.moveIds.map((moveId) => {
    const move = catalog.movesById.get(moveId);
    if (!move) {
      throw new Error(`Saved local route contains an unavailable move: ${moveId}`);
    }
    return move;
  });
}

function routeOffices(
  session: OrrerySession,
  catalog: LegalMoveCatalogIndex,
  nodesById: ReadonlyMap<number, OrreryNode>,
): Set<string> {
  const offices = new Set<string>();
  if (session.modalRoute.startAnchorId !== null) {
    const start = nodesById.get(session.modalRoute.startAnchorId);
    if (start) {
      offices.add(start.resolution.office);
    }
  }
  for (const move of routeMoves(session, catalog)) {
    const target = nodesById.get(move.targetId);
    if (target) {
      offices.add(target.resolution.office);
    }
  }
  return offices;
}

function hasCourtTraversal(history: readonly CourtPosition[]): boolean {
  return COURT_POSITION_IDS.every((position, index) => {
    const start = history.length - COURT_POSITION_IDS.length;
    return start >= 0 && history[start + index] === position;
  });
}

function courtTraversalProgress(history: readonly CourtPosition[]): number {
  let longest = 0;
  for (let start = 0; start < history.length; start += 1) {
    let matched = 0;
    while (matched < COURT_POSITION_IDS.length && history[start + matched] === COURT_POSITION_IDS[matched]) {
      matched += 1;
    }
    longest = Math.max(longest, matched);
  }
  return Math.max(0, longest - 1);
}

function completed(session: OrrerySession, objectiveId: LocalObjectiveId, achieved: boolean): ObjectiveStatus {
  return achieved || session.completedObjectiveIds.includes(objectiveId) ? "completed" : "ready";
}

export function scoreObjectives(
  session: OrrerySession,
  catalog: LegalMoveCatalogIndex,
  nodesById: ReadonlyMap<number, OrreryNode>,
): LocalObjectiveProgress[] {
  const moves = routeMoves(session, catalog);
  const routeStarted = session.modalRoute.startAnchorId !== null;
  const orbitComplete =
    routeStarted &&
    moves.length >= 7 &&
    session.modalRoute.currentAnchorId === session.modalRoute.startAnchorId &&
    moves.length % 7 === 0;
  const offices = routeOffices(session, catalog, nodesById);
  const reachesMixolydian =
    session.modalRoute.startAnchorId === 2773 &&
    moves.length === 2 &&
    session.modalRoute.currentAnchorId === 1717;
  const courtComplete = hasCourtTraversal(session.courtRouteHistory);

  return [
    {
      id: "modal-orbit",
      title: "Complete a parallel orbit",
      detail: "Follow seven declared R/L transitions and return to the route origin.",
      category: OBJECTIVE_CATEGORIES["modal-orbit"],
      categoryLabel: OBJECTIVE_CATEGORY_LABELS[OBJECTIVE_CATEGORIES["modal-orbit"]],
      status: completed(session, "modal-orbit", orbitComplete),
      progress: `${Math.min(moves.length, 7)} / 7 parallel steps`,
    },
    {
      id: "all-offices",
      title: "Visit every office",
      detail: "Route through one anchor in each of the seven State Governor offices using parallel moves.",
      category: OBJECTIVE_CATEGORIES["all-offices"],
      categoryLabel: OBJECTIVE_CATEGORY_LABELS[OBJECTIVE_CATEGORIES["all-offices"]],
      status: completed(session, "all-offices", offices.size === 7),
      progress: `${offices.size} / 7 offices on this route`,
    },
    {
      id: "lydian-to-mixolydian",
      title: "Lydian to Mixolydian",
      detail: "Start at Lydian and reach Mixolydian using two declared parallel steps (L4 then L7).",
      category: OBJECTIVE_CATEGORIES["lydian-to-mixolydian"],
      categoryLabel: OBJECTIVE_CATEGORY_LABELS[OBJECTIVE_CATEGORIES["lydian-to-mixolydian"]],
      status: completed(session, "lydian-to-mixolydian", reachesMixolydian),
      progress:
        session.modalRoute.startAnchorId === 2773
          ? `${Math.min(moves.length, 2)} / 2 parallel steps`
          : "Start a new route at Lydian",
    },
    {
      id: "court-c0-c4",
      title: "Traverse the Court",
      detail: "Move through C0, C1, C2, C3, and C4 in order. This remains presentation-only.",
      category: OBJECTIVE_CATEGORIES["court-c0-c4"],
      categoryLabel: OBJECTIVE_CATEGORY_LABELS[OBJECTIVE_CATEGORIES["court-c0-c4"]],
      status: completed(session, "court-c0-c4", courtComplete),
      progress: `${courtTraversalProgress(session.courtRouteHistory)} / 4 Court steps`,
    },
  ];
}

export function newlyCompletedObjectiveIds(progress: readonly LocalObjectiveProgress[]): LocalObjectiveId[] {
  return progress.filter((item) => item.status === "completed").map((item) => item.id);
}
