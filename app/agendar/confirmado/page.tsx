import { createServiceClient } from "@/lib/supabase/server";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function ConfirmadoPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string }>;
}) {
  const { booking: bookingId } = await searchParams;
  const supabase = createServiceClient();

  const { data: booking } = bookingId
    ? await supabase
        .from("bookings")
        .select("*, session_types(name, duration_minutes)")
        .eq("id", bookingId)
        .single()
    : { data: null };

  return (
    <main className="mx-auto max-w-lg px-6 py-24 text-center">
      <p className="text-4xl mb-4">✓</p>
      <h1 className="font-display text-3xl mb-3 text-[var(--color-ink)]">Sessão confirmada!</h1>

      {booking ? (
        <>
          <p className="text-[var(--color-ink-soft)] mb-6">
            Sua sessão de <strong>{booking.session_types?.name}</strong> está marcada para{" "}
            <strong className="capitalize">
              {format(parseISO(booking.start_at), "EEEE, d 'de' MMMM 'às' HH:mm", {
                locale: ptBR,
              })}
            </strong>
            .
          </p>
          <p className="text-sm text-[var(--color-ink-soft)]">
            Enviamos o link do Zoom para o seu e-mail. Se ele não aparecer em alguns minutos,
            confira também a caixa de spam.
          </p>
        </>
      ) : (
        <p className="text-[var(--color-ink-soft)]">
          Pagamento confirmado. Você receberá os detalhes por e-mail em instantes.
        </p>
      )}
    </main>
  );
}
