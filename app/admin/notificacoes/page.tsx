import { createServiceClient } from "@/lib/supabase/server";
import { approveCancellation, rejectCancellation } from "../actions";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function NotificacoesPage() {
  const supabase = createServiceClient();

  const { data: requests } = await supabase
    .from("cancellation_requests")
    .select("*, bookings(id, start_at, session_types(name), clients(name, email))")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const pending = requests ?? [];

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl mb-1 text-[var(--color-ink)]">Notificações</h1>
      <p className="text-xs text-[var(--color-ink-soft)] mb-6">
        Solicitações de cancelamento aguardando sua aprovação.
      </p>

      <div className="flex flex-col gap-3">
        {pending.map((r: any) => (
          <div
            key={r.id}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <p className="text-sm font-medium text-[var(--color-ink)] mb-1">
              {r.bookings?.session_types?.name} — {r.bookings?.clients?.name}
            </p>
            <p className="text-xs text-[var(--color-ink-soft)] mb-2 capitalize">
              Sessão marcada para{" "}
              {format(parseISO(r.bookings.start_at), "d 'de' MMMM, HH:mm", { locale: ptBR })} ·{" "}
              {r.bookings?.clients?.email}
            </p>
            <p className="text-sm text-[var(--color-ink)] bg-[var(--color-cream)] border border-[var(--color-border)] rounded-lg px-3 py-2 mb-3">
              "{r.reason}"
            </p>
            <div className="flex gap-2">
              <form
                action={async () => {
                  "use server";
                  await approveCancellation(r.id, r.booking_id);
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-white text-xs font-semibold px-4 py-2"
                >
                  Aprovar cancelamento
                </button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await rejectCancellation(r.id);
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-[var(--color-border)] text-[var(--color-ink)] text-xs font-semibold px-4 py-2 hover:border-[var(--color-teal)]"
                >
                  Recusar (manter sessão)
                </button>
              </form>
            </div>
          </div>
        ))}

        {pending.length === 0 && (
          <p className="text-sm text-[var(--color-ink-soft)]">Nenhuma solicitação pendente.</p>
        )}
      </div>
    </div>
  );
}
