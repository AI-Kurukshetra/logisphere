import { adminSignOutAction } from "@/app/admin/login/actions";

export function AdminSignOutForm() {
  return (
    <form action={adminSignOutAction}>
      <button
        type="submit"
        className="flex items-center gap-3 text-sm font-semibold text-red-600 transition hover:text-red-700"
      >
        <span>🚪</span>
        <span>Logout</span>
      </button>
    </form>
  );
}
