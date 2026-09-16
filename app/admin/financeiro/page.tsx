import { createServiceClient } from "@/lib/supabase/server";
import { format, parseISO, startOfMonth, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatAmount(cents: number | null, paymentMethod: string | null) {
  if (cents == null) return "—";
  const value = (cents / 100).toFixed(2);
  return paymentMethod === "pix" ? `R$ ${value}` : `$ ${value}`;
}

export default async function FinanceiroPage() {
  const supabase = createServiceClient();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, session_types(name), clients(name, email)")
    .eq("status", "confirmed")
    .order("start_at", { ascending: false });

  const paid = bookings ?? [];

  const monthStart = startOfMonth(new Date());
  const thisMonth = paid.filter((b: any) => isAfter(parseISO(b.created_at), monthStart));

  const totalUsdCents = paid
    .filter((b: any) => b.payment_method !== "pix")
    .reduce((sum: number, b: any) => sum + (b.amount_paid_cents ?? 0), 0);
  const totalBrlCents = paid
    .filter((b: any) => b.payment_method === "pix")
    .reduce((sum: number, b: any) => sum + (b.amount_paid_cents ?? 0), 0);

  const monthUsdCents = thisMonth
    .filter((b: any) => b.payment_method !== "pix")
    .reduce((sum: number, b: any) => sum + (b.amount_paid_cents ?? 0), 0);
  const monthBrlCents = thisMonth
    .filter((b: any) => b.payment_method === "pix")
    .reduce((sum: number, b: any) => sum + (b.amount_paid_cents ?? 0), 0);

  const cardCount = paid.filter((b: any) => b.payment_method !== "pix").length;
  const pixCount = paid.filter((b: any) => b.payment_method === "pix").length;

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl mb-6 text-[var(--color-ink)]">Financeiro</h1>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-xs text-[var(--color-ink-soft)] mb-1">Este mês (cartão)</p>
          <p className="font-display text-xl text-[var(--color-ink)]">
            $ {(monthUsdCents / 100).toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-xs text-[var(--color-ink-soft)] mb-1">Este mês (Pix)</p>
          <p className="font-display text-xl text-[var(--color-ink)]">
            R$ {(monthBrlCents / 100).toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-xs text-[var(--color-ink-soft)] mb-1">Total (cartão)</p>
          <p className="font-display text-xl text-[var(--color-ink)]">
            $ {(totalUsdCents / 100).toFixed(2)}
          </p>
          <p className="text-xs text-[var(--color-ink-soft)] mt-1">{cardCount} pagamentos</p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-xs text-[var(--color-ink-soft)] mb-1">Total (Pix)</p>
          <p className="font-display text-xl text-[var(--color-ink)]">
            R$ {(totalBrlCents / 100).toFixed(2)}
          </p>
          <p className="text-xs text-[var(--color-ink-soft)] mt-1">{pixCount} pagamentos</p>
        </div>
      </div>

      {/* Lista de pagamentos */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[var(--color-ink-soft)] border-b border-[var(--color-border)]">
              <th className="py-2 pr-3">Data da sessão</th>
              <th className="py-2 pr-3">Cliente</th>
              <th className="py-2 pr-3">Sessão</th>
              <th className="py-2 pr-3">Pagamento</th>
              <th className="py-2 pr-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {paid.map((b: any) => (
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
                  <span
                    className={`text-xs rounded-full px-2 py-1 ${
                      b.payment_method === "pix"
                        ? "bg-[var(--color-teal-light)] text-[var(--color-teal-dark)]"
                        : "bg-[var(--color-orange)]/15 text-[var(--color-orange-dark)]"
                    }`}
                  >
                    {b.payment_method === "pix" ? "Pix" : "Cartão"}
                  </span>
                </td>
                <td className="py-2 pr-3 text-[var(--color-ink)] font-medium whitespace-nowrap">
                  {formatAmount(b.amount_paid_cents, b.payment_method)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paid.length === 0 && (
          <p className="text-sm text-[var(--color-ink-soft)] mt-4">
            Nenhum pagamento confirmado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
