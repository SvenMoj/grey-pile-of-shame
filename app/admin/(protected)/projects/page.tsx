import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminUserOrRedirect } from "@/lib/admin/auth";
import { listAdminProjects } from "@/lib/projects/queries";

export const metadata: Metadata = { title: "Projects" };

export default async function AdminProjectsPage() {
  await getAdminUserOrRedirect();
  const projects = await listAdminProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Projects</h1>
        <Button asChild size="sm">
          <Link href="/admin/projects/new">
            <PlusCircle />
            New project
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No projects yet.{" "}
          <Link href="/admin/projects/new" className="underline">
            Create your first project.
          </Link>
        </p>
      ) : (
        <ul className="space-y-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/admin/projects/${project.id}/edit`}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
              >
                {/* Cover thumbnail */}
                {project.cover_image_url ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={project.cover_image_url}
                      alt={project.title}
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
                    <p className="truncate font-medium">{project.title}</p>
                    <Badge variant={project.status === "published" ? "default" : "secondary"}>
                      {project.status}
                    </Badge>
                  </div>
                  {(project.game || project.faction) && (
                    <p className="text-sm text-muted-foreground truncate">
                      {[project.game, project.faction].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {project.summary && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{project.summary}</p>
                  )}
                </div>

                <div className="shrink-0 text-xs text-muted-foreground font-mono">
                  /{project.slug}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
