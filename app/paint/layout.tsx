import { SiteHeader } from "@/components/SiteHeader";

/** Wraps all /paint/* routes with the standard site header. */
export default function PaintLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
