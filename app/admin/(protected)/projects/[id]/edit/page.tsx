import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAdminUserOrRedirect } from "@/lib/admin/auth";
import { getProjectBySlug, listAdminProjects } from "@/lib/projects/queries";
import { listMyRecipes } from "@/lib/recipes/queries";
import { ProjectEditor } from "../../ProjectEditor";
import { DeleteProjectButton } from "../../DeleteProjectButton";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  void (await params);
  return { title: "Edit Project" };
}

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params;
  const user = await getAdminUserOrRedirect();

  // Resolve id → slug by listing admin projects (small list for a single-admin app).
  const allProjects = await listAdminProjects();
  const stub = allProjects.find((p) => p.id === id);
  if (!stub) notFound();

  const [project, availableRecipes] = await Promise.all([
    getProjectBySlug(stub.slug),
    listMyRecipes(),
  ]);

  if (!project) notFound();

  const isOwner = project.author_user_id === user.id;
  if (!isOwner) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Edit — <span className="font-normal text-muted-foreground">{project.title}</span>
        </h1>
        <div className="flex items-center gap-2">
          {project.status === "published" && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${project.slug}`} target="_blank">
                <ExternalLink />
                View
              </Link>
            </Button>
          )}
          <DeleteProjectButton projectId={project.id} />
        </div>
      </div>

      <ProjectEditor userId={user.id} availableRecipes={availableRecipes} project={project} />
    </div>
  );
}
