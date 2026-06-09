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
import { saveProjectAction } from "@/lib/projects/actions";
import { uploadProjectImageFile } from "@/lib/projects/upload-image";
import { addProjectImageAction } from "@/lib/projects/actions";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/projects/validation";
import type { ProjectImage, ProjectWithDetail } from "@/lib/projects/types";
import type { RecipeListItem } from "@/lib/recipes/types";
import { ProjectImageGallery } from "./ProjectImageGallery";
import { StagedProjectImageGallery, type StagedProjectImage } from "./StagedProjectImageGallery";
import { RecipeLinksEditor, savedToLocal, type LocalRecipeLink } from "./RecipeLinksEditor";

type Props = {
  userId: string;
  /** Admin's own recipes available for linking. */
  availableRecipes: RecipeListItem[];
  /** If provided, the editor is in edit mode. */
  project?: ProjectWithDetail;
};

export function ProjectEditor({ userId, availableRecipes, project }: Props) {
  const isEdit = !!project;
  const router = useRouter();

  const [images, setImages] = useState<ProjectImage[]>(project?.images ?? []);
  const [staged, setStaged] = useState<StagedProjectImage[]>([]);
  const [recipeLinks, setRecipeLinks] = useState<LocalRecipeLink[]>(
    savedToLocal(project?.recipes ?? []),
  );

  // Slug auto-generation from title (only in create mode or when slug hasn't been touched).
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [slugValue, setSlugValue] = useState(project?.slug ?? "");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugTouched) {
      setSlugValue(slugify(e.target.value));
    }
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const fd = new FormData(e.currentTarget);
      // Inject the recipe links payload (hidden field).
      const recipesPayload = recipeLinks.map(({ recipe_id, area, sort_order, note }) => ({
        recipe_id,
        area,
        sort_order,
        note,
      }));
      fd.set("project_recipes", JSON.stringify(recipesPayload));

      const result = await saveProjectAction(fd);

      if ("error" in result) {
        setError(result.error);
        return;
      }

      const { projectId } = result;

      // In create mode, flush staged images to Storage now that the project row exists.
      if (!isEdit && staged.length > 0) {
        const supabase = createClient();
        for (let i = 0; i < staged.length; i++) {
          const img = staged[i];
          try {
            const { storagePath, publicUrl } = await uploadProjectImageFile(supabase, {
              userId,
              projectId,
              file: img.file,
            });

            const imgFd = new FormData();
            imgFd.append("projectId", projectId);
            imgFd.append("storage_path", storagePath);
            imgFd.append("image_url", publicUrl);
            imgFd.append("sort_order", String(i));

            const imgResult = await addProjectImageAction(imgFd);
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

      router.push(`/admin/projects/${projectId}/edit`);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-8 max-w-2xl">
      {/* Hidden fields */}
      <input type="hidden" name="_id" value={project?.id ?? ""} />

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
            defaultValue={project?.title ?? ""}
            placeholder="e.g. Death Guard Plague Marine"
            maxLength={200}
            required
            onChange={handleTitleChange}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="slug">
            Slug <span className="text-muted-foreground">*</span>
          </Label>
          <Input
            id="slug"
            name="slug"
            value={slugValue}
            onChange={(e) => {
              setSlugValue(e.target.value);
              setSlugTouched(true);
            }}
            placeholder="death-guard-plague-marine"
            maxLength={200}
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            title="Lowercase letters, numbers, and hyphens only"
          />
          <p className="text-xs text-muted-foreground">
            Used in the URL: /projects/<span className="font-mono">{slugValue || "…"}</span>
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="summary">Summary</Label>
          <Input
            id="summary"
            name="summary"
            defaultValue={project?.summary ?? ""}
            placeholder="One-sentence teaser for the project feed…"
            maxLength={500}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="body">Narrative</Label>
          <Textarea
            id="body"
            name="body"
            defaultValue={project?.body ?? ""}
            placeholder="Tell the story of how this was painted. Markdown supported."
            rows={8}
          />
        </div>

        <SelectField label="Status" name="status" defaultValue={project?.status ?? "draft"}>
          <option value="draft">Draft — not publicly visible</option>
          <option value="published">Published — visible on the front page</option>
        </SelectField>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="game">Game</Label>
            <Input
              id="game"
              name="game"
              defaultValue={project?.game ?? ""}
              placeholder="e.g. Warhammer 40k"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="faction">Faction</Label>
            <Input
              id="faction"
              name="faction"
              defaultValue={project?.faction ?? ""}
              placeholder="e.g. Death Guard"
            />
          </div>
        </div>
      </section>

      {/* Photos */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Photos
        </h2>
        {isEdit ? (
          <ProjectImageGallery
            projectId={project.id}
            userId={userId}
            initialImages={images}
            onImagesChange={setImages}
          />
        ) : (
          <StagedProjectImageGallery images={staged} onChange={setStaged} />
        )}
      </section>

      {/* Recipes */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Recipes
        </h2>
        <p className="text-xs text-muted-foreground">
          Link the recipes used to paint this model, grouped by area.
        </p>
        <RecipeLinksEditor
          availableRecipes={availableRecipes}
          initialLinks={project?.recipes ?? []}
          onChange={setRecipeLinks}
        />
      </section>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create project"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            window.history.length > 1
              ? window.history.back()
              : (window.location.href = "/admin/projects")
          }
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
