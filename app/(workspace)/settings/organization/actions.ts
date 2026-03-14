"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/supabase/session";
import {
  createBusinessUnitRecord,
  createFacilityRecord,
  createRegionRecord,
  logActivity,
} from "@/lib/workspace-admin";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createRegionAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("regions.manage");
  const name = getValue(formData, "name");
  const code = getValue(formData, "code");
  const description = getValue(formData, "description");

  if (!name) {
    redirect("/settings/organization?error=Region name is required.");
  }

  const { data, error } = await createRegionRecord(supabase, {
    code,
    companyId: company!.id,
    description,
    name,
  });

  if (error || !data) {
    redirect("/settings/organization?error=Unable to create region.");
  }

  await logActivity(supabase, {
    action: "organization.region.created",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: String(data.id),
    entityType: "region",
    summary: `Created region ${name}.`,
  });

  revalidatePath("/dashboard");
  revalidatePath("/settings/organization");
  redirect("/settings/organization?message=Region created.");
}

export async function createBusinessUnitAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission(
    "business_units.manage"
  );
  const name = getValue(formData, "name");
  const code = getValue(formData, "code");
  const description = getValue(formData, "description");
  const regionId = getValue(formData, "regionId");

  if (!name) {
    redirect("/settings/organization?error=Business unit name is required.");
  }

  const { data, error } = await createBusinessUnitRecord(supabase, {
    code,
    companyId: company!.id,
    description,
    name,
    regionId,
  });

  if (error || !data) {
    redirect("/settings/organization?error=Unable to create business unit.");
  }

  await logActivity(supabase, {
    action: "organization.business_unit.created",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: String(data.id),
    entityType: "business_unit",
    summary: `Created business unit ${name}.`,
  });

  revalidatePath("/dashboard");
  revalidatePath("/settings/organization");
  redirect("/settings/organization?message=Business unit created.");
}

export async function createFacilityAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission(
    "facilities.manage"
  );
  const name = getValue(formData, "name");
  const code = getValue(formData, "code");
  const type = getValue(formData, "type");
  const regionId = getValue(formData, "regionId");
  const businessUnitId = getValue(formData, "businessUnitId");
  const city = getValue(formData, "city");
  const country = getValue(formData, "country");
  const contactName = getValue(formData, "contactName");
  const contactEmail = getValue(formData, "contactEmail");

  if (!name) {
    redirect("/settings/organization?error=Facility name is required.");
  }

  const { data, error } = await createFacilityRecord(supabase, {
    businessUnitId,
    city,
    code,
    companyId: company!.id,
    contactEmail,
    contactName,
    country,
    name,
    regionId,
    type,
  });

  if (error || !data) {
    redirect("/settings/organization?error=Unable to create facility.");
  }

  await logActivity(supabase, {
    action: "organization.facility.created",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: String(data.id),
    entityType: "facility",
    summary: `Created facility ${name}.`,
  });

  revalidatePath("/dashboard");
  revalidatePath("/settings/organization");
  redirect("/settings/organization?message=Facility created.");
}
