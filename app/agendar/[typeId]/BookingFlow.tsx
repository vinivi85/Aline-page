"use client";

import { useEffect, useMemo, useState } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type SessionType = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  currency: string;
};

type Slot = { start: string; end: string };

export default function BookingFlow({ sessionType }: { sessionType: SessionType }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [step, setStep] = useState<"calendar" | "form">("calendar");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "pix">("card");

  useEffect(() => {
    fetch(`/api/availability?sessionTypeId=${sessionType.id}`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots ?? []))
      .finally(() => setLoading(false));
  }, [sessionType.id]);

  const daysWithSlots = useMemo(() => {
    const map = new Map<string, Date>();
    for (const s of slots) {
      const d = parseISO(s.start);
      map.set(format(d, "yyyy-MM-dd"), d);
    }
    return Array.from(map.values()).sort((a, b) => a.getTime() - b.getTime());
  }, [slots]);

  const timesForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return slots.filter((s) => isSameDay(parseISO(s.start), selectedDay));
  }, [slots, selectedDay]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionTypeId: sessionType.id,
          startAt: selectedSlot.start,
          endAt: selectedSlot.end,
          name,
          email,
          notes,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Algo deu errado. Tente novamente.");
        setSubmitting(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Não foi possível conectar. Verifique sua internet e tente de novo.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:py-20">
      <div className="grid gap-10 sm:grid-cols-[280px_1fr]">
        {/* Painel esquerdo: detalhes da sessão */}
        <div className="border-b sm:border-b-0 sm:border-r border-[var(--color-border)] pb-8 sm:pb-0 sm:pr-8">
          <p className="text-sm text-[var(--color-wine)] mb-2">Aline Vicente</p>
          <h1 className="font-display text-2xl mb-3 text-[var(--color-ink)]">{sessionType.name}</h1>
          {sessionType.description && (
            <p className="text-[var(--color-ink-soft)] text-sm mb-4">{sessionType.description}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-[var(--color-ink-soft)] mb-2">
            <span>⏱</span> {sessionType.duration_minutes} minutos
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--color-ink-soft)] mb-2">
            <span>💳</span> ${(sessionType.price_cents / 100).toFixed(2)} USD
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--color-ink-soft)]">
            <span>🎥</span> Link do Zoom enviado após a confirmação
          </div>

          {selectedSlot && (
            <div className="mt-6 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
              <p className="text-sm font-medium text-[var(--color-ink)]">Horário selecionado</p>
              <p className="text-sm text-[var(--color-ink-soft)] capitalize">
                {format(parseISO(selectedSlot.start), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
              <p className="text-sm text-[var(--color-ink-soft)]">
                {format(parseISO(selectedSlot.start), "HH:mm")} –{" "}
                {format(parseISO(selectedSlot.end), "HH:mm")}
              </p>
            </div>
          )}
        </div>

        {/* Painel direito: calendário/horários ou formulário */}
        <div>
          {loading && <p className="text-[var(--color-ink-soft)]">Carregando horários...</p>}

          {!loading && step === "calendar" && (
            <div>
              <h2 className="font-display text-lg mb-4 text-[var(--color-ink)]">
                Selecione uma data
              </h2>
              {daysWithSlots.length === 0 ? (
                <p className="text-[var(--color-ink-soft)]">
                  Sem horários disponíveis no momento. Volte em breve.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 mb-8">
                  {daysWithSlots.map((d) => {
                    const isSelected = selectedDay && isSameDay(d, selectedDay);
                    return (
                      <button
                        key={d.toISOString()}
                        onClick={() => {
                          setSelectedDay(d);
                          setSelectedSlot(null);
                        }}
                        className={`rounded-lg border px-4 py-3 text-sm text-left min-w-[92px] transition-colors ${
                          isSelected
                            ? "border-[var(--color-wine)] bg-[var(--color-wine)] text-white"
                            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-wine)]"
                        }`}
                      >
                        <div className="capitalize">{format(d, "EEE", { locale: ptBR })}</div>
                        <div className="font-display text-lg">{format(d, "d")}</div>
                        <div className="text-xs opacity-80">{format(d, "MMM", { locale: ptBR })}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedDay && (
                <div>
                  <h3 className="font-display text-lg mb-3 text-[var(--color-ink)]">
                    Horários em {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {timesForSelectedDay.map((s) => (
                      <button
                        key={s.start}
                        onClick={() => setSelectedSlot(s)}
                        className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                          selectedSlot?.start === s.start
                            ? "border-[var(--color-wine)] bg-[var(--color-wine)] text-white"
                            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-wine)]"
                        }`}
                      >
                        {format(parseISO(s.start), "HH:mm")}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={!selectedSlot}
                    onClick={() => setStep("form")}
                    className="mt-8 w-full sm:w-auto rounded-lg bg-[var(--color-wine)] px-6 py-3 text-white text-sm font-medium disabled:opacity-40 hover:bg-[var(--color-wine-dark)] transition-colors"
                  >
                    Continuar
                  </button>
                </div>
              )}
            </div>
          )}

          {step === "form" && selectedSlot && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
              <button
                type="button"
                onClick={() => setStep("calendar")}
                className="text-sm text-[var(--color-wine)] text-left mb-2"
              >
                ← Trocar horário
              </button>

              <label className="text-sm text-[var(--color-ink)]">
                Nome completo
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)]"
                />
              </label>

              <label className="text-sm text-[var(--color-ink)]">
                E-mail
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)]"
                />
              </label>

              <label className="text-sm text-[var(--color-ink)]">
                Algo que queira compartilhar antes da sessão? (opcional)
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)]"
                />
              </label>

              <div>
                <p className="text-sm text-[var(--color-ink)] mb-2">Forma de pagamento</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                      paymentMethod === "card"
                        ? "border-[var(--color-wine)] bg-[var(--color-wine)] text-white"
                        : "border-[var(--color-border)] bg-[var(--color-surface)]"
                    }`}
                  >
                    Cartão de crédito
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("pix")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                      paymentMethod === "pix"
                        ? "border-[var(--color-wine)] bg-[var(--color-wine)] text-white"
                        : "border-[var(--color-border)] bg-[var(--color-surface)]"
                    }`}
                  >
                    Pix
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 rounded-lg bg-[var(--color-wine)] px-6 py-3 text-white text-sm font-medium disabled:opacity-40 hover:bg-[var(--color-wine-dark)] transition-colors"
              >
                {submitting ? "Redirecionando..." : "Ir para pagamento"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
