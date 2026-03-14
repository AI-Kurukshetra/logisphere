import { LegalHero } from "@/app/_components/marketing-ui";

const sections = [
  {
    title: "Introduction",
    body: "Logisphere is committed to protecting your privacy and being clear about how data is collected, used, and retained when you visit the site or use the platform.",
  },
  {
    title: "Information we collect",
    body: "We collect account details, company information, shipment and invoice data submitted into the platform, support communications, and product usage signals needed to operate and improve the service.",
  },
  {
    title: "How information is used",
    body: "We use collected information to provide the service, support users, process billing, improve product quality, deliver operational workflows, and comply with legal obligations.",
  },
  {
    title: "Security and retention",
    body: "We use administrative and technical controls designed to protect customer data and retain information only as long as it is required to provide the service or satisfy legal obligations.",
  },
  {
    title: "Your rights",
    body: "Depending on your jurisdiction, you may have rights to access, correct, export, restrict, or delete your data. Contact privacy@logisphere.io for those requests.",
  },
];

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Logisphere.",
};

export default function PrivacyPage() {
  return (
    <main className="marketing-main">
      <div className="marketing-wrap marketing-panel">
        <LegalHero
          title="Privacy Policy"
          description="This summary explains how Logisphere handles information across the public site and product."
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
