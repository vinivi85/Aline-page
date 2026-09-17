import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import AdminBookingDetail from "./AdminBookingDetail";

export default async function AdminBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, session_types(id, name, duration_minutes, price_cents), clients(name, email)")
    .eq("id", id)
    .single();

  if (!booking) notFound();

  return <AdminBookingDetail booking={booking} />;
}
