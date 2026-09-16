-- ============================================================
-- Agendamento Aline — Supabase schema
-- ============================================================

-- Tipos de sessão (configurável pelo painel admin)
create table session_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,                    -- ex: "Sessão avulsa"
  description text,                      -- ex: "Consulta individual de acompanhamento"
  duration_minutes int not null,         -- ex: 50
  price_cents int not null,              -- em centavos de USD, ex: 9700 = $97.00
  currency text not null default 'usd',
  color text default '#7C6A5C',          -- cor de identificação no admin/calendário
  active boolean not null default true,  -- permite pausar sem deletar
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Regras de disponibilidade recorrente (ex: toda segunda 14h-18h)
create table availability_rules (
  id uuid primary key default gen_random_uuid(),
  day_of_week int not null check (day_of_week between 0 and 6), -- 0=domingo ... 6=sábado
  start_time time not null,              -- ex: '14:00'
  end_time time not null,                -- ex: '18:00'
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Exceções pontuais: bloquear um dia específico (férias, feriado)
-- ou abrir um horário fora da regra recorrente
create table availability_overrides (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  type text not null check (type in ('block_day', 'block_range', 'open_range')),
  start_time time,       -- usado só quando type != 'block_day'
  end_time time,
  reason text,
  created_at timestamptz not null default now()
);

-- Buffer entre sessões e limites gerais (linha única de config)
create table booking_settings (
  id int primary key default 1,
  buffer_minutes int not null default 15,
  min_notice_hours int not null default 12,   -- não deixa agendar em cima da hora
  max_days_ahead int not null default 45,      -- até quando no futuro pode agendar
  timezone text not null default 'America/Chicago',
  constraint single_row check (id = 1)
);
insert into booking_settings (id) values (1);

-- Clientes (criado automaticamente no primeiro agendamento)
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text,
  created_at timestamptz not null default now()
);

-- Agendamentos
create table bookings (
  id uuid primary key default gen_random_uuid(),
  session_type_id uuid not null references session_types(id),
  client_id uuid not null references clients(id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'confirmed', 'cancelled', 'completed', 'no_show')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  amount_paid_cents int,
  payment_method text,               -- 'card' | 'pix'
  zoom_meeting_id text,
  zoom_join_url text,
  zoom_start_url text,
  client_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_bookings_start_at on bookings(start_at);
create index idx_bookings_status on bookings(status);

-- Impede overlap de horário confirmado (proteção extra além da checagem no app)
create unique index idx_bookings_no_overlap
  on bookings (start_at)
  where status in ('pending_payment', 'confirmed');

-- Controle de quais meses ficam abertos para agendamento (visão macro,
-- além dos dias/horários específicos). Ausência de linha = mês aberto por padrão;
-- só precisa de registro quando um mês é explicitamente fechado.
create table month_availability (
  period text primary key,  -- formato 'YYYY-MM', ex: '2026-11'
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- Token único de gerenciamento (link que o cliente usa pra remarcar/cancelar
-- sem precisar de login)
alter table bookings add column manage_token uuid not null default gen_random_uuid();
create unique index idx_bookings_manage_token on bookings(manage_token);

-- Registro de quantas vezes uma sessão já foi remarcada (referência/auditoria)
alter table bookings add column rescheduled_count int not null default 0;

-- Solicitações de cancelamento — ficam pendentes até a Aline aprovar ou recusar
create table cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id),
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index idx_cancellation_requests_status on cancellation_requests(status);
