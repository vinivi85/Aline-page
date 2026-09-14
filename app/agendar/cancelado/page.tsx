import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";

export default async function CanceladoPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string }>;
}) {
  const { booking: bookingId } = await searchParams;

  if (bookingId) {
    const supabase = createServiceClient();
    // libera o horário para outra pessoa poder agendar
    await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingId)
      .eq("status", "pending_payment");
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="font-display text-3xl mb-3 text-[var(--color-ink)]">Pagamento não concluído</h1>
      <p className="text-[var(--color-ink-soft)] mb-8">
        Seu horário foi liberado. Sem problema — você pode tentar novamente quando quiser.
      </p>
      <Link
        href="/agendar"
        className="inline-block rounded-lg bg-[var(--color-wine)] px-6 py-3 text-white text-sm font-medium hover:bg-[var(--color-wine-dark)] transition-colors"
      >
        Ver horários disponíveis
      </Link>
    </main>
  );
}
