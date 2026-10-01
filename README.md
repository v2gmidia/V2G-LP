# V2G — Landing Page (pré-cadastro)

Página pública em v2gmidia.com.br. Objetivo único: captar interessados no
formulário de pré-cadastro. Site estático (HTML/CSS/JS), sem build, sem
dependências, mais uma função de servidor da Vercel para o formulário.

## Rodar localmente

Precisa só do Node 18+. A gravação é **simulada** (nada vai para o Supabase):

```bash
node scripts/servidor-local.js --simular
# http://localhost:5173
```

## Deploy na Vercel

Framework Preset: **Other** · Build Command: *(vazio)* · Output Directory: *(raiz)*.
A pasta `api/` vira função de servidor automaticamente.

Variáveis de ambiente (Settings → Environment Variables), nunca no repositório:

| Nome | O que é |
|---|---|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | chave **pública** (anon). Só executa `inserir_lead_lp`; não lê nem escreve a tabela |
| `IP_HASH_SALT` | texto aleatório longo, usado para gerar o `ip_hash` (o IP puro não é guardado) |

Antes do primeiro deploy, rode `supabase/leads_lp.sql` no SQL Editor do Supabase.

`.vercelignore` impede que `docs/`, `supabase/`, `scripts/` e este README sejam publicados.

## Estrutura

```
index.html                 A landing (hero → problema → o que faz → como funciona →
                           para quem → onde estamos → perguntas → formulário → rodapé)
api/pre-cadastro.js        POST do formulário: honeypot, validação, ip_hash, rpc no Supabase
api/_lead.js               Regras de validação do lead (não vira rota: começa com "_")
supabase/leads_lp.sql      Tabela leads_lp + função inserir_lead_lp + permissões
scripts/servidor-local.js  Servidor de teste local (imita a Vercel)
assets/lp.css, lp.js       Estilos e scripts da landing (cronômetro + formulário)
assets/marca/              Logo (PROVISÓRIA, redesenhada em SVG), símbolo e blocos pixelados
assets/og-v2g.png          Imagem de compartilhamento 1200x630
assets/fontes/             Plus Jakarta Sans (landing) e Archivo (páginas legais), hospedadas aqui

privacidade.html, termos.html, exclusao-de-dados.html
                           Páginas legais. Ainda usam v2g.css, v2g-landing.css, v2g-legal.css,
                           v2g.js e xlink.js. Não mexer sem revisão: as URLs podem estar
                           cadastradas no app da Meta.
```
