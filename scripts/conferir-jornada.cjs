/* Contratos públicos da jornada; não inicia servidor nem faz chamadas de rede. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const codigo = fs.readFileSync(path.join(root, 'assets/jornada.v7.js'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(ids.length, new Set(ids).size, 'Os ids da página não podem se repetir.');
for (const [, id] of html.matchAll(/\bhref="#([^"]+)"/g)) {
  assert.ok(ids.includes(id), 'Âncora sem destino: ' + id);
}
for (const [, file] of html.matchAll(/(?:src|href)="(\/assets\/[^"#?]+)(?:[?#][^"]*)?"/g)) {
  assert.ok(fs.existsSync(path.join(root, file)), 'Asset ausente: ' + file);
}
assert.ok(!html.includes('id="cronometro"'), 'Não anunciar data de lançamento nesta jornada.');
const hero = html.match(/<section class="hero wrap"[\s\S]*?<\/section>/)?.[0];
const barra = html.match(/<div class="barra-fixa"[^>]*>[\s\S]*?<\/div>/)?.[0];
assert.ok(hero && !/R\$\s*500|6 meses/.test(hero), 'Preço e prazo não devem aparecer na hero.');
assert.ok(barra && !/R\$\s*500|6 meses/.test(barra), 'Preço e prazo não devem aparecer na barra fixa.');
assert.match(html, /pricing-main-value">R\$ 500<span>\/mês<\/span>/);
assert.match(html, /pricing-main-value">R\$ 5\.280<span>à vista<\/span>/);
assert.match(html, /Economize R\$ 720/);
assert.match(html, /Verba dos anúncios à parte/);
assert.match(html, /Checkout em preparação/);
assert.match(html, /A tecnologia organiza\./);
assert.match(html, /As pessoas acompanham\./);
assert.ok(!html.includes('id="perguntas"'), 'A seção de perguntas foi removida desta versão.');
assert.ok(!/href="https?:\/\/[^\"]+\/contratar/.test(html), 'A LP não pode apontar para checkout público inexistente.');
assert.ok(!/href="https:\/\/wa\.me\//.test(html), 'CTAs de aquisição passam pelo formulário.');
assert.match(html, /class="button button-blue pricing-cta" href="#pre-cadastro"/);
assert.ok(!html.includes('preview-nao-envia') && !html.includes('Prévia local para revisão'), 'A página principal não pode usar o formulário da prévia.');
assert.match(html, /action="\/api\/pre-cadastro" method="post"/);
for (const name of ['nome', 'whatsapp', 'email', 'negocio', 'cnpj', 'nicho', 'nicho_outro', 'instagram', 'perfil', 'vende_whatsapp', 'investe_anuncios', 'faixa_investimento', 'site', 'consentimento', 'empresa_url', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'pagina_origem']) {
  assert.ok(html.includes('name="' + name + '"'), 'Campo do contrato removido: ' + name);
}
for (const hostname of ['localhost', '127.0.0.1', '[::1]', 'www.v2gmidia.com.br', 'preview.vercel.app']) {
  const links = ['login', 'cadastro', 'invalido'].map((modo) => ({
    href: '/preservar', getAttribute: () => modo
  }));
  vm.runInNewContext(codigo, {
    location: { hostname, search: '?email=nao-propagar%40example.test&telefone=11999990000' },
    document: { querySelectorAll: () => links }
  });
  const origin = ['localhost', '127.0.0.1', '[::1]'].includes(hostname)
    ? 'http://localhost:3000' : 'https://app.v2gmidia.com.br';
  assert.equal(links[0].href, origin + '/entrar');
  assert.equal(links[1].href, origin + '/entrar?modo=cadastro');
  assert.equal(links[2].href, '/preservar');
  assert.ok(!links[0].href.includes('email=') && !links[1].href.includes('telefone='));
}
async function conferirRespostaContato(body, status = 200) {
  const handlers = {};
  const elemento = (value = '') => ({
    value, hidden: false, checked: false, disabled: false,
    textContent: '', tagName: 'INPUT',
    addEventListener() {}, setAttribute() {}, removeAttribute() {}, focus() {}, scrollIntoView() {},
    classList: { remove() {}, toggle() {}, contains() { return false; } },
    closest() { return this; }
  });
  const values = {
    nome: 'Pessoa QA', whatsapp: '11999990000', email: 'qa@example.test',
    negocio: 'Negócio QA', cnpj: '11222333000181', nicho: 'loja_varejo', nicho_outro: '', instagram: 'negocio_qa',
    perfil: 'dono', vende_whatsapp: 'sim', investe_anuncios: 'nao', faixa_investimento: '',
    site: '', consentimento: 'sim', empresa_url: '', utm_source: '', utm_medium: '',
    utm_campaign: '', utm_content: '', pagina_origem: ''
  };
  const fields = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, elemento(value)]));
  fields.consentimento.checked = true;
  const submit = elemento();
  submit.textContent = 'Enviar';
  const help = elemento();
  const success = elemento();
  success.hidden = true;
  success.querySelector = () => help;
  const form = elemento();
  form.elements = fields;
  form.action = 'https://exemplo.local/api/pre-cadastro';
  form.addEventListener = (name, fn) => { handlers[name] = fn; };
  form.querySelectorAll = () => [];
  form.querySelector = (selector) => {
    if (selector === 'button[type=submit]') return submit;
    const name = selector.match(/\[name="([^"]+)"\]/)?.[1];
    if (!name) return null;
    if (selector.includes('[value="sim"]') && fields[name].value !== 'sim') return null;
    return fields[name];
  };
  const nodes = {
    'form-pre-cadastro': form, 'campo-nicho-outro': elemento(), 'campo-faixa': elemento(),
    'form-enviado': success, 'enviado-titulo': elemento(),
    'enviado-mensagem': elemento(), 'e-geral': elemento()
  };
  let requests = 0;
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/lp.v6.js'), 'utf8'), {
    URL, URLSearchParams, window: {}, location: {
      search: '?utm_source=ig&utm_medium=social&utm_content=link_in_bio',
      origin: 'https://exemplo.local', pathname: '/'
    },
    document: {
      body: { getAttribute: () => null },
      querySelector: () => null,
      getElementById: (id) => nodes[id] || null,
      documentElement: { classList: { contains: () => false } }
    },
    fetch: async (url) => {
      if (url === '/api/comercial-config') return { ok: false, status: 404 };
      requests++;
      return { status, json: async () => body };
    }
  });
  handlers.submit({ preventDefault() {} });
  handlers.submit({ preventDefault() {} });
  await new Promise(setImmediate);
  assert.equal(requests, 1, 'Evitar dois envios enquanto o primeiro aguarda.');
  return { success, form, nodes };
}

(async () => {
  const persisted = await conferirRespostaContato({ ok: true });
  assert.equal(persisted.form.elements.utm_source.value, 'ig');
  assert.equal(persisted.form.elements.utm_medium.value, 'social');
  assert.equal(persisted.form.elements.utm_content.value, 'link_in_bio');
  assert.equal(persisted.form.elements.pagina_origem.value, 'https://exemplo.local/');
  assert.equal(persisted.form.hidden, true);
  const failure = await conferirRespostaContato({ ok: false, erro: 'Tente novamente.' }, 502);
  assert.equal(failure.form.hidden, false);
  assert.equal(failure.nodes['e-geral'].textContent, 'Tente novamente.');
  const simulation = await conferirRespostaContato({ ok: true, simulado: true });
  assert.match(simulation.nodes['enviado-mensagem'].textContent, /Nenhum contato foi salvo/);
  console.log('OK: oferta mensal/anual, âncoras, assets, campos, links sem PII, contato via formulário, erros, simulação e envio duplicado.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
