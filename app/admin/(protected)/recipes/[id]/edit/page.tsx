import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAdminUserOrRedirect } from "@/lib/admin/auth";
import { getRecipeById } from "@/lib/recipes/queries";
import { RecipeEditor } from "@/app/recipes/RecipeEditor";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipeById(id);
  return { title: recipe ? `Edit — ${recipe.title}` : "Edit Recipe" };
}

export default async function AdminEditRecipePage({ params }: Props) {
  const { id } = await params;
  const [user, recipe] = await Promise.all([getAdminUserOrRedirect(), getRecipeById(id)]);

  if (!recipe || recipe.author_user_id !== user.id) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">
        Edit — <span className="font-normal text-muted-foreground">{recipe.title}</span>
      </h1>
      <RecipeEditor userId={user.id} recipe={recipe} />
    </div>
  );
}
