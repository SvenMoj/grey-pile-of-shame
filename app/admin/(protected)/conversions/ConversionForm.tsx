import type { Conversion, PaintRow } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/Field";
import { SelectField } from "@/components/SelectField";

const SOURCE_TYPES = [
  { value: "official_chart", label: "Official chart" },
  { value: "community", label: "Community" },
  { value: "hex_derived", label: "Hex-derived" },
] as const;

export default function ConversionForm({
  paints,
  conversion,
  action,
  error,
  submitLabel,
}: {
  paints: PaintRow[];
  conversion?: Conversion;
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  submitLabel: string;
}) {
  return (
    <form action={action} className="max-w-lg space-y-4">
      {conversion && <input type="hidden" name="_id" value={conversion.id} />}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <SelectField
        label="Paint A"
        name="paint_a_id"
        required
        defaultValue={conversion?.paint_a_id ?? ""}
      >
        <option value="">— select paint —</option>
        {paints.map((p) => (
          <option key={p.id} value={p.id}>
            {p.brand} — {p.name} ({p.id})
          </option>
        ))}
      </SelectField>

      <SelectField
        label="Paint B"
        name="paint_b_id"
        required
        defaultValue={conversion?.paint_b_id ?? ""}
      >
        <option value="">— select paint —</option>
        {paints.map((p) => (
          <option key={p.id} value={p.id}>
            {p.brand} — {p.name} ({p.id})
          </option>
        ))}
      </SelectField>

      <Field
        label="Confidence (0.0 – 1.0)"
        name="confidence"
        type="number"
        required
        min={0}
        max={1}
        step="0.01"
        defaultValue={conversion?.confidence ?? ""}
      />

      <SelectField
        label="Source type"
        name="source_type"
        required
        defaultValue={conversion?.source_type ?? ""}
      >
        <option value="">— select —</option>
        {SOURCE_TYPES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </SelectField>

      <Field
        label="Source URL"
        name="source_url"
        type="url"
        defaultValue={conversion?.source_url ?? ""}
      />

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={conversion?.notes ?? ""} />
      </div>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
