# Agendamento — Aline Vicente

App de agendamento estilo Calendly, com tipos de sessão configuráveis, disponibilidade
ajustável, pagamento via Stripe (cartão + Pix) e criação automática de reunião no Zoom.

## Como rodar localmente

```bash
npm install
cp .env.example .env.local   # preencher as chaves (ver abaixo)
npm run dev
```

## Configuração necessária

### 1. Supabase
1. Crie um projeto em https://supabase.com
2. Vá em **SQL Editor** e rode o conteúdo de `supabase/schema.sql`
3. Em **Authentication → Users**, crie o usuário de login da Aline (e-mail/senha) —
   é com ele que ela entra em `/admin`
4. Copie a URL e as chaves em **Project Settings → API** para o `.env.local`

### 2. Stripe
1. Crie a conta em https://dashboard.stripe.com
2. Em **Configurações → Métodos de pagamento**, habilite **Pix** (pode exigir
   solicitar a capability — ver aviso abaixo) e **Cartão**
3. Copie a chave secreta em **Desenvolvedores → Chaves de API**
4. Configure um webhook apontando para `https://SEU_DOMINIO/api/webhooks/stripe`,
   escutando o evento `checkout.session.completed`, e copie o "signing secret"

**Aviso sobre Pix:** o Pix só liquida em BRL. Como o preço é fixo em USD, o app
converte automaticamente para BRL no momento do checkout (ver `lib/exchangeRate.ts`).
Configure `FALLBACK_USD_TO_BRL_RATE` no `.env` como uma rede de segurança caso a
cotação automática falhe.

### 3. Zoom
1. Acesse https://marketplace.zoom.us/develop/create
2. Crie um app do tipo **Server-to-Server OAuth**
3. Adicione o scope `meeting:write:admin` (ou `meeting:write` numa conta única)
4. Copie Account ID, Client ID e Client Secret para o `.env.local`

### 4. Deploy (Vercel)
1. Suba este repositório no GitHub
2. Importe no Vercel e configure as mesmas variáveis de ambiente
3. Atualize `NEXT_PUBLIC_APP_URL` para o domínio final antes do primeiro deploy
4. Aponte o webhook do Stripe para a URL de produção

## Estrutura

- `/agendar` — fluxo público: escolher tipo de sessão → data/horário → pagamento
- `/admin` — painel da Aline (login obrigatório):
  - `/admin/tipos` — criar/editar/pausar tipos de sessão e preços
  - `/admin/disponibilidade` — dias/horários recorrentes + bloqueios e aberturas pontuais
  - `/admin` — lista de próximos agendamentos e link de start do Zoom
- `supabase/schema.sql` — schema completo do banco
- `lib/availability.ts` — motor que calcula os horários livres a partir das regras
