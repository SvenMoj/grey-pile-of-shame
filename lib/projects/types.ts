export type ProjectStatus = "draft" | "published";

/** A recipe linked to a project with an area label (skin, armor, base, …). */
export type ProjectRecipeLink = {
  id: string;
  project_id: string;
  recipe_id: string;
  area: string;
  sort_order: number;
  note: string | null;
  created_at: string;
  updated_at: string;
};

/** ProjectRecipeLink joined with recipe title (used on project detail + admin editor). */
export type ProjectRecipeLinkWithTitle = ProjectRecipeLink & {
  recipe: { id: string; title: string };
};

export type ProjectImage = {
  id: string;
  storage_path: string; // kept for Storage object deletion
  image_url: string;
  sort_order: number; // 0 = cover / hero
};

export type Project = {
  id: string;
  author_user_id: string;
  title: string;
  slug: string;
  summary: string | null;
  body: string | null;
  status: ProjectStatus;
  game: string | null;
  faction: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectWithDetail = Project & {
  images: ProjectImage[];
  recipes: ProjectRecipeLinkWithTitle[];
};

/** Lightweight shape for the public feed and admin list. */
export type ProjectListItem = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  status: ProjectStatus;
  game: string | null;
  faction: string | null;
  cover_image_url: string | null;
  published_at: string | null;
};

// ─── Input shapes ─────────────────────────────────────────────────────────────

export type NewProjectInput = {
  title: string;
  slug: string;
  summary?: string | null;
  body?: string | null;
  status?: ProjectStatus;
  game?: string | null;
  faction?: string | null;
};

export type UpdateProjectInput = Partial<NewProjectInput>;

export type NewImageInput = {
  storage_path: string;
  image_url: string;
  sort_order: number;
};
