/* ============================================================
   Servidor local para testar a landing com a rota do formulário,
   sem instalar nada (só Node 18+).

     node scripts/servidor-local.js --simular
     → http://localhost:5173   (--simular = LEADS_SIMULAR=1: não grava no Supabase)

   Imita o que a Vercel faz: serve os arquivos estáticos com cleanUrls
   (/privacidade → privacidade.html) e roda api/pre-cadastro.js com o
   corpo já interpretado em req.body. Não vai para produção (.vercelignore).
   ============================================================ */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

if (process.argv.includes('--simular')) process.env.LEADS_SIMULAR = '1';

const RAIZ = path.resolve(__dirname, '..');
const PORTA = Number(process.env.PORT) || 5173;
const handler = require(path.join(RAIZ, 'api', 'pre-cadastro.js'));

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

function lerCorpo(req) {
  return new Promise((ok) => {
    let dados = '';
    req.on('data', (c) => { dados += c; if (dados.length > 20000) req.destroy(); });
    req.on('end', () => {
      const tipo = String(req.headers['content-type'] || '');
      if (tipo.includes('application/json')) { try { return ok(JSON.parse(dados)); } catch (e) { return ok({}); } }
      if (tipo.includes('application/x-www-form-urlencoded')) return ok(Object.fromEntries(new URLSearchParams(dados)));
      ok(dados);
    });
  });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  // os mesmos cabeçalhos do vercel.json
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (url.pathname === '/api/pre-cadastro') {
    if (req.method === 'POST') req.body = await lerCorpo(req);
    return handler(req, res);
  }

  let arquivo = path.normalize(path.join(RAIZ, decodeURIComponent(url.pathname)));
  if (!arquivo.startsWith(RAIZ)) { res.statusCode = 403; return res.end(); }
  if (url.pathname === '/') arquivo = path.join(RAIZ, 'index.html');
  else if (!path.extname(arquivo) && fs.existsSync(arquivo + '.html')) arquivo += '.html';

  fs.readFile(arquivo, (erro, conteudo) => {
    if (erro) { // como a Vercel: serve o 404.html com status 404
      res.statusCode = 404;
      res.setHeader('Content-Type', TIPOS['.html']);
      return fs.createReadStream(path.join(RAIZ, '404.html')).pipe(res);
    }
    res.setHeader('Content-Type', TIPOS[path.extname(arquivo)] || 'application/octet-stream');
    res.end(conteudo);
  });
}).listen(PORTA, () => {
  console.log('Landing em http://localhost:' + PORTA + (process.env.LEADS_SIMULAR === '1' ? '  (gravação SIMULADA)' : ''));
});
