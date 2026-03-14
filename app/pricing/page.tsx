import { MarketingCTA, MarketingHero, SectionHeading } from "@/app/_components/marketing-ui";

const plans = [
  {
    name: "Starter",
    audience: "Small teams building freight visibility discipline",
    highlights: ["2 users", "100 invoices/month", "2 carrier connections", "Core analytics"],
  },
  {
    name: "Professional",
    audience: "Growing operators balancing finance and logistics control",
    highlights: [
      "10 users",
      "Unlimited invoices",
      "10+ carrier connections",
      "Advanced reporting",
      "Rate shopping",
    ],
    featured: true,
  },
  {
    name: "Enterprise",
    audience: "Complex multi-site programs with custom workflows and integrations",
    highlights: [
      "Unlimited users",
      "Unlimited transaction volume",
      "Custom integrations",
      "Dedicated support",
      "Optimization workflows",
    ],
  },
];

const commercialNotes = [
  "Pricing is tailored to user count, carrier depth, and freight volume.",
  "Implementation and migration support are scoped with the engagement, not bolted on later.",
  "Professional and Enterprise tiers support broader planning and automation workflows.",
];

export const metadata = {
  title: "Pricing",
  description: "Commercial packaging for teams adopting Logisphere across finance and logistics workflows.",
};

export default function PricingPage() {
  return (
    <main className="marketing-main">
      <div className="marketing-wrap marketing-panel">
        <MarketingHero
          eyebrow="Commercial Packaging"
          title="Pricing structured around operational complexity, not vanity feature counts."
          description="Logisphere is sold to match the scale and control needs of each freight program. The important variable is how much workflow you want under one roof."
          actions={[
            { href: "/contact", label: "Get a Pricing Walkthrough" },
            { href: "/features", label: "Compare Capabilities", variant: "secondary" },
          ]}
          pills={["Custom pricing", "Implementation support", "Mid-market focus"]}
        />

        <section className="content-section">
          <SectionHeading
            eyebrow="Plans"
            title="Choose the adoption level that matches your freight program."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={plan.featured ? "ui-card-strong border-[color:var(--accent)]" : "ui-card-strong"}
              >
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[color:var(--brand-ink)]">
                    {plan.name}
                  </h2>
                  {plan.featured ? <span className="ui-pill">Recommended</span> : null}
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">{plan.audience}</p>
                <div className="mt-5 space-y-3">
                  {plan.highlights.map((highlight) => (
                    <div
                      key={highlight}
                      className="rounded-[1.2rem] border border-[color:var(--border)] bg-white/75 px-4 py-3 text-sm font-medium text-slate-700"
                    >
                      {highlight}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section">
          <SectionHeading
            eyebrow="Commercial Notes"
            title="The buying conversation is about fit, rollout shape, and control requirements."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {commercialNotes.map((note) => (
              <article key={note} className="ui-card">
                <p className="text-sm leading-7 text-slate-600">{note}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="content-section">
          <MarketingCTA
            title="Get a pricing recommendation based on your current freight model."
            description="We’ll scope the right tier based on user count, carriers, facilities, invoice volume, and the workflows you want to consolidate."
            primary={{ href: "/contact", label: "Request Pricing" }}
            secondary={{ href: "/auth", label: "Open Platform" }}
          />
        </div>
      </div>
    </main>
  );
}
