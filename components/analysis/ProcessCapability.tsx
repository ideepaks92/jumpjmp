"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { processCapability } from "@/lib/compute/native-stats";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface ProcessCapabilityProps {
  values: unknown[];
  columnName: string;
}

function Metric({
  label,
  value,
  threshold = 1.33,
}: {
  label: string;
  value: number;
  threshold?: number;
}) {
  const color = isNaN(value)
    ? "text-muted-foreground"
    : value >= threshold
      ? "text-green-600"
      : value >= 1.0
        ? "text-amber-600"
        : "text-red-600";
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${color}`}>
        {isNaN(value) ? "—" : value.toFixed(3)}
      </p>
    </div>
  );
}

export function ProcessCapability({
  values,
  columnName,
}: ProcessCapabilityProps) {
  const [lsl, setLsl] = useState<string>("");
  const [usl, setUsl] = useState<string>("");

  const lslNum = parseFloat(lsl);
  const uslNum = parseFloat(usl);
  const hasLimits = !isNaN(lslNum) && !isNaN(uslNum) && uslNum > lslNum;

  const result = useMemo(() => {
    if (!hasLimits) return null;
    return processCapability(values, lslNum, uslNum);
  }, [values, lslNum, uslNum, hasLimits]);

  const nums = useMemo(
    () =>
      values.map((v) => Number(v)).filter((n) => !isNaN(n) && isFinite(n)),
    [values]
  );

  return (
    <div className="border border-border rounded-lg p-4 space-y-4">
      <h3 className="text-sm font-semibold">
        Process Capability — {columnName}
      </h3>

      <div className="flex items-center gap-3">
        <div>
          <label className="text-[10px] uppercase text-muted-foreground">
            LSL
          </label>
          <input
            type="number"
            value={lsl}
            onChange={(e) => setLsl(e.target.value)}
            placeholder="Lower Spec"
            className="block w-28 px-2 py-1 text-xs border border-border rounded bg-background"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase text-muted-foreground">
            USL
          </label>
          <input
            type="number"
            value={usl}
            onChange={(e) => setUsl(e.target.value)}
            placeholder="Upper Spec"
            className="block w-28 px-2 py-1 text-xs border border-border rounded bg-background"
          />
        </div>
      </div>

      {result && (
        <>
          <div className="grid grid-cols-4 gap-2">
            <Metric label="Cp" value={result.cp} />
            <Metric label="Cpk" value={result.cpk} />
            <Metric label="Pp" value={result.pp} />
            <Metric label="Ppk" value={result.ppk} />
          </div>

          <Plot
            data={[
              {
                x: nums,
                type: "histogram",
                marker: { color: "#2563eb", opacity: 0.7 },
                name: "Data",
              } as Plotly.Data,
            ]}
            layout={{
              height: 250,
              margin: { l: 40, r: 20, t: 10, b: 30 },
              shapes: [
                {
                  type: "line",
                  x0: lslNum,
                  x1: lslNum,
                  y0: 0,
                  y1: 1,
                  yref: "paper",
                  line: { color: "#ef4444", dash: "dash", width: 2 },
                },
                {
                  type: "line",
                  x0: uslNum,
                  x1: uslNum,
                  y0: 0,
                  y1: 1,
                  yref: "paper",
                  line: { color: "#ef4444", dash: "dash", width: 2 },
                },
                {
                  type: "line",
                  x0: result.mean,
                  x1: result.mean,
                  y0: 0,
                  y1: 1,
                  yref: "paper",
                  line: { color: "#16a34a", width: 2 },
                },
              ],
              paper_bgcolor: "transparent",
              plot_bgcolor: "transparent",
              font: { size: 10 },
              showlegend: false,
            }}
            config={{ responsive: true, displayModeBar: false }}
            className="w-full"
          />

          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>
              Mean = {result.mean.toFixed(4)}, Overall Std = {result.std.toFixed(4)},
              Within Std = {result.withinStd.toFixed(4)}
            </p>
            <p>
              {result.cpk >= 1.33
                ? "Process is capable (Cpk >= 1.33)"
                : result.cpk >= 1.0
                  ? "Process is marginally capable (1.0 <= Cpk < 1.33)"
                  : "Process is NOT capable (Cpk < 1.0)"}
            </p>
          </div>
        </>
      )}

      {!hasLimits && (
        <p className="text-xs text-muted-foreground">
          Enter LSL and USL to calculate process capability indices.
        </p>
      )}
    </div>
  );
}
