"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { usePile } from "@/lib/hooks/use-pile";
import { PILE_STATES } from "@/lib/pile/states";
import { PileSection } from "./PileSection";
import { QuickAddForm } from "./QuickAddForm";

const STATE_LABELS: Record<(typeof PILE_STATES)[number], string> = {
  unbuilt: "Unbuilt",
  built: "Built",
  primed: "Primed",
  in_progress: "In progress",
  painted: "Painted",
};

export default function PilePage() {
  const { items, loaded, session, add, addMany, advance, update, remove } = usePile();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const router = useRouter();

  // Logged-in users get the full hierarchy view instead.
  useEffect(() => {
    if (loaded && session) router.replace("/collection");
  }, [loaded, session, router]);

  if (!loaded || session) {
    return (
      <>
        <SiteHeader />
        <main className="max-w-2xl mx-auto p-6">
          <h1 className="text-xl font-semibold mb-6">My Pile of Shame</h1>
          <p className="text-sm text-gray-400">Loading…</p>
        </main>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <SiteHeader />
        <main className="max-w-2xl mx-auto p-6">
          <h1 className="text-xl font-semibold mb-6">My Pile of Shame</h1>
          <div className="text-center py-16 space-y-4">
            <p className="text-gray-500 text-sm">Your pile is empty. Time to confess.</p>
            <Link
              href="/onboarding"
              className="inline-block bg-gray-900 text-white rounded px-4 py-2 text-sm"
            >
              Add your pile →
            </Link>
          </div>
        </main>
      </>
    );
  }

  const byState = Object.fromEntries(
    PILE_STATES.map((s) => [s, items.filter((i) => i.state === s)]),
  ) as Record<(typeof PILE_STATES)[number], typeof items>;

  const totalUnpainted = items.filter((i) => i.state !== "painted").length;
  const totalPainted = items.filter((i) => i.state === "painted").length;

  const showBanner = !session && !bannerDismissed && items.length > 0;

  return (
    <>
      <SiteHeader />
      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-semibold">My Pile of Shame</h1>
          <p className="text-sm text-gray-500">
            {totalPainted} painted · {totalUnpainted} to go
          </p>
        </div>

        {showBanner && (
          <div className="border rounded px-4 py-3 text-sm flex items-center justify-between gap-4 bg-gray-50">
            <span className="text-gray-700">
              Create a free account to save your pile and sync across devices.
            </span>
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/login" className="font-medium underline whitespace-nowrap">
                Sign up / log in
              </Link>
              <button
                onClick={() => setBannerDismissed(true)}
                aria-label="Dismiss"
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <QuickAddForm onAdd={add} onAddMany={addMany} />

        {PILE_STATES.map((state) => (
          <PileSection
            key={state}
            state={state}
            label={STATE_LABELS[state]}
            items={byState[state]}
            onAdvance={advance}
            onUpdate={update}
            onRemove={remove}
          />
        ))}
      </main>
    </>
  );
}
