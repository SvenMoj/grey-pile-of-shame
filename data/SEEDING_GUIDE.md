# Paint Data Seeding Guide

Instructions for maintaining `data/paints.csv`, `data/conversions.csv`, and the markdown source files in `data/paints/`. Follow this exactly — the import pipeline is strict and will reject malformed rows.

---

## How the catalog is built

The paint catalog has two layers:

1. **Markdown source files** (`data/paints/*.md`) — one file per brand; these are the primary source of truth for ~11 600 paints across 34 brands. Edits to these files are how you add or correct paint data.
2. **CSV files** (`data/paints.csv`, `data/conversions.csv`) — generated artifacts. Do not hand-edit unless you are adding conversions or retaining paints not covered by any markdown file.

### Normal workflow

```
data/paints/*.md  ──┐
data/conversions.csv ┼──► build-catalog-from-markdown.ts ──► data/paints.csv
production DB     ──┘                                          data/conversions.csv (official_chart only)
                                                                       │
                                                                       ▼
                                                           rebuild-catalog-prod.ts  ──► production DB
```

**Step 1 — Rebuild the CSVs from source**

```bash
npx tsx scripts/build-catalog-from-markdown.ts
```

Reads all `data/paints/*.md` files, fetches the current production DB for the retention set (Two Thin Coats, Army Painter Masterclass, and any conversion endpoints not in markdown), merges them, and writes fresh `data/paints.csv` and `data/conversions.csv`.

**Step 2 — Review and apply to production**

```bash
npx tsx scripts/rebuild-catalog-prod.ts
```

Backs up the current DB to `data/backups/`, wipes paints + conversions, then upserts from the two CSVs. Sanity-checks: aborts if fewer than 11 000 paints or 700 official conversions survive.

**Incremental update only (no full wipe)**

```bash
npx tsx scripts/seed-from-csv.ts
```

Upserts from both CSVs without touching rows that aren't in the files. Use when you've added new community conversions or want to apply a small correction without a full rebuild.

---

## Adding or correcting paint data

### Brands covered by a markdown file

Edit the relevant file in `data/paints/`. Each file is a GitHub-flavoured Markdown table:

```
# Brand Name
![Brand_Name](../logos/Brand_Name.png "Brand_Name")

|Name|Set|R|G|B|Hex|
|---|---|---|---|---|---|
|Mephiston Red|Base|124|10|2|![#7C0A02](https://placehold.co/15x15/7C0A02/7C0A02.png) `#7C0A02`|
```

Some brands include a `Code` column between `Name` and `Set` (7-column format). The parser accepts both formats automatically.

- **Set (discontinued)** suffix marks the paint as `status='discontinued'`; the suffix is stripped from the range name.
- IDs are derived automatically: `{brand-slug}-{set-slug}-{name-slug}`. Do not change IDs without also updating every conversion row that references them.

To add a new brand:

1. Create `data/paints/BrandName.md` following the format above.
2. Add an entry to `BRAND_MAP` in `lib/seed/parse-paint-markdown.ts`.
3. Run `build-catalog-from-markdown.ts` then `rebuild-catalog-prod.ts`.

### Brands without a markdown file

These paints live only in the production DB and are preserved by the retention logic in `build-catalog-from-markdown.ts`. To add or edit them, update `data/paints.csv` directly (following the column reference below) and run `seed-from-csv.ts`.

---

## `paints.csv` — column reference

```
id,brand,range,name,sku_code,hex,r,g,b,status,type,lab_l,lab_a,lab_b,size_ml,version
```

| Column     | Required | Format               | Notes                                                                                                          |
| ---------- | -------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| `id`       | **yes**  | kebab-case text      | Primary key. Must be globally unique. Convention: `{brand-slug}-{range-slug}-{name-slug}`. See ID rules below. |
| `brand`    | **yes**  | text                 | Human-readable brand name, e.g. `Citadel`, `Vallejo`, `Army Painter`                                           |
| `range`    | no       | text                 | Product line within the brand, e.g. `Base`, `Layer`, `Game Color`, `Speedpaint`                                |
| `name`     | **yes**  | text                 | Official paint name exactly as printed on the pot                                                              |
| `sku_code` | no       | text                 | Manufacturer's product code (the number on the pot / webshop listing)                                          |
| `hex`      | no       | 6-char uppercase hex | Color value **without** the `#`. Example: `7C0A02`. Approximate is fine if no official value exists.           |
| `r`        | no       | integer 0–255        | Red channel. Derived from `hex` by the build script; set manually only when `hex` is absent.                   |
| `g`        | no       | integer 0–255        | Green channel.                                                                                                 |
| `b`        | no       | integer 0–255        | Blue channel.                                                                                                  |
| `status`   | **yes**  | enum                 | `active` or `discontinued`                                                                                     |
| `type`     | no       | text                 | Paint type. See valid values below.                                                                            |
| `lab_l`    | no       | decimal              | CIE L*a*b\* lightness (0–100). Leave blank if unknown.                                                         |
| `lab_a`    | no       | decimal              | CIE L*a*b\* green–red axis. Leave blank if unknown.                                                            |
| `lab_b`    | no       | decimal              | CIE L*a*b\* blue–yellow axis. Leave blank if unknown.                                                          |
| `size_ml`  | no       | integer              | Volume in millilitres (e.g. `12`, `17`, `18`)                                                                  |
| `version`  | no       | integer              | Schema version. Default `1`. Leave blank or set to `1` when seeding manually.                                  |

### `id` naming rules

- Lowercase, hyphens only — no spaces, underscores, or special characters
- Pattern: `{brand-slug}-{range-slug}-{name-slug}`
- Brand slug examples: `citadel`, `vallejo`, `army-painter`, `scale75`, `reaper`, `ak-interactive`
- Range slug examples: `base`, `layer`, `contrast`, `game-color`, `model-color`, `speedpaint`
- Name slug: replace spaces and punctuation with hyphens, remove apostrophes and dots
- Examples:
  - Citadel Base "Mephiston Red" → `citadel-base-mephiston-red`
  - Vallejo Game Color "Stonewall Grey" → `vallejo-game-color-stonewall-grey`
  - Army Painter Speedpaint "Grim Black" → `army-painter-speedpaint-grim-black`
- If a brand has no distinct ranges, omit the range segment: `reaper-clotted-red`
- IDs must be unique across the entire file — if two brands have paints with the same name, the brand prefix disambiguates them

### Valid `type` values

No hard enum in the DB — use these consistently:

| Value            | Meaning                                                     |
| ---------------- | ----------------------------------------------------------- |
| `base`           | High-pigment, opaque coverage                               |
| `layer`          | Semi-transparent, for layering                              |
| `wash` / `shade` | Thin, flows into recesses                                   |
| `contrast`       | One-coat shade+highlight (GW Contrast, AP Speedpaint, etc.) |
| `dry`            | Dry-brushing consistency                                    |
| `technical`      | Special effect (texture, gloss, etc.)                       |
| `air`            | Airbrush-formulated                                         |
| `ink`            | High-flow transparent ink                                   |
| `varnish`        | Protective coat                                             |

### Valid `status` values

- `active` — currently in production
- `discontinued` — no longer manufactured (still valuable for historical conversions)

---

## `conversions.csv` — column reference

```
paint_a_id,paint_b_id,confidence,source_type,source_url,notes
```

The CSV export from the DB includes additional columns (`id`, `verified_count`, `disputed_count`, `created_at`, `updated_at`) but these are auto-managed — omit them when seeding manually. The upsert key is `(paint_a_id, paint_b_id)`, so a missing `id` is fine.

| Column        | Required | Format          | Notes                                                                              |
| ------------- | -------- | --------------- | ---------------------------------------------------------------------------------- |
| `paint_a_id`  | **yes**  | text            | Must match an `id` in `paints.csv`                                                 |
| `paint_b_id`  | **yes**  | text            | Must match an `id` in `paints.csv`. Must differ from `paint_a_id`.                 |
| `confidence`  | **yes**  | decimal 0.0–1.0 | See confidence scale below                                                         |
| `source_type` | **yes**  | enum            | `official_chart`, `community`, or `hex_derived`                                    |
| `source_url`  | no       | URL             | Link to the chart, forum post, or page that backs this conversion                  |
| `notes`       | no       | text            | Any caveats — "slightly darker", "different finish", "two thin coats needed", etc. |

### Confidence scale

| Value | Meaning                                                              |
| ----- | -------------------------------------------------------------------- |
| `1.0` | Officially confirmed identical formulation (rare)                    |
| `0.9` | Published official conversion chart — direct named substitute        |
| `0.8` | Official chart "close match" or well-documented community consensus  |
| `0.7` | Widely used community conversion, multiple independent sources agree |
| `0.6` | Single community source, seems credible                              |
| `0.5` | Hex-derived match (similar color by hex, no curated source)          |
| `0.3` | Rough approximation — same hue family, different tone/finish         |

When in doubt, round down.

### Valid `source_type` values

| Value            | When to use                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| `official_chart` | The brand itself published this as a direct substitute (GW transition chart, Vallejo equivalent chart, etc.) |
| `community`      | Forum post, YouTube video, Reddit thread, blog — multiple people have validated it                           |
| `hex_derived`    | No curated source; derived purely from hex distance calculation                                              |

### Conversion direction

- Conversions are directional: `paint_a_id → paint_b_id` means "paint_a can be substituted with paint_b"
- For a true two-way substitute, add **two rows** (A→B and B→A)
- Not all conversions are reversible — a Citadel wash may have a Vallejo equivalent, but not vice versa
- When official charts say "X = Y", add both directions with the same confidence

### Hard constraints (enforced by the DB)

- `paint_a_id ≠ paint_b_id` — no self-conversions
- `(paint_a_id, paint_b_id)` is unique — one row per ordered pair
- Both IDs must exist in `paints` before importing conversions (import paints first)

### What happens to community conversions during a full rebuild

`build-catalog-from-markdown.ts` keeps **only `official_chart` rows** in the output `conversions.csv`. Community and hex-derived rows are dropped from the CSV but remain in the production DB until `rebuild-catalog-prod.ts` wipes and re-seeds. If you need to preserve community conversions through a rebuild, back them up first:

```bash
# Before rebuild-catalog-prod.ts
npx supabase db dump --data-only -t conversions > data/backups/conversions-backup.csv
```

---

## Recommended sources

### Official charts (highest confidence — use `official_chart`)

- **Citadel transition chart** — GW published a full old-to-new range chart when they renamed paints; also a Citadel-to-Vallejo equivalency chart
- **Vallejo equivalency PDFs** — on the Vallejo website, per range
- **Army Painter conversion chart** — on their website, compares to Citadel
- **Scale75** — publishes a Citadel equivalent guide on their blog
- **AK Interactive** — some ranges have official Citadel comparisons

Search: `"{brand} conversion chart PDF"` or `"{brand} equivalent {other brand}"`

### Community sources (use `community`, confidence 0.6–0.8)

- **Reddit r/minipainting** — pinned megathreads, search "paint conversion chart" in the sub
- **Warhammer Forum / Bolter and Chainsword** — long-running threads with community-tested conversions
- **YouTube** — painters who do "switching from Citadel to Vallejo" tutorials often publish spreadsheets
- **The Dipping Sauce / other hobby blogs** — sometimes maintain Google Sheets

### Hex-derived (use `hex_derived`, confidence 0.5)

If no curated source exists for a pair, a hex distance match is still useful. Tools:

- Sample the paint swatch from the brand's website product image
- Use a color-distance calculator (ΔE CIE76 or CIEDE2000) to find the closest match in another brand

---

## Example rows

### paints.csv

```csv
id,brand,range,name,sku_code,hex,r,g,b,status,type,lab_l,lab_a,lab_b,size_ml,version
citadel-base-mephiston-red,Citadel,Base,Mephiston Red,99189950002,7C0A02,124,10,2,active,base,,,,12,1
citadel-base-abaddon-black,Citadel,Base,Abaddon Black,99189950001,231F20,35,31,32,active,base,,,,12,1
vallejo-game-color-blood-red,Vallejo,Game Color,Blood Red,72010,BC1919,188,25,25,active,base,,,,17,1
vallejo-game-color-black,Vallejo,Game Color,Black,72051,1A1A1A,26,26,26,active,base,,,,17,1
```

### conversions.csv

```csv
paint_a_id,paint_b_id,confidence,source_type,source_url,notes
citadel-base-mephiston-red,vallejo-game-color-blood-red,0.9,official_chart,,
vallejo-game-color-blood-red,citadel-base-mephiston-red,0.9,official_chart,,Slightly less saturated
citadel-base-abaddon-black,vallejo-game-color-black,0.95,official_chart,,
vallejo-game-color-black,citadel-base-abaddon-black,0.95,official_chart,,
```

---

## Common mistakes to avoid

- **Editing paints.csv by hand for brands that have a markdown file** — your changes will be overwritten the next time `build-catalog-from-markdown.ts` runs. Edit the markdown file instead.
- **Wrong ID format** — spaces or uppercase in an `id` will cause the row to be rejected or create duplicate IDs
- **Missing paint before conversion** — always ensure paints are seeded before conversions
- **Confidence out of range** — must be `0.0` to `1.0` inclusive
- **Wrong `source_type`** — only `official_chart`, `community`, `hex_derived` are accepted
- **Hex with `#`** — store as `7C0A02` not `#7C0A02`
- **Forgetting both directions** — official "X = Y" means two rows, not one
- **Omitting `status`** — it is required; use `active` unless the paint is genuinely discontinued
- **Running rebuild-catalog-prod.ts without reviewing the CSVs first** — check row counts and spot-check a few brands before applying to production
