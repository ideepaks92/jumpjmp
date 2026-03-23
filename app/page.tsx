"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (authError) setError(authError.message);
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">J</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">JumpJMP</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/demo"
            className="px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Try Demo
          </a>
          <button
            onClick={handleGoogleSignIn}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-5xl font-bold tracking-tight leading-tight">
            Statistical analysis
            <br />
            <span className="text-primary">built for engineers</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Upload CSV or Excel files, build interactive charts, run SPC and DOE
            analysis — then share a link with your team. No install, no license
            keys.
          </p>

          <a
            href="/demo"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Try it now — no sign-up needed
          </a>

          {/* Auth form */}
          {sent ? (
            <div className="bg-accent border border-primary/20 rounded-xl p-6 max-w-md mx-auto">
              <p className="text-accent-foreground font-medium">
                Check your email for a sign-in link.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                We sent a magic link to <strong>{email}</strong>
              </p>
            </div>
          ) : (
            <div className="max-w-md mx-auto space-y-3">
              <form onSubmit={handleMagicLink} className="flex gap-2">
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Get started"}
                </button>
              </form>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <button
                onClick={handleGoogleSignIn}
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Feature cards */}
        <div className="mt-24 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
          <div className="border border-border rounded-xl p-6 space-y-2">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-primary font-bold">
              Cp
            </div>
            <h3 className="font-semibold">SPC & Process Capability</h3>
            <p className="text-sm text-muted-foreground">
              Control charts, Cpk/Ppk, Western Electric rules. Everything you
              need for quality monitoring.
            </p>
          </div>
          <div className="border border-border rounded-xl p-6 space-y-2">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-primary font-bold">
              fx
            </div>
            <h3 className="font-semibold">Graph Builder</h3>
            <p className="text-sm text-muted-foreground">
              Drag columns to build scatter plots, histograms, box plots, and
              more. Interactive zoom, pan, and brush.
            </p>
          </div>
          <div className="border border-border rounded-xl p-6 space-y-2">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-primary font-bold">
              &lt;/&gt;
            </div>
            <h3 className="font-semibold">Share & Collaborate</h3>
            <p className="text-sm text-muted-foreground">
              One-click shareable links. View, edit, or fork any workspace.
              Comments anchored to charts.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-8 py-4">
        <p className="text-xs text-muted-foreground text-center">
          JumpJMP — Statistical analysis for engineers who ship.
        </p>
      </footer>
    </div>
  );
}
