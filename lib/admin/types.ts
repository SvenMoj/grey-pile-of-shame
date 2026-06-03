export type Paint = {
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
  created_at: string;
  updated_at: string;
};

export type Conversion = {
  id: string;
  paint_a_id: string;
  paint_b_id: string;
  confidence: number;
  source_type: "official_chart" | "community" | "hex_derived" | "transitive";
  source_url: string | null;
  notes: string | null;
  verified_count: number;
  disputed_count: number;
  created_at: string;
  updated_at: string;
};

export type PaintRow = Pick<Paint, "id" | "brand" | "name">;
