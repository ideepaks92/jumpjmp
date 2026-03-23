"use client";

import { useState, useCallback } from "react";

interface AxisDropZoneProps {
  label: string;
  value: string | null;
  onDrop: (columnName: string) => void;
  onClear: () => void;
}

export function AxisDropZone({ label, value, onDrop, onClear }: AxisDropZoneProps) {
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
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  return (
    <div className="space-y-1">
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </label>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          min-h-[32px] border border-dashed rounded-md px-2 py-1 flex items-center justify-between text-xs transition-all
          ${isDragging ? "border-primary bg-primary/5" : "border-border"}
          ${value ? "bg-muted" : ""}
        `}
      >
        {value ? (
          <>
            <span className="font-medium truncate">{value}</span>
            <button
              onClick={onClear}
              className="text-muted-foreground hover:text-destructive ml-1 shrink-0"
            >
              ×
            </button>
          </>
        ) : (
          <span className="text-muted-foreground">Drop column here</span>
        )}
      </div>
    </div>
  );
}
