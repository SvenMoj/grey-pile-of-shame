import ImportForms from "./ImportForms";

export default function AdminImportPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Import CSV</h1>
      <p className="text-sm text-gray-600">
        Upload a CSV file to bulk-import paints or conversions. Existing rows are upserted (updated
        on conflict). Headers must match table column names exactly.
      </p>
      <div className="text-sm text-gray-600 space-y-1">
        <p>
          <strong>Paints:</strong> required columns: <code>id, brand, name</code>. Optional:{" "}
          <code>
            range, sku_code, hex, lab_l, lab_a, lab_b, size_ml, type, status, version,
            discontinued_date
          </code>
        </p>
        <p>
          <strong>Conversions:</strong> required:{" "}
          <code>paint_a_id, paint_b_id, confidence, source_type</code>. Optional:{" "}
          <code>source_url, notes</code>
        </p>
      </div>
      <ImportForms />
    </div>
  );
}
