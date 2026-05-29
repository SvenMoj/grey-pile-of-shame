/**
 * Transforms a raw CSV row (all values are strings) into a DB-ready record.
 * Empty strings become null; keys listed in integerKeys are parsed as integers;
 * keys listed in numericKeys are parsed as floats; all other values pass through.
 */
export function sanitizeRow(
  row: Record<string, string>,
  numericKeys: string[] = [],
  integerKeys: string[] = [],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === "") {
      out[key] = null;
    } else if (integerKeys.includes(key)) {
      out[key] = parseInt(value, 10);
    } else if (numericKeys.includes(key)) {
      out[key] = parseFloat(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}
