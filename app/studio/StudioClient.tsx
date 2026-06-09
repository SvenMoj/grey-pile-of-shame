"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { StudioFormat } from "@/lib/studio/format";
import { getRecipeCanvasData } from "./actions";
import type { CanvasData } from "./actions";
import CanvasEditor from "./CanvasEditor";

// ─── Types ───────────────────────────────────────────────────────────────────

export type EntityOption = {
  id: string;
  label: string;
  subtitle?: string | null;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function StudioClient({ recipes }: { recipes: EntityOption[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [format, setFormat] = useState<StudioFormat>("portrait");

  const [canvasData, setCanvasData] = useState<CanvasData | null>(null);
  const [canvasLoading, setCanvasLoading] = useState(false);
  // null = not yet fetched; false = fetched but no cover image
  const [hasCover, setHasCover] = useState<boolean | null>(null);

  // Load canvas data when a recipe is selected
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;

    getRecipeCanvasData(selectedId).then((data) => {
      if (cancelled) return;
      setCanvasData(data);
      setHasCover(data !== null);
      setCanvasLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  function handleSelectRecipe(id: string) {
    setSelectedId(id);
    setCanvasData(null);
    setHasCover(null);
    setCanvasLoading(true);
  }

  const showCanvas = !canvasLoading && canvasData !== null;

  return (
    <div className="space-y-6">
      {/* Recipe picker */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Recipe
        </Label>
        {recipes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recipes found.</p>
        ) : (
          <div className="max-h-52 overflow-y-auto rounded-lg border divide-y">
            {recipes.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => handleSelectRecipe(e.id)}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between gap-2 ${
                  selectedId === e.id ? "bg-primary/10 text-primary" : "hover:bg-accent/50"
                }`}
              >
                <span className="truncate font-medium">{e.label}</span>
                {e.subtitle && (
                  <span className="text-xs text-muted-foreground shrink-0">{e.subtitle}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Format toggle */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Format
        </Label>
        <div className="flex gap-2">
          {(["portrait", "square"] as StudioFormat[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                format === f
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {f === "portrait" ? "Portrait 4:5" : "Square 1:1"}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {canvasLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="animate-spin size-4" />
          Loading…
        </div>
      )}

      {/* No cover image warning */}
      {!canvasLoading && hasCover === false && (
        <p className="text-sm text-muted-foreground">
          This recipe has no cover image. Add one in the recipe editor to use the Studio.
        </p>
      )}

      {/* Canvas editor */}
      {showCanvas && canvasData && (
        <CanvasEditor
          key={`${format}-${canvasData.coverImageUrl}`}
          data={canvasData}
          format={format}
        />
      )}
    </div>
  );
}
