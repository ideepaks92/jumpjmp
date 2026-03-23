"use client";

import dynamic from "next/dynamic";
import type { AnalysisConfig } from "@/lib/schemas/analysis";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface ChartRendererProps {
  config: AnalysisConfig;
  data: Record<string, unknown>[];
  width?: number;
  height?: number;
}

function buildTraces(
  config: AnalysisConfig,
  data: Record<string, unknown>[]
): Plotly.Data[] {
  const getCol = (col?: string) =>
    col ? data.map((r) => r[col]) : undefined;

  const x = getCol(config.x_column) as Plotly.Datum[] | undefined;
  const y = getCol(config.y_column) as Plotly.Datum[] | undefined;
  const groupCol = config.group_column;

  if (groupCol) {
    const groups = new Map<string, { x: Plotly.Datum[]; y: Plotly.Datum[] }>();
    data.forEach((row) => {
      const g = String(row[groupCol]);
      if (!groups.has(g)) groups.set(g, { x: [], y: [] });
      const entry = groups.get(g)!;
      if (config.x_column) entry.x.push(row[config.x_column] as Plotly.Datum);
      if (config.y_column) entry.y.push(row[config.y_column] as Plotly.Datum);
    });

    return Array.from(groups.entries()).map(([name, vals]) => {
      const base: Partial<Plotly.Data> = { name };
      switch (config.type) {
        case "scatter":
          return { ...base, x: vals.x, y: vals.y, type: "scatter" as const, mode: "markers" as const };
        case "line":
          return { ...base, x: vals.x, y: vals.y, type: "scatter" as const, mode: "lines" as const };
        case "bar":
          return { ...base, x: vals.x, y: vals.y, type: "bar" as const };
        case "box":
          return { ...base, y: vals.y, type: "box" as const };
        default:
          return { ...base, x: vals.x, y: vals.y, type: "scatter" as const, mode: "markers" as const };
      }
    }) as Plotly.Data[];
  }

  switch (config.type) {
    case "scatter":
      return [{ x, y, type: "scatter", mode: "markers" }] as Plotly.Data[];
    case "line":
      return [{ x, y, type: "scatter", mode: "lines" }] as Plotly.Data[];
    case "bar":
      return [{ x, y, type: "bar" }] as Plotly.Data[];
    case "histogram":
      return [{ x: y ?? x, type: "histogram" }] as Plotly.Data[];
    case "box":
      return [{ y: y ?? x, type: "box" }] as Plotly.Data[];
    case "heatmap":
      return [{ z: [y ?? x], type: "heatmap" }] as Plotly.Data[];
    case "contour":
      return [{ x, y, type: "histogram2dcontour" as Plotly.PlotType }] as Plotly.Data[];
    default:
      return [{ x, y, type: "scatter", mode: "markers" }] as Plotly.Data[];
  }
}

export function ChartRenderer({
  config,
  data,
  width = 600,
  height = 400,
}: ChartRendererProps) {
  const traces = buildTraces(config, data);

  const layout: Partial<Plotly.Layout> = {
    width,
    height,
    margin: { l: 50, r: 20, t: 30, b: 40 },
    xaxis: { title: { text: config.x_column || "" } },
    yaxis: { title: { text: config.y_column || "" } },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { family: "var(--font-geist-sans), system-ui, sans-serif", size: 11 },
    showlegend: !!config.group_column,
  };

  return (
    <Plot
      data={traces}
      layout={layout}
      config={{
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ["lasso2d", "select2d"],
      }}
      className="w-full"
    />
  );
}
