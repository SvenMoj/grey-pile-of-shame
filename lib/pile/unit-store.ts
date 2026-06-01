import { applyUnitEdit } from "./unit-edit";
import type { EditUnit, NewUnit, Unit } from "./types";
import type { createClient } from "@/lib/supabase/client";

type SupabaseClient = ReturnType<typeof createClient>;

function toUnit(row: Record<string, unknown>): Unit {
  return {
    id: row.id as string,
    army_id: (row.army_id as string | null) ?? null,
    name: row.name as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export interface UnitStore {
  list(): Promise<Unit[]>;
  add(input: NewUnit): Promise<Unit>;
  update(id: string, patch: EditUnit): Promise<Unit | null>;
  remove(id: string): Promise<void>;
}

export function createSupabaseUnitStore(supabase: SupabaseClient): UnitStore {
  async function getUserId(): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("supabaseUnitStore: no authenticated user");
    return user.id;
  }

  return {
    async list(): Promise<Unit[]> {
      const { data, error } = await supabase.from("units").select("*").order("created_at");
      if (error) throw error;
      return (data ?? []).map(toUnit);
    },

    async add(input: NewUnit): Promise<Unit> {
      const user_id = await getUserId();
      const { data, error } = await supabase
        .from("units")
        .insert({ user_id, name: input.name, army_id: input.army_id ?? null })
        .select()
        .single();
      if (error) throw error;
      return toUnit(data);
    },

    async update(id: string, patch: EditUnit): Promise<Unit | null> {
      const { data: existing, error: fetchError } = await supabase
        .from("units")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchError || !existing) return null;

      const updated = applyUnitEdit(toUnit(existing), patch);

      const { data, error } = await supabase
        .from("units")
        .update({ name: updated.name, army_id: updated.army_id, updated_at: updated.updated_at })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return toUnit(data);
    },

    async remove(id: string): Promise<void> {
      const { error } = await supabase.from("units").delete().eq("id", id);
      if (error) throw error;
    },
  };
}
