import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Appt = {
  id: string;
  patient_id: string;
  appointment_date: string;
  vaccine_name: string;
  status: string;
  received_date: string | null;
};

function daysBetween(earlier: string, later: string) {
  const a = new Date(earlier + "T00:00:00Z").getTime();
  const b = new Date(later + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86400000);
}

function computeBadge(
  appointments: Appt[],
  overdueThresholdDays: number
): "urgent" | "warning" | "normal" {
  const today = new Date().toISOString().slice(0, 10);
  const active = appointments.filter((a) => a.status !== "completed");
  const overdue = active.filter((a) => a.appointment_date < today);

  if (overdue.length === 0) return "normal";

  const maxDaysOverdue = Math.max(...overdue.map((a) => daysBetween(a.appointment_date, today)));
  if (maxDaysOverdue <= overdueThresholdDays) return "warning";
  return "urgent";
}

export async function GET() {
  const { data: patients, error: patientsError } = await supabaseAdmin
    .from("patients")
    .select("id, first_name, last_name, guardian_name, guardian_phone, queue_code, date_of_birth, address, created_at")
    .order("created_at", { ascending: false });

  if (patientsError) {
    return NextResponse.json({ error: patientsError.message }, { status: 500 });
  }

  const { data: appointments } = await supabaseAdmin
    .from("appointments")
    .select("id, patient_id, appointment_date, vaccine_name, status, received_date")
    .order("appointment_date", { ascending: true });

  const { data: links } = await supabaseAdmin.from("line_links").select("patient_id");
  const linkedPatientIds = new Set((links ?? []).map((l) => l.patient_id));

  const { data: thresholdSetting } = await supabaseAdmin
    .from("settings")
    .select("value")
    .eq("key", "overdue_threshold_days")
    .maybeSingle();
  const overdueThresholdDays = parseInt(thresholdSetting?.value ?? "3", 10) || 3;

  const result = (patients ?? []).map((p) => {
    const patientAppointments = (appointments ?? []).filter((a) => a.patient_id === p.id);
    return {
      ...p,
      linked: linkedPatientIds.has(p.id),
      appointments: patientAppointments,
      badge: computeBadge(patientAppointments, overdueThresholdDays),
    };
  });

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
    queueCode,
    address,
    appointmentDate,
    vaccineName,
  } = body;

  if (!firstName || !lastName || !dateOfBirth || !guardianName || !guardianPhone || !queueCode) {
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
      queue_code: queueCode.trim().toUpperCase(),
      address: address || null,
    })
    .select("id")
    .single();

  if (patientError) {
    const message = patientError.message.includes("duplicate")
      ? "PID นี้ถูกใช้ไปแล้ว กรุณาใช้ PID อื่น"
      : patientError.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Appointment is optional at creation time — staff can add it later
  // once the child is already in the system.
  if (appointmentDate && vaccineName) {
    const { error: apptError } = await supabaseAdmin.from("appointments").insert({
      patient_id: patient.id,
      appointment_date: appointmentDate,
      vaccine_name: vaccineName,
    });
    if (apptError) {
      return NextResponse.json({ error: apptError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
