import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function authMiddleware(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // If credentials are missing, skip auth check but continue
    if (!url || !key) {
      console.warn("Supabase credentials not configured in middleware");
      return NextResponse.next({
        request: { headers: request.headers },
      });
    }

    const response = NextResponse.next({
      request: { headers: request.headers },
    });

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            response.cookies.set(name, value);
          });
        },
      },
    });

    // Attempt to refresh session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // User auth state is refreshed in cookie but don't block if it fails
    return response;
  } catch (error) {
    // Log but don't throw - continue with request
    console.warn("Middleware auth check failed (non-blocking):", error instanceof Error ? error.message : String(error));
    return NextResponse.next({
      request: { headers: request.headers },
    });
  }
}
