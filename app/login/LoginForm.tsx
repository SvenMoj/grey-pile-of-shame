"use client";

import { useActionState } from "react";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestMagicLinkAction } from "./actions";

export default function LoginForm({
  urlError,
  urlMessage,
}: {
  urlError?: string;
  urlMessage?: string;
}) {
  const [state, action, pending] = useActionState(requestMagicLinkAction, null);

  if (state?.success) {
    return (
      <>
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center p-6">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Check your inbox</CardTitle>
              <CardDescription>{state.message}</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </>
    );
  }

  const errorMsg = state?.message ?? urlError;
  const infoMsg = urlMessage;

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Save your pile</CardTitle>
            <CardDescription>
              Enter your email — we&apos;ll send a magic link. No password needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {infoMsg && (
              <Alert>
                <AlertDescription>{infoMsg}</AlertDescription>
              </Alert>
            )}
            {errorMsg && (
              <Alert variant="destructive">
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}
            <form action={action} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </div>
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Sending…" : "Send magic link"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
