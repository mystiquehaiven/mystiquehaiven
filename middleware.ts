import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // Middleware runs at the edge and can't verify Firebase tokens directly.
  // Actual admin claim verification happens inside the page (client-side)
  // and inside the /api/upload route (server-side).
  // This middleware handles the lightweight redirect for unauthenticated users
  // based on the presence of a session cookie if you add one later.
  // For now it passes through — the page component handles the auth check.
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};