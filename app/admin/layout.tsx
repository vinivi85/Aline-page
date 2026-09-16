import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServiceClient();
  const { count } = await supabase
    .from("cancellation_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <div className="min-h-screen">
      <nav className="border-b border-[var(--color-border)] px-6 py-4 flex gap-6 items-center flex-wrap">
        <span className="font-display text-lg text-[var(--color-ink)]">Painel · Aline</span>
        <Link href="/admin" className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-teal)]">
          Agendamentos
        </Link>
        <Link href="/admin/notificacoes" className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-teal)] flex items-center gap-1.5">
          Notificações
          {!!count && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-600 text-white text-[10px] font-bold px-1">
              {count}
            </span>
          )}
        </Link>
        <Link href="/admin/financeiro" className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-teal)]">
          Financeiro
        </Link>
        <Link href="/admin/historico" className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-teal)]">
          Histórico
        </Link>
        <Link href="/admin/tipos" className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-teal)]">
          Tipos de sessão
        </Link>
        <Link href="/admin/disponibilidade" className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-teal)]">
          Disponibilidade
        </Link>
      </nav>
      <div className="px-6 py-8">{children}</div>
    </div>
  );
}
