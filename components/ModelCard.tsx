"use client";

import Link from "next/link";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { StatePill } from "@/components/StatePill";
import { STATE_STYLES } from "@/lib/pile/display";
import type { PileItem } from "@/lib/pile/types";

/**
 * Renders a model as a shadcn Card with an image header (or state-colored
 * placeholder), a link overlay to the model's detail page, and optional
 * action/advance slots in the footer.
 *
 * Drop-in complement to ModelItemRow — keeps the same { item, advance, actions }
 * prop shape so call sites change minimally.
 */
export function ModelCard({
  item,
  advance,
  actions,
}: {
  item: PileItem;
  advance?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const metadata = [
    item.game,
    item.faction,
    item.point_value !== null ? `${item.point_value}pts` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const initials = item.display_name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
      {/* ── Image header — first child so Card CSS applies flush corners ── */}
      {item.image_url ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={item.image_url}
            alt={item.display_name}
            fill
            className="object-cover"
            sizes="(min-width: 640px) 50vw, 100vw"
          />
        </div>
      ) : (
        <div
          className={cn(
            "flex aspect-[4/3] w-full items-center justify-center",
            STATE_STYLES[item.state].bar,
          )}
        >
          <div className="flex flex-col items-center gap-1 text-white/80">
            <ImageIcon className="size-6 opacity-60" />
            {initials && <span className="text-sm font-semibold tracking-wide">{initials}</span>}
          </div>
        </div>
      )}

      {/* ── Overlay link — covers the whole card, behind buttons ── */}
      <Link
        href={`/model/${item.id}`}
        className="absolute inset-0 z-0"
        aria-label={`View ${item.display_name}`}
      />

      {/* ── Body ── */}
      <CardContent className="relative z-10 space-y-1.5 pt-3">
        <p className="truncate text-sm font-medium">
          {item.unit_size > 1 && (
            <span className="mr-1 text-muted-foreground">{item.unit_size}×</span>
          )}
          {item.display_name}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <StatePill state={item.state} />
          {metadata && <p className="truncate text-xs text-muted-foreground">{metadata}</p>}
        </div>
      </CardContent>

      {/* ── Footer — advance + action buttons ── */}
      {(advance ?? actions) ? (
        <CardFooter className="relative z-10 flex flex-wrap items-center gap-1 pt-2">
          {advance}
          {actions}
        </CardFooter>
      ) : null}
    </Card>
  );
}
