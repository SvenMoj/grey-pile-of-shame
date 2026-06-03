"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setPasswordAction } from "./actions";

export default function SetPasswordForm() {
  const [state, action, pending] = useActionState(setPasswordAction, null);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Set your password</CardTitle>
        <CardDescription>
          Choose a password to finish setting up your account. You can sign in with it next time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {state && !state.success && (
          <Alert variant="destructive">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}
        <form action={action} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              required
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Saving…" : "Set password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
