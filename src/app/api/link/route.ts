import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function verifyLineIdToken(idToken: string) {
  // LIFF ID looks like "2011320531-zAdtQQgH" — the part before the
  // dash is the LINE Login Channel ID, which LINE's verify endpoint
  // needs as client_id.
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID ?? "";
  const channelId = liffId.split("-")[0];

  const res = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ id_token: idToken, client_id: channelId }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.sub as string | undefined; // sub = the LINE user's unique ID
}

export async function POST(req: NextRequest) {
  const { idToken, queueCode } = await req.json();

  if (!idToken || !queueCode) {
    return NextResponse.json({ error: "กรุณากรอก PID" }, { status: 400 });
  }

  const lineUserId = await verifyLineIdToken(idToken);
  if (!lineUserId) {
    return NextResponse.json(
      { error: "ยืนยันตัวตน LINE ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
      { status: 401 }
    );
  }

  const normalizedCode = queueCode.trim().toUpperCase();

  const { data: match, error: queryError } = await supabaseAdmin
    .from("patients")
    .select("id, first_name, last_name")
    .eq("queue_code", normalizedCode)
    .maybeSingle();

  if (queryError) {
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }

  if (!match) {
    return NextResponse.json(
      { error: "ไม่พบ PID นี้ กรุณาตรวจสอบอีกครั้ง" },
      { status: 404 }
    );
  }

  const { error: upsertError } = await supabaseAdmin
    .from("line_links")
    .upsert(
      { patient_id: match.id, line_user_id: lineUserId },
      { onConflict: "patient_id" }
    );

  if (upsertError) {
    return NextResponse.json(
      { error: "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    childName: `${match.first_name} ${match.last_name}`,
  });
}
