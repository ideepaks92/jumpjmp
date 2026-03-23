"use client";

import type { ColumnType } from "@/lib/schemas/dataset";

const TYPE_BADGES: Record<ColumnType, { label: string; color: string }> = {
  continuous: { label: "#", color: "bg-blue-100 text-blue-700" },
  ordinal: { label: "O", color: "bg-purple-100 text-purple-700" },
  nominal: { label: "A", color: "bg-green-100 text-green-700" },
  date: { label: "D", color: "bg-amber-100 text-amber-700" },
  unknown: { label: "?", color: "bg-gray-100 text-gray-500" },
};

interface ColumnHeaderProps {
  name: string;
  type: ColumnType;
  sortDirection?: "asc" | "desc" | false;
  onSort?: () => void;
  onTypeChange?: (newType: ColumnType) => void;
}

export function ColumnHeader({
  name,
  type,
  sortDirection,
  onSort,
  onTypeChange,
}: ColumnHeaderProps) {
  const badge = TYPE_BADGES[type];

  return (
    <div className="flex items-center gap-1.5 select-none">
      {onTypeChange ? (
        <select
          value={type}
          onChange={(e) => onTypeChange(e.target.value as ColumnType)}
          className={`text-[10px] font-bold rounded px-1 py-0.5 ${badge.color} border-0 cursor-pointer`}
          onClick={(e) => e.stopPropagation()}
        >
          <option value="continuous"># Continuous</option>
          <option value="ordinal">O Ordinal</option>
          <option value="nominal">A Nominal</option>
          <option value="date">D Date</option>
        </select>
      ) : (
        <span
          className={`text-[10px] font-bold rounded px-1 py-0.5 ${badge.color}`}
        >
          {badge.label}
        </span>
      )}
      <button
        onClick={onSort}
        className="text-xs font-medium truncate hover:text-primary transition-colors"
        title={name}
      >
        {name}
      </button>
      {sortDirection && (
        <span className="text-[10px] text-muted-foreground">
          {sortDirection === "asc" ? "↑" : "↓"}
        </span>
      )}
    </div>
  );
}
