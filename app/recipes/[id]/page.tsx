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
} from "@/lib/recipes/queries";
import {
  indexConversionsByRecipePaint,
  resolveAllSteps,
  type ConversionEdge,
} from "@/lib/recipes/cross-reference";
import { RecipeInventoryPanel } from "./RecipeInventoryPanel";
import { BrandSubstitutePicker } from "./BrandSubstitutePicker";
import { RecipeApplyButton } from "./RecipeApplyButton";

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

  // Catalog paint ids from steps (exclude hex-only steps)
  const stepPaintIds = recipe.steps
    .map((s) => s.target_paint_id)
    .filter((id): id is string => id !== null);

  // Fetch cross-ref data in parallel (safe for anon — owned set will be empty)
  const [rawConversions, ownedPaintIds, brands, models, applications] = await Promise.all([
    getConversionsForPaints(stepPaintIds),
    getOwnedPaintIds(),
    getBrands(),
    isAuthed ? listMyModels() : Promise.resolve([]),
    isAuthed
      ? createClient().then((s) =>
          s
            .from("recipe_applications")
            .select("miniature_item_id")
            .eq("recipe_id", id)
            .then(({ data }) => new Set((data ?? []).map((r) => r.miniature_item_id as string))),
        )
      : Promise.resolve(new Set<string>()),
  ]);

  const conversionsByPaint = indexConversionsByRecipePaint(rawConversions, new Set(stepPaintIds));

  const statuses = resolveAllSteps(recipe.steps, ownedPaintIds, conversionsByPaint);

  const stepsWithStatus = recipe.steps.map((step, i) => ({
    ...step,
    status: statuses[i],
  }));

  // Serialize the Map for the client BrandSubstitutePicker
  const conversionEdges: [string, ConversionEdge[]][] = Array.from(conversionsByPaint.entries());

  const coverImage = recipe.images[0] ?? null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/recipes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Recipes
      </Link>

      {/* Cover image */}
      {coverImage ? (
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
      ) : recipe.images.length === 0 ? null : null}

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
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {STEP_ROLE_LABELS[step.role] ?? step.role}
                    </Badge>
                    {step.paint && (
                      <>
                        <PaintSwatch hex={step.paint.hex} size="sm" />
                        <span className="text-sm font-medium">{step.paint.name}</span>
                        <span className="text-xs text-muted-foreground">{step.paint.brand}</span>
                      </>
                    )}
                    {step.target_hex && !step.paint && (
                      <>
                        <PaintSwatch hex={step.target_hex} size="sm" />
                        <span className="text-sm text-muted-foreground font-mono">
                          #{step.target_hex}
                        </span>
                      </>
                    )}
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
          <RecipeApplyButton recipeId={id} models={models} appliedModelIds={applications} />
          {models.length === 0 && (
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/recipes/${id}/edit`}>
                <Pencil />
                Edit recipe
              </Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
