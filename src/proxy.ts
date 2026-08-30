import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie } from "@/lib/auth";

const ADMIN_ONLY_PATHS = ["/admin/settings", "/admin/users", "/api/admin/settings", "/api/admin/users"];

export async function proxy(req: NextRequest) {
  const cookie = req.cookies.get("admin_session")?.value;
  const session = await verifySessionCookie(cookie);
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");

  if (!session) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const needsAdmin = ADMIN_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (needsAdmin && session.role !== "admin") {
    if (isApi) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงส่วนนี้" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
