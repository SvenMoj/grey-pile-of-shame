import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Field({
  label,
  name,
  required,
  type = "text",
  placeholder,
  defaultValue,
  min,
  max,
  disabled,
  maxLength,
  step,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  defaultValue?: string | number | null;
  min?: number;
  max?: number;
  disabled?: boolean;
  maxLength?: number;
  step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {label}
        {required && " *"}
      </Label>
      <Input
        id={name}
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        min={min}
        max={max}
        disabled={disabled}
        maxLength={maxLength}
        step={step}
      />
    </div>
  );
}
