import Link from "next/link";
import type { ReactNode } from "react";

type ActionLink = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

export function MarketingHero({
  eyebrow,
  title,
  description,
  actions = [],
  aside,
  pills = [],
}: {
  actions?: ActionLink[];
  aside?: ReactNode;
  description: string;
  eyebrow: string;
  pills?: string[];
  title: string;
}) {
  return (
    <section className="marketing-hero">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div className="space-y-6">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="marketing-display">{title}</h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">{description}</p>

          {actions.length > 0 ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              {actions.map((action) => (
                <Link
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  className={
                    action.variant === "secondary" ? "button-secondary" : "button-primary"
                  }
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}

          {pills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {pills.map((pill) => (
                <span key={pill} className="ui-pill">
                  {pill}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {aside ? <div className="space-y-4">{aside}</div> : null}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  description?: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="space-y-3">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="text-3xl font-semibold tracking-[-0.05em] text-[color:var(--brand-ink)] sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-3xl text-base leading-7 text-slate-600">{description}</p>
      ) : null}
    </div>
  );
}

export function MarketingCTA({
  title,
  description,
  primary,
  secondary,
}: {
  description: string;
  primary: ActionLink;
  secondary?: ActionLink;
  title: string;
}) {
  return (
    <section className="cta-band">
      <div className="max-w-3xl">
        <p className="eyebrow text-[color:var(--signal)]">Next Step</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[color:var(--brand-ink)] sm:text-4xl">
          {title}
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href={primary.href} className="button-primary">
          {primary.label}
        </Link>
        {secondary ? (
          <Link href={secondary.href} className="button-secondary">
            {secondary.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export function LegalHero({
  title,
  description,
  updatedAt,
}: {
  description: string;
  title: string;
  updatedAt: string;
}) {
  return (
    <section className="marketing-hero">
      <div className="max-w-3xl space-y-4">
        <p className="eyebrow">Legal</p>
        <h1 className="marketing-display text-4xl sm:text-5xl">{title}</h1>
        <p className="text-lg leading-8 text-slate-600">{description}</p>
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-400">
          Last updated {updatedAt}
        </p>
      </div>
    </section>
  );
}
