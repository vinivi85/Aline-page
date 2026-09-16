import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

function toICSDate(iso: string) {
  return iso.replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeICS(text: string) {
  return text.replace(/[\\,;]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, session_types(name, description), clients(name)")
    .eq("id", id)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }

  const title = escapeICS(`${booking.session_types?.name ?? "Sessão"} — Aline Vicente`);
  const description = escapeICS(
    booking.zoom_join_url
      ? `Link do Zoom: ${booking.zoom_join_url}`
      : "O link do Zoom foi enviado por e-mail."
  );

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Aline Vicente//Agendamento//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${booking.id}@aline-page.vercel.app`,
    `DTSTAMP:${toICSDate(new Date().toISOString())}`,
    `DTSTART:${toICSDate(booking.start_at)}`,
    `DTEND:${toICSDate(booking.end_at)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    booking.zoom_join_url ? `URL:${booking.zoom_join_url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="sessao-aline-vicente.ics"`,
    },
  });
}
