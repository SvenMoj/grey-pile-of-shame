"use client";

import { ACHIEVEMENTS } from "@/lib/pile/achievements";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function TrophyShelf({ unlocked }: { unlocked: string[] }) {
  const unlockedSet = new Set(unlocked);
  const earnedCount = ACHIEVEMENTS.filter((a) => unlockedSet.has(a.id)).length;

  return (
    <section>
      <h2 className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Achievements ({earnedCount}/{ACHIEVEMENTS.length})
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ACHIEVEMENTS.map((a) => {
          const earned = unlockedSet.has(a.id);
          return (
            <Card
              key={a.id}
              className={cn(
                "text-center transition-opacity",
                earned ? "opacity-100" : "opacity-30",
              )}
              title={earned ? a.description : `Locked: ${a.description}`}
            >
              <CardContent className="pt-4">
                <div className="mb-1 text-2xl">{a.icon}</div>
                <p className="text-xs leading-tight font-medium">{a.title}</p>
                {earned && (
                  <CardDescription className="mt-0.5 text-xs leading-tight">
                    {a.description}
                  </CardDescription>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
