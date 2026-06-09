"use client";

import { useState, useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { updateHiddenBrandsAction } from "./actions";

type Props = {
  allBrands: string[];
  hidden: string[];
};

export default function HiddenBrandsForm({ allBrands, hidden: initialHidden }: Props) {
  const [hidden, setHidden] = useState<Set<string>>(new Set(initialHidden));
  const [state, action, pending] = useActionState(updateHiddenBrandsAction, {
    message: "",
    success: false,
  });

  function toggle(brand: string, checked: boolean) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.delete(brand);
      } else {
        next.add(brand);
      }
      return next;
    });
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
        Paint brands
      </h2>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            Toggle off brands you don&apos;t use. Hidden brands won&apos;t appear in paint search
            suggestions or the brand-substitute picker.
          </p>
          {state.success && state.message && (
            <Alert>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          {!state.success && state.message && (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          <form action={action} className="space-y-4">
            {/* Hidden inputs for currently-hidden brands so formData.getAll works */}
            {Array.from(hidden).map((brand) => (
              <input key={brand} type="hidden" name="hidden_brands" value={brand} />
            ))}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {allBrands.map((brand) => {
                const isVisible = !hidden.has(brand);
                return (
                  <div key={brand} className="flex items-center gap-3">
                    <Switch
                      id={`brand-${brand}`}
                      checked={isVisible}
                      onCheckedChange={(checked) => toggle(brand, checked)}
                    />
                    <Label
                      htmlFor={`brand-${brand}`}
                      className={isVisible ? "" : "text-muted-foreground line-through"}
                    >
                      {brand}
                    </Label>
                  </div>
                );
              })}
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
