"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { looseUnits } from "@/lib/pile/progress";
import type { Army, PileItem, Unit } from "@/lib/pile/types";
import type { useCollection } from "@/lib/hooks/use-collection";
import { ArmySidebar, type SidebarSelection } from "./ArmySidebar";
import { UnitList } from "./UnitList";
import { ModelPanel } from "./ModelPanel";

type Collection = ReturnType<typeof useCollection>;

type DrillLevel = "armies" | "units" | "models";

export function CollectionShell({
  items,
  armies,
  units,
  collection,
}: {
  items: PileItem[];
  armies: Army[];
  units: Unit[];
  collection: Collection;
}) {
  const [sidebarSelection, setSidebarSelection] = useState<SidebarSelection>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [drillLevel, setDrillLevel] = useState<DrillLevel>("armies");

  function visibleUnits(): Unit[] {
    if (!sidebarSelection) return [];
    if (sidebarSelection.type === "army") {
      return units.filter((u) => u.army_id === sidebarSelection.armyId);
    }
    if (sidebarSelection.type === "loose-units") return looseUnits(units);
    return [];
  }

  function selectedArmy(): Army | null {
    if (sidebarSelection?.type === "army") {
      return armies.find((a) => a.id === sidebarSelection.armyId) ?? null;
    }
    return null;
  }

  function selectedUnit(): Unit | null {
    if (!selectedUnitId) return null;
    return units.find((u) => u.id === selectedUnitId) ?? null;
  }

  function isLooseModels(): boolean {
    return sidebarSelection?.type === "loose-models" && selectedUnitId === null;
  }

  function handleSelectSidebar(sel: SidebarSelection) {
    setSidebarSelection(sel);
    setSelectedUnitId(null);
    if (sel) setDrillLevel("units");
  }

  function handleSelectUnit(id: string | null) {
    setSelectedUnitId(id);
    if (id) setDrillLevel("models");
  }

  const showSidebar = drillLevel === "armies";

  const unitPanelUnit = selectedUnit();
  const showModelPanel =
    unitPanelUnit !== null ||
    isLooseModels() ||
    (sidebarSelection?.type === "army" && selectedUnitId !== null);

  return (
    <div>
      {drillLevel !== "armies" && (
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 md:hidden"
          onClick={() => {
            if (drillLevel === "models") setDrillLevel("units");
            else setDrillLevel("armies");
          }}
        >
          <ChevronLeft />
          Back
        </Button>
      )}

      <div className="md:grid md:grid-cols-[16rem_1fr] md:gap-8">
        <div className={showSidebar ? "block" : "hidden md:block"}>
          <ArmySidebar
            armies={armies}
            units={units}
            items={items}
            selection={sidebarSelection}
            onSelect={handleSelectSidebar}
            collection={collection}
          />
        </div>

        <div className={drillLevel !== "armies" ? "block" : "hidden md:block"}>
          {!sidebarSelection ? (
            <div className="hidden pt-8 text-center text-sm text-muted-foreground italic md:block">
              Select an army to see its units and models.
            </div>
          ) : sidebarSelection.type === "loose-models" ? (
            <ModelPanel unit={null} items={items} allUnits={units} collection={collection} />
          ) : (
            <div className="space-y-6 md:grid md:grid-cols-[14rem_1fr] md:gap-6 md:space-y-0">
              <div
                className={
                  drillLevel === "units" || drillLevel === "armies" ? "block" : "hidden md:block"
                }
              >
                <UnitList
                  army={selectedArmy()}
                  units={visibleUnits()}
                  items={items}
                  allArmies={armies}
                  selectedUnitId={selectedUnitId}
                  onSelectUnit={handleSelectUnit}
                  collection={collection}
                />
              </div>
              <div className={drillLevel === "models" ? "block" : "hidden md:block"}>
                {showModelPanel ? (
                  <ModelPanel
                    unit={unitPanelUnit}
                    items={items}
                    allUnits={units}
                    collection={collection}
                  />
                ) : (
                  <p className="hidden pt-8 text-center text-sm text-muted-foreground italic md:block">
                    Select a unit to see its models.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
