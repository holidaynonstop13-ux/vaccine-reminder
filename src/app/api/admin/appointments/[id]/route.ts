import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const update: Record<string, string | number | null | { name: string; doseNumber: number | null }[]> = {};
  if (body.status !== undefined) update.status = body.status;
  if (body.receivedDate !== undefined) update.received_date = body.receivedDate;
  if (body.appointmentDate !== undefined) update.appointment_date = body.appointmentDate;
  if (body.vaccineName !== undefined) update.vaccine_name = body.vaccineName;
  if (body.doseNumber !== undefined) update.dose_number = body.doseNumber;
  if (body.vaccines !== undefined) {
    if (!Array.isArray(body.vaccines) || body.vaccines.length === 0) {
      return NextResponse.json({ error: "กรุณาเลือกวัคซีนอย่างน้อย 1 ตัว" }, { status: 400 });
    }
    if (body.vaccines.length > 5) {
      return NextResponse.json({ error: "เลือกวัคซีนได้สูงสุด 5 ตัวต่อนัด" }, { status: 400 });
    }
    update.vaccines = body.vaccines;
    update.vaccine_name = body.vaccines[0].name;
    update.dose_number = body.vaccines[0].doseNumber;
  }

  const { error } = await supabaseAdmin.from("appointments").update(update).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await supabaseAdmin.from("appointments").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
