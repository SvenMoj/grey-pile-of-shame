import { advanceItem } from "./states";
import { applyEdit } from "./edit";
import type { EditPileItem, NewPileItem, PileItem, PileState, PileStore } from "./types";
import type { createClient } from "@/lib/supabase/client";

type SupabaseClient = ReturnType<typeof createClient>;

/** Map a raw miniature_items DB row to a PileItem. */
function toItem(row: Record<string, unknown>): PileItem {
  return {
    id: row.id as string,
    kit_id: (row.kit_id as string | null) ?? null,
    display_name: row.display_name as string,
    game: (row.game as string | null) ?? null,
    faction: (row.faction as string | null) ?? null,
    unit_size: (row.unit_size as number) ?? 1,
    unit_id: (row.unit_id as string | null) ?? null,
    state: row.state as PileItem["state"],
    point_value: (row.point_value as number | null) ?? null,
    image_url: (row.image_url as string | null) ?? null,
    visibility: ((row.visibility as string | null) ?? "private") as PileItem["visibility"],
    created_at: row.created_at as string,
    painted_at: (row.painted_at as string | null) ?? null,
    updated_at: row.updated_at as string,
  };
}

/**
 * PileStore backed by the Supabase `miniature_items` table.
 * RLS scopes all reads/writes to the authenticated user automatically;
 * inserts still require an explicit `user_id` to satisfy the WITH CHECK policy.
 */
export function createSupabasePileStore(supabase: SupabaseClient): PileStore {
  async function getUserId(): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("supabasePileStore: no authenticated user");
    return user.id;
  }

  return {
    async list(): Promise<PileItem[]> {
      const { data, error } = await supabase
        .from("miniature_items")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return (data ?? []).map(toItem);
    },

    async add(input: NewPileItem): Promise<PileItem> {
      const user_id = await getUserId();
      const { data, error } = await supabase
        .from("miniature_items")
        .insert({
          user_id,
          display_name: input.display_name,
          kit_id: input.kit_id ?? null,
          game: input.game ?? null,
          faction: input.faction ?? null,
          unit_size: input.unit_size ?? 1,
          unit_id: input.unit_id ?? null,
          state: input.state ?? "unbuilt",
          point_value: input.point_value ?? null,
          image_url: null,
          visibility: "private",
          painted_at: input.painted_at ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return toItem(data);
    },

    async addMany(inputs: NewPileItem[]): Promise<PileItem[]> {
      if (inputs.length === 0) return [];
      const user_id = await getUserId();
      const rows = inputs.map((input) => ({
        user_id,
        display_name: input.display_name,
        kit_id: input.kit_id ?? null,
        game: input.game ?? null,
        faction: input.faction ?? null,
        unit_size: input.unit_size ?? 1,
        unit_id: input.unit_id ?? null,
        state: input.state ?? "unbuilt",
        point_value: input.point_value ?? null,
        image_url: null,
        visibility: "private" as const,
        painted_at: input.painted_at ?? null,
      }));
      const { data, error } = await supabase.from("miniature_items").insert(rows).select();
      if (error) throw error;
      return (data ?? []).map(toItem);
    },

    async advanceState(id: string, to?: PileState): Promise<PileItem | null> {
      const { data: existing, error: fetchError } = await supabase
        .from("miniature_items")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchError || !existing) return null;

      const current = toItem(existing);
      const updated = advanceItem(current, to);

      const { data, error } = await supabase
        .from("miniature_items")
        .update({
          state: updated.state,
          painted_at: updated.painted_at,
          updated_at: updated.updated_at,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return toItem(data);
    },

    async update(id: string, patch: EditPileItem): Promise<PileItem | null> {
      const { data: existing, error: fetchError } = await supabase
        .from("miniature_items")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchError || !existing) return null;

      const current = toItem(existing);
      const updated = applyEdit(current, patch);

      const { data, error } = await supabase
        .from("miniature_items")
        .update({
          display_name: updated.display_name,
          game: updated.game,
          faction: updated.faction,
          unit_size: updated.unit_size,
          unit_id: updated.unit_id,
          point_value: updated.point_value,
          image_url: updated.image_url,
          visibility: updated.visibility,
          state: updated.state,
          painted_at: updated.painted_at,
          updated_at: updated.updated_at,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return toItem(data);
    },

    async remove(id: string): Promise<void> {
      const { error } = await supabase.from("miniature_items").delete().eq("id", id);
      if (error) throw error;
    },
  };
}
