/**
 * Pure validation helpers for the projects domain.
 * No Supabase imports — safe to import in tests and server actions alike.
 */

import type { ProjectStatus } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProjectErrors = Partial<Record<"title" | "slug" | "status" | "_", string>>;

export type ParsedProject = {
  title: string;
  slug: string;
  summary: string | null;
  body: string | null;
  status: ProjectStatus;
  game: string | null;
  faction: string | null;
};

export type ParsedProjectRecipeLink = {
  recipe_id: string;
  area: string;
  sort_order: number;
  note: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_STATUSES: ProjectStatus[] = ["draft", "published"];

/** Pattern for a valid slug: lowercase alphanumeric and hyphens only. */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ─── slugify ─────────────────────────────────────────────────────────────────

/**
 * Generate a URL-safe slug from a title string.
 * Output is lowercase, hyphen-separated, with special characters removed.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

// ─── validateProjectForm ─────────────────────────────────────────────────────

/**
 * Parses and validates project metadata fields from a FormData submission.
 * Returns { data } on success or { errors } on failure.
 *
 * Form fields:
 *   title      (required, max 200 chars)
 *   slug       (required, lowercase-hyphen format, max 200 chars)
 *   summary    (optional)
 *   body       (optional, markdown narrative)
 *   status     ("draft" | "published", defaults to "draft")
 *   game       (optional)
 *   faction    (optional)
 */
export function validateProjectForm(
  formData: FormData,
): { data: ParsedProject } | { errors: ProjectErrors } {
  const rawTitle = ((formData.get("title") as string) ?? "").trim();
  const rawSlug = ((formData.get("slug") as string) ?? "").trim();
  const rawSummary = ((formData.get("summary") as string) ?? "").trim() || null;
  const rawBody = ((formData.get("body") as string) ?? "").trim() || null;
  const rawStatus = ((formData.get("status") as string) ?? "").trim();
  const rawGame = ((formData.get("game") as string) ?? "").trim() || null;
  const rawFaction = ((formData.get("faction") as string) ?? "").trim() || null;

  const errors: ProjectErrors = {};

  if (!rawTitle) {
    errors.title = "Title is required.";
  } else if (rawTitle.length > 200) {
    errors.title = "Title must be 200 characters or fewer.";
  }

  if (!rawSlug) {
    errors.slug = "Slug is required.";
  } else if (rawSlug.length > 200) {
    errors.slug = "Slug must be 200 characters or fewer.";
  } else if (!SLUG_RE.test(rawSlug)) {
    errors.slug = "Slug may only contain lowercase letters, numbers, and hyphens.";
  }

  const status: ProjectStatus = rawStatus === "" ? "draft" : (rawStatus as ProjectStatus);

  if (rawStatus !== "" && !VALID_STATUSES.includes(status)) {
    errors.status = "Invalid status value.";
  }

  if (Object.keys(errors).length > 0) return { errors };

  return {
    data: {
      title: rawTitle,
      slug: rawSlug,
      summary: rawSummary,
      body: rawBody,
      status: status ?? "draft",
      game: rawGame,
      faction: rawFaction,
    },
  };
}

// ─── parseProjectRecipesPayload ───────────────────────────────────────────────

/**
 * Parses and validates the JSON project_recipes payload from a hidden form field.
 * Each item links a recipe to the project with an area label and sort order.
 */
export function parseProjectRecipesPayload(
  raw: string | null | undefined,
): { data: ParsedProjectRecipeLink[] } | { errors: { _: string } } {
  if (raw == null || raw === "") return { errors: { _: "Project recipes payload is missing." } };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { errors: { _: "Project recipes payload is not valid JSON." } };
  }

  if (!Array.isArray(parsed)) {
    return { errors: { _: "Project recipes payload must be an array." } };
  }

  const links: ParsedProjectRecipeLink[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i] as Record<string, unknown>;

    const recipeId = ((item.recipe_id as string | null | undefined) ?? "").trim();
    if (!recipeId) {
      return { errors: { _: `Item ${i + 1}: recipe_id is required.` } };
    }

    const area = ((item.area as string | null | undefined) ?? "").trim();
    if (!area) {
      return { errors: { _: `Item ${i + 1}: area is required.` } };
    }

    const rawOrder = item.sort_order;
    const sortOrder = rawOrder === undefined || rawOrder === null ? i : Number(rawOrder);

    const note = ((item.note as string | null | undefined) ?? "").trim() || null;

    links.push({ recipe_id: recipeId, area, sort_order: sortOrder, note });
  }

  return { data: links };
}
