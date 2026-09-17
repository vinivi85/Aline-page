import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { name, date } = await req.json();

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Digite o nome completo usado no agendamento." }, { status: 400 });
  }
  if (!date || typeof date !== "string") {
    return NextResponse.json({ error: "Escolha a data da sessão." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;

  const { data: matches, error } = await supabase
    .from("bookings")
    .select("id, start_at, manage_token, status, session_types(name), clients!inner(name, email)")
    .gte("start_at", dayStart)
    .lte("start_at", dayEnd)
    .filter("clients.name", "ilike", `%${name.trim()}%`);

  if (error) {
    return NextResponse.json({ error: "Erro ao consultar. Tente novamente." }, { status: 500 });
  }

  if (!matches || matches.length === 0) {
    return NextResponse.json(
      { error: "Nenhum agendamento encontrado com esse nome e data. Confira as informações e tente de novo." },
      { status: 404 }
    );
  }

  if (matches.length === 1) {
    return NextResponse.json({ token: matches[0].manage_token });
  }

  return NextResponse.json({
    matches: matches.map((b: any) => ({
      token: b.manage_token,
      sessionName: b.session_types?.name,
      startAt: b.start_at,
      clientName: b.clients?.name,
      status: b.status,
    })),
  });
}
