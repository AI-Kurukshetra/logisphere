"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCompanyAdmin } from "@/lib/supabase/session";
import { logActivity } from "@/lib/workspace-admin";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function updateMemberAccessAction(formData: FormData) {
  const { company, profile, supabase } = await requireCompanyAdmin();
  const profileId = getValue(formData, "profileId");
  const role = getValue(formData, "role");
  const regionId = getValue(formData, "regionId");
  const businessUnitId = getValue(formData, "businessUnitId");
  const facilityId = getValue(formData, "facilityId");

  if (!profileId || !role) {
    redirect("/settings/access?error=Profile and role are required.");
  }

  if (profileId === profile?.id && role !== "admin") {
    redirect("/settings/access?error=You cannot remove your own admin role.");
  }

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, full_name, email, company_id, role")
    .eq("id", profileId)
    .eq("company_id", company?.id ?? "")
    .maybeSingle();

  if (!targetProfile) {
    redirect("/settings/access?error=The selected profile is outside this company.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      business_unit_id: businessUnitId || null,
      facility_id: facilityId || null,
      region_id: regionId || null,
      role,
    })
    .eq("id", profileId);

  if (error) {
    redirect(`/settings/access?error=${encodeURIComponent(error.message)}`);
  }

  await logActivity(supabase, {
    action: "access.member.updated",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: profileId,
    entityType: "profile",
    metadata: {
      businessUnitId: businessUnitId || null,
      facilityId: facilityId || null,
      regionId: regionId || null,
      role,
    },
    summary: `Updated access scope for ${targetProfile.full_name || targetProfile.email}.`,
  });

  revalidatePath("/dashboard");
  revalidatePath("/settings/access");
  redirect("/settings/access?message=Member access updated.");
}
