# V2G — Landing Page (vendas)

Página de vendas pública da V2G: leva o visitante frio até o cadastro.
Site estático (HTML/CSS/JS), sem build, sem dependências.

## Rodar localmente

Abra `index.html` no navegador, ou sirva a pasta:

```bash
python -m http.server 5173
# http://localhost:5173
```

## Deploy na Vercel (estático, zero-config)

1. Suba este repositório no GitHub.
2. Na Vercel: **Add New → Project** → importe o repositório.
3. **Framework Preset: Other** · Build Command: *(vazio)* · Output Directory: *(vazio / raiz)*.
4. Deploy.

## Links para fora deste site

Só duas chaves existem em `window.V2G_URLS` hoje (o repo *Guia* foi
descontinuado — não existe mais uma terceira chave `guia`/`lp`):

- `conteudo` — URL do app (repo *v2gapp* na Vercel). É pra onde levam os
  botões de auto-cadastro ("comece agora por conta própria", "Entrar").
- `lead` — link de WhatsApp (ou agendamento) do CTA principal "Análise
  gratuita". **Hoje ainda é um número placeholder** (`5500000000000`) —
  precisa ser trocado pelo WhatsApp real antes de qualquer divulgação.

Edite **`assets/xlink.js`**:

```js
window.V2G_URLS = {
  conteudo: "https://SEU-conteudo.vercel.app",
  lead:     "https://wa.me/55DDNNNNNNNNN?text=..."
};
```

Nada mais precisa ser tocado — o resto é reescrito automaticamente em
todo `<a data-x="conteudo">` e `<a data-lead>` do site (inclusive nas
páginas legais, que também usam `data-lead` para o WhatsApp de contato).

## Estrutura

```
index.html                A landing (hero → dor → como funciona → preço → garantia → CTA)
privacidade.html           Política de Privacidade (LGPD + acesso à API do Meta)
termos.html                 Termos de Uso
exclusao-de-dados.html      Instruções de exclusão de dados (URL exigida pelo App Review do Meta)
assets/
  v2g.css                  Design system (tokens, componentes) — fonte: Archivo via Google Fonts
  v2g-landing.css          Estilos da landing
  v2g-legal.css            Estilos das 3 páginas de texto longo acima
  v2g.js                   Logomark pixelado
  xlink.js                 << as URLs (app + WhatsApp) moram aqui
```

## Aviso sobre as páginas legais

`privacidade.html`, `termos.html` e `exclusao-de-dados.html` foram
geradas como **rascunho** para viabilizar a submissão ao App Review do
Meta. Têm trechos marcados visualmente (fundo amarelo, classe
`.legal-placeholder`) com suposições que precisam de confirmação —
domínio de e-mail, prazos de resposta, foro e política de reembolso.
**Precisam de revisão jurídica antes de ir ao ar em definitivo,
especialmente as cláusulas de LGPD e a limitação de responsabilidade.**
