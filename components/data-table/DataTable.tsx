"use client";

import { useMemo, useState, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ColumnHeader } from "./ColumnHeader";
import type { ColumnSchemaItem, ColumnType } from "@/lib/schemas/dataset";

interface DataTableProps {
  data: Record<string, unknown>[];
  columns: ColumnSchemaItem[];
  onColumnTypeChange?: (columnName: string, newType: ColumnType) => void;
  onColumnDragStart?: (columnName: string) => void;
  maxHeight?: number;
}

export function DataTable({
  data,
  columns: columnSchema,
  onColumnTypeChange,
  onColumnDragStart,
  maxHeight = 600,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);

  const columnDefs = useMemo<ColumnDef<Record<string, unknown>>[]>(
    () =>
      columnSchema.map((col) => ({
        id: col.name,
        accessorKey: col.name,
        header: () => (
          <ColumnHeader
            name={col.name}
            type={col.type}
            sortDirection={
              sorting.find((s) => s.id === col.name)
                ? sorting.find((s) => s.id === col.name)!.desc
                  ? "desc"
                  : "asc"
                : false
            }
            onSort={() => {
              setSorting((prev) => {
                const existing = prev.find((s) => s.id === col.name);
                if (!existing) return [{ id: col.name, desc: false }];
                if (!existing.desc) return [{ id: col.name, desc: true }];
                return [];
              });
            }}
            onTypeChange={
              onColumnTypeChange
                ? (t) => onColumnTypeChange(col.name, t)
                : undefined
            }
          />
        ),
        cell: ({ getValue }) => {
          const val = getValue();
          if (val === null || val === undefined) {
            return <span className="text-muted-foreground italic">null</span>;
          }
          if (col.type === "continuous") {
            const n = Number(val);
            return isNaN(n)
              ? String(val)
              : n % 1 === 0
                ? n.toLocaleString()
                : n.toFixed(4);
          }
          return String(val);
        },
        size: 140,
      })),
    [columnSchema, sorting, onColumnTypeChange]
  );

  const table = useReactTable({
    data,
    columns: columnDefs,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 20,
  });

  return (
    <div className="space-y-2">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Filter rows..."
          className="px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring w-64"
        />
        <span className="text-xs text-muted-foreground">
          {rows.length.toLocaleString()} rows
        </span>
      </div>

      {/* Table */}
      <div
        ref={parentRef}
        className="border border-border rounded-lg overflow-auto virtual-table-container"
        style={{ maxHeight }}
      >
        <table className="w-full text-sm border-collapse">
          <thead className="bg-muted/50 sticky top-0 z-10">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left font-normal border-b border-border whitespace-nowrap"
                    style={{ width: header.getSize() }}
                    draggable={!!onColumnDragStart}
                    onDragStart={() =>
                      onColumnDragStart?.(header.column.id)
                    }
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {virtualizer.getVirtualItems().length > 0 && (
              <tr>
                <td
                  colSpan={columnDefs.length}
                  style={{ height: virtualizer.getVirtualItems()[0].start }}
                />
              </tr>
            )}
            {virtualizer.getVirtualItems().map((vRow) => {
              const row = rows[vRow.index];
              return (
                <tr
                  key={row.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-3 py-1 border-b border-border/50 tabular-nums"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
            {virtualizer.getVirtualItems().length > 0 && (
              <tr>
                <td
                  colSpan={columnDefs.length}
                  style={{
                    height:
                      virtualizer.getTotalSize() -
                      (virtualizer.getVirtualItems().at(-1)?.end ?? 0),
                  }}
                />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
