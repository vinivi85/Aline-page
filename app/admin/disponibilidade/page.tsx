import { createServiceClient } from "@/lib/supabase/server";
import { addAvailabilityRule, deleteAvailabilityRule, addOverride, deleteOverride, toggleMonth } from "../actions";
import { format, parseISO, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MONTHS_AHEAD = 12;

export default async function DisponibilidadePage() {
  const supabase = createServiceClient();
  const [{ data: rules }, { data: overrides }, { data: monthRows }] = await Promise.all([
    supabase.from("availability_rules").select("*").order("day_of_week"),
    supabase.from("availability_overrides").select("*").order("date"),
    supabase.from("month_availability").select("*"),
  ]);

  const disabledMonths = new Set(
    (monthRows ?? []).filter((m: any) => m.enabled === false).map((m: any) => m.period)
  );

  const upcomingMonths = Array.from({ length: MONTHS_AHEAD }, (_, i) => {
    const d = addMonths(new Date(), i);
    return { period: format(d, "yyyy-MM"), date: d };
  });

  const rulesByDay = DAYS.map((_, dayIndex) =>
    (rules ?? []).filter((r: { day_of_week: number }) => r.day_of_week === dayIndex)
  );

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl mb-2 text-[var(--color-ink)]">Disponibilidade</h1>
      <p className="text-sm text-[var(--color-ink-soft)] mb-8">
        Defina os dias e horários recorrentes em que você atende, e bloqueie ou abra datas
        específicas quando precisar (férias, feriado, um horário extra pontual).
      </p>

      <h2 className="font-display text-lg mb-1 text-[var(--color-ink)]">Meses disponíveis</h2>
      <p className="text-xs text-[var(--color-ink-soft)] mb-3">
        Desative um mês inteiro se você não vai atender nesse período (ex: fim de ano). Por
        padrão todo mês fica aberto. <strong>Dica:</strong> pra abrir só datas específicas num
        mês (ex: só dia 20 e 28), feche o mês inteiro aqui e depois adicione cada data como
        "Abrir horário extra" na seção de exceções pontuais, mais abaixo.
      </p>
      <div className="flex flex-wrap gap-2 mb-10">
        {upcomingMonths.map(({ period, date }) => {
          const isEnabled = !disabledMonths.has(period);
          return (
            <form
              key={period}
              action={async () => {
                "use server";
                await toggleMonth(period, !isEnabled);
              }}
            >
              <button
                type="submit"
                className={`rounded-full px-4 py-2 text-sm capitalize border transition-colors ${
                  isEnabled
                    ? "bg-[var(--color-teal)] border-[var(--color-teal)] text-white"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-ink-soft)] line-through"
                }`}
                title={isEnabled ? "Clique para fechar este mês" : "Clique para reabrir este mês"}
              >
                {format(date, "MMM yyyy", { locale: ptBR })}
              </button>
            </form>
          );
        })}
      </div>

      <h2 className="font-display text-lg mb-1 text-[var(--color-ink)]">Horários recorrentes</h2>
      <p className="text-xs text-[var(--color-ink-soft)] mb-3">
        Preencha o horário e clique em <strong>Salvar</strong> — cada faixa é gravada
        individualmente assim que você clica no botão daquele dia.
      </p>
      <div className="flex flex-col gap-3 mb-6">
        {DAYS.map((dayName, dayIndex) => (
          <div key={dayIndex} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-sm font-medium text-[var(--color-ink)] mb-2">{dayName}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {rulesByDay[dayIndex].map((r: any) => (
                <form key={r.id} action={async () => { "use server"; await deleteAvailabilityRule(r.id); }}>
                  <button
                    type="submit"
                    className="text-xs rounded-full bg-[var(--color-cream)] border border-[var(--color-border)] px-3 py-1.5 text-[var(--color-ink)] hover:border-red-400"
                    title="Clique para remover"
                  >
                    {r.start_time.slice(0, 5)} – {r.end_time.slice(0, 5)} ✕
                  </button>
                </form>
              ))}
              {rulesByDay[dayIndex].length === 0 && (
                <span className="text-xs text-[var(--color-ink-soft)]">Sem atendimento</span>
              )}
            </div>
            <form action={addAvailabilityRule} className="flex gap-2 items-end">
              <input type="hidden" name="day_of_week" value={dayIndex} />
              <label className="text-xs text-[var(--color-ink-soft)]">
                Das
                <input name="start_time" type="time" required className="block mt-1 rounded border border-[var(--color-border)] px-2 py-1 text-sm" />
              </label>
              <label className="text-xs text-[var(--color-ink-soft)]">
                Até
                <input name="end_time" type="time" required className="block mt-1 rounded border border-[var(--color-border)] px-2 py-1 text-sm" />
              </label>
              <button type="submit" className="rounded-lg bg-[var(--color-teal)] hover:bg-[var(--color-teal-dark)] transition-colors px-4 py-1.5 text-xs font-semibold text-white">
                Salvar horário
              </button>
            </form>
          </div>
        ))}
      </div>

      <h2 className="font-display text-lg mb-3 text-[var(--color-ink)]">Exceções pontuais</h2>
      <p className="text-xs text-[var(--color-ink-soft)] mb-3">
        Use para bloquear um dia inteiro (viagem, feriado), bloquear uma faixa de horário num dia
        específico, ou abrir um horário extra fora da rotina normal — inclusive dentro de um mês
        que você fechou acima (a data específica sempre tem prioridade sobre o mês fechado).
      </p>

      <div className="flex flex-col gap-2 mb-4">
        {(overrides ?? []).map((o: any) => (
          <form key={o.id} action={async () => { "use server"; await deleteOverride(o.id); }} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2">
            <span className="text-sm text-[var(--color-ink)] capitalize">
              {format(parseISO(o.date), "d 'de' MMMM", { locale: ptBR })} —{" "}
              {o.type === "block_day" && "dia bloqueado"}
              {o.type === "block_range" && `bloqueado ${o.start_time?.slice(0, 5)}–${o.end_time?.slice(0, 5)}`}
              {o.type === "open_range" && `aberto extra ${o.start_time?.slice(0, 5)}–${o.end_time?.slice(0, 5)}`}
              {o.reason && <span className="text-[var(--color-ink-soft)]"> · {o.reason}</span>}
            </span>
            <button type="submit" className="text-xs text-[var(--color-ink-soft)] hover:text-red-500">Remover</button>
          </form>
        ))}
      </div>

      <form action={addOverride} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
        <label className="text-xs text-[var(--color-ink-soft)]">
          Data
          <input name="date" type="date" required className="mt-1 w-full rounded border border-[var(--color-border)] px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs text-[var(--color-ink-soft)]">
          Tipo
          <select name="type" className="mt-1 w-full rounded border border-[var(--color-border)] px-2 py-1.5 text-sm">
            <option value="block_day">Bloquear dia inteiro</option>
            <option value="block_range">Bloquear faixa de horário</option>
            <option value="open_range">Abrir horário extra</option>
          </select>
        </label>
        <label className="text-xs text-[var(--color-ink-soft)]">
          Das
          <input name="start_time" type="time" className="mt-1 w-full rounded border border-[var(--color-border)] px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs text-[var(--color-ink-soft)]">
          Até
          <input name="end_time" type="time" className="mt-1 w-full rounded border border-[var(--color-border)] px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs text-[var(--color-ink-soft)] col-span-2 sm:col-span-4">
          Motivo (opcional)
          <input name="reason" className="mt-1 w-full rounded border border-[var(--color-border)] px-2 py-1.5 text-sm" placeholder="ex: viagem, feriado" />
        </label>
        <button type="submit" className="col-span-2 sm:col-span-4 rounded-lg bg-[var(--color-orange)] hover:bg-[var(--color-orange-dark)] transition-colors px-4 py-2 text-white text-sm font-semibold w-fit">
          Salvar exceção
        </button>
      </form>
    </div>
  );
}
