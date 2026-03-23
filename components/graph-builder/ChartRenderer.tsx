"use client";

import dynamic from "next/dynamic";
import type { AnalysisConfig } from "@/lib/schemas/analysis";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface ChartRendererProps {
  config: AnalysisConfig;
  data: Record<string, unknown>[];
  xColumns?: string[];
  yColumns?: string[];
  width?: number;
  height?: number;
}

const TRACE_COLORS = [
  "#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed",
  "#db2777", "#0891b2", "#65a30d", "#ea580c", "#4f46e5",
];

function buildTraces(
  config: AnalysisConfig,
  data: Record<string, unknown>[],
  xColumns: string[],
  yColumns: string[]
): Plotly.Data[] {
  const getCol = (col?: string) =>
    col ? data.map((r) => r[col]) : undefined;

  const hasMultiX = xColumns.length > 1;
  const hasMultiY = yColumns.length > 1;

  // Multi-column overlay: each column becomes its own trace
  if (hasMultiY && !hasMultiX) {
    const xData = getCol(xColumns[0]) as Plotly.Datum[] | undefined;
    const indexX = xData ?? data.map((_, i) => i + 1);

    return yColumns.map((yCol, i) => {
      const yData = getCol(yCol) as Plotly.Datum[];
      const color = TRACE_COLORS[i % TRACE_COLORS.length];

      switch (config.type) {
        case "scatter":
          return { x: indexX, y: yData, type: "scatter" as const, mode: "markers" as const, name: yCol, marker: { color, size: 5 } };
        case "line":
          return { x: indexX, y: yData, type: "scatter" as const, mode: "lines" as const, name: yCol, line: { color, width: 2 } };
        case "bar":
          return { x: indexX, y: yData, type: "bar" as const, name: yCol, marker: { color } };
        case "histogram":
          return { x: yData, type: "histogram" as const, name: yCol, marker: { color, opacity: 0.6 } };
        case "box":
          return { y: yData, type: "box" as const, name: yCol, marker: { color } };
        default:
          return { x: indexX, y: yData, type: "scatter" as const, mode: "markers" as const, name: yCol, marker: { color } };
      }
    }) as Plotly.Data[];
  }

  if (hasMultiX && !hasMultiY) {
    const yData = getCol(yColumns[0]) as Plotly.Datum[] | undefined;
    const indexY = yData ?? data.map((_, i) => i + 1);

    return xColumns.map((xCol, i) => {
      const xData = getCol(xCol) as Plotly.Datum[];
      const color = TRACE_COLORS[i % TRACE_COLORS.length];

      switch (config.type) {
        case "scatter":
          return { x: xData, y: indexY, type: "scatter" as const, mode: "markers" as const, name: xCol, marker: { color, size: 5 } };
        case "line":
          return { x: xData, y: indexY, type: "scatter" as const, mode: "lines" as const, name: xCol, line: { color, width: 2 } };
        case "bar":
          return { x: xData, y: indexY, type: "bar" as const, name: xCol, marker: { color } };
        case "histogram":
          return { x: xData, type: "histogram" as const, name: xCol, marker: { color, opacity: 0.6 } };
        case "box":
          return { y: xData, type: "box" as const, name: xCol, marker: { color } };
        default:
          return { x: xData, y: indexY, type: "scatter" as const, mode: "markers" as const, name: xCol, marker: { color } };
      }
    }) as Plotly.Data[];
  }

  if (hasMultiX && hasMultiY) {
    const traces: Plotly.Data[] = [];
    const count = Math.min(xColumns.length, yColumns.length);
    for (let i = 0; i < count; i++) {
      const xData = getCol(xColumns[i]) as Plotly.Datum[];
      const yData = getCol(yColumns[i]) as Plotly.Datum[];
      const color = TRACE_COLORS[i % TRACE_COLORS.length];
      const name = `${xColumns[i]} vs ${yColumns[i]}`;
      traces.push({
        x: xData,
        y: yData,
        type: "scatter" as const,
        mode: "markers" as const,
        name,
        marker: { color, size: 5 },
      });
    }
    // If more Y columns than X, pair extras with the first X
    for (let i = count; i < yColumns.length; i++) {
      const xData = getCol(xColumns[0]) as Plotly.Datum[];
      const yData = getCol(yColumns[i]) as Plotly.Datum[];
      const color = TRACE_COLORS[i % TRACE_COLORS.length];
      traces.push({
        x: xData, y: yData,
        type: "scatter" as const, mode: "markers" as const,
        name: yColumns[i], marker: { color, size: 5 },
      });
    }
    for (let i = count; i < xColumns.length; i++) {
      const xData = getCol(xColumns[i]) as Plotly.Datum[];
      const yData = getCol(yColumns[0]) as Plotly.Datum[];
      const color = TRACE_COLORS[i % TRACE_COLORS.length];
      traces.push({
        x: xData, y: yData,
        type: "scatter" as const, mode: "markers" as const,
        name: xColumns[i], marker: { color, size: 5 },
      });
    }
    return traces as Plotly.Data[];
  }

  // Single column per axis (original behavior)
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

    return Array.from(groups.entries()).map(([name, vals], i) => {
      const color = TRACE_COLORS[i % TRACE_COLORS.length];
      switch (config.type) {
        case "scatter":
          return { x: vals.x, y: vals.y, type: "scatter" as const, mode: "markers" as const, name, marker: { color, size: 5 } };
        case "line":
          return { x: vals.x, y: vals.y, type: "scatter" as const, mode: "lines" as const, name, line: { color, width: 2 } };
        case "bar":
          return { x: vals.x, y: vals.y, type: "bar" as const, name, marker: { color } };
        case "box":
          return { y: vals.y, type: "box" as const, name, marker: { color } };
        default:
          return { x: vals.x, y: vals.y, type: "scatter" as const, mode: "markers" as const, name, marker: { color } };
      }
    }) as Plotly.Data[];
  }

  switch (config.type) {
    case "scatter":
      return [{ x, y, type: "scatter", mode: "markers", marker: { color: TRACE_COLORS[0], size: 5 } }] as Plotly.Data[];
    case "line":
      return [{ x, y, type: "scatter", mode: "lines", line: { color: TRACE_COLORS[0], width: 2 } }] as Plotly.Data[];
    case "bar":
      return [{ x, y, type: "bar", marker: { color: TRACE_COLORS[0] } }] as Plotly.Data[];
    case "histogram":
      return [{ x: y ?? x, type: "histogram", marker: { color: TRACE_COLORS[0] } }] as Plotly.Data[];
    case "box":
      return [{ y: y ?? x, type: "box", marker: { color: TRACE_COLORS[0] } }] as Plotly.Data[];
    case "heatmap":
      return [{ z: [y ?? x], type: "heatmap" }] as Plotly.Data[];
    case "contour":
      return [{ x, y, type: "histogram2dcontour" as Plotly.PlotType }] as Plotly.Data[];
    default:
      return [{ x, y, type: "scatter", mode: "markers", marker: { color: TRACE_COLORS[0] } }] as Plotly.Data[];
  }
}

export function ChartRenderer({
  config,
  data,
  xColumns = [],
  yColumns = [],
  width = 600,
  height = 400,
}: ChartRendererProps) {
  const xCols = xColumns.length > 0 ? xColumns : config.x_column ? [config.x_column] : [];
  const yCols = yColumns.length > 0 ? yColumns : config.y_column ? [config.y_column] : [];

  const traces = buildTraces(config, data, xCols, yCols);
  const showLegend = traces.length > 1;

  const xLabel = xCols.length === 1 ? xCols[0] : xCols.length > 1 ? `${xCols.length} columns` : "";
  const yLabel = yCols.length === 1 ? yCols[0] : yCols.length > 1 ? `${yCols.length} columns` : "";

  const layout: Partial<Plotly.Layout> = {
    width,
    height,
    margin: { l: 50, r: 20, t: 10, b: 40 },
    xaxis: { title: { text: xLabel } },
    yaxis: { title: { text: yLabel } },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { family: "var(--font-geist-sans), system-ui, sans-serif", size: 11 },
    showlegend: showLegend,
    legend: showLegend ? { orientation: "h" as const, y: -0.2 } : undefined,
    barmode: config.type === "bar" ? "group" : undefined,
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
