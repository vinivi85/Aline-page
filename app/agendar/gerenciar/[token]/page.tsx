import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import ManageBooking from "./ManageBooking";

export default async function GerenciarPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, session_types(id, name, duration_minutes, price_cents), clients(name, email)")
    .eq("manage_token", token)
    .single();

  if (!booking) notFound();

  const { data: pendingCancellation } = await supabase
    .from("cancellation_requests")
    .select("*")
    .eq("booking_id", booking.id)
    .eq("status", "pending")
    .maybeSingle();

  return (
    <ManageBooking booking={booking} token={token} pendingCancellation={!!pendingCancellation} />
  );
}
