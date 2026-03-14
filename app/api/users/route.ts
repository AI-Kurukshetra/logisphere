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
    .select(
      "id, email, full_name, avatar_url, company_id, role, job_title, region_id, business_unit_id, facility_id"
    )
    .eq("id", user.id)
    .maybeSingle();
  const permissions = profile?.role
    ? await supabase
        .from("role_permissions")
        .select("permission_key")
        .eq("role", profile.role)
    : { data: [] as Array<{ permission_key: string }> };

  const company =
    profile?.company_id != null
      ? (
          await supabase
            .from("companies")
            .select("id, name, slug, settings")
            .eq("id", profile.company_id)
            .maybeSingle()
        ).data
      : null;

  return NextResponse.json({
    company,
    permissions: (permissions.data ?? []).map((item) => item.permission_key),
    profile,
  });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const fullName =
    typeof body.fullName === "string" ? body.fullName.trim() : undefined;
  const avatarUrl =
    typeof body.avatarUrl === "string" ? body.avatarUrl.trim() : undefined;
  const companyName =
    typeof body.companyName === "string" ? body.companyName.trim() : undefined;
  const jobTitle =
    typeof body.jobTitle === "string" ? body.jobTitle.trim() : undefined;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .maybeSingle();

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      avatar_url: avatarUrl,
      email: user.email ?? null,
      full_name: fullName,
      id: user.id,
      job_title: jobTitle,
    },
    {
      onConflict: "id",
    }
  );

  if (profileError) {
    return NextResponse.json(
      { error: "Unable to update profile." },
      { status: 400 }
    );
  }

  if (companyName && profile?.company_id && profile.role === "admin") {
    const { error: companyError } = await supabase
      .from("companies")
      .update({ name: companyName })
      .eq("id", profile.company_id);

    if (companyError) {
      return NextResponse.json(
        { error: "Profile updated, but company rename failed." },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
