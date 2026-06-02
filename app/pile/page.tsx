"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/SiteHeader";
import { StateLegend } from "@/components/StateLegend";
import { ProgressBar } from "@/components/ProgressBar";
import { usePile } from "@/lib/hooks/use-pile";
import { PILE_STATES } from "@/lib/pile/states";
import { STATE_LABELS } from "@/lib/pile/display";
import { summarizeItems } from "@/lib/pile/progress";
import { PileSection } from "./PileSection";
import { QuickAddForm } from "./QuickAddForm";

export default function PilePage() {
  const { items, loaded, session, add, addMany, advance, update, remove } = usePile();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (loaded && session) router.replace("/collection");
  }, [loaded, session, router]);

  if (!loaded || session) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-2xl p-6">
          <h1 className="mb-6 text-xl font-semibold">My Pile of Shame</h1>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </main>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-2xl p-6">
          <h1 className="mb-6 text-xl font-semibold">My Pile of Shame</h1>
          <div className="space-y-4 py-16 text-center">
            <p className="text-sm text-muted-foreground">Your pile is empty. Time to confess.</p>
            <Button asChild>
              <Link href="/onboarding">Add your pile →</Link>
            </Button>
          </div>
        </main>
      </>
    );
  }

  const byState = Object.fromEntries(
    PILE_STATES.map((s) => [s, items.filter((i) => i.state === s)]),
  ) as Record<(typeof PILE_STATES)[number], typeof items>;

  const summary = summarizeItems(items);
  const showBanner = !session && !bannerDismissed && items.length > 0;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl space-y-6 p-6">
        <Card>
          <CardContent className="space-y-2">
            <h1 className="text-xl font-semibold">My Pile of Shame</h1>
            <ProgressBar summary={summary} />
            <StateLegend />
          </CardContent>
        </Card>

        {showBanner && (
          <Alert>
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>Create a free account to save your pile and sync across devices.</span>
              <div className="flex shrink-0 items-center gap-3">
                <Button variant="link" size="sm" asChild className="h-auto p-0">
                  <Link href="/login">Sign up / log in</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setBannerDismissed(true)}
                  aria-label="Dismiss"
                >
                  <X />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
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
