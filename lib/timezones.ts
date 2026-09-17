// Mostra sempre os dois fusos de referência (Brasil e Texas/EUA Central) nas
// telas voltadas ao cliente, independente do fuso configurado como "oficial"
// pra calcular a disponibilidade (booking_settings.timezone).

export function formatDualTime(iso: string) {
  const date = new Date(iso);
  const br = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  const us = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return { br, us };
}

export function formatDualRange(startIso: string, endIso: string) {
  const start = formatDualTime(startIso);
  const end = formatDualTime(endIso);
  return {
    br: `${start.br}–${end.br}`,
    us: `${start.us}–${end.us}`,
  };
}
