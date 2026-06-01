"use client";

import { useActionState } from "react";
import { SiteHeader } from "@/app/_components/SiteHeader";
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
          <div className="max-w-sm w-full p-8 border rounded space-y-4">
            <h1 className="text-xl font-semibold">Check your inbox</h1>
            <p className="text-gray-600 text-sm">{state.message}</p>
          </div>
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
        <div className="max-w-sm w-full p-8 border rounded space-y-4">
          <h1 className="text-xl font-semibold">Save your pile</h1>
          <p className="text-sm text-gray-500">
            Enter your email — we&apos;ll send a magic link. No password needed.
          </p>
          {infoMsg && <p className="text-gray-600 text-sm">{infoMsg}</p>}
          {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}
          <form action={action} className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="w-full bg-gray-900 text-white rounded px-4 py-2 text-sm disabled:opacity-50"
            >
              {pending ? "Sending…" : "Send magic link"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
