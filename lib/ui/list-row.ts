import { cn } from "@/lib/utils";

export function listRowClass(isSelected: boolean) {
  return cn(
    "w-full text-left rounded-lg border px-3 py-2.5 transition-colors",
    isSelected
      ? "border-primary bg-primary text-primary-foreground"
      : "border-transparent hover:border-border hover:bg-muted",
  );
}
