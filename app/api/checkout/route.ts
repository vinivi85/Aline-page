import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { getUsdToBrlRate, usdCentsToBrlCents } from "@/lib/exchangeRate";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionTypeId, startAt, endAt, name, email, paymentMethod, notes } = body as {
    sessionTypeId: string;
    startAt: string;
    endAt: string;
    name: string;
    email: string;
    paymentMethod: "card" | "pix";
    notes?: string;
  };

  if (!sessionTypeId || !startAt || !endAt || !name || !email || !paymentMethod) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: sessionType, error: stError } = await supabase
    .from("session_types")
    .select("*")
    .eq("id", sessionTypeId)
    .eq("active", true)
    .single();

  if (stError || !sessionType) {
    return NextResponse.json({ error: "Tipo de sessão inválido." }, { status: 400 });
  }

  // upsert do cliente
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .upsert({ name, email }, { onConflict: "email" })
    .select()
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: "Erro ao registrar cliente." }, { status: 500 });
  }

  // cria a reserva como pending_payment — isso já "segura" o horário
  // (o índice único no banco impede double-booking do mesmo slot)
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      session_type_id: sessionType.id,
      client_id: client.id,
      start_at: startAt,
      end_at: endAt,
      status: "pending_payment",
      client_notes: notes ?? null,
      payment_method: paymentMethod,
    })
    .select()
    .single();

  if (bookingError || !booking) {
    return NextResponse.json(
      { error: "Esse horário acabou de ser reservado por outra pessoa. Escolha outro." },
      { status: 409 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;

  let currency = "usd";
  let amount = sessionType.price_cents;

  if (paymentMethod === "pix") {
    const rate = await getUsdToBrlRate();
    currency = "brl";
    amount = usdCentsToBrlCents(sessionType.price_cents, rate);
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: [paymentMethod],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: amount,
            product_data: {
              name: sessionType.name,
              description: sessionType.description ?? undefined,
            },
          },
          quantity: 1,
        },
      ],
      metadata: { booking_id: booking.id },
      success_url: `${baseUrl}/agendar/confirmado?booking=${booking.id}`,
      cancel_url: `${baseUrl}/agendar/cancelado?booking=${booking.id}`,
    });

    await supabase
      .from("bookings")
      .update({ stripe_checkout_session_id: checkoutSession.id })
      .eq("id", booking.id);

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    // libera o horário se o Stripe falhar
    await supabase.from("bookings").delete().eq("id", booking.id);
    const message = err instanceof Error ? err.message : "Erro desconhecido.";
    return NextResponse.json(
      { error: `Erro ao iniciar pagamento: ${message}` },
      { status: 500 }
    );
  }
}
