import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { hashPassword, createSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" }, { status: 400 });
  }

  const { data: user } = await supabaseAdmin
    .from("admin_users")
    .select("username, password_hash, salt")
    .eq("username", username)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ error: "ไม่พบชื่อผู้ใช้นี้" }, { status: 401 });
  }

  const computed = await hashPassword(password, user.salt);
  if (computed !== user.password_hash) {
    return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  const cookieValue = await createSessionCookie(user.username);
  const res = NextResponse.json({ success: true });
  res.cookies.set("admin_session", cookieValue, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
