import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { listPublicRecipes } from "@/lib/recipes/queries";
import { RecipeSearchBox } from "./RecipeSearchBox";

export const metadata: Metadata = {
  title: "Recipes",
  description: "Browse and search shared paint recipes.",
};

type Props = { searchParams: Promise<{ q?: string }> };

export default async function RecipesPage({ searchParams }: Props) {
  const { q } = await searchParams;

  const [
    recipes,
    {
      data: { user },
    },
  ] = await Promise.all([listPublicRecipes(q), createClient().then((s) => s.auth.getUser())]);

  return (
    <main className="container mx-auto max-w-4xl px-4 py-12 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Recipes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Community paint recipes — browse or search by paint name and brand.
          </p>
        </div>
        {user && (
          <Button asChild size="sm">
            <Link href="/recipes/new">
              <PlusCircle />
              New recipe
            </Link>
          </Button>
        )}
      </div>

      {/* Search */}
      <RecipeSearchBox defaultValue={q} />

      {/* Results */}
      {recipes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-2">
          {q ? (
            <>
              <p className="text-lg">No recipes found for &ldquo;{q}&rdquo;</p>
              <p className="text-sm">Try a different paint name or brand.</p>
            </>
          ) : (
            <>
              <p className="text-lg">No public recipes yet.</p>
              {user && (
                <p className="text-sm">
                  <Link href="/recipes/new" className="underline underline-offset-2">
                    Create the first one
                  </Link>
                  !
                </p>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <Link key={recipe.id} href={`/recipes/${recipe.id}`} className="block group">
              <Card className="h-full transition-colors hover:border-primary">
                {recipe.cover_image_url && (
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl">
                    <Image
                      src={recipe.cover_image_url}
                      alt={recipe.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                    />
                  </div>
                )}
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold leading-tight">
                    {recipe.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {recipe.step_count} step{recipe.step_count !== 1 ? "s" : ""}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    Public
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
