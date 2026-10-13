-- Aplicada em 12/10/2026 ao V2G-SITE após autorização específica de Victor.
-- Projeto alvo: V2G-SITE (ushccxpoxjikzqnwhgfd), banco da LP publicada.
-- A LP mantém LEADS_CNPJ_RPC_ENABLED=0 até esta migration ser aplicada.
-- A função antiga permanece para evitar interrupção durante a transição;
-- após a LP nova estar publicada e verificada, revogar/remover a antiga.

begin;

alter table public.leads_lp add column if not exists cnpj text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.leads_lp'::regclass
      and conname = 'leads_lp_cnpj_formato'
  ) then
    alter table public.leads_lp
      add constraint leads_lp_cnpj_formato
      check (cnpj is null or cnpj ~ '^[0-9]{14}$');
  end if;
end;
$$;

comment on column public.leads_lp.cnpj is
  'CNPJ informado no pré-cadastro. Dígitos conferidos; situação cadastral ativa ainda exige verificação antes da compra. Nulo apenas para leads anteriores à mudança.';

create or replace function public.inserir_lead_lp(
  p_nome text, p_whatsapp text, p_email text, p_negocio text,
  p_nicho text, p_nicho_outro text, p_instagram text, p_perfil text,
  p_vende_whatsapp boolean, p_investe_anuncios boolean,
  p_faixa_investimento text, p_site text, p_consentimento_texto text,
  p_utm_source text, p_utm_medium text, p_utm_campaign text,
  p_utm_content text, p_pagina_origem text, p_ip_hash text,
  p_cnpj text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recentes int;
  v_soma int;
  v_digito int;
  v_i int;
  v_pesos_1 int[] := array[5,4,3,2,9,8,7,6,5,4,3,2];
  v_pesos_2 int[] := array[6,5,4,3,2,9,8,7,6,5,4,3,2];
begin
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('ok', false, 'motivo', 'invalido', 'campo', 'ip_hash');
  end if;
  if p_consentimento_texto is null or char_length(p_consentimento_texto) < 10 then
    return jsonb_build_object('ok', false, 'motivo', 'invalido', 'campo', 'consentimento');
  end if;
  if p_cnpj is null or p_cnpj !~ '^[0-9]{14}$'
    or p_cnpj = repeat(left(p_cnpj, 1), 14) then
    return jsonb_build_object('ok', false, 'motivo', 'invalido', 'campo', 'cnpj');
  end if;
  v_soma := 0;
  for v_i in 1..12 loop
    v_soma := v_soma + substring(p_cnpj from v_i for 1)::int * v_pesos_1[v_i];
  end loop;
  v_digito := case when v_soma % 11 < 2 then 0 else 11 - v_soma % 11 end;
  if substring(p_cnpj from 13 for 1)::int <> v_digito then
    return jsonb_build_object('ok', false, 'motivo', 'invalido', 'campo', 'cnpj');
  end if;
  v_soma := 0;
  for v_i in 1..13 loop
    v_soma := v_soma + substring(p_cnpj from v_i for 1)::int * v_pesos_2[v_i];
  end loop;
  v_digito := case when v_soma % 11 < 2 then 0 else 11 - v_soma % 11 end;
  if substring(p_cnpj from 14 for 1)::int <> v_digito then
    return jsonb_build_object('ok', false, 'motivo', 'invalido', 'campo', 'cnpj');
  end if;

  perform pg_advisory_xact_lock(hashtextextended('leads_lp:' || p_ip_hash, 0));
  select count(*) into v_recentes
    from public.leads_lp
   where ip_hash = p_ip_hash and criado_em > now() - interval '1 hour';
  if v_recentes >= 5 then
    return jsonb_build_object('ok', false, 'motivo', 'limite');
  end if;

  begin
    insert into public.leads_lp (
      nome, whatsapp, email, negocio, cnpj, nicho, nicho_outro,
      instagram, perfil, vende_whatsapp, investe_anuncios,
      faixa_investimento, site, consentimento_em, consentimento_texto,
      utm_source, utm_medium, utm_campaign, utm_content,
      pagina_origem, ip_hash
    ) values (
      btrim(p_nome), p_whatsapp, lower(btrim(p_email)), btrim(p_negocio),
      p_cnpj, p_nicho, nullif(btrim(p_nicho_outro), ''), lower(p_instagram),
      p_perfil, p_vende_whatsapp, p_investe_anuncios, p_faixa_investimento,
      nullif(btrim(p_site), ''), now(), p_consentimento_texto,
      nullif(p_utm_source, ''), nullif(p_utm_medium, ''),
      nullif(p_utm_campaign, ''), nullif(p_utm_content, ''),
      nullif(p_pagina_origem, ''), p_ip_hash
    );
  exception
    when check_violation or not_null_violation or string_data_right_truncation then
      return jsonb_build_object('ok', false, 'motivo', 'invalido');
  end;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.inserir_lead_lp(
  text,text,text,text,text,text,text,text,boolean,boolean,
  text,text,text,text,text,text,text,text,text,text
) from public, anon, authenticated, service_role;
grant execute on function public.inserir_lead_lp(
  text,text,text,text,text,text,text,text,boolean,boolean,
  text,text,text,text,text,text,text,text,text,text
) to anon;

commit;
