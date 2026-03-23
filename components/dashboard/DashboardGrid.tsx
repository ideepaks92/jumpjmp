"use client";

import { useMemo, useCallback } from "react";
import { ReactGridLayout, type Layout, type LayoutItem } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import { ChartRenderer } from "@/components/graph-builder/ChartRenderer";
import type { Analysis } from "@/lib/schemas/analysis";

interface DashboardGridProps {
  analyses: Analysis[];
  data: Record<string, unknown>[];
  onLayoutChange?: (layouts: { id: string; position: Analysis["position"] }[]) => void;
  onRemoveAnalysis?: (id: string) => void;
  readOnly?: boolean;
  width?: number;
}

export function DashboardGrid({
  analyses,
  data,
  onLayoutChange,
  onRemoveAnalysis,
  readOnly = false,
  width = 1200,
}: DashboardGridProps) {
  const layout: Layout = useMemo(
    () =>
      analyses.map((a, idx) => ({
        i: a.id,
        x: a.position?.x ?? (idx % 2) * 6,
        y: a.position?.y ?? Math.floor(idx / 2) * 4,
        w: a.position?.w ?? 6,
        h: a.position?.h ?? 4,
        minW: 3,
        minH: 2,
        static: readOnly,
      })),
    [analyses, readOnly]
  );

  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      if (onLayoutChange) {
        const updates = newLayout.map((l: LayoutItem) => ({
          id: l.i,
          position: { x: l.x, y: l.y, w: l.w, h: l.h },
        }));
        onLayoutChange(updates);
      }
    },
    [onLayoutChange]
  );

  if (analyses.length === 0) {
    return (
      <div className="border-2 border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">
        <p className="font-medium">No charts yet</p>
        <p className="text-xs mt-1">
          Use the Graph Builder to create charts, then add them to the dashboard.
        </p>
      </div>
    );
  }

  return (
    <ReactGridLayout
      layout={layout}
      width={width}
      gridConfig={{ cols: 12, rowHeight: 80, margin: [12, 12] as const }}
      dragConfig={{ enabled: !readOnly, bounded: false, threshold: 3 }}
      resizeConfig={{ enabled: !readOnly, handles: ["se"] }}
      onLayoutChange={handleLayoutChange}
      autoSize
    >
      {analyses.map((analysis) => (
        <div
          key={analysis.id}
          className="border border-border rounded-lg bg-background overflow-hidden shadow-sm"
        >
          <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b border-border/50">
            <span className="text-[11px] font-medium capitalize">
              {analysis.config.type}
              {analysis.config.y_column && ` — ${analysis.config.y_column}`}
            </span>
            {!readOnly && onRemoveAnalysis && (
              <button
                onClick={() => onRemoveAnalysis(analysis.id)}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                ×
              </button>
            )}
          </div>
          <div className="p-1">
            <ChartRenderer
              config={analysis.config}
              data={data}
              width={(analysis.position?.w ?? 6) * 96}
              height={(analysis.position?.h ?? 4) * 76}
            />
          </div>
        </div>
      ))}
    </ReactGridLayout>
  );
}
