import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("admin_session")?.value;
  const session = await verifySessionCookie(cookie);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(session);
}
