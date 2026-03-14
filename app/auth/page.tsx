import Link from "next/link";
import {
  signInAction,
  signUpAction,
} from "@/app/auth/actions";
import { SIGNUP_ROLES } from "@/lib/roles";
import { redirectIfAuthenticated } from "@/lib/supabase/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
  fallback = ""
) {
  const value = params[key];
  if (typeof value === "string") {
    return value;
  }
  return fallback;
}

const modes = [
  { id: "signin", label: "Sign In" },
  { id: "signup", label: "Create Account" },
] as const;

const benefits = [
  { icon: "📋", label: "Automated Invoice Auditing", desc: "Recover savings instantly" },
  { icon: "🚚", label: "Real-time Tracking", desc: "Multi-carrier visibility" },
  { icon: "📊", label: "Cost Analytics", desc: "Understand your spend" },
];

export default async function AuthPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await redirectIfAuthenticated();

  const params = await searchParams;
  const mode = readParam(params, "mode", "signin");
  const error = readParam(params, "error");
  const message = readParam(params, "message");
  const next = readParam(params, "next", "/dashboard");

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 bg-[linear-gradient(180deg,#f8fbfc_0%,#eef4f7_50%,#e5edf2_100%)]">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/45 bg-[rgba(246,250,252,0.78)] shadow-[0_26px_110px_rgba(7,24,46,0.18)] backdrop-blur lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Section - Brand & Benefits */}
        <section className="flex flex-col justify-start gap-10 bg-[linear-gradient(135deg,#0b2b4d_0%,#1a3d5c_100%)] px-6 py-8 text-white sm:px-8 lg:px-10">
          <div className="space-y-8">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-3 group">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--brand-ink)] group-hover:scale-105 transition">
                LS
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-white">
                  Logisphere
                </p>
                <p className="text-xs text-blue-100">Freight Intelligence</p>
              </div>
            </Link>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="max-w-md text-4xl font-bold leading-tight tracking-[-0.04em] sm:text-5xl">
                Welcome to Your Freight Control Tower
              </h1>
              <p className="max-w-md text-base leading-7 text-blue-50">
                Join mid-market logistics teams auditing invoices, tracking shipments, and optimizing freight spend in one workspace.
              </p>
            </div>
          </div>

          {/* Benefits Cards */}
          <div className="space-y-3">
            {benefits.map((benefit) => (
              <div
                key={benefit.label}
                className="rounded-[1.4rem] border border-blue-300/20 bg-white/8 p-4 backdrop-blur-sm hover:bg-white/12 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{benefit.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{benefit.label}</p>
                    <p className="text-xs text-blue-100">{benefit.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Section - Auth Form */}
        <section className="flex items-start justify-center px-6 py-8 sm:px-8 lg:px-10">
          <div className="w-full max-w-sm space-y-6">
            {/* Form Tabs */}
            <div
              className="flex rounded-2xl bg-[color:var(--border)]/40 p-1"
              role="tablist"
              aria-label="Auth mode"
            >
              {modes.map((item) => {
                const active = mode === item.id;
                return (
                  <Link
                    key={item.id}
                    href={`/auth?mode=${item.id}`}
                    role="tab"
                    aria-selected={active}
                    className={`flex-1 rounded-xl px-4 py-2.5 text-center text-xs sm:text-sm font-semibold transition-all duration-200 ${
                      active
                        ? "bg-[#1d4ed8] text-white shadow-[0_8px_24px_rgba(29,78,216,0.28)]"
                        : "text-[color:var(--muted)] hover:text-[color:var(--brand-ink)] hover:bg-white/60"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Error Message */}
            {error ? (
              <div className="flex gap-3 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-800">
                <span className="text-red-500 mt-0.5" aria-hidden>⚠️</span>
                <span>{error}</span>
              </div>
            ) : null}

            {/* Success Message */}
            {message ? (
              <div className="flex gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <span className="text-emerald-600 mt-0.5" aria-hidden>✓</span>
                <span>{message}</span>
              </div>
            ) : null}

            {/* Forms */}
            <div className="rounded-2xl border border-[color:var(--border)]/60 bg-white/70 p-5 shadow-sm backdrop-blur-sm">
              {mode === "signup" ? (
                <>
                  <h2 className="mb-5 text-lg font-semibold text-[color:var(--brand-ink)]">
                    Create your account
                  </h2>
                  <form action={signUpAction} className="space-y-4">
                    <div>
                      <label htmlFor="signup-fullName" className="mb-1.5 block text-sm font-medium text-[color:var(--ink-soft)]">
                        Full name
                      </label>
                      <input
                        id="signup-fullName"
                        name="fullName"
                        type="text"
                        placeholder="e.g. Sarah Anderson"
                        className="auth-input"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium text-[color:var(--ink-soft)]">
                        Work email
                      </label>
                      <input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="sarah@company.com"
                        className="auth-input"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="signup-avatar" className="mb-1.5 block text-sm font-medium text-[color:var(--ink-soft)]">
                        Profile photo
                      </label>
                      <input
                        id="signup-avatar"
                        name="avatar"
                        type="file"
                        accept="image/*"
                        className="auth-input file:mr-3 file:rounded-full file:border-0 file:bg-[color:var(--brand-ink)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                      />
                      <p className="mt-2 text-xs text-[color:var(--muted)]">
                        Optional. Uploaded to Supabase Storage and used as your profile photo.
                      </p>
                    </div>
                    <fieldset className="space-y-3">
                      <legend className="mb-1.5 text-sm font-medium text-[color:var(--ink-soft)]">
                        Your role
                      </legend>
                      <div className="grid gap-2 sm:grid-cols-1">
                        {SIGNUP_ROLES.map((role) => (
                          <label
                            key={role.id}
                            className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-[color:var(--border)]/70 bg-white/80 p-3.5 shadow-sm transition-all duration-200 hover:border-[color:var(--accent)]/40 hover:bg-white hover:shadow-md has-[:checked]:border-[color:var(--accent)] has-[:checked]:bg-[color:var(--accent)]/5 has-[:checked]:ring-2 has-[:checked]:ring-[color:var(--accent)]/20"
                          >
                            <input
                              type="radio"
                              name="role"
                              value={role.id}
                              defaultChecked={role.id === "supply_chain_manager"}
                              className="mt-1.5 h-4 w-4 shrink-0 border-[color:var(--border)] text-[color:var(--accent)] focus:ring-[color:var(--accent)]"
                              required
                            />
                            <span className="text-2xl shrink-0 leading-none" aria-hidden>
                              {role.icon}
                            </span>
                            <div className="min-w-0">
                              <span className="block font-semibold text-[color:var(--brand-ink)]">
                                {role.label}
                              </span>
                              <span className="mt-0.5 block text-xs font-medium text-[color:var(--muted)]">
                                {role.scope}
                              </span>
                              <span className="mt-1 block text-xs leading-snug text-slate-600">
                                {role.description}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-[color:var(--muted)]">
                        You can change this later in settings.
                      </p>
                    </fieldset>
                    <div>
                      <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium text-[color:var(--ink-soft)]">
                        Password
                      </label>
                      <input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="At least 6 characters"
                        className="auth-input"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="auth-submit"
                    >
                      Create account
                    </button>
                    <p className="text-center text-xs text-[color:var(--muted)]">
                      You’ll be added to your workspace after signup.
                    </p>
                  </form>
                </>
              ) : (
                <>
                  <h2 className="mb-5 text-lg font-semibold text-[color:var(--brand-ink)]">
                    Sign in to your account
                  </h2>
                  <form action={signInAction} className="space-y-4">
                    <input type="hidden" name="next" value={next} />
                    <div>
                      <label htmlFor="signin-email" className="mb-1.5 block text-sm font-medium text-[color:var(--ink-soft)]">
                        Work email
                      </label>
                      <input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="sarah@company.com"
                        className="auth-input"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="signin-password" className="mb-1.5 block text-sm font-medium text-[color:var(--ink-soft)]">
                        Password
                      </label>
                      <input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="Your password"
                        className="auth-input"
                        required
                      />
                    </div>
                    <button type="submit" className="auth-submit">
                      Sign in
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
