"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  setApplicationStatusAction,
  removeApplicationAction,
} from "@/lib/recipes/application-actions";
import type { RecipeApplicationStatus } from "@/lib/recipes/types";
import type { ApplicationWithRecipe } from "@/lib/recipes/queries";

const STATUS_LABELS: Record<RecipeApplicationStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  done: "Done",
};

const STATUS_VARIANTS: Record<RecipeApplicationStatus, "secondary" | "default" | "outline"> = {
  planned: "secondary",
  in_progress: "default",
  done: "outline",
};

type Props = {
  applications: ApplicationWithRecipe[];
  modelId: string;
};

export function AppliedRecipes({ applications: initial, modelId }: Props) {
  const [applications, setApplications] = useState(initial);

  if (applications.length === 0) return null;

  async function handleStatusChange(applicationId: string, status: RecipeApplicationStatus) {
    try {
      const fd = new FormData();
      fd.append("applicationId", applicationId);
      fd.append("status", status);
      fd.append("miniatureItemId", modelId);
      const result = await setApplicationStatusAction(fd);
      if (result.error) throw new Error(result.error);
      setApplications((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status } : a)));
    } catch {
      toast.error("Could not update status");
    }
  }

  async function handleRemove(applicationId: string) {
    try {
      const fd = new FormData();
      fd.append("applicationId", applicationId);
      fd.append("miniatureItemId", modelId);
      const result = await removeApplicationAction(fd);
      if (result.error) throw new Error(result.error);
      setApplications((prev) => prev.filter((a) => a.id !== applicationId));
      toast.success("Recipe removed from model");
    } catch {
      toast.error("Could not remove recipe");
    }
  }

  const ALL_STATUSES: RecipeApplicationStatus[] = ["planned", "in_progress", "done"];

  return (
    <ul className="space-y-3">
      {applications.map((app) => (
        <li key={app.id} className="flex flex-wrap items-center gap-2 text-sm">
          {/* Recipe title → link to recipe detail */}
          <Link
            href={`/recipes/${app.recipe_id}`}
            className="font-medium hover:underline underline-offset-2 flex-1 min-w-0 truncate"
          >
            {app.recipe.title}
          </Link>

          {/* Status cycle buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void handleStatusChange(app.id, s)}
                title={`Mark as ${STATUS_LABELS[s]}`}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                <Badge
                  variant={app.status === s ? STATUS_VARIANTS[s] : "outline"}
                  className={
                    app.status !== s
                      ? "opacity-40 cursor-pointer hover:opacity-70"
                      : "cursor-default"
                  }
                >
                  {STATUS_LABELS[s]}
                </Badge>
              </button>
            ))}
          </div>

          {/* Remove */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => void handleRemove(app.id)}
            aria-label="Remove recipe from model"
          >
            <X className="size-3.5" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
