"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/supabase/session";
import { logActivity } from "@/lib/workspace-admin";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function openInvoiceDisputeAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("invoices.manage");
  const invoiceId = getValue(formData, "invoiceId");
  const notes = getValue(formData, "notes");

  if (!invoiceId) {
    redirect("/exceptions?error=Invoice is required to open a dispute.");
  }

  const { data: existingDispute } = await supabase
    .from("invoice_disputes")
    .select("id")
    .eq("invoice_id", invoiceId)
    .eq("status", "open")
    .maybeSingle();

  if (existingDispute) {
    redirect("/exceptions?message=An open dispute already exists for this invoice.");
  }

  const { data: dispute, error } = await supabase
    .from("invoice_disputes")
    .insert({
      invoice_id: invoiceId,
      notes: notes || null,
      status: "open",
    })
    .select("id")
    .single();

  if (error || !dispute) {
    redirect("/exceptions?error=Unable to create the dispute.");
  }

  await supabase
    .from("invoices")
    .update({
      approval_status: "pending_approval",
      status: "disputed",
    })
    .eq("id", invoiceId)
    .eq("company_id", company!.id);

  await supabase.from("alerts").insert({
    company_id: company!.id,
    message: notes || "Finance opened a carrier dispute from the exception queue.",
    metadata: {
      dispute_id: dispute.id,
      invoice_id: invoiceId,
      source: "exceptions_workspace",
    },
    read: false,
    title: "Invoice dispute opened",
    type: "invoice_dispute",
  });

  await logActivity(supabase, {
    action: "invoice_disputes.opened",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: dispute.id,
    entityType: "invoice_dispute",
    metadata: { invoiceId },
    summary: `Opened a dispute for invoice ${invoiceId}.`,
  });

  revalidatePath("/exceptions");
  revalidatePath("/analytics");
  revalidatePath("/payments");
  redirect("/exceptions?message=Dispute opened.");
}

export async function resolveInvoiceDisputeAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("invoices.manage");
  const disputeId = getValue(formData, "disputeId");
  const invoiceId = getValue(formData, "invoiceId");

  if (!disputeId || !invoiceId) {
    redirect("/exceptions?error=Dispute resolution is missing invoice context.");
  }

  const { error } = await supabase
    .from("invoice_disputes")
    .update({
      resolved_at: new Date().toISOString(),
      status: "resolved",
    })
    .eq("id", disputeId);

  if (error) {
    redirect("/exceptions?error=Unable to resolve the dispute.");
  }

  await supabase
    .from("invoices")
    .update({
      approval_status: "approved",
      status: "approved",
    })
    .eq("id", invoiceId)
    .eq("company_id", company!.id);

  await supabase
    .from("alerts")
    .update({ read: true })
    .eq("company_id", company!.id)
    .eq("type", "invoice_dispute")
    .contains("metadata", { invoice_id: invoiceId });

  await logActivity(supabase, {
    action: "invoice_disputes.resolved",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: disputeId,
    entityType: "invoice_dispute",
    metadata: { invoiceId },
    summary: `Resolved dispute ${disputeId} and released invoice ${invoiceId}.`,
  });

  revalidatePath("/exceptions");
  revalidatePath("/analytics");
  revalidatePath("/payments");
  redirect("/exceptions?message=Dispute resolved.");
}

export async function acknowledgeAlertAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("audit.read");
  const alertId = getValue(formData, "alertId");

  if (!alertId) {
    redirect("/exceptions?error=Alert id is required.");
  }

  const { error } = await supabase
    .from("alerts")
    .update({ read: true })
    .eq("id", alertId)
    .eq("company_id", company!.id);

  if (error) {
    redirect("/exceptions?error=Unable to acknowledge alert.");
  }

  await logActivity(supabase, {
    action: "alerts.acknowledged",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: alertId,
    entityType: "alert",
    summary: `Acknowledged alert ${alertId}.`,
  });

  revalidatePath("/exceptions");
  revalidatePath("/analytics");
  redirect("/exceptions?message=Alert acknowledged.");
}
