import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminUserOrRedirect } from "@/lib/admin/auth";
import { listMyRecipes } from "@/lib/recipes/queries";

export const metadata: Metadata = { title: "Recipes" };

export default async function AdminRecipesPage() {
  await getAdminUserOrRedirect();
  const recipes = await listMyRecipes();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Recipes</h1>
        <Button asChild size="sm">
          <Link href="/admin/recipes/new">
            <PlusCircle />
            New recipe
          </Link>
        </Button>
      </div>

      {recipes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No recipes yet.{" "}
          <Link href="/admin/recipes/new" className="underline">
            Create your first recipe.
          </Link>
        </p>
      ) : (
        <ul className="space-y-3">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <Link
                href={`/admin/recipes/${recipe.id}/edit`}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
              >
                {/* Cover thumbnail */}
                {recipe.cover_image_url ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={recipe.cover_image_url}
                      alt={recipe.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ) : (
                  <div className="h-16 w-16 shrink-0 rounded-lg bg-muted" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{recipe.title}</p>
                    <Badge variant={recipe.visibility === "public" ? "default" : "secondary"}>
                      {recipe.visibility}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {recipe.step_count} {recipe.step_count === 1 ? "step" : "steps"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
