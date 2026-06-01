import type { Paint } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field } from "@/app/pile/Field";
import { SelectField } from "@/app/pile/SelectField";

const STATUS_OPTIONS = ["active", "discontinued"] as const;
const TYPE_SUGGESTIONS = "base,layer,shade,contrast,technical,dry,air,texture,effect,spray";

export default function PaintForm({
  paint,
  action,
  error,
  submitLabel,
}: {
  paint?: Paint;
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  submitLabel: string;
}) {
  return (
    <form action={action} className="max-w-lg space-y-4">
      {paint && <input type="hidden" name="_id" value={paint.id} />}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Field
        label="ID (slug, e.g. citadel-mephiston-red)"
        name="id"
        required
        defaultValue={paint?.id}
        disabled={!!paint}
      />
      <Field label="Brand" name="brand" required defaultValue={paint?.brand} />
      <Field label="Range" name="range" defaultValue={paint?.range ?? ""} />
      <Field label="Name" name="name" required defaultValue={paint?.name} />
      <Field label="SKU / code" name="sku_code" defaultValue={paint?.sku_code ?? ""} />
      <Field
        label="Hex (6 chars, no #)"
        name="hex"
        defaultValue={paint?.hex ?? ""}
        placeholder="e.g. 7C0A02"
        maxLength={6}
      />

      <div className="grid grid-cols-3 gap-3">
        <Field
          label="LAB L"
          name="lab_l"
          type="number"
          step="0.01"
          defaultValue={paint?.lab_l ?? ""}
        />
        <Field
          label="LAB a"
          name="lab_a"
          type="number"
          step="0.01"
          defaultValue={paint?.lab_a ?? ""}
        />
        <Field
          label="LAB b"
          name="lab_b"
          type="number"
          step="0.01"
          defaultValue={paint?.lab_b ?? ""}
        />
      </div>

      <Field label="Size (ml)" name="size_ml" type="number" defaultValue={paint?.size_ml ?? ""} />
      <Field
        label="Type"
        name="type"
        defaultValue={paint?.type ?? ""}
        placeholder={TYPE_SUGGESTIONS}
      />

      <SelectField label="Status" name="status" defaultValue={paint?.status ?? "active"}>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </SelectField>

      <Field label="Version" name="version" type="number" defaultValue={paint?.version ?? 1} />
      <Field
        label="Discontinued date"
        name="discontinued_date"
        type="date"
        defaultValue={paint?.discontinued_date ?? ""}
      />

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
