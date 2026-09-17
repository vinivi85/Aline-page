import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AgendarPage() {
  const supabase = createServiceClient();
  const [{ data: sessionTypes }, { data: settingsRow }] = await Promise.all([
    supabase.from("session_types").select("*").eq("active", true).order("sort_order"),
    supabase.from("booking_settings").select("booking_paused").eq("id", 1).single(),
  ]);

  const paused = settingsRow?.booking_paused ?? false;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-teal)] mb-8 hover:underline"
      >
        ← Voltar para a home
      </Link>
      <p className="text-sm tracking-wide text-[var(--color-wine)] mb-3">Aline Vicente Consultoria</p>
      <h1 className="font-display text-4xl sm:text-5xl leading-tight mb-4 text-[var(--color-ink)]">
        Vamos marcar sua sessão
      </h1>

      {paused ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-8 text-center">
          <p className="text-[var(--color-ink)] font-medium mb-2">
            Atendimentos pausados no momento
          </p>
          <p className="text-sm text-[var(--color-ink-soft)] mb-4">
            Não estamos abrindo novos agendamentos agora. Se você já tem uma sessão marcada, pode
            consultá-la normalmente.
          </p>
          <Link
            href="/agendar/consultar"
            className="inline-block rounded-full bg-[var(--color-teal)] hover:bg-[var(--color-teal-dark)] transition-colors text-white text-sm font-semibold px-6 py-2.5"
          >
            Consultar agendamento
          </Link>
        </div>
      ) : (
        <>
          <p className="text-[var(--color-ink-soft)] text-lg mb-12 max-w-lg">
            Escolha o formato que faz mais sentido pra você agora. Cada sessão acontece por vídeo,
            em um horário que couber na sua rotina.
          </p>

          <div className="flex flex-col gap-3">
            {(sessionTypes ?? []).map((st: any) => (
              <Link
                key={st.id}
                href={`/agendar/${st.id}`}
                className="group flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-5 transition-colors hover:border-[var(--color-wine)]"
              >
                <div>
                  <h2 className="font-display text-xl text-[var(--color-ink)] mb-1">{st.name}</h2>
                  {st.description && (
                    <p className="text-sm text-[var(--color-ink-soft)]">{st.description}</p>
                  )}
                  <p className="text-sm text-[var(--color-ink-soft)] mt-2">
                    {st.duration_minutes} min · ${(st.price_cents / 100).toFixed(2)}
                  </p>
                </div>
                <span className="text-[var(--color-wine)] opacity-0 group-hover:opacity-100 transition-opacity">
                  Escolher horário
                </span>
              </Link>
            ))}

            {(sessionTypes ?? []).length === 0 && (
              <p className="text-[var(--color-ink-soft)]">
                Nenhuma sessão disponível no momento. Volte em breve.
              </p>
            )}
          </div>
        </>
      )}
    </main>
  );
}
