import { applyArmyEdit } from "./army-edit";
import type { Army, EditArmy, NewArmy } from "./types";
import type { createClient } from "@/lib/supabase/client";

type SupabaseClient = ReturnType<typeof createClient>;

function toArmy(row: Record<string, unknown>): Army {
  return {
    id: row.id as string,
    name: row.name as string,
    game: (row.game as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export interface ArmyStore {
  list(): Promise<Army[]>;
  add(input: NewArmy): Promise<Army>;
  update(id: string, patch: EditArmy): Promise<Army | null>;
  remove(id: string): Promise<void>;
}

export function createSupabaseArmyStore(supabase: SupabaseClient): ArmyStore {
  async function getUserId(): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("supabaseArmyStore: no authenticated user");
    return user.id;
  }

  return {
    async list(): Promise<Army[]> {
      const { data, error } = await supabase.from("armies").select("*").order("created_at");
      if (error) throw error;
      return (data ?? []).map(toArmy);
    },

    async add(input: NewArmy): Promise<Army> {
      const user_id = await getUserId();
      const { data, error } = await supabase
        .from("armies")
        .insert({ user_id, name: input.name, game: input.game ?? null })
        .select()
        .single();
      if (error) throw error;
      return toArmy(data);
    },

    async update(id: string, patch: EditArmy): Promise<Army | null> {
      const { data: existing, error: fetchError } = await supabase
        .from("armies")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchError || !existing) return null;

      const updated = applyArmyEdit(toArmy(existing), patch);

      const { data, error } = await supabase
        .from("armies")
        .update({ name: updated.name, game: updated.game, updated_at: updated.updated_at })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return toArmy(data);
    },

    async remove(id: string): Promise<void> {
      const { error } = await supabase.from("armies").delete().eq("id", id);
      if (error) throw error;
    },
  };
}
