-- ══════════════════════════════════════════════════════════════════════
-- Nosso bebê — o banco da sincronização
--
-- Quem escreve e lê aqui são as duas edge functions, que rodam com a
-- service role e conferem a credencial de cada chamada:
--
--   nb-sync  → o app da mãe, autenticado por perfil + chave secreta
--   nb-cha   → a página dos convidados, autenticada pelo código do link
--
-- As tabelas ficam no schema `public` (é de lá que a API REST fala com o
-- banco), mas com RLS ligado e SEM NENHUMA POLICY, e sem permissão para
-- anon/authenticated: nenhuma chave pública alcança nenhuma linha. Por
-- isso o painel do Supabase mostra cinco avisos "RLS enabled, no policy" —
-- aqui isso é o desenho, não um esquecimento.
--
-- O prefixo `nb_` deixa o projeto livre para outras tabelas no futuro.
-- ══════════════════════════════════════════════════════════════════════

-- ── o perfil é a conta: um id público e uma chave secreta, guardada em hash
create table if not exists public.nb_perfis (
  id             uuid primary key default gen_random_uuid(),
  chave_hash     text        not null,
  dados          jsonb       not null default '{}'::jsonb,   -- o estado inteiro do app
  versao         bigint      not null default 0,
  atualizado_em  timestamptz not null default now(),
  criado_em      timestamptz not null default now()
);

-- ── o chá é a parte pública do perfil: só o que os convidados podem ver
create table if not exists public.nb_chas (
  perfil         uuid primary key references public.nb_perfis(id) on delete cascade,
  codigo         text        not null unique,                -- vai no link compartilhado
  titulo         text        not null default 'Chá de bebê',
  quando         text        not null default '',
  onde           text        not null default '',
  recado         text        not null default '',
  aberto         boolean     not null default true,          -- desligar fecha a página
  presentes      jsonb       not null default '[]'::jsonb,   -- [{id,nome,qtd,preco,tam,cat}]
  atualizado_em  timestamptz not null default now()
);

-- ── um presente, uma reserva: quem chegar depois não repete
create table if not exists public.nb_reservas (
  id         uuid primary key default gen_random_uuid(),
  perfil     uuid not null references public.nb_perfis(id) on delete cascade,
  item       text not null,
  quem       text not null,
  recado     text not null default '',
  criado_em  timestamptz not null default now()
);
create unique index if not exists nb_reservas_perfil_item on public.nb_reservas(perfil, item);

-- ── confirmação de presença; o mesmo nome atualiza a resposta anterior
create table if not exists public.nb_presencas (
  id         uuid primary key default gen_random_uuid(),
  perfil     uuid not null references public.nb_perfis(id) on delete cascade,
  quem       text not null,
  -- coluna gerada: o upsert por nome precisa de uma coluna real como alvo
  quem_chave text generated always as (lower(btrim(quem))) stored,
  pessoas    int  not null default 1,
  vai        boolean not null default true,
  recado     text not null default '',
  criado_em  timestamptz not null default now()
);
create unique index if not exists nb_presencas_perfil_quem on public.nb_presencas(perfil, quem_chave);

-- ── presentes que os convidados sugerem, para a mãe aprovar no app
create table if not exists public.nb_sugestoes (
  id         uuid primary key default gen_random_uuid(),
  perfil     uuid not null references public.nb_perfis(id) on delete cascade,
  quem       text not null,
  oque       text not null,
  aprovada   boolean not null default false,
  criado_em  timestamptz not null default now()
);
create index if not exists nb_sugestoes_perfil on public.nb_sugestoes(perfil);

-- ── RLS ligado, nenhuma policy: só a service role das functions entra
alter table public.nb_perfis    enable row level security;
alter table public.nb_chas      enable row level security;
alter table public.nb_reservas  enable row level security;
alter table public.nb_presencas enable row level security;
alter table public.nb_sugestoes enable row level security;

-- ── e as chaves públicas não recebem permissão nem para tentar
revoke all on public.nb_perfis, public.nb_chas, public.nb_reservas,
              public.nb_presencas, public.nb_sugestoes
  from anon, authenticated;
