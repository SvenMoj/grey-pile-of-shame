type Props = {
  hex: string | null;
  /** When provided, rendered as a text label beside the swatch. */
  name?: string;
  /** "sm" = 16×16px, "md" = 24×24px (default). */
  size?: "sm" | "md";
};

/**
 * A coloured square swatch for a single paint.
 * `hex` is stored without the leading `#`; this component prefixes it at render.
 * Renders nothing visible when `hex` is null (no swatch square).
 */
export function PaintSwatch({ hex, name, size = "md" }: Props) {
  const sizeClass = size === "sm" ? "h-4 w-4" : "h-6 w-6";
  return (
    <span className="flex items-center gap-2">
      {hex && (
        <span
          className={`inline-block ${sizeClass} shrink-0 rounded border border-border`}
          style={{ backgroundColor: `#${hex}` }}
          aria-hidden
        />
      )}
      {name && <span>{name}</span>}
    </span>
  );
}
