export const dynamic = "force-dynamic";

import { getUserOrRedirect } from "@/lib/user/auth";
import { SiteHeader } from "@/components/SiteHeader";

export default async function CollectionLayout({ children }: { children: React.ReactNode }) {
  await getUserOrRedirect();

  return (
    <>
      <SiteHeader />
      <main className="max-w-5xl mx-auto p-4 md:p-6">{children}</main>
    </>
  );
}
