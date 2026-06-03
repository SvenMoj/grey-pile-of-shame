export type InventoryState = "owned" | "wishlist" | "running_low";

/**
 * Client-side representation of a user_paints row joined with the catalog paint.
 * `brand`, `name`, `hex`, `range`, `type` are null for rows where `catalog_paint_id`
 * was deleted from the catalog (on delete set null), but in practice catalog-only v1
 * items always have a joined paint.
 */
export interface InventoryItem {
  /** user_paints.id (UUID) */
  id: string;
  catalog_paint_id: string | null;
  state: InventoryState;
  quantity: number;
  added_at: string;
  /** Joined from paints — null if catalog row was removed */
  brand: string | null;
  name: string | null;
  hex: string | null;
  range: string | null;
  type: string | null;
}

/** Input shape for adding a new catalog paint to the inventory. */
export interface NewInventoryItem {
  catalog_paint_id: string;
  state?: InventoryState;
}

export interface InventoryStore {
  list(): Promise<InventoryItem[]>;
  /** Add a catalog paint. If already owned, increments quantity by 1. */
  add(input: NewInventoryItem): Promise<InventoryItem>;
  setState(id: string, state: InventoryState): Promise<InventoryItem | null>;
  /**
   * Set the quantity for an item. If `quantity < 1`, removes the item instead.
   * Returns null if the item was removed.
   */
  setQuantity(id: string, quantity: number): Promise<InventoryItem | null>;
  remove(id: string): Promise<void>;
}
