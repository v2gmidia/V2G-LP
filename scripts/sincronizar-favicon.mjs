// Reutiliza a arte exata do WebApp, sem reconstruir o símbolo da marca.
// Executar: node scripts/sincronizar-favicon.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const webapp = createRequire(new URL('../../webapp/package.json', import.meta.url));
const next = createRequire(webapp.resolve('next/package.json'));
const sharp = next('sharp');
const raiz = new URL('../', import.meta.url);
const original = await readFile(new URL('../../webapp/app/icon.png', import.meta.url));
const meta = await sharp(original).metadata();
assert.equal(meta.width, meta.height, 'A origem deve ser quadrada.');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${meta.width} ${meta.height}"><image width="${meta.width}" height="${meta.height}" href="data:image/png;base64,${original.toString('base64')}"/></svg>\n`;
await writeFile(new URL('favicon.svg', raiz), svg);
const png32 = await sharp(original).resize(32, 32).png().toBuffer();
await writeFile(new URL('favicon-32.png', raiz), png32);
await sharp(original).resize(180, 180).png().toFile(fileURLToPath(new URL('apple-touch-icon.png', raiz)));

const tamanhos = [16, 32, 48];
const imagens = await Promise.all(tamanhos.map(t => sharp(original).resize(t, t).png().toBuffer()));
const cabecalho = Buffer.alloc(6 + 16 * imagens.length);
cabecalho.writeUInt16LE(1, 2);
cabecalho.writeUInt16LE(imagens.length, 4);
let offset = cabecalho.length;
imagens.forEach((bytes, i) => {
  const entrada = 6 + i * 16;
  cabecalho[entrada] = tamanhos[i];
  cabecalho[entrada + 1] = tamanhos[i];
  cabecalho.writeUInt16LE(1, entrada + 4);
  cabecalho.writeUInt16LE(32, entrada + 6);
  cabecalho.writeUInt32LE(bytes.length, entrada + 8);
  cabecalho.writeUInt32LE(offset, entrada + 12);
  offset += bytes.length;
});
await writeFile(new URL('favicon.ico', raiz), Buffer.concat([cabecalho, ...imagens]));

const salvo = await readFile(new URL('favicon.svg', raiz), 'utf8');
assert.deepEqual(Buffer.from(salvo.match(/base64,([^\"]+)/)[1], 'base64'), original);
for (const [arquivo, tamanho] of [['favicon-32.png', 32], ['apple-touch-icon.png', 180]]) {
  const imagem = await sharp(await readFile(new URL(arquivo, raiz))).metadata();
  assert.equal(imagem.width, tamanho);
  assert.equal(imagem.height, tamanho);
}
console.log('PASS: SVG com a arte exata do WebApp; PNG 32px; Apple 180px; ICO 16/32/48px.');
