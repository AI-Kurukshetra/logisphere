import { redirect } from "next/navigation";
import { OnboardingForm } from "@/app/onboarding/onboarding-form";
import { requireUser } from "@/lib/supabase/session";

export default async function OnboardingPage() {
  const { profile, supabase, user } = await requireUser();

  if (profile?.company_id) {
    redirect("/dashboard");
  }

  const { data: presets } = await supabase
    .from("onboarding_presets")
    .select("category, label, value, sort_order")
    .order("category")
    .order("sort_order");

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/50 bg-[rgba(255,251,246,0.8)] shadow-[0_20px_80px_rgba(74,58,34,0.12)] backdrop-blur lg:grid-cols-[0.9fr_1.1fr]">
        <section className="bg-[linear-gradient(180deg,#132238_0%,#0f172a_100%)] px-6 py-8 text-white sm:px-8 lg:px-10">
          <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-orange-200">
            Workspace Setup
          </p>
          <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
            Set up your freight network and establish logistics control.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Build your operational structure with regional divisions, business
            units, and distribution facilities. Once configured, you'll have
            complete visibility and control over your freight operations,
            shipment tracking, and logistics network across all locations.
          </p>

          <div className="mt-10 space-y-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-orange-200">
                What happens next
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
                <li>Your profile is linked to the new company.</li>
                <li>Your selected signup role is preserved for the initial workspace.</li>
                <li>The first region, business unit, and facility are created.</li>
                <li>The app redirects directly into the dashboard shell.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="flex items-center px-6 py-8 sm:px-8 lg:px-10">
          <div className="w-full rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Onboarding
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                Set up your company and org scope
              </h2>
              <p className="text-sm leading-6 text-slate-500">
                Signed in as {user.email}
              </p>
            </div>

            <OnboardingForm
              fullNameDefault={profile?.full_name}
              presets={presets ?? []}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
