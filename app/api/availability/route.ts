import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { computeAvailableSlots } from "@/lib/availability";

export async function GET(req: NextRequest) {
  const sessionTypeId = req.nextUrl.searchParams.get("sessionTypeId");
  if (!sessionTypeId) {
    return NextResponse.json({ error: "sessionTypeId é obrigatório." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const [{ data: sessionType }, { data: rules }, { data: overrides }, { data: settingsRow }] =
    await Promise.all([
      supabase.from("session_types").select("*").eq("id", sessionTypeId).single(),
      supabase.from("availability_rules").select("*").eq("active", true),
      supabase.from("availability_overrides").select("*"),
      supabase.from("booking_settings").select("*").eq("id", 1).single(),
    ]);

  if (!sessionType) {
    return NextResponse.json({ error: "Tipo de sessão não encontrado." }, { status: 404 });
  }

  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("start_at, end_at")
    .in("status", ["pending_payment", "confirmed"]);

  const slots = computeAvailableSlots({
    rules: rules ?? [],
    overrides: (overrides ?? []).map((o: any) => ({ ...o, date: String(o.date) })),
    existingBookings: existingBookings ?? [],
    settings: settingsRow!,
    sessionDurationMinutes: sessionType.duration_minutes,
  });

  return NextResponse.json({
    sessionType,
    slots: slots.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString() })),
  });
}
