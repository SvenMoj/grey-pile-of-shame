"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  FolderOpen,
  FlaskConical,
  LogIn,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ModeToggle } from "@/components/ModeToggle";
import { useAuth } from "@/components/auth-provider";
import { signOutAction } from "@/app/settings/actions";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export function SiteHeader() {
  const { user } = useAuth();
  const isAuthed = !!user;
  const isAdmin = !!user && !!ADMIN_EMAIL && user.email === ADMIN_EMAIL;
  const email = user?.email ?? null;
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <header className="flex items-center justify-between gap-4 border-b px-3 py-4 sm:px-6">
      <Link href="/">
        <Image
          src="/grey-pile-of-shame.png"
          alt="Grey Pile of Shame"
          width={2816}
          height={1536}
          className="h-10 w-auto"
          priority
        />
      </Link>

      {/* Desktop nav */}
      <nav className="hidden sm:flex items-center gap-1 text-sm">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <FolderOpen />
            Projects
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/recipes">
            <FlaskConical />
            Recipes
          </Link>
        </Button>

        {isAuthed && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/studio">
              <Camera />
              Studio
            </Link>
          </Button>
        )}

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
              {isAdmin && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/projects">
                      <ShieldCheck />
                      Admin
                    </Link>
                  </DropdownMenuItem>
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

      {/* Mobile: theme toggle + hamburger */}
      <div className="flex items-center gap-1 sm:hidden">
        <ModeToggle />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" aria-label="Open menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <SheetHeader>
              <SheetTitle className="sr-only">Navigation</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 pt-4 text-sm">
              <Button variant="ghost" className="justify-start" asChild>
                <Link href="/" onClick={close}>
                  <FolderOpen />
                  Projects
                </Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild>
                <Link href="/recipes" onClick={close}>
                  <FlaskConical />
                  Recipes
                </Link>
              </Button>

              {isAuthed && (
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/studio" onClick={close}>
                    <Camera />
                    Studio
                  </Link>
                </Button>
              )}

              {isAuthed ? (
                <>
                  {email && (
                    <p className="px-3 py-2 text-xs text-muted-foreground truncate">{email}</p>
                  )}
                  {isAdmin && (
                    <Button variant="ghost" className="justify-start" asChild>
                      <Link href="/admin/projects" onClick={close}>
                        <ShieldCheck />
                        Admin
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link href="/settings" onClick={close}>
                      <Settings />
                      Settings
                    </Link>
                  </Button>
                  <form action={signOutAction} className="w-full">
                    <Button
                      type="submit"
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={close}
                    >
                      <LogOut />
                      Log out
                    </Button>
                  </form>
                </>
              ) : (
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/login" onClick={close}>
                    <LogIn />
                    Sign in
                  </Link>
                </Button>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
