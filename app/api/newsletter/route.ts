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

  const normalizedEmail = email.trim().toLowerCase();
  const supabase = createServiceClient();

  const { data: existingEmail } = await supabase
    .from("newsletter_subscribers")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingEmail) {
    return NextResponse.json(
      { error: "Esse e-mail já está cadastrado na newsletter." },
      { status: 409 }
    );
  }

  if (phone) {
    const { data: existingPhone } = await supabase
      .from("newsletter_subscribers")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    if (existingPhone) {
      return NextResponse.json(
        { error: "Esse telefone já está cadastrado na newsletter." },
        { status: 409 }
      );
    }
  }

  const { error } = await supabase.from("newsletter_subscribers").insert({
    name: name.trim(),
    email: normalizedEmail,
    phone: phone ?? null,
    phone_country: phoneCountry ?? "BR",
  });

  if (error) {
    return NextResponse.json({ error: "Erro ao cadastrar. Tente novamente." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
