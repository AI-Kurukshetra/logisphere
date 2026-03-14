import Link from "next/link";
import { signOutAction } from "@/app/auth/actions";
import { getRoleLabel } from "@/lib/roles";
import { workspaceRoutes } from "@/manager_directory/routes";
import { getInitials } from "@/lib/utils";

export function WorkspaceProfileMenu({
  email,
  fullName,
  role,
  avatarUrl,
}: {
  email: string | null;
  fullName: string | null;
  role: string | null | undefined;
  avatarUrl?: string | null;
}) {
  const displayName = fullName || email || "Workspace User";
  const initials = getInitials(fullName, email);

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-full border border-slate-200 bg-white px-2 py-2 pr-3 text-left shadow-sm transition hover:border-slate-300">
        {avatarUrl ? (
          <img
            alt={displayName}
            className="h-10 w-10 rounded-full object-cover"
            src={avatarUrl}
          />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
            {initials}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
            {getRoleLabel(role)}
          </p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition group-open:bg-slate-100">
          <span className="text-lg leading-none">⋯</span>
        </span>
      </summary>

      <div className="absolute right-0 z-20 mt-3 w-60 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.14)]">
        <div className="border-b border-slate-100 px-3 py-3">
          <p className="truncate text-sm font-semibold text-slate-950">{displayName}</p>
          <p className="truncate text-xs text-slate-500">{email || "No email"}</p>
        </div>

        <div className="px-1 py-2">
          <Link
            href={workspaceRoutes.settingsProfile}
            className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
          >
            Profile
          </Link>
          <Link
            href={workspaceRoutes.settingsAudit}
            className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
          >
            Audit Trail
          </Link>
        </div>

        <div className="border-t border-slate-100 px-1 pt-2">
          <form action={signOutAction}>
            <button
              type="submit"
              className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </details>
  );
}
