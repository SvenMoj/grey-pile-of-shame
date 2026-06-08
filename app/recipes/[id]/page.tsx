import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaintSwatch } from "@/components/PaintSwatch";
import { createClient } from "@/lib/supabase/server";
import { getBrands } from "@/lib/brands";
import {
  getRecipeById,
  getConversionsForPaints,
  getOwnedPaintIds,
  listMyModels,
  listModelsForRecipe,
  type ApplicationWithModel,
} from "@/lib/recipes/queries";
import {
  indexConversionsByRecipePaint,
  resolveAllSteps,
  type ConversionEdge,
} from "@/lib/recipes/cross-reference";
import { RecipeInventoryPanel } from "./RecipeInventoryPanel";
import { BrandSubstitutePicker } from "./BrandSubstitutePicker";
import { RecipeApplyButton } from "./RecipeApplyButton";
import { DeleteRecipeButton } from "./DeleteRecipeButton";

const STEP_ROLE_LABELS: Record<string, string> = {
  basecoat: "Basecoat",
  layer: "Layer",
  highlight: "Highlight",
  edge_highlight: "Edge Highlight",
  shade: "Shade",
  drybrush: "Drybrush",
  glaze: "Glaze",
  wash: "Wash",
  other: "Other",
};

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipeById(id);
  if (!recipe) return { title: "Recipe" };
  return {
    title: recipe.title,
    openGraph: recipe.images[0] ? { images: [{ url: recipe.images[0].image_url }] } : undefined,
  };
}

export default async function RecipePage({ params }: Props) {
  const { id } = await params;

  const [
    recipe,
    {
      data: { user },
    },
  ] = await Promise.all([getRecipeById(id), createClient().then((s) => s.auth.getUser())]);

  if (!recipe) notFound();

  const isOwner = !!user && user.id === recipe.author_user_id;
  const isAuthed = !!user;

  // Catalog paint ids from all step components — flatten, dedupe, exclude hex-only.
  const stepPaintIds = [
    ...new Set(
      recipe.steps
        .flatMap((s) => s.paints)
        .map((c) => c.paint_id)
        .filter((id): id is string => id !== null),
    ),
  ];

  // Fetch cross-ref data in parallel (safe for anon — owned set will be empty)
  const [rawConversions, ownedPaintIds, brands, models, appliedModels] = await Promise.all([
    getConversionsForPaints(stepPaintIds),
    getOwnedPaintIds(),
    getBrands(),
    isAuthed ? listMyModels() : Promise.resolve([]),
    isAuthed ? listModelsForRecipe(id) : Promise.resolve([] as ApplicationWithModel[]),
  ]);

  const appliedModelIds = new Set(appliedModels.map((a) => a.miniature_item_id));

  const conversionsByPaint = indexConversionsByRecipePaint(rawConversions, new Set(stepPaintIds));
  const statuses = resolveAllSteps(recipe.steps, ownedPaintIds, conversionsByPaint);
  const stepsWithStatus = recipe.steps.map((step, i) => ({ ...step, status: statuses[i] }));

  // Serialize the Map for the client BrandSubstitutePicker
  const conversionEdges: [string, ConversionEdge[]][] = Array.from(conversionsByPaint.entries());

  const coverImage = recipe.images[0] ?? null;

  return (
    <main className="container mx-auto max-w-2xl px-4 py-12 space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/recipes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Recipes
      </Link>

      {/* Cover image — fixed: removed dead ternary (was: recipe.images.length === 0 ? null : null) */}
      {coverImage && (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
          <Image
            src={coverImage.image_url}
            alt={recipe.title}
            fill
            className="object-cover"
            priority
            sizes="(min-width: 672px) 640px, 100vw"
          />
        </div>
      )}

      {/* Gallery thumbnails (2nd+ images) */}
      {recipe.images.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {recipe.images.slice(1).map((img) => (
            <div
              key={img.id}
              className="relative h-20 w-20 overflow-hidden rounded-lg border border-border"
            >
              <Image
                src={img.image_url}
                alt={recipe.title}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          ))}
        </div>
      )}

      {/* Identity */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{recipe.title}</h1>
          <Badge variant={recipe.visibility === "public" ? "default" : "secondary"}>
            {recipe.visibility === "public" ? "Public" : "Private"}
          </Badge>
        </div>
        {recipe.description && <p className="text-muted-foreground">{recipe.description}</p>}
        {recipe.source_url && (
          <a
            href={recipe.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-2 hover:underline hover:text-foreground"
          >
            <ExternalLink className="size-3" />
            Source
          </a>
        )}
      </div>

      {/* Steps */}
      {recipe.steps.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Steps ({recipe.steps.length})
          </h2>
          <ol className="space-y-2">
            {recipe.steps.map((step) => (
              <li
                key={step.id}
                className="flex items-start gap-3 rounded-xl border border-border p-3"
              >
                <span className="mt-0.5 text-muted-foreground text-sm w-5 text-center">
                  {step.step_order + 1}.
                </span>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {STEP_ROLE_LABELS[step.role] ?? step.role}
                    </Badge>
                  </div>
                  {/* Paint mix — rendered as "2× Name (Brand) + 1× Name (Brand)" */}
                  <div className="flex flex-wrap items-center gap-1.5 text-sm">
                    {step.paints.map((comp, ci) => (
                      <span key={comp.id} className="flex items-center gap-1.5">
                        {ci > 0 && <span className="text-muted-foreground text-xs">+</span>}
                        {comp.paint ? (
                          <>
                            <PaintSwatch hex={comp.paint.hex} size="sm" />
                            {step.paints.length > 1 || comp.ratio !== 1 ? (
                              <span className="font-mono text-xs text-muted-foreground">
                                {comp.ratio}×
                              </span>
                            ) : null}
                            <span className="font-medium">{comp.paint.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {comp.paint.brand}
                            </span>
                          </>
                        ) : comp.hex ? (
                          <>
                            <PaintSwatch hex={comp.hex} size="sm" />
                            {step.paints.length > 1 || comp.ratio !== 1 ? (
                              <span className="font-mono text-xs text-muted-foreground">
                                {comp.ratio}×
                              </span>
                            ) : null}
                            <span className="text-muted-foreground font-mono">#{comp.hex}</span>
                          </>
                        ) : null}
                      </span>
                    ))}
                  </div>
                  {step.technique_note && (
                    <p className="text-xs text-muted-foreground">
                      Technique: {step.technique_note}
                    </p>
                  )}
                  {step.area_note && (
                    <p className="text-xs text-muted-foreground">Area: {step.area_note}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Inventory cross-reference */}
      {recipe.steps.length > 0 && (
        <section className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Your inventory
          </h2>
          <RecipeInventoryPanel steps={stepsWithStatus} isAuthed={isAuthed} />
        </section>
      )}

      {/* Brand substitution selector */}
      {brands.length > 0 && recipe.steps.length > 0 && (
        <section className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Substitute with another brand
          </h2>
          <BrandSubstitutePicker
            steps={recipe.steps}
            brands={brands}
            conversionEdges={conversionEdges}
          />
        </section>
      )}

      {/* Apply to model */}
      {isAuthed && (
        <section className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Apply to a model
          </h2>

          {/* Applied models list */}
          {appliedModels.length > 0 && (
            <ul className="space-y-1.5">
              {appliedModels.map((app) => (
                <li key={app.id} className="flex items-center gap-2 text-sm">
                  <Link
                    href={`/model/${app.miniature_item_id}`}
                    className="font-medium hover:underline underline-offset-2 flex-1 min-w-0 truncate"
                  >
                    {app.model.display_name}
                  </Link>
                  <Badge variant="secondary" className="shrink-0 capitalize">
                    {app.status === "in_progress" ? "In progress" : app.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}

          {models.length > 0 ? (
            <RecipeApplyButton recipeId={id} models={models} appliedModelIds={appliedModelIds} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No models yet.{" "}
              <Link href="/pile" className="underline underline-offset-2 hover:text-foreground">
                Add one to your pile
              </Link>
              .
            </p>
          )}
        </section>
      )}

      {/* Owner controls */}
      {isOwner && (
        <section className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Manage
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/recipes/${id}/edit`}>
                <Pencil />
                Edit recipe
              </Link>
            </Button>
            <DeleteRecipeButton recipeId={id} />
          </div>
        </section>
      )}
    </main>
  );
}
