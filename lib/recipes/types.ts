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
export type RecipeApplicationStatus = "planned" | "in_progress" | "done";

/** Joined paint summary on a step. Null when target_hex-only or the catalog paint was deleted. */
export type StepPaint = {
  id: string;
  brand: string;
  name: string;
  hex: string | null;
  range: string | null;
};

export type RecipeStep = {
  id: string;
  step_order: number;
  role: RecipeStepRole;
  target_paint_id: string | null;
  target_hex: string | null;
  technique_note: string | null;
  area_note: string | null;
  /** Null for hex-only steps or when the catalog paint was deleted (on delete set null). */
  paint: StepPaint | null;
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

export type RecipeApplication = {
  id: string;
  user_id: string;
  miniature_item_id: string;
  recipe_id: string;
  status: RecipeApplicationStatus;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
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

export type NewStepInput = {
  step_order: number;
  role: RecipeStepRole;
  target_paint_id: string | null;
  target_hex: string | null;
  technique_note?: string | null;
  area_note?: string | null;
};

export type NewImageInput = {
  storage_path: string;
  image_url: string;
  sort_order: number;
};
