import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Server-only. Uses the publishable key for public catalog reads (paints, conversions).
// Respects RLS — safe for CI builds without SUPABASE_SERVICE_ROLE_KEY.

let _client: SupabaseClient<Database> | null = null;

function get(): SupabaseClient<Database> {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required",
    );
  }
  _client = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}

export const publicClient = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop: string | symbol) {
    return Reflect.get(get(), prop);
  },
});
