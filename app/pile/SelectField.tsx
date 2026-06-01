import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SelectField({
  label,
  name,
  defaultValue,
  required,
  className,
  children,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {label}
        {required && " *"}
      </Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
          className,
        )}
      >
        {children}
      </select>
    </div>
  );
}
