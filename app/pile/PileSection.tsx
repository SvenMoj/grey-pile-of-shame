"use client";

import { isTerminal } from "@/lib/pile/states";
import type { PileItem, PileState } from "@/lib/pile/types";

export function PileSection({
  state,
  label,
  items,
  onAdvance,
  onRemove,
}: {
  state: PileState;
  label: string;
  items: PileItem[];
  onAdvance: (id: string) => Promise<unknown>;
  onRemove: (id: string) => Promise<unknown>;
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
        {label} ({items.length})
      </h2>
      <ul className="divide-y border rounded">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.display_name}</p>
              {(item.game ?? item.faction ?? item.point_value) !== null && (
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {[
                    item.game,
                    item.faction,
                    item.point_value !== null ? `${item.point_value}pts` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isTerminal(state) && (
                <button
                  onClick={() => void onAdvance(item.id)}
                  className="bg-gray-900 text-white rounded px-3 py-1.5 text-xs"
                >
                  Advance →
                </button>
              )}
              <button
                onClick={() => void onRemove(item.id)}
                className="text-xs text-gray-400 hover:text-red-600"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
