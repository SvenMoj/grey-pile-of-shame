"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Layers, Library, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <header className="flex items-center justify-between gap-4 border-b px-6 py-4">
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
      <nav className="flex items-center gap-1 text-sm">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/pile">
            <Layers />
            Pile
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/collection">
            <Library />
            Collection
          </Link>
        </Button>
        {isAuthed && (
          <form action={signOutAction}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut />
              Log out
            </Button>
          </form>
        )}
      </nav>
    </header>
  );
}
