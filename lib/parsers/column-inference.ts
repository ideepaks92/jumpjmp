import type { ColumnType, ColumnSchemaItem } from "@/lib/schemas/dataset";

const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}$/,
  /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
  /^\d{4}\/\d{2}\/\d{2}$/,
  /^\w{3}\s\d{1,2},?\s\d{4}$/,
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/,
];

function isDateString(val: string): boolean {
  return DATE_PATTERNS.some((p) => p.test(val.trim()));
}

function isNumeric(val: string): boolean {
  if (val.trim() === "") return false;
  const n = Number(val);
  return !isNaN(n) && isFinite(n);
}

export function inferColumnType(values: unknown[]): ColumnType {
  const nonEmpty = values.filter(
    (v) => v !== null && v !== undefined && String(v).trim() !== ""
  );
  if (nonEmpty.length === 0) return "unknown";

  const sample = nonEmpty.slice(0, 200);
  const asStrings = sample.map(String);

  const numericCount = asStrings.filter(isNumeric).length;
  if (numericCount / sample.length >= 0.85) return "continuous";

  const dateCount = asStrings.filter(isDateString).length;
  if (dateCount / sample.length >= 0.85) return "date";

  const uniqueRatio = new Set(asStrings).size / sample.length;
  if (uniqueRatio < 0.05 && sample.length > 20) return "ordinal";

  return "nominal";
}

export function computeColumnStats(
  values: unknown[],
  type: ColumnType
): ColumnSchemaItem["stats"] {
  const total = values.length;
  const missing = values.filter(
    (v) => v === null || v === undefined || String(v).trim() === ""
  ).length;

  if (type === "continuous") {
    const nums = values
      .map((v) => Number(v))
      .filter((n) => !isNaN(n) && isFinite(n));
    if (nums.length === 0) return { missing, unique: 0 };

    const sum = nums.reduce((a, b) => a + b, 0);
    const mean = sum / nums.length;
    const variance =
      nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length;

    return {
      min: Math.min(...nums),
      max: Math.max(...nums),
      mean,
      std: Math.sqrt(variance),
      missing,
      unique: new Set(nums).size,
    };
  }

  const unique = new Set(
    values.filter((v) => v !== null && v !== undefined).map(String)
  ).size;
  return { missing, unique };
}

export function inferSchema(
  rows: Record<string, unknown>[]
): ColumnSchemaItem[] {
  if (rows.length === 0) return [];

  const columns = Object.keys(rows[0]);
  return columns.map((name) => {
    const values = rows.map((r) => r[name]);
    const type = inferColumnType(values);
    const stats = computeColumnStats(values, type);
    return { name, type, stats };
  });
}
