import Link from "next/link";
import { createAdminShipmentAction } from "@/app/admin/actions";
import { requirePlatformAdmin } from "@/lib/supabase/session";
import { AdminConsoleShell } from "@/manager_directory/admin/admin-console-shell";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export const metadata = {
  title: "Shipment Tracking",
  description: "Multi-carrier real-time tracking",
};

export default async function ShipmentTrackingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { profile, supabase } = await requirePlatformAdmin();
  const params = await searchParams;
  const error = readParam(params, "error");
  const message = readParam(params, "message");
  const compose = readParam(params, "compose");
  const companyId = profile?.company_id ?? null;

  const [shipmentsRes, carriersRes] = await Promise.all([
    companyId
      ? supabase
          .from("shipments")
          .select("id, tracking_number, status, shipped_at, delivered_at, carrier_id")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(25)
      : Promise.resolve({
          data: [] as Array<{
            carrier_id: string;
            delivered_at: string | null;
            id: string;
            shipped_at: string | null;
            status: string;
            tracking_number: string;
          }>,
        }),
    supabase.from("carriers").select("id, name"),
  ]);
  const shipments = shipmentsRes.data ?? [];
  const carriers = (carriersRes.data ?? []) as Array<{ id: string; name: string }>;
  const inTransit = shipments.filter((shipment) => shipment.status === "in_transit").length;
  const delivered = shipments.filter((shipment) => shipment.status === "delivered").length;
  const exception = shipments.filter((shipment) => shipment.status === "exception").length;

  const shipmentStats = [
    { label: "Total Shipments", value: String(shipments.length), icon: "📦" },
    { label: "In Transit", value: String(inTransit), icon: "🚚" },
    { label: "Delivered", value: String(delivered), icon: "✓" },
    { label: "Exception", value: String(exception), icon: "⚠️" },
  ];

  const activeShipments = shipments.map((shipment) => ({
    carrier: carriers.find((carrier) => carrier.id === shipment.carrier_id)?.name ?? "—",
    id: shipment.tracking_number,
    progress:
      shipment.status === "delivered"
        ? 100
        : shipment.status === "in_transit"
          ? 50
          : shipment.status === "out_for_delivery"
            ? 80
            : 25,
    status: shipment.status,
  }));

  return (
    <AdminConsoleShell active="tracking">
      <div>
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Real-time Shipment Tracking</h1>
            <p className="mt-2 text-sm text-gray-600">Multi-carrier tracking integration with unified visibility</p>
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

          <div className="mb-8 grid grid-cols-4 gap-4">
            {shipmentStats.map((stat, idx) => (
              <div
                key={stat.label}
                className="rounded-lg border border-gray-300 bg-white p-6"
                style={{ animation: `fadeIn 0.5s ease-out ${idx * 0.1}s both` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-600">{stat.label}</p>
                    <p className="mt-3 text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <span className="text-3xl">{stat.icon}</span>
                </div>
              </div>
            ))}
          </div>

          <div
            className="mb-8 rounded-lg border border-gray-300 bg-white p-6"
            style={{ animation: "fadeIn 0.6s ease-out 0.2s both" }}
          >
            <h2 className="mb-4 text-lg font-bold text-gray-900">Tracking Controls</h2>
            <div className="grid gap-3 md:grid-cols-4">
              <Link
                href={companyId ? "/admin/tracking?compose=shipment" : "/admin/settings?compose=bootstrap"}
                className="rounded bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Track Shipment
              </Link>
              <Link
                href="/admin/carriers"
                className="rounded bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Carrier Setup
              </Link>
              <Link
                href="/admin/export?entity=shipments"
                className="rounded border border-gray-300 px-4 py-2.5 text-center text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Export Data
              </Link>
              <Link
                href="/admin/settings"
                className="rounded border border-gray-300 px-4 py-2.5 text-center text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Settings
              </Link>
            </div>
          </div>

          {compose === "shipment" ? (
            <form
              action={createAdminShipmentAction}
              className="mb-8 rounded-lg border border-gray-300 bg-white p-6"
              style={{ animation: "fadeIn 0.6s ease-out 0.24s both" }}
            >
              <h2 className="text-lg font-bold text-gray-900">New Shipment</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <select
                  name="carrierId"
                  className="rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select carrier</option>
                  {carriers.map((carrier) => (
                    <option key={carrier.id} value={carrier.id}>
                      {carrier.name}
                    </option>
                  ))}
                </select>
                <input
                  name="trackingNumber"
                  placeholder="1Z999..."
                  className="rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  required
                />
                <select
                  name="status"
                  className="rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  {[
                    "created",
                    "picked_up",
                    "in_transit",
                    "out_for_delivery",
                    "delivered",
                    "exception",
                  ].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  type="submit"
                  className="rounded bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Create Shipment
                </button>
                <Link
                  href="/admin/tracking"
                  className="rounded border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                >
                  Cancel
                </Link>
              </div>
            </form>
          ) : null}

          <div
            className="rounded-lg border border-gray-300 bg-white overflow-hidden"
            style={{ animation: "fadeIn 0.6s ease-out 0.3s both" }}
          >
            <div className="border-b border-gray-300 p-6">
              <h2 className="text-lg font-bold text-gray-900">Active Shipments</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {activeShipments.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  No shipments in scope. Data is scoped to your company when set.
                </div>
              ) : (
                activeShipments.map((shipment, idx) => (
                  <div
                    key={`${shipment.id}-${idx}`}
                    className="p-6 hover:bg-gray-50"
                    style={{ animation: `fadeIn 0.5s ease-out ${0.35 + idx * 0.05}s both` }}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{shipment.id}</p>
                        <p className="mt-1 text-sm text-gray-600">{shipment.carrier}</p>
                      </div>
                      <span
                        className={`rounded px-2 py-1 text-xs font-semibold ${
                          shipment.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : shipment.status === "exception"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {shipment.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div className="h-2 rounded-full bg-blue-500" style={{ width: `${shipment.progress}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-gray-600">{shipment.progress}% complete</p>
                  </div>
                ))
              )}
            </div>
          </div>
      </div>
    </AdminConsoleShell>
  );
}
