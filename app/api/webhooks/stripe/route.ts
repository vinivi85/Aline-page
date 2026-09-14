import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { createZoomMeeting } from "@/lib/zoom";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const checkoutSession = event.data.object as Stripe.Checkout.Session;
  const bookingId = checkoutSession.metadata?.booking_id;
  if (!bookingId) return NextResponse.json({ received: true });

  const supabase = createServiceClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, session_types(*), clients(*)")
    .eq("id", bookingId)
    .single();

  if (!booking || booking.status === "confirmed") {
    return NextResponse.json({ received: true }); // já processado ou não encontrado
  }

  const settings = await supabase
    .from("booking_settings")
    .select("timezone")
    .eq("id", 1)
    .single();

  try {
    const meeting = await createZoomMeeting({
      topic: `${booking.session_types.name} — ${booking.clients.name}`,
      startTimeISO: booking.start_at,
      durationMinutes: booking.session_types.duration_minutes,
      timezone: settings.data?.timezone ?? "America/Chicago",
      attendeeEmail: booking.clients.email,
    });

    await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        stripe_payment_intent_id: checkoutSession.payment_intent as string,
        amount_paid_cents: checkoutSession.amount_total,
        zoom_meeting_id: meeting.id,
        zoom_join_url: meeting.joinUrl,
        zoom_start_url: meeting.startUrl,
      })
      .eq("id", bookingId);

    // Envio de e-mail de confirmação fica a cargo do provedor escolhido
    // (Resend, Postmark, etc.) — ver app/api/webhooks/stripe/README dentro do repo.
  } catch (err) {
    console.error("Falha ao criar reunião Zoom:", err);
    // Mantém o pagamento confirmado mesmo se o Zoom falhar — cria a reunião
    // manualmente depois. Marca para revisão no admin.
    await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        stripe_payment_intent_id: checkoutSession.payment_intent as string,
        amount_paid_cents: checkoutSession.amount_total,
        client_notes: `${booking.client_notes ?? ""}\n[ATENÇÃO: falha ao criar Zoom automaticamente]`,
      })
      .eq("id", bookingId);
  }

  return NextResponse.json({ received: true });
}
