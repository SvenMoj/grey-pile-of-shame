/**
 * GET /studio/share/model/[id]?format=square|portrait&theme=light|dark
 *
 * Returns a branded PNG project showcase image for Instagram.
 * Requires an authenticated admin session.
 *
 * Layout:
 *   – Project cover photo fills the top ~60% (hero image) if available,
 *     otherwise a neutral-colour gradient placeholder
 *   – Title, game/faction label, first linked recipe name, and @handle
 *     in the lower section
 */

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProjectForStudio, getInstagramHandle } from "@/lib/studio/queries";
import { parseFormat, parseTheme, FORMAT_SIZES, THEME_PALETTE } from "@/lib/studio/format";
import { getLogoDataUrl, LOGO_HEIGHT, LOGO_WIDTH } from "@/lib/studio/logo";

export const dynamic = "force-dynamic";

/** Neutral accent colour for the project placeholder (no painting-state dependency). */
const PROJECT_ACCENT = "#7B6A54";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Auth guard — studio is admin-only
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

  const [project, handle] = await Promise.all([getProjectForStudio(id), getInstagramHandle()]);
  if (!project) return new Response("Not found", { status: 404 });

  const accentColor = PROJECT_ACCENT;
  const isPortrait = format === "portrait";

  // Photo section takes ~60% of height when present
  const photoHeight = Math.round(size.height * 0.6);
  const infoHeight = size.height - photoHeight;
  const titleSize = isPortrait ? 60 : 52;
  const bodySize = isPortrait ? 26 : 22;
  const footerSize = isPortrait ? 22 : 18;

  const subtitle = [project.game, project.faction].filter(Boolean).join(" · ");

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
      {/* Hero image or gradient placeholder */}
      {project.cover_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.cover_image_url}
          alt={project.title}
          width={size.width}
          height={photoHeight}
          style={{
            objectFit: "cover",
            width: "100%",
            height: photoHeight,
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: photoHeight,
            background: `linear-gradient(160deg, ${accentColor}33 0%, ${accentColor}11 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 120,
              fontWeight: 700,
              color: accentColor,
              opacity: 0.25,
            }}
          >
            {project.title
              .split(" ")
              .slice(0, 2)
              .map((w: string) => w[0]?.toUpperCase() ?? "")
              .join("")}
          </div>
        </div>
      )}

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
        {/* Game/faction badge (optional) */}
        {subtitle && (
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              background: `${accentColor}22`,
              border: `1px solid ${accentColor}55`,
              borderRadius: "6px",
              padding: "4px 14px",
              fontSize: bodySize * 0.75,
              color: accentColor,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            {subtitle}
          </div>
        )}

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
          {project.title}
        </div>

        {/* Recipe + footer */}
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
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {project.first_recipe_title && (
              <div style={{ fontSize: bodySize * 0.85, color: pal.textMuted }}>
                {`Recipe: ${project.first_recipe_title}`}
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
