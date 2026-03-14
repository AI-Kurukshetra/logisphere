"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/supabase/session";
import { logActivity } from "@/lib/workspace-admin";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createCarrierAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("carriers.manage");
  const name = getValue(formData, "name");
  const code = getValue(formData, "code");
  const contactEmail = getValue(formData, "contactEmail");
  const contactPhone = getValue(formData, "contactPhone");

  if (!name) {
    redirect("/carriers?error=Carrier name is required.");
  }

  const { data, error } = await supabase
    .from("carriers")
    .insert({
      code: code || null,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      name,
      status: "active",
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/carriers?error=Unable to create carrier.");
  }

  await logActivity(supabase, {
    action: "carriers.created",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: String(data.id),
    entityType: "carrier",
    summary: `Created carrier ${name}.`,
  });

  revalidatePath("/carriers");
  redirect("/carriers?message=Carrier created.");
}

export async function createContractAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("contracts.manage");
  const carrierId = getValue(formData, "carrierId");
  const name = getValue(formData, "name");
  const terms = getValue(formData, "terms");
  const effectiveFrom = getValue(formData, "effectiveFrom");
  const effectiveTo = getValue(formData, "effectiveTo");

  if (!carrierId || !effectiveFrom) {
    redirect("/carriers?error=Carrier and effective date are required.");
  }

  const { data, error } = await supabase
    .from("contracts")
    .insert({
      carrier_id: carrierId,
      company_id: company!.id,
      effective_from: effectiveFrom,
      effective_to: effectiveTo || null,
      name: name || null,
      terms: terms || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/carriers?error=Unable to create contract.");
  }

  await logActivity(supabase, {
    action: "contracts.created",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: String(data.id),
    entityType: "contract",
    summary: `Created contract ${name || data.id}.`,
  });

  revalidatePath("/carriers");
  revalidatePath("/rates");
  redirect("/carriers?message=Contract created.");
}
