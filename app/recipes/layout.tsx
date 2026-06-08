import { SiteHeader } from "@/components/SiteHeader";

/** Wraps all /recipes/* routes with the standard site header. */
export default function RecipesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
