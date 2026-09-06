import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSettings, fillTemplate, sendLinePush } from "@/lib/notify";

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

  const settings = await getSettings();
  const text = fillTemplate(settings.messageTemplate, {
    childName: `${patient.first_name} ${patient.last_name}`,
    vaccineName: appt.vaccine_name,
    appointmentDate: appt.appointment_date,
    clinicName: settings.clinicName,
  });

  const ok = await sendLinePush(link.line_user_id, text);

  if (!ok) {
    return NextResponse.json({ error: "ส่งข้อความไม่สำเร็จ" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
