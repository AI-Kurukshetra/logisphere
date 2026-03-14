import { MarketingCTA, MarketingHero } from "@/app/_components/marketing-ui";

const posts = [
  {
    category: "Auditing",
    date: "March 12, 2026",
    title: "How to recover hidden freight savings without creating audit chaos",
    excerpt: "Invoice accuracy programs fail when they become another review queue. The right workflow reduces review load while still exposing variance clearly.",
  },
  {
    category: "Operations",
    date: "March 5, 2026",
    title: "Carrier scorecards only work when finance and operations share the same record",
    excerpt: "A scorecard that ignores invoice accuracy, service history, and exception context is just decoration. Here is the better model.",
  },
  {
    category: "Planning",
    date: "February 28, 2026",
    title: "Freight planning should start with live operational truth, not stale reporting",
    excerpt: "Budgets, rate decisions, and routing recommendations all degrade when they are separated from the operating workflow.",
  },
];

export const metadata = {
  title: "Blog",
  description: "Notes on freight operations, product design, and platform strategy from Logisphere.",
};

export default function BlogPage() {
  return (
    <main className="marketing-main">
      <div className="marketing-wrap marketing-panel">
        <MarketingHero
          eyebrow="Insights"
          title="Product thinking and freight operating notes."
          description="This is where Logisphere explains how we think about control towers, audit clarity, carrier governance, and planning UX."
          actions={[
            { href: "/contact", label: "Discuss Your Workflow" },
            { href: "/auth", label: "Open Platform", variant: "secondary" },
          ]}
        />

        <section className="content-section">
          <div className="grid gap-4">
            {posts.map((post) => (
              <article key={post.title} className="ui-card-strong">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="ui-pill">{post.category}</span>
                  <span className="text-sm text-slate-500">{post.date}</span>
                </div>
                <h2 className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-[color:var(--brand-ink)]">
                  {post.title}
                </h2>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                  {post.excerpt}
                </p>
              </article>
            ))}
          </div>
        </section>

        <div className="content-section">
          <MarketingCTA
            title="Use the product, then return to the writing with real context."
            description="The strongest UX feedback loop comes from seeing the platform and then reading the thinking behind it."
            primary={{ href: "/auth", label: "Open Platform" }}
            secondary={{ href: "/features", label: "See Product Features" }}
          />
        </div>
      </div>
    </main>
  );
}
