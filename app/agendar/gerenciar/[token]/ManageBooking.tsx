"use client";

import { useEffect, useMemo, useState } from "react";
import {
  format,
  parseISO,
  isSameDay,
  isSameMonth,
  isToday,
  isBefore,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  startOfDay,
  differenceInHours,
} from "date-fns";
import { ptBR } from "date-fns/locale";

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MIN_HOURS_TO_RESCHEDULE = 24;
const MIN_HOURS_TO_CANCEL = 48;

type Booking = {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  session_types: { id: string; name: string; duration_minutes: number; price_cents: number } | null;
  clients: { name: string; email: string } | null;
};

type Slot = { start: string; end: string };

export default function ManageBooking({
  booking,
  token,
  pendingCancellation,
}: {
  booking: Booking;
  token: string;
  pendingCancellation: boolean;
}) {
  const [mode, setMode] = useState<"view" | "reschedule" | "cancel">("view");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const hoursUntilSession = differenceInHours(parseISO(booking.start_at), new Date());
  const canReschedule = booking.status === "confirmed" && hoursUntilSession >= MIN_HOURS_TO_RESCHEDULE;
  const canCancel = booking.status === "confirmed" && hoursUntilSession >= MIN_HOURS_TO_CANCEL;

  useEffect(() => {
    if (mode !== "reschedule" || !booking.session_types) return;
    setLoadingSlots(true);
    fetch(`/api/availability?sessionTypeId=${booking.session_types.id}`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots ?? []))
      .finally(() => setLoadingSlots(false));
  }, [mode, booking.session_types]);

  const daysWithSlots = useMemo(() => {
    const set = new Set<string>();
    for (const s of slots) set.add(format(parseISO(s.start), "yyyy-MM-dd"));
    return set;
  }, [slots]);

  const timesForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return slots.filter((s) => isSameDay(parseISO(s.start), selectedDay));
  }, [slots, selectedDay]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(visibleMonth));
    const end = endOfWeek(endOfMonth(visibleMonth));
    return eachDayOfInterval({ start, end });
  }, [visibleMonth]);

  const today = startOfDay(new Date());
  const isPrevDisabled = isSameMonth(visibleMonth, new Date());

  async function confirmReschedule() {
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newStart: selectedSlot.start, newEnd: selectedSlot.end }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao remarcar.");
        setSubmitting(false);
        return;
      }
      setSuccess("Sessão remarcada com sucesso! A página vai atualizar em instantes.");
      setTimeout(() => window.location.reload(), 2000);
    } catch {
      setError("Não foi possível conectar. Tente novamente.");
      setSubmitting(false);
    }
  }

  async function submitCancelRequest(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings/cancel-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao enviar solicitação.");
        setSubmitting(false);
        return;
      }
      setSuccess("Solicitação enviada! A Aline vai revisar e confirmar em breve.");
      setMode("view");
      setSubmitting(false);
    } catch {
      setError("Não foi possível conectar. Tente novamente.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16 sm:py-24">
      <p className="text-sm text-[var(--color-teal)] mb-2">Aline Vicente</p>
      <h1 className="font-display text-2xl mb-6 text-[var(--color-ink)]">Sua sessão</h1>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 mb-6">
        <p className="font-medium text-[var(--color-ink)] mb-1">{booking.session_types?.name}</p>
        <p className="text-sm text-[var(--color-ink-soft)] capitalize">
          {format(parseISO(booking.start_at), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
        </p>
        <p className="text-xs text-[var(--color-ink-soft)] mt-2">
          Status: {booking.status === "confirmed" ? "Confirmado" : booking.status}
        </p>
      </div>

      {success && (
        <p className="text-sm text-[var(--color-teal-dark)] bg-[var(--color-teal-light)] rounded-lg px-4 py-3 mb-6">
          {success}
        </p>
      )}

      {pendingCancellation && (
        <p className="text-sm text-yellow-800 bg-yellow-100 rounded-lg px-4 py-3 mb-6">
          Você já tem uma solicitação de cancelamento pendente pra essa sessão. A Aline vai revisar
          em breve.
        </p>
      )}

      {booking.status !== "confirmed" && (
        <p className="text-sm text-[var(--color-ink-soft)]">
          Essa sessão não está mais ativa, então não é possível remarcar ou cancelar por aqui.
        </p>
      )}

      {booking.status === "confirmed" && !pendingCancellation && mode === "view" && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setMode("reschedule")}
            disabled={!canReschedule}
            className="rounded-lg bg-[var(--color-teal)] hover:bg-[var(--color-teal-dark)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-3"
          >
            Remarcar
          </button>
          {!canReschedule && (
            <p className="text-xs text-[var(--color-ink-soft)] -mt-2">
              Só é possível remarcar com pelo menos {MIN_HOURS_TO_RESCHEDULE}h de antecedência.
            </p>
          )}

          <button
            onClick={() => setMode("cancel")}
            disabled={!canCancel}
            className="rounded-lg border border-[var(--color-border)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--color-ink)] text-sm font-semibold px-5 py-3 hover:border-red-400"
          >
            Solicitar cancelamento
          </button>
          {!canCancel && (
            <p className="text-xs text-[var(--color-ink-soft)] -mt-2">
              Cancelamentos precisam ser solicitados com pelo menos {MIN_HOURS_TO_CANCEL}h de
              antecedência.
            </p>
          )}
        </div>
      )}

      {mode === "reschedule" && (
        <div>
          <button
            onClick={() => {
              setMode("view");
              setSelectedSlot(null);
              setSelectedDay(null);
              setError(null);
            }}
            className="text-sm text-[var(--color-teal)] mb-4"
          >
            ← Voltar
          </button>

          {loadingSlots && <p className="text-[var(--color-ink-soft)] text-sm">Carregando horários...</p>}

          {!loadingSlots && (
            <>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => !isPrevDisabled && setVisibleMonth(startOfMonth(subMonths(visibleMonth, 1)))}
                  disabled={isPrevDisabled}
                  className="w-8 h-8 rounded-full border border-[var(--color-border)] flex items-center justify-center disabled:opacity-30"
                >
                  ‹
                </button>
                <h2 className="font-display text-base text-[var(--color-ink)] capitalize">
                  {format(visibleMonth, "MMMM yyyy", { locale: ptBR })}
                </h2>
                <button
                  onClick={() => setVisibleMonth(startOfMonth(addMonths(visibleMonth, 1)))}
                  className="w-8 h-8 rounded-full border border-[var(--color-border)] flex items-center justify-center"
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

              <div className="grid grid-cols-7 gap-1 mb-6">
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
                      className={`aspect-square rounded-lg text-sm flex items-center justify-center relative
                        ${!inMonth ? "invisible" : ""}
                        ${disabled && inMonth ? "text-[var(--color-border)]" : "text-[var(--color-ink)] hover:bg-[var(--color-teal-light)] cursor-pointer"}
                        ${isSelected ? "bg-[var(--color-teal)] text-white" : ""}
                        ${isToday(day) && !isSelected ? "font-bold" : ""}
                      `}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>

              {selectedDay && (
                <div className="mb-6">
                  <h3 className="font-display text-base mb-3 text-[var(--color-ink)] capitalize">
                    Horários em {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {timesForSelectedDay.map((s) => (
                      <button
                        key={s.start}
                        onClick={() => setSelectedSlot(s)}
                        className={`rounded-lg border px-3 py-2 text-sm ${
                          selectedSlot?.start === s.start
                            ? "border-[var(--color-teal)] bg-[var(--color-teal)] text-white"
                            : "border-[var(--color-border)] hover:border-[var(--color-teal)]"
                        }`}
                      >
                        {format(parseISO(s.start), "HH:mm")}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

              <button
                disabled={!selectedSlot || submitting}
                onClick={confirmReschedule}
                className="w-full rounded-lg bg-[var(--color-orange)] hover:bg-[var(--color-orange-dark)] transition-colors text-white text-sm font-semibold px-5 py-3 disabled:opacity-40"
              >
                {submitting ? "Remarcando..." : "Confirmar novo horário"}
              </button>
            </>
          )}
        </div>
      )}

      {mode === "cancel" && (
        <form onSubmit={submitCancelRequest} className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => {
              setMode("view");
              setError(null);
            }}
            className="text-sm text-[var(--color-teal)] text-left"
          >
            ← Voltar
          </button>

          <label className="text-sm text-[var(--color-ink)]">
            Conta pra gente o motivo do cancelamento
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
            />
          </label>

          <p className="text-xs text-[var(--color-ink-soft)]">
            Isso não cancela automaticamente — a Aline vai revisar sua solicitação e confirmar.
          </p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-white text-sm font-semibold px-5 py-3 disabled:opacity-40"
          >
            {submitting ? "Enviando..." : "Solicitar cancelamento"}
          </button>
        </form>
      )}
    </main>
  );
}
