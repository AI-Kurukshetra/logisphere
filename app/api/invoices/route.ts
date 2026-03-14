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

  const { companyId, supabase } = context;
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, carrier_id, shipment_id, amount, currency, status, approval_status, due_date, created_at"
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: "Unable to load invoices." }, { status: 400 });
  }

  return NextResponse.json({ invoices: data ?? [] });
}

export async function POST(request: Request) {
  const context = await getWorkspaceContext();
  if ("error" in context) return context.error;

  const { companyId, supabase } = context;
  const body = await request.json();
  const carrierId = typeof body.carrierId === "string" ? body.carrierId.trim() : "";
  const shipmentId =
    typeof body.shipmentId === "string" && body.shipmentId.trim().length > 0
      ? body.shipmentId.trim()
      : null;
  const invoiceNumber = typeof body.invoiceNumber === "string" ? body.invoiceNumber.trim() : "";
  const amount = Number(body.amount ?? 0);
  const dueDate =
    typeof body.dueDate === "string" && body.dueDate.trim().length > 0 ? body.dueDate.trim() : null;
  const originZone =
    typeof body.originZone === "string" && body.originZone.trim().length > 0
      ? body.originZone.trim()
      : null;
  const destZone =
    typeof body.destZone === "string" && body.destZone.trim().length > 0 ? body.destZone.trim() : null;
  const weightKg = body.weightKg == null || body.weightKg === "" ? null : Number(body.weightKg);
  const currency =
    typeof body.currency === "string" && body.currency.trim().length > 0
      ? body.currency.trim().toUpperCase()
      : "USD";

  if (!carrierId || !invoiceNumber || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "carrierId, invoiceNumber, and a positive amount are required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      amount,
      approval_status: "pending_approval",
      carrier_id: carrierId,
      company_id: companyId,
      currency,
      due_date: dueDate,
      invoice_number: invoiceNumber,
      line_items: [
        {
          dest_zone: destZone,
          origin_zone: originZone,
          weight_kg: Number.isFinite(Number(weightKg)) ? weightKg : null,
        },
      ],
      shipment_id: shipmentId,
      status: "pending",
    })
    .select(
      "id, invoice_number, carrier_id, shipment_id, amount, currency, status, approval_status, due_date, created_at"
    )
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Unable to create invoice." }, { status: 400 });
  }

  return NextResponse.json({ invoice: data }, { status: 201 });
}
