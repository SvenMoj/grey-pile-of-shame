export type RecipeStepRole =
  | "basecoat"
  | "layer"
  | "highlight"
  | "edge_highlight"
  | "shade"
  | "drybrush"
  | "glaze"
  | "wash"
  | "other";

export type RecipeVisibility = "private" | "public";

/** Joined catalog paint summary on a step component. */
export type StepPaint = {
  id: string;
  brand: string;
  name: string;
  hex: string | null;
  range: string | null;
};

/** One component in a step's paint mix (catalog paint or custom hex + integer ratio). */
export type RecipeStepComponent = {
  id: string;
  position: number;
  paint_id: string | null;
  hex: string | null;
  /** Positive integer "parts" — 2 means twice as much of this paint in the mix. */
  ratio: number;
  /** Null for hex-only components or when the catalog paint was deleted (on delete set null). */
  paint: StepPaint | null;
};

export type RecipeStep = {
  id: string;
  step_order: number;
  role: RecipeStepRole;
  technique_note: string | null;
  area_note: string | null;
  /** Ordered list of paint mix components (by position). Always at least one. */
  paints: RecipeStepComponent[];
};

export type RecipeImage = {
  id: string;
  storage_path: string; // kept for Storage object deletion
  image_url: string;
  sort_order: number; // 0 = cover
};

export type Recipe = {
  id: string;
  author_user_id: string;
  title: string;
  description: string | null;
  visibility: RecipeVisibility;
  source_type: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
};

export type RecipeWithDetail = Recipe & {
  steps: RecipeStep[];
  images: RecipeImage[];
};

/** Lightweight shape for list pages and search results. */
export type RecipeListItem = {
  id: string;
  title: string;
  visibility: RecipeVisibility;
  author_user_id: string;
  cover_image_url: string | null;
  step_count: number;
};

// ─── Input shapes ────────────────────────────────────────────────────────────

export type NewRecipeInput = {
  title: string;
  description?: string | null;
  visibility?: RecipeVisibility;
  source_type?: string | null;
  source_url?: string | null;
};

export type UpdateRecipeInput = Partial<NewRecipeInput>;

export type NewStepComponentInput = {
  paint_id: string | null;
  hex: string | null;
  ratio: number;
};

export type NewStepInput = {
  step_order: number;
  role: RecipeStepRole;
  paints: NewStepComponentInput[];
  technique_note?: string | null;
  area_note?: string | null;
};

export type NewImageInput = {
  storage_path: string;
  image_url: string;
  sort_order: number;
};
