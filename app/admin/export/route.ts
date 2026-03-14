import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminExportCsv } from "@/app/admin/actions";

export async function GET(request: NextRequest) {
  const entity = request.nextUrl.searchParams.get("entity") || "carriers";
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

  const isPlatformAdmin =
    profile?.role === "admin" || user.app_metadata?.platform_role === "admin";

  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const csv = await createAdminExportCsv(entity, supabase, profile?.company_id ?? null);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${entity}-export.csv"`,
    },
  });
}
