import Papa from "papaparse";
import { inferSchema } from "./column-inference";
import type { ColumnSchemaItem } from "@/lib/schemas/dataset";

export interface ParseResult {
  rows: Record<string, unknown>[];
  columns: ColumnSchemaItem[];
  rowCount: number;
}

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete(results) {
        const rows = results.data as Record<string, unknown>[];
        if (rows.length === 0) {
          reject(new Error("CSV file is empty or has no data rows."));
          return;
        }
        const columns = inferSchema(rows);
        resolve({ rows, columns, rowCount: rows.length });
      },
      error(err) {
        reject(new Error(`CSV parse error: ${err.message}`));
      },
    });
  });
}
