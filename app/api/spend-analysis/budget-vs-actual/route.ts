import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
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
    return NextResponse.json({ data: [] });
  }

  const url = new URL(request.url);
  const fiscalYear = Number(url.searchParams.get("fiscal_year")) || new Date().getFullYear();

  const { data: bvaData } = await supabase
    .from("budget_vs_actual")
    .select("fiscal_month, budget_amount, actual_amount, variance, variance_percent")
    .eq("company_id", profile.company_id)
    .eq("fiscal_year", fiscalYear)
    .order("fiscal_month", { ascending: true });

  return NextResponse.json({
    data: bvaData ?? [],
    fiscal_year: fiscalYear,
  });
}
