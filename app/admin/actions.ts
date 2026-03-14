"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createBusinessUnitRecord,
  createFacilityRecord,
  createRegionRecord,
  logActivity,
} from "@/lib/workspace-admin";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/supabase/session";
import { slugify } from "@/lib/utils";

type AdminSupabaseClient = Awaited<ReturnType<typeof createClient>>;

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function buildAdminUrl(
  path: string,
  params: Record<string, string | null | undefined>
) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      search.set(key, value);
    }
  });

  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

async function requireAdminContext(pagePath: string, needsCompany = false) {
  const account = await requirePlatformAdmin();
  const companyId = account.profile?.company_id ?? null;

  if (needsCompany && !companyId) {
    redirect(
      buildAdminUrl("/admin/settings", {
        error: "Create a workspace company first to use this admin module.",
      })
    );
  }

  return {
    ...account,
    companyId,
    pagePath,
  };
}

function getSafeCsvValue(value: unknown) {
  const stringValue =
    value === null || value === undefined ? "" : String(value).replace(/\r?\n/g, " ");

  if (/[",]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export async function createAdminCarrierAction(formData: FormData) {
  const { supabase } = await requireAdminContext("/admin/carriers");
  const name = getValue(formData, "name");
  const code = getValue(formData, "code");
  const contactEmail = getValue(formData, "contactEmail");
  const contactPhone = getValue(formData, "contactPhone");

  if (!name) {
    redirect(
      buildAdminUrl("/admin/carriers", {
        compose: "carrier",
        error: "Carrier name is required.",
      })
    );
  }

  const { error } = await supabase.from("carriers").insert({
    name,
    code: code || null,
    contact_email: contactEmail || null,
    contact_phone: contactPhone || null,
    status: "active",
  });

  if (error) {
    redirect(
      buildAdminUrl("/admin/carriers", {
        compose: "carrier",
        error: "Unable to create carrier.",
      })
    );
  }

  revalidatePath("/admin/carriers");
  revalidatePath("/admin/dashboard");
  redirect(buildAdminUrl("/admin/carriers", { message: "Carrier created." }));
}

export async function updateAdminCarrierStatusAction(formData: FormData) {
  const { supabase } = await requireAdminContext("/admin/carriers");
  const carrierId = getValue(formData, "carrierId");
  const nextStatus = getValue(formData, "nextStatus");

  if (!carrierId || !nextStatus) {
    redirect(
      buildAdminUrl("/admin/carriers", {
        error: "Carrier status update is incomplete.",
      })
    );
  }

  const { error } = await supabase
    .from("carriers")
    .update({ status: nextStatus })
    .eq("id", carrierId);

  if (error) {
    redirect(
      buildAdminUrl("/admin/carriers", {
        error: "Unable to update carrier status.",
      })
    );
  }

  revalidatePath("/admin/carriers");
  revalidatePath("/admin/dashboard");
  redirect(buildAdminUrl("/admin/carriers", { message: "Carrier updated." }));
}

export async function createAdminContractAction(formData: FormData) {
  const { supabase, companyId } = await requireAdminContext("/admin/carriers", true);
  const carrierId = getValue(formData, "carrierId");
  const name = getValue(formData, "name");
  const terms = getValue(formData, "terms");
  const effectiveFrom = getValue(formData, "effectiveFrom");
  const effectiveTo = getValue(formData, "effectiveTo");

  if (!carrierId || !effectiveFrom || !companyId) {
    redirect(
      buildAdminUrl("/admin/carriers", {
        compose: "contract",
        error: "Carrier and effective date are required.",
      })
    );
  }

  const { error } = await supabase.from("contracts").insert({
    carrier_id: carrierId,
    company_id: companyId,
    name: name || null,
    terms: terms || null,
    effective_from: effectiveFrom,
    effective_to: effectiveTo || null,
  });

  if (error) {
    redirect(
      buildAdminUrl("/admin/carriers", {
        compose: "contract",
        error: "Unable to create contract.",
      })
    );
  }

  revalidatePath("/admin/carriers");
  revalidatePath("/admin/rates");
  redirect(buildAdminUrl("/admin/carriers", { message: "Contract created." }));
}

export async function createAdminRateAction(formData: FormData) {
  const { supabase } = await requireAdminContext("/admin/rates");
  const carrierId = getValue(formData, "carrierId");
  const contractId = getValue(formData, "contractId");
  const rateAmount = Number(getValue(formData, "rateAmount"));
  const effectiveFrom = getValue(formData, "effectiveFrom");
  const effectiveTo = getValue(formData, "effectiveTo");

  if (!carrierId || !effectiveFrom || Number.isNaN(rateAmount)) {
    redirect(
      buildAdminUrl("/admin/rates", {
        compose: "rate",
        error: "Carrier, rate amount, and effective date are required.",
      })
    );
  }

  const { error } = await supabase.from("rates").insert({
    carrier_id: carrierId,
    contract_id: contractId || null,
    rate_amount: rateAmount,
    effective_from: effectiveFrom,
    effective_to: effectiveTo || null,
  });

  if (error) {
    redirect(
      buildAdminUrl("/admin/rates", {
        compose: "rate",
        error: "Unable to create rate.",
      })
    );
  }

  revalidatePath("/admin/rates");
  redirect(buildAdminUrl("/admin/rates", { message: "Rate created." }));
}

export async function createAdminShipmentAction(formData: FormData) {
  const { supabase, companyId } = await requireAdminContext("/admin/tracking", true);
  const carrierId = getValue(formData, "carrierId");
  const trackingNumber = getValue(formData, "trackingNumber");
  const status = getValue(formData, "status") || "created";

  if (!carrierId || !trackingNumber || !companyId) {
    redirect(
      buildAdminUrl("/admin/tracking", {
        compose: "shipment",
        error: "Carrier and tracking number are required.",
      })
    );
  }

  const { error } = await supabase.from("shipments").insert({
    company_id: companyId,
    carrier_id: carrierId,
    tracking_number: trackingNumber,
    status,
  });

  if (error) {
    redirect(
      buildAdminUrl("/admin/tracking", {
        compose: "shipment",
        error: "Unable to create shipment.",
      })
    );
  }

  revalidatePath("/admin/tracking");
  revalidatePath("/admin/dashboard");
  redirect(buildAdminUrl("/admin/tracking", { message: "Shipment created." }));
}

export async function createAdminInvoiceAction(formData: FormData) {
  const { supabase, companyId } = await requireAdminContext("/admin/audits", true);
  const carrierId = getValue(formData, "carrierId");
  const invoiceNumber = getValue(formData, "invoiceNumber");
  const amount = Number(getValue(formData, "amount"));

  if (!carrierId || !invoiceNumber || Number.isNaN(amount) || !companyId) {
    redirect(
      buildAdminUrl("/admin/audits", {
        compose: "invoice",
        error: "Carrier, invoice number, and amount are required.",
      })
    );
  }

  const { error } = await supabase.from("invoices").insert({
    company_id: companyId,
    carrier_id: carrierId,
    invoice_number: invoiceNumber,
    amount,
    status: "pending",
  });

  if (error) {
    redirect(
      buildAdminUrl("/admin/audits", {
        compose: "invoice",
        error: "Unable to create invoice.",
      })
    );
  }

  revalidatePath("/admin/audits");
  revalidatePath("/admin/dashboard");
  redirect(buildAdminUrl("/admin/audits", { message: "Invoice created." }));
}

export async function runAdminAuditAction() {
  const { supabase, companyId } = await requireAdminContext("/admin/audits", true);

  if (!companyId) {
    redirect(buildAdminUrl("/admin/audits", { error: "Company context is required." }));
  }

  const [{ data: invoices }, { data: contracts }] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, carrier_id, status")
      .eq("company_id", companyId)
      .in("status", ["pending", "approved"]),
    supabase
      .from("contracts")
      .select("id, carrier_id")
      .eq("company_id", companyId),
  ]);

  const pendingInvoices = (invoices ?? []).filter((invoice) => invoice.status !== "paid");

  if (!pendingInvoices.length) {
    redirect(buildAdminUrl("/admin/audits", { message: "No invoices available for audit." }));
  }

  const auditRows = pendingInvoices.map((invoice) => {
    const hasContract = (contracts ?? []).some(
      (contract) => contract.carrier_id === invoice.carrier_id
    );

    return {
      invoice_id: invoice.id,
      rule_name: hasContract ? "contract_match" : "missing_contract",
      result: hasContract ? "approved" : "exception",
      variance_amount: hasContract ? 0 : null,
      details: {
        source: "admin.bulk_audit",
      },
    };
  });

  const { error: auditError } = await supabase.from("audits").insert(auditRows);

  if (auditError) {
    redirect(buildAdminUrl("/admin/audits", { error: "Unable to create audit runs." }));
  }

  const approvedIds = pendingInvoices
    .filter((invoice) =>
      (contracts ?? []).some((contract) => contract.carrier_id === invoice.carrier_id)
    )
    .map((invoice) => invoice.id);

  const exceptionIds = pendingInvoices
    .filter(
      (invoice) =>
        !(contracts ?? []).some((contract) => contract.carrier_id === invoice.carrier_id)
    )
    .map((invoice) => invoice.id);

  if (approvedIds.length) {
    await supabase
      .from("invoices")
      .update({ approval_status: "approved" })
      .in("id", approvedIds);
  }

  if (exceptionIds.length) {
    await supabase.from("invoices").update({ status: "exception" }).in("id", exceptionIds);
  }

  revalidatePath("/admin/audits");
  revalidatePath("/admin/exceptions");
  revalidatePath("/admin/dashboard");
  redirect(
    buildAdminUrl("/admin/audits", {
      message: `Audit completed for ${pendingInvoices.length} invoice(s).`,
    })
  );
}

export async function createAdminPaymentAction(formData: FormData) {
  const { supabase, companyId } = await requireAdminContext("/admin/payments", true);
  const invoiceId = getValue(formData, "invoiceId");
  const method = getValue(formData, "method");

  if (!invoiceId || !companyId) {
    redirect(
      buildAdminUrl("/admin/payments", {
        compose: "payment",
        error: "Select an invoice to record payment.",
      })
    );
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, amount")
    .eq("id", invoiceId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (!invoice) {
    redirect(
      buildAdminUrl("/admin/payments", {
        compose: "payment",
        error: "Invoice not found in your company scope.",
      })
    );
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    invoice_id: invoice.id,
    amount: invoice.amount,
    status: "completed",
    paid_at: new Date().toISOString(),
    method: method || "manual",
  });

  if (paymentError) {
    redirect(
      buildAdminUrl("/admin/payments", {
        compose: "payment",
        error: "Unable to record payment.",
      })
    );
  }

  await supabase
    .from("invoices")
    .update({ status: "paid", approval_status: "approved" })
    .eq("id", invoice.id);

  revalidatePath("/admin/payments");
  revalidatePath("/admin/dashboard");
  redirect(buildAdminUrl("/admin/payments", { message: "Payment recorded." }));
}

export async function batchAdminPaymentsAction() {
  const { supabase, companyId } = await requireAdminContext("/admin/payments", true);

  if (!companyId) {
    redirect(buildAdminUrl("/admin/payments", { error: "Company context is required." }));
  }

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, amount")
    .eq("company_id", companyId)
    .eq("approval_status", "approved")
    .neq("status", "paid")
    .limit(25);

  if (!(invoices ?? []).length) {
    redirect(buildAdminUrl("/admin/payments", { message: "No approved invoices to process." }));
  }

  const { error } = await supabase.from("payments").insert(
    (invoices ?? []).map((invoice) => ({
      invoice_id: invoice.id,
      amount: invoice.amount,
      status: "completed",
      paid_at: new Date().toISOString(),
      method: "batch",
    }))
  );

  if (error) {
    redirect(buildAdminUrl("/admin/payments", { error: "Batch payment processing failed." }));
  }

  await supabase
    .from("invoices")
    .update({ status: "paid" })
    .in(
      "id",
      (invoices ?? []).map((invoice) => invoice.id)
    );

  revalidatePath("/admin/payments");
  revalidatePath("/admin/dashboard");
  redirect(
    buildAdminUrl("/admin/payments", {
      message: `Processed ${(invoices ?? []).length} payment(s).`,
    })
  );
}

export async function createAdminReportAction(formData: FormData) {
  const { supabase, companyId, profile } = await requireAdminContext("/admin/reports", true);
  const name = getValue(formData, "name");
  const type = getValue(formData, "type");

  if (!companyId || !name || !type) {
    redirect(
      buildAdminUrl("/admin/reports", {
        compose: "report",
        error: "Report name and type are required.",
      })
    );
  }

  const { error } = await supabase.from("reports").insert({
    company_id: companyId,
    created_by: profile?.id ?? null,
    name,
    type,
  });

  if (error) {
    redirect(
      buildAdminUrl("/admin/reports", {
        compose: "report",
        error: "Unable to create report.",
      })
    );
  }

  revalidatePath("/admin/reports");
  redirect(buildAdminUrl("/admin/reports", { message: "Report created." }));
}

export async function createAdminExceptionAction(formData: FormData) {
  const { supabase, companyId } = await requireAdminContext("/admin/exceptions", true);
  const invoiceId = getValue(formData, "invoiceId");
  const notes = getValue(formData, "notes");

  if (!invoiceId || !companyId) {
    redirect(
      buildAdminUrl("/admin/exceptions", {
        compose: "exception",
        error: "Select an invoice to create an exception.",
      })
    );
  }

  const { error: invoiceError } = await supabase
    .from("invoices")
    .update({ status: "exception" })
    .eq("id", invoiceId)
    .eq("company_id", companyId);

  if (invoiceError) {
    redirect(
      buildAdminUrl("/admin/exceptions", {
        compose: "exception",
        error: "Unable to update invoice status.",
      })
    );
  }

  await supabase.from("invoice_disputes").insert({
    invoice_id: invoiceId,
    notes: notes || null,
    status: "open",
  });

  revalidatePath("/admin/exceptions");
  revalidatePath("/admin/audits");
  redirect(buildAdminUrl("/admin/exceptions", { message: "Exception created." }));
}

export async function autoDetectAdminExceptionsAction() {
  const { supabase, companyId } = await requireAdminContext("/admin/exceptions", true);

  if (!companyId) {
    redirect(buildAdminUrl("/admin/exceptions", { error: "Company context is required." }));
  }

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, approval_status, status")
    .eq("company_id", companyId)
    .is("approval_status", null)
    .neq("status", "paid")
    .limit(25);

  const targets = (invoices ?? []).filter((invoice) => invoice.status !== "exception");

  if (!targets.length) {
    redirect(buildAdminUrl("/admin/exceptions", { message: "No new exceptions detected." }));
  }

  await supabase
    .from("invoices")
    .update({ status: "exception" })
    .in(
      "id",
      targets.map((invoice) => invoice.id)
    );

  revalidatePath("/admin/exceptions");
  redirect(
    buildAdminUrl("/admin/exceptions", {
      message: `Marked ${targets.length} invoice(s) as exceptions.`,
    })
  );
}

export async function bootstrapAdminWorkspaceAction(formData: FormData) {
  const { supabase, user, profile } = await requireAdminContext("/admin/settings");
  const companyName = getValue(formData, "companyName");
  const regionName = getValue(formData, "regionName");
  const businessUnitName = getValue(formData, "businessUnitName");
  const facilityName = getValue(formData, "facilityName");

  if (!companyName || !regionName || !businessUnitName || !facilityName) {
    redirect(
      buildAdminUrl("/admin/settings", {
        compose: "bootstrap",
        error: "Complete all workspace bootstrap fields.",
      })
    );
  }

  if (profile?.company_id) {
    redirect(
      buildAdminUrl("/admin/settings", {
        message: "Workspace company is already configured.",
      })
    );
  }

  const slug = `${slugify(companyName) || "workspace"}-${randomUUID().slice(0, 6)}`;
  const companyId = randomUUID();
  const { error: companyError } = await supabase
    .from("companies")
    .insert({
      id: companyId,
      name: companyName,
      slug,
      settings: {
        onboarding_completed: true,
        admin_bootstrapped: true,
      },
    });

  if (companyError) {
    redirect(
      buildAdminUrl("/admin/settings", {
        compose: "bootstrap",
        error: "Unable to create workspace company.",
      })
    );
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      company_id: companyId,
      role: "admin",
      full_name: profile?.full_name || "Admin",
      email: user.email ?? null,
    })
    .eq("id", user.id);

  if (profileError) {
    redirect(
      buildAdminUrl("/admin/settings", {
        compose: "bootstrap",
        error: "Unable to attach admin profile to the new company.",
      })
    );
  }

  const { data: region } = await createRegionRecord(supabase, {
    companyId,
    name: regionName,
    code: slugify(regionName).slice(0, 6).toUpperCase() || "REGION",
  });

  const { data: businessUnit } = await createBusinessUnitRecord(supabase, {
    companyId,
    name: businessUnitName,
    regionId: region?.id ? String(region.id) : undefined,
    code: slugify(businessUnitName).slice(0, 6).toUpperCase() || "UNIT",
  });

  const { data: facility } = await createFacilityRecord(supabase, {
    companyId,
    name: facilityName,
    regionId: region?.id ? String(region.id) : undefined,
    businessUnitId: businessUnit?.id ? String(businessUnit.id) : undefined,
    code: slugify(facilityName).slice(0, 8).toUpperCase() || "HQ",
    type: "headquarters",
  });

  await supabase
    .from("profiles")
    .update({
      region_id: region?.id ?? null,
      business_unit_id: businessUnit?.id ?? null,
      facility_id: facility?.id ?? null,
    })
    .eq("id", user.id);

  await logActivity(supabase, {
    action: "admin.workspace_bootstrap",
    actorProfileId: user.id,
    companyId,
    entityId: companyId,
    entityType: "company",
    summary: `Bootstrapped admin workspace company ${companyName}.`,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/dashboard");
  redirect(
    buildAdminUrl("/admin/settings", {
      message: "Workspace company created and admin attached.",
    })
  );
}

export async function saveAdminSettingsAction(formData: FormData) {
  const { supabase, companyId } = await requireAdminContext("/admin/settings", true);
  const currency = getValue(formData, "currency");
  const language = getValue(formData, "language");
  const dateFormat = getValue(formData, "dateFormat");
  const timezone = getValue(formData, "timezone");

  if (!companyId) {
    redirect(buildAdminUrl("/admin/settings", { error: "Company context is required." }));
  }

  const { data: company } = await supabase
    .from("companies")
    .select("settings")
    .eq("id", companyId)
    .maybeSingle();

  const settings = {
    ...(typeof company?.settings === "object" && company.settings ? company.settings : {}),
    default_currency: currency || "USD",
    default_language: language || "English",
    date_format: dateFormat || "MM/DD/YYYY",
    timezone: timezone || "UTC",
  };

  const { error } = await supabase
    .from("companies")
    .update({ settings })
    .eq("id", companyId);

  if (error) {
    redirect(buildAdminUrl("/admin/settings", { error: "Unable to save settings." }));
  }

  revalidatePath("/admin/settings");
  redirect(buildAdminUrl("/admin/settings", { message: "Settings saved." }));
}

export async function resetAdminSettingsAction() {
  const { supabase, companyId } = await requireAdminContext("/admin/settings", true);

  if (!companyId) {
    redirect(buildAdminUrl("/admin/settings", { error: "Company context is required." }));
  }

  const { data: company } = await supabase
    .from("companies")
    .select("settings")
    .eq("id", companyId)
    .maybeSingle();

  const existing =
    typeof company?.settings === "object" && company.settings ? company.settings : {};

  const { error } = await supabase
    .from("companies")
    .update({
      settings: {
        ...existing,
        default_currency: "USD",
        default_language: "English",
        date_format: "MM/DD/YYYY",
        timezone: "UTC",
      },
    })
    .eq("id", companyId);

  if (error) {
    redirect(buildAdminUrl("/admin/settings", { error: "Unable to reset settings." }));
  }

  revalidatePath("/admin/settings");
  redirect(buildAdminUrl("/admin/settings", { message: "Settings reset to defaults." }));
}

export async function updateAdminUserRoleAction(formData: FormData) {
  const { supabase, companyId } = await requireAdminContext("/admin/users", true);
  const userId = getValue(formData, "userId");
  const role = getValue(formData, "role");

  if (!userId || !role || !companyId) {
    redirect(buildAdminUrl("/admin/users", { error: "User role update is incomplete." }));
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .eq("company_id", companyId);

  if (error) {
    redirect(buildAdminUrl("/admin/users", { error: "Unable to update user role." }));
  }

  revalidatePath("/admin/users");
  redirect(buildAdminUrl("/admin/users", { message: "User role updated." }));
}

export async function createAdminExportCsv(
  entity: string,
  supabase: AdminSupabaseClient,
  companyId: string | null
) {
  if (entity === "carriers") {
    const { data } = await supabase
      .from("carriers")
      .select("name, code, status, contact_email, contact_phone")
      .order("name");
    const rows = data ?? [];
    return [
      ["name", "code", "status", "contact_email", "contact_phone"],
      ...rows.map((row: {
        code: string | null;
        contact_email: string | null;
        contact_phone: string | null;
        name: string;
        status: string;
      }) => [
        row.name,
        row.code,
        row.status,
        row.contact_email,
        row.contact_phone,
      ]),
    ]
      .map((row) => row.map(getSafeCsvValue).join(","))
      .join("\n");
  }

  if (entity === "rates") {
    const { data } = await supabase
      .from("rates")
      .select("carrier_id, rate_amount, currency, effective_from, effective_to")
      .order("effective_from", { ascending: false });
    const rows = data ?? [];
    return [
      ["carrier_id", "rate_amount", "currency", "effective_from", "effective_to"],
      ...rows.map((row: {
        carrier_id: string;
        currency: string;
        effective_from: string;
        effective_to: string | null;
        rate_amount: number;
      }) => [
        row.carrier_id,
        row.rate_amount,
        row.currency,
        row.effective_from,
        row.effective_to,
      ]),
    ]
      .map((row) => row.map(getSafeCsvValue).join(","))
      .join("\n");
  }

  if (entity === "shipments") {
    const query = supabase
      .from("shipments")
      .select("tracking_number, carrier_id, status, shipped_at, delivered_at")
      .order("created_at", { ascending: false });
    const { data } = companyId ? await query.eq("company_id", companyId) : await query;
    const rows = data ?? [];
    return [
      ["tracking_number", "carrier_id", "status", "shipped_at", "delivered_at"],
      ...rows.map((row: {
        carrier_id: string;
        delivered_at: string | null;
        shipped_at: string | null;
        status: string;
        tracking_number: string;
      }) => [
        row.tracking_number,
        row.carrier_id,
        row.status,
        row.shipped_at,
        row.delivered_at,
      ]),
    ]
      .map((row) => row.map(getSafeCsvValue).join(","))
      .join("\n");
  }

  if (entity === "invoices") {
    const query = supabase
      .from("invoices")
      .select("invoice_number, carrier_id, amount, status, approval_status")
      .order("created_at", { ascending: false });
    const { data } = companyId ? await query.eq("company_id", companyId) : await query;
    const rows = data ?? [];
    return [
      ["invoice_number", "carrier_id", "amount", "status", "approval_status"],
      ...rows.map((row: {
        amount: number;
        approval_status: string | null;
        carrier_id: string;
        invoice_number: string;
        status: string;
      }) => [
        row.invoice_number,
        row.carrier_id,
        row.amount,
        row.status,
        row.approval_status,
      ]),
    ]
      .map((row) => row.map(getSafeCsvValue).join(","))
      .join("\n");
  }

  if (entity === "payments") {
    const invoiceQuery = supabase.from("invoices").select("id");
    const { data: invoices } = companyId
      ? await invoiceQuery.eq("company_id", companyId)
      : await invoiceQuery;
    const ids = (invoices ?? []).map((invoice: { id: string }) => invoice.id);
    const { data } = ids.length
      ? await supabase
          .from("payments")
          .select("invoice_id, amount, status, paid_at, method")
          .in("invoice_id", ids)
      : { data: [] };
    const rows = data ?? [];
    return [
      ["invoice_id", "amount", "status", "paid_at", "method"],
      ...rows.map((row: {
        amount: number;
        invoice_id: string;
        method: string | null;
        paid_at: string | null;
        status: string;
      }) => [
        row.invoice_id,
        row.amount,
        row.status,
        row.paid_at,
        row.method,
      ]),
    ]
      .map((row) => row.map(getSafeCsvValue).join(","))
      .join("\n");
  }

  if (entity === "reports") {
    const query = supabase
      .from("reports")
      .select("name, type, created_at")
      .order("created_at", { ascending: false });
    const { data } = companyId ? await query.eq("company_id", companyId) : await query;
    const rows = data ?? [];
    return [
      ["name", "type", "created_at"],
      ...rows.map((row: { created_at: string; name: string; type: string }) => [
        row.name,
        row.type,
        row.created_at,
      ]),
    ]
      .map((row) => row.map(getSafeCsvValue).join(","))
      .join("\n");
  }

  if (entity === "users") {
    const query = supabase
      .from("profiles")
      .select("full_name, email, role, company_id")
      .order("created_at", { ascending: false });
    const { data } = companyId ? await query.eq("company_id", companyId) : await query;
    const rows = data ?? [];
    return [
      ["full_name", "email", "role", "company_id"],
      ...rows.map((row: {
        company_id: string | null;
        email: string | null;
        full_name: string | null;
        role: string;
      }) => [row.full_name, row.email, row.role, row.company_id]),
    ]
      .map((row) => row.map(getSafeCsvValue).join(","))
      .join("\n");
  }

  return "message\nUnsupported export entity";
}
