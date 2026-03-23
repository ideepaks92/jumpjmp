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
      <header className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">J</span>
          </div>
          <span className="font-semibold text-sm">JumpJMP</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
            DEMO
          </span>
        </div>
        {parsed && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {parsed.fileName}
            </span>
            <span>
              — {parsed.rowCount.toLocaleString()} rows,{" "}
              {parsed.columns.length} cols
            </span>
            <button
              onClick={() => {
                setParsed(null);
                setTab("data");
              }}
              className="ml-2 text-destructive hover:underline"
            >
              Clear
            </button>
          </div>
        )}
      </header>

      {/* Upload state */}
      {!parsed && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-lg w-full space-y-4">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">Try JumpJMP</h1>
              <p className="text-sm text-muted-foreground">
                Drop a CSV or Excel file to explore all tools — no account
                needed. Everything runs in your browser.
              </p>
            </div>
            <FileDropZone onFileParsed={handleFile} disabled={uploading} />
            {uploading && (
              <p className="text-sm text-center text-muted-foreground animate-pulse">
                Parsing file...
              </p>
            )}
            {error && (
              <p className="text-sm text-center text-destructive">{error}</p>
            )}

            {/* Sample data button */}
            <div className="text-center">
              <button
                onClick={() => {
                  const csv = generateSampleCSV();
                  const blob = new Blob([csv], { type: "text/csv" });
                  const file = new File([blob], "sample-bearing-data.csv", {
                    type: "text/csv",
                  });
                  handleFile(file);
                }}
                className="text-sm text-primary hover:underline"
              >
                or load sample engineering data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loaded state */}
      {parsed && (
        <>
          {/* Tab bar */}
          <div className="border-b border-border px-4 flex items-center gap-0 shrink-0">
            {(["data", "graph", "analysis"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors capitalize ${
                  tab === t
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "data"
                  ? "Data Table"
                  : t === "graph"
                    ? "Graph Builder"
                    : "Analysis"}
              </button>
            ))}
          </div>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-4">
            {tab === "data" && (
              <DataTable
                data={parsed.rows}
                columns={parsed.columns}
                onColumnTypeChange={handleColumnTypeChange}
                maxHeight={600}
              />
            )}

            {tab === "graph" && (
              <GraphBuilder
                data={parsed.rows}
                columns={parsed.columns}
              />
            )}

            {tab === "analysis" && (
              <div className="space-y-4 max-w-4xl">
                {/* Column selectors */}
                <div className="flex items-end gap-3 flex-wrap p-3 bg-muted/50 rounded-lg">
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground block mb-0.5 font-medium">
                      Primary Column
                    </label>
                    <select
                      value={analysisCol ?? ""}
                      onChange={(e) => setAnalysisCol(e.target.value || null)}
                      className="px-2 py-1.5 text-xs border border-border rounded bg-background min-w-[160px]"
                    >
                      <option value="">Select a continuous column...</option>
                      {continuousCols.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground block mb-0.5 font-medium">
                      Second Column (regression)
                    </label>
                    <select
                      value={analysisCol2 ?? ""}
                      onChange={(e) => setAnalysisCol2(e.target.value || null)}
                      className="px-2 py-1.5 text-xs border border-border rounded bg-background min-w-[160px]"
                    >
                      <option value="">None</option>
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
                    <label className="text-[10px] uppercase text-muted-foreground block mb-0.5 font-medium">
                      Group Column (hypothesis test)
                    </label>
                    <select
                      value={groupCol ?? ""}
                      onChange={(e) => setGroupCol(e.target.value || null)}
                      className="px-2 py-1.5 text-xs border border-border rounded bg-background min-w-[160px]"
                    >
                      <option value="">None</option>
                      {nominalCols.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {!analysisCol && (
                  <p className="text-sm text-muted-foreground p-4 text-center">
                    Select a continuous (numeric) column above to run all
                    analyses.
                  </p>
                )}

                {analysisCol && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* 1. Descriptive Statistics */}
                    <DescriptiveStats
                      values={parsed.rows.map((r) => r[analysisCol])}
                      columnName={analysisCol}
                    />

                    {/* 2. Control Chart */}
                    <ControlChart
                      values={parsed.rows.map((r) => r[analysisCol])}
                      columnName={analysisCol}
                    />

                    {/* 3. Process Capability */}
                    <ProcessCapability
                      values={parsed.rows.map((r) => r[analysisCol])}
                      columnName={analysisCol}
                    />

                    {/* 4. Distribution Fitting */}
                    <DistributionFit
                      values={parsed.rows.map((r) => r[analysisCol])}
                      columnName={analysisCol}
                    />

                    {/* 5. Regression (needs 2 columns) */}
                    {analysisCol2 && (
                      <div className="lg:col-span-2">
                        <Regression
                          xValues={parsed.rows.map((r) => r[analysisCol])}
                          yValues={parsed.rows.map(
                            (r) => r[analysisCol2]
                          )}
                          xName={analysisCol}
                          yName={analysisCol2}
                        />
                      </div>
                    )}

                    {/* 6. Hypothesis Test (needs group column) */}
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
    "Part_ID,Bearing_Diameter_mm,Surface_Roughness_Ra,Roundness_um,Batch,Inspector";
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
