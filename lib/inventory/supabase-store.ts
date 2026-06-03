import type { createClient } from "@/lib/supabase/client";
import type { InventoryItem, InventoryState, InventoryStore, NewInventoryItem } from "./types";

type SupabaseClient = ReturnType<typeof createClient>;

type PaintJoin = {
  brand: string | null;
  name: string | null;
  hex: string | null;
  range: string | null;
  type: string | null;
} | null;

/** Map a raw user_paints row (with joined paints) to an InventoryItem. */
export function toInventoryItem(row: Record<string, unknown>): InventoryItem {
  const paint = (row.paints as PaintJoin) ?? null;
  return {
    id: row.id as string,
    catalog_paint_id: (row.catalog_paint_id as string | null) ?? null,
    state: ((row.state as string | undefined) ?? "owned") as InventoryState,
    quantity: (row.quantity as number | undefined) ?? 1,
    added_at: row.added_at as string,
    brand: paint?.brand ?? null,
    name: paint?.name ?? null,
    hex: paint?.hex ?? null,
    range: paint?.range ?? null,
    type: paint?.type ?? null,
  };
}

/**
 * InventoryStore backed by the Supabase `user_paints` table.
 * RLS scopes all reads/writes to the authenticated user automatically;
 * inserts still require an explicit `user_id` to satisfy the WITH CHECK policy.
 */
export function createSupabaseInventoryStore(supabase: SupabaseClient): InventoryStore {
  async function getUserId(): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("supabaseInventoryStore: no authenticated user");
    return user.id;
  }

  return {
    async list(): Promise<InventoryItem[]> {
      const { data, error } = await supabase
        .from("user_paints")
        .select("*, paints!user_paints_catalog_paint_id_fkey(brand, name, hex, range, type)")
        .order("added_at");
      if (error) throw error;
      return (data ?? []).map((row) => toInventoryItem(row as unknown as Record<string, unknown>));
    },

    async add(input: NewInventoryItem): Promise<InventoryItem> {
      const user_id = await getUserId();

      // Check whether this catalog paint is already in the user's inventory.
      const { data: existing } = await supabase
        .from("user_paints")
        .select("id, quantity")
        .eq("user_id", user_id)
        .eq("catalog_paint_id", input.catalog_paint_id)
        .maybeSingle();

      if (existing) {
        // Increment quantity on the existing row.
        const { data, error } = await supabase
          .from("user_paints")
          .update({ quantity: (existing.quantity ?? 1) + 1 })
          .eq("id", existing.id)
          .select("*, paints!user_paints_catalog_paint_id_fkey(brand, name, hex, range, type)")
          .single();
        if (error) throw error;
        return toInventoryItem(data as unknown as Record<string, unknown>);
      }

      // Insert a new row.
      const { data, error } = await supabase
        .from("user_paints")
        .insert({
          user_id,
          catalog_paint_id: input.catalog_paint_id,
          state: input.state ?? "owned",
          quantity: 1,
        })
        .select("*, paints!user_paints_catalog_paint_id_fkey(brand, name, hex, range, type)")
        .single();
      if (error) throw error;
      return toInventoryItem(data as unknown as Record<string, unknown>);
    },

    async setState(id: string, state: InventoryState): Promise<InventoryItem | null> {
      const { data, error } = await supabase
        .from("user_paints")
        .update({ state })
        .eq("id", id)
        .select("*, paints!user_paints_catalog_paint_id_fkey(brand, name, hex, range, type)")
        .single();
      if (error) return null;
      return toInventoryItem(data as unknown as Record<string, unknown>);
    },

    async setQuantity(id: string, quantity: number): Promise<InventoryItem | null> {
      if (quantity < 1) {
        await this.remove(id);
        return null;
      }
      const { data, error } = await supabase
        .from("user_paints")
        .update({ quantity })
        .eq("id", id)
        .select("*, paints!user_paints_catalog_paint_id_fkey(brand, name, hex, range, type)")
        .single();
      if (error) return null;
      return toInventoryItem(data as unknown as Record<string, unknown>);
    },

    async remove(id: string): Promise<void> {
      const { error } = await supabase.from("user_paints").delete().eq("id", id);
      if (error) throw error;
    },
  };
}
