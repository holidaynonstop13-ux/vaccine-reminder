import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const DEFAULT_TEMPLATE =
  "📌 ติดตามนัดวัคซีน\n\nน้อง{childName}\nนัดวันที่: {appointmentDate}\nวัคซีน: {vaccineName}\nสถานที่: {clinicName}\n\nกรุณาพาน้องมารับวัคซีนโดยเร็วค่ะ หากมีข้อสงสัยติดต่อคลินิกได้โดยตรง";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: appt, error: apptError } = await supabaseAdmin
    .from("appointments")
    .select("id, appointment_date, vaccine_name, patients(id, first_name, last_name)")
    .eq("id", id)
    .maybeSingle();

  if (apptError || !appt) {
    return NextResponse.json({ error: "ไม่พบนัดหมายนี้" }, { status: 404 });
  }

  type PatientRef = { id: string; first_name: string; last_name: string };
  const patient = appt.patients as unknown as PatientRef | null;
  if (!patient) {
    return NextResponse.json({ error: "ไม่พบข้อมูลเด็ก" }, { status: 404 });
  }

  const { data: link } = await supabaseAdmin
    .from("line_links")
    .select("line_user_id")
    .eq("patient_id", patient.id)
    .maybeSingle();

  if (!link) {
    return NextResponse.json({ error: "เด็กคนนี้ยังไม่ได้ผูกบัญชี LINE" }, { status: 400 });
  }

  const { data: settingsRows } = await supabaseAdmin
    .from("settings")
    .select("key, value")
    .in("key", ["clinic_name"]);
  const clinicName =
    (settingsRows ?? []).find((s) => s.key === "clinic_name")?.value ||
    process.env.CLINIC_NAME ||
    "คลินิก";

  const text = DEFAULT_TEMPLATE.replaceAll("{childName}", `${patient.first_name} ${patient.last_name}`)
    .replaceAll("{appointmentDate}", appt.appointment_date)
    .replaceAll("{vaccineName}", appt.vaccine_name)
    .replaceAll("{clinicName}", clinicName);

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: link.line_user_id,
      messages: [{ type: "text", text }],
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "ส่งข้อความไม่สำเร็จ" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
