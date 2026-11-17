'use strict';
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const handler = require('../api/comercial-interesse');
const configHandler = require('../api/comercial-config');
const { validarInteresse } = require('../api/_comercial-interesse');

const agency = {
  nome: 'Pessoa QA', whatsapp: '11999990000', email: 'qa@example.test',
  negocio: 'Agência QA', cnpj: '11222333000181', perfil: 'agencia',
  quantidade_anunciantes: '2', nomes_anunciantes: 'Anunciante A\nAnunciante B',
  consentimento: 'sim', empresa_url: '', utm_source: 'ig', utm_medium: 'social',
  pagina_origem: 'http://localhost:5176/'
  , solicitacao_id: '11111111-1111-4111-8111-111111111111'
};
const direct = { ...agency, perfil: 'dono', negocio: 'Loja QA',
  solicitacao_id: '22222222-2222-4222-8222-222222222222',
  nicho: 'loja_varejo', instagram: 'loja_qa', vende_whatsapp: 'sim',
  investe_anuncios: 'nao', quantidade_anunciantes: undefined, nomes_anunciantes: undefined };
function request(body = agency, opts = {}) {
  const host = opts.host || 'localhost:5176';
  const origin = opts.origin === undefined ? 'http://' + host : opts.origin;
  const req = { method: opts.method || 'POST', body, headers: {
    host, origin, accept: opts.accept || 'application/json', 'content-type': 'application/json',
    'x-real-ip': opts.ip || '127.0.0.1'
  }, socket: { remoteAddress: '127.0.0.1' } };
  let raw = ''; const headers = {};
  const res = { statusCode: 200, setHeader(k,v) { headers[k] = v; }, end(v) { raw = v; } };
  return handler(req,res).then(() => ({ status: res.statusCode, headers, raw,
    value: req.headers.accept.includes('json') ? JSON.parse(raw) : null }));
}
function config(host='localhost:5176') {
  let raw=''; const headers={};
  const res={statusCode:200,setHeader(k,v){headers[k]=v;},end(v){raw=v;}};
  configHandler({method:'GET',headers:{host}},res);
  return {status:res.statusCode,headers,raw};
}
async function main() {
  const deployment = require('../vercel.json');
  const csp = deployment.headers.flatMap(h => h.headers).find(h => h.key === 'Content-Security-Policy').value;
  assert.ok(csp.includes("form-action 'self' https://v2g-webapp-qa.vercel.app https://app.v2gmidia.com.br;"), 'Retomada por POST deve permitir apenas QA e domínio oficial.');
  assert.ok(!csp.includes('unsafe-inline') && !csp.includes('form-action *'), 'Preservar a proteção dos scripts e não abrir destinos arbitrários.');
  const oldFetch = global.fetch;
  const oldEnv = { ...process.env };
  try {
    process.env.V2G_COMMERCIAL_ENTRY_V1_ENABLED = '0';
    process.env.LEADS_SIMULAR = '1';
    assert.equal(config().status,404);
    assert.equal((await request()).status, 404);
    process.env.V2G_COMMERCIAL_ENTRY_V1_ENABLED = '1';
    assert.equal(config().status,200);
    assert.deepEqual(JSON.parse(config().raw),{enabled:true});
    process.env.VERCEL_ENV = 'production';
    assert.equal(config().status,404);
    assert.equal((await request()).status, 404);
    delete process.env.VERCEL_ENV;
    assert.equal((await request(agency, {origin:'https://outro.example'})).status, 403);
    assert.equal((await request(agency, {method:'GET'})).status, 405);
    assert.equal((await request({...agency, nomes_anunciantes:'Só um'})).status, 422);
    assert.equal((await request({...agency, consentimento:''})).status, 422);
    assert.equal((await request({...agency, empresa_url:'robô'})).status, 200);
    assert.equal(handler._simulados.length, 0);
    const cem = Array.from({length:100}, (_,i) => 'Anunciante ' + String(i+1).padStart(3,'0')).join('\n');
    const cemValidados = validarInteresse({...agency, quantidade_anunciantes:'100', nomes_anunciantes:cem});
    assert.equal(cemValidados.ok, true);
    assert.equal(cemValidados.record.data.units.length, 100);
    assert.equal(new Set(cemValidados.record.data.units.map(u=>u.id)).size, 100);
    assert.equal(validarInteresse({...agency, quantidade_anunciantes:'2',
      nomes_anunciantes:'Mesmo nome\nMesmo nome'}).ok, true, 'Nome igual não prova mesma identidade.');
    assert.equal(validarInteresse({...agency, quantidade_anunciantes:'100',
      nomes_anunciantes:cem + 'x'.repeat(13000)}).ok, false);
    let r = await request();
    assert.equal(r.status, 200);
    assert.equal(r.value.simulado, true);
    assert.equal(r.headers['Cache-Control'], 'no-store');
    assert.equal(handler._simulados.length, 1);
    const saved = handler._simulados[0];
    assert.equal(saved.id, '1');
    assert.equal(saved.record.data.contractorType, 'agency');
    assert.equal(saved.record.data.units.length, 2);
    assert.deepEqual(saved.record.data.units.map(x => x.advertiserName), ['Anunciante A','Anunciante B']);
    assert.ok(!('vendeWhatsApp' in saved.record.data));
    assert.ok(!('periodo' in saved.record.data));
    assert.ok(!('metodo' in saved.record.data));
    assert.equal(saved.record.briefingDireto, null);
    const replay = await request();
    assert.equal(replay.status, 200);
    assert.equal(handler._simulados.length, 1);
    assert.equal((await request({...agency, negocio:'Agência alterada'})).status, 409);
    assert.equal(handler._simulados.length, 1);
    r = await request(direct, {ip:'127.0.0.2'});
    assert.equal(r.status, 200);
    assert.equal(handler._simulados[1].record.data.contractorType, 'direct');
    assert.equal(handler._simulados[1].record.data.units.length, 1);
    assert.equal(handler._simulados[1].record.briefingDireto.instagram, 'loja_qa');

    const secret = 'segredo-ficticio-para-qa-com-mais-de-32-caracteres';
    process.env.V2G_COMMERCIAL_LP_HANDOFF_SECRET = secret;
    process.env.V2G_COMMERCIAL_WEBAPP_ENTRY_URL = 'http://localhost:3000/api/comercial/entrada';
    let handoffs = 0;
    global.fetch = async (url, options) => {
      assert.equal(url, process.env.V2G_COMMERCIAL_WEBAPP_ENTRY_URL);
      handoffs++;
      const body = JSON.parse(options.body);
      assert.equal(body.sourceSystem, 'v2g_site.commercial_leads.v1');
      assert.equal(body.leadId, String(handler._simulados.at(-1).id));
      assert.equal(body.data.reference, body.reference);
      assert.equal(body.data.contractorType, 'agency');
      assert.equal(body.data.units.length, 2);
      assert.equal(body.consent.text, handler._simulados.at(-1).record.consent.text);
      assert.equal(body.attribution.utm_source, 'ig');
      assert.ok(!('periodo' in body.data) && !('metodo' in body.data) && !('vendeWhatsApp' in body.data));
      assert.equal(options.headers['x-v2g-signature'], createHmac('sha256', secret).update(options.body).digest('hex'));
      return new Response(JSON.stringify({reference:body.reference,resumeToken:'a'.repeat(64)}), {status:200});
    };
    const agencyHandoff = {...agency, solicitacao_id:'33333333-3333-4333-8333-333333333333'};
    r = await request(agencyHandoff, {ip:'127.0.0.3'});
    assert.equal(r.status, 200);
    assert.equal(handoffs, 1);
    assert.equal(r.value.retomar.url, 'http://localhost:3000/api/comercial/retomar');
    assert.equal(r.value.retomar.resumeToken, 'a'.repeat(64));
    assert.ok(!r.value.retomar.url.includes('a'.repeat(64)));
    assert.ok(!r.raw.includes(agency.email));
    let falhas = 0;
    global.fetch = async () => { falhas++; throw new Error('falha simulada após persistir'); };
    const aposFalha = {...agency, solicitacao_id:'44444444-4444-4444-8444-444444444444'};
    r = await request(aposFalha, {ip:'127.0.0.4'});
    assert.equal(r.status, 502);
    const quantidadeAposFalha = handler._simulados.length;
    let consentAtOriginal = handler._simulados.at(-1).record.consent.at;
    global.fetch = async (url, options) => {
      const body = JSON.parse(options.body);
      assert.equal(body.leadId, handler._simulados.at(-1).id);
      assert.equal(body.consent.at, consentAtOriginal);
      return new Response(JSON.stringify({reference:body.reference,resumeToken:'c'.repeat(64)}),{status:200});
    };
    r = await request(aposFalha, {ip:'127.0.0.4'});
    assert.equal(r.status, 200);
    assert.equal(handler._simulados.length, quantidadeAposFalha);
    assert.equal(falhas, 1);

    // Exercita o caminho de persistência HTTP real com rede inteiramente substituída.
    process.env.LEADS_SIMULAR = '0'; process.env.VERCEL_ENV = 'preview';
    process.env.V2G_COMMERCIAL_QA_HOST = 'lp-qa.example.test';
    process.env.V2G_COMMERCIAL_WEBAPP_ENTRY_URL = 'https://v2g-webapp-qa.vercel.app/api/comercial/entrada';
    process.env.SUPABASE_URL = 'https://zskpijnqgkqwxksqmzmf.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'chave-ficticia'; process.env.IP_HASH_SALT = 'salt-ficticio';
    let calls = 0;
    global.fetch = async (url, options) => {
      calls++;
      if (calls === 1) {
        assert.equal(url, 'https://zskpijnqgkqwxksqmzmf.supabase.co/rest/v1/rpc/inserir_lead_lp_comercial_qa');
        const payload = JSON.parse(options.body);
        assert.equal(payload.p_record.data.units.length, 2);
        assert.equal(payload.p_record.data.cnpj, agency.cnpj);
        assert.equal(payload.p_ip_hash.length, 64);
        return new Response(JSON.stringify({ok:true,id:'987',record:payload.p_record}),{status:200});
      }
      const body = JSON.parse(options.body);
      assert.equal(body.leadId, '987');
      assert.equal(body.sourceSystem, 'v2g_site.commercial_leads.v1');
      return new Response(JSON.stringify({reference:body.reference,resumeToken:'b'.repeat(64)}),{status:200});
    };
    r = await request({...agency, solicitacao_id:'55555555-5555-4555-8555-555555555555'}, {host:'lp-qa.example.test',origin:'https://lp-qa.example.test'});
    assert.equal(r.status, 200); assert.equal(calls, 2); assert.equal(r.value.simulado, undefined);
    assert.equal(r.value.retomar.url, 'https://v2g-webapp-qa.vercel.app/api/comercial/retomar');
    calls = 0;
    global.fetch = async (url) => new Response(JSON.stringify({ok:true}), {status:200});
    r = await request({...agency, solicitacao_id:'66666666-6666-4666-8666-666666666666'}, {host:'lp-qa.example.test',origin:'https://lp-qa.example.test'});
    assert.equal(r.status, 502, 'Sem ID exato o handoff não ocorre.');
    assert.equal(calls, 0);
    process.env.SUPABASE_URL = 'https://outro-banco.supabase.co';
    r = await request({...agency, solicitacao_id:'77777777-7777-4777-8777-777777777777'}, {host:'lp-qa.example.test',origin:'https://lp-qa.example.test'});
    assert.equal(r.status, 503);
    assert.equal(calls, 0);
    console.log('Comercial QA: direto/agência, origem, consentimento, gravação exata, HMAC, retomada por POST, falhas fechadas e legado isolado. Rede substituída.');
  } finally { global.fetch = oldFetch; process.env = oldEnv; }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
