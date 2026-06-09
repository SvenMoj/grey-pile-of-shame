import type { Metadata } from "next";
import { listMyRecipes } from "@/lib/recipes/queries";
import StudioClient from "./StudioClient";
import type { EntityOption } from "./StudioClient";

export const metadata: Metadata = {
  title: "Share Studio",
};

export default async function StudioPage() {
  const recipes = await listMyRecipes();

  const recipeOptions: EntityOption[] = recipes.map((r) => ({
    id: r.id,
    label: r.title,
    subtitle: `${r.step_count} step${r.step_count !== 1 ? "s" : ""}`,
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Share Studio</h1>
        <p className="text-sm text-muted-foreground">
          Generate Instagram-ready images from your recipes.
        </p>
      </div>
      <StudioClient recipes={recipeOptions} />
    </div>
  );
}
