import { PILE_STATES } from "./states";
import type { PileItem, PileState } from "./types";

export const PILE_STORAGE_KEY = "gpos.pile.v1";

interface Envelope {
  version: 1;
  items: PileItem[];
}

export function serializePile(items: PileItem[]): string {
  const envelope: Envelope = { version: 1, items };
  return JSON.stringify(envelope);
}

function isValidPileState(state: unknown): state is PileState {
  return PILE_STATES.includes(state as PileState);
}

/**
 * Validate a single array entry. Requires id (non-empty string), display_name
 * (non-empty string), and a valid state. Other fields are not validated — a
 * partially-corrupt item is still recoverable.
 */
function isValidPileItem(value: unknown): value is PileItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    obj.id.length > 0 &&
    typeof obj.display_name === "string" &&
    obj.display_name.length > 0 &&
    isValidPileState(obj.state)
  );
}

/**
 * Parse the localStorage envelope into PileItems. Never throws.
 *
 * Fallback to [] when: null/undefined/empty, invalid JSON, not an object,
 * wrong/missing version, items not an array.
 *
 * Partially-corrupt arrays are recovered: valid items are kept, invalid ones
 * are silently dropped (one bad row doesn't wipe the whole collection).
 */
export function parsePile(raw: string | null | undefined): PileItem[] {
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return [];

  const envelope = parsed as Record<string, unknown>;
  if (envelope.version !== 1) return [];
  if (!Array.isArray(envelope.items)) return [];

  // Normalize items: backfill fields added after the initial schema so that
  // items serialized before those fields exist still deserialize correctly.
  return envelope.items.filter(isValidPileItem).map((item) => {
    const raw = item as unknown as Record<string, unknown>;
    const unit_id = typeof raw.unit_id === "string" ? raw.unit_id : null;
    return { ...item, unit_id };
  });
}
