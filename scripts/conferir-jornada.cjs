/* Contratos públicos da jornada; não inicia servidor nem faz chamadas de rede. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const codigo = fs.readFileSync(path.join(root, 'assets/jornada.v6.js'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(ids.length, new Set(ids).size, 'Os ids da página não podem se repetir.');
for (const [, id] of html.matchAll(/\bhref="#([^"]+)"/g)) {
  assert.ok(ids.includes(id), 'Âncora sem destino: ' + id);
}
for (const [, file] of html.matchAll(/(?:src|href)="(\/assets\/[^"#]+)(?:#[^"]*)?"/g)) {
  assert.ok(fs.existsSync(path.join(root, file)), 'Asset ausente: ' + file);
}
assert.ok(!html.includes('id="cronometro"'), 'Não anunciar data de lançamento nesta jornada.');
assert.match(html, /class="plan-price"><span>R\$<\/span> 500<span>\/mês<\/span>/);
assert.match(html, /class="plan-unit">por conta de anúncios/);
assert.match(html, /Permanência mínima<\/dt><dd>6 meses/);
assert.match(html, /Verba de mídia<\/dt><dd>Separada da mensalidade/);
assert.match(html, /Anual à vista<\/span><strong>R\$ 5\.280 por conta<\/strong>/);
assert.match(html, /12% de desconto: R\$ 720 a menos que doze mensalidades/);
assert.match(html, /Enviar interesse não cria pedido, cobrança ou acesso/);
assert.match(html, /A situação cadastral ativa é validada com a equipe antes de abrir a compra/);
assert.ok(!/href="https?:\/\/[^\"]+\/contratar/.test(html), 'A LP não pode apontar para checkout público inexistente.');
assert.ok(!/href="https?:\/\/wa\.me\//.test(html), 'WhatsApp comercial não pode contornar a captura.');
const button = html.match(/<a\b[^>]*id="contato-whatsapp"[^>]*>/)?.[0];
assert.ok(button?.includes(' hidden'), 'CTA do WhatsApp precisa começar oculto.');
assert.ok(!/\bhref=/.test(button), 'Destino do WhatsApp deve vir da confirmação da API.');
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
    ? 'http://localhost:3000' : 'https://v2g-deploy-webapp.vercel.app';
  assert.equal(links[0].href, origin + '/entrar?modo=login');
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
  const contato = elemento();
  contato.hidden = true;
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
    'form-enviado': success, 'contato-whatsapp': contato, 'enviado-titulo': elemento(),
    'enviado-mensagem': elemento(), 'e-geral': elemento()
  };
  let requests = 0;
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/lp.v6.js'), 'utf8'), {
    URL, URLSearchParams, window: {}, location: { search: '', origin: 'https://exemplo.local', pathname: '/' },
    document: {
      querySelector: () => null,
      getElementById: (id) => nodes[id] || null,
      documentElement: { classList: { contains: () => false } }
    },
    fetch: async () => { requests++; return { status, json: async () => body }; }
  });
  handlers.submit({ preventDefault() {} });
  handlers.submit({ preventDefault() {} });
  await new Promise(setImmediate);
  assert.equal(requests, 1, 'Evitar dois envios enquanto o primeiro aguarda.');
  return { contato, success, form, nodes };
}

(async () => {
  const url = 'https://wa.me/5521999689689?text=Ol%C3%A1';
  const persisted = await conferirRespostaContato({ ok: true, contato_url: url });
  assert.equal(persisted.contato.href, url);
  assert.equal(persisted.contato.hidden, false);
  assert.equal(persisted.form.hidden, true);
  for (const contato_url of [undefined, 'javascript:alert(1)', 'https://outro.example/', 'https://wa.me/5511999999999', 'https://usuario@wa.me/5521999689689']) {
    const rejected = await conferirRespostaContato({ ok: true, contato_url });
    assert.equal(rejected.contato.hidden, true);
    assert.equal(rejected.contato.href, undefined);
  }
  const failure = await conferirRespostaContato({ ok: false, erro: 'Tente novamente.' }, 502);
  assert.equal(failure.contato.hidden, true);
  assert.equal(failure.form.hidden, false);
  assert.equal(failure.nodes['e-geral'].textContent, 'Tente novamente.');
  const simulation = await conferirRespostaContato({ ok: true, contato_url: url, simulado: true });
  assert.match(simulation.nodes['enviado-mensagem'].textContent, /Nenhum contato foi salvo/);
  assert.equal(simulation.contato.textContent, 'Ver link do WhatsApp');
  console.log('OK: oferta mensal/anual, CNPJ por dígitos, âncoras, assets, campos, links sem PII, WhatsApp condicionado, erros, simulação e envio duplicado.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
