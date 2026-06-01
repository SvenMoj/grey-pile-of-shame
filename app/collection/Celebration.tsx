"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
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

  useEffect(() => {
    if (!newlyUnlocked) {
      firedRef.current = false;
      return;
    }
    if (firedRef.current) return;
    firedRef.current = true;

    const messages = buildMessages(newlyUnlocked);
    if (messages.length === 0) return;

    void import("canvas-confetti").then(({ default: confetti }) => {
      void confetti({
        particleCount: newlyUnlocked.armyCompletedIds.length > 0 ? 200 : 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    });

    for (const msg of messages) {
      toast.success(msg);
    }

    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [newlyUnlocked, onDismiss]);

  return null;
}
