import type { Metadata } from "next";
import { listMyRecipes, listMyModels } from "@/lib/recipes/queries";
import StudioClient from "./StudioClient";
import type { EntityOption } from "./StudioClient";

export const metadata: Metadata = {
  title: "Share Studio",
};

export default async function StudioPage() {
  const [recipes, models] = await Promise.all([listMyRecipes(), listMyModels()]);

  const recipeOptions: EntityOption[] = recipes.map((r) => ({
    id: r.id,
    label: r.title,
    subtitle: `${r.step_count} step${r.step_count !== 1 ? "s" : ""}`,
  }));

  const modelOptions: EntityOption[] = models.map((m) => ({
    id: m.id,
    label: m.display_name,
    subtitle: m.state.replace("_", " "),
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Share Studio</h1>
        <p className="text-sm text-muted-foreground">
          Generate Instagram-ready images from your recipes, models, and progress.
        </p>
      </div>
      <StudioClient recipes={recipeOptions} models={modelOptions} />
    </div>
  );
}
