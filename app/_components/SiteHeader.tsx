"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { signOutAction } from "@/app/settings/actions";

export function SiteHeader() {
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthed(!!user);

      // Subscribe after the initial fetch to avoid the supabase-js deadlock
      // (concurrent getSession + onAuthStateChange calls).
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthed(!!session);
      });
      return data.subscription;
    }

    const subscriptionPromise = init();

    return () => {
      void subscriptionPromise.then((sub) => sub?.unsubscribe());
    };
  }, []);

  return (
    <header className="px-6 py-4 border-b flex items-center justify-between gap-4">
      <Link href="/pile">
        <Image
          src="/grey-pile-of-shame.png"
          alt="Grey Pile of Shame"
          width={2816}
          height={1536}
          className="h-10 w-auto"
          priority
        />
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/pile" className="text-gray-600 hover:text-gray-900">
          Pile
        </Link>
        <Link href="/collection" className="text-gray-600 hover:text-gray-900">
          Collection
        </Link>
        {isAuthed && (
          <form action={signOutAction}>
            <button type="submit" className="text-gray-500 hover:text-gray-800">
              Log out
            </button>
          </form>
        )}
      </nav>
    </header>
  );
}
