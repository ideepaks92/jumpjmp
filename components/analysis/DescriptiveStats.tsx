"use client";

import { useMemo } from "react";
import { descriptiveStats, type DescriptiveResult } from "@/lib/compute/native-stats";

interface DescriptiveStatsProps {
  values: unknown[];
  columnName: string;
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  const formatted =
    typeof value === "number"
      ? isNaN(value)
        ? "—"
        : value % 1 === 0
          ? value.toLocaleString()
          : value.toFixed(4)
      : value;

  return (
    <tr className="border-b border-border/50 last:border-0">
      <td className="py-1.5 pr-4 text-xs text-muted-foreground">{label}</td>
      <td className="py-1.5 text-xs font-mono text-right tabular-nums">
        {formatted}
      </td>
    </tr>
  );
}

export function DescriptiveStats({ values, columnName }: DescriptiveStatsProps) {
  const stats: DescriptiveResult = useMemo(
    () => descriptiveStats(values),
    [values]
  );

  return (
    <div className="border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-3">
        Descriptive Statistics — {columnName}
      </h3>
      <table className="w-full">
        <tbody>
          <StatRow label="Count" value={stats.count} />
          <StatRow label="Missing" value={stats.missing} />
          <StatRow label="Mean" value={stats.mean} />
          <StatRow label="Std Dev" value={stats.std} />
          <StatRow label="Min" value={stats.min} />
          <StatRow label="Q1 (25%)" value={stats.q1} />
          <StatRow label="Median (50%)" value={stats.median} />
          <StatRow label="Q3 (75%)" value={stats.q3} />
          <StatRow label="Max" value={stats.max} />
          <StatRow label="Skewness" value={stats.skewness} />
          <StatRow label="Kurtosis" value={stats.kurtosis} />
        </tbody>
      </table>
    </div>
  );
}
