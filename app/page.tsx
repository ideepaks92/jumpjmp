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
      <nav className="flex items-center justify-between px-6 lg:px-10 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">J</span>
          </div>
          <span className="font-semibold text-base tracking-tight">JumpJMP</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/demo"
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90"
          >
            Try Demo
          </a>
          <button
            onClick={handleGoogleSignIn}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Sign in
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center px-6 pt-20 pb-32 lg:pt-32 lg:pb-40">
        <div className="max-w-xl text-center space-y-5">
          <p className="text-sm font-medium tracking-wide uppercase text-primary">
            Statistical Analysis for Engineers
          </p>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
            Data in. Decisions out.
            <br />
            <span className="text-muted-foreground">No installs, no license keys.</span>
          </h1>
          <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            Upload CSV or Excel, build charts, run SPC and Cpk analysis — then
            share a live link with your team.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href="/demo"
              className="px-6 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 w-full sm:w-auto text-center"
            >
              Try it now — no sign-up
            </a>
            <button
              onClick={handleGoogleSignIn}
              className="px-6 py-3 border border-border text-sm font-medium rounded-lg hover:bg-muted w-full sm:w-auto"
            >
              Sign in with Google
            </button>
          </div>
        </div>

        {/* Auth form (secondary) */}
        <div className="mt-16 max-w-sm w-full">
          {sent ? (
            <div className="bg-accent rounded-xl p-5 text-center">
              <p className="text-sm font-medium text-accent-foreground">
                Check your email for a sign-in link
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sent to <strong>{email}</strong>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or sign in with email</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <form onSubmit={handleMagicLink} className="flex gap-2">
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2.5 bg-foreground text-background text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 shrink-0"
                >
                  {loading ? "..." : "Send link"}
                </button>
              </form>
              {error && (
                <p className="text-xs text-destructive text-center">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Capabilities */}
        <div className="mt-28 max-w-3xl w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wider uppercase text-primary">
                SPC
              </p>
              <h3 className="text-base font-semibold leading-snug">
                Control Charts & Process Capability
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                X-bar/R, Individuals/MR, Cp/Cpk/Pp/Ppk with spec limits.
                Detect process shifts as they happen.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wider uppercase text-primary">
                Visualization
              </p>
              <h3 className="text-base font-semibold leading-snug">
                Drag-and-Drop Graph Builder
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Scatter, histogram, box, heatmap — drag columns to axes.
                Interactive zoom, pan, and brush selection.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wider uppercase text-primary">
                Collaboration
              </p>
              <h3 className="text-base font-semibold leading-snug">
                Share a Link, Not a File
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                View, edit, or fork any workspace. No installs for
                recipients. Comments anchored to charts.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-5">
        <p className="text-xs text-muted-foreground text-center">
          JumpJMP — statistical analysis for engineers who ship
        </p>
      </footer>
    </div>
  );
}
