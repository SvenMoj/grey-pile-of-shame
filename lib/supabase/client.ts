"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

// Use inside "use client" components only.
// The singleton is lazily created so the module is safe to import in any
// client bundle without touching env vars at import time.
let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
  }
  return client;
}
