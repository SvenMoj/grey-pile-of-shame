"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
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

type Model = { id: string; display_name: string; state: string };

type Props = {
  recipeId: string;
  models: Model[];
  /** IDs of models that already have this recipe applied. */
  appliedModelIds: Set<string>;
};

export function RecipeApplyButton({ recipeId, models, appliedModelIds }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [applying, setApplying] = useState(false);

  if (models.length === 0) return null;

  async function handleApply() {
    if (!selectedModelId) return;
    setApplying(true);
    try {
      const fd = new FormData();
      fd.append("miniatureItemId", selectedModelId);
      fd.append("recipeId", recipeId);
      fd.append("status", "planned");
      const result = await applyRecipeAction(fd);
      if (result.error) throw new Error(result.error);
      toast.success("Recipe applied to model");
      setOpen(false);
      setSelectedModelId("");
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
        <Select value={selectedModelId} onValueChange={setSelectedModelId}>
          <SelectTrigger id="apply-model-select" className="w-full">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.display_name}
                {appliedModelIds.has(m.id) ? " ✓" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!selectedModelId || applying}
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
