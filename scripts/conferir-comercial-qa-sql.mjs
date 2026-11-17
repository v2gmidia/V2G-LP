import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const require = createRequire(import.meta.url);
const { validarInteresse } = require('../api/_comercial-interesse.js');
const handler = require('../api/comercial-interesse.js');
const { PGlite } = await import(pathToFileURL('C:/Users/victo/v2g-finance/node_modules/@electric-sql/pglite/dist/index.js').href);
const sql = readFileSync(new URL('../supabase/leads_lp_comercial_qa_draft.sql', import.meta.url), 'utf8');
const db = new PGlite();
const body = { nome:'Pessoa QA', email:'qa@example.test', whatsapp:'11999990000',
  negocio:'Agência QA', cnpj:'11222333000181', perfil:'agencia',
  quantidade_anunciantes:'2', nomes_anunciantes:'Anunciante A\nAnunciante B',
  consentimento:'sim', solicitacao_id:'11111111-1111-4111-8111-111111111111',
  utm_source:'ig', pagina_origem:'http://localhost:5176/' };
const hash='a'.repeat(64);
const scalar=async(query,args=[]) => (await db.query(query,args)).rows[0].v;
const rpc=(record, ip=hash)=>scalar('select public.inserir_lead_lp_comercial_qa($1,$2) v',[record,ip]);
try {
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls; create table public.leads_lp(id bigint primary key,nome text); insert into public.leads_lp values(7,'legado preservado');");
  await db.exec(sql);
  const validado=validarInteresse(body);
  assert.equal(validado.ok,true);
  const record=validado.record;
  await db.exec('set role service_role');
  const first=await rpc(record);
  assert.equal(first.ok,true);assert.equal(first.id,'1');
  assert.equal(first.record.data.units.length,2);
  const retry=await rpc({...record,consent:{...record.consent,at:'2026-11-16T00:00:00.000Z'}});
  assert.equal(retry.id,first.id);
  assert.equal(retry.record.consent.at,record.consent.at);
  const changed=await rpc({...record,data:{...record.data,razaoSocial:'Agência diferente'}});
  assert.equal(changed.motivo,'divergente');
  for(let i=0;i<4;i++) {
    const next=validarInteresse({...body,solicitacao_id:randomUUID()});
    assert.equal((await rpc(next.record)).ok,true);
  }
  const excess=validarInteresse({...body,solicitacao_id:randomUUID()});
  assert.equal((await rpc(excess.record)).motivo,'limite');
  assert.equal((await rpc(excess.record,'b'.repeat(64))).ok,true);
  await db.exec('reset role');
  assert.equal(await scalar('select count(*)::int v from public.leads_lp_comercial_qa'),6);
  assert.equal(await scalar('select count(*)::int v from public.leads_lp'),1);
  assert.equal(await scalar('select nome v from public.leads_lp where id=7'),'legado preservado');
  assert.equal(await scalar("select relrowsecurity v from pg_class where oid='public.leads_lp_comercial_qa'::regclass"),true);
  assert.equal(await scalar("select count(*)::int v from pg_policies where tablename='leads_lp_comercial_qa'"),0);
  for(const role of ['anon','authenticated']) {
    for(const privilege of ['SELECT','INSERT','UPDATE','DELETE'])
      assert.equal(await scalar('select has_table_privilege($1,$2,$3) v',[role,'public.leads_lp_comercial_qa',privilege]),false);
    assert.equal(await scalar("select has_function_privilege($1,'public.inserir_lead_lp_comercial_qa(jsonb,text)','EXECUTE') v",[role]),false);
  }
  assert.equal(await scalar("select has_function_privilege('service_role','public.inserir_lead_lp_comercial_qa(jsonb,text)','EXECUTE') v"),true);
  await db.exec('set role anon');
  await assert.rejects(rpc(record),/permission denied/);
  await assert.rejects(db.query('select * from public.leads_lp_comercial_qa'),/permission denied/);
  await db.exec('reset role');
  // O caminho HTTP precisa aceitar o JSONB real devolvido pelo banco,
  // cuja ordem de propriedades difere da ordem construída pelo formulário.
  const oldFetch = global.fetch;
  const oldEnv = { ...process.env };
  const httpBody = { ...body, solicitacao_id: randomUUID() };
  let handoffs = 0;
  let storedRecord;
  let corruptResponse = false;
  try {
    Object.assign(process.env, {
      LEADS_SIMULAR: '0', VERCEL_ENV: 'preview', V2G_COMMERCIAL_ENTRY_V1_ENABLED: '1',
      V2G_COMMERCIAL_QA_HOST: 'lp-qa.example.test',
      SUPABASE_URL: 'https://zskpijnqgkqwxksqmzmf.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'chave-ficticia-local', IP_HASH_SALT: 'salt-ficticio-local',
      V2G_COMMERCIAL_LP_HANDOFF_SECRET: 'segredo-ficticio-local-com-mais-de-32-caracteres',
      V2G_COMMERCIAL_WEBAPP_ENTRY_URL: 'https://v2g-webapp-qa.vercel.app/api/comercial/entrada'
    });
    await db.exec('set role service_role');
    global.fetch = async (url, options) => {
      if (url.endsWith('/rpc/inserir_lead_lp_comercial_qa')) {
        const args = JSON.parse(options.body);
        const result = await rpc(args.p_record, args.p_ip_hash);
        storedRecord = result.record;
        if (corruptResponse) result.record.data.nome = 'Outra Pessoa QA';
        return new Response(JSON.stringify(result), { status: 200 });
      }
      assert.equal(url, process.env.V2G_COMMERCIAL_WEBAPP_ENTRY_URL);
      handoffs++;
      const sent = JSON.parse(options.body);
      assert.deepEqual(sent.data, storedRecord.data);
      assert.equal(sent.consent.at, storedRecord.consent.at);
      return new Response(JSON.stringify({ reference: sent.reference, resumeToken: 'e'.repeat(64) }), { status: 200 });
    };
    const send = async () => {
      let raw;
      const res = { statusCode: 200, setHeader() {}, end(value) { raw = value; } };
      await handler({ method: 'POST', body: httpBody, headers: {
        host: 'lp-qa.example.test', origin: 'https://lp-qa.example.test',
        accept: 'application/json', 'content-type': 'application/json', 'x-real-ip': '127.0.0.88'
      } }, res);
      return { status: res.statusCode, value: JSON.parse(raw) };
    };
    const firstHttp = await send();
    assert.equal(firstHttp.status, 200, 'JSONB real não pode virar divergência pela ordem das chaves.');
    assert.equal(firstHttp.value.ok, true);
    const retryHttp = await send();
    assert.equal(retryHttp.status, 200);
    assert.equal(retryHttp.value.retomar.reference, firstHttp.value.retomar.reference);
    assert.equal(handoffs, 2);
    corruptResponse = true;
    assert.equal((await send()).status, 502, 'Mudança real no retorno deve continuar recusada.');
    assert.equal(handoffs, 2);
    await db.exec('reset role');
    assert.equal(await scalar('select count(*)::int v from public.leads_lp_comercial_qa'), 7);
    assert.equal(await scalar('select count(*)::int v from public.leads_lp'), 1);
  } finally {
    global.fetch = oldFetch;
    process.env = oldEnv;
  }
  console.log('SQL PGlite: criação, ID exato, replay, divergência, limite, grants/RLS e legado preservado. Banco descartável.');
} finally { await db.close(); }
