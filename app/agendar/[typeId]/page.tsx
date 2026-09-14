import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import BookingFlow from "./BookingFlow";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ typeId: string }>;
}) {
  const { typeId } = await params;
  const supabase = createServiceClient();
  const { data: sessionType } = await supabase
    .from("session_types")
    .select("*")
    .eq("id", typeId)
    .eq("active", true)
    .single();

  if (!sessionType) notFound();

  return <BookingFlow sessionType={sessionType} />;
}
