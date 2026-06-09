"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateInstagramHandleAction } from "./actions";

export default function InstagramHandleForm({ currentHandle }: { currentHandle: string | null }) {
  const [state, action, pending] = useActionState(updateInstagramHandleAction, {
    message: "",
    success: false,
  });

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
        Share Studio
      </h2>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            Your Instagram handle is shown on generated share images. Leave blank to omit it.
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
          <form action={action} className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="instagram_handle">Instagram handle</Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm select-none">
                  @
                </span>
                <Input
                  id="instagram_handle"
                  name="instagram_handle"
                  type="text"
                  placeholder="yourusername"
                  defaultValue={currentHandle ?? ""}
                  className="pl-7"
                  maxLength={30}
                />
              </div>
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
