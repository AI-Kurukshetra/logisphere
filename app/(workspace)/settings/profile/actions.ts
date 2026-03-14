"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/workspace-admin";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const fullName = getValue(formData, "fullName");
  const email = getValue(formData, "email");
  const avatarUrl = getValue(formData, "avatarUrl");
  const jobTitle = getValue(formData, "jobTitle");
  const regionId = getValue(formData, "regionId");
  const businessUnitId = getValue(formData, "businessUnitId");
  const facilityId = getValue(formData, "facilityId");
  const companyName = getValue(formData, "companyName");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "company_id, role, email, full_name, avatar_url, job_title, region_id, business_unit_id, facility_id"
    )
    .eq("id", user.id)
    .maybeSingle();

  const canManageScope = profile?.role === "admin";

  if (email && email !== user.email) {
    const { error: authError } = await supabase.auth.updateUser({ email });

    if (authError) {
      redirect(`/settings/profile?error=${encodeURIComponent(authError.message)}`);
    }
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      avatar_url: avatarUrl || null,
      business_unit_id: canManageScope ? businessUnitId || null : profile?.business_unit_id ?? null,
      email: email || user.email || null,
      facility_id: canManageScope ? facilityId || null : profile?.facility_id ?? null,
      full_name: fullName,
      id: user.id,
      job_title: jobTitle || null,
      region_id: canManageScope ? regionId || null : profile?.region_id ?? null,
    },
    {
      onConflict: "id",
    }
  );

  if (profileError) {
    redirect("/settings/profile?error=Unable to update your profile.");
  }

  if (profile?.company_id && profile.role === "admin" && companyName) {
    const { error: companyError } = await supabase
      .from("companies")
      .update({
        name: companyName,
      })
      .eq("id", profile.company_id);

    if (companyError) {
      redirect("/settings/profile?error=Profile updated, but company rename failed.");
    }
  }

  if (profile?.company_id) {
    await logActivity(supabase, {
      action: "profile.updated",
      actorProfileId: user.id,
      companyId: profile.company_id,
      entityId: user.id,
      entityType: "profile",
      metadata: {
        avatarUrl: avatarUrl || null,
        businessUnitId: canManageScope ? businessUnitId || null : profile?.business_unit_id ?? null,
        email: email || user.email || null,
        facilityId: canManageScope ? facilityId || null : profile?.facility_id ?? null,
        fullName,
        jobTitle: jobTitle || null,
        regionId: canManageScope ? regionId || null : profile?.region_id ?? null,
      },
      summary: "Updated personal profile settings.",
    });
  }

  revalidatePath("/", "layout");
  redirect(
    `/settings/profile?message=${encodeURIComponent(
      email && email !== user.email
        ? "Profile updated. Check your inbox to confirm the email change."
        : "Profile updated."
    )}`
  );
}

export async function updateCompanyProfileAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const regionId = getValue(formData, "regionId");
  const businessUnitId = getValue(formData, "businessUnitId");
  const facilityId = getValue(formData, "facilityId");
  const companyName = getValue(formData, "companyName");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "company_id, role, region_id, business_unit_id, facility_id, full_name, email"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.company_id) {
    redirect("/settings/profile?tab=company&error=Company context not found.");
  }

  const canManageScope = profile.role === "admin";
  const nextRegionId = canManageScope ? regionId || null : profile.region_id ?? null;
  const nextBusinessUnitId = canManageScope
    ? businessUnitId || null
    : profile.business_unit_id ?? null;
  const nextFacilityId = canManageScope ? facilityId || null : profile.facility_id ?? null;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      business_unit_id: nextBusinessUnitId,
      facility_id: nextFacilityId,
      region_id: nextRegionId,
    })
    .eq("id", user.id);

  if (profileError) {
    redirect(`/settings/profile?tab=company&error=${encodeURIComponent(profileError.message)}`);
  }

  if (canManageScope && companyName) {
    const { error: companyError } = await supabase
      .from("companies")
      .update({
        name: companyName,
      })
      .eq("id", profile.company_id);

    if (companyError) {
      redirect(
        `/settings/profile?tab=company&error=${encodeURIComponent(
          "Scope updated, but company rename failed."
        )}`
      );
    }
  }

  await logActivity(supabase, {
    action: "profile.company_context.updated",
    actorProfileId: user.id,
    companyId: profile.company_id,
    entityId: user.id,
    entityType: "profile",
    metadata: {
      businessUnitId: nextBusinessUnitId,
      companyName: canManageScope ? companyName || null : null,
      facilityId: nextFacilityId,
      regionId: nextRegionId,
    },
    summary: `Updated company-linked profile context for ${profile.full_name || profile.email}.`,
  });

  revalidatePath("/", "layout");
  redirect("/settings/profile?tab=company&message=Company details updated.");
}
