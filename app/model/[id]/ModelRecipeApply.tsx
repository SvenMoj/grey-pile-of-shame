"use client";

import { useState } from "react";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { applyRecipeAction } from "@/lib/recipes/application-actions";
import type { RecipeListItem } from "@/lib/recipes/types";

type Props = {
  modelId: string;
  recipes: RecipeListItem[];
  /** IDs of recipes already applied to this model. */
  appliedRecipeIds: Set<string>;
};

export function ModelRecipeApply({ modelId, recipes, appliedRecipeIds }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [applying, setApplying] = useState(false);

  if (recipes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No recipes yet.{" "}
        <Link href="/recipes/new" className="underline underline-offset-2 hover:text-foreground">
          Create one
        </Link>
        .
      </p>
    );
  }

  async function handleApply() {
    if (!selectedRecipeId) return;
    setApplying(true);
    try {
      const fd = new FormData();
      fd.append("miniatureItemId", modelId);
      fd.append("recipeId", selectedRecipeId);
      fd.append("status", "planned");
      const result = await applyRecipeAction(fd);
      if (result.error) throw new Error(result.error);
      toast.success("Recipe applied to this model");
      setOpen(false);
      setSelectedRecipeId("");
    } catch {
      toast.error("Could not apply recipe");
    } finally {
      setApplying(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FlaskConical className="size-4" />
        Apply a recipe
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 max-w-sm">
      <div className="space-y-1.5">
        <Label htmlFor="model-recipe-select">Choose a recipe</Label>
        <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
          <SelectTrigger id="model-recipe-select" className="w-full">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {recipes.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.title}
                {appliedRecipeIds.has(r.id) ? " ✓" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!selectedRecipeId || applying}
          onClick={() => void handleApply()}
        >
          {applying ? "Applying…" : "Apply"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
