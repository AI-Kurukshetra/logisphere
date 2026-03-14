"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Log {
  timestamp: string;
  level: "info" | "error" | "success" | "warn";
  message: string;
  data?: unknown;
}

type OnboardingPreset = {
  category: string;
  label: string;
  sort_order: number;
  value: string;
};

interface OnboardingFormProps {
  fullNameDefault?: string | null;
  presets: OnboardingPreset[];
}

type PresetFieldProps = {
  category: string;
  customLabel?: string;
  disabled: boolean;
  label: string;
  name: string;
  options: OnboardingPreset[];
  placeholder: string;
  required?: boolean;
};

function selectClass(disabled: boolean) {
  return `mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white ${
    disabled ? "opacity-50" : ""
  }`;
}

function inputClass(disabled: boolean) {
  return `mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white ${
    disabled ? "opacity-50" : ""
  }`;
}

function PresetField({
  category,
  customLabel = "Custom value",
  disabled,
  label,
  name,
  options,
  placeholder,
  required = false,
}: PresetFieldProps) {
  const [mode, setMode] = useState<"custom" | "preset">(
    options.length > 0 ? "preset" : "custom"
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {options.length > 0 ? (
          <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1 text-xs">
            <button
              type="button"
              onClick={() => setMode("preset")}
              disabled={disabled}
              className={`rounded-full px-3 py-1 font-semibold ${
                mode === "preset"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600"
              }`}
            >
              Preset
            </button>
            <button
              type="button"
              onClick={() => setMode("custom")}
              disabled={disabled}
              className={`rounded-full px-3 py-1 font-semibold ${
                mode === "custom"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600"
              }`}
            >
              Custom
            </button>
          </div>
        ) : null}
      </div>

      {mode === "preset" && options.length > 0 ? (
        <select
          name={name}
          className={selectClass(disabled)}
          required={required}
          disabled={disabled}
          defaultValue={options[0]?.value ?? ""}
        >
          {options.map((option) => (
            <option key={`${category}-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={name}
          type="text"
          placeholder={placeholder}
          className={inputClass(disabled)}
          required={required}
          disabled={disabled}
        />
      )}

      {mode === "preset" && options.length > 0 ? (
        <p className="mt-2 text-xs text-slate-500">
          Choose from database-backed onboarding presets.
        </p>
      ) : (
        <p className="mt-2 text-xs text-slate-500">{customLabel}</p>
      )}
    </div>
  );
}

export function OnboardingForm({
  fullNameDefault,
  presets,
}: OnboardingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const presetMap = useMemo(() => {
    const map = new Map<string, OnboardingPreset[]>();
    for (const preset of presets) {
      const existing = map.get(preset.category) ?? [];
      existing.push(preset);
      map.set(preset.category, existing);
    }
    return map;
  }, [presets]);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-rose-600";
      case "success":
        return "text-emerald-600";
      case "warn":
        return "text-yellow-600";
      default:
        return "text-slate-600";
    }
  };

  const getLevelBgColor = (level: string) => {
    switch (level) {
      case "error":
        return "bg-rose-50";
      case "success":
        return "bg-emerald-50";
      case "warn":
        return "bg-yellow-50";
      default:
        return "bg-slate-50";
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setLogs([]);
    setShowLogs(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      businessUnitName: formData.get("businessUnitName"),
      companyName: formData.get("companyName"),
      facilityCity: formData.get("facilityCity"),
      facilityCode: formData.get("facilityCode"),
      facilityCountry: formData.get("facilityCountry"),
      facilityName: formData.get("facilityName"),
      fullName: formData.get("fullName"),
      jobTitle: formData.get("jobTitle"),
      regionName: formData.get("regionName"),
    };

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.logs) {
        setLogs(result.logs);
        setTimeout(scrollToBottom, 100);
      }

      if (!response.ok) {
        setError(result.error || "Onboarding failed");
        setIsSubmitting(false);
        return;
      }

      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMsg);
      setLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          level: "error",
          message: `Network error: ${errorMsg}`,
        },
      ]);
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="text-sm font-medium text-slate-700">Your name</label>
          <input
            name="fullName"
            type="text"
            defaultValue={fullNameDefault ?? ""}
            placeholder="Avery Morgan"
            className={inputClass(isSubmitting)}
            required
            disabled={isSubmitting}
          />
        </div>

        <PresetField
          category="job_title"
          disabled={isSubmitting}
          label="Job title"
          name="jobTitle"
          options={presetMap.get("job_title") ?? []}
          placeholder="System Administrator"
        />

        <PresetField
          category="company_name"
          disabled={isSubmitting}
          label="Company name"
          name="companyName"
          options={presetMap.get("company_name") ?? []}
          placeholder="Northstar Freight"
          required
        />

        <div className="grid gap-5 md:grid-cols-2">
          <PresetField
            category="region_name"
            disabled={isSubmitting}
            label="Primary region"
            name="regionName"
            options={presetMap.get("region_name") ?? []}
            placeholder="North America"
            required
          />
          <PresetField
            category="business_unit_name"
            disabled={isSubmitting}
            label="Business unit"
            name="businessUnitName"
            options={presetMap.get("business_unit_name") ?? []}
            placeholder="Enterprise Logistics"
            required
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <PresetField
            category="facility_name"
            disabled={isSubmitting}
            label="Headquarters facility"
            name="facilityName"
            options={presetMap.get("facility_name") ?? []}
            placeholder="Austin Distribution Hub"
            required
          />
          <div>
            <label className="text-sm font-medium text-slate-700">Facility code</label>
            <input
              name="facilityCode"
              type="text"
              placeholder="AUS-HQ"
              className={`${inputClass(isSubmitting)} uppercase`}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <PresetField
            category="facility_city"
            disabled={isSubmitting}
            label="Facility city"
            name="facilityCity"
            options={presetMap.get("facility_city") ?? []}
            placeholder="Austin"
          />
          <PresetField
            category="facility_country"
            disabled={isSubmitting}
            label="Facility country"
            name="facilityCountry"
            options={presetMap.get("facility_country") ?? []}
            placeholder="United States"
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="mb-2 text-sm font-semibold text-rose-900">Onboarding Failed</p>
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Creating Workspace..." : "Create Workspace"}
        </button>
      </form>

      {showLogs ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Onboarding Logs</h3>
            <button
              type="button"
              onClick={() => setShowLogs(false)}
              className="text-xs text-slate-500 underline hover:text-slate-700"
            >
              Hide
            </button>
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3">
            {logs.length === 0 ? (
              <p className="text-xs italic text-slate-500">Waiting for logs...</p>
            ) : null}
            {logs.map((log, index) => (
              <div
                key={`${log.timestamp}-${index}`}
                className={`rounded border-l-2 px-2 py-1 text-xs ${getLevelBgColor(
                  log.level
                )} border-l-slate-300`}
              >
                <div className="flex items-start gap-2">
                  <span className="font-mono text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`font-semibold ${getLevelColor(log.level)}`}>
                    [{log.level.toUpperCase()}]
                  </span>
                  <span className="flex-grow break-words text-slate-700">{log.message}</span>
                </div>
                {log.data !== undefined ? (
                  <div className="ml-[100px] mt-1 break-all font-mono text-xs text-slate-600">
                    {JSON.stringify(log.data, null, 2)}
                  </div>
                ) : null}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      ) : null}
    </>
  );
}
