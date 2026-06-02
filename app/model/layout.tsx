import { SiteHeader } from "@/components/SiteHeader";

/** Wraps all /model/* routes with the standard site header. */
export default function ModelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-8">{children}</main>
    </>
  );
}
