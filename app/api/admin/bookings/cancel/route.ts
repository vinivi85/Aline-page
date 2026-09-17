import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { deleteZoomMeeting } from "@/lib/zoom";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { bookingId, reason } = await req.json();
  if (!bookingId) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }

  const note = reason
    ? `${booking.client_notes ?? ""}\n[Cancelado pelo admin: ${reason}]`.trim()
    : `${booking.client_notes ?? ""}\n[Cancelado pelo admin]`.trim();

  // Estorno no Stripe — o Stripe NÃO estorna automaticamente só porque
  // cancelamos no nosso banco, então chamamos a API de refund explicitamente.
  let refundStatus: "none" | "refunded" | "failed" = "none";
  let refundedAt: string | null = null;
  let refundError: string | null = null;

  if (booking.stripe_payment_intent_id) {
    try {
      await stripe.refunds.create({ payment_intent: booking.stripe_payment_intent_id });
      refundStatus = "refunded";
      refundedAt = new Date().toISOString();
    } catch (err) {
      console.error("Falha ao estornar no Stripe:", err);
      refundStatus = "failed";
      refundError = err instanceof Error ? err.message : "Erro desconhecido no estorno.";
    }
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      client_notes: note,
      refund_status: refundStatus,
      refunded_at: refundedAt,
    })
    .eq("id", bookingId);

  if (updateError) {
    return NextResponse.json({ error: "Erro ao cancelar." }, { status: 500 });
  }

  if (booking.zoom_meeting_id) {
    try {
      await deleteZoomMeeting(booking.zoom_meeting_id);
    } catch (err) {
      console.error("Falha ao excluir reunião Zoom:", err);
    }
  }

  return NextResponse.json({
    success: true,
    refundStatus,
    refundError,
  });
}
