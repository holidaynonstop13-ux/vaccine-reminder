import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret set yet — allow (dev convenience)
  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");
  return authHeader === `Bearer ${secret}` || querySecret === secret;
}

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

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Cron runs at 00:00 UTC = 07:00 Asia/Bangkok, so the UTC calendar
  // date at run time matches the intended Bangkok calendar date.
  const today = new Date().toISOString().slice(0, 10);
  const clinicName = process.env.CLINIC_NAME || "คลินิก";

  const { data: appointments, error: apptError } = await supabaseAdmin
    .from("appointments")
    .select("id, vaccine_name, patients(id, first_name, last_name)")
    .eq("appointment_date", today)
    .in("status", ["scheduled", "confirmed"]);

  if (apptError) {
    return NextResponse.json({ error: apptError.message }, { status: 500 });
  }
  if (!appointments || appointments.length === 0) {
    return NextResponse.json({ message: "ไม่มีนัดวันนี้", sent: 0 });
  }

  type PatientRef = { id: string; first_name: string; last_name: string };
  const patientIds = appointments
    .map((a) => (a.patients as unknown as PatientRef | null)?.id)
    .filter((id): id is string => Boolean(id));

  const { data: links, error: linkError } = await supabaseAdmin
    .from("line_links")
    .select("patient_id, line_user_id")
    .in("patient_id", patientIds);

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

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
      await supabaseAdmin
        .from("appointments")
        .update({ status: "notified" })
        .eq("id", appt.id);
    } else {
      failed++;
    }
  }

  return NextResponse.json({ sent, skippedNoLink, failed, total: appointments.length });
}
