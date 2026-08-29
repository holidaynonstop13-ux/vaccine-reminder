import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { data: patients, error: patientsError } = await supabaseAdmin
    .from("patients")
    .select("id, first_name, last_name, guardian_name, guardian_phone, created_at")
    .order("created_at", { ascending: false });

  if (patientsError) {
    return NextResponse.json({ error: patientsError.message }, { status: 500 });
  }

  const { data: appointments } = await supabaseAdmin
    .from("appointments")
    .select("id, patient_id, appointment_date, vaccine_name, status")
    .order("appointment_date", { ascending: true });

  const { data: links } = await supabaseAdmin
    .from("line_links")
    .select("patient_id");

  const linkedPatientIds = new Set((links ?? []).map((l) => l.patient_id));

  const result = (patients ?? []).map((p) => ({
    ...p,
    linked: linkedPatientIds.has(p.id),
    appointments: (appointments ?? []).filter((a) => a.patient_id === p.id),
  }));

  return NextResponse.json({ patients: result });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    firstName,
    lastName,
    dateOfBirth,
    guardianName,
    guardianPhone,
    appointmentDate,
    vaccineName,
  } = body;

  if (
    !firstName ||
    !lastName ||
    !dateOfBirth ||
    !guardianName ||
    !guardianPhone ||
    !appointmentDate ||
    !vaccineName
  ) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }

  const { data: patient, error: patientError } = await supabaseAdmin
    .from("patients")
    .insert({
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      guardian_name: guardianName,
      guardian_phone: guardianPhone,
    })
    .select("id")
    .single();

  if (patientError) {
    return NextResponse.json({ error: patientError.message }, { status: 500 });
  }

  const { error: apptError } = await supabaseAdmin.from("appointments").insert({
    patient_id: patient.id,
    appointment_date: appointmentDate,
    vaccine_name: vaccineName,
  });

  if (apptError) {
    return NextResponse.json({ error: apptError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
