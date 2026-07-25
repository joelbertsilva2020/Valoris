-- =============================================================================
-- Valoris Hub — Migração 002 (Portal do Cliente v2)
-- =============================================================================
-- Rode SÓ este arquivo no SQL Editor do Supabase (o schema.sql original já
-- foi rodado antes — isso aqui só ACRESCENTA o que falta, não mexe no que
-- já existe).
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- parceiros
-- Prepara o Hub para múltiplos parceiros. No MVP só "nosso_pay" está de
-- fato integrado (via CobranSaaS) — os demais existem só para aparecer no
-- carrossel da tela inicial do Portal.
-- -----------------------------------------------------------------------------
create table if not exists parceiros (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  logo_texto text,
  integrado boolean not null default false,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

insert into parceiros (slug, nome, logo_texto, integrado)
values
  ('nosso_pay', 'Nosso Pay', 'NP', true),
  ('creditfy', 'Creditfy', 'CF', false),
  ('saldo_certo', 'Saldo Certo', 'SC', false)
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- clientes
-- Cadastro único da pessoa no Valoris Hub (independe do parceiro/contrato).
-- Identificado por CPF. Usado para reconhecer o cliente em acessos futuros
-- com CPF + data de nascimento, sem senha.
-- -----------------------------------------------------------------------------
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  cpf text not null unique,
  nome text not null,
  data_nascimento date not null,
  email text,
  telefone text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- eventos_portal
-- Trilha da jornada do cliente no Portal (funil), para alimentar o ERP
-- futuramente sem precisar mudar a estrutura depois.
-- -----------------------------------------------------------------------------
create table if not exists eventos_portal (
  id uuid primary key default gen_random_uuid(),
  cpf text,
  cliente_id uuid references clientes (id) on delete set null,
  tipo text not null check (tipo in (
    'cpf_consultado', 'cpf_encontrado', 'cpf_nao_encontrado',
    'cadastro_realizado', 'validacao_retorno',
    'proposta_visualizada', 'proposta_escolhida',
    'acordo_efetivado', 'abandono_jornada'
  )),
  detalhe jsonb,
  criado_em timestamptz not null default now()
);

create index if not exists idx_eventos_cpf on eventos_portal (cpf);
create index if not exists idx_eventos_tipo on eventos_portal (tipo);

-- -----------------------------------------------------------------------------
-- Vínculos novos nas tabelas existentes (sem quebrar o que já tem dado)
-- -----------------------------------------------------------------------------
alter table devedores add column if not exists parceiro_id uuid references parceiros (id);
alter table negociacoes add column if not exists cliente_id uuid references clientes (id);

-- -----------------------------------------------------------------------------
-- Segurança (mesma regra do schema original: só a Service Role Key acessa)
-- -----------------------------------------------------------------------------
alter table parceiros enable row level security;
alter table clientes enable row level security;
alter table eventos_portal enable row level security;
