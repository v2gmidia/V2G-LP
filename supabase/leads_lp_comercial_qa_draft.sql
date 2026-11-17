-- Aplicado somente na QA zskpijnqgkqwxksqmzmf em 16/11/2026.
-- Ledger MCP 20261116040816; não reaplicar nem promover por consequência.
-- Fonte separada de public.leads_lp: IDs não são intercambiáveis.
-- RPC chamada apenas pela função de servidor api/comercial-interesse.js,
-- com chave service_role guardada no servidor e URL travada no projeto QA.
begin;

create table if not exists public.leads_lp_comercial_qa (
  id bigint generated always as identity primary key,
  source_system text not null default 'v2g_site.commercial_leads.v1'
    check (source_system = 'v2g_site.commercial_leads.v1'),
  reference uuid not null unique,
  criado_em timestamptz not null default now(),
  nome text not null check (char_length(nome) between 2 and 120),
  email text not null check (char_length(email) <= 160),
  whatsapp text not null check (whatsapp ~ '^[1-9][0-9]{9,10}$'),
  razao_social text not null check (char_length(razao_social) between 2 and 120),
  cnpj text not null check (cnpj ~ '^[0-9]{14}$'),
  contractor_type text not null check (contractor_type in ('direct', 'agency')),
  contas integer not null check (contas between 1 and 100),
  unidades jsonb not null check (jsonb_typeof(unidades) = 'array'),
  briefing_direto jsonb,
  attribution jsonb not null,
  pagina_origem text,
  consentimento_em timestamptz not null,
  consentimento_texto text not null check (char_length(consentimento_texto) between 10 and 500),
  snapshot_original jsonb not null,
  registro_original jsonb not null,
  ip_hash text not null check (ip_hash ~ '^[a-f0-9]{64}$'),
  constraint comercial_qa_unidades_contagem check (jsonb_array_length(unidades) = contas),
  constraint comercial_qa_direto_conta check (contractor_type <> 'direct' or contas = 1)
);
comment on table public.leads_lp_comercial_qa is
  'QA, fonte distinta de leads_lp; ID exige namespace v2g_site.commercial_leads.v1 no handoff.';
create index if not exists leads_lp_comercial_qa_ip_em on public.leads_lp_comercial_qa(ip_hash, criado_em desc);
alter table public.leads_lp_comercial_qa enable row level security;
revoke all on table public.leads_lp_comercial_qa from public, anon, authenticated;

create or replace function public.inserir_lead_lp_comercial_qa(p_record jsonb, p_ip_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_data jsonb;
  v_consent jsonb;
  v_attribution jsonb;
  v_id bigint;
  v_reference uuid;
  v_contas integer;
  v_anterior record;
begin
  if p_record is null or p_ip_hash is null or p_ip_hash !~ '^[a-f0-9]{64}$' then
    return jsonb_build_object('ok', false, 'motivo', 'invalido');
  end if;
  v_data := p_record->'data';
  v_consent := p_record->'consent';
  v_attribution := p_record->'attribution';
  if v_data->>'schemaVersion' is distinct from 'v2g.comercial.lead.v1'
     or v_data->>'reference' is null
     or p_record->>'reference' is distinct from v_data->>'reference'
     or v_data->>'contractorType' not in ('direct','agency')
     or v_data->>'nome' is null or v_data->>'email' is null
     or v_data->>'whatsapp' is null or v_data->>'razaoSocial' is null
     or v_data->>'cnpj' is null or v_data->'units' is null
     or v_data ?| array['periodo','metodo','vendeWhatsApp','preco']
     or jsonb_typeof(v_data->'units') is distinct from 'array'
     or jsonb_typeof(v_attribution) is distinct from 'object'
     or v_consent->>'text' is null or v_consent->>'at' is null then
    return jsonb_build_object('ok', false, 'motivo', 'invalido');
  end if;
  begin
    v_reference := (p_record->>'reference')::uuid;
    v_contas := (v_data->>'contas')::integer;
  exception when invalid_text_representation or numeric_value_out_of_range then
    return jsonb_build_object('ok', false, 'motivo', 'invalido');
  end;
  if v_contas not between 1 and 100 or jsonb_array_length(v_data->'units') <> v_contas then
    return jsonb_build_object('ok', false, 'motivo', 'invalido');
  end if;

  perform pg_advisory_xact_lock(hashtextextended('leads_lp_comercial_qa_ref:' || v_reference::text, 0));
  select id, ip_hash, registro_original into v_anterior
    from public.leads_lp_comercial_qa where reference = v_reference;
  if found then
    if v_anterior.ip_hash = p_ip_hash and
       (v_anterior.registro_original #- '{consent,at}') = (p_record #- '{consent,at}') then
      return jsonb_build_object('ok', true, 'id', v_anterior.id::text, 'record', v_anterior.registro_original);
    end if;
    return jsonb_build_object('ok', false, 'motivo', 'divergente');
  end if;
  perform pg_advisory_xact_lock(hashtextextended('leads_lp_comercial_qa_ip:' || p_ip_hash, 0));
  select count(*) into v_contas from public.leads_lp_comercial_qa
    where ip_hash = p_ip_hash and criado_em > now() - interval '1 hour';
  if v_contas >= 5 then return jsonb_build_object('ok', false, 'motivo', 'limite'); end if;
  begin
    insert into public.leads_lp_comercial_qa(
      reference, nome, email, whatsapp, razao_social, cnpj, contractor_type, contas,
      unidades, briefing_direto, attribution, pagina_origem, consentimento_em,
      consentimento_texto, snapshot_original, registro_original, ip_hash
    ) values (
      v_reference, v_data->>'nome', v_data->>'email', v_data->>'whatsapp',
      v_data->>'razaoSocial', v_data->>'cnpj', v_data->>'contractorType',
      (v_data->>'contas')::integer, v_data->'units', p_record->'briefingDireto',
      v_attribution, p_record->>'paginaOrigem', (v_consent->>'at')::timestamptz,
      v_consent->>'text', v_data, p_record, p_ip_hash
    ) returning id into v_id;
  exception when check_violation or not_null_violation or string_data_right_truncation
               or invalid_datetime_format or unique_violation then
    return jsonb_build_object('ok', false, 'motivo', 'invalido');
  end;
  return jsonb_build_object('ok', true, 'id', v_id::text, 'record', p_record);
end;
$$;
revoke all on function public.inserir_lead_lp_comercial_qa(jsonb,text)
  from public, anon, authenticated, service_role;
grant execute on function public.inserir_lead_lp_comercial_qa(jsonb,text) to service_role;
commit;

-- Verificações executadas após a aplicação QA autorizada:
-- RLS ligada; zero policies; sem acesso direto de anon/authenticated;
-- RPC só service_role; retorno id corresponde exatamente à linha com reference/snapshot.
