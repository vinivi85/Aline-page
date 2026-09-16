"use client";

import { useState } from "react";

const COUNTRIES = [
  { code: "BR", name: "Brasil", dial: "+55", flag: "🇧🇷" },
  { code: "US", name: "Estados Unidos", dial: "+1", flag: "🇺🇸" },
  { code: "PT", name: "Portugal", dial: "+351", flag: "🇵🇹" },
  { code: "AR", name: "Argentina", dial: "+54", flag: "🇦🇷" },
  { code: "MX", name: "México", dial: "+52", flag: "🇲🇽" },
  { code: "CA", name: "Canadá", dial: "+1", flag: "🇨🇦" },
  { code: "ES", name: "Espanha", dial: "+34", flag: "🇪🇸" },
  { code: "IT", name: "Itália", dial: "+39", flag: "🇮🇹" },
  { code: "UK", name: "Reino Unido", dial: "+44", flag: "🇬🇧" },
  { code: "DE", name: "Alemanha", dial: "+49", flag: "🇩🇪" },
];

// Máscara progressiva de telefone brasileiro: (99) 99999-9999 (celular) ou
// (99) 9999-9999 (fixo), de acordo com a quantidade de dígitos digitados.
function formatBRPhone(digits: string) {
  const d = digits.slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  const area = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `(${area}) ${rest}`;
  const firstLen = rest.length > 8 ? 5 : 4;
  const first = rest.slice(0, firstLen);
  const second = rest.slice(firstLen);
  return `(${area}) ${first}${second ? "-" + second : ""}`;
}

export default function NewsletterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("BR");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const selectedCountry = COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0];

  function handlePhoneChange(raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (country === "BR") {
      setPhone(formatBRPhone(digits));
    } else {
      setPhone(digits);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone ? `${selectedCountry.dial} ${phone}` : null,
          phoneCountry: country,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao cadastrar.");
        setStatus("error");
        return;
      }
      setStatus("success");
      setName("");
      setEmail("");
      setPhone("");
    } catch {
      setError("Não foi possível conectar. Tente de novo.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="text-sm text-[var(--color-teal-dark)] bg-[var(--color-teal-light)] rounded-lg px-4 py-3 inline-block">
        Inscrito! Você vai receber novidades e avisos de aulões em breve. ✓
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-md mx-auto text-left">
      <label className="text-sm text-[var(--color-ink)]">
        Nome completo
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-4 py-3 text-sm bg-[var(--color-surface)]"
        />
      </label>

      <label className="text-sm text-[var(--color-ink)]">
        E-mail
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Seu melhor e-mail"
          className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-4 py-3 text-sm bg-[var(--color-surface)]"
        />
      </label>

      <label className="text-sm text-[var(--color-ink)]">
        Telefone
        <div className="mt-1 flex gap-2">
          <select
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setPhone("");
            }}
            className="rounded-lg border border-[var(--color-border)] px-2 py-3 text-sm bg-[var(--color-surface)]"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.dial}
              </option>
            ))}
          </select>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder={country === "BR" ? "(11) 91234-5678" : "Número"}
            className="flex-1 rounded-lg border border-[var(--color-border)] px-4 py-3 text-sm bg-[var(--color-surface)]"
          />
        </div>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-2 rounded-lg bg-[var(--color-orange)] hover:bg-[var(--color-orange-dark)] transition-colors text-white text-sm font-semibold px-5 py-3 disabled:opacity-40"
      >
        {status === "loading" ? "Enviando..." : "Quero me inscrever →"}
      </button>
      <p className="text-xs text-[var(--color-ink-soft)] text-center">
        Seus dados estão seguros conosco e não serão compartilhados.
      </p>
    </form>
  );
}
