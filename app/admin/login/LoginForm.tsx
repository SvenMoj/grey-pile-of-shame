"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestMagicLinkAction } from "./actions";

export default function LoginForm({ urlError }: { urlError?: string }) {
  const [state, action, pending] = useActionState(requestMagicLinkAction, null);

  if (state?.success) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Check your inbox</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{state.message}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const errorMsg = state?.message ?? urlError;

  return (
    <main className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Admin login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMsg && (
            <Alert variant="destructive">
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}
          <form action={action} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Sending…" : "Send magic link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
