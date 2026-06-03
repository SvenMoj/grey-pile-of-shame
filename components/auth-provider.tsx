"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type AuthContextValue = {
  user: User | null;
  isAuthed: boolean;
  /** True while the initial auth check is in flight. */
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Provides the current auth state to the entire client tree.
 * Mount this once in the root layout; all components read it via `useAuth()`.
 *
 * Owns exactly one `auth.getUser()` check and one `onAuthStateChange` subscription
 * for the whole app lifetime — no per-component auth effects needed.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      const {
        data: { user: initialUser },
      } = await supabase.auth.getUser();
      setUser(initialUser ?? null);
      setLoading(false);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      return subscription;
    }

    const subscriptionPromise = init();

    return () => {
      void subscriptionPromise.then((sub) => sub?.unsubscribe());
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthed: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Access the shared auth state. Must be called inside a component that is a
 * descendant of `<AuthProvider>`.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
