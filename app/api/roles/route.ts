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
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const [permissions, rolePermissions] = await Promise.all([
    supabase.from("permissions").select("key, category, label").order("category"),
    supabase.from("role_permissions").select("role, permission_key"),
  ]);

  return NextResponse.json({
    current_role: profile?.role ?? null,
    permissions: permissions.data ?? [],
    role_permissions: rolePermissions.data ?? [],
  });
}
