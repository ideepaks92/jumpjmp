"use client";

import { useState, useCallback } from "react";

interface AxisDropZoneProps {
  label: string;
  values: string[];
  onDrop: (columnName: string) => void;
  onRemove: (columnName: string) => void;
  onClear: () => void;
  multi?: boolean;
}

export function AxisDropZone({
  label,
  values,
  onDrop,
  onRemove,
  onClear,
  multi = false,
}: AxisDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const col = e.dataTransfer.getData("text/plain");
      if (col) onDrop(col);
    },
    [onDrop]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const hasValues = values.length > 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
          {multi && (
            <span className="ml-1 normal-case tracking-normal opacity-60">
              (multi)
            </span>
          )}
        </label>
        {hasValues && (
          <button
            onClick={onClear}
            className="text-[10px] text-muted-foreground hover:text-destructive"
          >
            clear
          </button>
        )}
      </div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          min-h-[32px] border border-dashed rounded-md px-1.5 py-1 flex flex-wrap items-center gap-1 text-xs
          ${isDragging ? "border-primary bg-primary/5" : "border-border"}
          ${hasValues ? "bg-muted/50" : ""}
        `}
      >
        {hasValues ? (
          values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-0.5 bg-background border border-border rounded px-1.5 py-0.5 text-[11px] font-medium"
            >
              {v}
              <button
                onClick={() => onRemove(v)}
                className="text-muted-foreground hover:text-destructive ml-0.5 leading-none"
              >
                ×
              </button>
            </span>
          ))
        ) : (
          <span className="text-muted-foreground px-0.5">Drop column here</span>
        )}
      </div>
    </div>
  );
}
