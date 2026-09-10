import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type VaccineEntry = { name: string; doseNumber: number | null };

export async function POST(req: NextRequest) {
  const { patientId, appointmentDate, vaccines } = (await req.json()) as {
    patientId: string;
    appointmentDate: string;
    vaccines: VaccineEntry[];
  };

  if (!patientId || !appointmentDate || !Array.isArray(vaccines) || vaccines.length === 0) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }
  if (vaccines.length > 5) {
    return NextResponse.json({ error: "เลือกวัคซีนได้สูงสุด 5 ตัวต่อนัด" }, { status: 400 });
  }
  if (vaccines.some((v) => !v.name)) {
    return NextResponse.json({ error: "กรุณาเลือกชื่อวัคซีนให้ครบทุกช่อง" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("appointments").insert({
    patient_id: patientId,
    appointment_date: appointmentDate,
    vaccines,
    // kept in sync for any legacy code paths still reading the single columns
    vaccine_name: vaccines[0].name,
    dose_number: vaccines[0].doseNumber,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
