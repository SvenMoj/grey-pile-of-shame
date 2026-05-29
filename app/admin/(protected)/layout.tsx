export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAdminUserOrRedirect } from "@/lib/admin/auth";
import { signOutAction } from "./actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await getAdminUserOrRedirect();

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center gap-4 px-6 py-3 border-b bg-gray-50 text-sm">
        <span className="font-semibold mr-2">grey-pile-of-shame admin</span>
        <Link href="/admin/paints" className="hover:underline">
          Paints
        </Link>
        <Link href="/admin/conversions" className="hover:underline">
          Conversions
        </Link>
        <Link href="/admin/import" className="hover:underline">
          Import CSV
        </Link>
        <form action={signOutAction} className="ml-auto">
          <button type="submit" className="text-gray-500 hover:text-gray-800">
            Log out
          </button>
        </form>
      </nav>
      <main className="flex-1 px-6 py-6">{children}</main>
    </div>
  );
}
