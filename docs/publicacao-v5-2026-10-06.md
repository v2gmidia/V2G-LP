# Publicação da LP v5 — 06/10/2026

## Resultado

- URL pública: https://www.v2gmidia.com.br/
- Projeto Vercel: `v2-g-lp` / `prj_FHsEozmi5MzDZfPwT6bggpRYprLO`, equipe V2G (`v2-g`).
- Ambiente: produção. Estado confirmado: `READY`, sem erro de associação dos domínios.
- Deployment: `dpl_DTBUkm5Hqjp64jDBq4XNM7ovJT9f`.
- URL imutável: https://v2-g-1jxgem1x3-v2-g.vercel.app/
- Publicação anterior disponível para reversão: `dpl_EwczcFF2tmPiTngfT7Yq8VX9QKwy`.
- Compilação informada pela Vercel: 189 ms; publicação concluída.
- Fonte: os 30 arquivos locais aprovados enviados diretamente pela API da Vercel, total 683.371 bytes. Não houve commit ou push; o GitHub continua no estado anterior.

## Conferências

- HTML, quatro arquivos CSS/JS v5, fotografia, fonte principal e três páginas legais: HTTP 200 e SHA-256 idêntico aos arquivos locais.
- Hero, fotografia e data 28/10/2026 conferidas no navegador no domínio público; nenhum erro de console observado.
- As três variáveis exigidas pelo formulário existem em produção. Apenas nomes/tipos/destinos foram inspecionados, sem descriptografar valores. `LEADS_SIMULAR` não está configurada.
- POST vazio para `/api/pre-cadastro`: HTTP 422 com os dez avisos de validação, conforme `api/pre-cadastro.js:132`. O verificador inicial esperava 400 por engano e terminou com código 1; o retorno foi comparado ao contrato do código e é o esperado.
- Nenhum lead de teste foi gravado em produção. Persistência no banco não foi medida nesta publicação.
- Consulta de logs deste deployment, níveis error/fatal nos 15 minutos posteriores: nenhum registro encontrado. Isso não é monitoramento contínuo. Drains não foram inspecionados.

## Próximas alterações

Os CSS/JS versionados são servidos com cache imutável por um ano. Antes de republicar conteúdo alterado, usar um novo nome de versão e atualizar as referências no HTML. A versão publicada diretamente na Vercel ainda precisa ser sincronizada com o GitHub antes de voltar a publicar pelo fluxo Git.

## Manifesto de arquivos

| Arquivo | Bytes | SHA-1 enviado à Vercel |
|---|---:|---|
| vercel.json | 749 | 7d9916ce4426a3c78d954596c7dc9aa81fbb8887 |
| termos.html | 13510 | 6cfa3dbade30486494642c65f9c15398e5e03a3c |
| sitemap.xml | 472 | 64af2e2f2fab51db2ddc64c31cb0edad708481a1 |
| robots.txt | 73 | c91c4eb43463aede21057a91699a648ce16192a2 |
| privacidade.html | 32590 | 47ea95608f792e2a66e98bca4d38e380a2984b56 |
| index.html | 35397 | 88ba430cd4edd5e19f65fe9af9faedb711a873d8 |
| favicon.svg | 611 | 3e6dd1b0a3fb185562e62dc061865238911234be |
| favicon.ico | 2515 | 62259f441d94e78c6e3306db579ac8be580988bd |
| favicon-32.png | 836 | b83bd15f8fcccea235601a69ec72c4bde215ff6e |
| exclusao-de-dados.html | 14655 | af39a967372d3797cd0828f6fc53c89a87031e5c |
| assets/og-v2g.png | 87801 | 71c8d76de00de9f0ae7918f81e78bb0961fd9c32 |
| assets/negocio-v5.webp | 105248 | e05ab31f22612a3fc6d2a2469b0f886575631575 |
| assets/marca/textura.svg | 16026 | 611a558f58741312bf43508b5d93ddc358591c08 |
| assets/marca/simbolo.svg | 552 | ad931e3fec1cf2839a07eaa9e043e06b7d3413fa |
| assets/marca/icone-1080.png | 31214 | 1b2d976c245681cb062c834b23323815f2f13e63 |
| assets/lp.v5.js | 15926 | abbbf2b0d6a87769162868d3681ea26ffc64a277 |
| assets/lp.v5.css | 31174 | 7241732002a01132e2439b31c3726d0c250937c7 |
| assets/lp.v4.js | 15926 | af2822cf5dd57ab4f4547ce7f10b9c6b788591dd |
| assets/lp.v4.css | 31365 | f983a6ea624641aa0b18a38215e3d7dea4d416ee |
| assets/lp-refino.v5.css | 13969 | 3c6b07d8155a01a5bb91b7689e42917e63207f10 |
| assets/lp-movimento.v5.js | 16976 | f5feea05d85104a00213c827074fb1fdea3c8004 |
| assets/lp-movimento.v4.js | 13904 | 8d3a9c1e7c9b1bbbe79f1093d9f77553be7819f8 |
| assets/legal.v4.css | 3750 | baa54a31a549e70bbc3463ce311fa85ee328359c |
| assets/fontes/OFL.txt | 4388 | 35d54efe9577f2057e8bdb5f77ec50e21fd0c09c |
| assets/fontes/archivo-var-latin.woff2 | 90104 | 258a93fe93ae4cd277dde1da554e5cc2c7728f2c |
| assets/fontes/archivo-var-latin-ext.woff2 | 86240 | 837705d412798418c8b82dbfa62a8af2e9e83daf |
| apple-touch-icon.png | 3826 | 58c5888b842292526c44fdd946ec76c9351f96ab |
| api/_lead.js | 4420 | 9a5209597f5ce62b1a021315d230747175e00f16 |
| api/pre-cadastro.js | 6728 | b64b9d0991b90257cdc1ffcf2a84f4a188c7882a |
| 404.html | 2426 | 36b1080e87a12a0fd7238fbd7374db9f64b43688 |

