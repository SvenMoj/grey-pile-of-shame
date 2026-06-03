"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, PackagePlus, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { createSupabaseInventoryStore } from "@/lib/inventory/supabase-store";
import type { RecipeStep } from "@/lib/recipes/types";
import type { StepInventoryStatus } from "@/lib/recipes/cross-reference";

type StepWithStatus = RecipeStep & { status: StepInventoryStatus };

type Props = {
  steps: StepWithStatus[];
  isAuthed: boolean;
};

export function RecipeInventoryPanel({ steps, isAuthed }: Props) {
  const router = useRouter();

  if (!isAuthed) {
    return (
      <p className="text-sm text-muted-foreground">
        <a href="/login" className="underline underline-offset-2 hover:text-foreground">
          Sign in
        </a>{" "}
        to see which of these paints you own.
      </p>
    );
  }

  const catalogSteps = steps.filter((s) => s.target_paint_id !== null);
  if (catalogSteps.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This recipe uses only custom colors — no catalog paint cross-reference available.
      </p>
    );
  }

  async function addToInventory(paintId: string, state: "owned" | "wishlist") {
    try {
      const store = createSupabaseInventoryStore(createClient());
      await store.add({ catalog_paint_id: paintId, state });
      toast.success(state === "owned" ? "Added to inventory" : "Added to wishlist");
      router.refresh();
    } catch {
      toast.error("Could not update inventory");
    }
  }

  return (
    <ul className="space-y-3">
      {catalogSteps.map((step) => {
        const paintId = step.target_paint_id!;
        const paintName = step.paint?.name ?? paintId;
        const { status } = step;

        return (
          <li key={step.id} className="flex flex-col gap-1 text-sm">
            <span className="font-medium">
              Step {step.step_order + 1} — {paintName}
            </span>

            {status.kind === "owned" && (
              <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <CheckCircle2 className="size-4" />
                In your inventory
              </span>
            )}

            {status.kind === "substitute_owned" && (
              <span className="flex items-start gap-1.5 text-amber-600 dark:text-amber-400">
                <Star className="size-4 mt-0.5 shrink-0" />
                <span>
                  You don&apos;t have <strong>{paintName}</strong>, but you have a possible
                  substitute in your inventory: <strong>{status.substitute.name}</strong> (
                  {status.substitute.brand}) — {Math.round(status.confidence * 100)}% match
                </span>
              </span>
            )}

            {status.kind === "missing" && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Not in inventory</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => void addToInventory(paintId, "owned")}
                >
                  <PackagePlus className="size-3" />
                  Add to inventory
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => void addToInventory(paintId, "wishlist")}
                >
                  Wishlist
                </Button>
              </div>
            )}

            {status.kind === "no_catalog_paint" && (
              <span className="text-muted-foreground text-xs">Custom color — no catalog match</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
