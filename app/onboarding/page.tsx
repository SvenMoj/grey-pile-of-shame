"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { Button } from "@/components/ui/button";
import { expandQuickCount } from "@/lib/pile/expand-quick-count";
import { usePile } from "@/lib/hooks/use-pile";
import type { PileState } from "@/lib/pile/types";
import { StateStepper } from "./StateStepper";

const ONBOARDING_STATES: Array<{
  state: PileState;
  label: string;
  description: string;
}> = [
  { state: "unbuilt", label: "Unbuilt", description: "Still in the box" },
  { state: "built", label: "Built", description: "Assembled, not yet primed" },
  { state: "primed", label: "Primed", description: "Ready for paint" },
  { state: "in_progress", label: "Started", description: "Paint on the model" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { addMany } = usePile();

  const [counts, setCounts] = useState<Partial<Record<PileState, number>>>({
    unbuilt: 0,
    built: 0,
    primed: 0,
    in_progress: 0,
  });

  const total = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);

  async function handleAddToPile() {
    if (total === 0) return;
    const items = expandQuickCount(counts);
    await addMany(items);
    router.replace("/pile");
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md space-y-6 p-6">
        <div>
          <h1 className="text-xl font-semibold">How big is your pile?</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Roughly how many models do you have in each stage? You can add details and names later.
          </p>
        </div>

        <div className="space-y-3">
          {ONBOARDING_STATES.map(({ state, label, description }) => (
            <StateStepper
              key={state}
              label={label}
              description={description}
              value={counts[state] ?? 0}
              onChange={(n) => setCounts((c) => ({ ...c, [state]: n }))}
            />
          ))}
        </div>

        <Button onClick={() => void handleAddToPile()} disabled={total === 0} className="w-full">
          {total === 0
            ? "Adjust the counts above to continue"
            : `Add ${total} model${total === 1 ? "" : "s"} to my pile →`}
        </Button>
      </main>
    </>
  );
}
