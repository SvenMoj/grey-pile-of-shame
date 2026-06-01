"use client";

import { ACHIEVEMENTS } from "@/lib/pile/achievements";

export function TrophyShelf({ unlocked }: { unlocked: string[] }) {
  const unlockedSet = new Set(unlocked);
  const earnedCount = ACHIEVEMENTS.filter((a) => unlockedSet.has(a.id)).length;

  return (
    <section>
      <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
        Achievements ({earnedCount}/{ACHIEVEMENTS.length})
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ACHIEVEMENTS.map((a) => {
          const earned = unlockedSet.has(a.id);
          return (
            <div
              key={a.id}
              className={`border rounded-lg p-3 text-center transition-opacity ${
                earned ? "opacity-100" : "opacity-30"
              }`}
              title={earned ? a.description : `Locked: ${a.description}`}
            >
              <div className="text-2xl mb-1">{a.icon}</div>
              <p className="text-xs font-medium leading-tight">{a.title}</p>
              {earned && (
                <p className="text-xs text-gray-500 mt-0.5 leading-tight">{a.description}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
