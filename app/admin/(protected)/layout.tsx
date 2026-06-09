export const dynamic = "force-dynamic";

import { getAdminUserOrRedirect } from "@/lib/admin/auth";
import { signOutAction } from "./actions";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await getAdminUserOrRedirect();

  return (
    <div className="flex min-h-screen flex-col">
      <AdminNav signOutAction={signOutAction} />
      <main className="flex-1 px-6 py-6">{children}</main>
    </div>
  );
}
