"use client";

import { useEffect, useMemo, useState } from "react";
import {
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isBefore,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { formatDualTime, formatDualRange } from "@/lib/timezones";

type SessionType = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  currency: string;
};

type Slot = { start: string; end: string };

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

export default function BookingFlow({ sessionType }: { sessionType: SessionType }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
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
    const set = new Set<string>();
    for (const s of slots) set.add(format(parseISO(s.start), "yyyy-MM-dd"));
    return set;
  }, [slots]);

  const timesForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return slots.filter((s) => isSameDay(parseISO(s.start), selectedDay));
  }, [slots, selectedDay]);

  // grade do calendário: sempre semanas completas (dom-sáb) cobrindo o mês visível
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(visibleMonth));
    const end = endOfWeek(endOfMonth(visibleMonth));
    return eachDayOfInterval({ start, end });
  }, [visibleMonth]);

  const today = startOfDay(new Date());

  function goToPrevMonth() {
    const prev = subMonths(visibleMonth, 1);
    // não deixa voltar antes do mês atual
    if (isBefore(startOfMonth(new Date()), prev) || isSameMonth(prev, new Date())) {
      setVisibleMonth(startOfMonth(prev));
    }
  }

  function goToNextMonth() {
    setVisibleMonth(startOfMonth(addMonths(visibleMonth, 1)));
  }

  const isPrevDisabled = isSameMonth(visibleMonth, new Date());

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
      <Link
        href="/agendar"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-teal)] mb-6 hover:underline"
      >
        ← Voltar para os tipos de sessão
      </Link>
      <div className="grid gap-10 sm:grid-cols-[280px_1fr]">
        {/* Painel esquerdo: detalhes da sessão */}
        <div className="border-b sm:border-b-0 sm:border-r border-[var(--color-border)] pb-8 sm:pb-0 sm:pr-8">
          <p className="text-sm text-[var(--color-teal)] mb-2">Aline Vicente Consultoria</p>
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
                🇧🇷 {formatDualRange(selectedSlot.start, selectedSlot.end).br} (Brasília)
              </p>
              <p className="text-sm text-[var(--color-ink-soft)]">
                🇺🇸 {formatDualRange(selectedSlot.start, selectedSlot.end).us} (Texas)
              </p>
            </div>
          )}
        </div>

        {/* Painel direito: calendário mensal ou formulário */}
        <div>
          {loading && <p className="text-[var(--color-ink-soft)]">Carregando horários...</p>}

          {!loading && step === "calendar" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={goToPrevMonth}
                  disabled={isPrevDisabled}
                  className="w-8 h-8 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-ink)] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[var(--color-teal)]"
                  aria-label="Mês anterior"
                >
                  ‹
                </button>
                <h2 className="font-display text-lg text-[var(--color-ink)] capitalize">
                  {format(visibleMonth, "MMMM yyyy", { locale: ptBR })}
                </h2>
                <button
                  onClick={goToNextMonth}
                  className="w-8 h-8 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-ink)] hover:border-[var(--color-teal)]"
                  aria-label="Próximo mês"
                >
                  ›
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAY_LABELS.map((d, i) => (
                  <div key={i} className="text-center text-xs text-[var(--color-ink-soft)] py-1">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 mb-8">
                {calendarDays.map((day) => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const inMonth = isSameMonth(day, visibleMonth);
                  const hasSlots = daysWithSlots.has(dateKey);
                  const isPast = isBefore(day, today);
                  const disabled = !inMonth || !hasSlots || isPast;
                  const isSelected = selectedDay && isSameDay(day, selectedDay);

                  return (
                    <button
                      key={dateKey}
                      disabled={disabled}
                      onClick={() => {
                        setSelectedDay(day);
                        setSelectedSlot(null);
                      }}
                      className={`aspect-square rounded-lg text-sm flex flex-col items-center justify-center transition-colors relative
                        ${!inMonth ? "invisible" : ""}
                        ${
                          disabled && inMonth
                            ? "text-[var(--color-border)] cursor-default"
                            : "text-[var(--color-ink)] hover:bg-[var(--color-teal-light)] cursor-pointer"
                        }
                        ${isSelected ? "bg-[var(--color-teal)] text-white hover:bg-[var(--color-teal)]" : ""}
                        ${isToday(day) && !isSelected ? "font-bold" : ""}
                      `}
                    >
                      {format(day, "d")}
                      {hasSlots && !isPast && inMonth && !isSelected && (
                        <span className="w-1 h-1 rounded-full bg-[var(--color-orange)] absolute bottom-1.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {!loading && daysWithSlots.size === 0 && (
                <p className="text-sm text-[var(--color-ink-soft)] mb-8">
                  Sem horários disponíveis nos próximos meses. Volte em breve.
                </p>
              )}

              {selectedDay && (
                <div>
                  <h3 className="font-display text-lg mb-1 text-[var(--color-ink)] capitalize">
                    Horários em {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
                  </h3>
                  <p className="text-xs text-[var(--color-ink-soft)] mb-3">
                    🇧🇷 Horário de Brasília / 🇺🇸 Horário do Texas
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {timesForSelectedDay.map((s) => {
                      const { br, us } = formatDualTime(s.start);
                      return (
                        <button
                          key={s.start}
                          onClick={() => setSelectedSlot(s)}
                          className={`rounded-lg border px-3 py-2 text-sm transition-colors leading-tight ${
                            selectedSlot?.start === s.start
                              ? "border-[var(--color-teal)] bg-[var(--color-teal)] text-white"
                              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-teal)]"
                          }`}
                        >
                          <span className="block">🇧🇷 {br}</span>
                          <span className="block text-[10px] opacity-70">🇺🇸 {us}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    disabled={!selectedSlot}
                    onClick={() => setStep("form")}
                    className="mt-8 w-full sm:w-auto rounded-lg bg-[var(--color-orange)] px-6 py-3 text-white text-sm font-semibold disabled:opacity-40 hover:bg-[var(--color-orange-dark)] transition-colors"
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
                className="text-sm text-[var(--color-teal)] text-left mb-2"
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
                        ? "border-[var(--color-teal)] bg-[var(--color-teal)] text-white"
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
                        ? "border-[var(--color-teal)] bg-[var(--color-teal)] text-white"
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
                className="mt-2 rounded-lg bg-[var(--color-orange)] px-6 py-3 text-white text-sm font-semibold disabled:opacity-40 hover:bg-[var(--color-orange-dark)] transition-colors"
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
