"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/SelectField";
import { toast } from "sonner";
import { saveRecipeAction } from "@/lib/recipes/actions";
import { uploadRecipeImageFile } from "@/lib/recipes/upload-image";
import { addRecipeImageAction } from "@/lib/recipes/actions";
import { createClient } from "@/lib/supabase/client";
import { StepEditor, type LocalStep } from "./StepEditor";
import { RecipeImageGallery } from "./RecipeImageGallery";
import { StagedImageGallery, type StagedImage } from "./StagedImageGallery";
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
    technique_note: s.technique_note ?? "",
    area_note: s.area_note ?? "",
    paints: s.paints.map((c) => ({
      id: crypto.randomUUID(), // temp UI key — DB ids regenerate on every save anyway
      paint_id: c.paint_id,
      hex: c.hex,
      ratio: c.ratio,
      paint: c.paint,
    })),
  }));
}

export function RecipeEditor({ userId, recipe }: Props) {
  const isEdit = !!recipe;
  const router = useRouter();

  // Steps and images stay as client state since StepEditor and RecipeImageGallery
  // are interactive components. Steps are serialised into the hidden "steps" field
  // before form submission so the server action receives the full on-screen order.
  const [steps, setSteps] = useState<LocalStep[]>(recipe ? recipeStepsToLocalSteps(recipe) : []);
  const [images, setImages] = useState<RecipeImage[]>(recipe?.images ?? []);
  // Staged images are held client-side in create mode and flushed to Storage
  // only after the recipe row has been created successfully.
  const [staged, setStaged] = useState<StagedImage[]>([]);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      // Build FormData from the form element — picks up hidden _id, steps,
      // title, description, visibility, source_url.
      const fd = new FormData(e.currentTarget);

      const result = await saveRecipeAction(fd);

      if ("error" in result) {
        setError(result.error);
        return;
      }

      const { recipeId } = result;

      // In create mode, flush any staged images to Storage now that the recipe
      // row exists. Each upload is independent — a single failure shows a toast
      // but does not abort the rest (the recipe is already saved; remaining
      // images can be added via the edit page).
      if (!isEdit && staged.length > 0) {
        const supabase = createClient();

        for (let i = 0; i < staged.length; i++) {
          const img = staged[i];
          try {
            const { storagePath, publicUrl } = await uploadRecipeImageFile(supabase, {
              userId,
              recipeId,
              file: img.file,
            });

            const imgFd = new FormData();
            imgFd.append("recipeId", recipeId);
            imgFd.append("storage_path", storagePath);
            imgFd.append("image_url", publicUrl);
            imgFd.append("sort_order", String(i));

            const imgResult = await addRecipeImageAction(imgFd);
            if (imgResult.error) {
              toast.error(`Photo ${i + 1} could not be saved — add it on the edit page`);
            }
          } catch {
            toast.error(`Photo ${i + 1} upload failed — add it on the edit page`);
          } finally {
            URL.revokeObjectURL(img.previewUrl);
          }
        }
      }

      router.push(`/recipes/${recipeId}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-8 max-w-2xl">
      {/* Hidden fields */}
      <input type="hidden" name="_id" value={recipe?.id ?? ""} />
      {/* Steps are serialised here; the server reads this instead of individual fields
          so the full on-screen order (including newly-added interspersed steps) is sent. */}
      <input type="hidden" name="steps" value={JSON.stringify(steps)} />

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
            name="title"
            defaultValue={recipe?.title ?? ""}
            placeholder="e.g. Ultramarines Blue Armour"
            maxLength={200}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={recipe?.description ?? ""}
            placeholder="Optional notes about this recipe…"
            rows={3}
          />
        </div>

        <SelectField
          label="Visibility"
          name="visibility"
          defaultValue={recipe?.visibility ?? "private"}
        >
          <option value="private">Private — only you can see this</option>
          <option value="public">Public — anyone can browse and find this</option>
        </SelectField>

        <div className="space-y-1.5">
          <Label htmlFor="source_url">Source URL</Label>
          <Input
            id="source_url"
            name="source_url"
            type="url"
            defaultValue={recipe?.source_url ?? ""}
            placeholder="https://…"
          />
        </div>
      </section>

      {/* Steps */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Steps</h2>
        <StepEditor steps={steps} onChange={setSteps} />
      </section>

      {/* Photos */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Photos
        </h2>
        {isEdit ? (
          <RecipeImageGallery
            recipeId={recipe.id}
            userId={userId}
            initialImages={images}
            onImagesChange={setImages}
          />
        ) : (
          <StagedImageGallery images={staged} onChange={setStaged} />
        )}
      </section>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create recipe"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            window.history.length > 1
              ? window.history.back()
              : (window.location.href = isEdit ? `/recipes/${recipe!.id}` : "/recipes")
          }
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
