"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import {
  createBusinessUnitRecord,
  createFacilityRecord,
  createRegionRecord,
  logActivity,
} from "@/lib/workspace-admin";
import type { UserRole } from "@/types/database";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function inferOnboardingRole(
  profileRole: string | null | undefined,
  userMetadataRole: unknown
): UserRole {
  if (
    profileRole === "billing_manager" ||
    profileRole === "supply_chain_manager" ||
    profileRole === "drivers_carriers" ||
    profileRole === "viewer" ||
    profileRole === "admin"
  ) {
    return profileRole;
  }

  if (
    userMetadataRole === "billing_manager" ||
    userMetadataRole === "supply_chain_manager" ||
    userMetadataRole === "drivers_carriers"
  ) {
    return userMetadataRole;
  }

  return "viewer";
}

export async function completeOnboardingAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const fullName = getValue(formData, "fullName");
  const jobTitle = getValue(formData, "jobTitle");
  const companyName = getValue(formData, "companyName");
  const regionName = getValue(formData, "regionName");
  const businessUnitName = getValue(formData, "businessUnitName");
  const facilityName = getValue(formData, "facilityName");
  const facilityCode = getValue(formData, "facilityCode");
  const facilityCity = getValue(formData, "facilityCity");
  const facilityCountry = getValue(formData, "facilityCountry");
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const onboardingRole = inferOnboardingRole(
    existingProfile?.role,
    user.user_metadata?.role
  );

  if (
    !fullName ||
    !companyName ||
    !regionName ||
    !businessUnitName ||
    !facilityName
  ) {
    console.error("❌ Validation failed - Missing required fields:", {
      fullName: !!fullName,
      companyName: !!companyName,
      regionName: !!regionName,
      businessUnitName: !!businessUnitName,
      facilityName: !!facilityName,
    });
    redirect("/onboarding?error=Complete all required setup fields.");
  }

  const baseSlug = slugify(companyName) || "workspace";
  const slug = `${baseSlug}-${randomUUID().slice(0, 6)}`;
  const companyId = randomUUID();

  const { error: companyError } = await supabase
    .from("companies")
    .insert({
      id: companyId,
      name: companyName,
      settings: {
        onboarding_completed: true,
      },
      slug,
    });

  if (companyError) {
    console.error("❌ Company creation failed:", {
      error: companyError?.message,
      code: companyError?.code,
      details: companyError?.details,
    });
    redirect("/onboarding?error=Unable to create the company workspace.");
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      business_unit_id: null,
      company_id: companyId,
      email: user.email ?? null,
      facility_id: null,
      full_name: fullName,
      id: user.id,
      job_title: jobTitle || null,
      region_id: null,
      role: "admin",
    },
    {
      onConflict: "id",
    }
  );

  if (profileError) {
    console.error("❌ Profile attachment failed:", {
      error: profileError.message,
      code: profileError.code,
      details: profileError.details,
    });
    redirect("/onboarding?error=Unable to attach your profile to the company.");
  }

  const { data: region, error: regionError } = await createRegionRecord(supabase, {
    code: `${slugify(regionName).slice(0, 6).toUpperCase() || "REGION"}`,
    companyId,
    description: "Primary operating region created during onboarding.",
    name: regionName,
  });

  if (regionError || !region) {
    console.error("❌ Region creation failed:", {
      error: regionError?.message || "No region data returned",
      code: regionError?.code,
      details: regionError?.details,
    });
    redirect("/onboarding?error=Unable to create the initial region.");
  }

  const { data: businessUnit, error: businessUnitError } =
    await createBusinessUnitRecord(supabase, {
      code: `${slugify(businessUnitName).slice(0, 6).toUpperCase() || "BU"}`,
      companyId,
      description: "Initial business unit created during onboarding.",
      name: businessUnitName,
      regionId: String(region.id),
    });

  if (businessUnitError || !businessUnit) {
    console.error("❌ Business unit creation failed:", {
      error: businessUnitError?.message || "No business unit data returned",
      code: businessUnitError?.code,
      details: businessUnitError?.details,
    });
    redirect("/onboarding?error=Unable to create the initial business unit.");
  }

  const { data: facility, error: facilityError } = await createFacilityRecord(
    supabase,
    {
      businessUnitId: String(businessUnit.id),
      city: facilityCity,
      code: facilityCode || `${slugify(facilityName).slice(0, 8).toUpperCase() || "HQ"}`,
      companyId,
      country: facilityCountry,
      name: facilityName,
      regionId: String(region.id),
      type: "headquarters",
    }
  );

  if (facilityError || !facility) {
    console.error("❌ Facility creation failed:", {
      error: facilityError?.message || "No facility data returned",
      code: facilityError?.code,
      details: facilityError?.details,
    });
    redirect("/onboarding?error=Unable to create the initial facility.");
  }

  const { error: profileScopeError } = await supabase
    .from("profiles")
    .update({
      business_unit_id: businessUnit.id,
      facility_id: facility.id,
      region_id: region.id,
    })
    .eq("id", user.id);

  if (profileScopeError) {
    console.error("❌ Profile scope assignment failed:", {
      error: profileScopeError.message,
      code: profileScopeError.code,
      details: profileScopeError.details,
    });
    redirect("/onboarding?error=Unable to assign the initial org scope.");
  }

  if (onboardingRole !== "admin") {
    const { error: restoreRoleError } = await supabase
      .from("profiles")
      .update({
        role: onboardingRole,
      })
      .eq("id", user.id);

    if (restoreRoleError) {
      console.error("❌ Profile role restore failed:", {
        error: restoreRoleError.message,
        code: restoreRoleError.code,
        details: restoreRoleError.details,
      });
      redirect("/onboarding?error=Workspace created, but your selected role could not be restored.");
    }
  }

  await logActivity(supabase, {
    action: "onboarding.completed",
    actorProfileId: user.id,
    companyId,
    entityId: companyId,
    entityType: "company",
    metadata: {
      businessUnitId: businessUnit.id,
      facilityId: facility.id,
      regionId: region.id,
      role: onboardingRole,
    },
    summary: `Completed onboarding and created ${companyName} with its initial hierarchy.`,
  });

  console.log("✅ Onboarding completed successfully:", {
    userId: user.id,
    companyId,
    companyName: companyName,
    regionId: region.id,
    businessUnitId: businessUnit.id,
    facilityId: facility.id,
  });

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
