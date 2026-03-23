"use client";

interface DashboardToolbarProps {
  onExportPNG?: () => void;
  onExportSVG?: () => void;
  onExportCSV?: () => void;
}

export function DashboardToolbar({
  onExportPNG,
  onExportSVG,
  onExportCSV,
}: DashboardToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground mr-1">Export:</span>
      {onExportPNG && (
        <button
          onClick={onExportPNG}
          className="px-2 py-1 text-[11px] border border-border rounded hover:bg-muted transition-colors"
        >
          PNG
        </button>
      )}
      {onExportSVG && (
        <button
          onClick={onExportSVG}
          className="px-2 py-1 text-[11px] border border-border rounded hover:bg-muted transition-colors"
        >
          SVG
        </button>
      )}
      {onExportCSV && (
        <button
          onClick={onExportCSV}
          className="px-2 py-1 text-[11px] border border-border rounded hover:bg-muted transition-colors"
        >
          CSV
        </button>
      )}
    </div>
  );
}
