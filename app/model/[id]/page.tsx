import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatePill } from "@/components/StatePill";
import { STATE_STYLES, STATE_LABELS } from "@/lib/pile/display";
import { cn } from "@/lib/utils";
import { ModelDetailEditor } from "./ModelDetailEditor";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("miniature_items")
    .select("display_name, image_url")
    .eq("id", id)
    .single();

  if (!data) return { title: "Model" };

  return {
    title: data.display_name,
    openGraph: data.image_url ? { images: [{ url: data.image_url }] } : undefined,
  };
}

export default async function ModelPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();

  // Fetch user + item in parallel
  const [
    {
      data: { user },
    },
    { data: row },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("miniature_items").select("*").eq("id", id).single(),
  ]);

  // RLS hides private items from non-owners; notFound() handles both "not found"
  // and "exists but private and you're not the owner".
  if (!row) notFound();

  const item = {
    id: row.id,
    kit_id: row.kit_id ?? null,
    display_name: row.display_name,
    game: row.game ?? null,
    faction: row.faction ?? null,
    unit_size: row.unit_size,
    unit_id: row.unit_id ?? null,
    state: row.state as import("@/lib/pile/types").PileState,
    point_value: row.point_value ?? null,
    image_url: (row.image_url as string | null) ?? null,
    visibility: ((row.visibility as string) ??
      "private") as import("@/lib/pile/types").ModelVisibility,
    created_at: row.created_at,
    painted_at: row.painted_at ?? null,
    updated_at: row.updated_at,
  };

  const isOwner = !!user && user.id === row.user_id;

  const metadata = [
    item.game,
    item.faction,
    item.point_value !== null ? `${item.point_value}pts` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb back ── */}
      <Link
        href="/collection"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Collection
      </Link>

      {/* ── Image header ── */}
      {item.image_url ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
          <Image
            src={item.image_url}
            alt={item.display_name}
            fill
            className="object-cover"
            priority
            sizes="(min-width: 672px) 640px, 100vw"
          />
        </div>
      ) : (
        <div
          className={cn(
            "flex aspect-[4/3] w-full items-center justify-center rounded-xl",
            STATE_STYLES[item.state].bar,
          )}
        >
          <p className="text-3xl font-semibold text-white/60">{STATE_LABELS[item.state]}</p>
        </div>
      )}

      {/* ── Identity ── */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">
          {item.unit_size > 1 && (
            <span className="mr-2 text-muted-foreground">{item.unit_size}×</span>
          )}
          {item.display_name}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <StatePill state={item.state} />
          {metadata && <p className="text-sm text-muted-foreground">{metadata}</p>}
        </div>
      </div>

      {/* ── Owner controls ── */}
      {isOwner && (
        <section className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Manage
          </h2>
          <ModelDetailEditor item={item} userId={user!.id} />
        </section>
      )}
    </div>
  );
}
