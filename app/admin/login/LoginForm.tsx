"use client";

import { useActionState } from "react";
import { requestMagicLinkAction } from "./actions";

export default function LoginForm({ urlError }: { urlError?: string }) {
  const [state, action, pending] = useActionState(requestMagicLinkAction, null);

  if (state?.success) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="max-w-sm w-full p-8 border rounded space-y-4">
          <h1 className="text-xl font-semibold">Check your inbox</h1>
          <p className="text-gray-600">{state.message}</p>
        </div>
      </main>
    );
  }

  const errorMsg = state?.message ?? urlError;

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="max-w-sm w-full p-8 border rounded space-y-4">
        <h1 className="text-xl font-semibold">Admin login</h1>
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
  );
}
