import * as XLSX from "xlsx";
import { inferSchema } from "./column-inference";
import type { ColumnSchemaItem } from "@/lib/schemas/dataset";

export interface ParseResult {
  rows: Record<string, unknown>[];
  columns: ColumnSchemaItem[];
  rowCount: number;
}

export async function parseXLSX(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) {
    throw new Error("Workbook has no sheets.");
  }

  const sheet = workbook.Sheets[firstSheet];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
  });

  if (rows.length === 0) {
    throw new Error("Sheet is empty or has no data rows.");
  }

  const columns = inferSchema(rows);
  return { rows, columns, rowCount: rows.length };
}
