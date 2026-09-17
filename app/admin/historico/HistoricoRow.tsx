"use client";

import { useRouter } from "next/navigation";

export default function HistoricoRow({
  bookingId,
  children,
}: {
  bookingId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(`/admin/agendamentos/${bookingId}`)}
      className="border-b border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-teal-light)]"
    >
      {children}
    </tr>
  );
}
