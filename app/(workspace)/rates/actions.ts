"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/supabase/session";
import { logActivity } from "@/lib/workspace-admin";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createRateAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("rates.manage");
  const carrierId = getValue(formData, "carrierId");
  const contractId = getValue(formData, "contractId");
  const originZone = getValue(formData, "originZone");
  const destZone = getValue(formData, "destZone");
  const weightMin = Number(getValue(formData, "weightMin") || "0");
  const weightMax = Number(getValue(formData, "weightMax") || "0");
  const rateAmount = Number(getValue(formData, "rateAmount") || "0");
  const effectiveFrom = getValue(formData, "effectiveFrom");
  const effectiveTo = getValue(formData, "effectiveTo");

  if (!carrierId || !effectiveFrom || !rateAmount) {
    redirect("/rates?error=Carrier, effective date, and rate amount are required.");
  }

  const { data, error } = await supabase
    .from("rates")
    .insert({
      carrier_id: carrierId,
      contract_id: contractId || null,
      currency: "USD",
      dest_zone: destZone || null,
      effective_from: effectiveFrom,
      effective_to: effectiveTo || null,
      origin_zone: originZone || null,
      rate_amount: rateAmount,
      weight_kg_max: weightMax || null,
      weight_kg_min: weightMin || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/rates?error=Unable to create rate.");
  }

  await logActivity(supabase, {
    action: "rates.created",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: String(data.id),
    entityType: "rate",
    summary: `Created rate card entry for carrier ${carrierId}.`,
  });

  revalidatePath("/rates");
  redirect("/rates?message=Rate created.");
}
