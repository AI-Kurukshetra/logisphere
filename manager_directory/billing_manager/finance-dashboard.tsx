import Link from "next/link";
import { getRoleLabel } from "@/lib/roles";
import { billingManagerRoutes } from "@/manager_directory/routes";

type CarrierRow = {
  id: string;
  name: string;
  status: string;
};

type InvoiceRow = {
  amount: number | string;
  approval_status: string | null;
  carrier_id: string;
  created_at: string;
  due_date: string | null;
  id: string;
  invoice_number: string;
  shipment_id: string | null;
  status: string;
};

type PaymentRow = {
  amount: number | string;
  created_at: string;
  id: string;
  invoice_id: string;
  method: string | null;
  paid_at: string | null;
  reference: string | null;
  status: string;
};

type AuditRow = {
  created_at: string;
  id: string;
  invoice_id: string;
  result: string;
  rule_name: string | null;
  variance_amount: number | string | null;
};

type DocumentRow = {
  created_at: string;
  document_type: string;
  entity_type: string | null;
  id: string;
  title: string;
};

type ProfileRow = {
  email: string | null;
  full_name: string | null;
  id: string;
  role: string;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});
const numberFormatter = new Intl.NumberFormat("en-US");
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatCount(value: number) {
  return numberFormatter.format(value);
}

function formatDate(value: string | null) {
  if (!value) return "No date";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "No date" : dateFormatter.format(parsed);
}

function toNumber(value: number | string | null | undefined) {
  const normalized = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(normalized) ? Number(normalized) : 0;
}

function titleize(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildInvoiceTrend(invoices: InvoiceRow[]) {
  const now = new Date();
  const buckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      amount: 0,
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: monthFormatter.format(date),
    };
  });

  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const invoice of invoices) {
    const created = new Date(invoice.created_at);
    if (Number.isNaN(created.getTime())) continue;
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
    const bucket = bucketMap.get(key);
    if (bucket) {
      bucket.amount += toNumber(invoice.amount);
    }
  }

  return buckets;
}

export function FinanceManagerDashboard({
  audits,
  carriers,
  companyName,
  documents,
  invoices,
  payments,
  profile,
  teamRows,
}: {
  audits: AuditRow[];
  carriers: CarrierRow[];
  companyName: string;
  documents: DocumentRow[];
  invoices: InvoiceRow[];
  payments: PaymentRow[];
  profile: {
    email: string | null;
    full_name: string | null;
    role: string;
  };
  teamRows: ProfileRow[];
}) {
  const pendingInvoices = invoices.filter((invoice) => invoice.status !== "paid");
  const disputedInvoices = invoices.filter((invoice) =>
    ["disputed", "exception"].includes(invoice.status)
  );
  const completedPayments = payments.filter((payment) => payment.status === "completed");
  const pendingAmount = pendingInvoices.reduce((sum, invoice) => sum + toNumber(invoice.amount), 0);
  const completedAmount = completedPayments.reduce(
    (sum, payment) => sum + toNumber(payment.amount),
    0
  );
  const auditVariance = audits.reduce(
    (sum, audit) => sum + Math.abs(toNumber(audit.variance_amount)),
    0
  );
  const invoiceTrend = buildInvoiceTrend(invoices);
  const maxTrendAmount = Math.max(...invoiceTrend.map((item) => item.amount), 1);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,#1f2937_0%,#0f4c81_55%,#0f766e_100%)] p-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">
              Billing Manager Directory
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
              Finance control tower for {companyName}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-100">
              Designed for {getRoleLabel(profile.role)}. Monitor invoice intake, audit variance,
              payment approvals, and finance documentation from one live workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={billingManagerRoutes.invoices}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Review Invoices
            </Link>
            <Link
              href={billingManagerRoutes.payments}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Open Payments
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Pending Payables",
            note: `${formatCount(pendingInvoices.length)} invoices not yet settled.`,
            value: formatCurrency(pendingAmount),
          },
          {
            label: "Completed Payments",
            note: `${formatCount(completedPayments.length)} payments marked complete.`,
            value: formatCurrency(completedAmount),
          },
          {
            label: "Audit Variance",
            note: `${formatCount(audits.length)} audit rows contribute to this exposure.`,
            value: formatCurrency(auditVariance),
          },
          {
            label: "Disputes & Exceptions",
            note: "Billing issues requiring escalation or carrier follow-up.",
            value: formatCount(disputedInvoices.length),
          },
          {
            label: "Document Coverage",
            note: `${formatCount(documents.length)} finance-linked documents on file.`,
            value: `${formatCount(carriers.length)} carriers`,
          },
        ].map((card) => (
          <article
            key={card.label}
            className="rounded-[1.8rem] border border-slate-200/80 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              {card.label}
            </p>
            <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
              {card.value}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Spend Trend
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                Six-month invoice outflow
              </h3>
            </div>
            <Link
              href={billingManagerRoutes.invoices}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
            >
              Invoice Queue
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-6">
            {invoiceTrend.map((bucket) => (
              <div key={bucket.key} className="flex flex-col rounded-[1.4rem] bg-slate-50 p-3">
                <div className="flex h-36 items-end rounded-xl bg-white px-2 py-3">
                  <div
                    className="w-full rounded-t-lg bg-[linear-gradient(180deg,#10b981_0%,#0f4c81_100%)]"
                    style={{
                      height: `${Math.max(
                        (bucket.amount / maxTrendAmount) * 100,
                        bucket.amount > 0 ? 10 : 0
                      )}%`,
                    }}
                  />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{bucket.label}</p>
                <p className="mt-1 text-lg font-semibold tracking-[-0.04em] text-slate-950">
                  {formatCurrency(bucket.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Approval Queue
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                {formatCount(pendingInvoices.length)} invoices awaiting action
              </h3>
            </div>
            <Link
              href={billingManagerRoutes.payments}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
            >
              Payments
            </Link>
          </div>
          <div className="mt-6 space-y-3">
            {pendingInvoices.slice(0, 6).map((invoice) => {
              const carrier = carriers.find((item) => item.id === invoice.carrier_id);
              return (
                <div
                  key={invoice.id}
                  className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{invoice.invoice_number}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {carrier?.name || "Carrier"} • {titleize(invoice.status)}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-slate-950">
                      {formatCurrency(toNumber(invoice.amount))}
                    </p>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                    Approval: {titleize(invoice.approval_status)} • Due {formatDate(invoice.due_date)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Audit Findings
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            Latest validation and dispute signals
          </h3>
          <div className="mt-6 space-y-3">
            {audits.slice(0, 6).map((audit) => {
              const invoice = invoices.find((item) => item.id === audit.invoice_id);
              return (
                <div
                  key={audit.id}
                  className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {invoice?.invoice_number || audit.invoice_id}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {audit.rule_name || "Variance rule"} • {titleize(audit.result)}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                      {formatCurrency(Math.abs(toNumber(audit.variance_amount)))}
                    </span>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                    Logged {formatDate(audit.created_at)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Payment Ledger
            </p>
            <div className="mt-6 space-y-3">
              {payments.slice(0, 5).map((payment) => {
                const invoice = invoices.find((item) => item.id === payment.invoice_id);
                return (
                  <div
                    key={payment.id}
                    className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {invoice?.invoice_number || payment.invoice_id}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {titleize(payment.status)} • {payment.method || "Method pending"}
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-slate-950">
                        {formatCurrency(toNumber(payment.amount))}
                      </p>
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                      {payment.reference || "No reference"} •{" "}
                      {formatDate(payment.paid_at || payment.created_at)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Compliance Library
            </p>
            <div className="mt-6 space-y-3">
              {documents.slice(0, 4).map((document) => (
                <div
                  key={document.id}
                  className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4"
                >
                  <p className="font-semibold text-slate-900">{document.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {titleize(document.document_type)} • {titleize(document.entity_type)}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                    Added {formatDate(document.created_at)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Finance team coverage</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {teamRows.length} workspace members support invoice, payment, and dispute
                workflows.
              </p>
              <Link
                href={billingManagerRoutes.settingsAccess}
                className="mt-4 inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
              >
                Review Access
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
