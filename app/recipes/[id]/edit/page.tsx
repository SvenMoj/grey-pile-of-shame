import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getUserOrRedirect } from "@/lib/user/auth";
import { getRecipeById } from "@/lib/recipes/queries";
import { RecipeEditor } from "../../RecipeEditor";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipeById(id);
  return { title: recipe ? `Edit — ${recipe.title}` : "Edit Recipe" };
}

export default async function EditRecipePage({ params }: Props) {
  const { id } = await params;
  const [user, recipe] = await Promise.all([getUserOrRedirect(), getRecipeById(id)]);

  if (!recipe || recipe.author_user_id !== user.id) notFound();

  return (
    <main className="container mx-auto max-w-2xl px-4 py-12 space-y-6">
      <h1 className="text-2xl font-bold">Edit recipe</h1>
      <RecipeEditor userId={user.id} recipe={recipe} />
    </main>
  );
}
