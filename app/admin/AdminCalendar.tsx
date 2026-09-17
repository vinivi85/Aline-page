"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  parseISO,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";

type Booking = {
  id: string;
  start_at: string;
  status: string;
  zoom_join_url: string | null;
  zoom_start_url: string | null;
  session_types: { name: string } | null;
  clients: { name: string; email: string } | null;
};

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

const STATUS_DOT: Record<string, string> = {
  confirmed: "bg-[var(--color-teal)]",
  pending_payment: "bg-yellow-400",
  completed: "bg-[var(--color-teal)]",
  cancelled: "bg-gray-300",
  no_show: "bg-gray-300",
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Confirmado", className: "bg-[var(--color-teal-light)] text-[var(--color-teal-dark)]" },
  pending_payment: { label: "Aguardando pagamento", className: "bg-yellow-100 text-yellow-800" },
  completed: { label: "Realizado", className: "bg-[var(--color-teal-light)] text-[var(--color-teal-dark)]" },
  cancelled: { label: "Cancelado", className: "bg-red-100 text-red-700" },
  no_show: { label: "Não compareceu", className: "bg-gray-100 text-gray-600" },
};

export default function AdminCalendar({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date());

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(visibleMonth));
    const end = endOfWeek(endOfMonth(visibleMonth));
    return eachDayOfInterval({ start, end });
  }, [visibleMonth]);

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const key = format(parseISO(b.start_at), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(b);
      map.set(key, list);
    }
    return map;
  }, [bookings]);

  const selectedDayBookings = bookingsByDay.get(format(selectedDay, "yyyy-MM-dd")) ?? [];

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setVisibleMonth((m) => startOfMonth(subMonths(m, 1)))}
          className="w-8 h-8 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-ink)] hover:border-[var(--color-teal)]"
          aria-label="Mês anterior"
        >
          ‹
        </button>
        <h2 className="font-display text-lg text-[var(--color-ink)] capitalize">
          {format(visibleMonth, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <button
          onClick={() => setVisibleMonth((m) => startOfMonth(addMonths(m, 1)))}
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

      <div className="grid grid-cols-7 gap-1 mb-6">
        {calendarDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, visibleMonth);
          const dayBookings = bookingsByDay.get(dateKey) ?? [];
          const isSelected = isSameDay(day, selectedDay);
          const statuses = Array.from(new Set(dayBookings.map((b) => b.status))).slice(0, 3);

          return (
            <button
              key={dateKey}
              onClick={() => setSelectedDay(day)}
              className={`aspect-square rounded-lg text-sm flex flex-col items-center justify-center gap-1 transition-colors relative
                ${!inMonth ? "text-[var(--color-border)]" : "text-[var(--color-ink)]"}
                ${isSelected ? "bg-[var(--color-teal)] text-white" : "hover:bg-[var(--color-teal-light)]"}
                ${isToday(day) && !isSelected ? "font-bold" : ""}
              `}
            >
              {format(day, "d")}
              {statuses.length > 0 && (
                <span className="flex gap-0.5">
                  {statuses.map((s, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : STATUS_DOT[s] ?? "bg-gray-300"}`}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <h3 className="font-display text-base mb-3 text-[var(--color-ink)] capitalize">
        {format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
      </h3>

      <div className="flex flex-col gap-2">
        {selectedDayBookings
          .sort((a, b) => a.start_at.localeCompare(b.start_at))
          .map((b) => {
            const status = STATUS_BADGE[b.status] ?? { label: b.status, className: "bg-gray-100 text-gray-600" };
            return (
              <div
                key={b.id}
                onClick={() => router.push(`/admin/agendamentos/${b.id}`)}
                className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 cursor-pointer hover:border-[var(--color-teal)]"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--color-ink)]">
                    {format(parseISO(b.start_at), "HH:mm")} — {b.session_types?.name} · {b.clients?.name}
                  </p>
                  <p className="text-xs text-[var(--color-ink-soft)]">{b.clients?.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs rounded-full px-2 py-1 ${status.className}`}>{status.label}</span>
                  {b.zoom_join_url && (
                    <a
                      href={b.zoom_start_url ?? b.zoom_join_url}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-[var(--color-teal)]"
                    >
                      Zoom
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        {selectedDayBookings.length === 0 && (
          <p className="text-sm text-[var(--color-ink-soft)]">Nenhum agendamento nesse dia.</p>
        )}
      </div>
    </div>
  );
}
