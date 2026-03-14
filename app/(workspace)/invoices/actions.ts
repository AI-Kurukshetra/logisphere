"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/supabase/session";
import { logActivity } from "@/lib/workspace-admin";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createInvoiceAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("invoices.manage");
  const carrierId = getValue(formData, "carrierId");
  const shipmentId = getValue(formData, "shipmentId");
  const invoiceNumber = getValue(formData, "invoiceNumber");
  const amount = Number(getValue(formData, "amount") || "0");
  const dueDate = getValue(formData, "dueDate");
  const originZone = getValue(formData, "originZone");
  const destZone = getValue(formData, "destZone");
  const weightKg = Number(getValue(formData, "weightKg") || "0");

  if (!carrierId || !invoiceNumber || !amount) {
    redirect("/invoices?error=Carrier, invoice number, and amount are required.");
  }

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      amount,
      approval_status: "pending_approval",
      carrier_id: carrierId,
      company_id: company!.id,
      currency: "USD",
      due_date: dueDate || null,
      invoice_number: invoiceNumber,
      line_items: [
        {
          dest_zone: destZone || null,
          origin_zone: originZone || null,
          weight_kg: weightKg || null,
        },
      ],
      shipment_id: shipmentId || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/invoices?error=Unable to create invoice.");
  }

  await logActivity(supabase, {
    action: "invoices.created",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: String(data.id),
    entityType: "invoice",
    summary: `Created invoice ${invoiceNumber}.`,
  });

  revalidatePath("/invoices");
  redirect("/invoices?message=Invoice created.");
}

export async function runInvoiceAuditAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("audits.run");
  const invoiceId = getValue(formData, "invoiceId");

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, amount, carrier_id, invoice_number, line_items")
    .eq("id", invoiceId)
    .eq("company_id", company!.id)
    .maybeSingle();

  if (!invoice) {
    redirect("/invoices?error=Invoice not found.");
  }

  const firstLineItem = Array.isArray(invoice.line_items)
    ? (invoice.line_items[0] as Record<string, unknown> | undefined)
    : undefined;

  const originZone = typeof firstLineItem?.origin_zone === "string" ? firstLineItem.origin_zone : null;
  const destZone = typeof firstLineItem?.dest_zone === "string" ? firstLineItem.dest_zone : null;
  const weightKg = Number(firstLineItem?.weight_kg ?? 0);

  const { data: contract } = await supabase
    .from("contracts")
    .select("id")
    .eq("company_id", company!.id)
    .eq("carrier_id", invoice.carrier_id)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  let rateQuery = supabase
    .from("rates")
    .select("id, rate_amount, contract_id, weight_kg_min, weight_kg_max")
    .eq("carrier_id", invoice.carrier_id)
    .order("effective_from", { ascending: false })
    .limit(1);

  if (contract?.id) {
    rateQuery = rateQuery.eq("contract_id", contract.id);
  }
  if (originZone) {
    rateQuery = rateQuery.eq("origin_zone", originZone);
  }
  if (destZone) {
    rateQuery = rateQuery.eq("dest_zone", destZone);
  }

  const { data: matchingRates } = await rateQuery;
  const rate = (matchingRates ?? []).find((item) => {
    const min = Number(item.weight_kg_min ?? 0);
    const max = item.weight_kg_max == null ? null : Number(item.weight_kg_max);
    return (!weightKg || weightKg >= min) && (max == null || weightKg <= max);
  }) ?? matchingRates?.[0];

  const expectedAmount = Number(rate?.rate_amount ?? 0);
  const varianceAmount = Number(invoice.amount) - expectedAmount;
  const passed = expectedAmount > 0 && Math.abs(varianceAmount) < 0.01;

  const { error } = await supabase.from("audits").insert({
    details: {
      expected_amount: expectedAmount || null,
      invoice_number: invoice.invoice_number,
      matched_rate_id: rate?.id ?? null,
      observed_amount: invoice.amount,
    },
    invoice_id: invoice.id,
    result: passed ? "pass" : "fail",
    rule_name: "rate_match",
    variance_amount: expectedAmount ? varianceAmount : null,
  });

  if (error) {
    redirect("/invoices?error=Unable to write audit result.");
  }

  await supabase
    .from("invoices")
    .update({
      approval_status: passed ? "approved" : "pending_approval",
      status: passed ? "approved" : "exception",
    })
    .eq("id", invoice.id);

  await logActivity(supabase, {
    action: "audits.run",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: invoice.id,
    entityType: "invoice",
    metadata: {
      expectedAmount,
      varianceAmount: expectedAmount ? varianceAmount : null,
    },
    summary: `Ran invoice audit for ${invoice.invoice_number}.`,
  });

  revalidatePath("/invoices");
  redirect("/invoices?message=Invoice audit completed.");
}
