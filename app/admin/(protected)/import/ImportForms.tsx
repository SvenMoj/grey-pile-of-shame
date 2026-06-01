"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { importPaintsAction, importConversionsAction } from "./actions";
import type { ImportResult } from "./actions";

function ResultBanner({ result }: { result: ImportResult | null }) {
  if (!result) return null;
  if (!result.success) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{result.error}</AlertDescription>
      </Alert>
    );
  }
  return (
    <Alert>
      <AlertDescription className="space-y-1">
        <p className="font-medium text-foreground">
          Imported {result.count} row{result.count !== 1 ? "s" : ""}.
          {result.skipped > 0 && ` Skipped ${result.skipped} invalid rows.`}
        </p>
        {result.errors.length > 0 && (
          <ul className="list-inside list-disc text-yellow-700">
            {result.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
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
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ResultBanner result={state} />
        <form action={formAction} className="space-y-3">
          <Input type="file" name="csv" accept=".csv,text/csv" required className="text-sm" />
          <Button type="submit" disabled={pending}>
            {pending ? "Importing…" : "Import"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ImportForms() {
  return (
    <div className="space-y-6">
      <CsvUploadForm action={importPaintsAction} label="Import paints CSV" />
      <CsvUploadForm action={importConversionsAction} label="Import conversions CSV" />
    </div>
  );
}
