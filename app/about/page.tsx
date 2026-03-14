import { MarketingCTA, MarketingHero, SectionHeading } from "@/app/_components/marketing-ui";

const principles = [
  "Design for the operator who needs the next action fast.",
  "Respect the complexity of freight without making the UI feel heavy.",
  "Keep finance, operations, and carrier views anchored to the same source record.",
  "Use automation to reduce decision fatigue, not to hide accountability.",
];

const beliefs = [
  {
    title: "Mid-market deserves product depth",
    body: "The gap between spreadsheet operations and heavyweight enterprise platforms is where most freight teams live.",
  },
  {
    title: "Accuracy is a product feature",
    body: "Audit logic, carrier data, and planning signals only matter if teams trust them under pressure.",
  },
  {
    title: "Workflow beats dashboard theater",
    body: "If a page cannot clearly support a decision, it should not exist in the critical path.",
  },
];

export const metadata = {
  title: "About",
  description: "Why Logisphere exists and how the product is shaped around freight decision-making.",
};

export default function AboutPage() {
  return (
    <main className="marketing-main">
      <div className="marketing-wrap marketing-panel">
        <MarketingHero
          eyebrow="Why Logisphere"
          title="Built for the teams that actually absorb freight complexity every day."
          description="Logisphere exists because most freight tools either overfit to enterprise sprawl or underfit the realities of multi-site, carrier-heavy operations. The product is designed to close that gap."
          actions={[
            { href: "/contact", label: "Meet the Team" },
            { href: "/features", label: "See Product Shape", variant: "secondary" },
          ]}
        />

        <section className="content-section">
          <SectionHeading
            eyebrow="Product Principles"
            title="These principles drive how we design pages, workflows, and rollout decisions."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {principles.map((principle) => (
              <article key={principle} className="ui-card-strong">
                <p className="text-base leading-7 text-slate-700">{principle}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section">
          <SectionHeading
            eyebrow="What We Believe"
            title="The product strategy is simple: less fragmentation, more operational signal."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {beliefs.map((belief) => (
              <article key={belief.title} className="ui-card">
                <h2 className="text-xl font-semibold tracking-[-0.04em] text-[color:var(--brand-ink)]">
                  {belief.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{belief.body}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="content-section">
          <MarketingCTA
            title="If your current process feels stitched together, that is the problem we are solving."
            description="Start with the public tour, then walk the workspace to see how the product carries those principles into daily execution."
            primary={{ href: "/auth", label: "Open Platform" }}
            secondary={{ href: "/blog", label: "Read Product Thinking" }}
          />
        </div>
      </div>
    </main>
  );
}
