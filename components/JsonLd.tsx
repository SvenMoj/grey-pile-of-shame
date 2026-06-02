/**
 * Renders a JSON-LD structured data script tag.
 * Accepts any plain object — build it with the typed helpers in
 * lib/conversions/brand-pairs.ts so the shape stays correct.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
