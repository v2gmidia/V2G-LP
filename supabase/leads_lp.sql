-- ============================================================
-- V2G — leads da landing page (pré-cadastro)
--
-- O que este arquivo cria:
--   1. tabela public.leads_lp, com RLS ligada e NENHUMA política;
--   2. função public.inserir_lead_lp(...), SECURITY DEFINER, que valida,
--      aplica o limite por ip_hash (5 envios na última hora) e insere;
--   3. permissões: EXECUTE da função só para "anon". Nenhum outro acesso
--      à tabela para anon/authenticated.
--
-- Quem grava: a rota api/pre-cadastro.js (servidor da Vercel), chamando
-- POST {SUPABASE_URL}/rest/v1/rpc/inserir_lead_lp com a chave anon.
-- Quem lê: só você, pelo painel do Supabase (papel postgres).
--
-- Rodar uma vez no SQL Editor do projeto. É idempotente onde dá.
-- ============================================================

begin;

-- ---------- 1. tabela ----------
create table if not exists public.leads_lp (
  id                   bigint generated always as identity primary key,
  criado_em            timestamptz not null default now(),

  nome                 text not null check (char_length(nome) between 2 and 120),
  whatsapp             text not null check (whatsapp ~ '^[1-9][0-9]{9,10}$'),   -- DDD + número, só dígitos
  email                text not null check (char_length(email) <= 160 and email ~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  negocio              text not null check (char_length(negocio) between 2 and 120),
  nicho                text not null check (nicho in (
                         'restaurante_delivery', 'salao_estetica', 'clinica_saude', 'loja_varejo',
                         'servicos_profissionais', 'servicos_locais', 'outro')),
  nicho_outro          text check (nicho_outro is null or char_length(nicho_outro) between 2 and 80),
  instagram            text not null check (instagram ~ '^[a-z0-9._]{1,30}$'),  -- sem o @
  perfil               text not null check (perfil in ('dono', 'agencia')),
  vende_whatsapp       boolean not null,
  investe_anuncios     boolean not null,
  faixa_investimento   text check (faixa_investimento in ('ate_500', '500_2000', '2000_5000', 'acima_5000')),
  site                 text check (site is null or char_length(site) <= 200),

  consentimento_em     timestamptz not null default now(),
  consentimento_texto  text not null check (char_length(consentimento_texto) <= 500),

  utm_source           text check (utm_source   is null or char_length(utm_source)   <= 200),
  utm_medium           text check (utm_medium   is null or char_length(utm_medium)   <= 200),
  utm_campaign         text check (utm_campaign is null or char_length(utm_campaign) <= 200),
  utm_content          text check (utm_content  is null or char_length(utm_content)  <= 200),
  pagina_origem        text check (pagina_origem is null or char_length(pagina_origem) <= 300),

  ip_hash              text not null check (ip_hash ~ '^[0-9a-f]{64}$'),  -- sha256(salt|IP); o IP puro não é guardado

  -- preenchido por você quando entrar em contato; serve à regra de retenção (12 meses sem contato → apagar)
  contatado_em         timestamptz,

  constraint leads_lp_nicho_outro_coerente
    check ((nicho = 'outro') = (nicho_outro is not null)),
  constraint leads_lp_faixa_coerente
    check ((investe_anuncios and faixa_investimento is not null)
        or (not investe_anuncios and faixa_investimento is null))
);

comment on table public.leads_lp is
  'Pré-cadastros da landing page v2gmidia.com.br. Escrita só via public.inserir_lead_lp(). Retenção: apagar 12 meses após criado_em se contatado_em for nulo.';

create index if not exists leads_lp_ip_hash_criado_em_idx on public.leads_lp (ip_hash, criado_em desc);
create index if not exists leads_lp_criado_em_idx on public.leads_lp (criado_em desc);

-- RLS ligada e nenhuma política: anon e authenticated não leem nem escrevem direto.
alter table public.leads_lp enable row level security;

-- O Supabase concede privilégios de tabela a anon/authenticated por padrão. Tira tudo.
revoke all on table public.leads_lp from public, anon, authenticated;


-- ---------- 2. função de inserção ----------
create or replace function public.inserir_lead_lp(
  p_nome                text,
  p_whatsapp            text,
  p_email               text,
  p_negocio             text,
  p_nicho               text,
  p_nicho_outro         text,
  p_instagram           text,
  p_perfil              text,
  p_vende_whatsapp      boolean,
  p_investe_anuncios    boolean,
  p_faixa_investimento  text,
  p_site                text,
  p_consentimento_texto text,
  p_utm_source          text,
  p_utm_medium          text,
  p_utm_campaign        text,
  p_utm_content         text,
  p_pagina_origem       text,
  p_ip_hash             text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limite_por_hora constant int := 5;
  v_recentes int;
begin
  -- validação essencial (a rota já validou; isto protege contra chamada direta à rpc)
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('ok', false, 'motivo', 'invalido', 'campo', 'ip_hash');
  end if;
  if p_consentimento_texto is null or char_length(p_consentimento_texto) < 10 then
    return jsonb_build_object('ok', false, 'motivo', 'invalido', 'campo', 'consentimento');
  end if;

  -- limite por ip_hash: serializa envios do mesmo ip_hash para a contagem ser exata
  perform pg_advisory_xact_lock(hashtextextended('leads_lp:' || p_ip_hash, 0));

  select count(*) into v_recentes
    from public.leads_lp
   where ip_hash = p_ip_hash
     and criado_em > now() - interval '1 hour';

  if v_recentes >= v_limite_por_hora then
    return jsonb_build_object('ok', false, 'motivo', 'limite');
  end if;

  begin
    insert into public.leads_lp (
      nome, whatsapp, email, negocio, nicho, nicho_outro, instagram, perfil,
      vende_whatsapp, investe_anuncios, faixa_investimento, site,
      consentimento_em, consentimento_texto,
      utm_source, utm_medium, utm_campaign, utm_content, pagina_origem,
      ip_hash
    ) values (
      btrim(p_nome), p_whatsapp, lower(btrim(p_email)), btrim(p_negocio), p_nicho,
      nullif(btrim(p_nicho_outro), ''), lower(p_instagram), p_perfil,
      p_vende_whatsapp, p_investe_anuncios, p_faixa_investimento, nullif(btrim(p_site), ''),
      now(), p_consentimento_texto,
      nullif(p_utm_source, ''), nullif(p_utm_medium, ''), nullif(p_utm_campaign, ''),
      nullif(p_utm_content, ''), nullif(p_pagina_origem, ''),
      p_ip_hash
    );
  exception
    when check_violation or not_null_violation or string_data_right_truncation then
      -- os CHECKs da tabela são a última linha de validação
      return jsonb_build_object('ok', false, 'motivo', 'invalido');
  end;

  return jsonb_build_object('ok', true);
end;
$$;

comment on function public.inserir_lead_lp is
  'Insere um pré-cadastro da landing. Valida, limita a 5 envios por ip_hash na última hora. Chamada pela rota da Vercel com a chave anon.';


-- ---------- 3. permissões ----------
-- O Postgres concede EXECUTE a PUBLIC por padrão e o Supabase repete para
-- anon/authenticated/service_role. Tira de todos e devolve só para anon.
revoke all on function public.inserir_lead_lp(
  text, text, text, text, text, text, text, text, boolean, boolean, text, text, text, text, text, text, text, text, text
) from public, anon, authenticated, service_role;

grant execute on function public.inserir_lead_lp(
  text, text, text, text, text, text, text, text, boolean, boolean, text, text, text, text, text, text, text, text, text
) to anon;

commit;


-- ============================================================
-- Conferência (rodar depois, separado — só leitura):
--
--   select relrowsecurity from pg_class where oid = 'public.leads_lp'::regclass;      -- true
--   select count(*) from pg_policies where tablename = 'leads_lp';                   -- 0
--   select grantee, privilege_type from information_schema.role_table_grants
--    where table_name = 'leads_lp';                                                   -- sem anon/authenticated
--   select grantee from information_schema.routine_privileges
--    where routine_name = 'inserir_lead_lp';                                          -- anon (e o dono, postgres)
--
-- Retenção (12 meses sem contato) — rodar manualmente ou agendar com pg_cron:
--
--   delete from public.leads_lp
--    where contatado_em is null
--      and criado_em < now() - interval '12 months';
-- ============================================================
