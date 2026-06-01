"use client";

import { useState } from "react";
import { isTerminal } from "@/lib/pile/states";
import type { EditPileItem, PileItem, PileState } from "@/lib/pile/types";
import { EditItemForm } from "./EditItemForm";

export function PileSection({
  state,
  label,
  items,
  onAdvance,
  onUpdate,
  onRemove,
}: {
  state: PileState;
  label: string;
  items: PileItem[];
  onAdvance: (id: string) => Promise<unknown>;
  onUpdate: (id: string, patch: EditPileItem) => Promise<unknown>;
  onRemove: (id: string) => Promise<unknown>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  if (items.length === 0) return null;

  return (
    <section>
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center gap-1 w-full text-left mb-2 group"
      >
        <span
          className={`text-gray-400 transition-transform duration-150 ${collapsed ? "-rotate-90" : ""}`}
        >
          ▾
        </span>
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide group-hover:text-gray-700">
          {label} ({items.length})
        </h2>
      </button>
      {collapsed ? null : <ul className="divide-y border rounded">
        {items.map((item) => (
          <li key={item.id}>
            {/* Row */}
            <div className="flex items-center gap-3 px-4 py-3">
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
                  onClick={() => setEditingId((cur) => (cur === item.id ? null : item.id))}
                  className="text-xs text-gray-500 hover:text-gray-800"
                >
                  {editingId === item.id ? "Close" : "Edit"}
                </button>
                <button
                  onClick={() => void onRemove(item.id)}
                  className="text-xs text-gray-400 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Inline edit form */}
            {editingId === item.id && (
              <EditItemForm
                item={item}
                onSave={async (patch) => {
                  await onUpdate(item.id, patch);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            )}
          </li>
        ))}
      </ul>}
    </section>
  );
}
