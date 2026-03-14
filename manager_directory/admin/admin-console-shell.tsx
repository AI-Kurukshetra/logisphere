import Link from "next/link";
import { AdminSignOutForm } from "@/app/admin/_components/admin-sign-out-form";
import {
  getAdminSidebarItems,
  type AdminRouteKey,
} from "@/manager_directory/admin/navigation";

export function AdminConsoleShell({
  active,
  children,
}: Readonly<{
  active: AdminRouteKey;
  children: React.ReactNode;
}>) {
  const sidebarItems = getAdminSidebarItems(active);

  return (
    <div className="flex h-screen bg-gray-100">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <aside className="w-72 overflow-y-auto border-r border-gray-300 bg-white">
        <div className="sticky top-0 border-b border-gray-300 bg-white px-6 py-6">
          <h2 className="text-xl font-bold text-gray-900">ADMIN PANEL</h2>
          <p className="mt-1 text-xs text-gray-500">Logisphere Freight Intelligence</p>
        </div>

        <nav className="space-y-0 py-4">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 border-l-4 px-6 py-3.5 text-sm transition ${
                item.active
                  ? "border-l-blue-600 bg-blue-50 font-semibold text-blue-700"
                  : "border-l-transparent text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-300 px-6 py-4">
          <AdminSignOutForm />
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
