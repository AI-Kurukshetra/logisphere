"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { getAuthRedirectPath } from "@/lib/supabase/session";
import type { UserRole } from "@/types/database";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getFile(formData: FormData, key: string) {
  const value = formData.get(key);
  if (!(value instanceof File) || value.size === 0) {
    return null;
  }
  return value;
}

function buildAuthUrl(mode: string, params: Record<string, string>) {
  const search = new URLSearchParams({ mode });

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      search.set(key, value);
    }
  });

  return `/auth?${search.toString()}`;
}

async function getPostAuthUrl(next: string | null) {
  if (next?.startsWith("/")) {
    return next;
  }

  return getAuthRedirectPath();
}

const SIGNUP_ROLE_VALUES = [
  "billing_manager",
  "supply_chain_manager",
  "drivers_carriers",
] as const;

function inferProfileRole(user: User): UserRole | null {
  const appRole = user.app_metadata?.platform_role;
  if (appRole === "admin") {
    return "admin";
  }

  const userRole = user.user_metadata?.role;
  if (
    typeof userRole === "string" &&
    SIGNUP_ROLE_VALUES.includes(userRole as (typeof SIGNUP_ROLE_VALUES)[number])
  ) {
    return userRole as UserRole;
  }

  return null;
}

async function syncProfileFromAuth(
  user: User,
  fallbackFullName?: string | null,
  fallbackAvatarUrl?: string | null
) {
  const supabase = await createClient();
  const desiredRole = inferProfileRole(user) ?? "viewer";
  const fullName =
    fallbackFullName?.trim() ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "") ||
    null;
  const avatarUrl =
    fallbackAvatarUrl?.trim() ||
    (typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url.trim()
      : "") ||
    null;

  const { data: profile, error: profileReadError } = await supabase
    .from("profiles")
    .select("id, role, company_id, full_name, email, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (profileReadError) {
    return profileReadError.message;
  }

  if (!profile) {
    const { error } = await supabase.from("profiles").insert({
      avatar_url: avatarUrl,
      email: user.email ?? null,
      full_name: fullName,
      id: user.id,
      role: desiredRole,
    });

    return error?.message ?? null;
  }

  const updatePayload: {
    avatar_url?: string | null;
    email?: string | null;
    full_name?: string | null;
    role?: UserRole;
  } = {};

  if (profile.email !== (user.email ?? null)) {
    updatePayload.email = user.email ?? null;
  }

  if (fullName && profile.full_name !== fullName) {
    updatePayload.full_name = fullName;
  }

  if (avatarUrl && profile.avatar_url !== avatarUrl) {
    updatePayload.avatar_url = avatarUrl;
  }

  if (
    !profile.company_id &&
    profile.role !== desiredRole &&
    (profile.role === "viewer" ||
      desiredRole === "admin" ||
      ["billing_manager", "supply_chain_manager", "drivers_carriers"].includes(
        profile.role
      ))
  ) {
    updatePayload.role = desiredRole;
  }

  if (Object.keys(updatePayload).length === 0) {
    return null;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id);

  return error?.message ?? null;
}

function validateAvatarFile(file: File | null) {
  if (!file) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    return "Profile photo must be an image file.";
  }

  if (file.size > 5 * 1024 * 1024) {
    return "Profile photo must be 5MB or smaller.";
  }

  return null;
}

function getFileExtension(file: File) {
  const [, subtype = "jpg"] = file.type.split("/");
  return subtype === "jpeg" ? "jpg" : subtype;
}

async function uploadProfilePhoto(userId: string, file: File) {
  const supabase = await createClient();
  const extension = getFileExtension(file);
  const path = `${userId}/signup-avatar.${extension}`;

  const { error } = await supabase.storage
    .from("profile-photos")
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    return {
      error: error.message,
      url: null,
    };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("profile-photos").getPublicUrl(path);

  return {
    error: null,
    url: publicUrl,
  };
}

export async function signInAction(formData: FormData) {
  const supabase = await createClient();
  const email = getValue(formData, "email");
  const password = getValue(formData, "password");
  const next = getValue(formData, "next");

  if (!email || !password) {
    redirect(
      buildAuthUrl("signin", {
        error: "Email and password are required.",
        next,
      })
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    redirect(
      buildAuthUrl("signin", {
        error: error?.message || "Unable to sign in.",
        next,
      })
    );
  }

  const syncError = await syncProfileFromAuth(data.user);

  if (syncError) {
    redirect(
      buildAuthUrl("signin", {
        error: `Signed in, but profile sync failed: ${syncError}`,
        next,
      })
    );
  }

  revalidatePath("/", "layout");
  redirect(await getPostAuthUrl(next || null));
}

export async function signUpAction(formData: FormData) {
  const supabase = await createClient();
  const fullName = getValue(formData, "fullName");
  const email = getValue(formData, "email");
  const password = getValue(formData, "password");
  const avatarFile = getFile(formData, "avatar");
  const roleRaw = getValue(formData, "role");
  const role = SIGNUP_ROLE_VALUES.includes(roleRaw as (typeof SIGNUP_ROLE_VALUES)[number])
    ? (roleRaw as (typeof SIGNUP_ROLE_VALUES)[number])
    : "supply_chain_manager";

  if (!fullName || !email || !password) {
    redirect(
      buildAuthUrl("signup", {
        error: "Full name, email, and password are required.",
      })
    );
  }

  const avatarValidationError = validateAvatarFile(avatarFile);

  if (avatarValidationError) {
    redirect(
      buildAuthUrl("signup", {
        error: avatarValidationError,
      })
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        avatar_url: null,
        full_name: fullName,
        role,
      },
    },
  });

  if (error) {
    redirect(
      buildAuthUrl("signup", {
        error: error.message,
      })
    );
  }

  revalidatePath("/", "layout");

  let avatarUrl: string | null = null;

  if (data.user && data.session && avatarFile) {
    const uploadResult = await uploadProfilePhoto(data.user.id, avatarFile);
    if (uploadResult.error) {
      redirect(
        buildAuthUrl("signup", {
          error: `Account created, but photo upload failed: ${uploadResult.error}`,
        })
      );
    }
    avatarUrl = uploadResult.url;
  }

  if (data.user) {
    const syncError = await syncProfileFromAuth(data.user, fullName, avatarUrl);

    if (syncError) {
      redirect(
        buildAuthUrl("signup", {
          error: `Account created, but profile setup failed: ${syncError}`,
        })
      );
    }
  }

  if (data.session) {
    redirect("/dashboard");
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!signInError) {
    if (data.user && avatarFile && !avatarUrl) {
      const uploadResult = await uploadProfilePhoto(data.user.id, avatarFile);
      if (uploadResult.error) {
        redirect(
          buildAuthUrl("signup", {
            error: `Account created, but photo upload failed: ${uploadResult.error}`,
          })
        );
      }

      const syncError = await syncProfileFromAuth(data.user, fullName, uploadResult.url);
      if (syncError) {
        redirect(
          buildAuthUrl("signup", {
            error: `Account created, but profile photo sync failed: ${syncError}`,
          })
        );
      }
    }

    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  redirect(
    buildAuthUrl("signup", {
      error:
        "Signup completed, but no session was created. Disable email confirmation in Supabase Auth to allow direct signup.",
    })
  );
}

export async function magicLinkAction(formData: FormData) {
  const supabase = await createClient();
  const email = getValue(formData, "email");

  if (!email) {
    redirect(
      buildAuthUrl("magic", {
        error: "Email is required for magic link sign-in.",
      })
    );
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: await getSiteUrl("/auth/confirm"),
    },
  });

  if (error) {
    redirect(
      buildAuthUrl("magic", {
        error: error.message,
      })
    );
  }

  redirect(
    buildAuthUrl("magic", {
      message: "Magic link sent. Open the email to continue.",
    })
  );
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth");
}
