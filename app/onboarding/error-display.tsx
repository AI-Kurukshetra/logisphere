"use client";

import { useEffect } from "react";

export function OnboardingErrorDisplay({ error }: { error: string }) {
  useEffect(() => {
    console.error("🚨 Onboarding Error:", error);
  }, [error]);

  return (
    <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
      <p className="text-sm font-semibold text-rose-900 mb-2">❌ Onboarding Failed</p>
      <p className="text-sm text-rose-700 mb-2">{error}</p>
      <p className="text-xs text-rose-600">💡 Check your browser console (F12) for detailed error information.</p>
    </div>
  );
}
