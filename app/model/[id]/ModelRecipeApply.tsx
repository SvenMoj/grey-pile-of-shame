"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { createSupabaseRecipeApplicationsStore } from "@/lib/recipes/supabase-store";
import type { RecipeListItem } from "@/lib/recipes/types";

type Props = {
  modelId: string;
  recipes: RecipeListItem[];
  /** IDs of recipes already applied to this model. */
  appliedRecipeIds: Set<string>;
};

export function ModelRecipeApply({ modelId, recipes, appliedRecipeIds }: Props) {
  const router = useRouter();
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
      const store = createSupabaseRecipeApplicationsStore(createClient());
      await store.apply(modelId, selectedRecipeId, "planned");
      toast.success("Recipe applied to this model");
      setOpen(false);
      setSelectedRecipeId("");
      router.refresh();
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
        <select
          id="model-recipe-select"
          value={selectedRecipeId}
          onChange={(e) => setSelectedRecipeId(e.target.value)}
          className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="">Select…</option>
          {recipes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
              {appliedRecipeIds.has(r.id) ? " ✓ already applied" : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={!selectedRecipeId || applying}
          onClick={() => void handleApply()}
        >
          {applying ? "Applying…" : "Apply"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
