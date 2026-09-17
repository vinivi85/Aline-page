import { createServiceClient } from "@/lib/supabase/server";
import { format, parseISO, startOfMonth, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatAmount(cents: number | null, paymentMethod: string | null) {
  if (cents == null) return "—";
  const value = (cents / 100).toFixed(2);
  return paymentMethod === "pix" ? `R$ ${value}` : `$ ${value}`;
}

const PAYMENT_STATUS: Record<string, { label: string; className: string }> = {
  paid: { label: "Pago", className: "bg-[var(--color-teal-light)] text-[var(--color-teal-dark)]" },
  refunded: { label: "Estornado", className: "bg-gray-200 text-gray-700" },
  refund_failed: { label: "Falha no estorno", className: "bg-red-100 text-red-700" },
};

export default async function FinanceiroPage() {
  const supabase = createServiceClient();

  // Traz todo booking que teve pagamento de verdade, independente do status
  // atual — assim um cancelamento com estorno continua aparecendo aqui,
  // só que marcado como "Estornado" em vez de sumir da lista.
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, session_types(name), clients(name, email)")
    .not("amount_paid_cents", "is", null)
    .order("start_at", { ascending: false });

  const paid = bookings ?? [];
  // Só entra nos totais quem não foi estornado — dinheiro que ainda está com a Aline
  const active = paid.filter((b: any) => b.refund_status !== "refunded");

  const monthStart = startOfMonth(new Date());
  const thisMonth = active.filter((b: any) => isAfter(parseISO(b.created_at), monthStart));

  const totalUsdCents = active
    .filter((b: any) => b.payment_method !== "pix")
    .reduce((sum: number, b: any) => sum + (b.amount_paid_cents ?? 0), 0);
  const totalBrlCents = active
    .filter((b: any) => b.payment_method === "pix")
    .reduce((sum: number, b: any) => sum + (b.amount_paid_cents ?? 0), 0);

  const monthUsdCents = thisMonth
    .filter((b: any) => b.payment_method !== "pix")
    .reduce((sum: number, b: any) => sum + (b.amount_paid_cents ?? 0), 0);
  const monthBrlCents = thisMonth
    .filter((b: any) => b.payment_method === "pix")
    .reduce((sum: number, b: any) => sum + (b.amount_paid_cents ?? 0), 0);

  const cardCount = active.filter((b: any) => b.payment_method !== "pix").length;
  const pixCount = active.filter((b: any) => b.payment_method === "pix").length;
  const refundedCount = paid.filter((b: any) => b.refund_status === "refunded").length;

  function paymentStatusFor(b: any) {
    if (b.refund_status === "refunded") return PAYMENT_STATUS.refunded;
    if (b.refund_status === "failed") return PAYMENT_STATUS.refund_failed;
    return PAYMENT_STATUS.paid;
  }

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl mb-6 text-[var(--color-ink)]">Financeiro</h1>

      {/* Resumo — só considera pagamentos ainda não estornados */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
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
      {refundedCount > 0 && (
        <p className="text-xs text-[var(--color-ink-soft)] mb-8">
          {refundedCount} pagamento{refundedCount > 1 ? "s" : ""} estornado{refundedCount > 1 ? "s" : ""}{" "}
          (não entram nos totais acima).
        </p>
      )}

      {/* Lista de pagamentos */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[var(--color-ink-soft)] border-b border-[var(--color-border)]">
              <th className="py-2 pr-3">Data da sessão</th>
              <th className="py-2 pr-3">Cliente</th>
              <th className="py-2 pr-3">Sessão</th>
              <th className="py-2 pr-3">Pagamento</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {paid.map((b: any) => {
              const paymentStatus = paymentStatusFor(b);
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
                  <td className="py-2 pr-3">
                    <span className={`text-xs rounded-full px-2 py-1 ${paymentStatus.className}`}>
                      {paymentStatus.label}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-[var(--color-ink)] font-medium whitespace-nowrap">
                    {formatAmount(b.amount_paid_cents, b.payment_method)}
                  </td>
                </tr>
              );
            })}
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
