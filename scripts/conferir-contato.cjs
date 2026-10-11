'use strict';

// Contrato HTTP do contato: só usa dados fictícios e fetch substituído.
const assert = require('node:assert/strict');
process.env.SUPABASE_URL = 'https://persistencia.exemplo.invalid';
process.env.SUPABASE_ANON_KEY = 'chave-ficticia-do-teste';
process.env.IP_HASH_SALT = 'salt-ficticio-do-teste';
process.env.LEADS_SIMULAR = '0';
const handler = require('../api/pre-cadastro');
const lead = {
  nome: 'Pessoa de teste', email: 'teste@example.com', whatsapp: '11999999999',
  negocio: 'Negócio fictício', cnpj: '11222333000181', nicho: 'servicos_locais', instagram: 'teste_ficticio',
  perfil: 'dono', vende_whatsapp: 'sim', investe_anuncios: 'nao', consentimento: 'sim',
  pagina_origem: 'http://localhost:5173/'
};
let chamadas = 0;
let resposta = { ok: true };
let statusPersistencia = 200;
let rejeitarRede = false;
global.fetch = async (url, options) => {
  chamadas++;
  assert.equal(url, 'https://persistencia.exemplo.invalid/rest/v1/rpc/inserir_lead_lp');
  const payload = JSON.parse(options.body);
  assert.equal(payload.p_email, lead.email);
  assert.equal(payload.p_cnpj, undefined); // schema/RPC atual não guarda CNPJ da LP
  assert.equal(payload.p_consentimento, undefined); // contrato usa texto + data no servidor
  assert.equal(payload.p_ip_hash.length, 64);
  if (rejeitarRede) throw new Error('rede fictícia indisponível');
  return new Response(JSON.stringify(resposta), { status: statusPersistencia });
};

async function enviar({ body = lead, accept = 'application/json', method = 'POST', origin = 'http://localhost:5173' } = {}) {
  const req = { method, body, headers: { host: 'localhost:5173', origin, accept }, socket: { remoteAddress: '127.0.0.1' } };
  let raw = '';
  const headers = {};
  const res = { statusCode: 200, setHeader: (k, v) => { headers[k] = v; }, end: (v) => { raw = v; } };
  await handler(req, res);
  return { status: res.statusCode, headers, raw, json: accept.includes('json') ? JSON.parse(raw) : null };
}

(async () => {
  let r = await enviar();
  assert.equal(r.status, 200);
  assert.equal(r.json.ok, true);
  assert.equal(new URL(r.json.contato_url).host, 'wa.me');
  assert.equal(new URL(r.json.contato_url).pathname, '/5521999689689');
  assert.equal(r.json.simulado, undefined);
  assert.equal(r.headers['Cache-Control'], 'no-store');
  assert.ok(!r.raw.includes(lead.email));
  assert.ok(!r.raw.includes(lead.whatsapp));

  r = await enviar({ accept: 'text/html' });
  assert.match(r.raw, /Continuar no WhatsApp/);
  assert.match(r.raw, /lp\.v5\.css/);

  const antes = chamadas;
  r = await enviar({ body: { ...lead, empresa_url: 'robô' } });
  assert.equal(r.json.ok, true);
  assert.equal(r.json.contato_url, undefined);
  r = await enviar({ body: { ...lead, email: '' } });
  assert.equal(r.status, 422);
  assert.equal(r.json.contato_url, undefined);
  r = await enviar({ body: { ...lead, cnpj: '11111111111111' } });
  assert.equal(r.status, 422);
  assert.equal(r.json.campos.cnpj, 'Confira o CNPJ da empresa.');
  r = await enviar({ body: { ...lead, consentimento: '' } });
  assert.equal(r.status, 422);
  assert.ok(r.json.campos.consentimento);
  r = await enviar({ origin: 'https://outro.example' });
  assert.equal(r.status, 403);
  r = await enviar({ method: 'GET' });
  assert.equal(r.status, 405);
  assert.equal(chamadas, antes);

  resposta = { ok: false, motivo: 'limite' };
  r = await enviar();
  assert.equal(r.status, 429);
  assert.equal(r.json.contato_url, undefined);

  const logOriginal = console.error;
  console.error = () => {};
  try {
    resposta = { ok: false, motivo: 'invalido' };
    r = await enviar({ accept: 'text/html' });
    assert.equal(r.status, 422);
    assert.ok(!r.raw.includes('wa.me'));
    resposta = { ok: 'true' };
    r = await enviar();
    assert.equal(r.status, 422);
    statusPersistencia = 503;
    r = await enviar();
    assert.equal(r.status, 502);
    assert.equal(r.json.contato_url, undefined);
    statusPersistencia = 200;
    rejeitarRede = true;
    r = await enviar();
    assert.equal(r.status, 502);
    assert.equal(r.json.contato_url, undefined);
  } finally { console.error = logOriginal; }

  process.env.LEADS_SIMULAR = '1';
  r = await enviar();
  assert.equal(r.status, 200);
  assert.equal(r.json.simulado, true);
  r = await enviar({ accept: 'text/html' });
  assert.match(r.raw, /nenhum contato foi salvo/);
  console.log('Contato: CNPJ, sucesso, falhas, consentimento, origem, honeypot, no-JS e simulação conferidos. Nenhuma chamada externa.');
})().catch((erro) => { console.error(erro); process.exitCode = 1; });
