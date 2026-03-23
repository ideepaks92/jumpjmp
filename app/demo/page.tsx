"use client";

import { useState, useCallback } from "react";
import { FileDropZone } from "@/components/upload/FileDropZone";
import { parseFile, type ParsedFile } from "@/components/upload/FileParser";
import { DataTable } from "@/components/data-table/DataTable";
import { GraphBuilder } from "@/components/graph-builder/GraphBuilder";
import { DescriptiveStats } from "@/components/analysis/DescriptiveStats";
import { ControlChart } from "@/components/analysis/ControlChart";
import { ProcessCapability } from "@/components/analysis/ProcessCapability";
import { Regression } from "@/components/analysis/Regression";
import { HypothesisTest } from "@/components/analysis/HypothesisTest";
import { DistributionFit } from "@/components/analysis/DistributionFit";
import type { ColumnType } from "@/lib/schemas/dataset";

type Tab = "data" | "graph" | "analysis";

export default function DemoPage() {
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [tab, setTab] = useState<Tab>("data");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisCol, setAnalysisCol] = useState<string | null>(null);
  const [analysisCol2, setAnalysisCol2] = useState<string | null>(null);
  const [groupCol, setGroupCol] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const result = await parseFile(file);
      setParsed(result);
      setTab("data");
      setAnalysisCol(null);
      setAnalysisCol2(null);
      setGroupCol(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse file");
    }
    setUploading(false);
  }, []);

  const handleColumnTypeChange = useCallback(
    (colName: string, newType: ColumnType) => {
      if (!parsed) return;
      setParsed({
        ...parsed,
        columns: parsed.columns.map((c) =>
          c.name === colName ? { ...c, type: newType } : c
        ),
      });
    },
    [parsed]
  );

  const continuousCols =
    parsed?.columns.filter((c) => c.type === "continuous") ?? [];
  const nominalCols =
    parsed?.columns.filter(
      (c) => c.type === "nominal" || c.type === "ordinal"
    ) ?? [];

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="h-11 border-b border-border flex items-center justify-between px-4 shrink-0 bg-sidebar-bg">
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center gap-2 hover:opacity-80">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-[10px]">J</span>
            </div>
            <span className="font-semibold text-sm tracking-tight">JumpJMP</span>
          </a>
          <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary font-semibold uppercase tracking-wider">
            Demo
          </span>
        </div>
        {parsed && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium">{parsed.fileName}</span>
            <span className="text-muted-foreground">
              {parsed.rowCount.toLocaleString()} rows · {parsed.columns.length} cols
            </span>
            <button
              onClick={() => {
                setParsed(null);
                setTab("data");
              }}
              className="text-muted-foreground hover:text-destructive ml-1"
            >
              Clear
            </button>
          </div>
        )}
      </header>

      {/* Upload state */}
      {!parsed && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-6">
            <div className="text-left space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Try JumpJMP
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Upload a CSV or Excel file to explore the data table, graph
                builder, and all statistical analysis tools. Everything runs
                in your browser — nothing is uploaded to a server.
              </p>
            </div>
            <FileDropZone onFileParsed={handleFile} disabled={uploading} />
            {uploading && (
              <p className="text-sm text-muted-foreground animate-pulse">
                Parsing...
              </p>
            )}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <button
              onClick={() => {
                const csv = generateSampleCSV();
                const blob = new Blob([csv], { type: "text/csv" });
                const file = new File([blob], "sample-bearing-data.csv", {
                  type: "text/csv",
                });
                handleFile(file);
              }}
              className="text-sm text-primary hover:underline underline-offset-4"
            >
              Load sample engineering data instead
            </button>
          </div>
        </div>
      )}

      {/* Loaded state */}
      {parsed && (
        <>
          {/* Tab bar */}
          <div className="border-b border-border px-4 flex items-center shrink-0 bg-sidebar-bg">
            {(
              [
                { key: "data", label: "Data Table" },
                { key: "graph", label: "Graph Builder" },
                { key: "analysis", label: "Analysis" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
                  tab === t.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-5">
            {tab === "data" && (
              <DataTable
                data={parsed.rows}
                columns={parsed.columns}
                onColumnTypeChange={handleColumnTypeChange}
                maxHeight={600}
              />
            )}

            {tab === "graph" && (
              <GraphBuilder data={parsed.rows} columns={parsed.columns} />
            )}

            {tab === "analysis" && (
              <div className="space-y-5 max-w-4xl">
                {/* Column selectors */}
                <div className="flex items-end gap-4 flex-wrap p-3.5 bg-muted rounded-lg">
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground block mb-1 font-semibold tracking-wider">
                      Primary Column
                    </label>
                    <select
                      value={analysisCol ?? ""}
                      onChange={(e) => setAnalysisCol(e.target.value || null)}
                      className="px-2.5 py-1.5 text-xs border border-border rounded-md bg-background min-w-[180px] focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select a numeric column...</option>
                      {continuousCols.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground block mb-1 font-semibold tracking-wider">
                      Second Column
                    </label>
                    <select
                      value={analysisCol2 ?? ""}
                      onChange={(e) => setAnalysisCol2(e.target.value || null)}
                      className="px-2.5 py-1.5 text-xs border border-border rounded-md bg-background min-w-[180px] focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">None (for regression)</option>
                      {continuousCols
                        .filter((c) => c.name !== analysisCol)
                        .map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground block mb-1 font-semibold tracking-wider">
                      Group Column
                    </label>
                    <select
                      value={groupCol ?? ""}
                      onChange={(e) => setGroupCol(e.target.value || null)}
                      className="px-2.5 py-1.5 text-xs border border-border rounded-md bg-background min-w-[180px] focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">None (for hypothesis test)</option>
                      {nominalCols.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {!analysisCol && (
                  <div className="py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      Select a numeric column above to run all analyses
                    </p>
                  </div>
                )}

                {analysisCol && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <DescriptiveStats
                      values={parsed.rows.map((r) => r[analysisCol])}
                      columnName={analysisCol}
                    />
                    <ControlChart
                      values={parsed.rows.map((r) => r[analysisCol])}
                      columnName={analysisCol}
                    />
                    <ProcessCapability
                      values={parsed.rows.map((r) => r[analysisCol])}
                      columnName={analysisCol}
                    />
                    <DistributionFit
                      values={parsed.rows.map((r) => r[analysisCol])}
                      columnName={analysisCol}
                    />
                    {analysisCol2 && (
                      <div className="lg:col-span-2">
                        <Regression
                          xValues={parsed.rows.map((r) => r[analysisCol])}
                          yValues={parsed.rows.map((r) => r[analysisCol2])}
                          xName={analysisCol}
                          yName={analysisCol2}
                        />
                      </div>
                    )}
                    {groupCol && (
                      <div className="lg:col-span-2">
                        <HypothesisTest
                          data={parsed.rows}
                          groupColumn={groupCol}
                          valueColumn={analysisCol}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}

function generateSampleCSV(): string {
  const headers =
    "Part_ID,Diameter_mm,Roughness_Ra,Roundness_um,Batch,Inspector";
  const rows: string[] = [headers];
  const batches = ["A", "B", "C", "D"];
  const inspectors = ["Jones", "Smith"];

  for (let i = 1; i <= 50; i++) {
    const diameter = (25.005 + (Math.random() - 0.45) * 0.03).toFixed(3);
    const roughness = (0.35 + Math.random() * 0.25).toFixed(2);
    const roundness = (0.7 + Math.random() * 1.8).toFixed(1);
    const batch = batches[Math.floor((i - 1) / 13) % batches.length];
    const inspector = inspectors[i % 2];
    rows.push(
      `B${String(i).padStart(3, "0")},${diameter},${roughness},${roundness},${batch},${inspector}`
    );
  }
  return rows.join("\n");
}
