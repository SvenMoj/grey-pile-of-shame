export const dynamic = "force-dynamic";

import { getUserOrRedirect } from "@/lib/user/auth";
import { SiteHeader } from "@/components/SiteHeader";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  await getUserOrRedirect();

  return (
    <>
      <SiteHeader />
      <main className="max-w-2xl mx-auto p-6">{children}</main>
    </>
  );
}
