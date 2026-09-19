"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type Subscriber = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  phone_country: string | null;
  created_at: string;
};

type SortColumn = "name" | "email" | "phone" | "created_at";

const COLUMNS: { key: SortColumn; label: string }[] = [
  { key: "name", label: "Nome" },
  { key: "email", label: "E-mail" },
  { key: "phone", label: "Telefone" },
  { key: "created_at", label: "Cadastrado em" },
];

function escapeCsvField(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default function NewsletterTable({ subscribers: initialSubscribers }: { subscribers: Subscriber[] }) {
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [sortColumn, setSortColumn] = useState<SortColumn>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const copy = [...subscribers];
    copy.sort((a, b) => {
      const va = (a[sortColumn] ?? "").toString().toLowerCase();
      const vb = (b[sortColumn] ?? "").toString().toLowerCase();
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
    return copy;
  }, [subscribers, sortColumn, sortAsc]);

  function handleSort(col: SortColumn) {
    if (col === sortColumn) {
      setSortAsc(!sortAsc);
    } else {
      setSortColumn(col);
      setSortAsc(true);
    }
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Excluir o cadastro de ${label}? Essa ação não pode ser desfeita.`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch("/api/admin/newsletter/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        alert("Erro ao excluir o cadastro.");
        return;
      }
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  function handleExportCsv() {
    const header = ["Nome", "E-mail", "Telefone", "Pais", "Cadastrado em"];
    const rows = sorted.map((s) => [
      s.name ?? "",
      s.email,
      s.phone ?? "",
      s.phone_country ?? "",
      format(parseISO(s.created_at), "yyyy-MM-dd HH:mm"),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((field) => escapeCsvField(String(field))).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-[var(--color-ink-soft)]">{subscribers.length} cadastros</p>
        <button
          onClick={handleExportCsv}
          disabled={subscribers.length === 0}
          className="rounded-lg bg-[var(--color-teal)] hover:bg-[var(--color-teal-dark)] transition-colors text-white text-sm font-semibold px-4 py-2 disabled:opacity-40"
        >
          ⬇ Exportar CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[var(--color-ink-soft)] border-b border-[var(--color-border)]">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="py-2 pr-3 cursor-pointer select-none hover:text-[var(--color-teal)]"
                >
                  {col.label} {sortColumn === col.key ? (sortAsc ? "▲" : "▼") : ""}
                </th>
              ))}
              <th className="py-2 pr-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => (
              <tr key={s.id} className="border-b border-[var(--color-border)]">
                <td className="py-2 pr-3 text-[var(--color-ink)]">{s.name ?? "—"}</td>
                <td className="py-2 pr-3 text-[var(--color-ink)]">{s.email}</td>
                <td className="py-2 pr-3 text-[var(--color-ink-soft)]">{s.phone ?? "—"}</td>
                <td className="py-2 pr-3 text-[var(--color-ink-soft)] whitespace-nowrap">
                  {format(parseISO(s.created_at), "d MMM yyyy, HH:mm", { locale: ptBR })}
                </td>
                <td className="py-2 pr-3 text-right">
                  <button
                    onClick={() => handleDelete(s.id, s.name ?? s.email)}
                    disabled={deletingId === s.id}
                    className="text-xs text-[var(--color-wine)] hover:underline disabled:opacity-40"
                  >
                    {deletingId === s.id ? "Excluindo..." : "Excluir"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {subscribers.length === 0 && (
          <p className="text-sm text-[var(--color-ink-soft)] mt-4">Nenhum cadastro ainda.</p>
        )}
      </div>
    </div>
  );
}
