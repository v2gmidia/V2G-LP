'use strict';

const crypto = require('crypto');
const DESTINO = 'victor.cabral@v2gmidia.com.br';

/** Alerta interno após persistência. Não é fila durável nem prova de entrega. */
async function alertarNovoLead(lead) {
  if (process.env.LEADS_SIMULAR === '1' || process.env.LEADS_ALERT_EMAIL_ENABLED !== 'true')
    return { estado: 'desativado' };
  const from = process.env.LEADS_ALERT_FROM;
  const key = process.env.LEADS_ALERT_RESEND_API_KEY;
  const salt = process.env.IP_HASH_SALT;
  if (!from || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(from) || !key || !salt)
    return { estado: 'pendente', referencia: 'configuracao' };

  const text = [
    'Novo contato salvo pelo formulário da V2G.',
    'O envio não representa pedido, pagamento ou acesso aprovado.',
    '',
    `Nome: ${lead.nome}`, `Negócio: ${lead.negocio}`,
    `E-mail: ${lead.email}`, `WhatsApp: ${lead.whatsapp}`,
    `CNPJ informado: ${lead.cnpj}`, `Instagram: ${lead.instagram}`,
    `Ramo: ${lead.nicho}`, `Vende pelo WhatsApp: ${lead.vende_whatsapp ? 'sim' : 'não'}`,
    `Origem: ${lead.pagina_origem || 'não informada'}`,
    `Campanha: ${lead.utm_campaign || 'não informada'}`,
    '', 'Contato solicitado pelo formulário; os dados acima foram informados pelo interessado.'
  ].join('\n');
  const payload = { from: `V2G <${from}>`, to: [DESTINO], subject: 'V2G | Novo contato pelo site', text };
  // Mesmo payload usa a mesma chave nas repetições próximas. HMAC evita PII na chave/log.
  // O provedor deduplica por 24h; não prometer deduplicação permanente ou entrega.
  const referencia = crypto.createHmac('sha256', salt).update(JSON.stringify(payload)).digest('hex');
  try {
    const resposta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json',
        'Idempotency-Key': `lp-lead/${referencia}` },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(5000)
    });
    const corpo = await resposta.json().catch(() => null);
    if (resposta.ok && corpo && typeof corpo.id === 'string' && corpo.id)
      return { estado: 'aceito', referencia };
  } catch { /* Resultado ambíguo exige conciliação; não repetir envio cegamente. */ }
  return { estado: 'pendente', referencia };
}

module.exports = { alertarNovoLead };
