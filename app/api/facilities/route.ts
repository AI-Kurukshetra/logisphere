import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createFacilityRecord, logActivity } from "@/lib/workspace-admin";

function readString(body: unknown, key: string) {
  if (typeof body === "object" && body !== null && key in body) {
    const value = (body as Record<string, unknown>)[key];
    return typeof value === "string" ? value.trim() : "";
  }

  return "";
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.company_id) {
    return NextResponse.json({ facilities: [] });
  }

  const { data } = await supabase
    .from("facilities")
    .select("id, name, code, type, status, region_id, business_unit_id, address")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ facilities: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, company_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.company_id || profile.role === "viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const name = readString(body, "name");

  if (!name) {
    return NextResponse.json(
      { error: "Facility name is required." },
      { status: 400 }
    );
  }

  const { data, error } = await createFacilityRecord(supabase, {
    businessUnitId: readString(body, "businessUnitId"),
    city: readString(body, "city"),
    code: readString(body, "code"),
    companyId: profile.company_id,
    contactEmail: readString(body, "contactEmail"),
    contactName: readString(body, "contactName"),
    country: readString(body, "country"),
    name,
    regionId: readString(body, "regionId"),
    type: readString(body, "type"),
  });

  if (error || !data) {
    return NextResponse.json({ error: "Unable to create facility." }, { status: 400 });
  }

  await logActivity(supabase, {
    action: "organization.facility.created",
    actorProfileId: profile.id,
    companyId: profile.company_id,
    entityId: String(data.id),
    entityType: "facility",
    summary: `Created facility ${name} via API.`,
  });

  return NextResponse.json({ facility: data });
}
