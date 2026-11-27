/* Contratos públicos da LP; não abre o WhatsApp nem faz chamadas externas. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'assets/lp-agencias.v1.js'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(ids.length, new Set(ids).size, 'IDs repetidos.');
for (const [, id] of html.matchAll(/\bhref="#([^"]+)"/g))
  assert.ok(ids.includes(id), 'Âncora sem destino: ' + id);
for (const [, file] of html.matchAll(/(?:src|href)="(\/assets\/[^"#?]+)(?:[?#][^"]*)?"/g))
  assert.ok(fs.existsSync(path.join(root, file)), 'Asset ausente: ' + file);

const hero = html.match(/<section class="hero wrap"[\s\S]*?<\/section>/)?.[0];
assert.ok(hero && !/R\$\s*500|6 meses/.test(hero), 'Preço e prazo não pertencem à hero.');
assert.match(hero, /Mais lucro/);
assert.match(html, /Sua agência vende/);
assert.match(html, /Gestores da V2G executam/);
assert.match(html, /pricing-main-value">R\$ 500<span>\/mês<\/span>/);
assert.match(html, /pricing-main-value">R\$ 5\.280<span>à vista<\/span>/);
assert.match(html, /Economize R\$ 720 pagando à vista/);
assert.match(html, /Verba dos anúncios à parte/);
assert.match(html, /Até 10x mais barato/);
assert.ok(!html.includes('id="perguntas"'), 'A antiga seção de perguntas reapareceu.');
assert.ok(!html.includes('preview-agencia-nao-envia'), 'A ficha demonstrativa não pode ir ao ar.');
assert.ok(!html.includes('action="/api/pre-cadastro"'), 'A ficha da agência não cabe no endpoint antigo.');
assert.ok(!/href="https?:\/\/[^\"]+\/contratar/.test(html), 'Checkout não confirmado.');
assert.match(html, /name="agencia"/);
assert.match(html, /name="consentimento"/);
assert.match(html, /Continuar no WhatsApp<\/button>/);
assert.match(html, /type="submit"[^>]*disabled/);
assert.match(html, /Value to Growth · Blog da V2G/);

const handlers = {};
const fields = {
  nome: { value: 'Pessoa Teste' },
  whatsapp: { value: '11987654321', addEventListener() {}, setCustomValidity() {} },
  email: { value: 'qa@example.test' },
  agencia: { value: 'Agência Exemplo' },
  instagram_agencia: { value: 'agencia.exemplo' },
  site_agencia: { value: '' },
  nicho_agencia: { value: '', required: false },
  executor_midia: { selectedOptions: [{ textContent: 'Gestor parceiro' }] }
};
const submit = { disabled: true };
const niche = { hidden: false };
const form = {
  elements: { namedItem: (name) => fields[name] },
  querySelector: (selector) => selector === 'button[type="submit"]' ? submit :
    selector.includes('agencia_nichada') ? { value: 'nao' } :
    selector.includes('oferece_trafego') ? { value: 'sim' } : null,
  querySelectorAll: () => [],
  addEventListener: (name, handler) => { handlers[name] = handler; },
  reportValidity: () => true
};
let destination = '';
vm.runInNewContext(js, {
  document: {
    querySelector: (selector) => selector === '[data-churn-chart]' ? null :
      selector.includes('pricing-preview-choice') ? { value: 'mensal' } : null,
    getElementById: (id) => ({ 'form-pre-cadastro': form, 'campo-nicho-agencia': niche,
      'f-nicho-agencia': fields.nicho_agencia, 'f-whatsapp': fields.whatsapp })[id] || null
  },
  window: { location: { assign: (url) => { destination = url; } } }
});
assert.equal(submit.disabled, false, 'Botão habilitado apenas após o JS iniciar.');
assert.equal(niche.hidden, true);
handlers.submit({ preventDefault() {} });
const parsed = new URL(destination);
assert.equal(parsed.hostname, 'wa.me');
assert.equal(parsed.pathname, '/5521980351531');
assert.match(parsed.searchParams.get('text'), /Agência: Agência Exemplo/);
assert.match(parsed.searchParams.get('text'), /Interesse: mensal/);
console.log('OK: LP de agências, oferta, âncoras, assets e passagem explícita para WhatsApp. Nenhum envio externo.');
