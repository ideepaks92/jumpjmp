"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dataset } from "@/lib/schemas/dataset";

interface SidebarProps {
  datasets: Dataset[];
  activeDatasetId: string | null;
  onSelectDataset: (id: string) => void;
  onAddDataset: () => void;
  workspaceTitle: string;
}

export function Sidebar({
  datasets,
  activeDatasetId,
  onSelectDataset,
  onAddDataset,
  workspaceTitle,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-60 border-r border-border bg-sidebar-bg flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-4 py-3 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">J</span>
          </div>
          <span className="font-semibold text-sm">JumpJMP</span>
        </Link>
      </div>

      {/* Workspace title */}
      <div className="px-4 py-3 border-b border-sidebar-border">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
          Workspace
        </p>
        <p className="text-sm font-medium truncate mt-0.5">{workspaceTitle}</p>
      </div>

      {/* Datasets */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="flex items-center justify-between px-2 mb-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Datasets
          </span>
          <button
            onClick={onAddDataset}
            className="text-xs text-primary hover:underline"
          >
            + Add
          </button>
        </div>
        {datasets.length === 0 ? (
          <p className="text-xs text-muted-foreground px-2 py-4">
            No datasets yet. Upload a file to get started.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {datasets.map((ds) => (
              <li key={ds.id}>
                <button
                  onClick={() => onSelectDataset(ds.id)}
                  className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
                    activeDatasetId === ds.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="block truncate">{ds.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {ds.row_count.toLocaleString()} rows ·{" "}
                    {ds.column_schema.length} cols
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Nav links */}
      <div className="border-t border-sidebar-border px-2 py-2 space-y-0.5">
        <Link
          href="/dashboard"
          className={`block px-2 py-1.5 rounded-md text-sm transition-colors ${
            pathname === "/dashboard"
              ? "bg-muted font-medium"
              : "hover:bg-muted"
          }`}
        >
          All Workspaces
        </Link>
      </div>
    </aside>
  );
}
