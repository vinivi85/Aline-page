"use client";

import { useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDualTime } from "@/lib/timezones";

type Match = { token: string; sessionName: string; startAt: string; clientName: string; status: string };

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmado",
  pending_payment: "Aguardando pagamento",
  cancelled: "Cancelado",
  completed: "Realizado",
  no_show: "Não compareceu",
};

export default function ConsultarPage() {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[] | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMatches(null);

    try {
      const res = await fetch("/api/bookings/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, date }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error ?? "Erro ao consultar.");
        return;
      }

      if (data.token) {
        window.location.href = `/agendar/gerenciar/${data.token}`;
        return;
      }

      setMatches(data.matches ?? []);
    } catch {
      setLoading(false);
      setError("Não foi possível conectar. Tente de novo.");
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16 sm:py-24">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-teal)] mb-6 hover:underline"
      >
        ← Voltar para a home
      </Link>

      <h1 className="font-display text-2xl mb-2 text-[var(--color-ink)]">Consultar agendamento</h1>
      <p className="text-sm text-[var(--color-ink-soft)] mb-8">
        Digite o nome completo e a data da sessão que você marcou pra ver os detalhes, remarcar ou
        solicitar cancelamento.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="text-sm text-[var(--color-ink)]">
          Nome completo usado no agendamento
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)]"
          />
        </label>

        <label className="text-sm text-[var(--color-ink)]">
          Data da sessão
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)]"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-lg bg-[var(--color-orange)] hover:bg-[var(--color-orange-dark)] transition-colors text-white text-sm font-semibold px-5 py-3 disabled:opacity-40"
        >
          {loading ? "Buscando..." : "Buscar agendamento"}
        </button>
      </form>

      {matches && matches.length > 0 && (
        <div className="mt-8">
          <p className="font-display text-lg text-[var(--color-ink)] mb-1">
            Bem-vindo(a), {matches[0].clientName?.split(" ")[0] ?? "de volta"}!
          </p>
          <p className="text-sm text-[var(--color-ink-soft)] mb-4">
            Encontramos mais de uma sessão nessa data — escolha a certa:
          </p>
          <div className="flex flex-col gap-2">
            {matches.map((m) => (
              <a
                key={m.token}
                href={`/agendar/gerenciar/${m.token}`}
                className="rounded-lg border border-[var(--color-border)] px-4 py-3 text-sm hover:border-[var(--color-teal)] transition-colors"
              >
                <p className="font-medium text-[var(--color-ink)]">{m.sessionName}</p>
                <p className="text-xs text-[var(--color-ink-soft)] capitalize">
                  {format(parseISO(m.startAt), "d 'de' MMMM", { locale: ptBR })} · {m.clientName}
                </p>
                <p className="text-xs text-[var(--color-ink-soft)]">
                  🇧🇷 {formatDualTime(m.startAt).br} · 🇺🇸 {formatDualTime(m.startAt).us}
                </p>
                <span className="inline-block mt-1 text-[10px] rounded-full bg-[var(--color-teal-light)] text-[var(--color-teal-dark)] px-2 py-0.5">
                  {STATUS_LABELS[m.status] ?? m.status}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
