export type PaintErrors = Partial<
  Record<
    "id" | "brand" | "name" | "hex" | "lab_l" | "lab_a" | "lab_b" | "size_ml" | "confidence" | "_",
    string
  >
>;

export type ParsedPaint = {
  id: string;
  brand: string;
  range: string | null;
  name: string;
  sku_code: string | null;
  hex: string | null;
  lab_l: number | null;
  lab_a: number | null;
  lab_b: number | null;
  size_ml: number | null;
  type: string | null;
  status: "active" | "discontinued";
  version: number;
  discontinued_date: string | null;
};

export type ParsedConversion = {
  paint_a_id: string;
  paint_b_id: string;
  confidence: number;
  source_type: "official_chart" | "community" | "hex_derived";
  source_url: string | null;
  notes: string | null;
};

export function parsePaintForm(
  formData: FormData,
): { data: ParsedPaint } | { errors: PaintErrors } {
  const str = (key: string) => ((formData.get(key) as string) ?? "").trim() || null;
  const id = ((formData.get("id") as string) ?? "").trim().toLowerCase();
  const brand = ((formData.get("brand") as string) ?? "").trim();
  const name = ((formData.get("name") as string) ?? "").trim();
  const hex = ((formData.get("hex") as string) ?? "").trim().toUpperCase().replace(/^#/, "");
  const lab_l = (formData.get("lab_l") as string)?.trim();
  const lab_a = (formData.get("lab_a") as string)?.trim();
  const lab_b = (formData.get("lab_b") as string)?.trim();
  const size_ml = (formData.get("size_ml") as string)?.trim();
  const status = (formData.get("status") as string)?.trim();
  const version = parseInt((formData.get("version") as string)?.trim() || "1");
  const discontinued_date = (formData.get("discontinued_date") as string)?.trim() || null;

  const errors: PaintErrors = {};
  if (!id) errors.id = "ID is required";
  else if (!/^[a-z0-9-]+$/.test(id))
    errors.id = "ID must be lowercase letters, numbers, hyphens only";
  if (!brand) errors.brand = "Brand is required";
  if (!name) errors.name = "Name is required";
  if (hex && !/^[0-9A-F]{6}$/.test(hex)) errors.hex = "Hex must be exactly 6 hex characters (no #)";
  if (lab_l && isNaN(parseFloat(lab_l))) errors.lab_l = "Must be a number";
  if (lab_a && isNaN(parseFloat(lab_a))) errors.lab_a = "Must be a number";
  if (lab_b && isNaN(parseFloat(lab_b))) errors.lab_b = "Must be a number";
  if (size_ml && isNaN(parseInt(size_ml))) errors.size_ml = "Must be an integer";

  if (Object.keys(errors).length > 0) return { errors };

  return {
    data: {
      id,
      brand,
      range: str("range"),
      name,
      sku_code: str("sku_code"),
      hex: hex || null,
      lab_l: lab_l ? parseFloat(lab_l) : null,
      lab_a: lab_a ? parseFloat(lab_a) : null,
      lab_b: lab_b ? parseFloat(lab_b) : null,
      size_ml: size_ml ? parseInt(size_ml) : null,
      type: str("type"),
      status: (status as "active" | "discontinued") || "active",
      version: isNaN(version) ? 1 : version,
      discontinued_date: discontinued_date || null,
    },
  };
}

export type ConversionErrors = Partial<
  Record<"paint_a_id" | "paint_b_id" | "confidence" | "source_type" | "_", string>
>;

export function parseConversionForm(
  formData: FormData,
): { data: ParsedConversion } | { errors: ConversionErrors } {
  const paint_a_id = ((formData.get("paint_a_id") as string) ?? "").trim();
  const paint_b_id = ((formData.get("paint_b_id") as string) ?? "").trim();
  const confidence_str = ((formData.get("confidence") as string) ?? "").trim();
  const source_type = ((formData.get("source_type") as string) ?? "").trim();
  const source_url = ((formData.get("source_url") as string) ?? "").trim() || null;
  const notes = ((formData.get("notes") as string) ?? "").trim() || null;

  const errors: ConversionErrors = {};
  if (!paint_a_id) errors.paint_a_id = "Paint A is required";
  if (!paint_b_id) errors.paint_b_id = "Paint B is required";
  if (paint_a_id && paint_b_id && paint_a_id === paint_b_id)
    errors.paint_b_id = "Paint A and Paint B must be different";

  const confidence = parseFloat(confidence_str);
  if (confidence_str === "" || isNaN(confidence)) errors.confidence = "Confidence is required";
  else if (confidence < 0 || confidence > 1)
    errors.confidence = "Confidence must be between 0 and 1";

  const validSourceTypes = ["official_chart", "community", "hex_derived"];
  if (!source_type) errors.source_type = "Source type is required";
  else if (!validSourceTypes.includes(source_type)) errors.source_type = "Invalid source type";

  if (Object.keys(errors).length > 0) return { errors };

  return {
    data: {
      paint_a_id,
      paint_b_id,
      confidence,
      source_type: source_type as "official_chart" | "community" | "hex_derived",
      source_url,
      notes,
    },
  };
}
