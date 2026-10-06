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
                           para quem → onde estamos → formulário → perguntas → rodapé)
api/pre-cadastro.js        POST do formulário: honeypot, validação, ip_hash, rpc no Supabase
api/_lead.js               Regras de validação do lead (não vira rota: começa com "_")
supabase/leads_lp.sql      Tabela leads_lp + função inserir_lead_lp + permissões
scripts/servidor-local.js  Servidor de teste local (imita a Vercel)
assets/lp.v4.css           Estilos da landing (identidade v2: cobalto, marinho, lima, Archivo)
assets/legal.v4.css        Estilos das páginas legais (carrega depois de lp.v4.css)
assets/lp.v4.js            Cronômetro, formulário e interações que não são movimento
assets/lp-movimento.v4.js  Animações (só sem "reduzir movimento")
assets/marca/simbolo.svg   Arquivo-mestre do símbolo (currentColor). Use <use href="...#v2g">
assets/marca/textura.svg   Grade de pontos que some em degradê
assets/marca/icone-1080.png Ícone para Instagram e WhatsApp (marinho + lima)
assets/og-v2g.png          Imagem de compartilhamento 1200x630
assets/fontes/             Archivo variável (pesos 100–900, larguras 62–125) + licença OFL
404.html                   Página de erro (a Vercel serve sozinha)
robots.txt, sitemap.xml    Para buscadores
vercel.json                cleanUrls, cabeçalhos de segurança e cache

privacidade.html, termos.html, exclusao-de-dados.html
                           Páginas legais. Não mexer no texto sem revisão: as URLs podem
                           estar cadastradas no app da Meta.
```

**Cache:** CSS e JS levam a versão no nome (`lp.v4.css`). Ao mudar um deles, suba o número
(`lp.v5.css`) e troque a referência no HTML: esses arquivos ficam em cache por um ano.
O HTML nunca fica em cache.
