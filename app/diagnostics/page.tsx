"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Diagnostic {
  name: string;
  status: string;
  details?: string;
  error_code?: string;
  error_details?: any;
}

export default function DiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDiagnostics = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/diagnostics");
        const data = await response.json();
        setDiagnostics(data);
        console.log("Diagnostics:", data);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnostics();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold text-slate-950">
            System Diagnostics
          </h1>
          <p className="mt-2 text-slate-600">
            Check if your database and tables are properly configured
          </p>
        </div>

        {loading && (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-[color:var(--accent)]"></div>
            <p className="mt-4 text-slate-600">Running diagnostics...</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
            <p className="text-sm font-semibold text-rose-900">Error</p>
            <p className="mt-2 text-sm text-rose-700">{error}</p>
          </div>
        )}

        {diagnostics && !loading && (
          <div className="space-y-4">
            {diagnostics.checks?.map((check: Diagnostic, index: number) => (
              <div
                key={index}
                className={`rounded-lg border p-4 ${
                  check.status.includes("✅")
                    ? "border-green-200 bg-green-50"
                    : check.status.includes("⚠️")
                      ? "border-yellow-200 bg-yellow-50"
                      : "border-rose-200 bg-rose-50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950">
                      {check.name}
                    </p>
                    {check.details && (
                      <p className="mt-1 text-sm text-slate-600">
                        {check.details}
                      </p>
                    )}
                    {check.error_code && (
                      <p className="mt-1 text-xs font-mono text-slate-500">
                        Code: {check.error_code}
                      </p>
                    )}
                    {check.error_details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-700">
                          Show details
                        </summary>
                        <pre className="mt-2 overflow-auto rounded bg-white/50 p-2 text-xs">
                          {JSON.stringify(check.error_details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-sm font-semibold">
                    {check.status}
                  </div>
                </div>
              </div>
            ))}

            {diagnostics.errors && diagnostics.errors.length > 0 && (
              <div className="mt-8 rounded-lg border border-rose-200 bg-rose-50 p-6">
                <h2 className="text-lg font-semibold text-rose-900">
                  Errors Found
                </h2>
                <ul className="mt-4 space-y-2">
                  {diagnostics.errors.map((err: string, idx: number) => (
                    <li key={idx} className="text-sm text-rose-700">
                      • {err}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 space-y-3">
                  <h3 className="font-semibold text-rose-900">
                    How to fix this:
                  </h3>
                  <ol className="space-y-2 text-sm text-rose-700">
                    <li>
                      1. Go to{" "}
                      <a
                        href="https://app.supabase.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:opacity-75"
                      >
                        Supabase Dashboard
                      </a>
                    </li>
                    <li>2. Open SQL Editor</li>
                    <li>3. Copy the SQL from `/migrations/001_initial_schema.sql`</li>
                    <li>4. Paste and run it in the SQL Editor</li>
                    <li>5. Come back and refresh this page</li>
                  </ol>
                </div>
              </div>
            )}

            {diagnostics.errors?.length === 0 && (
              <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-6">
                <p className="text-lg font-semibold text-green-900">
                  ✅ All systems operational!
                </p>
                <p className="mt-2 text-sm text-green-700">
                  Your database is properly configured. You can proceed with
                  onboarding.
                </p>
                <Link
                  href="/onboarding"
                  className="mt-4 inline-block rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
                >
                  Go to Onboarding →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
