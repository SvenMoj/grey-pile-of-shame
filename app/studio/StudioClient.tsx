"use client";

import { useState, useCallback, useEffect } from "react";
import { Download, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { StudioFormat, StudioTheme } from "@/lib/studio/format";
import { getRecipeCanvasData, getModelCanvasData } from "./actions";
import type { CanvasData } from "./actions";
import CanvasEditor from "./CanvasEditor";

// ─── Types ───────────────────────────────────────────────────────────────────

export type EntityOption = {
  id: string;
  label: string;
  subtitle?: string | null;
};

export type TemplateType = "recipe" | "model" | "stats";

// ─── Templates ───────────────────────────────────────────────────────────────

const TEMPLATES: { type: TemplateType; label: string; description: string }[] = [
  { type: "recipe", label: "Recipe Card", description: "Steps, swatches & technique overview" },
  { type: "model", label: "Model Showcase", description: "Hero photo + state & recipe credit" },
  { type: "stats", label: "Progress Stats", description: "Painted this month + all-time bar" },
];

// ─── Server-route helpers (used only for stats / text-only cards) ────────────

function buildServerUrl(
  template: TemplateType,
  entityId: string | null,
  format: StudioFormat,
  theme: StudioTheme,
): string {
  const base =
    template === "recipe"
      ? `/studio/share/recipe/${entityId}`
      : template === "model"
        ? `/studio/share/model/${entityId}`
        : `/studio/share/stats`;
  return `${base}?format=${format}&theme=${theme}&t=${Date.now()}`;
}

function buildFilename(label: string | null, template: TemplateType, format: StudioFormat): string {
  const slug = (label ?? template)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug}-${format === "square" ? "1x1" : "4x5"}.png`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function StudioClient({
  recipes,
  models,
}: {
  recipes: EntityOption[];
  models: EntityOption[];
}) {
  const [template, setTemplate] = useState<TemplateType>("stats");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [format, setFormat] = useState<StudioFormat>("square");
  const [theme, setTheme] = useState<StudioTheme>("dark");

  // Canvas editor state (recipes / models with a photo)
  const [canvasData, setCanvasData] = useState<CanvasData | null>(null);
  const [canvasLoading, setCanvasLoading] = useState(false);

  // Server-route preview state (stats / text-only)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);

  const entities = template === "recipe" ? recipes : template === "model" ? models : [];
  const needsEntity = template !== "stats";
  const selectedEntity = entities.find((e) => e.id === selectedId) ?? null;
  const canGenerate = !needsEntity || selectedId !== null;

  // When a recipe or model is selected, load canvas data.
  // Synchronous state resets are done in the event handlers below;
  // the effect body only starts the async fetch (setState only in the .then() callback).
  useEffect(() => {
    if (!selectedId || template === "stats") return;
    let cancelled = false;

    const request =
      template === "recipe" ? getRecipeCanvasData(selectedId) : getModelCanvasData(selectedId);

    request.then((data) => {
      if (cancelled) return;
      setCanvasData(data);
      setCanvasLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedId, template]);

  // Reset everything when template changes (event handler — setState here is fine)
  function handleTemplateChange(t: TemplateType) {
    setTemplate(t);
    setSelectedId(null);
    setCanvasData(null);
    setCanvasLoading(false);
    setPreviewSrc(null);
  }

  // Reset canvas state when an entity is selected (event handler — setState here is fine)
  function handleSelectEntity(id: string) {
    setSelectedId(id);
    setCanvasData(null);
    setCanvasLoading(template !== "stats");
    setPreviewSrc(null);
  }

  // Server-route generate (stats + text-only cards)
  const handleGenerate = useCallback(() => {
    if (!canGenerate) return;
    setPreviewSrc(buildServerUrl(template, selectedId, format, theme));
    setPreviewLoading(true);
  }, [template, selectedId, format, theme, canGenerate]);

  const handleDownload = useCallback(async () => {
    if (!canGenerate) return;
    setDownloadBusy(true);
    try {
      const url = buildServerUrl(template, selectedId, format, theme);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = buildFilename(selectedEntity?.label ?? null, template, format);
      a.click();
      URL.revokeObjectURL(objectUrl);
    } finally {
      setDownloadBusy(false);
    }
  }, [template, selectedId, selectedEntity, format, theme, canGenerate]);

  // Canvas editor is active when we have photo data (and not still loading)
  const showCanvas = !canvasLoading && canvasData !== null;
  // Fall through to server-route when entity selected but no photo
  const showServerRoute = !canvasLoading && !canvasData;

  return (
    <div className="space-y-6">
      {/* Template selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Template
        </Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => handleTemplateChange(t.type)}
              className={`rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                template === t.type
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-accent/50"
              }`}
            >
              <div className="font-medium text-sm">{t.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Entity picker */}
      {needsEntity && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {template === "recipe" ? "Recipe" : "Model"}
          </Label>
          {entities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {`No ${template === "recipe" ? "recipes" : "models"} found.`}
            </p>
          ) : (
            <div className="max-h-52 overflow-y-auto rounded-lg border divide-y">
              {entities.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => handleSelectEntity(e.id)}
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
      )}

      {/* Format (always shown); theme only relevant for server-route cards */}
      <div className="flex flex-wrap gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Format
          </Label>
          <div className="flex gap-2">
            {(["square", "portrait"] as StudioFormat[]).map((f) => (
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
                {f === "square" ? "Square 1:1" : "Portrait 4:5"}
              </button>
            ))}
          </div>
        </div>

        {/* Theme only applies when using the server-route path */}
        {showServerRoute && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Theme
            </Label>
            <div className="flex gap-2">
              {(["dark", "light"] as StudioTheme[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    theme === t
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {t === "dark" ? "Dark" : "Light"}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading spinner while fetching canvas data */}
      {canvasLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="animate-spin size-4" />
          Loading…
        </div>
      )}

      {/* Canvas editor — recipe / model with a photo */}
      {showCanvas && canvasData && (
        <CanvasEditor
          key={`${format}-${canvasData.coverImageUrl}`}
          data={canvasData}
          format={format}
        />
      )}

      {/* Server-route path — stats + text-only cards */}
      {showServerRoute && (
        <>
          <div className="flex gap-3">
            <Button onClick={handleGenerate} disabled={!canGenerate} variant="secondary">
              <ImageIcon />
              Preview
            </Button>
            <Button onClick={handleDownload} disabled={!canGenerate || downloadBusy}>
              <Download />
              {downloadBusy ? "Downloading…" : "Download PNG"}
            </Button>
          </div>

          {previewSrc && (
            <Card>
              <CardContent className="pt-4 flex flex-col items-center gap-3">
                <div className="flex gap-2 text-xs text-muted-foreground items-center">
                  <Badge variant="secondary">
                    {format === "square" ? "1080 × 1080" : "1080 × 1350"}
                  </Badge>
                  <Badge variant="secondary">{theme}</Badge>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewSrc}
                  alt="Studio preview"
                  className="max-w-full rounded-md border shadow-sm"
                  style={{ maxHeight: 480 }}
                  onLoad={() => setPreviewLoading(false)}
                  onError={() => setPreviewLoading(false)}
                />
                {previewLoading && <p className="text-sm text-muted-foreground">Generating…</p>}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
