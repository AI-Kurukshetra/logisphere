"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};

export function MobileInstallBanner() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!installEvent) return null;

  return (
    <div className="rounded-[1.4rem] border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-sm font-semibold text-emerald-900">Install Field Ops App</p>
      <p className="mt-1 text-xs text-emerald-700">
        Add this to your home screen for faster mobile access and app-like navigation.
      </p>
      <button
        className="mt-3 rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600"
        onClick={async () => {
          await installEvent.prompt();
          setInstallEvent(null);
        }}
        type="button"
      >
        Install App
      </button>
    </div>
  );
}
