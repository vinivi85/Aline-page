import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { differenceInHours, parseISO } from "date-fns";

const MIN_HOURS_TO_CANCEL = 48;

export async function POST(req: NextRequest) {
  const { token, reason } = await req.json();

  if (!token || !reason || !reason.trim()) {
    return NextResponse.json(
      { error: "Conta pra gente o motivo do cancelamento." },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("manage_token", token)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }

  if (booking.status !== "confirmed") {
    return NextResponse.json(
      { error: "Esse agendamento não pode ser cancelado." },
      { status: 400 }
    );
  }

  const hoursUntilSession = differenceInHours(parseISO(booking.start_at), new Date());
  if (hoursUntilSession < MIN_HOURS_TO_CANCEL) {
    return NextResponse.json(
      {
        error: `Cancelamentos precisam ser solicitados com pelo menos ${MIN_HOURS_TO_CANCEL}h de antecedência. Entre em contato diretamente pra resolver.`,
      },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("cancellation_requests")
    .select("id")
    .eq("booking_id", booking.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Você já tem uma solicitação de cancelamento pendente pra essa sessão." },
      { status: 400 }
    );
  }

  const { error: insertError } = await supabase.from("cancellation_requests").insert({
    booking_id: booking.id,
    reason: reason.trim(),
  });

  if (insertError) {
    return NextResponse.json(
      { error: "Erro ao registrar a solicitação. Tente novamente." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
