"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  ExternalLink,
  FlaskConical,
  FolderOpen,
  LogOut,
  Menu,
  Palette,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "/admin/projects", icon: FolderOpen, label: "Projects" },
  { href: "/admin/recipes", icon: FlaskConical, label: "Recipes" },
  { href: "/admin/paints", icon: Palette, label: "Paints" },
  { href: "/admin/conversions", icon: ArrowLeftRight, label: "Conversions" },
  { href: "/admin/import", icon: Upload, label: "Import CSV" },
];

type Props = {
  signOutAction: () => Promise<void>;
};

export function AdminNav({ signOutAction }: Props) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <nav className="flex items-center gap-1 border-b bg-muted/50 px-6 py-3 text-sm">
      <span className="mr-2 font-semibold">grey-pile-of-shame admin</span>

      {/* Desktop links */}
      <div className="hidden items-center gap-1 md:flex">
        {NAV_LINKS.map(({ href, icon: Icon, label }) => (
          <Button key={href} variant="ghost" size="sm" asChild>
            <Link href={href}>
              <Icon />
              {label}
            </Link>
          </Button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
          <Link href="/">
            <ExternalLink />
            Public view
          </Link>
        </Button>
        <form action={signOutAction} className="hidden md:block">
          <Button variant="ghost" size="sm" type="submit">
            <LogOut />
            Log out
          </Button>
        </form>

        {/* Mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="md:hidden" aria-label="Open menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <SheetHeader>
              <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 pt-4 text-sm">
              {NAV_LINKS.map(({ href, icon: Icon, label }) => (
                <Button key={href} variant="ghost" className="justify-start" asChild>
                  <Link href={href} onClick={close}>
                    <Icon />
                    {label}
                  </Link>
                </Button>
              ))}
              <Button variant="ghost" className="justify-start" asChild>
                <Link href="/" onClick={close}>
                  <ExternalLink />
                  Public view
                </Link>
              </Button>
              <form action={signOutAction}>
                <Button type="submit" variant="ghost" className="w-full justify-start">
                  <LogOut />
                  Log out
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
