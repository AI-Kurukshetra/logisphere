import { MarketingCTA, MarketingHero, SectionHeading } from "@/app/_components/marketing-ui";
import { getCurrentAccount } from "@/lib/supabase/session";

const operatingSignals = [
  { label: "Invoice audit recovery", value: "5-15%" },
  { label: "Carrier view", value: "Multi-network" },
  { label: "Planning horizon", value: "Budget to route" },
];

const controlLayers = [
  {
    title: "Finance command",
    body: "Audit invoice accuracy, route approvals, track disputes, and hold freight spend to plan.",
  },
  {
    title: "Operations desk",
    body: "Unify live tracking, exception handling, lane health, and carrier execution in one workflow.",
  },
  {
    title: "Planning studio",
    body: "Move from reporting to action with forecasts, optimization recommendations, and rate shopping.",
  },
];

const operatorMoments = [
  "Catch invoice variances before payment leaves the building.",
  "Escalate delivery exceptions with context, status history, and owner.",
  "Benchmark carrier performance against spend, accuracy, and service.",
  "Shift from static reports to decisions with budget and routing guidance.",
];

const outcomes = [
  {
    title: "One operating layer",
    copy: "Finance, logistics, and partner teams work from the same freight record instead of stitched dashboards.",
  },
  {
    title: "Decision-ready data",
    copy: "Rates, audits, tracking, and forecasts stay connected, so the next action is obvious.",
  },
  {
    title: "Built for mid-market scale",
    copy: "Multi-location structure, role-aware workflows, and carrier depth without enterprise sprawl.",
  },
];

export default async function Home() {
  const account = await getCurrentAccount();
  const primaryHref = account.user
    ? account.profile?.company_id
      ? "/dashboard"
      : "/onboarding"
    : "/auth";

  const primaryLabel = account.user ? "Open Workspace" : "Start With Logisphere";

  return (
    <main className="marketing-main">
      <div className="marketing-wrap marketing-panel">
        <MarketingHero
          eyebrow="Freight Control Tower"
          title="Make freight operations feel coordinated, accountable, and profitable."
          description="Logisphere gives mid-market teams one place to run shipment visibility, invoice control, carrier management, and planning workflows without fragmenting the experience across tools."
          actions={[
            { href: primaryHref, label: primaryLabel },
            { href: "/contact", label: "Book a Demo", variant: "secondary" },
          ]}
          pills={[
            "Invoice audit",
            "Carrier scorecards",
            "Budget planning",
            "Rate shopping",
          ]}
          aside={
            <div className="grid gap-4">
              <div className="ui-card-strong">
                <p className="eyebrow">Now visible</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                  {operatingSignals.map((signal) => (
                    <div key={signal.label} className="rounded-[1.3rem] border border-[color:var(--border)] bg-white/80 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                        {signal.label}
                      </p>
                      <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[color:var(--brand-ink)]">
                        {signal.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ui-card bg-[color:var(--brand-ink)] text-white">
                <p className="eyebrow text-emerald-200">Operator priorities</p>
                <div className="mt-4 space-y-3">
                  {operatorMoments.map((moment) => (
                    <div key={moment} className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-100">
                      {moment}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        />

        <section className="content-section">
          <SectionHeading
            eyebrow="Platform shape"
            title="Three layers that keep freight execution and freight economics in the same conversation."
            description="The product is structured around the moments teams actually need to make decisions, not around disconnected feature checklists."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {controlLayers.map((layer) => (
              <article key={layer.title} className="ui-card-strong">
                <p className="eyebrow">Control layer</p>
                <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[color:var(--brand-ink)]">
                  {layer.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">{layer.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section">
          <SectionHeading
            eyebrow="Why teams switch"
            title="Redesigned for clarity, not dashboard clutter."
            description="Every page is built to reduce interpretation time: stronger hierarchy, fewer dead ends, and more explicit next actions."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {outcomes.map((outcome) => (
              <article key={outcome.title} className="ui-card">
                <h3 className="text-xl font-semibold tracking-[-0.04em] text-[color:var(--brand-ink)]">
                  {outcome.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{outcome.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="content-section">
          <MarketingCTA
            title="See the whole operating model in one walkthrough."
            description="Start with the product tour, then move into the workspace to manage invoices, tracking, exceptions, and planning from the same system."
            primary={{ href: primaryHref, label: primaryLabel }}
            secondary={{ href: "/features", label: "Explore Features" }}
          />
        </div>
      </div>
    </main>
  );
}
