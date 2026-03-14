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
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.company_id) {
    return {
      error: NextResponse.json({ error: "Company context is required." }, { status: 400 }),
      supabase,
    };
  }

  return { companyId: profile.company_id, supabase };
}

export async function GET() {
  const context = await getWorkspaceContext();
  if ("error" in context) return context.error;

  const { supabase } = context;
  const { data, error } = await supabase
    .from("rates")
    .select(
      "id, carrier_id, contract_id, rate_amount, currency, origin_zone, dest_zone, weight_kg_min, weight_kg_max, effective_from, effective_to, created_at"
    )
    .order("effective_from", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: "Unable to load rates." }, { status: 400 });
  }

  return NextResponse.json({ rates: data ?? [] });
}

export async function POST(request: Request) {
  const context = await getWorkspaceContext();
  if ("error" in context) return context.error;

  const { supabase } = context;
  const body = await request.json();
  const carrierId = typeof body.carrierId === "string" ? body.carrierId.trim() : "";
  const contractId =
    typeof body.contractId === "string" && body.contractId.trim().length > 0
      ? body.contractId.trim()
      : null;
  const originZone =
    typeof body.originZone === "string" && body.originZone.trim().length > 0
      ? body.originZone.trim()
      : null;
  const destZone =
    typeof body.destZone === "string" && body.destZone.trim().length > 0 ? body.destZone.trim() : null;
  const rateAmount = Number(body.rateAmount ?? 0);
  const weightMin = body.weightMin == null || body.weightMin === "" ? null : Number(body.weightMin);
  const weightMax = body.weightMax == null || body.weightMax === "" ? null : Number(body.weightMax);
  const effectiveFrom = typeof body.effectiveFrom === "string" ? body.effectiveFrom.trim() : "";
  const effectiveTo =
    typeof body.effectiveTo === "string" && body.effectiveTo.trim().length > 0
      ? body.effectiveTo.trim()
      : null;
  const currency =
    typeof body.currency === "string" && body.currency.trim().length > 0
      ? body.currency.trim().toUpperCase()
      : "USD";

  if (!carrierId || !effectiveFrom || !Number.isFinite(rateAmount) || rateAmount <= 0) {
    return NextResponse.json(
      { error: "carrierId, effectiveFrom, and a positive rateAmount are required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("rates")
    .insert({
      carrier_id: carrierId,
      contract_id: contractId,
      currency,
      dest_zone: destZone,
      effective_from: effectiveFrom,
      effective_to: effectiveTo,
      origin_zone: originZone,
      rate_amount: rateAmount,
      weight_kg_max: Number.isFinite(Number(weightMax)) ? weightMax : null,
      weight_kg_min: Number.isFinite(Number(weightMin)) ? weightMin : null,
    })
    .select(
      "id, carrier_id, contract_id, rate_amount, currency, origin_zone, dest_zone, weight_kg_min, weight_kg_max, effective_from, effective_to, created_at"
    )
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Unable to create rate." }, { status: 400 });
  }

  return NextResponse.json({ rate: data }, { status: 201 });
}
