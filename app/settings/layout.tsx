export const dynamic = "force-dynamic";

import { getUserOrRedirect } from "@/lib/user/auth";
import { SiteHeader } from "@/app/_components/SiteHeader";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await getUserOrRedirect();

  return (
    <>
      <SiteHeader />
      <main className="max-w-lg mx-auto p-6">{children}</main>
    </>
  );
}
