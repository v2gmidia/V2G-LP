# Handoff — Estado Atual: LP (v2gmidia/V2G-LP)

> Relatório gerado por auditoria read-only. Nenhum arquivo de código foi alterado, criado ou apagado durante esta auditoria.

---

## 0. RESUMO EXECUTIVO

- A LP é um **site estático puro** (1 arquivo HTML + 3 CSS + 2 JS), sem framework, sem build, sem package.json.
- **Não existe backend nenhum** neste repositório: nenhum `fetch`, `XMLHttpRequest`, `<form>`, ou chamada de API em todo o código.
- O CTA principal ("Fazer análise gratuita do meu negócio") é um link `wa.me` (WhatsApp) com **número de telefone placeholder** (`5500000000000`) — precisa ser trocado antes de qualquer uso real.
- O CTA secundário ("comece agora por conta própria") já aponta para a URL de produção do App (`https://v2gapp.vercel.app/tela-01-login-cadastro-desktop.html`) — este link **está IMPLEMENTADO e funcionando**.
- Toda a prova social (números e depoimentos) está marcada explicitamente no HTML como `[PLACEHOLDER]` — não há dado real nenhum aí.
- Tipografia depende da fonte "Bahnschrift", que é **exclusiva do Windows** e **não está embutida** no CSS deste repo (só referenciada por nome) — em qualquer outro SO ela cai para fontes de fallback.
- Deploy: Vercel, estático, zero-config, confirmado no ar em `https://v2-g-lp.vercel.app/` (branch `main`, sem CI/CD customizado, sem variável de ambiente nenhuma).
- Não existe autenticação, sessão, banco de dados, ou qualquer estado persistido entre visitas — é uma página de marketing, ponto final.
- README do próprio repo (`README.md`) está **desatualizado**: ainda descreve uma estrutura de 3 deploys (LP/Conteúdo/Guia) que não reflete o estado atual de 2 deploys.
- Maior bloqueio técnico: o número de WhatsApp do CTA principal é fake — hoje, clicar nele abre uma conversa com um número que não existe.

---

## 1. IDENTIFICAÇÃO

- **Nome do repo:** `v2gmidia/V2G-LP`
- **Produto:** Landing Page (site de vendas/marketing)
- **Branch atual:** `main`
- **Últimos commits:**
  - `619dde1` | 2026-07-26 00:16:30 -03:00 | "Conectar auto-cadastro ao app em producao; remover Guia (descontinuado)"
  - `fc0eb61` | 2026-07-25 22:34:01 -03:00 | "LP: seguir a copy comercial ao pe da letra (titulos verbatim, sem eyebrows inventados)"
  - `eacea6a` | 2026-07-25 22:20:08 -03:00 | "LP: copy comercial (analise gratuita como CTA principal + comparacao de preco)"
  - `9079432` | 2026-07-19 20:46:58 -03:00 | "V2G lp: initial static site (Vercel-ready)"
- **Linguagens e frameworks:** HTML5, CSS3, JavaScript (ES5/ES6 vanilla, sem transpilação). NÃO ENCONTRADO nenhum framework (React, Vue, etc.).
- **Versões:** NÃO ENCONTRADO — não há `package.json`, `requirements.txt` nem `pyproject.toml` no repositório. Não há gerenciador de pacotes.
- **Runtime:** nenhum runtime de servidor — arquivos estáticos servidos diretamente.
- **Target de deploy:** Vercel (confirmado por `README.md` e pela URL ao vivo `https://v2-g-lp.vercel.app/`, HTTP 200 checado durante esta auditoria).

---

## 2. ESTRUTURA DE ARQUIVOS

```
V2G-LP/
├── .gitignore              # node_modules/, .DS_Store, Thumbs.db, .vercel, *.log
├── README.md                # instruções de rodar local + deploy + (desatualizado, ver seção 11)
├── index.html                # a LP inteira num único arquivo (405 linhas)
└── assets/
    ├── v2g.css                # design system compartilhado (tokens, componentes base) — 793 linhas
    ├── v2g-landing.css        # estilos específicos da landing (hero, tabela de preço, FAQ, etc.) — 673 linhas
    ├── v2g.js                 # helpers de UI (logomark animado, máscara de telefone, confete) — 100 linhas
    └── xlink.js               # config de links entre deploys + link de lead (WhatsApp) — 35 linhas
```

Não há subpastas de rotas, componentes, testes ou build. É literalmente 6 arquivos de texto.

---

## 3. INVENTÁRIO DE TELAS / ROTAS

| Rota/Tela | Arquivo | Propósito | Dados que consome | Ação principal do usuário | Estado |
|---|---|---|---|---|---|
| `/` (única rota) | `index.html` | Página de vendas de ponta a ponta (hero → dor → virada → 3 passos → comparação de preço → diferenciação → isca de análise → prova social → preço → FAQ → CTA final) | Hardcoded no próprio HTML (nenhuma tabela, nenhuma API) | Clicar em "Fazer análise gratuita" (abre WhatsApp) ou "Comece agora por conta própria" (abre o App) | PARCIAL — página renderiza 100%, mas o CTA principal usa número de WhatsApp fake e a prova social é só placeholder |

Não há roteamento client-side (sem `history.pushState`, sem hash router). Âncoras internas (`#como-funciona`, `#preco`, `#duvidas`) são apenas scroll-to-section na mesma página.

---

## 4. DESIGN SYSTEM ATUAL

- **Biblioteca de UI/CSS:** nenhuma (sem Tailwind, sem shadcn, sem styled-components). CSS puro, escrito à mão, com variáveis CSS nativas (`:root { --var: ... }`).
- **Onde vivem os tokens:** bloco `:root` no topo de `assets/v2g.css` (linhas 1-23).
- **Paleta de cores em uso** (nomes exatamente como aparecem no código):

  | Nome no código | Hex | Uso |
  |---|---|---|
  | `--offwhite` | `#F0F2EF` | fundo claro padrão |
  | `--navy` | `#0B1B2B` | texto principal / superfícies escuras (hero, footer) |
  | `--cobalt` | `#2B4CCE` | cor de ação (botões primários, links) |
  | `--cobalt-dark` | `#2340B0` | hover de botão primário |
  | `--lime` | `#E3FC66` | destaque/acento (usado como `<mark>` no texto de economia) |
  | `--ice` | `#ABEAFD` | acento secundário claro |
  | `--ice-soft` | `#DDF4FC` | fundo de seções alternadas (`.section.ice`) |
  | `--ink` | `#0B1B2B` | (idêntico a `--navy`) |
  | `--ink-soft` | `#4A5C6E` | texto secundário |
  | `--ink-mute` | `#7A8B9B` | texto terciário/legendas |
  | `--line` | `#D7DDD9` | bordas |
  | `--white` | `#FFFFFF` | branco puro |
  | `--good` / `--good-soft` | `#2E9E5B` / `#E2F3E8` | estado de sucesso (não usado nesta LP especificamente) |
  | `--warn` / `--warn-soft` | `#B97F1D` / `#FAEFD8` | estado de atenção (idem) |
  | `--crit` / `--crit-soft` | `#C24A44` / `#F9E4E2` | estado crítico (idem) |

- **Fontes:**
  - Display: `'Bahnschrift', 'Segoe UI Semibold', 'Segoe UI', system-ui, sans-serif` (variável `--display`).
  - Corpo: `'Segoe UI', system-ui, -apple-system, Roboto, sans-serif` (variável `--body`).
  - **Bahnschrift NÃO está embutida via `@font-face`** neste repositório (`grep -rn "@font-face"` não encontrou nenhuma ocorrência em `assets/*.css` nem `index.html`). Bahnschrift é fonte nativa apenas do Windows 10+. Em macOS, Linux, iOS e Android o navegador cai para o próximo da lista (`Segoe UI Semibold`, que também só existe no Windows) até chegar em `system-ui`/`sans-serif`.
- **Escala tipográfica:** não há uma escala nomeada (tipo `text-sm`/`text-lg`); os tamanhos são declarados em `px` diretamente em cada seletor (ex.: `font-size: 62px` no preço, `font-size: 14.5px` no corpo).
- **Escala de espaçamento:** idem — valores em `px` soltos por regra, sem variáveis de espaçamento centralizadas.
- **Radius:** valores diretos em cada componente, sem token central; entre os observados: `4px`, `6px`, `8px`, `999px` (pills/badges).
- **Componentes reutilizáveis existentes** (definidos em `assets/v2g.css`, compartilhados com o App):

  | Componente | Seletor CSS | Descrição |
  |---|---|---|
  | Botão | `.cta`, `.btn` (este último só em `v2g-landing.css`) | botão de ação, variantes primária/secundária |
  | Badge/pill | `.pill`, `.badge` | rótulos de status |
  | Card de telefone | `.phone`, `.screen` | moldura de mockup (não usada na LP, usada no App) |
  | Chip de tabela comparativa | `.cmp-*` (definido em `v2g-landing.css`) | linhas da tabela de preço, com variante mobile em card |
  | FAQ accordion | `<details>/<summary>` nativo, estilizado via `.faq` | perguntas frequentes |
  | Logomark pixelado | `.mark` + `V2G.buildMark()` (JS) | animação do símbolo da marca |

- **Dark mode:** NÃO ENCONTRADO. `grep -rn "prefers-color-scheme"` não retornou nenhuma ocorrência em nenhum CSS do repositório.
- **Responsividade mobile-first:** existe, mas implementada como **desktop-first com breakpoints `max-width`** (não `min-width`), o que tecnicamente é "responsivo" mas não "mobile-first" no sentido estrito. Breakpoints encontrados em `assets/v2g-landing.css`: `720px` (linha 76), `900px` (linha 526), `620px` (linha 532), `720px` novamente (linha 661), mais `prefers-reduced-motion: reduce` (linha 540).
- **Consistência:** o design system É consistente entre LP e App (ambos importam o mesmo `v2g.css` base), mas cada repo mantém sua **cópia própria** do arquivo — não há symlink nem pacote compartilhado (ver seção 9).

---

## 5. BANCO DE DADOS

**INEXISTENTE.** Não há nenhuma referência a Supabase, Postgres, MySQL, MongoDB, Prisma, ou qualquer ORM/cliente de banco em todo o repositório (`grep -rniE "supabase|createClient|database"` não retornou nenhuma ocorrência de infraestrutura real — apenas a palavra "banco" usada em copy de marketing, ex. "não é preço de empresa grande"). Não há migrations, não há schema, não há storage bucket.

---

## 6. AUTENTICAÇÃO E SESSÃO

**INEXISTENTE** neste repositório. A LP não tem login, não tem formulário de captura de lead com backend, e não usa `localStorage`/`sessionStorage`/cookies (`grep -rniE "localStorage|sessionStorage|document\.cookie"` não retornou nenhuma ocorrência). O "cadastro" de fato acontece no outro repositório (o App) — ver seção 9.

---

## 7. INTEGRAÇÕES EXTERNAS

| Integração | Onde está | O que é chamado | Estado | Retry/erro |
|---|---|---|---|---|
| WhatsApp (lead) | `assets/xlink.js`, linha 12 (`window.V2G_URLS.lead`) | Link estático `https://wa.me/<numero>?text=<mensagem>` | **PARCIAL** — mecanismo funciona, mas o número `5500000000000` é claramente um placeholder, não um número real | N/A (é um link `<a>`, não uma chamada de API) |
| App (V2G) | `assets/xlink.js`, linha 11 (`window.V2G_URLS.conteudo`) | Link estático para `https://v2gapp.vercel.app` | **IMPLEMENTADO** — testado nesta sessão anterior, retorna HTTP 200 e leva à tela de cadastro real | N/A |

Nenhuma outra integração (Meta Ads, LLM, e-mail, pagamento, GCP) existe neste repositório.

---

## 8. FLUXOS DE PONTA A PONTA

### a) Visitante entra na LP → se cadastra → vira usuário logado
**PARCIAL, e a maior parte do fluxo não vive neste repositório.** A LP (`index.html`) tem 4 links com `data-x="conteudo"` (linhas com `href="tela-01-login-cadastro-desktop.html"`) que, via `assets/xlink.js`, são reescritos em tempo de carregamento para `https://v2gapp.vercel.app/tela-01-login-cadastro-desktop.html`. Esse redirecionamento **funciona e foi verificado ao vivo**. O que acontece depois de chegar lá (o cadastro em si) está fora deste repositório — ver o relatório do App, onde o fluxo **para** porque não há submissão real de formulário.

### b) Onboarding: coleta de informações do negócio
**INEXISTENTE neste repositório.** Não há onboarding na LP.

### c) Geração de oferta/copy
**INEXISTENTE neste repositório.**

### d) Geração de criativo estático
**INEXISTENTE neste repositório.**

### e) Publicação de campanha no Meta Ads
**INEXISTENTE neste repositório.**

### f) Coleta de métricas e exibição no dashboard
**INEXISTENTE neste repositório.**

---

## 9. FRONTEIRA LP <-> APP

- **Mesmo deploy ou separados?** Separados: dois repositórios GitHub distintos (`v2gmidia/V2G-LP` e `v2gmidia/v2gapp`), dois projetos Vercel distintos, dois domínios `.vercel.app` diferentes (`v2-g-lp.vercel.app` e `v2gapp.vercel.app`). Não é monorepo.
- **Como a LP manda o usuário pro App hoje?** Via link `<a href>` comum, cuja URL final é montada em tempo de execução por `assets/xlink.js`: o script lê `window.V2G_URLS.conteudo` (hoje `"https://v2gapp.vercel.app"`) e concatena com o `href` relativo original (ex. `tela-01-login-cadastro-desktop.html"`) que está hardcoded no HTML. Não é um redirect HTTP, é reescrita de atributo `href` no DOM via JavaScript, disparada no carregamento da página (IIFE em `xlink.js`, sem esperar evento algum).
- **O signup acontece na LP ou no App?** No App (fora deste repositório). A LP apenas linka.
- **Existe algo compartilhado entre os dois (tokens, componentes, tipos, monorepo)?** Não há monorepo, não há pacote compartilhado, não há tipos compartilhados (não há TypeScript em lugar nenhum). O que existe é **duplicação manual**: os arquivos `assets/v2g.css` e `assets/v2g.js` deste repositório e do repositório App são cópias — idênticos byte a byte no momento desta auditoria (não há symlink, `git submodule`, nem workspace de monorepo que garanta que continuem sincronizados). Qualquer mudança de design precisa ser replicada manualmente nos dois repositórios.

---

## 10. DEPLOY E INFRA

- **Como sobe hoje:** Vercel, projeto estático. Não há `vercel.json` no repositório (`find ... -iname "vercel.json"` não encontrou nada) — o deploy usa a configuração padrão da Vercel para sites estáticos (framework preset "Other", sem build command), conforme documentado no próprio `README.md`.
- **Dockerfiles:** NÃO ENCONTRADO.
- **CI/CD:** NÃO ENCONTRADO — nenhuma pasta `.github/workflows`. O deploy contínuo, se existir, é o auto-deploy nativo da Vercel em cada push para `main` (não configurado por arquivo neste repo, é comportamento padrão da integração GitHub↔Vercel).
- **Ambientes (dev/staging/prod):** NÃO ENCONTRADO nenhuma distinção de ambiente no código. Aparentemente um único ambiente (produção), com "dev local" sendo apenas abrir o `index.html` direto no navegador ou servir com `python -m http.server` (conforme `README.md`).
- **Variáveis de ambiente esperadas:** **nenhuma.** Não há leitura de `process.env` nem de `import.meta.env` em lugar nenhum do código (busca exaustiva não encontrou ocorrências). Toda configuração (URLs de outros deploys, número de WhatsApp) fica hardcoded em `assets/xlink.js`, versionado em texto puro no git — não são segredos, mas também não são configuráveis por ambiente.

---

## 11. DÍVIDA E BLOQUEIOS

**TODO/FIXME/HACK/XXX:** NÃO ENCONTRADO nenhum marcador real destes no código (a busca por "TODO" só encontrou falsos positivos: a palavra "todo/toda/todos" em português, dentro de texto de copy, ex. `index.html:72` "Todo mês chega um relatório...").

**Dados hardcoded que precisam virar dinâmicos:**
- `assets/xlink.js:12` — número de WhatsApp `5500000000000` é placeholder, precisa virar o número real do time comercial.
- Bloco inteiro de prova social em `index.html` (seção 8 da copy) — `[X] empresas`, `R$ [X] em vendas`, `[X]% dos clientes`, e os 3 depoimentos `[DEPOIMENTO CLIENTE N...]` — tudo marcado com colchetes no próprio texto, aguardando dados reais.
- `index.html:355` — CNPJ `00.000.000/0001-00` é fictício (o próprio texto ao lado diz "Este é um material de demonstração").

**Arquivos claramente abandonados ou duplicados:**
- `README.md` está **desatualizado em relação ao código**: ele descreve `window.V2G_URLS` com as chaves `conteudo`, `guia` e `lp` (três deploys), mas o `assets/xlink.js` real hoje só tem `conteudo` e `lead` — o Guia foi removido do código em `619dde1` mas o README não foi atualizado junto. Isso vai confundir o próximo dev que ler só o README.
- `assets/v2g.css` e `assets/v2g.js` são duplicatas do mesmo arquivo no repositório App — risco de divergência silenciosa (ver seção 9).

**Os 5 maiores riscos técnicos, em ordem de gravidade:**
1. **CTA principal da página inteira aponta pra um WhatsApp que não existe.** Isso não é um bug cosmético — é o objetivo primário de conversão da página quebrado. Qualquer visitante que clicar em "Fazer análise gratuita" (7 ocorrências na página) hoje abre uma conversa fantasma.
2. **Zero captura de lead com fallback.** Se o WhatsApp falhar (app não instalado, `wa.me` bloqueado), não há formulário alternativo nem qualquer outro mecanismo de captura — o visitante simplesmente não converte.
3. **Fonte "Bahnschrift" não embutida** — em qualquer visitante fora do Windows, a tipografia de destaque (headlines, preço) renderiza com uma fonte de fallback genérica, alterando a identidade visual pretendida sem que ninguém perceba sem testar fora do Windows.
4. **Duplicação de design system sem mecanismo de sincronização** entre LP e App — qualquer ajuste de cor/tipografia feito num repo não propaga pro outro automaticamente.
5. **README desatualizado** é um risco de processo: um novo colaborador seguindo o README vai editar `xlink.js` esperando 3 chaves e vai ficar confuso ao achar só 2.

---

## 12. PERGUNTAS ABERTAS

1. Qual é o número de WhatsApp real (com DDI/DDD) que deve substituir o placeholder `5500000000000` em `assets/xlink.js`? Deve ser um número de WhatsApp Business, pessoal, ou uma ferramenta de agendamento (Calendly etc.) no lugar do `wa.me`?
2. Existe algum plano de capturar o lead também via formulário (nome/telefone/e-mail) antes de abrir o WhatsApp, para não depender 100% do app estar instalado no dispositivo do visitante?
3. Os números de prova social (`[X] empresas`, `R$ [X] em vendas`, `[X]%`) — já existem dados reais para substituir, ou a seção deve ficar oculta até haver clientes suficientes?
4. Há depoimentos reais de clientes disponíveis (nome, tipo de negócio, cidade, autorização de uso), ou devo manter o fallback de autoridade ("construído por quem já gerenciou milhões...")?
5. Confirma que o CNPJ no rodapé é só placeholder de demonstração e não deve ir para produção sem o CNPJ real da empresa?
6. Existe orçamento/decisão de licenciar a fonte Bahnschrift para web (ou trocar por uma fonte web-safe/licenciada) antes do lançamento público, já que hoje ela só renderiza corretamente no Windows?
7. O plano de manter LP e App como repositórios totalmente separados (sem monorepo) é definitivo, ou faz sentido migrar para um monorepo com pacote de design system compartilhado para evitar a duplicação relatada na seção 9/11?
8. Existe alguma expectativa de analytics/tracking (Google Analytics, Meta Pixel, etc.) nesta LP? Não encontrei nenhum script de analytics no código — é intencional?
