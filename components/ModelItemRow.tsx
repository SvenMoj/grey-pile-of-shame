import type { PileItem } from "@/lib/pile/types";
import { StatePill } from "@/components/StatePill";

const ADVANCE_SLOT_WIDTH = "w-40";

export function ModelItemRow({
  item,
  advance,
  actions,
}: {
  item: PileItem;
  advance?: React.ReactNode;
  actions: React.ReactNode;
}) {
  const metadata = [
    item.game,
    item.faction,
    item.point_value !== null ? `${item.point_value}pts` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="px-4 py-3">
      <div className="flex gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="truncate text-sm font-medium">
            {item.unit_size > 1 && (
              <span className="mr-1 text-muted-foreground">{item.unit_size}×</span>
            )}
            {item.display_name}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <StatePill state={item.state} />
            {metadata && <p className="truncate text-xs text-muted-foreground">{metadata}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-1">{actions}</div>
        </div>

        <div className={`flex shrink-0 ${ADVANCE_SLOT_WIDTH} justify-end self-start`}>
          {advance}
        </div>
      </div>
    </div>
  );
}

export const modelAdvanceButtonClass = "w-full justify-center gap-1 text-xs";
