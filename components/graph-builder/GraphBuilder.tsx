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
  const [xColumns, setXColumns] = useState<string[]>([]);
  const [yColumns, setYColumns] = useState<string[]>([]);
  const [groupColumns, setGroupColumns] = useState<string[]>([]);
  const [colorColumns, setColorColumns] = useState<string[]>([]);

  const addToAxis = useCallback(
    (axis: "x" | "y" | "group" | "color", col: string) => {
      const setter =
        axis === "x"
          ? setXColumns
          : axis === "y"
            ? setYColumns
            : axis === "group"
              ? setGroupColumns
              : setColorColumns;
      setter((prev) => (prev.includes(col) ? prev : [...prev, col]));
    },
    []
  );

  const removeFromAxis = useCallback(
    (axis: "x" | "y" | "group" | "color", col: string) => {
      const setter =
        axis === "x"
          ? setXColumns
          : axis === "y"
            ? setYColumns
            : axis === "group"
              ? setGroupColumns
              : setColorColumns;
      setter((prev) => prev.filter((c) => c !== col));
    },
    []
  );

  const config: AnalysisConfig = {
    type: chartType,
    x_column: xColumns[0],
    y_column: yColumns[0],
    group_column: groupColumns[0],
    color_column: colorColumns[0],
  };

  const hasData = xColumns.length > 0 || yColumns.length > 0;

  const handleSave = useCallback(() => {
    if (onSaveAnalysis) onSaveAnalysis(config);
  }, [config, onSaveAnalysis]);

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Config panel */}
      <div className="w-full lg:w-60 space-y-3 shrink-0">
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
            values={xColumns}
            onDrop={(col) => addToAxis("x", col)}
            onRemove={(col) => removeFromAxis("x", col)}
            onClear={() => setXColumns([])}
            multi
          />
          <AxisDropZone
            label="Y Axis"
            values={yColumns}
            onDrop={(col) => addToAxis("y", col)}
            onRemove={(col) => removeFromAxis("y", col)}
            onClear={() => setYColumns([])}
            multi
          />
          <AxisDropZone
            label="Group By"
            values={groupColumns}
            onDrop={(col) => addToAxis("group", col)}
            onRemove={(col) => removeFromAxis("group", col)}
            onClear={() => setGroupColumns([])}
          />
          <AxisDropZone
            label="Color"
            values={colorColumns}
            onDrop={(col) => addToAxis("color", col)}
            onRemove={(col) => removeFromAxis("color", col)}
            onClear={() => setColorColumns([])}
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
                  e.dataTransfer.effectAllowed = "move";
                }}
                className="px-2 py-1 text-xs bg-muted rounded cursor-grab hover:bg-border flex items-center gap-1.5"
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
            className="w-full px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:opacity-90"
          >
            Add to Dashboard
          </button>
        )}
      </div>

      {/* Chart area */}
      <div className="flex-1 border border-border rounded-lg bg-background min-h-[400px] flex items-center justify-center overflow-hidden">
        {hasData ? (
          <ChartRenderer
            config={config}
            data={data}
            xColumns={xColumns}
            yColumns={yColumns}
          />
        ) : (
          <div className="text-center text-muted-foreground text-sm p-8">
            <p className="font-medium">Drag columns to the axes</p>
            <p className="text-xs mt-1">
              Drop multiple columns on X or Y to overlay them as separate traces
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
