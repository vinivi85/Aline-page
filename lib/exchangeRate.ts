// Pix só funciona em BRL. Como os preços são fixados em USD, convertemos
// na hora do checkout quando o cliente escolhe pagar via Pix.
// Usa uma API pública gratuita com fallback para uma taxa fixa em .env
// (ajustável no painel admin futuramente, se o câmbio variar demais).

export async function getUsdToBrlRate(): Promise<number> {
  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD", {
      next: { revalidate: 3600 }, // cache de 1h
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.rates?.BRL) return data.rates.BRL as number;
    }
  } catch {
    // segue para o fallback
  }
  const fallback = Number(process.env.FALLBACK_USD_TO_BRL_RATE ?? "5.4");
  return fallback;
}

export function usdCentsToBrlCents(usdCents: number, rate: number): number {
  return Math.round(usdCents * rate);
}
