import { MarketingCTA, MarketingHero, SectionHeading } from "@/app/_components/marketing-ui";

const docGroups = [
  {
    title: "Getting started",
    items: ["Account creation", "Company setup", "Team invites", "Role and scope model"],
  },
  {
    title: "Operational workflows",
    items: ["Invoices and audits", "Tracking events", "Exceptions", "Payments and approvals"],
  },
  {
    title: "Platform depth",
    items: ["Carrier setup", "Reports", "Integrations", "Planning and optimization"],
  },
];

export const metadata = {
  title: "Documentation",
  description: "Structured documentation overview for onboarding and operating Logisphere.",
};

export default function DocsPage() {
  return (
    <main className="marketing-main">
      <div className="marketing-wrap marketing-panel">
        <MarketingHero
          eyebrow="Documentation"
          title="Reference material arranged around implementation and daily use."
          description="The docs surface is intentionally simple in this build: clear lanes for setup, operations, and platform depth, without trying to pretend a half-built help center is complete."
          actions={[
            { href: "/contact", label: "Ask for Help" },
            { href: "/auth", label: "Open Platform", variant: "secondary" },
          ]}
        />

        <section className="content-section">
          <SectionHeading
            eyebrow="Doc lanes"
            title="Start where your team is actually blocked."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {docGroups.map((group) => (
              <article key={group.title} className="ui-card-strong">
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[color:var(--brand-ink)]">
                  {group.title}
                </h2>
                <ul className="mt-5 space-y-3">
                  {group.items.map((item) => (
                    <li key={item} className="rounded-[1.2rem] border border-[color:var(--border)] bg-white/70 px-4 py-3 text-sm text-slate-600">
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
            title="Need guidance before the full docs library is in place?"
            description="Use the contact flow for onboarding help, implementation mapping, or support guidance while the deeper documentation surface continues to expand."
            primary={{ href: "/contact", label: "Contact Support" }}
            secondary={{ href: "/blog", label: "Read Product Notes" }}
          />
        </div>
      </div>
    </main>
  );
}
