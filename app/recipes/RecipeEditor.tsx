"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { createSupabaseRecipesStore } from "@/lib/recipes/supabase-store";
import { StepEditor, type LocalStep } from "./StepEditor";
import { RecipeImageGallery } from "./RecipeImageGallery";
import type { RecipeImage, RecipeWithDetail } from "@/lib/recipes/types";

type Props = {
  userId: string;
  /** If provided, the editor is in edit mode. */
  recipe?: RecipeWithDetail;
};

function recipeStepsToLocalSteps(recipe: RecipeWithDetail): LocalStep[] {
  return recipe.steps.map((s) => ({
    id: s.id,
    role: s.role,
    target_paint_id: s.target_paint_id,
    target_hex: s.target_hex,
    technique_note: s.technique_note ?? "",
    area_note: s.area_note ?? "",
    paint: s.paint,
  }));
}

export function RecipeEditor({ userId, recipe }: Props) {
  const router = useRouter();
  const isEdit = !!recipe;

  const [title, setTitle] = useState(recipe?.title ?? "");
  const [description, setDescription] = useState(recipe?.description ?? "");
  const [visibility, setVisibility] = useState<"private" | "public">(
    recipe?.visibility ?? "private",
  );
  const [sourceUrl, setSourceUrl] = useState(recipe?.source_url ?? "");
  const [steps, setSteps] = useState<LocalStep[]>(recipe ? recipeStepsToLocalSteps(recipe) : []);
  const [images, setImages] = useState<RecipeImage[]>(recipe?.images ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const store = createSupabaseRecipesStore(supabase);

    try {
      let recipeId: string;

      if (isEdit) {
        await store.updateRecipe(recipe.id, {
          title: title.trim(),
          description: description.trim() || null,
          visibility,
          source_url: sourceUrl.trim() || null,
        });
        recipeId = recipe.id;
      } else {
        const created = await store.createRecipe({
          title: title.trim(),
          description: description.trim() || null,
          visibility,
          source_url: sourceUrl.trim() || null,
        });
        recipeId = created.id;
      }

      // Sync steps: remove steps not in local state, add/update the rest.
      if (isEdit) {
        const existingIds = new Set(recipe.steps.map((s) => s.id));
        const localIds = new Set(steps.map((s) => s.id));

        // Remove deleted steps
        for (const existing of recipe.steps) {
          if (!localIds.has(existing.id)) {
            await store.removeStep(existing.id);
          }
        }

        // Update or add remaining steps in order
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          if (existingIds.has(step.id)) {
            await store.updateStep(step.id, {
              role: step.role,
              target_paint_id: step.target_paint_id,
              target_hex: step.target_hex,
              technique_note: step.technique_note || null,
              area_note: step.area_note || null,
            });
          } else {
            await store.addStep(recipeId, {
              role: step.role,
              target_paint_id: step.target_paint_id,
              target_hex: step.target_hex,
              technique_note: step.technique_note || null,
              area_note: step.area_note || null,
            });
          }
        }

        // Reorder to final positions
        const finalIds = steps.filter((s) => existingIds.has(s.id)).map((s) => s.id);
        if (finalIds.length > 1) {
          await store.reorderSteps(recipeId, finalIds);
        }
      } else {
        for (const step of steps) {
          await store.addStep(recipeId, {
            role: step.role,
            target_paint_id: step.target_paint_id,
            target_hex: step.target_hex,
            technique_note: step.technique_note || null,
            area_note: step.area_note || null,
          });
        }
      }

      toast.success(isEdit ? "Recipe updated" : "Recipe created");
      router.push(`/recipes/${recipeId}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong — please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic info */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Details
        </h2>

        <div className="space-y-1.5">
          <Label htmlFor="title">
            Title <span className="text-muted-foreground">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Ultramarines Blue Armour"
            maxLength={200}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional notes about this recipe…"
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="visibility">Visibility</Label>
          <select
            id="visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as "private" | "public")}
            className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="private">Private — only you can see this</option>
            <option value="public">Public — anyone can browse and find this</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="source_url">Source URL</Label>
          <Input
            id="source_url"
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
      </section>

      {/* Steps — only available in edit mode (recipe must exist to upload images too) */}
      {isEdit ? (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Steps
            </h2>
            <StepEditor steps={steps} onChange={setSteps} />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Photos
            </h2>
            <RecipeImageGallery
              recipeId={recipe.id}
              userId={userId}
              initialImages={images}
              onImagesChange={setImages}
            />
          </section>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Save the recipe first, then add steps and photos.
        </p>
      )}

      <div className="flex gap-3">
        <Button onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create recipe"}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push(isEdit ? `/recipes/${recipe.id}` : "/recipes")}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
