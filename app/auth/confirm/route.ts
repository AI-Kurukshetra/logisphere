import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthRedirectPath } from "@/lib/supabase/session";

function buildRedirect(request: NextRequest, pathname: string, error?: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  if (error) {
    url.searchParams.set("mode", "signin");
    url.searchParams.set("error", error);
  }

  return url;
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const next = request.nextUrl.searchParams.get("next");

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      buildRedirect(request, "/auth", "The confirmation link is incomplete.")
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return NextResponse.redirect(
      buildRedirect(request, "/auth", "The confirmation link is invalid or expired.")
    );
  }

  const url = request.nextUrl.clone();
  url.pathname = next?.startsWith("/") ? next : await getAuthRedirectPath();
  url.search = "";

  return NextResponse.redirect(url);
}
