import { NextResponse } from "next/server";
import { sendTodaysReminders } from "@/lib/notify";

export async function POST() {
  try {
    const result = await sendTodaysReminders();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
