"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { createSupabaseRecipeApplicationsStore } from "@/lib/recipes/supabase-store";

type Model = { id: string; display_name: string; state: string };

type Props = {
  recipeId: string;
  models: Model[];
  /** IDs of models that already have this recipe applied. */
  appliedModelIds: Set<string>;
};

export function RecipeApplyButton({ recipeId, models, appliedModelIds }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [applying, setApplying] = useState(false);

  if (models.length === 0) return null;

  async function handleApply() {
    if (!selectedModelId) return;
    setApplying(true);
    try {
      const store = createSupabaseRecipeApplicationsStore(createClient());
      await store.apply(selectedModelId, recipeId, "planned");
      toast.success("Recipe applied to model");
      setOpen(false);
      setSelectedModelId("");
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
        <PlusCircle className="size-4" />
        Apply to a model
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4 max-w-sm">
      <div className="space-y-1.5">
        <Label htmlFor="apply-model-select">Choose a model</Label>
        <select
          id="apply-model-select"
          value={selectedModelId}
          onChange={(e) => setSelectedModelId(e.target.value)}
          className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="">Select…</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.display_name}
              {appliedModelIds.has(m.id) ? " ✓ already applied" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={!selectedModelId || applying}
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
