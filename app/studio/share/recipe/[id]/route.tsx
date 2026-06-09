/**
 * GET /studio/share/recipe/[id]?format=square|portrait&theme=light|dark
 *
 * Returns a branded PNG recipe card suitable for Instagram.
 * Requires an authenticated session (reads the caller's private recipes via RLS).
 *
 * Layout:
 *   – Dark/light gradient background
 *   – Recipe title + step role badges + paint swatches
 *   – @handle + "grey-pile-of-shame" brand footer
 */

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRecipeById } from "@/lib/recipes/queries";
import { getInstagramHandle } from "@/lib/studio/queries";
import { parseFormat, parseTheme, FORMAT_SIZES, THEME_PALETTE } from "@/lib/studio/format";
import { getLogoDataUrl, LOGO_HEIGHT, LOGO_WIDTH } from "@/lib/studio/logo";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  basecoat: "Base",
  layer: "Layer",
  highlight: "Highlight",
  edge_highlight: "Edge",
  shade: "Shade",
  drybrush: "Drybrush",
  glaze: "Glaze",
  wash: "Wash",
  other: "Step",
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Auth guard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const format = parseFormat(searchParams.get("format"));
  const theme = parseTheme(searchParams.get("theme"));
  const size = FORMAT_SIZES[format];
  const pal = THEME_PALETTE[theme];

  const [recipe, handle] = await Promise.all([getRecipeById(id), getInstagramHandle()]);
  if (!recipe) return new Response("Not found", { status: 404 });

  // Cover image: sort_order 0 wins, otherwise the first image by sort_order
  const coverImage = [...recipe.images].sort((a, b) => a.sort_order - b.sort_order)[0] ?? null;

  // Collect up to 8 paint swatches (unique hex values, deduped)
  const swatchHexes: string[] = [];
  for (const step of recipe.steps) {
    for (const comp of step.paints) {
      const hex = comp.hex ?? comp.paint?.hex ?? null;
      if (hex && !swatchHexes.includes(`#${hex}`)) {
        swatchHexes.push(`#${hex}`);
      }
      if (swatchHexes.length >= 8) break;
    }
    if (swatchHexes.length >= 8) break;
  }

  // Show up to 5 steps (only used in the text-only layout)
  const visibleSteps = recipe.steps.slice(0, 5);
  const moreSteps = recipe.steps.length > 5 ? recipe.steps.length - 5 : 0;

  const isPortrait = format === "portrait";
  const titleSize = isPortrait ? 64 : 56;
  const bodySize = isPortrait ? 28 : 24;
  const swatchSize = isPortrait ? 40 : 32;
  const footerSize = isPortrait ? 22 : 18;

  // Photo section takes ~55% of height when present
  const photoHeight = Math.round(size.height * 0.55);
  const infoHeight = size.height - photoHeight;

  // ── With cover image: hero photo + compact info below ───────────────────────
  if (coverImage) {
    return new ImageResponse(
      <div
        style={{
          background: pal.bg,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          fontFamily: "sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Hero photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImage.image_url}
          alt={recipe.title}
          width={size.width}
          height={photoHeight}
          style={{ objectFit: "cover", width: "100%", height: photoHeight, flexShrink: 0 }}
        />

        {/* Info panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "28px 48px 24px",
            height: infoHeight,
            background: pal.bg,
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "flex",
              background: pal.surface,
              border: `1px solid ${pal.border}`,
              borderRadius: "6px",
              padding: "4px 12px",
              marginBottom: "14px",
              fontSize: footerSize,
              color: pal.textMuted,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              alignSelf: "flex-start",
            }}
          >
            Paint Recipe
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: titleSize,
              fontWeight: 700,
              color: pal.text,
              lineHeight: 1.1,
              flex: 1,
            }}
          >
            {recipe.title}
          </div>

          {/* Swatches + footer row */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
              paddingTop: "16px",
              borderTop: `1px solid ${pal.border}`,
              marginTop: "8px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {swatchHexes.length > 0 && (
                <div style={{ display: "flex", flexDirection: "row", gap: "8px" }}>
                  {swatchHexes.map((hex) => (
                    <div
                      key={hex}
                      style={{
                        width: swatchSize * 0.8,
                        height: swatchSize * 0.8,
                        borderRadius: "50%",
                        background: hex,
                        border: `2px solid ${pal.border}`,
                      }}
                    />
                  ))}
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getLogoDataUrl()}
                width={LOGO_WIDTH}
                height={LOGO_HEIGHT}
                alt="grey-pile-of-shame"
                style={{ objectFit: "contain" }}
              />
            </div>
            {handle && (
              <div style={{ fontSize: footerSize, color: pal.brandText }}>{`@${handle}`}</div>
            )}
          </div>
        </div>
      </div>,
      { width: size.width, height: size.height },
    );
  }

  // ── Text-only layout (no cover image): title + swatches + full step list ────
  return new ImageResponse(
    <div
      style={{
        background: `linear-gradient(160deg, ${pal.bg} 0%, ${pal.bgSecondary} 100%)`,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "64px 72px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Top badge */}
      <div
        style={{
          display: "flex",
          background: pal.surface,
          border: `1px solid ${pal.border}`,
          borderRadius: "8px",
          padding: "6px 16px",
          marginBottom: "32px",
          fontSize: footerSize,
          color: pal.textMuted,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          alignSelf: "flex-start",
        }}
      >
        Paint Recipe
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: titleSize,
          fontWeight: 700,
          color: pal.text,
          lineHeight: 1.15,
          marginBottom: "32px",
        }}
      >
        {recipe.title}
      </div>

      {/* Paint swatches row */}
      {swatchHexes.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "10px",
            marginBottom: "36px",
          }}
        >
          {swatchHexes.map((hex) => (
            <div
              key={hex}
              style={{
                width: swatchSize,
                height: swatchSize,
                borderRadius: "50%",
                background: hex,
                border: `2px solid ${pal.border}`,
              }}
            />
          ))}
        </div>
      )}

      {/* Step list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
        {visibleSteps.map((step) => {
          const paintLabel = step.paints
            .map((c) => {
              const name = c.paint?.name ?? "Custom";
              return c.ratio > 1 ? `${c.ratio}× ${name}` : name;
            })
            .join(" + ");
          return (
            <div
              key={step.id}
              style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "14px" }}
            >
              {/* Role badge */}
              <div
                style={{
                  display: "flex",
                  background: pal.surface,
                  border: `1px solid ${pal.border}`,
                  borderRadius: "6px",
                  padding: "4px 12px",
                  fontSize: bodySize * 0.75,
                  color: pal.textMuted,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  minWidth: "80px",
                  justifyContent: "center",
                }}
              >
                {ROLE_LABELS[step.role] ?? "Step"}
              </div>
              {/* Paint name(s) */}
              <div style={{ fontSize: bodySize, color: pal.text, flex: 1 }}>{paintLabel}</div>
              {/* Swatch dot for first paint */}
              {(() => {
                const hex = step.paints[0]?.hex ?? step.paints[0]?.paint?.hex ?? null;
                return hex ? (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: `#${hex}`,
                      flexShrink: 0,
                    }}
                  />
                ) : null;
              })()}
            </div>
          );
        })}
        {moreSteps > 0 && (
          <div style={{ fontSize: bodySize * 0.85, color: pal.textFaint }}>
            {`+${moreSteps} more step${moreSteps > 1 ? "s" : ""}`}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginTop: "32px",
          paddingTop: "24px",
          borderTop: `1px solid ${pal.border}`,
        }}
      >
        <div style={{ fontSize: footerSize, color: pal.textMuted }}>grey-pile-of-shame</div>
        {handle && <div style={{ fontSize: footerSize, color: pal.brandText }}>{`@${handle}`}</div>}
      </div>
    </div>,
    { width: size.width, height: size.height },
  );
}
