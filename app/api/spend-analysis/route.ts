import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    return NextResponse.json({ data: { byMonth: [], byCarrier: [], byLane: [] } });
  }

  const { data: invoices } = await supabase
    .from("invoices")
    .select("amount, carrier_id, created_at, shipment_id")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: true });

  const { data: shipments } = await supabase
    .from("shipments")
    .select("id, origin_facility_id, dest_facility_id")
    .eq("company_id", profile.company_id);

  const { data: facilities } = await supabase
    .from("facilities")
    .select("id, name")
    .eq("company_id", profile.company_id);

  const { data: carriers } = await supabase.from("carriers").select("id, name");

  // Build monthly buckets
  const monthlyMap = new Map<string, number>();
  const carrierMap = new Map<string, number>();
  const laneMap = new Map<string, number>();

  const facilityNameMap = new Map((facilities ?? []).map((f: any) => [f.id, f.name]));
  const carrierNameMap = new Map((carriers ?? []).map((c: any) => [c.id, c.name]));
  const shipmentMap = new Map((shipments ?? []).map((s: any) => [s.id, s]));

  for (const invoice of invoices ?? []) {
    const amount = Number(invoice.amount) || 0;
    const createdAt = new Date(invoice.created_at);
    const period = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;

    // Monthly
    monthlyMap.set(period, (monthlyMap.get(period) ?? 0) + amount);

    // By carrier
    carrierMap.set(
      invoice.carrier_id,
      (carrierMap.get(invoice.carrier_id) ?? 0) + amount
    );

    // By lane
    let laneKey = "Unassigned";
    if (invoice.shipment_id) {
      const shipment = shipmentMap.get(invoice.shipment_id);
      if (shipment) {
        const origin = shipment.origin_facility_id
          ? facilityNameMap.get(shipment.origin_facility_id)
          : null;
        const dest = shipment.dest_facility_id ? facilityNameMap.get(shipment.dest_facility_id) : null;
        laneKey = `${origin || "Origin"} → ${dest || "Destination"}`;
      }
    }
    laneMap.set(laneKey, (laneMap.get(laneKey) ?? 0) + amount);
  }

  const byMonth = Array.from(monthlyMap.entries())
    .map(([period, amount]) => ({ period, amount }))
    .sort((a, b) => a.period.localeCompare(b.period));

  const byCarrier = Array.from(carrierMap.entries())
    .map(([carrierId, amount]) => ({
      carrier_id: carrierId,
      carrier_name: carrierNameMap.get(carrierId) || "Unknown",
      amount,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  const byLane = Array.from(laneMap.entries())
    .map(([lane, amount]) => ({ lane, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  return NextResponse.json({
    data: {
      byCarrier,
      byLane,
      byMonth,
    },
  });
}
