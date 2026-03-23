"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  individualsChart,
  xbarRChart,
  type ControlChartResult,
} from "@/lib/compute/native-stats";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface ControlChartProps {
  values: unknown[];
  columnName: string;
}

type ChartSubtype = "individuals_mr" | "xbar_r";

function renderControlChart(
  result: ControlChartResult,
  title: string,
  height: number = 280
) {
  const x = result.values.map((_, i) => i + 1);

  const traces: Plotly.Data[] = [
    {
      x,
      y: result.values,
      type: "scatter",
      mode: "lines+markers",
      name: "Data",
      marker: {
        color: result.values.map((_, i) =>
          result.outOfControl.includes(i) ? "#ef4444" : "#2563eb"
        ),
        size: 5,
      },
      line: { color: "#2563eb", width: 1 },
    } as Plotly.Data,
    {
      x: [1, result.values.length],
      y: [result.center, result.center],
      type: "scatter",
      mode: "lines",
      name: `CL = ${result.center.toFixed(3)}`,
      line: { color: "#16a34a", dash: "solid", width: 1.5 },
    } as Plotly.Data,
    {
      x: [1, result.values.length],
      y: [result.ucl, result.ucl],
      type: "scatter",
      mode: "lines",
      name: `UCL = ${result.ucl.toFixed(3)}`,
      line: { color: "#ef4444", dash: "dash", width: 1 },
    } as Plotly.Data,
    {
      x: [1, result.values.length],
      y: [result.lcl, result.lcl],
      type: "scatter",
      mode: "lines",
      name: `LCL = ${result.lcl.toFixed(3)}`,
      line: { color: "#ef4444", dash: "dash", width: 1 },
    } as Plotly.Data,
  ];

  return (
    <Plot
      data={traces}
      layout={{
        title: { text: title, font: { size: 12 } },
        height,
        margin: { l: 50, r: 20, t: 35, b: 30 },
        xaxis: { title: { text: "Observation" } },
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: { family: "var(--font-geist-sans), system-ui, sans-serif", size: 10 },
        showlegend: true,
        legend: { orientation: "h", y: -0.2 },
      }}
      config={{ responsive: true, displayModeBar: false }}
      className="w-full"
    />
  );
}

export function ControlChart({ values, columnName }: ControlChartProps) {
  const [subtype, setSubtype] = useState<ChartSubtype>("individuals_mr");
  const [subgroupSize, setSubgroupSize] = useState(5);

  const result = useMemo(() => {
    if (subtype === "xbar_r") {
      return xbarRChart(values, subgroupSize);
    }
    return { individual: individualsChart(values) };
  }, [values, subtype, subgroupSize]);

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Control Chart — {columnName}
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={subtype}
            onChange={(e) => setSubtype(e.target.value as ChartSubtype)}
            className="text-xs border border-border rounded px-2 py-1 bg-background"
          >
            <option value="individuals_mr">Individuals & MR</option>
            <option value="xbar_r">X-bar & R</option>
          </select>
          {subtype === "xbar_r" && (
            <input
              type="number"
              min={2}
              max={10}
              value={subgroupSize}
              onChange={(e) => setSubgroupSize(Number(e.target.value))}
              className="w-14 text-xs border border-border rounded px-2 py-1 bg-background"
            />
          )}
        </div>
      </div>

      {"individual" in result ? (
        <>
          {renderControlChart(result.individual, "Individuals Chart")}
          {result.individual.mr && (
            <div className="mt-2">
              {renderControlChart(
                {
                  values: result.individual.mr,
                  center: result.individual.mrCenter!,
                  ucl: result.individual.mrUcl!,
                  lcl: 0,
                  outOfControl: result.individual.mr
                    .map((v, i) => (v > result.individual.mrUcl! ? i : -1))
                    .filter((i) => i >= 0),
                },
                "Moving Range Chart",
                220
              )}
            </div>
          )}
          {result.individual.outOfControl.length > 0 && (
            <p className="text-xs text-destructive">
              {result.individual.outOfControl.length} out-of-control point(s)
              at observations:{" "}
              {result.individual.outOfControl.map((i) => i + 1).join(", ")}
            </p>
          )}
        </>
      ) : (
        <>
          {renderControlChart(result.xbar, "X-bar Chart")}
          {renderControlChart(result.r, "R Chart", 220)}
        </>
      )}
    </div>
  );
}
