import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { bookingId } = await req.json();
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

  if (!booking.stripe_payment_intent_id) {
    return NextResponse.json(
      { error: "Esse agendamento não tem um pagamento associado no Stripe." },
      { status: 400 }
    );
  }

  if (booking.refund_status === "refunded") {
    return NextResponse.json({ error: "Já foi estornado." }, { status: 400 });
  }

  try {
    await stripe.refunds.create({ payment_intent: booking.stripe_payment_intent_id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido.";
    return NextResponse.json({ error: `Falha ao estornar no Stripe: ${message}` }, { status: 500 });
  }

  await supabase
    .from("bookings")
    .update({ refund_status: "refunded", refunded_at: new Date().toISOString() })
    .eq("id", bookingId);

  return NextResponse.json({ success: true });
}
