/**
 * GET /studio/share/stats?format=square|portrait&theme=light|dark
 *
 * Returns a branded PNG stats card showing painting progress.
 * Requires an authenticated session.
 *
 * Layout:
 *   – "Painted this month" headline number
 *   – Points painted this month (if any)
 *   – All-time bar: painted / total
 *   – @handle + "grey-pile-of-shame" footer
 */

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStatsForStudio, getInstagramHandle } from "@/lib/studio/queries";
import { STATE_HEX } from "@/lib/pile/display";
import { parseFormat, parseTheme, FORMAT_SIZES, THEME_PALETTE } from "@/lib/studio/format";
import { getLogoDataUrl, LOGO_HEIGHT, LOGO_WIDTH } from "@/lib/studio/logo";

export const dynamic = "force-dynamic";

// Month names for the heading
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export async function GET(request: NextRequest) {
  // Auth guard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = request.nextUrl;
  const format = parseFormat(searchParams.get("format"));
  const theme = parseTheme(searchParams.get("theme"));
  const size = FORMAT_SIZES[format];
  const pal = THEME_PALETTE[theme];

  const now = new Date();
  const [stats, handle] = await Promise.all([getStatsForStudio(now), getInstagramHandle()]);

  const monthName = MONTHS[now.getMonth()];
  const year = now.getFullYear();
  const isPortrait = format === "portrait";

  const heroSize = isPortrait ? 160 : 140;
  const titleSize = isPortrait ? 44 : 38;
  const bodySize = isPortrait ? 28 : 24;
  const footerSize = isPortrait ? 22 : 18;
  const metaSize = isPortrait ? 24 : 20;

  // All-time progress bar width (0–100)
  const progressPct =
    stats.totalModels > 0 ? Math.round((stats.totalPainted / stats.totalModels) * 100) : 0;

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
          marginBottom: "40px",
          fontSize: footerSize,
          color: pal.textMuted,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          alignSelf: "flex-start",
        }}
      >
        Progress Update
      </div>

      {/* Month heading */}
      <div
        style={{
          fontSize: titleSize,
          fontWeight: 600,
          color: pal.textMuted,
          marginBottom: "8px",
        }}
      >
        {`${monthName} ${year}`}
      </div>

      {/* Hero number */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "baseline",
          gap: "16px",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            fontSize: heroSize,
            fontWeight: 800,
            color: STATE_HEX.painted,
            lineHeight: 1,
          }}
        >
          {stats.paintedThisMonth}
        </div>
        <div style={{ fontSize: bodySize, color: pal.textMuted }}>
          {stats.paintedThisMonth === 1 ? "mini painted" : "minis painted"}
        </div>
      </div>

      {/* Points this month (only if non-zero) */}
      {stats.pointsThisMonth > 0 && (
        <div style={{ fontSize: metaSize, color: pal.textFaint, marginBottom: "32px" }}>
          {`${stats.pointsThisMonth} pts this month`}
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1, display: "flex" }} />

      {/* All-time bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "32px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            fontSize: metaSize,
            color: pal.textMuted,
          }}
        >
          <span>All time</span>
          <span>{`${stats.totalPainted} / ${stats.totalModels} painted`}</span>
        </div>
        {/* Track */}
        <div
          style={{
            width: "100%",
            height: 16,
            background: pal.surface,
            borderRadius: "8px",
            overflow: "hidden",
            display: "flex",
          }}
        >
          {/* Fill */}
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              background: STATE_HEX.painted,
              borderRadius: "8px",
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          paddingTop: "24px",
          borderTop: `1px solid ${pal.border}`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getLogoDataUrl()}
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
          alt="grey-pile-of-shame"
          style={{ objectFit: "contain" }}
        />
        {handle && <div style={{ fontSize: footerSize, color: pal.brandText }}>{`@${handle}`}</div>}
      </div>
    </div>,
    { width: size.width, height: size.height },
  );
}
