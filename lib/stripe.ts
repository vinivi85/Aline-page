import Stripe from "stripe";

// Usa um placeholder quando a chave ainda não foi configurada, pra não quebrar
// o build antes de o Stripe estar pronto. Chamadas reais de API vão falhar
// até a STRIPE_SECRET_KEY de verdade ser adicionada nas variáveis de ambiente.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-08-26.dahlia",
});
