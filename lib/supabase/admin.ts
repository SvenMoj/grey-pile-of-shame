import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Server-only. Never import this file from a client component.
// Bypasses RLS — use only in admin routes and seed scripts.

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations");
}

export const adminClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
