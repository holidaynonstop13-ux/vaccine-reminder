import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const DEFAULTS: Record<string, string> = {
  clinic_name: "คลินิก",
  message_template:
    "📌 แจ้งเตือนนัดวัคซีน\n\nวันนี้เป็นวันนัดของน้อง{childName}\nเพื่อรับวัคซีน: {vaccineName}\nสถานที่: {clinicName}\n\nกรุณาพาน้องมาตามนัดหมายค่ะ หากมีข้อสงสัยติดต่อคลินิกได้โดยตรง",
  overdue_threshold_days: "3",
  auto_send_enabled: "true",
  vaccine_list: "BCG\nตับอักเสบบี\nคอตีบ-บาดทะยัก-ไอกรน (DTP)\nโปลิโอ (OPV)\nหัด-คางทูม-หัดเยอรมัน (MMR)\nไข้สมองอักเสบเจอี (JE)\nอีสุกอีใส\nไข้หวัดใหญ่",
};

export async function GET() {
  const { data } = await supabaseAdmin.from("settings").select("key, value");
  const map: Record<string, string> = { ...DEFAULTS };
  for (const row of data ?? []) {
    map[row.key] = row.value;
  }
  return NextResponse.json({ settings: map });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const allowedKeys = Object.keys(DEFAULTS);

  const rows = Object.entries(body)
    .filter(([key]) => allowedKeys.includes(key))
    .map(([key, value]) => ({ key, value: String(value) }));

  if (rows.length === 0) {
    return NextResponse.json({ error: "ไม่มีข้อมูลที่ถูกต้องให้บันทึก" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("settings").upsert(rows, { onConflict: "key" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
