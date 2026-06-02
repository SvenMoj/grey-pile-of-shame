import { SiteHeader } from "@/components/SiteHeader";

/** Wraps all /convert/* routes with the standard site header. */
export default function ConvertLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
