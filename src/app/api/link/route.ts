import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

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
  const { idToken, childFirstName, childLastName, guardianPhone } =
    await req.json();

  if (!idToken || !childFirstName || !childLastName || !guardianPhone) {
    return NextResponse.json(
      { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
      { status: 400 }
    );
  }

  const lineUserId = await verifyLineIdToken(idToken);
  if (!lineUserId) {
    return NextResponse.json(
      { error: "ยืนยันตัวตน LINE ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
      { status: 401 }
    );
  }

  const normalizedInputPhone = normalizePhone(guardianPhone);

  // Pull candidates by name, then compare normalized phone in code
  // (Postgres text match on formatted phone numbers is unreliable
  // if some numbers were saved with dashes/spaces and others weren't).
  const { data: candidates, error: queryError } = await supabaseAdmin
    .from("patients")
    .select("id, first_name, last_name, guardian_phone")
    .ilike("first_name", childFirstName.trim())
    .ilike("last_name", childLastName.trim());

  if (queryError) {
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }

  const match = candidates?.find(
    (p) => normalizePhone(p.guardian_phone) === normalizedInputPhone
  );

  if (!match) {
    return NextResponse.json(
      {
        error:
          "ไม่พบข้อมูลที่ตรงกัน กรุณาตรวจสอบชื่อ-นามสกุลเด็กและเบอร์โทรผู้ปกครองอีกครั้ง",
      },
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
