"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { stripe } from "@/lib/stripe";
import { deleteZoomMeeting } from "@/lib/zoom";

export async function upsertSessionType(formData: FormData) {
  const supabase = createServiceClient();
  const id = formData.get("id") as string | null;

  const payload = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    duration_minutes: Number(formData.get("duration_minutes")),
    price_cents: Math.round(Number(formData.get("price")) * 100),
    active: formData.get("active") === "on",
  };

  if (id) {
    await supabase.from("session_types").update(payload).eq("id", id);
  } else {
    await supabase.from("session_types").insert(payload);
  }

  revalidatePath("/admin/tipos");
  revalidatePath("/agendar");
}

export async function deleteSessionType(id: string) {
  const supabase = createServiceClient();
  await supabase.from("session_types").delete().eq("id", id);
  revalidatePath("/admin/tipos");
  revalidatePath("/agendar");
}

export async function toggleAvailabilityRule(dayOfWeek: number, startTime: string, endTime: string, active: boolean) {
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("availability_rules")
    .select("id")
    .eq("day_of_week", dayOfWeek)
    .eq("start_time", startTime)
    .eq("end_time", endTime)
    .maybeSingle();

  if (existing) {
    await supabase.from("availability_rules").update({ active }).eq("id", existing.id);
  } else {
    await supabase
      .from("availability_rules")
      .insert({ day_of_week: dayOfWeek, start_time: startTime, end_time: endTime, active });
  }
  revalidatePath("/admin/disponibilidade");
}

export async function updateTimezone(timezone: string) {
  const supabase = createServiceClient();
  await supabase.from("booking_settings").update({ timezone }).eq("id", 1);
  revalidatePath("/admin/disponibilidade");
  revalidatePath("/agendar");
}

export async function toggleMonth(period: string, enabled: boolean) {
  const supabase = createServiceClient();
  await supabase.from("month_availability").upsert({ period, enabled }, { onConflict: "period" });
  revalidatePath("/admin/disponibilidade");
  revalidatePath("/agendar");
}

export async function approveCancellation(requestId: string, bookingId: string) {
  const supabase = createServiceClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("stripe_payment_intent_id, zoom_meeting_id")
    .eq("id", bookingId)
    .single();

  let refundStatus: "none" | "refunded" | "failed" = "none";
  let refundedAt: string | null = null;

  if (booking?.stripe_payment_intent_id) {
    try {
      await stripe.refunds.create({ payment_intent: booking.stripe_payment_intent_id });
      refundStatus = "refunded";
      refundedAt = new Date().toISOString();
    } catch (err) {
      console.error("Falha ao estornar no Stripe:", err);
      refundStatus = "failed";
    }
  }

  await supabase
    .from("cancellation_requests")
    .update({ status: "approved", resolved_at: new Date().toISOString() })
    .eq("id", requestId);
  await supabase
    .from("bookings")
    .update({ status: "cancelled", refund_status: refundStatus, refunded_at: refundedAt })
    .eq("id", bookingId);

  if (booking?.zoom_meeting_id) {
    try {
      await deleteZoomMeeting(booking.zoom_meeting_id);
    } catch (err) {
      console.error("Falha ao excluir reunião Zoom:", err);
    }
  }

  revalidatePath("/admin/notificacoes");
  revalidatePath("/admin");
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin/historico");
  revalidatePath("/agendar");
}

export async function rejectCancellation(requestId: string) {
  const supabase = createServiceClient();
  await supabase
    .from("cancellation_requests")
    .update({ status: "rejected", resolved_at: new Date().toISOString() })
    .eq("id", requestId);
  revalidatePath("/admin/notificacoes");
}

export async function addAvailabilityRule(formData: FormData) {
  const supabase = createServiceClient();
  await supabase.from("availability_rules").insert({
    day_of_week: Number(formData.get("day_of_week")),
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
    active: true,
  });
  revalidatePath("/admin/disponibilidade");
}

export async function deleteAvailabilityRule(id: string) {
  const supabase = createServiceClient();
  await supabase.from("availability_rules").delete().eq("id", id);
  revalidatePath("/admin/disponibilidade");
}

export async function addOverride(formData: FormData) {
  const supabase = createServiceClient();
  const type = formData.get("type") as string;
  await supabase.from("availability_overrides").insert({
    date: formData.get("date") as string,
    type,
    start_time: type === "block_day" ? null : (formData.get("start_time") as string),
    end_time: type === "block_day" ? null : (formData.get("end_time") as string),
    reason: (formData.get("reason") as string) || null,
  });
  revalidatePath("/admin/disponibilidade");
}

export async function deleteOverride(id: string) {
  const supabase = createServiceClient();
  await supabase.from("availability_overrides").delete().eq("id", id);
  revalidatePath("/admin/disponibilidade");
}
