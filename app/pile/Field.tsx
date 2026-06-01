export function Field({
  label,
  name,
  required,
  type = "text",
  placeholder,
  defaultValue,
  min,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  defaultValue?: string | number;
  min?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label}
        {required && " *"}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        min={min}
        className="w-full border rounded px-3 py-2 text-sm"
      />
    </div>
  );
}
