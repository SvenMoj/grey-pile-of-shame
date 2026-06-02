"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Brush, Layers, Library, LogIn, LogOut, Palette, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/ModeToggle";
import { createClient } from "@/lib/supabase/client";
import { signOutAction } from "@/app/settings/actions";

export function SiteHeader() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthed(!!user);
      setEmail(user?.email ?? null);

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthed(!!session);
        setEmail(session?.user?.email ?? null);
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
        {!isAuthed && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pile">
              <Layers />
              Pile
            </Link>
          </Button>
        )}
        <Button variant="ghost" size="sm" asChild>
          <Link href="/collection">
            <Library />
            Collection
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/brands">
            <Brush />
            Brands
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/convert">
            <Palette />
            Convert
          </Link>
        </Button>
        {isAuthed ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <User />
                <span className="sr-only">Account menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {email && (
                <>
                  <DropdownMenuLabel className="font-normal text-muted-foreground truncate max-w-48">
                    {email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action={signOutAction} className="w-full">
                  <button type="submit" className="flex w-full items-center gap-2">
                    <LogOut />
                    Log out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">
              <LogIn />
              Sign in
            </Link>
          </Button>
        )}
        <ModeToggle />
      </nav>
    </header>
  );
}
