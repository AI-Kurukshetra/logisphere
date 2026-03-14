/**
 * One-off script to create an admin user in Supabase.
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
 *
 * Run: node --env-file=.env.local scripts/create-admin-user.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "Admin@1234";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing env: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. in .env.local)"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  let userId;

  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email === ADMIN_EMAIL);

  if (found) {
    userId = found.id;
    console.log("Auth user already exists:", ADMIN_EMAIL, "(id:", userId, ")");
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) {
      console.error("Failed to create auth user:", error.message);
      process.exit(1);
    }
    userId = data.user.id;
    console.log("Created auth user:", ADMIN_EMAIL, "(id:", userId, ")");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .single();

  if (profileError && profileError.code !== "PGRST116") {
    console.error("Failed to read profile:", profileError.message);
    process.exit(1);
  }

  if (profile) {
    if (profile.role === "admin") {
      console.log("Profile already has role admin. Done.");
      return;
    }
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role: "admin", email: ADMIN_EMAIL, full_name: "Admin" })
      .eq("id", userId);
    if (updateError) {
      console.error("Failed to update profile to admin:", updateError.message);
      process.exit(1);
    }
    console.log("Updated profile to admin. Done.");
    return;
  }

  const { error: insertError } = await supabase.from("profiles").insert({
    id: userId,
    email: ADMIN_EMAIL,
    full_name: "Admin",
    role: "admin",
  });

  if (insertError) {
    console.error("Failed to create profile:", insertError.message);
    process.exit(1);
  }

  console.log("Created profile with role admin. Done.");
}

main();
