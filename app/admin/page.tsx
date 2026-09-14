import { createServiceClient } from "@/lib/supabase/server";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function AdminDashboard() {
  const supabase = createServiceClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, session_types(name), clients(name, email)")
    .in("status", ["confirmed", "pending_payment"])
    .order("start_at", { ascending: true });

  return (
    <div>
      <h1 className="font-display text-2xl mb-6 text-[var(--color-ink)]">Próximos agendamentos</h1>
      <div className="flex flex-col gap-2">
        {(bookings ?? []).map((b: any) => (
          <div
            key={b.id}
            className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-[var(--color-ink)]">
                {b.session_types?.name} — {b.clients?.name}
              </p>
              <p className="text-xs text-[var(--color-ink-soft)]">
                {b.clients?.email} ·{" "}
                <span className="capitalize">
                  {format(parseISO(b.start_at), "d 'de' MMM, HH:mm", { locale: ptBR })}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              {b.status === "pending_payment" && (
                <span className="text-xs rounded-full bg-yellow-100 text-yellow-800 px-2 py-1">
                  Aguardando pagamento
                </span>
              )}
              {b.zoom_join_url && (
                <a
                  href={b.zoom_start_url ?? b.zoom_join_url}
                  target="_blank"
                  className="text-sm text-[var(--color-wine)]"
                >
                  Link Zoom
                </a>
              )}
            </div>
          </div>
        ))}
        {(bookings ?? []).length === 0 && (
          <p className="text-[var(--color-ink-soft)] text-sm">Nenhum agendamento no momento.</p>
        )}
      </div>
    </div>
  );
}
