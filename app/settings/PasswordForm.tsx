"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePasswordAction } from "./actions";

export default function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action, pending] = useActionState(updatePasswordAction, null);

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
        Password
      </h2>
      <Card>
        <CardContent className="space-y-4 pt-6">
          {state?.success && (
            <Alert>
              <AlertDescription>
                {hasPassword ? "Password updated successfully." : "Password set successfully."}
              </AlertDescription>
            </Alert>
          )}
          {state && !state.success && (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          <form action={action} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="settings-password">{hasPassword ? "New password" : "Password"}</Label>
              <Input
                id="settings-password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-confirm">Confirm password</Label>
              <Input
                id="settings-confirm"
                name="confirm"
                type="password"
                required
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : hasPassword ? "Change password" : "Set password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
