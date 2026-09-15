import { addDays, addMinutes, format, isBefore, parseISO, startOfDay } from "date-fns";

export type AvailabilityRule = {
  day_of_week: number;
  start_time: string; // "HH:mm:ss"
  end_time: string;
  active: boolean;
};

export type AvailabilityOverride = {
  date: string; // "yyyy-MM-dd"
  type: "block_day" | "block_range" | "open_range";
  start_time: string | null;
  end_time: string | null;
};

export type ExistingBooking = {
  start_at: string; // ISO
  end_at: string;
};

export type BookingSettings = {
  buffer_minutes: number;
  min_notice_hours: number;
  max_days_ahead: number;
  timezone: string;
};

export type Slot = { start: Date; end: Date };

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Gera todos os horários disponíveis para um tipo de sessão dentro da janela
 * [today, today + max_days_ahead], considerando:
 * - regras recorrentes de disponibilidade (dia da semana + faixa de horário)
 * - meses fechados no admin (fecham as regras recorrentes daquele mês, mas
 *   não apagam aberturas pontuais — assim dá pra fechar o mês inteiro e abrir
 *   só datas específicas dentro dele)
 * - overrides pontuais (bloqueio de dia, bloqueio de faixa, abertura extra)
 * - agendamentos já existentes (para não sobrepor)
 * - buffer entre sessões e antecedência mínima
 */
export function computeAvailableSlots(params: {
  rules: AvailabilityRule[];
  overrides: AvailabilityOverride[];
  existingBookings: ExistingBooking[];
  settings: BookingSettings;
  sessionDurationMinutes: number;
  disabledMonths?: Set<string>; // formato 'yyyy-MM'
  now?: Date;
}): Slot[] {
  const { rules, overrides, existingBookings, settings, sessionDurationMinutes } = params;
  const disabledMonths = params.disabledMonths ?? new Set<string>();
  const now = params.now ?? new Date();
  const earliestStart = addMinutes(now, settings.min_notice_hours * 60);
  const lastDay = addDays(startOfDay(now), settings.max_days_ahead);

  const overridesByDate = new Map<string, AvailabilityOverride[]>();
  for (const o of overrides) {
    const list = overridesByDate.get(o.date) ?? [];
    list.push(o);
    overridesByDate.set(o.date, list);
  }

  const slots: Slot[] = [];

  for (
    let day = startOfDay(now);
    isBefore(day, lastDay);
    day = addDays(day, 1)
  ) {
    const dateKey = format(day, "yyyy-MM-dd");
    const dayOverrides = overridesByDate.get(dateKey) ?? [];

    if (dayOverrides.some((o) => o.type === "block_day")) continue;

    const monthClosed = disabledMonths.has(format(day, "yyyy-MM"));
    const dayOfWeek = day.getDay();
    const dayRules = monthClosed
      ? []
      : rules.filter((r) => r.active && r.day_of_week === dayOfWeek);

    // Janelas base do dia: regras recorrentes (se o mês não estiver fechado)
    // + aberturas extras pontuais (essas sempre valem, mesmo com o mês fechado)
    const windows: { start: number; end: number }[] = dayRules.map((r) => ({
      start: timeToMinutes(r.start_time),
      end: timeToMinutes(r.end_time),
    }));

    for (const o of dayOverrides) {
      if (o.type === "open_range" && o.start_time && o.end_time) {
        windows.push({ start: timeToMinutes(o.start_time), end: timeToMinutes(o.end_time) });
      }
    }

    // Subtrai bloqueios pontuais das janelas
    const blockRanges = dayOverrides
      .filter((o) => o.type === "block_range" && o.start_time && o.end_time)
      .map((o) => ({ start: timeToMinutes(o.start_time!), end: timeToMinutes(o.end_time!) }));

    for (const win of windows) {
      // gera slots a cada `sessionDurationMinutes + buffer`, começando na janela
      const step = sessionDurationMinutes + settings.buffer_minutes;
      for (let cursor = win.start; cursor + sessionDurationMinutes <= win.end; cursor += step) {
        const slotStart = addMinutes(day, cursor);
        const slotEnd = addMinutes(slotStart, sessionDurationMinutes);

        if (isBefore(slotStart, earliestStart)) continue;

        const overlapsBlock = blockRanges.some(
          (b) => cursor < b.end && cursor + sessionDurationMinutes > b.start
        );
        if (overlapsBlock) continue;

        const overlapsBooking = existingBookings.some((b) => {
          const bStart = parseISO(b.start_at);
          const bEnd = parseISO(b.end_at);
          return slotStart < bEnd && slotEnd > bStart;
        });
        if (overlapsBooking) continue;

        slots.push({ start: slotStart, end: slotEnd });
      }
    }
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}
