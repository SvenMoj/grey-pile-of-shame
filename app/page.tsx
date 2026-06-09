import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/SiteHeader";
import { listPublishedProjects } from "@/lib/projects/queries";

export const metadata: Metadata = {
  title: "grey-pile-of-shame",
  description: "Miniature painting projects and paint recipes.",
};

export default async function HomePage() {
  const projects = await listPublishedProjects();

  return (
    <>
      <SiteHeader />
      <main className="container mx-auto max-w-4xl px-4 py-12 space-y-10">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="mt-2 text-muted-foreground">
            A showcase of miniature painting projects — with the recipes used to paint them.
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <p className="text-lg">No projects published yet.</p>
            <p className="text-sm mt-1">Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.slug}`} className="block group">
                <Card className="h-full transition-colors hover:border-primary overflow-hidden">
                  {project.cover_image_url && (
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <Image
                        src={project.cover_image_url}
                        alt={project.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-1 pt-4 px-4">
                    <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">
                      {project.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-1">
                    {(project.game || project.faction) && (
                      <p className="text-xs text-muted-foreground">
                        {[project.game, project.faction].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {project.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {project.summary}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
