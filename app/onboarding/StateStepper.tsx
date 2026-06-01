"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function StateStepper({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{label}</p>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onChange(Math.max(0, value - 1))}
            disabled={value === 0}
            aria-label={`Decrease ${label}`}
          >
            <Minus />
          </Button>
          <span className="w-8 text-center text-sm font-medium tabular-nums">{value}</span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onChange(value + 1)}
            aria-label={`Increase ${label}`}
          >
            <Plus />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
