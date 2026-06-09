/**
 * Load the site logo as a base64 data URL for embedding in Satori / ImageResponse.
 *
 * Satori cannot resolve relative /public paths, so we read the file from disk and
 * encode it inline. Module-level caching avoids re-reading on every request.
 *
 * Only called from Node.js route handlers (not Edge runtime).
 */

import { readFileSync } from "fs";
import { join } from "path";

let cachedDataUrl: string | null = null;

export function getLogoDataUrl(): string {
  if (!cachedDataUrl) {
    const buf = readFileSync(join(process.cwd(), "public", "grey-pile-of-shame.png"));
    cachedDataUrl = `data:image/png;base64,${buf.toString("base64")}`;
  }
  return cachedDataUrl;
}

// grey-pile-of-shame.png is 1536×1024 (1.5:1). At logoHeight px tall the logo is:
export const LOGO_HEIGHT = 32;
export const LOGO_WIDTH = Math.round(LOGO_HEIGHT * (1536 / 1024)); // 48
