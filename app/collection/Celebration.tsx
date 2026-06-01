"use client";

import { useEffect, useRef } from "react";
import type { NewlyUnlocked } from "@/lib/hooks/use-collection";
import { ACHIEVEMENTS } from "@/lib/pile/achievements";

function buildMessages(newlyUnlocked: NewlyUnlocked): string[] {
  const msgs: string[] = [];
  if (newlyUnlocked.modelCompleted) msgs.push("🎨 Model painted!");
  if (newlyUnlocked.unitCompletedIds.length > 0)
    msgs.push(`🛡️ Unit complete! (${newlyUnlocked.unitCompletedIds.length})`);
  if (newlyUnlocked.armyCompletedIds.length > 0) msgs.push(`⚜️ Army complete!`);
  for (const id of newlyUnlocked.achievementIds) {
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (def) msgs.push(`${def.icon} Achievement unlocked: ${def.title}`);
  }
  return msgs;
}

export function Celebration({
  newlyUnlocked,
  onDismiss,
}: {
  newlyUnlocked: NewlyUnlocked | null;
  onDismiss: () => void;
}) {
  const firedRef = useRef(false);
  const messages = newlyUnlocked ? buildMessages(newlyUnlocked) : [];

  useEffect(() => {
    if (!newlyUnlocked) {
      firedRef.current = false;
      return;
    }
    if (firedRef.current) return;
    firedRef.current = true;

    if (messages.length === 0) return;

    // Fire confetti lazily (avoids SSR issues)
    void import("canvas-confetti").then(({ default: confetti }) => {
      void confetti({
        particleCount: newlyUnlocked.armyCompletedIds.length > 0 ? 200 : 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    });

    // Auto-dismiss after 4s
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [newlyUnlocked, onDismiss, messages.length]);

  if (!newlyUnlocked || messages.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {messages.map((msg, i) => (
        <div
          key={i}
          className="bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-lg shadow-lg"
          style={{ animation: "slideUp 0.3s ease-out" }}
        >
          {msg}
        </div>
      ))}
    </div>
  );
}
