import { SiteHeader } from "@/components/SiteHeader";

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <div className="container mx-auto max-w-4xl px-4 py-12">{children}</div>
    </>
  );
}
