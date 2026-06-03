"use client";

import { useState, useActionState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestMagicLinkAction, signInWithPasswordAction } from "./actions";

export default function LoginForm({
  urlError,
  urlMessage,
}: {
  urlError?: string;
  urlMessage?: string;
}) {
  const [email, setEmail] = useState("");
  const [passwordState, passwordAction, passwordPending] = useActionState(
    signInWithPasswordAction,
    null,
  );
  const [magicState, magicAction, magicPending] = useActionState(requestMagicLinkAction, null);

  // Show "check your inbox" screen after magic link is sent successfully
  if (magicState?.success) {
    return (
      <>
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center p-6">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Check your inbox</CardTitle>
              <CardDescription>{magicState.message}</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </>
    );
  }

  const errorMsg = passwordState?.message ?? magicState?.message ?? urlError;
  const infoMsg = urlMessage;

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Enter your email and password to continue.</CardDescription>
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

            {/* Primary: password sign-in */}
            <form action={passwordAction} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" disabled={passwordPending || magicPending} className="w-full">
                {passwordPending ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            {/* Secondary: magic link */}
            <form action={magicAction}>
              <input type="hidden" name="email" value={email} />
              <Button
                type="submit"
                variant="ghost"
                disabled={passwordPending || magicPending}
                className="w-full text-muted-foreground"
              >
                {magicPending ? "Sending…" : "Email me a magic link instead"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
