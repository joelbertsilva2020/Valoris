-- =============================================================================
-- Valoris Hub — Schema inicial (Módulo 0)
-- =============================================================================
-- Regra de negócio central: nenhuma tabela aqui guarda valores calculados de
-- parcela/juros/desconto/vencimento como fonte de verdade — esses dados vêm
-- sempre do CobranSaaS e são apenas espelhados/cacheados quando necessário
-- para exibição. A única métrica própria do Valoris Hub é o "Percentual de
-- Economia", calculado a partir dos valores que o CobranSaaS retorna.
--
-- Como rodar: cole este arquivo inteiro no SQL Editor do painel do Supabase
-- e clique em "Run". Pode rodar de uma vez só, do início ao fim.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensão para gerar UUIDs
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- usuarios_internos
-- Usuários do ERP Financeiro (equipe da Valoris). NÃO confundir com os
-- clientes/devedores, que não têm login — eles acessam o Portal por link
-- direto ou identificação simples (documento), sem senha.
-- -----------------------------------------------------------------------------
create table if not exists usuarios_internos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null unique,
  papel text not null default 'operador' check (papel in ('admin', 'operador')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- devedores
-- Espelho local dos devedores que já passaram pelo Portal do Cliente.
-- A fonte de verdade continua sendo o CobranSaaS; aqui guardamos só o
-- necessário para histórico e vínculo com os acordos registrados no Hub.
-- -----------------------------------------------------------------------------
create table if not exists devedores (
  id uuid primary key default gen_random_uuid(),
  cobransaas_devedor_id text not null unique,
  documento text not null,
  nome text not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_devedores_documento on devedores (documento);

-- -----------------------------------------------------------------------------
-- negociacoes
-- Registro de cada negociação iniciada no Portal do Cliente: qual dívida,
-- quais opções foram apresentadas (snapshot do que o CobranSaaS retornou) e
-- qual foi escolhida. Guardamos o snapshot porque as opções podem mudar com
-- o tempo no CobranSaaS, e o Hub precisa manter o histórico do que foi
-- efetivamente mostrado ao cliente naquele momento.
-- -----------------------------------------------------------------------------
create table if not exists negociacoes (
  id uuid primary key default gen_random_uuid(),
  devedor_id uuid not null references devedores (id) on delete cascade,
  cobransaas_divida_id text not null,
  opcoes_apresentadas jsonb not null,
  opcao_escolhida_id text,
  percentual_economia numeric(5, 2),
  status text not null default 'em_andamento'
    check (status in ('em_andamento', 'confirmada', 'expirada', 'cancelada')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_negociacoes_devedor on negociacoes (devedor_id);
create index if not exists idx_negociacoes_status on negociacoes (status);

-- -----------------------------------------------------------------------------
-- acordos
-- Confirmação final de uma negociação (retorno do CobranSaaS ao confirmar).
-- -----------------------------------------------------------------------------
create table if not exists acordos (
  id uuid primary key default gen_random_uuid(),
  negociacao_id uuid not null references negociacoes (id) on delete cascade,
  cobransaas_acordo_id text not null unique,
  confirmado_em timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- log_integracoes
-- Log simples de chamadas ao CobranSaaS (sucesso/erro), útil para depurar
-- problemas de token/IP quando sair do modo mock.
-- -----------------------------------------------------------------------------
create table if not exists log_integracoes (
  id uuid primary key default gen_random_uuid(),
  operacao text not null,
  sucesso boolean not null,
  detalhe text,
  criado_em timestamptz not null default now()
);

-- =============================================================================
-- Segurança (RLS)
-- =============================================================================
-- O backend do Valoris Hub acessa o Supabase usando a Service Role Key
-- (privilégio total, ignora RLS) — por isso, mesmo com RLS habilitado, o
-- backend continua funcionando normalmente. O RLS aqui serve para impedir
-- que qualquer outra chave (ex: chave pública, se um dia for usada no
-- frontend) consiga ler ou alterar dados diretamente.
-- =============================================================================

alter table usuarios_internos enable row level security;
alter table devedores enable row level security;
alter table negociacoes enable row level security;
alter table acordos enable row level security;
alter table log_integracoes enable row level security;

-- Nenhuma policy é criada para acesso público — de propósito. Só a Service
-- Role Key (usada pelo backend) tem acesso. Se no futuro o frontend precisar
-- falar direto com o Supabase, criamos policies específicas nesse momento.
