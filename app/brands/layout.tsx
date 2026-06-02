import { SiteHeader } from "@/components/SiteHeader";

/** Wraps all /brands/* routes with the standard site header. */
export default function BrandsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
