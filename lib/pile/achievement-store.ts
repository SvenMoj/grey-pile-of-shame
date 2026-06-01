import type { createClient } from "@/lib/supabase/client";

type SupabaseClient = ReturnType<typeof createClient>;

export interface AchievementStore {
  /** Returns the ids of all achievements already unlocked by the current user. */
  list(): Promise<string[]>;
  /**
   * Attempts to insert each id. Conflicts (already unlocked) are ignored.
   * Returns ONLY the ids that were genuinely newly unlocked — these should drive confetti.
   */
  unlock(ids: string[]): Promise<string[]>;
}

export function createSupabaseAchievementStore(supabase: SupabaseClient): AchievementStore {
  async function getUserId(): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("supabaseAchievementStore: no authenticated user");
    return user.id;
  }

  return {
    async list(): Promise<string[]> {
      const { data, error } = await supabase.from("user_achievements").select("achievement_id");
      if (error) throw error;
      return (data ?? []).map((r) => r.achievement_id as string);
    },

    async unlock(ids: string[]): Promise<string[]> {
      if (ids.length === 0) return [];

      const user_id = await getUserId();
      const rows = ids.map((achievement_id) => ({ user_id, achievement_id }));

      // ignoreDuplicates: true — conflicts on (user_id, achievement_id) are silently skipped.
      // The rows that ARE returned are the ones that were actually inserted (newly unlocked).
      const { data, error } = await supabase
        .from("user_achievements")
        .upsert(rows, { onConflict: "user_id,achievement_id", ignoreDuplicates: true })
        .select("achievement_id");

      if (error) throw error;
      return (data ?? []).map((r) => r.achievement_id as string);
    },
  };
}
