import type { Metadata } from "next";
import { getUserOrRedirect } from "@/lib/user/auth";
import { RecipeEditor } from "../RecipeEditor";

export const metadata: Metadata = { title: "New Recipe" };

export default async function NewRecipePage() {
  const user = await getUserOrRedirect();
  return (
    <main className="container mx-auto max-w-2xl px-4 py-12 space-y-6">
      <h1 className="text-2xl font-bold">New recipe</h1>
      <RecipeEditor userId={user.id} />
    </main>
  );
}
