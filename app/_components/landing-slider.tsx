"use client";

import { useEffect, useState } from "react";

type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  metrics: { label: string; value: string }[];
  points: string[];
};

const slides: Slide[] = [
  {
    id: "audit",
    eyebrow: "Finance Control Tower",
    title: "Catch billing leakage before it reaches accounts payable.",
    description:
      "Audit invoices against contracted rates, accessorials, and service commitments in one review surface built for finance teams.",
    metrics: [
      { label: "Audit Coverage", value: "98%" },
      { label: "Recovery Queue", value: "24" },
      { label: "Avg. Variance", value: "4.6%" },
    ],
    points: [
      "Invoice validation against contracts and rates",
      "Exception queue with dispute and claim routing",
      "Payment approvals tied to audit outcomes",
    ],
  },
  {
    id: "tracking",
    eyebrow: "Operations Visibility",
    title: "Monitor shipments, carrier performance, and service failures live.",
    description:
      "Give logistics managers one view for shipment status, exception trends, and carrier execution across facilities and regions.",
    metrics: [
      { label: "Live Shipments", value: "1,284" },
      { label: "On-Time Rate", value: "96.2%" },
      { label: "Active Carriers", value: "18" },
    ],
    points: [
      "Unified tracking across carrier connectors",
      "Carrier scorecards with SLA context",
      "Alerts for delay, damage, and stale milestones",
    ],
  },
  {
    id: "analytics",
    eyebrow: "Commercial Intelligence",
    title: "Turn freight data into budget, rate, and routing decisions.",
    description:
      "Move from static reporting to operational analytics with spend trends, forecast views, and optimization recommendations.",
    metrics: [
      { label: "Spend Under Mgmt", value: "$18.4M" },
      { label: "Budget Accuracy", value: "93%" },
      { label: "Savings Found", value: "$642K" },
    ],
    points: [
      "Budget planning and forecast comparison",
      "Rate shopping and best-carrier recommendations",
      "Integration-ready exports for ERP, WMS, and TMS",
    ],
  },
];

export function LandingSlider() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, []);

  const activeSlide = slides[activeIndex];

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(160deg,rgba(8,19,41,0.98),rgba(11,43,77,0.96)_58%,rgba(7,118,125,0.88))] p-6 text-white shadow-[0_28px_90px_rgba(6,18,38,0.42)] sm:p-7">
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      <div className="absolute -right-20 top-8 h-40 w-40 rounded-full bg-[rgba(242,169,74,0.16)] blur-3xl" />
      <div className="absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-[rgba(23,191,190,0.16)] blur-3xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[color:var(--accent-soft)]">
            {activeSlide.eyebrow}
          </p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-[2.2rem]">
            {activeSlide.title}
          </h2>
        </div>
        <div className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-200">
          Live View
        </div>
      </div>

      <p className="relative mt-5 max-w-2xl text-sm leading-7 text-slate-200 sm:text-[0.96rem]">
        {activeSlide.description}
      </p>

      <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
        {activeSlide.metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-[1.4rem] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
              {metric.label}
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <div className="relative mt-6 rounded-[1.7rem] border border-white/10 bg-slate-950/22 p-4">
        <div className="flex items-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Show ${slide.eyebrow}`}
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition-all ${
                index === activeIndex
                  ? "w-10 bg-[color:var(--accent)]"
                  : "w-2.5 bg-white/35 hover:bg-white/55"
              }`}
            />
          ))}
        </div>

        <div className="mt-5 grid gap-3">
          {activeSlide.points.map((point) => (
            <div
              key={point}
              className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/6 px-4 py-3"
            >
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[color:var(--accent)]" />
              <p className="text-sm leading-6 text-slate-100">{point}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
