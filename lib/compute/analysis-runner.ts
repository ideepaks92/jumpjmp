import {
  descriptiveStats,
  individualsChart,
  xbarRChart,
  processCapability,
  linearRegression,
  tTest,
  oneWayAnova,
  type DescriptiveResult,
  type ControlChartResult,
  type ProcessCapabilityResult,
  type RegressionResult,
  type HypothesisTestResult,
} from "./native-stats";
import { runCompute, isPyodideLoaded, ensurePyodide } from "./pyodide-bridge";
import type { AnalysisConfig } from "@/lib/schemas/analysis";

export type AnalysisResult =
  | { type: "descriptive"; data: DescriptiveResult }
  | { type: "control_chart"; data: ControlChartResult; subChart?: ControlChartResult }
  | { type: "process_capability"; data: ProcessCapabilityResult }
  | { type: "regression"; data: RegressionResult }
  | { type: "hypothesis_test"; data: HypothesisTestResult }
  | { type: "distribution_fit"; data: Record<string, unknown> }
  | { type: "chart"; data: { x: unknown[]; y: unknown[]; groups?: unknown[] } }
  | { type: "error"; message: string };

export async function runAnalysis(
  config: AnalysisConfig,
  dataset: Record<string, unknown>[],
  onProgress?: (msg: string) => void
): Promise<AnalysisResult> {
  try {
    const getCol = (col: string | undefined) =>
      col ? dataset.map((r) => r[col]) : [];

    switch (config.type) {
      case "descriptive": {
        const values = getCol(config.y_column || config.x_column);
        return { type: "descriptive", data: descriptiveStats(values) };
      }

      case "control_chart": {
        const values = getCol(config.y_column || config.x_column);
        const subtype = config.subtype || "individuals_mr";

        if (subtype === "xbar_r" || subtype === "xbar_s") {
          const subgroupSize = (config.params?.subgroupSize as number) || 5;
          const result = xbarRChart(values, subgroupSize);
          return { type: "control_chart", data: result.xbar, subChart: result.r };
        }
        return { type: "control_chart", data: individualsChart(values) };
      }

      case "process_capability": {
        const values = getCol(config.y_column || config.x_column);
        const lsl = config.params?.lsl as number;
        const usl = config.params?.usl as number;
        if (lsl === undefined || usl === undefined) {
          return { type: "error", message: "LSL and USL are required for process capability analysis." };
        }
        return { type: "process_capability", data: processCapability(values, lsl, usl) };
      }

      case "regression": {
        const x = getCol(config.x_column);
        const y = getCol(config.y_column);
        return { type: "regression", data: linearRegression(x, y) };
      }

      case "hypothesis_test": {
        const subtype = config.subtype || "t_test";
        if (subtype === "t_test") {
          const groupCol = config.group_column || config.x_column;
          const valueCol = config.y_column;
          if (!groupCol || !valueCol) {
            return { type: "error", message: "Group and value columns required." };
          }
          const groups = new Map<string, number[]>();
          dataset.forEach((row) => {
            const g = String(row[groupCol]);
            const v = Number(row[valueCol]);
            if (!isNaN(v) && isFinite(v)) {
              if (!groups.has(g)) groups.set(g, []);
              groups.get(g)!.push(v);
            }
          });
          const groupEntries = [...groups.entries()];
          if (groupEntries.length < 2) {
            return { type: "error", message: "Need at least 2 groups for t-test." };
          }
          if (groupEntries.length === 2) {
            return {
              type: "hypothesis_test",
              data: tTest(groupEntries[0][1], groupEntries[1][1]),
            };
          }
          return {
            type: "hypothesis_test",
            data: oneWayAnova(
              groupEntries.map(([name, values]) => ({ name, values }))
            ),
          };
        }
        return { type: "error", message: `Unknown test type: ${subtype}` };
      }

      case "distribution_fit": {
        const values = getCol(config.y_column || config.x_column);
        const nums = values.map(Number).filter((n) => !isNaN(n) && isFinite(n));

        onProgress?.("Loading distribution fitting engine...");
        await ensurePyodide(onProgress);

        const response = await runCompute({
          type: "distribution_fit",
          data: { analysisType: "distribution_fit", values: nums },
          params: {},
        });

        if (!response.success) {
          return { type: "error", message: response.error || "Distribution fit failed" };
        }
        return { type: "distribution_fit", data: response.result ?? {} };
      }

      case "scatter":
      case "line":
      case "bar":
      case "histogram":
      case "box":
      case "heatmap":
      case "contour": {
        const x = getCol(config.x_column);
        const y = getCol(config.y_column);
        const groups = config.group_column ? getCol(config.group_column) : undefined;
        return { type: "chart", data: { x, y, groups } };
      }

      default:
        return { type: "error", message: `Unknown analysis type: ${config.type}` };
    }
  } catch (err) {
    return {
      type: "error",
      message: err instanceof Error ? err.message : "Analysis failed",
    };
  }
}
