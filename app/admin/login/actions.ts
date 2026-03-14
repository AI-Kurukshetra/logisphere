"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function buildAdminLoginUrl(error: string) {
  const search = new URLSearchParams({ error });
  return `/admin/login?${search.toString()}`;
}

export async function adminSignInAction(formData: FormData) {
  const supabase = await createClient();
  const email = getValue(formData, "email");
  const password = getValue(formData, "password");

  if (!email || !password) {
    redirect(buildAdminLoginUrl("Email and password are required."));
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    redirect(buildAdminLoginUrl(error?.message || "Unable to sign in."));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  const isPlatformAdmin =
    profile?.role === "admin" ||
    data.user.app_metadata?.platform_role === "admin";

  if (!isPlatformAdmin) {
    await supabase.auth.signOut();
    redirect(buildAdminLoginUrl("This account does not have admin access."));
  }

  revalidatePath("/", "layout");
  redirect("/admin/dashboard");
}

export async function adminSignOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/admin/login");
}
