export const dynamic = "force-dynamic";

import { getAdminUserOrRedirect } from "@/lib/admin/auth";
import { SiteHeader } from "@/components/SiteHeader";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  await getAdminUserOrRedirect();

  return (
    <>
      <SiteHeader />
      <main className="max-w-2xl mx-auto p-6">{children}</main>
    </>
  );
}
