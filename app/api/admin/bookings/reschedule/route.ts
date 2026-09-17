import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { updateZoomMeetingTime } from "@/lib/zoom";

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { bookingId, newStart, newEnd } = await req.json();
  if (!bookingId || !newStart || !newEnd) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, session_types(duration_minutes)")
    .eq("id", bookingId)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }

  const { data: conflicting } = await supabase
    .from("bookings")
    .select("id")
    .in("status", ["pending_payment", "confirmed"])
    .neq("id", bookingId)
    .eq("start_at", newStart);

  if (conflicting && conflicting.length > 0) {
    return NextResponse.json(
      { error: "Já existe outra sessão nesse horário." },
      { status: 409 }
    );
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      start_at: newStart,
      end_at: newEnd,
      rescheduled_count: (booking.rescheduled_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (updateError) {
    return NextResponse.json({ error: "Erro ao remarcar." }, { status: 500 });
  }

  if (booking.zoom_meeting_id) {
    try {
      const { data: settingsRow } = await supabase
        .from("booking_settings")
        .select("timezone")
        .eq("id", 1)
        .single();

      await updateZoomMeetingTime({
        meetingId: booking.zoom_meeting_id,
        startTimeISO: newStart,
        durationMinutes: booking.session_types?.duration_minutes ?? 50,
        timezone: settingsRow?.timezone ?? "America/Chicago",
      });
    } catch (err) {
      console.error("Falha ao atualizar horário no Zoom:", err);
    }
  }

  return NextResponse.json({ success: true });
}
