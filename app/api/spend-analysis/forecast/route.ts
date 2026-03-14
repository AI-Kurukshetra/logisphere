import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchPredictiveForecast } from "@/lib/predictive-api";

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
    return NextResponse.json({ history: [], forecast: [], source: "linear_regression", accuracy_score: 0 });
  }

  const { data: invoices } = await supabase
    .from("invoices")
    .select("amount, created_at")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: true });

  // Build 12-month history
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (12 - 1 - i), 1);
    return {
      amount: 0,
      period: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    };
  });

  const monthMap = new Map(months.map((m) => [m.period, m]));

  for (const invoice of invoices ?? []) {
    const createdAt = new Date(invoice.created_at);
    const period = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
    const bucket = monthMap.get(period);
    if (bucket) {
      bucket.amount += Number(invoice.amount) || 0;
    }
  }

  const history = Array.from(monthMap.values());

  // Get forecast for 12 periods (default)
  const result = await fetchPredictiveForecast(history, 12);

  return NextResponse.json({
    accuracy_score: result.accuracy_score,
    forecast: result.forecast,
    history,
    source: result.source as "codex_api" | "linear_regression",
  });
}
