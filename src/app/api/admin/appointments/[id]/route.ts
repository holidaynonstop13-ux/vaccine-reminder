import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const update: Record<string, string | null> = {};
  if (body.status !== undefined) update.status = body.status;
  if (body.receivedDate !== undefined) update.received_date = body.receivedDate;
  if (body.appointmentDate !== undefined) update.appointment_date = body.appointmentDate;
  if (body.vaccineName !== undefined) update.vaccine_name = body.vaccineName;

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
