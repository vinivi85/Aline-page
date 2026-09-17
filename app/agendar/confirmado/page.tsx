import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDualTime } from "@/lib/timezones";

function googleCalendarUrl(booking: any) {
  const toGoogleDate = (iso: string) => iso.replace(/[-:]/g, "").split(".")[0] + "Z";
  const title = encodeURIComponent(`${booking.session_types?.name ?? "Sessão"} — Aline Vicente Consultoria`);
  const details = encodeURIComponent(
    booking.zoom_join_url
      ? `Link do Zoom: ${booking.zoom_join_url}`
      : "O link do Zoom foi enviado por e-mail."
  );
  const dates = `${toGoogleDate(booking.start_at)}/${toGoogleDate(booking.end_at)}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
}

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
          <p className="text-[var(--color-ink-soft)] mb-2">
            Sua sessão de <strong>{booking.session_types?.name}</strong> está marcada para{" "}
            <strong className="capitalize">
              {format(parseISO(booking.start_at), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </strong>
            .
          </p>
          <p className="text-sm text-[var(--color-ink-soft)] mb-1">
            🇧🇷 {formatDualTime(booking.start_at).br} (Brasília)
          </p>
          <p className="text-sm text-[var(--color-ink-soft)] mb-6">
            🇺🇸 {formatDualTime(booking.start_at).us} (Texas)
          </p>
          <p className="text-sm text-[var(--color-ink-soft)] mb-8">
            Enviamos o link do Zoom para o seu e-mail. Se ele não aparecer em alguns minutos,
            confira também a caixa de spam.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <a
              href={googleCalendarUrl(booking)}
              className="rounded-lg border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] hover:border-[var(--color-teal)] transition-colors"
            >
              Adicionar ao Google Calendar
            </a>
            <a
              href={`/api/bookings/${booking.id}/ics`}
              className="rounded-lg border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] hover:border-[var(--color-teal)] transition-colors"
            >
              Adicionar ao Apple/Outlook (.ics)
            </a>
          </div>

          <p className="text-xs text-[var(--color-ink-soft)] mb-8">
            Precisa remarcar ou cancelar depois?{" "}
            <a href={`/agendar/gerenciar/${booking.manage_token}`} className="text-[var(--color-teal)] underline">
              Guarde este link
            </a>{" "}
            pra gerenciar sua sessão (também vai no e-mail de confirmação).
          </p>
        </>
      ) : (
        <p className="text-[var(--color-ink-soft)] mb-8">
          Pagamento confirmado. Você receberá os detalhes por e-mail em instantes.
        </p>
      )}

      <Link
        href="/"
        className="inline-block mt-4 rounded-lg bg-[var(--color-orange)] hover:bg-[var(--color-orange-dark)] transition-colors px-6 py-3 text-white text-sm font-semibold"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
