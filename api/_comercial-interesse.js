'use strict';

const { createHash } = require('node:crypto');
const { validaLead, TEXTO_CONSENTIMENTO, documentoContratanteValido,cnpjTemDigitosValidos } = require('./_lead');

const limpar = (valor, max) => typeof valor === 'string' ? valor.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '';

function unitId(reference, index) {
  const bytes = createHash('sha256').update(reference + ':' + index).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 15) | 80;
  bytes[8] = (bytes[8] & 63) | 128;
  const h = bytes.toString('hex');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
function validarInteresse(body, consentAt = new Date().toISOString(),{documentoFlexivel=false}={}) {
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const campos = {};
  const reference = typeof b.solicitacao_id === 'string' ? b.solicitacao_id.toLowerCase() : '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(reference))
    campos.solicitacao_id = 'Atualize a página e tente novamente.';
  const perfil = b.perfil === 'agencia' ? 'agency' : b.perfil === 'dono' ? 'direct' : null;
  if (!perfil) campos.perfil = 'Escolha como quer contratar.';
  const nome = limpar(b.nome, 120);
  const email = limpar(b.email, 160).toLowerCase();
  let whatsapp = limpar(b.whatsapp, 30).replace(/\D/g, '');
  if (whatsapp.length > 11 && whatsapp.startsWith('55')) whatsapp = whatsapp.slice(2);
  const razaoSocial = limpar(b.negocio, 120);
  const cnpj = limpar(b.cnpj, 24).replace(/\D/g, '');
  if (nome.length < 2) campos.nome = 'Escreva seu nome.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) campos.email = 'Confira o e-mail.';
  if (!/^[1-9][0-9]{9,10}$/.test(whatsapp) || whatsapp.length === 11 && whatsapp[2] !== '9') campos.whatsapp = 'Confira o WhatsApp com DDD.';
  if (razaoSocial.length < 2) campos.negocio = 'Escreva o nome do contratante.';
  if (!(documentoFlexivel?documentoContratanteValido(String(b.cnpj??'')):cnpjTemDigitosValidos(cnpj)))
    campos.cnpj = documentoFlexivel?'Confira o CPF ou CNPJ do contratante.':'Confira o CNPJ do contratante.';
  if (!['sim', true, 'on'].includes(b.consentimento)) campos.consentimento = 'Para enviar, autorize o contato.';

  let contas = 1;
  let nomes = [razaoSocial];
  let briefingDireto = null;
  if (perfil === 'agency') {
    contas = Number(b.quantidade_anunciantes);
    if (!Number.isSafeInteger(contas) || contas < 1 || contas > 100) campos.quantidade_anunciantes = 'Informe de 1 a 100 anunciantes.';
    if (typeof b.nomes_anunciantes !== 'string' || b.nomes_anunciantes.length > 13000)
      campos.nomes_anunciantes = 'A lista está longa demais. Reduza os nomes.';
    nomes = (typeof b.nomes_anunciantes === 'string' ? b.nomes_anunciantes : '')
      .split(/\r?\n/).map(v => limpar(v, 121)).filter(Boolean);
    if (nomes.length !== contas || nomes.some(v => v.length < 2 || v.length > 120))
      campos.nomes_anunciantes = 'Informe um nome por linha para cada anunciante.';
  } else if (perfil === 'direct') {
    const legacy = validaLead(b,{documentoFlexivel});
    if (!legacy.ok) Object.assign(campos, legacy.campos);
    else briefingDireto = {
      nicho: legacy.lead.nicho, nichoOutro: legacy.lead.nicho_outro,
      instagram: legacy.lead.instagram, vendeWhatsApp: legacy.lead.vende_whatsapp,
      investeAnuncios: legacy.lead.investe_anuncios,
      faixaInvestimento: legacy.lead.faixa_investimento, site: legacy.lead.site
    };
  }
  if (Object.keys(campos).length) return { ok: false, campos };
  const units = nomes.map((advertiserName, index) => ({ id: unitId(reference, index), advertiserName }));
  const attribution = Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']
    .map(key => [key, limpar(b[key], 200) || null]));
  const data = { schemaVersion: 'v2g.comercial.lead.v1', reference, nome, email, whatsapp,
    razaoSocial, cnpj, contractorType: perfil, contas, units };
  return { ok: true, record: { reference, data, attribution,
    consent: { at: consentAt, text: TEXTO_CONSENTIMENTO },
    paginaOrigem: limpar(b.pagina_origem, 300) || null, briefingDireto } };
}

module.exports = { validarInteresse };
