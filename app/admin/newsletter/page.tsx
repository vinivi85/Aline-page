import { createServiceClient } from "@/lib/supabase/server";
import NewsletterTable from "./NewsletterTable";

export default async function NewsletterPage() {
  const supabase = createServiceClient();
  const { data: subscribers } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl mb-1 text-[var(--color-ink)]">Newsletter</h1>
      <p className="text-xs text-[var(--color-ink-soft)] mb-6">
        Cadastros feitos pelo formulário da home. Clique numa coluna pra ordenar.
      </p>
      <NewsletterTable subscribers={subscribers ?? []} />
    </div>
  );
}
