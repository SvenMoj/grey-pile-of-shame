import { cn } from "@/lib/utils";

export function listRowClass(isSelected: boolean) {
  return cn(
    "w-full text-left rounded-lg border px-3 py-2.5 transition-all",
    isSelected
      ? "border-primary ring-2 ring-primary bg-primary/5"
      : "border-border bg-muted/40 hover:shadow-sm hover:border-foreground/20",
  );
}

export function rowCardClass() {
  return "rounded-lg border border-border bg-muted/40 px-4 py-3 transition-shadow hover:shadow-sm";
}
