import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const { patientId, appointmentDate, vaccineName } = await req.json();

  if (!patientId || !appointmentDate || !vaccineName) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("appointments").insert({
    patient_id: patientId,
    appointment_date: appointmentDate,
    vaccine_name: vaccineName,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
