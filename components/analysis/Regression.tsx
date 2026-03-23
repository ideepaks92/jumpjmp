"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { linearRegression } from "@/lib/compute/native-stats";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface RegressionProps {
  xValues: unknown[];
  yValues: unknown[];
  xName: string;
  yName: string;
}

export function Regression({ xValues, yValues, xName, yName }: RegressionProps) {
  const result = useMemo(
    () => linearRegression(xValues, yValues),
    [xValues, yValues]
  );

  const xNums = xValues.map(Number).filter((n) => !isNaN(n));
  const yNums = yValues.map(Number).filter((n) => !isNaN(n));

  if (isNaN(result.slope)) {
    return (
      <div className="border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          Insufficient data for regression (need at least 3 numeric pairs).
        </p>
      </div>
    );
  }

  const xMin = Math.min(...xNums);
  const xMax = Math.max(...xNums);

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold">
        Linear Regression — {yName} vs {xName}
      </h3>

      <Plot
        data={[
          {
            x: xNums,
            y: yNums,
            type: "scatter",
            mode: "markers",
            name: "Data",
            marker: { color: "#2563eb", size: 5, opacity: 0.7 },
          } as Plotly.Data,
          {
            x: [xMin, xMax],
            y: [
              result.intercept + result.slope * xMin,
              result.intercept + result.slope * xMax,
            ],
            type: "scatter",
            mode: "lines",
            name: "Fit",
            line: { color: "#ef4444", width: 2 },
          } as Plotly.Data,
        ]}
        layout={{
          height: 300,
          margin: { l: 50, r: 20, t: 10, b: 40 },
          xaxis: { title: { text: xName } },
          yaxis: { title: { text: yName } },
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { size: 10 },
          showlegend: true,
          legend: { orientation: "h", y: -0.25 },
        }}
        config={{ responsive: true, displayModeBar: false }}
        className="w-full"
      />

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <p>
          <span className="text-muted-foreground">Equation: </span>
          <span className="font-mono">
            y = {result.slope.toFixed(4)}x{" "}
            {result.intercept >= 0 ? "+" : ""} {result.intercept.toFixed(4)}
          </span>
        </p>
        <p>
          <span className="text-muted-foreground">R&sup2;: </span>
          <span className="font-mono font-medium">
            {result.rSquared.toFixed(4)}
          </span>
        </p>
        <p>
          <span className="text-muted-foreground">Std Error: </span>
          <span className="font-mono">{result.standardError.toFixed(4)}</span>
        </p>
        <p>
          <span className="text-muted-foreground">p-value: </span>
          <span className="font-mono">{result.pValue.toFixed(4)}</span>
        </p>
      </div>

      {/* Residual plot */}
      <Plot
        data={[
          {
            x: result.predicted,
            y: result.residuals,
            type: "scatter",
            mode: "markers",
            marker: { color: "#6366f1", size: 4, opacity: 0.6 },
          } as Plotly.Data,
          {
            x: [Math.min(...result.predicted), Math.max(...result.predicted)],
            y: [0, 0],
            type: "scatter",
            mode: "lines",
            line: { color: "#a1a1aa", dash: "dash" },
          } as Plotly.Data,
        ]}
        layout={{
          height: 200,
          title: { text: "Residuals vs Predicted", font: { size: 11 } },
          margin: { l: 50, r: 20, t: 30, b: 30 },
          xaxis: { title: { text: "Predicted" } },
          yaxis: { title: { text: "Residual" } },
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { size: 10 },
          showlegend: false,
        }}
        config={{ responsive: true, displayModeBar: false }}
        className="w-full"
      />
    </div>
  );
}
