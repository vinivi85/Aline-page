import { createServiceClient } from "@/lib/supabase/server";
import AdminSidebar from "./AdminSidebar";

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
