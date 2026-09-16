import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { updateZoomMeetingTime } from "@/lib/zoom";
import { differenceInHours, parseISO } from "date-fns";

const MIN_HOURS_TO_RESCHEDULE = 24;

export async function POST(req: NextRequest) {
  const { token, newStart, newEnd } = await req.json();

  if (!token || !newStart || !newEnd) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, session_types(duration_minutes, name)")
    .eq("manage_token", token)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }

  if (booking.status !== "confirmed") {
    return NextResponse.json(
      { error: "Esse agendamento não pode ser remarcado." },
      { status: 400 }
    );
  }

  const hoursUntilSession = differenceInHours(parseISO(booking.start_at), new Date());
  if (hoursUntilSession < MIN_HOURS_TO_RESCHEDULE) {
    return NextResponse.json(
      {
        error: `Só é possível remarcar com pelo menos ${MIN_HOURS_TO_RESCHEDULE}h de antecedência. Entre em contato diretamente pra ajustar.`,
      },
      { status: 400 }
    );
  }

  // confere se o novo horário ainda está livre (outro cliente pode ter reservado
  // enquanto essa pessoa escolhia)
  const { data: conflicting } = await supabase
    .from("bookings")
    .select("id")
    .in("status", ["pending_payment", "confirmed"])
    .neq("id", booking.id)
    .eq("start_at", newStart);

  if (conflicting && conflicting.length > 0) {
    return NextResponse.json(
      { error: "Esse horário acabou de ser reservado por outra pessoa. Escolha outro." },
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
    .eq("id", booking.id);

  if (updateError) {
    return NextResponse.json({ error: "Erro ao remarcar. Tente novamente." }, { status: 500 });
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
      // segue mesmo assim — a reserva já foi remarcada no banco
    }
  }

  return NextResponse.json({ success: true });
}
