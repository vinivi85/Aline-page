"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/admin", label: "Agendamentos", icon: "📅" },
  { href: "/admin/notificacoes", label: "Notificações", icon: "🔔" },
  { href: "/admin/financeiro", label: "Financeiro", icon: "💳" },
  { href: "/admin/historico", label: "Histórico", icon: "🕘" },
  { href: "/admin/tipos", label: "Tipos de sessão", icon: "🏷️" },
  { href: "/admin/disponibilidade", label: "Disponibilidade", icon: "🗓️" },
];

async function handleLogout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = "/admin/login";
}

export default function AdminSidebar({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();

  return (
    <>
      {/* Sidebar fixa — desktop/tablet */}
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-[var(--color-border)] min-h-screen px-4 py-6">
        <span className="font-display text-lg text-[var(--color-ink)] px-2 mb-6">
          Painel · Aline
        </span>
        <nav className="flex flex-col gap-1 flex-1">
          {LINKS.map((link) => {
            const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-[var(--color-teal-light)] text-[var(--color-teal-dark)] font-medium"
                    : "text-[var(--color-ink-soft)] hover:bg-[var(--color-teal-light)]"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span aria-hidden>{link.icon}</span>
                  {link.label}
                </span>
                {link.href === "/admin/notificacoes" && pendingCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-600 text-white text-[10px] font-bold px-1">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-[var(--color-ink-soft)] hover:bg-red-50 hover:text-red-600 transition-colors mt-2"
        >
          <span aria-hidden>🚪</span>
          Sair
        </button>
      </aside>

      {/* Barra horizontal — mobile */}
      <nav className="md:hidden border-b border-[var(--color-border)] px-4 py-3 flex gap-4 items-center overflow-x-auto whitespace-nowrap">
        {LINKS.map((link) => {
          const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm flex items-center gap-1.5 ${
                active ? "text-[var(--color-teal-dark)] font-medium" : "text-[var(--color-ink-soft)]"
              }`}
            >
              {link.label}
              {link.href === "/admin/notificacoes" && pendingCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full bg-red-600 text-white text-[9px] font-bold px-1">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
        <button onClick={handleLogout} className="text-sm text-[var(--color-ink-soft)] shrink-0">
          Sair
        </button>
      </nav>
    </>
  );
}
