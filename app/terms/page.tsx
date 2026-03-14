import { LegalHero } from "@/app/_components/marketing-ui";

const sections = [
  {
    title: "Acceptance",
    body: "By using Logisphere, you agree to these terms and to the policies referenced by them.",
  },
  {
    title: "Use of the service",
    body: "You may use the platform only for lawful business purposes and are responsible for activity occurring under your account.",
  },
  {
    title: "Accounts and access",
    body: "You are responsible for maintaining account security, protecting credentials, and notifying Logisphere of unauthorized use.",
  },
  {
    title: "Content and data",
    body: "Customer data remains subject to the commercial agreement between you and Logisphere. We provide the service but do not take ownership of your operational records.",
  },
  {
    title: "Limitations and changes",
    body: "The service, documentation, and supporting materials may evolve over time. Liability is limited to the extent permitted by applicable law and contract.",
  },
];

export const metadata = {
  title: "Terms of Service",
  description: "Terms of service for Logisphere.",
};

export default function TermsPage() {
  return (
    <main className="marketing-main">
      <div className="marketing-wrap marketing-panel">
        <LegalHero
          title="Terms of Service"
          description="These terms govern use of the Logisphere site and platform."
          updatedAt="March 2026"
        />

        <section className="content-section">
          <article className="ui-card-strong legal-prose max-w-4xl">
            {sections.map((section) => (
              <section key={section.title}>
                <h2>{section.title}</h2>
                <p>{section.body}</p>
              </section>
            ))}
          </article>
        </section>
      </div>
    </main>
  );
}
