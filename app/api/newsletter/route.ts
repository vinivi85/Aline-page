import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { name, email, phone, phoneCountry } = await req.json();

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Digite seu nome completo." }, { status: 400 });
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Digite um e-mail válido." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("newsletter_subscribers").upsert(
    {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ?? null,
      phone_country: phoneCountry ?? "BR",
    },
    { onConflict: "email" }
  );

  if (error) {
    return NextResponse.json({ error: "Erro ao cadastrar. Tente novamente." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
