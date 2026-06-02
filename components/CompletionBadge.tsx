import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Consistent completion badge used at every level (model, unit, army).
 */
export function CompletionBadge({ className = "" }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-0.5 border-green-200 bg-green-50 text-green-700", className)}
      aria-label="Complete"
    >
      <Check className="size-3" aria-hidden />
      Done
    </Badge>
  );
}
