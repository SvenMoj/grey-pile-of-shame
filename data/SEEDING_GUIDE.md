# Paint Data Seeding Guide

Instructions for populating `data/paints.csv` and `data/conversions.csv`. Follow this exactly — the import pipeline is strict and will reject malformed rows.

---

## Task overview

1. Research paint lines and their cross-brand conversions
2. Add every paint as a row in `paints.csv`
3. Add every known conversion pair as a row in `conversions.csv`
4. Both files are append-safe and idempotent — re-running the import upserts on the primary key, so duplicates are harmless

---

## `paints.csv` — column reference

```
id,brand,range,name,sku_code,hex,lab_l,lab_a,lab_b,size_ml,type,status
```

| Column | Required | Format | Notes |
|--------|----------|--------|-------|
| `id` | **yes** | kebab-case text | Primary key. Must be globally unique. Convention: `{brand-slug}-{range-slug}-{name-slug}`. See ID rules below. |
| `brand` | **yes** | text | Human-readable brand name, e.g. `Citadel`, `Vallejo`, `Army Painter` |
| `range` | no | text | Product line within the brand, e.g. `Base`, `Layer`, `Game Color`, `Speedpaint` |
| `name` | **yes** | text | Official paint name exactly as printed on the pot |
| `sku_code` | no | text | Manufacturer's product code (the number on the pot / webshop listing) |
| `hex` | no | 6-char uppercase hex | Color value **without** the `#`. Example: `7C0A02`. Approximate is fine if no official value exists. |
| `lab_l` | no | decimal | CIE L*a*b* lightness (0–100). Leave blank if unknown. |
| `lab_a` | no | decimal | CIE L*a*b* green–red axis. Leave blank if unknown. |
| `lab_b` | no | decimal | CIE L*a*b* blue–yellow axis. Leave blank if unknown. |
| `size_ml` | no | integer | Volume in millilitres (e.g. `12`, `17`, `18`) |
| `type` | no | text | Paint type. See valid values below. |
| `status` | **yes** | enum | `active` or `discontinued` |

### `id` naming rules

- Lowercase, hyphens only — no spaces, underscores, or special characters
- Pattern: `{brand-slug}-{range-slug}-{name-slug}`
- Brand slug examples: `citadel`, `vallejo`, `army-painter`, `scale75`, `reaper`, `ak-interactive`
- Range slug examples: `base`, `layer`, `contrast`, `game-color`, `model-color`, `speedpaint`
- Name slug: replace spaces and punctuation with hyphens, remove apostrophes
- Examples:
  - Citadel Base "Mephiston Red" → `citadel-base-mephiston-red`
  - Vallejo Game Color "Stonewall Grey" → `vallejo-game-color-stonewall-grey`
  - Army Painter Speedpaint "Grim Black" → `army-painter-speedpaint-grim-black`
- If a brand has no distinct ranges, omit the range segment: `reaper-clotted-red`
- IDs must be unique across the entire file — if two brands have paints with the same name, the brand prefix disambiguates them

### Valid `type` values

No hard enum in the DB — use these consistently:

| Value | Meaning |
|-------|---------|
| `base` | High-pigment, opaque coverage |
| `layer` | Semi-transparent, for layering |
| `wash` / `shade` | Thin, flows into recesses |
| `contrast` | One-coat shade+highlight (GW Contrast, AP Speedpaint, etc.) |
| `dry` | Dry-brushing consistency |
| `technical` | Special effect (texture, gloss, etc.) |
| `air` | Airbrush-formulated |
| `ink` | High-flow transparent ink |
| `varnish` | Protective coat |

### Valid `status` values

- `active` — currently in production
- `discontinued` — no longer manufactured (still valuable for historical conversions)

---

## `conversions.csv` — column reference

```
paint_a_id,paint_b_id,confidence,source_type,source_url,notes
```

| Column | Required | Format | Notes |
|--------|----------|--------|-------|
| `paint_a_id` | **yes** | text | Must match an `id` in `paints.csv` |
| `paint_b_id` | **yes** | text | Must match an `id` in `paints.csv`. Must differ from `paint_a_id`. |
| `confidence` | **yes** | decimal 0.0–1.0 | See confidence scale below |
| `source_type` | **yes** | enum | `official_chart`, `community`, or `hex_derived` |
| `source_url` | no | URL | Link to the chart, forum post, or page that backs this conversion |
| `notes` | no | text | Any caveats — "slightly darker", "different finish", "two thin coats needed", etc. |

### Confidence scale

| Value | Meaning |
|-------|---------|
| `1.0` | Officially confirmed identical formulation (rare) |
| `0.9` | Published official conversion chart — direct named substitute |
| `0.8` | Official chart "close match" or well-documented community consensus |
| `0.7` | Widely used community conversion, multiple independent sources agree |
| `0.6` | Single community source, seems credible |
| `0.5` | Hex-derived match (similar color by hex, no curated source) |
| `0.3` | Rough approximation — same hue family, different tone/finish |

When in doubt, round down.

### Valid `source_type` values

| Value | When to use |
|-------|------------|
| `official_chart` | The brand itself published this as a direct substitute (GW transition chart, Vallejo equivalent chart, etc.) |
| `community` | Forum post, YouTube video, Reddit thread, blog — multiple people have validated it |
| `hex_derived` | No curated source; derived purely from hex distance calculation |

### Conversion direction

- Conversions are directional: `paint_a_id → paint_b_id` means "paint_a can be substituted with paint_b"
- For a true two-way substitute, add **two rows** (A→B and B→A)
- Not all conversions are reversible — a Citadel wash may have a Vallejo equivalent, but not vice versa
- When official charts say "X = Y", add both directions with the same confidence

### Hard constraints (enforced by the DB)

- `paint_a_id ≠ paint_b_id` — no self-conversions
- `(paint_a_id, paint_b_id)` is unique — one row per ordered pair
- Both IDs must exist in `paints` before importing conversions (import paints first)

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

## Process

1. **Pick a brand pair** — Start with the most-requested: Citadel ↔ Vallejo Game Color. Then Citadel ↔ Army Painter. Then expand.
2. **Add all paints for both brands first** — `paints.csv` must be complete before conversions can reference them
3. **Work through the official chart** — one row per named conversion, confidence 0.9
4. **Add community conversions** for gaps the official chart doesn't cover
5. **Fill hex values** where you can — even approximate swatches help the future hex-fallback feature
6. **Verify IDs are consistent** — a typo in an `id` in `paints.csv` will cascade to broken foreign keys in `conversions.csv`
7. **Import via admin UI** — go to `/admin/import`, upload `paints.csv` first, then `conversions.csv`. The UI reports row counts and per-row errors.

---

## Example rows

### paints.csv

```csv
id,brand,range,name,sku_code,hex,lab_l,lab_a,lab_b,size_ml,type,status
citadel-base-mephiston-red,Citadel,Base,Mephiston Red,99189950002,7C0A02,,,,12,base,active
citadel-base-abaddon-black,Citadel,Base,Abaddon Black,99189950001,231F20,,,,12,base,active
vallejo-game-color-blood-red,Vallejo,Game Color,Blood Red,72010,BC1919,,,,17,base,active
vallejo-game-color-black,Vallejo,Game Color,Black,72051,1A1A1A,,,,17,base,active
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

- **Wrong ID format** — spaces or uppercase in an `id` will cause the row to be rejected or create duplicate IDs
- **Missing paint before conversion** — always import `paints.csv` before `conversions.csv`
- **Confidence out of range** — must be `0.0` to `1.0` inclusive
- **Wrong `source_type`** — only `official_chart`, `community`, `hex_derived` are accepted
- **Hex with `#`** — store as `7C0A02` not `#7C0A02`
- **Forgetting both directions** — official "X = Y" means two rows, not one
- **Omitting `status`** — it is required; use `active` unless the paint is genuinely discontinued
