export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeftRight, FlaskConical, FolderOpen, LogOut, Palette, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAdminUserOrRedirect } from "@/lib/admin/auth";
import { signOutAction } from "./actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await getAdminUserOrRedirect();

  return (
    <div className="flex min-h-screen flex-col">
      <nav className="flex items-center gap-1 border-b bg-muted/50 px-6 py-3 text-sm">
        <span className="mr-2 font-semibold">grey-pile-of-shame admin</span>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/projects">
            <FolderOpen />
            Projects
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/recipes/new">
            <FlaskConical />
            Recipes
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/paints">
            <Palette />
            Paints
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/conversions">
            <ArrowLeftRight />
            Conversions
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/import">
            <Upload />
            Import CSV
          </Link>
        </Button>
        <form action={signOutAction} className="ml-auto">
          <Button variant="ghost" size="sm" type="submit">
            <LogOut />
            Log out
          </Button>
        </form>
      </nav>
      <main className="flex-1 px-6 py-6">{children}</main>
    </div>
  );
}
