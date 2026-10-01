/* ============================================================
   POST /api/pre-cadastro  — função de servidor da Vercel.

   1. Recusa o que não for POST e o que vier de outro site.
   2. Honeypot: se o campo invisível veio preenchido, finge sucesso e descarta.
   3. Valida tudo (api/_lead.js).
   4. Gera ip_hash = sha256(IP_HASH_SALT + IP). O IP puro nunca é guardado.
   5. Chama a função inserir_lead_lp no Supabase via REST (rpc) com a chave
      PÚBLICA (anon). A função valida de novo, aplica o limite por ip_hash
      e grava. A tabela não aceita nenhum outro acesso.

   Variáveis de ambiente (na Vercel, nunca no repositório):
     SUPABASE_URL, SUPABASE_ANON_KEY, IP_HASH_SALT
   Só para teste local:
     LEADS_SIMULAR=1  → não chama o Supabase; simula a gravação e o limite.
   ============================================================ */
'use strict';

const crypto = require('crypto');
const { validaLead } = require('./_lead');

const MSG_RECEBIDO_HTML =
  'Recebemos. Se o seu negócio fizer sentido para esta fase, a gente chama no seu WhatsApp em até 3 dias úteis.';

// Só para LEADS_SIMULAR=1: memória do processo local.
const simulados = [];
const LIMITE_POR_HORA = 5; // o mesmo número que está na função SQL

function ipDe(req) {
  const real = req.headers['x-real-ip'];
  if (real) return String(real).trim();
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || '';
}

function origemValida(req) {
  const origem = req.headers.origin;
  if (!origem) return true; // envio sem JS / alguns navegadores não mandam
  try {
    return new URL(origem).host === req.headers.host;
  } catch (e) {
    return false;
  }
}

function queJson(req) {
  return String(req.headers.accept || '').includes('application/json') ||
    String(req.headers['content-type'] || '').includes('application/json');
}

function responde(req, res, status, corpo) {
  if (queJson(req)) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(corpo));
    return;
  }
  // Envio sem JavaScript: devolve uma página mínima.
  const msg = corpo.ok ? MSG_RECEBIDO_HTML : (corpo.erro || 'Confira os campos e tente de novo.');
  const lista = corpo.campos ? '<ul>' + Object.values(corpo.campos).map((m) => '<li>' + m + '</li>').join('') + '</ul>' : '';
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>V2G — Pré-cadastro</title><body style="font-family:system-ui,sans-serif;max-width:560px;margin:48px auto;padding:0 20px;color:#001034">' +
    '<p style="font-size:1.25rem;font-weight:700">' + msg + '</p>' + lista +
    '<p><a href="/#pre-cadastro" style="color:#0048F8">Voltar</a></p></body></html>');
}

async function leCorpo(req) {
  if (req.body && typeof req.body === 'object') return req.body; // Vercel já interpretou
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (e) { return Object.fromEntries(new URLSearchParams(req.body)); }
  }
  return {};
}

async function gravaNoSupabase(lead, ipHash) {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error('SUPABASE_URL ou SUPABASE_ANON_KEY ausente');

  const params = { p_ip_hash: ipHash };
  Object.keys(lead).forEach((k) => { params['p_' + k] = lead[k]; });

  const r = await fetch(url.replace(/\/+$/, '') + '/rest/v1/rpc/inserir_lead_lp', {
    method: 'POST',
    headers: {
      apikey: anon,
      Authorization: 'Bearer ' + anon,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(8000)
  });
  const corpo = await r.json().catch(() => null);
  if (!r.ok) throw new Error('rpc ' + r.status + ' ' + JSON.stringify(corpo));
  return corpo; // { ok: true } | { ok: false, motivo: 'limite' | 'invalido', campo? }
}

function simulaGravacao(lead, ipHash) {
  const umaHoraAtras = Date.now() - 3600 * 1000;
  const recentes = simulados.filter((s) => s.ip_hash === ipHash && s.em > umaHoraAtras).length;
  if (recentes >= LIMITE_POR_HORA) return { ok: false, motivo: 'limite' };
  simulados.push({ ip_hash: ipHash, em: Date.now() });
  console.log('[SIMULADO] lead que seria gravado:', JSON.stringify({ ...lead, ip_hash: ipHash.slice(0, 12) + '…' }));
  return { ok: true };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return responde(req, res, 405, { ok: false, erro: 'Método não permitido.' });
  }
  if (!origemValida(req)) {
    return responde(req, res, 403, { ok: false, erro: 'Envio recusado.' });
  }

  const corpo = await leCorpo(req);

  // Honeypot: robô preencheu o campo invisível. Responde "ok" e não grava nada.
  if (corpo && typeof corpo.empresa_url === 'string' && corpo.empresa_url.trim() !== '') {
    return responde(req, res, 200, { ok: true });
  }

  const v = validaLead(corpo);
  if (!v.ok) {
    return responde(req, res, 422, { ok: false, erro: 'Confira os campos marcados.', campos: v.campos });
  }

  const salt = process.env.IP_HASH_SALT || (process.env.LEADS_SIMULAR === '1' ? 'salt-local-de-teste' : '');
  if (!salt) {
    console.error('[pre-cadastro] IP_HASH_SALT ausente');
    return responde(req, res, 500, { ok: false, erro: 'Não conseguimos enviar agora. Tente de novo em alguns minutos.' });
  }
  const ipHash = crypto.createHash('sha256').update(salt + '|' + ipDe(req)).digest('hex');

  let resultado;
  try {
    resultado = process.env.LEADS_SIMULAR === '1'
      ? simulaGravacao(v.lead, ipHash)
      : await gravaNoSupabase(v.lead, ipHash);
  } catch (e) {
    console.error('[pre-cadastro] falha ao gravar:', e && e.message);
    return responde(req, res, 502, { ok: false, erro: 'Não conseguimos enviar agora. Tente de novo em alguns minutos.' });
  }

  if (resultado && resultado.ok) return responde(req, res, 200, { ok: true });
  if (resultado && resultado.motivo === 'limite') {
    return responde(req, res, 429, { ok: false, erro: 'Recebemos vários envios daqui na última hora. Tente de novo mais tarde.' });
  }
  console.error('[pre-cadastro] recusado pela função:', JSON.stringify(resultado));
  return responde(req, res, 422, { ok: false, erro: 'Confira os campos e tente de novo.' });
};
