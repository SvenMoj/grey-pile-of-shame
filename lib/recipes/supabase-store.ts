/**
 * Browser-side store for the recipes domain.
 * Pattern mirrors lib/inventory/supabase-store.ts: createSupabaseRecipesStore(supabase) returns
 * an object with async methods; all inserts pass an explicit author_user_id / recipe_id to
 * satisfy the RLS WITH CHECK policies; reads are scoped automatically by RLS.
 */

import type { createClient } from "@/lib/supabase/client";
import type {
  NewImageInput,
  NewRecipeInput,
  NewStepInput,
  Recipe,
  RecipeApplication,
  RecipeApplicationStatus,
  RecipeImage,
  RecipeStep,
  RecipeVisibility,
  UpdateRecipeInput,
} from "./types";

type SupabaseClient = ReturnType<typeof createClient>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getUserId(supabase: SupabaseClient): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("createSupabaseRecipesStore: no authenticated user");
  return user.id;
}

// ─── createSupabaseRecipesStore ───────────────────────────────────────────────

export function createSupabaseRecipesStore(supabase: SupabaseClient) {
  return {
    // ── Recipe CRUD ──────────────────────────────────────────────────────────

    async createRecipe(input: NewRecipeInput): Promise<Recipe> {
      const author_user_id = await getUserId(supabase);
      const { data, error } = await supabase
        .from("recipes")
        .insert({
          author_user_id,
          title: input.title,
          description: input.description ?? null,
          visibility: input.visibility ?? "private",
          source_type: input.source_type ?? null,
          source_url: input.source_url ?? null,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as Recipe;
    },

    async updateRecipe(id: string, patch: UpdateRecipeInput): Promise<Recipe> {
      const { data, error } = await supabase
        .from("recipes")
        .update({
          ...(patch.title !== undefined && { title: patch.title }),
          ...(patch.description !== undefined && { description: patch.description }),
          ...(patch.visibility !== undefined && { visibility: patch.visibility }),
          ...(patch.source_type !== undefined && { source_type: patch.source_type }),
          ...(patch.source_url !== undefined && { source_url: patch.source_url }),
        })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as Recipe;
    },

    async setVisibility(id: string, visibility: RecipeVisibility): Promise<Recipe> {
      return this.updateRecipe(id, { visibility });
    },

    async deleteRecipe(id: string): Promise<void> {
      // Remove storage objects first so the bucket doesn't accumulate orphans.
      // Path prefix: <user_id>/<recipe_id>/
      const user_id = await getUserId(supabase);
      const prefix = `${user_id}/${id}/`;
      const { data: objects } = await supabase.storage
        .from("recipe-images")
        .list(`${user_id}/${id}`);
      if (objects && objects.length > 0) {
        const paths = objects.map((o) => `${prefix}${o.name}`);
        await supabase.storage.from("recipe-images").remove(paths);
      }

      const { error } = await supabase.from("recipes").delete().eq("id", id);
      if (error) throw error;
    },

    // ── Steps ────────────────────────────────────────────────────────────────

    async addStep(recipeId: string, input: Omit<NewStepInput, "step_order">): Promise<RecipeStep> {
      // Use max(step_order) + 1 so new steps go to the end.
      const { data: existing } = await supabase
        .from("recipe_steps")
        .select("step_order")
        .eq("recipe_id", recipeId)
        .order("step_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      const step_order = existing ? (existing.step_order as number) + 1 : 0;

      const { data, error } = await supabase
        .from("recipe_steps")
        .insert({
          recipe_id: recipeId,
          step_order,
          role: input.role,
          target_paint_id: input.target_paint_id,
          target_hex: input.target_hex,
          technique_note: input.technique_note ?? null,
          area_note: input.area_note ?? null,
        })
        .select("*, paint:paints!recipe_steps_target_paint_id_fkey(id, brand, name, hex, range)")
        .single();
      if (error) throw error;
      return data as unknown as RecipeStep;
    },

    async updateStep(
      stepId: string,
      patch: Partial<Omit<NewStepInput, "step_order">>,
    ): Promise<RecipeStep> {
      const { data, error } = await supabase
        .from("recipe_steps")
        .update({
          ...(patch.role !== undefined && { role: patch.role }),
          ...(patch.target_paint_id !== undefined && { target_paint_id: patch.target_paint_id }),
          ...(patch.target_hex !== undefined && { target_hex: patch.target_hex }),
          ...(patch.technique_note !== undefined && { technique_note: patch.technique_note }),
          ...(patch.area_note !== undefined && { area_note: patch.area_note }),
        })
        .eq("id", stepId)
        .select("*, paint:paints!recipe_steps_target_paint_id_fkey(id, brand, name, hex, range)")
        .single();
      if (error) throw error;
      return data as unknown as RecipeStep;
    },

    async removeStep(stepId: string): Promise<void> {
      const { error } = await supabase.from("recipe_steps").delete().eq("id", stepId);
      if (error) throw error;
    },

    async reorderSteps(recipeId: string, orderedStepIds: string[]): Promise<void> {
      // Delegate to the reorder_recipe_steps RPC which handles the unique-constraint
      // collision in a single transaction.
      const { error } = await supabase.rpc("reorder_recipe_steps", {
        p_recipe_id: recipeId,
        p_ordered_ids: orderedStepIds,
      });
      if (error) throw error;
    },

    // ── Images ───────────────────────────────────────────────────────────────

    async addImage(recipeId: string, input: NewImageInput): Promise<RecipeImage> {
      const { data, error } = await supabase
        .from("recipe_images")
        .insert({
          recipe_id: recipeId,
          storage_path: input.storage_path,
          image_url: input.image_url,
          sort_order: input.sort_order,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as RecipeImage;
    },

    async removeImage(imageId: string): Promise<void> {
      // Fetch the storage_path first so we can remove the Storage object.
      const { data: img } = await supabase
        .from("recipe_images")
        .select("storage_path")
        .eq("id", imageId)
        .maybeSingle();

      if (img?.storage_path) {
        await supabase.storage.from("recipe-images").remove([img.storage_path as string]);
      }

      const { error } = await supabase.from("recipe_images").delete().eq("id", imageId);
      if (error) throw error;
    },

    async reorderImages(recipeId: string, orderedImageIds: string[]): Promise<void> {
      const { error } = await supabase.rpc("reorder_recipe_images", {
        p_recipe_id: recipeId,
        p_ordered_ids: orderedImageIds,
      });
      if (error) throw error;
    },
  };
}

// ─── createSupabaseRecipeApplicationsStore ────────────────────────────────────

export function createSupabaseRecipeApplicationsStore(supabase: SupabaseClient) {
  return {
    async apply(
      miniatureItemId: string,
      recipeId: string,
      status: RecipeApplicationStatus = "planned",
    ): Promise<RecipeApplication> {
      const user_id = await getUserId(supabase);

      // Check for an existing application (unique constraint on (miniature_item_id, recipe_id)).
      const { data: existing } = await supabase
        .from("recipe_applications")
        .select("id")
        .eq("miniature_item_id", miniatureItemId)
        .eq("recipe_id", recipeId)
        .maybeSingle();

      if (existing) {
        // Update the status of the existing application.
        const { data, error } = await supabase
          .from("recipe_applications")
          .update({ status })
          .eq("id", existing.id)
          .select("*")
          .single();
        if (error) throw error;
        return data as unknown as RecipeApplication;
      }

      const { data, error } = await supabase
        .from("recipe_applications")
        .insert({ user_id, miniature_item_id: miniatureItemId, recipe_id: recipeId, status })
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as RecipeApplication;
    },

    async setStatus(
      applicationId: string,
      status: RecipeApplicationStatus,
    ): Promise<RecipeApplication> {
      const { data, error } = await supabase
        .from("recipe_applications")
        .update({ status })
        .eq("id", applicationId)
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as RecipeApplication;
    },

    async remove(applicationId: string): Promise<void> {
      const { error } = await supabase.from("recipe_applications").delete().eq("id", applicationId);
      if (error) throw error;
    },

    async listForModel(miniatureItemId: string): Promise<RecipeApplication[]> {
      const { data, error } = await supabase
        .from("recipe_applications")
        .select("*")
        .eq("miniature_item_id", miniatureItemId)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as RecipeApplication[];
    },

    async listForRecipe(recipeId: string): Promise<RecipeApplication[]> {
      const { data, error } = await supabase
        .from("recipe_applications")
        .select("*")
        .eq("recipe_id", recipeId)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as RecipeApplication[];
    },
  };
}
