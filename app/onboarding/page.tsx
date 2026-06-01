"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/app/_components/SiteHeader";
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
    router.replace("/pile"); // replace so the back button doesn't loop back to onboarding
  }

  return (
    <>
      <SiteHeader />
      <main className="max-w-md mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold">How big is your pile?</h1>
          <p className="text-sm text-gray-500 mt-1">
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

        <button
          onClick={() => void handleAddToPile()}
          disabled={total === 0}
          className="w-full bg-gray-900 text-white rounded px-4 py-2 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {total === 0
            ? "Adjust the counts above to continue"
            : `Add ${total} model${total === 1 ? "" : "s"} to my pile →`}
        </button>
      </main>
    </>
  );
}
