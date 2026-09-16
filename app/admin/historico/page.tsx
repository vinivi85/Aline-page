import { createServiceClient } from "@/lib/supabase/server";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Confirmado", className: "bg-[var(--color-teal-light)] text-[var(--color-teal-dark)]" },
  pending_payment: { label: "Aguardando pagamento", className: "bg-yellow-100 text-yellow-800" },
  cancelled: { label: "Cancelado", className: "bg-red-100 text-red-700" },
  completed: { label: "Realizado", className: "bg-[var(--color-teal-light)] text-[var(--color-teal-dark)]" },
  no_show: { label: "Não compareceu", className: "bg-gray-100 text-gray-600" },
};

export default async function HistoricoPage() {
  const supabase = createServiceClient();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, session_types(name), clients(name, email)")
    .order("start_at", { ascending: false })
    .limit(200);

  const all = bookings ?? [];

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl mb-1 text-[var(--color-ink)]">Histórico</h1>
      <p className="text-xs text-[var(--color-ink-soft)] mb-6">
        Todos os agendamentos já feitos, de qualquer status — inclusive cancelados e aguardando
        pagamento. Pra ver só os pagamentos confirmados, use a aba Financeiro.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[var(--color-ink-soft)] border-b border-[var(--color-border)]">
              <th className="py-2 pr-3">Data da sessão</th>
              <th className="py-2 pr-3">Cliente</th>
              <th className="py-2 pr-3">Sessão</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Zoom</th>
            </tr>
          </thead>
          <tbody>
            {all.map((b: any) => {
              const status = STATUS_LABELS[b.status] ?? { label: b.status, className: "bg-gray-100 text-gray-600" };
              return (
                <tr key={b.id} className="border-b border-[var(--color-border)]">
                  <td className="py-2 pr-3 text-[var(--color-ink)] capitalize whitespace-nowrap">
                    {format(parseISO(b.start_at), "d MMM yyyy, HH:mm", { locale: ptBR })}
                  </td>
                  <td className="py-2 pr-3 text-[var(--color-ink)]">
                    {b.clients?.name}
                    <div className="text-xs text-[var(--color-ink-soft)]">{b.clients?.email}</div>
                  </td>
                  <td className="py-2 pr-3 text-[var(--color-ink-soft)]">{b.session_types?.name}</td>
                  <td className="py-2 pr-3">
                    <span className={`text-xs rounded-full px-2 py-1 ${status.className}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    {b.zoom_join_url ? (
                      <a
                        href={b.zoom_start_url ?? b.zoom_join_url}
                        target="_blank"
                        className="text-[var(--color-teal)] text-xs"
                      >
                        Abrir
                      </a>
                    ) : (
                      <span className="text-xs text-[var(--color-ink-soft)]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {all.length === 0 && (
          <p className="text-sm text-[var(--color-ink-soft)] mt-4">Nenhum agendamento ainda.</p>
        )}
      </div>
    </div>
  );
}
