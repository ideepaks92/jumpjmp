"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/data-table/DataTable";
import { ChartRenderer } from "@/components/graph-builder/ChartRenderer";
import type { Dataset } from "@/lib/schemas/dataset";
import type { Analysis } from "@/lib/schemas/analysis";

interface ShareData {
  workspace: {
    id: string;
    title: string;
    description: string | null;
    owner_id: string;
  };
  datasets: Dataset[];
  analyses: Analysis[];
  permission: string;
}

export default function SharedPage() {
  const params = useParams<{ shareId: string }>();
  const [data, setData] = useState<ShareData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: share, error: shareError } = await supabase
        .from("shares")
        .select("*")
        .eq("id", params.shareId)
        .single();

      if (shareError || !share) {
        setError("This shared workspace is no longer available.");
        setLoading(false);
        return;
      }

      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        setError("This share link has expired.");
        setLoading(false);
        return;
      }

      const { data: workspace } = await supabase
        .from("workspaces")
        .select("*")
        .eq("id", share.workspace_id)
        .single();

      const { data: datasets } = await supabase
        .from("datasets")
        .select("*")
        .eq("workspace_id", share.workspace_id);

      const { data: analyses } = await supabase
        .from("analyses")
        .select("*")
        .eq("workspace_id", share.workspace_id);

      if (!workspace) {
        setError("Workspace not found.");
        setLoading(false);
        return;
      }

      setData({
        workspace,
        datasets: datasets ?? [],
        analyses: analyses ?? [],
        permission: share.permission,
      });
      if (datasets && datasets.length > 0) {
        setActiveDatasetId(datasets[0].id);
      }
      setLoading(false);
    }
    load();
  }, [params.shareId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading shared workspace...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-primary hover:underline"
          >
            Go to JumpJMP
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const activeDataset = data.datasets.find((d) => d.id === activeDatasetId);
  const datasetAnalyses = data.analyses.filter(
    (a) => a.dataset_id === activeDatasetId
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0 bg-sidebar-bg">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">J</span>
          </div>
          <span className="font-medium text-sm">{data.workspace.title}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
            {data.permission}
          </span>
        </div>
        {data.permission === "fork" && (
          <button
            onClick={() => router.push("/")}
            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-md"
          >
            Fork to My Account
          </button>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {data.datasets.length > 1 && (
          <div className="flex gap-1">
            {data.datasets.map((ds) => (
              <button
                key={ds.id}
                onClick={() => setActiveDatasetId(ds.id)}
                className={`px-3 py-1 text-xs rounded-md border ${
                  activeDatasetId === ds.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border"
                }`}
              >
                {ds.name}
              </button>
            ))}
          </div>
        )}

        {activeDataset && (
          <>
            <DataTable data={activeDataset.data} columns={activeDataset.column_schema} />
            {datasetAnalyses.map((analysis) => (
              <div key={analysis.id} className="border border-border rounded-lg p-4">
                <ChartRenderer config={analysis.config} data={activeDataset.data} />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
