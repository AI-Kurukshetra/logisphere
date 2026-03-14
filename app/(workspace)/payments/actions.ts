"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/supabase/session";
import { logActivity } from "@/lib/workspace-admin";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function approveInvoiceAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("payments.manage");
  const invoiceId = getValue(formData, "invoiceId");

  if (!invoiceId) {
    redirect("/payments?error=Invoice is required.");
  }

  const { error } = await supabase
    .from("invoices")
    .update({
      approval_status: "approved",
      status: "approved",
    })
    .eq("id", invoiceId)
    .eq("company_id", company!.id);

  if (error) {
    redirect("/payments?error=Unable to approve invoice.");
  }

  await logActivity(supabase, {
    action: "payments.invoice.approved",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: invoiceId,
    entityType: "invoice",
    summary: `Approved invoice ${invoiceId}.`,
  });

  revalidatePath("/payments");
  redirect("/payments?message=Invoice approved.");
}

export async function createPaymentAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("payments.manage");
  const invoiceId = getValue(formData, "invoiceId");
  const amount = Number(getValue(formData, "amount") || "0");
  const method = getValue(formData, "method");
  const reference = getValue(formData, "reference");

  if (!invoiceId || !amount) {
    redirect("/payments?error=Invoice and amount are required.");
  }

  const { data, error } = await supabase
    .from("payments")
    .insert({
      amount,
      currency: "USD",
      invoice_id: invoiceId,
      method: method || null,
      paid_at: new Date().toISOString(),
      reference: reference || null,
      status: "completed",
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/payments?error=Unable to create payment.");
  }

  await supabase
    .from("invoices")
    .update({
      approval_status: "approved",
      status: "paid",
    })
    .eq("id", invoiceId)
    .eq("company_id", company!.id);

  await logActivity(supabase, {
    action: "payments.created",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: String(data.id),
    entityType: "payment",
    summary: `Recorded payment for invoice ${invoiceId}.`,
  });

  revalidatePath("/payments");
  redirect("/payments?message=Payment recorded.");
}
