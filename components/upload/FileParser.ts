import { parseCSV } from "@/lib/parsers/csv-parser";
import { parseXLSX } from "@/lib/parsers/xlsx-parser";
import type { ColumnSchemaItem } from "@/lib/schemas/dataset";

export interface ParsedFile {
  rows: Record<string, unknown>[];
  columns: ColumnSchemaItem[];
  rowCount: number;
  fileName: string;
  fileType: "csv" | "xlsx" | "numbers";
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const fileName = file.name;

  let result;
  let fileType: ParsedFile["fileType"];

  switch (ext) {
    case "csv":
      result = await parseCSV(file);
      fileType = "csv";
      break;
    case "xlsx":
    case "xls":
      result = await parseXLSX(file);
      fileType = "xlsx";
      break;
    case "numbers":
      result = await parseXLSX(file);
      fileType = "numbers";
      break;
    default:
      throw new Error(`Unsupported file extension: .${ext}`);
  }

  return { ...result, fileName, fileType };
}
