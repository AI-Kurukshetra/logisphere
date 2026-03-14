import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import {
  createBusinessUnitRecord,
  createFacilityRecord,
  createRegionRecord,
  logActivity,
} from "@/lib/workspace-admin";
import type { UserRole } from "@/types/database";

interface OnboardingData {
  fullName: string;
  jobTitle: string;
  companyName: string;
  regionName: string;
  businessUnitName: string;
  facilityName: string;
  facilityCode: string;
  facilityCity: string;
  facilityCountry: string;
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

export async function POST(request: Request) {
  const logs: Array<{ timestamp: string; level: string; message: string; data?: unknown }> = [];

  function addLog(level: "info" | "error" | "success" | "warn", message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    logs.push({ timestamp, level, message, data });
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data || "");
  }

  try {
    const data: OnboardingData = await request.json();
    addLog("info", "Received onboarding request", { companyName: data.companyName });

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      addLog("error", "User not authenticated");
      return NextResponse.json({ error: "Unauthorized", logs }, { status: 401 });
    }

    addLog("info", "User authenticated", { userId: user.id, email: user.email });

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    // During onboarding, the first user must be admin
    const onboardingRole: UserRole = "admin";

    // Validation
    if (
      !data.fullName ||
      !data.companyName ||
      !data.regionName ||
      !data.businessUnitName ||
      !data.facilityName
    ) {
      addLog("error", "Validation failed - Missing required fields", {
        fullName: !!data.fullName,
        companyName: !!data.companyName,
        regionName: !!data.regionName,
        businessUnitName: !!data.businessUnitName,
        facilityName: !!data.facilityName,
      });
      return NextResponse.json(
        { error: "Complete all required setup fields.", logs },
        { status: 400 }
      );
    }

    addLog("info", "Validation passed");

    // Create Company
    const baseSlug = slugify(data.companyName) || "workspace";
    const slug = `${baseSlug}-${randomUUID().slice(0, 6)}`;
    const companyId = randomUUID();

    addLog("info", "Creating company", { id: companyId, name: data.companyName, slug });

    const { error: companyError } = await supabase
      .from("companies")
      .insert({
        id: companyId,
        name: data.companyName,
        settings: {
          onboarding_completed: true,
        },
        slug,
      });

    if (companyError) {
      addLog("error", "Company creation failed", {
        error: companyError?.message,
        code: companyError?.code,
        details: companyError?.details,
      });
      return NextResponse.json(
        { error: "Unable to create the company workspace.", logs },
        { status: 400 }
      );
    }

    addLog("success", "Company created", { companyId });

    // Update Profile
    addLog("info", "Attaching profile to company");

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        business_unit_id: null,
        company_id: companyId,
        email: user.email ?? null,
        facility_id: null,
        full_name: data.fullName,
        id: user.id,
        job_title: data.jobTitle || null,
        region_id: null,
        role: onboardingRole,
      },
      {
        onConflict: "id",
      }
    );

    if (profileError) {
      addLog("error", "Profile attachment failed", {
        error: profileError.message,
        code: profileError.code,
        details: profileError.details,
      });
      return NextResponse.json(
        { error: "Unable to attach your profile to the company.", logs },
        { status: 400 }
      );
    }

    addLog("success", "Profile attached to company");

    // Create Region
    addLog("info", "Creating region", { name: data.regionName });

    const { data: region, error: regionError } = await createRegionRecord(supabase, {
      code: `${slugify(data.regionName).slice(0, 6).toUpperCase() || "REGION"}`,
      companyId,
      description: "Primary operating region created during onboarding.",
      name: data.regionName,
    });

    if (regionError || !region) {
      addLog("error", "Region creation failed", {
        error: regionError?.message || "No region data returned",
        code: regionError?.code,
        details: regionError?.details,
      });
      return NextResponse.json(
        { error: "Unable to create the initial region.", logs },
        { status: 400 }
      );
    }

    addLog("success", "Region created", { regionId: region.id });

    // Create Business Unit
    addLog("info", "Creating business unit", { name: data.businessUnitName });

    const { data: businessUnit, error: businessUnitError } = await createBusinessUnitRecord(
      supabase,
      {
        code: `${slugify(data.businessUnitName).slice(0, 6).toUpperCase() || "BU"}`,
        companyId,
        description: "Initial business unit created during onboarding.",
        name: data.businessUnitName,
        regionId: String(region.id),
      }
    );

    if (businessUnitError || !businessUnit) {
      addLog("error", "Business unit creation failed", {
        error: businessUnitError?.message || "No business unit data returned",
        code: businessUnitError?.code,
        details: businessUnitError?.details,
      });
      return NextResponse.json(
        { error: "Unable to create the initial business unit.", logs },
        { status: 400 }
      );
    }

    addLog("success", "Business unit created", { businessUnitId: businessUnit.id });

    // Create Facility
    addLog("info", "Creating facility", { name: data.facilityName });

    const { data: facility, error: facilityError } = await createFacilityRecord(supabase, {
      businessUnitId: String(businessUnit.id),
      city: data.facilityCity,
      code:
        data.facilityCode ||
        `${slugify(data.facilityName).slice(0, 8).toUpperCase() || "HQ"}`,
      companyId,
      country: data.facilityCountry,
      name: data.facilityName,
      regionId: String(region.id),
      type: "headquarters",
    });

    if (facilityError || !facility) {
      addLog("error", "Facility creation failed", {
        error: facilityError?.message || "No facility data returned",
        code: facilityError?.code,
        details: facilityError?.details,
      });
      return NextResponse.json(
        { error: "Unable to create the initial facility.", logs },
        { status: 400 }
      );
    }

    addLog("success", "Facility created", { facilityId: facility.id });

    // Update Profile Scope
    addLog("info", "Assigning profile scope");

    const { error: profileScopeError } = await supabase
      .from("profiles")
      .update({
        business_unit_id: businessUnit.id,
        facility_id: facility.id,
        region_id: region.id,
      })
      .eq("id", user.id);

    if (profileScopeError) {
      addLog("error", "Profile scope assignment failed", {
        error: profileScopeError.message,
        code: profileScopeError.code,
        details: profileScopeError.details,
      });
      return NextResponse.json(
        { error: "Unable to assign the initial org scope.", logs },
        { status: 400 }
      );
    }

    addLog("success", "Profile scope assigned");

    // Log Activity
    addLog("info", "Logging activity");

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
      },
      summary: `Completed onboarding and created ${data.companyName} with its initial hierarchy.`,
    });

    addLog("success", "Activity logged");
    addLog("success", "Onboarding completed successfully", {
      userId: user.id,
      companyId,
      companyName: data.companyName,
      regionId: region.id,
      businessUnitId: businessUnit.id,
      facilityId: facility.id,
    });

    return NextResponse.json({
      success: true,
      logs,
      data: {
        userId: user.id,
        companyId,
        companyName: data.companyName,
        regionId: region.id,
        businessUnitId: businessUnit.id,
        facilityId: facility.id,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    addLog("error", "Unexpected error during onboarding", { error: errorMessage });
    return NextResponse.json(
      { error: "An unexpected error occurred.", logs },
      { status: 500 }
    );
  }
}
