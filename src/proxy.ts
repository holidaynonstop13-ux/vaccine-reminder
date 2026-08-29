import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const cookie = req.cookies.get("admin_session")?.value;
  const username = await verifySessionCookie(cookie);

  if (username) {
    return NextResponse.next();
  }

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("returnTo", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
