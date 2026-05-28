import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Server-only. Never import this file from a client component.
// Bypasses RLS — use only in admin routes and seed scripts.

let _client: SupabaseClient<Database> | null = null;

function get(): SupabaseClient<Database> {
  if (_client) return _client;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for admin operations",
    );
  }
  _client = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  return _client;
}

export const adminClient = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop: string | symbol) {
    return Reflect.get(get(), prop);
  },
});
