import Link from "next/link";
import {
  bootstrapAdminWorkspaceAction,
  resetAdminSettingsAction,
  saveAdminSettingsAction,
} from "@/app/admin/actions";
import { requirePlatformAdmin } from "@/lib/supabase/session";
import { AdminConsoleShell } from "@/manager_directory/admin/admin-console-shell";

const settingSections = [
  { title: "Organization Settings", icon: "🏢", items: ["Company Info", "Multi-Location Setup", "Business Units", "Branding"] },
  { title: "API & Integrations", icon: "⚙️", items: ["API Keys", "Webhooks", "OAuth", "Integration Logs"] },
  { title: "Notifications & Alerts", icon: "🔔", items: ["Email Settings", "Alert Rules", "Notification Templates", "Frequency Control"] },
  { title: "Compliance & Security", icon: "🔐", items: ["Security Policies", "Audit Trail", "Compliance Reports", "Data Retention"] },
  { title: "Data Management", icon: "💾", items: ["Data Import/Export", "Backup Settings", "Archive Policy", "Purge Rules"] },
  { title: "Platform Configuration", icon: "🧰", items: ["System Parameters", "Rate Limits", "Queue Settings", "Cache Config"] },
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type CompanySettings = {
  date_format?: string;
  default_currency?: string;
  default_language?: string;
  timezone?: string;
};

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export const metadata = {
  title: "Settings",
  description: "Admin system settings and configuration",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { company, profile } = await requirePlatformAdmin();
  const params = await searchParams;
  const error = readParam(params, "error");
  const message = readParam(params, "message");
  const compose = readParam(params, "compose");

  const settings: CompanySettings =
    company && typeof company.settings === "object" && company.settings
      ? (company.settings as CompanySettings)
      : {};

  return (
    <AdminConsoleShell active="settings">
      <div>
          <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Platform Settings</h1>
              <p className="mt-2 text-sm text-gray-600">
                Configure system parameters, integrations, and organization settings
              </p>
            </div>
            {!profile?.company_id ? (
              <Link
                href="/admin/settings?compose=bootstrap"
                className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
              >
                Bootstrap Workspace
              </Link>
            ) : null}
          </div>

          {error ? (
            <p className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}

          {compose === "bootstrap" || !profile?.company_id ? (
            <form
              action={bootstrapAdminWorkspaceAction}
              className="mb-8 rounded-lg border border-gray-300 bg-white p-6"
              style={{ animation: "fadeIn 0.6s ease-out 0.05s both" }}
            >
              <h2 className="text-lg font-bold text-gray-900">Workspace Bootstrap</h2>
              <p className="mt-2 text-sm text-gray-600">
                Create the first company, region, business unit, and facility so the rest of the admin modules can operate in company scope.
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input
                  name="companyName"
                  placeholder="Logisphere Logistics"
                  className="rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  required
                />
                <input
                  name="regionName"
                  placeholder="North America"
                  className="rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  required
                />
                <input
                  name="businessUnitName"
                  placeholder="Freight Operations"
                  className="rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  required
                />
                <input
                  name="facilityName"
                  placeholder="Chicago HQ"
                  className="rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  type="submit"
                  className="rounded bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Create Workspace
                </button>
                <Link
                  href="/admin/settings"
                  className="rounded border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                >
                  Cancel
                </Link>
              </div>
            </form>
          ) : null}

          <div className="grid grid-cols-2 gap-6">
            {settingSections.map((section, idx) => (
              <div
                key={section.title}
                className="rounded-lg border border-gray-300 bg-white p-6 transition hover:shadow-md"
                style={{ animation: `fadeIn 0.5s ease-out ${idx * 0.08}s both` }}
              >
                <div className="mb-4 flex items-start gap-3">
                  <span className="text-3xl">{section.icon}</span>
                  <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
                </div>
                <div className="space-y-2">
                  {section.items.map((item, itemIdx) => (
                    <button
                      key={item}
                      type="button"
                      className="w-full rounded px-4 py-2.5 text-left text-sm font-semibold text-gray-900 transition hover:bg-blue-50"
                      style={{ animation: `fadeIn 0.5s ease-out ${idx * 0.08 + itemIdx * 0.04}s both` }}
                    >
                      • {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <form
            action={saveAdminSettingsAction}
            className="mt-8 rounded-lg border border-gray-300 bg-white p-6"
            style={{ animation: "fadeIn 0.6s ease-out 0.45s both" }}
          >
            <h2 className="mb-6 text-lg font-bold text-gray-900">Quick Settings</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Default Currency</label>
                <select
                  name="currency"
                  defaultValue={
                    typeof settings.default_currency === "string" ? settings.default_currency : "USD"
                  }
                  className="w-full rounded border border-gray-300 p-2.5"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Default Language</label>
                <select
                  name="language"
                  defaultValue={
                    typeof settings.default_language === "string" ? settings.default_language : "English"
                  }
                  className="w-full rounded border border-gray-300 p-2.5"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Date Format</label>
                <select
                  name="dateFormat"
                  defaultValue={
                    typeof settings.date_format === "string" ? settings.date_format : "MM/DD/YYYY"
                  }
                  className="w-full rounded border border-gray-300 p-2.5"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Time Zone</label>
                <select
                  name="timezone"
                  defaultValue={typeof settings.timezone === "string" ? settings.timezone : "UTC"}
                  className="w-full rounded border border-gray-300 p-2.5"
                >
                  <option value="UTC">UTC</option>
                  <option value="EST - Eastern">EST - Eastern</option>
                  <option value="CST - Central">CST - Central</option>
                  <option value="PST - Pacific">PST - Pacific</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                className="rounded bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                disabled={!profile?.company_id}
              >
                Save Changes
              </button>
            </div>
          </form>

          <form action={resetAdminSettingsAction} className="mt-4">
            <button
              type="submit"
              className="rounded border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              disabled={!profile?.company_id}
            >
              Reset to Defaults
            </button>
          </form>

          <div
            className="mt-8 rounded-lg border border-gray-300 bg-white p-6"
            style={{ animation: "fadeIn 0.6s ease-out 0.55s both" }}
          >
            <h2 className="mb-4 text-lg font-bold text-gray-900">System Information</h2>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-600">Version</p>
                <p className="mt-2 text-lg font-bold text-gray-900">1.0.0</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600">Workspace</p>
                <p className="mt-2 text-lg font-bold text-gray-900">{company?.name || "Not configured"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600">Database</p>
                <p className="mt-2 text-lg font-bold text-gray-900">PostgreSQL</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600">Status</p>
                <p className="mt-2 text-lg font-bold text-green-600">Operational</p>
              </div>
            </div>
          </div>
      </div>
    </AdminConsoleShell>
  );
}
