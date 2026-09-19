import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/requireAdmin";

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Erro ao excluir." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
