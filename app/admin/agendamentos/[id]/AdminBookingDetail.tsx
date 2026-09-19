"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDualTime } from "@/lib/timezones";

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Confirmado", className: "bg-[var(--color-teal-light)] text-[var(--color-teal-dark)]" },
  pending_payment: { label: "Aguardando pagamento", className: "bg-yellow-100 text-yellow-800" },
  cancelled: { label: "Cancelado", className: "bg-red-100 text-red-700" },
  completed: { label: "Realizado", className: "bg-[var(--color-teal-light)] text-[var(--color-teal-dark)]" },
  no_show: { label: "Não compareceu", className: "bg-gray-100 text-gray-600" },
};

type Booking = {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  payment_method: string | null;
  amount_paid_cents: number | null;
  stripe_payment_intent_id: string | null;
  refund_status: string | null;
  zoom_join_url: string | null;
  zoom_start_url: string | null;
  session_types: { id: string; name: string; duration_minutes: number; price_cents: number } | null;
  clients: { name: string; email: string } | null;
};

type Slot = { start: string; end: string };

export default function AdminBookingDetail({ booking: initialBooking }: { booking: Booking }) {
  const [booking, setBooking] = useState(initialBooking);
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
      const res = await fetch("/api/admin/bookings/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, newStart: selectedSlot.start, newEnd: selectedSlot.end }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao remarcar.");
        setSubmitting(false);
        return;
      }
      setBooking({ ...booking, start_at: selectedSlot.start, end_at: selectedSlot.end });
      setSuccess("Sessão remarcada com sucesso.");
      setMode("view");
      setSubmitting(false);
    } catch {
      setError("Não foi possível conectar. Tente novamente.");
      setSubmitting(false);
    }
  }

  async function confirmCancel(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao cancelar.");
        setSubmitting(false);
        return;
      }
      setBooking({ ...booking, status: "cancelled" });
      if (data.refundStatus === "refunded") {
        setSuccess("Sessão cancelada e valor estornado no Stripe.");
      } else if (data.refundStatus === "failed") {
        setSuccess(
          `Sessão cancelada, mas o estorno automático falhou (${data.refundError ?? "erro desconhecido"}). Faça o estorno manualmente no Stripe.`
        );
      } else {
        setSuccess("Sessão cancelada.");
      }
      setMode("view");
      setSubmitting(false);
    } catch {
      setError("Não foi possível conectar. Tente novamente.");
      setSubmitting(false);
    }
  }

  async function handleManualRefund() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/bookings/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao estornar.");
        setSubmitting(false);
        return;
      }
      setBooking({ ...booking, refund_status: "refunded" });
      setSuccess("Valor estornado no Stripe com sucesso.");
      setSubmitting(false);
    } catch {
      setError("Não foi possível conectar. Tente novamente.");
      setSubmitting(false);
    }
  }

  const status = STATUS_LABELS[booking.status] ?? { label: booking.status, className: "bg-gray-100 text-gray-600" };

  return (
    <div className="max-w-lg">
      <Link
        href="/admin/historico"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-teal)] mb-6 hover:underline"
      >
        ← Voltar para o histórico
      </Link>

      <h1 className="font-display text-2xl mb-1 text-[var(--color-ink)]">
        {booking.session_types?.name}
      </h1>
      <p className="text-sm text-[var(--color-ink-soft)] mb-4">
        {booking.clients?.name} · {booking.clients?.email}
      </p>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 mb-6">
        <p className="text-sm text-[var(--color-ink)] capitalize mb-1">
          {format(parseISO(booking.start_at), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
        <p className="text-xs text-[var(--color-ink-soft)] mb-2">
          🇧🇷 {formatDualTime(booking.start_at).br} (Brasília) · 🇺🇸{" "}
          {formatDualTime(booking.start_at).us} (Texas)
        </p>
        <span className={`inline-block text-xs rounded-full px-2 py-1 mb-2 ${status.className}`}>
          {status.label}
        </span>
        {booking.amount_paid_cents != null && (
          <p className="text-xs text-[var(--color-ink-soft)]">
            Pago: {booking.payment_method === "pix" ? "R$" : "$"}{" "}
            {(booking.amount_paid_cents / 100).toFixed(2)} via{" "}
            {booking.payment_method === "pix" ? "Pix" : "Cartão"}
          </p>
        )}
        {booking.zoom_join_url && (
          <a
            href={booking.zoom_start_url ?? booking.zoom_join_url}
            target="_blank"
            className="text-xs text-[var(--color-teal)] mt-1 inline-block"
          >
            Abrir Zoom
          </a>
        )}
      </div>

      {success && (
        <p className="text-sm text-[var(--color-teal-dark)] bg-[var(--color-teal-light)] rounded-lg px-4 py-3 mb-6">
          {success}
        </p>
      )}

      {booking.status !== "confirmed" && mode === "view" && (
        <div>
          <p className="text-sm text-[var(--color-ink-soft)] mb-3">
            Essa sessão não está mais ativa, então não dá pra remarcar ou cancelar por aqui.
          </p>
          {booking.status === "cancelled" &&
            booking.stripe_payment_intent_id &&
            booking.refund_status !== "refunded" && (
              <button
                onClick={handleManualRefund}
                disabled={submitting}
                className="rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-white text-sm font-semibold px-5 py-3 disabled:opacity-40"
              >
                {submitting ? "Estornando..." : "Estornar agora no Stripe"}
              </button>
            )}
        </div>
      )}

      {booking.status === "confirmed" && mode === "view" && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setMode("reschedule")}
            className="rounded-lg bg-[var(--color-teal)] hover:bg-[var(--color-teal-dark)] transition-colors text-white text-sm font-semibold px-5 py-3"
          >
            Remarcar
          </button>
          <button
            onClick={() => setMode("cancel")}
            className="rounded-lg border border-[var(--color-border)] text-[var(--color-ink)] text-sm font-semibold px-5 py-3 hover:border-red-400"
          >
            Cancelar agendamento
          </button>
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
                      className={`aspect-square rounded-lg text-sm flex items-center justify-center
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
                  <h3 className="font-display text-base mb-1 text-[var(--color-ink)] capitalize">
                    Horários em {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
                  </h3>
                  <p className="text-xs text-[var(--color-ink-soft)] mb-3">🇧🇷 Brasília / 🇺🇸 Texas</p>
                  <div className="grid grid-cols-3 gap-2">
                    {timesForSelectedDay.map((s) => {
                      const { br, us } = formatDualTime(s.start);
                      return (
                        <button
                          key={s.start}
                          onClick={() => setSelectedSlot(s)}
                          className={`rounded-lg border px-3 py-2 text-sm leading-tight ${
                            selectedSlot?.start === s.start
                              ? "border-[var(--color-teal)] bg-[var(--color-teal)] text-white"
                              : "border-[var(--color-border)] hover:border-[var(--color-teal)]"
                          }`}
                        >
                          <span className="block">🇧🇷 {br}</span>
                          <span className="block text-[10px] opacity-70">🇺🇸 {us}</span>
                        </button>
                      );
                    })}
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
        <form onSubmit={confirmCancel} className="flex flex-col gap-4">
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
            Motivo (opcional, fica registrado internamente)
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-white text-sm font-semibold px-5 py-3 disabled:opacity-40"
          >
            {submitting ? "Cancelando..." : "Confirmar cancelamento"}
          </button>
        </form>
      )}
    </div>
  );
}
