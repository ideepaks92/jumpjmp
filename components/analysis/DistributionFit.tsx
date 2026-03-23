"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { ensurePyodide, runCompute, isPyodideLoaded } from "@/lib/compute/pyodide-bridge";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface DistributionFitProps {
  values: unknown[];
  columnName: string;
}

interface FitResult {
  distributions: Record<
    string,
    {
      params?: number[];
      ks_statistic?: number;
      ks_pvalue?: number;
      aic?: number;
      error?: string;
    }
  >;
  best_fit: string | null;
}

export function DistributionFit({ values, columnName }: DistributionFitProps) {
  const [result, setResult] = useState<FitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const nums = values.map(Number).filter((n) => !isNaN(n) && isFinite(n));

  const runFit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await ensurePyodide(setProgress);
      const response = await runCompute({
        type: "distribution_fit",
        data: { analysisType: "distribution_fit", values: nums },
        params: {},
      });

      if (response.success && response.result) {
        setResult(response.result as unknown as FitResult);
      } else {
        setError(response.error || "Fit failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
    setLoading(false);
    setProgress("");
  }, [nums]);

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Distribution Fitting — {columnName}
        </h3>
        <button
          onClick={runFit}
          disabled={loading || nums.length === 0}
          className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded-md hover:opacity-90 disabled:opacity-50"
        >
          {loading ? progress || "Fitting..." : isPyodideLoaded() ? "Fit Distributions" : "Load Engine & Fit"}
        </button>
      </div>

      {/* Histogram of data */}
      <Plot
        data={[
          {
            x: nums,
            type: "histogram",
            marker: { color: "#2563eb", opacity: 0.6 },
            name: "Data",
          } as Plotly.Data,
        ]}
        layout={{
          height: 220,
          margin: { l: 40, r: 20, t: 10, b: 30 },
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { size: 10 },
          showlegend: false,
        }}
        config={{ responsive: true, displayModeBar: false }}
        className="w-full"
      />

      {error && <p className="text-xs text-destructive">{error}</p>}

      {result && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Best fit:{" "}
            <span className="font-medium text-foreground">
              {result.best_fit ?? "None"}
            </span>
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="py-1 text-left text-muted-foreground font-medium">
                  Distribution
                </th>
                <th className="py-1 text-right text-muted-foreground font-medium">
                  KS Stat
                </th>
                <th className="py-1 text-right text-muted-foreground font-medium">
                  KS p-value
                </th>
                <th className="py-1 text-right text-muted-foreground font-medium">
                  AIC
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(result.distributions).map(([name, d]) => (
                <tr
                  key={name}
                  className={`border-b border-border/50 ${
                    name === result.best_fit ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="py-1 capitalize">
                    {name}
                    {name === result.best_fit && (
                      <span className="ml-1 text-primary text-[10px]">
                        (best)
                      </span>
                    )}
                  </td>
                  <td className="py-1 text-right font-mono">
                    {d.ks_statistic?.toFixed(4) ?? "—"}
                  </td>
                  <td className="py-1 text-right font-mono">
                    {d.ks_pvalue?.toFixed(4) ?? "—"}
                  </td>
                  <td className="py-1 text-right font-mono">
                    {d.aic?.toFixed(1) ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
