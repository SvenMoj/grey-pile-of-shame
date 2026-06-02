/**
 * Parses the 34 brand markdown files in data/paints/ into DB-ready paint records.
 *
 * Each file is a GitHub-flavoured Markdown table with either 6 or 7 columns:
 *   6-col (no Code):  Name | Set | R | G | B | Hex
 *   7-col (with Code): Name | Code | Set | R | G | B | Hex
 *
 * The last five cells of every data row are always: Set, R, G, B, Hex.
 *
 * ID convention (must match existing IDs in production):
 *   id = {brand-slug}-{set-slug}-{name-slug}
 *   where slugify(s) = lowercase, drop ' and ., collapse non-[a-z0-9] runs → hyphen, trim hyphens.
 *
 * "Set (discontinued)" rows → strip suffix, set status='discontinued'.
 */

export interface BrandInfo {
  brand: string;
  slug: string;
}

export interface PaintRecord {
  id: string;
  brand: string;
  range: string;
  name: string;
  sku_code: string | null;
  hex: string | null;
  r: number | null;
  g: number | null;
  b: number | null;
  status: "active" | "discontinued";
  type: null;
}

export interface DedupeCollision {
  keptId: string;
  droppedName: string;
  droppedBrand: string;
}

// ─── slugify ─────────────────────────────────────────────────────────────────

/** Convert a display string into a URL-safe hyphen slug. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/'/g, "") // drop apostrophes
    .replace(/\./g, "") // drop dots
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumeric run → single hyphen
    .replace(/^-+|-+$/g, ""); // trim hyphens
}

// ─── hexToRgb ────────────────────────────────────────────────────────────────

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.trim();
  if (!h || h.length < 6) return null;
  const clean = h.replace(/^#/, "");
  const n = parseInt(clean, 16);
  if (isNaN(n)) return null;
  return {
    r: (n >> 16) & 0xff,
    g: (n >> 8) & 0xff,
    b: n & 0xff,
  };
}

// ─── parsePaintMarkdown ───────────────────────────────────────────────────────

const DISCONTINUED_RE = /\s*\(discontinued\)\s*$/i;

/** Extract the 6-char hex from the `#RRGGBB` backtick token in the Hex cell. */
function extractHex(hexCell: string): string | null {
  const m = hexCell.match(/`#([0-9A-Fa-f]{6})`/);
  return m ? m[1].toUpperCase() : null;
}

/**
 * Parse all paint rows from one brand markdown file.
 * Lines that don't start with `|` (headings, images, HTML footer) are skipped.
 * The column-header row (`Name`) and the separator row (`---`) are also skipped.
 */
export function parsePaintMarkdown(content: string, brandInfo: BrandInfo): PaintRecord[] {
  const records: PaintRecord[] = [];

  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line.startsWith("|")) continue;

    // Split on | and trim each cell; strip leading/trailing empty cells.
    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((_, i, arr) => i > 0 && i < arr.length - 1);

    // Skip header row and separator row.
    if (cells[0] === "Name" || /^-+$/.test(cells[0])) continue;

    // Validate minimum 6 cells.
    if (cells.length < 6) continue;

    // Last five cells are always: Set, R, G, B, Hex.
    const hexCell = cells[cells.length - 1];
    const bRaw = cells[cells.length - 2];
    const gRaw = cells[cells.length - 3];
    const rRaw = cells[cells.length - 4];
    const setRaw = cells[cells.length - 5];

    // Code is cells[1] only in 7-col files.
    const hasCode = cells.length === 7;
    const codeRaw = hasCode ? cells[1] : null;

    const name = cells[0];
    // Skip rows with an empty name cell (malformed source data).
    if (!name) continue;

    // Discontinued handling.
    const isDiscontinued = DISCONTINUED_RE.test(setRaw);
    const range = isDiscontinued ? setRaw.replace(DISCONTINUED_RE, "").trim() : setRaw;
    const status: "active" | "discontinued" = isDiscontinued ? "discontinued" : "active";

    // ID.
    const id = `${brandInfo.slug}-${slugify(range)}-${slugify(name)}`;

    // SKU code — treat the literal string "null" as absent.
    const sku_code = codeRaw && codeRaw.toLowerCase() !== "null" && codeRaw !== "" ? codeRaw : null;

    // Hex and RGB.
    const hex = extractHex(hexCell);
    const rNum = parseInt(rRaw, 10);
    const gNum = parseInt(gRaw, 10);
    const bNum = parseInt(bRaw, 10);
    const r = isNaN(rNum) ? null : rNum;
    const g = isNaN(gNum) ? null : gNum;
    const b = isNaN(bNum) ? null : bNum;

    records.push({
      id,
      brand: brandInfo.brand,
      range,
      name,
      sku_code,
      hex,
      r,
      g,
      b,
      status,
      type: null,
    });
  }

  return records;
}

// ─── dedupeById ──────────────────────────────────────────────────────────────

/**
 * Remove duplicate paint records by ID, keeping the first occurrence.
 * Returns the clean list and a log of every dropped collision.
 */
export function dedupeById(records: PaintRecord[]): {
  records: PaintRecord[];
  collisions: DedupeCollision[];
} {
  const seen = new Map<string, PaintRecord>();
  const collisions: DedupeCollision[] = [];

  for (const r of records) {
    if (seen.has(r.id)) {
      collisions.push({ keptId: r.id, droppedName: r.name, droppedBrand: r.brand });
    } else {
      seen.set(r.id, r);
    }
  }

  return { records: [...seen.values()], collisions };
}

// ─── BRAND_MAP ────────────────────────────────────────────────────────────────

/**
 * Maps each markdown filename stem (no extension) to its display brand name
 * and the slug used to build paint IDs.
 *
 * Established brands use their existing production slug so that IDs in the
 * official-conversion dataset continue to resolve. The 25 new brands derive
 * their display name from a human-readable form of the filename.
 */
export const BRAND_MAP: Record<string, BrandInfo> = {
  // ── established (slug must match production IDs) ──
  Citadel_Colour: { brand: "Citadel", slug: "citadel" },
  Army_Painter: { brand: "Army Painter", slug: "army-painter" },
  Vallejo: { brand: "Vallejo", slug: "vallejo" },
  Reaper: { brand: "Reaper", slug: "reaper" },
  Scale75: { brand: "Scale75", slug: "scale75" },
  CoatDArmes: { brand: "Coat d'Arms", slug: "coat-darms" },
  Monument: { brand: "Monument Hobbies", slug: "monument-hobbies" },
  P3: { brand: "Privateer Press", slug: "privateer-press" },
  Foundry: { brand: "Wargames Foundry", slug: "wargames-foundry" },

  // ── new brands ──
  AK: { brand: "AK Interactive", slug: "ak-interactive" },
  AKRC: { brand: "AK Real Colors", slug: "ak-real-colors" },
  Acrilex: { brand: "Acrilex", slug: "acrilex" },
  AppleBarrel: { brand: "Apple Barrel", slug: "apple-barrel" },
  Arteza: { brand: "Arteza", slug: "arteza" },
  Creature: { brand: "Creature Caster", slug: "creature-caster" },
  Duncan: { brand: "Duncan Rhodes", slug: "duncan-rhodes" },
  FolkArt: { brand: "Folk Art", slug: "folk-art" },
  Golden: { brand: "Golden", slug: "golden" },
  GreenStuffWorld: { brand: "Green Stuff World", slug: "green-stuff-world" },
  Humbrol: { brand: "Humbrol", slug: "humbrol" },
  Italeri: { brand: "Italeri", slug: "italeri" },
  KimeraKolors: { brand: "Kimera Kolors", slug: "kimera-kolors" },
  Liquitex: { brand: "Liquitex", slug: "liquitex" },
  Mig: { brand: "MIG Productions", slug: "mig-productions" },
  MissionModels: { brand: "Mission Models", slug: "mission-models" },
  MrHobby: { brand: "Mr. Hobby", slug: "mr-hobby" },
  MrPaint: { brand: "Mr. Paint", slug: "mr-paint" },
  Pantone: { brand: "Pantone", slug: "pantone" },
  RAL: { brand: "RAL", slug: "ral" },
  Revell: { brand: "Revell", slug: "revell" },
  Tamiya: { brand: "Tamiya", slug: "tamiya" },
  TomColor: { brand: "Tom Color", slug: "tom-color" },
  TurboDork: { brand: "Turbo Dork", slug: "turbo-dork" },
  Warcolours: { brand: "Warcolours", slug: "warcolours" },
};
