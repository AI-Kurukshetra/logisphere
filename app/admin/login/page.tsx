import Link from "next/link";
import { redirect } from "next/navigation";
import { adminSignInAction } from "@/app/admin/login/actions";
import { getCurrentAccount } from "@/lib/supabase/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const account = await getCurrentAccount();
  const params = await searchParams;
  const error = readParam(params, "error");

  if (
    account.user &&
    (account.profile?.role === "admin" ||
      account.user.app_metadata?.platform_role === "admin")
  ) {
    redirect("/admin/dashboard");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.18),transparent_26%),linear-gradient(180deg,#eef4ff_0%,#f7fafc_48%,#eef2f7_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-7xl overflow-hidden rounded-[2.25rem] border border-white/60 bg-white/70 shadow-[0_30px_120px_rgba(15,23,42,0.16)] backdrop-blur-xl lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-[linear-gradient(145deg,#08152a_0%,#10294d_42%,#0b6c78_100%)] px-6 py-8 text-white sm:px-8 lg:border-b-0 lg:border-r lg:px-10 lg:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_24%)]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-10">
              <div className="flex items-center justify-between gap-4">
                <Link href="/" className="inline-flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] bg-white text-xs font-bold uppercase tracking-[0.3em] text-slate-950 shadow-[0_14px_30px_rgba(255,255,255,0.18)]">
                    LS
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-100">
                      Logisphere
                    </p>
                    <p className="text-sm text-white/70">Administrative console</p>
                  </div>
                </Link>

                <div className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-100">
                  Restricted
                </div>
              </div>

              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-100">
                  Platform Operations
                </p>
                <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl">
                  Control tower for access, hierarchy, compliance, reporting, and integrations.
                </h1>
                <p className="mt-5 max-w-lg text-base leading-7 text-cyan-50/88">
                  This admin workspace is built around the blueprint’s system-administrator scope:
                  user role management, multi-location hierarchy, compliance monitoring, custom
                  reporting, API integrations, alerts, and platform-wide operational governance.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-8 sm:px-8 lg:px-10">
          <div className="w-full max-w-md">
            <div className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,250,252,0.92))] p-6 shadow-[0_22px_60px_rgba(15,23,42,0.08)] sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Admin Sign In
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                    Enter the console
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Authenticate with your admin account to open the Logisphere control layer.
                  </p>
                </div>
                <div className="rounded-[1.2rem] bg-slate-950 px-3 py-2 text-right text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                    Access
                  </p>
                  <p className="mt-1 text-sm font-semibold">Secure</p>
                </div>
              </div>

              {error ? (
                <div className="mt-6 rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <form action={adminSignInAction} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900">
                    Admin Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="admin@logisphere.com"
                    className="w-full rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900">
                    Admin Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    className="w-full rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-full bg-[linear-gradient(90deg,#0f172a,#1d4ed8)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(37,99,235,0.28)] transition hover:brightness-110"
                >
                  Open Admin Console
                </button>
              </form>
              <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href="/auth"
                  className="font-semibold text-blue-700 transition hover:text-blue-900"
                >
                  User login
                </Link>
                <Link
                  href="/"
                  className="text-slate-500 transition hover:text-slate-900"
                >
                  Back to home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
