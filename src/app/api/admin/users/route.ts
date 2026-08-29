import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateSalt, hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
  }

  const salt = generateSalt();
  const password_hash = await hashPassword(password, salt);

  const { error } = await supabaseAdmin
    .from("admin_users")
    .insert({ username, password_hash, salt });

  if (error) {
    const message = error.message.includes("duplicate")
      ? "มีชื่อผู้ใช้นี้อยู่แล้ว"
      : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
