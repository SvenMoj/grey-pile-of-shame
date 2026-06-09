import type { Metadata } from "next";
import { getAdminUserOrRedirect } from "@/lib/admin/auth";
import { listMyRecipes } from "@/lib/recipes/queries";
import { ProjectEditor } from "../ProjectEditor";

export const metadata: Metadata = { title: "New Project" };

export default async function NewProjectPage() {
  const user = await getAdminUserOrRedirect();
  const availableRecipes = await listMyRecipes();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">New project</h1>
      <ProjectEditor userId={user.id} availableRecipes={availableRecipes} />
    </div>
  );
}
