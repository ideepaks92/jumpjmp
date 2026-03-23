"use client";

import { useState, useCallback } from "react";
import { AxisDropZone } from "./AxisDropZone";
import { ChartTypeSelector } from "./ChartTypeSelector";
import { ChartRenderer } from "./ChartRenderer";
import type { AnalysisType, AnalysisConfig } from "@/lib/schemas/analysis";
import type { ColumnSchemaItem } from "@/lib/schemas/dataset";

interface GraphBuilderProps {
  data: Record<string, unknown>[];
  columns: ColumnSchemaItem[];
  onSaveAnalysis?: (config: AnalysisConfig) => void;
}

export function GraphBuilder({
  data,
  columns,
  onSaveAnalysis,
}: GraphBuilderProps) {
  const [chartType, setChartType] = useState<AnalysisType>("scatter");
  const [xColumn, setXColumn] = useState<string | null>(null);
  const [yColumn, setYColumn] = useState<string | null>(null);
  const [groupColumn, setGroupColumn] = useState<string | null>(null);
  const [colorColumn, setColorColumn] = useState<string | null>(null);

  const config: AnalysisConfig = {
    type: chartType,
    x_column: xColumn ?? undefined,
    y_column: yColumn ?? undefined,
    group_column: groupColumn ?? undefined,
    color_column: colorColumn ?? undefined,
  };

  const hasData = xColumn || yColumn;

  const handleSave = useCallback(() => {
    if (onSaveAnalysis) onSaveAnalysis(config);
  }, [config, onSaveAnalysis]);

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Config panel */}
      <div className="w-full lg:w-56 space-y-3 shrink-0">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Chart Type
          </h3>
          <ChartTypeSelector selected={chartType} onChange={setChartType} />
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Axes
          </h3>
          <AxisDropZone
            label="X Axis"
            value={xColumn}
            onDrop={setXColumn}
            onClear={() => setXColumn(null)}
          />
          <AxisDropZone
            label="Y Axis"
            value={yColumn}
            onDrop={setYColumn}
            onClear={() => setYColumn(null)}
          />
          <AxisDropZone
            label="Group By"
            value={groupColumn}
            onDrop={setGroupColumn}
            onClear={() => setGroupColumn(null)}
          />
          <AxisDropZone
            label="Color"
            value={colorColumn}
            onDrop={setColorColumn}
            onClear={() => setColorColumn(null)}
          />
        </div>

        {/* Column list for drag source */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Columns
          </h3>
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {columns.map((col) => (
              <div
                key={col.name}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", col.name);
                }}
                className="px-2 py-1 text-xs bg-muted rounded cursor-grab hover:bg-border transition-colors flex items-center gap-1.5"
              >
                <span
                  className={`text-[10px] font-bold ${
                    col.type === "continuous"
                      ? "text-blue-600"
                      : col.type === "nominal"
                        ? "text-green-600"
                        : col.type === "date"
                          ? "text-amber-600"
                          : "text-gray-400"
                  }`}
                >
                  {col.type === "continuous"
                    ? "#"
                    : col.type === "nominal"
                      ? "A"
                      : col.type === "date"
                        ? "D"
                        : "?"}
                </span>
                <span className="truncate">{col.name}</span>
              </div>
            ))}
          </div>
        </div>

        {hasData && onSaveAnalysis && (
          <button
            onClick={handleSave}
            className="w-full px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:opacity-90 transition-opacity"
          >
            Add to Dashboard
          </button>
        )}
      </div>

      {/* Chart area */}
      <div className="flex-1 border border-border rounded-lg bg-background min-h-[400px] flex items-center justify-center">
        {hasData ? (
          <ChartRenderer config={config} data={data} />
        ) : (
          <div className="text-center text-muted-foreground text-sm p-8">
            <p className="font-medium">Drag columns to the axes</p>
            <p className="text-xs mt-1">
              Drag a column from the list or the data table header to an axis
              drop zone
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
