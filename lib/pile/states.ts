import type { PileItem, PileState } from "./types";

export const PILE_STATES = [
  "unbuilt",
  "built",
  "primed",
  "in_progress",
  "painted",
] as const satisfies readonly PileState[];

export function isTerminal(state: PileState): boolean {
  return state === "painted";
}

/** Returns the next state in the linear progression, or null at the terminal. */
export function nextState(state: PileState): PileState | null {
  const idx = PILE_STATES.indexOf(state);
  if (idx === -1 || idx === PILE_STATES.length - 1) return null;
  return PILE_STATES[idx + 1];
}

/**
 * Pure, immutable state-machine advance.
 *
 * Rules:
 *  - No `to`: move one step forward; no-op if already painted.
 *  - `to` given: forward-only ratchet (index(to) > index(current)); backward/equal = no-op.
 *  - `painted_at` is set ONLY on the transition INTO "painted".
 *  - `updated_at` is bumped on any real state change.
 *  - Always returns a new object (never mutates input).
 *
 * Inject `now` for deterministic tests.
 */
export function advanceItem(
  item: PileItem,
  to?: PileState,
  now: () => string = () => new Date().toISOString(),
): PileItem {
  const currentIdx = PILE_STATES.indexOf(item.state);

  if (to !== undefined) {
    const targetIdx = PILE_STATES.indexOf(to);
    if (targetIdx <= currentIdx) return { ...item }; // backward or same = no-op
    const timestamp = now();
    return {
      ...item,
      state: to,
      painted_at: to === "painted" ? timestamp : item.painted_at,
      updated_at: timestamp,
    };
  }

  const next = nextState(item.state);
  if (next === null) return { ...item }; // already terminal = no-op
  const timestamp = now();
  return {
    ...item,
    state: next,
    painted_at: next === "painted" ? timestamp : item.painted_at,
    updated_at: timestamp,
  };
}
