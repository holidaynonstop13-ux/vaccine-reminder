import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type ImportRow = {
  pid: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  guardianName?: string;
  guardianPhone?: string;
};

function isValidDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s).getTime());
}

export async function POST(req: NextRequest) {
  const { rows } = (await req.json()) as { rows: ImportRow[] };

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "ไม่มีข้อมูลให้นำเข้า" }, { status: 400 });
  }

  const failed: { row: number; pid: string; reason: string }[] = [];
  let imported = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2; // +2 because row 1 is the header in the spreadsheet

    if (!r.pid || !r.firstName || !r.lastName || !r.dateOfBirth || !r.address) {
      failed.push({ row: rowNum, pid: r.pid ?? "-", reason: "ข้อมูลจำเป็นไม่ครบ (PID/ชื่อ/นามสกุล/วันเกิด/ที่อยู่)" });
      continue;
    }
    if (!isValidDate(r.dateOfBirth)) {
      failed.push({ row: rowNum, pid: r.pid, reason: "วันเกิดไม่ถูกต้อง (ต้องเป็น YYYY-MM-DD)" });
      continue;
    }

    const { error } = await supabaseAdmin.from("patients").insert({
      first_name: r.firstName,
      last_name: r.lastName,
      date_of_birth: r.dateOfBirth,
      address: r.address,
      guardian_name: r.guardianName || null,
      guardian_phone: r.guardianPhone || null,
      queue_code: r.pid.trim().toUpperCase(),
    });

    if (error) {
      const reason = error.message.includes("duplicate") ? `PID "${r.pid}" ซ้ำกับที่มีอยู่แล้ว` : error.message;
      failed.push({ row: rowNum, pid: r.pid, reason });
      continue;
    }

    imported++;
  }

  return NextResponse.json({ imported, failed, total: rows.length });
}
