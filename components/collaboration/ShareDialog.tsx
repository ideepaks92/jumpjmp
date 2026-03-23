"use client";

import { useState, useCallback } from "react";

interface ShareDialogProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareDialog({ workspaceId, isOpen, onClose }: ShareDialogProps) {
  const [permission, setPermission] = useState<"view" | "edit" | "fork">("view");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const createShare = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspaceId, permission }),
      });
      if (res.ok) {
        const share = await res.json();
        setShareUrl(`${window.location.origin}/s/${share.id}`);
      }
    } catch {
      // handled by missing shareUrl
    }
    setLoading(false);
  }, [workspaceId, permission]);

  const copyLink = useCallback(async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[420px] bg-background border border-border rounded-xl shadow-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Share Workspace</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-lg"
          >
            ×
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground font-medium">
            Permission
          </label>
          <div className="flex gap-2">
            {(["view", "edit", "fork"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPermission(p)}
                className={`px-3 py-1.5 text-xs rounded-md border transition-colors capitalize ${
                  permission === p
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {permission === "view" && "Recipients can view charts and data but cannot edit."}
            {permission === "edit" && "Recipients can edit analyses and add charts."}
            {permission === "fork" && "Recipients can duplicate this workspace to their account."}
          </p>
        </div>

        {shareUrl ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 text-xs border border-border rounded-md bg-muted font-mono"
              />
              <button
                onClick={copyLink}
                className="px-3 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:opacity-90"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={createShare}
            disabled={loading}
            className="w-full px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creating link..." : "Create Share Link"}
          </button>
        )}
      </div>
    </>
  );
}
