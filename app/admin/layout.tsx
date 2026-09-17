import { createServiceClient } from "@/lib/supabase/server";
import AdminSidebar from "./AdminSidebar";

// Todo o painel admin mostra dados sensíveis a mudanças frequentes (status de
// agendamento, pagamentos, etc.) — nunca deve ser pré-renderizado/cacheado
// estaticamente, sempre buscar do banco a cada acesso.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServiceClient();
  const { count } = await supabase
    .from("cancellation_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <div className="min-h-screen md:flex">
      <AdminSidebar pendingCount={count ?? 0} />
      <main className="flex-1 px-6 py-8 min-w-0">{children}</main>
    </div>
  );
}
