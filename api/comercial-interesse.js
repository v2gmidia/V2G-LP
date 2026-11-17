'use strict';

const crypto = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const { validarInteresse } = require('./_comercial-interesse');
const { enviarHandoff, destino } = require('./_comercial-handoff');
const {oficial}=require('./_ambiente-comercial');

// QA exclusivamente: a LP publicada continua em /api/pre-cadastro.
const simulados = [];
let proximoId = 1;
const QA_DB_ORIGIN = 'https://zskpijnqgkqwxksqmzmf.supabase.co';
function bancoQaValido() {
  try {
    const u = new URL(process.env.SUPABASE_URL);
    return u.origin === QA_DB_ORIGIN && u.pathname === '/' && !u.search && !u.hash;
  } catch { return false; }
}
const semHorarioConsentimento = record => ({ ...record, consent: { text: record.consent.text } });
const mesmoInteresse = (a, b) => isDeepStrictEqual(semHorarioConsentimento(a), semHorarioConsentimento(b));
const permitido = (req) => {
  if(oficial())return req.headers.host==='www.v2gmidia.com.br';
  if (process.env.V2G_COMMERCIAL_ENTRY_V1_ENABLED !== '1' || process.env.VERCEL_ENV === 'production') return false;
  const host = String(req.headers.host || '').toLowerCase();
  if (process.env.LEADS_SIMULAR === '1') return /^localhost:\d+$|^127\.0\.0\.1:\d+$/.test(host);
  return process.env.VERCEL_ENV === 'preview' && !!process.env.V2G_COMMERCIAL_QA_HOST &&
    host === process.env.V2G_COMMERCIAL_QA_HOST.toLowerCase();
};
const origemValida = (req) => {
  try {
    const origin = req.headers.origin;
    if (origin) return new URL(origin).host === req.headers.host &&
      (new URL(origin).protocol === 'https:' || process.env.LEADS_SIMULAR === '1');
    return req.headers['sec-fetch-site'] === 'same-origin';
  } catch { return false; }
};
const json = (req) => String(req.headers.accept || '').includes('json') ||
  String(req.headers['content-type'] || '').includes('json');
const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function responder(req, res, status, value) {
  res.statusCode = status;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (json(req)) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify(value));
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const msg = value.ok ? (value.simulado ? 'Prévia local: interesse registrado apenas nesta simulação.' :
    'Interesse recebido. Continue para revisar seus dados.') : (value.erro || 'Confira os campos.');
  const retomar = value.retomar;
  const form = retomar ? `<form id="retomar" action="${esc(retomar.url)}" method="post"><input type="hidden" name="reference" value="${esc(retomar.reference)}"><input type="hidden" name="resumeToken" value="${esc(retomar.resumeToken)}"><button type="submit">Continuar</button></form><script>document.getElementById('retomar').submit()</script>` : '';
  return res.end('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>V2G — Interesse</title><body><main><p>' + esc(msg) + '</p>' + form + '<a href="/#pre-cadastro">Voltar</a></main></body></html>');
}
function corpo(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return Object.fromEntries(new URLSearchParams(req.body)); }
  }
  return {};
}
function ipHash(req) {
  const ip = String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  const salt = process.env.IP_HASH_SALT || (process.env.LEADS_SIMULAR === '1' ? 'salt-local-de-teste' : '');
  return salt ? crypto.createHash('sha256').update(salt + '|' + ip).digest('hex') : null;
}
async function persistir(record, hash) {
  if (process.env.LEADS_SIMULAR === '1') {
    const anterior = simulados.find(r => r.record.reference === record.reference);
    if (anterior) return anterior.hash === hash && mesmoInteresse(anterior.record, record)
      ? { ok: true, id: anterior.id, record: anterior.record }
      : { ok: false, motivo: 'divergente' };
    const recentes = simulados.filter(r => r.hash === hash && r.at > Date.now() - 3600000);
    if (recentes.length >= 5) return { ok: false, motivo: 'limite' };
    const id = String(proximoId++);
    simulados.push({ id, record, hash, at: Date.now() });
    return { ok: true, id, record };
  }
  if ((!oficial()&&!bancoQaValido()) || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('banco não confirmado');
  const rpc=oficial()?'inserir_lead_comercial_v1':'inserir_lead_lp_comercial_qa';
  const response = await fetch(process.env.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/rpc/'+rpc, {
    method: 'POST', headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ p_record: record, p_ip_hash: hash }), signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error('persistência QA recusada');
  return response.json();
}

module.exports = async function handler(req, res) {
  if (!permitido(req)) return responder(req, res, 404, { ok: false, erro: 'Indisponível.' });
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return responder(req, res, 405, { ok: false, erro: 'Método não permitido.' }); }
  if (!origemValida(req)) return responder(req, res, 403, { ok: false, erro: 'Envio recusado.' });
  const b = corpo(req);
  if (JSON.stringify(b).length > 24000) return responder(req, res, 413, { ok: false, erro: 'Envio muito grande.' });
  if (typeof b.empresa_url === 'string' && b.empresa_url.trim()) return responder(req, res, 200, { ok: true, simulado: true });
  const validado = validarInteresse(b,undefined,{documentoFlexivel:oficial()});
  if (!validado.ok) return responder(req, res, 422, { ok: false, erro: 'Confira os campos marcados.', campos: validado.campos });
  const hash = ipHash(req);
  if (!hash) return responder(req, res, 503, { ok: false, erro: 'Envio indisponível.' });
  if (process.env.LEADS_SIMULAR !== '1' && ((!oficial()&&!bancoQaValido()) || !destino() || !process.env.V2G_COMMERCIAL_LP_HANDOFF_SECRET))
    return responder(req, res, 503, { ok: false, erro: 'Continuidade indisponível.' });
  let salvo;
  try { salvo = await persistir(validado.record, hash); }
  catch { return responder(req, res, 502, { ok: false, erro: 'Não conseguimos registrar agora.' }); }
  if (salvo?.motivo === 'limite') return responder(req, res, 429, { ok: false, erro: 'Muitos envios recentes. Tente depois.' });
  if (salvo?.motivo === 'divergente') return responder(req, res, 409, { ok: false, erro: 'Este envio já foi registrado com dados diferentes. Atualize a página para iniciar outro.' });
  if (salvo?.ok !== true || !/^[1-9][0-9]{0,18}$/.test(String(salvo.id)) || BigInt(salvo.id) > 9223372036854775807n)
    return responder(req, res, 502, { ok: false, erro: 'Registro não confirmado.' });
  if (!salvo.record || salvo.record.reference !== validado.record.reference || !mesmoInteresse(salvo.record, validado.record))
    return responder(req, res, 502, { ok: false, erro: 'Registro não confirmado.' });
  if (!destino()) return responder(req, res, 200, { ok: true, simulado: true });
  try {
    const retomar = await enviarHandoff(salvo.record, salvo.id);
    return responder(req, res, 200, { ok: true, ...(process.env.LEADS_SIMULAR === '1' ? { simulado: true } : {}), retomar });
  } catch { return responder(req, res, 502, { ok: false, erro: 'Registro recebido, mas a continuidade está indisponível. Fale com a equipe antes de reenviar.' }); }
};

module.exports._simulados = simulados;
module.exports._permitido = permitido;
