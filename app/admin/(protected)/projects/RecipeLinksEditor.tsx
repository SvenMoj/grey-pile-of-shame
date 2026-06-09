"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RecipeListItem } from "@/lib/recipes/types";
import type { ProjectRecipeLinkWithTitle } from "@/lib/projects/types";

/** Local shape — merges saved links + unsaved additions. */
export type LocalRecipeLink = {
  /** Temp UUID for UI keying; matches DB id for saved rows. */
  id: string;
  recipe_id: string;
  recipe_title: string;
  area: string;
  sort_order: number;
  note: string | null;
};

/** The JSON shape sent to the hidden form field. */
export type RecipeLinkPayload = {
  recipe_id: string;
  area: string;
  sort_order: number;
  note: string | null;
};

type Props = {
  /** Available recipes from the admin's library. */
  availableRecipes: RecipeListItem[];
  /** Initial links (populated in edit mode). */
  initialLinks?: ProjectRecipeLinkWithTitle[];
  /** Called with the updated list so the parent can serialise to hidden input. */
  onChange: (links: LocalRecipeLink[]) => void;
};

export function savedToLocal(links: ProjectRecipeLinkWithTitle[]): LocalRecipeLink[] {
  return links.map((l) => ({
    id: l.id,
    recipe_id: l.recipe_id,
    recipe_title: l.recipe.title,
    area: l.area,
    sort_order: l.sort_order,
    note: l.note,
  }));
}

/**
 * Per-area recipe picker for the project editor.
 * Renders the linked recipes as an ordered list; lets the admin add new
 * links (pick recipe + area), reorder, and remove them.
 *
 * State serialises to a JSON payload via a hidden input; the server action
 * reads the hidden field and atomically replaces all project_recipes rows.
 */
export function RecipeLinksEditor({ availableRecipes, initialLinks = [], onChange }: Props) {
  const [links, setLinks] = useState<LocalRecipeLink[]>(savedToLocal(initialLinks));
  const [newRecipeId, setNewRecipeId] = useState("");
  const [newArea, setNewArea] = useState("");
  const [newNote, setNewNote] = useState("");

  function notify(next: LocalRecipeLink[]) {
    const reordered = next.map((l, idx) => ({ ...l, sort_order: idx }));
    setLinks(reordered);
    onChange(reordered);
  }

  function handleAdd() {
    if (!newRecipeId || !newArea.trim()) return;
    const recipe = availableRecipes.find((r) => r.id === newRecipeId);
    if (!recipe) return;

    const link: LocalRecipeLink = {
      id: crypto.randomUUID(),
      recipe_id: newRecipeId,
      recipe_title: recipe.title,
      area: newArea.trim(),
      sort_order: links.length,
      note: newNote.trim() || null,
    };
    notify([...links, link]);
    setNewRecipeId("");
    setNewArea("");
    setNewNote("");
  }

  function handleRemove(id: string) {
    notify(links.filter((l) => l.id !== id));
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const next = [...links];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    notify(next);
  }

  function handleMoveDown(index: number) {
    if (index === links.length - 1) return;
    const next = [...links];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    notify(next);
  }

  return (
    <div className="space-y-4">
      {/* Existing links */}
      {links.length > 0 && (
        <ul className="space-y-2">
          {links.map((link, index) => (
            <li
              key={link.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
            >
              <GripVertical className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{link.recipe_title}</p>
                <p className="text-xs text-muted-foreground">
                  Area: <span className="font-mono">{link.area}</span>
                  {link.note && <> · {link.note}</>}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  aria-label="Move up"
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === links.length - 1}
                  aria-label="Move down"
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  onClick={() => handleRemove(link.id)}
                  aria-label="Remove recipe link"
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add new link */}
      <div className="rounded-lg border border-dashed border-border p-3 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Add recipe
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="new-recipe-pick" className="text-xs">
              Recipe
            </Label>
            <select
              id="new-recipe-pick"
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={newRecipeId}
              onChange={(e) => setNewRecipeId(e.target.value)}
            >
              <option value="">— select a recipe —</option>
              {availableRecipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                  {r.visibility === "private" ? " (private)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="new-recipe-area" className="text-xs">
              Area
            </Label>
            <Input
              id="new-recipe-area"
              placeholder="e.g. armor, skin, base"
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              className="h-9"
              list="area-suggestions"
            />
            <datalist id="area-suggestions">
              {["armor", "skin", "cloth", "base", "weapon", "metallics", "washes", "details"].map(
                (a) => (
                  <option key={a} value={a} />
                ),
              )}
            </datalist>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="new-recipe-note" className="text-xs">
            Note <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="new-recipe-note"
            placeholder="Optional note about this recipe's use in this project"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="h-9"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={!newRecipeId || !newArea.trim()}
        >
          <Plus />
          Add recipe link
        </Button>
      </div>

      {links.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No recipes linked yet. Add recipes above to document how this model was painted.
        </p>
      )}
    </div>
  );
}
