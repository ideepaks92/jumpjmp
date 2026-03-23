"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  useWorkspaceStore,
  selectActiveDataset,
  selectDatasetAnalyses,
} from "@/lib/store/workspace-store";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { FileDropZone } from "@/components/upload/FileDropZone";
import { parseFile } from "@/components/upload/FileParser";
import { DataTable } from "@/components/data-table/DataTable";
import { GraphBuilder } from "@/components/graph-builder/GraphBuilder";
import { DescriptiveStats } from "@/components/analysis/DescriptiveStats";
import { ControlChart } from "@/components/analysis/ControlChart";
import { ProcessCapability } from "@/components/analysis/ProcessCapability";
import { Regression } from "@/components/analysis/Regression";
import { HypothesisTest } from "@/components/analysis/HypothesisTest";
import { DistributionFit } from "@/components/analysis/DistributionFit";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { DashboardToolbar } from "@/components/dashboard/DashboardToolbar";
import { ShareDialog } from "@/components/collaboration/ShareDialog";
import type { AnalysisConfig } from "@/lib/schemas/analysis";
import type { ColumnType } from "@/lib/schemas/dataset";

type Tab = "data" | "graph" | "analysis" | "dashboard";

export default function WorkspacePage() {
  const params = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const store = useWorkspaceStore();
  const activeDataset = useWorkspaceStore(selectActiveDataset);
  const datasetAnalyses = useWorkspaceStore(
    selectDatasetAnalyses(store.activeDatasetId ?? "")
  );

  const [tab, setTab] = useState<Tab>("data");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analysisColumn, setAnalysisColumn] = useState<string | null>(null);
  const [analysisColumn2, setAnalysisColumn2] = useState<string | null>(null);
  const [groupColumn, setGroupColumn] = useState<string | null>(null);

  // Load workspace data
  useEffect(() => {
    async function load() {
      store.setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }
      setUserEmail(user.email ?? null);

      const { data: workspace } = await supabase
        .from("workspaces")
        .select("*")
        .eq("id", params.workspaceId)
        .single();

      if (!workspace) {
        router.push("/dashboard");
        return;
      }
      store.setWorkspace(workspace);

      const { data: datasets } = await supabase
        .from("datasets")
        .select("*")
        .eq("workspace_id", params.workspaceId);
      store.setDatasets(datasets ?? []);
      if (datasets && datasets.length > 0) {
        store.setActiveDataset(datasets[0].id);
      }

      const { data: analyses } = await supabase
        .from("analyses")
        .select("*")
        .eq("workspace_id", params.workspaceId);
      store.setAnalyses(analyses ?? []);

      store.setLoading(false);
    }
    load();

    return () => store.reset();
  }, [params.workspaceId]);

  const handleFileUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const parsed = await parseFile(file);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("workspace_id", params.workspaceId);
        formData.append("name", parsed.fileName);
        formData.append("file_type", parsed.fileType);
        formData.append("column_schema", JSON.stringify(parsed.columns));
        formData.append("data", JSON.stringify(parsed.rows));
        formData.append("row_count", String(parsed.rowCount));

        const res = await fetch("/api/dataset", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const dataset = await res.json();
          store.addDataset(dataset);
          setShowUpload(false);
          setTab("data");
        }
      } catch (err) {
        store.setError(
          err instanceof Error ? err.message : "Upload failed"
        );
      }
      setUploading(false);
    },
    [params.workspaceId, store]
  );

  const handleSaveAnalysis = useCallback(
    async (config: AnalysisConfig) => {
      if (!activeDataset) return;

      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: params.workspaceId,
          dataset_id: activeDataset.id,
          config,
        }),
      });

      if (res.ok) {
        const analysis = await res.json();
        store.addAnalysis(analysis);
        setTab("dashboard");
      }
    },
    [activeDataset, params.workspaceId, store]
  );

  const handleColumnTypeChange = useCallback(
    (columnName: string, newType: ColumnType) => {
      if (store.activeDatasetId) {
        store.updateColumnType(store.activeDatasetId, columnName, newType);
      }
    },
    [store]
  );

  const handleExportCSV = useCallback(() => {
    if (!activeDataset) return;
    const headers = activeDataset.column_schema.map((c) => c.name);
    const csvRows = [headers.join(",")];
    activeDataset.data.forEach((row) => {
      csvRows.push(headers.map((h) => JSON.stringify(row[h] ?? "")).join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeDataset.name}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeDataset]);

  if (store.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Loading workspace...
        </div>
      </div>
    );
  }

  const continuousCols = activeDataset?.column_schema.filter(
    (c) => c.type === "continuous"
  ) ?? [];
  const nominalCols = activeDataset?.column_schema.filter(
    (c) => c.type === "nominal" || c.type === "ordinal"
  ) ?? [];

  return (
    <>
      <Sidebar
        datasets={store.datasets}
        activeDatasetId={store.activeDatasetId}
        onSelectDataset={store.setActiveDataset}
        onAddDataset={() => setShowUpload(true)}
        workspaceTitle={store.workspace?.title ?? "Workspace"}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          userEmail={userEmail ?? undefined}
          onShare={() => setShowShare(true)}
        />

        {/* Tab bar */}
        <div className="border-b border-border px-4 flex items-center gap-0 shrink-0">
          {(["data", "graph", "analysis", "dashboard"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors capitalize ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4">
          {/* Upload overlay */}
          {showUpload && (
            <div className="max-w-lg mx-auto py-8">
              <FileDropZone onFileParsed={handleFileUpload} disabled={uploading} />
              {uploading && (
                <p className="text-sm text-center text-muted-foreground mt-2 animate-pulse">
                  Parsing and uploading...
                </p>
              )}
              <button
                onClick={() => setShowUpload(false)}
                className="block mx-auto mt-3 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          )}

          {/* No dataset state */}
          {!showUpload && store.datasets.length === 0 && (
            <div className="max-w-lg mx-auto py-12">
              <FileDropZone onFileParsed={handleFileUpload} disabled={uploading} />
            </div>
          )}

          {/* Data tab */}
          {!showUpload && activeDataset && tab === "data" && (
            <DataTable
              data={activeDataset.data}
              columns={activeDataset.column_schema}
              onColumnTypeChange={handleColumnTypeChange}
              onColumnDragStart={(col) => {
                setTab("graph");
              }}
            />
          )}

          {/* Graph tab */}
          {!showUpload && activeDataset && tab === "graph" && (
            <GraphBuilder
              data={activeDataset.data}
              columns={activeDataset.column_schema}
              onSaveAnalysis={handleSaveAnalysis}
            />
          )}

          {/* Analysis tab */}
          {!showUpload && activeDataset && tab === "analysis" && (
            <div className="space-y-4 max-w-3xl">
              {/* Column selector */}
              <div className="flex items-center gap-3 flex-wrap">
                <div>
                  <label className="text-[10px] uppercase text-muted-foreground block">
                    Primary Column
                  </label>
                  <select
                    value={analysisColumn ?? ""}
                    onChange={(e) => setAnalysisColumn(e.target.value || null)}
                    className="px-2 py-1 text-xs border border-border rounded bg-background"
                  >
                    <option value="">Select column...</option>
                    {continuousCols.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-muted-foreground block">
                    Second Column (optional)
                  </label>
                  <select
                    value={analysisColumn2 ?? ""}
                    onChange={(e) => setAnalysisColumn2(e.target.value || null)}
                    className="px-2 py-1 text-xs border border-border rounded bg-background"
                  >
                    <option value="">None</option>
                    {continuousCols.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-muted-foreground block">
                    Group Column (optional)
                  </label>
                  <select
                    value={groupColumn ?? ""}
                    onChange={(e) => setGroupColumn(e.target.value || null)}
                    className="px-2 py-1 text-xs border border-border rounded bg-background"
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

              {analysisColumn && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <DescriptiveStats
                    values={activeDataset.data.map((r) => r[analysisColumn])}
                    columnName={analysisColumn}
                  />
                  <ControlChart
                    values={activeDataset.data.map((r) => r[analysisColumn])}
                    columnName={analysisColumn}
                  />
                  <ProcessCapability
                    values={activeDataset.data.map((r) => r[analysisColumn])}
                    columnName={analysisColumn}
                  />
                  <DistributionFit
                    values={activeDataset.data.map((r) => r[analysisColumn])}
                    columnName={analysisColumn}
                  />
                  {analysisColumn2 && (
                    <div className="lg:col-span-2">
                      <Regression
                        xValues={activeDataset.data.map((r) => r[analysisColumn])}
                        yValues={activeDataset.data.map((r) => r[analysisColumn2])}
                        xName={analysisColumn}
                        yName={analysisColumn2}
                      />
                    </div>
                  )}
                  {groupColumn && (
                    <div className="lg:col-span-2">
                      <HypothesisTest
                        data={activeDataset.data}
                        groupColumn={groupColumn}
                        valueColumn={analysisColumn}
                      />
                    </div>
                  )}
                </div>
              )}

              {!analysisColumn && (
                <p className="text-sm text-muted-foreground">
                  Select a continuous column above to run analysis.
                </p>
              )}
            </div>
          )}

          {/* Dashboard tab */}
          {!showUpload && activeDataset && tab === "dashboard" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Dashboard</h2>
                <DashboardToolbar onExportCSV={handleExportCSV} />
              </div>
              <DashboardGrid
                analyses={datasetAnalyses}
                data={activeDataset.data}
                onRemoveAnalysis={(id) => store.removeAnalysis(id)}
              />
            </div>
          )}

          {/* Errors */}
          {store.error && (
            <div className="fixed bottom-4 right-4 bg-destructive text-primary-foreground px-4 py-2 rounded-lg shadow-lg text-sm">
              {store.error}
              <button
                onClick={() => store.setError(null)}
                className="ml-2 font-bold"
              >
                ×
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Share dialog */}
      <ShareDialog
        workspaceId={params.workspaceId}
        isOpen={showShare}
        onClose={() => setShowShare(false)}
      />
    </>
  );
}
