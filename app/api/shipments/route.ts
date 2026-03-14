import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getWorkspaceContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), supabase };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.company_id) {
    return {
      error: NextResponse.json({ error: "Company context is required." }, { status: 400 }),
      supabase,
    };
  }

  return { companyId: profile.company_id, profileId: profile.id, supabase };
}

export async function GET() {
  const context = await getWorkspaceContext();
  if ("error" in context) return context.error;

  const { companyId, supabase } = context;
  const { data, error } = await supabase
    .from("shipments")
    .select("id, carrier_id, tracking_number, status, shipped_at, delivered_at, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: "Unable to load shipments." }, { status: 400 });
  }

  return NextResponse.json({ shipments: data ?? [] });
}

export async function POST(request: Request) {
  const context = await getWorkspaceContext();
  if ("error" in context) return context.error;

  const { companyId, supabase } = context;
  const body = await request.json();
  const carrierId = typeof body.carrierId === "string" ? body.carrierId.trim() : "";
  const trackingNumber = typeof body.trackingNumber === "string" ? body.trackingNumber.trim() : "";
  const originFacilityId =
    typeof body.originFacilityId === "string" && body.originFacilityId.trim().length > 0
      ? body.originFacilityId.trim()
      : null;
  const destFacilityId =
    typeof body.destFacilityId === "string" && body.destFacilityId.trim().length > 0
      ? body.destFacilityId.trim()
      : null;
  const shippedAt =
    typeof body.shippedAt === "string" && body.shippedAt.trim().length > 0 ? body.shippedAt : null;

  if (!carrierId || !trackingNumber) {
    return NextResponse.json(
      { error: "carrierId and trackingNumber are required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("shipments")
    .insert({
      carrier_id: carrierId,
      company_id: companyId,
      dest_facility_id: destFacilityId,
      origin_facility_id: originFacilityId,
      shipped_at: shippedAt,
      status: "created",
      tracking_number: trackingNumber,
    })
    .select("id, carrier_id, tracking_number, status, shipped_at, delivered_at, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Unable to create shipment." }, { status: 400 });
  }

  return NextResponse.json({ shipment: data }, { status: 201 });
}
