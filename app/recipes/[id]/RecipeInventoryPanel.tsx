"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, PackagePlus, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PaintSwatch } from "@/components/PaintSwatch";
import { createClient } from "@/lib/supabase/client";
import { createSupabaseInventoryStore } from "@/lib/inventory/supabase-store";
import type { RecipeStep } from "@/lib/recipes/types";
import type { StepMixStatus } from "@/lib/recipes/cross-reference";

type StepWithStatus = RecipeStep & { status: StepMixStatus };

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

  // Only show steps that have at least one catalog component
  const catalogSteps = steps.filter((s) => s.paints.some((c) => c.paint_id !== null));
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
    <ul className="space-y-4">
      {catalogSteps.map((step) => {
        const { status } = step;
        const rollupLabel =
          status.kind === "owned"
            ? "All covered"
            : status.kind === "partial"
              ? "Partial"
              : status.kind === "missing"
                ? "Missing"
                : null;

        return (
          <li key={step.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Step {step.step_order + 1}</span>
              {rollupLabel && (
                <span
                  className={
                    status.kind === "owned"
                      ? "text-xs text-primary font-medium"
                      : status.kind === "partial"
                        ? "text-xs text-amber-600 dark:text-amber-400 font-medium"
                        : "text-xs text-muted-foreground font-medium"
                  }
                >
                  — {rollupLabel}
                </span>
              )}
            </div>

            <ul className="pl-3 space-y-2 border-l border-border">
              {status.components
                .filter((c) => c.component.paint_id !== null)
                .map((cs, i) => {
                  const paintId = cs.component.paint_id!;
                  const paintName = cs.paint?.name ?? paintId;
                  const paintBrand = cs.paint?.brand;
                  const paintHex = cs.paint?.hex ?? null;

                  return (
                    <li key={i} className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-1.5">
                        <PaintSwatch hex={paintHex} size="sm" />
                        <span className="font-medium">{paintName}</span>
                        {paintBrand && (
                          <span className="text-xs text-muted-foreground">{paintBrand}</span>
                        )}
                      </div>

                      {cs.status.kind === "owned" && (
                        <span className="flex items-center gap-1.5 text-primary pl-6">
                          <CheckCircle2 className="size-4" />
                          In your inventory
                        </span>
                      )}

                      {cs.status.kind === "substitute_owned" && (
                        <span className="flex items-start gap-1.5 text-muted-foreground pl-6">
                          <Star className="size-4 mt-0.5 shrink-0" />
                          <span>
                            You don&apos;t have <strong>{paintName}</strong>, but you have a
                            possible substitute: <strong>{cs.status.substitute.name}</strong> (
                            {cs.status.substitute.brand}) — {Math.round(cs.status.confidence * 100)}
                            % match
                          </span>
                        </span>
                      )}

                      {cs.status.kind === "missing" && (
                        <div className="flex items-center gap-2 pl-6">
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
                    </li>
                  );
                })}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
