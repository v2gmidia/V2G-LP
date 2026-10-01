/* ============================================================
   Validação e normalização do pré-cadastro (lado servidor).
   É a fonte da verdade: o navegador valida só por conveniência.
   A função inserir_lead_lp no Postgres repete as checagens essenciais.
   Arquivo com "_" na frente: a Vercel não expõe como rota.
   ============================================================ */
'use strict';

const NICHOS = [
  'restaurante_delivery', 'salao_estetica', 'clinica_saude', 'loja_varejo',
  'servicos_profissionais', 'servicos_locais', 'outro'
];
const PERFIS = ['dono', 'agencia'];
const FAIXAS = ['ate_500', '500_2000', '2000_5000', 'acima_5000'];

// Texto exato do checkbox, guardado junto com o lead como prova do consentimento.
const TEXTO_CONSENTIMENTO =
  'Autorizo a V2G a usar estes dados para entrar em contato comigo sobre o pré-cadastro, conforme a Política de Privacidade.';

const texto = (v, max) => (typeof v === 'string' ? v : v == null ? '' : String(v))
  .replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);

const simNao = (v) => (v === 'sim' || v === true ? true : v === 'nao' || v === false ? false : null);

function limpaInstagram(v) {
  return texto(v, 120)
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/[/?#].*$/, '')
    .toLowerCase();
}

/**
 * Recebe o corpo cru do formulário.
 * Devolve { ok: true, lead } ou { ok: false, campos: { nome: 'mensagem' } }.
 */
function validaLead(corpo) {
  const b = corpo && typeof corpo === 'object' ? corpo : {};
  const campos = {};

  const nome = texto(b.nome, 120);
  if (nome.length < 2) campos.nome = 'Escreva seu nome.';

  let whatsapp = texto(b.whatsapp, 30).replace(/\D/g, '');
  if (whatsapp.length > 11 && whatsapp.startsWith('55')) whatsapp = whatsapp.slice(2);
  if (!/^[1-9][0-9]{9,10}$/.test(whatsapp) || (whatsapp.length === 11 && whatsapp[2] !== '9')) {
    campos.whatsapp = 'Coloque o WhatsApp com DDD, só números.';
  }

  const email = texto(b.email, 160).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) campos.email = 'Confira o e-mail.';

  const negocio = texto(b.negocio, 120);
  if (negocio.length < 2) campos.negocio = 'Escreva o nome do negócio.';

  const nicho = texto(b.nicho, 40);
  if (!NICHOS.includes(nicho)) campos.nicho = 'Escolha o ramo do negócio.';
  const nichoOutro = nicho === 'outro' ? texto(b.nicho_outro, 80) : '';
  if (nicho === 'outro' && nichoOutro.length < 2) campos.nicho_outro = 'Conte qual é o ramo.';

  const instagram = limpaInstagram(b.instagram);
  if (!/^[a-z0-9._]{1,30}$/.test(instagram)) campos.instagram = 'Coloque o @ do Instagram do negócio.';

  const perfil = texto(b.perfil, 20);
  if (!PERFIS.includes(perfil)) campos.perfil = 'Escolha uma opção.';

  const vende = simNao(b.vende_whatsapp);
  if (vende === null) campos.vende_whatsapp = 'Escolha sim ou não.';

  const investe = simNao(b.investe_anuncios);
  if (investe === null) campos.investe_anuncios = 'Escolha sim ou não.';

  let faixa = texto(b.faixa_investimento, 20) || null;
  if (investe === true && !FAIXAS.includes(faixa)) campos.faixa_investimento = 'Escolha uma faixa.';
  if (investe !== true) faixa = null;

  const site = texto(b.site, 200) || null;
  if (site && !/^(https?:\/\/)?[^\s./]+(\.[^\s./]+)+(\/\S*)?$/i.test(site)) {
    campos.site = 'Confira o endereço do site, ou deixe em branco.';
  }

  const consentimento = b.consentimento === 'sim' || b.consentimento === true || b.consentimento === 'on';
  if (!consentimento) campos.consentimento = 'Para enviar, é preciso autorizar o contato.';

  if (Object.keys(campos).length) return { ok: false, campos };

  return {
    ok: true,
    lead: {
      nome,
      whatsapp,
      email,
      negocio,
      nicho,
      nicho_outro: nichoOutro || null,
      instagram,
      perfil,
      vende_whatsapp: vende,
      investe_anuncios: investe,
      faixa_investimento: faixa,
      site,
      consentimento_texto: TEXTO_CONSENTIMENTO,
      utm_source: texto(b.utm_source, 200) || null,
      utm_medium: texto(b.utm_medium, 200) || null,
      utm_campaign: texto(b.utm_campaign, 200) || null,
      utm_content: texto(b.utm_content, 200) || null,
      pagina_origem: texto(b.pagina_origem, 300) || null
    }
  };
}

module.exports = { validaLead, TEXTO_CONSENTIMENTO };
