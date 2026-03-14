"use client";

import { useState } from "react";

const contactChannels = [
  { label: "Sales", value: "sales@logisphere.io", note: "Commercial questions and demos" },
  { label: "Support", value: "support@logisphere.io", note: "Product help and operational issues" },
  { label: "General", value: "hello@logisphere.io", note: "Anything that does not fit a queue" },
];

const quickAnswers = [
  "Implementation is usually scoped in weeks, not quarters.",
  "Carrier, invoice, and shipment migrations are part of onboarding conversations.",
  "Enterprise support and custom integrations are planned with the rollout, not bolted on later.",
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="marketing-main">
      <div className="marketing-wrap marketing-panel">
        <section className="marketing-hero">
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="space-y-6">
              <p className="eyebrow">Contact</p>
              <h1 className="marketing-display">Start the conversation with the right context.</h1>
              <p className="text-lg leading-8 text-slate-600">
                Use this page for demos, rollout planning, or product support. The UX is intentionally direct: one form, clear channels, and no fake automation theater.
              </p>

              <div className="space-y-3">
                {contactChannels.map((channel) => (
                  <div key={channel.label} className="ui-card">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      {channel.label}
                    </p>
                    <p className="mt-3 text-lg font-semibold text-[color:var(--brand-ink)]">
                      {channel.value}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{channel.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="ui-card-strong">
              <p className="eyebrow">Send a note</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[color:var(--brand-ink)]">
                Tell us what you need.
              </h2>

              {submitted ? (
                <div className="mt-6 rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
                  Request captured. Follow up is still a stub in this repo, but the form flow is now clearer and more usable.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <input className="auth-input" name="name" placeholder="Your name" required />
                  <input className="auth-input" name="email" type="email" placeholder="you@company.com" required />
                  <input className="auth-input" name="company" placeholder="Company name" />
                  <textarea
                    className="auth-input min-h-36 resize-none"
                    name="message"
                    placeholder="Tell us about your freight program, current tooling, and what you want to improve."
                    required
                  />
                  <button type="submit" className="button-primary w-full">
                    Send Request
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        <section className="content-section">
          <div className="grid gap-4 md:grid-cols-3">
            {quickAnswers.map((answer) => (
              <article key={answer} className="ui-card">
                <p className="text-sm leading-7 text-slate-600">{answer}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
