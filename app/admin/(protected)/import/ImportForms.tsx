"use client";

import { useActionState } from "react";
import { importPaintsAction, importConversionsAction } from "./actions";
import type { ImportResult } from "./actions";

function ResultBanner({ result }: { result: ImportResult | null }) {
  if (!result) return null;
  if (!result.success)
    return <p className="text-red-600 text-sm">{result.error}</p>;
  return (
    <div className="text-sm space-y-1">
      <p className="text-green-700 font-medium">
        Imported {result.count} row{result.count !== 1 ? "s" : ""}.
        {result.skipped > 0 && ` Skipped ${result.skipped} invalid rows.`}
      </p>
      {result.errors.length > 0 && (
        <ul className="text-yellow-700 list-disc list-inside">
          {result.errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CsvUploadForm({
  action,
  label,
}: {
  action: (prev: ImportResult | null, formData: FormData) => Promise<ImportResult>;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <div className="space-y-3 border rounded p-4 max-w-md">
      <h2 className="font-semibold">{label}</h2>
      <ResultBanner result={state} />
      <form action={formAction} className="space-y-3">
        <input
          type="file"
          name="csv"
          accept=".csv,text/csv"
          required
          className="block text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-gray-900 text-white rounded px-4 py-2 text-sm disabled:opacity-50"
        >
          {pending ? "Importing…" : "Import"}
        </button>
      </form>
    </div>
  );
}

export default function ImportForms() {
  return (
    <div className="space-y-6">
      <CsvUploadForm action={importPaintsAction} label="Import paints CSV" />
      <CsvUploadForm
        action={importConversionsAction}
        label="Import conversions CSV"
      />
    </div>
  );
}
