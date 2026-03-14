import { MarketingCTA, MarketingHero, SectionHeading } from "@/app/_components/marketing-ui";

const featureGroups = [
  {
    eyebrow: "Finance",
    title: "Control invoice accuracy and cash movement.",
    items: [
      "Automated invoice auditing against rates and shipping terms",
      "Approval routing for payment and exception handling",
      "Dispute tracking with carrier-side follow-up context",
      "Budget planning and forecast snapshots tied to actual spend",
    ],
  },
  {
    eyebrow: "Operations",
    title: "Run visibility and exception workflows in real time.",
    items: [
      "Unified shipment tracking across carriers and facilities",
      "Exception queues with ownership and escalation signals",
      "Carrier scorecards grounded in service and billing outcomes",
      "Field operations views for status updates and proof capture",
    ],
  },
  {
    eyebrow: "Planning",
    title: "Turn freight data into the next recommendation.",
    items: [
      "Spend optimization recommendations by lane and carrier",
      "Rate-shopping workflows with ranked options and selection",
      "Reporting and exports tuned to finance and logistics teams",
      "Integration hooks for ERP, WMS, TMS, and webhook flows",
    ],
  },
];

export const metadata = {
  title: "Features",
  description: "Explore the finance, operations, and planning capabilities inside Logisphere.",
};

export default function FeaturesPage() {
  return (
    <main className="marketing-main">
      <div className="marketing-wrap marketing-panel">
        <MarketingHero
          eyebrow="Platform Capabilities"
          title="Feature depth organized around how freight teams actually work."
          description="Logisphere is structured around control points, not disconnected modules. Each area is designed to shorten the path from signal to action."
          actions={[
            { href: "/auth", label: "Start Platform Access" },
            { href: "/pricing", label: "View Pricing", variant: "secondary" },
          ]}
        />

        <section className="content-section">
          <SectionHeading
            eyebrow="Capability Map"
            title="Finance, operations, and planning stay connected."
            description="That means the same shipment can influence audit variance, carrier scoring, and budget guidance without being rebuilt in separate tools."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {featureGroups.map((group) => (
              <article key={group.title} className="ui-card-strong">
                <p className="eyebrow">{group.eyebrow}</p>
                <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[color:var(--brand-ink)]">
                  {group.title}
                </h2>
                <ul className="mt-5 space-y-3">
                  {group.items.map((item) => (
                    <li key={item} className="rounded-[1.2rem] border border-[color:var(--border)] bg-white/70 px-4 py-3 text-sm leading-6 text-slate-600">
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <div className="content-section">
          <MarketingCTA
            title="Map these capabilities to your current freight workflow."
            description="If your current process spans email, spreadsheets, portals, and reports, this is the point where the product starts simplifying the operating model."
            primary={{ href: "/contact", label: "Talk to Sales" }}
            secondary={{ href: "/docs", label: "Read Documentation" }}
          />
        </div>
      </div>
    </main>
  );
}
