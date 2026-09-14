import { createServiceClient } from "@/lib/supabase/server";
import { upsertSessionType, deleteSessionType } from "../actions";

export default async function TiposPage() {
  const supabase = createServiceClient();
  const { data: sessionTypes } = await supabase
    .from("session_types")
    .select("*")
    .order("sort_order");

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl mb-6 text-[var(--color-ink)]">Tipos de sessão</h1>

      <div className="flex flex-col gap-4 mb-10">
        {(sessionTypes ?? []).map((st: any) => (
          <form
            key={st.id}
            action={upsertSessionType}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 items-end"
          >
            <input type="hidden" name="id" value={st.id} />
            <label className="text-xs text-[var(--color-ink-soft)] col-span-2">
              Nome
              <input name="name" defaultValue={st.name} className="mt-1 w-full rounded border border-[var(--color-border)] px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs text-[var(--color-ink-soft)]">
              Duração (min)
              <input name="duration_minutes" type="number" defaultValue={st.duration_minutes} className="mt-1 w-full rounded border border-[var(--color-border)] px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs text-[var(--color-ink-soft)]">
              Preço (USD)
              <input name="price" type="number" step="0.01" defaultValue={(st.price_cents / 100).toFixed(2)} className="mt-1 w-full rounded border border-[var(--color-border)] px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs text-[var(--color-ink-soft)] flex items-center gap-2">
              <input name="active" type="checkbox" defaultChecked={st.active} /> Ativo
            </label>
            <label className="text-xs text-[var(--color-ink-soft)] col-span-2 sm:col-span-5">
              Descrição
              <input name="description" defaultValue={st.description ?? ""} className="mt-1 w-full rounded border border-[var(--color-border)] px-2 py-1.5 text-sm" />
            </label>
            <div className="col-span-2 sm:col-span-5 flex gap-2">
              <button type="submit" className="rounded-lg bg-[var(--color-wine)] px-4 py-2 text-white text-sm">
                Salvar
              </button>
              <button
                formAction={async () => {
                  "use server";
                  await deleteSessionType(st.id);
                }}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-ink-soft)]"
              >
                Excluir
              </button>
            </div>
          </form>
        ))}
      </div>

      <h2 className="font-display text-lg mb-3 text-[var(--color-ink)]">Adicionar novo tipo</h2>
      <form action={upsertSessionType} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
        <label className="text-xs text-[var(--color-ink-soft)] col-span-2">
          Nome
          <input name="name" required className="mt-1 w-full rounded border border-[var(--color-border)] px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs text-[var(--color-ink-soft)]">
          Duração (min)
          <input name="duration_minutes" type="number" required defaultValue={50} className="mt-1 w-full rounded border border-[var(--color-border)] px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs text-[var(--color-ink-soft)]">
          Preço (USD)
          <input name="price" type="number" step="0.01" required className="mt-1 w-full rounded border border-[var(--color-border)] px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs text-[var(--color-ink-soft)] flex items-center gap-2">
          <input name="active" type="checkbox" defaultChecked /> Ativo
        </label>
        <label className="text-xs text-[var(--color-ink-soft)] col-span-2 sm:col-span-5">
          Descrição
          <input name="description" className="mt-1 w-full rounded border border-[var(--color-border)] px-2 py-1.5 text-sm" />
        </label>
        <button type="submit" className="col-span-2 sm:col-span-5 rounded-lg bg-[var(--color-wine)] px-4 py-2 text-white text-sm w-fit">
          Adicionar tipo de sessão
        </button>
      </form>
    </div>
  );
}
