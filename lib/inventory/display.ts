import type { InventoryState } from "./types";

export const INVENTORY_STATES: InventoryState[] = ["owned", "wishlist", "running_low"];

export const INVENTORY_STATE_LABELS: Record<InventoryState, string> = {
  owned: "Owned",
  wishlist: "Wishlist",
  running_low: "Running Low",
};

/**
 * Tailwind badge classes for each inventory state.
 * Kept in one place so the UI (filter buttons, row badges) always uses the same colors.
 */
export const INVENTORY_STATE_STYLES: Record<InventoryState, string> = {
  owned: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  wishlist: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  running_low: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
};
