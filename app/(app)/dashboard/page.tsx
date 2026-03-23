"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Workspace } from "@/lib/store/workspace-store";

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }
      setUserEmail(user.email ?? null);

      const res = await fetch("/api/workspace");
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function createWorkspace() {
    setCreating(true);
    const res = await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled Workspace" }),
    });
    if (res.ok) {
      const ws = await res.json();
      router.push(`/w/${ws.id}`);
    }
    setCreating(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Top bar */}
      <header className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">J</span>
          </div>
          <span className="font-semibold">JumpJMP</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{userEmail}</span>
          <button
            onClick={handleSignOut}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Workspaces</h1>
            <button
              onClick={createWorkspace}
              disabled={creating}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {creating ? "Creating..." : "New Workspace"}
            </button>
          </div>

          {workspaces.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
              <h3 className="font-medium text-lg">No workspaces yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first workspace to start analyzing data.
              </p>
              <button
                onClick={createWorkspace}
                disabled={creating}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                Create Workspace
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => router.push(`/w/${ws.id}`)}
                  className="text-left border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-sm transition-all"
                >
                  <h3 className="font-medium truncate">{ws.title}</h3>
                  {ws.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {ws.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Updated{" "}
                    {new Date(ws.updated_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
