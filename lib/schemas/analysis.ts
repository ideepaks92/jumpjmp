import { z } from "zod";

export const analysisTypeEnum = z.enum([
  "descriptive",
  "distribution_fit",
  "histogram",
  "scatter",
  "line",
  "bar",
  "box",
  "heatmap",
  "contour",
  "control_chart",
  "process_capability",
  "regression",
  "hypothesis_test",
]);

export const controlChartTypeEnum = z.enum([
  "xbar_r",
  "xbar_s",
  "individuals_mr",
]);

export const distributionTypeEnum = z.enum([
  "normal",
  "weibull",
  "lognormal",
  "exponential",
]);

export const hypothesisTestTypeEnum = z.enum([
  "t_test",
  "anova",
  "chi_square",
]);

export const analysisConfigSchema = z.object({
  type: analysisTypeEnum,
  x_column: z.string().optional(),
  y_column: z.string().optional(),
  group_column: z.string().optional(),
  color_column: z.string().optional(),
  subtype: z.string().optional(),
  params: z.record(z.string(), z.unknown()).optional(),
});

export const createAnalysisSchema = z.object({
  workspace_id: z.string().uuid(),
  dataset_id: z.string().uuid(),
  config: analysisConfigSchema,
  position: z
    .object({
      x: z.number(),
      y: z.number(),
      w: z.number(),
      h: z.number(),
    })
    .optional(),
});

export type AnalysisType = z.infer<typeof analysisTypeEnum>;
export type AnalysisConfig = z.infer<typeof analysisConfigSchema>;
export type CreateAnalysisInput = z.infer<typeof createAnalysisSchema>;

export interface Analysis {
  id: string;
  workspace_id: string;
  dataset_id: string;
  type: string;
  config: AnalysisConfig;
  results: Record<string, unknown> | null;
  position: { x: number; y: number; w: number; h: number } | null;
  created_at: string;
  updated_at: string;
}
