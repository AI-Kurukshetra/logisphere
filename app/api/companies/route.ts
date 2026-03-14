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
    .select("company_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.company_id) {
    return NextResponse.json({ company: null, hierarchy: null });
  }

  const [company, regions, businessUnits, facilities] = await Promise.all([
    supabase
      .from("companies")
      .select("id, name, slug, settings")
      .eq("id", profile.company_id)
      .maybeSingle(),
    supabase.from("regions").select("id", { count: "exact", head: true }).eq("company_id", profile.company_id),
    supabase
      .from("business_units")
      .select("id", { count: "exact", head: true })
      .eq("company_id", profile.company_id),
    supabase
      .from("facilities")
      .select("id", { count: "exact", head: true })
      .eq("company_id", profile.company_id),
  ]);

  return NextResponse.json({
    company: company.data,
    hierarchy: {
      business_units: businessUnits.count ?? 0,
      facilities: facilities.count ?? 0,
      regions: regions.count ?? 0,
    },
    role: profile.role,
  });
}
