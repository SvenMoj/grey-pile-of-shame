import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { JsonLd } from "@/components/JsonLd";
import { getProjectBySlug } from "@/lib/projects/queries";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project" };

  const coverImage = project.images[0]?.image_url;

  return {
    title: project.title,
    description: project.summary ?? undefined,
    openGraph: coverImage
      ? {
          images: [{ url: coverImage }],
          title: project.title,
          description: project.summary ?? undefined,
        }
      : undefined,
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project || project.status !== "published") notFound();

  const coverImage = project.images[0];
  const galleryImages = project.images.slice(1);

  // Group recipes by area (preserving sort_order within each area).
  const areaMap = new Map<string, typeof project.recipes>();
  for (const link of project.recipes) {
    const existing = areaMap.get(link.area) ?? [];
    existing.push(link);
    areaMap.set(link.area, existing);
  }

  const metadata = [project.game, project.faction].filter(Boolean).join(" · ");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: project.title,
    description: project.summary ?? undefined,
    image: coverImage?.image_url,
    datePublished: project.published_at ?? project.created_at,
    dateModified: project.updated_at,
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <div className="space-y-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All projects
        </Link>

        {/* Hero image */}
        {coverImage && (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
            <Image
              src={coverImage.image_url}
              alt={project.title}
              fill
              className="object-cover"
              priority
              sizes="(min-width: 1024px) 896px, 100vw"
            />
          </div>
        )}

        {/* Title + metadata */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{project.title}</h1>
          {metadata && <p className="text-muted-foreground">{metadata}</p>}
        </div>

        {/* Narrative body */}
        {project.body && (
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            {project.body
              .split("\n")
              .map((line, i) => (line.trim() ? <p key={i}>{line}</p> : <br key={i} />))}
          </div>
        )}

        {/* Gallery (images after the cover) */}
        {galleryImages.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Gallery
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {galleryImages.map((img) => (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={img.image_url}
                    alt={`${project.title} — detail`}
                    fill
                    className="object-cover"
                    sizes="(min-width: 640px) 33vw, 50vw"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recipes by area */}
        {areaMap.size > 0 && (
          <section className="space-y-5">
            <Separator />
            <div className="flex items-center gap-2">
              <FlaskConical className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Paint recipes
              </h2>
            </div>

            {[...areaMap.entries()].map(([area, links]) => (
              <div key={area} className="space-y-2">
                <h3 className="text-sm font-semibold capitalize">{area}</h3>
                <ul className="space-y-1.5">
                  {links.map((link) => (
                    <li key={link.id}>
                      <Link
                        href={`/recipes/${link.recipe_id}`}
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline underline-offset-2"
                      >
                        <FlaskConical className="size-3.5 shrink-0" />
                        {link.recipe?.title}
                      </Link>
                      {link.note && (
                        <p className="text-xs text-muted-foreground ml-5.5">{link.note}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}
      </div>
    </>
  );
}
