'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
http.createServer((req,res) => {
  if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405);return res.end();}
  let pathname;
  try {pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);} catch {res.writeHead(400);return res.end();}
  const file = path.resolve(root,'.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep) || !types[path.extname(file)]) {res.writeHead(404);return res.end();}
  fs.readFile(file,(err,data) => {if(err){res.writeHead(404);return res.end('Não encontrado');}res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method === 'HEAD' ? undefined : data);});
}).listen(5174,'127.0.0.1',() => console.log('Prévia V2G: http://localhost:5174'));
