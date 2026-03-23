import { z } from "zod";

export const columnTypeEnum = z.enum([
  "continuous",
  "ordinal",
  "nominal",
  "date",
  "unknown",
]);

export const columnSchemaItem = z.object({
  name: z.string(),
  type: columnTypeEnum,
  stats: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      mean: z.number().optional(),
      std: z.number().optional(),
      missing: z.number().optional(),
      unique: z.number().optional(),
    })
    .optional(),
});

export const createDatasetSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  file_type: z.enum(["csv", "xlsx", "numbers"]),
});

export type ColumnType = z.infer<typeof columnTypeEnum>;
export type ColumnSchemaItem = z.infer<typeof columnSchemaItem>;
export type CreateDatasetInput = z.infer<typeof createDatasetSchema>;

export interface Dataset {
  id: string;
  workspace_id: string;
  name: string;
  file_path: string;
  file_type: string;
  row_count: number;
  column_schema: ColumnSchemaItem[];
  data: Record<string, unknown>[];
  created_at: string;
}
