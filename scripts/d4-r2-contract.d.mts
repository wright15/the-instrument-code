export const CONTRACT_SCHEMA_VERSION: string;
export const CONTRACT_ID: string;
export const CONTRACT_STATUS: string;
export const ROUTE_ID: string;
export const ROUTE_NAME: string;
export const PREDICATE_FORTE: string;
export const PREDICATE_STATEMENT: string;
export const CONTACT_WITNESS_TAG: string;
export const JUSTIFICATION_CYCLE_TWIN: string;
export const JUSTIFICATION_PREDICATE_ONLY: string;

export function keyOf(office: string, satellite: string): string;
export function sortedUnique(values: string[]): string[];
export function rotateMaskZ12(mask: number): number;
export function rotatePow(mask: number, d: number): number;
export function predicateHolds(forte: string | undefined): boolean;
export function selectSatellites(
  satellites: string[],
  forteOf: (satellite: string) => string | undefined,
): string[];

export interface CycleEdge {
  a: string;
  b: string;
  d: number;
  aPhase: string;
  bPhase: string;
}

export interface PerOfficeRow {
  office: string;
  parentH: string;
  eParents: string[];
  cycleEdge: CycleEdge;
  cycleTwin: { checked: string; holds: boolean };
  justification: string;
  satellites: string[];
  selected: string[];
  selectedCount: number;
}

export function evaluateRouteOffice(input: {
  office: string;
  parentH: string;
  eParents: string[];
  cycleEdge: CycleEdge;
  satellites: string[];
  forteOf: (satellite: string) => string | undefined;
}): PerOfficeRow;

export function emitContacts(perOffice: PerOfficeRow[]): {
  keys: string[];
  witnesses: Array<Record<string, string | number>>;
};

export function calibrateIdentityPhase(input: {
  a0Anchors: Array<{ id: string; officeIndex: string }>;
  R: Array<{ source: string; target: string; parentOffice: string }>;
}): {
  method: string;
  keys: string[];
  offices: string[];
  witnesses: Array<Record<string, string>>;
  verdict: string;
  scope: string;
};

export const EXECUTION_RECEIPT_INTERFACE: {
  name: string;
  schemaVersion: string;
  path: string;
  routeId: string;
  statusTokens: string[];
  fields: Record<string, string>;
  failureBranch: string;
};
