/**
 * Studio image format and theme helpers.
 *
 * All three share-studio route handlers accept `?format=square|portrait`
 * and `?theme=light|dark` query params. This module centralises parsing
 * and maps each combination to its pixel dimensions.
 */

export type StudioFormat = "square" | "portrait";
export type StudioTheme = "light" | "dark";

export interface StudioSize {
  width: number;
  height: number;
}

/** Pixel dimensions for each Instagram-friendly format. */
export const FORMAT_SIZES: Record<StudioFormat, StudioSize> = {
  square: { width: 1080, height: 1080 }, // 1:1
  portrait: { width: 1080, height: 1350 }, // 4:5
};

/** Parse a raw query-param string into a StudioFormat, defaulting to "square". */
export function parseFormat(raw: string | null | undefined): StudioFormat {
  if (raw === "portrait") return "portrait";
  return "square";
}

/** Parse a raw query-param string into a StudioTheme, defaulting to "dark". */
export function parseTheme(raw: string | null | undefined): StudioTheme {
  if (raw === "light") return "light";
  return "dark";
}

/** Palette used in generated images. */
export const THEME_PALETTE = {
  dark: {
    bg: "#0f0f10",
    bgSecondary: "#1a1a1c",
    surface: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.1)",
    text: "#ffffff",
    textMuted: "rgba(255,255,255,0.5)",
    textFaint: "rgba(255,255,255,0.3)",
    brandText: "rgba(255,255,255,0.35)",
  },
  light: {
    bg: "#ffffff",
    bgSecondary: "#f5f5f5",
    surface: "rgba(0,0,0,0.04)",
    border: "rgba(0,0,0,0.1)",
    text: "#0f0f10",
    textMuted: "rgba(0,0,0,0.5)",
    textFaint: "rgba(0,0,0,0.3)",
    brandText: "rgba(0,0,0,0.3)",
  },
} as const;
