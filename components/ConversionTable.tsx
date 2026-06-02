import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaintSwatch } from "@/components/PaintSwatch";
import type { PublicConversion } from "@/lib/conversions/brand-pairs";

const SOURCE_LABELS: Record<string, string> = {
  official_chart: "Official",
  community: "Community",
  hex_derived: "Color match",
};

const SOURCE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  official_chart: "default",
  community: "secondary",
  hex_derived: "outline",
};

type Props = {
  conversions: PublicConversion[];
  fromBrand: string;
  toBrand: string;
};

/**
 * Tabular display of paint conversions from one brand to another.
 * Uses shadcn/ui table primitives; no client-side JS.
 */
export function ConversionTable({ conversions, fromBrand, toBrand }: Props) {
  if (conversions.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        No conversions found between {fromBrand} and {toBrand}.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[240px]">{fromBrand}</TableHead>
            <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">
              Range
            </TableHead>
            <TableHead className="w-[240px]">{toBrand}</TableHead>
            <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">
              Range
            </TableHead>
            <TableHead className="w-24 text-right">Match</TableHead>
            <TableHead className="w-28">Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversions.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">
                <PaintSwatch hex={c.paint_a.hex} name={c.paint_a.name} />
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {c.paint_a.range ?? "—"}
              </TableCell>
              <TableCell>
                <PaintSwatch hex={c.paint_b.hex} name={c.paint_b.name} />
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {c.paint_b.range ?? "—"}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {(c.confidence * 100).toFixed(0)}%
              </TableCell>
              <TableCell>
                <Badge variant={SOURCE_VARIANTS[c.source_type] ?? "outline"}>
                  {SOURCE_LABELS[c.source_type] ?? c.source_type}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
