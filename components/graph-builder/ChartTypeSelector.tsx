"use client";

import type { AnalysisType } from "@/lib/schemas/analysis";

const CHART_TYPES: { type: AnalysisType; label: string; icon: string }[] = [
  { type: "scatter", label: "Scatter", icon: "⊙" },
  { type: "line", label: "Line", icon: "⌇" },
  { type: "bar", label: "Bar", icon: "▊" },
  { type: "histogram", label: "Histogram", icon: "▐" },
  { type: "box", label: "Box", icon: "☐" },
  { type: "heatmap", label: "Heatmap", icon: "▦" },
];

interface ChartTypeSelectorProps {
  selected: AnalysisType;
  onChange: (type: AnalysisType) => void;
}

export function ChartTypeSelector({
  selected,
  onChange,
}: ChartTypeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {CHART_TYPES.map((ct) => (
        <button
          key={ct.type}
          onClick={() => onChange(ct.type)}
          className={`px-2 py-1 text-xs rounded-md border transition-colors ${
            selected === ct.type
              ? "border-primary bg-primary/10 text-primary font-medium"
              : "border-border hover:border-primary/50"
          }`}
          title={ct.label}
        >
          <span className="mr-1">{ct.icon}</span>
          {ct.label}
        </button>
      ))}
    </div>
  );
}
