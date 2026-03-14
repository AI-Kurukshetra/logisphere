import { authMiddleware } from "@/middleware/auth";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  return authMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
