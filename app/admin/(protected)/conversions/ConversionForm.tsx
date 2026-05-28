import type { Conversion, PaintRow } from "@/lib/admin/types";

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
    <form action={action} className="space-y-4 max-w-lg">
      {conversion && <input type="hidden" name="_id" value={conversion.id} />}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div>
        <label className="block text-sm font-medium mb-1">Paint A *</label>
        <select
          name="paint_a_id"
          required
          defaultValue={conversion?.paint_a_id ?? ""}
          className="w-full border rounded px-3 py-2 text-sm"
        >
          <option value="">— select paint —</option>
          {paints.map((p) => (
            <option key={p.id} value={p.id}>
              {p.brand} — {p.name} ({p.id})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Paint B *</label>
        <select
          name="paint_b_id"
          required
          defaultValue={conversion?.paint_b_id ?? ""}
          className="w-full border rounded px-3 py-2 text-sm"
        >
          <option value="">— select paint —</option>
          {paints.map((p) => (
            <option key={p.id} value={p.id}>
              {p.brand} — {p.name} ({p.id})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Confidence * (0.0 – 1.0)
        </label>
        <input
          type="number"
          name="confidence"
          required
          min="0"
          max="1"
          step="0.01"
          defaultValue={conversion?.confidence ?? ""}
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Source type *</label>
        <select
          name="source_type"
          required
          defaultValue={conversion?.source_type ?? ""}
          className="w-full border rounded px-3 py-2 text-sm"
        >
          <option value="">— select —</option>
          {SOURCE_TYPES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Source URL</label>
        <input
          type="url"
          name="source_url"
          defaultValue={conversion?.source_url ?? ""}
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={conversion?.notes ?? ""}
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        className="bg-gray-900 text-white rounded px-4 py-2 text-sm"
      >
        {submitLabel}
      </button>
    </form>
  );
}
