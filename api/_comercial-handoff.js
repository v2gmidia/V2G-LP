'use strict';
const { createHmac } = require('node:crypto');
const {oficial}=require('./_ambiente-comercial');

function destino(env = process.env) {
  const url = env.V2G_COMMERCIAL_WEBAPP_ENTRY_URL;
  if(oficial(env))return url;
  if (!url) return null;
  try {
    const u = new URL(url);
    const local = env.LEADS_SIMULAR === '1' && u.protocol === 'http:' &&
      ['localhost', '127.0.0.1'].includes(u.hostname) && u.port === '3000';
    const qa = env.VERCEL_ENV === 'preview' && u.origin === 'https://v2g-webapp-qa.vercel.app';
    return (local || qa) && u.pathname === '/api/comercial/entrada' && !u.search && !u.hash ? u.href : null;
  } catch { return null; }
}

async function enviarHandoff(record, leadId, env = process.env, fetchFn = fetch) {
  const secret = env.V2G_COMMERCIAL_LP_HANDOFF_SECRET;
  const url = destino(env);
  if (!url || !secret || secret.length < 32 || !/^[1-9][0-9]{0,18}$/.test(String(leadId)))
    throw new Error('handoff QA não configurado');
  const body = JSON.stringify({ schemaVersion: 'v2g.comercial.handoff.v1',
    reference: record.reference, sourceSystem: 'v2g_site.commercial_leads.v1',
    leadId: String(leadId), issuedAt: new Date().toISOString(),
    data: record.data, attribution: record.attribution, consent: record.consent });
  const signature = createHmac('sha256', secret).update(body, 'utf8').digest('hex');
  const response = await fetchFn(url, { method: 'POST', headers: {
    'Content-Type': 'application/json', 'Accept': 'application/json', 'x-v2g-signature': signature
  }, body, signal: AbortSignal.timeout(8000) });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || result.reference !== record.reference ||
      typeof result.resumeToken !== 'string' || !/^[a-f0-9]{64}$/.test(result.resumeToken)) {
    // Diagnóstico apenas no servidor: nunca registrar corpo, assinatura,
    // credencial, referência ou dados de contato.
    const code = ['indisponivel', 'solicitacao_invalida', 'contexto_indisponivel'].includes(result?.erro)
      ? result.erro : 'resposta_inesperada';
    console.warn('v2g_commercial_handoff_rejected', { httpStatus: response.status, code });
    throw new Error('handoff QA recusado');
  }
  return { url: new URL('/api/comercial/retomar', url).href,
    reference: result.reference, resumeToken: result.resumeToken };
}
module.exports = { enviarHandoff, destino };
