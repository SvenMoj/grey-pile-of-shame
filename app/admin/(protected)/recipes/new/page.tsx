import type { Metadata } from "next";
import { getAdminUserOrRedirect } from "@/lib/admin/auth";
import { RecipeEditor } from "@/app/recipes/RecipeEditor";

export const metadata: Metadata = { title: "New Recipe" };

export default async function AdminNewRecipePage() {
  const user = await getAdminUserOrRedirect();
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">New recipe</h1>
      <RecipeEditor userId={user.id} />
    </div>
  );
}
