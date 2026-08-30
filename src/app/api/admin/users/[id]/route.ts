import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifySessionCookie } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { role } = await req.json();

  if (role !== "admin" && role !== "staff") {
    return NextResponse.json({ error: "สิทธิ์ไม่ถูกต้อง" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("admin_users").update({ role }).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cookie = req.cookies.get("admin_session")?.value;
  const session = await verifySessionCookie(cookie);

  const { data: target } = await supabaseAdmin
    .from("admin_users")
    .select("username")
    .eq("id", id)
    .maybeSingle();

  if (target && session && target.username === session.username) {
    return NextResponse.json({ error: "ไม่สามารถลบบัญชีที่ใช้งานอยู่ได้" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("admin_users").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
