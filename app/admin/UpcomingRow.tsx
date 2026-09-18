"use client";

import { useRouter } from "next/navigation";

export default function UpcomingRow({
  bookingId,
  children,
}: {
  bookingId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/admin/agendamentos/${bookingId}`)}
      className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 cursor-pointer hover:border-[var(--color-teal)]"
    >
      {children}
    </div>
  );
}
