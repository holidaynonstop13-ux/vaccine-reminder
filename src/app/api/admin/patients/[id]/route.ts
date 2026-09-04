import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const update: Record<string, string> = {};
  if (body.firstName !== undefined) update.first_name = body.firstName;
  if (body.lastName !== undefined) update.last_name = body.lastName;
  if (body.dateOfBirth !== undefined) update.date_of_birth = body.dateOfBirth;
  if (body.guardianName !== undefined) update.guardian_name = body.guardianName;
  if (body.guardianPhone !== undefined) update.guardian_phone = body.guardianPhone;
  if (body.queueCode !== undefined) update.queue_code = body.queueCode.trim().toUpperCase();
  if (body.address !== undefined) update.address = body.address;

  const { error } = await supabaseAdmin.from("patients").update(update).eq("id", id);

  if (error) {
    const message = error.message.includes("duplicate")
      ? "รหัสคิวนี้ถูกใช้ไปแล้ว กรุณาใช้รหัสอื่น"
      : error.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // appointments and line_links both reference patients with
  // "on delete cascade", so this removes their records too.
  const { error } = await supabaseAdmin.from("patients").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
