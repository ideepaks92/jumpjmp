"use client";

import { useMemo } from "react";
import { tTest, oneWayAnova } from "@/lib/compute/native-stats";

interface HypothesisTestProps {
  data: Record<string, unknown>[];
  groupColumn: string;
  valueColumn: string;
}

export function HypothesisTest({
  data,
  groupColumn,
  valueColumn,
}: HypothesisTestProps) {
  const result = useMemo(() => {
    const groups = new Map<string, number[]>();
    data.forEach((row) => {
      const g = String(row[groupColumn]);
      const v = Number(row[valueColumn]);
      if (!isNaN(v) && isFinite(v)) {
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g)!.push(v);
      }
    });

    const entries = [...groups.entries()];
    if (entries.length < 2) return null;

    if (entries.length === 2) {
      return tTest(entries[0][1], entries[1][1]);
    }

    return oneWayAnova(
      entries.map(([name, values]) => ({ name, values }))
    );
  }, [data, groupColumn, valueColumn]);

  if (!result) {
    return (
      <div className="border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          Need at least 2 groups to perform hypothesis testing.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold">{result.testType}</h3>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <p>
          <span className="text-muted-foreground">Test Statistic: </span>
          <span className="font-mono">{result.statistic.toFixed(4)}</span>
        </p>
        <p>
          <span className="text-muted-foreground">p-value: </span>
          <span
            className={`font-mono font-medium ${
              result.pValue < 0.05 ? "text-red-600" : "text-green-600"
            }`}
          >
            {result.pValue.toFixed(4)}
          </span>
        </p>
      </div>

      <p
        className={`text-xs font-medium ${
          result.pValue < 0.05 ? "text-red-600" : "text-green-600"
        }`}
      >
        {result.conclusion}
      </p>

      {result.groups && (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="py-1 text-left font-medium text-muted-foreground">
                Group
              </th>
              <th className="py-1 text-right font-medium text-muted-foreground">
                N
              </th>
              <th className="py-1 text-right font-medium text-muted-foreground">
                Mean
              </th>
              <th className="py-1 text-right font-medium text-muted-foreground">
                Std Dev
              </th>
            </tr>
          </thead>
          <tbody>
            {result.groups.map((g) => (
              <tr key={g.name} className="border-b border-border/50">
                <td className="py-1">{g.name}</td>
                <td className="py-1 text-right font-mono">{g.n}</td>
                <td className="py-1 text-right font-mono">
                  {g.mean.toFixed(4)}
                </td>
                <td className="py-1 text-right font-mono">
                  {g.std.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
