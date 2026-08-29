import { supabaseAdmin } from "@/lib/supabase-admin";

async function sendLinePush(lineUserId: string, text: string) {
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: "text", text }],
    }),
  });
  return res.ok;
}

type PatientRef = { id: string; first_name: string; last_name: string };

export async function sendTodaysReminders() {
  const today = new Date().toISOString().slice(0, 10);
  const clinicName = process.env.CLINIC_NAME || "คลินิก";

  const { data: appointments, error: apptError } = await supabaseAdmin
    .from("appointments")
    .select("id, vaccine_name, patients(id, first_name, last_name)")
    .eq("appointment_date", today)
    .in("status", ["scheduled", "confirmed"]);

  if (apptError) throw new Error(apptError.message);
  if (!appointments || appointments.length === 0) {
    return { message: "ไม่มีนัดวันนี้", sent: 0, skippedNoLink: 0, failed: 0, total: 0 };
  }

  const patientIds = appointments
    .map((a) => (a.patients as unknown as PatientRef | null)?.id)
    .filter((id): id is string => Boolean(id));

  const { data: links, error: linkError } = await supabaseAdmin
    .from("line_links")
    .select("patient_id, line_user_id")
    .in("patient_id", patientIds);

  if (linkError) throw new Error(linkError.message);

  const linkByPatientId = new Map(
    (links ?? []).map((l) => [l.patient_id, l.line_user_id])
  );

  let sent = 0;
  let skippedNoLink = 0;
  let failed = 0;

  for (const appt of appointments) {
    const patient = appt.patients as unknown as PatientRef | null;
    if (!patient) continue;

    const lineUserId = linkByPatientId.get(patient.id);
    if (!lineUserId) {
      skippedNoLink++;
      continue;
    }

    const text = `📌 แจ้งเตือนนัดวัคซีน\n\nวันนี้เป็นวันนัดของน้อง${patient.first_name} ${patient.last_name}\nเพื่อรับวัคซีน: ${appt.vaccine_name}\nสถานที่: ${clinicName}\n\nกรุณาพาน้องมาตามนัดหมายค่ะ หากมีข้อสงสัยติดต่อคลินิกได้โดยตรง`;

    const ok = await sendLinePush(lineUserId, text);
    if (ok) {
      sent++;
      await supabaseAdmin.from("appointments").update({ status: "notified" }).eq("id", appt.id);
    } else {
      failed++;
    }
  }

  return { sent, skippedNoLink, failed, total: appointments.length };
}
